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
