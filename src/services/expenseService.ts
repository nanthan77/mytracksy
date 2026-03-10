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
  limit,
  startAfter,
  Timestamp,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { Expense, ExpenseFormData, ExpenseFilter, ExpenseStats } from '../types';

const COLLECTION_NAME = 'expenses';

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

// Convert Firestore document to Expense
const docToExpense = (doc: any): Expense => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    date: timestampToDate(data.date),
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

export const expenseService = {
  // Create a new expense
  async createExpense(userId: string, expenseData: ExpenseFormData): Promise<string> {
    const now = new Date();
    const expense = {
      ...expenseData,
      userId,
      date: dateToTimestamp(expenseData.date),
      createdAt: dateToTimestamp(now),
      updatedAt: dateToTimestamp(now)
    };

    const docRef = await addDoc(collection(db, COLLECTION_NAME), expense);
    return docRef.id;
  },

  // Get expense by ID
  async getExpenseById(expenseId: string): Promise<Expense | null> {
    const docRef = doc(db, COLLECTION_NAME, expenseId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docToExpense(docSnap);
    }
    return null;
  },

  // Update expense
  async updateExpense(expenseId: string, updates: Partial<ExpenseFormData>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, expenseId);
    const updateData: any = {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    };

    if (updates.date) {
      updateData.date = dateToTimestamp(updates.date);
    }

    await updateDoc(docRef, updateData);
  },

  // Delete expense
  async deleteExpense(expenseId: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, expenseId);
    await deleteDoc(docRef);
  },

  // Get user expenses with filtering and pagination
  async getUserExpenses(
    userId: string,
    filter?: ExpenseFilter,
    limitCount = 50,
    lastDoc?: any
  ): Promise<{ expenses: Expense[]; hasMore: boolean }> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      orderBy('date', 'desc')
    ];

    // Apply filters
    if (filter?.category) {
      constraints.push(where('category', '==', filter.category));
    }

    if (filter?.dateFrom) {
      constraints.push(where('date', '>=', dateToTimestamp(filter.dateFrom)));
    }

    if (filter?.dateTo) {
      constraints.push(where('date', '<=', dateToTimestamp(filter.dateTo)));
    }

    if (filter?.paymentMethod) {
      constraints.push(where('paymentMethod', '==', filter.paymentMethod));
    }

    // Add pagination
    constraints.push(limit(limitCount + 1)); // Get one extra to check if there are more

    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const expenses = querySnapshot.docs.slice(0, limitCount).map(docToExpense);
    const hasMore = querySnapshot.docs.length > limitCount;

    // Apply client-side filters that can't be done in Firestore
    let filteredExpenses = expenses;

    if (filter?.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredExpenses = expenses.filter(expense =>
        expense.description.toLowerCase().includes(searchTerm) ||
        expense.notes?.toLowerCase().includes(searchTerm) ||
        expense.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filter?.minAmount !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => expense.amount >= filter.minAmount!);
    }

    if (filter?.maxAmount !== undefined) {
      filteredExpenses = filteredExpenses.filter(expense => expense.amount <= filter.maxAmount!);
    }

    return { expenses: filteredExpenses, hasMore };
  },

  // Get expense statistics
  async getExpenseStats(userId: string, dateFrom?: Date, dateTo?: Date): Promise<ExpenseStats> {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId)
    ];

    if (dateFrom) {
      constraints.push(where('date', '>=', dateToTimestamp(dateFrom)));
    }

    if (dateTo) {
      constraints.push(where('date', '<=', dateToTimestamp(dateTo)));
    }

    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const querySnapshot = await getDocs(q);
    
    const expenses = querySnapshot.docs.map(docToExpense);
    
    if (expenses.length === 0) {
      return {
        totalSpent: 0,
        totalExpenses: 0,
        averageExpense: 0,
        topCategory: '',
        categoryBreakdown: {}
      };
    }

    const totalSpent = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const categoryBreakdown: { [category: string]: number } = {};
    
    expenses.forEach(expense => {
      categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount;
    });

    const topCategory = Object.entries(categoryBreakdown).reduce((a, b) => 
      categoryBreakdown[a[0]] > categoryBreakdown[b[0]] ? a : b
    )[0] || '';

    return {
      totalSpent,
      totalExpenses: expenses.length,
      averageExpense: totalSpent / expenses.length,
      topCategory,
      categoryBreakdown
    };
  },

  // Get recent expenses
  async getRecentExpenses(userId: string, limitCount = 5): Promise<Expense[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToExpense);
  },

  // Get expenses by date range
  async getExpensesByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Expense[]> {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('date', '>=', dateToTimestamp(startDate)),
      where('date', '<=', dateToTimestamp(endDate)),
      orderBy('date', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToExpense);
  }
};