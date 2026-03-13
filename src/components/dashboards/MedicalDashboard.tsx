import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';
import { useRouteNav } from '../../hooks/useRouteNav';
import VoiceInput, { ParsedVoiceAction } from '../VoiceInput';
import PrescriptionPad from '../PrescriptionPad';
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
import { GOLDEN_LIST, autoCategorizeDr, getCategoryByName, isCapitalItem } from '../../config/goldenListCategories';
import { useAuth } from '../../context/AuthContext';
import { useTokenWallet, TOKEN_PACKAGES, TokenPackage } from '../../hooks/useTokenWallet';
import {
    addTransaction, subscribeTransactions, seedChartOfAccounts,
    subscribeGovIncomeConfig, toCents, fromCents,
} from '../../services/accountingCoreService';
import { useIsCompactMobile } from './useIsCompactMobile';
import { useSubscriptionTier } from '../../hooks/useSubscriptionTier';
import { isFeatureAccessible, getFeatureTierInfo } from '../../config/featureGating';

interface MedicalDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'briefing', label: 'Ward Round', icon: '🌅', premium: true },
    { id: 'inbox', label: 'Inbox', icon: '📥' },
    { id: 'today', label: "Today's Schedule", icon: '🕐' },
    { id: 'quicknotes', label: 'Quick Notes', icon: '📝' },
    { id: 'patients', label: 'Patients', icon: '🧑‍⚕️' },
    { id: 'prescriptions', label: 'Prescriptions', icon: '💊' },
    { id: 'channeling', label: 'Channeling', icon: '🏥' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'income', label: 'Income & Invoices', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'tax', label: 'Tax & IRD', icon: '🧾' },
    { id: 'receipts', label: 'Receipts', icon: '📸' },
    { id: 'banking', label: 'Banking & Cheques', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'export', label: 'Auditor Export', icon: '📦' },
    { id: 'voicevault', label: 'Voice Vault', icon: '🎙️', premium: true },
    { id: 'scheduler', label: 'Smart Scheduler', icon: '📅', premium: true },
    { id: 'lifeadmin', label: 'Life Admin', icon: '📋', premium: true },
    { id: 'wallet', label: 'Token Wallet', icon: '🪙' },
    { id: 'subscription', label: 'Subscription', icon: '⭐' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

type MedicalMobileTabId = 'home' | 'schedule' | 'patientsHub' | 'money' | 'more';

const MEDICAL_MOBILE_TABS: { id: MedicalMobileTabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'schedule', label: 'Schedule', icon: '🗓️' },
    { id: 'patientsHub', label: 'Patients', icon: '🧑‍⚕️' },
    { id: 'money', label: 'Money', icon: '💳' },
    { id: 'more', label: 'More', icon: '☰' },
];

const MEDICAL_MOBILE_GROUPS: Record<MedicalMobileTabId, string[]> = {
    home: ['overview', 'inbox'],
    schedule: ['today', 'appointments', 'briefing', 'scheduler'],
    patientsHub: ['patients', 'prescriptions', 'quicknotes', 'voicevault'],
    money: ['income', 'expenses', 'channeling', 'tax', 'banking', 'reports', 'export', 'wallet'],
    more: ['receipts', 'lifeadmin', 'subscription', 'settings'],
};

const MEDICAL_MOBILE_DEFAULT_NAV: Record<MedicalMobileTabId, string> = {
    home: 'overview',
    schedule: 'today',
    patientsHub: 'patients',
    money: 'income',
    more: 'settings',
};

const MEDICAL_SHORTCUT_NAV: Record<string, string> = {
    overview: 'overview',
    briefing: 'briefing',
    scheduler: 'scheduler',
    voicevault: 'voicevault',
    income: 'income',
    expenses: 'expenses',
    reports: 'reports',
    receipts: 'receipts',
    share: 'receipts',
};

function getMedicalMobileTab(activeNav: string): MedicalMobileTabId {
    const match = MEDICAL_MOBILE_TABS.find(tab => MEDICAL_MOBILE_GROUPS[tab.id].includes(activeNav));
    return match?.id || 'home';
}

// Medical-specific expense categories
// Use GOLDEN_LIST from shared config — legally-grounded tax categories
const medicalExpenseCategories = GOLDEN_LIST.map(c => ({ name: c.name, icon: c.icon, color: c.color }));

// Production-ready: All data comes from Firestore — no hardcoded sample data
// Empty arrays are used as initial state; Firestore subscriptions populate real data

const channelingData: { id: string; hospital: string; day: string; time: string; fee: number; doctorShare: number; hospitalShare: number; avgPatients: number }[] = [];

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    const subscriptionState = useSubscriptionTier();

    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [invoices, setInvoices] = useState<Transaction[]>([]);
    const [expenses, setExpenses] = useState<Transaction[]>([]);
    const [firestoreReady, setFirestoreReady] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, category: GOLDEN_LIST[0].name, date: new Date().toISOString().split('T')[0] });
    const [showGoldenList, setShowGoldenList] = useState(false);
    const [quickNotes, setQuickNotes] = useState<{ id: string; text: string; time: string; patient?: string; type: string }[]>([]);
    const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});
    const [noteText, setNoteText] = useState('');

    // Production state — populated from Firestore, empty by default
    const [samplePatients, setSamplePatients] = useState<{ id: string; name: string; nic: string; phone: string; age: number; blood: string; allergies: string; lastVisit: string; visits: number }[]>([]);
    const [sampleBankAccounts, setSampleBankAccounts] = useState<{ id: string; name: string; bank: string; balance: number; type: string }[]>([]);
    const [sampleCheques, setSampleCheques] = useState<{ id: string; number: string; party: string; amount: number; date: string; type: string; status: string }[]>([]);
    const [appointmentsData, setAppointmentsData] = useState<{ id: string; patient: string; type: string; time: string; hospital: string; date: string; status: 'confirmed' | 'pending' }[]>([]);

    // ===== Dual-Income State (loaded from Firestore config) =====
    const [govSalary, setGovSalary] = useState(0);
    const [datAllowance, setDatAllowance] = useState(0);
    const govMonthly = govSalary + datAllowance;
    const govAnnual = govMonthly * 12;
    const govAPIT = govAnnual > 0 ? Math.round(govAnnual * 0.12) : 0;

    // ===== AUTO-SEED CHART OF ACCOUNTS =====
    useEffect(() => {
        if (!uid) return;
        seedChartOfAccounts(uid, 'medical').catch(err =>
            console.error('Failed to seed chart of accounts:', err)
        );
    }, [uid]);

    // ===== FIRESTORE REAL-TIME SUBSCRIPTIONS (Universal) =====
    useEffect(() => {
        if (!uid) return;

        // Subscribe to cleared income from unified transactions
        const unsubIncome = subscribeTransactions(uid, (txns) => {
            setInvoices(txns.map(t => ({
                id: t.id || '',
                type: 'income' as const,
                amount: fromCents(t.amount_cents),
                description: t.description,
                category: t.category_name || '',
                date: t.date,
                status: (t.status === 'cleared' ? 'paid' : 'pending') as any,
            })));
            setFirestoreReady(true);
        }, { type: 'income', status: 'cleared' });

        // Subscribe to cleared expenses from unified transactions
        const unsubExpenses = subscribeTransactions(uid, (txns) => {
            setExpenses(txns.map(t => ({
                id: t.id || '',
                type: 'expense' as const,
                amount: fromCents(t.amount_cents),
                description: t.description,
                category: t.category_name || '',
                date: t.date,
                status: 'completed',
            })));
        }, { type: 'expense', status: 'cleared' });

        // Subscribe to government income config
        const unsubGov = subscribeGovIncomeConfig(uid, (config) => {
            if (config) {
                if (config.baseSalary) setGovSalary(config.baseSalary);
                if (config.datAllowance) setDatAllowance(config.datAllowance);
            }
        });

        return () => {
            unsubIncome();
            unsubExpenses();
            unsubGov();
        };
    }, [uid]);

    // ===== Channeling Payment Tracker State =====
    const [channelingShifts, setChannelingShifts] = useState<{ id: string; hospital: string; date: string; patients: number; expected: number; status: 'pending' | 'received' | 'overdue'; receivedDate?: string }[]>([]);
    const [showAddShift, setShowAddShift] = useState(false);
    const [shiftForm, setShiftForm] = useState({ hospital: '', date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });

    const walletData = useTokenWallet(uid || '');
    const isCompactMobile = useIsCompactMobile();

    // ===== SUBSCRIPTION-GATED NAV ITEMS =====
    // Decorates each nav item with lock state and tier badge based on user's subscription
    const gatedNavItems = useMemo(() => {
        return navItems.map(item => {
            const tierInfo = getFeatureTierInfo(item.id, 'medical');
            if (!tierInfo) return { ...item, locked: false, tierBadge: '' }; // No gating — available to all

            const accessible = isFeatureAccessible(item.id, subscriptionState.tier, 'medical');
            return {
                ...item,
                locked: !accessible,
                tierBadge: tierInfo.badge,
            };
        });
    }, [subscriptionState.tier]);

    const activeNavItem = useMemo(
        () => gatedNavItems.find(item => item.id === activeNav) || gatedNavItems[0],
        [activeNav, gatedNavItems]
    );
    const activeMobileTab = useMemo(() => getMedicalMobileTab(activeNav), [activeNav]);
    const activeMobileSections = useMemo(
        () => MEDICAL_MOBILE_GROUPS[activeMobileTab].map(navId => gatedNavItems.find(item => item.id === navId)).filter(Boolean) as typeof gatedNavItems,
        [activeMobileTab, gatedNavItems]
    );

    useEffect(() => {
        const applyShortcutFromLocation = () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (!action) return;

            const targetNav = MEDICAL_SHORTCUT_NAV[action];
            if (targetNav) {
                setActiveNav(targetNav);
                params.delete('action');
                const qs = params.toString();
                const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
                window.history.replaceState({}, '', nextUrl);
            }
        };

        applyShortcutFromLocation();
        window.addEventListener('popstate', applyShortcutFromLocation);
        return () => window.removeEventListener('popstate', applyShortcutFromLocation);
    }, []);

    // ===== GATED NAVIGATION HANDLER =====
    // When a locked feature is clicked, redirect to subscription page
    const [_upgradePromptFeature, setUpgradePromptFeature] = useState<string | null>(null);

    const handleGatedNavChange = (navId: string) => {
        const gatedItem = gatedNavItems.find(item => item.id === navId);
        if (gatedItem?.locked) {
            // Show the subscription page with an upgrade prompt
            setUpgradePromptFeature(navId);
            setActiveNav('subscription');
            return;
        }
        setUpgradePromptFeature(null);
        setActiveNav(navId);
    };

    const handleMobileTabChange = (tabId: string) => {
        const nextTab = tabId as MedicalMobileTabId;
        const currentGroup = MEDICAL_MOBILE_GROUPS[nextTab];
        if (currentGroup.includes(activeNav)) return;
        setActiveNav(MEDICAL_MOBILE_DEFAULT_NAV[nextTab]);
    };

    const renderMobileSectionNav = () => {
        if (!isCompactMobile) return null;

        return (
            <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                marginBottom: 14,
                scrollbarWidth: 'none',
            }}>
                {activeMobileSections.map(item => {
                    const active = activeNav === item.id;
                    const isLocked = !!(item as any).locked;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleGatedNavChange(item.id)}
                            style={{
                                border: 'none',
                                borderRadius: 999,
                                padding: '9px 14px',
                                whiteSpace: 'nowrap',
                                background: active ? 'linear-gradient(135deg, #0ea5e9, #2563eb)' : isLocked ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.88)',
                                color: active ? 'white' : isLocked ? '#b45309' : '#475569',
                                boxShadow: active ? '0 8px 18px rgba(37,99,235,0.22)' : 'inset 0 0 0 1px rgba(226,232,240,0.92)',
                                fontSize: 12.5,
                                fontWeight: active ? 700 : 600,
                                minHeight: 38,
                                cursor: 'pointer',
                                opacity: isLocked ? 0.7 : 1,
                            }}
                        >
                            {isLocked ? '🔒' : item.icon} {item.label}
                            {isLocked && <span style={{ fontSize: 9, fontWeight: 800, background: '#f59e0b', color: '#1e1b4b', padding: '0 4px', borderRadius: 3, marginLeft: 4 }}>PRO</span>}
                        </button>
                    );
                })}
            </div>
        );
    };

    const handleVoiceAction = (action: ParsedVoiceAction) => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toISOString().split('T')[0];
        switch (action.intent) {
            case 'income': {
                const t: Transaction = { id: `v-${Date.now()}`, type: 'income', amount: action.amount || 0, description: action.description || 'Voice entry', category: action.category || 'Consultation', date: dateStr, status: 'paid' };
                setInvoices(prev => [t, ...prev]);
                break;
            }
            case 'expense': {
                const t: Transaction = { id: `v-${Date.now()}`, type: 'expense', amount: action.amount || 0, description: action.description || 'Voice entry', category: action.category || 'Office Supplies', date: dateStr, status: 'completed' };
                setExpenses(prev => [t, ...prev]);
                break;
            }
            case 'note': {
                setQuickNotes(prev => [{ id: `qn-${Date.now()}`, text: action.description || action.raw, time: timeStr, patient: action.patient, type: 'note' }, ...prev]);
                setActiveNav('quicknotes');
                break;
            }
            case 'appointment': {
                setActiveNav('appointments');
                break;
            }
            default: break;
        }
    };

    const handleCreateInvoice = (invoice: InvoiceData) => {
        const newInvoice: Transaction = {
            id: `inv-${Date.now()}`,
            type: 'income',
            amount: invoice.amount,
            description: `${invoice.serviceType} — ${invoice.patientName}`,
            category: invoice.serviceType,
            date: invoice.date,
            status: invoice.status,
        };
        setInvoices((prev) => [newInvoice, ...prev]);
        setShowInvoiceForm(false);

        // Persist to Firestore (Universal Accounting Core)
        if (uid) {
            addTransaction(uid, {
                date: invoice.date,
                amount_cents: toCents(invoice.amount),
                type: 'income',
                status: 'cleared',
                source: 'manual_entry',
                vendor: invoice.hospital || '',
                category_id: '',
                category_name: invoice.serviceType,
                description: `${invoice.serviceType} — ${invoice.patientName}`,
                metadata: { wht_deducted_cents: toCents(Math.round(invoice.amount * 0.05)) },
            }).catch(err => console.error('Failed to save income:', err));
        }
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.description || !expenseForm.amount) return;
        const newExpense: Transaction = {
            id: `exp-${Date.now()}`,
            type: 'expense',
            amount: expenseForm.amount,
            description: expenseForm.description,
            category: expenseForm.category,
            date: expenseForm.date,
            status: 'completed',
        };
        setExpenses((prev) => [newExpense, ...prev]);
        setShowAddExpense(false);
        setExpenseForm({ description: '', amount: 0, category: GOLDEN_LIST[0].name, date: new Date().toISOString().split('T')[0] });

        // Persist to Firestore (Universal Accounting Core)
        if (uid) {
            addTransaction(uid, {
                date: expenseForm.date,
                amount_cents: toCents(expenseForm.amount),
                type: 'expense',
                status: 'cleared',
                source: 'manual_entry',
                vendor: '',
                category_id: '',
                category_name: expenseForm.category,
                description: expenseForm.description,
                metadata: { is_capital_item: isCapitalItem(expenseForm.category) },
            }).catch(err => console.error('Failed to save expense:', err));
        }
    };
    const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length;

    const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
    const gridColumns = (desktop: string, mobile = '1fr') => isCompactMobile ? mobile : desktop;
    const stackGap = isCompactMobile ? '0.85rem' : '1rem';
    const currentDateLabel = new Date().toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' });

    // Private income calculations
    const privateIncome = invoices.reduce((s, t) => s + t.amount, 0);
    const privateAnnual = privateIncome * 12;
    const totalWHT = Math.round(privateAnnual * 0.05);

    // ===== FEATURE GATE WRAPPER =====
    // Wraps content of pro-only features with a gate that checks subscription
    const renderFeatureGated = (featureId: string, featureName: string, featureIcon: string, content: React.ReactNode) => {
        if (!isFeatureAccessible(featureId, subscriptionState.tier, 'medical')) {
            return (
                <SubscriptionGate featureName={featureName} featureIcon={featureIcon}>
                    {content}
                </SubscriptionGate>
            );
        }
        return <>{content}</>;
    };

    const renderContent = () => {
        switch (activeNav) {
            case 'overview':
                return renderOverview();
            case 'inbox':
                return <TransactionInbox uid={uid} />;
            case 'briefing':
                return renderFeatureGated('briefing', 'Ward Round AI Briefing', '🌅', <MorningBriefing />);
            case 'voicevault':
                return (
                    <BiometricGate sectionName="Voice Vault" sectionIcon="🎙️">
                        <SubscriptionGate featureName="AI Voice Vault" featureIcon="🎙️">
                            <AIVoiceVault />
                        </SubscriptionGate>
                    </BiometricGate>
                );
            case 'scheduler':
                return renderFeatureGated('scheduler', 'Smart Scheduler', '📅', <SmartScheduler />);
            case 'lifeadmin':
                return renderFeatureGated('lifeadmin', 'Life Admin', '📋', <LifeAdmin />);
            case 'today':
                return renderTodaySchedule();
            case 'quicknotes':
                return renderQuickNotes();
            case 'patients':
                return renderPatients();
            case 'prescriptions':
                return renderFeatureGated('prescriptions', 'Prescription Manager', '💊', <PrescriptionPad />);
            case 'channeling':
                return renderChanneling();
            case 'appointments':
                return renderAppointments();
            case 'income':
                return <BiometricGate sectionName="Income & Invoices" sectionIcon="💰">{renderIncome()}</BiometricGate>;
            case 'expenses':
                return <BiometricGate sectionName="Expenses" sectionIcon="💸">{renderExpenses()}</BiometricGate>;
            case 'tax':
                return renderFeatureGated('tax', 'Tax Automation & IRD Filing', '🧾', <TaxSpeedometer annualPrivateIncome={privateAnnual} annualGovIncome={govAnnual} annualExpenses={totalExpenses * 12} whtDeducted={totalWHT} />);
            case 'receipts':
                return <ReceiptScanner />;
            case 'banking':
                return renderBanking();
            case 'reports':
                return renderFeatureGated('reports', 'Advanced Reports', '📊', renderReports());
            case 'export':
                return renderFeatureGated('export', 'Auditor Export', '📤', <AuditorExport invoices={invoices} expenses={expenses} />);
            case 'wallet':
                return renderWallet();
            case 'settings':
                return renderSettings();
            case 'subscription':
                return <SubscriptionManager />;
            default:
                return renderOverview();
        }
    };

    /* ========== TODAY'S SCHEDULE ========== */
    const renderTodaySchedule = () => {
        const govSchedule = [
            { time: '8:00 AM', activity: 'Ward Round — General Ward', type: 'gov', status: 'completed' },
            { time: '9:30 AM', activity: 'OPD Clinic', type: 'gov', status: 'completed' },
            { time: '11:00 AM', activity: 'Theatre — Appendectomy', type: 'gov', status: 'completed' },
            { time: '1:00 PM', activity: 'Lunch Break', type: 'break', status: 'completed' },
        ];
        const privateSchedule = [
            { time: '4:00 PM', activity: 'Asiri Central — Channeling', type: 'private', status: 'active', patients: 15 },
            { time: '7:30 PM', activity: 'Travel to Lanka Hospitals', type: 'travel', status: 'upcoming' },
            { time: '8:00 PM', activity: 'Lanka Hospitals — Channeling', type: 'private', status: 'upcoming', patients: 8 },
        ];
        const allSlots = [...govSchedule, ...privateSchedule];
        const completedCount = allSlots.filter(s => s.status === 'completed').length;
        const todayEarnings = 37500;
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.2rem' }}>
                    <KPICard icon="🏥" label="Gov Hospital" value="Done" change="4 activities" changeType="up" color="#22c55e" compact={isCompactMobile} />
                    <KPICard icon="🩺" label="Private Clinics" value="2 sessions" change="23 patients est." changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="💰" label="Today's Earnings" value={fmt(todayEarnings)} change="So far" changeType="up" color="#f59e0b" compact={isCompactMobile} />
                    <KPICard icon="✅" label="Completed" value={`${completedCount}/${allSlots.length}`} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                </div>

                {/* Timeline */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>🕐 Today's Timeline — {new Date().toLocaleDateString('en-LK', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                    <div style={{ position: 'relative', paddingLeft: isCompactMobile ? 24 : 30 }}>
                        {/* Timeline line */}
                        <div style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #22c55e, #6366f1)' }} />

                        {/* Gov section header */}
                        <div style={{ padding: '8px 0 4px', fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏛️ Government Hospital</div>
                        {govSchedule.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: s.status === 'completed' ? '#22c55e' : '#e2e8f0', border: '2px solid white', boxShadow: '0 0 0 2px ' + (s.status === 'completed' ? '#22c55e' : '#e2e8f0') }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', minWidth: isCompactMobile ? 'unset' : 65 }}>{s.time}</div>
                                <div style={{ fontSize: isCompactMobile ? 13.5 : 14.5, fontWeight: 500, color: s.status === 'completed' ? '#64748b' : '#1e293b', textDecoration: s.status === 'completed' ? 'line-through' : 'none' }}>{s.activity}</div>
                                {s.status === 'completed' && <span style={{ fontSize: 11, background: '#dcfce7', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ Done</span>}
                            </div>
                        ))}

                        {/* Private section header */}
                        <div style={{ padding: '12px 0 4px', fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🩺 Private Practice</div>
                        {privateSchedule.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: s.status === 'active' ? '#f59e0b' : s.status === 'completed' ? '#22c55e' : '#e2e8f0', border: '2px solid white', boxShadow: '0 0 0 2px ' + (s.status === 'active' ? '#f59e0b' : '#e2e8f0'), animation: s.status === 'active' ? 'voicePulse 2s infinite' : 'none' }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: s.status === 'active' ? '#d97706' : '#64748b', minWidth: isCompactMobile ? 'unset' : 65 }}>{s.time}</div>
                                <div style={{ fontSize: 14, fontWeight: s.status === 'active' ? 700 : 500, color: s.status === 'active' ? '#1e293b' : '#64748b' }}>{s.activity}</div>
                                {'patients' in s && <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{(s as any).patients} patients</span>}
                                {s.status === 'active' && <span style={{ fontSize: 11, background: '#fef3c7', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>🔴 NOW</span>}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    /* ========== QUICK NOTES ========== */
    const renderQuickNotes = () => {
        const noteTypes: Record<string, { icon: string; color: string }> = {
            vitals: { icon: '❤️', color: '#ef4444' },
            'follow-up': { icon: '🔁', color: '#3b82f6' },
            referral: { icon: '↗️', color: '#8b5cf6' },
            note: { icon: '📝', color: '#6366f1' },
            prescription: { icon: '💊', color: '#22c55e' },
        };
        const addNote = () => {
            if (!noteText.trim()) return;
            const now = new Date();
            setQuickNotes(prev => [{ id: `qn-${Date.now()}`, text: noteText, time: now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }), type: 'note' }, ...prev]);
            setNoteText('');
        };
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.2rem' }}>
                    <KPICard icon="📝" label="Total Notes" value={String(quickNotes.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="❤️" label="Vitals" value={String(quickNotes.filter(n => n.type === 'vitals').length)} changeType="neutral" color="#ef4444" compact={isCompactMobile} />
                    <KPICard icon="🔁" label="Follow-ups" value={String(quickNotes.filter(n => n.type === 'follow-up').length)} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                </div>

                {/* Add Note */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                    <h3 style={{ ...cardTitle, margin: '0 0 0.5rem' }}>📝 Add Quick Note</h3>
                    <div style={{ display: 'flex', gap: 8, flexDirection: isCompactMobile ? 'column' : 'row' }}>
                        <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} placeholder="Type a note or use the mic button →" style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                        <button onClick={addNote} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                    </div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>💡 Tip: Use the floating 🎤 button to add notes by voice — say "Note: BP 140 over 90"</div>
                </div>

                {/* Notes List */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>📋 Recent Notes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {quickNotes.map(note => {
                            const nt = noteTypes[note.type] || noteTypes.note;
                            return (
                                <div key={note.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${nt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{nt.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', lineHeight: 1.5 }}>{note.text}</div>
                                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 5, display: 'flex', gap: 12 }}>
                                            <span>🕐 {note.time}</span>
                                            {note.patient && <span>🧑‍⚕️ {note.patient}</span>}
                                            <span style={{ background: `${nt.color}15`, color: nt.color, padding: '1px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{note.type}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setQuickNotes(prev => prev.filter(n => n.id !== note.id))} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 4, fontWeight: 600 }}>✕</button>
                                </div>
                            );
                        })}
                        {quickNotes.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#64748b', fontSize: 14 }}>No notes yet. Use voice or type above to add notes.</div>}
                    </div>
                </div>
            </div>
        );
    };

    /* ========== OVERVIEW (Dual-Income Dashboard) ========== */
    const renderOverview = () => {
        const govNetMonthly = govMonthly - Math.round(govAPIT / 12);
        const privateNet = totalIncome; // Monthly private
        const totalTakeHome = govNetMonthly + privateNet - totalExpenses;
        const overdueCount = channelingShifts.filter(s => s.status === 'overdue').length;
        const pendingAmount = channelingShifts.filter(s => s.status === 'pending').reduce((s, c) => s + c.expected, 0);
        const overdueAmount = channelingShifts.filter(s => s.status === 'overdue').reduce((s, c) => s + c.expected, 0);

        return (
            <div>
                {/* ===== Dual-Income Split ===== */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    {/* Government Bucket */}
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, background: 'linear-gradient(135deg, #065f46, #047857)', color: 'white', borderColor: '#059669' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, opacity: 0.9 }}>🏛️ Government Income</h3>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>Employment</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr'), gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>MoH Base Salary</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(govSalary)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>DAT Allowance</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(datAllowance)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>APIT Deducted (Monthly)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(Math.round(govAPIT / 12))}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Net Take-Home</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{fmt(govNetMonthly)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Private Bucket */}
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, background: 'linear-gradient(135deg, #312e81, #4338ca)', color: 'white', borderColor: '#6366f1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, opacity: 0.9 }}>🩺 Private Practice Income</h3>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>Business</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr'), gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Channeling/Clinic</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(totalIncome)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>WHT Deducted (5%)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(Math.round(totalIncome * 0.05))}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Practice Expenses</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(totalExpenses)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Net Private Income</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{fmt(privateNet - Math.round(totalIncome * 0.05) - totalExpenses)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Wealth Strip */}
                <div style={{ ...cardStyle, marginBottom: '1.25rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: isCompactMobile ? 12 : 0, padding: isCompactMobile ? '1rem' : '1rem 1.5rem' }}>
                    <div>
                        <div style={{ fontSize: 12, opacity: 0.6 }}>💎 Total Monthly Take-Home Wealth</div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{fmt(totalTakeHome)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Gov %</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{Math.round((govNetMonthly / (govNetMonthly + privateNet)) * 100)}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Private %</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{Math.round((privateNet / (govNetMonthly + privateNet)) * 100)}%</div>
                        </div>
                    </div>
                </div>

                {/* Missing Money Alert */}
                {(overdueCount > 0) && (
                    <div style={{ ...cardStyle, marginBottom: '1.5rem', background: '#fef2f2', border: '2px solid #fecaca', cursor: 'pointer' }} onClick={() => setActiveNav('channeling')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 28, animation: 'voicePulse 2s infinite' }}>🚨</div>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#991b1b' }}>Missing Money Alert — {overdueCount} unpaid shift{overdueCount > 1 ? 's' : ''}</div>
                                <div style={{ fontSize: 13, color: '#b91c1c' }}>{fmt(overdueAmount)} overdue from hospitals. {fmt(pendingAmount)} still pending. Tap to review →</div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, minmax(0, 1fr))', '1fr 1fr'), gap: 10, marginBottom: '1.25rem' }}>
                    <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>+ Create Invoice</button>
                    <button onClick={() => { setActiveNav('expenses'); setShowAddExpense(true); }} style={actionBtn('#ef4444')}>+ Add Expense</button>
                    <button onClick={() => setActiveNav('quicknotes')} style={actionBtn('#8b5cf6')}>📝 Quick Note</button>
                    <button onClick={() => setActiveNav('today')} style={actionBtn('#f59e0b')}>🕐 Today</button>
                    <button onClick={() => setActiveNav('tax')} style={actionBtn('#06b6d4')}>🧾 Tax & IRD</button>
                    <button onClick={() => setActiveNav('receipts')} style={actionBtn('#22c55e')}>📸 Scan Receipt</button>
                    <button onClick={() => setActiveNav('export')} style={actionBtn('#1e293b')}>📦 Auditor Export</button>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1.5fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                        <h3 style={cardTitle}>📊 Income vs Expenses (Last 6 Months)</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 180, padding: '1rem 0' }}>
                            {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, i) => {
                                const incomeH = [65, 72, 58, 80, 75, 85];
                                const expenseH = [30, 35, 40, 28, 32, 36];
                                return (
                                    <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                        <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 150 }}>
                                            <div style={{ width: 16, height: `${incomeH[i]}%`, background: 'linear-gradient(to top, #22c55e, #4ade80)', borderRadius: 4 }} />
                                            <div style={{ width: 16, height: `${expenseH[i]}%`, background: 'linear-gradient(to top, #ef4444, #f87171)', borderRadius: 4 }} />
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Income</span>
                            <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>● Expenses</span>
                        </div>
                    </div>

                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                        <h3 style={cardTitle}>📂 Expense Categories</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
                            {medicalExpenseCategories.slice(0, 5).map((cat, i) => {
                                const amounts = [35000, 12000, 8500, 5200, 3000];
                                const pct = [45, 30, 20, 12, 8];
                                return (
                                    <div key={cat.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{cat.icon} {cat.name}</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{fmt(amounts[i])}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                            <div style={{ height: '100%', width: `${pct[i]}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <TransactionList transactions={[...invoices, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)} title="Recent Transactions" compact={isCompactMobile} />
            </div>
        );
    };

    /* ========== PATIENTS ========== */
    const renderPatients = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                <KPICard icon="🧑‍⚕️" label="Total Patients" value={String(samplePatients.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                <KPICard icon="📅" label="This Month" value="12" change="+4" changeType="up" color="#22c55e" compact={isCompactMobile} />
                <KPICard icon="🔁" label="Returning" value={String(samplePatients.filter(p => p.visits > 5).length)} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                <KPICard icon="⚠️" label="Allergies Noted" value={String(samplePatients.filter(p => p.allergies !== 'None').length)} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
            </div>
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ ...cardTitle, margin: 0 }}>🧑‍⚕️ Patient Registry</h3>
                    <button style={actionBtn('#6366f1')}>+ Add Patient</button>
                </div>
                {isCompactMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {samplePatients.map(p => (
                            <div key={p.id} style={{ padding: '14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{p.name}</div>
                                        <div style={{ fontSize: 11.5, color: '#6366f1', fontFamily: 'monospace' }}>{p.nic}</div>
                                    </div>
                                    <span style={{ padding: '3px 9px', borderRadius: 999, fontSize: 11.5, fontWeight: 700, background: '#fef2f2', color: '#dc2626' }}>{p.blood}</span>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5, color: '#475569' }}>
                                    <div>📞 {p.phone}</div>
                                    <div>🎂 {p.age} yrs</div>
                                    <div>🗓️ {p.lastVisit}</div>
                                    <div>🔁 {p.visits} visits</div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 12.5, color: p.allergies !== 'None' ? '#ef4444' : '#64748b', fontWeight: p.allergies !== 'None' ? 600 : 500 }}>
                                    Allergies: {p.allergies}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            {['Name', 'NIC', 'Phone', 'Age', 'Blood', 'Allergies', 'Last Visit', 'Visits'].map(h => (
                                <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{samplePatients.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{p.name}</td>
                                <td style={{ padding: '0.5rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.nic}</td>
                                <td style={{ padding: '0.5rem' }}>{p.phone}</td>
                                <td style={{ padding: '0.5rem' }}>{p.age}</td>
                                <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626' }}>{p.blood}</span></td>
                                <td style={{ padding: '0.5rem', color: p.allergies !== 'None' ? '#ef4444' : '#64748b', fontWeight: p.allergies !== 'None' ? 600 : 400 }}>{p.allergies}</td>
                                <td style={{ padding: '0.5rem', color: '#64748b' }}>{p.lastVisit}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#6366f1' }}>{p.visits}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
    );

    /* ========== CHANNELING + PAYMENT TRACKER ========== */
    const renderChanneling = () => {
        const totalMonthlyEst = channelingData.reduce((s, c) => s + (c.doctorShare * c.avgPatients * 4), 0);
        const wht = Math.round(totalMonthlyEst * 0.05);
        const pendingShifts = channelingShifts.filter(s => s.status === 'pending');
        const overdueShifts = channelingShifts.filter(s => s.status === 'overdue');
        const receivedShifts = channelingShifts.filter(s => s.status === 'received');
        const pendingTotal = pendingShifts.reduce((s, c) => s + c.expected, 0);
        const overdueTotal = overdueShifts.reduce((s, c) => s + c.expected, 0);
        const receivedTotal = receivedShifts.reduce((s, c) => s + c.expected, 0);

        const handleAddShift = (e: React.FormEvent) => {
            e.preventDefault();
            if (!shiftForm.patients || !shiftForm.expected) return;
            setChannelingShifts(prev => [{ id: `cs-${Date.now()}`, hospital: shiftForm.hospital, date: shiftForm.date, patients: shiftForm.patients, expected: shiftForm.expected, status: 'pending' }, ...prev]);
            setShowAddShift(false);
            setShiftForm({ hospital: channelingData.length > 0 ? channelingData[0].hospital : '', date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });
        };

        const markReceived = (id: string) => setChannelingShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'received' as const, receivedDate: new Date().toISOString().split('T')[0] } : s));

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <KPICard icon="🏥" label="Centers" value={String(channelingData.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="💰" label="Est. Monthly" value={fmt(totalMonthlyEst)} changeType="up" color="#22c55e" compact={isCompactMobile} />
                    <KPICard icon="⏳" label="Pending" value={fmt(pendingTotal)} change={`${pendingShifts.length} shifts`} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
                    <KPICard icon="🚨" label="Overdue" value={fmt(overdueTotal)} change={overdueShifts.length > 0 ? `${overdueShifts.length} unpaid!` : 'All clear'} changeType={overdueShifts.length > 0 ? 'down' : 'up'} color="#ef4444" compact={isCompactMobile} />
                </div>

                {/* ===== PAYMENT TRACKER ===== */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12, marginBottom: '0.75rem' }}>
                        <h3 style={{ ...cardTitle, margin: 0 }}>💸 Payment Tracker — "Missing Money" Finder</h3>
                        <button onClick={() => setShowAddShift(true)} style={actionBtn('#6366f1')}>+ Log Shift</button>
                    </div>

                    {/* Add Shift Form */}
                    {showAddShift && (
                        <form onSubmit={handleAddShift} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr 1fr 1fr'), gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Hospital</label>
                                    <select value={shiftForm.hospital} onChange={e => setShiftForm(p => ({ ...p, hospital: e.target.value }))} style={inputStyle}>
                                        {channelingData.map(c => <option key={c.id} value={c.hospital}>{c.hospital}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" value={shiftForm.date} onChange={e => setShiftForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Patients Seen</label>
                                    <input type="number" value={shiftForm.patients || ''} onChange={e => setShiftForm(p => ({ ...p, patients: parseInt(e.target.value) || 0 }))} placeholder="15" style={inputStyle} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Expected (Rs.)</label>
                                    <input type="number" value={shiftForm.expected || ''} onChange={e => setShiftForm(p => ({ ...p, expected: parseFloat(e.target.value) || 0 }))} placeholder="30000" style={inputStyle} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.75rem', flexDirection: isCompactMobile ? 'column-reverse' : 'row' }}>
                                <button type="button" onClick={() => setShowAddShift(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                                <button type="submit" style={actionBtn('#22c55e')}>✅ Log Shift</button>
                            </div>
                        </form>
                    )}

                    {/* Overdue Shifts (RED) */}
                    {overdueShifts.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', marginBottom: 6 }}>🚨 Overdue — Call Hospital Accounts</div>
                            {overdueShifts.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1.5px solid #fecaca', marginBottom: 6, animation: 'voicePulse 3s infinite' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b' }}>{s.hospital}</div>
                                        <div style={{ fontSize: 12, color: '#b91c1c' }}>{s.date} · {s.patients} patients · Expected: {fmt(s.expected)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                        <button onClick={() => markReceived(s.id)} style={{ padding: '5px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✅ Received</button>
                                        <a href="tel:" style={{ padding: '5px 12px', background: '#ef4444', color: 'white', borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>📞 Call</a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Pending Shifts (YELLOW) */}
                    {pendingShifts.length > 0 && (
                        <div style={{ marginBottom: '0.75rem' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 6 }}>⏳ Pending Payments</div>
                            {pendingShifts.map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', marginBottom: 6 }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#92400e' }}>{s.hospital}</div>
                                        <div style={{ fontSize: 12, color: '#a16207' }}>{s.date} · {s.patients} patients · Expected: {fmt(s.expected)}</div>
                                    </div>
                                    <button onClick={() => markReceived(s.id)} style={{ padding: '5px 12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✅ Received</button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Received Shifts (GREEN) */}
                    {receivedShifts.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: 6 }}>✅ Confirmed Payments</div>
                            {receivedShifts.slice(0, 3).map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7', marginBottom: 4 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>{s.hospital}</div>
                                        <div style={{ fontSize: 12, color: '#15803d' }}>{s.date} · {s.patients} pts · Deposited: {s.receivedDate}</div>
                                    </div>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>✓ {fmt(s.expected)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Monthly Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)', '1fr'), gap: '0.75rem', marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Expected</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{fmt(pendingTotal + overdueTotal + receivedTotal)}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Received</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e' }}>{fmt(receivedTotal)}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, color: '#64748b' }}>Outstanding</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#ef4444' }}>{fmt(pendingTotal + overdueTotal)}</div>
                        </div>
                    </div>
                </div>

                {/* Original Channeling Schedule */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>🏥 Channeling Schedule & Fee Split</h3>
                    {isCompactMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {channelingData.map(c => (
                                <div key={c.id} style={{ padding: '14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{c.hospital}</div>
                                            <div style={{ fontSize: 12, color: '#6366f1' }}>{c.day} • {c.time}</div>
                                        </div>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#3b82f6' }}>{c.avgPatients} pts</div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                                        <div>Fee: <strong>{fmt(c.fee)}</strong></div>
                                        <div>Doctor: <strong style={{ color: '#22c55e' }}>{fmt(c.doctorShare)}</strong></div>
                                        <div>Hospital: <strong style={{ color: '#64748b' }}>{fmt(c.hospitalShare)}</strong></div>
                                        <div>Average: <strong>{c.avgPatients} patients</strong></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {['Hospital/Clinic', 'Day', 'Time', 'Fee', 'Doctor Share', 'Hospital Share', 'Avg Patients'].map(h => (
                                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>{channelingData.map(c => (
                                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.hospital}</td>
                                    <td style={{ padding: '0.5rem' }}>{c.day}</td>
                                    <td style={{ padding: '0.5rem', color: '#6366f1' }}>{c.time}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(c.fee)}</td>
                                    <td style={{ padding: '0.5rem', color: '#22c55e', fontWeight: 600 }}>{fmt(c.doctorShare)}</td>
                                    <td style={{ padding: '0.5rem', color: '#64748b' }}>{fmt(c.hospitalShare)}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#3b82f6' }}>{c.avgPatients}</td>
                                </tr>
                            ))}</tbody>
                        </table>
                    )}
                </div>
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginTop: '1rem', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <h3 style={{ ...cardTitle, color: '#92400e' }}>🧾 WHT (Withholding Tax) Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)'), gap: stackGap }}>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>Gross Channeling Income</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(totalMonthlyEst)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>WHT Deducted (5%)</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ef4444' }}>({fmt(wht)})</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>Net After WHT</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#22c55e' }}>{fmt(totalMonthlyEst - wht)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#92400e' }}>
                        ⚠️ Hospitals deduct 5% WHT on channeling fees (IRD requirement). Claim credit on your APIT return.
                    </div>
                </div>
            </div>
        );
    };

    /* ========== APPOINTMENTS ========== */
    const renderAppointments = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const today = appointmentsData.filter(a => a.date === todayStr);
        const upcoming = appointmentsData.filter(a => a.date > todayStr);
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <KPICard icon="📅" label="Today" value={String(today.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="📋" label="This Week" value={String(appointmentsData.length)} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                    <KPICard icon="✅" label="Confirmed" value={String(appointmentsData.filter(a => a.status === 'confirmed').length)} changeType="up" color="#22c55e" compact={isCompactMobile} />
                    <KPICard icon="⏳" label="Pending" value={String(appointmentsData.filter(a => a.status === 'pending').length)} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
                </div>
                {/* Today's appointments */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1rem' }}>
                    <h3 style={cardTitle}>📅 Today's Appointments — {today.length > 0 ? today[0].hospital : 'No appointments'}</h3>
                    {today.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', fontSize: '1.1rem' }}>
                                    {a.type === 'Follow-up' ? '🔁' : a.type === 'Lab Review' ? '🔬' : '🩺'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{a.patient}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{a.type} · {a.time}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                                {['arrived', 'completed', 'no-show'].map(s => {
                                    const current = appointmentStatuses[a.id] || a.status;
                                    const isActive = current === s;
                                    const colors: Record<string, string> = { arrived: '#3b82f6', completed: '#22c55e', 'no-show': '#ef4444' };
                                    const icons: Record<string, string> = { arrived: '👋', completed: '✅', 'no-show': '❌' };
                                    return (
                                        <button key={s} onClick={() => setAppointmentStatuses(prev => ({ ...prev, [a.id]: s }))}
                                            style={{ padding: '5px 10px', borderRadius: 7, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', border: isActive ? 'none' : '1px solid #e2e8f0', background: isActive ? `${colors[s]}15` : '#f8fafc', color: isActive ? colors[s] : '#64748b', transition: 'all 0.15s' }}>
                                            {icons[s]} {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Upcoming */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>📋 Upcoming Appointments</h3>
                    {upcoming.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{a.patient} — <span style={{ color: '#6366f1' }}>{a.type}</span></div>
                                <div style={{ fontSize: '0.84rem', color: '#64748b' }}>{a.hospital} · {a.date} · {a.time}</div>
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 600, background: a.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: a.status === 'confirmed' ? '#16a34a' : '#d97706' }}>{a.status}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    /* ========== INCOME & INVOICES ========== */
    const renderIncome = () => (
        <div>
            {/* Income KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                <KPICard icon="💰" label="Total Income" value={fmt(totalIncome)} change="+12.5%" changeType="up" color="#22c55e" compact={isCompactMobile} />
                <KPICard icon="📋" label="Pending Invoices" value={String(pendingInvoices)} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
                <KPICard icon="⚠️" label="Overdue" value={String(invoices.filter((i) => i.status === 'overdue').length)} changeType="down" color="#ef4444" compact={isCompactMobile} />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#22c55e')}>+ Create Invoice</button>
            </div>

            {/* Income Sources */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🏥 Income by Source</h3>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { name: 'Asiri Hospital', amount: 125000, color: '#6366f1' },
                        { name: 'Lanka Hospitals', amount: 185000, color: '#8b5cf6' },
                        { name: 'Private Clinic', amount: 95000, color: '#22c55e' },
                        { name: 'Consultancy', amount: 45000, color: '#06b6d4' },
                    ].map((src) => (
                        <div key={src.name} style={{ padding: '0.75rem', background: `${src.color}08`, borderRadius: 10, border: `1px solid ${src.color}20` }}>
                            <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 5, fontWeight: 500 }}>{src.name}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{fmt(src.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice List */}
            <TransactionList transactions={invoices} title="Invoices" showFilter={false} compact={isCompactMobile} />
        </div>
    );

    /* ========== EXPENSES ========== */
    const renderExpenses = () => {
        const selectedCat = getCategoryByName(expenseForm.category);
        return (
            <div>
                {/* Expense KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <KPICard icon="💸" label="Total Expenses" value={fmt(totalExpenses)} change="-3.2%" changeType="down" color="#ef4444" compact={isCompactMobile} />
                    <KPICard icon="📊" label="This Week" value={fmt(17200)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="📉" label="Avg Daily" value={fmt(2460)} changeType="neutral" color="#8b5cf6" compact={isCompactMobile} />
                </div>

                {/* Add Expense Button */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => setShowAddExpense(true)} style={actionBtn('#ef4444')}>+ Add Expense</button>
                    <button onClick={() => setShowGoldenList(!showGoldenList)} style={{ ...actionBtn('#f59e0b'), background: showGoldenList ? '#f59e0b' : '#fffbeb', color: showGoldenList ? 'white' : '#92400e', border: '1.5px solid #f59e0b' }}>📜 What Can I Claim?</button>
                </div>

                {/* ===== GOLDEN LIST EDUCATIONAL PANEL ===== */}
                {showGoldenList && (
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #fbbf24' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>📜 The Golden List — What Sri Lankan Doctors Can Legally Claim</h3>
                            <button onClick={() => setShowGoldenList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400e' }}>✕</button>
                        </div>
                        <div style={{ padding: '0.5rem', background: '#fef9c3', borderRadius: 8, marginBottom: '0.75rem', fontSize: 12, color: '#854d0e' }}>
                            ⚠️ <strong>Important:</strong> Under Sri Lankan law, expenses CANNOT be claimed against Government salary (APIT income). These deductions apply ONLY to your private/business practice income.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(2, 1fr)'), gap: '0.75rem' }}>
                            {GOLDEN_LIST.filter(c => c.id !== 'other').map(cat => (
                                <div key={cat.id} style={{ padding: '0.75rem', background: 'white', borderRadius: 10, border: `1.5px solid ${cat.color}30` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{cat.name}</span>
                                        {cat.isCapitalItem && <span style={{ fontSize: 11, background: '#f59e0b', color: 'white', padding: '2px 8px', borderRadius: 5, fontWeight: 700 }}>DEPRECIATION</span>}
                                    </div>
                                    <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 5, fontStyle: 'italic' }}>{cat.taxNote}</div>
                                    <div style={{ fontSize: 12.5, color: '#64748b' }}>e.g. {cat.examples.slice(0, 3).join(', ')}</div>
                                </div>
                            ))}
                        </div>
                        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: '#a855f715', borderRadius: 8, border: '1px solid #a855f730', fontSize: 12, color: '#7c3aed' }}>
                            ✨ <strong>Pro Tip:</strong> Your MyTracksy subscription is a 100% tax-deductible professional business expense!
                        </div>
                    </div>
                )}

                {/* Add Expense Form */}
                {showAddExpense && (
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem', border: '2px solid #6366f1' }}>
                        <h3 style={{ ...cardTitle, marginBottom: '1rem' }}>➕ Add New Expense</h3>
                        <form onSubmit={handleAddExpense}>
                            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr'), gap: '0.75rem', marginBottom: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Description *</label>
                                    <input
                                        type="text" value={expenseForm.description}
                                        onChange={(e) => {
                                            const desc = e.target.value;
                                            const autocat = autoCategorizeDr(desc);
                                            setExpenseForm((p) => ({ ...p, description: desc, category: autocat !== 'Other Deductible Expense' ? autocat : p.category }));
                                        }}
                                        placeholder="e.g. SLMC Renewal, Gloves purchase, Dialog bill"
                                        style={inputStyle} required
                                    />
                                </div>
                                <div>
                                    <label style={labelStyle}>Amount (LKR) *</label>
                                    <input
                                        type="number" value={expenseForm.amount || ''}
                                        onChange={(e) => setExpenseForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0" style={inputStyle} min="0" step="100" required
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1fr 1fr'), gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div>
                                    <label style={labelStyle}>Category (Tax Deductible)</label>
                                    <select
                                        value={expenseForm.category}
                                        onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                                        style={inputStyle}
                                    >
                                        {GOLDEN_LIST.map((c) => (
                                            <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={labelStyle}>Date</label>
                                    <input
                                        type="date" value={expenseForm.date}
                                        onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            {/* Tax Note for Selected Category */}
                            {selectedCat && (
                                <div style={{ padding: '8px 12px', background: `${selectedCat.color}08`, borderRadius: 8, border: `1px solid ${selectedCat.color}20`, marginBottom: '0.75rem', fontSize: 12 }}>
                                    <span style={{ color: selectedCat.color, fontWeight: 600 }}>{selectedCat.icon} Tax Note:</span>{' '}
                                    <span style={{ color: '#475569' }}>{selectedCat.taxNote}</span>
                                    {selectedCat.isCapitalItem && (
                                        <span style={{ display: 'block', marginTop: 4, color: '#f59e0b', fontWeight: 600 }}>⚡ Capital item — logged for annual depreciation claim by auditor.</span>
                                    )}
                                </div>
                            )}
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexDirection: isCompactMobile ? 'column-reverse' : 'row' }}>
                                <button type="button" onClick={() => setShowAddExpense(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                                <button type="submit" style={actionBtn('#6366f1')}>💾 Save Expense</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Category Cards with Tax Notes */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem' }}>
                    <h3 style={cardTitle}>📂 Expense Categories (Tax Deductible)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: '0.75rem', padding: '0.5rem 0' }}>
                        {medicalExpenseCategories.map((cat) => {
                            const catTotal = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                            const golden = getCategoryByName(cat.name);
                            return (
                                <div key={cat.name} style={{ padding: '0.85rem', background: `${cat.color}08`, borderRadius: 10, border: `1px solid ${cat.color}20`, textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} title={golden?.taxNote || ''}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{cat.icon}</div>
                                    <div style={{ fontSize: '0.84rem', color: '#475569', marginBottom: 3 }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{fmt(catTotal)}</div>
                                    {golden?.isCapitalItem && <div style={{ fontSize: 11, color: '#d97706', fontWeight: 700, marginTop: 3, letterSpacing: '0.02em' }}>📐 DEPRECIATION</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Expense List */}
                <TransactionList transactions={expenses} title="All Expenses" showFilter={false} compact={isCompactMobile} />
            </div>
        );
    };

    /* ========== BANKING ========== */
    const renderBanking = () => (
        <div>
            {/* Bank Accounts */}
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)'), gap: stackGap, marginBottom: '1.25rem' }}>
                {sampleBankAccounts.map((acc) => (
                    <div key={acc.id} style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, borderTop: `3px solid ${acc.type === 'savings' ? '#22c55e' : acc.type === 'current' ? '#6366f1' : '#f59e0b'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{acc.name}</span>
                            <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>{acc.type}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{fmt(acc.balance)}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{acc.bank}</div>
                    </div>
                ))}
            </div>

            {/* Total Balance */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 12 }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Balance (All Accounts)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(sampleBankAccounts.reduce((s, a) => s + a.balance, 0))}</div>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>🏦</div>
                </div>
            </div>

            {/* Cheque Management */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>📝 Cheque Management</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sampleCheques.map((chq) => (
                        <div key={chq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: 36, height: 36, borderRadius: 8,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: chq.type === 'received' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                                    color: chq.type === 'received' ? '#22c55e' : '#ef4444', fontWeight: 700,
                                }}>
                                    {chq.type === 'received' ? '↓' : '↑'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 500 }}>{chq.party}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{chq.number} · {chq.date}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: chq.type === 'received' ? '#22c55e' : '#ef4444' }}>
                                    {chq.type === 'received' ? '+' : '-'}{fmt(chq.amount)}
                                </div>
                                <div style={{
                                    fontSize: '0.8rem', fontWeight: 600, padding: '3px 10px', borderRadius: 10, display: 'inline-block',
                                    color: chq.status === 'cleared' ? '#22c55e' : '#f59e0b',
                                    background: chq.status === 'cleared' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                                }}>
                                    {chq.status}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ========== REPORTS ========== */
    const renderReports = () => (
        <div>
            {/* P&L Summary */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📊 Monthly Profit & Loss Statement</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                    <div style={plRow}>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>💰 Total Revenue</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(totalIncome)}</span>
                    </div>
                    <div style={{ height: 1, background: '#f1f5f9' }} />
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b', margin: '0.375rem 0', letterSpacing: '0.03em' }}>EXPENSES</div>
                    {medicalExpenseCategories.map((cat) => {
                        const catTotal = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                        if (catTotal === 0) return null;
                        return (
                            <div key={cat.name} style={plRow}>
                                <span style={{ color: '#64748b' }}>{cat.icon} {cat.name}</span>
                                <span style={{ color: '#ef4444' }}>({fmt(catTotal)})</span>
                            </div>
                        );
                    })}
                    <div style={{ height: 1, background: '#1e293b' }} />
                    <div style={plRow}>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>📈 Net Profit</span>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(netProfit)}</span>
                    </div>
                </div>
            </div>

            {/* Tax Summary */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🧾 Tax Summary (Estimated)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)'), gap: '1rem', padding: '0.5rem 0' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Gross Income</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmt(totalIncome)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Deductible Expenses</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmt(totalExpenses)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 6 }}>Taxable Income (Est.)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>{fmt(netProfit)}</div>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.8rem', color: '#92400e' }}>⚠️ This is an estimate only. Consult your tax advisor for official APIT / IRD calculations.</span>
                </div>
            </div>

            {/* Quick Reports */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>📋 Available Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(2, 1fr)'), gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { name: 'Monthly P&L', icon: '📊', desc: 'Income vs expenses breakdown' },
                        { name: 'Tax Summary', icon: '🧾', desc: 'APIT/IRD estimated returns' },
                        { name: 'Category Analysis', icon: '📂', desc: 'Expense breakdown by type' },
                        { name: 'Income Sources', icon: '🏥', desc: 'Revenue by hospital/clinic' },
                        { name: 'Bank Reconciliation', icon: '🏦', desc: 'Match bank vs recorded' },
                        { name: 'Cheque Register', icon: '📝', desc: 'All issued & received cheques' },
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

    /* ========== SETTINGS ========== */
    /* ========== TOKEN WALLET ========== */
    const renderWallet = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Balance Card */}
            <div style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                borderRadius: 16, padding: isCompactMobile ? '1.1rem' : '2rem', color: 'white',
                boxShadow: '0 4px 20px rgba(245,158,11,0.3)',
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
                    <div style={{
                        marginTop: 12, background: 'rgba(220,38,38,0.3)', borderRadius: 8,
                        padding: '8px 12px', fontSize: '0.8rem', fontWeight: 600,
                    }}>
                        ⚠️ Low balance! Top up to continue using premium features.
                    </div>
                )}
            </div>

            {/* Buy Tokens */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>💳 Buy Token Packages</h3>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1rem' }}>
                    Tokens are used for AI features. Purchase via web portal to avoid app store fees.
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(auto-fill, minmax(180px, 1fr))', '1fr'), gap: '0.75rem' }}>
                    {TOKEN_PACKAGES.map((pkg: TokenPackage) => (
                        <div key={pkg.id} onClick={() => walletData.oneClickPurchase(pkg.id)} style={{
                            padding: '1.25rem', borderRadius: 12, cursor: 'pointer',
                            border: pkg.popular ? '2px solid #6366f1' : '1px solid #e2e8f0',
                            background: pkg.popular ? 'linear-gradient(135deg, #eef2ff, #e0e7ff)' : '#f8fafc',
                            transition: 'all 0.2s', position: 'relative',
                        }}>
                            {pkg.popular && (
                                <div style={{
                                    position: 'absolute', top: -10, right: 12,
                                    background: '#6366f1', color: 'white', fontSize: '0.65rem',
                                    fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                                    textTransform: 'uppercase', letterSpacing: '0.05em',
                                }}>Popular</div>
                            )}
                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>
                                {pkg.tokens.toLocaleString()}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500, marginBottom: 8 }}>tokens</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#6366f1' }}>
                                LKR {pkg.price_lkr.toLocaleString()}
                            </div>
                            {pkg.savings && (
                                <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: 600, marginTop: 4 }}>{pkg.savings}</div>
                            )}
                            <div style={{
                                marginTop: 10, fontSize: '0.75rem', color: '#64748b',
                            }}>
                                LKR {(pkg.price_lkr / pkg.tokens).toFixed(0)}/token
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, fontSize: '0.78rem', color: '#92400e', border: '1px solid #fde68a' }}>
                    💡 <strong>Tax tip:</strong> Token purchases for medical AI tools may qualify as deductible expenses under &quot;IT/Software&quot; category (S.32 ITA).
                </div>
            </div>

            {/* Auto-Reload Settings */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>🔄 Auto-Reload</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                        <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Auto-Reload</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Automatically top up when balance is low</div>
                        </div>
                        <button onClick={() => walletData.toggleAutoReload(!walletData.autoReloadEnabled)} style={{
                            width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                            background: walletData.autoReloadEnabled ? '#6366f1' : '#cbd5e1',
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
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}>{walletData.autoReloadThreshold} tokens</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 10, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>Reload package</span>
                                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#6366f1' }}>
                                    {TOKEN_PACKAGES.find(p => p.id === walletData.autoReloadPackage)?.label || '100 Tokens'}
                                </span>
                            </div>
                        </>
                    )}
                    {!walletData.savedCard && walletData.autoReloadEnabled && (
                        <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: 8, fontSize: '0.8rem', color: '#991b1b', border: '1px solid #fecaca' }}>
                            ⚠️ Link a card first to enable auto-reload. <a href="https://wallet.mytracksy.lk/link-card" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 600 }}>Link now →</a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div>
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>⚙️ Medical Practice Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { label: 'SLMC Registration #', value: 'SLMC/12345', icon: '🩺' },
                        { label: 'Specialization', value: 'General Medicine', icon: '🔬' },
                        { label: 'SLMC Renewal Due', value: '2026-12-31', icon: '📅' },
                        { label: 'CPD Points (This Year)', value: '18 / 30 required', icon: '📚' },
                        { label: 'Primary Hospital', value: 'Asiri Central Hospital', icon: '🏥' },
                        { label: 'Indemnity Insurance', value: 'SLIC — Policy Active', icon: '🛡️' },
                        { label: 'WHT Certificate Status', value: '2 certificates pending', icon: '🧾' },
                        { label: 'Currency', value: 'LKR (Sri Lankan Rupee)', icon: '💱' },
                        { label: 'Tax Year', value: '2025/2026 (April – March)', icon: '📋' },
                        { label: 'IRD TIN', value: 'Not set — required for APIT', icon: '🔑' },
                    ].map((s) => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '0.875rem 1rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{s.label}</span>
                            </div>
                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: s.value.includes('Not set') || s.value.includes('pending') ? '#dc2626' : '#334155' }}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Wallet Settings */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginTop: '1.25rem' }}>
                <h3 style={cardTitle}>🪙 Wallet & Billing</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
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
                    <button onClick={onLogout} style={{ ...actionBtn('#0f172a') }}>🚪 Sign Out</button>
                    <button onClick={onChangeProfession} style={{ ...actionBtn('#475569') }}>🌐 Web Professions</button>
                </div>
            )}
        </div>
    );

    return (
        <>
            <DashboardLayout
                profession="medical"
                professionLabel="Medical Professional"
                professionIcon="🩺"
                userName={userName}
                navItems={gatedNavItems}
                activeNav={activeNav}
                onNavChange={handleGatedNavChange}
                onChangeProfession={onChangeProfession}
                onLogout={onLogout}
                tokenBalance={walletData.tokenBalance}
                onWalletClick={() => setActiveNav('wallet')}
                mobileShell={{
                    enabled: true,
                    tabs: MEDICAL_MOBILE_TABS,
                    activeTab: activeMobileTab,
                    onTabChange: handleMobileTabChange,
                    activeTitle: activeNavItem.label,
                    activeSubtitle: `${currentDateLabel} • ${userName}`,
                }}
            >
                <>
                    {renderMobileSectionNav()}
                    {renderContent()}
                </>
            </DashboardLayout>

            {showInvoiceForm && (
                <InvoiceForm
                    onSubmit={handleCreateInvoice}
                    onCancel={() => setShowInvoiceForm(false)}
                />
            )}

            {/* Floating Voice Assistant */}
            <VoiceInput
                onAction={handleVoiceAction}
                position="float"
                floatingOffset={isCompactMobile ? { bottom: 114, right: 16 } : undefined}
            />
        </>
    );
};

/* Shared inline styles — enhanced for readability */
const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 14,
    padding: '1.5rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
    border: '1px solid #e2e8f0',
};

const cardTitle: React.CSSProperties = {
    margin: '0 0 1rem',
    fontSize: '1.05rem',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.01em',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#334155',
    display: 'block',
    marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: 10,
    fontSize: '0.9375rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    color: '#1e293b',
    transition: 'border-color 0.2s',
};

const plRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9375rem',
    padding: '0.375rem 0',
};

const actionBtn = (color: string): React.CSSProperties => ({
    padding: '0.625rem 1.25rem',
    border: 'none',
    borderRadius: 10,
    background: color,
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${color}40`,
    letterSpacing: '-0.01em',
    transition: 'all 0.2s',
});

export default MedicalDashboard;
