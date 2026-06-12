import { useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeTransactions,
  addTransaction,
} from '../services/accountingCoreService';
import type { Transaction } from '../components/dashboards/TransactionList';

/**
 * useProfessionLedger — shared REAL-data ledger for profession dashboards.
 *
 * Several profession dashboards shipped as static demo shells (hardcoded
 * sample transactions). This hook wires any of them to the unified
 * users/{uid}/transactions ledger with month/tax-year aggregates and quick
 * add helpers, so every profession gets working income/expense tracking.
 */
export function useProfessionLedger() {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!uid) {
      setInvoices([]);
      setExpenses([]);
      return;
    }
    const unsubIncome = subscribeTransactions(uid, 'income', (txns: Transaction[]) => setInvoices(txns));
    const unsubExpenses = subscribeTransactions(uid, 'expense', (txns: Transaction[]) => setExpenses(txns));
    return () => { unsubIncome(); unsubExpenses(); };
  }, [uid]);

  const isInMonth = (dateStr: string, ref = new Date()) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth();
  };

  const totals = useMemo(() => {
    const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const monthIncome = invoices.filter(t => isInMonth(t.date)).reduce((s, t) => s + t.amount, 0);
    const monthExpenses = expenses.filter(t => isInMonth(t.date)).reduce((s, t) => s + t.amount, 0);

    // Tax-year (Apr–Mar) YTD annualisation — correct input for TaxSpeedometer
    const annualise = (txns: Transaction[]) => {
      const now = new Date();
      const taxYearStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
      const ytd = txns.reduce((sum, t) => {
        const d = new Date(`${t.date}T00:00:00`);
        return !Number.isNaN(d.getTime()) && d >= taxYearStart && d <= now ? sum + t.amount : sum;
      }, 0);
      const monthsElapsed = Math.max(1, (now.getFullYear() - taxYearStart.getFullYear()) * 12 + (now.getMonth() - taxYearStart.getMonth()) + 1);
      return Math.round((ytd / monthsElapsed) * 12);
    };

    return {
      totalIncome, totalExpenses, monthIncome, monthExpenses,
      netProfit: totalIncome - totalExpenses,
      annualIncome: annualise(invoices),
      annualExpenses: annualise(expenses),
    };
  }, [invoices, expenses]);

  const addIncome = useCallback(async (amount: number, description: string, category: string) => {
    if (!uid || !Number.isFinite(amount) || amount <= 0) return false;
    await addTransaction(uid, {
      date: new Date().toISOString().split('T')[0],
      amount, category, type: 'income', description, paymentMethod: 'bank',
    });
    return true;
  }, [uid]);

  const addExpense = useCallback(async (amount: number, description: string, category: string) => {
    if (!uid || !Number.isFinite(amount) || amount <= 0) return false;
    await addTransaction(uid, {
      date: new Date().toISOString().split('T')[0],
      amount, category, type: 'expense', description, paymentMethod: 'cash',
    });
    return true;
  }, [uid]);

  return { uid, invoices, expenses, ...totals, addIncome, addExpense, signedIn: !!uid };
}

export default useProfessionLedger;
