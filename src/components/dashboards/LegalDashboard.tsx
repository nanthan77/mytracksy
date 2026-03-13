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
import { generateWhatsAppLink, hearingReminderMessage, caseUpdateMessage } from '../../services/whatsappService';
import { downloadSingleEntryICS, downloadICS } from '../../services/calendarExportService';
import { LEGAL_TEMPLATES, DocumentTemplate, generateFeeNote } from '../../services/legalDocumentService';
import { startLegalAutoSync, stopLegalAutoSync } from '../../services/legalSyncService';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../../config/firebase';

/* ============ Props ============ */
interface LegalDashboardProps {
  userName: string;
  onChangeProfession: () => void;
  onLogout: () => void;
}

/* ============ Navigation (20 items) ============ */
const navItems = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'briefing', label: 'Court Day Briefing', icon: '🌅', premium: true },
  { id: 'inbox', label: 'Inbox', icon: '📥' },
  { id: 'diary', label: 'Court Diary', icon: '📅' },
  { id: 'cases', label: 'Cases & Clients', icon: '📁' },
  { id: 'trust', label: 'Trust Accounting', icon: '🏦' },
  { id: 'income', label: 'Income & Fee Notes', icon: '💰' },
  { id: 'expenses', label: 'Expenses', icon: '💸' },
  { id: 'tax', label: 'Tax & IRD', icon: '🧾' },
  { id: 'receipts', label: 'Receipts', icon: '📸' },
  { id: 'documents', label: 'Documents', icon: '📄' },
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
type LegalMobileTabId = 'home' | 'court' | 'cases' | 'money' | 'more';
const LEGAL_MOBILE_TABS: { id: LegalMobileTabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'court', label: 'Court', icon: '⚖️' },
  { id: 'cases', label: 'Cases', icon: '📁' },
  { id: 'money', label: 'Money', icon: '💳' },
  { id: 'more', label: 'More', icon: '☰' },
];
const LEGAL_MOBILE_GROUPS: Record<LegalMobileTabId, string[]> = {
  home: ['overview', 'inbox'],
  court: ['diary', 'briefing', 'scheduler', 'documents'],
  cases: ['cases', 'trust', 'ai', 'voicevault'],
  money: ['income', 'expenses', 'tax', 'reports', 'export', 'wallet'],
  more: ['receipts', 'lifeadmin', 'subscription', 'settings'],
};
const LEGAL_MOBILE_DEFAULT_NAV: Record<LegalMobileTabId, string> = {
  home: 'overview', court: 'diary', cases: 'cases', money: 'income', more: 'settings',
};
const LEGAL_SHORTCUT_NAV: Record<string, string> = {
  overview: 'overview', diary: 'diary', cases: 'cases', trust: 'trust',
  income: 'income', expenses: 'expenses', reports: 'reports', receipts: 'receipts',
};
function getLegalMobileTab(activeNav: string): LegalMobileTabId {
  const match = LEGAL_MOBILE_TABS.find(tab => LEGAL_MOBILE_GROUPS[tab.id].includes(activeNav));
  return match?.id || 'home';
}

/* ============ Constants ============ */
const NAVY = '#1a365d';
const GOLD = '#d4a843';
const formatLKR = (n: number) => `Rs. ${n.toLocaleString()}`;
const CASE_TYPE_COLORS: Record<string, string> = {
  civil: '#3b82f6', criminal: '#ef4444', family: '#8b5cf6',
  commercial: '#f59e0b', constitutional: '#10b981', other: '#6b7280',
};
const TRANSACTION_TYPE_ICONS: Record<string, string> = {
  deposit: '⬆️', withdrawal: '⬇️', transfer: '↔️', fee: '💰',
};
const legalExpenseCategories = [
  'Court Fees', 'Filing Fees', 'Expert Witness', 'Travel', 'Research & Databases',
  'Office Supplies', 'Continuing Education', 'Insurance', 'Staff Costs', 'Other',
];

/* ================================================================
   COMPONENT
   ================================================================ */
const LegalDashboard: React.FC<LegalDashboardProps> = ({ userName, onChangeProfession, onLogout }) => {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;
  const walletData = useTokenWallet(uid || '');
  const isCompactMobile = useIsCompactMobile();

  const validNavIds = useMemo(() => navItems.map(n => n.id), []);
  const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
  const [invoices, setInvoices] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Transaction[]>([]);
  const [showDiaryModal, setShowDiaryModal] = useState(false);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showGoldenList, setShowGoldenList] = useState(false);

  // Document form builder state
  const [activeTemplate, setActiveTemplate] = useState<DocumentTemplate | null>(null);
  const [docFormValues, setDocFormValues] = useState<Record<string, string>>({});
  const [generatedDocContent, setGeneratedDocContent] = useState<string | null>(null);
  const [feeNoteItems, setFeeNoteItems] = useState<{ description: string; amount: string }[]>([{ description: '', amount: '' }]);

  // AI tools state
  const [aiToolActive, setAiToolActive] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Settings state
  const [legalSettings, setLegalSettings] = useState({
    barRegistration: '', specialization: '', practisingCertificate: '',
    primaryCourt: '', chambers: '', professionalIndemnity: '',
    irdTIN: '', taxYear: '2025/2026 (April – March)', currency: 'LKR (Sri Lankan Rupee)',
  });
  const [editingSettings, setEditingSettings] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);

  const [newDiary, setNewDiary] = useState({ date: '', court: '', judge: '', caseNumber: '', notes: '', time: '09:00' });
  const [newCase, setNewCase] = useState({ clientName: '', caseTitle: '', caseNumber: '', caseType: 'civil' as const, court: '', judge: '', clientPhone: '', clientEmail: '' });
  const [newTransaction, setNewTransaction] = useState({ caseId: '', type: 'deposit' as const, amount: '', description: '', date: '' });
  const [expenseForm, setExpenseForm] = useState({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0] });

  const diaryEntries = useLiveQuery(() => uid ? db.court_diary.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];
  const cases = useLiveQuery(() => uid ? db.case_records.where('userId').equals(uid).toArray() : [], [uid]) || [];
  const trustTransactions = useLiveQuery(() => uid ? db.trust_transactions.where('userId').equals(uid).reverse().sortBy('date') : [], [uid]) || [];

  const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
  const totalExpensesAmt = expenses.reduce((s, t) => s + t.amount, 0);
  const pendingHearings = diaryEntries.filter((e: { date: string }) => new Date(e.date) >= new Date()).length;
  const trustBalance = trustTransactions.reduce((s: number, t: { type: string; amount: number }) => t.type === 'retainer_receipt' ? s + t.amount : s - t.amount, 0);

  const activeNavItem = useMemo(() => navItems.find(n => n.id === activeNav) || navItems[0], [activeNav]);
  const activeMobileTab = useMemo(() => getLegalMobileTab(activeNav), [activeNav]);
  const activeMobileSections = useMemo(() => {
    const group = LEGAL_MOBILE_GROUPS[activeMobileTab] || [];
    return navItems.filter(n => group.includes(n.id));
  }, [activeMobileTab]);

  const gridColumns = (cols: number) => ({ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${Math.floor(100 / cols)}%, 1fr))`, gap: '1rem' } as React.CSSProperties);
  const stackGap = (gap = 16): React.CSSProperties => ({ display: 'flex', flexDirection: 'column', gap });
  const currentDateLabel = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  useEffect(() => {
    if (!uid) return;
    seedChartOfAccounts(uid, 'legal').catch(err => console.error('Failed to seed CoA:', err));
    // Start legal data sync (Dexie ↔ Firestore)
    const stopSync = startLegalAutoSync(uid);
    return () => { stopSync(); stopLegalAutoSync(); };
  }, [uid]);

  // Load legal settings from Firestore
  useEffect(() => {
    if (!uid) return;
    const settingsRef = doc(firestoreDb, 'users', uid, 'legal_settings', 'practice');
    getDoc(settingsRef).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        setLegalSettings(prev => ({ ...prev, ...d }));
      }
    }).catch(console.error);
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubIncome = subscribeTransactions(uid, (txns) => {
      setInvoices(txns.map(t => ({
        id: t.id || '', type: 'income' as const,
        amount: fromCents(t.amount_cents), description: t.description,
        category: t.category_name || '', date: t.date,
        status: (t.status === 'cleared' ? 'paid' : 'pending') as 'paid' | 'pending',
      })));
    }, { type: 'income' });
    const unsubExpenses = subscribeTransactions(uid, (txns) => {
      setExpenses(txns.map(t => ({
        id: t.id || '', type: 'expense' as const,
        amount: fromCents(t.amount_cents), description: t.description,
        category: t.category_name || '', date: t.date, status: 'completed',
      })));
    }, { type: 'expense' });
    return () => { unsubIncome(); unsubExpenses(); };
  }, [uid]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    if (action && LEGAL_SHORTCUT_NAV[action]) setActiveNav(LEGAL_SHORTCUT_NAV[action]);
    const handlePop = () => {
      const p = new URLSearchParams(window.location.search);
      const a = p.get('action');
      if (a && LEGAL_SHORTCUT_NAV[a]) setActiveNav(LEGAL_SHORTCUT_NAV[a]);
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const handleAddDiary = async () => {
    if (!uid || !newDiary.date || !newDiary.court) return;
    await db.court_diary.add({ date: newDiary.date, caseId: newDiary.caseNumber || '', caseTitle: newDiary.caseNumber || '', court: newDiary.court, courtNo: '', time: newDiary.time || '09:00', judge: newDiary.judge || '', hearingType: 'mention', notes: newDiary.notes || '', status: 'confirmed', courtLocation: 'hulftsdorp', sync_status: 'pending', userId: uid, createdAt: Date.now() });
    setNewDiary({ date: '', court: '', judge: '', caseNumber: '', notes: '', time: '09:00' });
    setShowDiaryModal(false);
  };

  const handleAddCase = async () => {
    if (!uid || !newCase.clientName || !newCase.caseTitle) return;
    await db.case_records.add({ clientName: newCase.clientName, caseTitle: newCase.caseTitle, caseNumber: newCase.caseNumber || '', caseType: (newCase.caseType as 'civil' | 'criminal' | 'corporate' | 'estate' | 'ip' | 'family' | 'labour' | 'other') || 'civil', court: newCase.court || '', judge: newCase.judge || '', clientPhone: newCase.clientPhone || '', clientEmail: newCase.clientEmail || '', status: 'active', retainerBalance: 0, totalBilled: 0, totalPaid: 0, sync_status: 'pending', userId: uid, createdAt: Date.now() });
    setNewCase({ clientName: '', caseTitle: '', caseNumber: '', caseType: 'civil', court: '', judge: '', clientPhone: '', clientEmail: '' });
    setShowCaseModal(false);
  };

  const handleAddTransaction = async () => {
    if (!uid || !newTransaction.amount) return;
    const txType = newTransaction.type === 'deposit' ? 'retainer_receipt' as const : 'refund' as const;
    await db.trust_transactions.add({ userId: uid, caseId: newTransaction.caseId || '', clientId: '', clientName: '', type: txType, amount: parseFloat(newTransaction.amount), description: newTransaction.description || '', category: '', account: 'trust', date: newTransaction.date || new Date().toISOString().split('T')[0], sync_status: 'pending', createdAt: Date.now() });
    setNewTransaction({ caseId: '', type: 'deposit', amount: '', description: '', date: '' });
    setShowTransactionModal(false);
  };

  const handleVoiceAction = (action: ParsedVoiceAction) => {
    const dateStr = new Date().toISOString().split('T')[0];
    switch (action.intent) {
      case 'income': {
        const t: Transaction = { id: `v-${Date.now()}`, type: 'income', amount: action.amount || 0, description: action.description || 'Voice entry', category: action.category || 'Appearance Fee', date: dateStr, status: 'paid' };
        setInvoices(prev => [t, ...prev]);
        break;
      }
      case 'expense': {
        const t: Transaction = { id: `v-${Date.now()}`, type: 'expense', amount: action.amount || 0, description: action.description || 'Voice entry', category: action.category || 'Court Fees', date: dateStr, status: 'completed' };
        setExpenses(prev => [t, ...prev]);
        break;
      }
      case 'appointment': setActiveNav('diary'); break;
      default: break;
    }
  };

  const handleCreateInvoice = async (data: InvoiceData) => {
    if (!uid) return;
    await addTransaction(uid, { type: 'income', amount_cents: toCents(data.amount), description: `${data.serviceType} — ${data.patientName}`, category_name: 'Appearance Fee', date: data.date || new Date().toISOString().split('T')[0], status: 'cleared', source: 'manual_entry', vendor: data.hospital || '', category_id: '' });
    setShowInvoiceForm(false);
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uid || !expenseForm.amount) return;
    await addTransaction(uid, { type: 'expense', amount_cents: toCents(parseFloat(expenseForm.amount)), description: expenseForm.description, category_name: expenseForm.category || 'Court Fees', date: expenseForm.date, status: 'cleared', source: 'manual_entry', vendor: '', category_id: '' });
    setExpenseForm({ amount: '', description: '', category: '', date: new Date().toISOString().split('T')[0] });
    setShowAddExpense(false);
  };

  const handleMobileTabChange = (tabId: string) => {
    const defaultNav = LEGAL_MOBILE_DEFAULT_NAV[tabId as LegalMobileTabId];
    if (defaultNav) setActiveNav(defaultNav);
  };

  // AI Tools handler
  const handleAIQuery = useCallback(async (tool: string, prompt: string) => {
    if (!uid || !prompt.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const functions = getFunctions();
      const processQuery = httpsCallable(functions, 'processLegalAIQuery');
      const result = await processQuery({ tool, prompt });
      const data = result.data as { result: string; tokensUsed: number; remainingTokens: number };
      setAiResult(data.result);
    } catch (err: any) {
      setAiResult(`Error: ${err.message || 'Failed to process query. Please try again.'}`);
    } finally {
      setAiLoading(false);
    }
  }, [uid]);

  // Settings save handler
  const handleSaveSettings = useCallback(async () => {
    if (!uid) return;
    setSettingsSaving(true);
    try {
      const settingsRef = doc(firestoreDb, 'users', uid, 'legal_settings', 'practice');
      await setDoc(settingsRef, { ...legalSettings, updatedAt: new Date().toISOString() }, { merge: true });
      setEditingSettings(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSettingsSaving(false);
    }
  }, [uid, legalSettings]);

  // Document template handler
  const handleOpenTemplate = (tpl: DocumentTemplate) => {
    setActiveTemplate(tpl);
    const defaults: Record<string, string> = {};
    for (const f of tpl.fields) {
      defaults[f.key] = f.defaultValue || '';
    }
    setDocFormValues(defaults);
    setGeneratedDocContent(null);
    setFeeNoteItems([{ description: '', amount: '' }]);
  };

  const handleGenerateDocument = () => {
    if (!activeTemplate) return;
    if (activeTemplate.type === 'fee_note') {
      const items = feeNoteItems.filter(i => i.description && i.amount).map(i => ({
        description: i.description,
        amount: parseFloat(i.amount) || 0,
      }));
      const doc = generateFeeNote({
        clientName: docFormValues.clientName || '',
        clientAddress: docFormValues.clientAddress,
        caseTitle: docFormValues.caseTitle || '',
        court: docFormValues.court,
        date: docFormValues.date || new Date().toISOString().split('T')[0],
        items,
        notes: docFormValues.notes,
        lawyerName: userName,
      });
      setGeneratedDocContent(doc.content);
    } else {
      // Generic template: format all field values into a document
      const lines = [`${activeTemplate.name.toUpperCase()}`, ''];
      for (const field of activeTemplate.fields) {
        const val = docFormValues[field.key];
        if (val) lines.push(`${field.label}: ${val}`);
      }
      lines.push('', `Generated: ${new Date().toLocaleDateString('en-LK', { year: 'numeric', month: 'long', day: 'numeric' })}`, '', userName, 'Attorney-at-Law');
      setGeneratedDocContent(lines.join('\n'));
    }
  };

  /* ============ RENDER: Overview ============ */
  const renderOverview = () => (
    <div style={stackGap(20)}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Active Cases" value={String(cases.filter(c => c.status === 'active').length)} icon="📁" color="#3b82f6" />
        <KPICard label="Pending Hearings" value={String(pendingHearings)} icon="📅" color={GOLD} />
        <KPICard label="Trust Balance" value={formatLKR(trustBalance)} icon="🏦" color="#10b981" />
        <KPICard label="AI Tokens" value={walletData.tokenBalance.toLocaleString()} icon="🪙" color="#8b5cf6" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        <div style={cardStyle}>
          <h3 style={cardTitle}>Income This Month</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#10b981', margin: 0 }}>Rs. {fmt(totalIncome)}</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{invoices.length} fee notes</p>
        </div>
        <div style={cardStyle}>
          <h3 style={cardTitle}>Expenses This Month</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#ef4444', margin: 0 }}>Rs. {fmt(totalExpensesAmt)}</p>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: '0.25rem 0 0' }}>{expenses.length} expenses</p>
        </div>
      </div>
      <div style={cardStyle}>
        <h3 style={cardTitle}>Quick Actions</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button onClick={() => setShowDiaryModal(true)} style={actionBtn('#3b82f6')}>+ Court Date</button>
          <button onClick={() => setShowCaseModal(true)} style={actionBtn(NAVY)}>+ New Case</button>
          <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#10b981')}>+ Fee Note</button>
          <button onClick={() => setActiveNav('trust')} style={actionBtn(GOLD)}>Trust Account</button>
        </div>
      </div>
    </div>
  );

  /* ============ RENDER: Court Diary ============ */
  const renderDiary = () => (
    <div style={stackGap(16)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: NAVY }}>Court Diary</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {diaryEntries.length > 0 && (
            <button onClick={() => downloadICS(diaryEntries.filter(e => new Date(e.date) >= new Date()), 'court-diary')} style={actionBtn('#6366f1')}>📅 Export All (.ics)</button>
          )}
          <button onClick={() => setShowDiaryModal(true)} style={actionBtn('#3b82f6')}>+ Add Entry</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Total Entries" value={String(diaryEntries.length)} icon="📅" color="#3b82f6" />
        <KPICard label="Upcoming" value={String(pendingHearings)} icon="⏳" color={GOLD} />
        <KPICard label="Completed" value={String(diaryEntries.filter(e => new Date(e.date) < new Date()).length)} icon="✅" color="#10b981" />
      </div>
      {diaryEntries.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📅</p>
          <p style={{ color: '#64748b' }}>No court diary entries yet. Add your first entry to get started.</p>
        </div>
      ) : (
        <div style={stackGap(12)}>
          {diaryEntries.map((entry) => (
            <div key={entry.id} style={{ ...cardStyle, borderLeft: `4px solid ${new Date(entry.date) >= new Date() ? GOLD : '#10b981'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY }}>{new Date(entry.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {entry.time || '09:00'}</div>
                  <div style={{ color: '#475569', marginTop: 4 }}>🏛️ {entry.court}{entry.judge ? ` • Judge: ${entry.judge}` : ''}</div>
                  {entry.caseTitle && <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 2 }}>Case: {entry.caseTitle}</div>}
                  {entry.notes && <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 4 }}>{entry.notes}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => downloadSingleEntryICS(entry)} style={{ ...actionBtn('#6366f1'), padding: '4px 10px', fontSize: '0.75rem' }}>📅 .ics</button>
                  <span style={{ ...badgeBase, background: new Date(entry.date) >= new Date() ? '#fef3c7' : '#d1fae5', color: new Date(entry.date) >= new Date() ? '#92400e' : '#065f46' }}>
                    {new Date(entry.date) >= new Date() ? 'Upcoming' : 'Past'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ============ RENDER: Cases & Clients ============ */
  const renderCases = () => (
    <div style={stackGap(16)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: NAVY }}>Cases & Clients</h2>
        <button onClick={() => setShowCaseModal(true)} style={actionBtn(NAVY)}>+ New Case</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Total Cases" value={String(cases.length)} icon="📁" color="#3b82f6" />
        <KPICard label="Active" value={String(cases.filter(c => c.status === 'active').length)} icon="🟢" color="#10b981" />
        <KPICard label="Completed" value={String(cases.filter(c => c.status === 'completed').length)} icon="📕" color="#6b7280" />
      </div>
      {cases.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>📁</p>
          <p style={{ color: '#64748b' }}>No cases yet. Add your first case to start tracking.</p>
        </div>
      ) : (
        <div style={stackGap(12)}>
          {cases.map((c) => (
            <div key={c.id} style={{ ...cardStyle, borderLeft: `4px solid ${CASE_TYPE_COLORS[c.caseType] || '#6b7280'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, color: NAVY }}>{c.caseTitle}</div>
                  <div style={{ color: '#475569', marginTop: 4 }}>👤 {c.clientName}{c.caseNumber ? ` • #${c.caseNumber}` : ''}</div>
                  {c.court && <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 2 }}>🏛️ {c.court}{c.judge ? ` • Judge: ${c.judge}` : ''}</div>}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {c.clientPhone && (
                    <>
                      <a href={generateWhatsAppLink(c.clientPhone, hearingReminderMessage({ clientName: c.clientName, caseTitle: c.caseTitle, court: c.court || 'TBC', courtNo: '', date: '', time: '', hearingType: 'mention' }))}
                        target="_blank" rel="noopener noreferrer" style={{ ...actionBtn('#25d366'), padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}>💬 WhatsApp</a>
                      <a href={generateWhatsAppLink(c.clientPhone, caseUpdateMessage({ clientName: c.clientName, caseTitle: c.caseTitle, update: 'Update pending' }))}
                        target="_blank" rel="noopener noreferrer" style={{ ...actionBtn('#6366f1'), padding: '4px 10px', fontSize: '0.75rem', textDecoration: 'none' }}>📋 Update</a>
                    </>
                  )}
                  <span style={{ ...badgeBase, background: CASE_TYPE_COLORS[c.caseType] + '20', color: CASE_TYPE_COLORS[c.caseType] }}>{c.caseType}</span>
                  <span style={{ ...badgeBase, background: c.status === 'active' ? '#d1fae5' : '#f1f5f9', color: c.status === 'active' ? '#065f46' : '#475569' }}>{c.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ============ RENDER: Trust Accounting ============ */
  const renderTrust = () => (
    <div style={stackGap(16)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: NAVY }}>Trust Accounting</h2>
        <button onClick={() => setShowTransactionModal(true)} style={actionBtn('#10b981')}>+ Transaction</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Trust Balance" value={formatLKR(trustBalance)} icon="🏦" color="#10b981" />
        <KPICard label="Receipts" value={String(trustTransactions.filter(t => t.type === 'retainer_receipt').length)} icon="⬆️" color="#3b82f6" />
        <KPICard label="Disbursements" value={String(trustTransactions.filter(t => t.type !== 'retainer_receipt').length)} icon="⬇️" color="#ef4444" />
      </div>
      {trustTransactions.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>🏦</p>
          <p style={{ color: '#64748b' }}>No trust transactions yet.</p>
        </div>
      ) : (
        <div style={stackGap(12)}>
          {trustTransactions.map((t) => (
            <div key={t.id} style={{ ...cardStyle, borderLeft: `4px solid ${t.type === 'retainer_receipt' ? '#10b981' : '#ef4444'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: NAVY }}>{TRANSACTION_TYPE_ICONS[t.type] || '💰'} {t.description || t.type}</div>
                  <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: 2 }}>{new Date(t.date).toLocaleDateString()}</div>
                </div>
                <div style={{ fontWeight: 700, color: t.type === 'retainer_receipt' ? '#10b981' : '#ef4444', fontSize: '1.125rem' }}>
                  {t.type === 'retainer_receipt' ? '+' : '-'}{formatLKR(t.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  /* ============ RENDER: Income & Fee Notes ============ */
  const renderIncome = () => (
    <div style={stackGap(16)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: NAVY }}>Income & Fee Notes</h2>
        <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#10b981')}>+ Fee Note</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Total Income" value={`Rs. ${fmt(totalIncome)}`} icon="💰" color="#10b981" />
        <KPICard label="Fee Notes" value={String(invoices.length)} icon="📄" color="#3b82f6" />
        <KPICard label="Paid" value={String(invoices.filter(i => i.status === 'paid').length)} icon="✅" color={GOLD} />
      </div>
      {invoices.length > 0 ? (
        <TransactionList transactions={invoices} title="Recent Fee Notes" />
      ) : (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>💰</p>
          <p style={{ color: '#64748b' }}>No income recorded yet. Create your first fee note.</p>
        </div>
      )}
    </div>
  );

  /* ============ RENDER: Expenses ============ */
  const renderExpenses = () => (
    <div style={stackGap(16)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, color: NAVY }}>Expenses</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowGoldenList(!showGoldenList)} style={actionBtn('#f59e0b')}>📋 Golden List</button>
          <button onClick={() => setShowAddExpense(true)} style={actionBtn('#ef4444')}>+ Expense</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard label="Total Expenses" value={`Rs. ${fmt(totalExpensesAmt)}`} icon="💸" color="#ef4444" />
        <KPICard label="Entries" value={String(expenses.length)} icon="📝" color="#6366f1" />
        <KPICard label="Net Profit" value={`Rs. ${fmt(totalIncome - totalExpensesAmt)}`} icon="📊" color={totalIncome - totalExpensesAmt >= 0 ? '#10b981' : '#ef4444'} />
      </div>
      {showGoldenList && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>IRD Golden List — Deductible Categories</h3>
          <div style={stackGap(8)}>
            {GOLDEN_LIST.map((cat, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontWeight: 600, color: '#1e293b' }}>{cat.icon} {cat.name}</span>
                <span style={{ fontSize: '0.8125rem', color: '#64748b' }}>{cat.taxNote}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {showAddExpense && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>Add Expense</h3>
          <form onSubmit={handleAddExpense} style={stackGap(12)}>
            <div><label style={labelStyle}>Amount (Rs.)</label><input type="number" step="0.01" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} style={inputStyle} required /></div>
            <div><label style={labelStyle}>Description</label><input value={expenseForm.description} onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} style={inputStyle} /></div>
            <div><label style={labelStyle}>Category</label>
              <select value={expenseForm.category} onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))} style={selectStyle}>
                <option value="">Select category</option>
                {legalExpenseCategories.map(c => <option key={c} value={c}>{c}</option>)}
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
      {expenses.length > 0 ? (
        <TransactionList transactions={expenses} title="Recent Expenses" />
      ) : !showAddExpense && (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '3rem' }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem' }}>💸</p>
          <p style={{ color: '#64748b' }}>No expenses recorded yet.</p>
        </div>
      )}
    </div>
  );

  /* ============ MODALS ============ */
  const renderDiaryModal = () => (
    <div style={modalOverlay} onClick={() => setShowDiaryModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 1.5rem', color: NAVY }}>Add Court Diary Entry</h2>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Date *</label><input type="date" value={newDiary.date} onChange={e => setNewDiary(p => ({ ...p, date: e.target.value }))} style={inputStyle} required /></div>
          <div><label style={labelStyle}>Time</label><input type="time" value={newDiary.time} onChange={e => setNewDiary(p => ({ ...p, time: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Court *</label><input value={newDiary.court} onChange={e => setNewDiary(p => ({ ...p, court: e.target.value }))} style={inputStyle} placeholder="e.g. Colombo High Court" required /></div>
          <div><label style={labelStyle}>Judge</label><input value={newDiary.judge} onChange={e => setNewDiary(p => ({ ...p, judge: e.target.value }))} style={inputStyle} placeholder="Judge name" /></div>
          <div><label style={labelStyle}>Case Number</label><input value={newDiary.caseNumber} onChange={e => setNewDiary(p => ({ ...p, caseNumber: e.target.value }))} style={inputStyle} placeholder="Case reference" /></div>
          <div><label style={labelStyle}>Notes</label><textarea value={newDiary.notes} onChange={e => setNewDiary(p => ({ ...p, notes: e.target.value }))} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Additional notes" /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddDiary} style={primaryBtn}>Add Entry</button>
            <button onClick={() => setShowDiaryModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCaseModal = () => (
    <div style={modalOverlay} onClick={() => setShowCaseModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 1.5rem', color: NAVY }}>Add New Case</h2>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Client Name *</label><input value={newCase.clientName} onChange={e => setNewCase(p => ({ ...p, clientName: e.target.value }))} style={inputStyle} required /></div>
          <div><label style={labelStyle}>Case Title *</label><input value={newCase.caseTitle} onChange={e => setNewCase(p => ({ ...p, caseTitle: e.target.value }))} style={inputStyle} required /></div>
          <div><label style={labelStyle}>Case Number</label><input value={newCase.caseNumber} onChange={e => setNewCase(p => ({ ...p, caseNumber: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Case Type</label>
            <select value={newCase.caseType} onChange={e => setNewCase(p => ({ ...p, caseType: e.target.value as any }))} style={selectStyle}>
              {Object.keys(CASE_TYPE_COLORS).map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Court</label><input value={newCase.court} onChange={e => setNewCase(p => ({ ...p, court: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Judge</label><input value={newCase.judge} onChange={e => setNewCase(p => ({ ...p, judge: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Client Phone (for WhatsApp)</label><input value={newCase.clientPhone} onChange={e => setNewCase(p => ({ ...p, clientPhone: e.target.value }))} style={inputStyle} placeholder="+94 7X XXX XXXX" /></div>
          <div><label style={labelStyle}>Client Email</label><input type="email" value={newCase.clientEmail} onChange={e => setNewCase(p => ({ ...p, clientEmail: e.target.value }))} style={inputStyle} placeholder="client@email.com" /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddCase} style={primaryBtn}>Add Case</button>
            <button onClick={() => setShowCaseModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionModal = () => (
    <div style={modalOverlay} onClick={() => setShowTransactionModal(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 1.5rem', color: NAVY }}>Add Trust Transaction</h2>
        <div style={stackGap(12)}>
          <div><label style={labelStyle}>Type</label>
            <select value={newTransaction.type} onChange={e => setNewTransaction(p => ({ ...p, type: e.target.value as any }))} style={selectStyle}>
              <option value="deposit">Deposit</option><option value="withdrawal">Withdrawal</option><option value="transfer">Transfer</option><option value="fee">Fee Deduction</option>
            </select>
          </div>
          <div><label style={labelStyle}>Amount (Rs.) *</label><input type="number" step="0.01" value={newTransaction.amount} onChange={e => setNewTransaction(p => ({ ...p, amount: e.target.value }))} style={inputStyle} required /></div>
          <div><label style={labelStyle}>Description</label><input value={newTransaction.description} onChange={e => setNewTransaction(p => ({ ...p, description: e.target.value }))} style={inputStyle} /></div>
          <div><label style={labelStyle}>Case</label>
            <select value={newTransaction.caseId} onChange={e => setNewTransaction(p => ({ ...p, caseId: e.target.value }))} style={selectStyle}>
              <option value="">Select case (optional)</option>
              {cases.map(c => <option key={c.id} value={String(c.id)}>{c.caseTitle} - {c.clientName}</option>)}
            </select>
          </div>
          <div><label style={labelStyle}>Date</label><input type="date" value={newTransaction.date} onChange={e => setNewTransaction(p => ({ ...p, date: e.target.value }))} style={inputStyle} /></div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={handleAddTransaction} style={primaryBtn}>Add Transaction</button>
            <button onClick={() => setShowTransactionModal(false)} style={secondaryBtn}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );

  // === RENDER_GROUP_2 START ===

  const renderWallet = (): React.ReactNode => (
    <div style={stackGap(20)}>
      {/* Balance Card */}
      <div style={{
        background: `linear-gradient(135deg, ${NAVY} 0%, #1e3a5f 50%, #0f2940 100%)`,
        borderRadius: 16, padding: isCompactMobile ? '1.1rem' : '2rem', color: 'white',
        boxShadow: `0 4px 20px rgba(15,39,64,0.3)`,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12 }}>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.9, marginBottom: 6 }}>Token Balance</div>
            <div style={{ fontSize: isCompactMobile ? '2rem' : '2.5rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1 }}>
              🪙 {walletData.tokenBalance.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.8rem', opacity: 0.8, marginTop: 8 }}>
              Total spent: LKR {walletData.totalSpentLKR.toLocaleString()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            {walletData.savedCard ? (
              <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '8px 14px' }}>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Saved Card</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {walletData.savedCard.type} •••• {walletData.savedCard.masked}
                </div>
              </div>
            ) : (
              <button onClick={() => window.open('https://wallet.mytracksy.lk/link-card', '_blank')} style={{
                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                color: 'white', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                fontSize: '0.8rem', fontWeight: 600,
              }}>
                🔗 Link Card
              </button>
            )}
          </div>
        </div>
        {walletData.lastTopUp && (
          <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.8rem', opacity: 0.85 }}>
            Last top-up: {walletData.lastTopUp.tokens} tokens (LKR {walletData.lastTopUp.amount.toLocaleString()}) — {new Date(walletData.lastTopUp.date).toLocaleDateString()}
          </div>
        )}
        {walletData.tokenBalance <= 10 && (
          <div style={{ marginTop: 12, background: 'rgba(220,38,38,0.3)', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', fontWeight: 600 }}>
            ⚠️ Low balance! Top up to continue using premium features.
          </div>
        )}
      </div>

      {/* Buy Tokens */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>💳 Buy Token Packages</h3>
        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
          Tokens are used for AI features. Purchase via web portal to avoid app store fees.
        </div>
        <div style={{ ...gridColumns(3) }}>
          {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
            <div key={pkg.id} onClick={() => walletData.oneClickPurchase(pkg.id)} style={{
              padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
              border: pkg.popular ? `2px solid ${GOLD}` : '1px solid #e2e8f0',
              background: pkg.popular ? 'linear-gradient(135deg, #fefce8, #fef9c3)' : '#f8fafc',
              transition: 'all 0.2s', position: 'relative',
            }}>
              {pkg.popular && (
                <div style={{
                  position: 'absolute', top: -10, right: 12,
                  background: GOLD, color: 'white', fontSize: '0.65rem',
                  fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>Popular</div>
              )}
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                {pkg.tokens.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, marginBottom: 8 }}>tokens</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: NAVY }}>
                LKR {pkg.price_lkr.toLocaleString()}
              </div>
              {pkg.savings && (
                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: 4 }}>{pkg.savings}</div>
              )}
              <div style={{ marginTop: 10, fontSize: '0.75rem', color: '#64748b' }}>
                LKR {(pkg.price_lkr / pkg.tokens).toFixed(0)}/token
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, fontSize: '0.78rem', color: '#92400e', border: '1px solid #fde68a' }}>
          💡 <strong>Tax tip:</strong> Token purchases for legal AI tools may qualify as deductible expenses under &quot;IT/Software&quot; category (S.32 ITA).
        </div>
      </div>

      {/* Auto-Reload */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>🔄 Auto-Reload</h3>
        <div style={stackGap(12)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Auto-Reload</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatically top up when balance is low</div>
            </div>
            <button onClick={() => walletData.toggleAutoReload(!walletData.autoReloadEnabled)} style={{
              width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
              background: walletData.autoReloadEnabled ? NAVY : '#cbd5e1',
              position: 'relative', transition: 'background 0.3s',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'white',
                position: 'absolute', top: 3,
                left: walletData.autoReloadEnabled ? 25 : 3,
                transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
              }} />
            </button>
          </div>
          {walletData.autoReloadEnabled && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Reload when below</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: NAVY }}>{walletData.autoReloadThreshold} tokens</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Reload package</span>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: NAVY }}>
                  {TOKEN_PACKAGES.find(p => p.id === walletData.autoReloadPackage)?.label || '100 Tokens'}
                </span>
              </div>
            </>
          )}
          {!walletData.savedCard && walletData.autoReloadEnabled && (
            <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: 8, fontSize: '0.8rem', color: '#991b1b', border: '1px solid #fecaca' }}>
              ⚠️ Link a card first to enable auto-reload. <a href="https://wallet.mytracksy.lk/link-card" target="_blank" rel="noopener noreferrer" style={{ color: NAVY, fontWeight: 600 }}>Link now →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderDocuments = (): React.ReactNode => (
    <div style={stackGap(20)}>
      <div style={cardStyle}>
        <h3 style={cardTitle}>📄 Legal Document Templates</h3>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Generate professional legal documents from templates. Select a template to begin.
        </p>
        <div style={{ ...gridColumns(2) }}>
          {LEGAL_TEMPLATES.map(tpl => (
            <div key={tpl.id} style={{
              padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
              border: activeTemplate?.id === tpl.id ? `2px solid ${NAVY}` : '1px solid #e2e8f0',
              background: activeTemplate?.id === tpl.id ? 'rgba(26,54,93,0.05)' : '#f8fafc',
              transition: 'all 0.2s',
            }} onClick={() => handleOpenTemplate(tpl)}>
              <div style={{ fontSize: '1.1rem', marginBottom: 6 }}>
                {tpl.type === 'fee_note' ? '💰' : tpl.type === 'poa' ? '📋' : tpl.type === 'plaint' ? '⚖️' : tpl.type === 'bail_application' ? '🔓' : '📃'}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY, marginBottom: 4 }}>{tpl.name}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{tpl.description}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 8 }}>
                {tpl.fields.length} fields
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Form Builder */}
      {activeTemplate && (
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ ...cardTitle, margin: 0 }}>📝 {activeTemplate.name}</h3>
            <button onClick={() => { setActiveTemplate(null); setGeneratedDocContent(null); }} style={{ ...actionBtn('#6b7280'), padding: '4px 12px', fontSize: '0.8rem' }}>✕ Close</button>
          </div>
          <div style={stackGap(12)}>
            {activeTemplate.fields.map(field => (
              <div key={field.key}>
                <label style={labelStyle}>{field.label}{field.required ? ' *' : ''}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    value={docFormValues[field.key] || ''}
                    onChange={e => setDocFormValues(p => ({ ...p, [field.key]: e.target.value }))}
                    style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
                    placeholder={field.placeholder || ''}
                  />
                ) : field.type === 'select' ? (
                  <select
                    value={docFormValues[field.key] || ''}
                    onChange={e => setDocFormValues(p => ({ ...p, [field.key]: e.target.value }))}
                    style={selectStyle}
                  >
                    <option value="">Select...</option>
                    {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
                    value={docFormValues[field.key] || ''}
                    onChange={e => setDocFormValues(p => ({ ...p, [field.key]: e.target.value }))}
                    style={inputStyle}
                    placeholder={field.placeholder || ''}
                  />
                )}
              </div>
            ))}

            {/* Fee note line items */}
            {activeTemplate.type === 'fee_note' && (
              <div>
                <label style={labelStyle}>Line Items</label>
                {feeNoteItems.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <input
                      value={item.description}
                      onChange={e => { const arr = [...feeNoteItems]; arr[i].description = e.target.value; setFeeNoteItems(arr); }}
                      style={{ ...inputStyle, flex: 2 }}
                      placeholder="Description"
                    />
                    <input
                      type="number"
                      value={item.amount}
                      onChange={e => { const arr = [...feeNoteItems]; arr[i].amount = e.target.value; setFeeNoteItems(arr); }}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="Amount"
                    />
                    {feeNoteItems.length > 1 && (
                      <button onClick={() => setFeeNoteItems(feeNoteItems.filter((_, j) => j !== i))} style={{ ...actionBtn('#ef4444'), padding: '4px 10px', fontSize: '0.8rem' }}>✕</button>
                    )}
                  </div>
                ))}
                <button onClick={() => setFeeNoteItems([...feeNoteItems, { description: '', amount: '' }])} style={{ ...actionBtn('#6366f1'), padding: '4px 14px', fontSize: '0.8rem' }}>+ Add Item</button>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={handleGenerateDocument} style={primaryBtn}>Generate Document</button>
            </div>
          </div>
        </div>
      )}

      {/* Generated Document Preview */}
      {generatedDocContent && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>📄 Generated Document</h3>
          <pre style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace',
            color: '#1e293b', maxHeight: 500, overflow: 'auto',
          }}>{generatedDocContent}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: '1rem' }}>
            <button onClick={() => {
              const blob = new Blob([generatedDocContent], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${activeTemplate?.name || 'document'}-${new Date().toISOString().split('T')[0]}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }} style={primaryBtn}>📥 Download (.txt)</button>
            <button onClick={() => { navigator.clipboard.writeText(generatedDocContent); }} style={{ ...actionBtn('#6366f1') }}>📋 Copy</button>
          </div>
        </div>
      )}
    </div>
  );

  const renderReports = (): React.ReactNode => {
    const netProfit = totalIncome - totalExpensesAmt;
    return (
      <div style={stackGap(20)}>
        {/* P&L Summary */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>📊 Monthly Profit & Loss Statement</h3>
          <div style={stackGap(8)}>
            <div style={plRow}>
              <span style={{ fontWeight: 600, color: '#22c55e' }}>💰 Total Revenue (Fee Notes)</span>
              <span style={{ fontWeight: 700, color: '#22c55e' }}>Rs. {fmt(totalIncome)}</span>
            </div>
            <div style={{ height: 1, background: '#f1f5f9' }} />
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', margin: '0.375rem 0', letterSpacing: '0.03em' }}>EXPENSES</div>
            {legalExpenseCategories.map((cat) => {
              const catTotal = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.amount, 0);
              if (catTotal === 0) return null;
              return (
                <div key={cat} style={plRow}>
                  <span style={{ color: '#64748b' }}>{cat}</span>
                  <span style={{ color: '#ef4444' }}>(Rs. {fmt(catTotal)})</span>
                </div>
              );
            })}
            <div style={{ height: 1, background: '#1e293b' }} />
            <div style={plRow}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>📈 Net Profit</span>
              <span style={{ fontWeight: 700, fontSize: '1.05rem', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>Rs. {fmt(netProfit)}</span>
            </div>
          </div>
        </div>

        {/* Tax Summary */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>🧾 Tax Summary (Estimated)</h3>
          <div style={{ ...gridColumns(3) }}>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Gross Income</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Rs. {fmt(totalIncome)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Deductible Expenses</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>Rs. {fmt(totalExpensesAmt)}</div>
            </div>
            <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(15,39,64,0.05)', borderRadius: 10, border: '1px solid rgba(15,39,64,0.15)' }}>
              <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Taxable Income (Est.)</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: NAVY }}>Rs. {fmt(netProfit)}</div>
            </div>
          </div>
          <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
            <span style={{ fontSize: '0.8rem', color: '#92400e' }}>⚠️ This is an estimate only. Consult your tax advisor for official APIT / IRD calculations.</span>
          </div>
        </div>

        {/* Quick Reports */}
        <div style={cardStyle}>
          <h3 style={cardTitle}>📋 Available Reports</h3>
          <div style={{ ...gridColumns(2) }}>
            {[
              { name: 'Monthly P&L', icon: '📊', desc: 'Income vs expenses breakdown' },
              { name: 'Tax Summary', icon: '🧾', desc: 'APIT/IRD estimated returns' },
              { name: 'Trust Account', icon: '🏦', desc: 'Client trust fund reconciliation' },
              { name: 'Case Billing', icon: '⚖️', desc: 'Fees billed per case' },
              { name: 'Category Analysis', icon: '📂', desc: 'Expense breakdown by type' },
              { name: 'Court Diary', icon: '📅', desc: 'Upcoming hearings & deadlines' },
            ].map((r) => (
              <div key={r.name} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, cursor: 'pointer', transition: 'background 0.2s', border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                  <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{r.name}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const AI_TOOLS = [
    { id: 'case_research', name: 'Case Research', icon: '🔍', desc: 'AI-powered case law research', cost: 2, placeholder: 'Describe the case facts or legal issue to research...' },
    { id: 'draft_pleading', name: 'Draft Pleading', icon: '📝', desc: 'Auto-generate pleading drafts', cost: 3, placeholder: 'Describe the case type, parties, and relief sought...' },
    { id: 'client_advice', name: 'Client Advice', icon: '💬', desc: 'AI-assisted client response', cost: 1, placeholder: 'Describe the client query or situation...' },
    { id: 'contract_review', name: 'Contract Review', icon: '📋', desc: 'Analyze contracts for risks', cost: 2, placeholder: 'Paste or describe the contract terms to review...' },
    { id: 'legal_summary', name: 'Legal Summary', icon: '📄', desc: 'Summarize long documents', cost: 1, placeholder: 'Paste the legal text to summarize...' },
    { id: 'citation_check', name: 'Citation Check', icon: '✅', desc: 'Verify legal citations', cost: 1, placeholder: 'Enter the citations to verify...' },
  ];

  const renderAI = (): React.ReactNode => (
    <div style={stackGap(20)}>
      <div style={cardStyle}>
        <h3 style={cardTitle}>🤖 AI Legal Assistant</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: `rgba(15,39,64,0.05)`, borderRadius: 10, marginBottom: '1rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🪙</span>
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Token Balance: {walletData.tokenBalance.toLocaleString()}</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Select a tool below and enter your query</div>
          </div>
        </div>
        <div style={{ ...gridColumns(2) }}>
          {AI_TOOLS.map(tool => (
            <div key={tool.id} style={{
              padding: '1rem', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s',
              border: aiToolActive === tool.id ? `2px solid ${NAVY}` : '1px solid #e2e8f0',
              background: aiToolActive === tool.id ? 'rgba(26,54,93,0.05)' : '#f8fafc',
            }} onClick={() => { setAiToolActive(tool.id); setAiResult(null); setAiPrompt(''); }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 6 }}>
                <span style={{ fontSize: '1.1rem' }}>{tool.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: NAVY }}>{tool.name}</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 6 }}>{tool.desc}</div>
              <div style={{ fontSize: '0.7rem', color: GOLD, fontWeight: 600 }}>🪙 {tool.cost} tokens</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Query Input */}
      {aiToolActive && (
        <div style={cardStyle}>
          <h3 style={{ ...cardTitle, margin: 0, marginBottom: '0.75rem' }}>
            {AI_TOOLS.find(t => t.id === aiToolActive)?.icon} {AI_TOOLS.find(t => t.id === aiToolActive)?.name}
          </h3>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder={AI_TOOLS.find(t => t.id === aiToolActive)?.placeholder}
            style={{ ...inputStyle, minHeight: 120, resize: 'vertical', fontFamily: 'inherit' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button
              onClick={() => handleAIQuery(aiToolActive, aiPrompt)}
              disabled={aiLoading || !aiPrompt.trim()}
              style={{ ...primaryBtn, opacity: aiLoading || !aiPrompt.trim() ? 0.6 : 1 }}
            >
              {aiLoading ? '⏳ Processing...' : `🚀 Run Query (${AI_TOOLS.find(t => t.id === aiToolActive)?.cost} tokens)`}
            </button>
            <button onClick={() => { setAiToolActive(null); setAiResult(null); }} style={{ ...actionBtn('#6b7280'), padding: '6px 14px' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* AI Result */}
      {aiResult && (
        <div style={cardStyle}>
          <h3 style={cardTitle}>📋 AI Result</h3>
          <pre style={{
            background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10,
            padding: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit',
            color: '#1e293b', maxHeight: 500, overflow: 'auto',
          }}>{aiResult}</pre>
          <div style={{ display: 'flex', gap: 8, marginTop: '0.75rem' }}>
            <button onClick={() => navigator.clipboard.writeText(aiResult)} style={{ ...actionBtn('#6366f1') }}>📋 Copy</button>
            <button onClick={() => setAiResult(null)} style={{ ...actionBtn('#6b7280') }}>✕ Dismiss</button>
          </div>
        </div>
      )}
    </div>
  );

  const SETTINGS_FIELDS: { key: keyof typeof legalSettings; label: string; icon: string; placeholder: string }[] = [
    { key: 'barNumber', label: 'Bar Association #', icon: '⚖️', placeholder: 'e.g. BASL/2024/1234' },
    { key: 'specialization', label: 'Specialization', icon: '📚', placeholder: 'e.g. Commercial Litigation' },
    { key: 'certificateExpiry', label: 'Practising Certificate Expiry', icon: '📜', placeholder: 'e.g. 2026' },
    { key: 'primaryCourt', label: 'Primary Court', icon: '🏛️', placeholder: 'e.g. Commercial High Court, Colombo' },
    { key: 'chambers', label: 'Chambers Address', icon: '🏢', placeholder: 'e.g. Hulftsdorp Street, Colombo 12' },
    { key: 'indemnityInsurer', label: 'Indemnity Insurer', icon: '🛡️', placeholder: 'e.g. SLIC — Policy Active' },
    { key: 'currency', label: 'Currency', icon: '💱', placeholder: 'e.g. LKR' },
    { key: 'taxYear', label: 'Tax Year', icon: '📋', placeholder: 'e.g. 2025/2026 (April – March)' },
    { key: 'irdTin', label: 'IRD TIN', icon: '🔑', placeholder: 'Required for APIT filing' },
  ];

  const renderSettings = (): React.ReactNode => (
    <div style={stackGap(20)}>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ ...cardTitle, margin: 0 }}>⚙️ Legal Practice Settings</h3>
          {!editingSettings ? (
            <button onClick={() => setEditingSettings(true)} style={{ ...actionBtn(NAVY), padding: '4px 14px', fontSize: '0.8rem' }}>✏️ Edit</button>
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
                <input
                  value={legalSettings[s.key] || ''}
                  onChange={e => setLegalSettings(prev => ({ ...prev, [s.key]: e.target.value }))}
                  placeholder={s.placeholder}
                  style={{ ...inputStyle, flex: 1, minWidth: isCompactMobile ? '100%' : 200 }}
                />
              ) : (
                <span style={{ fontSize: '0.875rem', fontWeight: 500, color: !legalSettings[s.key] ? '#dc2626' : '#334155' }}>
                  {legalSettings[s.key] || 'Not set'}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Settings */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>🪙 Wallet & Billing</h3>
        <div style={stackGap(12)}>
          {[
            { label: 'Token Balance', value: `${walletData.tokenBalance} tokens`, icon: '🪙' },
            { label: 'Saved Payment Card', value: walletData.savedCard ? `${walletData.savedCard.type} •••• ${walletData.savedCard.masked}` : 'Not linked', icon: '💳' },
            { label: 'Auto-Reload', value: walletData.autoReloadEnabled ? 'Enabled' : 'Disabled', icon: '🔄' },
            { label: 'Total Spent', value: `LKR ${walletData.totalSpentLKR.toLocaleString()}`, icon: '💰' },
            { label: 'Tax Deductible (IT/Software)', value: `LKR ${walletData.totalSpentLKR.toLocaleString()} — claim under S.32`, icon: '🧾' },
          ].map((s) => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{s.label}</span>
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: s.value.includes('Not linked') || s.value.includes('Disabled') ? '#dc2626' : '#334155' }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {isCompactMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: '1rem' }}>
          <button onClick={onLogout} style={{ ...actionBtn(NAVY) }}>🚪 Sign Out</button>
          <button onClick={onChangeProfession} style={{ ...actionBtn('#475569') }}>🌐 Web Professions</button>
        </div>
      )}
    </div>
  );

  // === RENDER_GROUP_2 END ===

  const renderContent = () => {
    switch (activeNav) {
      case 'overview': return renderOverview();
      case 'briefing': return <SubscriptionGate featureName="Morning Briefing" featureIcon="🌅"><MorningBriefing /></SubscriptionGate>;
      case 'inbox': return <TransactionInbox />;
      case 'diary': return renderDiary();
      case 'cases': return renderCases();
      case 'trust': return <BiometricGate sectionName="Trust Accounting">{renderTrust()}</BiometricGate>;
      case 'income': return <BiometricGate sectionName="Income & Fee Notes">{renderIncome()}</BiometricGate>;
      case 'expenses': return renderExpenses();
      case 'tax': return <TaxSpeedometer annualPrivateIncome={totalIncome} annualGovIncome={0} annualExpenses={totalExpensesAmt} whtDeducted={0} />;
      case 'receipts': return <ReceiptScanner />;
      case 'documents': return renderDocuments();
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
            style={{ padding: '6px 14px', borderRadius: 20, border: 'none', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
              background: activeNav === item.id ? NAVY : '#f1f5f9', color: activeNav === item.id ? 'white' : '#475569' }}>
            {item.icon} {item.label}
          </button>
        ))}
      </div>
    );
  };

  return (
    <>
      <DashboardLayout
        profession="legal" professionLabel="LexTracksy" professionIcon="⚖️"
        userName={userName} navItems={navItems} activeNav={activeNav}
        onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}
        tokenBalance={walletData.tokenBalance} onWalletClick={() => setActiveNav('wallet')}
        mobileShell={{
          enabled: true, tabs: LEGAL_MOBILE_TABS, activeTab: activeMobileTab,
          onTabChange: handleMobileTabChange, activeTitle: activeNavItem.label,
          activeSubtitle: `${currentDateLabel} • ${userName}`,
        }}
      >
        <>
          {renderMobileSectionNav()}
          {renderContent()}
        </>
      </DashboardLayout>
      {showDiaryModal && renderDiaryModal()}
      {showCaseModal && renderCaseModal()}
      {showTransactionModal && renderTransactionModal()}
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
const plRow: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  fontSize: '0.9375rem', padding: '0.375rem 0',
};
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
  padding: '0.75rem 1.5rem', border: 'none', borderRadius: 10, background: NAVY,
  color: 'white', fontSize: '0.9375rem', fontWeight: 600, cursor: 'pointer',
};
const secondaryBtn: React.CSSProperties = {
  padding: '0.75rem 1.5rem', border: '1.5px solid #e2e8f0', borderRadius: 10, background: 'white',
  color: '#475569', fontSize: '0.9375rem', fontWeight: 500, cursor: 'pointer',
};
const badgeBase: React.CSSProperties = {
  display: 'inline-block', padding: '2px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
};

export default LegalDashboard;
