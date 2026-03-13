/**
 * engineeringFunctions.ts — Cloud Functions for Engineering Profession (EngiTracksy)
 *
 * 1. boqVarianceAlert     — Scheduled: daily at 8 AM IST, checks BOQ overruns and sends alerts
 * 2. processEngineeringAI — Callable: runs Gemini for engineering AI tools (cost estimation, site analysis, etc.)
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = admin.firestore();

// ════════════════════════════════════════════════════════════════
//  1. BOQ VARIANCE ALERT (daily at 8 AM IST = 02:30 UTC)
// ════════════════════════════════════════════════════════════════

export const boqVarianceAlert = onSchedule(
  {
    schedule: '0 8 * * *',
    region: 'asia-south1',
    timeZone: 'Asia/Colombo',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('🏗️ Running BOQ variance alert check...');

    const usersSnap = await db.collection('users')
      .where('app_type', '==', 'engineering')
      .get();

    const today = new Date().toISOString().split('T')[0];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      // Check BOQ items for variance > 10%
      const boqSnap = await db.collection('users').doc(uid).collection('boq_items').get();
      const overruns: string[] = [];

      for (const item of boqSnap.docs) {
        const data = item.data();
        if (data.actualRate && data.estimatedRate && data.actualRate > data.estimatedRate) {
          const variance = ((data.actualRate - data.estimatedRate) / data.estimatedRate) * 100;
          if (variance > 10) {
            overruns.push(`${data.item}: +${variance.toFixed(1)}% over estimate`);
          }
        }
      }

      // Check retention releases due today
      const retentionSnap = await db.collection('users').doc(uid)
        .collection('retention_records')
        .where('releaseDate', '==', today)
        .where('status', '==', 'held')
        .get();

      const retentionAlerts = retentionSnap.docs.map(d => {
        const data = d.data();
        return `${data.projectName}: LKR ${(data.retentionAmount / 100).toLocaleString()} due for release`;
      });

      // Send FCM push if there are alerts
      const allAlerts = [...overruns, ...retentionAlerts];
      if (allAlerts.length > 0 && userData.fcmToken) {
        try {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: `🏗️ EngiTracksy: ${allAlerts.length} Alert${allAlerts.length > 1 ? 's' : ''}`,
              body: allAlerts.slice(0, 3).join(' | '),
            },
            data: { type: 'boq_variance', count: String(allAlerts.length) },
          });
          logger.info(`📨 Sent ${allAlerts.length} alerts to ${uid}`);
        } catch (e) {
          logger.warn(`FCM send failed for ${uid}`, e);
        }
      }
    }
  }
);

// ════════════════════════════════════════════════════════════════
//  2. ENGINEERING AI QUERY (callable)
// ════════════════════════════════════════════════════════════════

const ENGINEERING_AI_TOOLS: Record<string, { systemPrompt: string; tokenCost: number }> = {
  cost_estimation: {
    systemPrompt: `You are a Sri Lankan construction cost estimation expert. You know ICTAD/CIDA standard rates, material prices, and labor costs for the Sri Lankan market. Provide detailed cost breakdowns with quantities, rates, and totals in LKR. Reference ICTAD schedule of rates where applicable.`,
    tokenCost: 2,
  },
  boq_analysis: {
    systemPrompt: `You are a BOQ (Bill of Quantities) analysis expert for Sri Lankan construction. Analyze BOQ items, identify potential cost overruns, suggest value engineering alternatives, and flag items that need re-estimation. Reference CIDA/ICTAD standards.`,
    tokenCost: 2,
  },
  site_report: {
    systemPrompt: `You are a structural engineering site inspection report writer. Generate professional site inspection reports based on findings described. Include structural observations, compliance notes, recommendations, and follow-up actions. Reference SLS (Sri Lanka Standards) and BS EN codes.`,
    tokenCost: 1,
  },
  contract_clause: {
    systemPrompt: `You are a construction contract law expert familiar with FIDIC, ICTAD conditions of contract, and Sri Lankan construction law. Draft or review contract clauses, variation orders, extension of time claims, and dispute resolution terms.`,
    tokenCost: 3,
  },
  safety_audit: {
    systemPrompt: `You are a construction safety audit specialist familiar with Sri Lankan OSHA equivalent regulations and construction safety standards. Analyze site safety conditions explained and provide detailed audit reports with risk ratings, corrective actions, and compliance checklists.`,
    tokenCost: 1,
  },
  retention_calculator: {
    systemPrompt: `You are a construction finance expert specializing in retention money, WHT (Withholding Tax), and progress payment calculations for Sri Lankan construction projects. Calculate retention releases, WHT deductions (2% for construction), and net payment amounts. Explain tax implications under the Inland Revenue Act.`,
    tokenCost: 1,
  },
};

export const processEngineeringAI = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: [geminiApiKey],
  },
  async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in required');

    const { tool, prompt } = request.data as { tool: string; prompt: string };
    if (!tool || !prompt) throw new HttpsError('invalid-argument', 'tool and prompt required');

    const toolConfig = ENGINEERING_AI_TOOLS[tool];
    if (!toolConfig) throw new HttpsError('invalid-argument', `Unknown tool: ${tool}`);

    const uid = request.auth.uid;

    // Check token balance
    const walletRef = db.collection('users').doc(uid).collection('wallet').doc('balance');
    const walletSnap = await walletRef.get();
    const balance = walletSnap.exists ? (walletSnap.data()?.tokens ?? 0) : 0;

    if (balance < toolConfig.tokenCost) {
      throw new HttpsError('resource-exhausted', `Insufficient tokens. Need ${toolConfig.tokenCost}, have ${balance}`);
    }

    // Call Gemini
    const apiKey = geminiApiKey.value();
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: toolConfig.systemPrompt }] },
        generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
      }),
    });

    if (!geminiRes.ok) {
      logger.error('Gemini API error', await geminiRes.text());
      throw new HttpsError('internal', 'AI service error');
    }

    const geminiData = await geminiRes.json();
    const resultText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated.';

    // Deduct tokens
    await walletRef.set({ tokens: admin.firestore.FieldValue.increment(-toolConfig.tokenCost) }, { merge: true });

    // Log usage
    await db.collection('users').doc(uid).collection('wallet_transactions').add({
      type: 'spend',
      tokens: toolConfig.tokenCost,
      description: `EngiTracksy AI: ${tool}`,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`🏗️ Engineering AI [${tool}] for ${uid}, cost: ${toolConfig.tokenCost} tokens`);

    return { result: resultText, tokensUsed: toolConfig.tokenCost };
  }
);
