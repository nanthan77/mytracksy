/**
 * morningBriefing — Cloud Function (Gen 2)
 *
 * Scheduled CRON: Runs daily at 6:30 AM IST (01:00 UTC)
 * Collects all uncompleted action_items from yesterday's clinical_notes
 * and creates a "briefing" document for each user.
 *
 * The mobile client reads: users/{userId}/briefings/{date}
 * and renders the "Today's Ward Round" checklist.
 */

import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const morningBriefing = onSchedule(
    {
        schedule: "30 1 * * *",  // 6:30 AM IST = 01:00 UTC
        region: "asia-south1",
        timeZone: "Asia/Colombo",
        memory: "256MiB",
        timeoutSeconds: 60,
    },
    async () => {
        logger.info("🌅 Running Morning Briefing generation...");

        const db = admin.firestore();
        const now = new Date();
        const today = now.toISOString().split("T")[0]; // 2026-03-10

        // Get yesterday boundaries
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStart = new Date(yesterday);
        yesterdayStart.setHours(0, 0, 0, 0);
        const yesterdayEnd = new Date(yesterday);
        yesterdayEnd.setHours(23, 59, 59, 999);

        // Find all users who have clinical_notes (active users)
        const usersSnap = await db.collection("users").listDocuments();
        let totalBriefings = 0;

        for (const userDoc of usersSnap) {
            const userId = userDoc.id;

            try {
                // Get all uncompleted action items with due_date <= today
                const notesSnap = await db
                    .collection(`users/${userId}/clinical_notes`)
                    .where("status", "==", "processed")
                    .where("createdAt", ">=", admin.firestore.Timestamp.fromDate(yesterdayStart))
                    .where("createdAt", "<=", admin.firestore.Timestamp.fromDate(yesterdayEnd))
                    .get();

                if (notesSnap.empty) continue;

                const briefingItems: any[] = [];

                for (const noteDoc of notesSnap.docs) {
                    const noteData = noteDoc.data();

                    // Get action items for this note
                    const actionsSnap = await noteDoc.ref
                        .collection("action_items")
                        .where("is_completed", "==", false)
                        .get();

                    for (const actionDoc of actionsSnap.docs) {
                        const action = actionDoc.data();
                        briefingItems.push({
                            actionId: actionDoc.id,
                            noteId: noteDoc.id,
                            task: action.task,
                            urgency: action.urgency,
                            due_date: action.due_date,
                            patient: noteData.patient_identifier || "Unknown",
                            tags: noteData.tags || [],
                            is_rare_case: noteData.is_rare_case || false,
                        });
                    }
                }

                if (briefingItems.length === 0) continue;

                // Sort by urgency: today > tomorrow > this_week > routine
                const urgencyOrder: Record<string, number> = { today: 0, tomorrow: 1, this_week: 2, routine: 3 };
                briefingItems.sort((a, b) =>
                    (urgencyOrder[a.urgency] ?? 4) - (urgencyOrder[b.urgency] ?? 4)
                );

                // Save briefing document
                await db.doc(`users/${userId}/briefings/${today}`).set({
                    date: today,
                    items: briefingItems,
                    total_items: briefingItems.length,
                    urgent_count: briefingItems.filter(i => i.urgency === "today").length,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    is_read: false,
                });

                totalBriefings++;
                logger.info(`📋 Created briefing for user ${userId}: ${briefingItems.length} items`);

            } catch (err) {
                logger.error(`Failed to create briefing for user ${userId}:`, err);
            }
        }

        logger.info(`🌅 Morning Briefing complete: ${totalBriefings} users briefed.`);
    }
);
