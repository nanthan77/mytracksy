/**
 * trafficAlertWorker — HTTP Cloud Function (Gen 2)
 *
 * Target for Google Cloud Tasks. Called exactly 75 minutes before
 * a doctor's scheduled event.
 *
 * Pipeline:
 *   1. Receive payload (origin, destination, event details)
 *   2. Call Google Maps Distance Matrix API (ONE API call)
 *   3. Calculate leave time = event_start - traffic_duration - 10min buffer
 *   4. Send FCM push notification to doctor's device
 */

import { onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import {
    Client as MapsClient,
    TravelMode,
    TrafficModel,
} from "@googlemaps/google-maps-services-js";
import { getExpectedTaskAudience, verifyCloudTaskOidcToken } from "./cloudTaskAuth";

const GOOGLE_MAPS_API_KEY = defineSecret("GOOGLE_MAPS_API_KEY");
const PROJECT_ID = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT || "";
const TASK_SERVICE_ACCOUNT = PROJECT_ID ? `${PROJECT_ID}@appspot.gserviceaccount.com` : undefined;

// 10-minute parking/walking buffer for Sri Lankan hospitals
const BUFFER_MINUTES = 10;

interface TrafficPayload {
    userId: string;
    eventId: string;
    title: string;
    origin_lat_lng: string;      // "6.919, 79.868"
    destination_lat_lng: string;  // "6.927, 79.854"
    start_time: string;          // ISO string
}

export const trafficAlertWorker = onRequest(
    {
        region: "asia-south1",
        memory: "256MiB",
        timeoutSeconds: 30,
        secrets: [GOOGLE_MAPS_API_KEY],
    },
    async (req, res) => {
        // Only accept POST from Cloud Tasks
        if (req.method !== "POST") {
            res.status(405).send("Method not allowed");
            return;
        }

        if (process.env.FUNCTIONS_EMULATOR !== "true") {
            try {
                const audience = getExpectedTaskAudience(req);
                await verifyCloudTaskOidcToken(req.headers.authorization, audience, TASK_SERVICE_ACCOUNT);
            } catch (error: any) {
                logger.error("❌ Cloud Tasks token verification failed", error);
                res.status(401).send("Unauthorized");
                return;
            }
        }

        const payload: TrafficPayload = req.body;
        const { userId, eventId, title, origin_lat_lng, destination_lat_lng, start_time } = payload;

        if (!userId || !eventId || !origin_lat_lng || !destination_lat_lng || !start_time) {
            logger.error("Missing required payload fields:", payload);
            res.status(400).send("Missing required fields");
            return;
        }

        logger.info(`🚗 Traffic alert for event "${title}" (${eventId})`);

        try {
            const mapsClient = new MapsClient({});
            const eventStart = new Date(start_time);

            // ═══════════════════════════════════════════════════
            //  STEP 1: Google Maps Distance Matrix API (ONE call)
            // ═══════════════════════════════════════════════════

            const mapsResponse = await mapsClient.distancematrix({
                params: {
                    origins: [origin_lat_lng],
                    destinations: [destination_lat_lng],
                    mode: TravelMode.driving,
                    departure_time: new Date(),
                    traffic_model: TrafficModel.best_guess,
                    key: GOOGLE_MAPS_API_KEY.value(),
                },
            });

            const element = mapsResponse.data.rows?.[0]?.elements?.[0];

            if (!element || element.status !== "OK") {
                logger.error("Maps API returned non-OK status:", element?.status);
                res.status(500).send("Maps API failed");
                return;
            }

            // duration_in_traffic gives us the traffic-aware travel time
            const trafficDurationSecs = element.duration_in_traffic?.value
                || element.duration?.value
                || 0;
            const trafficDurationMins = Math.ceil(trafficDurationSecs / 60);
            const distanceText = element.distance?.text || "unknown";

            logger.info(`📊 Traffic: ${trafficDurationMins} mins, ${distanceText}`);

            // ═══════════════════════════════════════════════════
            //  STEP 2: Calculate leave time
            // ═══════════════════════════════════════════════════

            const totalLeadTimeMins = trafficDurationMins + BUFFER_MINUTES;
            const leaveTime = new Date(eventStart.getTime() - totalLeadTimeMins * 60 * 1000);

            // Format for Sri Lankan locale
            const leaveTimeStr = leaveTime.toLocaleTimeString("en-LK", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Colombo",
            });
            const eventTimeStr = eventStart.toLocaleTimeString("en-LK", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
                timeZone: "Asia/Colombo",
            });

            // Determine traffic severity
            const normalDuration = element.duration?.value || trafficDurationSecs;
            const trafficRatio = trafficDurationSecs / normalDuration;
            let trafficLevel: string;
            let emoji: string;

            if (trafficRatio > 1.5) {
                trafficLevel = "Very Heavy";
                emoji = "🔴";
            } else if (trafficRatio > 1.2) {
                trafficLevel = "Heavy";
                emoji = "🟠";
            } else if (trafficRatio > 1.05) {
                trafficLevel = "Moderate";
                emoji = "🟡";
            } else {
                trafficLevel = "Light";
                emoji = "🟢";
            }

            // ═══════════════════════════════════════════════════
            //  STEP 3: Get destination name
            // ═══════════════════════════════════════════════════

            const destinationName = mapsResponse.data.destination_addresses?.[0]
                || title || "appointment";

            // ═══════════════════════════════════════════════════
            //  STEP 4: Send FCM Push Notification
            // ═══════════════════════════════════════════════════

            const db = admin.firestore();
            const userDoc = await db.doc(`users/${userId}`).get();
            const fcmToken = userDoc.data()?.fcm_token;

            if (!fcmToken) {
                logger.warn(`No FCM token for user ${userId}, saving alert to Firestore only`);
            } else {
                const notificationBody = trafficRatio > 1.2
                    ? `${emoji} ${trafficLevel} traffic! Travel time: ${trafficDurationMins} mins. Leave by ${leaveTimeStr} to reach ${title} at ${eventTimeStr}.`
                    : `${emoji} Traffic looks good! ${trafficDurationMins} mins to ${title}. Leave by ${leaveTimeStr}.`;

                await admin.messaging().send({
                    token: fcmToken,
                    notification: {
                        title: `🚗 Time to Leave — ${title}`,
                        body: notificationBody,
                    },
                    data: {
                        type: "traffic_alert",
                        eventId,
                        origin: origin_lat_lng,
                        destination: destination_lat_lng,
                        leaveTime: leaveTime.toISOString(),
                        travelMins: String(trafficDurationMins),
                        trafficLevel,
                    },
                    // Higher priority for time-sensitive alerts
                    android: {
                        priority: "high",
                        notification: {
                            channelId: "traffic_alerts",
                            sound: "default",
                        },
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: "default",
                                badge: 1,
                            },
                        },
                    },
                });

                logger.info(`📲 Push notification sent to user ${userId}`);
            }

            // ═══════════════════════════════════════════════════
            //  STEP 5: Save alert record to Firestore
            // ═══════════════════════════════════════════════════

            await db.collection(`users/${userId}/traffic_alerts`).add({
                eventId,
                title,
                traffic_level: trafficLevel,
                travel_duration_mins: trafficDurationMins,
                distance: distanceText,
                leave_time: admin.firestore.Timestamp.fromDate(leaveTime),
                event_start: admin.firestore.Timestamp.fromDate(eventStart),
                origin: origin_lat_lng,
                destination: destination_lat_lng,
                destination_name: destinationName,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                // Pass to frontend for Waze deeplink
                waze_url: `https://waze.com/ul?ll=${destination_lat_lng.replace(/\s/g, "")}&navigate=yes`,
                google_maps_url: `https://www.google.com/maps/dir/?api=1&origin=${origin_lat_lng.replace(/\s/g, "")}&destination=${destination_lat_lng.replace(/\s/g, "")}&travelmode=driving`,
            });

            logger.info(`🎉 Traffic alert completed for ${eventId}`);
            res.status(200).json({
                success: true,
                trafficLevel,
                travelMins: trafficDurationMins,
                leaveTime: leaveTimeStr,
            });

        } catch (error: any) {
            logger.error(`❌ Traffic alert failed for ${eventId}:`, error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
);
