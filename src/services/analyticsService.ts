import { Expense, Budget } from '../types';
import { expenseService } from './expenseService';
import { budgetService } from './budgetService';
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  startOfYear, 
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  format,
  subDays,
  subMonths,
  isSameDay,
  isSameWeek,
  isSameMonth
} from 'date-fns';

export interface SpendingTrendData {
  date: string;
  amount: number;
  budget?: number;
}

export interface CategorySpendingData {
  name: string;
  value: number;
  color?: string;
}

export interface BudgetAnalysisData {
  name: string;
  spent: number;
  budget: number;
  remaining: number;
  percentage: number;
}

export interface FinancialSummary {
  totalSpent: number;
  totalBudget: number;
  budgetUtilization: number;
  avgDailySpending: number;
  topCategory: string;
  topCategoryAmount: number;
  overspentBudgets: number;
  savingsRate: number;
}

export const analyticsService = {
  // Get spending trends over time
  async getSpendingTrends(
    userId: string, 
    period: 'week' | 'month' | 'quarter' | 'year',
    includeProjections = false
  ): Promise<SpendingTrendData[]> {
    const now = new Date();
    let startDate: Date;
    let intervals: Date[];

    switch (period) {
      case 'week':
        startDate = startOfWeek(subDays(now, 7 * 4)); // Last 4 weeks
        intervals = eachDayOfInterval({ start: startDate, end: now });
        break;
      case 'month':
        startDate = startOfMonth(subMonths(now, 6)); // Last 6 months
        intervals = eachWeekOfInterval({ start: startDate, end: now });
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 12)); // Last 12 months
        intervals = eachMonthOfInterval({ start: startDate, end: now });
        break;
      case 'year':
        startDate = startOfYear(subMonths(now, 24)); // Last 2 years
        intervals = eachMonthOfInterval({ start: startDate, end: now });
        break;
      default:
        startDate = startOfMonth(subMonths(now, 6));
        intervals = eachWeekOfInterval({ start: startDate, end: now });
    }

    // Get all expenses in the period
    const expenses = await expenseService.getExpensesByDateRange(userId, startDate, now);
    
    // Group expenses by interval
    const trendData: SpendingTrendData[] = intervals.map(intervalDate => {
      const relevantExpenses = expenses.filter(expense => {
        switch (period) {
          case 'week':
            return isSameDay(expense.date, intervalDate);
          case 'month':
            return isSameWeek(expense.date, intervalDate);
          case 'quarter':
          case 'year':
            return isSameMonth(expense.date, intervalDate);
          default:
            return isSameWeek(expense.date, intervalDate);
        }
      });

      const amount = relevantExpenses.reduce((sum, expense) => sum + expense.amount, 0);
      
      return {
        date: intervalDate.toISOString(),
        amount
      };
    });

    return trendData;
  },

  // Get category spending breakdown
  async getCategoryBreakdown(
    userId: string, 
    startDate: Date = startOfMonth(new Date()),
    endDate: Date = endOfMonth(new Date())
  ): Promise<CategorySpendingData[]> {
    const stats = await expenseService.getExpenseStats(userId, startDate, endDate);
    
    return Object.entries(stats.categoryBreakdown)
      .map(([category, amount]) => ({
        name: category,
        value: amount
      }))
      .sort((a, b) => b.value - a.value);
  },

  // Get budget analysis
  async getBudgetAnalysis(userId: string): Promise<BudgetAnalysisData[]> {
    const budgets = await budgetService.getUserBudgets(userId);
    
    return budgets.map(budget => {
      const spent = budget.spent || 0;
      const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      
      return {
        name: budget.name,
        spent,
        budget: budget.amount,
        remaining: budget.amount - spent,
        percentage
      };
    });
  },

  // Get financial summary
  async getFinancialSummary(
    userId: string,
    period: 'month' | 'quarter' | 'year' = 'month'
  ): Promise<FinancialSummary> {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case 'quarter':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case 'year':
        startDate = startOfYear(now);
        break;
    }

    const endDate = now;

    // Get expenses and budgets
    const [expenses, budgets, stats] = await Promise.all([
      expenseService.getExpensesByDateRange(userId, startDate, endDate),
      budgetService.getActiveBudgets(userId),
      expenseService.getExpenseStats(userId, startDate, endDate)
    ]);

    const totalSpent = stats.totalSpent;
    const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
    const budgetUtilization = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

    // Calculate average daily spending
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const avgDailySpending = daysDiff > 0 ? totalSpent / daysDiff : 0;

    // Find top category
    const topCategoryEntry = Object.entries(stats.categoryBreakdown)
      .sort(([,a], [,b]) => b - a)[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : 'No expenses';
    const topCategoryAmount = topCategoryEntry ? topCategoryEntry[1] : 0;

    // Count overspent budgets
    const overspentBudgets = budgets.filter(budget => 
      (budget.spent || 0) > budget.amount
    ).length;

    // Calculate savings rate (simplified - budget minus spent)
    const savingsRate = totalBudget > 0 ? ((totalBudget - totalSpent) / totalBudget) * 100 : 0;

    return {
      totalSpent,
      totalBudget,
      budgetUtilization,
      avgDailySpending,
      topCategory,
      topCategoryAmount,
      overspentBudgets,
      savingsRate: Math.max(0, savingsRate)
    };
  },

  // Get spending comparison (this month vs last month)
  async getSpendingComparison(userId: string): Promise<{
    thisMonth: number;
    lastMonth: number;
    change: number;
    changePercentage: number;
  }> {
    const now = new Date();
    const thisMonthStart = startOfMonth(now);
    const thisMonthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));

    const [thisMonthStats, lastMonthStats] = await Promise.all([
      expenseService.getExpenseStats(userId, thisMonthStart, thisMonthEnd),
      expenseService.getExpenseStats(userId, lastMonthStart, lastMonthEnd)
    ]);

    const thisMonth = thisMonthStats.totalSpent;
    const lastMonth = lastMonthStats.totalSpent;
    const change = thisMonth - lastMonth;
    const changePercentage = lastMonth > 0 ? (change / lastMonth) * 100 : 0;

    return {
      thisMonth,
      lastMonth,
      change,
      changePercentage
    };
  },

  // Get weekly spending pattern
  async getWeeklyPattern(userId: string): Promise<Array<{
    day: string;
    amount: number;
  }>> {
    const now = new Date();
    const startDate = subDays(now, 28); // Last 4 weeks

    const expenses = await expenseService.getExpensesByDateRange(userId, startDate, now);
    
    // Group by day of week
    const dayTotals = new Array(7).fill(0);
    const dayCounts = new Array(7).fill(0);
    
    expenses.forEach(expense => {
      const dayOfWeek = expense.date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      dayTotals[dayOfWeek] += expense.amount;
      dayCounts[dayOfWeek]++;
    });

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    return days.map((day, index) => ({
      day,
      amount: dayCounts[index] > 0 ? dayTotals[index] / dayCounts[index] : 0
    }));
  },

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  },

  // Format percentage
  formatPercentage(value: number): string {
    return `${value.toFixed(1)}%`;
  }
};