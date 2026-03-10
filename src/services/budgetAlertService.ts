import { culturalIntegrationService } from './culturalIntegrationService';

export interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  endDate: Date;
  alertThreshold: number; // Percentage (e.g., 80 for 80%)
  culturalContext?: string;
  isActive: boolean;
}

export interface BudgetAlert {
  id: string;
  budgetId: string;
  type: 'threshold' | 'exceeded' | 'cultural' | 'forecast';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  messageLocal?: string; // Localized message
  amount: number;
  percentage: number;
  triggeredAt: Date;
  isRead: boolean;
  suggestedActions?: string[];
}

export interface SpendingForecast {
  category: string;
  currentSpending: number;
  projectedSpending: number;
  budgetAmount: number;
  riskLevel: 'low' | 'medium' | 'high';
  daysRemaining: number;
  culturalEvents?: string[];
}

export class BudgetAlertService {
  private static instance: BudgetAlertService;
  private budgets: Map<string, Budget> = new Map();
  private alerts: Map<string, BudgetAlert> = new Map();
  private listeners: Set<(alert: BudgetAlert) => void> = new Set();

  // Cultural budget multipliers for different events
  private culturalMultipliers = {
    vesak: 2.5,
    avurudu: 3.0,
    poya: 1.5,
    eid: 2.0,
    christmas: 2.5,
    wedding: 4.0,
    funeral: 2.0,
    default: 1.0
  };

  public static getInstance(): BudgetAlertService {
    if (!BudgetAlertService.instance) {
      BudgetAlertService.instance = new BudgetAlertService();
    }
    return BudgetAlertService.instance;
  }

  constructor() {
    this.loadBudgets();
    this.loadAlerts();
    
    // Check for alerts every hour
    setInterval(() => {
      this.checkAllBudgets();
    }, 60 * 60 * 1000);
  }

  /**
   * Create a new budget with cultural awareness
   */
  public async createBudget(budgetData: Omit<Budget, 'id' | 'spent'>): Promise<Budget> {
    const budget: Budget = {
      ...budgetData,
      id: this.generateBudgetId(),
      spent: 0
    };

    // Enhance with cultural context if applicable
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();
    if (culturalContext.currentEvent || culturalContext.upcomingEvents.length > 0) {
      budget.culturalContext = culturalContext.currentEvent?.name || culturalContext.upcomingEvents[0]?.name;
      
      // Adjust budget amount based on cultural events
      const multiplier = this.getCulturalMultiplier(budget.culturalContext);
      if (multiplier > 1.2) {
        const originalAmount = budget.amount;
        budget.amount = Math.round(budget.amount * multiplier);
        
        // Create informational alert about budget adjustment
        this.createAlert({
          budgetId: budget.id,
          type: 'cultural',
          severity: 'info',
          message: `Budget adjusted for ${budget.culturalContext}: ${originalAmount} → ${budget.amount} LKR`,
          amount: budget.amount,
          percentage: 0
        });
      }
    }

    this.budgets.set(budget.id, budget);
    this.saveBudgets();
    
    return budget;
  }

  /**
   * Update budget spending when an expense is added
   */
  public async updateBudgetSpending(category: string, amount: number, expenseDate: Date): Promise<void> {
    const relevantBudgets = Array.from(this.budgets.values()).filter(budget => 
      budget.category === category && 
      budget.isActive &&
      expenseDate >= budget.startDate && 
      expenseDate <= budget.endDate
    );

    for (const budget of relevantBudgets) {
      budget.spent += amount;
      
      // Check for threshold alerts
      const percentage = (budget.spent / budget.amount) * 100;
      
      if (percentage >= budget.alertThreshold && percentage < 100) {
        this.createAlert({
          budgetId: budget.id,
          type: 'threshold',
          severity: 'warning',
          message: `Budget alert: ${percentage.toFixed(1)}% of ${budget.category} budget used (${budget.spent}/${budget.amount} LKR)`,
          amount: budget.spent,
          percentage
        });
      } else if (percentage >= 100) {
        this.createAlert({
          budgetId: budget.id,
          type: 'exceeded',
          severity: 'critical',
          message: `Budget exceeded: ${budget.category} budget exceeded by ${budget.spent - budget.amount} LKR`,
          amount: budget.spent,
          percentage
        });
      }
    }
    
    this.saveBudgets();
  }

  /**
   * Generate spending forecasts with cultural awareness
   */
  public generateSpendingForecasts(): SpendingForecast[] {
    const forecasts: SpendingForecast[] = [];
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();
    
    for (const budget of this.budgets.values()) {
      if (!budget.isActive) continue;
      
      const daysElapsed = Math.ceil((new Date().getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const totalDays = Math.ceil((budget.endDate.getTime() - budget.startDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysRemaining = totalDays - daysElapsed;
      
      if (daysRemaining <= 0) continue;
      
      // Calculate current spending rate
      const dailySpendingRate = budget.spent / Math.max(daysElapsed, 1);
      let projectedSpending = budget.spent + (dailySpendingRate * daysRemaining);
      
      // Adjust for upcoming cultural events
      const upcomingEvents = culturalContext.upcomingEvents.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate <= budget.endDate;
      });
      
      if (upcomingEvents.length > 0) {
        const culturalMultiplier = this.getAverageCulturalMultiplier(upcomingEvents.map(e => e.name));
        projectedSpending *= culturalMultiplier;
      }
      
      // Determine risk level
      const riskLevel = this.calculateRiskLevel(projectedSpending, budget.amount);
      
      forecasts.push({
        category: budget.category,
        currentSpending: budget.spent,
        projectedSpending: Math.round(projectedSpending),
        budgetAmount: budget.amount,
        riskLevel,
        daysRemaining,
        culturalEvents: upcomingEvents.map(e => e.name)
      });
      
      // Create forecast alerts for high risk budgets
      if (riskLevel === 'high') {
        this.createAlert({
          budgetId: budget.id,
          type: 'forecast',
          severity: 'warning',
          message: `Spending forecast: ${budget.category} budget likely to exceed by ${Math.round(projectedSpending - budget.amount)} LKR`,
          amount: projectedSpending,
          percentage: (projectedSpending / budget.amount) * 100
        });
      }
    }
    
    return forecasts;
  }

  /**
   * Get smart budget recommendations based on spending patterns
   */
  public getSmartBudgetRecommendations(): Array<{
    category: string;
    recommendedAmount: number;
    reasoning: string;
    culturalAdjustment: number;
    priority: 'high' | 'medium' | 'low';
  }> {
    const recommendations: any[] = [];
    const culturalContext = culturalIntegrationService.getCurrentCulturalContext();
    const culturalRecommendations = culturalIntegrationService.getCulturalBudgetRecommendations();
    
    // Historical spending analysis (would use actual data)
    const historicalData = {
      'Food & Dining': { average: 15000, trend: 'increasing' },
      'Transport': { average: 8000, trend: 'stable' },
      'Groceries': { average: 12000, trend: 'stable' },
      'Entertainment': { average: 5000, trend: 'decreasing' },
      'Healthcare': { average: 3000, trend: 'stable' }
    };
    
    for (const [category, data] of Object.entries(historicalData)) {
      let recommendedAmount = data.average;
      let culturalAdjustment = 1.0;
      let reasoning = `Based on historical spending of ${data.average} LKR/month`;
      
      // Apply cultural adjustments
      const relevantCulturalBudgets = culturalRecommendations.filter(cb => 
        cb.categories.some(cat => cat.toLowerCase().includes(category.toLowerCase()))
      );
      
      if (relevantCulturalBudgets.length > 0) {
        const culturalBudget = relevantCulturalBudgets[0];
        culturalAdjustment = Math.min(culturalBudget.suggestedBudget / recommendedAmount, 3.0);
        recommendedAmount = Math.round(recommendedAmount * culturalAdjustment);
        reasoning += `. Adjusted for ${culturalBudget.event} (+${Math.round((culturalAdjustment - 1) * 100)}%)`;
      }
      
      // Apply trend adjustments
      if (data.trend === 'increasing') {
        recommendedAmount = Math.round(recommendedAmount * 1.1);
        reasoning += '. Increased due to upward trend';
      }
      
      recommendations.push({
        category,
        recommendedAmount,
        reasoning,
        culturalAdjustment,
        priority: culturalAdjustment > 1.5 ? 'high' : 'medium'
      });
    }
    
    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Add a listener for budget alerts
   */
  public addAlertListener(listener: (alert: BudgetAlert) => void): void {
    this.listeners.add(listener);
  }

  /**
   * Remove a listener for budget alerts
   */
  public removeAlertListener(listener: (alert: BudgetAlert) => void): void {
    this.listeners.delete(listener);
  }

  /**
   * Get all active alerts
   */
  public getActiveAlerts(): BudgetAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert => !alert.isRead)
      .sort((a, b) => b.triggeredAt.getTime() - a.triggeredAt.getTime());
  }

  /**
   * Mark an alert as read
   */
  public markAlertAsRead(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.isRead = true;
      this.saveAlerts();
    }
  }

  /**
   * Get all budgets
   */
  public getAllBudgets(): Budget[] {
    return Array.from(this.budgets.values());
  }

  /**
   * Delete a budget
   */
  public deleteBudget(budgetId: string): void {
    this.budgets.delete(budgetId);
    
    // Remove related alerts
    const relatedAlerts = Array.from(this.alerts.values())
      .filter(alert => alert.budgetId === budgetId);
    
    for (const alert of relatedAlerts) {
      this.alerts.delete(alert.id);
    }
    
    this.saveBudgets();
    this.saveAlerts();
  }

  // Private helper methods

  private createAlert(alertData: Omit<BudgetAlert, 'id' | 'triggeredAt' | 'isRead' | 'messageLocal'>): void {
    const alert: BudgetAlert = {
      ...alertData,
      id: this.generateAlertId(),
      triggeredAt: new Date(),
      isRead: false,
      messageLocal: this.localizeMessage(alertData.message)
    };

    this.alerts.set(alert.id, alert);
    this.saveAlerts();
    
    // Notify listeners
    for (const listener of this.listeners) {
      listener(alert);
    }
  }

  private getCulturalMultiplier(eventName?: string): number {
    if (!eventName) return 1.0;
    
    const lowerEventName = eventName.toLowerCase();
    
    for (const [event, multiplier] of Object.entries(this.culturalMultipliers)) {
      if (lowerEventName.includes(event)) {
        return multiplier;
      }
    }
    
    return this.culturalMultipliers.default;
  }

  private getAverageCulturalMultiplier(eventNames: string[]): number {
    if (eventNames.length === 0) return 1.0;
    
    const multipliers = eventNames.map(name => this.getCulturalMultiplier(name));
    return multipliers.reduce((sum, mult) => sum + mult, 0) / multipliers.length;
  }

  private calculateRiskLevel(projected: number, budget: number): 'low' | 'medium' | 'high' {
    const ratio = projected / budget;
    
    if (ratio <= 0.8) return 'low';
    if (ratio <= 1.0) return 'medium';
    return 'high';
  }

  private checkAllBudgets(): void {
    const now = new Date();
    
    for (const budget of this.budgets.values()) {
      if (!budget.isActive || now > budget.endDate) continue;
      
      const percentage = (budget.spent / budget.amount) * 100;
      
      // Check if we should create any alerts
      if (percentage >= budget.alertThreshold) {
        const existingAlerts = Array.from(this.alerts.values())
          .filter(alert => alert.budgetId === budget.id && alert.type === 'threshold');
        
        if (existingAlerts.length === 0) {
          this.createAlert({
            budgetId: budget.id,
            type: 'threshold',
            severity: 'warning',
            message: `Budget threshold reached: ${percentage.toFixed(1)}% of ${budget.category} budget used`,
            amount: budget.spent,
            percentage
          });
        }
      }
    }
  }

  private localizeMessage(message: string): string {
    // Simple localization - in a real app, this would use proper i18n
    const translations: Record<string, Record<string, string>> = {
      en: {
        'Budget alert': 'Budget alert',
        'Budget exceeded': 'Budget exceeded',
        'Spending forecast': 'Spending forecast'
      },
      si: {
        'Budget alert': 'අයවැය අනතුරු ඇඟවීම',
        'Budget exceeded': 'අයවැය ඉක්මවා ගොස් ඇත',
        'Spending forecast': 'වියදම් පුරෝකථනය'
      },
      ta: {
        'Budget alert': 'வரவு செலவு எச்சரிக்கை',
        'Budget exceeded': 'வரவு செலவு மீறிய',
        'Spending forecast': 'செலவு முன்னறிவிப்பு'
      }
    };
    
    // For now, return the original message
    return message;
  }

  private generateBudgetId(): string {
    return `budget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private loadBudgets(): void {
    try {
      const stored = localStorage.getItem('tracksy-budgets');
      if (stored) {
        const budgetsArray = JSON.parse(stored);
        for (const budget of budgetsArray) {
          budget.startDate = new Date(budget.startDate);
          budget.endDate = new Date(budget.endDate);
          this.budgets.set(budget.id, budget);
        }
      }
    } catch (error) {
      console.error('Error loading budgets:', error);
    }
  }

  private saveBudgets(): void {
    try {
      const budgetsArray = Array.from(this.budgets.values());
      localStorage.setItem('tracksy-budgets', JSON.stringify(budgetsArray));
    } catch (error) {
      console.error('Error saving budgets:', error);
    }
  }

  private loadAlerts(): void {
    try {
      const stored = localStorage.getItem('tracksy-alerts');
      if (stored) {
        const alertsArray = JSON.parse(stored);
        for (const alert of alertsArray) {
          alert.triggeredAt = new Date(alert.triggeredAt);
          this.alerts.set(alert.id, alert);
        }
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  }

  private saveAlerts(): void {
    try {
      const alertsArray = Array.from(this.alerts.values());
      localStorage.setItem('tracksy-alerts', JSON.stringify(alertsArray));
    } catch (error) {
      console.error('Error saving alerts:', error);
    }
  }
}

export const budgetAlertService = BudgetAlertService.getInstance();