/**
 * Cloud Functions — MyTracksy
 *
 * Entry point exporting all Gen 2 Cloud Functions.
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin (once, before any function imports)
admin.initializeApp();

// ─── Voice Vault Pipeline ───────────────────────────────────────
export { processVoiceNote } from "./processVoiceNote";
export { morningBriefing } from "./morningBriefing";

// ─── Smart Personal Assistant ───────────────────────────────────
export { checkScheduleConflict } from "./checkScheduleConflict";
export {
    onScheduleEventCreated,
    onScheduleEventUpdated,
    onScheduleEventDeleted,
} from "./scheduleTrafficAlert";
export { trafficAlertWorker } from "./trafficAlertWorker";
export { lifeAdminReminder } from "./lifeAdminReminder";

// ─── Monetization & Paywall ─────────────────────────────────────
export { handleSubscriptionWebhook } from "./handleSubscriptionWebhook";
export { generateSubscriptionInvoice } from "./generateSubscriptionInvoice";

// ─── Super Admin Dashboard (Enhanced) ──────────────────────────
export { verifyAdminAccess, assignAdminRole, removeAdminRole, listAdminUsers } from "./adminRoles";
export { approveDoctor, suspendUser, overrideSubscription, getAdminStats } from "./adminActions";
export { getProfessionStats, getGlobalStats, getProfessionUsers, getAuditLog } from "./adminAnalytics";
export { sendBulkPush } from "./sendPushNotification";
