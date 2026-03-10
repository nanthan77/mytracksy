import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  onSnapshot,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './useAuth';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
  userId: string;
}

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

    const expensesRef = collection(db, 'expenses');
    const q = query(
      expensesRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expenseData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          date: doc.data().date?.toDate?.()?.toISOString() || doc.data().date
        })) as Expense[];
        
        setExpenses(expenseData);
        setLoading(false);
        setError(null);
      },
      (error) => {
        console.error('Error fetching expenses:', error);
        setError('Failed to fetch expenses');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addExpense = async (expenseData: Omit<Expense, 'id' | 'userId'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docData = {
        ...expenseData,
        userId: user.uid,
        createdAt: Timestamp.now(),
        date: Timestamp.fromDate(new Date(expenseData.date))
      };

      await addDoc(collection(db, 'expenses'), docData);
    } catch (error) {
      console.error('Error adding expense:', error);
      throw error;
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      await deleteDoc(doc(db, 'expenses', expenseId));
    } catch (error) {
      console.error('Error deleting expense:', error);
      throw error;
    }
  };

  const updateExpense = async (expenseId: string, updates: Partial<Expense>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const docRef = doc(db, 'expenses', expenseId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      if (updates.date) {
        updateData.date = Timestamp.fromDate(new Date(updates.date));
      }

      await updateDoc(docRef, updateData);
    } catch (error) {
      console.error('Error updating expense:', error);
      throw error;
    }
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

