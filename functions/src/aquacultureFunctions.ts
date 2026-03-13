/**
 * aquacultureFunctions.ts — Cloud Functions for Aquaculture (AquaTracksy)
 *
 * 1. waterQualityAlert   — Scheduled: daily at 6 AM IST, checks water quality anomalies + pre-harvest ponds
 * 2. processAquacultureAI — Callable: Gemini-powered AI tools (water analysis, receipt scanner, NAQDA report)
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = admin.firestore();

// ════════════════════════════════════════════════════════════════
//  1. WATER QUALITY ALERT (daily at 6 AM IST = 00:30 UTC)
// ════════════════════════════════════════════════════════════════

export const waterQualityAlert = onSchedule(
  {
    schedule: '0 6 * * *',
    region: 'asia-south1',
    timeZone: 'Asia/Colombo',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('🐟 Running daily aquaculture alert check...');

    const usersSnap = await db.collection('users')
      .where('app_type', '==', 'aquaculture')
      .get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();
      const alerts: string[] = [];

      // Check water quality — latest logs with issues
      const waterSnap = await db.collection('users').doc(uid)
        .collection('aqua_water_logs')
        .orderBy('createdAt', 'desc')
        .limit(20)
        .get();

      const latestByPond: Record<string, any> = {};
      for (const wDoc of waterSnap.docs) {
        const data = wDoc.data();
        if (!latestByPond[data.pondId]) latestByPond[data.pondId] = data;
      }

      for (const [pondId, data] of Object.entries(latestByPond)) {
        if (data.ammonia > 0.1) alerts.push(`⚠️ ${data.pondName}: Ammonia ${data.ammonia}mg/L — stop feeding`);
        if (data.ph < 6.5 || data.ph > 8.5) alerts.push(`⚠️ ${data.pondName}: pH ${data.ph} out of range`);
        if (data.dissolvedOxygen < 4) alerts.push(`⚠️ ${data.pondName}: Low DO₂ ${data.dissolvedOxygen}mg/L`);
      }

      // Check ponds approaching harvest
      const pondsSnap = await db.collection('users').doc(uid)
        .collection('aqua_ponds')
        .where('stage', '==', 'pre-harvest')
        .get();

      for (const pondDoc of pondsSnap.docs) {
        const p = pondDoc.data();
        alerts.push(`📦 ${p.name}: Pre-harvest — prepare nets and transport`);
      }

      // Check feed inventory (FCR anomalies)
      const feedSnap = await db.collection('users').doc(uid)
        .collection('aqua_feed_logs')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get();

      for (const fDoc of feedSnap.docs) {
        const f = fDoc.data();
        if (f.fcr && f.fcr > 2.0) {
          alerts.push(`🌾 ${f.pondName}: FCR ${f.fcr.toFixed(1)} — overfeeding detected`);
        }
      }

      if (alerts.length > 0 && userData.fcmToken) {
        try {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: `🐟 AquaTracksy: ${alerts.length} Alert${alerts.length > 1 ? 's' : ''}`,
              body: alerts.slice(0, 3).join('\n'),
            },
            data: { type: 'aqua_alert', count: String(alerts.length) },
          });
          logger.info(`Sent ${alerts.length} alerts to ${uid}`);
        } catch (err) {
          logger.warn(`FCM failed for ${uid}`, err);
        }
      }
    }
  }
);

// ════════════════════════════════════════════════════════════════
//  2. PROCESS AQUACULTURE AI (callable)
// ════════════════════════════════════════════════════════════════

const AQUA_AI_TOOLS: Record<string, { tokensNeeded: number; systemPrompt: string }> = {
  water_quality: {
    tokensNeeded: 3,
    systemPrompt: `You are an expert aquaculture water quality analyst for Sri Lankan fish, shrimp, and sea cucumber farms.
Analyze the water parameters provided. Check pH (ideal 7.5-8.5 for shrimp, 6.5-8.0 for tilapia),
dissolved oxygen (>5mg/L), ammonia (<0.1mg/L), salinity, and temperature.
Provide specific actionable advice: stop feeding, apply zeolite, water exchange %, lime application.
Reference NAQDA (National Aquaculture Development Authority of Sri Lanka) guidelines.
Always provide advice in simple farming language.`,
  },
  feed_optimization: {
    tokensNeeded: 2,
    systemPrompt: `You are an aquaculture feed management expert for Sri Lankan farms.
Analyze feed data (FCR, quantity, cost) and provide optimization recommendations.
Target FCR: Shrimp 1.2-1.5, Tilapia 1.5-1.8, Sea Cucumber N/A (filter feeding).
Identify overfeeding, theft indicators (unexplained inventory drops), and cost savings.
Recommend Sri Lankan feed brands (CIC, Prima, Lanka Feed) and feeding schedules.
60% of farm cost is feed — every optimization matters.`,
  },
  receipt_scanner: {
    tokensNeeded: 5,
    systemPrompt: `You are a receipt/bill scanner for Sri Lankan aquaculture farmers.
Extract transaction details from the described receipt: amount, category, vendor, date.
Receipts may be in Sinhala, Tamil, or English. Handle handwritten receipts.
Categories: Feed, Stock/PL, Labour, Diesel/Fuel, Chemicals/Probiotics, Equipment, Transport, Utilities, Other.
Return structured JSON: { amount, category, description, vendor, date, pondId_suggestion }.
If the receipt mentions a pond number or location, suggest the pondId.`,
  },
  harvest_grading: {
    tokensNeeded: 2,
    systemPrompt: `You are an export grading specialist for Sri Lankan sea cucumber and shrimp.
Help farmers grade their harvest for export to China, Singapore, and Hong Kong markets.
Sea cucumber grading: Grade A (Large, >200g dried, $25-30/kg), Grade B (Medium, 100-200g, $15-20/kg),
Grade C (Small, <100g, $8-12/kg). Shrimp: U10, U15, 16/20, 21/25, 26/30 count per pound.
Calculate total payout in USD and convert to LKR at current rates (~Rs.300/USD).
Generate delivery note format suitable for Colombo export agents.`,
  },
  naqda_report: {
    tokensNeeded: 5,
    systemPrompt: `You are a financial report generator for Sri Lankan aquaculture farms.
Generate a professional "Farm Financial Health Report" suitable for:
- NAQDA license renewal applications
- BOC (Bank of Ceylon) agricultural loan applications (5-10M LKR range)
- Samurdhi Bank micro-lending
Include: Revenue summary, cost breakdown (per pond if data available), profit margins,
FCR trends, production cycle analysis, growth projections.
Format as a professional document with sections, tables, and key metrics.
Reference NAQDA registration requirements and BOC agricultural lending criteria.`,
  },
  disease_diagnosis: {
    tokensNeeded: 3,
    systemPrompt: `You are an aquaculture disease diagnosis expert for Sri Lankan farms.
Based on the symptoms described, identify potential diseases:
Shrimp: White Spot Syndrome (WSSV), EMS/AHPND, Vibriosis, Black Gill.
Fish: Epizootic Ulcerative Syndrome (EUS), Columnaris, Ich.
Sea Cucumber: Skin Ulceration Syndrome, Vibrio infections.
Provide: likely diagnosis, severity (low/medium/high/critical), immediate actions,
treatment options available in Sri Lanka, quarantine recommendations.
Reference NARA (National Aquatic Resources Research and Development Agency) guidelines.`,
  },
};

export const processAquacultureAI = onCall(
  {
    region: 'asia-south1',
    memory: '512MiB',
    timeoutSeconds: 60,
    secrets: [geminiApiKey],
  },
  async (request) => {
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError('unauthenticated', 'Login required');

    const { tool, prompt } = request.data;
    if (!tool || !prompt) throw new HttpsError('invalid-argument', 'tool and prompt required');

    const toolConfig = AQUA_AI_TOOLS[tool];
    if (!toolConfig) throw new HttpsError('invalid-argument', `Unknown tool: ${tool}`);

    // Check token balance
    const userRef = db.collection('users').doc(uid);
    const userSnap = await userRef.get();
    const balance = userSnap.data()?.token_balance || 0;

    if (balance < toolConfig.tokensNeeded) {
      throw new HttpsError('resource-exhausted', `Need ${toolConfig.tokensNeeded} tokens, have ${balance}`);
    }

    // Call Gemini
    const apiKey = geminiApiKey.value();
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: toolConfig.systemPrompt }] },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      logger.error('Gemini API error', errBody);
      throw new HttpsError('internal', 'AI processing failed');
    }

    const geminiData = await geminiRes.json();
    const result = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated';

    // Deduct tokens
    await userRef.update({
      token_balance: admin.firestore.FieldValue.increment(-toolConfig.tokensNeeded),
    });

    // Log usage
    await db.collection('users').doc(uid).collection('wallet_transactions').add({
      type: 'debit',
      amount: toolConfig.tokensNeeded,
      tool: `aqua_${tool}`,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`🐟 AI tool [${tool}] used by ${uid}, ${toolConfig.tokensNeeded} tokens deducted`);

    return { result, tokensUsed: toolConfig.tokensNeeded, remainingBalance: balance - toolConfig.tokensNeeded };
  }
);
