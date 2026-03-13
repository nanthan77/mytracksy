import * as functions from 'firebase-functions';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

// SECURITY: API key stored in Firebase Secret Manager — never exposed to clients
const geminiApiKey = defineSecret('GEMINI_API_KEY');

interface VoiceCommandRequest {
  transcript: string;
  language: string;
  recentCategories: string[];
  commonMerchants: string[];
  currency: string;
}

interface CategorizeRequest {
  description: string;
  amount: number;
}

/**
 * Process a voice command transcript using Gemini AI (server-side only).
 * The Gemini API key never leaves the server.
 */
export const processGeminiVoiceCommand = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    // Require authentication
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in to use voice commands.');
    }

    const { transcript, language, recentCategories, currency } = request.data as VoiceCommandRequest;

    if (!transcript || typeof transcript !== 'string') {
      throw new HttpsError('invalid-argument', 'transcript is required and must be a string.');
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured on server.');
    }

    try {
      // Dynamic import to avoid bundling issues
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = buildVoicePrompt(transcript, language || 'en', recentCategories || [], currency || 'LKR');
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return parseGeminiResponse(text, transcript);
    } catch (error: any) {
      functions.logger.error('Gemini voice command error:', error);
      throw new HttpsError('internal', 'Failed to process voice command.');
    }
  }
);

/**
 * Categorize an expense description using Gemini AI (server-side only).
 */
export const categorizeExpenseWithGemini = onCall(
  { secrets: [geminiApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'You must be logged in.');
    }

    const { description, amount } = request.data as CategorizeRequest;

    if (!description || typeof description !== 'string') {
      throw new HttpsError('invalid-argument', 'description is required.');
    }

    const apiKey = geminiApiKey.value();
    if (!apiKey) {
      throw new HttpsError('failed-precondition', 'Gemini API key not configured on server.');
    }

    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const prompt = `
Categorize this Sri Lankan expense:
Description: "${description}"
Amount: LKR ${amount}

Choose the best category from:
- Food & Dining
- Transport
- Shopping
- Bills & Utilities
- Healthcare
- Entertainment
- Education
- Religious/Donations
- Family Support
- Business Expenses

Respond with just the category name.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return { category: response.text().trim() };
    } catch (error: any) {
      functions.logger.error('Gemini categorization error:', error);
      throw new HttpsError('internal', 'Failed to categorize expense.');
    }
  }
);

function buildVoicePrompt(
  transcript: string,
  language: string,
  recentCategories: string[],
  currency: string
): string {
  return `
You are an AI assistant for a Sri Lankan expense tracking app. Parse this voice command and extract expense information.

Voice Input: "${transcript}"
User Language: ${language}
Currency: ${currency}
Recent Categories: ${recentCategories.join(', ')}

Extract:
1. Amount (in LKR, convert if needed)
2. Category (Food, Transport, Shopping, Bills, etc.)
3. Description
4. Date (default to today if not specified)
5. Confidence score (0-1)

Support these languages:
- English: "I spent 500 rupees on coffee"
- Sinhala: "මම කෝපි එකට රුපියල් 500ක් වියදම් කළා"
- Tamil: "நான் காப்பிக்கு 500 ரூபாய் செலவழித்தேன்"

Respond in this exact JSON format:
{
  "amount": number,
  "category": "string",
  "description": "string",
  "date": "YYYY-MM-DD",
  "confidence": number,
  "language": "en|si|ta"
}
  `;
}

function parseGeminiResponse(response: string, originalTranscript: string): any {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      amount: parsed.amount || 0,
      category: parsed.category || 'Miscellaneous',
      description: parsed.description || originalTranscript,
      date: parsed.date || new Date().toISOString().split('T')[0],
      confidence: parsed.confidence || 0.5,
      language: parsed.language || 'en',
      rawTranscript: originalTranscript
    };
  } catch (error) {
    functions.logger.error('Failed to parse Gemini response:', error);
    return {
      amount: 0,
      category: 'Miscellaneous',
      description: originalTranscript,
      date: new Date().toISOString().split('T')[0],
      confidence: 0.3,
      language: 'en',
      rawTranscript: originalTranscript,
      parseError: true
    };
  }
}
