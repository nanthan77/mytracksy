/**
 * creatorFunctions.ts — Cloud Functions for Creator Profession (CreatorTracksy)
 *
 * 1. brandDealReminder  — Scheduled: daily at 9 AM IST, checks overdue deliverables & unpaid invoices
 * 2. processCreatorAI   — Callable: runs Gemini for creator AI tools (hooks, pitches, tax advice, etc.)
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { logger } from 'firebase-functions/v2';
import { defineSecret } from 'firebase-functions/params';
import * as admin from 'firebase-admin';

const geminiApiKey = defineSecret('GEMINI_API_KEY');
const db = admin.firestore();

// ════════════════════════════════════════════════════════════════
//  1. BRAND DEAL REMINDER (daily at 9 AM IST = 03:30 UTC)
// ════════════════════════════════════════════════════════════════

export const brandDealReminder = onSchedule(
  {
    schedule: '30 3 * * *',
    region: 'asia-south1',
    timeZone: 'Asia/Colombo',
    memory: '256MiB',
    timeoutSeconds: 120,
  },
  async () => {
    logger.info('🎬 Running brand deal reminder check...');

    const usersSnap = await db.collection('users')
      .where('app_type', '==', 'creator')
      .get();

    const today = new Date().toISOString().split('T')[0];

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const userData = userDoc.data();

      const dealsSnap = await db.collection('users').doc(uid)
        .collection('creator_brand_deals').get();

      const alerts: string[] = [];

      for (const dealDoc of dealsSnap.docs) {
        const deal = dealDoc.data();

        // Overdue deliverables (shoot_booked with past due date)
        if (deal.stage === 'shoot_booked' && deal.dueDate && deal.dueDate <= today) {
          alerts.push(`${deal.brand}: Deliverable overdue (was due ${deal.dueDate})`);
        }

        // Unpaid invoices older than 14 days
        if (deal.stage === 'invoice_sent' && deal.updatedAt) {
          const sentDate = deal.updatedAt.toDate ? deal.updatedAt.toDate() : new Date(deal.updatedAt);
          const daysSince = Math.floor((Date.now() - sentDate.getTime()) / 86400000);
          if (daysSince > 14) {
            alerts.push(`${deal.brand}: Invoice unpaid for ${daysSince} days`);
          }
        }

        // Deals in negotiation for over 7 days
        if (deal.stage === 'negotiating' && deal.createdAt) {
          const created = deal.createdAt.toDate ? deal.createdAt.toDate() : new Date(deal.createdAt);
          const daysSince = Math.floor((Date.now() - created.getTime()) / 86400000);
          if (daysSince > 7) {
            alerts.push(`${deal.brand}: Still negotiating after ${daysSince} days — follow up?`);
          }
        }
      }

      if (alerts.length > 0 && userData.fcmToken) {
        try {
          await admin.messaging().send({
            token: userData.fcmToken,
            notification: {
              title: `🎬 CreatorTracksy: ${alerts.length} Alert${alerts.length > 1 ? 's' : ''}`,
              body: alerts.slice(0, 3).join(' | '),
            },
            data: { type: 'brand_deal_reminder', count: String(alerts.length) },
          });
          logger.info(`📨 Sent ${alerts.length} creator alerts to ${uid}`);
        } catch (e) {
          logger.warn(`FCM send failed for ${uid}`, e);
        }
      }
    }
  }
);

// ════════════════════════════════════════════════════════════════
//  2. CREATOR AI QUERY (callable)
// ════════════════════════════════════════════════════════════════

const CREATOR_AI_TOOLS: Record<string, { systemPrompt: string; tokenCost: number }> = {
  hook_generator: {
    systemPrompt: `You are a viral content hook specialist for Sri Lankan YouTube and social media creators. Generate attention-grabbing hooks, titles, and opening lines optimized for the Sri Lankan audience and algorithm. Consider Sinhala/Tamil cultural context, trending topics, and platform-specific best practices. Provide 5-10 hook variations with engagement predictions.`,
    tokenCost: 1,
  },
  brand_pitch_writer: {
    systemPrompt: `You are a brand partnership pitch writer for Sri Lankan content creators. Draft professional sponsorship proposals, rate cards, and outreach emails for brands. Include media kit highlights, audience demographics, engagement rates, and deliverable options. Reference Sri Lankan market rates and popular brand categories (telco, FMCG, fintech, fashion).`,
    tokenCost: 2,
  },
  thumbnail_lab: {
    systemPrompt: `You are a YouTube thumbnail optimization expert. Analyze thumbnail concepts described and provide detailed feedback on composition, color psychology, text placement, face positioning, and click-through rate optimization. Suggest A/B testing variations and reference successful thumbnail patterns in the creator's niche.`,
    tokenCost: 1,
  },
  content_repurposer: {
    systemPrompt: `You are a content repurposing strategist for multi-platform creators. Take a long-form content idea or script and break it into platform-specific formats: YouTube Shorts, Instagram Reels, TikTok clips, Twitter threads, LinkedIn posts, and blog excerpts. Optimize each for the platform's algorithm and audience expectations.`,
    tokenCost: 2,
  },
  tax_advisor: {
    systemPrompt: `You are a Sri Lankan tax advisor specializing in content creator income. Provide guidance on: IRD "Service Export" exemptions for foreign income (AdSense, brand deals), CBSL forex conversion rules, gear depreciation schedules (Section 25 of the Inland Revenue Act), deductible business expenses for creators, WHT on local brand deals, and quarterly tax estimates. Reference current IRD regulations and rates.`,
    tokenCost: 2,
  },
  income_proof: {
    systemPrompt: `You are a financial documentation specialist for Sri Lankan content creators. Help draft bank-ready income statements, cashflow summaries, and financial declarations. Format data for bank loan applications, visa applications, lease agreements, and investor presentations. Include proper formatting for LKR and USD amounts with exchange rate documentation.`,
    tokenCost: 2,
  },
};

export const processCreatorAI = onCall(
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

    const toolConfig = CREATOR_AI_TOOLS[tool];
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
      description: `CreatorTracksy AI: ${tool}`,
      status: 'completed',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info(`🎬 Creator AI [${tool}] for ${uid}, cost: ${toolConfig.tokenCost} tokens`);

    return { result: resultText, tokensUsed: toolConfig.tokenCost };
  }
);
