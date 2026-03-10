import React, { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';
import VoiceInput, { ParsedVoiceAction } from '../VoiceInput';
import PrescriptionPad from '../PrescriptionPad';
import TaxSpeedometer from '../TaxSpeedometer';
import ReceiptScanner from '../ReceiptScanner';
import AuditorExport from '../AuditorExport';
import TransactionInbox from '../TransactionInbox';
import { GOLDEN_LIST, autoCategorizeDr, getCategoryByName, isCapitalItem } from '../../config/goldenListCategories';
import { useAuth } from '../../contexts/AuthContext';
import {
    addTransaction, subscribeTransactions, seedChartOfAccounts,
    subscribeGovIncomeConfig, toCents, fromCents,
} from '../../services/accountingCoreService';

interface MedicalDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
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
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Medical-specific expense categories
// Use GOLDEN_LIST from shared config — legally-grounded tax categories
const medicalExpenseCategories = GOLDEN_LIST.map(c => ({ name: c.name, icon: c.icon, color: c.color }));

// Sample data — these would come from Firestore in production
const sampleInvoices: Transaction[] = [
    { id: '1', type: 'income', amount: 15000, description: 'Consultation — Dr. Perera', category: 'Consultation', date: '2026-03-10', status: 'paid' },
    { id: '2', type: 'income', amount: 85000, description: 'Surgery — Lanka Hospitals', category: 'Surgery', date: '2026-03-08', status: 'paid' },
    { id: '3', type: 'income', amount: 25000, description: 'Follow-up — Asiri Hospital', category: 'Follow-up', date: '2026-03-07', status: 'pending' },
    { id: '4', type: 'income', amount: 45000, description: 'Lab Work — Nawaloka', category: 'Lab Work', date: '2026-03-05', status: 'overdue' },
];

const sampleExpenses: Transaction[] = [
    { id: '5', type: 'expense', amount: 12000, description: 'Stethoscope calibration', category: 'Medical Equipment', date: '2026-03-09', status: 'completed' },
    { id: '6', type: 'expense', amount: 35000, description: 'CME Workshop — Cardiology', category: 'CME / Training', date: '2026-03-06', status: 'completed' },
    { id: '7', type: 'expense', amount: 8500, description: 'Medical journal subscription', category: 'Medical Subscriptions', date: '2026-03-04', status: 'completed' },
    { id: '8', type: 'expense', amount: 5200, description: 'Fuel — hospital visits', category: 'Vehicle / Transport', date: '2026-03-03', status: 'completed' },
];

const sampleBankAccounts = [
    { id: 'b1', name: 'BOC Savings', bank: 'Bank of Ceylon', balance: 1250000, type: 'savings' },
    { id: 'b2', name: 'Commercial Current', bank: 'Commercial Bank', balance: 485000, type: 'current' },
    { id: 'b3', name: 'HNB Fixed Deposit', bank: 'HNB', balance: 2000000, type: 'fixed' },
];

const sampleCheques = [
    { id: 'c1', number: 'CHQ-00142', party: 'Lanka Hospitals', amount: 85000, date: '2026-03-15', type: 'received', status: 'pending' },
    { id: 'c2', number: 'CHQ-00143', party: 'Medical Supplies Ltd', amount: 45000, date: '2026-03-12', type: 'issued', status: 'cleared' },
    { id: 'c3', number: 'CHQ-00144', party: 'Asiri Hospital', amount: 25000, date: '2026-03-20', type: 'received', status: 'pending' },
];

const samplePatients = [
    { id: 'p1', name: 'Kumara Bandara', nic: '891234567V', phone: '077-1234567', age: 37, blood: 'B+', allergies: 'Penicillin', lastVisit: '2026-03-10', visits: 12 },
    { id: 'p2', name: 'Anoma Wickramasinghe', nic: '952345678V', phone: '071-9876543', age: 31, blood: 'O+', allergies: 'None', lastVisit: '2026-03-08', visits: 5 },
    { id: 'p3', name: 'Ranjith Fernando', nic: '780987654V', phone: '076-5551234', age: 48, blood: 'A-', allergies: 'Sulfa drugs', lastVisit: '2026-03-05', visits: 23 },
    { id: 'p4', name: 'Dilani Perera', nic: '880345612V', phone: '070-8887766', age: 38, blood: 'AB+', allergies: 'None', lastVisit: '2026-03-01', visits: 8 },
    { id: 'p5', name: 'Mohamed Farook', nic: '920567890V', phone: '077-3332211', age: 34, blood: 'O-', allergies: 'Aspirin', lastVisit: '2026-02-28', visits: 3 },
];

const channelingData = [
    { id: 'ch1', hospital: 'Asiri Central', day: 'Mon & Thu', time: '4:00 PM – 7:00 PM', fee: 3500, doctorShare: 2500, hospitalShare: 1000, avgPatients: 15 },
    { id: 'ch2', hospital: 'Lanka Hospitals', day: 'Tue & Fri', time: '5:00 PM – 8:00 PM', fee: 4000, doctorShare: 3000, hospitalShare: 1000, avgPatients: 12 },
    { id: 'ch3', hospital: 'Nawaloka Hospital', day: 'Wed', time: '6:00 PM – 9:00 PM', fee: 3000, doctorShare: 2200, hospitalShare: 800, avgPatients: 18 },
    { id: 'ch4', hospital: 'Private Clinic (Nugegoda)', day: 'Sat', time: '9:00 AM – 1:00 PM', fee: 2000, doctorShare: 2000, hospitalShare: 0, avgPatients: 25 },
];

const appointmentsData = [
    { id: 'a1', patient: 'Kumara Bandara', type: 'Follow-up', time: '4:00 PM', hospital: 'Asiri Central', date: '2026-03-10', status: 'confirmed' as const },
    { id: 'a2', patient: 'New Patient', type: 'Consultation', time: '4:30 PM', hospital: 'Asiri Central', date: '2026-03-10', status: 'confirmed' as const },
    { id: 'a3', patient: 'Ranjith Fernando', type: 'Lab Review', time: '5:15 PM', hospital: 'Asiri Central', date: '2026-03-10', status: 'confirmed' as const },
    { id: 'a4', patient: 'Dilani Perera', type: 'Consultation', time: '5:00 PM', hospital: 'Lanka Hospitals', date: '2026-03-11', status: 'confirmed' as const },
    { id: 'a5', patient: 'Mohamed Farook', type: 'Follow-up', time: '5:30 PM', hospital: 'Lanka Hospitals', date: '2026-03-11', status: 'pending' as const },
    { id: 'a6', patient: 'Walk-in', type: 'Consultation', time: '6:00 PM', hospital: 'Nawaloka Hospital', date: '2026-03-12', status: 'pending' as const },
    { id: 'a7', patient: 'Anoma Wickramasinghe', type: 'Prescription Renewal', time: '9:30 AM', hospital: 'Private Clinic (Nugegoda)', date: '2026-03-13', status: 'confirmed' as const },
    { id: 'a8', patient: 'New Patient', type: 'Consultation', time: '10:00 AM', hospital: 'Private Clinic (Nugegoda)', date: '2026-03-13', status: 'pending' as const },
];

const MedicalDashboard: React.FC<MedicalDashboardProps> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid;

    const [activeNav, setActiveNav] = useState('overview');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [invoices, setInvoices] = useState<Transaction[]>(sampleInvoices);
    const [expenses, setExpenses] = useState<Transaction[]>(sampleExpenses);
    const [firestoreReady, setFirestoreReady] = useState(false);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, category: GOLDEN_LIST[0].name, date: new Date().toISOString().split('T')[0] });
    const [showGoldenList, setShowGoldenList] = useState(false);
    const [quickNotes, setQuickNotes] = useState<{ id: string; text: string; time: string; patient?: string; type: string }[]>([
        { id: 'qn1', text: 'Kumara BP 140/90 — started Losartan 50mg', time: '4:15 PM', patient: 'Kumara Bandara', type: 'vitals' },
        { id: 'qn2', text: 'Anoma — follow up in 2 weeks for blood sugar', time: '5:30 PM', patient: 'Anoma Wickramasinghe', type: 'follow-up' },
        { id: 'qn3', text: 'Ranjith — refer to cardiologist Dr. Silva', time: '6:00 PM', patient: 'Ranjith Fernando', type: 'referral' },
    ]);
    const [appointmentStatuses, setAppointmentStatuses] = useState<Record<string, string>>({});
    const [noteText, setNoteText] = useState('');

    // ===== Dual-Income State =====
    const [govSalary] = useState(185000); // Monthly MoH base salary
    const [datAllowance] = useState(25000); // DAT allowance
    const govMonthly = govSalary + datAllowance;
    const govAnnual = govMonthly * 12;
    const govAPIT = Math.round(govAnnual * 0.12); // Simplified APIT for demo

    // ===== AUTO-SEED CHART OF ACCOUNTS =====
    useEffect(() => {
        if (!uid) return;
        seedChartOfAccounts(uid, 'medical').catch(err =>
            console.error('Failed to seed chart of accounts:', err)
        );
    }, [uid]);

    // ===== FIRESTORE REAL-TIME SUBSCRIPTIONS (Universal) =====
    useEffect(() => {
        if (!uid) return; // Demo mode — keep sample data

        // Subscribe to cleared income from unified transactions
        const unsubIncome = subscribeTransactions(uid, (txns) => {
            if (txns.length > 0) {
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
            } else if (!firestoreReady) {
                setFirestoreReady(true);
            }
        }, { type: 'income', status: 'cleared' });

        // Subscribe to cleared expenses from unified transactions
        const unsubExpenses = subscribeTransactions(uid, (txns) => {
            if (txns.length > 0) {
                setExpenses(txns.map(t => ({
                    id: t.id || '',
                    type: 'expense' as const,
                    amount: fromCents(t.amount_cents),
                    description: t.description,
                    category: t.category_name || '',
                    date: t.date,
                    status: 'completed',
                })));
            }
        }, { type: 'expense', status: 'cleared' });

        // Subscribe to government income config
        const unsubGov = subscribeGovIncomeConfig(uid, (config) => {
            if (config) {
                // Could update govSalary/datAllowance states here in future
            }
        });

        return () => {
            unsubIncome();
            unsubExpenses();
            unsubGov();
        };
    }, [uid]);

    // ===== Channeling Payment Tracker State =====
    const [channelingShifts, setChannelingShifts] = useState<{ id: string; hospital: string; date: string; patients: number; expected: number; status: 'pending' | 'received' | 'overdue'; receivedDate?: string }[]>([
        { id: 'cs1', hospital: 'Asiri Central', date: '2026-03-08', patients: 14, expected: 35000, status: 'received', receivedDate: '2026-03-10' },
        { id: 'cs2', hospital: 'Lanka Hospitals', date: '2026-03-07', patients: 10, expected: 30000, status: 'pending' },
        { id: 'cs3', hospital: 'Nawaloka Hospital', date: '2026-03-05', patients: 18, expected: 39600, status: 'overdue' },
        { id: 'cs4', hospital: 'Asiri Central', date: '2026-03-01', patients: 16, expected: 40000, status: 'received', receivedDate: '2026-03-04' },
        { id: 'cs5', hospital: 'Lanka Hospitals', date: '2026-02-28', patients: 12, expected: 36000, status: 'overdue' },
        { id: 'cs6', hospital: 'Private Clinic (Nugegoda)', date: '2026-03-09', patients: 22, expected: 44000, status: 'pending' },
    ]);
    const [showAddShift, setShowAddShift] = useState(false);
    const [shiftForm, setShiftForm] = useState({ hospital: channelingData[0].hospital, date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });

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

    // Private income calculations
    const privateIncome = invoices.reduce((s, t) => s + t.amount, 0);
    const privateAnnual = privateIncome * 12;
    const totalWHT = Math.round(privateAnnual * 0.05);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview':
                return renderOverview();
            case 'inbox':
                return <TransactionInbox />;
            case 'today':
                return renderTodaySchedule();
            case 'quicknotes':
                return renderQuickNotes();
            case 'patients':
                return renderPatients();
            case 'prescriptions':
                return <PrescriptionPad />;
            case 'channeling':
                return renderChanneling();
            case 'appointments':
                return renderAppointments();
            case 'income':
                return renderIncome();
            case 'expenses':
                return renderExpenses();
            case 'tax':
                return <TaxSpeedometer annualPrivateIncome={privateAnnual} annualGovIncome={govAnnual} annualExpenses={totalExpenses * 12} whtDeducted={totalWHT} />;
            case 'receipts':
                return <ReceiptScanner />;
            case 'banking':
                return renderBanking();
            case 'reports':
                return renderReports();
            case 'export':
                return <AuditorExport invoices={invoices} expenses={expenses} />;
            case 'settings':
                return renderSettings();
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="🏥" label="Gov Hospital" value="Done" change="4 activities" changeType="up" color="#22c55e" />
                    <KPICard icon="🩺" label="Private Clinics" value="2 sessions" change="23 patients est." changeType="neutral" color="#6366f1" />
                    <KPICard icon="💰" label="Today's Earnings" value={fmt(todayEarnings)} change="So far" changeType="up" color="#f59e0b" />
                    <KPICard icon="✅" label="Completed" value={`${completedCount}/${allSlots.length}`} changeType="neutral" color="#3b82f6" />
                </div>

                {/* Timeline */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>🕐 Today's Timeline — {new Date().toLocaleDateString('en-LK', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                    <div style={{ position: 'relative', paddingLeft: 30 }}>
                        {/* Timeline line */}
                        <div style={{ position: 'absolute', left: 13, top: 0, bottom: 0, width: 2, background: 'linear-gradient(to bottom, #22c55e, #6366f1)' }} />

                        {/* Gov section header */}
                        <div style={{ padding: '8px 0 4px', fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🏛️ Government Hospital</div>
                        {govSchedule.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: s.status === 'completed' ? '#22c55e' : '#e2e8f0', border: '2px solid white', boxShadow: '0 0 0 2px ' + (s.status === 'completed' ? '#22c55e' : '#e2e8f0') }} />
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', minWidth: 65 }}>{s.time}</div>
                                <div style={{ fontSize: 14, fontWeight: 500, color: s.status === 'completed' ? '#94a3b8' : '#1e293b', textDecoration: s.status === 'completed' ? 'line-through' : 'none' }}>{s.activity}</div>
                                {s.status === 'completed' && <span style={{ fontSize: 11, background: '#dcfce7', color: '#22c55e', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>✓ Done</span>}
                            </div>
                        ))}

                        {/* Private section header */}
                        <div style={{ padding: '12px 0 4px', fontSize: 11, fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.06em' }}>🩺 Private Practice</div>
                        {privateSchedule.map((s, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', position: 'relative' }}>
                                <div style={{ position: 'absolute', left: -22, width: 12, height: 12, borderRadius: '50%', background: s.status === 'active' ? '#f59e0b' : s.status === 'completed' ? '#22c55e' : '#e2e8f0', border: '2px solid white', boxShadow: '0 0 0 2px ' + (s.status === 'active' ? '#f59e0b' : '#e2e8f0'), animation: s.status === 'active' ? 'voicePulse 2s infinite' : 'none' }} />
                                <div style={{ fontSize: 12, fontWeight: 700, color: s.status === 'active' ? '#f59e0b' : '#94a3b8', minWidth: 65 }}>{s.time}</div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="📝" label="Total Notes" value={String(quickNotes.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="❤️" label="Vitals" value={String(quickNotes.filter(n => n.type === 'vitals').length)} changeType="neutral" color="#ef4444" />
                    <KPICard icon="🔁" label="Follow-ups" value={String(quickNotes.filter(n => n.type === 'follow-up').length)} changeType="neutral" color="#3b82f6" />
                </div>

                {/* Add Note */}
                <div style={{ ...cardStyle, marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                    <h3 style={{ ...cardTitle, margin: '0 0 0.5rem' }}>📝 Add Quick Note</h3>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input value={noteText} onChange={e => setNoteText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') addNote(); }} placeholder="Type a note or use the mic button →" style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                        <button onClick={addNote} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>+ Add</button>
                    </div>
                    <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>💡 Tip: Use the floating 🎤 button to add notes by voice — say "Note: BP 140 over 90"</div>
                </div>

                {/* Notes List */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📋 Recent Notes</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {quickNotes.map(note => {
                            const nt = noteTypes[note.type] || noteTypes.note;
                            return (
                                <div key={note.id} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${nt.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{nt.icon}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', lineHeight: 1.5 }}>{note.text}</div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, display: 'flex', gap: 12 }}>
                                            <span>🕐 {note.time}</span>
                                            {note.patient && <span>🧑‍⚕️ {note.patient}</span>}
                                            <span style={{ background: `${nt.color}15`, color: nt.color, padding: '1px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>{note.type}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => setQuickNotes(prev => prev.filter(n => n.id !== note.id))} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                                </div>
                            );
                        })}
                        {quickNotes.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>No notes yet. Use voice or type above to add notes.</div>}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    {/* Government Bucket */}
                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #065f46, #047857)', color: 'white', borderColor: '#059669' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, opacity: 0.9 }}>🏛️ Government Income</h3>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>Employment</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>MoH Base Salary</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(govSalary)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>DAT Allowance</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(datAllowance)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>APIT Deducted (Monthly)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(Math.round(govAPIT / 12))}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>Net Take-Home</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{fmt(govNetMonthly)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Private Bucket */}
                    <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #312e81, #4338ca)', color: 'white', borderColor: '#6366f1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, opacity: 0.9 }}>🩺 Private Practice Income</h3>
                            <span style={{ fontSize: 11, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: 6, fontWeight: 600 }}>Business</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>Channeling/Clinic</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 700 }}>{fmt(totalIncome)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>WHT Deducted (5%)</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(Math.round(totalIncome * 0.05))}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>Practice Expenses</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>−{fmt(totalExpenses)}</div>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.75rem', borderRadius: 10 }}>
                                <div style={{ fontSize: 11, opacity: 0.7 }}>Net Private Income</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{fmt(privateNet - Math.round(totalIncome * 0.05) - totalExpenses)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Total Wealth Strip */}
                <div style={{ ...cardStyle, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #0f172a, #1e293b)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem' }}>
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
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>+ Create Invoice</button>
                    <button onClick={() => { setActiveNav('expenses'); setShowAddExpense(true); }} style={actionBtn('#ef4444')}>+ Add Expense</button>
                    <button onClick={() => setActiveNav('quicknotes')} style={actionBtn('#8b5cf6')}>📝 Quick Note</button>
                    <button onClick={() => setActiveNav('today')} style={actionBtn('#f59e0b')}>🕐 Today</button>
                    <button onClick={() => setActiveNav('tax')} style={actionBtn('#06b6d4')}>🧾 Tax & IRD</button>
                    <button onClick={() => setActiveNav('receipts')} style={actionBtn('#22c55e')}>📸 Scan Receipt</button>
                    <button onClick={() => setActiveNav('export')} style={actionBtn('#1e293b')}>📦 Auditor Export</button>
                </div>

                {/* Charts Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={cardStyle}>
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
                                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{month}</span>
                                    </div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#22c55e' }}>● Income</span>
                            <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>● Expenses</span>
                        </div>
                    </div>

                    <div style={cardStyle}>
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
                <TransactionList transactions={[...invoices, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)} title="Recent Transactions" />
            </div>
        );
    };

    /* ========== PATIENTS ========== */
    const renderPatients = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="🧑‍⚕️" label="Total Patients" value={String(samplePatients.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="📅" label="This Month" value="12" change="+4" changeType="up" color="#22c55e" />
                <KPICard icon="🔁" label="Returning" value={String(samplePatients.filter(p => p.visits > 5).length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="⚠️" label="Allergies Noted" value={String(samplePatients.filter(p => p.allergies !== 'None').length)} changeType="neutral" color="#f59e0b" />
            </div>
            <div style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ ...cardTitle, margin: 0 }}>🧑‍⚕️ Patient Registry</h3>
                    <button style={actionBtn('#6366f1')}>+ Add Patient</button>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Name', 'NIC', 'Phone', 'Age', 'Blood', 'Allergies', 'Last Visit', 'Visits'].map(h => (
                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>{samplePatients.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{p.name}</td>
                            <td style={{ padding: '0.5rem', color: '#6366f1', fontFamily: 'monospace', fontSize: '0.8rem' }}>{p.nic}</td>
                            <td style={{ padding: '0.5rem' }}>{p.phone}</td>
                            <td style={{ padding: '0.5rem' }}>{p.age}</td>
                            <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, background: '#fef2f2', color: '#ef4444' }}>{p.blood}</span></td>
                            <td style={{ padding: '0.5rem', color: p.allergies !== 'None' ? '#ef4444' : '#94a3b8', fontWeight: p.allergies !== 'None' ? 600 : 400 }}>{p.allergies}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{p.lastVisit}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 600, color: '#6366f1' }}>{p.visits}</td>
                        </tr>
                    ))}</tbody>
                </table>
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
            setShiftForm({ hospital: channelingData[0].hospital, date: new Date().toISOString().split('T')[0], patients: 0, expected: 0 });
        };

        const markReceived = (id: string) => setChannelingShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'received' as const, receivedDate: new Date().toISOString().split('T')[0] } : s));

        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="🏥" label="Centers" value={String(channelingData.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="💰" label="Est. Monthly" value={fmt(totalMonthlyEst)} changeType="up" color="#22c55e" />
                    <KPICard icon="⏳" label="Pending" value={fmt(pendingTotal)} change={`${pendingShifts.length} shifts`} changeType="neutral" color="#f59e0b" />
                    <KPICard icon="🚨" label="Overdue" value={fmt(overdueTotal)} change={overdueShifts.length > 0 ? `${overdueShifts.length} unpaid!` : 'All clear'} changeType={overdueShifts.length > 0 ? 'down' : 'up'} color="#ef4444" />
                </div>

                {/* ===== PAYMENT TRACKER ===== */}
                <div style={{ ...cardStyle, marginBottom: '1rem', border: '2px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ ...cardTitle, margin: 0 }}>💸 Payment Tracker — "Missing Money" Finder</h3>
                        <button onClick={() => setShowAddShift(true)} style={actionBtn('#6366f1')}>+ Log Shift</button>
                    </div>

                    {/* Add Shift Form */}
                    {showAddShift && (
                        <form onSubmit={handleAddShift} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem' }}>
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
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: '0.75rem' }}>
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
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fef2f2', borderRadius: 8, border: '1.5px solid #fecaca', marginBottom: 6, animation: 'voicePulse 3s infinite' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 600, color: '#991b1b' }}>{s.hospital}</div>
                                        <div style={{ fontSize: 12, color: '#b91c1c' }}>{s.date} · {s.patients} patients · Expected: {fmt(s.expected)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
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
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', marginBottom: 6 }}>
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
                                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', background: '#f0fdf4', borderRadius: 8, border: '1px solid #dcfce7', marginBottom: 4 }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '1rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 10 }}>
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
                <div style={cardStyle}>
                    <h3 style={cardTitle}>🏥 Channeling Schedule & Fee Split</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                            {['Hospital/Clinic', 'Day', 'Time', 'Fee', 'Doctor Share', 'Hospital Share', 'Avg Patients'].map(h => (
                                <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                            ))}
                        </tr></thead>
                        <tbody>{channelingData.map(c => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.hospital}</td>
                                <td style={{ padding: '0.5rem' }}>{c.day}</td>
                                <td style={{ padding: '0.5rem', color: '#6366f1' }}>{c.time}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(c.fee)}</td>
                                <td style={{ padding: '0.5rem', color: '#22c55e', fontWeight: 600 }}>{fmt(c.doctorShare)}</td>
                                <td style={{ padding: '0.5rem', color: '#94a3b8' }}>{fmt(c.hospitalShare)}</td>
                                <td style={{ padding: '0.5rem', fontWeight: 600, color: '#3b82f6' }}>{c.avgPatients}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <div style={{ ...cardStyle, marginTop: '1rem', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <h3 style={{ ...cardTitle, color: '#92400e' }}>🧾 WHT (Withholding Tax) Summary</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
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
        const today = appointmentsData.filter(a => a.date === '2026-03-10');
        const upcoming = appointmentsData.filter(a => a.date > '2026-03-10');
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="📅" label="Today" value={String(today.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="📋" label="This Week" value={String(appointmentsData.length)} changeType="neutral" color="#3b82f6" />
                    <KPICard icon="✅" label="Confirmed" value={String(appointmentsData.filter(a => a.status === 'confirmed').length)} changeType="up" color="#22c55e" />
                    <KPICard icon="⏳" label="Pending" value={String(appointmentsData.filter(a => a.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
                </div>
                {/* Today's appointments */}
                <div style={{ ...cardStyle, marginBottom: '1rem' }}>
                    <h3 style={cardTitle}>📅 Today's Appointments — {today.length > 0 ? today[0].hospital : 'No appointments'}</h3>
                    {today.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: a.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', fontSize: '1.1rem' }}>
                                    {a.type === 'Follow-up' ? '🔁' : a.type === 'Lab Review' ? '🔬' : '🩺'}
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{a.patient}</div>
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.type} · {a.time}</div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                                {['arrived', 'completed', 'no-show'].map(s => {
                                    const current = appointmentStatuses[a.id] || a.status;
                                    const isActive = current === s;
                                    const colors: Record<string, string> = { arrived: '#3b82f6', completed: '#22c55e', 'no-show': '#ef4444' };
                                    const icons: Record<string, string> = { arrived: '👋', completed: '✅', 'no-show': '❌' };
                                    return (
                                        <button key={s} onClick={() => setAppointmentStatuses(prev => ({ ...prev, [a.id]: s }))}
                                            style={{ padding: '3px 8px', borderRadius: 6, fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer', border: isActive ? 'none' : '1px solid #e2e8f0', background: isActive ? `${colors[s]}15` : 'white', color: isActive ? colors[s] : '#94a3b8' }}>
                                            {icons[s]} {s}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                {/* Upcoming */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📋 Upcoming Appointments</h3>
                    {upcoming.map(a => (
                        <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{a.patient} — <span style={{ color: '#6366f1' }}>{a.type}</span></div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{a.hospital} · {a.date} · {a.time}</div>
                            </div>
                            <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: a.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: a.status === 'confirmed' ? '#22c55e' : '#f59e0b' }}>{a.status}</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Total Income" value={fmt(totalIncome)} change="+12.5%" changeType="up" color="#22c55e" />
                <KPICard icon="📋" label="Pending Invoices" value={String(pendingInvoices)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="⚠️" label="Overdue" value={String(invoices.filter((i) => i.status === 'overdue').length)} changeType="down" color="#ef4444" />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#22c55e')}>+ Create Invoice</button>
            </div>

            {/* Income Sources */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🏥 Income by Source</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { name: 'Asiri Hospital', amount: 125000, color: '#6366f1' },
                        { name: 'Lanka Hospitals', amount: 185000, color: '#8b5cf6' },
                        { name: 'Private Clinic', amount: 95000, color: '#22c55e' },
                        { name: 'Consultancy', amount: 45000, color: '#06b6d4' },
                    ].map((src) => (
                        <div key={src.name} style={{ padding: '0.75rem', background: `${src.color}08`, borderRadius: 10, border: `1px solid ${src.color}20` }}>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>{src.name}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>{fmt(src.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Invoice List */}
            <TransactionList transactions={invoices} title="Invoices" showFilter={false} />
        </div>
    );

    /* ========== EXPENSES ========== */
    const renderExpenses = () => {
        const selectedCat = getCategoryByName(expenseForm.category);
        return (
            <div>
                {/* Expense KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="💸" label="Total Expenses" value={fmt(totalExpenses)} change="-3.2%" changeType="down" color="#ef4444" />
                    <KPICard icon="📊" label="This Week" value={fmt(17200)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="📉" label="Avg Daily" value={fmt(2460)} changeType="neutral" color="#8b5cf6" />
                </div>

                {/* Add Expense Button */}
                <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <button onClick={() => setShowAddExpense(true)} style={actionBtn('#ef4444')}>+ Add Expense</button>
                    <button onClick={() => setShowGoldenList(!showGoldenList)} style={{ ...actionBtn('#f59e0b'), background: showGoldenList ? '#f59e0b' : '#fffbeb', color: showGoldenList ? 'white' : '#92400e', border: '1.5px solid #f59e0b' }}>📜 What Can I Claim?</button>
                </div>

                {/* ===== GOLDEN LIST EDUCATIONAL PANEL ===== */}
                {showGoldenList && (
                    <div style={{ ...cardStyle, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #fbbf24' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>📜 The Golden List — What Sri Lankan Doctors Can Legally Claim</h3>
                            <button onClick={() => setShowGoldenList(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400e' }}>✕</button>
                        </div>
                        <div style={{ padding: '0.5rem', background: '#fef9c3', borderRadius: 8, marginBottom: '0.75rem', fontSize: 12, color: '#854d0e' }}>
                            ⚠️ <strong>Important:</strong> Under Sri Lankan law, expenses CANNOT be claimed against Government salary (APIT income). These deductions apply ONLY to your private/business practice income.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                            {GOLDEN_LIST.filter(c => c.id !== 'other').map(cat => (
                                <div key={cat.id} style={{ padding: '0.75rem', background: 'white', borderRadius: 10, border: `1.5px solid ${cat.color}30` }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 20 }}>{cat.icon}</span>
                                        <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{cat.name}</span>
                                        {cat.isCapitalItem && <span style={{ fontSize: 10, background: '#f59e0b', color: 'white', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>DEPRECIATION</span>}
                                    </div>
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4, fontStyle: 'italic' }}>{cat.taxNote}</div>
                                    <div style={{ fontSize: 11, color: '#94a3b8' }}>e.g. {cat.examples.slice(0, 3).join(', ')}</div>
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
                    <div style={{ ...cardStyle, marginBottom: '1.5rem', border: '2px solid #6366f1' }}>
                        <h3 style={{ ...cardTitle, marginBottom: '1rem' }}>➕ Add New Expense</h3>
                        <form onSubmit={handleAddExpense}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
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
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.5rem' }}>
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
                            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowAddExpense(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                                <button type="submit" style={actionBtn('#6366f1')}>💾 Save Expense</button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Category Cards with Tax Notes */}
                <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                    <h3 style={cardTitle}>📂 Expense Categories (Tax Deductible)</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                        {medicalExpenseCategories.map((cat) => {
                            const catTotal = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                            const golden = getCategoryByName(cat.name);
                            return (
                                <div key={cat.name} style={{ padding: '0.85rem', background: `${cat.color}08`, borderRadius: 10, border: `1px solid ${cat.color}20`, textAlign: 'center', cursor: 'pointer', transition: 'transform 0.2s' }} title={golden?.taxNote || ''}>
                                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{cat.icon}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: 2 }}>{cat.name}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{fmt(catTotal)}</div>
                                    {golden?.isCapitalItem && <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600, marginTop: 2 }}>📐 DEPRECIATION</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Expense List */}
                <TransactionList transactions={expenses} title="All Expenses" showFilter={false} />
            </div>
        );
    };

    /* ========== BANKING ========== */
    const renderBanking = () => (
        <div>
            {/* Bank Accounts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {sampleBankAccounts.map((acc) => (
                    <div key={acc.id} style={{ ...cardStyle, borderTop: `3px solid ${acc.type === 'savings' ? '#22c55e' : acc.type === 'current' ? '#6366f1' : '#f59e0b'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e293b' }}>{acc.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{acc.type}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{fmt(acc.balance)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.bank}</div>
                    </div>
                ))}
            </div>

            {/* Total Balance */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Balance (All Accounts)</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(sampleBankAccounts.reduce((s, a) => s + a.balance, 0))}</div>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>🏦</div>
                </div>
            </div>

            {/* Cheque Management */}
            <div style={cardStyle}>
                <h3 style={cardTitle}>📝 Cheque Management</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {sampleCheques.map((chq) => (
                        <div key={chq.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
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
                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{chq.number} · {chq.date}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: chq.type === 'received' ? '#22c55e' : '#ef4444' }}>
                                    {chq.type === 'received' ? '+' : '-'}{fmt(chq.amount)}
                                </div>
                                <div style={{
                                    fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 10, display: 'inline-block',
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
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📊 Monthly Profit & Loss Statement</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                    <div style={plRow}>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>💰 Total Revenue</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(totalIncome)}</span>
                    </div>
                    <div style={{ height: 1, background: '#f1f5f9' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', margin: '0.25rem 0' }}>EXPENSES</div>
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
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🧾 Tax Summary (Estimated)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', padding: '0.5rem 0' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Gross Income</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmt(totalIncome)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Deductible Expenses</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{fmt(totalExpenses)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Taxable Income (Est.)</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#6366f1' }}>{fmt(netProfit)}</div>
                    </div>
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.8rem', color: '#92400e' }}>⚠️ This is an estimate only. Consult your tax advisor for official APIT / IRD calculations.</span>
                </div>
            </div>

            {/* Quick Reports */}
            <div style={cardStyle}>
                <h3 style={cardTitle}>📋 Available Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
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
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{r.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ========== SETTINGS ========== */
    const renderSettings = () => (
        <div>
            <div style={cardStyle}>
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
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: s.value.includes('Not set') || s.value.includes('pending') ? '#f59e0b' : '#64748b' }}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <DashboardLayout
                profession="medical"
                professionLabel="Medical Professional"
                professionIcon="🩺"
                userName={userName}
                navItems={navItems}
                activeNav={activeNav}
                onNavChange={setActiveNav}
                onChangeProfession={onChangeProfession}
                onLogout={onLogout}
            >
                {renderContent()}
            </DashboardLayout>

            {showInvoiceForm && (
                <InvoiceForm
                    onSubmit={handleCreateInvoice}
                    onCancel={() => setShowInvoiceForm(false)}
                />
            )}

            {/* Floating Voice Assistant */}
            <VoiceInput onAction={handleVoiceAction} position="float" />
        </>
    );
};

/* Shared inline styles */
const cardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: 12,
    padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #f1f5f9',
};

const cardTitle: React.CSSProperties = {
    margin: '0 0 0.75rem',
    fontSize: '1rem',
    fontWeight: 600,
    color: '#1e293b',
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#475569',
    display: 'block',
    marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.75rem',
    border: '1.5px solid #e2e8f0',
    borderRadius: 8,
    fontSize: '0.88rem',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
};

const plRow: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    padding: '0.25rem 0',
};

const actionBtn = (color: string): React.CSSProperties => ({
    padding: '0.55rem 1.25rem',
    border: 'none',
    borderRadius: 8,
    background: color,
    color: 'white',
    fontSize: '0.85rem',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: `0 2px 8px ${color}40`,
});

export default MedicalDashboard;
