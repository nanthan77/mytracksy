import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Budget, BudgetFormData } from '../types';
import { expenseService } from './expenseService';

const COLLECTION_NAME = 'budgets';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Convert Firestore document to Budget
const docToBudget = (doc: any): Budget => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    startDate: timestampToDate(data.startDate),
    endDate: timestampToDate(data.endDate),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

// Calculate budget period dates
const calculatePeriodDates = (period: 'weekly' | 'monthly' | 'yearly', startDate?: Date) => {
  const now = startDate || new Date();
  let start: Date;
  let end: Date;

  switch (period) {
    case 'weekly':
      start = new Date(now);
      start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      end = new Date(start);
      end.setDate(start.getDate() + 6); // End of week (Saturday)
      end.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      break;
    default:
      throw new Error('Invalid period');
  }

  return { start, end };
};

export const budgetService = {
  // Create a new budget
  async createBudget(userId: string, budgetData: BudgetFormData): Promise<string> {
    const { start, end } = calculatePeriodDates(budgetData.period, budgetData.startDate);
    const now = new Date();
    
    const budget = {
      ...budgetData,
      userId,
      startDate: dateToTimestamp(start),
      endDate: dateToTimestamp(end),
      spent: 0,
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now)
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), budget);
    return docRef.id;
  },

  // Get budget by ID
  async getBudgetById(budgetId: string): Promise<Budget | null> {
    const docRef = doc(db, COLLECTION_NAME, budgetId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docToBudget(docSnap);
    }
    return null;
  },

  // Update budget
  async updateBudget(budgetId: string, updates: Partial<BudgetFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, budgetId);
    const updateData: any = {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    };

    // Recalculate dates if period changed
    if (updates.period) {
      const { start, end } = calculatePeriodDates(updates.period, updates.startDate);
      updateData.startDate = dateToTimestamp(start);
      updateData.endDate = dateToTimestamp(end);
    }

    await updateDoc(docRef, updateData);
  },

  // Delete budget
  async deleteBudget(budgetId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, budgetId);
    await deleteDoc(docRef);
  },

  // Get user budgets
  async getUserBudgets(userId: string): Promise<Budget[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToBudget);
  },

  // Get active budgets (current period)
  async getActiveBudgets(userId: string): Promise<Budget[]> {
    const now = new Date();
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('startDate', '<=', dateToTimestamp(now)),
      where('endDate', '>=', dateToTimestamp(now))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToBudget);
  },

  // Calculate actual spending for a budget
  async calculateBudgetSpending(budget: Budget): Promise<number> {
    const stats = await expenseService.getExpenseStats(
      budget.userId,
      budget.startDate,
      budget.endDate
    );

    if (budget.category === 'all') {
      return stats.totalSpent;
    } else {
      return stats.categoryBreakdown[budget.category] || 0;
    }
  },

  // Update budget spending amounts
  async updateBudgetSpending(userId: string): Promise<void> {
    const budgets = await this.getUserBudgets(userId);
    
    for (const budget of budgets) {
      const spent = await this.calculateBudgetSpending(budget);
      await updateDoc(doc(db, COLLECTION_NAME, budget.id), {
        spent,
        updatedAt: dateToTimestamp(new Date())
      });
    }
  },

  // Get budget progress
  getBudgetProgress(budget: Budget): {
    percentage: number;
    remaining: number;
    status: 'under' | 'near' | 'over';
  } {
    const spent = budget.spent || 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
    const remaining = budget.amount - spent;
    
    let status: 'under' | 'near' | 'over';
    if (percentage >= 100) {
      status = 'over';
    } else if (percentage >= 80) {
      status = 'near';
    } else {
      status = 'under';
    }

    return {
      percentage: Math.min(percentage, 100),
      remaining,
      status
    };
  },

  // Check if budget exists for category and period
  async budgetExistsForPeriod(
    userId: string, 
    category: string, 
    period: 'weekly' | 'monthly' | 'yearly',
    excludeBudgetId?: string
  ): Promise<boolean> {
    const { start, end } = calculatePeriodDates(period);
    
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('category', '==', category),
      where('period', '==', period),
      where('startDate', '<=', dateToTimestamp(end)),
      where('endDate', '>=', dateToTimestamp(start))
    ];

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    
    if (excludeBudgetId) {
      return querySnapshot.docs.some(doc => doc.id !== excludeBudgetId);
    }
    
    return !querySnapshot.empty;
  }
};