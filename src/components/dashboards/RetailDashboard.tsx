import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useRouteNav } from '../../hooks/useRouteNav';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'sales', label: 'Sales & POS', icon: '🛒' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'suppliers', label: 'Suppliers', icon: '🏭' },
    { id: 'credit', label: 'Credit Book', icon: '📒' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const inventory = [
    { name: 'Rice (5kg Bag)', sku: 'GR-001', stock: 120, reorder: 50, costPrice: 850, sellPrice: 1050 },
    { name: 'Sugar (1kg)', sku: 'GR-002', stock: 85, reorder: 40, costPrice: 240, sellPrice: 310 },
    { name: 'Milk Powder (400g)', sku: 'GR-003', stock: 15, reorder: 30, costPrice: 520, sellPrice: 650 },
    { name: 'Cooking Oil (1L)', sku: 'GR-004', stock: 42, reorder: 25, costPrice: 580, sellPrice: 720 },
    { name: 'Dhal (500g)', sku: 'GR-005', stock: 8, reorder: 25, costPrice: 280, sellPrice: 385 },
    { name: 'Tea (100g Dilmah)', sku: 'GR-006', stock: 65, reorder: 20, costPrice: 350, sellPrice: 450 },
];

const suppliers = [
    { name: 'Cargills Foods', contact: '011-2345678', items: 'Rice, Sugar, Dhal', credit: 45000, lastOrder: '2026-03-08', status: 'active' },
    { name: 'Prima Ceylon', contact: '011-3456789', items: 'Flour, Noodles, Bread', credit: 0, lastOrder: '2026-03-05', status: 'active' },
    { name: 'Unilever Sri Lanka', contact: '011-4567890', items: 'Soap, Detergent, Toothpaste', credit: 28000, lastOrder: '2026-03-07', status: 'active' },
    { name: 'Lanka Soy', contact: '011-5678901', items: 'Soy Meat, Soya Milk', credit: 0, lastOrder: '2026-02-28', status: 'active' },
];

const creditBook = [
    { customer: 'Star Restaurant', phone: '077-1234567', amount: 35000, date: '2026-03-09', dueDate: '2026-03-23', status: 'due-soon' },
    { customer: 'Mr. Bandara (Regular)', phone: '071-2345678', amount: 8500, date: '2026-03-05', dueDate: '2026-04-05', status: 'current' },
    { customer: 'Hotel Sunshine', phone: '076-3456789', amount: 62000, date: '2026-02-20', dueDate: '2026-03-20', status: 'overdue' },
    { customer: 'Mrs. Perera (Neighbor)', phone: '078-4567890', amount: 3200, date: '2026-03-10', dueDate: '2026-03-24', status: 'current' },
];

const salesData: Transaction[] = [
    { id: 's1', type: 'income', amount: 12500, description: 'Walk-in — groceries', category: 'Counter', date: '2026-03-10', status: 'paid' },
    { id: 's2', type: 'income', amount: 45000, description: 'Wholesale — Nimal Stores', category: 'Wholesale', date: '2026-03-10', status: 'paid' },
    { id: 's3', type: 'income', amount: 8750, description: 'Walk-in — household', category: 'Counter', date: '2026-03-10', status: 'paid' },
    { id: 's4', type: 'income', amount: 35000, description: 'Credit — Star Restaurant', category: 'Credit', date: '2026-03-09', status: 'pending' },
    { id: 's5', type: 'income', amount: 18200, description: 'Walk-in — mixed', category: 'Counter', date: '2026-03-09', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 350000, description: 'Stock — Cargills distributor', category: 'Stock', date: '2026-03-08', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 65000, description: 'Staff salaries (3)', category: 'Staff', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 35000, description: 'Shop rent', category: 'Rent', date: '2026-03-01', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 12000, description: 'Electricity + fridge', category: 'Utilities', date: '2026-03-02', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Shop Account', bank: 'Peoples Bank', balance: 485000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'NSB', balance: 320000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const RetailDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const totSales = salesData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'sales': return renderSales();
            case 'inventory': return renderInventory();
            case 'suppliers': return renderSuppliers();
            case 'credit': return renderCredit();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🛒" label="Today Sales" value={fmt(66250)} change="+8%" changeType="up" color="#22c55e" />
            <KPICard icon="📦" label="Items" value={String(inventory.length)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="⚠️" label="Low Stock" value={String(inventory.filter(i => i.stock <= i.reorder).length)} changeType="down" color="#ef4444" />
            <KPICard icon="📒" label="Credit Due" value={fmt(creditBook.reduce((s, c) => s + c.amount, 0))} changeType="neutral" color="#f59e0b" />
            <KPICard icon="📈" label="Margin" value="24%" changeType="up" color="#6366f1" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={cs}><h3 style={ct}>🛒 Sales by Channel</h3>
                {[{ n: '🏪 Counter', a: 39450, p: 50, c: '#22c55e' }, { n: '📦 Wholesale', a: 45000, p: 36, c: '#3b82f6' }, { n: '📝 Credit', a: 35000, p: 14, c: '#f59e0b' }].map(s => (
                    <div key={s.n} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{s.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(s.a)}</span></div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${s.p}%`, background: s.c, borderRadius: 3 }} /></div>
                    </div>
                ))}
            </div>
            <div style={cs}><h3 style={ct}>⚠️ Low Stock Alerts</h3>
                {inventory.filter(i => i.stock <= i.reorder).map(i => (
                    <div key={i.sku} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{i.name}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>SKU: {i.sku}</div></div>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>{i.stock} left (min: {i.reorder})</span>
                    </div>
                ))}
            </div>
        </div>
        <TransactionList transactions={[...salesData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>);

    const renderSales = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🛒" label="Total Sales" value={fmt(totSales)} changeType="up" color="#22c55e" />
            <KPICard icon="💳" label="Credit" value={fmt(35000)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="💰" label="Cash" value={fmt(totSales - 35000)} changeType="up" color="#6366f1" />
        </div>
        <TransactionList transactions={salesData} title="Sales History" showFilter={false} />
    </div>);

    const renderInventory = () => (<div style={cs}><h3 style={ct}>📦 Inventory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Item', 'SKU', 'Stock', 'Reorder', 'Cost', 'Sell', 'Margin', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>{h}</th>))}</tr></thead>
            <tbody>{inventory.map(i => {
                const m = Math.round(((i.sellPrice - i.costPrice) / i.sellPrice) * 100); return (
                    <tr key={i.sku} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{i.name}</td><td style={{ padding: '0.5rem', color: '#6366f1' }}>{i.sku}</td>
                        <td style={{ padding: '0.5rem' }}>{i.stock}</td><td style={{ padding: '0.5rem' }}>{i.reorder}</td>
                        <td style={{ padding: '0.5rem' }}>{fmt(i.costPrice)}</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(i.sellPrice)}</td>
                        <td style={{ padding: '0.5rem', fontWeight: 600, color: '#22c55e' }}>{m}%</td>
                        <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: i.stock <= i.reorder ? '#fef2f2' : '#f0fdf4', color: i.stock <= i.reorder ? '#ef4444' : '#22c55e' }}>{i.stock <= i.reorder ? '⚠️ Low' : '✅ OK'}</span></td>
                    </tr>);
            })}</tbody>
        </table>
    </div>);

    const renderSuppliers = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🏭" label="Suppliers" value={String(suppliers.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="💰" label="Credit Owed" value={fmt(suppliers.reduce((s, sup) => s + sup.credit, 0))} changeType="neutral" color="#ef4444" />
            <KPICard icon="📦" label="Last Order" value="2026-03-08" changeType="neutral" color="#3b82f6" />
        </div>
        <div style={cs}><h3 style={ct}>🏭 Supplier Directory</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Supplier', 'Contact', 'Items', 'Credit', 'Last Order'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{suppliers.map(s => (<tr key={s.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.name}</td><td style={{ padding: '0.5rem' }}>{s.contact}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{s.items}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: s.credit > 0 ? '#ef4444' : '#22c55e' }}>{s.credit > 0 ? fmt(s.credit) : 'Settled'}</td>
                    <td style={{ padding: '0.5rem' }}>{s.lastOrder}</td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderCredit = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="📒" label="Total Due" value={fmt(creditBook.reduce((s, c) => s + c.amount, 0))} changeType="neutral" color="#f59e0b" />
            <KPICard icon="⚠️" label="Overdue" value={String(creditBook.filter(c => c.status === 'overdue').length)} changeType="down" color="#ef4444" />
            <KPICard icon="👥" label="Customers" value={String(creditBook.length)} changeType="neutral" color="#6366f1" />
        </div>
        <div style={cs}><h3 style={ct}>📒 Credit Book</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Customer', 'Phone', 'Amount', 'Date', 'Due Date', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{creditBook.map(c => (<tr key={c.customer} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{c.customer}</td><td style={{ padding: '0.5rem' }}>{c.phone}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 700 }}>{fmt(c.amount)}</td><td style={{ padding: '0.5rem' }}>{c.date}</td>
                    <td style={{ padding: '0.5rem' }}>{c.dueDate}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: c.status === 'overdue' ? '#fef2f2' : c.status === 'due-soon' ? '#fef3c7' : '#dcfce7', color: c.status === 'overdue' ? '#ef4444' : c.status === 'due-soon' ? '#f59e0b' : '#22c55e' }}>{c.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderExpenses = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="📦" label="Stock" value={fmt(350000)} changeType="neutral" color="#6366f1" />
            <KPICard icon="👷" label="Staff" value={fmt(65000)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="🏠" label="Rent+Utils" value={fmt(47000)} changeType="neutral" color="#ef4444" />
        </div>
        <TransactionList transactions={expenseData} title="All Expenses" showFilter={false} />
    </div>);

    const renderBanking = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {banks.map(a => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'current' ? '#3b82f6' : '#22c55e'}` }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.3rem 0' }}>{fmt(a.balance)}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.bank}</div>
            </div>))}
        </div>
        <div style={{ ...cs, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
            <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Balance</div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(banks.reduce((s, a) => s + a.balance, 0))}</div>
        </div>
    </div>);

    const renderReports = () => (<div style={cs}><h3 style={ct}>📋 Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {['📊 Daily Sales', '📦 Stock Report', '💰 P&L', '👥 Credit Report', '📈 Best Sellers', '🏭 Supplier Ledger', '🧾 VAT Return', '📊 Margin Analysis', '📒 Aged Receivables'].map(r => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div>);

    const renderSettings = () => (<div style={cs}><h3 style={ct}>⚙️ Shop Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['🏪 Shop Name', 'Silva Grocery - Nugegoda'], ['📋 BR Number', 'PV/2024/00345'], ['🧾 VAT Registered', 'Yes — VAT No: 234567890-7000'], ['📦 Suppliers', `${suppliers.length} Active`], ['📒 Credit Limit', 'LKR 75,000/customer'], ['📅 Tax Year', '2025/2026'], ['🧾 APIT Rate', '6%'], ['📱 POS System', 'MyTracksy POS']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div>);

    return (
        <DashboardLayout profession="retail" professionLabel="Retail" professionIcon="🛒" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default RetailDashboard;
