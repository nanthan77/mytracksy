// Advanced AI Categorization Service with Machine Learning
// Phase 8: Smart expense categorization and predictive analytics

import { GeminiService } from './geminiService';

export interface ExpensePattern {
  id: string;
  description: string;
  merchant: string;
  amount: number;
  category: string;
  confidence: number;
  userId: string;
  timestamp: Date;
  location?: string;
  paymentMethod: string;
  tags: string[];
  culturalContext?: string;
}

export interface CategoryPrediction {
  category: string;
  confidence: number;
  reasoning: string;
  subcategory?: string;
  suggestedTags: string[];
  fraudRisk?: number;
  budgetImpact?: string;
}

export interface MLTrainingData {
  features: number[];
  label: string;
  weight: number;
}

export interface AIInsight {
  type: 'spending_pattern' | 'budget_warning' | 'saving_opportunity' | 'fraud_alert' | 'cultural_insight';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  recommendations: string[];
  data?: any;
}

export class AICategorization {
  private static instance: AICategorization;
  private geminiService: GeminiService;
  private trainingData: Map<string, ExpensePattern[]> = new Map();
  private categoryWeights: Map<string, number> = new Map();
  private userPatterns: Map<string, any> = new Map();
  private fraudPatterns: Set<string> = new Set();

  // Sri Lankan specific categories with cultural context
  private sriLankanCategories = {
    'Food & Dining': {
      keywords: ['restaurant', 'food', 'meal', 'lunch', 'dinner', 'breakfast', 'cafe', 'hotel', 'rice', 'curry', 'kottu', 'hoppers'],
      cultural: ['dansala', 'alms giving', 'pirith', 'temple food']
    },
    'Transport': {
      keywords: ['bus', 'taxi', 'train', 'uber', 'pickup', 'three wheeler', 'tuk tuk', 'fuel', 'petrol', 'diesel'],
      cultural: ['temple visit', 'pilgrimage', 'poya day transport']
    },
    'Religious & Cultural': {
      keywords: ['temple', 'donation', 'dana', 'poya', 'vesak', 'poson', 'katina', 'pirith', 'bodhi puja'],
      cultural: ['merit making', 'alms giving', 'temple maintenance', 'monk dana']
    },
    'Healthcare': {
      keywords: ['doctor', 'hospital', 'medicine', 'pharmacy', 'medical', 'clinic', 'ayurveda'],
      cultural: ['traditional medicine', 'ayurvedic treatment', 'indigenous medicine']
    },
    'Education': {
      keywords: ['school', 'tuition', 'books', 'education', 'university', 'course', 'training'],
      cultural: ['dhamma school', 'religious education', 'cultural classes']
    },
    'Utilities': {
      keywords: ['electricity', 'water', 'internet', 'phone', 'mobile', 'ceb', 'nwsdb'],
      cultural: []
    },
    'Shopping': {
      keywords: ['supermarket', 'shop', 'store', 'market', 'clothes', 'electronics', 'keells', 'arpico'],
      cultural: ['poya shopping', 'festival preparations', 'traditional items']
    },
    'Entertainment': {
      keywords: ['movie', 'cinema', 'music', 'game', 'sport', 'club'],
      cultural: ['cultural show', 'traditional dance', 'perahera', 'festival']
    }
  };

  public static getInstance(): AICategorization {
    if (!AICategorization.instance) {
      AICategorization.instance = new AICategorization();
    }
    return AICategorization.instance;
  }

  constructor() {
    this.geminiService = GeminiService.getInstance();
    this.loadTrainingData();
    this.initializeFraudPatterns();
  }

  /**
   * Smart expense categorization using ML and cultural context
   */
  public async categorizeExpense(
    description: string, 
    merchant: string = '', 
    amount: number, 
    userId: string,
    context: any = {}
  ): Promise<CategoryPrediction> {
    try {
      // First, try rule-based categorization for speed
      const ruleBasedResult = this.ruleBasedCategorization(description, merchant, amount, context);
      
      if (ruleBasedResult.confidence > 0.8) {
        return ruleBasedResult;
      }

      // Use AI for complex cases
      const aiResult = await this.aiBasedCategorization(description, merchant, amount, context);
      
      // Combine results with user patterns
      const userAdjustedResult = this.adjustWithUserPatterns(aiResult, userId);
      
      // Check for fraud patterns
      const fraudRisk = this.calculateFraudRisk(description, merchant, amount, context);
      userAdjustedResult.fraudRisk = fraudRisk;

      // Store for future learning
      this.storeLearningData(description, merchant, amount, userAdjustedResult.category, userId);

      return userAdjustedResult;
      
    } catch (error) {
      console.error('Categorization error:', error);
      return this.fallbackCategorization(description, merchant, amount);
    }
  }

  /**
   * Rule-based categorization for common patterns
   */
  private ruleBasedCategorization(
    description: string, 
    merchant: string, 
    amount: number,
    context: any
  ): CategoryPrediction {
    const text = `${description} ${merchant}`.toLowerCase();
    
    // Cultural context detection
    if (context.isPoyaDay || this.hasCulturalKeywords(text)) {
      return {
        category: 'Religious & Cultural',
        confidence: 0.9,
        reasoning: 'Detected cultural/religious context',
        suggestedTags: ['cultural', 'religious'],
        budgetImpact: 'Cultural exemption may apply'
      };
    }

    // Check each category
    for (const [category, data] of Object.entries(this.sriLankanCategories)) {
      const allKeywords = [...data.keywords, ...data.cultural];
      const matchCount = allKeywords.filter(keyword => text.includes(keyword)).length;
      
      if (matchCount > 0) {
        const confidence = Math.min(0.85, 0.5 + (matchCount * 0.2));
        return {
          category,
          confidence,
          reasoning: `Matched ${matchCount} keywords for ${category}`,
          suggestedTags: this.generateTags(text, data),
          budgetImpact: this.assessBudgetImpact(category, amount)
        };
      }
    }

    return {
      category: 'Other',
      confidence: 0.3,
      reasoning: 'No clear pattern match',
      suggestedTags: ['unclassified']
    };
  }

  /**
   * AI-based categorization for complex cases
   */
  private async aiBasedCategorization(
    description: string, 
    merchant: string, 
    amount: number,
    context: any
  ): Promise<CategoryPrediction> {
    const prompt = `
    Analyze this Sri Lankan expense and provide smart categorization:
    
    Description: ${description}
    Merchant: ${merchant}
    Amount: LKR ${amount}
    Context: ${JSON.stringify(context)}
    
    Consider:
    - Sri Lankan cultural context (Poya days, festivals, religious activities)
    - Local merchants and payment patterns
    - Amount appropriateness for category
    - Seasonal and cultural factors
    
    Provide categorization with confidence score and reasoning.
    Categories: Food & Dining, Transport, Religious & Cultural, Healthcare, Education, Utilities, Shopping, Entertainment, Other
    
    Respond in JSON format:
    {
      "category": "category_name",
      "confidence": 0.85,
      "reasoning": "explanation",
      "subcategory": "specific_type",
      "suggestedTags": ["tag1", "tag2"],
      "fraudRisk": 0.1,
      "budgetImpact": "impact_description"
    }
    `;

    try {
      const response = await this.geminiService.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          category: result.category || 'Other',
          confidence: Math.min(0.95, result.confidence || 0.7),
          reasoning: result.reasoning || 'AI analysis',
          subcategory: result.subcategory,
          suggestedTags: result.suggestedTags || [],
          fraudRisk: result.fraudRisk || 0,
          budgetImpact: result.budgetImpact
        };
      }
    } catch (error) {
      console.error('AI categorization error:', error);
    }

    return this.fallbackCategorization(description, merchant, amount);
  }

  /**
   * Adjust categorization based on user patterns
   */
  private adjustWithUserPatterns(prediction: CategoryPrediction, userId: string): CategoryPrediction {
    const userPattern = this.userPatterns.get(userId);
    
    if (!userPattern) {
      return prediction;
    }

    // Check if user has strong patterns for this type of expense
    const userCategoryPreference = userPattern.categoryPreferences;
    if (userCategoryPreference && userCategoryPreference[prediction.category]) {
      const adjustmentFactor = userCategoryPreference[prediction.category];
      prediction.confidence = Math.min(0.98, prediction.confidence * adjustmentFactor);
      prediction.reasoning += ` (Adjusted for user patterns)`;
    }

    return prediction;
  }

  /**
   * Calculate fraud risk based on patterns
   */
  private calculateFraudRisk(
    description: string, 
    merchant: string, 
    amount: number,
    context: any
  ): number {
    let riskScore = 0;

    // Unusual amount patterns
    if (amount > 50000) riskScore += 0.2; // Large amounts
    if (amount % 1000 === 0 && amount > 10000) riskScore += 0.1; // Round large amounts

    // Merchant patterns
    if (merchant && merchant.length < 3) riskScore += 0.3; // Very short merchant names
    if (this.fraudPatterns.has(merchant.toLowerCase())) riskScore += 0.5;

    // Description patterns
    const suspiciousWords = ['test', 'temp', 'unknown', 'misc', 'cash advance'];
    if (suspiciousWords.some(word => description.toLowerCase().includes(word))) {
      riskScore += 0.3;
    }

    // Time patterns
    if (context.isLateNight) riskScore += 0.1; // Late night transactions
    if (context.isWeekend && amount > 20000) riskScore += 0.1; // Large weekend transactions

    return Math.min(1.0, riskScore);
  }

  /**
   * Generate AI insights and recommendations
   */
  public async generateFinancialInsights(
    expenses: any[], 
    userId: string,
    timeframe: 'week' | 'month' | 'quarter' = 'month'
  ): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];

    try {
      // Spending pattern analysis
      const spendingPatterns = await this.analyzeSpendingPatterns(expenses, timeframe);
      insights.push(...spendingPatterns);

      // Budget warnings
      const budgetWarnings = await this.generateBudgetWarnings(expenses, userId);
      insights.push(...budgetWarnings);

      // Saving opportunities
      const savingOpportunities = await this.identifySavingOpportunities(expenses);
      insights.push(...savingOpportunities);

      // Cultural insights
      const culturalInsights = await this.generateCulturalInsights(expenses);
      insights.push(...culturalInsights);

      // Fraud alerts
      const fraudAlerts = this.generateFraudAlerts(expenses);
      insights.push(...fraudAlerts);

    } catch (error) {
      console.error('Error generating insights:', error);
    }

    return insights.sort((a, b) => 
      (b.priority === 'urgent' ? 4 : b.priority === 'high' ? 3 : b.priority === 'medium' ? 2 : 1) -
      (a.priority === 'urgent' ? 4 : a.priority === 'high' ? 3 : a.priority === 'medium' ? 2 : 1)
    );
  }

  /**
   * Predictive budgeting with AI recommendations
   */
  public async generatePredictiveBudget(
    historicalExpenses: any[],
    userId: string,
    targetMonth: Date
  ): Promise<{
    predictedExpenses: Record<string, number>;
    recommendations: string[];
    confidence: number;
    culturalEvents: any[];
    savingGoals: any[];
  }> {
    const prompt = `
    Analyze historical Sri Lankan expense data and predict budget for ${targetMonth.toISOString().slice(0, 7)}:
    
    Historical Data: ${JSON.stringify(historicalExpenses.slice(-50))}
    
    Consider:
    - Seasonal patterns in Sri Lanka
    - Cultural events and festivals
    - Economic trends
    - Personal spending patterns
    - Poya day impacts
    
    Provide predictions and recommendations in JSON format:
    {
      "predictedExpenses": {
        "Food & Dining": 15000,
        "Transport": 8000,
        ...
      },
      "recommendations": ["recommendation1", "recommendation2"],
      "confidence": 0.85,
      "culturalEvents": [{"name": "Vesak", "impact": "high", "suggestions": []}],
      "savingGoals": [{"category": "category", "amount": 1000, "reason": "reason"}]
    }
    `;

    try {
      const response = await this.geminiService.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Predictive budget error:', error);
    }

    return {
      predictedExpenses: {},
      recommendations: ['Unable to generate predictions at this time'],
      confidence: 0,
      culturalEvents: [],
      savingGoals: []
    };
  }

  /**
   * Natural language query processing
   */
  public async processNaturalLanguageQuery(
    query: string,
    expenses: any[],
    language: 'en' | 'si' | 'ta' = 'en'
  ): Promise<{
    answer: string;
    data?: any;
    visualizations?: any[];
    followUpQuestions?: string[];
  }> {
    const prompt = `
    Process this financial query about Sri Lankan expenses:
    
    Query: ${query}
    Language: ${language}
    Expense Data: ${JSON.stringify(expenses.slice(-20))}
    
    Understand the user's intent and provide helpful financial insights.
    Support queries in English, Sinhala, and Tamil.
    
    Common queries:
    - "How much did I spend on food this month?"
    - "Show my transport expenses"
    - "What's my biggest expense category?"
    - "හමුම් මම මාසයට කීයද වියදම් කළේ?" (Sinhala)
    - "எனது மாதாந்த செலவுகள் என்ன?" (Tamil)
    
    Respond in JSON format:
    {
      "answer": "detailed_response",
      "data": {...},
      "visualizations": [...],
      "followUpQuestions": [...]
    }
    `;

    try {
      const response = await this.geminiService.generateContent(prompt);
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Natural language query error:', error);
    }

    return {
      answer: 'I apologize, but I couldn\'t process your query at the moment. Please try again or rephrase your question.',
      followUpQuestions: [
        'How much did I spend this month?',
        'What\'s my biggest expense category?',
        'Show me my transport costs'
      ]
    };
  }

  // Helper methods

  private hasCulturalKeywords(text: string): boolean {
    const culturalKeywords = ['temple', 'poya', 'vesak', 'poson', 'dana', 'pirith', 'bodhi', 'katina', 'alms'];
    return culturalKeywords.some(keyword => text.includes(keyword));
  }

  private generateTags(text: string, categoryData: any): string[] {
    const tags = [];
    
    if (categoryData.cultural.some((word: string) => text.includes(word))) {
      tags.push('cultural');
    }
    
    if (text.includes('poya') || text.includes('full moon')) {
      tags.push('poya-day');
    }
    
    return tags;
  }

  private assessBudgetImpact(category: string, amount: number): string {
    if (category === 'Religious & Cultural') {
      return 'May qualify for tax deduction';
    }
    
    if (amount > 10000) {
      return 'High impact on monthly budget';
    }
    
    return 'Normal budget impact';
  }

  private fallbackCategorization(description: string, merchant: string, amount: number): CategoryPrediction {
    return {
      category: 'Other',
      confidence: 0.5,
      reasoning: 'Fallback categorization',
      suggestedTags: ['needs-review']
    };
  }

  private async analyzeSpendingPatterns(expenses: any[], timeframe: string): Promise<AIInsight[]> {
    // Implementation for spending pattern analysis
    return [];
  }

  private async generateBudgetWarnings(expenses: any[], userId: string): Promise<AIInsight[]> {
    // Implementation for budget warnings
    return [];
  }

  private async identifySavingOpportunities(expenses: any[]): Promise<AIInsight[]> {
    // Implementation for saving opportunities
    return [];
  }

  private async generateCulturalInsights(expenses: any[]): Promise<AIInsight[]> {
    // Implementation for cultural insights
    return [];
  }

  private generateFraudAlerts(expenses: any[]): AIInsight[] {
    // Implementation for fraud alerts
    return [];
  }

  private storeLearningData(description: string, merchant: string, amount: number, category: string, userId: string): void {
    // Store data for ML training
    const pattern: ExpensePattern = {
      id: Date.now().toString(),
      description,
      merchant,
      amount,
      category,
      confidence: 1.0,
      userId,
      timestamp: new Date(),
      paymentMethod: 'unknown',
      tags: []
    };

    if (!this.trainingData.has(userId)) {
      this.trainingData.set(userId, []);
    }
    
    this.trainingData.get(userId)!.push(pattern);
  }

  private loadTrainingData(): void {
    // Load training data from localStorage or server
    try {
      const stored = localStorage.getItem('ai-training-data');
      if (stored) {
        const data = JSON.parse(stored);
        Object.entries(data).forEach(([userId, patterns]) => {
          this.trainingData.set(userId, patterns as ExpensePattern[]);
        });
      }
    } catch (error) {
      console.error('Error loading training data:', error);
    }
  }

  private initializeFraudPatterns(): void {
    // Initialize known fraud patterns
    this.fraudPatterns.add('unknown merchant');
    this.fraudPatterns.add('test');
    this.fraudPatterns.add('temp payment');
  }
}

export const aiCategorizationService = AICategorization.getInstance();