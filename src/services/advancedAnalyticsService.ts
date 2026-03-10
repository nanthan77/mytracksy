import { multiCompanyService } from './multiCompanyService';
import { budgetAlertService } from './budgetAlertService';
import { culturalIntegrationService } from './culturalIntegrationService';
import { merchantRecognitionService } from './merchantRecognitionService';

export interface AdvancedAnalyticsData {
  summary: {
    totalExpenses: number;
    totalTransactions: number;
    averagePerTransaction: number;
    monthlyGrowth: number;
    categoryDistribution: Record<string, number>;
    companyDistribution: Record<string, number>;
  };
  insights: {
    topCategories: Array<{ category: string; amount: number; percentage: number }>;
    topMerchants: Array<{ merchant: string; amount: number; transactions: number }>;
    spendingTrends: Array<{ month: string; amount: number; change: number }>;
    budgetPerformance: Array<{ category: string; budgeted: number; spent: number; variance: number }>;
    culturalImpact: Array<{ event: string; increase: number; categories: string[] }>;
    paymentMethodBreakdown: Record<string, { amount: number; count: number }>;
  };
  forecasts: {
    monthlyForecast: Array<{ month: string; predicted: number; confidence: number }>;
    categoryForecasts: Record<string, { current: number; predicted: number; trend: 'up' | 'down' | 'stable' }>;
    budgetRiskAnalysis: Array<{ category: string; riskLevel: 'low' | 'medium' | 'high'; daysToExceed: number }>;
  };
  recommendations: {
    budgetOptimizations: Array<{ category: string; currentBudget: number; recommendedBudget: number; reasoning: string }>;
    costSavings: Array<{ category: string; potentialSavings: number; suggestion: string }>;
    culturalPreparation: Array<{ event: string; date: string; suggestedBudget: number; categories: string[] }>;
  };
}

export interface PeriodFilter {
  startDate: Date;
  endDate: Date;
  period: 'week' | 'month' | 'quarter' | 'year' | 'custom';
}

export interface AnalyticsFilters {
  companyId?: string;
  departmentId?: string;
  projectId?: string;
  categories?: string[];
  merchants?: string[];
  paymentMethods?: string[];
  minAmount?: number;
  maxAmount?: number;
  period: PeriodFilter;
}

export class AdvancedAnalyticsService {
  private static instance: AdvancedAnalyticsService;
  private analyticsCache: Map<string, { data: AdvancedAnalyticsData; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): AdvancedAnalyticsService {
    if (!AdvancedAnalyticsService.instance) {
      AdvancedAnalyticsService.instance = new AdvancedAnalyticsService();
    }
    return AdvancedAnalyticsService.instance;
  }

  /**
   * Generate comprehensive analytics report
   */
  public async generateAdvancedAnalytics(filters: AnalyticsFilters): Promise<AdvancedAnalyticsData> {
    const cacheKey = this.generateCacheKey(filters);
    const cached = this.analyticsCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const analytics = await this.computeAnalytics(filters);
    this.analyticsCache.set(cacheKey, { data: analytics, timestamp: Date.now() });
    
    return analytics;
  }

  /**
   * Get real-time dashboard data
   */
  public async getDashboardData(companyId?: string): Promise<{
    todaySpending: number;
    weekSpending: number;
    monthSpending: number;
    activeAlerts: number;
    budgetHealth: 'excellent' | 'good' | 'warning' | 'critical';
    topCategories: Array<{ category: string; amount: number; icon: string }>;
    recentTransactions: Array<{ description: string; amount: number; category: string; date: Date }>;
    culturalEvents: Array<{ event: string; date: string; impact: 'low' | 'medium' | 'high' }>;
  }> {
    const today = new Date();
    const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayExpenses = this.getExpensesForPeriod(today, today, companyId);
    const weekExpenses = this.getExpensesForPeriod(weekStart, today, companyId);
    const monthExpenses = this.getExpensesForPeriod(monthStart, today, companyId);

    const todaySpending = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const weekSpending = weekExpenses.reduce((sum, e) => sum + e.amount, 0);
    const monthSpending = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Get active alerts
    const activeAlerts = budgetAlertService.getActiveAlerts().length;

    // Calculate budget health
    const budgets = budgetAlertService.getAllBudgets();
    const budgetHealth = this.calculateBudgetHealth(budgets);

    // Get top categories for the month
    const categoryTotals = this.calculateCategoryTotals(monthExpenses);
    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        icon: this.getCategoryIcon(category)
      }));

    // Get recent transactions
    const recentTransactions = this.getExpensesForPeriod(
      new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
      today,
      companyId
    )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    // Get cultural events
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();
    const culturalEvents = culturalContext.upcomingEvents.slice(0, 3).map(event => ({
      event: event.name,
      date: event.date,
      impact: this.determineCulturalImpact(event.name) as 'low' | 'medium' | 'high'
    }));

    return {
      todaySpending,
      weekSpending,
      monthSpending,
      activeAlerts,
      budgetHealth,
      topCategories,
      recentTransactions,
      culturalEvents
    };
  }

  /**
   * Generate expense heatmap data
   */
  public generateExpenseHeatmap(filters: AnalyticsFilters): Array<{
    date: string;
    amount: number;
    intensity: number;
    categories: string[];
  }> {
    const expenses = this.getFilteredExpenses(filters);
    const dailyTotals = new Map<string, { amount: number; categories: Set<string> }>();

    // Group expenses by date
    expenses.forEach(expense => {
      const dateKey = expense.date.toISOString().split('T')[0];
      const existing = dailyTotals.get(dateKey) || { amount: 0, categories: new Set() };
      existing.amount += expense.amount;
      existing.categories.add(expense.category);
      dailyTotals.set(dateKey, existing);
    });

    // Calculate intensity based on spending amounts
    const amounts = Array.from(dailyTotals.values()).map(d => d.amount);
    const maxAmount = Math.max(...amounts, 1);

    return Array.from(dailyTotals.entries()).map(([date, data]) => ({
      date,
      amount: data.amount,
      intensity: data.amount / maxAmount,
      categories: Array.from(data.categories)
    }));
  }

  /**
   * Generate spending pattern analysis
   */
  public analyzeSpendingPatterns(filters: AnalyticsFilters): {
    weeklyPattern: Array<{ day: string; amount: number; avgTransactionSize: number }>;
    monthlyPattern: Array<{ week: number; amount: number; trend: 'up' | 'down' | 'stable' }>;
    seasonalPattern: Array<{ month: string; amount: number; culturalFactor: number }>;
    merchantLoyalty: Array<{ merchant: string; frequency: number; averageSpend: number; loyalty: 'high' | 'medium' | 'low' }>;
  } {
    const expenses = this.getFilteredExpenses(filters);

    // Weekly pattern
    const weeklyTotals = new Array(7).fill(0).map(() => ({ amount: 0, count: 0 }));
    expenses.forEach(expense => {
      const dayOfWeek = expense.date.getDay();
      weeklyTotals[dayOfWeek].amount += expense.amount;
      weeklyTotals[dayOfWeek].count += 1;
    });

    const weeklyPattern = weeklyTotals.map((data, index) => ({
      day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index],
      amount: data.amount,
      avgTransactionSize: data.count > 0 ? data.amount / data.count : 0
    }));

    // Monthly pattern (by week)
    const monthlyPattern = this.calculateMonthlyPattern(expenses);

    // Seasonal pattern
    const seasonalPattern = this.calculateSeasonalPattern(expenses);

    // Merchant loyalty analysis
    const merchantLoyalty = this.analyzeMerchantLoyalty(expenses);

    return {
      weeklyPattern,
      monthlyPattern,
      seasonalPattern,
      merchantLoyalty
    };
  }

  /**
   * Generate budget optimization recommendations
   */
  public generateBudgetOptimizations(companyId?: string): Array<{
    category: string;
    currentBudget: number;
    actualSpending: number;
    recommendedBudget: number;
    confidence: number;
    reasoning: string;
    potentialSavings: number;
  }> {
    const budgets = budgetAlertService.getAllBudgets();
    const recommendations: any[] = [];

    // Get historical spending data
    const historicalData = this.getHistoricalSpendingData(companyId);

    budgets.forEach(budget => {
      const historical = historicalData[budget.category];
      if (!historical) return;

      const efficiency = budget.spent / budget.amount;
      const avgHistorical = historical.reduce((sum, val) => sum + val, 0) / historical.length;
      
      let recommendedBudget = budget.amount;
      let confidence = 0.5;
      let reasoning = '';
      let potentialSavings = 0;

      if (efficiency < 0.7) {
        // Under-spending
        recommendedBudget = Math.round(avgHistorical * 1.1);
        confidence = 0.8;
        reasoning = 'Budget consistently under-utilized. Consider reducing allocation.';
        potentialSavings = budget.amount - recommendedBudget;
      } else if (efficiency > 1.2) {
        // Over-spending
        recommendedBudget = Math.round(avgHistorical * 1.3);
        confidence = 0.9;
        reasoning = 'Budget frequently exceeded. Recommend increase to avoid overruns.';
        potentialSavings = recommendedBudget - budget.amount;
      } else {
        // Well-balanced
        recommendedBudget = Math.round(avgHistorical * 1.05);
        confidence = 0.7;
        reasoning = 'Budget well-balanced. Minor adjustment based on trends.';
        potentialSavings = Math.abs(budget.amount - recommendedBudget);
      }

      recommendations.push({
        category: budget.category,
        currentBudget: budget.amount,
        actualSpending: budget.spent,
        recommendedBudget,
        confidence,
        reasoning,
        potentialSavings
      });
    });

    return recommendations.sort((a, b) => b.potentialSavings - a.potentialSavings);
  }

  // Private helper methods

  private async computeAnalytics(filters: AnalyticsFilters): Promise<AdvancedAnalyticsData> {
    const expenses = this.getFilteredExpenses(filters);
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();

    // Summary calculations
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalTransactions = expenses.length;
    const averagePerTransaction = totalTransactions > 0 ? totalExpenses / totalTransactions : 0;

    // Category distribution
    const categoryDistribution = this.calculateCategoryTotals(expenses);
    const companyDistribution = this.calculateCompanyDistribution(expenses);

    // Monthly growth
    const monthlyGrowth = this.calculateMonthlyGrowth(expenses);

    // Insights
    const topCategories = this.calculateTopCategories(expenses);
    const topMerchants = this.calculateTopMerchants(expenses);
    const spendingTrends = this.calculateSpendingTrends(expenses);
    const budgetPerformance = this.calculateBudgetPerformance(expenses);
    const culturalImpact = this.calculateCulturalImpact(expenses);
    const paymentMethodBreakdown = this.calculatePaymentMethodBreakdown(expenses);

    // Forecasts
    const monthlyForecast = this.generateMonthlyForecast(expenses);
    const categoryForecasts = this.generateCategoryForecasts(expenses);
    const budgetRiskAnalysis = this.generateBudgetRiskAnalysis();

    // Recommendations
    const budgetOptimizations = this.generateBudgetOptimizations();
    const costSavings = this.generateCostSavings(expenses);
    const culturalPreparation = this.generateCulturalPreparation(culturalContext);

    return {
      summary: {
        totalExpenses,
        totalTransactions,
        averagePerTransaction,
        monthlyGrowth,
        categoryDistribution,
        companyDistribution
      },
      insights: {
        topCategories,
        topMerchants,
        spendingTrends,
        budgetPerformance,
        culturalImpact,
        paymentMethodBreakdown
      },
      forecasts: {
        monthlyForecast,
        categoryForecasts,
        budgetRiskAnalysis
      },
      recommendations: {
        budgetOptimizations,
        costSavings,
        culturalPreparation
      }
    };
  }

  private getFilteredExpenses(filters: AnalyticsFilters): any[] {
    let expenses: any[] = [];

    if (filters.companyId) {
      expenses = multiCompanyService.getCompanyExpenses(filters.companyId, {
        departmentId: filters.departmentId,
        projectId: filters.projectId,
        dateFrom: filters.period.startDate,
        dateTo: filters.period.endDate,
        category: filters.categories?.[0]
      });
    } else {
      // Get all expenses from localStorage (simplified)
      try {
        const stored = localStorage.getItem('tracksy-expenses');
        if (stored) {
          expenses = JSON.parse(stored).map((exp: any) => ({
            ...exp,
            date: new Date(exp.date)
          }));
        }
      } catch (error) {
        console.error('Error loading expenses:', error);
      }
    }

    // Apply additional filters
    if (filters.categories?.length) {
      expenses = expenses.filter(e => filters.categories!.includes(e.category));
    }

    if (filters.merchants?.length) {
      expenses = expenses.filter(e => e.merchant && filters.merchants!.includes(e.merchant));
    }

    if (filters.paymentMethods?.length) {
      expenses = expenses.filter(e => filters.paymentMethods!.includes(e.paymentMethod));
    }

    if (filters.minAmount !== undefined) {
      expenses = expenses.filter(e => e.amount >= filters.minAmount!);
    }

    if (filters.maxAmount !== undefined) {
      expenses = expenses.filter(e => e.amount <= filters.maxAmount!);
    }

    return expenses.filter(e => 
      e.date >= filters.period.startDate && e.date <= filters.period.endDate
    );
  }

  private getExpensesForPeriod(startDate: Date, endDate: Date, companyId?: string): any[] {
    if (companyId) {
      return multiCompanyService.getCompanyExpenses(companyId, {
        dateFrom: startDate,
        dateTo: endDate
      });
    }

    // Get all expenses from localStorage
    try {
      const stored = localStorage.getItem('tracksy-expenses');
      if (stored) {
        return JSON.parse(stored)
          .map((exp: any) => ({ ...exp, date: new Date(exp.date) }))
          .filter((exp: any) => exp.date >= startDate && exp.date <= endDate);
      }
    } catch (error) {
      console.error('Error loading expenses:', error);
    }

    return [];
  }

  private calculateCategoryTotals(expenses: any[]): Record<string, number> {
    const totals: Record<string, number> = {};
    expenses.forEach(expense => {
      totals[expense.category] = (totals[expense.category] || 0) + expense.amount;
    });
    return totals;
  }

  private calculateCompanyDistribution(expenses: any[]): Record<string, number> {
    const distribution: Record<string, number> = {};
    expenses.forEach(expense => {
      if (expense.companyId) {
        const company = multiCompanyService.getUserCompanies()
          .find(c => c.id === expense.companyId);
        if (company) {
          distribution[company.name] = (distribution[company.name] || 0) + expense.amount;
        }
      } else {
        distribution['Personal'] = (distribution['Personal'] || 0) + expense.amount;
      }
    });
    return distribution;
  }

  private calculateMonthlyGrowth(expenses: any[]): number {
    const now = new Date();
    const currentMonth = expenses.filter(e => 
      e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear()
    );
    const previousMonth = expenses.filter(e => {
      const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return e.date.getMonth() === prevDate.getMonth() && e.date.getFullYear() === prevDate.getFullYear();
    });

    const currentTotal = currentMonth.reduce((sum, e) => sum + e.amount, 0);
    const previousTotal = previousMonth.reduce((sum, e) => sum + e.amount, 0);

    return previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
  }

  private calculateTopCategories(expenses: any[]): Array<{ category: string; amount: number; percentage: number }> {
    const totals = this.calculateCategoryTotals(expenses);
    const grandTotal = Object.values(totals).reduce((sum, val) => sum + val, 0);

    return Object.entries(totals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: grandTotal > 0 ? (amount / grandTotal) * 100 : 0
      }));
  }

  private calculateTopMerchants(expenses: any[]): Array<{ merchant: string; amount: number; transactions: number }> {
    const merchantData = new Map<string, { amount: number; transactions: number }>();

    expenses.forEach(expense => {
      if (expense.merchant) {
        const existing = merchantData.get(expense.merchant) || { amount: 0, transactions: 0 };
        existing.amount += expense.amount;
        existing.transactions += 1;
        merchantData.set(expense.merchant, existing);
      }
    });

    return Array.from(merchantData.entries())
      .sort(([, a], [, b]) => b.amount - a.amount)
      .slice(0, 10)
      .map(([merchant, data]) => ({
        merchant,
        amount: data.amount,
        transactions: data.transactions
      }));
  }

  private calculateSpendingTrends(expenses: any[]): Array<{ month: string; amount: number; change: number }> {
    const monthlyTotals = new Map<string, number>();

    expenses.forEach(expense => {
      const monthKey = expense.date.toISOString().slice(0, 7);
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount);
    });

    const sortedMonths = Array.from(monthlyTotals.entries()).sort();
    
    return sortedMonths.map(([month, amount], index) => {
      const previousAmount = index > 0 ? sortedMonths[index - 1][1] : amount;
      const change = previousAmount > 0 ? ((amount - previousAmount) / previousAmount) * 100 : 0;
      
      return { month, amount, change };
    });
  }

  private calculateBudgetPerformance(expenses: any[]): Array<{ category: string; budgeted: number; spent: number; variance: number }> {
    const budgets = budgetAlertService.getAllBudgets();
    const categoryTotals = this.calculateCategoryTotals(expenses);

    return budgets.map(budget => {
      const spent = categoryTotals[budget.category] || 0;
      const variance = ((spent - budget.amount) / budget.amount) * 100;

      return {
        category: budget.category,
        budgeted: budget.amount,
        spent,
        variance
      };
    });
  }

  private calculateCulturalImpact(expenses: any[]): Array<{ event: string; increase: number; categories: string[] }> {
    // This would analyze spending patterns around cultural events
    // For now, return mock data based on cultural context
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();
    
    return culturalContext.upcomingEvents.slice(0, 3).map(event => ({
      event: event.name,
      increase: this.estimateCulturalSpendingIncrease(event.name),
      categories: this.getCulturalCategories(event.name)
    }));
  }

  private calculatePaymentMethodBreakdown(expenses: any[]): Record<string, { amount: number; count: number }> {
    const breakdown: Record<string, { amount: number; count: number }> = {};

    expenses.forEach(expense => {
      const method = expense.paymentMethod || 'unknown';
      const existing = breakdown[method] || { amount: 0, count: 0 };
      existing.amount += expense.amount;
      existing.count += 1;
      breakdown[method] = existing;
    });

    return breakdown;
  }

  private generateMonthlyForecast(expenses: any[]): Array<{ month: string; predicted: number; confidence: number }> {
    // Simple trend-based forecast
    const trends = this.calculateSpendingTrends(expenses);
    const forecasts: Array<{ month: string; predicted: number; confidence: number }> = [];

    if (trends.length > 0) {
      const lastTrend = trends[trends.length - 1];
      const avgGrowth = trends.reduce((sum, t) => sum + t.change, 0) / trends.length;

      for (let i = 1; i <= 6; i++) {
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + i);
        const monthKey = futureDate.toISOString().slice(0, 7);
        
        const predicted = lastTrend.amount * Math.pow(1 + avgGrowth / 100, i);
        const confidence = Math.max(0.3, 0.9 - (i * 0.1));

        forecasts.push({
          month: monthKey,
          predicted: Math.round(predicted),
          confidence
        });
      }
    }

    return forecasts;
  }

  private generateCategoryForecasts(expenses: any[]): Record<string, { current: number; predicted: number; trend: 'up' | 'down' | 'stable' }> {
    const categoryTotals = this.calculateCategoryTotals(expenses);
    const forecasts: Record<string, { current: number; predicted: number; trend: 'up' | 'down' | 'stable' }> = {};

    Object.entries(categoryTotals).forEach(([category, current]) => {
      // Simple trend analysis
      const trend = this.determineCategoryTrend(category, expenses);
      const multiplier = trend === 'up' ? 1.1 : trend === 'down' ? 0.9 : 1.0;
      
      forecasts[category] = {
        current,
        predicted: Math.round(current * multiplier),
        trend
      };
    });

    return forecasts;
  }

  private generateBudgetRiskAnalysis(): Array<{ category: string; riskLevel: 'low' | 'medium' | 'high'; daysToExceed: number }> {
    const budgets = budgetAlertService.getAllBudgets();
    const forecasts = budgetAlertService.generateSpendingForecasts();

    return forecasts.map(forecast => {
      const budget = budgets.find(b => b.category === forecast.category);
      const daysToExceed = forecast.projectedSpending > forecast.budgetAmount ? 
        Math.max(0, forecast.daysRemaining - 5) : -1;

      return {
        category: forecast.category,
        riskLevel: forecast.riskLevel,
        daysToExceed
      };
    });
  }

  private generateCostSavings(expenses: any[]): Array<{ category: string; potentialSavings: number; suggestion: string }> {
    const suggestions = [
      { category: 'Food & Dining', potentialSavings: 5000, suggestion: 'Consider meal planning and home cooking 2-3 times per week' },
      { category: 'Transport', potentialSavings: 3000, suggestion: 'Use public transport or carpool for daily commute' },
      { category: 'Entertainment', potentialSavings: 2000, suggestion: 'Look for free or low-cost entertainment options' },
      { category: 'Shopping', potentialSavings: 4000, suggestion: 'Compare prices and wait for sales before purchasing' }
    ];

    return suggestions.filter(s => {
      const categoryTotal = this.calculateCategoryTotals(expenses)[s.category] || 0;
      return categoryTotal > s.potentialSavings;
    });
  }

  private generateCulturalPreparation(culturalContext: any): Array<{ event: string; date: string; suggestedBudget: number; categories: string[] }> {
    return culturalContext.upcomingEvents.slice(0, 3).map((event: any) => ({
      event: event.name,
      date: event.date,
      suggestedBudget: this.calculateCulturalBudget(event.name),
      categories: this.getCulturalCategories(event.name)
    }));
  }

  // Helper methods for calculations

  private calculateBudgetHealth(budgets: any[]): 'excellent' | 'good' | 'warning' | 'critical' {
    if (budgets.length === 0) return 'good';

    const overBudgetCount = budgets.filter(b => b.spent > b.amount).length;
    const warningCount = budgets.filter(b => (b.spent / b.amount) > 0.8).length;

    const overBudgetRatio = overBudgetCount / budgets.length;
    const warningRatio = warningCount / budgets.length;

    if (overBudgetRatio > 0.5) return 'critical';
    if (overBudgetRatio > 0.2 || warningRatio > 0.5) return 'warning';
    if (warningRatio > 0.2) return 'good';
    return 'excellent';
  }

  private getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      'Food & Dining': '🍽️',
      'Transport': '🚗',
      'Groceries': '🛒',
      'Entertainment': '🎬',
      'Healthcare': '🏥',
      'Shopping': '🛍️',
      'Utilities': '💡',
      'Education': '📚'
    };
    return icons[category] || '💰';
  }

  private determineCulturalImpact(eventName: string): string {
    const highImpact = ['avurudu', 'vesak', 'christmas', 'wedding'];
    const mediumImpact = ['poya', 'eid', 'diwali'];
    
    const lowerEvent = eventName.toLowerCase();
    
    if (highImpact.some(event => lowerEvent.includes(event))) return 'high';
    if (mediumImpact.some(event => lowerEvent.includes(event))) return 'medium';
    return 'low';
  }

  private calculateMonthlyPattern(expenses: any[]): Array<{ week: number; amount: number; trend: 'up' | 'down' | 'stable' }> {
    const weeklyTotals = new Map<number, number>();

    expenses.forEach(expense => {
      const weekOfMonth = Math.ceil(expense.date.getDate() / 7);
      weeklyTotals.set(weekOfMonth, (weeklyTotals.get(weekOfMonth) || 0) + expense.amount);
    });

    const weeks = Array.from(weeklyTotals.entries()).sort(([a], [b]) => a - b);
    
    return weeks.map(([week, amount], index) => {
      const previousAmount = index > 0 ? weeks[index - 1][1] : amount;
      const change = (amount - previousAmount) / previousAmount;
      
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (change > 0.1) trend = 'up';
      else if (change < -0.1) trend = 'down';

      return { week, amount, trend };
    });
  }

  private calculateSeasonalPattern(expenses: any[]): Array<{ month: string; amount: number; culturalFactor: number }> {
    const monthlyTotals = new Map<string, number>();

    expenses.forEach(expense => {
      const monthKey = expense.date.toISOString().slice(5, 7);
      monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + expense.amount);
    });

    const months = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return months.map((month, index) => ({
      month: monthNames[index],
      amount: monthlyTotals.get(month) || 0,
      culturalFactor: this.getCulturalFactorForMonth(month)
    }));
  }

  private analyzeMerchantLoyalty(expenses: any[]): Array<{ merchant: string; frequency: number; averageSpend: number; loyalty: 'high' | 'medium' | 'low' }> {
    const merchantData = new Map<string, { visits: number; totalSpent: number }>();

    expenses.forEach(expense => {
      if (expense.merchant) {
        const existing = merchantData.get(expense.merchant) || { visits: 0, totalSpent: 0 };
        existing.visits += 1;
        existing.totalSpent += expense.amount;
        merchantData.set(expense.merchant, existing);
      }
    });

    return Array.from(merchantData.entries())
      .map(([merchant, data]) => {
        const frequency = data.visits;
        const averageSpend = data.totalSpent / data.visits;
        
        let loyalty: 'high' | 'medium' | 'low' = 'low';
        if (frequency >= 10) loyalty = 'high';
        else if (frequency >= 5) loyalty = 'medium';

        return { merchant, frequency, averageSpend, loyalty };
      })
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 10);
  }

  private getHistoricalSpendingData(companyId?: string): Record<string, number[]> {
    // Mock historical data - in a real app, this would come from a database
    return {
      'Food & Dining': [12000, 13000, 11500, 14000, 12500],
      'Transport': [8000, 8500, 7800, 8200, 8100],
      'Groceries': [15000, 14500, 15200, 14800, 15100],
      'Entertainment': [5000, 4500, 5200, 4800, 5100],
      'Healthcare': [3000, 3200, 2800, 3100, 2900]
    };
  }

  private determineCategoryTrend(category: string, expenses: any[]): 'up' | 'down' | 'stable' {
    const categoryExpenses = expenses.filter(e => e.category === category);
    if (categoryExpenses.length < 4) return 'stable';

    const recent = categoryExpenses.slice(0, Math.floor(categoryExpenses.length / 2));
    const older = categoryExpenses.slice(Math.floor(categoryExpenses.length / 2));

    const recentAvg = recent.reduce((sum, e) => sum + e.amount, 0) / recent.length;
    const olderAvg = older.reduce((sum, e) => sum + e.amount, 0) / older.length;

    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.1) return 'up';
    if (change < -0.1) return 'down';
    return 'stable';
  }

  private estimateCulturalSpendingIncrease(eventName: string): number {
    const increases: Record<string, number> = {
      'avurudu': 150,
      'vesak': 80,
      'christmas': 120,
      'wedding': 200,
      'poya': 30,
      'eid': 100
    };

    const lowerEvent = eventName.toLowerCase();
    for (const [event, increase] of Object.entries(increases)) {
      if (lowerEvent.includes(event)) {
        return increase;
      }
    }
    return 20;
  }

  private getCulturalCategories(eventName: string): string[] {
    const categories: Record<string, string[]> = {
      'avurudu': ['Food & Dining', 'Gifts', 'Clothing', 'Decorations'],
      'vesak': ['Food & Dining', 'Donations', 'Decorations'],
      'christmas': ['Food & Dining', 'Gifts', 'Decorations'],
      'wedding': ['Gifts', 'Clothing', 'Transport', 'Accommodation'],
      'poya': ['Food & Dining', 'Donations']
    };

    const lowerEvent = eventName.toLowerCase();
    for (const [event, cats] of Object.entries(categories)) {
      if (lowerEvent.includes(event)) {
        return cats;
      }
    }
    return ['Food & Dining'];
  }

  private calculateCulturalBudget(eventName: string): number {
    const baseBudgets: Record<string, number> = {
      'avurudu': 25000,
      'vesak': 8000,
      'christmas': 18000,
      'wedding': 30000,
      'poya': 3000,
      'eid': 15000
    };

    const lowerEvent = eventName.toLowerCase();
    for (const [event, budget] of Object.entries(baseBudgets)) {
      if (lowerEvent.includes(event)) {
        return budget;
      }
    }
    return 5000;
  }

  private getCulturalFactorForMonth(month: string): number {
    const factors: Record<string, number> = {
      '01': 1.2, // January - New Year
      '04': 1.8, // April - Avurudu
      '05': 1.5, // May - Vesak
      '12': 1.6  // December - Christmas
    };
    return factors[month] || 1.0;
  }

  private generateCacheKey(filters: AnalyticsFilters): string {
    return JSON.stringify({
      companyId: filters.companyId,
      departmentId: filters.departmentId,
      projectId: filters.projectId,
      period: filters.period,
      categories: filters.categories?.sort(),
      merchants: filters.merchants?.sort(),
      paymentMethods: filters.paymentMethods?.sort(),
      minAmount: filters.minAmount,
      maxAmount: filters.maxAmount
    });
  }
}

export const advancedAnalyticsService = AdvancedAnalyticsService.getInstance();