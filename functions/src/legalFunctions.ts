/**
 * legalFunctions.ts — Cloud Functions for Legal Profession
 *
 * 1. courtHearingReminder  — Scheduled: daily at 7 AM IST, sends push for today's hearings
 * 2. processLegalAIQuery   — Callable: runs Gemini for legal AI tools (case research, drafting, etc.)
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = admin.firestore();

// ════════════════════════════════════════════════════════════════
//  1. COURT HEARING REMINDER (daily at 7 AM IST = 01:30 UTC)
// ════════════════════════════════════════════════════════════════

export const courtHearingReminder = onSchedule(
  {
    schedule: '0 7 * * *',
    region: 'asia-south1',
    timeZone: 'Asia/Colombo',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('⚖️ Running court hearing reminder...');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

    // Find all users with legal profession
    const usersSnap = await db.collection('users')
      .where('app_type', '==', 'legal')
      .get();

    let notified = 0;

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      // Get today's court diary entries
      const diarySnap = await db.collection(`users/${uid}/court_diary`)
        .where('date', '==', todayStr)
        .get();

      if (diarySnap.empty) continue;

      const entries = diarySnap.docs.map(d => d.data());
      const hearingCount = entries.length;
      const firstCourt = entries[0]?.court || 'Court';
      const firstTime = entries[0]?.time || '09:00';

      // Build notification
      const title = `⚖️ ${hearingCount} hearing${hearingCount > 1 ? 's' : ''} today`;
      const body = hearingCount === 1
        ? `${firstCourt} at ${firstTime} — ${entries[0]?.caseTitle || 'Hearing'}`
        : `First: ${firstCourt} at ${firstTime}. ${hearingCount - 1} more today.`;

      // Get FCM token
      const userData = userDoc.data();
      const fcmToken = userData?.fcm_token;

      if (fcmToken) {
        try {
          await admin.messaging().send({
            token: fcmToken,
            notification: { title, body },
            data: { action: 'diary', type: 'court_reminder' },
          });
          notified++;
        } catch (err) {
          logger.warn(`Failed to send push to ${uid}:`, err);
        }
      }

      // Also store as a briefing for in-app display
      await db.doc(`users/${uid}/briefings/${todayStr}-legal`).set({
        type: 'court_reminder',
        title,
        body,
        hearings: entries.map(e => ({
          court: e.court,
          time: e.time,
          caseTitle: e.caseTitle,
          judge: e.judge,
          hearingType: e.hearingType,
        })),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });
    }

    logger.info(`⚖️ Court reminders sent to ${notified} lawyers`);
  }
);

// ════════════════════════════════════════════════════════════════
//  2. LEGAL AI QUERY (callable — deducts tokens)
// ════════════════════════════════════════════════════════════════

const LEGAL_AI_TOOLS: Record<string, { cost: number; systemPrompt: string }> = {
  case_research: {
    cost: 2,
    systemPrompt: `You are an expert Sri Lankan legal researcher. Given a legal query, provide:
1. Relevant Sri Lankan statutes and sections
2. Key case law precedents from Sri Lankan courts
3. Brief analysis of how the law applies
Format your response clearly with numbered sections. Cite specific case names and statute sections.`,
  },
  draft_pleading: {
    cost: 3,
    systemPrompt: `You are a Sri Lankan legal drafting assistant. Draft a professional legal pleading based on the given details.
Follow Sri Lankan court formatting conventions. Include proper caption, prayer, and verification sections.
Use formal legal language appropriate for Sri Lankan courts.`,
  },
  client_advice: {
    cost: 1,
    systemPrompt: `You are a Sri Lankan legal advisor assistant. Provide clear, concise legal advice in plain language.
Reference applicable Sri Lankan laws. Include practical next steps.
Add a disclaimer that this is AI-generated guidance and should be reviewed by the lawyer before sharing with clients.`,
  },
  contract_review: {
    cost: 2,
    systemPrompt: `You are a Sri Lankan contract law specialist. Review the given contract text and identify:
1. Key risks and unfavorable clauses
2. Missing essential terms
3. Compliance issues with Sri Lankan law
4. Suggested amendments
Format with clear sections and priority levels (High/Medium/Low risk).`,
  },
  legal_summary: {
    cost: 1,
    systemPrompt: `You are a legal document summarizer. Provide a concise summary of the given legal text including:
1. Key parties involved
2. Core legal issues
3. Main obligations and rights
4. Important dates and deadlines
5. Critical clauses
Keep the summary under 500 words.`,
  },
  citation_check: {
    cost: 1,
    systemPrompt: `You are a Sri Lankan legal citation verification specialist. Check the given legal citations for:
1. Correct case name formatting
2. Accurate court and year references
3. Whether the cited provisions exist in current Sri Lankan law
4. Any superseded or amended provisions
Flag any issues found.`,
  },
};

export const processLegalAIQuery = onCall(
  { secrets: [geminiApiKey], region: 'asia-south1', memory: '512MiB', timeoutSeconds: 60 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Must be logged in');
    }

    const uid = request.auth.uid;
    const { tool, prompt } = request.data as { tool: string; prompt: string };

    if (!tool || !prompt) {
      throw new HttpsError('invalid-argument', 'tool and prompt are required');
    }

    const toolConfig = LEGAL_AI_TOOLS[tool];
    if (!toolConfig) {
      throw new HttpsError('invalid-argument', `Unknown tool: ${tool}`);
    }

    // Check token balance
    const walletRef = db.doc(`users/${uid}/wallet/balance`);
    const walletSnap = await walletRef.get();
    const currentBalance = walletSnap.exists ? (walletSnap.data()?.tokens || 0) : 0;

    if (currentBalance < toolConfig.cost) {
      throw new HttpsError('resource-exhausted',
        `Insufficient tokens. Need ${toolConfig.cost}, have ${currentBalance}. Please top up.`);
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured');
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent([
        { role: 'user', parts: [{ text: toolConfig.systemPrompt + '\n\n---\n\nUser Query:\n' + prompt }] },
      ]);
      const response = await result.response;
      const text = response.text();

      // Deduct tokens
      await walletRef.set(
        { tokens: admin.firestore.FieldValue.increment(-toolConfig.cost) },
        { merge: true }
      );

      // Log usage
      await db.collection(`users/${uid}/wallet_transactions`).add({
        type: 'spend',
        tokens: -toolConfig.cost,
        description: `AI: ${tool.replace(/_/g, ' ')}`,
        status: 'completed',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`⚖️ Legal AI query: ${tool} for user ${uid}, cost ${toolConfig.cost} tokens`);

      return { result: text, tokensUsed: toolConfig.cost, remainingTokens: currentBalance - toolConfig.cost };
    } catch (error: any) {
      logger.error('Legal AI query error:', error);
      throw new HttpsError('internal', 'AI processing failed. Please try again.');
    }
  }
);
