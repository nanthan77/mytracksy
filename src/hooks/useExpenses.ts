import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  toCents,
  fromCents,
  type UniversalTransaction,
} from '../services/accountingCoreService';

/**
 * useExpenses — expense CRUD over the UNIFIED ledger.
 *
 * Previously this hook wrote to the legacy flat `/expenses` collection, which
 * is READ-ONLY in firestore.rules — every add/update/delete silently failed
 * with permission-denied. It now reads and writes
 * `users/{uid}/transactions` (type=expense) via accountingCoreService, the
 * same backend the profession dashboards use. The hook's public API is
 * unchanged, so SMSBanking / VoiceEnhanced keep working.
 */

interface Expense {
  id: string;
  amount: number;          // rupees (converted from integer cents)
  category: string;
  description: string;
  date: string;            // YYYY-MM-DD
  paymentMethod?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
  userId: string;
}

const toExpense = (t: UniversalTransaction, userId: string): Expense => ({
  id: t.id || '',
  amount: fromCents(t.amount_cents),
  category: t.category_name || '',
  description: t.description,
  date: t.date,
  paymentMethod: t.metadata?.paymentMethod,
  location: t.metadata?.location,
  tags: t.metadata?.tags,
  createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : new Date().toISOString(),
  userId,
});

export const useExpenses = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeTransactions(user.uid, (txns) => {
      try {
        setExpenses(txns.map(t => toExpense(t, user.uid)));
        setError(null);
      } catch (err) {
        console.error('Error mapping expenses:', err);
        setError('Failed to fetch expenses');
      }
      setLoading(false);
    }, { type: 'expense' });

    return () => unsubscribe();
  }, [user]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    await addTransaction(user.uid, {
      date: expenseData.date?.split('T')[0] || new Date().toISOString().split('T')[0],
      amount_cents: toCents(expenseData.amount),
      type: 'expense',
      status: 'cleared',
      source: 'manual_entry',
      vendor: expenseData.location || '',
      category_id: '',
      category_name: expenseData.category,
      description: expenseData.description,
      metadata: {
        ...(expenseData.paymentMethod ? { paymentMethod: expenseData.paymentMethod } : {}),
        ...(expenseData.location ? { location: expenseData.location } : {}),
        ...(expenseData.tags?.length ? { tags: expenseData.tags } : {}),
      },
    });
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) throw new Error('User not authenticated');
    await deleteTransaction(user.uid, expenseId);
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!user) throw new Error('User not authenticated');

    const patch: Partial<UniversalTransaction> = {};
    if (updates.amount !== undefined) patch.amount_cents = toCents(updates.amount);
    if (updates.category !== undefined) patch.category_name = updates.category;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.date !== undefined) patch.date = updates.date.split('T')[0];

    await updateTransaction(user.uid, expenseId, patch);
  };

  // Analytics functions
  const getTotalExpenses = () => {
    return expenses.reduce((total, expense) => total + expense.amount, 0);
  };

  const getExpensesByCategory = () => {
    const categoryTotals: { [key: string]: number } = {};
    expenses.forEach(expense => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    });
    return categoryTotals;
  };

  const getMonthlyExpenses = (year: number, month: number) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
    });
  };

  const getExpensesByDateRange = (startDate: Date, endDate: Date) => {
    return expenses.filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  };

  return {
    expenses,
    loading,
    error,
    addExpense,
    deleteExpense,
    updateExpense,
    getTotalExpenses,
    getExpensesByCategory,
    getMonthlyExpenses,
    getExpensesByDateRange
  };
};
