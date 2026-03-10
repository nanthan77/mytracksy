import { useState, useEffect, useCallback } from 'react';
import { Budget, BudgetFormData } from '../types';
import { budgetService } from '../services/budgetService';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/notificationService';

export const useBudgets = (autoLoad = true) => {
  const { currentUser } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBudgets = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userBudgets = await budgetService.getUserBudgets(currentUser.uid);
      setBudgets(userBudgets);
    } catch (err: any) {
      setError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const createBudget = useCallback(async (budgetData: BudgetFormData): Promise<string | null> => {
    if (!currentUser) return null;

    try {
      setError(null);
      
      // Check if budget already exists for this period
      const exists = await budgetService.budgetExistsForPeriod(
        currentUser.uid,
        budgetData.category,
        budgetData.period
      );
      
      if (exists) {
        throw new Error('A budget for this category and period already exists');
      }
      
      const budgetId = await budgetService.createBudget(currentUser.uid, budgetData);
      await loadBudgets(); // Reload budgets
      return budgetId;
    } catch (err: any) {
      setError(err.message || 'Failed to create budget');
      return null;
    }
  }, [currentUser, loadBudgets]);

  const updateBudget = useCallback(async (budgetId: string, updates: Partial<BudgetFormData>): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      setError(null);
      
      // Check if budget exists for new period (excluding current budget)
      if (updates.category || updates.period) {
        const budget = budgets.find(b => b.id === budgetId);
        if (budget) {
          const exists = await budgetService.budgetExistsForPeriod(
            currentUser.uid,
            updates.category || budget.category,
            updates.period || budget.period,
            budgetId
          );
          
          if (exists) {
            throw new Error('A budget for this category and period already exists');
          }
        }
      }
      
      await budgetService.updateBudget(budgetId, updates);
      await loadBudgets(); // Reload budgets
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update budget');
      return false;
    }
  }, [currentUser, budgets, loadBudgets]);

  const deleteBudget = useCallback(async (budgetId: string): Promise<boolean> => {
    try {
      setError(null);
      await budgetService.deleteBudget(budgetId);
      setBudgets(prev => prev.filter(budget => budget.id !== budgetId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete budget');
      return false;
    }
  }, []);

  const updateBudgetSpending = useCallback(async (): Promise<void> => {
    if (!currentUser) return;

    try {
      await budgetService.updateBudgetSpending(currentUser.uid);
      await loadBudgets(); // Reload to get updated spending amounts
      
      // Check for budget alerts after updating spending
      const updatedBudgets = await budgetService.getUserBudgets(currentUser.uid);
      const settings = await notificationService.getNotificationSettings(currentUser.uid);
      
      for (const budget of updatedBudgets) {
        await notificationService.checkBudgetAlerts(budget, settings);
      }
    } catch (err: any) {
      console.error('Failed to update budget spending:', err);
    }
  }, [currentUser, loadBudgets]);

  const refresh = useCallback(() => {
    loadBudgets();
  }, [loadBudgets]);

  useEffect(() => {
    if (autoLoad && currentUser) {
      loadBudgets();
    }
  }, [autoLoad, currentUser, loadBudgets]);

  return {
    budgets,
    loading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    updateBudgetSpending,
    refresh
  };
};

export const useActiveBudgets = () => {
  const { currentUser } = useAuth();
  const [activeBudgets, setActiveBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActiveBudgets = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const budgets = await budgetService.getActiveBudgets(currentUser.uid);
      setActiveBudgets(budgets);
    } catch (err: any) {
      setError(err.message || 'Failed to load active budgets');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadActiveBudgets();
    }
  }, [currentUser, loadActiveBudgets]);

  return {
    activeBudgets,
    loading,
    error,
    refresh: loadActiveBudgets
  };
};

export const useBudgetProgress = (budget: Budget) => {
  const [progress, setProgress] = useState({
    percentage: 0,
    remaining: 0,
    status: 'under' as 'under' | 'near' | 'over'
  });

  useEffect(() => {
    const budgetProgress = budgetService.getBudgetProgress(budget);
    setProgress(budgetProgress);
  }, [budget]);

  return progress;
};