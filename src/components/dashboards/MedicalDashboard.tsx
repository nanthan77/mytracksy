import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';

interface MedicalDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'patients', label: 'Patients', icon: '🧑‍⚕️' },
    { id: 'channeling', label: 'Channeling', icon: '🏥' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'income', label: 'Income & Invoices', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking & Cheques', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// Medical-specific expense categories
const medicalExpenseCategories = [
    { name: 'Medical Equipment', icon: '🔬', color: '#6366f1' },
    { name: 'CME / Training', icon: '📚', color: '#8b5cf6' },
    { name: 'Conference Travel', icon: '✈️', color: '#06b6d4' },
    { name: 'Hospital Fees', icon: '🏥', color: '#ec4899' },
    { name: 'Insurance', icon: '🛡️', color: '#f59e0b' },
    { name: 'Medical Subscriptions', icon: '📰', color: '#10b981' },
    { name: 'Vehicle / Transport', icon: '🚗', color: '#f97316' },
    { name: 'Office Supplies', icon: '📎', color: '#64748b' },
];

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
    const [activeNav, setActiveNav] = useState('overview');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [invoices, setInvoices] = useState(sampleInvoices);
    const [expenses, setExpenses] = useState(sampleExpenses);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, category: medicalExpenseCategories[0].name, date: new Date().toISOString().split('T')[0] });

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
        setExpenseForm({ description: '', amount: 0, category: medicalExpenseCategories[0].name, date: new Date().toISOString().split('T')[0] });
    };

    const totalIncome = invoices.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const pendingInvoices = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').length;

    const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview':
                return renderOverview();
            case 'patients':
                return renderPatients();
            case 'channeling':
                return renderChanneling();
            case 'appointments':
                return renderAppointments();
            case 'income':
                return renderIncome();
            case 'expenses':
                return renderExpenses();
            case 'banking':
                return renderBanking();
            case 'reports':
                return renderReports();
            case 'settings':
                return renderSettings();
            default:
                return renderOverview();
        }
    };

    /* ========== OVERVIEW ========== */
    const renderOverview = () => (
        <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Monthly Income" value={fmt(totalIncome)} change="+12.5%" changeType="up" color="#22c55e" />
                <KPICard icon="💸" label="Monthly Expenses" value={fmt(totalExpenses)} change="-3.2%" changeType="down" color="#ef4444" />
                <KPICard icon="📈" label="Net Profit" value={fmt(netProfit)} change="+18.7%" changeType="up" color="#6366f1" />
                <KPICard icon="📋" label="Pending Invoices" value={String(pendingInvoices)} change={pendingInvoices > 0 ? 'Action needed' : 'All clear'} changeType={pendingInvoices > 0 ? 'down' : 'up'} color="#f59e0b" />
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>+ Create Invoice</button>
                <button onClick={() => { setActiveNav('expenses'); setShowAddExpense(true); }} style={actionBtn('#ef4444')}>+ Add Expense</button>
                <button onClick={() => setActiveNav('banking')} style={actionBtn('#06b6d4')}>🏦 Banking</button>
                <button onClick={() => setActiveNav('reports')} style={actionBtn('#8b5cf6')}>📋 Reports</button>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Income vs Expenses Chart */}
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

                {/* Category Breakdown */}
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

    /* ========== CHANNELING ========== */
    const renderChanneling = () => {
        const totalMonthlyEst = channelingData.reduce((s, c) => s + (c.doctorShare * c.avgPatients * 4), 0);
        const wht = Math.round(totalMonthlyEst * 0.05);
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="🏥" label="Centers" value={String(channelingData.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="💰" label="Est. Monthly" value={fmt(totalMonthlyEst)} changeType="up" color="#22c55e" />
                    <KPICard icon="🧾" label="WHT (5%)" value={fmt(wht)} changeType="neutral" color="#f59e0b" />
                    <KPICard icon="👥" label="Avg Patients/Day" value={String(Math.round(channelingData.reduce((s, c) => s + c.avgPatients, 0) / channelingData.length))} changeType="neutral" color="#3b82f6" />
                </div>
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
                            <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, background: a.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: a.status === 'confirmed' ? '#22c55e' : '#f59e0b' }}>{a.status}</span>
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
    const renderExpenses = () => (
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
            </div>

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
                                    onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="What did you spend on?"
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select
                                    value={expenseForm.category}
                                    onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}
                                    style={inputStyle}
                                >
                                    {medicalExpenseCategories.map((c) => (
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
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAddExpense(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                            <button type="submit" style={actionBtn('#6366f1')}>💾 Save Expense</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Category Cards */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📂 Expense Categories</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {medicalExpenseCategories.map((cat) => {
                        const catTotal = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                        return (
                            <div key={cat.name} style={{ padding: '0.85rem', background: `${cat.color}08`, borderRadius: 10, border: `1px solid ${cat.color}20`, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{cat.icon}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>{cat.name}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1e293b' }}>{fmt(catTotal)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Expense List */}
            <TransactionList transactions={expenses} title="All Expenses" showFilter={false} />
        </div>
    );

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
