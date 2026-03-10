import { offlineStorageService } from './offlineStorageService';

export interface OfflineVoiceModel {
  language: 'en' | 'si' | 'ta';
  patterns: VoicePattern[];
  categories: CategoryPattern[];
  merchants: MerchantPattern[];
  numbers: NumberPattern[];
  currencies: CurrencyPattern[];
}

export interface VoicePattern {
  intent: 'add_expense' | 'show_balance' | 'set_budget' | 'get_summary';
  patterns: string[];
  confidence: number;
}

export interface CategoryPattern {
  category: string;
  patterns: string[];
  confidence: number;
}

export interface MerchantPattern {
  name: string;
  patterns: string[];
  category: string;
  confidence: number;
}

export interface NumberPattern {
  pattern: RegExp;
  language: string;
  transformer: (match: string) => number;
}

export interface CurrencyPattern {
  pattern: RegExp;
  language: string;
  multiplier: number; // For thousands, lakhs, etc.
}

export interface OfflineVoiceResult {
  intent: string;
  amount?: number;
  category?: string;
  merchant?: string;
  description?: string;
  confidence: number;
  language: 'en' | 'si' | 'ta';
  fallback: boolean;
}

export class OfflineVoiceService {
  private static instance: OfflineVoiceService;
  private models: Map<string, OfflineVoiceModel> = new Map();
  private isInitialized: boolean = false;

  public static getInstance(): OfflineVoiceService {
    if (!OfflineVoiceService.instance) {
      OfflineVoiceService.instance = new OfflineVoiceService();
    }
    return OfflineVoiceService.instance;
  }

  constructor() {
    this.initializeOfflineModels();
  }

  /**
   * Initialize offline voice processing models
   */
  private async initializeOfflineModels(): Promise<void> {
    try {
      // Load pre-defined patterns for each language
      await this.loadEnglishModel();
      await this.loadSinhalaModel();
      await this.loadTamilModel();

      // Cache cultural data for offline use
      await this.cacheCulturalContext();

      // Cache merchant data
      await this.cacheMerchantData();

      this.isInitialized = true;
      console.log('Offline voice models initialized successfully');

    } catch (error) {
      console.error('Failed to initialize offline voice models:', error);
    }
  }

  /**
   * Process voice input offline
   */
  public async processOfflineVoice(transcript: string, language: 'en' | 'si' | 'ta' = 'en'): Promise<OfflineVoiceResult> {
    if (!this.isInitialized) {
      await this.initializeOfflineModels();
    }

    const model = this.models.get(language);
    if (!model) {
      throw new Error(`Offline model not available for language: ${language}`);
    }

    console.log(`Processing offline voice: "${transcript}" in ${language}`);

    // Clean and normalize transcript
    const cleanTranscript = this.normalizeTranscript(transcript, language);

    // Extract intent
    const intent = this.extractIntent(cleanTranscript, model);

    // Extract amount
    const amount = this.extractAmount(cleanTranscript, model);

    // Extract category
    const category = this.extractCategory(cleanTranscript, model);

    // Extract merchant
    const merchant = this.extractMerchant(cleanTranscript, model);

    // Generate description
    const description = this.generateDescription(transcript, category, merchant, language);

    // Calculate confidence score
    const confidence = this.calculateConfidence(intent, amount, category, cleanTranscript);

    return {
      intent: intent.intent,
      amount,
      category,
      merchant,
      description,
      confidence,
      language,
      fallback: true // Mark as offline/fallback processing
    };
  }

  /**
   * Check if offline processing is available
   */
  public isOfflineProcessingAvailable(language: 'en' | 'si' | 'ta'): boolean {
    return this.isInitialized && this.models.has(language);
  }

  /**
   * Update offline models with new patterns
   */
  public async updateOfflineModel(language: 'en' | 'si' | 'ta', patterns: Partial<OfflineVoiceModel>): Promise<void> {
    const existingModel = this.models.get(language);
    if (!existingModel) return;

    const updatedModel: OfflineVoiceModel = {
      ...existingModel,
      ...patterns
    };

    this.models.set(language, updatedModel);
  }

  /**
   * Load English voice processing model
   */
  private async loadEnglishModel(): Promise<void> {
    const model: OfflineVoiceModel = {
      language: 'en',
      patterns: [
        {
          intent: 'add_expense',
          patterns: [
            'i spent', 'add expense', 'spent money', 'paid', 'bought', 'expense',
            'i paid', 'cost me', 'charged', 'bill was', 'purchase'
          ],
          confidence: 0.9
        },
        {
          intent: 'show_balance',
          patterns: ['balance', 'how much', 'what is my', 'current balance', 'money left'],
          confidence: 0.95
        },
        {
          intent: 'set_budget',
          patterns: ['set budget', 'budget for', 'limit spending', 'allocate'],
          confidence: 0.9
        }
      ],
      categories: [
        { category: 'Food & Dining', patterns: ['food', 'restaurant', 'coffee', 'lunch', 'dinner', 'meal', 'eat'], confidence: 0.85 },
        { category: 'Transport', patterns: ['taxi', 'bus', 'train', 'uber', 'fuel', 'petrol', 'transport'], confidence: 0.9 },
        { category: 'Groceries', patterns: ['grocery', 'supermarket', 'vegetables', 'fruits', 'shopping'], confidence: 0.85 },
        { category: 'Entertainment', patterns: ['movie', 'cinema', 'game', 'entertainment', 'fun'], confidence: 0.8 },
        { category: 'Healthcare', patterns: ['doctor', 'medicine', 'hospital', 'pharmacy', 'health'], confidence: 0.9 },
        { category: 'Utilities', patterns: ['electricity', 'water', 'internet', 'phone', 'utility'], confidence: 0.9 }
      ],
      merchants: [
        { name: 'Keells', patterns: ['keells', 'keels'], category: 'Groceries', confidence: 0.95 },
        { name: 'Arpico', patterns: ['arpico'], category: 'Shopping', confidence: 0.9 },
        { name: 'Cargills', patterns: ['cargills'], category: 'Groceries', confidence: 0.9 },
        { name: 'McDonald\'s', patterns: ['mcdonald', 'mcdonalds'], category: 'Food & Dining', confidence: 0.95 },
        { name: 'Pizza Hut', patterns: ['pizza hut'], category: 'Food & Dining', confidence: 0.95 }
      ],
      numbers: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g, language: 'en', transformer: (match) => parseFloat(match.replace(/,/g, '')) },
        { pattern: /\b(one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, language: 'en', transformer: this.wordToNumber },
        { pattern: /\b(hundred|thousand|million)\b/gi, language: 'en', transformer: this.wordMultiplierToNumber }
      ],
      currencies: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rupees?|lkr|rs\.?)\b/gi, language: 'en', multiplier: 1 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:thousand)\s*(?:rupees?|lkr|rs\.?)\b/gi, language: 'en', multiplier: 1000 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:lakh)\s*(?:rupees?|lkr|rs\.?)\b/gi, language: 'en', multiplier: 100000 }
      ]
    };

    this.models.set('en', model);
  }

  /**
   * Load Sinhala voice processing model
   */
  private async loadSinhalaModel(): Promise<void> {
    const model: OfflineVoiceModel = {
      language: 'si',
      patterns: [
        {
          intent: 'add_expense',
          patterns: [
            'මම වියදම් කළා', 'වියදම් එකතු කරන්න', 'ගෙවුවා', 'මිල ගත්තා', 'වියදම',
            'මම ගෙව්වා', 'වැය කළා', 'සල්ලි දුන්නා'
          ],
          confidence: 0.85
        },
        {
          intent: 'show_balance',
          patterns: ['ශේෂය', 'කීයක්', 'මගේ ශේෂය', 'සල්ලි තියෙන්නේ'],
          confidence: 0.9
        }
      ],
      categories: [
        { category: 'Food & Dining', patterns: ['කෑම', 'ආහාර', 'කෝපි', 'දිවා ආහාර', 'රාත්‍රී ආහාර'], confidence: 0.8 },
        { category: 'Transport', patterns: ['ට්‍රිප් එක', 'බස්', 'ට්‍රේන්', 'ටැක්සි', 'ඉන්ධන'], confidence: 0.85 },
        { category: 'Groceries', patterns: ['සුපර්මාර්කට්', 'එළවළු', 'පලතුරු', 'ගෙදර කෑම'], confidence: 0.8 }
      ],
      merchants: [
        { name: 'Keells', patterns: ['කීල්ස්', 'කීල්'], category: 'Groceries', confidence: 0.9 },
        { name: 'Arpico', patterns: ['ආර්පිකෝ'], category: 'Shopping', confidence: 0.85 },
        { name: 'Cargills', patterns: ['කාගිල්ස්'], category: 'Groceries', confidence: 0.85 }
      ],
      numbers: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g, language: 'si', transformer: (match) => parseFloat(match.replace(/,/g, '')) },
        { pattern: /\b(එක|දෙක|තුන|හතර|පහ|හය|හත|අට|නවය|දහය)\b/gi, language: 'si', transformer: this.sinhalaWordToNumber }
      ],
      currencies: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:රුපියල්|රු\.?)\b/gi, language: 'si', multiplier: 1 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:දහස)\s*(?:රුපියල්|රු\.?)\b/gi, language: 'si', multiplier: 1000 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ලක්ෂ)\s*(?:රුපියල්|රු\.?)\b/gi, language: 'si', multiplier: 100000 }
      ]
    };

    this.models.set('si', model);
  }

  /**
   * Load Tamil voice processing model
   */
  private async loadTamilModel(): Promise<void> {
    const model: OfflineVoiceModel = {
      language: 'ta',
      patterns: [
        {
          intent: 'add_expense',
          patterns: [
            'நான் செலவு செய்தேன்', 'செலவு சேர்க்க', 'பணம் கொடுத்தேன்', 'வாங்கினேன்', 'செலவு',
            'நான் கொடுத்தேன்', 'செலவழித்தேன்'
          ],
          confidence: 0.85
        },
        {
          intent: 'show_balance',
          patterns: ['மீதம்', 'எவ்வளவு', 'என் மீதம்', 'பணம் இருக்கிறது'],
          confidence: 0.9
        }
      ],
      categories: [
        { category: 'Food & Dining', patterns: ['உணவு', 'சாப்பாடு', 'காபி', 'மதிய உணவு', 'இரவு உணவு'], confidence: 0.8 },
        { category: 'Transport', patterns: ['பயணம்', 'பஸ்', 'ரயில்', 'டாக்ஸி', 'எரிபொருள்'], confidence: 0.85 },
        { category: 'Groceries', patterns: ['கடை', 'காய்கறி', 'பழம்', 'வீட்டு உணவு'], confidence: 0.8 }
      ],
      merchants: [
        { name: 'Keells', patterns: ['கீல்ஸ்'], category: 'Groceries', confidence: 0.9 },
        { name: 'Arpico', patterns: ['ஆர்பிகோ'], category: 'Shopping', confidence: 0.85 },
        { name: 'Cargills', patterns: ['கார்கில்ஸ்'], category: 'Groceries', confidence: 0.85 }
      ],
      numbers: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\b/g, language: 'ta', transformer: (match) => parseFloat(match.replace(/,/g, '')) },
        { pattern: /\b(ஒன்று|இரண்டு|மூன்று|நான்கு|ஐந்து|ஆறு|ஏழு|எட்டு|ஒன்பது|பத்து)\b/gi, language: 'ta', transformer: this.tamilWordToNumber }
      ],
      currencies: [
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ரூபாய்|ரூ\.?)\b/gi, language: 'ta', multiplier: 1 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:ஆயிரம்)\s*(?:ரூபாய்|ரூ\.?)\b/gi, language: 'ta', multiplier: 1000 },
        { pattern: /\b(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:லட்சம்)\s*(?:ரூபாய்|ரூ\.?)\b/gi, language: 'ta', multiplier: 100000 }
      ]
    };

    this.models.set('ta', model);
  }

  /**
   * Cache cultural context for offline use
   */
  private async cacheCulturalContext(): Promise<void> {
    const culturalData = {
      festivals: [
        { name: 'Avurudu', categories: ['Food & Dining', 'Gifts', 'Decorations'], multiplier: 3.0 },
        { name: 'Vesak', categories: ['Food & Dining', 'Donations', 'Decorations'], multiplier: 2.5 },
        { name: 'Christmas', categories: ['Food & Dining', 'Gifts', 'Decorations'], multiplier: 2.5 },
        { name: 'Poya', categories: ['Food & Dining', 'Donations'], multiplier: 1.5 }
      ],
      poyaDays: ['2024-01-25', '2024-02-24', '2024-03-25'], // Sample dates
      categories: [
        'Temple Donations', 'Festival Food', 'Traditional Gifts', 'Poya Day Expenses',
        'Religious Items', 'Cultural Celebrations'
      ]
    };

    await offlineStorageService.cacheCulturalData(culturalData);
  }

  /**
   * Cache merchant data for offline recognition
   */
  private async cacheMerchantData(): Promise<void> {
    const merchants = [
      { name: 'Keells Super', category: 'Groceries', confidence: 0.95 },
      { name: 'Arpico Supercenter', category: 'Shopping', confidence: 0.9 },
      { name: 'Cargills Food City', category: 'Groceries', confidence: 0.9 },
      { name: 'Laugfs Gas', category: 'Utilities', confidence: 0.9 },
      { name: 'Dialog', category: 'Telecommunications', confidence: 0.95 },
      { name: 'Mobitel', category: 'Telecommunications', confidence: 0.95 },
      { name: 'SLT', category: 'Telecommunications', confidence: 0.9 },
      { name: 'Ceylon Electricity Board', category: 'Utilities', confidence: 0.95 },
      { name: 'National Water Supply', category: 'Utilities', confidence: 0.9 },
      { name: 'Pizza Hut', category: 'Food & Dining', confidence: 0.95 },
      { name: 'KFC', category: 'Food & Dining', confidence: 0.95 },
      { name: 'McDonald\'s', category: 'Food & Dining', confidence: 0.95 },
      { name: 'Subway', category: 'Food & Dining', confidence: 0.9 },
      { name: 'Domino\'s', category: 'Food & Dining', confidence: 0.9 }
    ];

    await offlineStorageService.cacheMerchantData(merchants);
  }

  // Private helper methods

  private normalizeTranscript(transcript: string, language: 'en' | 'si' | 'ta'): string {
    return transcript.toLowerCase().trim();
  }

  private extractIntent(transcript: string, model: OfflineVoiceModel): VoicePattern {
    let bestMatch: VoicePattern = model.patterns[0];
    let bestScore = 0;

    for (const pattern of model.patterns) {
      for (const phrase of pattern.patterns) {
        if (transcript.includes(phrase.toLowerCase())) {
          const score = pattern.confidence * (phrase.length / transcript.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = pattern;
          }
        }
      }
    }

    return bestMatch;
  }

  private extractAmount(transcript: string, model: OfflineVoiceModel): number | undefined {
    // Try currency patterns first
    for (const currencyPattern of model.currencies) {
      const matches = transcript.match(currencyPattern.pattern);
      if (matches && matches[1]) {
        const baseAmount = parseFloat(matches[1].replace(/,/g, ''));
        return baseAmount * currencyPattern.multiplier;
      }
    }

    // Try number patterns
    for (const numberPattern of model.numbers) {
      const matches = transcript.match(numberPattern.pattern);
      if (matches && matches[1]) {
        return numberPattern.transformer(matches[1]);
      }
    }

    return undefined;
  }

  private extractCategory(transcript: string, model: OfflineVoiceModel): string | undefined {
    let bestMatch: CategoryPattern | undefined;
    let bestScore = 0;

    for (const category of model.categories) {
      for (const pattern of category.patterns) {
        if (transcript.includes(pattern.toLowerCase())) {
          const score = category.confidence * (pattern.length / transcript.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = category;
          }
        }
      }
    }

    return bestMatch?.category;
  }

  private extractMerchant(transcript: string, model: OfflineVoiceModel): string | undefined {
    let bestMatch: MerchantPattern | undefined;
    let bestScore = 0;

    for (const merchant of model.merchants) {
      for (const pattern of merchant.patterns) {
        if (transcript.includes(pattern.toLowerCase())) {
          const score = merchant.confidence * (pattern.length / transcript.length);
          if (score > bestScore) {
            bestScore = score;
            bestMatch = merchant;
          }
        }
      }
    }

    return bestMatch?.name;
  }

  private generateDescription(transcript: string, category?: string, merchant?: string, language: 'en' | 'si' | 'ta' = 'en'): string {
    const templates = {
      en: {
        withMerchant: `${category || 'Expense'} at ${merchant}`,
        withCategory: `${category} expense`,
        generic: 'Voice expense (offline)'
      },
      si: {
        withMerchant: `${merchant} වෙතින් ${category || 'වියදම'}`,
        withCategory: `${category} වියදම`,
        generic: 'හඬ වියදම (offline)'
      },
      ta: {
        withMerchant: `${merchant} இல் ${category || 'செலவு'}`,
        withCategory: `${category} செலவு`,
        generic: 'குரல் செலவு (offline)'
      }
    };

    const template = templates[language];

    if (merchant && category) {
      return template.withMerchant;
    } else if (category) {
      return template.withCategory;
    } else {
      return template.generic;
    }
  }

  private calculateConfidence(intent: VoicePattern, amount?: number, category?: string, transcript?: string): number {
    let confidence = intent.confidence * 0.5; // Base intent confidence (50% weight)

    if (amount !== undefined) confidence += 0.3; // Amount found (30% weight)
    if (category) confidence += 0.15; // Category found (15% weight)
    if (transcript && transcript.length > 10) confidence += 0.05; // Reasonable length (5% weight)

    return Math.min(confidence, 0.95); // Cap at 95% for offline processing
  }

  // Number conversion helpers

  private wordToNumber(word: string): number {
    const numbers: Record<string, number> = {
      'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
      'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
    };
    return numbers[word.toLowerCase()] || 0;
  }

  private wordMultiplierToNumber(word: string): number {
    const multipliers: Record<string, number> = {
      'hundred': 100, 'thousand': 1000, 'million': 1000000
    };
    return multipliers[word.toLowerCase()] || 1;
  }

  private sinhalaWordToNumber(word: string): number {
    const numbers: Record<string, number> = {
      'එක': 1, 'දෙක': 2, 'තුන': 3, 'හතර': 4, 'පහ': 5,
      'හය': 6, 'හත': 7, 'අට': 8, 'නවය': 9, 'දහය': 10
    };
    return numbers[word] || 0;
  }

  private tamilWordToNumber(word: string): number {
    const numbers: Record<string, number> = {
      'ஒன்று': 1, 'இரண்டு': 2, 'மூன்று': 3, 'நான்கு': 4, 'ஐந்து': 5,
      'ஆறு': 6, 'ஏழு': 7, 'எட்டு': 8, 'ஒன்பது': 9, 'பத்து': 10
    };
    return numbers[word] || 0;
  }
}

export const offlineVoiceService = OfflineVoiceService.getInstance();