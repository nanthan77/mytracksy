import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouteNav } from '../hooks/useRouteNav';
import db, { CreatorBrandDeal, CreatorGearItem, CreatorRevenue, CreatorExpense } from '../lib/db';
import DashboardLayout from './dashboards/DashboardLayout';
import KPICard from './dashboards/KPICard';
import TransactionList, { Transaction } from './dashboards/TransactionList';
import InvoiceForm, { InvoiceData } from './dashboards/InvoiceForm';
import VoiceInput, { ParsedVoiceAction } from './VoiceInput';
import TaxSpeedometer from './TaxSpeedometer';
import ReceiptScanner from './ReceiptScanner';
import AuditorExport from './AuditorExport';
import TransactionInbox from './TransactionInbox';
import AIVoiceVault from './AIVoiceVault';
import MorningBriefing from './MorningBriefing';
import SmartScheduler from './SmartScheduler';
import LifeAdmin from './LifeAdmin';
import BiometricGate from './BiometricGate';
import SubscriptionGate from './SubscriptionGate';
import SubscriptionManager from './SubscriptionManager';
import { useAuth } from '../context/AuthContext';
import { useTokenWallet, TOKEN_PACKAGES, TokenPackage } from '../hooks/useTokenWallet';
import { addTransaction, subscribeTransactions, seedChartOfAccounts } from '../services/accountingCoreService';
import { useIsCompactMobile } from './dashboards/useIsCompactMobile';
import { generateWhatsAppLink } from '../services/whatsappService';
import { startCreatorAutoSync, stopCreatorAutoSync } from '../services/creatorSyncService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../config/firebase';

/* ============ Props ============ */
interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

/* ============ Nav Items ============ */
const navItems = [
  { id: 'overview', label: 'Creator Home', icon: '🏠' },
  { id: 'briefing', label: 'Morning Briefing', icon: '🌅', premium: true },
  { id: 'inbox', label: 'Transaction Inbox', icon: '📥' },
  { id: 'deals', label: 'Brand Deals', icon: '🤝' },
  { id: 'revenue', label: 'Revenue', icon: '💵' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'tax', label: 'Tax Shield', icon: '🛡️' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'gear', label: 'Gear Vault', icon: '📸', premium: true },
  { id: 'ai', label: 'AI Studio', icon: '🧠', premium: true },
  { id: 'export', label: 'Auditor Export', icon: '📤', premium: true },
  { id: 'voicevault', label: 'Voice Vault', icon: '🎙️', premium: true },
  { id: 'scheduler', label: 'Smart Scheduler', icon: '📅', premium: true },
  { id: 'lifeadmin', label: 'Life Admin', icon: '📋', premium: true },
  { id: 'wallet', label: 'Token Wallet', icon: '🪙' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ============ Mobile Tab System ============ */
type CreatorMobileTabId = 'home' | 'deals' | 'money' | 'tools' | 'more';
const CREATOR_MOBILE_TABS: { id: CreatorMobileTabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'deals', label: 'Deals', icon: '🤝' },
  { id: 'money', label: 'Money', icon: '💵' },
  { id: 'tools', label: 'Tools', icon: '🧠' },
  { id: 'more', label: 'More', icon: '☰' },
];
const CREATOR_MOBILE_GROUPS: Record<CreatorMobileTabId, string[]> = {
  home: ['overview', 'inbox', 'briefing'],
  deals: ['deals'],
  money: ['revenue', 'expenses', 'tax', 'receipts', 'export', 'wallet'],
  tools: ['ai', 'gear', 'voicevault', 'scheduler'],
  more: ['lifeadmin', 'subscription', 'settings'],
};
const CREATOR_MOBILE_DEFAULT_NAV: Record<CreatorMobileTabId, string> = {
  home: 'overview', deals: 'deals', money: 'revenue', tools: 'ai', more: 'settings',
};
function getCreatorMobileTab(activeNav: string): CreatorMobileTabId {
  const match = CREATOR_MOBILE_TABS.find(tab => CREATOR_MOBILE_GROUPS[tab.id].includes(activeNav));
  return match?.id || 'home';
}

/* ============ Constants ============ */
const PURPLE = '#7c3aed';
const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const fmtUsd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const stageColors: Record<string, { bg: string; fg: string }> = {
  pitch: { bg: '#f1f5f9', fg: '#64748b' },
  negotiating: { bg: '#fef3c7', fg: '#f59e0b' },
  shoot_booked: { bg: '#dbeafe', fg: '#3b82f6' },
  delivered: { bg: '#e0e7ff', fg: '#6366f1' },
  invoice_sent: { bg: '#fce7f3', fg: '#ec4899' },
  paid: { bg: '#dcfce7', fg: '#22c55e' },
  cancelled: { bg: '#fee2e2', fg: '#ef4444' },
};

const stageLabels: Record<string, string> = {
  pitch: 'Pitch Sent', negotiating: 'Negotiating', shoot_booked: 'Shoot Booked',
  delivered: 'Delivered', invoice_sent: 'Invoice Sent', paid: 'Paid', cancelled: 'Cancelled',
};

const emptyState = (icon: string, title: string, subtitle: string) => (
  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>{title}</h3>
    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{subtitle}</p>
  </div>
);

/* ============ Free-tier deal limit ============ */
const FREE_DEAL_LIMIT = 3;

/* ================================================================
   COMPONENT
   ================================================================ */
const CreatorDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const walletData = useTokenWallet(uid || '');
  const isCompactMobile = useIsCompactMobile();

  const validNavIds = useMemo(() => navItems.map(n => n.id), []);
  const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
  const [incomeTxns, setIncomeTxns] = useState<Transaction[]>([]);
  const [expenseTxns, setExpenseTxns] = useState<Transaction[]>([]);

  // Modal states
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [showAddGear, setShowAddGear] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // AI state
  const [aiToolActive, setAiToolActive] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Settings state
  const [creatorSettings, setCreatorSettings] = useState({
    channelName: '', platform: '', niche: '', subscriberCount: '',
    adsenseEmail: '', wiseEmail: '', bankAccount: '',
    irdTin: '', vatReg: '', financialYear: '2025/2026 (April – March)',
    defaultCurrency: 'LKR', cbslRate: '300',
  });
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Form states
  const [newDeal, setNewDeal] = useState({
    brand: '', platform: 'YouTube', stage: 'pitch' as CreatorBrandDeal['stage'],
    amount: '', currency: 'LKR' as 'LKR' | 'USD', deliverables: '', dueDate: '',
    contactName: '', contactPhone: '',
  });
  const [newGear, setNewGear] = useState({
    name: '', category: 'Camera' as CreatorGearItem['category'],
    purchaseCost: '', purchaseDate: new Date().toISOString().slice(0, 10),
    usefulLifeYears: '5', invoiceRef: '', serialNumber: '',
  });
  const [newRevenue, setNewRevenue] = useState({
    date: new Date().toISOString().slice(0, 10),
    source: 'AdSense' as CreatorRevenue['source'],
    amount: '', currency: 'LKR' as 'LKR' | 'USD', description: '', brandDealId: '',
  });
  const [newExpenseForm, setNewExpenseForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: 'Production' as CreatorExpense['category'],
    amount: '', description: '', taxDeductible: true,
  });

  // Dexie live queries
  const brandDeals = useLiveQuery(() => uid ? db.creator_brand_deals.where('userId').equals(uid).reverse().sortBy('createdAt') : [], [uid]) || [];
  const gearItems = useLiveQuery(() => uid ? db.creator_gear_items.where('userId').equals(uid).toArray() : [], [uid]) || [];
  const revenueEntries = useLiveQuery(() => uid ? db.creator_revenue.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const creatorExpenses = useLiveQuery(() => uid ? db.creator_expenses.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];

  // Computed values
  const totalRevenueLKR = revenueEntries.reduce((s, r) => s + r.lkrAmount, 0);
  const totalRevenueUSD = revenueEntries.filter(r => r.currency === 'USD').reduce((s, r) => s + r.amount, 0);
  const totalExpensesAmt = creatorExpenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomeTxns.reduce((s, t) => s + t.amount, 0);
  const totalExpensesTxn = expenseTxns.reduce((s, t) => s + t.amount, 0);
  const netProfit = totalRevenueLKR - totalExpensesAmt;
  const gearDepreciation = gearItems.reduce((s, g) => s + g.annualDepreciation, 0);
  const deductibleExpenses = creatorExpenses.filter(e => e.taxDeductible).reduce((s, e) => s + e.amount, 0);
  const totalDeductions = gearDepreciation + deductibleExpenses;
  const activeDeals = brandDeals.filter(d => !['paid', 'cancelled'].includes(d.stage));
  const pendingSponsorCash = activeDeals.reduce((s, d) => {
    const amt = d.currency === 'USD' ? d.amount * (parseFloat(creatorSettings.cbslRate) || 300) : d.amount;
    return s + amt;
  }, 0);

  // Revenue by source
  const revenueBySource: Record<string, number> = {};
  revenueEntries.forEach(r => { revenueBySource[r.source] = (revenueBySource[r.source] || 0) + r.lkrAmount; });
  const sourceEntries = Object.entries(revenueBySource).sort((a, b) => b[1] - a[1]);
  const sourceColors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#06b6d4'];

  const today = new Date().toISOString().slice(0, 10);
  const activeNavItem = useMemo(() => navItems.find(n => n.id === activeNav) || navItems[0], [activeNav]);
  const activeMobileTab = useMemo(() => getCreatorMobileTab(activeNav), [activeNav]);
  const activeMobileSections = useMemo(() => {
    const group = CREATOR_MOBILE_GROUPS[activeMobileTab] || [];
    return navItems.filter(n => group.includes(n.id));
  }, [activeMobileTab]);

  const currentDateLabel = new Date().toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' });

  /* ============ Helpers ============ */
  const gridColumns = (cols: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(100 / cols)}%, 1fr))`, gap: '1rem' } as React.CSSProperties);
  const stackGap = (gap = 16): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', gap });

  /* ============ Effects ============ */
  useEffect(() => {
    if (!uid) return;
    seedChartOfAccounts(uid);
    const stopSync = startCreatorAutoSync(uid);

    getDoc(doc(firestoreDb, 'users', uid, 'creator_settings', 'profile')).then(snap => {
      if (snap.exists()) setCreatorSettings(prev => ({ ...prev, ...snap.data() }));
    });

    return () => { stopSync(); stopCreatorAutoSync(); };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubIncome = subscribeTransactions(uid, 'income', (txns: Transaction[]) => setIncomeTxns(txns));
    const unsubExpenses = subscribeTransactions(uid, 'expense', (txns: Transaction[]) => setExpenseTxns(txns));
    return () => { unsubIncome(); unsubExpenses(); };
  }, [uid]);

  /* ============ Handlers ============ */
  const handleAddDeal = async () => {
    if (!uid || !newDeal.brand || !newDeal.platform) return;
    await db.creator_brand_deals.add({
      brand: newDeal.brand, platform: newDeal.platform, stage: newDeal.stage,
      amount: parseFloat(newDeal.amount) || 0, currency: newDeal.currency,
      deliverables: newDeal.deliverables, dueDate: newDeal.dueDate,
      contactName: newDeal.contactName, contactPhone: newDeal.contactPhone,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewDeal({ brand: '', platform: 'YouTube', stage: 'pitch', amount: '', currency: 'LKR', deliverables: '', dueDate: '', contactName: '', contactPhone: '' });
    setShowAddDeal(false);
  };

  const handleUpdateDealStage = async (id: number, stage: CreatorBrandDeal['stage']) => {
    await db.creator_brand_deals.update(id, { stage, updatedAt: Date.now(), sync_status: 'pending' });
  };

  const handleDeleteDeal = async (id: number) => {
    if (confirm('Delete this brand deal?')) await db.creator_brand_deals.delete(id);
  };

  const handleAddGear = async () => {
    if (!uid || !newGear.name) return;
    const cost = parseFloat(newGear.purchaseCost) || 0;
    const life = parseInt(newGear.usefulLifeYears) || 5;
    await db.creator_gear_items.add({
      name: newGear.name, category: newGear.category,
      purchaseCost: cost, purchaseDate: newGear.purchaseDate,
      usefulLifeYears: life, annualDepreciation: Math.round(cost / life),
      invoiceRef: newGear.invoiceRef, serialNumber: newGear.serialNumber,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewGear({ name: '', category: 'Camera', purchaseCost: '', purchaseDate: today, usefulLifeYears: '5', invoiceRef: '', serialNumber: '' });
    setShowAddGear(false);
  };

  const handleDeleteGear = async (id: number) => {
    if (confirm('Delete this gear item?')) await db.creator_gear_items.delete(id);
  };

  const handleAddRevenue = async () => {
    if (!uid || !newRevenue.amount) return;
    const amt = parseFloat(newRevenue.amount) || 0;
    const cbslRate = parseFloat(creatorSettings.cbslRate) || 300;
    const lkrAmount = newRevenue.currency === 'USD' ? Math.round(amt * cbslRate) : amt;
    await db.creator_revenue.add({
      date: newRevenue.date, source: newRevenue.source,
      amount: amt, currency: newRevenue.currency,
      lkrAmount, cbslRate: newRevenue.currency === 'USD' ? cbslRate : undefined,
      description: newRevenue.description,
      brandDealId: newRevenue.brandDealId ? parseInt(newRevenue.brandDealId) : undefined,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    await addTransaction(uid, {
      date: newRevenue.date, amount: lkrAmount,
      category: newRevenue.source, type: 'income',
      description: `${newRevenue.source}${newRevenue.currency === 'USD' ? ` ($${amt} @ ${cbslRate})` : ''} — ${newRevenue.description}`,
      paymentMethod: 'bank',
    });
    setNewRevenue({ date: today, source: 'AdSense', amount: '', currency: 'LKR', description: '', brandDealId: '' });
    setShowAddRevenue(false);
  };

  const handleAddExpense = async () => {
    if (!uid || !newExpenseForm.amount || !newExpenseForm.description) return;
    const amt = parseFloat(newExpenseForm.amount) || 0;
    await db.creator_expenses.add({
      date: newExpenseForm.date, category: newExpenseForm.category,
      amount: amt, description: newExpenseForm.description,
      taxDeductible: newExpenseForm.taxDeductible,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    await addTransaction(uid, {
      date: newExpenseForm.date, amount: amt,
      category: newExpenseForm.category, type: 'expense',
      description: newExpenseForm.description, paymentMethod: 'cash',
    });
    setNewExpenseForm({ date: today, category: 'Production', amount: '', description: '', taxDeductible: true });
    setShowAddExpense(false);
  };

  const handleCreateInvoice = async (inv: InvoiceData) => {
    if (!uid) return;
    await addTransaction(uid, {
      date: inv.date, amount: inv.amount, category: inv.category || 'Brand Deal',
      type: 'income', description: inv.description, paymentMethod: 'bank',
    });
    setShowInvoiceForm(false);
  };

  const handleAIQuery = useCallback(async (tool: string, prompt: string) => {
    if (!uid || !prompt.trim()) return;
    setAiLoading(true);
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const fn = httpsCallable(functions, 'processCreatorAI');
      const res = await fn({ tool, prompt });
      setAiResult((res.data as any).result);
    } catch (err: any) {
      setAiResult(`Error: ${err.message || 'AI query failed'}`);
    } finally { setAiLoading(false); }
  }, [uid]);

  const handleSaveSettings = async () => {
    if (!uid) return;
    setSettingsSaving(true);
    try {
      await setDoc(doc(firestoreDb, 'users', uid, 'creator_settings', 'profile'), creatorSettings, { merge: true });
      setEditingSettings(false);
    } catch (err) { console.error('Settings save failed', err); }
    finally { setSettingsSaving(false); }
  };

  const handleVoiceAction = (action: ParsedVoiceAction) => {
    if (!uid) return;
    if (action.type === 'expense') {
      addTransaction(uid, {
        date: new Date().toISOString().split('T')[0], amount: action.amount || 0,
        category: action.category || 'Production', type: 'expense',
        description: action.description || 'Voice expense',
      });
    }
  };

  const handleMobileTabChange = (tabId: string) => {
    const defaultNav = CREATOR_MOBILE_DEFAULT_NAV[tabId as CreatorMobileTabId];
    if (defaultNav) setActiveNav(defaultNav);
  };

  // ═══════════════════════════════════════════════════
  //  RENDER SECTIONS
  // ═══════════════════════════════════════════════════

  const renderOverview = () => (
    <div style={stackGap(20)}>
      <div style={{ background: 'linear-gradient(135deg, #0f172a, #581c87 55%, #06b6d4)', borderRadius: 16, padding: isCompactMobile ? '1.1rem' : '2rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 4 }}>Welcome back, {userName}</div>
            <div style={{ fontSize: isCompactMobile ? '2rem' : '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmt(netProfit)}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 6 }}>Net Profit · {activeDeals.length} Active Deal{activeDeals.length !== 1 ? 's' : ''}</div>
          </div>
          <div style={{ textAlign: isCompactMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Foreign Income</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{fmtUsd(totalRevenueUSD)}</div>
          </div>
        </div>
      </div>
      <div style={gridColumns(4)}>
        <KPICard icon="💸" label="Pending Deals" value={fmt(pendingSponsorCash)} changeType={pendingSponsorCash > 0 ? 'up' : 'neutral'} color="#a855f7" />
        <KPICard icon="🌍" label="Foreign Income" value={fmtUsd(totalRevenueUSD)} changeType={totalRevenueUSD > 0 ? 'up' : 'neutral'} color="#06b6d4" />
        <KPICard icon="🛡️" label="Tax Deductions" value={fmt(totalDeductions)} changeType="neutral" color="#f59e0b" />
        <KPICard icon="📸" label="Gear Assets" value={String(gearItems.length)} changeType="neutral" color="#22c55e" />
      </div>
      <div style={gridColumns(2)}>
        <div style={cs}>
          <h3 style={ct}>🤝 Deal Pipeline</h3>
          {activeDeals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {emptyState('🤝', 'No active deals', 'Add your first brand deal to get started')}
              <button onClick={() => { setActiveNav('deals'); setShowAddDeal(true); }} style={primaryBtn}>+ Add First Deal</button>
            </div>
          ) : activeDeals.slice(0, 5).map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{d.brand}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{d.platform} · {d.currency === 'USD' ? `$${d.amount}` : fmt(d.amount)}</div>
              </div>
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: stageColors[d.stage]?.bg, color: stageColors[d.stage]?.fg }}>{stageLabels[d.stage]}</span>
            </div>
          ))}
        </div>
        <div style={cs}>
          <h3 style={ct}>📈 Revenue by Source</h3>
          {sourceEntries.length === 0 ? emptyState('📈', 'No revenue yet', 'Record your first income') : sourceEntries.map(([source, amount], i) => {
            const pct = totalRevenueLKR > 0 ? Math.round((amount / totalRevenueLKR) * 100) : 0;
            return (
              <div key={source} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.84rem' }}>{source}</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{fmt(amount)} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: sourceColors[i % sourceColors.length], borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {brandDeals.filter(d => d.stage === 'invoice_sent').length > 0 && (
        <div style={{ ...cs, background: '#fef3c7', borderColor: '#fbbf24' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>💳</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#92400e' }}>Payment Alert</div>
              <div style={{ fontSize: '0.8rem', color: '#a16207' }}>{brandDeals.filter(d => d.stage === 'invoice_sent').length} invoice{brandDeals.filter(d => d.stage === 'invoice_sent').length > 1 ? 's' : ''} awaiting payment — follow up with brands</div>
            </div>
          </div>
        </div>
      )}
      <TransactionList transactions={[...incomeTxns, ...expenseTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>
  );

  const renderDeals = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(4)}>
        <KPICard icon="🤝" label="Total Deals" value={String(brandDeals.length)} changeType="neutral" color="#a855f7" />
        <KPICard icon="📦" label="Active" value={String(activeDeals.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="✅" label="Paid" value={String(brandDeals.filter(d => d.stage === 'paid').length)} changeType="up" color="#22c55e" />
        <KPICard icon="💸" label="Pipeline Value" value={fmt(pendingSponsorCash)} changeType={pendingSponsorCash > 0 ? 'up' : 'neutral'} color="#f59e0b" />
      </div>
      <button onClick={() => setShowAddDeal(true)} style={primaryBtn}>+ New Brand Deal</button>
      <div style={cs}>
        <h3 style={ct}>🤝 Brand Deal Pipeline</h3>
        {brandDeals.length === 0
          ? emptyState('🤝', 'No deals yet', 'Add your first brand sponsorship')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 700 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Brand', 'Platform', 'Value', 'Stage', 'Due', 'Contact', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{brandDeals.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{d.brand}</td>
                    <td style={{ padding: '0.5rem' }}>{d.platform}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{d.currency === 'USD' ? `$${d.amount.toLocaleString()}` : fmt(d.amount)}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <select value={d.stage} onChange={e => d.id && handleUpdateDealStage(d.id, e.target.value as CreatorBrandDeal['stage'])}
                        style={{ padding: '2px 6px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid #e2e8f0', background: stageColors[d.stage]?.bg, color: stageColors[d.stage]?.fg, cursor: 'pointer' }}>
                        {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{d.dueDate || '—'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      {d.contactPhone ? (
                        <a href={generateWhatsAppLink(d.contactPhone, `Hi, following up on our ${d.brand} collaboration`)} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#25d366', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600 }}>
                          💬 {d.contactName || 'WhatsApp'}
                        </a>
                      ) : (d.contactName || '—')}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => d.id && handleDeleteDeal(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );

  const renderRevenue = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(4)}>
        <KPICard icon="💰" label="Total Revenue" value={fmt(totalRevenueLKR)} changeType={totalRevenueLKR > 0 ? 'up' : 'neutral'} color="#22c55e" />
        <KPICard icon="🌍" label="USD Revenue" value={fmtUsd(totalRevenueUSD)} changeType={totalRevenueUSD > 0 ? 'up' : 'neutral'} color="#06b6d4" />
        <KPICard icon="💸" label="Expenses" value={fmt(totalExpensesAmt)} changeType="neutral" color="#ef4444" />
        <KPICard icon="📊" label="Net Profit" value={fmt(netProfit)} changeType={netProfit > 0 ? 'up' : 'down'} color="#6366f1" />
      </div>
      <button onClick={() => setShowAddRevenue(true)} style={primaryBtn}>+ Record Revenue</button>
      <div style={cs}>
        <h3 style={ct}>💵 Revenue Entries</h3>
        {revenueEntries.length === 0
          ? emptyState('💵', 'No revenue yet', 'Record your first AdSense payout or brand deal payment')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 600 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Date', 'Source', 'Amount', 'LKR Value', 'Description'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{revenueEntries.slice(0, 20).map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem' }}>{r.date}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{r.source}</td>
                    <td style={{ padding: '0.5rem' }}>{r.currency === 'USD' ? `$${r.amount.toLocaleString()}` : fmt(r.amount)}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#22c55e' }}>{fmt(r.lkrAmount)}{r.cbslRate ? ` @${r.cbslRate}` : ''}</td>
                    <td style={{ padding: '0.5rem', color: '#64748b', fontSize: '0.8rem' }}>{r.description}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
      {/* Revenue by source breakdown */}
      {sourceEntries.length > 0 && (
        <div style={cs}>
          <h3 style={ct}>📈 Revenue by Source</h3>
          {sourceEntries.map(([source, amount], i) => {
            const pct = totalRevenueLKR > 0 ? Math.round((amount / totalRevenueLKR) * 100) : 0;
            return (
              <div key={source} style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.84rem' }}>{source}</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{fmt(amount)} ({pct}%)</span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: sourceColors[i % sourceColors.length], borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderExpenses = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(4)}>
        <KPICard icon="💸" label="Total Expenses" value={fmt(totalExpensesAmt)} changeType="neutral" color="#ef4444" />
        <KPICard icon="🛡️" label="Tax Deductible" value={fmt(deductibleExpenses)} changeType="neutral" color="#22c55e" />
        <KPICard icon="📸" label="Gear Depreciation" value={fmt(gearDepreciation)} changeType="neutral" color="#f59e0b" />
        <KPICard icon="🧾" label="Entries" value={String(creatorExpenses.length)} changeType="neutral" color="#6366f1" />
      </div>
      <button onClick={() => setShowAddExpense(true)} style={primaryBtn}>+ Add Expense</button>
      <div style={cs}>
        <h3 style={ct}>💸 Expense Log</h3>
        {creatorExpenses.length === 0
          ? emptyState('💸', 'No expenses yet', 'Start tracking your production costs')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 550 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Date', 'Category', 'Description', 'Amount', 'Deductible'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{creatorExpenses.slice(0, 20).map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem' }}>{e.date}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{e.category}</td>
                    <td style={{ padding: '0.5rem', color: '#64748b' }}>{e.description}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#ef4444' }}>{fmt(e.amount)}</td>
                    <td style={{ padding: '0.5rem' }}>{e.taxDeductible ? '✅' : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );

  const renderGear = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(4)}>
        <KPICard icon="📸" label="Total Items" value={String(gearItems.length)} changeType="neutral" color="#f59e0b" />
        <KPICard icon="💰" label="Total Value" value={fmt(gearItems.reduce((s, g) => s + g.purchaseCost, 0))} changeType="neutral" color="#3b82f6" />
        <KPICard icon="🛡️" label="Annual Depreciation" value={fmt(gearDepreciation)} changeType="neutral" color="#22c55e" />
        <KPICard icon="📋" label="IRD Deductible" value={fmt(gearDepreciation)} changeType="up" color="#a855f7" />
      </div>
      <button onClick={() => setShowAddGear(true)} style={primaryBtn}>+ Add Gear Purchase</button>
      <div style={cs}>
        <h3 style={ct}>📸 Gear Vault (Depreciation Assets)</h3>
        {gearItems.length === 0
          ? emptyState('📸', 'No gear logged', 'Add cameras, lenses, computers, and audio gear for IRD depreciation claims')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 700 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Item', 'Category', 'Cost', 'Purchased', 'Life', 'Annual Deduction', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{gearItems.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{g.name}</td>
                    <td style={{ padding: '0.5rem' }}>{g.category}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(g.purchaseCost)}</td>
                    <td style={{ padding: '0.5rem' }}>{g.purchaseDate}</td>
                    <td style={{ padding: '0.5rem' }}>{g.usefulLifeYears}yr</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#22c55e' }}>{fmt(g.annualDepreciation)}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => g.id && handleDeleteGear(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
      {gearItems.length > 0 && (
        <div style={{ ...cs, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>🛡️</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>IRD Depreciation Ready</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>
                Total annual depreciation claim: {fmt(gearDepreciation)} across {gearItems.length} asset{gearItems.length > 1 ? 's' : ''} (Section 25, Inland Revenue Act)
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // AI Tools
  const AI_TOOLS = [
    { id: 'hook_generator', name: 'Hook Generator', icon: '🎣', desc: 'Generate viral hooks and titles for your content', cost: 1, placeholder: 'Describe your video topic, target audience, and platform...' },
    { id: 'brand_pitch_writer', name: 'Brand Pitch Writer', icon: '📧', desc: 'Draft professional sponsorship proposals', cost: 2, placeholder: 'Brand name, your channel stats, deliverables offered, rate...' },
    { id: 'thumbnail_lab', name: 'Thumbnail Lab', icon: '🖼️', desc: 'Optimize thumbnail concepts for CTR', cost: 1, placeholder: 'Describe your thumbnail concept, colours, text, and composition...' },
    { id: 'content_repurposer', name: 'Content Repurposer', icon: '♻️', desc: 'Turn long-form into shorts, reels, threads', cost: 2, placeholder: 'Paste your script or describe the video content to repurpose...' },
    { id: 'tax_advisor', name: 'Tax Advisor', icon: '🛡️', desc: 'Sri Lankan tax guidance for creator income', cost: 2, placeholder: 'Describe your income sources, foreign revenue, deductions...' },
    { id: 'income_proof', name: 'Income Proof Writer', icon: '🏦', desc: 'Bank-ready income statement drafts', cost: 2, placeholder: 'Purpose (bank loan, visa, lease), time period, income sources...' },
  ];

  const renderAI = () => (
    <div style={stackGap(20)}>
      <div style={cs}>
        <h3 style={ct}>🧠 AI Creator Studio</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: 'rgba(124,58,237,0.05)', borderRadius: 10, marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🪙</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Token Balance: {walletData.tokenBalance.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Select a tool and enter your query</div>
          </div>
        </div>
        <div style={gridColumns(2)}>
          {AI_TOOLS.map(tool => (
            <div key={tool.id} style={{
              padding: '1rem', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
              border: aiToolActive === tool.id ? `2px solid ${PURPLE}` : '1px solid #e2e8f0',
              background: aiToolActive === tool.id ? 'rgba(124,58,237,0.05)' : '#f8fafc',
            }} onClick={() => { setAiToolActive(tool.id); setAiResult(null); setAiPrompt(''); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{tool.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{tool.desc}</div>
              <div style={{ fontSize: '0.7rem', color: PURPLE, fontWeight: 600 }}>🪙 {tool.cost} tokens</div>
            </div>
          ))}
        </div>
      </div>
      {aiToolActive && (
        <div style={cs}>
          <h3 style={{ ...ct, margin: 0, marginBottom: '0.75rem' }}>
            {AI_TOOLS.find(t => t.id === aiToolActive)?.icon} {AI_TOOLS.find(t => t.id === aiToolActive)?.name}
          </h3>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
            placeholder={AI_TOOLS.find(t => t.id === aiToolActive)?.placeholder}
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button onClick={() => handleAIQuery(aiToolActive, aiPrompt)} disabled={aiLoading || !aiPrompt.trim()}
              style={{ ...primaryBtn, opacity: aiLoading || !aiPrompt.trim() ? 0.6 : 1 }}>
              {aiLoading ? '⏳ Processing...' : `🚀 Run (${AI_TOOLS.find(t => t.id === aiToolActive)?.cost} tokens)`}
            </button>
            <button onClick={() => { setAiToolActive(null); setAiResult(null); }} style={{ ...actionBtn('#6b7280'), padding: '6px 14px' }}>Cancel</button>
          </div>
        </div>
      )}
      {aiResult && (
        <div style={cs}>
          <h3 style={ct}>📋 AI Result</h3>
          <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', color: '#1e293b', maxHeight: 500, overflow: 'auto' }}>{aiResult}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
            <button onClick={() => navigator.clipboard.writeText(aiResult)} style={actionBtn('#6366f1')}>📋 Copy</button>
            <button onClick={() => setAiResult(null)} style={actionBtn('#6b7280')}>✕ Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderWallet = () => (
    <div style={stackGap(20)}>
      <div style={{ ...cs, background: 'linear-gradient(135deg, #581c87, #06b6d4)', color: 'white' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Token Balance</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.25rem 0' }}>🪙 {walletData.tokenBalance.toLocaleString()}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Used for AI Tools · Auto-reload {walletData.autoReloadEnabled ? 'ON' : 'OFF'}</div>
      </div>
      <div style={cs}>
        <h3 style={ct}>🛒 Buy Tokens</h3>
        <div style={gridColumns(3)}>
          {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
            <div key={pkg.id} style={{ padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
              onClick={() => walletData.purchaseTokens(pkg.id)}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: PURPLE }}>{pkg.tokens}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>tokens</div>
              <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 8, color: '#0f172a' }}>LKR {pkg.price_lkr.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div style={stackGap(20)}>
      <div style={cs}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ ...ct, margin: 0 }}>⚙️ Creator Settings</h3>
          {!editingSettings ? (
            <button onClick={() => setEditingSettings(true)} style={actionBtn(PURPLE)}>✏️ Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setEditingSettings(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={primaryBtn}>
                {settingsSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
          {[
            { key: 'channelName', label: 'Channel / Creator Name', placeholder: 'e.g. TechWithNimal' },
            { key: 'platform', label: 'Primary Platform', placeholder: 'e.g. YouTube, Instagram, TikTok' },
            { key: 'niche', label: 'Niche / Category', placeholder: 'e.g. Tech Reviews, Lifestyle, Food' },
            { key: 'subscriberCount', label: 'Subscriber / Follower Count', placeholder: 'e.g. 150,000' },
            { key: 'adsenseEmail', label: 'AdSense Email', placeholder: 'adsense@gmail.com' },
            { key: 'wiseEmail', label: 'Wise Email (FX)', placeholder: 'wise@email.com' },
            { key: 'bankAccount', label: 'Bank Account', placeholder: 'Commercial Bank 1234-5678' },
            { key: 'irdTin', label: 'IRD TIN', placeholder: 'TIN number' },
            { key: 'vatReg', label: 'VAT Registration', placeholder: 'If registered' },
            { key: 'financialYear', label: 'Financial Year', placeholder: '2025/2026' },
            { key: 'defaultCurrency', label: 'Default Currency', placeholder: 'LKR' },
            { key: 'cbslRate', label: 'CBSL USD Rate', placeholder: '300' },
          ].map(field => (
            <div key={field.key}>
              <label style={labelStyle}>{field.label}</label>
              <input
                style={inputStyle}
                value={(creatorSettings as any)[field.key]}
                onChange={e => setCreatorSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                placeholder={field.placeholder}
                disabled={!editingSettings}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  MODALS
  // ═══════════════════════════════════════════════════

  const renderModals = () => (<>
    {/* Add Deal Modal */}
    {showAddDeal && <div style={modalOverlay} onClick={() => setShowAddDeal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: PURPLE }}>🤝 New Brand Deal</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Brand *</label><input style={inputStyle} value={newDeal.brand} onChange={e => setNewDeal(d => ({ ...d, brand: e.target.value }))} placeholder="e.g. Dialog, NordVPN, Keells" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Platform</label>
              <select style={selectStyle} value={newDeal.platform} onChange={e => setNewDeal(d => ({ ...d, platform: e.target.value }))}>
                {['YouTube', 'Instagram', 'TikTok', 'Facebook', 'LinkedIn', 'Twitter', 'Multi-platform', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Stage</label>
              <select style={selectStyle} value={newDeal.stage} onChange={e => setNewDeal(d => ({ ...d, stage: e.target.value as CreatorBrandDeal['stage'] }))}>
                {Object.entries(stageLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Amount *</label><input type="number" style={inputStyle} value={newDeal.amount} onChange={e => setNewDeal(d => ({ ...d, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Currency</label>
              <select style={selectStyle} value={newDeal.currency} onChange={e => setNewDeal(d => ({ ...d, currency: e.target.value as 'LKR' | 'USD' }))}>
                <option value="LKR">LKR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Deliverables</label><input style={inputStyle} value={newDeal.deliverables} onChange={e => setNewDeal(d => ({ ...d, deliverables: e.target.value }))} placeholder="e.g. 1x YouTube video + 2x Instagram Reels" /></div>
          <div><label style={labelStyle}>Due Date</label><input type="date" style={inputStyle} value={newDeal.dueDate} onChange={e => setNewDeal(d => ({ ...d, dueDate: e.target.value }))} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Contact Name</label><input style={inputStyle} value={newDeal.contactName} onChange={e => setNewDeal(d => ({ ...d, contactName: e.target.value }))} placeholder="Brand manager name" /></div>
            <div><label style={labelStyle}>WhatsApp</label><input style={inputStyle} value={newDeal.contactPhone} onChange={e => setNewDeal(d => ({ ...d, contactPhone: e.target.value }))} placeholder="+94 77 123 4567" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddDeal(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddDeal}>Add Deal</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Gear Modal */}
    {showAddGear && <div style={modalOverlay} onClick={() => setShowAddGear(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: PURPLE }}>📸 Add Gear Purchase</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Item Name *</label><input style={inputStyle} value={newGear.name} onChange={e => setNewGear(g => ({ ...g, name: e.target.value }))} placeholder="e.g. Sony A7 IV, MacBook Pro M3" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Category</label>
              <select style={selectStyle} value={newGear.category} onChange={e => setNewGear(g => ({ ...g, category: e.target.value as CreatorGearItem['category'] }))}>
                {['Camera', 'Lens', 'Audio', 'Lighting', 'Computer', 'Drone', 'Accessories', 'Software', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Purchase Date</label><input type="date" style={inputStyle} value={newGear.purchaseDate} onChange={e => setNewGear(g => ({ ...g, purchaseDate: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Purchase Cost (LKR) *</label><input type="number" style={inputStyle} value={newGear.purchaseCost} onChange={e => setNewGear(g => ({ ...g, purchaseCost: e.target.value }))} /></div>
            <div><label style={labelStyle}>Useful Life (years)</label><input type="number" style={inputStyle} value={newGear.usefulLifeYears} onChange={e => setNewGear(g => ({ ...g, usefulLifeYears: e.target.value }))} /></div>
          </div>
          {(parseFloat(newGear.purchaseCost) > 0) && (
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Annual IRD Depreciation: </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>
                {fmt(Math.round(parseFloat(newGear.purchaseCost) / (parseInt(newGear.usefulLifeYears) || 5)))}
              </span>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Invoice Ref</label><input style={inputStyle} value={newGear.invoiceRef} onChange={e => setNewGear(g => ({ ...g, invoiceRef: e.target.value }))} placeholder="Invoice number" /></div>
            <div><label style={labelStyle}>Serial Number</label><input style={inputStyle} value={newGear.serialNumber} onChange={e => setNewGear(g => ({ ...g, serialNumber: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddGear(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddGear}>Add Gear</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Revenue Modal */}
    {showAddRevenue && <div style={modalOverlay} onClick={() => setShowAddRevenue(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: PURPLE }}>💵 Record Revenue</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newRevenue.date} onChange={e => setNewRevenue(r => ({ ...r, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Source</label>
              <select style={selectStyle} value={newRevenue.source} onChange={e => setNewRevenue(r => ({ ...r, source: e.target.value as CreatorRevenue['source'] }))}>
                {['AdSense', 'Brand Deal', 'Affiliate', 'Wise', 'PayPal', 'Freelance', 'Other'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Amount *</label><input type="number" style={inputStyle} value={newRevenue.amount} onChange={e => setNewRevenue(r => ({ ...r, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Currency</label>
              <select style={selectStyle} value={newRevenue.currency} onChange={e => setNewRevenue(r => ({ ...r, currency: e.target.value as 'LKR' | 'USD' }))}>
                <option value="LKR">LKR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          {newRevenue.currency === 'USD' && parseFloat(newRevenue.amount) > 0 && (
            <div style={{ padding: '0.75rem', background: '#eff6ff', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>LKR Value: </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#3b82f6' }}>
                {fmt(Math.round(parseFloat(newRevenue.amount) * (parseFloat(creatorSettings.cbslRate) || 300)))}
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}> @ CBSL {creatorSettings.cbslRate}</span>
            </div>
          )}
          <div><label style={labelStyle}>Description</label><input style={inputStyle} value={newRevenue.description} onChange={e => setNewRevenue(r => ({ ...r, description: e.target.value }))} placeholder="e.g. March AdSense payout, Dialog campaign final payment" /></div>
          {brandDeals.length > 0 && (
            <div><label style={labelStyle}>Link to Deal (optional)</label>
              <select style={selectStyle} value={newRevenue.brandDealId} onChange={e => setNewRevenue(r => ({ ...r, brandDealId: e.target.value }))}>
                <option value="">— No deal —</option>
                {brandDeals.map(d => <option key={d.id} value={String(d.id)}>{d.brand} ({d.platform})</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddRevenue(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddRevenue}>Record Revenue</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Expense Modal */}
    {showAddExpense && <div style={modalOverlay} onClick={() => setShowAddExpense(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: PURPLE }}>💸 Add Expense</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newExpenseForm.date} onChange={e => setNewExpenseForm(x => ({ ...x, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Category</label>
              <select style={selectStyle} value={newExpenseForm.category} onChange={e => setNewExpenseForm(x => ({ ...x, category: e.target.value as CreatorExpense['category'] }))}>
                {['Production', 'Software', 'Travel', 'Equipment', 'Creative Ops', 'Office', 'Marketing', 'Freelancer', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Description *</label><input style={inputStyle} value={newExpenseForm.description} onChange={e => setNewExpenseForm(x => ({ ...x, description: e.target.value }))} placeholder="e.g. Editor retainer, Adobe subscription, Studio props" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Amount (LKR) *</label><input type="number" style={inputStyle} value={newExpenseForm.amount} onChange={e => setNewExpenseForm(x => ({ ...x, amount: e.target.value }))} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" checked={newExpenseForm.taxDeductible} onChange={e => setNewExpenseForm(x => ({ ...x, taxDeductible: e.target.checked }))} id="taxDeductible" />
              <label htmlFor="taxDeductible" style={{ fontSize: '0.875rem', fontWeight: 600, color: '#334155' }}>Tax Deductible</label>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddExpense(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddExpense}>Add Expense</button>
          </div>
        </div>
      </div>
    </div>}

    {showInvoiceForm && <InvoiceForm onSubmit={handleCreateInvoice} onCancel={() => setShowInvoiceForm(false)} />}
  </>);

  // ═══════════════════════════════════════════════════
  //  CONTENT ROUTER
  // ═══════════════════════════════════════════════════

  const renderContent = () => {
    switch (activeNav) {
      case 'overview': return renderOverview();
      case 'briefing': return <SubscriptionGate featureName="Morning Briefing" featureIcon="🌅"><MorningBriefing /></SubscriptionGate>;
      case 'inbox': return <TransactionInbox />;
      case 'deals': return renderDeals();
      case 'revenue': return renderRevenue();
      case 'expenses': return renderExpenses();
      case 'tax': return <TaxSpeedometer annualPrivateIncome={totalIncome} annualGovIncome={0} annualExpenses={totalExpensesTxn} whtDeducted={0} />;
      case 'receipts': return <ReceiptScanner />;
      case 'gear': return <SubscriptionGate featureName="Gear Vault" featureIcon="📸">{renderGear()}</SubscriptionGate>;
      case 'ai': return <SubscriptionGate featureName="AI Studio" featureIcon="🧠">{renderAI()}</SubscriptionGate>;
      case 'export': return <SubscriptionGate featureName="Auditor Export" featureIcon="📤"><AuditorExport invoices={incomeTxns} expenses={expenseTxns} /></SubscriptionGate>;
      case 'voicevault': return <SubscriptionGate featureName="Voice Vault" featureIcon="🎙️"><BiometricGate sectionName="Voice Vault"><AIVoiceVault /></BiometricGate></SubscriptionGate>;
      case 'scheduler': return <SubscriptionGate featureName="Smart Scheduler" featureIcon="📅"><SmartScheduler /></SubscriptionGate>;
      case 'lifeadmin': return <SubscriptionGate featureName="Life Admin" featureIcon="📋"><LifeAdmin /></SubscriptionGate>;
      case 'wallet': return renderWallet();
      case 'subscription': return <SubscriptionManager />;
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  const renderMobileSectionNav = () => {
    if (!isCompactMobile || activeMobileSections.length <= 1) return null;
    return (
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 0 12px', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        {activeMobileSections.map(item => (
          <button key={item.id} onClick={() => setActiveNav(item.id)}
            style={{
              padding: '6px 14px', border: 'none', borderRadius: 20,
              background: activeNav === item.id ? 'linear-gradient(135deg, #a855f7, #06b6d4)' : '#f1f5f9',
              color: activeNav === item.id ? 'white' : '#64748b',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
              transition: 'all 0.2s',
            }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <DashboardLayout
        profession="creator" professionLabel="CreatorTracksy" professionIcon="🎥"
        userName={userName} navItems={navItems} activeNav={activeNav}
        onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}
        tokenBalance={walletData.tokenBalance} onWalletClick={() => setActiveNav('wallet')}
        mobileShell={{
          enabled: true, tabs: CREATOR_MOBILE_TABS, activeTab: activeMobileTab,
          onTabChange: handleMobileTabChange, activeTitle: activeNavItem.label,
          activeSubtitle: `${currentDateLabel} • ${userName}`,
          accentColor: '#a855f7',
          activeTabBackground: 'linear-gradient(135deg, rgba(168,85,247,0.16), rgba(6,182,212,0.16))',
          background: 'linear-gradient(180deg, #0f0820 0%, #180d2f 24%, #f5f3ff 24.1%, #f8fafc 100%)',
          headerBackground: 'rgba(15,8,32,0.88)',
          navBackground: 'rgba(14,12,26,0.94)',
          subtitleColor: '#cbd5e1',
        }}
      >
        <>
          {renderMobileSectionNav()}
          {renderContent()}
        </>
      </DashboardLayout>
      {renderModals()}
      <VoiceInput onAction={handleVoiceAction} position="float"
        floatingOffset={isCompactMobile ? { bottom: 114, right: 16 } : undefined} />
    </>
  );
};

/* ================================================================
   STYLES (outside component)
   ================================================================ */
const cs: React.CSSProperties = {
  background: 'white', borderRadius: 14, padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
  border: '1px solid #e2e8f0',
};
const ct: React.CSSProperties = {
  margin: '0 0 1rem', fontSize: '1.05rem', fontWeight: 700,
  color: '#0f172a', letterSpacing: '-0.01em',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.875rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.625rem 0.875rem', border: '1.5px solid #e2e8f0',
  borderRadius: 10, fontSize: '0.9375rem', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', color: '#1e293b', transition: 'border-color 0.2s',
};
const selectStyle: React.CSSProperties = { ...inputStyle, background: 'white' };
const actionBtn = (color: string): React.CSSProperties => ({
  padding: '0.625rem 1.25rem', border: 'none', borderRadius: 10, background: color,
  color: 'white', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
  boxShadow: `0 2px 8px ${color}40`, letterSpacing: '-0.01em', transition: 'all 0.2s',
});
const modalOverlay: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
  justifyContent: 'center', zIndex: 1000, padding: '1rem',
};
const modalBox: React.CSSProperties = {
  background: 'white', borderRadius: 16, padding: '2rem', width: '100%',
  maxWidth: 500, maxHeight: '90vh', overflow: 'auto',
};
const primaryBtn: React.CSSProperties = {
  padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, background: '#7c3aed',
  color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn: React.CSSProperties = {
  padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white',
  color: '#475569', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};

export default CreatorDashboard;
