/**
 * adminAuth.ts — Admin Authentication & Role Management
 *
 * Cloud Functions to set/verify admin custom claims.
 * Only the founder UID or existing admins can grant admin access.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { requireAdminAccessV2, resolveAdminIdentity } from "./adminPermissions";

const db = admin.firestore();

// ─── Set Admin Claim ────────────────────────────────────────────

export const setAdminClaim = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        const caller = await requireAdminAccessV2(request, ["super_admin"], "manage_roles");
        const targetUid = request.data?.targetUid as string;

        if (!targetUid) {
            throw new HttpsError("invalid-argument", "targetUid is required");
        }

        // Legacy helper now grants a real super_admin role for compatibility.
        await admin.auth().setCustomUserClaims(targetUid, {
            admin: true,
            admin_role: "super_admin",
            admin_professions: ["all"],
        });

        // Also add to Firestore admin list
        await db.doc("system_settings/admin_users").set({
            uids: admin.firestore.FieldValue.arrayUnion(targetUid),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`✅ Admin claim set for ${targetUid} by ${caller.uid}`);

        return { success: true, message: `Admin access granted to ${targetUid}` };
    }
);

// ─── Check Admin Status ─────────────────────────────────────────

export const checkAdminStatus = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be logged in");
        }

        const identity = await resolveAdminIdentity({ uid: request.auth.uid, token: request.auth.token });

        return {
            isAdmin: Boolean(identity),
            uid: request.auth.uid,
            role: identity?.role || null,
            professions: identity?.professions || [],
        };
    }
);
