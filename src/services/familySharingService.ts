// Family Sharing and Real-time Collaboration Service
// Phase 9: Multi-user expense sharing with Sri Lankan family context

export interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: 'parent' | 'spouse' | 'child' | 'elder' | 'guest';
  avatar?: string;
  phoneNumber?: string;
  permissions: FamilyPermissions;
  isActive: boolean;
  joinedDate: Date;
  culturalRole?: 'household_head' | 'financial_manager' | 'contributor' | 'dependent';
}

export interface FamilyPermissions {
  canAddExpenses: boolean;
  canEditExpenses: boolean;
  canDeleteExpenses: boolean;
  canViewReports: boolean;
  canManageBudgets: boolean;
  canInviteMembers: boolean;
  canViewSensitiveData: boolean;
  spendingLimit?: number;
  categoryRestrictions?: string[];
}

export interface SharedExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: Date;
  addedBy: string;
  sharedWith: string[];
  splitType: 'equal' | 'percentage' | 'fixed' | 'by_income';
  splits: ExpenseSplit[];
  approvalRequired: boolean;
  approvals: ExpenseApproval[];
  status: 'pending' | 'approved' | 'rejected' | 'settled';
  culturalContext?: string;
  isRecurring?: boolean;
  recurringPattern?: RecurringPattern;
}

export interface ExpenseSplit {
  memberId: string;
  amount: number;
  percentage?: number;
  isPaid: boolean;
  paidDate?: Date;
  paymentMethod?: string;
}

export interface ExpenseApproval {
  memberId: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: Date;
  comment?: string;
}

export interface FamilyBudget {
  id: string;
  name: string;
  category: string;
  totalAmount: number;
  spent: number;
  period: 'weekly' | 'monthly' | 'yearly';
  participants: string[];
  contributions: BudgetContribution[];
  alerts: BudgetAlert[];
  culturalPriority?: 'essential' | 'cultural' | 'discretionary';
}

export interface BudgetContribution {
  memberId: string;
  amount: number;
  contributedAmount: number;
  dueDate?: Date;
}

export interface BudgetAlert {
  id: string;
  type: 'approaching_limit' | 'exceeded' | 'contribution_due' | 'cultural_event';
  threshold: number;
  recipients: string[];
  isActive: boolean;
}

export interface FamilyActivity {
  id: string;
  type: 'expense_added' | 'expense_approved' | 'budget_updated' | 'member_joined' | 'goal_achieved';
  memberId: string;
  description: string;
  timestamp: Date;
  data?: any;
  isRead: Record<string, boolean>;
}

export interface RecurringPattern {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  maxOccurrences?: number;
  culturalEvents?: string[];
}

export interface FamilyGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  participants: string[];
  contributions: GoalContribution[];
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
  culturalSignificance?: string;
}

export interface GoalContribution {
  memberId: string;
  amount: number;
  date: Date;
  note?: string;
}

export class FamilySharingService {
  private static instance: FamilySharingService;
  private familyMembers: Map<string, FamilyMember> = new Map();
  private sharedExpenses: Map<string, SharedExpense> = new Map();
  private familyBudgets: Map<string, FamilyBudget> = new Map();
  private familyActivities: FamilyActivity[] = [];
  private familyGoals: Map<string, FamilyGoal> = new Map();
  private currentFamilyId: string = 'default-family';
  private currentUserId: string = 'current-user';

  // Sri Lankan family cultural patterns
  private sriLankanFamilyRoles = {
    'household_head': {
      permissions: {
        canAddExpenses: true,
        canEditExpenses: true,
        canDeleteExpenses: true,
        canViewReports: true,
        canManageBudgets: true,
        canInviteMembers: true,
        canViewSensitiveData: true
      },
      responsibilities: ['major_purchases', 'budget_oversight', 'family_planning']
    },
    'financial_manager': {
      permissions: {
        canAddExpenses: true,
        canEditExpenses: true,
        canDeleteExpenses: false,
        canViewReports: true,
        canManageBudgets: true,
        canInviteMembers: false,
        canViewSensitiveData: true
      },
      responsibilities: ['daily_expenses', 'budget_tracking', 'bill_payments']
    },
    'contributor': {
      permissions: {
        canAddExpenses: true,
        canEditExpenses: true,
        canDeleteExpenses: false,
        canViewReports: true,
        canManageBudgets: false,
        canInviteMembers: false,
        canViewSensitiveData: false,
        spendingLimit: 25000
      },
      responsibilities: ['personal_expenses', 'assigned_categories']
    },
    'dependent': {
      permissions: {
        canAddExpenses: true,
        canEditExpenses: false,
        canDeleteExpenses: false,
        canViewReports: false,
        canManageBudgets: false,
        canInviteMembers: false,
        canViewSensitiveData: false,
        spendingLimit: 5000,
        categoryRestrictions: ['Education', 'Transport', 'Food']
      },
      responsibilities: ['education_expenses', 'personal_needs']
    }
  };

  public static getInstance(): FamilySharingService {
    if (!FamilySharingService.instance) {
      FamilySharingService.instance = new FamilySharingService();
    }
    return FamilySharingService.instance;
  }

  constructor() {
    this.loadFamilyData();
    this.initializeCulturalBudgets();
  }

  /**
   * Add a family member with Sri Lankan cultural context
   */
  public async addFamilyMember(
    name: string,
    email: string,
    role: FamilyMember['role'],
    culturalRole?: FamilyMember['culturalRole']
  ): Promise<string> {
    const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const permissions = culturalRole ? 
      this.sriLankanFamilyRoles[culturalRole].permissions : 
      this.getDefaultPermissions(role);

    const member: FamilyMember = {
      id: memberId,
      name,
      email,
      role,
      culturalRole,
      permissions,
      isActive: true,
      joinedDate: new Date()
    };

    this.familyMembers.set(memberId, member);
    
    // Add welcome activity
    this.addActivity({
      type: 'member_joined',
      memberId,
      description: `${name} joined the family expense sharing`
    });

    this.saveFamilyData();
    return memberId;
  }

  /**
   * Create shared expense with intelligent splitting
   */
  public async createSharedExpense(
    description: string,
    amount: number,
    category: string,
    sharedWith: string[],
    splitType: SharedExpense['splitType'] = 'equal',
    culturalContext?: string
  ): Promise<string> {
    const expenseId = `expense_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Calculate splits based on type
    const splits = this.calculateExpenseSplits(amount, sharedWith, splitType);
    
    // Check if approval is required based on amount and cultural context
    const approvalRequired = this.isApprovalRequired(amount, category, culturalContext);
    
    const sharedExpense: SharedExpense = {
      id: expenseId,
      description,
      amount,
      category,
      date: new Date(),
      addedBy: this.currentUserId,
      sharedWith,
      splitType,
      splits,
      approvalRequired,
      approvals: approvalRequired ? this.initializeApprovals(sharedWith) : [],
      status: approvalRequired ? 'pending' : 'approved',
      culturalContext
    };

    this.sharedExpenses.set(expenseId, sharedExpense);
    
    // Add activity
    this.addActivity({
      type: 'expense_added',
      memberId: this.currentUserId,
      description: `Added shared expense: ${description} (LKR ${amount.toLocaleString()})`
    });

    this.saveFamilyData();
    return expenseId;
  }

  /**
   * Create family budget with cultural priorities
   */
  public async createFamilyBudget(
    name: string,
    category: string,
    totalAmount: number,
    period: FamilyBudget['period'],
    participants: string[],
    culturalPriority?: FamilyBudget['culturalPriority']
  ): Promise<string> {
    const budgetId = `budget_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    // Calculate contributions based on family member income/role
    const contributions = this.calculateBudgetContributions(totalAmount, participants);
    
    const familyBudget: FamilyBudget = {
      id: budgetId,
      name,
      category,
      totalAmount,
      spent: 0,
      period,
      participants,
      contributions,
      alerts: this.createDefaultBudgetAlerts(budgetId),
      culturalPriority
    };

    this.familyBudgets.set(budgetId, familyBudget);
    
    this.addActivity({
      type: 'budget_updated',
      memberId: this.currentUserId,
      description: `Created family budget: ${name} (LKR ${totalAmount.toLocaleString()})`
    });

    this.saveFamilyData();
    return budgetId;
  }

  /**
   * Create family savings goal
   */
  public async createFamilyGoal(
    title: string,
    description: string,
    targetAmount: number,
    targetDate: Date,
    participants: string[],
    culturalSignificance?: string
  ): Promise<string> {
    const goalId = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    
    const familyGoal: FamilyGoal = {
      id: goalId,
      title,
      description,
      targetAmount,
      currentAmount: 0,
      targetDate,
      participants,
      contributions: [],
      isCompleted: false,
      priority: culturalSignificance ? 'high' : 'medium',
      culturalSignificance
    };

    this.familyGoals.set(goalId, familyGoal);
    
    this.addActivity({
      type: 'goal_achieved',
      memberId: this.currentUserId,
      description: `Created family goal: ${title} (Target: LKR ${targetAmount.toLocaleString()})`
    });

    this.saveFamilyData();
    return goalId;
  }

  /**
   * Approve or reject shared expense
   */
  public async approveExpense(
    expenseId: string,
    memberId: string,
    status: 'approved' | 'rejected',
    comment?: string
  ): Promise<boolean> {
    const expense = this.sharedExpenses.get(expenseId);
    if (!expense || !expense.approvalRequired) {
      return false;
    }

    // Update approval
    const approvalIndex = expense.approvals.findIndex(a => a.memberId === memberId);
    if (approvalIndex !== -1) {
      expense.approvals[approvalIndex] = {
        memberId,
        status,
        timestamp: new Date(),
        comment
      };
    }

    // Check if all required approvals are received
    const requiredApprovals = expense.approvals.filter(a => a.status !== 'pending');
    const approvedCount = expense.approvals.filter(a => a.status === 'approved').length;
    
    if (requiredApprovals.length === expense.approvals.length) {
      expense.status = approvedCount === expense.approvals.length ? 'approved' : 'rejected';
    }

    this.addActivity({
      type: 'expense_approved',
      memberId,
      description: `${status} expense: ${expense.description}`
    });

    this.saveFamilyData();
    return true;
  }

  /**
   * Get real-time family activities
   */
  public getFamilyActivities(limit: number = 20): FamilyActivity[] {
    return this.familyActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get family spending summary with cultural insights
   */
  public getFamilySpendingSummary(timeframe: 'week' | 'month' | 'year' = 'month'): {
    totalSpent: number;
    memberContributions: Record<string, number>;
    categoryBreakdown: Record<string, number>;
    culturalExpenses: number;
    pendingApprovals: number;
    budgetUtilization: Record<string, number>;
  } {
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const relevantExpenses = Array.from(this.sharedExpenses.values())
      .filter(expense => expense.date >= startDate);

    const totalSpent = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const memberContributions: Record<string, number> = {};
    const categoryBreakdown: Record<string, number> = {};
    let culturalExpenses = 0;

    relevantExpenses.forEach(expense => {
      // Member contributions
      expense.splits.forEach(split => {
        memberContributions[split.memberId] = 
          (memberContributions[split.memberId] || 0) + split.amount;
      });

      // Category breakdown
      categoryBreakdown[expense.category] = 
        (categoryBreakdown[expense.category] || 0) + expense.amount;

      // Cultural expenses
      if (expense.culturalContext || expense.category === 'Religious & Cultural') {
        culturalExpenses += expense.amount;
      }
    });

    const pendingApprovals = relevantExpenses
      .filter(expense => expense.status === 'pending').length;

    const budgetUtilization: Record<string, number> = {};
    this.familyBudgets.forEach((budget, budgetId) => {
      budgetUtilization[budgetId] = budget.spent / budget.totalAmount;
    });

    return {
      totalSpent,
      memberContributions,
      categoryBreakdown,
      culturalExpenses,
      pendingApprovals,
      budgetUtilization
    };
  }

  /**
   * Generate family financial report
   */
  public generateFamilyReport(timeframe: 'month' | 'quarter' | 'year' = 'month'): {
    summary: any;
    insights: string[];
    recommendations: string[];
    culturalAnalysis: any;
  } {
    const summary = this.getFamilySpendingSummary(timeframe);
    
    const insights: string[] = [];
    const recommendations: string[] = [];
    
    // Generate insights
    const topSpender = Object.entries(summary.memberContributions)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topSpender) {
      const member = this.familyMembers.get(topSpender[0]);
      insights.push(`${member?.name} contributed most to family expenses (LKR ${topSpender[1].toLocaleString()})`);
    }

    const topCategory = Object.entries(summary.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      insights.push(`Highest spending category: ${topCategory[0]} (LKR ${topCategory[1].toLocaleString()})`);
    }

    // Cultural analysis
    const culturalPercentage = (summary.culturalExpenses / summary.totalSpent) * 100;
    const culturalAnalysis = {
      culturalExpensePercentage: culturalPercentage,
      isBalanced: culturalPercentage >= 5 && culturalPercentage <= 15,
      recommendation: culturalPercentage < 5 ? 
        'Consider allocating more for cultural and religious activities' :
        culturalPercentage > 20 ? 
        'Cultural expenses are high, review for optimization' :
        'Good balance of cultural expenses'
    };

    // Generate recommendations
    if (summary.pendingApprovals > 5) {
      recommendations.push('Multiple expenses pending approval - review family approval process');
    }

    Object.entries(summary.budgetUtilization).forEach(([budgetId, utilization]) => {
      const budget = this.familyBudgets.get(budgetId);
      if (budget && utilization > 0.8) {
        recommendations.push(`${budget.name} budget is ${(utilization * 100).toFixed(1)}% utilized`);
      }
    });

    return {
      summary,
      insights,
      recommendations,
      culturalAnalysis
    };
  }

  // Helper methods

  private calculateExpenseSplits(
    amount: number, 
    memberIds: string[], 
    splitType: SharedExpense['splitType']
  ): ExpenseSplit[] {
    const splits: ExpenseSplit[] = [];

    switch (splitType) {
      case 'equal':
        const equalAmount = amount / memberIds.length;
        memberIds.forEach(memberId => {
          splits.push({
            memberId,
            amount: equalAmount,
            percentage: 100 / memberIds.length,
            isPaid: false
          });
        });
        break;

      case 'by_income':
        // Implement income-based splitting
        // For now, use equal split as fallback
        return this.calculateExpenseSplits(amount, memberIds, 'equal');

      default:
        return this.calculateExpenseSplits(amount, memberIds, 'equal');
    }

    return splits;
  }

  private isApprovalRequired(amount: number, category: string, culturalContext?: string): boolean {
    // Large amounts require approval
    if (amount > 25000) return true;
    
    // Cultural expenses require family consensus
    if (culturalContext || category === 'Religious & Cultural') return true;
    
    // Major categories require approval
    const majorCategories = ['Healthcare', 'Education', 'Utilities'];
    if (majorCategories.includes(category) && amount > 10000) return true;

    return false;
  }

  private initializeApprovals(memberIds: string[]): ExpenseApproval[] {
    return memberIds
      .filter(id => id !== this.currentUserId)
      .map(memberId => ({
        memberId,
        status: 'pending' as const,
        timestamp: new Date()
      }));
  }

  private calculateBudgetContributions(
    totalAmount: number, 
    participants: string[]
  ): BudgetContribution[] {
    const equalAmount = totalAmount / participants.length;
    
    return participants.map(memberId => ({
      memberId,
      amount: equalAmount,
      contributedAmount: 0
    }));
  }

  private createDefaultBudgetAlerts(budgetId: string): BudgetAlert[] {
    return [
      {
        id: `alert_${budgetId}_80`,
        type: 'approaching_limit',
        threshold: 0.8,
        recipients: Array.from(this.familyMembers.keys()),
        isActive: true
      },
      {
        id: `alert_${budgetId}_100`,
        type: 'exceeded',
        threshold: 1.0,
        recipients: Array.from(this.familyMembers.keys()),
        isActive: true
      }
    ];
  }

  private getDefaultPermissions(role: FamilyMember['role']): FamilyPermissions {
    switch (role) {
      case 'parent':
        return this.sriLankanFamilyRoles.household_head.permissions;
      case 'spouse':
        return this.sriLankanFamilyRoles.financial_manager.permissions;
      case 'child':
        return this.sriLankanFamilyRoles.dependent.permissions;
      default:
        return this.sriLankanFamilyRoles.contributor.permissions;
    }
  }

  private addActivity(activity: Omit<FamilyActivity, 'id' | 'timestamp' | 'isRead'>): void {
    const newActivity: FamilyActivity = {
      ...activity,
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
      timestamp: new Date(),
      isRead: {}
    };

    this.familyActivities.unshift(newActivity);
    
    // Keep only last 100 activities
    if (this.familyActivities.length > 100) {
      this.familyActivities = this.familyActivities.slice(0, 100);
    }
  }

  private initializeCulturalBudgets(): void {
    // Create default cultural budgets for Sri Lankan families
    const culturalBudgets = [
      {
        name: 'Religious & Cultural Activities',
        category: 'Religious & Cultural',
        amount: 15000,
        priority: 'cultural' as const
      },
      {
        name: 'Festival Celebrations',
        category: 'Entertainment',
        amount: 25000,
        priority: 'cultural' as const
      },
      {
        name: 'Educational Development',
        category: 'Education',
        amount: 30000,
        priority: 'essential' as const
      }
    ];

    // Implementation would create these budgets if not exists
  }

  private saveFamilyData(): void {
    try {
      const familyData = {
        members: Array.from(this.familyMembers.entries()),
        expenses: Array.from(this.sharedExpenses.entries()),
        budgets: Array.from(this.familyBudgets.entries()),
        activities: this.familyActivities,
        goals: Array.from(this.familyGoals.entries())
      };
      
      localStorage.setItem(`family-data-${this.currentFamilyId}`, JSON.stringify(familyData));
    } catch (error) {
      console.error('Error saving family data:', error);
    }
  }

  private loadFamilyData(): void {
    try {
      const stored = localStorage.getItem(`family-data-${this.currentFamilyId}`);
      if (stored) {
        const familyData = JSON.parse(stored);
        
        this.familyMembers = new Map(familyData.members || []);
        this.sharedExpenses = new Map(familyData.expenses || []);
        this.familyBudgets = new Map(familyData.budgets || []);
        this.familyActivities = familyData.activities || [];
        this.familyGoals = new Map(familyData.goals || []);
      }
    } catch (error) {
      console.error('Error loading family data:', error);
    }
  }

  // Public getters
  public getFamilyMembers(): FamilyMember[] {
    return Array.from(this.familyMembers.values());
  }

  public getSharedExpenses(): SharedExpense[] {
    return Array.from(this.sharedExpenses.values());
  }

  public getFamilyBudgets(): FamilyBudget[] {
    return Array.from(this.familyBudgets.values());
  }

  public getFamilyGoals(): FamilyGoal[] {
    return Array.from(this.familyGoals.values());
  }
}

export const familySharingService = FamilySharingService.getInstance();