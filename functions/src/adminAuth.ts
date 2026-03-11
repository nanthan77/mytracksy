/**
 * adminAuth.ts — Admin Authentication & Role Management
 *
 * Cloud Functions to set/verify admin custom claims.
 * Only the founder UID or existing admins can grant admin access.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

const db = admin.firestore();

// Hardcoded founder email — the only person who can bootstrap admin access
const FOUNDER_EMAIL = "ceo@mytracksy.lk";

// ─── Helper: verify caller is admin ─────────────────────────────

async function verifyAdminCaller(callerUid: string): Promise<boolean> {
    const user = await admin.auth().getUser(callerUid);

    // Check custom claim
    if (user.customClaims?.admin === true) return true;

    // Check founder email
    if (user.email === FOUNDER_EMAIL) return true;

    // Check admin list in Firestore
    const adminDoc = await db.doc("system_settings/admin_users").get();
    if (adminDoc.exists) {
        const adminUids: string[] = adminDoc.data()?.uids || [];
        if (adminUids.includes(callerUid)) return true;
    }

    return false;
}

// ─── Set Admin Claim ────────────────────────────────────────────

export const setAdminClaim = onCall(
    { region: "asia-south1", memory: "256MiB" },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be logged in");
        }

        const callerUid = request.auth.uid;
        const targetUid = request.data?.targetUid as string;

        if (!targetUid) {
            throw new HttpsError("invalid-argument", "targetUid is required");
        }

        // Verify caller is admin
        const isAdmin = await verifyAdminCaller(callerUid);
        if (!isAdmin) {
            logger.warn(`🚫 Non-admin ${callerUid} tried to set admin claim`);
            throw new HttpsError("permission-denied", "Only admins can grant admin access");
        }

        // Set custom claim
        await admin.auth().setCustomUserClaims(targetUid, { admin: true });

        // Also add to Firestore admin list
        await db.doc("system_settings/admin_users").set({
            uids: admin.firestore.FieldValue.arrayUnion(targetUid),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        logger.info(`✅ Admin claim set for ${targetUid} by ${callerUid}`);

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

        const isAdmin = await verifyAdminCaller(request.auth.uid);

        return { isAdmin, uid: request.auth.uid };
    }
);
