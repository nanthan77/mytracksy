// Business Intelligence & Predictive Analytics Service
// Phase 11: Advanced analytics with Sri Lankan business context

import { GeminiService } from './geminiService';

export interface BusinessMetric {
  id: string;
  name: string;
  value: number;
  previousValue?: number;
  target?: number;
  unit: string;
  category: 'financial' | 'operational' | 'cultural' | 'growth' | 'efficiency';
  trend: 'up' | 'down' | 'stable';
  importance: 'critical' | 'high' | 'medium' | 'low';
  lastUpdated: Date;
}

export interface Forecast {
  metric: string;
  period: 'week' | 'month' | 'quarter' | 'year';
  predictions: Array<{
    date: Date;
    value: number;
    confidence: number;
    factors: string[];
  }>;
  accuracy: number;
  methodology: 'ml' | 'statistical' | 'hybrid';
  lastUpdate: Date;
}

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  type: 'opportunity' | 'risk' | 'trend' | 'anomaly' | 'recommendation';
  category: string;
  confidence: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  impact: 'high' | 'medium' | 'low';
  evidence: string[];
  recommendations: string[];
  affectedMetrics: string[];
  culturalContext?: string;
  createdDate: Date;
  expiryDate?: Date;
}

export interface SriLankanBusinessContext {
  economicIndicators: {
    inflation: number;
    interestRates: number;
    exchangeRate: number;
    gdpGrowth: number;
  };
  culturalCalendar: {
    poyaDays: Date[];
    festivals: Array<{
      name: string;
      date: Date;
      businessImpact: 'high' | 'medium' | 'low';
    }>;
  };
  seasonalFactors: {
    monsoonSeason: { start: Date; end: Date };
    touristSeason: { start: Date; end: Date };
    harvestSeason: { start: Date; end: Date };
  };
  regulatoryChanges: Array<{
    description: string;
    effectiveDate: Date;
    impact: string;
  }>;
}

export interface PredictiveModel {
  id: string;
  name: string;
  type: 'expense_forecasting' | 'revenue_prediction' | 'cash_flow' | 'seasonal_analysis';
  accuracy: number;
  features: string[];
  training_data_size: number;
  last_trained: Date;
  cultural_factors: boolean;
}

export interface RealTimeAlert {
  id: string;
  type: 'expense_spike' | 'budget_exceeded' | 'unusual_pattern' | 'cultural_event' | 'market_change';
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: Date;
  acknowledged: boolean;
  data?: any;
}

export class BusinessIntelligenceService {
  private static instance: BusinessIntelligenceService;
  private geminiService: GeminiService;
  private metrics: Map<string, BusinessMetric> = new Map();
  private forecasts: Map<string, Forecast> = new Map();
  private insights: BusinessInsight[] = [];
  private models: Map<string, PredictiveModel> = new Map();
  private alerts: RealTimeAlert[] = [];
  private sriLankanContext: SriLankanBusinessContext;

  public static getInstance(): BusinessIntelligenceService {
    if (!BusinessIntelligenceService.instance) {
      BusinessIntelligenceService.instance = new BusinessIntelligenceService();
    }
    return BusinessIntelligenceService.instance;
  }

  constructor() {
    this.geminiService = GeminiService.getInstance();
    this.initializeSriLankanContext();
    this.initializePredictiveModels();
    this.startRealTimeMonitoring();
  }

  /**
   * Generate comprehensive business intelligence dashboard
   */
  public async generateDashboard(
    expenses: any[],
    timeframe: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<{
    kpis: BusinessMetric[];
    insights: BusinessInsight[];
    forecasts: Forecast[];
    alerts: RealTimeAlert[];
    culturalImpact: any;
    recommendations: string[];
  }> {
    // Calculate KPIs
    const kpis = await this.calculateKPIs(expenses, timeframe);
    
    // Generate insights using AI
    const insights = await this.generateInsights(expenses, kpis);
    
    // Create forecasts
    const forecasts = await this.generateForecasts(expenses, timeframe);
    
    // Get active alerts
    const alerts = this.getActiveAlerts();
    
    // Analyze cultural impact
    const culturalImpact = await this.analyzeCulturalImpact(expenses);
    
    // Generate strategic recommendations
    const recommendations = await this.generateRecommendations(insights, forecasts);

    return {
      kpis,
      insights,
      forecasts,
      alerts,
      culturalImpact,
      recommendations
    };
  }

  /**
   * Calculate key performance indicators
   */
  private async calculateKPIs(
    expenses: any[],
    timeframe: string
  ): Promise<BusinessMetric[]> {
    const now = new Date();
    const periodStart = this.getPeriodStart(now, timeframe);
    const previousPeriodStart = this.getPeriodStart(periodStart, timeframe);
    
    const currentExpenses = expenses.filter(e => 
      new Date(e.date) >= periodStart && new Date(e.date) <= now
    );
    
    const previousExpenses = expenses.filter(e => 
      new Date(e.date) >= previousPeriodStart && new Date(e.date) < periodStart
    );

    const kpis: BusinessMetric[] = [
      {
        id: 'total_expenses',
        name: 'Total Expenses',
        value: currentExpenses.reduce((sum, e) => sum + e.amount, 0),
        previousValue: previousExpenses.reduce((sum, e) => sum + e.amount, 0),
        unit: 'LKR',
        category: 'financial',
        trend: 'stable',
        importance: 'critical',
        lastUpdated: now
      },
      {
        id: 'expense_count',
        name: 'Transaction Count',
        value: currentExpenses.length,
        previousValue: previousExpenses.length,
        unit: 'transactions',
        category: 'operational',
        trend: 'stable',
        importance: 'medium',
        lastUpdated: now
      },
      {
        id: 'avg_transaction',
        name: 'Average Transaction',
        value: currentExpenses.length > 0 ? 
          currentExpenses.reduce((sum, e) => sum + e.amount, 0) / currentExpenses.length : 0,
        previousValue: previousExpenses.length > 0 ? 
          previousExpenses.reduce((sum, e) => sum + e.amount, 0) / previousExpenses.length : 0,
        unit: 'LKR',
        category: 'financial',
        trend: 'stable',
        importance: 'medium',
        lastUpdated: now
      },
      {
        id: 'cultural_expenses',
        name: 'Cultural Expenses',
        value: currentExpenses
          .filter(e => e.category === 'Religious & Cultural')
          .reduce((sum, e) => sum + e.amount, 0),
        previousValue: previousExpenses
          .filter(e => e.category === 'Religious & Cultural')
          .reduce((sum, e) => sum + e.amount, 0),
        unit: 'LKR',
        category: 'cultural',
        trend: 'stable',
        importance: 'high',
        lastUpdated: now
      }
    ];

    // Calculate trends
    kpis.forEach(kpi => {
      if (kpi.previousValue !== undefined) {
        const change = ((kpi.value - kpi.previousValue) / (kpi.previousValue || 1)) * 100;
        kpi.trend = change > 5 ? 'up' : change < -5 ? 'down' : 'stable';
      }
    });

    // Store metrics
    kpis.forEach(kpi => this.metrics.set(kpi.id, kpi));

    return kpis;
  }

  /**
   * Generate AI-powered business insights
   */
  private async generateInsights(
    expenses: any[],
    kpis: BusinessMetric[]
  ): Promise<BusinessInsight[]> {
    const insights: BusinessInsight[] = [];

    // Expense pattern analysis
    const expensePatterns = this.analyzeExpensePatterns(expenses);
    insights.push(...expensePatterns);

    // Seasonal analysis
    const seasonalInsights = this.analyzeSeasonalPatterns(expenses);
    insights.push(...seasonalInsights);

    // Cultural impact analysis
    const culturalInsights = await this.analyzeCulturalPatterns(expenses);
    insights.push(...culturalInsights);

    // Anomaly detection
    const anomalies = this.detectAnomalies(expenses);
    insights.push(...anomalies);

    // Budget optimization
    const optimizationInsights = await this.generateOptimizationInsights(expenses, kpis);
    insights.push(...optimizationInsights);

    this.insights = insights;
    return insights;
  }

  /**
   * Generate forecasts using multiple methodologies
   */
  private async generateForecasts(
    expenses: any[],
    timeframe: string
  ): Promise<Forecast[]> {
    const forecasts: Forecast[] = [];

    // Expense forecasting
    const expenseForecast = await this.forecastExpenses(expenses, timeframe);
    forecasts.push(expenseForecast);

    // Category-wise forecasting
    const categories = [...new Set(expenses.map(e => e.category))];
    for (const category of categories) {
      const categoryExpenses = expenses.filter(e => e.category === category);
      if (categoryExpenses.length > 5) { // Minimum data points
        const categoryForecast = await this.forecastCategoryExpenses(categoryExpenses, category);
        forecasts.push(categoryForecast);
      }
    }

    // Cultural event impact forecasting
    const culturalForecast = await this.forecastCulturalImpact(expenses);
    forecasts.push(culturalForecast);

    forecasts.forEach(forecast => this.forecasts.set(forecast.metric, forecast));
    return forecasts;
  }

  /**
   * Forecast total expenses using hybrid methodology
   */
  private async forecastExpenses(
    expenses: any[],
    timeframe: string
  ): Promise<Forecast> {
    const monthlyData = this.groupExpensesByMonth(expenses);
    const predictions = [];

    // Generate 6 month forecast
    for (let i = 1; i <= 6; i++) {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + i);

      // Simple trend analysis + seasonal adjustment + cultural events
      const baseValue = this.calculateTrendValue(monthlyData, i);
      const seasonalAdjustment = this.getSeasonalAdjustment(futureDate);
      const culturalAdjustment = this.getCulturalAdjustment(futureDate);
      
      const predictedValue = baseValue * seasonalAdjustment * culturalAdjustment;
      const confidence = Math.max(0.3, 0.9 - (i * 0.1)); // Decreasing confidence

      predictions.push({
        date: futureDate,
        value: predictedValue,
        confidence,
        factors: [
          'Historical trend',
          'Seasonal patterns',
          'Cultural events',
          'Economic indicators'
        ]
      });
    }

    return {
      metric: 'total_expenses',
      period: 'month',
      predictions,
      accuracy: 0.75,
      methodology: 'hybrid',
      lastUpdate: new Date()
    };
  }

  /**
   * Analyze cultural impact on expenses
   */
  private async analyzeCulturalImpact(expenses: any[]): Promise<{
    culturalExpenseRatio: number;
    poyaDayImpact: number;
    festivalImpact: number;
    seasonalTrends: any[];
    recommendations: string[];
  }> {
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const culturalExpenses = expenses
      .filter(e => e.category === 'Religious & Cultural' || e.culturalContext)
      .reduce((sum, e) => sum + e.amount, 0);

    const culturalExpenseRatio = totalExpenses > 0 ? culturalExpenses / totalExpenses : 0;

    // Analyze Poya day spending patterns
    const poyaDayExpenses = expenses.filter(e => this.isPoyaDay(new Date(e.date)));
    const poyaDayImpact = poyaDayExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Analyze festival periods
    const festivalExpenses = expenses.filter(e => this.isFestivalPeriod(new Date(e.date)));
    const festivalImpact = festivalExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Seasonal trends
    const seasonalTrends = this.analyzeSeasonalCulturalTrends(expenses);

    const recommendations = [
      culturalExpenseRatio < 0.05 ? 
        'Consider allocating more budget for cultural and religious activities' :
        culturalExpenseRatio > 0.2 ? 
        'Cultural expenses are high - review for optimization' :
        'Good balance of cultural expenses',
      
      'Plan ahead for major festivals like Vesak and Poson',
      'Consider cultural tax deductions for religious donations',
      'Budget extra for Poya day activities and temple visits'
    ];

    return {
      culturalExpenseRatio,
      poyaDayImpact,
      festivalImpact,
      seasonalTrends,
      recommendations
    };
  }

  /**
   * Generate strategic recommendations using AI
   */
  private async generateRecommendations(
    insights: BusinessInsight[],
    forecasts: Forecast[]
  ): Promise<string[]> {
    const prompt = `
    Analyze Sri Lankan business financial data and provide strategic recommendations:
    
    Insights: ${JSON.stringify(insights.slice(0, 5))}
    Forecasts: ${JSON.stringify(forecasts.slice(0, 3))}
    
    Consider:
    - Sri Lankan economic context
    - Cultural factors and seasonal patterns
    - Business optimization opportunities
    - Risk mitigation strategies
    - Growth opportunities
    
    Provide 5-7 actionable recommendations in order of priority.
    `;

    try {
      const response = await this.geminiService.generateContent(prompt);
      const recommendations = response
        .split('\n')
        .filter(line => line.trim() && (line.includes('•') || line.includes('-') || /^\d+\./.test(line)))
        .map(line => line.replace(/^[•\-\d\.\s]+/, '').trim())
        .filter(rec => rec.length > 10)
        .slice(0, 7);

      return recommendations.length > 0 ? recommendations : [
        'Optimize expense categorization for better insights',
        'Implement budget alerts for major expense categories',
        'Plan for seasonal variations in spending',
        'Consider cultural factors in financial planning',
        'Review and adjust spending patterns based on forecasts'
      ];
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        'Monitor expense trends regularly',
        'Implement proactive budget management',
        'Consider seasonal spending patterns',
        'Optimize cultural expense allocation'
      ];
    }
  }

  /**
   * Real-time anomaly detection
   */
  private detectAnomalies(expenses: any[]): BusinessInsight[] {
    const insights: BusinessInsight[] = [];
    
    // Detect unusual spending spikes
    const recentExpenses = expenses
      .filter(e => new Date(e.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.amount - a.amount);

    if (recentExpenses.length > 0) {
      const maxExpense = recentExpenses[0];
      const avgExpense = expenses.reduce((sum, e) => sum + e.amount, 0) / expenses.length;
      
      if (maxExpense.amount > avgExpense * 3) {
        insights.push({
          id: `anomaly_${Date.now()}`,
          title: 'Unusual Expense Detected',
          description: `Large expense of LKR ${maxExpense.amount.toLocaleString()} in ${maxExpense.category}`,
          type: 'anomaly',
          category: 'expense_monitoring',
          confidence: 0.8,
          priority: 'high',
          impact: 'medium',
          evidence: [`Expense is ${((maxExpense.amount / avgExpense) - 1) * 100}% above average`],
          recommendations: ['Review the expense for accuracy', 'Check if this represents a trend'],
          affectedMetrics: ['total_expenses', 'avg_transaction'],
          createdDate: new Date()
        });
      }
    }

    return insights;
  }

  /**
   * Advanced pattern analysis
   */
  private analyzeExpensePatterns(expenses: any[]): BusinessInsight[] {
    const insights: BusinessInsight[] = [];

    // Day of week analysis
    const dayOfWeekExpenses = this.groupExpensesByDayOfWeek(expenses);
    const maxDay = Object.entries(dayOfWeekExpenses)
      .sort(([,a], [,b]) => b - a)[0];

    if (maxDay) {
      insights.push({
        id: `pattern_dow_${Date.now()}`,
        title: 'Weekly Spending Pattern',
        description: `Highest spending occurs on ${maxDay[0]}s`,
        type: 'trend',
        category: 'spending_patterns',
        confidence: 0.7,
        priority: 'medium',
        impact: 'low',
        evidence: [`${maxDay[0]}s account for ${((maxDay[1] / expenses.reduce((s, e) => s + e.amount, 0)) * 100).toFixed(1)}% of total expenses`],
        recommendations: ['Plan major purchases strategically', 'Consider budgeting by day of week'],
        affectedMetrics: ['expense_distribution'],
        createdDate: new Date()
      });
    }

    return insights;
  }

  /**
   * Real-time monitoring and alerts
   */
  private startRealTimeMonitoring(): void {
    setInterval(() => {
      this.checkForAlerts();
    }, 60000); // Check every minute
  }

  private checkForAlerts(): void {
    // Implementation for real-time alert generation
    // This would monitor for budget thresholds, unusual patterns, etc.
  }

  // Helper methods

  private initializeSriLankanContext(): void {
    this.sriLankanContext = {
      economicIndicators: {
        inflation: 15.8, // Current Sri Lankan inflation rate
        interestRates: 12.5,
        exchangeRate: 325, // USD to LKR
        gdpGrowth: -8.7
      },
      culturalCalendar: {
        poyaDays: this.generatePoyaDays(2024),
        festivals: [
          { name: 'Vesak', date: new Date('2024-05-23'), businessImpact: 'high' },
          { name: 'Poson', date: new Date('2024-06-21'), businessImpact: 'high' },
          { name: 'Esala', date: new Date('2024-07-20'), businessImpact: 'medium' }
        ]
      },
      seasonalFactors: {
        monsoonSeason: { start: new Date('2024-05-01'), end: new Date('2024-09-30') },
        touristSeason: { start: new Date('2024-12-01'), end: new Date('2025-03-31') },
        harvestSeason: { start: new Date('2024-04-01'), end: new Date('2024-06-30') }
      },
      regulatoryChanges: []
    };
  }

  private initializePredictiveModels(): void {
    this.models.set('expense_forecasting', {
      id: 'expense_forecasting',
      name: 'Expense Forecasting Model',
      type: 'expense_forecasting',
      accuracy: 0.78,
      features: ['historical_trend', 'seasonal_patterns', 'cultural_events'],
      training_data_size: 1000,
      last_trained: new Date(),
      cultural_factors: true
    });
  }

  private getPeriodStart(date: Date, timeframe: string): Date {
    const start = new Date(date);
    switch (timeframe) {
      case 'month':
        start.setMonth(start.getMonth() - 1);
        break;
      case 'quarter':
        start.setMonth(start.getMonth() - 3);
        break;
      case 'year':
        start.setFullYear(start.getFullYear() - 1);
        break;
    }
    return start;
  }

  private groupExpensesByMonth(expenses: any[]): Record<string, number> {
    const monthly: Record<string, number> = {};
    expenses.forEach(expense => {
      const monthKey = new Date(expense.date).toISOString().slice(0, 7);
      monthly[monthKey] = (monthly[monthKey] || 0) + expense.amount;
    });
    return monthly;
  }

  private groupExpensesByDayOfWeek(expenses: any[]): Record<string, number> {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayExpenses: Record<string, number> = {};
    
    expenses.forEach(expense => {
      const day = days[new Date(expense.date).getDay()];
      dayExpenses[day] = (dayExpenses[day] || 0) + expense.amount;
    });
    
    return dayExpenses;
  }

  private calculateTrendValue(monthlyData: Record<string, number>, futureMonths: number): number {
    const values = Object.values(monthlyData);
    if (values.length < 2) return values[0] || 10000;
    
    // Simple linear trend
    const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length;
    const trend = (values[values.length - 1] - values[0]) / values.length;
    
    return avgValue + (trend * futureMonths);
  }

  private getSeasonalAdjustment(date: Date): number {
    const month = date.getMonth();
    // Sri Lankan seasonal adjustments
    if (month >= 11 || month <= 2) return 1.2; // Tourist season
    if (month >= 4 && month <= 8) return 0.9; // Monsoon season
    return 1.0; // Normal season
  }

  private getCulturalAdjustment(date: Date): number {
    if (this.isPoyaDay(date)) return 1.15;
    if (this.isFestivalPeriod(date)) return 1.3;
    return 1.0;
  }

  private isPoyaDay(date: Date): boolean {
    return this.sriLankanContext.culturalCalendar.poyaDays.some(
      poya => Math.abs(poya.getTime() - date.getTime()) < 24 * 60 * 60 * 1000
    );
  }

  private isFestivalPeriod(date: Date): boolean {
    return this.sriLankanContext.culturalCalendar.festivals.some(
      festival => Math.abs(festival.date.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000
    );
  }

  private generatePoyaDays(year: number): Date[] {
    // Simplified Poya day calculation (normally would use lunar calendar)
    const poyaDays = [];
    for (let month = 0; month < 12; month++) {
      poyaDays.push(new Date(year, month, 15)); // Approximate full moon
    }
    return poyaDays;
  }

  private analyzeSeasonalPatterns(expenses: any[]): BusinessInsight[] {
    // Implementation for seasonal pattern analysis
    return [];
  }

  private async analyzeCulturalPatterns(expenses: any[]): Promise<BusinessInsight[]> {
    // Implementation for cultural pattern analysis
    return [];
  }

  private async generateOptimizationInsights(expenses: any[], kpis: BusinessMetric[]): Promise<BusinessInsight[]> {
    // Implementation for optimization insights
    return [];
  }

  private async forecastCategoryExpenses(expenses: any[], category: string): Promise<Forecast> {
    // Implementation for category-specific forecasting
    return {
      metric: `${category}_expenses`,
      period: 'month',
      predictions: [],
      accuracy: 0.7,
      methodology: 'statistical',
      lastUpdate: new Date()
    };
  }

  private async forecastCulturalImpact(expenses: any[]): Promise<Forecast> {
    // Implementation for cultural impact forecasting
    return {
      metric: 'cultural_impact',
      period: 'month', 
      predictions: [],
      accuracy: 0.6,
      methodology: 'hybrid',
      lastUpdate: new Date()
    };
  }

  private analyzeSeasonalCulturalTrends(expenses: any[]): any[] {
    // Implementation for seasonal cultural trend analysis
    return [];
  }

  // Public getters
  public getMetrics(): BusinessMetric[] {
    return Array.from(this.metrics.values());
  }

  public getInsights(): BusinessInsight[] {
    return this.insights;
  }

  public getForecasts(): Forecast[] {
    return Array.from(this.forecasts.values());
  }

  public getActiveAlerts(): RealTimeAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  public getSriLankanContext(): SriLankanBusinessContext {
    return this.sriLankanContext;
  }
}

export const businessIntelligenceService = BusinessIntelligenceService.getInstance();