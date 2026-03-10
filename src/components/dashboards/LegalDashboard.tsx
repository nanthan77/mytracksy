import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';

interface LegalDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'cases', label: 'Cases & Clients', icon: '📁' },
    { id: 'court', label: 'Court Calendar', icon: '🏣' },
    { id: 'documents', label: 'Documents', icon: '📄' },
    { id: 'billing', label: 'Billing & Time', icon: '⏱️' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const legalExpenseCategories = [
    { name: 'Office Rent', icon: '🏢', color: '#6366f1' },
    { name: 'Staff & Clerks', icon: '👥', color: '#8b5cf6' },
    { name: 'Court Fees', icon: '⚖️', color: '#ec4899' },
    { name: 'Research / Journals', icon: '📚', color: '#22c55e' },
    { name: 'Travel (Court)', icon: '🚗', color: '#f59e0b' },
    { name: 'Bar Association', icon: '🏛️', color: '#06b6d4' },
    { name: 'Office Supplies', icon: '📎', color: '#64748b' },
    { name: 'Insurance', icon: '🛡️', color: '#f97316' },
];

const sampleCases = [
    { id: 'c1', name: 'Silva vs Perera — Property Dispute', client: 'Mr. Silva', type: 'Civil', status: 'active', value: 250000, nextHearing: '2026-03-18' },
    { id: 'c2', name: 'ABC Holdings — Company Registration', client: 'ABC Holdings', type: 'Corporate', status: 'active', value: 75000, nextHearing: '' },
    { id: 'c3', name: 'Fernando — Criminal Defense', client: 'Mr. Fernando', type: 'Criminal', status: 'active', value: 150000, nextHearing: '2026-03-22' },
    { id: 'c4', name: 'Wijesinghe Estate — Will Probate', client: 'Wijesinghe Family', type: 'Estate', status: 'completed', value: 120000, nextHearing: '' },
    { id: 'c5', name: 'Tech Lanka — IP Protection', client: 'Tech Lanka Pvt', type: 'IP Law', status: 'active', value: 180000, nextHearing: '2026-04-02' },
];

const sampleBillings: Transaction[] = [
    { id: 'b1', type: 'income', amount: 75000, description: 'Retainer — ABC Holdings', category: 'Corporate', date: '2026-03-10', status: 'paid' },
    { id: 'b2', type: 'income', amount: 50000, description: 'Court appearance — Silva case', category: 'Civil', date: '2026-03-08', status: 'paid' },
    { id: 'b3', type: 'income', amount: 35000, description: 'Consultation — IP review', category: 'IP Law', date: '2026-03-07', status: 'pending' },
    { id: 'b4', type: 'income', amount: 100000, description: 'Settlement — Wijesinghe estate', category: 'Estate', date: '2026-03-05', status: 'paid' },
    { id: 'b5', type: 'income', amount: 45000, description: 'Defense fee — Fernando case', category: 'Criminal', date: '2026-03-01', status: 'overdue' },
];

const sampleExpenses: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 60000, description: 'Office rent — Hulftsdorp', category: 'Office Rent', date: '2026-03-01', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 85000, description: 'Staff salaries', category: 'Staff & Clerks', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 15000, description: 'Court filing fees (3 cases)', category: 'Court Fees', date: '2026-03-05', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 8500, description: 'Law journal subscriptions', category: 'Research / Journals', date: '2026-03-03', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 6200, description: 'Transport — Kandy court trip', category: 'Travel (Court)', date: '2026-03-06', status: 'completed' },
];

const sampleBankAccounts = [
    { id: 'b1', name: 'Legal Practice A/C', bank: 'Bank of Ceylon', balance: 1850000, type: 'current' },
    { id: 'b2', name: 'Client Trust A/C', bank: 'Commercial Bank', balance: 720000, type: 'trust' },
    { id: 'b3', name: 'Savings', bank: 'HNB', balance: 3200000, type: 'savings' },
];

const courtCalendar = [
    { id: 'h1', case: 'Silva vs Perera', court: 'Colombo District Court', courtNo: 'DC/COL/2456', date: '2026-03-18', time: '10:00 AM', judge: 'Hon. Justice Gunawardena', status: 'confirmed' as const },
    { id: 'h2', case: 'Fernando Defense', court: 'Kandy Magistrate Court', courtNo: 'MC/KDY/1289', date: '2026-03-22', time: '9:30 AM', judge: 'Hon. Magistrate Wijeratne', status: 'confirmed' as const },
    { id: 'h3', case: 'Tech Lanka — IP', court: 'Commercial High Court', courtNo: 'CHC/201/2026', date: '2026-04-02', time: '2:00 PM', judge: 'Hon. Justice Perera', status: 'tentative' as const },
    { id: 'h4', case: 'Land Registry Appeal', court: 'Court of Appeal', courtNo: 'CA/LA/456', date: '2026-04-10', time: '11:00 AM', judge: 'TBD', status: 'tentative' as const },
];

const legalDocuments = [
    { id: 'd1', name: 'Plaint — Silva vs Perera', type: 'Court Filing', case: 'Silva vs Perera', date: '2026-02-15', status: 'filed' },
    { id: 'd2', name: 'Power of Attorney — ABC Holdings', type: 'POA', case: 'ABC Holdings', date: '2026-03-01', status: 'active' },
    { id: 'd3', name: 'Bail Application — Fernando', type: 'Court Filing', case: 'Fernando Defense', date: '2026-03-05', status: 'filed' },
    { id: 'd4', name: 'Last Will — Wijesinghe Estate', type: 'Probate', case: 'Wijesinghe Estate', date: '2026-01-20', status: 'completed' },
    { id: 'd5', name: 'Non-Disclosure Agreement — Tech Lanka', type: 'Agreement', case: 'Tech Lanka', date: '2026-03-08', status: 'draft' },
    { id: 'd6', name: 'Deed of Transfer — Land Sale', type: 'Notarial', case: 'New Matter', date: '2026-03-10', status: 'draft' },
];

const LegalDashboard: React.FC<LegalDashboardProps> = ({ userName, onChangeProfession, onLogout }) => {
    const [activeNav, setActiveNav] = useState('overview');
    const [billings] = useState(sampleBillings);
    const [expenses] = useState(sampleExpenses);

    const totalIncome = billings.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const netProfit = totalIncome - totalExpenses;
    const activeCases = sampleCases.filter((c) => c.status === 'active').length;
    const pendingBills = billings.filter((b) => b.status === 'pending' || b.status === 'overdue').length;
    const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'cases': return renderCases();
            case 'court': return renderCourtCalendar();
            case 'documents': return renderDocuments();
            case 'billing': return renderBilling();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Revenue" value={fmt(totalIncome)} change="+9.1%" changeType="up" color="#22c55e" />
                <KPICard icon="💸" label="Expenses" value={fmt(totalExpenses)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📈" label="Net Profit" value={fmt(netProfit)} change="+14.2%" changeType="up" color="#6366f1" />
                <KPICard icon="📁" label="Active Cases" value={String(activeCases)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="⏳" label="Pending Bills" value={String(pendingBills)} change={pendingBills > 0 ? 'Follow up' : 'Clear'} changeType={pendingBills > 0 ? 'down' : 'up'} color="#f59e0b" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📅 Upcoming Hearings</h3>
                    {sampleCases.filter((c) => c.nextHearing).map((c) => (
                        <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.name}</div>
                                <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{c.client} · {c.type}</div>
                            </div>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366f1' }}>{c.nextHearing}</span>
                        </div>
                    ))}
                </div>
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📂 Revenue by Practice Area</h3>
                    {[
                        { name: 'Civil', amount: 250000, pct: 35, color: '#3b82f6' },
                        { name: 'Corporate', amount: 180000, pct: 25, color: '#8b5cf6' },
                        { name: 'Criminal', amount: 150000, pct: 20, color: '#ef4444' },
                        { name: 'Estate / Probate', amount: 120000, pct: 15, color: '#22c55e' },
                    ].map((a) => (
                        <div key={a.name} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{a.name}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(a.amount)}</span>
                            </div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                <div style={{ height: '100%', width: `${a.pct}%`, background: a.color, borderRadius: 3 }} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={[...billings, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
        </div>
    );

    const renderCases = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📁" label="Active Cases" value={String(activeCases)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="✅" label="Completed" value={String(sampleCases.filter((c) => c.status === 'completed').length)} changeType="up" color="#22c55e" />
                <KPICard icon="💰" label="Total Case Value" value={fmt(sampleCases.reduce((s, c) => s + c.value, 0))} changeType="neutral" color="#6366f1" />
            </div>
            <div style={cardStyle}>
                <h3 style={cardTitle}>📁 All Cases</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Case', 'Client', 'Type', 'Value', 'Next Hearing', 'Status'].map((h) => (
                            <th key={h} style={{ padding: '0.6rem 0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>
                        {sampleCases.map((c) => (
                            <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 500 }}>{c.name}</td>
                                <td style={{ padding: '0.6rem 0.5rem' }}>{c.client}</td>
                                <td style={{ padding: '0.6rem 0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', fontSize: '0.75rem' }}>{c.type}</span></td>
                                <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{fmt(c.value)}</td>
                                <td style={{ padding: '0.6rem 0.5rem', color: c.nextHearing ? '#6366f1' : '#94a3b8' }}>{c.nextHearing || '—'}</td>
                                <td style={{ padding: '0.6rem 0.5rem' }}>
                                    <span style={{ padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, color: c.status === 'active' ? '#3b82f6' : '#22c55e', background: c.status === 'active' ? 'rgba(59,130,246,0.08)' : 'rgba(34,197,94,0.08)' }}>{c.status}</span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderBilling = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Total Billed" value={fmt(totalIncome)} change="+9.1%" changeType="up" color="#22c55e" />
                <KPICard icon="⏳" label="Pending" value={String(pendingBills)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="⏱️" label="Billable Hours" value="128 hrs" change="+12%" changeType="up" color="#6366f1" />
            </div>
            <TransactionList transactions={billings} title="All Billings" showFilter={false} />
        </div>
    );

    /* ========== COURT CALENDAR ========== */
    const renderCourtCalendar = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="🏣" label="Upcoming Hearings" value={String(courtCalendar.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="✅" label="Confirmed" value={String(courtCalendar.filter(h => h.status === 'confirmed').length)} changeType="up" color="#22c55e" />
                <KPICard icon="❓" label="Tentative" value={String(courtCalendar.filter(h => h.status === 'tentative').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="📍" label="Courts" value={String(new Set(courtCalendar.map(h => h.court)).size)} changeType="neutral" color="#3b82f6" />
            </div>
            <div style={cardStyle}>
                <h3 style={cardTitle}>🏣 Court Calendar</h3>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {courtCalendar.map(h => (
                        <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: h.status === 'confirmed' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', fontSize: '1.2rem' }}>⚖️</div>
                                <div>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{h.case}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{h.court} · {h.courtNo}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Judge: {h.judge}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#6366f1' }}>{h.date}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{h.time}</div>
                                <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, background: h.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: h.status === 'confirmed' ? '#22c55e' : '#f59e0b' }}>{h.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    /* ========== DOCUMENTS ========== */
    const renderDocuments = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📄" label="Total Docs" value={String(legalDocuments.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="✅" label="Filed" value={String(legalDocuments.filter(d => d.status === 'filed').length)} changeType="up" color="#22c55e" />
                <KPICard icon="✏️" label="Drafts" value={String(legalDocuments.filter(d => d.status === 'draft').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="📜" label="Active" value={String(legalDocuments.filter(d => d.status === 'active').length)} changeType="neutral" color="#3b82f6" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: 8, background: '#6366f1', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>+ New Document</button>
                <button style={{ padding: '0.55rem 1.25rem', border: 'none', borderRadius: 8, background: '#3b82f6', color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>📤 Upload</button>
            </div>
            <div style={cardStyle}>
                <h3 style={cardTitle}>📄 Legal Documents</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Document', 'Type', 'Case', 'Date', 'Status'].map(h => (
                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>{legalDocuments.map(d => (
                        <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{d.name}</td>
                            <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#f1f5f9', fontSize: '0.72rem' }}>{d.type}</span></td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{d.case}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{d.date}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{ padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600, color: d.status === 'filed' ? '#22c55e' : d.status === 'active' ? '#3b82f6' : d.status === 'draft' ? '#f59e0b' : '#94a3b8', background: d.status === 'filed' ? '#dcfce7' : d.status === 'active' ? '#dbeafe' : d.status === 'draft' ? '#fef3c7' : '#f1f5f9' }}>{d.status}</span>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Total Expenses" value={fmt(totalExpenses)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📊" label="This Week" value={fmt(21200)} changeType="neutral" color="#6366f1" />
                <KPICard icon="📉" label="Avg Daily" value={fmt(Math.round(totalExpenses / 30))} changeType="neutral" color="#8b5cf6" />
            </div>
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📂 Expense Categories</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                    {legalExpenseCategories.map((cat) => {
                        const catTotal = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                        return (
                            <div key={cat.name} style={{ padding: '0.85rem', background: `${cat.color}08`, borderRadius: 10, border: `1px solid ${cat.color}20`, textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{cat.icon}</div>
                                <div style={{ fontSize: '0.78rem', color: '#64748b', marginBottom: 2 }}>{cat.name}</div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{fmt(catTotal)}</div>
                            </div>
                        );
                    })}
                </div>
            </div>
            <TransactionList transactions={expenses} title="All Expenses" showFilter={false} />
        </div>
    );

    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {sampleBankAccounts.map((acc) => (
                    <div key={acc.id} style={{ ...cardStyle, borderTop: `3px solid ${acc.type === 'current' ? '#3b82f6' : acc.type === 'trust' ? '#8b5cf6' : '#22c55e'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{acc.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{acc.type}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{fmt(acc.balance)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.bank}</div>
                    </div>
                ))}
            </div>
            <div style={{ ...cardStyle, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Balance</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(sampleBankAccounts.reduce((s, a) => s + a.balance, 0))}</div>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>⚖️</div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div>
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📊 Practice P&L</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={plRow}><span style={{ fontWeight: 600, color: '#22c55e' }}>💰 Revenue</span><span style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(totalIncome)}</span></div>
                    <div style={{ height: 1, background: '#f1f5f9' }} />
                    {legalExpenseCategories.map((cat) => {
                        const t = expenses.filter((e) => e.category === cat.name).reduce((s, e) => s + e.amount, 0);
                        return t > 0 ? <div key={cat.name} style={plRow}><span style={{ color: '#64748b' }}>{cat.icon} {cat.name}</span><span style={{ color: '#ef4444' }}>({fmt(t)})</span></div> : null;
                    })}
                    <div style={{ height: 1, background: '#1e293b' }} />
                    <div style={plRow}><span style={{ fontWeight: 700 }}>📈 Net Profit</span><span style={{ fontWeight: 700, color: netProfit >= 0 ? '#22c55e' : '#ef4444' }}>{fmt(netProfit)}</span></div>
                </div>
            </div>
            <div style={cardStyle}>
                <h3 style={cardTitle}>📋 Available Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                    {[
                        { name: 'Practice P&L', icon: '📊', desc: 'Revenue & cost breakdown' },
                        { name: 'Case Summary', icon: '📁', desc: 'Active/completed case stats' },
                        { name: 'Time & Billing', icon: '⏱️', desc: 'Billable hours report' },
                        { name: 'Client Revenue', icon: '👥', desc: 'Revenue by client' },
                        { name: 'Trust Account', icon: '🏦', desc: 'Client trust balances' },
                        { name: 'Tax (APIT)', icon: '🧾', desc: 'Estimated IRD returns' },
                    ].map((r) => (
                        <div key={r.name} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}><span>{r.icon}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.name}</span></div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.desc}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div><div style={cardStyle}><h3 style={cardTitle}>⚙️ Legal Practice Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                    { label: 'Practice Name', value: 'My Law Practice', icon: '⚖️' },
                    { label: 'Bar Council Reg #', value: 'BASL/2015/1234', icon: '🏣' },
                    { label: 'BASL Renewal Due', value: '2026-12-31', icon: '📅' },
                    { label: 'Notary Public License', value: 'NP/WP/5678 — Active', icon: '📜' },
                    { label: 'Practice Areas', value: 'Civil, Criminal, Corporate, IP', icon: '📋' },
                    { label: 'Professional Indemnity', value: 'SLIC Policy — Active', icon: '🛡️' },
                    { label: 'Trust Account Bank', value: 'Commercial Bank', icon: '🏦' },
                    { label: 'IRD TIN', value: '987654321', icon: '🔑' },
                    { label: 'Tax Year', value: '2025/2026 (April – March)', icon: '📅' },
                    { label: 'Billing Rate', value: 'LKR 5,000/hr', icon: '💰' },
                ].map((s) => (
                    <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}><span style={{ fontSize: '1.1rem' }}>{s.icon}</span><span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.label}</span></div>
                        <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.value}</span>
                    </div>
                ))}
            </div>
        </div></div>
    );

    return (
        <DashboardLayout profession="legal" professionLabel="Legal Professional" professionIcon="⚖️" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

const cardStyle: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const cardTitle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };
const plRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', padding: '0.25rem 0' };

export default LegalDashboard;
