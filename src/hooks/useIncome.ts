import { useState, useEffect, useCallback } from 'react';
import { Income, IncomeFormData, IncomeStats } from '../types/income';
import { incomeService } from '../services/incomeService';
import { useAuth } from '../context/AuthContext';

export const useIncome = (autoLoad = true) => {
  const { currentUser } = useAuth();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadIncomes = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userIncomes = await incomeService.getUserIncome(currentUser.uid);
      setIncomes(userIncomes);
    } catch (err: any) {
      setError(err.message || 'Failed to load income');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createIncome = useCallback(async (incomeData: IncomeFormData): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      setError(null);
      const incomeId = await incomeService.createIncome(currentUser.uid, incomeData);
      await loadIncomes(); // Reload incomes
      return incomeId;
    } catch (err: any) {
      setError(err.message || 'Failed to create income');
      return null;
    }
  }, [currentUser, loadIncomes]);

  const updateIncome = useCallback(async (incomeId: string, updates: Partial<IncomeFormData>): Promise<boolean> => {
    try {
      setError(null);
      await incomeService.updateIncome(incomeId, updates);
      await loadIncomes(); // Reload incomes
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update income');
      return false;
    }
  }, [loadIncomes]);

  const deleteIncome = useCallback(async (incomeId: string): Promise<boolean> => {
    try {
      setError(null);
      await incomeService.deleteIncome(incomeId);
      setIncomes(prev => prev.filter(income => income.id !== incomeId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete income');
      return false;
    }
  }, []);

  const refresh = useCallback(() => {
    loadIncomes();
  }, [loadIncomes]);

  useEffect(() => {
    if (autoLoad && currentUser) {
      loadIncomes();
    }
  }, [autoLoad, currentUser, loadIncomes]);

  return {
    incomes,
    loading,
    error,
    createIncome,
    updateIncome,
    deleteIncome,
    refresh
  };
};

export const useIncomeStats = (dateFrom?: Date, dateTo?: Date) => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState<IncomeStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const incomeStats = await incomeService.getIncomeStats(currentUser.uid, dateFrom, dateTo);
      setStats(incomeStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load income statistics');
    } finally {
      setLoading(false);
    }
  }, [currentUser, dateFrom, dateTo]);

  useEffect(() => {
    if (currentUser) {
      loadStats();
    }
  }, [currentUser, loadStats]);

  return {
    stats,
    loading,
    error,
    refresh: loadStats
  };
};

export const useRecurringIncome = () => {
  const { currentUser } = useAuth();
  const [recurringIncomes, setRecurringIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecurringIncomes = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const incomes = await incomeService.getRecurringIncome(currentUser.uid);
      setRecurringIncomes(incomes);
    } catch (err: any) {
      setError(err.message || 'Failed to load recurring income');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const processDueIncomes = useCallback(async (): Promise<string[]> => {
    if (!currentUser) return [];

    try {
      setError(null);
      const createdIds = await incomeService.processDueRecurringIncome(currentUser.uid);
      await loadRecurringIncomes(); // Reload to get updated dates
      return createdIds;
    } catch (err: any) {
      setError(err.message || 'Failed to process recurring income');
      return [];
    }
  }, [currentUser, loadRecurringIncomes]);

  useEffect(() => {
    if (currentUser) {
      loadRecurringIncomes();
    }
  }, [currentUser, loadRecurringIncomes]);

  return {
    recurringIncomes,
    loading,
    error,
    processDueIncomes,
    refresh: loadRecurringIncomes
  };
};