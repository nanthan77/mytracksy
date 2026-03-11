/**
 * checkScheduleConflict — Callable Cloud Function (Gen 2)
 *
 * Called by the client when a doctor adds a new event.
 * Checks for roster clashes between government shifts and private channeling.
 *
 * Input:  { start_time: ISO string, end_time: ISO string }
 * Output: { hasConflict: boolean, conflictingEvent?: { title, type, start, end } }
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";

export const checkScheduleConflict = onCall(
    {
        region: "asia-south1",
        memory: "256MiB",
    },
    async (request) => {
        // Auth check
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "Must be logged in.");
        }

        const userId = request.auth.uid;
        const { start_time, end_time } = request.data;

        if (!start_time || !end_time) {
            throw new HttpsError("invalid-argument", "start_time and end_time are required.");
        }

        const startTs = new Date(start_time);
        const endTs = new Date(end_time);

        if (isNaN(startTs.getTime()) || isNaN(endTs.getTime())) {
            throw new HttpsError("invalid-argument", "Invalid date format.");
        }

        logger.info(`🔍 Checking conflicts for user ${userId}: ${start_time} → ${end_time}`);

        const db = admin.firestore();

        try {
            // ── Query all events that could possibly overlap ──
            // An overlap exists when:
            //   existing.start < new.end  AND  existing.end > new.start
            //
            // Firestore can't do both range queries on different fields,
            // so we fetch events starting before the new event ends,
            // then filter in memory for overlap.
            const eventsSnap = await db
                .collection(`users/${userId}/schedule`)
                .where("start_time", "<", admin.firestore.Timestamp.fromDate(endTs))
                .orderBy("start_time", "desc")
                .limit(50)
                .get();

            const conflicts: Array<{
                eventId: string;
                title: string;
                type: string;
                start_time: string;
                end_time: string;
            }> = [];

            for (const doc of eventsSnap.docs) {
                const event = doc.data();
                const eventEnd = event.end_time?.toDate?.() || new Date(event.end_time);

                // Check if this event actually overlaps (end > new start)
                if (eventEnd > startTs) {
                    const eventStart = event.start_time?.toDate?.() || new Date(event.start_time);
                    conflicts.push({
                        eventId: doc.id,
                        title: event.title || "Untitled Event",
                        type: event.type || "unknown",
                        start_time: eventStart.toISOString(),
                        end_time: eventEnd.toISOString(),
                    });
                }
            }

            // Separate by type for clear messaging
            const govConflicts = conflicts.filter(c => c.type === "gov_shift");
            const privateConflicts = conflicts.filter(c => c.type === "private_channeling");

            const hasConflict = conflicts.length > 0;

            logger.info(hasConflict
                ? `⚠️ Found ${conflicts.length} conflict(s): ${govConflicts.length} gov, ${privateConflicts.length} private`
                : "✅ No conflicts found"
            );

            return {
                hasConflict,
                conflicts,
                govConflicts,
                privateConflicts,
                message: hasConflict
                    ? govConflicts.length > 0
                        ? `⚠️ Conflict: You are ${govConflicts[0].title} during this time. Are you sure?`
                        : `⚠️ Overlap with: ${conflicts[0].title}`
                    : "✅ No scheduling conflicts.",
            };
        } catch (error: any) {
            logger.error(`❌ Schedule conflict check failed for ${userId}:`, error);
            throw new HttpsError("internal", "Failed to check schedule conflicts");
        }
    }
);
