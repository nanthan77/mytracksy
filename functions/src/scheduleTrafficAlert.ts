/**
 * scheduleTrafficAlert — Firestore Trigger (Gen 2)
 *
 * When a schedule event is created/updated with requires_traffic_alert=true,
 * enqueues a Google Cloud Task to fire 75 minutes before the event.
 *
 * The task calls the trafficAlertWorker HTTP function at the scheduled time.
 *
 * On event delete or update with alert disabled, cancels the existing task.
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { CloudTasksClient, protos } from "@google-cloud/tasks";

const tasksClient = new CloudTasksClient();
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
const LOCATION = "asia-south1";
const QUEUE_NAME = "traffic-alerts";

// Minutes before the event to trigger the alert check
const ALERT_LEAD_TIME_MINS = 75;

// ─── Helper: Build the Cloud Task ────────────────────────────────

async function enqueueTrafficTask(
    userId: string,
    eventId: string,
    eventData: any,
    workerUrl: string,
): Promise<string | null> {
    const startTime = eventData.start_time?.toDate?.() || new Date(eventData.start_time);
    const now = new Date();

    // Calculate when the task should fire (75 min before event)
    const taskFireTime = new Date(startTime.getTime() - ALERT_LEAD_TIME_MINS * 60 * 1000);

    // Don't schedule tasks in the past
    if (taskFireTime <= now) {
        functions.logger.info(`⏭️ Event ${eventId} starts too soon for traffic alert, skipping.`);
        return null;
    }

    const parent = tasksClient.queuePath(PROJECT_ID, LOCATION, QUEUE_NAME);

    const task: protos.google.cloud.tasks.v2.ITask = {
        name: `${parent}/tasks/traffic-${userId}-${eventId}`,
        httpRequest: {
            httpMethod: "POST",
            url: workerUrl,
            headers: { "Content-Type": "application/json" },
            body: Buffer.from(JSON.stringify({
                userId,
                eventId,
                title: eventData.title || "Appointment",
                origin_lat_lng: eventData.origin_lat_lng || "",
                destination_lat_lng: eventData.destination_lat_lng || "",
                start_time: startTime.toISOString(),
            })).toString("base64"),
            oidcToken: {
                serviceAccountEmail: `${PROJECT_ID}@appspot.gserviceaccount.com`,
            },
        },
        scheduleTime: {
            seconds: Math.floor(taskFireTime.getTime() / 1000),
        },
    };

    try {
        const [response] = await tasksClient.createTask({ parent, task });
        const taskName = response.name || "";
        functions.logger.info(`📋 Enqueued task: ${taskName} (fires at ${taskFireTime.toISOString()})`);
        return taskName;
    } catch (err: any) {
        // Task might already exist (duplicate protection)
        if (err.code === 6) { // ALREADY_EXISTS
            functions.logger.info(`Task already exists for ${eventId}, skipping.`);
            return `${parent}/tasks/traffic-${userId}-${eventId}`;
        }
        throw err;
    }
}

// ─── Helper: Cancel an existing Cloud Task ───────────────────────

async function cancelTrafficTask(taskId: string): Promise<void> {
    if (!taskId) return;
    try {
        await tasksClient.deleteTask({ name: taskId });
        functions.logger.info(`🗑️ Cancelled task: ${taskId}`);
    } catch (err: any) {
        if (err.code === 5) {  // NOT_FOUND — task already executed or gone
            functions.logger.info(`Task ${taskId} already gone, ignoring.`);
        } else {
            functions.logger.error(`Failed to cancel task ${taskId}:`, err);
        }
    }
}

// ─── Build worker URL ────────────────────────────────────────────

function getWorkerUrl(): string {
    return `https://${LOCATION}-${PROJECT_ID}.cloudfunctions.net/trafficAlertWorker`;
}

// ═══════════════════════════════════════════════════════════════
//  ON CREATE — New schedule event
// ═══════════════════════════════════════════════════════════════

export const onScheduleEventCreated = functions
    .region("asia-south1")
    .firestore.document("users/{userId}/schedule/{eventId}")
    .onCreate(async (snap, context) => {
        if (!snap.exists) return;

        const data = snap.data();
        const userId = context.params.userId;
        const eventId = context.params.eventId;

        if (!data.requires_traffic_alert) {
            functions.logger.info(`No traffic alert needed for ${eventId}`);
            return;
        }

        if (!data.origin_lat_lng || !data.destination_lat_lng) {
            functions.logger.warn(`Missing coordinates for ${eventId}, skipping traffic alert`);
            return;
        }

        const taskName = await enqueueTrafficTask(userId, eventId, data, getWorkerUrl());

        if (taskName) {
            // Save task ID so we can cancel it if the event changes
            await snap.ref.update({ cloud_task_id: taskName });
        }
    });

// ═══════════════════════════════════════════════════════════════
//  ON UPDATE — Schedule event modified
// ═══════════════════════════════════════════════════════════════

export const onScheduleEventUpdated = functions
    .region("asia-south1")
    .firestore.document("users/{userId}/schedule/{eventId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();
        if (!before || !after) return;

        const userId = context.params.userId;
        const eventId = context.params.eventId;

        // Cancel the old task first
        if (before.cloud_task_id) {
            await cancelTrafficTask(before.cloud_task_id);
        }

        // Re-enqueue if alert is still needed
        if (after.requires_traffic_alert && after.origin_lat_lng && after.destination_lat_lng) {
            const taskName = await enqueueTrafficTask(userId, eventId, after, getWorkerUrl());
            if (taskName) {
                await change.after.ref.update({ cloud_task_id: taskName });
            }
        } else {
            await change.after.ref.update({ cloud_task_id: admin.firestore.FieldValue.delete() });
        }
    });

// ═══════════════════════════════════════════════════════════════
//  ON DELETE — Schedule event removed
// ═══════════════════════════════════════════════════════════════

export const onScheduleEventDeleted = functions
    .region("asia-south1")
    .firestore.document("users/{userId}/schedule/{eventId}")
    .onDelete(async (snap, context) => {
        const data = snap.data();
        if (!data) return;

        if (data.cloud_task_id) {
            await cancelTrafficTask(data.cloud_task_id);
        }

        functions.logger.info(`🗑️ Cleaned up schedule event ${context.params.eventId}`);
    });
