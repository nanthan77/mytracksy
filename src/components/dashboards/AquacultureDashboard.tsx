import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouteNav } from '../../hooks/useRouteNav';
import db, { AquaPond, AquaFeedLog, AquaWaterLog, AquaHarvestSale, AquaExpense } from '../../lib/db';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';
import VoiceInput, { ParsedVoiceAction } from '../VoiceInput';
import TaxSpeedometer from '../TaxSpeedometer';
import ReceiptScanner from '../ReceiptScanner';
import AuditorExport from '../AuditorExport';
import TransactionInbox from '../TransactionInbox';
import AIVoiceVault from '../AIVoiceVault';
import MorningBriefing from '../MorningBriefing';
import SmartScheduler from '../SmartScheduler';
import LifeAdmin from '../LifeAdmin';
import BiometricGate from '../BiometricGate';
import SubscriptionGate from '../SubscriptionGate';
import SubscriptionManager from '../SubscriptionManager';
import { useAuth } from '../../context/AuthContext';
import { useTokenWallet, TOKEN_PACKAGES, TokenPackage } from '../../hooks/useTokenWallet';
import { addTransaction, subscribeTransactions, seedChartOfAccounts } from '../../services/accountingCoreService';
import { useIsCompactMobile } from './useIsCompactMobile';
import { generateWhatsAppLink } from '../../services/whatsappService';
import { startAquacultureAutoSync, stopAquacultureAutoSync } from '../../services/aquacultureSyncService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../../config/firebase';

/* ============ Props ============ */
interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

/* ============ Nav Items ============ */
const navItems = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'briefing', label: 'Morning Briefing', icon: '🌅', premium: true },
  { id: 'inbox', label: 'Transaction Inbox', icon: '📥' },
  { id: 'ponds', label: 'Ponds & Tanks', icon: '🐟' },
  { id: 'feed', label: 'Feed & Warehouse', icon: '🌾' },
  { id: 'water', label: 'Water Quality', icon: '🧪' },
  { id: 'harvest', label: 'Harvest & Sales', icon: '📦' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'tax', label: 'Tax', icon: '🧮' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'export', label: 'Auditor Export', icon: '📤' },
  { id: 'ai', label: 'AI Tools', icon: '🤖' },
  { id: 'voicevault', label: 'Voice Vault', icon: '🎙️', premium: true },
  { id: 'scheduler', label: 'Smart Scheduler', icon: '📅', premium: true },
  { id: 'lifeadmin', label: 'Life Admin', icon: '📋', premium: true },
  { id: 'wallet', label: 'Token Wallet', icon: '🪙' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ============ Mobile Tab System ============ */
type AquaMobileTabId = 'home' | 'farm' | 'money' | 'tools' | 'more';
const AQUA_MOBILE_TABS: { id: AquaMobileTabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'farm', label: 'Farm', icon: '🐟' },
  { id: 'money', label: 'Money', icon: '💳' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'more', label: 'More', icon: '☰' },
];
const AQUA_MOBILE_GROUPS: Record<AquaMobileTabId, string[]> = {
  home: ['overview', 'inbox', 'briefing'],
  farm: ['ponds', 'feed', 'water', 'harvest'],
  money: ['income', 'expenses', 'tax', 'reports', 'export', 'wallet'],
  tools: ['ai', 'voicevault', 'scheduler', 'receipts'],
  more: ['lifeadmin', 'subscription', 'settings'],
};
const AQUA_MOBILE_DEFAULT_NAV: Record<AquaMobileTabId, string> = {
  home: 'overview', farm: 'ponds', money: 'income', tools: 'ai', more: 'settings',
};
function getAquaMobileTab(activeNav: string): AquaMobileTabId {
  const match = AQUA_MOBILE_TABS.find(tab => AQUA_MOBILE_GROUPS[tab.id].includes(activeNav));
  return match?.id || 'home';
}

/* ============ Constants ============ */
const OCEAN = '#0c4a6e';
const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;

const stageColors: Record<string, { bg: string; fg: string }> = {
  fingerling: { bg: '#fef3c7', fg: '#f59e0b' },
  growing: { bg: '#dbeafe', fg: '#3b82f6' },
  'pre-harvest': { bg: '#dcfce7', fg: '#22c55e' },
  harvested: { bg: '#f3e8ff', fg: '#8b5cf6' },
  idle: { bg: '#f1f5f9', fg: '#64748b' },
};

const emptyState = (icon: string, title: string, subtitle: string) => (
  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
    <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{icon}</div>
    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#64748b' }}>{title}</h3>
    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem' }}>{subtitle}</p>
  </div>
);

/* ================================================================
   COMPONENT
   ================================================================ */
const AquacultureDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const walletData = useTokenWallet(uid || '');
  const isCompactMobile = useIsCompactMobile();

  const validNavIds = useMemo(() => navItems.map(n => n.id), []);
  const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [expenseTxns, setExpenseTxns] = useState<Transaction[]>([]);

  // Modal states
  const [showAddPond, setShowAddPond] = useState(false);
  const [showAddFeed, setShowAddFeed] = useState(false);
  const [showAddWater, setShowAddWater] = useState(false);
  const [showAddHarvest, setShowAddHarvest] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);

  // AI state
  const [aiToolActive, setAiToolActive] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Settings state
  const [aquaSettings, setAquaSettings] = useState({
    farmName: '', naqdaReg: '', location: '', exportLicence: '',
    species: '', vatReg: '', irdTin: '', financialYear: '2025/2026 (April – March)',
    bankAccount: '', piInsurance: '',
  });
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Form states
  const [newPond, setNewPond] = useState({ name: '', species: '', area: '', stockCount: '', stage: 'fingerling' as AquaPond['stage'], estHarvest: '' });
  const [newFeed, setNewFeed] = useState({ date: new Date().toISOString().slice(0, 10), pondId: '', feedType: '', quantity: '', cost: '', fcr: '' });
  const [newWater, setNewWater] = useState({ date: new Date().toISOString().slice(0, 10), pondId: '', ph: '7.0', dissolvedOxygen: '5.0', temperature: '28', ammonia: '0', salinity: '' });
  const [newHarvest, setNewHarvest] = useState({ date: new Date().toISOString().slice(0, 10), pondId: '', species: '', quantity: '', pricePerKg: '', buyer: '', grade: 'A' as 'A' | 'B' | 'C', currency: 'LKR' as 'LKR' | 'USD' });
  const [newExpense, setNewExpense] = useState({ date: new Date().toISOString().slice(0, 10), category: 'Feed' as AquaExpense['category'], amount: '', description: '', pondId: '' });

  // Dexie live queries
  const ponds = useLiveQuery(() => uid ? db.aqua_ponds.where('userId').equals(uid).toArray() : [], [uid]) || [];
  const feedLogs = useLiveQuery(() => uid ? db.aqua_feed_logs.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const waterLogs = useLiveQuery(() => uid ? db.aqua_water_logs.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const harvestSales = useLiveQuery(() => uid ? db.aqua_harvest_sales.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const aquaExpenses = useLiveQuery(() => uid ? db.aqua_expenses.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];

  // Computed values
  const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
  const totalExpensesAmt = expenseTxns.reduce((s, t) => s + t.amount, 0);
  const totalRevenue = harvestSales.reduce((s, h) => s + h.totalAmount, 0);
  const totalFeedCost = feedLogs.reduce((s, f) => s + f.cost, 0);
  const totalAquaExpenses = aquaExpenses.reduce((s, e) => s + e.amount, 0);
  const avgFCR = feedLogs.filter(f => f.fcr).length > 0
    ? feedLogs.reduce((s, f) => s + (f.fcr || 0), 0) / feedLogs.filter(f => f.fcr).length : 0;
  const waterIssues = (() => {
    const latestByPond: Record<number, AquaWaterLog> = {};
    waterLogs.forEach(w => { if (!latestByPond[w.pondId] || w.date > latestByPond[w.pondId].date) latestByPond[w.pondId] = w; });
    return Object.values(latestByPond).filter(w => w.status !== 'Good').length;
  })();
  const pondsPreHarvest = ponds.filter(p => p.stage === 'pre-harvest').length;

  // Feed warehouse (total purchased vs consumed)
  const totalFeedPurchased = feedLogs.reduce((s, f) => s + f.quantity, 0);

  // Revenue by species
  const revenueBySpecies: Record<string, number> = {};
  harvestSales.forEach(h => { revenueBySpecies[h.species] = (revenueBySpecies[h.species] || 0) + h.totalAmount; });
  const speciesEntries = Object.entries(revenueBySpecies).sort((a, b) => b[1] - a[1]);
  const speciesColors = ['#ef4444', '#f59e0b', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899'];

  // Today's feed
  const today = new Date().toISOString().slice(0, 10);
  const todayFeed = feedLogs.filter(f => f.date === today);
  const todayFeedKg = todayFeed.reduce((s, f) => s + f.quantity, 0);
  const todayFeedCost = todayFeed.reduce((s, f) => s + f.cost, 0);

  const activeNavItem = useMemo(() => navItems.find(n => n.id === activeNav) || navItems[0], [activeNav]);
  const activeMobileTab = useMemo(() => getAquaMobileTab(activeNav), [activeNav]);
  const activeMobileSections = useMemo(() => {
    const group = AQUA_MOBILE_GROUPS[activeMobileTab] || [];
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
    const stopSync = startAquacultureAutoSync(uid);

    getDoc(doc(firestoreDb, 'users', uid, 'aquaculture_settings', 'farm')).then(snap => {
      if (snap.exists()) setAquaSettings(prev => ({ ...prev, ...snap.data() }));
    });

    return () => { stopSync(); stopAquacultureAutoSync(); };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubIncome = subscribeTransactions(uid, 'income', (txns: Transaction[]) => setInvoices(txns));
    const unsubExpenses = subscribeTransactions(uid, 'expense', (txns: Transaction[]) => setExpenseTxns(txns));
    return () => { unsubIncome(); unsubExpenses(); };
  }, [uid]);

  /* ============ Handlers ============ */
  const handleAddPond = async () => {
    if (!uid || !newPond.name || !newPond.species) return;
    await db.aqua_ponds.add({
      name: newPond.name, species: newPond.species, area: newPond.area,
      stockCount: parseInt(newPond.stockCount) || 0, stage: newPond.stage,
      estHarvest: newPond.estHarvest, waterQuality: 'Good',
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewPond({ name: '', species: '', area: '', stockCount: '', stage: 'fingerling', estHarvest: '' });
    setShowAddPond(false);
  };

  const handleDeletePond = async (id: number) => {
    if (confirm('Delete this pond/tank?')) await db.aqua_ponds.delete(id);
  };

  const handleUpdatePondStage = async (id: number, stage: AquaPond['stage']) => {
    await db.aqua_ponds.update(id, { stage, updatedAt: Date.now(), sync_status: 'pending' });
  };

  const handleAddFeed = async () => {
    if (!uid || !newFeed.pondId || !newFeed.feedType) return;
    const pondId = parseInt(newFeed.pondId);
    const pond = ponds.find(p => p.id === pondId);
    await db.aqua_feed_logs.add({
      date: newFeed.date, pondId, pondName: pond?.name || '',
      feedType: newFeed.feedType, quantity: parseFloat(newFeed.quantity) || 0,
      cost: parseFloat(newFeed.cost) || 0,
      fcr: newFeed.fcr ? parseFloat(newFeed.fcr) : undefined,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewFeed({ date: today, pondId: '', feedType: '', quantity: '', cost: '', fcr: '' });
    setShowAddFeed(false);
  };

  const handleAddWater = async () => {
    if (!uid || !newWater.pondId) return;
    const pondId = parseInt(newWater.pondId);
    const pond = ponds.find(p => p.id === pondId);
    const ph = parseFloat(newWater.ph); const ammonia = parseFloat(newWater.ammonia);
    const dO = parseFloat(newWater.dissolvedOxygen);
    const status: AquaWaterLog['status'] = ammonia > 0.1 || ph < 6.5 || ph > 8.5 || dO < 4
      ? (ammonia > 0.5 ? 'Poor' : 'Fair') : 'Good';
    await db.aqua_water_logs.add({
      date: newWater.date, pondId, pondName: pond?.name || '',
      ph, dissolvedOxygen: dO, temperature: parseFloat(newWater.temperature) || 28,
      ammonia, salinity: newWater.salinity, status,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    if (pond?.id) await db.aqua_ponds.update(pond.id, { waterQuality: status, sync_status: 'pending' });
    setNewWater({ date: today, pondId: '', ph: '7.0', dissolvedOxygen: '5.0', temperature: '28', ammonia: '0', salinity: '' });
    setShowAddWater(false);
  };

  const handleAddHarvest = async () => {
    if (!uid || !newHarvest.species || !newHarvest.quantity) return;
    const pondId = parseInt(newHarvest.pondId) || 0;
    const pond = ponds.find(p => p.id === pondId);
    const qty = parseFloat(newHarvest.quantity) || 0;
    const ppk = parseFloat(newHarvest.pricePerKg) || 0;
    await db.aqua_harvest_sales.add({
      date: newHarvest.date, pondId: pondId || undefined, pondName: pond?.name || '',
      species: newHarvest.species, quantity: qty, pricePerKg: ppk,
      totalAmount: qty * ppk, buyer: newHarvest.buyer, grade: newHarvest.grade,
      currency: newHarvest.currency,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    // Also add as income transaction
    await addTransaction(uid, {
      date: newHarvest.date, amount: qty * ppk,
      category: 'Harvest Sales', type: 'income',
      description: `${newHarvest.species} — ${qty}kg @ ${ppk}/${newHarvest.currency === 'USD' ? '$' : 'Rs.'}`,
      paymentMethod: 'bank',
    });
    setNewHarvest({ date: today, pondId: '', species: '', quantity: '', pricePerKg: '', buyer: '', grade: 'A', currency: 'LKR' });
    setShowAddHarvest(false);
  };

  const handleAddExpense = async () => {
    if (!uid || !newExpense.amount || !newExpense.description) return;
    const pondId = parseInt(newExpense.pondId) || 0;
    const pond = ponds.find(p => p.id === pondId);
    const amt = parseFloat(newExpense.amount) || 0;
    await db.aqua_expenses.add({
      date: newExpense.date, category: newExpense.category, amount: amt,
      description: newExpense.description,
      pondId: pondId || undefined, pondName: pond?.name || undefined,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    await addTransaction(uid, {
      date: newExpense.date, amount: amt,
      category: newExpense.category, type: 'expense',
      description: newExpense.description, paymentMethod: 'cash',
    });
    setNewExpense({ date: today, category: 'Feed', amount: '', description: '', pondId: '' });
    setShowAddExpense(false);
  };

  const handleCreateInvoice = async (inv: InvoiceData) => {
    if (!uid) return;
    await addTransaction(uid, {
      date: inv.date, amount: inv.amount, category: inv.category || 'Harvest Sales',
      type: 'income', description: inv.description, paymentMethod: 'bank',
    });
    setShowInvoiceForm(false);
  };

  const handleAIQuery = useCallback(async (tool: string, prompt: string) => {
    if (!uid || !prompt.trim()) return;
    setAiLoading(true);
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const fn = httpsCallable(functions, 'processAquacultureAI');
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
      await setDoc(doc(firestoreDb, 'users', uid, 'aquaculture_settings', 'farm'), aquaSettings, { merge: true });
      setEditingSettings(false);
    } catch (err) { console.error('Settings save failed', err); }
    finally { setSettingsSaving(false); }
  };

  const handleVoiceAction = (action: ParsedVoiceAction) => {
    if (!uid) return;
    if (action.type === 'expense') {
      addTransaction(uid, {
        date: new Date().toISOString().split('T')[0], amount: action.amount || 0,
        category: action.category || 'Feed', type: 'expense',
        description: action.description || 'Voice expense',
      });
    }
  };

  const handleMobileTabChange = (tabId: string) => {
    const defaultNav = AQUA_MOBILE_DEFAULT_NAV[tabId as AquaMobileTabId];
    if (defaultNav) setActiveNav(defaultNav);
  };

  // ═══════════════════════════════════════════════════
  //  RENDER SECTIONS
  // ═══════════════════════════════════════════════════

  const renderOverview = () => (
    <div style={stackGap(20)}>
      <div style={{ background: `linear-gradient(135deg, ${OCEAN}, #0369a1)`, borderRadius: 16, padding: isCompactMobile ? '1.1rem' : '2rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 4 }}>Welcome back, {userName}</div>
            <div style={{ fontSize: isCompactMobile ? '2rem' : '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {fmt(totalRevenue - totalFeedCost - totalAquaExpenses)}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 6 }}>Net Profit · {ponds.filter(p => p.stage !== 'idle' && p.stage !== 'harvested').length} Active Ponds</div>
          </div>
          <div style={{ textAlign: isCompactMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Today's Feed</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{todayFeedKg} kg · {fmt(todayFeedCost)}</div>
          </div>
        </div>
      </div>
      <div style={gridColumns(5)}>
        <KPICard icon="🐟" label="Ponds" value={String(ponds.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="💰" label="Revenue" value={fmt(totalRevenue)} changeType={totalRevenue > 0 ? 'up' : 'neutral'} color="#22c55e" />
        <KPICard icon="🌾" label="Feed Cost" value={fmt(totalFeedCost)} changeType="neutral" color="#f59e0b" />
        <KPICard icon="📊" label="Avg FCR" value={avgFCR > 0 ? avgFCR.toFixed(2) : '—'} changeType={avgFCR > 0 && avgFCR <= 1.5 ? 'up' : avgFCR > 2 ? 'down' : 'neutral'} color="#6366f1" />
        <KPICard icon="⚠️" label="Water Issues" value={String(waterIssues)} changeType={waterIssues > 0 ? 'down' : 'up'} color="#ef4444" />
      </div>
      <div style={gridColumns(2)}>
        <div style={cs}>
          <h3 style={ct}>🐟 Pond Status</h3>
          {ponds.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              {emptyState('🐟', 'No ponds yet', 'Add your first pond to get started')}
              <button onClick={() => { setActiveNav('ponds'); setShowAddPond(true); }} style={primaryBtn}>+ Add First Pond</button>
            </div>
          ) : ponds.map(p => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize: '0.84rem', fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.species} · {p.stockCount.toLocaleString()} pcs · {p.area}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: stageColors[p.stage]?.bg, color: stageColors[p.stage]?.fg }}>{p.stage}</span>
                <div style={{ fontSize: '0.7rem', color: p.waterQuality === 'Good' ? '#22c55e' : p.waterQuality === 'Fair' ? '#f59e0b' : '#ef4444', marginTop: 2, fontWeight: 600 }}>💧 {p.waterQuality}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={cs}>
          <h3 style={ct}>📈 Revenue by Species</h3>
          {speciesEntries.length === 0 ? emptyState('📈', 'No sales yet', 'Record your first harvest') : speciesEntries.map(([species, amount], i) => {
            const pct = totalRevenue > 0 ? Math.round((amount / totalRevenue) * 100) : 0;
            return (
              <div key={species} style={{ marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: '0.84rem' }}>{species}</span>
                  <span style={{ fontSize: '0.84rem', fontWeight: 600 }}>{fmt(amount)} ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: speciesColors[i % speciesColors.length], borderRadius: 3 }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {pondsPreHarvest > 0 && (
        <div style={{ ...cs, background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#16a34a' }}>Harvest Alert</div>
              <div style={{ fontSize: '0.8rem', color: '#15803d' }}>{pondsPreHarvest} pond{pondsPreHarvest > 1 ? 's' : ''} ready for harvest — prepare nets and transport</div>
            </div>
          </div>
        </div>
      )}
      <TransactionList transactions={[...invoices, ...expenseTxns].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>
  );

  const renderPonds = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(4)}>
        <KPICard icon="🐟" label="Total Ponds" value={String(ponds.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="🌱" label="Growing" value={String(ponds.filter(p => p.stage === 'growing').length)} changeType="neutral" color="#22c55e" />
        <KPICard icon="📦" label="Pre-Harvest" value={String(pondsPreHarvest)} changeType={pondsPreHarvest > 0 ? 'up' : 'neutral'} color="#6366f1" />
        <KPICard icon="😴" label="Idle" value={String(ponds.filter(p => p.stage === 'idle').length)} changeType="neutral" color="#94a3b8" />
      </div>
      <button onClick={() => setShowAddPond(true)} style={primaryBtn}>+ Add Pond / Tank</button>
      <div style={cs}>
        <h3 style={ct}>🐟 All Ponds & Tanks</h3>
        {ponds.length === 0
          ? emptyState('🐟', 'No ponds registered', 'Add your first pond or tank')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 680 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Pond', 'Species', 'Area', 'Stock', 'Stage', 'Est. Harvest', 'Water', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{ponds.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '0.5rem' }}>{p.species}</td>
                    <td style={{ padding: '0.5rem' }}>{p.area}</td>
                    <td style={{ padding: '0.5rem' }}>{p.stockCount.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <select value={p.stage} onChange={e => p.id && handleUpdatePondStage(p.id, e.target.value as AquaPond['stage'])}
                        style={{ padding: '2px 6px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, border: '1px solid #e2e8f0', background: stageColors[p.stage]?.bg, color: stageColors[p.stage]?.fg, cursor: 'pointer' }}>
                        {['fingerling', 'growing', 'pre-harvest', 'harvested', 'idle'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '0.5rem' }}>{p.estHarvest || '—'}</td>
                    <td style={{ padding: '0.5rem', color: p.waterQuality === 'Good' ? '#22c55e' : p.waterQuality === 'Fair' ? '#f59e0b' : '#ef4444', fontWeight: 600 }}>{p.waterQuality}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <button onClick={() => p.id && handleDeletePond(p.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}>🗑️</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );

  const renderFeed = () => {
    // Feed warehouse: group by feedType
    const warehouseMap: Record<string, { purchased: number; cost: number }> = {};
    feedLogs.forEach(f => {
      if (!warehouseMap[f.feedType]) warehouseMap[f.feedType] = { purchased: 0, cost: 0 };
      warehouseMap[f.feedType].purchased += f.quantity;
      warehouseMap[f.feedType].cost += f.cost;
    });
    const warehouseEntries = Object.entries(warehouseMap).sort((a, b) => b[1].cost - a[1].cost);

    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(4)}>
          <KPICard icon="🌾" label="Daily Feed" value={`${todayFeedKg} kg`} changeType="neutral" color="#f59e0b" />
          <KPICard icon="💰" label="Daily Cost" value={fmt(todayFeedCost)} changeType="neutral" color="#ef4444" />
          <KPICard icon="📊" label="Avg FCR" value={avgFCR > 0 ? avgFCR.toFixed(2) : '—'} changeType={avgFCR > 0 && avgFCR <= 1.5 ? 'up' : 'neutral'} color="#6366f1" />
          <KPICard icon="📦" label="Total Feed" value={`${totalFeedPurchased.toLocaleString()} kg`} changeType="neutral" color="#3b82f6" />
        </div>

        {/* Feed Warehouse */}
        {warehouseEntries.length > 0 && (
          <div style={cs}>
            <h3 style={ct}>📦 Feed Warehouse</h3>
            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem' }}>
              Track feed usage per type — flag anomalies to detect overfeeding or theft
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Feed Type', 'Total Used (kg)', 'Total Cost', 'Avg Cost/kg'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{warehouseEntries.map(([type, data]) => (
                  <tr key={type} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{type}</td>
                    <td style={{ padding: '0.5rem' }}>{data.purchased.toLocaleString()} kg</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(data.cost)}</td>
                    <td style={{ padding: '0.5rem', color: '#6366f1' }}>{fmt(data.purchased > 0 ? Math.round(data.cost / data.purchased) : 0)}/kg</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {/* FCR Alert */}
        {avgFCR > 1.8 && (
          <div style={{ ...cs, background: '#fef2f2', borderColor: '#fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>High FCR Alert</div>
                <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>Average FCR is {avgFCR.toFixed(2)} — target below 1.5 for shrimp, 1.8 for tilapia. Check for overfeeding.</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowAddFeed(true)} disabled={ponds.length === 0} style={{ ...primaryBtn, opacity: ponds.length === 0 ? 0.5 : 1 }}>+ Log Feed</button>
        </div>

        <div style={cs}>
          <h3 style={ct}>🌾 Feed Log</h3>
          {feedLogs.length === 0
            ? emptyState('🌾', 'No feed logs yet', ponds.length === 0 ? 'Add a pond first' : 'Start logging daily feed usage')
            : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 600 }}>
                  <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {['Date', 'Pond', 'Feed Type', 'Qty (kg)', 'Cost', 'FCR'].map(h => (
                      <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{feedLogs.slice(0, 20).map(f => (
                    <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{f.date}</td>
                      <td style={{ padding: '0.5rem' }}>{f.pondName}</td>
                      <td style={{ padding: '0.5rem' }}>{f.feedType}</td>
                      <td style={{ padding: '0.5rem' }}>{f.quantity}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(f.cost)}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600, color: f.fcr && f.fcr <= 1.5 ? '#22c55e' : f.fcr && f.fcr > 2 ? '#ef4444' : '#f59e0b' }}>{f.fcr?.toFixed(1) || '—'}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderWater = () => {
    const latestByPond: Record<number, AquaWaterLog> = {};
    waterLogs.forEach(w => { if (!latestByPond[w.pondId] || w.date > latestByPond[w.pondId].date) latestByPond[w.pondId] = w; });
    const latestLogs = Object.values(latestByPond);
    const goodCount = latestLogs.filter(w => w.status === 'Good').length;
    const issueCount = latestLogs.filter(w => w.status !== 'Good').length;

    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(3)}>
          <KPICard icon="🧪" label="Ponds Tested" value={String(latestLogs.length)} changeType="neutral" color="#6366f1" />
          <KPICard icon="✅" label="Good" value={String(goodCount)} changeType="up" color="#22c55e" />
          <KPICard icon="⚠️" label="Needs Attention" value={String(issueCount)} changeType={issueCount > 0 ? 'down' : 'neutral'} color="#f59e0b" />
        </div>

        {issueCount > 0 && (
          <div style={{ ...cs, background: '#fef2f2', borderColor: '#fecaca' }}>
            <h3 style={{ ...ct, color: '#dc2626' }}>⚠️ Water Quality Alerts</h3>
            {latestLogs.filter(w => w.status !== 'Good').map(w => (
              <div key={w.pondId} style={{ padding: '0.5rem 0', borderBottom: '1px solid #fee2e2', fontSize: '0.85rem' }}>
                <strong>{w.pondName}</strong>:
                {w.ammonia > 0.1 && <span style={{ color: '#ef4444' }}> Ammonia {w.ammonia}mg/L</span>}
                {(w.ph < 6.5 || w.ph > 8.5) && <span style={{ color: '#ef4444' }}> pH {w.ph}</span>}
                {w.dissolvedOxygen < 4 && <span style={{ color: '#ef4444' }}> DO₂ {w.dissolvedOxygen}mg/L</span>}
                <span style={{ color: '#94a3b8' }}> — {w.status}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={() => setShowAddWater(true)} disabled={ponds.length === 0} style={{ ...primaryBtn, opacity: ponds.length === 0 ? 0.5 : 1 }}>+ Log Water Reading</button>

        <div style={cs}>
          <h3 style={ct}>🧪 Water Quality Log</h3>
          {waterLogs.length === 0
            ? emptyState('🧪', 'No water quality logs', ponds.length === 0 ? 'Add a pond first' : 'Start recording water parameters')
            : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 700 }}>
                  <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {['Date', 'Pond', 'pH', 'DO₂', 'Temp °C', 'Ammonia', 'Salinity', 'Status'].map(h => (
                      <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{waterLogs.slice(0, 20).map(w => (
                    <tr key={w.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{w.date}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{w.pondName}</td>
                      <td style={{ padding: '0.5rem' }}>{w.ph}</td>
                      <td style={{ padding: '0.5rem' }}>{w.dissolvedOxygen} mg/L</td>
                      <td style={{ padding: '0.5rem' }}>{w.temperature}°C</td>
                      <td style={{ padding: '0.5rem', color: w.ammonia > 0.1 ? '#ef4444' : undefined, fontWeight: w.ammonia > 0.1 ? 600 : undefined }}>{w.ammonia} mg/L</td>
                      <td style={{ padding: '0.5rem' }}>{w.salinity || '—'}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: w.status === 'Good' ? '#dcfce7' : w.status === 'Fair' ? '#fef3c7' : '#fee2e2', color: w.status === 'Good' ? '#22c55e' : w.status === 'Fair' ? '#f59e0b' : '#ef4444' }}>{w.status}</span>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    );
  };

  const renderHarvest = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="📦" label="Total Sales" value={fmt(totalRevenue)} changeType={totalRevenue > 0 ? 'up' : 'neutral'} color="#22c55e" />
        <KPICard icon="📊" label="Harvests" value={String(harvestSales.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="🐟" label="Species" value={String(Object.keys(revenueBySpecies).length)} changeType="neutral" color="#6366f1" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddHarvest(true)} style={primaryBtn}>+ Record Harvest Sale</button>
        <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>🧾 Export Invoice</button>
      </div>
      <div style={cs}>
        <h3 style={ct}>📦 Harvest & Sales</h3>
        {harvestSales.length === 0
          ? emptyState('📦', 'No harvest sales recorded', 'Record your first harvest')
          : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 700 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Date', 'Species', 'Pond', 'Qty (kg)', 'Price/kg', 'Total', 'Buyer', 'Grade'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{harvestSales.map(h => (
                  <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{h.date}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{h.species}</td>
                    <td style={{ padding: '0.5rem' }}>{h.pondName || '—'}</td>
                    <td style={{ padding: '0.5rem' }}>{h.quantity}</td>
                    <td style={{ padding: '0.5rem' }}>{h.currency === 'USD' ? '$' : 'Rs.'}{h.pricePerKg.toLocaleString()}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 700, color: '#22c55e' }}>{fmt(h.totalAmount)}</td>
                    <td style={{ padding: '0.5rem' }}>{h.buyer ? (
                      <span>{h.buyer} {h.buyer && <a href={generateWhatsAppLink(h.buyer, `Hi, regarding harvest delivery of ${h.quantity}kg ${h.species}`)} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>💬</a>}</span>
                    ) : '—'}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: h.grade === 'A' ? '#dcfce7' : h.grade === 'B' ? '#fef3c7' : '#fee2e2', color: h.grade === 'A' ? '#22c55e' : h.grade === 'B' ? '#f59e0b' : '#ef4444' }}>Grade {h.grade}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );

  const renderIncome = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="💰" label="Total Income" value={fmt(totalIncome)} changeType="up" color="#22c55e" />
        <KPICard icon="📦" label="Harvest Sales" value={fmt(totalRevenue)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="📈" label="Avg Sale" value={fmt(harvestSales.length ? Math.round(totalRevenue / harvestSales.length) : 0)} changeType="neutral" color="#6366f1" />
      </div>
      <button onClick={() => setShowInvoiceForm(true)} style={primaryBtn}>+ New Invoice</button>
      <TransactionList transactions={invoices} title="Income & Sales" showFilter={false} />
    </div>
  );

  const renderExpenses = () => {
    const expByCategory: Record<string, number> = {};
    aquaExpenses.forEach(e => { expByCategory[e.category] = (expByCategory[e.category] || 0) + e.amount; });
    const catEntries = Object.entries(expByCategory).sort((a, b) => b[1] - a[1]);

    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(3)}>
          {catEntries.length >= 1 && <KPICard icon="🌾" label={catEntries[0][0]} value={fmt(catEntries[0][1])} changeType="neutral" color="#6366f1" />}
          {catEntries.length >= 2 && <KPICard icon="👷" label={catEntries[1][0]} value={fmt(catEntries[1][1])} changeType="neutral" color="#3b82f6" />}
          {catEntries.length < 2 && <KPICard icon="💸" label="Total" value={fmt(totalAquaExpenses)} changeType="neutral" color="#ef4444" />}
          <KPICard icon="🌾" label="Feed Cost" value={fmt(totalFeedCost)} changeType="neutral" color="#f59e0b" />
        </div>
        <button onClick={() => setShowAddExpense(true)} style={primaryBtn}>+ Add Expense</button>
        <div style={cs}>
          <h3 style={ct}>💸 Farm Expenses</h3>
          {aquaExpenses.length === 0
            ? emptyState('💸', 'No expenses recorded', 'Track feed, labour, chemicals and more')
            : (
              <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 550 }}>
                  <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                    {['Date', 'Category', 'Description', 'Pond', 'Amount'].map(h => (
                      <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>{aquaExpenses.map(e => (
                    <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 500 }}>{e.date}</td>
                      <td style={{ padding: '0.5rem' }}>{e.category}</td>
                      <td style={{ padding: '0.5rem' }}>{e.description}</td>
                      <td style={{ padding: '0.5rem' }}>{e.pondName || '—'}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600, color: '#ef4444' }}>{fmt(e.amount)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
        </div>
        <TransactionList transactions={expenseTxns} title="All Tracked Expenses" showFilter={false} />
      </div>
    );
  };

  const renderReports = () => {
    const netProfit = totalRevenue - totalFeedCost - totalAquaExpenses;
    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(3)}>
          <KPICard icon="💰" label="Revenue" value={fmt(totalRevenue)} changeType="up" color="#22c55e" />
          <KPICard icon="💸" label="Total Cost" value={fmt(totalFeedCost + totalAquaExpenses)} changeType="neutral" color="#ef4444" />
          <KPICard icon="📊" label="Net Profit" value={fmt(netProfit)} changeType={netProfit >= 0 ? 'up' : 'down'} color={netProfit >= 0 ? '#22c55e' : '#ef4444'} />
        </div>
        <div style={cs}>
          <h3 style={ct}>📋 Available Reports</h3>
          <div style={gridColumns(3)}>
            {[
              { n: '📊 Farm P&L', d: 'Revenue vs all costs' },
              { n: '🐟 Pond-by-Pond P&L', d: 'Profit per pond/tank' },
              { n: '🌾 Feed Usage & FCR', d: 'Consumption & efficiency' },
              { n: '🧪 Water Quality', d: 'Trends & alerts' },
              { n: '📦 Harvest Summary', d: 'Species & grade analysis' },
              { n: '💰 Export Revenue', d: 'USD/LKR breakdown' },
              { n: '🦐 Species Performance', d: 'Revenue by species' },
              { n: '🧾 Tax (APIT)', d: 'Estimated IRD returns' },
              { n: '📋 NAQDA Report', d: 'License & compliance' },
              { n: '🏦 BOC Loan PDF', d: 'Farm health statement' },
              { n: '📈 Growth Analysis', d: 'Cycle trend analysis' },
              { n: '🔍 Cost/kg Analysis', d: 'Production cost breakdown' },
            ].map(r => (
              <div key={r.n} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{r.n}</div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.d}</div>
              </div>
            ))}
          </div>
        </div>
        {ponds.length > 0 && (
          <div style={cs}>
            <h3 style={ct}>🐟 Pond-by-Pond Summary</h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Pond', 'Feed Cost', 'Sales', 'Expenses', 'Net', 'Cost/kg'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{ponds.map(p => {
                  const pFeed = feedLogs.filter(f => f.pondId === p.id).reduce((s, f) => s + f.cost, 0);
                  const pSales = harvestSales.filter(h => h.pondId === p.id).reduce((s, h) => s + h.totalAmount, 0);
                  const pExp = aquaExpenses.filter(e => e.pondId === p.id).reduce((s, e) => s + e.amount, 0);
                  const pHarvestKg = harvestSales.filter(h => h.pondId === p.id).reduce((s, h) => s + h.quantity, 0);
                  const pNet = pSales - pFeed - pExp;
                  const costPerKg = pHarvestKg > 0 ? (pFeed + pExp) / pHarvestKg : 0;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{p.name}</td>
                      <td style={{ padding: '0.5rem' }}>{fmt(pFeed)}</td>
                      <td style={{ padding: '0.5rem', color: '#22c55e' }}>{fmt(pSales)}</td>
                      <td style={{ padding: '0.5rem', color: '#ef4444' }}>{fmt(pExp)}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 700, color: pNet >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(pNet)}</td>
                      <td style={{ padding: '0.5rem', color: '#6366f1', fontWeight: 600 }}>{costPerKg > 0 ? `${fmt(Math.round(costPerKg))}/kg` : '—'}</td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // AI Tools
  const AI_TOOLS = [
    { id: 'water_quality', name: 'Water Quality Analyst', icon: '🧪', desc: 'Analyze pH, ammonia, DO₂ — get treatment advice', cost: 3, placeholder: 'Describe the water parameters or paste your test results...' },
    { id: 'feed_optimization', name: 'Feed Optimizer', icon: '🌾', desc: 'FCR analysis & cost reduction', cost: 2, placeholder: 'Describe your feeding schedule, quantities, and FCR data...' },
    { id: 'receipt_scanner', name: 'Muddy Bill Scanner', icon: '🧾', desc: 'Extract data from Sinhala/Tamil receipts', cost: 5, placeholder: 'Describe the receipt: vendor, items, amounts, language...' },
    { id: 'harvest_grading', name: 'Harvest Grading', icon: '📦', desc: 'Export grading for sea cucumber & shrimp', cost: 2, placeholder: 'Describe species, weights, quantities for grading...' },
    { id: 'naqda_report', name: 'NAQDA / Bank Report', icon: '📋', desc: 'Generate farm financial health PDF', cost: 5, placeholder: 'Describe your farm operations for the last 6 months...' },
    { id: 'disease_diagnosis', name: 'Disease Diagnosis', icon: '🦠', desc: 'Identify diseases from symptoms', cost: 3, placeholder: 'Describe the symptoms you are observing...' },
  ];

  const renderAI = () => (
    <div style={stackGap(20)}>
      <div style={cs}>
        <h3 style={ct}>🤖 AI Aquaculture Assistant</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: `rgba(12,74,110,0.05)`, borderRadius: 10, marginBottom: '1rem' }}>
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
              border: aiToolActive === tool.id ? `2px solid ${OCEAN}` : '1px solid #e2e8f0',
              background: aiToolActive === tool.id ? 'rgba(12,74,110,0.05)' : '#f8fafc',
            }} onClick={() => { setAiToolActive(tool.id); setAiResult(null); setAiPrompt(''); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{tool.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{tool.desc}</div>
              <div style={{ fontSize: '0.7rem', color: OCEAN, fontWeight: 600 }}>🪙 {tool.cost} tokens</div>
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
      <div style={{ ...cs, background: `linear-gradient(135deg, ${OCEAN}, #0369a1)`, color: 'white' }}>
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
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🪙</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{pkg.tokens} Tokens</div>
              <div style={{ fontSize: '0.85rem', color: OCEAN, fontWeight: 600 }}>Rs. {pkg.price_lkr.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Settings
  const SETTINGS_FIELDS: { key: keyof typeof aquaSettings; label: string; icon: string; placeholder: string }[] = [
    { key: 'farmName', label: 'Farm Name', icon: '🐟', placeholder: 'e.g. Puttalam Aqua Farm' },
    { key: 'naqdaReg', label: 'NAQDA Registration', icon: '📋', placeholder: 'e.g. NAQDA/2024/AQ/456' },
    { key: 'location', label: 'Farm Location', icon: '📍', placeholder: 'e.g. Kalpitiya, Puttalam District' },
    { key: 'exportLicence', label: 'Export Licence', icon: '🌍', placeholder: 'e.g. EXP/2024/SC/789' },
    { key: 'species', label: 'Primary Species', icon: '🦐', placeholder: 'e.g. Vannamei Shrimp, Sea Cucumber' },
    { key: 'vatReg', label: 'VAT Registration', icon: '🧾', placeholder: 'e.g. VAT-LK-005678' },
    { key: 'irdTin', label: 'IRD TIN', icon: '🔑', placeholder: 'e.g. 567890123' },
    { key: 'financialYear', label: 'Financial Year', icon: '📅', placeholder: 'April 2025 – March 2026' },
    { key: 'bankAccount', label: 'Bank (BOC/Samurdhi)', icon: '🏦', placeholder: 'e.g. BOC Puttalam — Acc 123456' },
    { key: 'piInsurance', label: 'Crop Insurance', icon: '⚠️', placeholder: 'e.g. SLIC Aqua Policy — Active' },
  ];

  const renderSettings = () => (
    <div style={stackGap(20)}>
      <div style={cs}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ ...ct, margin: 0 }}>⚙️ Farm Settings</h3>
          {!editingSettings ? (
            <button onClick={() => setEditingSettings(true)} style={{ ...actionBtn(OCEAN), padding: '4px 14px', fontSize: '0.8rem' }}>✏️ Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={{ ...primaryBtn, padding: '4px 14px', fontSize: '0.8rem', opacity: settingsSaving ? 0.6 : 1 }}>
                {settingsSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button onClick={() => setEditingSettings(false)} style={{ ...secondaryBtn, padding: '4px 14px', fontSize: '0.8rem' }}>Cancel</button>
            </div>
          )}
        </div>
        <div style={stackGap(12)}>
          {SETTINGS_FIELDS.map(s => (
            <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: isCompactMobile ? '100%' : 200 }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{s.label}</span>
              </div>
              {editingSettings ? (
                <input value={aquaSettings[s.key] || ''} onChange={e => setAquaSettings(p => ({ ...p, [s.key]: e.target.value }))} placeholder={s.placeholder}
                  style={{ ...inputStyle, flex: 1, minWidth: isCompactMobile ? '100%' : 200 }} />
              ) : (
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !aquaSettings[s.key] ? '#dc2626' : '#334155' }}>
                  {aquaSettings[s.key] || 'Not set'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={cs}>
        <h3 style={ct}>🪙 Wallet & Billing</h3>
        <div style={stackGap(12)}>
          {[
            { label: 'Token Balance', value: `${walletData.tokenBalance} tokens`, icon: '🪙' },
            { label: 'Total Spent', value: `LKR ${walletData.totalSpentLKR.toLocaleString()}`, icon: '💰' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      {isCompactMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
          <button onClick={onLogout} style={actionBtn(OCEAN)}>🚪 Sign Out</button>
          <button onClick={onChangeProfession} style={actionBtn('#475569')}>🌐 Professions</button>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  MODALS
  // ═══════════════════════════════════════════════════

  const renderModals = () => (<>
    {/* Add Pond Modal */}
    {showAddPond && <div style={modalOverlay} onClick={() => setShowAddPond(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: OCEAN }}>🐟 Add Pond / Tank</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Pond Name *</label><input style={inputStyle} value={newPond.name} onChange={e => setNewPond(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Pond 1, Tank A" /></div>
          <div><label style={labelStyle}>Species *</label><input style={inputStyle} value={newPond.species} onChange={e => setNewPond(p => ({ ...p, species: e.target.value }))} placeholder="e.g. Vannamei Shrimp, Sea Cucumber" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Area</label><input style={inputStyle} value={newPond.area} onChange={e => setNewPond(p => ({ ...p, area: e.target.value }))} placeholder="e.g. 0.5 acres" /></div>
            <div><label style={labelStyle}>Stock Count</label><input type="number" style={inputStyle} value={newPond.stockCount} onChange={e => setNewPond(p => ({ ...p, stockCount: e.target.value }))} placeholder="e.g. 50000" /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Stage</label>
              <select style={selectStyle} value={newPond.stage} onChange={e => setNewPond(p => ({ ...p, stage: e.target.value as AquaPond['stage'] }))}>
                {['fingerling', 'growing', 'pre-harvest', 'harvested', 'idle'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Est. Harvest</label><input type="date" style={inputStyle} value={newPond.estHarvest} onChange={e => setNewPond(p => ({ ...p, estHarvest: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddPond(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddPond}>Add Pond</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Feed Modal */}
    {showAddFeed && <div style={modalOverlay} onClick={() => setShowAddFeed(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: OCEAN }}>🌾 Log Feed</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newFeed.date} onChange={e => setNewFeed(f => ({ ...f, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Pond *</label>
              <select style={selectStyle} value={newFeed.pondId} onChange={e => setNewFeed(f => ({ ...f, pondId: e.target.value }))}>
                <option value="">Select pond</option>
                {ponds.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Feed Type *</label><input style={inputStyle} value={newFeed.feedType} onChange={e => setNewFeed(f => ({ ...f, feedType: e.target.value }))} placeholder="e.g. Prima Aqua Grow, CIC Shrimp Feed" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Qty (kg)</label><input type="number" style={inputStyle} value={newFeed.quantity} onChange={e => setNewFeed(f => ({ ...f, quantity: e.target.value }))} /></div>
            <div><label style={labelStyle}>Cost (LKR)</label><input type="number" style={inputStyle} value={newFeed.cost} onChange={e => setNewFeed(f => ({ ...f, cost: e.target.value }))} /></div>
            <div><label style={labelStyle}>FCR</label><input type="number" step="0.1" style={inputStyle} value={newFeed.fcr} onChange={e => setNewFeed(f => ({ ...f, fcr: e.target.value }))} placeholder="Optional" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddFeed(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddFeed}>Log Feed</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Water Quality Modal */}
    {showAddWater && <div style={modalOverlay} onClick={() => setShowAddWater(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: OCEAN }}>🧪 Log Water Quality</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newWater.date} onChange={e => setNewWater(w => ({ ...w, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Pond *</label>
              <select style={selectStyle} value={newWater.pondId} onChange={e => setNewWater(w => ({ ...w, pondId: e.target.value }))}>
                <option value="">Select pond</option>
                {ponds.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>pH</label><input type="number" step="0.1" style={inputStyle} value={newWater.ph} onChange={e => setNewWater(w => ({ ...w, ph: e.target.value }))} /></div>
            <div><label style={labelStyle}>DO₂ (mg/L)</label><input type="number" step="0.1" style={inputStyle} value={newWater.dissolvedOxygen} onChange={e => setNewWater(w => ({ ...w, dissolvedOxygen: e.target.value }))} /></div>
            <div><label style={labelStyle}>Temp (°C)</label><input type="number" style={inputStyle} value={newWater.temperature} onChange={e => setNewWater(w => ({ ...w, temperature: e.target.value }))} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Ammonia (mg/L)</label><input type="number" step="0.01" style={inputStyle} value={newWater.ammonia} onChange={e => setNewWater(w => ({ ...w, ammonia: e.target.value }))} /></div>
            <div><label style={labelStyle}>Salinity (ppt)</label><input style={inputStyle} value={newWater.salinity} onChange={e => setNewWater(w => ({ ...w, salinity: e.target.value }))} placeholder="e.g. 18 ppt" /></div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddWater(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddWater}>Log Reading</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Harvest Modal */}
    {showAddHarvest && <div style={modalOverlay} onClick={() => setShowAddHarvest(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: OCEAN }}>📦 Record Harvest Sale</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newHarvest.date} onChange={e => setNewHarvest(h => ({ ...h, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Pond</label>
              <select style={selectStyle} value={newHarvest.pondId} onChange={e => setNewHarvest(h => ({ ...h, pondId: e.target.value }))}>
                <option value="">— Select —</option>
                {ponds.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Species *</label><input style={inputStyle} value={newHarvest.species} onChange={e => setNewHarvest(h => ({ ...h, species: e.target.value }))} placeholder="e.g. Vannamei Shrimp" /></div>
            <div><label style={labelStyle}>Grade</label>
              <select style={selectStyle} value={newHarvest.grade} onChange={e => setNewHarvest(h => ({ ...h, grade: e.target.value as 'A' | 'B' | 'C' }))}>
                <option value="A">Grade A (Large)</option><option value="B">Grade B (Medium)</option><option value="C">Grade C (Small)</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Quantity (kg) *</label><input type="number" style={inputStyle} value={newHarvest.quantity} onChange={e => setNewHarvest(h => ({ ...h, quantity: e.target.value }))} /></div>
            <div><label style={labelStyle}>Price/kg</label><input type="number" style={inputStyle} value={newHarvest.pricePerKg} onChange={e => setNewHarvest(h => ({ ...h, pricePerKg: e.target.value }))} /></div>
            <div><label style={labelStyle}>Currency</label>
              <select style={selectStyle} value={newHarvest.currency} onChange={e => setNewHarvest(h => ({ ...h, currency: e.target.value as 'LKR' | 'USD' }))}>
                <option value="LKR">LKR</option><option value="USD">USD</option>
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Buyer</label><input style={inputStyle} value={newHarvest.buyer} onChange={e => setNewHarvest(h => ({ ...h, buyer: e.target.value }))} placeholder="e.g. Colombo Export Agent" /></div>
          {(parseFloat(newHarvest.quantity) > 0 && parseFloat(newHarvest.pricePerKg) > 0) && (
            <div style={{ padding: '0.75rem', background: '#f0fdf4', borderRadius: 8, textAlign: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Total: </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#22c55e' }}>
                {newHarvest.currency === 'USD' ? '$' : 'Rs.'}{(parseFloat(newHarvest.quantity) * parseFloat(newHarvest.pricePerKg)).toLocaleString()}
              </span>
              {newHarvest.currency === 'USD' && (
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}> ≈ {fmt(parseFloat(newHarvest.quantity) * parseFloat(newHarvest.pricePerKg) * 300)}</span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8, justifyContent: 'flex-end' }}>
            <button style={secondaryBtn} onClick={() => setShowAddHarvest(false)}>Cancel</button>
            <button style={primaryBtn} onClick={handleAddHarvest}>Record Sale</button>
          </div>
        </div>
      </div>
    </div>}

    {/* Add Expense Modal */}
    {showAddExpense && <div style={modalOverlay} onClick={() => setShowAddExpense(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ ...ct, color: OCEAN }}>💸 Add Expense</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Date</label><input type="date" style={inputStyle} value={newExpense.date} onChange={e => setNewExpense(x => ({ ...x, date: e.target.value }))} /></div>
            <div><label style={labelStyle}>Category</label>
              <select style={selectStyle} value={newExpense.category} onChange={e => setNewExpense(x => ({ ...x, category: e.target.value as AquaExpense['category'] }))}>
                {['Feed', 'Stock', 'Labour', 'Utilities', 'Chemicals', 'Licences', 'Equipment', 'Transport', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div><label style={labelStyle}>Description *</label><input style={inputStyle} value={newExpense.description} onChange={e => setNewExpense(x => ({ ...x, description: e.target.value }))} placeholder="e.g. Diesel for aerator, Fish PL — 50,000 pcs" /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={labelStyle}>Amount (LKR) *</label><input type="number" style={inputStyle} value={newExpense.amount} onChange={e => setNewExpense(x => ({ ...x, amount: e.target.value }))} /></div>
            <div><label style={labelStyle}>Pond</label>
              <select style={selectStyle} value={newExpense.pondId} onChange={e => setNewExpense(x => ({ ...x, pondId: e.target.value }))}>
                <option value="">— General —</option>
                {ponds.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
              </select>
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
      case 'ponds': return renderPonds();
      case 'feed': return renderFeed();
      case 'water': return renderWater();
      case 'harvest': return renderHarvest();
      case 'income': return renderIncome();
      case 'expenses': return renderExpenses();
      case 'tax': return <TaxSpeedometer annualPrivateIncome={totalIncome} annualGovIncome={0} annualExpenses={totalExpensesAmt} whtDeducted={0} />;
      case 'receipts': return <ReceiptScanner />;
      case 'reports': return renderReports();
      case 'export': return <AuditorExport invoices={invoices} expenses={expenseTxns} />;
      case 'ai': return renderAI();
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
              background: activeNav === item.id ? OCEAN : '#f1f5f9',
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
        profession="aquaculture" professionLabel="AquaTracksy" professionIcon="🐟"
        userName={userName} navItems={navItems} activeNav={activeNav}
        onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}
        tokenBalance={walletData.tokenBalance} onWalletClick={() => setActiveNav('wallet')}
        mobileShell={{
          enabled: true, tabs: AQUA_MOBILE_TABS, activeTab: activeMobileTab,
          onTabChange: handleMobileTabChange, activeTitle: activeNavItem.label,
          activeSubtitle: `${currentDateLabel} • ${userName}`,
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
const OCEAN_C = '#0c4a6e';
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
  padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, background: OCEAN_C,
  color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn: React.CSSProperties = {
  padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white',
  color: '#475569', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
};

export default AquacultureDashboard;
