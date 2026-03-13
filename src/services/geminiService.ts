/**
 * Gemini AI Service — Client-Side Proxy
 *
 * SECURITY: All Gemini API calls are routed through Cloud Functions.
 * The API key is NEVER exposed in the browser bundle.
 * This service provides a client interface + local fallback parsing.
 */
import { getFunctions, httpsCallable } from 'firebase/functions';

export interface VoiceCommandResult {
  amount: number;
  category: string;
  description: string;
  date: Date;
  confidence: number;
  language: 'en' | 'si' | 'ta';
  rawTranscript: string;
}

export interface ExpenseContext {
  recentCategories: string[];
  commonMerchants: string[];
  userLanguage: string;
  currency: string;
}

export class GeminiService {
  private functions = getFunctions();

  async processVoiceCommand(
    transcript: string,
    context: ExpenseContext
  ): Promise<VoiceCommandResult> {
    try {
      const processCommand = httpsCallable(this.functions, 'processGeminiVoiceCommand');
      const result = await processCommand({
        transcript,
        language: context.userLanguage,
        recentCategories: context.recentCategories,
        commonMerchants: context.commonMerchants,
        currency: context.currency
      });

      const data = result.data as any;
      return {
        amount: data.amount || 0,
        category: data.category || 'Miscellaneous',
        description: data.description || transcript,
        date: data.date ? new Date(data.date) : new Date(),
        confidence: data.confidence || 0.5,
        language: data.language || 'en',
        rawTranscript: transcript
      };
    } catch (error) {
      console.error('Cloud Function Gemini error, using fallback:', error);
      return this.fallbackProcessing(transcript, context);
    }
  }

  async categorizeExpense(description: string, amount: number): Promise<string> {
    try {
      const categorize = httpsCallable(this.functions, 'categorizeExpenseWithGemini');
      const result = await categorize({ description, amount });
      return (result.data as any).category || this.fallbackCategorization(description, amount);
    } catch (error) {
      console.error('Cloud Function categorization error, using fallback:', error);
      return this.fallbackCategorization(description, amount);
    }
  }

  private fallbackProcessing(transcript: string, context: ExpenseContext): VoiceCommandResult {
    // Basic regex-based parsing as fallback when Cloud Function is unavailable
    const amountPatterns = [
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees|රුපියල්|ரூபாய்|lkr|rs)/i,
      /(?:rupees|රුපියල්|ரூபாய்|lkr|rs)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
    ];

    let amount = 0;
    for (const pattern of amountPatterns) {
      const match = transcript.match(pattern);
      if (match) {
        amount = parseFloat(match[1].replace(/,/g, ''));
        break;
      }
    }

    // Basic category detection
    const categoryKeywords: Record<string, string[]> = {
      'Food': ['food', 'lunch', 'dinner', 'coffee', 'කෑම', 'ආහාර', 'உணவு', 'காப்பி'],
      'Transport': ['taxi', 'bus', 'uber', 'බස්', 'ටැක්සි', 'பஸ்', 'டாக்ஸி'],
      'Shopping': ['shopping', 'buy', 'purchase', 'කරන්න', 'வாங்க', 'கடை'],
      'Bills': ['bill', 'electricity', 'water', 'විදුලි', 'தண்ணீர்', 'மின்'],
    };

    let category = 'Miscellaneous';
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => transcript.toLowerCase().includes(keyword.toLowerCase()))) {
        category = cat;
        break;
      }
    }

    // Detect language
    let language: 'en' | 'si' | 'ta' = 'en';
    if (/[ක-ෆ]/.test(transcript)) language = 'si';
    else if (/[க-ஹ]/.test(transcript)) language = 'ta';

    return {
      amount,
      category,
      description: transcript,
      date: new Date(),
      confidence: amount > 0 ? 0.7 : 0.3,
      language,
      rawTranscript: transcript
    };
  }

  private fallbackCategorization(description: string, amount: number): string {
    const desc = description.toLowerCase();

    if (desc.includes('food') || desc.includes('lunch') || desc.includes('coffee')) return 'Food & Dining';
    if (desc.includes('taxi') || desc.includes('bus') || desc.includes('uber')) return 'Transport';
    if (desc.includes('electricity') || desc.includes('water') || desc.includes('bill')) return 'Bills & Utilities';
    if (amount > 50000) return 'Major Purchase';

    return 'Miscellaneous';
  }

  isAvailable(): boolean {
    // Always available — Cloud Function handles AI, fallback handles offline
    return true;
  }
}

export const geminiService = new GeminiService();
