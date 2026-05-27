/**
 * adminActions.ts — Admin CRM Actions
 *
 * Cloud Functions for doctor approval, suspension, and subscription overrides.
 * All actions require admin custom claim.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { requireAdminAccessV2 } from "./adminPermissions";

const db = admin.firestore();

// ─── Approve Doctor ─────────────────────────────────────────────

export const approveDoctor = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        const caller = await requireAdminAccessV2(request, ["super_admin", "profession_admin", "support_agent"], "approve_users");

        const userId = (request.data?.userId || request.data?.uid) as string;
        if (!userId) throw new HttpsError("invalid-argument", "userId required");

        // Update user status
        await db.doc(`users/${userId}`).update({
            status: "active",
            verified_at: admin.firestore.FieldValue.serverTimestamp(),
            verified_by: caller.uid,
        });

        // Log the action
        await db.collection("admin_audit_log").add({
            action: "approve_user",
            target_user: userId,
            performed_by: caller.uid,
            role: caller.role,
            profession: "system",
            ip_address: request.rawRequest?.ip || "unknown",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`✅ User ${userId} approved by admin ${caller.uid}`);

        return { success: true, message: "User approved and activated" };
    }
);

// ─── Suspend User ───────────────────────────────────────────────

export const suspendUser = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        const caller = await requireAdminAccessV2(request, ["super_admin", "profession_admin", "support_agent"], "suspend_users");

        const userId = (request.data?.userId || request.data?.uid) as string;
        const reason = request.data?.reason as string || "Admin action";
        if (!userId) throw new HttpsError("invalid-argument", "userId required");

        // Update status
        await db.doc(`users/${userId}`).update({
            status: "suspended",
            suspended_at: admin.firestore.FieldValue.serverTimestamp(),
            suspended_by: caller.uid,
            suspension_reason: reason,
        });

        // Revoke their refresh tokens (force re-auth)
        await admin.auth().revokeRefreshTokens(userId);

        // Log
        await db.collection("admin_audit_log").add({
            action: "suspend_user",
            target_user: userId,
            reason,
            performed_by: caller.uid,
            role: caller.role,
            profession: "system",
            ip_address: request.rawRequest?.ip || "unknown",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`⚠️ User ${userId} suspended by admin ${caller.uid}: ${reason}`);

        return { success: true, message: `User suspended: ${reason}` };
    }
);

// ─── Override Subscription ──────────────────────────────────────

export const overrideSubscription = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        const caller = await requireAdminAccessV2(request, ["super_admin", "profession_admin"], "override_subscriptions");

        const userId = (request.data?.userId || request.data?.uid) as string;
        const tier = (request.data?.tier || request.data?.newTier) as string; // "free" | "pro" | "chambers" | "lifetime"
        const reason = request.data?.reason as string || "Admin override";

        if (!userId || !tier) throw new HttpsError("invalid-argument", "userId and tier required");

        const validTiers = ["free", "pro", "chambers", "lifetime"];
        if (!validTiers.includes(tier)) {
            throw new HttpsError("invalid-argument", `Invalid tier. Must be: ${validTiers.join(", ")}`);
        }

        const subRef = db.doc(`users/${userId}/subscription/current`);

        if (tier === "free") {
            await subRef.set({
                tier: "free",
                status: "active",
                provider: "admin_override",
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        } else {
            const periodEnd = new Date();
            if (tier === "lifetime") {
                periodEnd.setFullYear(2099); // Effectively forever
            } else {
                periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            }

            await subRef.set({
                tier: tier === "lifetime" ? "pro" : tier,
                status: "active",
                current_period_end: admin.firestore.Timestamp.fromDate(periodEnd),
                provider: "admin_override",
                provider_subscription_id: `admin_${Date.now()}`,
                plan_type: tier === "lifetime" ? "lifetime" : "annual",
                amount_cents: 0,
                override_reason: reason,
                updated_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // Log
        await db.collection("admin_audit_log").add({
            action: "override_subscription",
            target_user: userId,
            new_tier: tier,
            reason,
            performed_by: caller.uid,
            role: caller.role,
            profession: "system",
            ip_address: request.rawRequest?.ip || "unknown",
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`🔄 Subscription override: ${userId} → ${tier} by admin ${caller.uid}`);

        return { success: true, message: `Subscription set to ${tier}` };
    }
);

// ─── Get Admin Stats ────────────────────────────────────────────

export const getAdminStats = onCall(
    { region: "asia-south1", memory: "256MiB", cpu: "gcf_gen1", maxInstances: 1 },
    async (request) => {
        await requireAdminAccessV2(request, ["super_admin"], "view_dashboard");

        // Get user counts — PDPA safe: only counting, no reading sub-collections
        const usersSnap = await db.collection("users").select("status").get();
        let totalUsers = 0;
        let activeUsers = 0;
        let pendingVerification = 0;
        let suspendedUsers = 0;
        let proUsers = 0;

        for (const userDoc of usersSnap.docs) {
            totalUsers++;
            const data = userDoc.data();

            if (data.status === "active") activeUsers++;
            else if (data.status === "pending_verification") pendingVerification++;
            else if (data.status === "suspended") suspendedUsers++;
        }

        const paidSubs = await db.collectionGroup("subscription")
            .where("status", "==", "active")
            .select("tier", "amount_cents", "plan_type")
            .get();
        let mrrCents = 0;
        paidSubs.docs.forEach((doc) => {
            const data = doc.data();
            if (["pro", "chambers", "lifetime"].includes(data.tier)) {
                proUsers++;
                if (data.amount_cents && data.plan_type !== "lifetime") {
                    mrrCents += data.plan_type === "annual" ? Math.round(data.amount_cents / 12) : data.amount_cents;
                }
            }
        });

        return {
            totalUsers,
            activeUsers,
            pendingVerification,
            suspendedUsers,
            proUsers,
            freeUsers: activeUsers - proUsers,
            mrr: Math.round(mrrCents / 100),
        };
    }
);
