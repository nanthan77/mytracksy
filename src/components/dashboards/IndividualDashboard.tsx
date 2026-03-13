import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useRouteNav } from '../../hooks/useRouteNav';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'income', label: 'Income', icon: '💰' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'budget', label: 'Budget', icon: '📝' },
    { id: 'loans', label: 'Loans & Liabilities', icon: '🏦' },
    { id: 'savings', label: 'Savings & Goals', icon: '🎯' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 125000, description: 'Monthly salary — March', category: 'Salary', date: '2026-03-01', status: 'paid' },
    { id: 'i2', type: 'income', amount: 35000, description: 'Freelance web design', category: 'Freelance', date: '2026-03-05', status: 'paid' },
    { id: 'i3', type: 'income', amount: 8500, description: 'Dividend — CSE stocks', category: 'Investment', date: '2026-03-03', status: 'paid' },
    { id: 'i4', type: 'income', amount: 12000, description: 'Rent — Annex', category: 'Rental', date: '2026-03-01', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 35000, description: 'House rent', category: 'Housing', date: '2026-03-01', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 25000, description: 'Groceries & food', category: 'Food', date: '2026-03-05', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 8000, description: 'Electricity + water', category: 'Utilities', date: '2026-03-02', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 15000, description: 'Vehicle fuel + maintenance', category: 'Transport', date: '2026-03-04', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 5000, description: 'Dialog mobile + WiFi', category: 'Phone / Internet', date: '2026-03-01', status: 'completed' },
    { id: 'e6', type: 'expense', amount: 12000, description: 'Kids school fees', category: 'Education', date: '2026-03-01', status: 'completed' },
];

const goals = [
    { name: 'Emergency Fund', target: 500000, current: 340000, icon: '🛡️', color: '#22c55e' },
    { name: 'New Vehicle', target: 3000000, current: 850000, icon: '🚗', color: '#3b82f6' },
    { name: 'Holiday Trip', target: 200000, current: 125000, icon: '✈️', color: '#8b5cf6' },
    { name: 'Kids Education', target: 2000000, current: 680000, icon: '🎓', color: '#f59e0b' },
];

const banks = [
    { id: 'b1', name: 'Salary Account', bank: 'Commercial Bank', balance: 285000, type: 'savings' },
    { id: 'b2', name: 'Fixed Deposit', bank: 'NSB', balance: 500000, type: 'fixed' },
    { id: 'b3', name: 'Daily Use', bank: 'HNB', balance: 42000, type: 'current' },
];

const budgetItems = [
    { category: '🏠 Housing', budget: 40000, spent: 35000, color: '#6366f1' },
    { category: '🍛 Food & Groceries', budget: 30000, spent: 25000, color: '#22c55e' },
    { category: '🚗 Transport', budget: 18000, spent: 15000, color: '#f59e0b' },
    { category: '⚡ Utilities', budget: 10000, spent: 8000, color: '#ef4444' },
    { category: '🎓 Education', budget: 15000, spent: 12000, color: '#8b5cf6' },
    { category: '📱 Phone/Internet', budget: 6000, spent: 5000, color: '#3b82f6' },
    { category: '🎥 Entertainment', budget: 8000, spent: 3500, color: '#ec4899' },
    { category: '🎯 Savings', budget: 50000, spent: 50000, color: '#14b8a6' },
];

const loans = [
    { id: 'l1', name: 'Vehicle Loan', bank: 'BOC', total: 2500000, remaining: 1800000, emi: 45000, rate: '12.5%', endDate: '2029-06' },
    { id: 'l2', name: 'Housing Loan', bank: 'HNB', total: 8000000, remaining: 6500000, emi: 85000, rate: '9.8%', endDate: '2040-03' },
    { id: 'l3', name: 'Credit Card', bank: 'Commercial Bank', total: 150000, remaining: 45000, emi: 15000, rate: '28%', endDate: '2026-06' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const IndividualDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);
    const savings = totI - totE;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'income': return renderIncome();
            case 'expenses': return renderExpenses();
            case 'budget': return renderBudget();
            case 'loans': return renderLoans();
            case 'savings': return renderSavings();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Income" value={fmt(totI)} change="+5%" changeType="up" color="#22c55e" />
                <KPICard icon="💸" label="Expenses" value={fmt(totE)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📈" label="Savings" value={fmt(savings)} changeType="up" color="#6366f1" />
                <KPICard icon="🎯" label="Goals Met" value="1 / 4" changeType="neutral" color="#f59e0b" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cs}><h3 style={ct}>💰 Income Sources</h3>
                    {[{ n: 'Salary', a: 125000, p: 69, c: '#22c55e' }, { n: 'Freelance', a: 35000, p: 19, c: '#3b82f6' }, { n: 'Rental', a: 12000, p: 7, c: '#8b5cf6' }, { n: 'Investment', a: 8500, p: 5, c: '#f59e0b' }].map((s) => (
                        <div key={s.n} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{s.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(s.a)}</span></div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${s.p}%`, background: s.c, borderRadius: 3 }} /></div>
                        </div>
                    ))}
                </div>
                <div style={cs}><h3 style={ct}>💸 Top Expenses</h3>
                    {[{ n: '🏠 Housing', a: 35000 }, { n: '🍛 Food', a: 25000 }, { n: '🚗 Transport', a: 15000 }, { n: '🎓 Education', a: 12000 }, { n: '⚡ Utilities', a: 8000 }].map((e) => (
                        <div key={e.n} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.82rem' }}>{e.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>{fmt(e.a)}</span>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
        </div>
    );

    const renderIncome = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💼" label="Salary" value={fmt(125000)} changeType="neutral" color="#22c55e" />
                <KPICard icon="💻" label="Freelance" value={fmt(35000)} changeType="up" color="#3b82f6" />
                <KPICard icon="🏠" label="Rental" value={fmt(12000)} changeType="neutral" color="#8b5cf6" />
                <KPICard icon="📈" label="Investments" value={fmt(8500)} changeType="up" color="#f59e0b" />
            </div>
            <TransactionList transactions={incomeData} title="All Income" showFilter={false} />
        </div>
    );

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Total" value={fmt(totE)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📊" label="Daily Avg" value={fmt(Math.round(totE / 30))} changeType="neutral" color="#6366f1" />
                <KPICard icon="📈" label="Savings Rate" value={`${Math.round((savings / totI) * 100)}%`} changeType="up" color="#22c55e" />
            </div>
            <TransactionList transactions={expenseData} title="All Expenses" showFilter={false} />
        </div>
    );

    /* ========== BUDGET TRACKER ========== */
    const renderBudget = () => {
        const totalBudget = budgetItems.reduce((s, b) => s + b.budget, 0);
        const totalSpent = budgetItems.reduce((s, b) => s + b.spent, 0);
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="📝" label="Total Budget" value={fmt(totalBudget)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="💸" label="Total Spent" value={fmt(totalSpent)} changeType="neutral" color="#ef4444" />
                    <KPICard icon="✅" label="Remaining" value={fmt(totalBudget - totalSpent)} changeType="up" color="#22c55e" />
                </div>
                <div style={cs}><h3 style={ct}>📝 Monthly Budget vs Actual</h3>
                    {budgetItems.map(b => {
                        const pct = Math.round((b.spent / b.budget) * 100);
                        const over = b.spent > b.budget;
                        return (<div key={b.category} style={{ marginBottom: '0.75rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{b.category}</span>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: over ? '#ef4444' : '#22c55e' }}>{fmt(b.spent)} / {fmt(b.budget)} ({pct}%)</span>
                            </div>
                            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: over ? '#ef4444' : b.color, borderRadius: 4 }} />
                            </div>
                        </div>);
                    })}
                </div>
            </div>
        );
    };

    /* ========== LOANS & LIABILITIES ========== */
    const renderLoans = () => {
        const totalRemaining = loans.reduce((s, l) => s + l.remaining, 0);
        const totalEMI = loans.reduce((s, l) => s + l.emi, 0);
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="🏦" label="Total Loans" value={String(loans.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="💰" label="Outstanding" value={fmt(totalRemaining)} changeType="neutral" color="#ef4444" />
                    <KPICard icon="📅" label="Monthly EMI" value={fmt(totalEMI)} changeType="neutral" color="#f59e0b" />
                </div>
                <div style={cs}><h3 style={ct}>🏦 Active Loans</h3>
                    {loans.map(l => {
                        const paidPct = Math.round(((l.total - l.remaining) / l.total) * 100);
                        return (<div key={l.id} style={{ padding: '1rem', background: '#f8fafc', borderRadius: 10, marginBottom: '0.75rem', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{l.name}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{l.bank} · {l.rate} p.a. · Ends: {l.endDate}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}>{fmt(l.remaining)}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#64748b' }}>EMI: {fmt(l.emi)}/mo</div>
                                </div>
                            </div>
                            <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4 }}>
                                <div style={{ height: '100%', width: `${paidPct}%`, background: '#22c55e', borderRadius: 4 }} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{paidPct}% paid off</div>
                        </div>);
                    })}
                </div>
            </div>
        );
    };

    const renderSavings = () => (
        <div><div style={cs}><h3 style={ct}>🎯 Savings Goals</h3>
            {goals.map((g) => (<div key={g.name} style={{ marginBottom: '1rem', padding: '1rem', background: `${g.color}08`, borderRadius: 10, border: `1px solid ${g.color}20` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{g.icon} {g.name}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: g.color }}>{Math.round((g.current / g.target) * 100)}%</span>
                </div>
                <div style={{ height: 10, background: '#f1f5f9', borderRadius: 5 }}>
                    <div style={{ height: '100%', width: `${(g.current / g.target) * 100}%`, background: g.color, borderRadius: 5 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmt(g.current)}</span><span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{fmt(g.target)}</span>
                </div>
            </div>))}
        </div></div>
    );

    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {banks.map((a) => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'savings' ? '#22c55e' : a.type === 'fixed' ? '#f59e0b' : '#3b82f6'}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.3rem 0' }}>{fmt(a.balance)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.bank} · {a.type}</div>
                </div>))}
            </div>
            <div style={{ ...cs, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Balance</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(banks.reduce((s, a) => s + a.balance, 0))}</div>
            </div>
        </div>
    );

    const renderReports = () => (<div><div style={cs}><h3 style={ct}>📋 Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {['📊 Monthly Summary', '💰 Income vs Expenses', '🎯 Savings Progress', '📂 Category Breakdown', '🏦 Bank Statements', '🧾 Tax (APIT)', '📝 Budget Report', '🏦 Loan Summary', '📈 Net Worth'].map((r) => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Personal Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['👤 Name', 'Demo User'], ['📋 NIC', '200012345678'], ['💼 Employment', 'Employed — Private Sector'], ['🔑 IRD TIN', '345678901'], ['📅 Tax Year', '2025/2026'], ['💰 APIT Rate', 'Standard (Employer deducts)'], ['🏦 Primary Bank', 'Commercial Bank'], ['📱 Budget Alerts', 'Enabled']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="individual" professionLabel="Individual" professionIcon="👤" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default IndividualDashboard;
