import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor() {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured. Voice enhancement features will be limited.');
      this.genAI = null as any;
      this.model = null as any;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async processVoiceCommand(
    transcript: string, 
    context: ExpenseContext
  ): Promise<VoiceCommandResult> {
    if (!this.model) {
      // Fallback to basic parsing when Gemini is not available
      return this.fallbackProcessing(transcript, context);
    }

    try {
      const prompt = this.buildPrompt(transcript, context);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text, transcript);
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.fallbackProcessing(transcript, context);
    }
  }

  private buildPrompt(transcript: string, context: ExpenseContext): string {
    return `
You are an AI assistant for a Sri Lankan expense tracking app. Parse this voice command and extract expense information.

Voice Input: "${transcript}"
User Language: ${context.userLanguage}
Currency: ${context.currency}
Recent Categories: ${context.recentCategories.join(', ')}

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

  private parseGeminiResponse(response: string, originalTranscript: string): VoiceCommandResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        amount: parsed.amount || 0,
        category: parsed.category || 'Miscellaneous',
        description: parsed.description || originalTranscript,
        date: parsed.date ? new Date(parsed.date) : new Date(),
        confidence: parsed.confidence || 0.5,
        language: parsed.language || 'en',
        rawTranscript: originalTranscript
      };
    } catch (error) {
      console.error('Failed to parse Gemini response:', error);
      return this.fallbackProcessing(originalTranscript, {} as ExpenseContext);
    }
  }

  private fallbackProcessing(transcript: string, context: ExpenseContext): VoiceCommandResult {
    // Basic regex-based parsing as fallback
    const amountPatterns = [
      /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees|රුපියල්|ரூபாய்|lkr|rs)/i,
      /(?:rupees|රුපියල්|ரூபாய්|lkr|rs)\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/i
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
    const categoryKeywords = {
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

  async categorizeExpense(description: string, amount: number): Promise<string> {
    if (!this.model) {
      return this.fallbackCategorization(description, amount);
    }

    try {
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

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Categorization error:', error);
      return this.fallbackCategorization(description, amount);
    }
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
    return this.model !== null;
  }
}

export const geminiService = new GeminiService();