// Core data types for MyTracksy

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  description: string;
  category: string;
  date: Date;
  paymentMethod?: 'cash' | 'card' | 'transfer' | 'other';
  notes?: string;
  tags?: string[];
  receiptUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Budget {
  id: string;
  userId: string;
  name: string;
  category: string;
  amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  startDate: Date;
  endDate: Date;
  spent?: number;
  description?: string;
  alertThreshold?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  userId?: string; // Custom categories per user
  isDefault?: boolean; // System default categories
}

export interface ExpenseFilter {
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
  paymentMethod?: string;
  search?: string;
}

export interface ExpenseStats {
  totalSpent: number;
  totalExpenses: number;
  averageExpense: number;
  topCategory: string;
  categoryBreakdown: { [category: string]: number };
}

// Form data types
export type ExpenseFormData = Omit<Expense, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;
export type BudgetFormData = Omit<Budget, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'spent' | 'startDate' | 'endDate'> & {
  startDate?: Date;
};
export type CategoryFormData = Omit<Category, 'id' | 'userId' | 'isDefault'>;

// Re-export notification types
export * from './notification';

// Re-export income types
export * from './income';