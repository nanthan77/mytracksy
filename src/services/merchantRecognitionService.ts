import { MerchantInfo, SriLankanMerchants, identifyMerchant } from '../data/sri-lanka/merchants';

export interface MerchantRecognitionResult {
  merchantName: string;
  category: string;
  confidence: number;
  recognizedAs?: string;
  suggestedSubCategory?: string;
  amountPatterns?: string[];
  isFrequentMerchant?: boolean;
  locationHint?: string;
}

export interface MerchantLearningData {
  merchantName: string;
  category: string;
  frequency: number;
  lastSeen: Date;
  userConfirmed: boolean;
  commonAmounts: number[];
  timePatterns: string[];
}

export class MerchantRecognitionService {
  private static instance: MerchantRecognitionService;
  private learningData: Map<string, MerchantLearningData> = new Map();
  private categoryKeywords: Record<string, string[]> = {
    'Groceries': ['super', 'market', 'food', 'grocery', 'keells', 'cargills', 'arpico'],
    'Food & Dining': ['restaurant', 'cafe', 'hotel', 'pizza', 'kfc', 'mcdonalds', 'rice', 'curry'],
    'Fuel': ['fuel', 'petrol', 'diesel', 'gas', 'ceypetco', 'ioc', 'laugfs'],
    'Transport': ['uber', 'pickme', 'taxi', 'bus', 'train', 'transport'],
    'Healthcare': ['pharmacy', 'hospital', 'clinic', 'doctor', 'medical', 'osusala'],
    'Bills & Utilities': ['electricity', 'water', 'phone', 'internet', 'dialog', 'mobitel', 'ceb'],
    'Entertainment': ['cinema', 'movie', 'theater', 'game', 'park', 'mall'],
    'Education': ['school', 'college', 'university', 'tuition', 'book', 'stationery'],
    'Clothing': ['clothing', 'dress', 'shirt', 'fashion', 'textile', 'shoes'],
    'Religious': ['temple', 'church', 'mosque', 'kovil', 'donation', 'religious'],
    'ATM/Banking': ['atm', 'withdrawal', 'bank', 'cash'],
    'Government': ['government', 'tax', 'license', 'passport', 'municipal'],
    'Shopping': ['mall', 'shop', 'store', 'purchase', 'buy']
  };

  private locationKeywords: Record<string, string[]> = {
    'Colombo': ['colombo', 'col', 'fort', 'pettah', 'bambalapitiya', 'wellawatte'],
    'Gampaha': ['gampaha', 'negombo', 'ja-ela', 'wattala', 'kiribathgoda'],
    'Kalutara': ['kalutara', 'panadura', 'horana', 'beruwala'],
    'Kandy': ['kandy', 'peradeniya', 'gampola', 'katugastota'],
    'Kurunegala': ['kurunegala', 'polgahawela', 'kuliyapitiya'],
    'Anuradhapura': ['anuradhapura', 'mihintale'],
    'Polonnaruwa': ['polonnaruwa', 'habarana'],
    'Matara': ['matara', 'mirissa', 'weligama'],
    'Galle': ['galle', 'hikkaduwa', 'unawatuna'],
    'Hambantota': ['hambantota', 'tangalle'],
    'Jaffna': ['jaffna', 'chavakachcheri', 'point pedro'],
    'Batticaloa': ['batticaloa', 'kattankudy'],
    'Trincomalee': ['trincomalee', 'nilaveli']
  };

  private commonSinhalaWords: Record<string, string> = {
    'කඩ': 'shop',
    'හෝටල්': 'hotel',
    'ආපන': 'restaurant',
    'සුපර්': 'super',
    'ඉන්ධන': 'fuel',
    'වෛද්‍ය': 'doctor',
    'ඖසධාගාර': 'pharmacy',
    'විදුලි': 'electricity',
    'ජල': 'water',
    'දුරකථන': 'phone',
    'බස්': 'bus',
    'ක්‍රීඩා': 'sports',
    'පාසල': 'school'
  };

  private commonTamilWords: Record<string, string> = {
    'கடை': 'shop',
    'ஹோட்டல்': 'hotel',
    'உணவகம்': 'restaurant',
    'சூப்பர்': 'super',
    'எரிபொருள்': 'fuel',
    'மருத்துவர்': 'doctor',
    'மருந்தகம்': 'pharmacy',
    'மின்சாரம்': 'electricity',
    'நீர்': 'water',
    'தொலைபேசி': 'phone',
    'பஸ்': 'bus',
    'விளையாட்டு': 'sports',
    'பள்ளி': 'school'
  };

  public static getInstance(): MerchantRecognitionService {
    if (!MerchantRecognitionService.instance) {
      MerchantRecognitionService.instance = new MerchantRecognitionService();
    }
    return MerchantRecognitionService.instance;
  }

  constructor() {
    this.loadLearningData();
  }

  /**
   * Enhanced merchant recognition with AI-powered categorization
   */
  public recognizeMerchant(merchantText: string, amount?: number, timestamp?: Date): MerchantRecognitionResult {
    const cleanText = this.cleanMerchantText(merchantText);
    
    // 1. Try direct merchant recognition first
    const directMatch = identifyMerchant(cleanText);
    if (directMatch && directMatch.confidence > 0.8) {
      return {
        merchantName: directMatch.name,
        category: directMatch.category,
        confidence: directMatch.confidence,
        recognizedAs: 'Known Merchant',
        suggestedSubCategory: this.getSubCategory(directMatch.category, cleanText),
        isFrequentMerchant: this.isFrequentMerchant(cleanText)
      };
    }

    // 2. Check learning data
    const learningMatch = this.checkLearningData(cleanText);
    if (learningMatch) {
      return {
        merchantName: learningMatch.merchantName,
        category: learningMatch.category,
        confidence: learningMatch.userConfirmed ? 0.9 : 0.7,
        recognizedAs: 'Previously Learned',
        isFrequentMerchant: learningMatch.frequency > 3
      };
    }

    // 3. Advanced pattern matching
    const patternMatch = this.advancedPatternMatching(cleanText, amount);
    if (patternMatch.confidence > 0.6) {
      return {
        ...patternMatch,
        locationHint: this.detectLocation(cleanText)
      };
    }

    // 4. AI-powered categorization using keywords
    const aiCategorization = this.aiPoweredCategorization(cleanText, amount);
    
    return {
      merchantName: this.formatMerchantName(cleanText),
      category: aiCategorization.category,
      confidence: aiCategorization.confidence,
      recognizedAs: 'AI Categorized',
      suggestedSubCategory: aiCategorization.subCategory,
      locationHint: this.detectLocation(cleanText)
    };
  }

  /**
   * Advanced pattern matching for merchant recognition
   */
  private advancedPatternMatching(merchantText: string, amount?: number): MerchantRecognitionResult {
    const text = merchantText.toLowerCase();
    
    // Common patterns for different merchant types
    const patterns = [
      {
        pattern: /^(keells|cargills|arpico|laugfs|food city)/i,
        category: 'Groceries',
        confidence: 0.85
      },
      {
        pattern: /(restaurant|hotel|cafe|pizza|kfc|mcdonalds|rice|curry)/i,
        category: 'Food & Dining',
        confidence: 0.75
      },
      {
        pattern: /(fuel|petrol|diesel|gas|ceypetco|ioc|shell)/i,
        category: 'Fuel',
        confidence: 0.9
      },
      {
        pattern: /(uber|pickme|taxi|cab|transport)/i,
        category: 'Transport',
        confidence: 0.8
      },
      {
        pattern: /(pharmacy|medical|hospital|clinic|doctor)/i,
        category: 'Healthcare',
        confidence: 0.8
      },
      {
        pattern: /(dialog|mobitel|hutch|airtel|etisalat)/i,
        category: 'Bills & Utilities',
        confidence: 0.85
      },
      {
        pattern: /(atm|withdrawal|cash)/i,
        category: 'ATM/Banking',
        confidence: 0.9
      },
      {
        pattern: /(temple|church|mosque|kovil|donation)/i,
        category: 'Religious',
        confidence: 0.7
      }
    ];

    for (const { pattern, category, confidence } of patterns) {
      if (pattern.test(text)) {
        return {
          merchantName: this.formatMerchantName(merchantText),
          category,
          confidence,
          recognizedAs: 'Pattern Matched'
        };
      }
    }

    return {
      merchantName: this.formatMerchantName(merchantText),
      category: 'Miscellaneous',
      confidence: 0.3,
      recognizedAs: 'No Pattern Match'
    };
  }

  /**
   * AI-powered categorization using multiple signals
   */
  private aiPoweredCategorization(merchantText: string, amount?: number): {
    category: string;
    confidence: number;
    subCategory?: string;
  } {
    const text = merchantText.toLowerCase();
    const scores: Record<string, number> = {};

    // Score based on keywords
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      scores[category] = score / keywords.length;
    }

    // Apply amount-based scoring
    if (amount) {
      this.applyAmountBasedScoring(scores, amount);
    }

    // Apply time-based scoring
    this.applyTimeBasedScoring(scores);

    // Find the highest scoring category
    const bestCategory = Object.entries(scores).reduce((best, current) => 
      current[1] > best[1] ? current : best
    );

    return {
      category: bestCategory[0],
      confidence: Math.min(bestCategory[1], 1.0),
      subCategory: this.getSubCategory(bestCategory[0], merchantText)
    };
  }

  /**
   * Apply amount-based scoring to improve categorization
   */
  private applyAmountBasedScoring(scores: Record<string, number>, amount: number): void {
    if (amount > 5000) {
      scores['Groceries'] += 0.1;
      scores['Electronics'] += 0.2;
      scores['Clothing'] += 0.15;
    } else if (amount > 2000) {
      scores['Food & Dining'] += 0.15;
      scores['Fuel'] += 0.1;
    } else if (amount > 500) {
      scores['Transport'] += 0.2;
      scores['Food & Dining'] += 0.1;
    } else {
      scores['Snacks'] += 0.1;
      scores['Transport'] += 0.05;
    }
  }

  /**
   * Apply time-based scoring
   */
  private applyTimeBasedScoring(scores: Record<string, number>): void {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour <= 10) {
      // Morning - breakfast, commute
      scores['Food & Dining'] += 0.1;
      scores['Transport'] += 0.15;
    } else if (hour >= 11 && hour <= 14) {
      // Lunch time
      scores['Food & Dining'] += 0.2;
    } else if (hour >= 17 && hour <= 21) {
      // Evening - dinner, groceries
      scores['Food & Dining'] += 0.1;
      scores['Groceries'] += 0.15;
    } else if (hour >= 22 || hour <= 5) {
      // Night - entertainment, late night food
      scores['Entertainment'] += 0.1;
      scores['Food & Dining'] += 0.05;
    }
  }

  /**
   * Get sub-category based on merchant and category
   */
  private getSubCategory(category: string, merchantText: string): string {
    const text = merchantText.toLowerCase();
    
    switch (category) {
      case 'Food & Dining':
        if (text.includes('breakfast') || text.includes('coffee')) return 'Breakfast';
        if (text.includes('lunch')) return 'Lunch';
        if (text.includes('dinner')) return 'Dinner';
        if (text.includes('pizza') || text.includes('kfc') || text.includes('mcdonalds')) return 'Fast Food';
        return 'Restaurant';
      
      case 'Groceries':
        if (text.includes('vegetable') || text.includes('fruit')) return 'Fresh Produce';
        if (text.includes('meat') || text.includes('fish')) return 'Meat & Seafood';
        return 'General Groceries';
      
      case 'Transport':
        if (text.includes('uber') || text.includes('pickme')) return 'Ride Sharing';
        if (text.includes('bus')) return 'Public Transport';
        if (text.includes('fuel') || text.includes('petrol')) return 'Fuel';
        return 'Transportation';
      
      case 'Healthcare':
        if (text.includes('pharmacy') || text.includes('medicine')) return 'Pharmacy';
        if (text.includes('doctor') || text.includes('clinic')) return 'Medical Services';
        return 'Healthcare';
      
      default:
        return category;
    }
  }

  /**
   * Check if merchant is frequent based on learning data
   */
  private isFrequentMerchant(merchantText: string): boolean {
    const learning = this.learningData.get(merchantText.toLowerCase());
    return learning ? learning.frequency > 3 : false;
  }

  /**
   * Detect location from merchant text
   */
  private detectLocation(merchantText: string): string | undefined {
    const text = merchantText.toLowerCase();
    
    for (const [location, keywords] of Object.entries(this.locationKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          return location;
        }
      }
    }
    
    return undefined;
  }

  /**
   * Clean and format merchant text
   */
  private cleanMerchantText(text: string): string {
    return text
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }

  /**
   * Format merchant name for display
   */
  private formatMerchantName(text: string): string {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  /**
   * Check learning data for merchant
   */
  private checkLearningData(merchantText: string): MerchantLearningData | null {
    return this.learningData.get(merchantText.toLowerCase()) || null;
  }

  /**
   * Learn from user interactions
   */
  public learnFromUser(merchantText: string, category: string, amount: number, userConfirmed: boolean = false): void {
    const key = merchantText.toLowerCase();
    const existing = this.learningData.get(key);
    
    if (existing) {
      existing.frequency += 1;
      existing.lastSeen = new Date();
      existing.userConfirmed = existing.userConfirmed || userConfirmed;
      existing.commonAmounts.push(amount);
      if (existing.commonAmounts.length > 10) {
        existing.commonAmounts = existing.commonAmounts.slice(-10);
      }
    } else {
      this.learningData.set(key, {
        merchantName: this.formatMerchantName(merchantText),
        category,
        frequency: 1,
        lastSeen: new Date(),
        userConfirmed,
        commonAmounts: [amount],
        timePatterns: [new Date().getHours().toString()]
      });
    }
    
    this.saveLearningData();
  }

  /**
   * Get merchant suggestions based on partial text
   */
  public getMerchantSuggestions(partialText: string, limit: number = 5): MerchantRecognitionResult[] {
    const suggestions: MerchantRecognitionResult[] = [];
    const text = partialText.toLowerCase();
    
    // Check known merchants
    for (const [key, merchant] of Object.entries(SriLankanMerchants)) {
      if (key.toLowerCase().includes(text) || 
          merchant.alternativeNames?.some(name => name.toLowerCase().includes(text))) {
        suggestions.push({
          merchantName: merchant.name,
          category: merchant.category,
          confidence: merchant.confidence,
          recognizedAs: 'Known Merchant'
        });
      }
    }
    
    // Check learning data
    for (const [key, learning] of this.learningData.entries()) {
      if (key.includes(text)) {
        suggestions.push({
          merchantName: learning.merchantName,
          category: learning.category,
          confidence: learning.userConfirmed ? 0.9 : 0.7,
          recognizedAs: 'Previously Used',
          isFrequentMerchant: learning.frequency > 3
        });
      }
    }
    
    return suggestions.slice(0, limit);
  }

  /**
   * Load learning data from localStorage
   */
  private loadLearningData(): void {
    try {
      const stored = localStorage.getItem('tracksy-merchant-learning');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.learningData = new Map(Object.entries(parsed).map(([key, value]: [string, any]) => [
          key,
          {
            ...value,
            lastSeen: new Date(value.lastSeen)
          }
        ]));
      }
    } catch (error) {
      console.error('Error loading merchant learning data:', error);
    }
  }

  /**
   * Save learning data to localStorage
   */
  private saveLearningData(): void {
    try {
      const data = Object.fromEntries(this.learningData.entries());
      localStorage.setItem('tracksy-merchant-learning', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving merchant learning data:', error);
    }
  }

  /**
   * Get analytics on merchant patterns
   */
  public getMerchantAnalytics(): {
    totalMerchants: number;
    categoriesUsed: string[];
    frequentMerchants: MerchantLearningData[];
    topCategories: Array<{category: string; count: number}>;
  } {
    const categories = new Set<string>();
    const frequentMerchants: MerchantLearningData[] = [];
    const categoryCount: Record<string, number> = {};
    
    for (const learning of this.learningData.values()) {
      categories.add(learning.category);
      if (learning.frequency > 3) {
        frequentMerchants.push(learning);
      }
      categoryCount[learning.category] = (categoryCount[learning.category] || 0) + 1;
    }
    
    const topCategories = Object.entries(categoryCount)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    
    return {
      totalMerchants: this.learningData.size,
      categoriesUsed: Array.from(categories),
      frequentMerchants: frequentMerchants.sort((a, b) => b.frequency - a.frequency),
      topCategories
    };
  }
}

export const merchantRecognitionService = MerchantRecognitionService.getInstance();