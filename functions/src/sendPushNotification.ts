/**
 * sendPushNotification.ts — Bulk FCM Push Notification Sender
 *
 * Admin-only callable function to send push notifications to user segments.
 */

import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";

const db = admin.firestore();

export const sendBulkPush = onCall(
    { region: "asia-south1", memory: "512MiB", timeoutSeconds: 120 },
    async (request) => {
        if (!request.auth) throw new HttpsError("unauthenticated", "Must be logged in");

        // Verify admin
        const user = await admin.auth().getUser(request.auth.uid);
        if (user.customClaims?.admin !== true) {
            const adminDoc = await db.doc("system_settings/admin_users").get();
            const adminUids: string[] = adminDoc.data()?.uids || [];
            if (!adminUids.includes(request.auth.uid) && user.email !== "ceo@mytracksy.lk") {
                throw new HttpsError("permission-denied", "Admin access required");
            }
        }

        const title = request.data?.title as string;
        const body = request.data?.body as string;
        const target = (request.data?.target as string) || "all"; // "all" | "free" | "pro"

        if (!title || !body) {
            throw new HttpsError("invalid-argument", "title and body are required");
        }

        logger.info(`📢 Sending push: "${title}" to ${target} users`);

        // Collect FCM tokens from users
        const usersSnap = await db.collection("users").get();
        const tokens: string[] = [];
        let targetCount = 0;

        for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();

            // Filter by target audience
            if (target !== "all") {
                const subSnap = await db.doc(`users/${userDoc.id}/subscription/current`).get();
                const tier = subSnap.exists ? subSnap.data()?.tier : "free";

                if (target === "pro" && tier !== "pro") continue;
                if (target === "free" && tier === "pro") continue;
            }

            targetCount++;

            // Collect FCM tokens
            if (userData.fcm_token) {
                tokens.push(userData.fcm_token);
            }
            if (userData.fcm_tokens && Array.isArray(userData.fcm_tokens)) {
                tokens.push(...userData.fcm_tokens);
            }
        }

        logger.info(`📱 Found ${tokens.length} tokens from ${targetCount} ${target} users`);

        let successCount = 0;
        let failureCount = 0;

        if (tokens.length > 0) {
            // Send in batches of 500 (FCM limit)
            const batchSize = 500;
            for (let i = 0; i < tokens.length; i += batchSize) {
                const batch = tokens.slice(i, i + batchSize);

                try {
                    const response = await admin.messaging().sendEachForMulticast({
                        tokens: batch,
                        notification: { title, body },
                        data: { type: "admin_push", target },
                    });

                    successCount += response.successCount;
                    failureCount += response.failureCount;
                } catch (err: any) {
                    logger.error(`❌ FCM batch error:`, err);
                    failureCount += batch.length;
                }
            }
        }

        // Log the push notification
        await db.collection("system_settings/push_log/history").add({
            title,
            body,
            target,
            target_count: targetCount,
            tokens_sent: tokens.length,
            success_count: successCount,
            failure_count: failureCount,
            sent_by: request.auth.uid,
            sent_at: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`✅ Push complete: ${successCount} success, ${failureCount} failed`);

        return {
            success: true,
            targetCount,
            tokensSent: tokens.length,
            successCount,
            failureCount,
            message: `Notification sent to ${successCount} of ${tokens.length} devices`,
        };
    }
);
