import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouteNav } from '../../hooks/useRouteNav';
import db from '../../lib/db';
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
import { GOLDEN_LIST } from '../../config/goldenListCategories';
import { useAuth } from '../../context/AuthContext';
import { useTokenWallet, TOKEN_PACKAGES, TokenPackage } from '../../hooks/useTokenWallet';
import { addTransaction, subscribeTransactions, seedChartOfAccounts, toCents, fromCents } from '../../services/accountingCoreService';
import { useIsCompactMobile } from './useIsCompactMobile';
import { generateWhatsAppLink } from '../../services/whatsappService';
import { startEngineeringAutoSync, stopEngineeringAutoSync } from '../../services/engineeringSyncService';
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
  { id: 'projects', label: 'Projects', icon: '🏗️' },
  { id: 'boq', label: 'BOQ Manager', icon: '📦' },
  { id: 'inspections', label: 'Site Inspections', icon: '🔍' },
  { id: 'baas', label: 'Baas Ledger', icon: '👷' },
  { id: 'retention', label: 'Retention Vault', icon: '🔒' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'tax', label: 'Tax', icon: '🧮' },
  { id: 'receipts', label: 'Receipts', icon: '🧾' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'export', label: 'Auditor Export', icon: '📦' },
  { id: 'ai', label: 'AI Tools', icon: '🤖' },
  { id: 'voicevault', label: 'Voice Vault', icon: '🎙️', premium: true },
  { id: 'scheduler', label: 'Smart Scheduler', icon: '📅', premium: true },
  { id: 'lifeadmin', label: 'Life Admin', icon: '📋', premium: true },
  { id: 'wallet', label: 'Token Wallet', icon: '🪙' },
  { id: 'subscription', label: 'Subscription', icon: '⭐' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ============ Mobile Tab System ============ */
type EngMobileTabId = 'home' | 'site' | 'money' | 'tools' | 'more';
const ENG_MOBILE_TABS: { id: EngMobileTabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'site', label: 'Site', icon: '🏗️' },
  { id: 'money', label: 'Money', icon: '💳' },
  { id: 'tools', label: 'Tools', icon: '🔧' },
  { id: 'more', label: 'More', icon: '☰' },
];
const ENG_MOBILE_GROUPS: Record<EngMobileTabId, string[]> = {
  home: ['overview', 'inbox', 'briefing'],
  site: ['projects', 'boq', 'inspections', 'baas', 'retention'],
  money: ['income', 'expenses', 'tax', 'reports', 'export', 'wallet'],
  tools: ['ai', 'voicevault', 'scheduler', 'receipts'],
  more: ['lifeadmin', 'subscription', 'settings'],
};
const ENG_MOBILE_DEFAULT_NAV: Record<EngMobileTabId, string> = {
  home: 'overview', site: 'projects', money: 'income', tools: 'ai', more: 'settings',
};
function getEngMobileTab(activeNav: string): EngMobileTabId {
  const match = ENG_MOBILE_TABS.find(tab => ENG_MOBILE_GROUPS[tab.id].includes(activeNav));
  return match?.id || 'home';
}

/* ============ Constants ============ */
const ORANGE = '#f97316';
const NAVY = '#1a365d';
const formatLKR = (n: number) => `Rs. ${n.toLocaleString()}`;
const engExpenseCategories = [
  'Site Materials', 'Equipment Hire', 'Labour / Sub-Con', 'Software / CAD',
  'Transport', 'Office / Admin', 'Insurance', 'Licences & Permits', 'Other',
];

/* ================================================================
   COMPONENT
   ================================================================ */
const EngineeringDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const walletData = useTokenWallet(uid || '');
  const isCompactMobile = useIsCompactMobile();

  const validNavIds = useMemo(() => navItems.map(n => n.id), []);
  const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);

  // Modal states
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showBOQModal, setShowBOQModal] = useState(false);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [showBaasModal, setShowBaasModal] = useState(false);
  const [showRetentionModal, setShowRetentionModal] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showGoldenList, setShowGoldenList] = useState(false);

  // AI state
  const [aiToolActive, setAiToolActive] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Settings state
  const [engSettings, setEngSettings] = useState({
    firmName: '', ieslReg: '', ictadGrade: '', cidaReg: '', specialization: '',
    vatReg: '', irdTin: '', financialYear: '2025/2026 (April – March)',
    retentionPolicy: '10% for 12 months', piInsurance: '',
  });
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Form states
  const [newProject, setNewProject] = useState({ name: '', client: '', value: '', stage: 'design' as const, ictadGrade: 'C1', retentionPct: '10', startDate: '', notes: '' });
  const [newBOQ, setNewBOQ] = useState({ projectId: '', item: '', unit: 'nos', qty: '', estimatedRate: '', actualRate: '', category: '', notes: '' });
  const [newInspection, setNewInspection] = useState({ projectId: '', date: new Date().toISOString().split('T')[0], inspector: '', type: 'structural' as const, findings: '', status: 'passed' as const });
  const [newBaas, setNewBaas] = useState({ projectId: '', baasName: '', baasPhone: '', type: 'advance' as const, amount: '', description: '', date: new Date().toISOString().split('T')[0], workDescription: '' });
  const [newRetention, setNewRetention] = useState({ projectId: '', retentionPct: '10', retentionAmount: '', releaseDate: '', whtRate: '2', notes: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0] });

  // Dexie live queries
  const projects = useLiveQuery(() => uid ? db.engineering_projects.where('userId').equals(uid).toArray() : [], [uid]) || [];
  const boqItems = useLiveQuery(() => uid ? db.boq_items.where('userId').equals(uid).toArray() : [], [uid]) || [];
  const inspections = useLiveQuery(() => uid ? db.site_inspections.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const baasEntries = useLiveQuery(() => uid ? db.baas_ledger.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const retentionRecords = useLiveQuery(() => uid ? db.retention_records.where('userId').equals(uid).toArray() : [], [uid]) || [];

  // Computed values
  const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
  const totalExpensesAmt = expenses.reduce((s, t) => s + t.amount, 0);
  const activeProjects = projects.filter(p => p.stage !== 'completed');
  const totalPipeline = projects.reduce((s, p) => s + p.value, 0);
  const boqTotal = boqItems.reduce((s, b) => s + b.qty * b.estimatedRate, 0);
  const totalRetentionHeld = retentionRecords.filter(r => r.status === 'held').reduce((s, r) => s + r.retentionAmount, 0);
  const baasOutstanding = baasEntries.reduce((s, b) => b.type === 'advance' ? s + b.amount : s - b.amount, 0);

  const activeNavItem = useMemo(() => navItems.find(n => n.id === activeNav) || navItems[0], [activeNav]);
  const activeMobileTab = useMemo(() => getEngMobileTab(activeNav), [activeNav]);
  const activeMobileSections = useMemo(() => {
    const group = ENG_MOBILE_GROUPS[activeMobileTab] || [];
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
    const stopSync = startEngineeringAutoSync(uid);

    // Load settings
    getDoc(doc(firestoreDb, 'users', uid, 'engineering_settings', 'practice')).then(snap => {
      if (snap.exists()) setEngSettings(prev => ({ ...prev, ...snap.data() }));
    });

    return () => { stopSync(); stopEngineeringAutoSync(); };
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubIncome = subscribeTransactions(uid, 'income', (txns: Transaction[]) => setInvoices(txns));
    const unsubExpenses = subscribeTransactions(uid, 'expense', (txns: Transaction[]) => setExpenses(txns));
    return () => { unsubIncome(); unsubExpenses(); };
  }, [uid]);

  /* ============ Handlers ============ */
  const handleAddProject = async () => {
    if (!uid || !newProject.name || !newProject.client) return;
    await db.engineering_projects.add({
      name: newProject.name, client: newProject.client,
      value: toCents(parseFloat(newProject.value) || 0),
      stage: newProject.stage, pct: 0, ictadGrade: newProject.ictadGrade,
      retentionPct: parseFloat(newProject.retentionPct) || 10,
      startDate: newProject.startDate, notes: newProject.notes,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewProject({ name: '', client: '', value: '', stage: 'design', ictadGrade: 'C1', retentionPct: '10', startDate: '', notes: '' });
    setShowProjectModal(false);
  };

  const handleAddBOQ = async () => {
    if (!uid || !newBOQ.item || !newBOQ.qty) return;
    const projId = parseInt(newBOQ.projectId) || 0;
    const proj = projects.find(p => p.id === projId);
    await db.boq_items.add({
      projectId: projId, projectName: proj?.name || '',
      item: newBOQ.item, unit: newBOQ.unit,
      qty: parseFloat(newBOQ.qty) || 0,
      estimatedRate: parseFloat(newBOQ.estimatedRate) || 0,
      actualRate: newBOQ.actualRate ? parseFloat(newBOQ.actualRate) : undefined,
      status: 'pending', category: newBOQ.category, notes: newBOQ.notes,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewBOQ({ projectId: '', item: '', unit: 'nos', qty: '', estimatedRate: '', actualRate: '', category: '', notes: '' });
    setShowBOQModal(false);
  };

  const handleAddInspection = async () => {
    if (!uid || !newInspection.findings) return;
    const projId = parseInt(newInspection.projectId) || 0;
    const proj = projects.find(p => p.id === projId);
    await db.site_inspections.add({
      projectId: projId, projectName: proj?.name || '',
      date: newInspection.date, inspector: newInspection.inspector,
      type: newInspection.type, findings: newInspection.findings,
      status: newInspection.status,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewInspection({ projectId: '', date: new Date().toISOString().split('T')[0], inspector: '', type: 'structural', findings: '', status: 'passed' });
    setShowInspectionModal(false);
  };

  const handleAddBaas = async () => {
    if (!uid || !newBaas.baasName || !newBaas.amount) return;
    const projId = parseInt(newBaas.projectId) || 0;
    const proj = projects.find(p => p.id === projId);
    await db.baas_ledger.add({
      projectId: projId, projectName: proj?.name || '',
      baasName: newBaas.baasName, baasPhone: newBaas.baasPhone,
      type: newBaas.type, amount: toCents(parseFloat(newBaas.amount) || 0),
      description: newBaas.description, date: newBaas.date,
      workDescription: newBaas.workDescription,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewBaas({ projectId: '', baasName: '', baasPhone: '', type: 'advance', amount: '', description: '', date: new Date().toISOString().split('T')[0], workDescription: '' });
    setShowBaasModal(false);
  };

  const handleAddRetention = async () => {
    if (!uid || !newRetention.retentionAmount || !newRetention.projectId) return;
    const projId = parseInt(newRetention.projectId) || 0;
    const proj = projects.find(p => p.id === projId);
    const retAmt = toCents(parseFloat(newRetention.retentionAmount) || 0);
    const whtRate = parseFloat(newRetention.whtRate) || 2;
    const whtAmt = Math.round(retAmt * whtRate / 100);
    await db.retention_records.add({
      projectId: projId, projectName: proj?.name || '',
      client: proj?.client || '', retentionPct: parseFloat(newRetention.retentionPct) || 10,
      retentionAmount: retAmt, releaseDate: newRetention.releaseDate,
      whtRate, whtAmount: whtAmt, netRelease: retAmt - whtAmt,
      status: 'held', notes: newRetention.notes,
      sync_status: 'pending', userId: uid, createdAt: Date.now(),
    });
    setNewRetention({ projectId: '', retentionPct: '10', retentionAmount: '', releaseDate: '', whtRate: '2', notes: '' });
    setShowRetentionModal(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !expenseForm.amount) return;
    await addTransaction(uid, {
      date: expenseForm.date, amount: parseFloat(expenseForm.amount),
      category: expenseForm.category || 'Site Materials', type: 'expense',
      description: expenseForm.description, paymentMethod: 'cash',
    });
    setExpenseForm({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0] });
    setShowAddExpense(false);
  };

  const handleCreateInvoice = async (inv: InvoiceData) => {
    if (!uid) return;
    await addTransaction(uid, {
      date: inv.date, amount: inv.amount, category: inv.category || 'Progress Claim',
      type: 'income', description: inv.description, paymentMethod: 'bank',
    });
    setShowInvoiceForm(false);
  };

  const handleAIQuery = useCallback(async (tool: string, prompt: string) => {
    if (!uid || !prompt.trim()) return;
    setAiLoading(true);
    try {
      const functions = getFunctions(undefined, 'asia-south1');
      const fn = httpsCallable(functions, 'processEngineeringAI');
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
      await setDoc(doc(firestoreDb, 'users', uid, 'engineering_settings', 'practice'), engSettings, { merge: true });
      setEditingSettings(false);
    } catch (err) { console.error('Settings save failed', err); }
    finally { setSettingsSaving(false); }
  };

  const handleVoiceAction = (action: ParsedVoiceAction) => {
    if (action.type === 'expense' && uid) {
      addTransaction(uid, { date: new Date().toISOString().split('T')[0], amount: action.amount || 0, category: action.category || 'Site Materials', type: 'expense', description: action.description || 'Voice expense' });
    }
  };

  const handleMobileTabChange = (tabId: string) => {
    const defaultNav = ENG_MOBILE_DEFAULT_NAV[tabId as EngMobileTabId];
    if (defaultNav) setActiveNav(defaultNav);
  };

  // ═══════════════════════════════════════════════════
  //  RENDER SECTIONS
  // ═══════════════════════════════════════════════════

  const renderOverview = () => (
    <div style={stackGap(20)}>
      <div style={{ background: `linear-gradient(135deg, ${ORANGE}, #ea580c)`, borderRadius: 16, padding: isCompactMobile ? '1.1rem' : '2rem', color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: 4 }}>Welcome back, {userName}</div>
            <div style={{ fontSize: isCompactMobile ? '2rem' : '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              {formatLKR(fromCents(totalIncome - totalExpensesAmt))}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, marginTop: 6 }}>Net Profit · {activeProjects.length} Active Projects</div>
          </div>
          <div style={{ textAlign: isCompactMobile ? 'left' : 'right' }}>
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Pipeline Value</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{formatLKR(fromCents(totalPipeline))}</div>
          </div>
        </div>
      </div>
      <div style={gridColumns(4)}>
        <KPICard icon="🏗️" label="Active Projects" value={String(activeProjects.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="💰" label="Income" value={formatLKR(totalIncome)} changeType="up" color="#22c55e" />
        <KPICard icon="💸" label="Expenses" value={formatLKR(totalExpensesAmt)} changeType="neutral" color="#ef4444" />
        <KPICard icon="🔒" label="Retention Held" value={formatLKR(fromCents(totalRetentionHeld))} changeType="neutral" color="#f59e0b" />
      </div>
      <div style={gridColumns(2)}>
        <div style={cardStyle}>
          <h3 style={cardTitle}>🏗️ Project Progress</h3>
          {projects.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>🏗️</div>
              <p style={{ fontSize: '0.9rem' }}>No projects yet. Add your first project.</p>
              <button onClick={() => setShowProjectModal(true)} style={primaryBtn}>+ Add Project</button>
            </div>
          ) : projects.slice(0, 5).map(p => (
            <div key={p.id} style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{p.name}</span>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: p.pct === 100 ? '#22c55e' : ORANGE }}>{p.pct}%</span>
              </div>
              <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                <div style={{ height: '100%', width: `${p.pct}%`, background: p.pct === 100 ? '#22c55e' : `linear-gradient(90deg, ${ORANGE}, #ea580c)`, borderRadius: 4 }} />
              </div>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{p.client} · {formatLKR(fromCents(p.value))} · ICTAD: {p.ictadGrade}</div>
            </div>
          ))}
        </div>
        <div style={cardStyle}>
          <h3 style={cardTitle}>👷 Baas Outstanding</h3>
          {baasEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '2rem', marginBottom: 8 }}>👷</div>
              <p style={{ fontSize: '0.9rem' }}>No subcontractor entries yet.</p>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: baasOutstanding > 0 ? '#ef4444' : '#22c55e', marginBottom: 12 }}>
                {formatLKR(fromCents(Math.abs(baasOutstanding)))} {baasOutstanding > 0 ? 'outstanding' : 'settled'}
              </div>
              {baasEntries.slice(0, 4).map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.82rem' }}>
                  <span>{b.baasName} — {b.description}</span>
                  <span style={{ fontWeight: 600, color: b.type === 'advance' ? '#ef4444' : '#22c55e' }}>
                    {b.type === 'advance' ? '-' : '+'}{formatLKR(fromCents(b.amount))}
                  </span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
      <TransactionList transactions={[...invoices, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>
  );

  const renderProjects = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="🏗️" label="Active" value={String(activeProjects.length)} changeType="neutral" color="#3b82f6" />
        <KPICard icon="✅" label="Completed" value={String(projects.filter(p => p.stage === 'completed').length)} changeType="up" color="#22c55e" />
        <KPICard icon="💰" label="Pipeline" value={formatLKR(fromCents(totalPipeline))} changeType="neutral" color="#6366f1" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowProjectModal(true)} style={primaryBtn}>+ New Project</button>
      </div>
      <div style={cardStyle}>
        <h3 style={cardTitle}>📋 All Projects</h3>
        {projects.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No projects yet.</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: 640 }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Project', 'Client', 'ICTAD', 'Value', 'Stage', 'Progress'].map(h => (
                  <th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{projects.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td>
                  <td style={{ padding: '0.6rem' }}>{p.client}</td>
                  <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#fff7ed', color: ORANGE, fontSize: '0.72rem', fontWeight: 600 }}>{p.ictadGrade}</span></td>
                  <td style={{ padding: '0.6rem', fontWeight: 600 }}>{formatLKR(fromCents(p.value))}</td>
                  <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', fontSize: '0.75rem', textTransform: 'capitalize' }}>{p.stage}</span></td>
                  <td style={{ padding: '0.6rem', width: 120 }}>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                      <div style={{ height: '100%', width: `${p.pct}%`, background: p.stage === 'completed' ? '#22c55e' : ORANGE, borderRadius: 4 }} />
                    </div>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderBOQ = () => {
    const boqVariances = boqItems.filter(b => b.actualRate && b.estimatedRate && b.actualRate > b.estimatedRate);
    const totalVariance = boqVariances.reduce((s, b) => s + (b.actualRate! - b.estimatedRate) * b.qty, 0);

    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(4)}>
          <KPICard icon="📦" label="BOQ Items" value={String(boqItems.length)} changeType="neutral" color="#6366f1" />
          <KPICard icon="✅" label="Completed" value={String(boqItems.filter(b => b.status === 'completed').length)} changeType="up" color="#22c55e" />
          <KPICard icon="⚠️" label="Over Budget" value={String(boqVariances.length)} changeType={boqVariances.length > 0 ? 'down' : 'neutral'} color="#ef4444" />
          <KPICard icon="💰" label="Total BOQ" value={formatLKR(boqTotal)} changeType="neutral" color="#3b82f6" />
        </div>
        {totalVariance > 0 && (
          <div style={{ ...cardStyle, background: '#fef2f2', borderColor: '#fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.2rem' }}>⚠️</span>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#dc2626' }}>BOQ Variance Alert</div>
                <div style={{ fontSize: '0.8rem', color: '#b91c1c' }}>{boqVariances.length} items over estimate by {formatLKR(totalVariance)} total</div>
              </div>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => setShowBOQModal(true)} style={primaryBtn}>+ Add BOQ Item</button>
        </div>
        <div style={cardStyle}>
          <h3 style={cardTitle}>📦 Bill of Quantities</h3>
          {boqItems.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No BOQ items yet.</div>
          ) : (
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 700 }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                  {['Item', 'Unit', 'Qty', 'Est. Rate', 'Act. Rate', 'Variance', 'Project', 'Status'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{boqItems.map(b => {
                  const variance = b.actualRate ? ((b.actualRate - b.estimatedRate) / b.estimatedRate * 100) : 0;
                  return (
                    <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{b.item}</td>
                      <td style={{ padding: '0.5rem', color: '#64748b' }}>{b.unit}</td>
                      <td style={{ padding: '0.5rem' }}>{b.qty}</td>
                      <td style={{ padding: '0.5rem' }}>{b.estimatedRate.toLocaleString()}</td>
                      <td style={{ padding: '0.5rem' }}>{b.actualRate?.toLocaleString() || '—'}</td>
                      <td style={{ padding: '0.5rem', fontWeight: 600, color: variance > 0 ? '#ef4444' : variance < 0 ? '#22c55e' : '#64748b' }}>
                        {variance !== 0 ? `${variance > 0 ? '+' : ''}${variance.toFixed(1)}%` : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', color: '#64748b' }}>{b.projectName}</td>
                      <td style={{ padding: '0.5rem' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                          color: b.status === 'completed' ? '#22c55e' : b.status === 'ordered' ? '#3b82f6' : b.status === 'partial' ? '#f59e0b' : '#94a3b8',
                          background: b.status === 'completed' ? '#dcfce7' : b.status === 'ordered' ? '#dbeafe' : b.status === 'partial' ? '#fef3c7' : '#f1f5f9',
                        }}>{b.status}</span>
                      </td>
                    </tr>
                  );
                })}</tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderInspections = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="🔍" label="Total" value={String(inspections.length)} changeType="neutral" color="#6366f1" />
        <KPICard icon="✅" label="Passed" value={String(inspections.filter(i => i.status === 'passed').length)} changeType="up" color="#22c55e" />
        <KPICard icon="⚠️" label="Issues" value={String(inspections.filter(i => i.status === 'issues' || i.status === 'failed').length)} changeType="down" color="#ef4444" />
      </div>
      <button onClick={() => setShowInspectionModal(true)} style={primaryBtn}>+ Log Inspection</button>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🔍 Site Inspection Log</h3>
        {inspections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No inspections logged yet.</div>
        ) : inspections.map(si => (
          <div key={si.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: si.status === 'passed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '1.2rem' }}>{si.status === 'passed' ? '✅' : '⚠️'}</div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{si.projectName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>{si.type.replace('_', ' ')} · {si.inspector}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{si.findings}</div>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: ORANGE }}>{si.date}</div>
              <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, background: si.status === 'passed' ? '#dcfce7' : '#fee2e2', color: si.status === 'passed' ? '#22c55e' : '#ef4444' }}>{si.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBaas = () => {
    // Group by baas name
    const baasSummary = baasEntries.reduce((acc, b) => {
      if (!acc[b.baasName]) acc[b.baasName] = { advances: 0, payments: 0, phone: b.baasPhone };
      if (b.type === 'advance') acc[b.baasName].advances += b.amount;
      else acc[b.baasName].payments += b.amount;
      return acc;
    }, {} as Record<string, { advances: number; payments: number; phone?: string }>);

    return (
      <div style={stackGap(20)}>
        <div style={gridColumns(3)}>
          <KPICard icon="👷" label="Subcontractors" value={String(Object.keys(baasSummary).length)} changeType="neutral" color="#6366f1" />
          <KPICard icon="💸" label="Total Advances" value={formatLKR(fromCents(baasEntries.filter(b => b.type === 'advance').reduce((s, b) => s + b.amount, 0)))} changeType="neutral" color="#ef4444" />
          <KPICard icon="💰" label="Outstanding" value={formatLKR(fromCents(Math.abs(baasOutstanding)))} changeType={baasOutstanding > 0 ? 'down' : 'up'} color={baasOutstanding > 0 ? '#ef4444' : '#22c55e'} />
        </div>
        <button onClick={() => setShowBaasModal(true)} style={primaryBtn}>+ Add Entry</button>

        {/* Baas Summary Cards */}
        {Object.keys(baasSummary).length > 0 && (
          <div style={cardStyle}>
            <h3 style={cardTitle}>👷 Subcontractor Summary</h3>
            {Object.entries(baasSummary).map(([name, data]) => {
              const outstanding = data.advances - data.payments;
              return (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Advances: {formatLKR(fromCents(data.advances))} · Paid: {formatLKR(fromCents(data.payments))}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: outstanding > 0 ? '#ef4444' : '#22c55e' }}>
                      {formatLKR(fromCents(Math.abs(outstanding)))}
                    </span>
                    {data.phone && (
                      <a href={generateWhatsAppLink(data.phone, `Hi ${name}, this is regarding your payment settlement.`)} target="_blank" rel="noreferrer" style={{ fontSize: '1.1rem', textDecoration: 'none' }}>💬</a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Ledger */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>📒 Full Ledger</h3>
          {baasEntries.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No entries yet.</div>
          ) : baasEntries.map(b => (
            <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.85rem' }}>
              <div>
                <span style={{ fontWeight: 600 }}>{b.baasName}</span>
                <span style={{ color: '#64748b' }}> — {b.description || b.type}</span>
                {b.projectName && <span style={{ color: '#94a3b8' }}> · {b.projectName}</span>}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 600, color: b.type === 'advance' ? '#ef4444' : '#22c55e' }}>
                  {b.type === 'advance' ? '-' : '+'}{formatLKR(fromCents(b.amount))}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRetention = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="🔒" label="Held" value={formatLKR(fromCents(totalRetentionHeld))} changeType="neutral" color="#f59e0b" />
        <KPICard icon="📅" label="Pending Release" value={String(retentionRecords.filter(r => r.status === 'held').length)} changeType="neutral" color="#6366f1" />
        <KPICard icon="✅" label="Released" value={String(retentionRecords.filter(r => r.status === 'released').length)} changeType="up" color="#22c55e" />
      </div>
      <button onClick={() => setShowRetentionModal(true)} style={primaryBtn}>+ Add Retention</button>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🔒 Retention Vault</h3>
        {retentionRecords.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>No retention records yet.</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 700 }}>
              <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                {['Project', 'Client', '%', 'Amount', 'WHT (2%)', 'Net Release', 'Release Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>{retentionRecords.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{r.projectName}</td>
                  <td style={{ padding: '0.5rem' }}>{r.client}</td>
                  <td style={{ padding: '0.5rem' }}>{r.retentionPct}%</td>
                  <td style={{ padding: '0.5rem', fontWeight: 600 }}>{formatLKR(fromCents(r.retentionAmount))}</td>
                  <td style={{ padding: '0.5rem', color: '#ef4444' }}>-{formatLKR(fromCents(r.whtAmount))}</td>
                  <td style={{ padding: '0.5rem', fontWeight: 600, color: '#22c55e' }}>{formatLKR(fromCents(r.netRelease))}</td>
                  <td style={{ padding: '0.5rem' }}>{r.releaseDate}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span style={{
                      padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                      color: r.status === 'released' ? '#22c55e' : r.status === 'held' ? '#f59e0b' : '#ef4444',
                      background: r.status === 'released' ? '#dcfce7' : r.status === 'held' ? '#fef3c7' : '#fee2e2',
                    }}>{r.status}</span>
                  </td>
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
        <KPICard icon="💰" label="Total Income" value={formatLKR(totalIncome)} changeType="up" color="#22c55e" />
        <KPICard icon="⏳" label="Pending" value={String(invoices.filter(i => i.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
        <KPICard icon="📈" label="Avg Claim" value={formatLKR(invoices.length ? Math.round(totalIncome / invoices.length) : 0)} changeType="neutral" color="#6366f1" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowInvoiceForm(true)} style={primaryBtn}>+ New Invoice / Claim</button>
      </div>
      <TransactionList transactions={invoices} title="Progress Claims & Invoices" showFilter={false} />
    </div>
  );

  const renderExpenses = () => (
    <div style={stackGap(20)}>
      <div style={gridColumns(3)}>
        <KPICard icon="💸" label="Total Costs" value={formatLKR(totalExpensesAmt)} changeType="neutral" color="#ef4444" />
        <KPICard icon="🧱" label="Materials" value={formatLKR(expenses.filter(e => e.category === 'Site Materials').reduce((s, e) => s + e.amount, 0))} changeType="neutral" color="#6366f1" />
        <KPICard icon="👷" label="Labour" value={formatLKR(expenses.filter(e => e.category === 'Labour / Sub-Con').reduce((s, e) => s + e.amount, 0))} changeType="neutral" color="#8b5cf6" />
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddExpense(true)} style={primaryBtn}>+ Add Expense</button>
        <button onClick={() => setShowGoldenList(!showGoldenList)} style={actionBtn('#6366f1')}>📋 Tax Deductions</button>
      </div>
      {showGoldenList && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>📋 Tax-Deductible Categories (S.32 IRD Act)</h3>
          <div style={gridColumns(2)}>
            {GOLDEN_LIST.filter(g => ['all', 'engineering'].includes(g.profession || 'all')).slice(0, 12).map(g => (
              <div key={g.category} style={{ padding: '0.5rem', fontSize: '0.82rem', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7' }}>
                ✅ {g.category}
              </div>
            ))}
          </div>
        </div>
      )}
      {showAddExpense && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>💸 Add Expense</h3>
          <form onSubmit={handleAddExpense} style={stackGap(12)}>
            <div><label style={labelStyle}>Amount (Rs.)</label><input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} required /></div>
            <div><label style={labelStyle}>Description</label><input value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Category</label>
              <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                <option value="">Select...</option>
                {engExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div><label style={labelStyle}>Date</label><input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={primaryBtn}>Save Expense</button>
              <button type="button" onClick={() => setShowAddExpense(false)} style={secondaryBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}
      <TransactionList transactions={expenses} title="All Expenses" showFilter={false} />
    </div>
  );

  const renderReports = () => (
    <div style={cardStyle}>
      <h3 style={cardTitle}>📋 Reports</h3>
      <div style={gridColumns(3)}>
        {[
          { n: '📊 Project P&L', d: 'Revenue & cost per project' },
          { n: '🧾 Progress Claims', d: 'All claims & status' },
          { n: '📂 Cost Analysis', d: 'Category-wise breakdown' },
          { n: '🧱 Material Usage', d: 'BOQ consumption report' },
          { n: '👷 Sub-Con Pay', d: 'Subcontractor payments' },
          { n: '🧾 Tax (APIT)', d: 'Estimated IRD returns' },
          { n: '🔍 Inspection Log', d: 'All site inspections' },
          { n: '📦 BOQ Summary', d: 'Bill of quantities report' },
          { n: '📈 Retention Track', d: 'Retention money tracker' },
        ].map(r => (
          <div key={r.n} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{r.n}</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.d}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderWallet = () => (
    <div style={stackGap(20)}>
      <div style={{ ...cardStyle, background: `linear-gradient(135deg, ${NAVY}, #334155)`, color: 'white' }}>
        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Token Balance</div>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0.25rem 0' }}>🪙 {walletData.tokenBalance.toLocaleString()}</div>
        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>Used for AI Tools · Auto-reload {walletData.autoReloadEnabled ? 'ON' : 'OFF'}</div>
      </div>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🛒 Buy Tokens</h3>
        <div style={gridColumns(3)}>
          {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
            <div key={pkg.id} style={{ padding: '1rem', borderRadius: 12, border: '1px solid #e2e8f0', textAlign: 'center', cursor: 'pointer', background: '#f8fafc' }}
              onClick={() => walletData.purchaseTokens(pkg.id)}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>🪙</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{pkg.tokens} Tokens</div>
              <div style={{ fontSize: '0.85rem', color: ORANGE, fontWeight: 600 }}>Rs. {pkg.price_lkr.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // AI Tools
  const AI_TOOLS = [
    { id: 'cost_estimation', name: 'Cost Estimation', icon: '💰', desc: 'ICTAD standard rate estimation', cost: 2, placeholder: 'Describe the work items to estimate...' },
    { id: 'boq_analysis', name: 'BOQ Analysis', icon: '📦', desc: 'Variance & optimization analysis', cost: 2, placeholder: 'Describe the BOQ items or paste your data...' },
    { id: 'site_report', name: 'Site Report', icon: '📝', desc: 'Generate inspection reports', cost: 1, placeholder: 'Describe the site findings and observations...' },
    { id: 'contract_clause', name: 'Contract Review', icon: '📋', desc: 'FIDIC & ICTAD contract clauses', cost: 3, placeholder: 'Describe the contract clause or issue...' },
    { id: 'safety_audit', name: 'Safety Audit', icon: '🦺', desc: 'Construction safety assessment', cost: 1, placeholder: 'Describe the site safety conditions...' },
    { id: 'retention_calculator', name: 'Retention Calc', icon: '🧮', desc: 'WHT & retention calculations', cost: 1, placeholder: 'Describe the retention scenario and amounts...' },
  ];

  const renderAI = () => (
    <div style={stackGap(20)}>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🤖 AI Engineering Assistant</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: `rgba(249,115,22,0.05)`, borderRadius: 10, marginBottom: '1rem' }}>
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
              border: aiToolActive === tool.id ? `2px solid ${ORANGE}` : '1px solid #e2e8f0',
              background: aiToolActive === tool.id ? 'rgba(249,115,22,0.05)' : '#f8fafc',
            }} onClick={() => { setAiToolActive(tool.id); setAiResult(null); setAiPrompt(''); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>{tool.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{tool.desc}</div>
              <div style={{ fontSize: '0.7rem', color: ORANGE, fontWeight: 600 }}>🪙 {tool.cost} tokens</div>
            </div>
          ))}
        </div>
      </div>
      {aiToolActive && (
        <div style={cardStyle}>
          <h3 style={{ ...cardTitle, margin: 0, marginBottom: '0.75rem' }}>
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
        <div style={cardStyle}>
          <h3 style={cardTitle}>📋 AI Result</h3>
          <pre style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit', color: '#1e293b', maxHeight: 500, overflow: 'auto' }}>{aiResult}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
            <button onClick={() => navigator.clipboard.writeText(aiResult)} style={actionBtn('#6366f1')}>📋 Copy</button>
            <button onClick={() => setAiResult(null)} style={actionBtn('#6b7280')}>✕ Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );

  // Settings
  const SETTINGS_FIELDS: { key: keyof typeof engSettings; label: string; icon: string; placeholder: string }[] = [
    { key: 'firmName', label: 'Firm Name', icon: '🏗️', placeholder: 'e.g. My Engineering Firm (Pvt) Ltd' },
    { key: 'ieslReg', label: 'IESL Registration', icon: '📋', placeholder: 'e.g. IESL/CM/2020/4567' },
    { key: 'ictadGrade', label: 'ICTAD Grade', icon: '🏛️', placeholder: 'e.g. C1 — Building & Civil' },
    { key: 'cidaReg', label: 'CIDA Registration', icon: '📜', placeholder: 'e.g. CIDA/2024/CS/892' },
    { key: 'specialization', label: 'Specialization', icon: '🔧', placeholder: 'e.g. Civil & Structural' },
    { key: 'vatReg', label: 'VAT Registration', icon: '🧾', placeholder: 'e.g. VAT-LK-005678 (18%)' },
    { key: 'irdTin', label: 'IRD TIN', icon: '🔑', placeholder: 'e.g. 567890123' },
    { key: 'financialYear', label: 'Financial Year', icon: '📅', placeholder: 'April 2025 – March 2026' },
    { key: 'retentionPolicy', label: 'Retention Policy', icon: '🏦', placeholder: '10% for 12 months' },
    { key: 'piInsurance', label: 'PI Insurance', icon: '⚠️', placeholder: 'e.g. SLIC Policy — Active' },
  ];

  const renderSettings = () => (
    <div style={stackGap(20)}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ ...cardTitle, margin: 0 }}>⚙️ Engineering Practice Settings</h3>
          {!editingSettings ? (
            <button onClick={() => setEditingSettings(true)} style={{ ...actionBtn(ORANGE), padding: '4px 14px', fontSize: '0.8rem' }}>✏️ Edit</button>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={handleSaveSettings} disabled={settingsSaving} style={{ ...primaryBtn, padding: '4px 14px', fontSize: '0.8rem', opacity: settingsSaving ? 0.6 : 1 }}>
                {settingsSaving ? '⏳ Saving...' : '💾 Save'}
              </button>
              <button onClick={() => setEditingSettings(false)} style={{ ...actionBtn('#6b7280'), padding: '4px 14px', fontSize: '0.8rem' }}>Cancel</button>
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
                <input value={engSettings[s.key] || ''} onChange={e => setEngSettings(p => ({ ...p, [s.key]: e.target.value }))} placeholder={s.placeholder}
                  style={{ ...inputStyle, flex: 1, minWidth: isCompactMobile ? '100%' : 200 }} />
              ) : (
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !engSettings[s.key] ? '#dc2626' : '#334155' }}>
                  {engSettings[s.key] || 'Not set'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🪙 Wallet & Billing</h3>
        <div style={stackGap(12)}>
          {[
            { label: 'Token Balance', value: `${walletData.tokenBalance} tokens`, icon: '🪙' },
            { label: 'Total Spent', value: `LKR ${walletData.totalSpentLKR.toLocaleString()}`, icon: '💰' },
            { label: 'Tax Deductible (IT/Software)', value: `LKR ${walletData.totalSpentLKR.toLocaleString()} — claim under S.32`, icon: '🧾' },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>
      {isCompactMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
          <button onClick={onLogout} style={actionBtn(NAVY)}>🚪 Sign Out</button>
          <button onClick={onChangeProfession} style={actionBtn('#475569')}>🌐 Web Professions</button>
        </div>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  MODALS
  // ═══════════════════════════════════════════════════

  const renderProjectModal = () => (
    <div style={modalOverlay} onClick={() => setShowProjectModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={cardTitle}>🏗️ New Project</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Project Name *</label><input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} style={inputStyle} required placeholder="e.g. Colombo Mall Extension" /></div>
          <div><label style={labelStyle}>Client *</label><input value={newProject.client} onChange={e => setNewProject(p => ({ ...p, client: e.target.value }))} style={inputStyle} required placeholder="e.g. ABC Developers" /></div>
          <div><label style={labelStyle}>Contract Value (Rs.)</label><input type="number" value={newProject.value} onChange={e => setNewProject(p => ({ ...p, value: e.target.value }))} style={inputStyle} placeholder="e.g. 2500000" /></div>
          <div><label style={labelStyle}>ICTAD Grade</label>
            <select value={newProject.ictadGrade} onChange={e => setNewProject(p => ({ ...p, ictadGrade: e.target.value }))} style={selectStyle}>
              {['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10'].map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Stage</label>
            <select value={newProject.stage} onChange={e => setNewProject(p => ({ ...p, stage: e.target.value as any }))} style={selectStyle}>
              {['design', 'foundation', 'construction', 'finishing', 'completed', 'defects'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Retention %</label><input type="number" value={newProject.retentionPct} onChange={e => setNewProject(p => ({ ...p, retentionPct: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Start Date</label><input type="date" value={newProject.startDate} onChange={e => setNewProject(p => ({ ...p, startDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Notes</label><textarea value={newProject.notes} onChange={e => setNewProject(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddProject} style={primaryBtn}>Add Project</button>
            <button onClick={() => setShowProjectModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBOQModal = () => (
    <div style={modalOverlay} onClick={() => setShowBOQModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={cardTitle}>📦 Add BOQ Item</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Project</label>
            <select value={newBOQ.projectId} onChange={e => setNewBOQ(p => ({ ...p, projectId: e.target.value }))} style={selectStyle}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Item Description *</label><input value={newBOQ.item} onChange={e => setNewBOQ(p => ({ ...p, item: e.target.value }))} style={inputStyle} placeholder="e.g. Reinforcement Steel (Y16)" /></div>
          <div><label style={labelStyle}>Unit</label>
            <select value={newBOQ.unit} onChange={e => setNewBOQ(p => ({ ...p, unit: e.target.value }))} style={selectStyle}>
              {['nos', 'MT', 'm³', 'm²', 'm', 'kg', 'bags', 'trips', 'LS'].map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Quantity *</label><input type="number" value={newBOQ.qty} onChange={e => setNewBOQ(p => ({ ...p, qty: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Estimated Rate (Rs.)</label><input type="number" value={newBOQ.estimatedRate} onChange={e => setNewBOQ(p => ({ ...p, estimatedRate: e.target.value }))} style={inputStyle} placeholder="BOQ estimate rate" /></div>
          <div><label style={labelStyle}>Actual Rate (Rs.) — optional</label><input type="number" value={newBOQ.actualRate} onChange={e => setNewBOQ(p => ({ ...p, actualRate: e.target.value }))} style={inputStyle} placeholder="Real purchase rate" /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddBOQ} style={primaryBtn}>Add Item</button>
            <button onClick={() => setShowBOQModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderInspectionModal = () => (
    <div style={modalOverlay} onClick={() => setShowInspectionModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={cardTitle}>🔍 Log Site Inspection</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Project</label>
            <select value={newInspection.projectId} onChange={e => setNewInspection(p => ({ ...p, projectId: e.target.value }))} style={selectStyle}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Date</label><input type="date" value={newInspection.date} onChange={e => setNewInspection(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Inspector</label><input value={newInspection.inspector} onChange={e => setNewInspection(p => ({ ...p, inspector: e.target.value }))} style={inputStyle} placeholder="e.g. Eng. Perera" /></div>
          <div><label style={labelStyle}>Type</label>
            <select value={newInspection.type} onChange={e => setNewInspection(p => ({ ...p, type: e.target.value as any }))} style={selectStyle}>
              {['structural', 'foundation', 'safety', 'concrete_test', 'electrical', 'plumbing', 'other'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Findings *</label><textarea value={newInspection.findings} onChange={e => setNewInspection(p => ({ ...p, findings: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Describe findings..." /></div>
          <div><label style={labelStyle}>Result</label>
            <select value={newInspection.status} onChange={e => setNewInspection(p => ({ ...p, status: e.target.value as any }))} style={selectStyle}>
              <option value="passed">Passed</option><option value="issues">Issues Found</option><option value="failed">Failed</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddInspection} style={primaryBtn}>Log Inspection</button>
            <button onClick={() => setShowInspectionModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBaasModal = () => (
    <div style={modalOverlay} onClick={() => setShowBaasModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={cardTitle}>👷 Add Baas Entry</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Subcontractor Name *</label><input value={newBaas.baasName} onChange={e => setNewBaas(p => ({ ...p, baasName: e.target.value }))} style={inputStyle} placeholder="e.g. Kamal Perera" /></div>
          <div><label style={labelStyle}>Phone (WhatsApp)</label><input value={newBaas.baasPhone} onChange={e => setNewBaas(p => ({ ...p, baasPhone: e.target.value }))} style={inputStyle} placeholder="+94 7X XXX XXXX" /></div>
          <div><label style={labelStyle}>Project</label>
            <select value={newBaas.projectId} onChange={e => setNewBaas(p => ({ ...p, projectId: e.target.value }))} style={selectStyle}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Type *</label>
            <select value={newBaas.type} onChange={e => setNewBaas(p => ({ ...p, type: e.target.value as any }))} style={selectStyle}>
              <option value="advance">Advance / Petty Cash</option>
              <option value="payment">Payment</option>
              <option value="settlement">Final Settlement</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>
          <div><label style={labelStyle}>Amount (Rs.) *</label><input type="number" value={newBaas.amount} onChange={e => setNewBaas(p => ({ ...p, amount: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Description</label><input value={newBaas.description} onChange={e => setNewBaas(p => ({ ...p, description: e.target.value }))} style={inputStyle} placeholder="e.g. Daily wages — Block A" /></div>
          <div><label style={labelStyle}>Date</label><input type="date" value={newBaas.date} onChange={e => setNewBaas(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Work Description</label><textarea value={newBaas.workDescription} onChange={e => setNewBaas(p => ({ ...p, workDescription: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} placeholder="Describe completed work..." /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddBaas} style={primaryBtn}>Add Entry</button>
            <button onClick={() => setShowBaasModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRetentionModal = () => (
    <div style={modalOverlay} onClick={() => setShowRetentionModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={cardTitle}>🔒 Add Retention Record</h3>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Project *</label>
            <select value={newRetention.projectId} onChange={e => setNewRetention(p => ({ ...p, projectId: e.target.value }))} style={selectStyle}>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={String(p.id)}>{p.name}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Retention %</label><input type="number" value={newRetention.retentionPct} onChange={e => setNewRetention(p => ({ ...p, retentionPct: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Retention Amount (Rs.) *</label><input type="number" value={newRetention.retentionAmount} onChange={e => setNewRetention(p => ({ ...p, retentionAmount: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Release Date</label><input type="date" value={newRetention.releaseDate} onChange={e => setNewRetention(p => ({ ...p, releaseDate: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>WHT Rate (%)</label><input type="number" value={newRetention.whtRate} onChange={e => setNewRetention(p => ({ ...p, whtRate: e.target.value }))} style={inputStyle} step="0.1" /></div>
          <div><label style={labelStyle}>Notes</label><textarea value={newRetention.notes} onChange={e => setNewRetention(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddRetention} style={primaryBtn}>Add Retention</button>
            <button onClick={() => setShowRetentionModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  CONTENT ROUTER
  // ═══════════════════════════════════════════════════

  const renderContent = () => {
    switch (activeNav) {
      case 'overview': return renderOverview();
      case 'briefing': return <SubscriptionGate featureName="Morning Briefing" featureIcon="🌅"><MorningBriefing /></SubscriptionGate>;
      case 'inbox': return <TransactionInbox />;
      case 'projects': return renderProjects();
      case 'boq': return renderBOQ();
      case 'inspections': return renderInspections();
      case 'baas': return renderBaas();
      case 'retention': return <BiometricGate sectionName="Retention Vault">{renderRetention()}</BiometricGate>;
      case 'income': return renderIncome();
      case 'expenses': return renderExpenses();
      case 'tax': return <TaxSpeedometer annualPrivateIncome={totalIncome} annualGovIncome={0} annualExpenses={totalExpensesAmt} whtDeducted={0} />;
      case 'receipts': return <ReceiptScanner />;
      case 'reports': return renderReports();
      case 'export': return <AuditorExport invoices={invoices} expenses={expenses} />;
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
              background: activeNav === item.id ? ORANGE : '#f1f5f9',
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
        profession="engineering" professionLabel="EngiTracksy" professionIcon="🔧"
        userName={userName} navItems={navItems} activeNav={activeNav}
        onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}
        tokenBalance={walletData.tokenBalance} onWalletClick={() => setActiveNav('wallet')}
        mobileShell={{
          enabled: true, tabs: ENG_MOBILE_TABS, activeTab: activeMobileTab,
          onTabChange: handleMobileTabChange, activeTitle: activeNavItem.label,
          activeSubtitle: `${currentDateLabel} • ${userName}`,
        }}
      >
        <>
          {renderMobileSectionNav()}
          {renderContent()}
        </>
      </DashboardLayout>
      {showProjectModal && renderProjectModal()}
      {showBOQModal && renderBOQModal()}
      {showInspectionModal && renderInspectionModal()}
      {showBaasModal && renderBaasModal()}
      {showRetentionModal && renderRetentionModal()}
      {showInvoiceForm && <InvoiceForm onSubmit={handleCreateInvoice} onCancel={() => setShowInvoiceForm(false)} />}
      <VoiceInput onAction={handleVoiceAction} position="float"
        floatingOffset={isCompactMobile ? { bottom: 114, right: 16 } : undefined} />
    </>
  );
};

/* ================================================================
   STYLES (outside component)
   ================================================================ */
const cardStyle: React.CSSProperties = {
  background: 'white', borderRadius: 14, padding: '1.5rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
  border: '1px solid #e2e8f0',
};
const cardTitle: React.CSSProperties = {
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
const selectStyle: React.CSSProperties = { ...inputStyle };
const NAVY_C = '#1a365d';
const ORANGE_C = '#f97316';
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
  padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, background: ORANGE_C,
  color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white',
  color: '#475569', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer',
};

export default EngineeringDashboard;
