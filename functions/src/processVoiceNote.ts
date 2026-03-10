/**
 * processVoiceNote — Cloud Function (Gen 2)
 *
 * Storage Trigger: fires on `users/{userId}/pending_audio/{fileId}.m4a`
 *
 * Pipeline:
 *   1. Download audio to /tmp
 *   2. Whisper-1 transcription (with Singlish medical prompt)
 *   3. GPT-4o-mini structuring (JSON mode, auto-redact names → initials)
 *   4. Save to Firestore: users/{userId}/clinical_notes/{fileId}
 *   5. Create action_items sub-collection entries
 *   6. DELETE audio from Storage + /tmp (PDPA compliance + cost savings)
 */

import { onObjectFinalized } from "firebase-functions/v2/storage";
import { logger } from "firebase-functions/v2";
import * as admin from "firebase-admin";
import OpenAI from "openai";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// ─── Config ─────────────────────────────────────────────────────

const WHISPER_PROMPT = [
    "Clinical note by a doctor in Sri Lanka.",
    "May contain medical jargon: FBC, CBC, CRP, ECG, HbA1c, BHT, NHSL, LRH,",
    "Stevens-Johnson, Guillain-Barré, DVT, PE, CKD, COPD, MI, ACS, ICU, OPD.",
    "May contain Singlish/Sinhala terms: eka, naha, amaruwa, heta, ude, tikak,",
    "BHT, danne naha, parissamak naha, hithenawa, thamai.",
    "May contain Tamil medical terms: kaichal, thalai vali, vairu vali."
].join(" ");

const GPT_SYSTEM_PROMPT = `You are a medical scribe AI assistant for Sri Lankan doctors. 
You receive raw voice transcripts that may contain Singlish (mixed Sinhala+English), 
Tamil words, and Sri Lankan medical slang.

Your job:
1. Translate ALL non-English content to clean, professional medical English.
2. Structure the note into a formal clinical summary.
3. STRICTLY REDACT any full patient names to initials only (PDPA compliance).
   Example: "Kamal Perera" → "K.P."  |  "Anoma Wickramasinghe" → "A.W."
4. Extract hashtag tags for searchability.
5. Extract action items / reminders mentioned by the doctor.
6. If age/sex are mentioned, include them with the identifier.

Respond ONLY with valid JSON matching the exact schema requested.`;

const GPT_JSON_SCHEMA = {
    type: "object" as const,
    properties: {
        patient_identifier: {
            type: "string" as const,
            description: "Patient initials + age + sex + ward, e.g. 'K.M., 45M, Ward 15'. If full name detected, REDACT to initials."
        },
        clinical_summary: {
            type: "string" as const,
            description: "Clean, professional English medical summary. Translate ALL Singlish/Tamil to English."
        },
        action_items: {
            type: "array" as const,
            items: {
                type: "object" as const,
                properties: {
                    task: { type: "string" as const, description: "The action/reminder" },
                    urgency: { type: "string" as const, enum: ["today", "tomorrow", "this_week", "routine"], description: "When this should be done" }
                },
                required: ["task", "urgency"]
            },
            description: "Follow-up tasks or reminders mentioned by the doctor"
        },
        tags: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "Relevant medical hashtags starting with #, e.g. ['#StevensJohnson', '#RareCase', '#Ward15']"
        },
        is_rare_case: {
            type: "boolean" as const,
            description: "True if this case involves a rare or unusual medical condition worth archiving for research/exams"
        }
    },
    required: ["patient_identifier", "clinical_summary", "action_items", "tags", "is_rare_case"]
};

// ─── Cloud Function ─────────────────────────────────────────────

export const processVoiceNote = onObjectFinalized(
    {
        // Gen 2 options
        region: "asia-south1",  // Mumbai — lowest latency for Sri Lanka
        memory: "512MiB",
        timeoutSeconds: 120,
        // Only trigger for pending_audio paths
    },
    async (event) => {
        const filePath = event.data.name;    // e.g. users/abc123/pending_audio/note001.m4a
        const bucket = event.data.bucket;

        // ── Guard: only process pending_audio .m4a files ──
        if (!filePath || !filePath.includes("/pending_audio/") || !filePath.endsWith(".m4a")) {
            logger.info(`Skipping non-audio file: ${filePath}`);
            return;
        }

        // Parse userId and fileId from path
        const pathParts = filePath.split("/");
        const userId = pathParts[1];          // users/{userId}/pending_audio/{fileId}.m4a
        const fileId = path.basename(filePath, ".m4a");

        logger.info(`🎙️ Processing voice note: ${filePath}`, { userId, fileId });

        const db = admin.firestore();
        const storage = admin.storage().bucket(bucket);
        const noteRef = db.doc(`users/${userId}/clinical_notes/${fileId}`);

        // Set initial status
        await noteRef.set({
            status: "processing",
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            source_audio_path: filePath,
        });

        const tmpFile = path.join(os.tmpdir(), `${fileId}.m4a`);

        try {
            // ════════════════════════════════════════════════════
            //  STEP 1: Download audio to /tmp
            // ════════════════════════════════════════════════════

            logger.info("⬇️ Downloading audio...");
            await storage.file(filePath).download({ destination: tmpFile });

            const fileStats = fs.statSync(tmpFile);
            logger.info(`📁 Downloaded: ${(fileStats.size / 1024).toFixed(1)} KB`);

            // ════════════════════════════════════════════════════
            //  STEP 2: Whisper Transcription
            // ════════════════════════════════════════════════════

            logger.info("🔊 Transcribing with Whisper...");

            const openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY,
            });

            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(tmpFile),
                model: "whisper-1",
                language: "en",
                prompt: WHISPER_PROMPT,
                response_format: "text",
            });

            const rawTranscript = typeof transcription === "string"
                ? transcription
                : (transcription as any).text || JSON.stringify(transcription);

            logger.info(`📝 Transcript (${rawTranscript.length} chars): ${rawTranscript.substring(0, 200)}...`);

            // ════════════════════════════════════════════════════
            //  STEP 3: GPT-4o-mini Structuring
            // ════════════════════════════════════════════════════

            logger.info("🧠 Structuring with GPT-4o-mini...");

            const structuredResponse = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: GPT_SYSTEM_PROMPT },
                    {
                        role: "user",
                        content: `Analyze this raw clinical voice transcript and return structured JSON:\n\n---\n${rawTranscript}\n---\n\nReturn JSON with: patient_identifier, clinical_summary, action_items (array of {task, urgency}), tags (array of #hashtags), is_rare_case (boolean).`
                    }
                ],
                temperature: 0.1,  // Low temp for accuracy
                max_tokens: 1000,
            });

            const structuredText = structuredResponse.choices[0]?.message?.content;
            if (!structuredText) throw new Error("GPT-4o-mini returned empty response");

            const structured = JSON.parse(structuredText);
            logger.info("✅ Structured output:", structured);

            // ════════════════════════════════════════════════════
            //  STEP 4: Save to Firestore
            // ════════════════════════════════════════════════════

            logger.info("💾 Saving to Firestore...");

            await noteRef.set({
                status: "processed",
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                processedAt: admin.firestore.FieldValue.serverTimestamp(),
                // Raw data
                raw_transcript: rawTranscript,
                // Structured data
                patient_identifier: structured.patient_identifier || "Unknown",
                clean_text: structured.clinical_summary || rawTranscript,
                tags: structured.tags || [],
                is_rare_case: structured.is_rare_case || false,
                media_urls: [],  // Populated by client when attaching photos
                // AI metadata
                ai_model_transcribe: "whisper-1",
                ai_model_structure: "gpt-4o-mini",
            });

            // Create action_items sub-collection
            if (structured.action_items && structured.action_items.length > 0) {
                const batch = db.batch();
                for (const item of structured.action_items) {
                    const actionRef = noteRef.collection("action_items").doc();
                    batch.set(actionRef, {
                        task: item.task,
                        urgency: item.urgency || "routine",
                        due_date: calculateDueDate(item.urgency),
                        is_completed: false,
                        createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    });
                }
                await batch.commit();
                logger.info(`📋 Created ${structured.action_items.length} action items`);
            }

            // ════════════════════════════════════════════════════
            //  STEP 5: MANDATORY CLEANUP
            // ════════════════════════════════════════════════════

            logger.info("🗑️ Cleaning up audio file (PDPA compliance)...");

            // Delete from Storage
            try {
                await storage.file(filePath).delete();
                logger.info("✅ Audio deleted from Storage");
            } catch (deleteErr) {
                logger.warn("⚠️ Failed to delete audio from Storage:", deleteErr);
            }

            // Delete local /tmp file
            try {
                fs.unlinkSync(tmpFile);
                logger.info("✅ Tmp file cleaned up");
            } catch {
                // /tmp is ephemeral anyway
            }

            logger.info(`🎉 Voice note ${fileId} processed successfully for user ${userId}`);

        } catch (error: any) {
            logger.error(`❌ Failed to process voice note ${fileId}:`, error);

            // Mark as failed so client can show retry
            await noteRef.update({
                status: "failed",
                error_message: error.message || "Unknown processing error",
                failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Always clean up /tmp even on failure
            try { fs.unlinkSync(tmpFile); } catch { /* ok */ }
        }
    }
);

// ─── Helpers ────────────────────────────────────────────────────

function calculateDueDate(urgency: string): admin.firestore.Timestamp {
    const now = new Date();

    switch (urgency) {
        case "today":
            // Today at 5:30 PM IST
            now.setHours(17, 30, 0, 0);
            break;
        case "tomorrow":
            // Tomorrow at 8:00 AM IST (ward round time)
            now.setDate(now.getDate() + 1);
            now.setHours(8, 0, 0, 0);
            break;
        case "this_week":
            // 3 days from now
            now.setDate(now.getDate() + 3);
            now.setHours(9, 0, 0, 0);
            break;
        case "routine":
        default:
            // 1 week from now
            now.setDate(now.getDate() + 7);
            now.setHours(9, 0, 0, 0);
            break;
    }

    return admin.firestore.Timestamp.fromDate(now);
}
