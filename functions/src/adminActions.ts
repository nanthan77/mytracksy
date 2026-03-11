/**
 * adminActions.ts — Admin CRM Actions
 *
 * Cloud Functions for doctor approval, suspension, and subscription overrides.
 * All actions require admin custom claim.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

const db = admin.firestore();

// ─── Helper: verify admin ───────────────────────────────────────

async function requireAdmin(callerUid: string): Promise<void> {
    const user = await admin.auth().getUser(callerUid);
    if (user.customClaims?.admin !== true) {
        // Also check Firestore admin list
        const adminDoc = await db.doc("system_settings/admin_users").get();
        const adminUids: string[] = adminDoc.data()?.uids || [];
        if (!adminUids.includes(callerUid) && user.email !== "ceo@mytracksy.lk") {
            throw new HttpsError("permission-denied", "Admin access required");
        }
    }
}

// ─── Approve Doctor ─────────────────────────────────────────────

export const approveDoctor = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in");
        await requireAdmin(request.auth.uid);

        const userId = request.data?.userId as string;
        if (!userId) throw new HttpsError("invalid-argument", "userId required");

        // Update user status
        await db.doc(`users/${userId}`).update({
            status: "active",
            verified_at: admin.firestore.FieldValue.serverTimestamp(),
            verified_by: request.auth.uid,
        });

        // Log the action
        await db.collection("admin_audit_log").add({
            action: "approve_doctor",
            target_user: userId,
            performed_by: request.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`✅ Doctor ${userId} approved by admin ${request.auth.uid}`);

        return { success: true, message: "Doctor approved and activated" };
    }
);

// ─── Suspend User ───────────────────────────────────────────────

export const suspendUser = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in");
        await requireAdmin(request.auth.uid);

        const userId = request.data?.userId as string;
        const reason = request.data?.reason as string || "Admin action";
        if (!userId) throw new HttpsError("invalid-argument", "userId required");

        // Update status
        await db.doc(`users/${userId}`).update({
            status: "suspended",
            suspended_at: admin.firestore.FieldValue.serverTimestamp(),
            suspended_by: request.auth.uid,
            suspension_reason: reason,
        });

        // Revoke their refresh tokens (force re-auth)
        await admin.auth().revokeRefreshTokens(userId);

        // Log
        await db.collection("admin_audit_log").add({
            action: "suspend_user",
            target_user: userId,
            reason,
            performed_by: request.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`⚠️ User ${userId} suspended by admin ${request.auth.uid}: ${reason}`);

        return { success: true, message: `User suspended: ${reason}` };
    }
);

// ─── Override Subscription ──────────────────────────────────────

export const overrideSubscription = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in");
        await requireAdmin(request.auth.uid);

        const userId = request.data?.userId as string;
        const tier = request.data?.tier as string; // "free" | "pro" | "lifetime"
        const reason = request.data?.reason as string || "Admin override";

        if (!userId || !tier) throw new HttpsError("invalid-argument", "userId and tier required");

        const validTiers = ["free", "pro", "lifetime"];
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
                tier: "pro",
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
            performed_by: request.auth.uid,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`🔄 Subscription override: ${userId} → ${tier} by admin ${request.auth.uid}`);

        return { success: true, message: `Subscription set to ${tier}` };
    }
);

// ─── Get Admin Stats ────────────────────────────────────────────

export const getAdminStats = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in");
        await requireAdmin(request.auth.uid);

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

        // Batch check subscriptions (more efficient than N+1)
        const proQuery = await db.collectionGroup("subscription")
            .where("tier", "==", "pro")
            .where("status", "==", "active")
            .select()
            .get();
        proUsers = proQuery.size;

        return {
            totalUsers,
            activeUsers,
            pendingVerification,
            suspendedUsers,
            proUsers,
            freeUsers: activeUsers - proUsers,
            mrr: proUsers * 2900, // Estimated MRR in LKR
        };
    }
);
