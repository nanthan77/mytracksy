import { 
  SriLankanCalendar2024, 
  CulturalEvent, 
  getUpcomingEvents,
  getEventByDate,
  getCulturalCategories,
  isSpecialDay,
  getSpecialDayInfo
} from '../data/sri-lanka/cultural-events';

export interface CulturalContext {
  currentEvent?: CulturalEvent;
  upcomingEvents: CulturalEvent[];
  suggestedCategories: string[];
  culturalMessage?: string;
  expenseMultiplier?: number; // 1.0 = normal, 1.5 = festival season
  language: 'en' | 'si' | 'ta';
}

export interface CulturalExpenseEnhancement {
  originalCategory: string;
  suggestedCategory?: string;
  culturalContext?: string;
  seasonalAdjustment?: number;
  festivalType?: string;
  traditionalAlternatives?: string[];
}

export interface VoiceCommandEnhancement {
  originalText: string;
  culturallyEnhancedText: string;
  addedContext: string[];
  detectedFestival?: string;
  suggestedAmount?: number;
  culturalNotes?: string;
}

export class CulturalIntegrationService {
  private static instance: CulturalIntegrationService;
  private currentLanguage: 'en' | 'si' | 'ta' = 'en';

  // Cultural keywords and their contexts
  private culturalKeywords = {
    en: {
      vesak: ['vesak', 'buddha', 'lantern', 'pandol', 'dana', 'temple'],
      avurudu: ['avurudu', 'new year', 'kiribath', 'oil lamp', 'game', 'traditional'],
      poya: ['poya', 'full moon', 'temple', 'meditation', 'religious'],
      eid: ['eid', 'ramadan', 'mosque', 'zakat', 'iftar'],
      christmas: ['christmas', 'church', 'carol', 'decoration'],
      wedding: ['wedding', 'ceremony', 'reception', 'marriage']
    },
    si: {
      vesak: ['වෙසක්', 'බුදු', 'කූඩුව', 'පන්දොල්', 'දානය', 'පන්සල'],
      avurudu: ['අවුරුදු', 'කිරිබත්', 'ගින්න', 'ක්‍රීඩා', 'සම්ප්‍රදායික'],
      poya: ['පෝය', 'පූර්ණිමා', 'පන්සල', 'භාවනා', 'ධර්මය'],
      wedding: ['මගුල්', 'උත්සවය', 'ආගමන', 'විවාහය']
    },
    ta: {
      vesak: ['வேசாக்', 'புத்தர்', 'விளக்கு', 'பந்தோல்', 'தானம்', 'கோயில்'],
      avurudu: ['அவுරුது', 'கிரிபத்', 'எண்ணெய் விளக்கு', 'விளையாட்டு'],
      poya: ['பௌர்ணமி', 'கோயில்', 'தியானம்', 'மதம்'],
      wedding: ['திருமணம்', 'விழா', 'வரவேற்பு']
    }
  };

  // Festival expense patterns
  private festivalExpensePatterns = {
    vesak: {
      typical: ['lanterns', 'decorations', 'dana', 'religious items', 'charity'],
      amounts: { low: 500, medium: 2000, high: 5000 },
      multiplier: 1.5
    },
    avurudu: {
      typical: ['traditional food', 'new clothes', 'gifts', 'house cleaning', 'oil lamp'],
      amounts: { low: 1000, medium: 5000, high: 15000 },
      multiplier: 2.0
    },
    poya: {
      typical: ['temple donations', 'religious activities', 'traditional food'],
      amounts: { low: 200, medium: 1000, high: 3000 },
      multiplier: 1.2
    },
    eid: {
      typical: ['new clothes', 'special food', 'zakat', 'gifts', 'family visits'],
      amounts: { low: 1000, medium: 4000, high: 12000 },
      multiplier: 1.8
    },
    christmas: {
      typical: ['decorations', 'gifts', 'special food', 'church donations'],
      amounts: { low: 800, medium: 3000, high: 10000 },
      multiplier: 1.6
    }
  };

  public static getInstance(): CulturalIntegrationService {
    if (!CulturalIntegrationService.instance) {
      CulturalIntegrationService.instance = new CulturalIntegrationService();
    }
    return CulturalIntegrationService.instance;
  }

  public setLanguage(language: 'en' | 'si' | 'ta'): void {
    this.currentLanguage = language;
  }

  /**
   * Get current cultural context for enhanced expense categorization
   */
  public getCurrentCulturalContext(): CulturalContext {
    const today = new Date();
    const currentEvent = getSpecialDayInfo(today);
    const upcomingEvents = getUpcomingEvents(7); // Next 7 days
    
    // Determine if we're in a festival season
    const isInFestivalSeason = this.isInFestivalSeason(today);
    const expenseMultiplier = isInFestivalSeason ? 1.5 : 1.0;

    // Get culturally relevant expense categories
    const suggestedCategories = this.getCulturallyRelevantCategories(today);

    // Generate cultural message
    const culturalMessage = this.generateCulturalMessage(currentEvent, upcomingEvents);

    return {
      currentEvent,
      upcomingEvents,
      suggestedCategories,
      culturalMessage,
      expenseMultiplier,
      language: this.currentLanguage
    };
  }

  /**
   * Enhance expense categorization with cultural context
   */
  public enhanceExpenseWithCulturalContext(
    amount: number, 
    description: string, 
    category: string,
    date?: Date
  ): CulturalExpenseEnhancement {
    const expenseDate = date || new Date();
    const event = getSpecialDayInfo(expenseDate);
    
    let enhancement: CulturalExpenseEnhancement = {
      originalCategory: category
    };

    if (event) {
      // Check if the expense fits cultural patterns
      const culturalMatch = this.detectCulturalExpense(description, event);
      
      if (culturalMatch) {
        enhancement.suggestedCategory = culturalMatch.category;
        enhancement.culturalContext = `${event.name} - ${event.significance}`;
        enhancement.festivalType = event.type;
        enhancement.seasonalAdjustment = this.getSeasonalAdjustment(event, amount);
        enhancement.traditionalAlternatives = this.getTraditionalAlternatives(culturalMatch.category);
      }
    }

    return enhancement;
  }

  /**
   * Enhance voice commands with cultural awareness
   */
  public enhanceVoiceCommandWithCulture(voiceText: string): VoiceCommandEnhancement {
    const context = this.getCurrentCulturalContext();
    const addedContext: string[] = [];
    let enhancedText = voiceText;
    let detectedFestival: string | undefined;
    let suggestedAmount: number | undefined;
    let culturalNotes: string | undefined;

    // Detect cultural keywords in voice command
    const keywords = this.culturalKeywords[this.currentLanguage];
    
    for (const [festival, festivalKeywords] of Object.entries(keywords)) {
      for (const keyword of festivalKeywords) {
        if (voiceText.toLowerCase().includes(keyword.toLowerCase())) {
          detectedFestival = festival;
          addedContext.push(`Detected ${festival} context`);
          
          // Add cultural suggestions
          const pattern = this.festivalExpensePatterns[festival as keyof typeof this.festivalExpensePatterns];
          if (pattern) {
            suggestedAmount = pattern.amounts.medium;
            culturalNotes = `Typical ${festival} expense range: ${pattern.amounts.low} - ${pattern.amounts.high} LKR`;
          }
          break;
        }
      }
      if (detectedFestival) break;
    }

    // Add current event context if relevant
    if (context.currentEvent && !detectedFestival) {
      addedContext.push(`Today is ${context.currentEvent.name}`);
      enhancedText += ` (${context.currentEvent.name} context)`;
    }

    // Add upcoming event awareness
    if (context.upcomingEvents.length > 0 && !detectedFestival) {
      const nextEvent = context.upcomingEvents[0];
      const daysUntil = Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      addedContext.push(`${nextEvent.name} in ${daysUntil} days`);
    }

    return {
      originalText: voiceText,
      culturallyEnhancedText: enhancedText,
      addedContext,
      detectedFestival,
      suggestedAmount,
      culturalNotes
    };
  }

  /**
   * Get culturally appropriate expense suggestions
   */
  public getCulturalExpenseSuggestions(date?: Date): Array<{
    category: string;
    description: string;
    typicalAmount: number;
    culturalSignificance: string;
  }> {
    const checkDate = date || new Date();
    const event = getSpecialDayInfo(checkDate);
    
    if (!event) return [];

    return event.expenseCategories.map(category => {
      const pattern = this.getFestivalPattern(event.name);
      return {
        category,
        description: this.getLocalizedDescription(category, event.name),
        typicalAmount: pattern?.amounts.medium || 1000,
        culturalSignificance: event.significance
      };
    });
  }

  /**
   * Generate voice responses with cultural awareness
   */
  public generateCulturalVoiceResponse(
    expenseAmount: number, 
    category: string, 
    merchantName?: string
  ): string {
    const context = this.getCurrentCulturalContext();
    const responses = this.getLocalizedResponses();
    
    let response = responses.basic.replace('{amount}', expenseAmount.toString()).replace('{category}', category);
    
    if (context.currentEvent) {
      const eventResponse = responses.cultural[context.currentEvent.type] || responses.cultural.default;
      response += ` ${eventResponse.replace('{event}', context.currentEvent.name)}`;
    }

    // Add seasonal context
    if (context.expenseMultiplier > 1.2) {
      response += ` ${responses.seasonal}`;
    }

    return response;
  }

  /**
   * Get cultural budget recommendations
   */
  public getCulturalBudgetRecommendations(): Array<{
    period: string;
    event: string;
    suggestedBudget: number;
    categories: string[];
    priority: 'high' | 'medium' | 'low';
  }> {
    const upcomingEvents = getUpcomingEvents(90); // Next 3 months
    
    return upcomingEvents.map(event => {
      const pattern = this.getFestivalPattern(event.name);
      const priority = this.getEventPriority(event);
      
      return {
        period: event.date,
        event: event.name,
        suggestedBudget: pattern?.amounts.high || 5000,
        categories: event.expenseCategories,
        priority
      };
    }).filter(rec => rec.priority !== 'low');
  }

  // Private helper methods

  private isInFestivalSeason(date: Date): boolean {
    const month = date.getMonth() + 1;
    
    // Festival-heavy months in Sri Lanka
    const festivalMonths = [4, 5, 12]; // April (Avurudu), May (Vesak), December (Christmas)
    return festivalMonths.includes(month);
  }

  private getCulturallyRelevantCategories(date: Date): string[] {
    const event = getSpecialDayInfo(date);
    if (event) {
      return event.expenseCategories;
    }
    
    // Check if we're close to any major events
    const upcomingEvents = getUpcomingEvents(7);
    if (upcomingEvents.length > 0) {
      return upcomingEvents[0].expenseCategories;
    }
    
    return getCulturalCategories();
  }

  private generateCulturalMessage(currentEvent?: CulturalEvent, upcomingEvents?: CulturalEvent[]): string {
    if (currentEvent) {
      return `Today is ${currentEvent.name}. Consider expenses for ${currentEvent.expenseCategories.join(', ')}.`;
    }
    
    if (upcomingEvents && upcomingEvents.length > 0) {
      const nextEvent = upcomingEvents[0];
      const daysUntil = Math.ceil((new Date(nextEvent.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      return `${nextEvent.name} is in ${daysUntil} days. Plan for ${nextEvent.expenseCategories.slice(0, 3).join(', ')}.`;
    }
    
    return 'Track your daily expenses with cultural awareness.';
  }

  private detectCulturalExpense(description: string, event: CulturalEvent): { category: string } | null {
    const lowerDesc = description.toLowerCase();
    
    for (const category of event.expenseCategories) {
      const categoryKeywords = this.getCategoryKeywords(category);
      if (categoryKeywords.some(keyword => lowerDesc.includes(keyword.toLowerCase()))) {
        return { category };
      }
    }
    
    return null;
  }

  private getCategoryKeywords(category: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'Religious Activities': ['temple', 'poya', 'dana', 'meditation', 'prayer'],
      'Traditional Food': ['kiribath', 'kavum', 'kokis', 'traditional', 'festival food'],
      'New Clothes': ['dress', 'saree', 'shirt', 'clothing', 'traditional wear'],
      'Vesak Lanterns': ['lantern', 'vesak', 'kududu', 'pandol', 'decoration'],
      'Temple Donations': ['donation', 'dana', 'temple', 'offering', 'charity'],
      'Gifts': ['gift', 'present', 'souvenir']
    };
    
    return keywordMap[category] || [category.toLowerCase()];
  }

  private getSeasonalAdjustment(event: CulturalEvent, amount: number): number {
    const pattern = this.getFestivalPattern(event.name);
    if (!pattern) return 1.0;
    
    // Return adjustment factor based on typical spending
    if (amount < pattern.amounts.low) return 0.8;
    if (amount > pattern.amounts.high) return 1.2;
    return 1.0;
  }

  private getTraditionalAlternatives(category: string): string[] {
    const alternatives: Record<string, string[]> = {
      'Traditional Food': ['Home-cooked meals', 'Family recipes', 'Community kitchen'],
      'New Clothes': ['Traditional clothing', 'Handloom fabrics', 'Local tailors'],
      'Decorations': ['Handmade items', 'Natural materials', 'Community decorations'],
      'Religious Items': ['Temple items', 'Blessed artifacts', 'Traditional offerings']
    };
    
    return alternatives[category] || [];
  }

  private getFestivalPattern(eventName: string): typeof this.festivalExpensePatterns[keyof typeof this.festivalExpensePatterns] | null {
    const patterns = this.festivalExpensePatterns;
    
    if (eventName.toLowerCase().includes('vesak')) return patterns.vesak;
    if (eventName.toLowerCase().includes('avurudu') || eventName.toLowerCase().includes('new year')) return patterns.avurudu;
    if (eventName.toLowerCase().includes('poya')) return patterns.poya;
    if (eventName.toLowerCase().includes('eid')) return patterns.eid;
    if (eventName.toLowerCase().includes('christmas')) return patterns.christmas;
    
    return null;
  }

  private getEventPriority(event: CulturalEvent): 'high' | 'medium' | 'low' {
    const highPriority = ['Vesak Poya', 'Sinhala Tamil New Year', 'Eid al-Fitr', 'Christmas'];
    const mediumPriority = ['Poson Poya', 'Esala Poya', 'Good Friday', 'Eid al-Adha'];
    
    if (highPriority.some(name => event.name.includes(name))) return 'high';
    if (mediumPriority.some(name => event.name.includes(name))) return 'medium';
    return 'low';
  }

  private getLocalizedDescription(category: string, eventName: string): string {
    const descriptions: Record<string, Record<string, string>> = {
      en: {
        'Vesak Lanterns': `Traditional lanterns for ${eventName}`,
        'Traditional Food': `Special food for ${eventName}`,
        'New Clothes': `New clothes for ${eventName} celebration`,
        'Temple Donations': `Religious donations for ${eventName}`
      },
      si: {
        'Vesak Lanterns': `${eventName} සඳහා සම්ප්‍රදායික කූඩු`,
        'Traditional Food': `${eventName} සඳහා විශේෂ ආහාර`,
        'New Clothes': `${eventName} සමරුව සඳහා නව ඇඳුම්`,
        'Temple Donations': `${eventName} සඳහා පන්සල් දානය`
      },
      ta: {
        'Vesak Lanterns': `${eventName} க்கான பாரம்பரிய விளக்குகள்`,
        'Traditional Food': `${eventName} க்கான சிறப்பு உணவு`,
        'New Clothes': `${eventName} கொண்டாட்டத்திற்கான புதிய ஆடைகள்`,
        'Temple Donations': `${eventName} க்கான கோயில் நன்கொடைகள்`
      }
    };
    
    return descriptions[this.currentLanguage]?.[category] || category;
  }

  private getLocalizedResponses(): any {
    const responses = {
      en: {
        basic: 'Added {amount} LKR expense for {category}',
        cultural: {
          poya: 'May your {event} be blessed with merit',
          festival: 'Wishing you joy during {event}',
          religious: 'Your {event} offering has been recorded',
          default: 'Your {event} expense has been added'
        },
        seasonal: 'Remember to budget wisely during festival season'
      },
      si: {
        basic: '{category} සඳහා {amount} රුපියල් වියදම එකතු කරන ලදී',
        cultural: {
          poya: 'ඔබගේ {event} පින් පිරිමෙන් යුතු වේවා',
          festival: '{event} ආශීර්වාද ලැබේවා',
          religious: 'ඔබගේ {event} පූජාව සටහන් කර ගන්නා ලදී',
          default: 'ඔබගේ {event} වියදම එකතු කරන ලදී'
        },
        seasonal: 'උත්සව කාලයේදී අයවැය කළමනාකරණය කිරීමට මතක් කරන්න'
      },
      ta: {
        basic: '{category} க்கு {amount} ரூபாய் செலவு சேர்க்கப்பட்டது',
        cultural: {
          poya: 'உங்கள் {event} புண்ணியத்தால் நிறைந்திருக்கட்டும்',
          festival: '{event} இல் மகிழ்ச்சி கிடைக்கட்டும்',
          religious: 'உங்கள் {event} பிரார்த்தனை பதிவு செய்யப்பட்டது',
          default: 'உங்கள் {event} செலவு சேர்க்கப்பட்டது'
        },
        seasonal: 'பண்டிகை காலத்தில் வரவு செலவை கவனமாக நிர்வகிக்கவும்'
      }
    };
    
    return responses[this.currentLanguage];
  }
}

export const culturalIntegrationService = CulturalIntegrationService.getInstance();