import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';
import { useRouteNav } from '../../hooks/useRouteNav';
import VoiceInput, { ParsedVoiceAction } from '../VoiceInput';
import PrescriptionPad from '../PrescriptionPad';
import TaxSpeedometer, { calculateTax, PERSONAL_RELIEF } from '../TaxSpeedometer';
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
import {
    listChannelingShifts, addChannelingShift, updateChannelingShift, autoMarkOverdueShifts,
    listQuickNotes, addQuickNote, deleteQuickNote,
    listAppointments, addAppointment, updateAppointment,
    listPatients, addPatient, recordPatientVisit,
    getPracticeProfile, savePracticeProfile, getPracticeReminders, getIrdQuarterSchedule,
    whtSummaryByHospital, SL_CHANNELING_HOSPITALS,
    type MedicalChannelingShift, type MedicalQuickNote, type MedicalAppointment,
    type MedicalPatient, type MedicalPracticeProfile,
} from '../../services/medicalPracticeService';

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

// Production-ready: financial data comes from Firestore subscriptions;
// practice data (shifts, notes, appointments, patients) is local-first via
// Dexie (medicalPracticeService) and survives refresh/offline.

const parseTxnDate = (value: string): Date | null => {
    const parsed = new Date(`${value}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameMonth = (value: string, reference = new Date()) => {
    const parsed = parseTxnDate(value);
    return !!parsed && parsed.getFullYear() === reference.getFullYear() && parsed.getMonth() === reference.getMonth();
};

const isThisWeek = (value: string, reference = new Date()) => {
    const parsed = parseTxnDate(value);
    if (!parsed) return false;
    const start = new Date(reference);
    const day = start.getDay() || 7;
    start.setDate(start.getDate() - day + 1);
    start.setHours(0, 0, 0, 0);
    return parsed >= start && parsed <= reference;
};

const safePct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

const loggedCentersLabel = (shifts: { hospital: string }[]) => {
    const centers = Array.from(new Set(shifts.map(s => s.hospital).filter(Boolean)));
    if (centers.length === 0) return '';
    if (centers.length <= 2) return centers.join(', ');
    return `${centers.slice(0, 2).join(', ')} +${centers.length - 2} more`;
};

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;
    // Demo/guest sessions have no Firebase user — fall back to the locally
    // stored session identity so on-device persistence (Dexie) still works.
    // medicalPracticeService skips Firestore for guest_/demo_ uids.
    const localUid = useMemo(() => {
        if (uid) return uid;
        try {
            return (JSON.parse(localStorage.getItem('tracksyUser') || 'null') as { uid?: string } | null)?.uid || undefined;
        } catch {
            return undefined;
        }
    }, [uid]);
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
    const [quickNotes, setQuickNotes] = useState<MedicalQuickNote[]>([]);
    const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});
    const [noteText, setNoteText] = useState('');

    // Persistent state — loaded from local-first storage (Dexie); patient data
    // stays on-device per PDPA, channeling shifts sync to the cloud.
    const [patients, setPatients] = useState<MedicalPatient[]>([]);
    const [sampleBankAccounts] = useState<{ id: string; name: string; bank: string; balance: number; type: string }[]>([]);
    const [sampleCheques] = useState<{ id: string; number: string; party: string; amount: number; date: string; type: string; status: string }[]>([]);
    const [appointmentsData, setAppointmentsData] = useState<MedicalAppointment[]>([]);
    const [practiceProfile, setPracticeProfile] = useState<MedicalPracticeProfile | null>(null);

    // Add-record forms
    const [showAddAppointment, setShowAddAppointment] = useState(false);
    const [appointmentForm, setAppointmentForm] = useState({ patient: '', type: 'Consultation', time: '', hospital: '', date: new Date().toISOString().split('T')[0] });
    const [showAddPatient, setShowAddPatient] = useState(false);
    const [patientForm, setPatientForm] = useState({ name: '', nic: '', phone: '', age: 0, blood: 'O+', allergies: 'None' });
    const [profileForm, setProfileForm] = useState({ slmcNo: '', specialization: '', slmcRenewalDate: '', indemnityProvider: '', indemnityExpiry: '', cpdPoints: 0, irdTin: '' });
    const [profileSaved, setProfileSaved] = useState(false);

    // ===== Dual-Income State (loaded from Firestore config) =====
    const [govSalary, setGovSalary] = useState(0);
    const [datAllowance, setDatAllowance] = useState(0);
    const govMonthly = govSalary + datAllowance;
    const govAnnual = govMonthly * 12;
    // Progressive APIT estimate using IRD 2025/26 brackets (was a flat 12%).
    // Personal relief is applied against employment income first.
    const govAPIT = govAnnual > 0 ? calculateTax(Math.max(0, govAnnual - PERSONAL_RELIEF)).tax : 0;

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
                if (config.basicSalary) setGovSalary(config.basicSalary);
                if (config.datAllowance) setDatAllowance(config.datAllowance);
            }
        });

        return () => {
            unsubIncome();
            unsubExpenses();
            unsubGov();
        };
    }, [uid]);

    // ===== Channeling Payment Tracker State (persisted via Dexie + cloud sync) =====
    const [channelingShifts, setChannelingShifts] = useState<MedicalChannelingShift[]>([]);
    const [showAddShift, setShowAddShift] = useState(false);
    const [shiftForm, setShiftForm] = useState({ hospital: '', date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });

    // ===== LOAD PERSISTED MEDICAL DATA (local-first, survives refresh) =====
    useEffect(() => {
        if (!localUid) return;
        let cancelled = false;
        (async () => {
            try {
                await autoMarkOverdueShifts(localUid);
                const [shifts, notes, appts, pts, profile] = await Promise.all([
                    listChannelingShifts(localUid),
                    listQuickNotes(localUid),
                    listAppointments(localUid),
                    listPatients(localUid),
                    getPracticeProfile(localUid),
                ]);
                if (cancelled) return;
                setChannelingShifts(shifts);
                setQuickNotes(notes);
                setAppointmentsData(appts);
                setPatients(pts);
                setPracticeProfile(profile);
                if (profile) {
                    setProfileForm({
                        slmcNo: profile.slmcNo || '',
                        specialization: profile.specialization || '',
                        slmcRenewalDate: profile.slmcRenewalDate || '',
                        indemnityProvider: profile.indemnityProvider || '',
                        indemnityExpiry: profile.indemnityExpiry || '',
                        cpdPoints: profile.cpdPoints || 0,
                        irdTin: profile.irdTin || '',
                    });
                }
            } catch (err) {
                console.error('Failed to load persisted medical data:', err);
            }
        })();
        return () => { cancelled = true; };
    }, [localUid]);

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
                if (localUid) {
                    addQuickNote(localUid, { text: action.description || action.raw, patient: action.patient })
                        .then(saved => setQuickNotes(prev => [saved, ...prev]))
                        .catch(err => console.error('Failed to save voice note:', err));
                } else {
                    setQuickNotes(prev => [{ id: `qn-${Date.now()}`, text: action.description || action.raw, time: timeStr, date: dateStr, type: 'note', userId: '', createdAt: Date.now(), patient: action.patient }, ...prev]);
                }
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
                metadata: {
                    wht_deducted_cents: toCents(Math.round(invoice.amount * 0.05)),
                    wht_rate: 0.05,
                    wht_note: 'Estimated service-fee AIT/WHT. Confirm actual certificate amounts with the hospital or auditor.',
                },
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
    const currentMonthIncome = useMemo(
        () => invoices.filter(t => isSameMonth(t.date)).reduce((s, t) => s + t.amount, 0),
        [invoices]
    );
    const currentMonthExpenses = useMemo(
        () => expenses.filter(t => isSameMonth(t.date)).reduce((s, t) => s + t.amount, 0),
        [expenses]
    );
    const thisWeekExpenses = useMemo(
        () => expenses.filter(t => isThisWeek(t.date)).reduce((s, t) => s + t.amount, 0),
        [expenses]
    );
    const avgDailyExpense = currentMonthExpenses > 0 ? Math.round(currentMonthExpenses / Math.max(1, new Date().getDate())) : 0;
    const incomeSources = useMemo(() => {
        const sourceTotals = new Map<string, number>();
        invoices.forEach((invoice) => {
            const source = invoice.category || 'Private Practice';
            sourceTotals.set(source, (sourceTotals.get(source) || 0) + invoice.amount);
        });
        return Array.from(sourceTotals.entries())
            .map(([name, amount], i) => ({
                name,
                amount,
                color: ['#6366f1', '#8b5cf6', '#22c55e', '#06b6d4', '#f59e0b'][i % 5],
            }))
            .sort((a, b) => b.amount - a.amount);
    }, [invoices]);
    const expenseBreakdown = useMemo(() => {
        return medicalExpenseCategories
            .map(cat => ({
                ...cat,
                amount: expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0),
            }))
            .filter(cat => cat.amount > 0)
            .sort((a, b) => b.amount - a.amount);
    }, [expenses]);
    const monthlyTrend = useMemo(() => {
        const now = new Date();
        return Array.from({ length: 6 }, (_, idx) => {
            const date = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
            const monthIncome = invoices
                .filter(t => {
                    const parsed = parseTxnDate(t.date);
                    return !!parsed && parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
                })
                .reduce((s, t) => s + t.amount, 0);
            const monthExpenses = expenses
                .filter(t => {
                    const parsed = parseTxnDate(t.date);
                    return !!parsed && parsed.getFullYear() === date.getFullYear() && parsed.getMonth() === date.getMonth();
                })
                .reduce((s, t) => s + t.amount, 0);
            return {
                month: date.toLocaleDateString('en-LK', { month: 'short' }),
                income: monthIncome,
                expenses: monthExpenses,
            };
        });
    }, [invoices, expenses]);
    const trendMax = Math.max(...monthlyTrend.flatMap(m => [m.income, m.expenses]), 1);
    const hasTrendData = monthlyTrend.some(m => m.income > 0 || m.expenses > 0);
    const recentTransactions = useMemo(
        () => [...invoices, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
        [invoices, expenses]
    );

    const fmt = (n: number) => `LKR ${Number.isFinite(n) ? Math.round(n).toLocaleString('en-LK') : '0'}`;
    const gridColumns = (desktop: string, mobile = '1fr') => isCompactMobile ? mobile : desktop;
    const stackGap = isCompactMobile ? '0.85rem' : '1rem';
    const currentDateLabel = new Date().toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' });

    // Private income calculations — annualised from TAX-YEAR-TO-DATE income
    // (Apr–Mar), not a single month × 12, which skewed projections badly.
    const privateAnnual = useMemo(() => {
        const now = new Date();
        const taxYearStart = new Date(now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1, 3, 1);
        const ytd = invoices.reduce((sum, t) => {
            const parsed = parseTxnDate(t.date);
            return parsed && parsed >= taxYearStart && parsed <= now ? sum + t.amount : sum;
        }, 0);
        const monthsElapsed = Math.max(1,
            (now.getFullYear() - taxYearStart.getFullYear()) * 12 + (now.getMonth() - taxYearStart.getMonth()) + 1);
        return Math.round((ytd / monthsElapsed) * 12);
    }, [invoices]);
    const totalWHT = Math.round(privateAnnual * 0.05);

    // Practice admin reminders (SLMC / indemnity) + next IRD instalment date
    const practiceReminders = useMemo(() => getPracticeReminders(practiceProfile), [practiceProfile]);
    const nextIrdQuarter = useMemo(() => getIrdQuarterSchedule().find(q => q.status !== 'past') || null, []);

    // ===== FEATURE GATE WRAPPER =====
    // Wraps content of pro-only features with a gate that checks subscription
    const renderFeatureGated = (featureId: string, featureName: string, featureIcon: string, content: React.ReactNode) => {
        if (!isFeatureAccessible(featureId, subscriptionState.tier, 'medical')) {
            return (
                <SubscriptionGate featureName={featureName} featureIcon={featureIcon} requirePro onUpgrade={() => setActiveNav('subscription')}>
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
                        <SubscriptionGate featureName="AI Voice Vault" featureIcon="🎙️" requirePro onUpgrade={() => setActiveNav('subscription')}>
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
        type TodaySlot = {
            id: string;
            time: string;
            activity: string;
            type: 'gov' | 'private' | 'travel' | 'break';
            status: 'completed' | 'active' | 'upcoming' | 'pending' | 'overdue';
            patients?: number;
        };

        const todayStr = new Date().toISOString().split('T')[0];
        const todaysAppointments = appointmentsData.filter(a => a.date === todayStr);
        const todaysShifts = channelingShifts.filter(s => s.date === todayStr);
        const govSchedule: TodaySlot[] = [];
        const privateSchedule: TodaySlot[] = [
            ...todaysAppointments.map((appointment): TodaySlot => ({
                id: `appt-${appointment.id}`,
                time: appointment.time || 'Time not set',
                activity: `${appointment.hospital || 'Clinic'} — ${appointment.type || 'Appointment'}${appointment.patient ? ` for ${appointment.patient}` : ''}`,
                type: 'private',
                status: appointment.status === 'confirmed' ? 'upcoming' : 'pending',
            })),
            ...todaysShifts.map((shift): TodaySlot => ({
                id: `shift-${shift.id}`,
                time: 'Logged shift',
                activity: `${shift.hospital || 'Private clinic'} — Channeling payout`,
                type: 'private',
                status: shift.status === 'received' ? 'completed' : shift.status === 'overdue' ? 'overdue' : 'pending',
                patients: shift.patients,
            })),
        ];
        const allSlots = [...govSchedule, ...privateSchedule];
        const completedCount = allSlots.filter(s => s.status === 'completed').length;
        const todayLoggedAmount =
            invoices.filter(txn => txn.date === todayStr).reduce((sum, txn) => sum + txn.amount, 0) +
            todaysShifts.reduce((sum, shift) => sum + shift.expected, 0);
        const todayPatients = todaysShifts.reduce((sum, shift) => sum + shift.patients, 0);
        const statusColor = (status: TodaySlot['status']) => {
            if (status === 'completed') return '#22c55e';
            if (status === 'active') return '#f59e0b';
            if (status === 'overdue') return '#ef4444';
            if (status === 'pending') return '#f59e0b';
            return '#e2e8f0';
        };
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.2rem' }}>
                    <KPICard icon="🏥" label="Gov Hospital" value={govMonthly > 0 ? 'Configured' : 'Not set'} change={govMonthly > 0 ? `${fmt(govMonthly)}/mo salary` : 'Add salary / DAT'} changeType={govMonthly > 0 ? 'up' : 'neutral'} color="#22c55e" compact={isCompactMobile} />
                    <KPICard icon="🩺" label="Private Clinics" value={`${privateSchedule.length} items`} change={todayPatients > 0 ? `${todayPatients} patients logged` : 'No patient count yet'} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="💰" label="Today Logged" value={fmt(todayLoggedAmount)} change="Income + shifts" changeType={todayLoggedAmount > 0 ? 'up' : 'neutral'} color="#f59e0b" compact={isCompactMobile} />
                    <KPICard icon="✅" label="Completed" value={allSlots.length ? `${completedCount}/${allSlots.length}` : '0/0'} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                </div>

                {/* Timeline */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>🕐 Today's Timeline — {new Date().toLocaleDateString('en-LK', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                    <div style={{ position: 'relative', paddingLeft: isCompactMobile ? 24 : 30 }}>
                        {/* Timeline line */}
                        <div style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #22c55e, #6366f1)' }} />

                        {/* Gov section header */}
                        <div style={{ padding: '8px 0 4px', fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏛️ Government Hospital</div>
                        {govSchedule.length === 0 && (
                            <div style={{ padding: '10px 0', color: '#64748b', fontSize: 13 }}>No government hospital sessions logged today.</div>
                        )}
                        {govSchedule.map((s) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: s.status === 'completed' ? '#22c55e' : '#e2e8f0', border: '2px solid white', boxShadow: '0 0 0 2px ' + (s.status === 'completed' ? '#22c55e' : '#e2e8f0') }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b', minWidth: isCompactMobile ? 'unset' : 65 }}>{s.time}</div>
                                <div style={{ fontSize: isCompactMobile ? 13.5 : 14.5, fontWeight: 500, color: s.status === 'completed' ? '#64748b' : '#1e293b', textDecoration: s.status === 'completed' ? 'line-through' : 'none' }}>{s.activity}</div>
                                {s.status === 'completed' && <span style={{ fontSize: 11, background: '#dcfce7', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ Done</span>}
                            </div>
                        ))}

                        {/* Private section header */}
                        <div style={{ padding: '12px 0 4px', fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🩺 Private Practice</div>
                        {privateSchedule.length === 0 && (
                            <div style={{ padding: '10px 0', color: '#64748b', fontSize: 13 }}>No private appointments or channeling shifts logged today.</div>
                        )}
                        {privateSchedule.map((s) => (
                            <div key={s.id} style={{ display: 'flex', alignItems: 'flex-start', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: statusColor(s.status), border: '2px solid white', boxShadow: `0 0 0 2px ${statusColor(s.status)}`, animation: s.status === 'active' ? 'voicePulse 2s infinite' : 'none' }} />
                                <div style={{ fontSize: 13, fontWeight: 700, color: s.status === 'active' ? '#d97706' : '#64748b', minWidth: isCompactMobile ? 'unset' : 65 }}>{s.time}</div>
                                <div style={{ fontSize: 14, fontWeight: s.status === 'active' ? 700 : 500, color: s.status === 'active' ? '#1e293b' : '#64748b' }}>{s.activity}</div>
                                {typeof s.patients === 'number' && s.patients > 0 && <span style={{ fontSize: 11, background: 'rgba(99,102,241,0.08)', color: '#6366f1', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{s.patients} patients</span>}
                                {s.status === 'active' && <span style={{ fontSize: 11, background: '#fef3c7', color: '#f59e0b', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>🔴 NOW</span>}
                                {s.status === 'overdue' && <span style={{ fontSize: 11, background: '#fee2e2', color: '#ef4444', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Overdue</span>}
                                {s.status === 'pending' && <span style={{ fontSize: 11, background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Pending</span>}
                                {s.status === 'completed' && <span style={{ fontSize: 11, background: '#dcfce7', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>Received</span>}
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
            if (!noteText.trim() || !localUid) return;
            addQuickNote(localUid, { text: noteText.trim() })
                .then(saved => setQuickNotes(prev => [saved, ...prev]))
                .catch(err => console.error('Failed to save note:', err));
            setNoteText('');
        };
        const removeNote = (id: string) => {
            setQuickNotes(prev => prev.filter(n => n.id !== id));
            deleteQuickNote(id).catch(err => console.error('Failed to delete note:', err));
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
                                    <button onClick={() => removeNote(note.id)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 16, padding: 4, fontWeight: 600 }}>✕</button>
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
        const privateNet = currentMonthIncome;
        const currentMonthWht = Math.round(privateNet * 0.05);
        const netPrivateMonthly = privateNet - currentMonthWht - currentMonthExpenses;
        const totalTakeHome = govNetMonthly + netPrivateMonthly;
        const incomeMixTotal = govNetMonthly + privateNet;
        const overdueCount = channelingShifts.filter(s => s.status === 'overdue').length;
        const pendingAmount = channelingShifts.filter(s => s.status === 'pending').reduce((s, c) => s + c.expected, 0);
        const overdueAmount = channelingShifts.filter(s => s.status === 'overdue').reduce((s, c) => s + c.expected, 0);
        const setupTasks = [
            { label: 'Add salary / DAT allowance', done: govMonthly > 0, nav: 'settings' },
            { label: 'Log first channeling income', done: invoices.length > 0, nav: 'income' },
            { label: 'Record one private-practice expense', done: expenses.length > 0, nav: 'expenses' },
            { label: 'Track a hospital payout / WHT certificate', done: channelingShifts.length > 0, nav: 'channeling' },
        ];
        const completedSetup = setupTasks.filter(task => task.done).length;

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
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Channeling/Clinic This Month</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(privateNet)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Est. WHT/AIT (5%)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(currentMonthWht)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Practice Expenses This Month</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(currentMonthExpenses)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 12, opacity: 0.8, fontWeight: 500 }}>Net Private Income</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{fmt(netPrivateMonthly)}</div>
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
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{safePct(govNetMonthly, incomeMixTotal)}%</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 11, opacity: 0.5 }}>Private %</div>
                            <div style={{ fontSize: 16, fontWeight: 700 }}>{safePct(privateNet, incomeMixTotal)}%</div>
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

                {/* Practice Admin Reminders — SLMC / Indemnity renewals */}
                {practiceReminders.filter(r => r.severity !== 'ok').map(r => (
                    <div key={r.id} onClick={() => setActiveNav('settings')} style={{ ...cardStyle, marginBottom: '0.85rem', cursor: 'pointer', padding: '0.85rem 1.25rem', background: r.severity === 'overdue' ? '#fef2f2' : r.severity === 'urgent' ? '#fff7ed' : '#fffbeb', border: `2px solid ${r.severity === 'overdue' ? '#fecaca' : r.severity === 'urgent' ? '#fed7aa' : '#fde68a'}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 22 }}>{r.id === 'slmc' ? '🩺' : '🛡️'}</div>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: r.severity === 'overdue' ? '#991b1b' : '#9a3412' }}>
                                    {r.label} — {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)} days OVERDUE` : `${r.daysLeft} days left`}
                                </div>
                                <div style={{ fontSize: 12.5, color: '#92400e' }}>Due {r.dueDate}. Tap to review in Settings →</div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* IRD Quarterly Instalment Reminder */}
                {nextIrdQuarter && nextIrdQuarter.status === 'due-soon' && (
                    <div onClick={() => handleGatedNavChange('tax')} style={{ ...cardStyle, marginBottom: '1.25rem', cursor: 'pointer', padding: '0.85rem 1.25rem', background: '#eff6ff', border: '2px solid #bfdbfe' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ fontSize: 22 }}>🧾</div>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1e40af' }}>
                                    IRD {nextIrdQuarter.q} instalment due {nextIrdQuarter.dueLabel} — {nextIrdQuarter.daysLeft} days left
                                </div>
                                <div style={{ fontSize: 12.5, color: '#1d4ed8' }}>Period {nextIrdQuarter.period}. Open Tax & IRD to see the amount to set aside →</div>
                            </div>
                        </div>
                    </div>
                )}

                <div style={{
                    ...cardStyle,
                    marginBottom: '1.25rem',
                    padding: isCompactMobile ? '1rem' : '1.25rem',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #eef2ff 52%, #f8fafc 100%)',
                    border: '1px solid rgba(99,102,241,0.18)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row' }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#2563eb', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Doctor Money Tracker MVP</div>
                            <h3 style={{ margin: '5px 0 6px', fontSize: isCompactMobile ? '1.05rem' : '1.2rem', color: '#0f172a', letterSpacing: '-0.02em' }}>Start with the 4 records your auditor will actually ask for.</h3>
                            <p style={{ margin: 0, color: '#475569', fontSize: '0.9rem', lineHeight: 1.55 }}>
                                Keep clinical tools optional. The paid value is clean income, WHT, expenses, and exportable evidence.
                            </p>
                        </div>
                        <div style={{ minWidth: isCompactMobile ? '100%' : 180 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
                                <span>Launch readiness</span>
                                <span>{completedSetup}/4</span>
                            </div>
                            <div style={{ height: 10, borderRadius: 999, background: 'rgba(148,163,184,0.25)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${(completedSetup / setupTasks.length) * 100}%`, background: 'linear-gradient(90deg, #0ea5e9, #6366f1)', borderRadius: 999 }} />
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr'), gap: 10, marginTop: '1rem' }}>
                        {setupTasks.map(task => (
                            <button key={task.label} onClick={() => handleGatedNavChange(task.nav)} style={{
                                border: '1px solid rgba(148,163,184,0.22)',
                                background: task.done ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.82)',
                                color: task.done ? '#166534' : '#334155',
                                borderRadius: 12,
                                padding: '0.75rem',
                                textAlign: 'left',
                                cursor: 'pointer',
                                fontSize: 13,
                                fontWeight: 650,
                                minHeight: 66,
                            }}>
                                <span style={{ display: 'block', fontSize: 17, marginBottom: 4 }}>{task.done ? '✓' : '○'}</span>
                                {task.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, minmax(0, 1fr))', '1fr 1fr'), gap: 10, marginBottom: '1.25rem' }}>
                    <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>+ Create Invoice</button>
                    <button onClick={() => { setActiveNav('expenses'); setShowAddExpense(true); }} style={actionBtn('#ef4444')}>+ Add Expense</button>
                    <button onClick={() => setActiveNav('quicknotes')} style={actionBtn('#8b5cf6')}>📝 Quick Note</button>
                    <button onClick={() => setActiveNav('today')} style={actionBtn('#f59e0b')}>🕐 Today</button>
                    <button onClick={() => handleGatedNavChange('tax')} style={actionBtn('#06b6d4')}>🧾 Tax & IRD</button>
                    <button onClick={() => setActiveNav('receipts')} style={actionBtn('#22c55e')}>📸 Scan Receipt</button>
                    <button onClick={() => handleGatedNavChange('export')} style={actionBtn('#1e293b')}>📦 Auditor Export</button>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('1.5fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                        <h3 style={cardTitle}>📊 Income vs Expenses (Last 6 Months)</h3>
                        {hasTrendData ? (
                            <>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 180, padding: '1rem 0' }}>
                                    {monthlyTrend.map((month) => {
                                        const incomeH = Math.max(4, (month.income / trendMax) * 100);
                                        const expenseH = Math.max(4, (month.expenses / trendMax) * 100);
                                        return (
                                            <div key={month.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                                <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 150 }}>
                                                    <div title={fmt(month.income)} style={{ width: 16, height: `${month.income > 0 ? incomeH : 0}%`, background: 'linear-gradient(to top, #22c55e, #4ade80)', borderRadius: 4 }} />
                                                    <div title={fmt(month.expenses)} style={{ width: 16, height: `${month.expenses > 0 ? expenseH : 0}%`, background: 'linear-gradient(to top, #ef4444, #f87171)', borderRadius: 4 }} />
                                                </div>
                                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{month.month}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Income</span>
                                    <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>● Expenses</span>
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '2rem 1rem', borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', textAlign: 'center', fontSize: 13.5 }}>
                                Add your first income or expense to build a real trend chart. No sample numbers are shown here.
                            </div>
                        )}
                    </div>

                    <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                        <h3 style={cardTitle}>📂 Expense Categories</h3>
                        {expenseBreakdown.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', padding: '0.5rem 0' }}>
                                {expenseBreakdown.slice(0, 5).map((cat) => (
                                    <div key={cat.name}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{cat.icon} {cat.name}</span>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#1e293b' }}>{fmt(cat.amount)}</span>
                                        </div>
                                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                            <div style={{ height: '100%', width: `${safePct(cat.amount, totalExpenses)}%`, background: cat.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ padding: '1.5rem 1rem', borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', textAlign: 'center', fontSize: 13.5 }}>
                                Expense categories will appear after your first receipt or manual expense.
                            </div>
                        )}
                    </div>
                </div>

                {/* Recent Transactions */}
                <TransactionList transactions={recentTransactions} title="Recent Transactions" compact={isCompactMobile} />
            </div>
        );
    };

    /* ========== PATIENTS (local-only registry — PDPA) ========== */
    const renderPatients = () => {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        const seenThisMonth = patients.filter(p => p.lastVisit && isSameMonth(p.lastVisit)).length;
        const newThisMonth = patients.filter(p => p.createdAt >= monthStart).length;

        const handleAddPatient = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!patientForm.name.trim() || !localUid) return;
            try {
                const saved = await addPatient(localUid, {
                    name: patientForm.name.trim(),
                    nic: patientForm.nic.trim(),
                    phone: patientForm.phone.trim(),
                    age: patientForm.age || 0,
                    blood: patientForm.blood,
                    allergies: patientForm.allergies.trim() || 'None',
                });
                setPatients(prev => [saved, ...prev]);
            } catch (err) {
                console.error('Failed to save patient:', err);
            }
            setShowAddPatient(false);
            setPatientForm({ name: '', nic: '', phone: '', age: 0, blood: 'O+', allergies: 'None' });
        };

        const logVisit = (id: string) => {
            const today = new Date().toISOString().split('T')[0];
            setPatients(prev => prev.map(p => p.id === id ? { ...p, visits: (p.visits || 0) + 1, lastVisit: today } : p));
            recordPatientVisit(id).catch(err => console.error('Failed to record visit:', err));
        };

        return (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                <KPICard icon="🧑‍⚕️" label="Total Patients" value={String(patients.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                <KPICard icon="📅" label="Seen This Month" value={String(seenThisMonth)} change={newThisMonth > 0 ? `+${newThisMonth} new` : ''} changeType={seenThisMonth > 0 ? 'up' : 'neutral'} color="#22c55e" compact={isCompactMobile} />
                <KPICard icon="🔁" label="Returning" value={String(patients.filter(p => p.visits > 5).length)} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                <KPICard icon="⚠️" label="Allergies Noted" value={String(patients.filter(p => p.allergies !== 'None').length)} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
            </div>

            {showAddPatient && (
                <form onSubmit={handleAddPatient} style={{ ...cardStyle, padding: '1rem', marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                    <h3 style={{ ...cardTitle, margin: '0 0 0.75rem' }}>🧑‍⚕️ Register Patient</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(3, 1fr)'), gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>Full Name *</label>
                            <input value={patientForm.name} onChange={e => setPatientForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. W. A. Perera" style={inputStyle} required />
                        </div>
                        <div>
                            <label style={labelStyle}>NIC</label>
                            <input value={patientForm.nic} onChange={e => setPatientForm(p => ({ ...p, nic: e.target.value }))} placeholder="200012345678 / 991234567V" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input value={patientForm.phone} onChange={e => setPatientForm(p => ({ ...p, phone: e.target.value }))} placeholder="07X XXX XXXX" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Age</label>
                            <input type="number" min="0" max="120" value={patientForm.age || ''} onChange={e => setPatientForm(p => ({ ...p, age: parseInt(e.target.value) || 0 }))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>Blood Group</label>
                            <select value={patientForm.blood} onChange={e => setPatientForm(p => ({ ...p, blood: e.target.value }))} style={inputStyle}>
                                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Unknown'].map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={labelStyle}>Allergies</label>
                            <input value={patientForm.allergies} onChange={e => setPatientForm(p => ({ ...p, allergies: e.target.value }))} placeholder="None" style={inputStyle} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.75rem', flexDirection: isCompactMobile ? 'column-reverse' : 'row' }}>
                        <button type="button" onClick={() => setShowAddPatient(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                        <button type="submit" style={actionBtn('#22c55e')}>✅ Register Patient</button>
                    </div>
                    <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>🔒 PDPA: the registry is stored on this device only — patient data is never uploaded to the cloud.</div>
                </form>
            )}

            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ ...cardTitle, margin: 0 }}>🧑‍⚕️ Patient Registry <span style={{ fontSize: 11, fontWeight: 700, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6, marginLeft: 8, verticalAlign: 'middle' }}>ON-DEVICE (PDPA)</span></h3>
                    <button onClick={() => setShowAddPatient(true)} style={actionBtn('#6366f1')}>+ Add Patient</button>
                </div>
                {patients.length === 0 && !showAddPatient && (
                    <div style={{ padding: '1.5rem', borderRadius: 12, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13.5, textAlign: 'center' }}>
                        No patients registered yet. Tap <strong>+ Add Patient</strong> to build your on-device registry.
                    </div>
                )}
                {isCompactMobile ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {patients.map(p => (
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
                                    <div>🗓️ {p.lastVisit || 'No visits yet'}</div>
                                    <div>🔁 {p.visits} visits</div>
                                </div>
                                <div style={{ marginTop: 10, fontSize: 12.5, color: p.allergies !== 'None' ? '#ef4444' : '#64748b', fontWeight: p.allergies !== 'None' ? 600 : 500 }}>
                                    Allergies: {p.allergies}
                                </div>
                                <button onClick={() => logVisit(p.id)} style={{ ...actionBtn('#22c55e'), marginTop: 10, padding: '8px 14px', fontSize: '0.8rem' }}>+ Log Visit Today</button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            {['Name', 'NIC', 'Phone', 'Age', 'Blood', 'Allergies', 'Last Visit', 'Visits', ''].map(h => (
                                <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{patients.map(p => (
                            <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                                <td style={{ padding: '0.5rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.nic}</td>
                                <td style={{ padding: '0.5rem', color: '#334155' }}>{p.phone}</td>
                                <td style={{ padding: '0.5rem', color: '#334155' }}>{p.age}</td>
                                <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.82rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626' }}>{p.blood}</span></td>
                                <td style={{ padding: '0.5rem', color: p.allergies !== 'None' ? '#ef4444' : '#64748b', fontWeight: p.allergies !== 'None' ? 600 : 400 }}>{p.allergies}</td>
                                <td style={{ padding: '0.5rem', color: '#64748b' }}>{p.lastVisit || '—'}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#6366f1' }}>{p.visits}</td>
                                <td style={{ padding: '0.5rem' }}><button onClick={() => logVisit(p.id)} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#16a34a' }}>+ Visit</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                )}
            </div>
        </div>
        );
    };

    /* ========== CHANNELING + PAYMENT TRACKER ========== */
    const renderChanneling = () => {
        const totalMonthlyEst = channelingShifts.reduce((s, c) => s + c.expected, 0);
        const wht = Math.round(totalMonthlyEst * 0.05);
        const loggedCenters = new Set(channelingShifts.map(s => s.hospital).filter(Boolean));
        const centerCount = loggedCenters.size;
        const pendingShifts = channelingShifts.filter(s => s.status === 'pending');
        const overdueShifts = channelingShifts.filter(s => s.status === 'overdue');
        const receivedShifts = channelingShifts.filter(s => s.status === 'received');
        const pendingTotal = pendingShifts.reduce((s, c) => s + c.expected, 0);
        const overdueTotal = overdueShifts.reduce((s, c) => s + c.expected, 0);
        const receivedTotal = receivedShifts.reduce((s, c) => s + c.expected, 0);

        const handleAddShift = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!shiftForm.hospital.trim() || !shiftForm.patients || !shiftForm.expected || !localUid) return;
            try {
                const saved = await addChannelingShift(localUid, {
                    hospital: shiftForm.hospital.trim(),
                    date: shiftForm.date,
                    patients: shiftForm.patients,
                    expected: shiftForm.expected,
                    status: 'pending',
                });
                setChannelingShifts(prev => [saved, ...prev]);
            } catch (err) {
                console.error('Failed to save channeling shift:', err);
            }
            setShowAddShift(false);
            setShiftForm({ hospital: '', date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });
        };

        const markReceived = (id: string) => {
            const receivedDate = new Date().toISOString().split('T')[0];
            setChannelingShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'received' as const, receivedDate } : s));
            if (localUid) updateChannelingShift(localUid, id, { status: 'received', receivedDate }).catch(err => console.error('Failed to update shift:', err));
        };

        const toggleWhtCert = (id: string, current?: boolean) => {
            setChannelingShifts(prev => prev.map(s => s.id === id ? { ...s, whtCertReceived: !current } : s));
            if (localUid) updateChannelingShift(localUid, id, { whtCertReceived: !current }).catch(err => console.error('Failed to update WHT cert:', err));
        };

        const hospitalWht = whtSummaryByHospital(channelingShifts);

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <KPICard icon="🏥" label="Centers" value={String(centerCount)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
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
                                    <input list="sl-hospitals" value={shiftForm.hospital} onChange={e => setShiftForm(p => ({ ...p, hospital: e.target.value }))} placeholder="e.g. Asiri Central, Lanka Hospitals, private clinic" style={inputStyle} />
                                    <datalist id="sl-hospitals">
                                        {SL_CHANNELING_HOSPITALS.map(h => <option key={h} value={h} />)}
                                    </datalist>
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

                    {/* Received Shifts (GREEN) — with WHT/AIT certificate tracking */}
                    {receivedShifts.length > 0 && (
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: 6 }}>✅ Confirmed Payments</div>
                            {receivedShifts.slice(0, 5).map(s => (
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: isCompactMobile ? 'stretch' : 'center', flexDirection: isCompactMobile ? 'column' : 'row', gap: 8, padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7', marginBottom: 4 }}>
                                    <div>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: '#166534' }}>{s.hospital}</div>
                                        <div style={{ fontSize: 12, color: '#15803d' }}>{s.date} · {s.patients} pts · Deposited: {s.receivedDate}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                        <button onClick={() => toggleWhtCert(s.id, s.whtCertReceived)} title="Toggle WHT/AIT certificate collected" style={{ padding: '4px 10px', borderRadius: 6, fontSize: 11.5, fontWeight: 700, cursor: 'pointer', border: s.whtCertReceived ? 'none' : '1.5px dashed #f59e0b', background: s.whtCertReceived ? '#dcfce7' : '#fffbeb', color: s.whtCertReceived ? '#16a34a' : '#b45309' }}>
                                            {s.whtCertReceived ? '🧾 Cert ✓' : '🧾 Cert missing'}
                                        </button>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>✓ {fmt(s.expected)}</span>
                                    </div>
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

                {/* Per-Hospital WHT/AIT Certificate Tracker — what the auditor asks for */}
                <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                    <h3 style={cardTitle}>🏥 Per-Hospital WHT/AIT Certificate Tracker</h3>
                    {hospitalWht.length === 0 ? (
                        <div style={{ padding: '1.25rem', borderRadius: 12, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13.5 }}>
                            Once payouts are marked ✅ Received, each hospital appears here with its estimated 5% WHT and certificate checklist — exactly what you hand your auditor at filing time.
                        </div>
                    ) : isCompactMobile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {hospitalWht.map(h => (
                                <div key={h.hospital} style={{ padding: '14px', borderRadius: 14, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>{h.hospital}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12.5 }}>
                                        <div>Payouts: <strong>{h.shifts}</strong></div>
                                        <div>Gross: <strong>{fmt(h.grossReceived)}</strong></div>
                                        <div>Est. WHT 5%: <strong style={{ color: '#ef4444' }}>{fmt(h.whtEstimated)}</strong></div>
                                        <div>Certs: <strong style={{ color: h.certsMissing > 0 ? '#b45309' : '#16a34a' }}>{h.certsCollected}/{h.shifts}</strong></div>
                                    </div>
                                    {h.certsMissing > 0 && <div style={{ marginTop: 8, fontSize: 12, color: '#b45309', fontWeight: 600 }}>⚠️ {h.certsMissing} certificate{h.certsMissing > 1 ? 's' : ''} to collect from accounts dept.</div>}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {['Hospital/Clinic', 'Payouts', 'Gross Received', 'Est. WHT (5%)', 'Certificates', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#475569', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>{hospitalWht.map(h => (
                                <tr key={h.hospital} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#0f172a' }}>{h.hospital}</td>
                                    <td style={{ padding: '0.5rem', color: '#334155' }}>{h.shifts}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 600, color: '#22c55e' }}>{fmt(h.grossReceived)}</td>
                                    <td style={{ padding: '0.5rem', color: '#ef4444', fontWeight: 600 }}>{fmt(h.whtEstimated)}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 700, color: h.certsMissing > 0 ? '#b45309' : '#16a34a' }}>{h.certsCollected}/{h.shifts} collected</td>
                                    <td style={{ padding: '0.5rem', fontSize: '0.8rem', color: h.certsMissing > 0 ? '#b45309' : '#16a34a' }}>{h.certsMissing > 0 ? `Collect ${h.certsMissing} cert${h.certsMissing > 1 ? 's' : ''}` : 'Filing-ready ✓'}</td>
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
                        ⚠️ 5% service-fee AIT/WHT may apply when the payer withholds tax. Confirm actual deductions using hospital WHT certificates before filing.
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

        const handleAddAppointment = async (e: React.FormEvent) => {
            e.preventDefault();
            if (!appointmentForm.patient.trim() || !appointmentForm.date || !localUid) return;
            try {
                const saved = await addAppointment(localUid, {
                    patient: appointmentForm.patient.trim(),
                    type: appointmentForm.type,
                    time: appointmentForm.time || 'Time not set',
                    hospital: appointmentForm.hospital.trim() || 'Clinic',
                    date: appointmentForm.date,
                    status: 'confirmed',
                });
                setAppointmentsData(prev => [...prev, saved].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)));
            } catch (err) {
                console.error('Failed to save appointment:', err);
            }
            setShowAddAppointment(false);
            setAppointmentForm({ patient: '', type: 'Consultation', time: '', hospital: '', date: new Date().toISOString().split('T')[0] });
        };

        const setProgress = (id: string, progress: 'arrived' | 'completed' | 'no-show') => {
            setAppointmentStatuses(prev => ({ ...prev, [id]: progress }));
            updateAppointment(id, { progress }).catch(err => console.error('Failed to update appointment:', err));
        };

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: stackGap, marginBottom: '1.25rem' }}>
                    <KPICard icon="📅" label="Today" value={String(today.length)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="📋" label="Upcoming" value={String(upcoming.length)} changeType="neutral" color="#3b82f6" compact={isCompactMobile} />
                    <KPICard icon="✅" label="Confirmed" value={String(appointmentsData.filter(a => a.status === 'confirmed').length)} changeType="up" color="#22c55e" compact={isCompactMobile} />
                    <KPICard icon="⏳" label="Pending" value={String(appointmentsData.filter(a => a.status === 'pending').length)} changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
                </div>

                {/* Add Appointment */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                    <button onClick={() => setShowAddAppointment(true)} style={actionBtn('#6366f1')}>+ Add Appointment</button>
                </div>
                {showAddAppointment && (
                    <form onSubmit={handleAddAppointment} style={{ ...cardStyle, padding: '1rem', marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(5, 1fr)'), gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Patient *</label>
                                <input value={appointmentForm.patient} onChange={e => setAppointmentForm(p => ({ ...p, patient: e.target.value }))} placeholder="Patient name" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Type</label>
                                <select value={appointmentForm.type} onChange={e => setAppointmentForm(p => ({ ...p, type: e.target.value }))} style={inputStyle}>
                                    {['Consultation', 'Follow-up', 'Lab Review', 'Procedure', 'Channeling'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Date *</label>
                                <input type="date" value={appointmentForm.date} onChange={e => setAppointmentForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Time</label>
                                <input type="time" value={appointmentForm.time} onChange={e => setAppointmentForm(p => ({ ...p, time: e.target.value }))} style={inputStyle} />
                            </div>
                            <div>
                                <label style={labelStyle}>Hospital/Clinic</label>
                                <input list="sl-hospitals-appt" value={appointmentForm.hospital} onChange={e => setAppointmentForm(p => ({ ...p, hospital: e.target.value }))} placeholder="Clinic" style={inputStyle} />
                                <datalist id="sl-hospitals-appt">
                                    {SL_CHANNELING_HOSPITALS.map(h => <option key={h} value={h} />)}
                                </datalist>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.75rem', flexDirection: isCompactMobile ? 'column-reverse' : 'row' }}>
                            <button type="button" onClick={() => setShowAddAppointment(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                            <button type="submit" style={actionBtn('#22c55e')}>✅ Save Appointment</button>
                        </div>
                        <div style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>🔒 Appointments are stored on this device only (PDPA — patient data never leaves your phone/computer).</div>
                    </form>
                )}

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
                                {(['arrived', 'completed', 'no-show'] as const).map(s => {
                                    const current = appointmentStatuses[a.id] || a.progress || a.status;
                                    const isActive = current === s;
                                    const colors: Record<string, string> = { arrived: '#3b82f6', completed: '#22c55e', 'no-show': '#ef4444' };
                                    const icons: Record<string, string> = { arrived: '👋', completed: '✅', 'no-show': '❌' };
                                    return (
                                        <button key={s} onClick={() => setProgress(a.id, s)}
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
                <KPICard icon="💰" label="This Month" value={fmt(currentMonthIncome)} change={invoices.length ? `${invoices.length} records` : 'No records yet'} changeType="neutral" color="#22c55e" compact={isCompactMobile} />
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
                {incomeSources.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(4, 1fr)', '1fr 1fr'), gap: '0.75rem', padding: '0.5rem 0' }}>
                        {incomeSources.slice(0, 4).map((src) => (
                            <div key={src.name} style={{ padding: '0.75rem', background: `${src.color}08`, borderRadius: 10, border: `1px solid ${src.color}20` }}>
                                <div style={{ fontSize: '0.875rem', color: '#475569', marginBottom: 5, fontWeight: 500 }}>{src.name}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{fmt(src.amount)}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '1.5rem', borderRadius: 14, background: '#f8fafc', border: '1px dashed #cbd5e1', color: '#64748b', fontSize: 13.5 }}>
                        Start by logging one channeling, clinic, or consultancy payment. Source cards will build from your real records.
                    </div>
                )}
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
                    <KPICard icon="💸" label="This Month" value={fmt(currentMonthExpenses)} change={expenses.length ? `${expenses.length} records` : 'No records yet'} changeType="neutral" color="#ef4444" compact={isCompactMobile} />
                    <KPICard icon="📊" label="This Week" value={fmt(thisWeekExpenses)} changeType="neutral" color="#6366f1" compact={isCompactMobile} />
                    <KPICard icon="📉" label="Avg Daily" value={fmt(avgDailyExpense)} changeType="neutral" color="#8b5cf6" compact={isCompactMobile} />
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
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>📜 The Golden List — Auditor-Ready Claim Categories</h3>
                            <button onClick={() => setShowGoldenList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400e' }}>✕</button>
                        </div>
                        <div style={{ padding: '0.5rem', background: '#fef9c3', borderRadius: 8, marginBottom: '0.75rem', fontSize: 12, color: '#854d0e' }}>
                            ⚠️ <strong>Important:</strong> Keep claims tied to private/business practice income and supporting receipts. Final treatment should be confirmed with your auditor or tax advisor.
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
                            ✨ <strong>Pro Tip:</strong> MyTracksy logs itself as professional software for auditor review instead of promising automatic deductibility.
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
                                    <label style={labelStyle}>Category (Auditor Review)</label>
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
                    <h3 style={cardTitle}>📂 Expense Categories (Auditor Review)</h3>
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
                            <button onClick={() => walletData.linkPayHereCard()} style={{
                                background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)',
                                color: 'white', borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                                fontSize: '0.8rem', fontWeight: 600,
                            }}>
                                {walletData.onlineCheckoutEnabled ? '🔗 Link Card' : '🧾 Request Setup'}
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
                    {walletData.onlineCheckoutEnabled
                        ? 'Tokens are used for AI features. Purchase via web portal to avoid app store fees.'
                        : `${walletData.paymentNotice} Request a MyTracksy invoice to top up tokens.`}
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
                        <button disabled={!walletData.onlineCheckoutEnabled} onClick={() => walletData.toggleAutoReload(!walletData.autoReloadEnabled)} style={{
                            width: 48, height: 26, borderRadius: 13, border: 'none', cursor: walletData.onlineCheckoutEnabled ? 'pointer' : 'not-allowed',
                            background: walletData.autoReloadEnabled && walletData.onlineCheckoutEnabled ? '#6366f1' : '#cbd5e1',
                            position: 'relative', transition: 'background 0.3s',
                            opacity: walletData.onlineCheckoutEnabled ? 1 : 0.65,
                        }}>
                            <div style={{
                                width: 20, height: 20, borderRadius: '50%', background: 'white',
                                position: 'absolute', top: 3,
                                left: walletData.autoReloadEnabled && walletData.onlineCheckoutEnabled ? 25 : 3,
                                transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                            }} />
                        </button>
                    </div>
                    {!walletData.onlineCheckoutEnabled && (
                        <div style={{ padding: '0.75rem', background: '#fffbeb', borderRadius: 8, fontSize: '0.8rem', color: '#92400e', border: '1px solid #fde68a' }}>
                            Auto-reload will be available after MyTracksy online checkout is approved.
                        </div>
                    )}
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
                    {walletData.onlineCheckoutEnabled && !walletData.savedCard && walletData.autoReloadEnabled && (
                        <div style={{ padding: '0.75rem', background: '#fef2f2', borderRadius: 8, fontSize: '0.8rem', color: '#991b1b', border: '1px solid #fecaca' }}>
                            ⚠️ Link a card first to enable auto-reload. <button onClick={() => walletData.linkPayHereCard()} style={{ color: '#6366f1', fontWeight: 600, background: 'transparent', border: 0, padding: 0, cursor: 'pointer' }}>Link now →</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!localUid) return;
        try {
            const saved = await savePracticeProfile(localUid, {
                slmcNo: profileForm.slmcNo.trim() || undefined,
                specialization: profileForm.specialization.trim() || undefined,
                slmcRenewalDate: profileForm.slmcRenewalDate || undefined,
                indemnityProvider: profileForm.indemnityProvider.trim() || undefined,
                indemnityExpiry: profileForm.indemnityExpiry || undefined,
                cpdPoints: profileForm.cpdPoints || 0,
                irdTin: profileForm.irdTin.trim() || undefined,
                primaryHospital: loggedCentersLabel(channelingShifts) || undefined,
            });
            setPracticeProfile(saved);
            setProfileSaved(true);
            setTimeout(() => setProfileSaved(false), 2500);
        } catch (err) {
            console.error('Failed to save practice profile:', err);
        }
    };

    const renderSettings = () => (
        <div>
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding }}>
                <h3 style={cardTitle}>⚙️ Medical Practice Settings</h3>
                <form onSubmit={handleSaveProfile}>
                    <div style={{ display: 'grid', gridTemplateColumns: gridColumns('repeat(2, 1fr)'), gap: '0.75rem' }}>
                        <div>
                            <label style={labelStyle}>🩺 SLMC Registration #</label>
                            <input value={profileForm.slmcNo} onChange={e => setProfileForm(p => ({ ...p, slmcNo: e.target.value }))} placeholder="e.g. 35421" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>🔬 Specialization</label>
                            <input value={profileForm.specialization} onChange={e => setProfileForm(p => ({ ...p, specialization: e.target.value }))} placeholder="e.g. General Practice, Cardiology" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>📅 SLMC Renewal Due</label>
                            <input type="date" value={profileForm.slmcRenewalDate} onChange={e => setProfileForm(p => ({ ...p, slmcRenewalDate: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>📚 CPD Points (This Year)</label>
                            <input type="number" min="0" value={profileForm.cpdPoints || ''} onChange={e => setProfileForm(p => ({ ...p, cpdPoints: parseInt(e.target.value) || 0 }))} placeholder="0" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>🛡️ Indemnity Provider</label>
                            <input value={profileForm.indemnityProvider} onChange={e => setProfileForm(p => ({ ...p, indemnityProvider: e.target.value }))} placeholder="e.g. SLMA / Ceylinco / AIA" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>🗓️ Indemnity Expiry</label>
                            <input type="date" value={profileForm.indemnityExpiry} onChange={e => setProfileForm(p => ({ ...p, indemnityExpiry: e.target.value }))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>🔑 IRD TIN (required for APIT)</label>
                            <input value={profileForm.irdTin} onChange={e => setProfileForm(p => ({ ...p, irdTin: e.target.value }))} placeholder="Taxpayer Identification Number" style={inputStyle} />
                        </div>
                        <div>
                            <label style={labelStyle}>🏥 Primary Hospital (auto)</label>
                            <input value={loggedCentersLabel(channelingShifts) || 'Logged from channeling shifts'} disabled style={{ ...inputStyle, background: '#f8fafc', color: '#64748b' }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', justifyContent: 'flex-end', marginTop: '0.85rem' }}>
                        {profileSaved && <span style={{ fontSize: 13, fontWeight: 700, color: '#16a34a' }}>✓ Saved</span>}
                        <button type="submit" style={actionBtn('#6366f1')}>💾 Save Practice Profile</button>
                    </div>
                </form>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.85rem' }}>
                    {[
                        { label: 'WHT Certificate Status', value: channelingShifts.length ? `${channelingShifts.filter(s => s.status === 'received' && !s.whtCertReceived).length} certificates to collect` : 'No payout records yet', icon: '🧾' },
                        { label: 'Currency', value: 'LKR (Sri Lankan Rupee)', icon: '💱' },
                        { label: 'Tax Year', value: '2025/2026 (April – March)', icon: '📋' },
                    ].map((s) => (
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

            {/* Wallet Settings */}
            <div style={{ ...cardStyle, padding: isCompactMobile ? '1rem' : cardStyle.padding, marginTop: '1.25rem' }}>
                <h3 style={cardTitle}>🪙 Wallet & Billing</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { label: 'Token Balance', value: `${walletData.tokenBalance} tokens`, icon: '🪙' },
                        { label: 'Saved Payment Card', value: walletData.savedCard ? `${walletData.savedCard.type} •••• ${walletData.savedCard.masked}` : 'Not linked', icon: '💳' },
                        { label: 'Auto-Reload', value: walletData.autoReloadEnabled ? 'Enabled' : 'Disabled', icon: '🔄' },
                        { label: 'Total Spent', value: `LKR ${walletData.totalSpentLKR.toLocaleString()}`, icon: '💰' },
                        { label: 'Professional Software', value: `LKR ${walletData.totalSpentLKR.toLocaleString()} — queued for auditor review`, icon: '🧾' },
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
