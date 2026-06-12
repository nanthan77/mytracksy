import React, { useState } from 'react';
import type { useProfessionLedger } from '../../hooks/useProfessionLedger';

/**
 * QuickLedgerCard — real income/expense KPIs + 10-second entry form.
 *
 * Dropped into profession dashboards that previously showed only static
 * sample data, so every profession has a WORKING ledger backed by
 * users/{uid}/transactions (and the data flows into Tax & IRD + reports).
 */

type Ledger = ReturnType<typeof useProfessionLedger>;

interface Props {
  ledger: Ledger;
  accent?: string;
  incomeCategories: string[];
  expenseCategories: string[];
}

const fmt = (n: number) => `LKR ${Math.round(n).toLocaleString('en-LK')}`;

const QuickLedgerCard: React.FC<Props> = ({ ledger, accent = '#0f172a', incomeCategories, expenseCategories }) => {
  const [mode, setMode] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(incomeCategories[0] || 'General');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const categories = mode === 'income' ? incomeCategories : expenseCategories;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!Number.isFinite(amt) || amt <= 0 || !description.trim()) return;
    setSaving(true);
    try {
      const ok = mode === 'income'
        ? await ledger.addIncome(amt, description.trim(), category)
        : await ledger.addExpense(amt, description.trim(), category);
      if (ok) {
        setAmount('');
        setDescription('');
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error('Quick ledger save failed:', err);
    } finally {
      setSaving(false);
    }
  };

  const switchMode = (m: 'income' | 'expense') => {
    setMode(m);
    setCategory((m === 'income' ? incomeCategories : expenseCategories)[0] || 'General');
  };

  const input: React.CSSProperties = { padding: '9px 12px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '1.1rem 1.25rem', border: `2px solid ${accent}22`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>💼 Your Real Ledger</h3>
        <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6 }}>LIVE — saved to your account</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginBottom: 12 }}>
        <div style={{ padding: '0.6rem 0.8rem', background: '#f0fdf4', borderRadius: 10 }}>
          <div style={{ fontSize: 11.5, color: '#166534', fontWeight: 600 }}>Income This Month</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#16a34a' }}>{fmt(ledger.monthIncome)}</div>
        </div>
        <div style={{ padding: '0.6rem 0.8rem', background: '#fef2f2', borderRadius: 10 }}>
          <div style={{ fontSize: 11.5, color: '#991b1b', fontWeight: 600 }}>Expenses This Month</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#dc2626' }}>{fmt(ledger.monthExpenses)}</div>
        </div>
        <div style={{ padding: '0.6rem 0.8rem', background: '#eff6ff', borderRadius: 10 }}>
          <div style={{ fontSize: 11.5, color: '#1e40af', fontWeight: 600 }}>Net (All Time)</div>
          <div style={{ fontSize: '1.05rem', fontWeight: 800, color: ledger.netProfit >= 0 ? '#2563eb' : '#dc2626' }}>{fmt(ledger.netProfit)}</div>
        </div>
      </div>

      {!ledger.signedIn ? (
        <div style={{ padding: '0.75rem', background: '#fffbeb', borderRadius: 10, border: '1px dashed #fde68a', fontSize: 13, color: '#92400e' }}>
          Sign in to record income & expenses — entries sync to your account and feed Tax & IRD automatically.
        </div>
      ) : (
        <form onSubmit={submit} style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e2e8f0' }}>
            <button type="button" onClick={() => switchMode('income')} style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', background: mode === 'income' ? '#16a34a' : 'white', color: mode === 'income' ? 'white' : '#475569' }}>+ Income</button>
            <button type="button" onClick={() => switchMode('expense')} style={{ padding: '8px 12px', fontSize: 12.5, fontWeight: 700, border: 'none', cursor: 'pointer', background: mode === 'expense' ? '#dc2626' : 'white', color: mode === 'expense' ? 'white' : '#475569' }}>− Expense</button>
          </div>
          <input value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" style={{ ...input, flex: 2, minWidth: 140 }} required />
          <input type="number" min="0" step="any" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount (Rs.)" style={{ ...input, flex: 1, minWidth: 110 }} required />
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...input, flex: 1, minWidth: 120 }}>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" disabled={saving} style={{ padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 700, background: accent, color: 'white', opacity: saving ? 0.6 : 1 }}>
            {saving ? '⏳' : saved ? '✓ Saved' : '💾 Save'}
          </button>
        </form>
      )}
    </div>
  );
};

export default QuickLedgerCard;
