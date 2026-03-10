import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import InvoiceForm, { InvoiceData } from './InvoiceForm';

interface BusinessDashboardProps {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'sales', label: 'Sales & Invoices', icon: '🧾' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'payroll', label: 'Payroll & EPF', icon: '👥' },
    { id: 'purchase', label: 'Purchase Orders', icon: '📥' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports & Tax', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

/* ====== Business-specific data ====== */
const businessExpenseCategories = [
    { name: 'Rent & Utilities', icon: '🏢', color: '#6366f1' },
    { name: 'Staff Salaries', icon: '👥', color: '#8b5cf6' },
    { name: 'Inventory / Stock', icon: '📦', color: '#22c55e' },
    { name: 'Marketing & Ads', icon: '📢', color: '#ec4899' },
    { name: 'Transport / Delivery', icon: '🚚', color: '#f59e0b' },
    { name: 'Office Supplies', icon: '📎', color: '#64748b' },
    { name: 'Insurance & Tax', icon: '🛡️', color: '#06b6d4' },
    { name: 'Maintenance', icon: '🔧', color: '#f97316' },
];

const sampleSales: Transaction[] = [
    { id: 's1', type: 'income', amount: 185000, description: 'Wholesale order — Colombo Buyers', category: 'Wholesale', date: '2026-03-10', status: 'paid' },
    { id: 's2', type: 'income', amount: 62000, description: 'Retail POS — Week 10', category: 'Retail POS', date: '2026-03-09', status: 'paid' },
    { id: 's3', type: 'income', amount: 95000, description: 'Invoice #INV-2067 — MR Enterprises', category: 'Invoice', date: '2026-03-08', status: 'pending' },
    { id: 's4', type: 'income', amount: 48000, description: 'Online store - Daraz orders', category: 'E-Commerce', date: '2026-03-07', status: 'paid' },
    { id: 's5', type: 'income', amount: 120000, description: 'Invoice #INV-2065 — ABC Holdings', category: 'Invoice', date: '2026-03-04', status: 'overdue' },
];

const sampleExpenses: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 75000, description: 'Monthly rent — Kandy Road shop', category: 'Rent & Utilities', date: '2026-03-01', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 135000, description: 'Staff salaries — March', category: 'Staff Salaries', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 45000, description: 'Stock purchase — Supplier A', category: 'Inventory / Stock', date: '2026-03-06', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 28000, description: 'Facebook & Google Ads', category: 'Marketing & Ads', date: '2026-03-05', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 12500, description: 'Delivery charges (Kapruka)', category: 'Transport / Delivery', date: '2026-03-08', status: 'completed' },
    { id: 'e6', type: 'expense', amount: 8200, description: 'Electricity bill — CEB', category: 'Rent & Utilities', date: '2026-03-03', status: 'completed' },
];

const sampleInventory = [
    { id: 'i1', name: 'Product A — Premium Pack', sku: 'SKU-001', qty: 245, reorderAt: 50, unitPrice: 1500, category: 'Premium' },
    { id: 'i2', name: 'Product B — Standard', sku: 'SKU-002', qty: 18, reorderAt: 30, unitPrice: 750, category: 'Standard' },
    { id: 'i3', name: 'Product C — Economy', sku: 'SKU-003', qty: 520, reorderAt: 100, unitPrice: 350, category: 'Economy' },
    { id: 'i4', name: 'Product D — Seasonal', sku: 'SKU-004', qty: 62, reorderAt: 25, unitPrice: 2200, category: 'Seasonal' },
    { id: 'i5', name: 'Product E — Bulk', sku: 'SKU-005', qty: 8, reorderAt: 20, unitPrice: 4500, category: 'Bulk' },
    { id: 'i6', name: 'Product F — New Arrival', sku: 'SKU-006', qty: 150, reorderAt: 40, unitPrice: 1200, category: 'New' },
];

const sampleBankAccounts = [
    { id: 'b1', name: 'Business Current', bank: 'Bank of Ceylon', balance: 2850000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'Commercial Bank', balance: 1420000, type: 'savings' },
    { id: 'b3', name: 'Fixed Deposit', bank: 'Peoples Bank', balance: 5000000, type: 'fixed' },
];

const sampleCheques = [
    { id: 'c1', number: 'CHQ-8801', party: 'ABC Holdings', amount: 120000, date: '2026-03-18', type: 'received', status: 'pending' },
    { id: 'c2', number: 'CHQ-8802', party: 'Supplier A', amount: 45000, date: '2026-03-06', type: 'issued', status: 'cleared' },
    { id: 'c3', number: 'CHQ-8803', party: 'MR Enterprises', amount: 95000, date: '2026-03-22', type: 'received', status: 'pending' },
    { id: 'c4', number: 'CHQ-8804', party: 'CEB (electricity)', amount: 8200, date: '2026-03-03', type: 'issued', status: 'cleared' },
];

const sampleCustomers = [
    { name: 'ABC Holdings', revenue: 540000, orders: 12, lastOrder: '2026-03-04' },
    { name: 'MR Enterprises', revenue: 380000, orders: 8, lastOrder: '2026-03-08' },
    { name: 'Colombo Buyers', revenue: 620000, orders: 15, lastOrder: '2026-03-10' },
    { name: 'Southern Traders', revenue: 210000, orders: 5, lastOrder: '2026-02-28' },
];

const sampleEmployees = [
    { id: 'emp1', name: 'Kasun Jayawardena', role: 'Store Manager', basic: 85000, epfEmp: 6800, epfEr: 10200, etf: 2550, apit: 4250, netPay: 73950 },
    { id: 'emp2', name: 'Nimal Wickramasinghe', role: 'Sales Executive', basic: 55000, epfEmp: 4400, epfEr: 6600, etf: 1650, apit: 0, netPay: 50600 },
    { id: 'emp3', name: 'Shanika Perera', role: 'Cashier', basic: 42000, epfEmp: 3360, epfEr: 5040, etf: 1260, apit: 0, netPay: 38640 },
    { id: 'emp4', name: 'Ruwan de Silva', role: 'Delivery Driver', basic: 38000, epfEmp: 3040, epfEr: 4560, etf: 1140, apit: 0, netPay: 34960 },
    { id: 'emp5', name: 'Amara Fernando', role: 'Accountant', basic: 75000, epfEmp: 6000, epfEr: 9000, etf: 2250, apit: 2500, netPay: 66500 },
];

const samplePurchaseOrders = [
    { id: 'po1', supplier: 'Lanka Distributors', items: 'Product A x200, Product C x500', total: 425000, date: '2026-03-12', status: 'approved' as const, delivery: '2026-03-18' },
    { id: 'po2', supplier: 'Southern Supplies', items: 'Product B x100', total: 62500, date: '2026-03-10', status: 'pending' as const, delivery: '2026-03-20' },
    { id: 'po3', supplier: 'Colombo Traders', items: 'Product E x50', total: 180000, date: '2026-03-08', status: 'received' as const, delivery: '2026-03-14' },
    { id: 'po4', supplier: 'Kandy Imports', items: 'Product D x30, Product F x80', total: 162000, date: '2026-03-05', status: 'approved' as const, delivery: '2026-03-15' },
];

const BusinessDashboard: React.FC<BusinessDashboardProps> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const [activeNav, setActiveNav] = useState('overview');
    const [showInvoiceForm, setShowInvoiceForm] = useState(false);
    const [sales, setSales] = useState(sampleSales);
    const [expenses, setExpenses] = useState(sampleExpenses);
    const [showAddExpense, setShowAddExpense] = useState(false);
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: 0, category: businessExpenseCategories[0].name, date: new Date().toISOString().split('T')[0] });

    const handleCreateInvoice = (invoice: InvoiceData) => {
        const newSale: Transaction = {
            id: `inv-${Date.now()}`,
            type: 'income',
            amount: invoice.amount,
            description: `Invoice — ${invoice.patientName}`,
            category: 'Invoice',
            date: invoice.date,
            status: invoice.status as 'paid' | 'pending' | 'overdue',
        };
        setSales((prev) => [newSale, ...prev]);
        setShowInvoiceForm(false);
    };

    const handleAddExpense = (e: React.FormEvent) => {
        e.preventDefault();
        if (!expenseForm.description || !expenseForm.amount) return;
        const newExp: Transaction = {
            id: `exp-${Date.now()}`,
            type: 'expense',
            amount: expenseForm.amount,
            description: expenseForm.description,
            category: expenseForm.category,
            date: expenseForm.date,
            status: 'completed',
        };
        setExpenses((prev) => [newExp, ...prev]);
        setShowAddExpense(false);
        setExpenseForm({ description: '', amount: 0, category: businessExpenseCategories[0].name, date: new Date().toISOString().split('T')[0] });
    };

    const totalSales = sales.reduce((s, t) => s + t.amount, 0);
    const totalExpenses = expenses.reduce((s, t) => s + t.amount, 0);
    const netProfit = totalSales - totalExpenses;
    const pendingInvoices = sales.filter((i) => i.status === 'pending' || i.status === 'overdue').length;
    const lowStockItems = sampleInventory.filter((i) => i.qty <= i.reorderAt).length;
    const totalInventoryValue = sampleInventory.reduce((s, i) => s + i.qty * i.unitPrice, 0);

    const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'sales': return renderSales();
            case 'expenses': return renderExpenses();
            case 'payroll': return renderPayroll();
            case 'purchase': return renderPurchaseOrders();
            case 'inventory': return renderInventory();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    /* ========== OVERVIEW ========== */
    const renderOverview = () => (
        <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Total Sales" value={fmt(totalSales)} change="+8.3%" changeType="up" color="#22c55e" />
                <KPICard icon="💸" label="Operating Costs" value={fmt(totalExpenses)} change="-2.1%" changeType="down" color="#ef4444" />
                <KPICard icon="📈" label="Net Profit" value={fmt(netProfit)} change="+15.4%" changeType="up" color="#6366f1" />
                <KPICard icon="📦" label="Low Stock" value={String(lowStockItems)} change={lowStockItems > 0 ? 'Reorder' : 'OK'} changeType={lowStockItems > 0 ? 'down' : 'up'} color="#f59e0b" />
                <KPICard icon="🧾" label="Pending" value={String(pendingInvoices)} change={pendingInvoices > 0 ? 'Follow up' : 'Clear'} changeType={pendingInvoices > 0 ? 'down' : 'up'} color="#06b6d4" />
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#6366f1')}>+ New Invoice</button>
                <button onClick={() => { setActiveNav('expenses'); setShowAddExpense(true); }} style={actionBtn('#ef4444')}>+ Add Expense</button>
                <button onClick={() => setActiveNav('inventory')} style={actionBtn('#f59e0b')}>📦 Inventory</button>
                <button onClick={() => setActiveNav('banking')} style={actionBtn('#06b6d4')}>🏦 Banking</button>
                <button onClick={() => setActiveNav('reports')} style={actionBtn('#8b5cf6')}>📋 Reports</button>
            </div>

            {/* Sales Chart + Top Customers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Revenue Chart */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📊 Revenue vs Costs (Last 6 Months)</h3>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', height: 180, padding: '1rem 0' }}>
                        {['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'].map((month, i) => {
                            const revenueH = [55, 62, 78, 68, 72, 82];
                            const costH = [35, 38, 42, 36, 40, 44];
                            return (
                                <div key={month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                                    <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', height: 150 }}>
                                        <div style={{ width: 16, height: `${revenueH[i]}%`, background: 'linear-gradient(to top, #3b82f6, #60a5fa)', borderRadius: 4 }} />
                                        <div style={{ width: 16, height: `${costH[i]}%`, background: 'linear-gradient(to top, #f97316, #fb923c)', borderRadius: 4 }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{month}</span>
                                </div>
                            );
                        })}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>● Revenue</span>
                        <span style={{ fontSize: '0.75rem', color: '#f97316' }}>● Costs</span>
                    </div>
                </div>

                {/* Top Customers */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>👥 Top Customers</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {sampleCustomers.map((c, i) => (
                            <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.55rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: ['#6366f1', '#8b5cf6', '#3b82f6', '#06b6d4'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>
                                        {c.name.charAt(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{c.name}</div>
                                        <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{c.orders} orders</div>
                                    </div>
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#22c55e' }}>{fmt(c.revenue)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Sales Channels + Expense Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Sales Channels */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>🏪 Sales by Channel</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {[
                            { name: 'Wholesale', amount: 620000, pct: 40, color: '#3b82f6' },
                            { name: 'Retail POS', amount: 310000, pct: 25, color: '#8b5cf6' },
                            { name: 'E-Commerce', amount: 248000, pct: 20, color: '#22c55e' },
                            { name: 'Direct Invoice', amount: 186000, pct: 15, color: '#f59e0b' },
                        ].map((ch) => (
                            <div key={ch.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{ch.name}</span>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{fmt(ch.amount)}</span>
                                </div>
                                <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}>
                                    <div style={{ height: '100%', width: `${ch.pct}%`, background: ch.color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Expense Categories */}
                <div style={cardStyle}>
                    <h3 style={cardTitle}>📂 Top Expenses</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {businessExpenseCategories.slice(0, 5).map((cat, i) => {
                            const amounts = [83200, 135000, 45000, 28000, 12500];
                            const pct = [28, 45, 15, 9, 4];
                            return (
                                <div key={cat.name}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>{cat.icon} {cat.name}</span>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{fmt(amounts[i])}</span>
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
            <TransactionList
                transactions={[...sales, ...expenses].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8)}
                title="Recent Transactions"
            />
        </div>
    );

    /* ========== SALES & INVOICES ========== */
    const renderSales = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Total Revenue" value={fmt(totalSales)} change="+8.3%" changeType="up" color="#22c55e" />
                <KPICard icon="🧾" label="Pending Invoices" value={String(pendingInvoices)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="⚠️" label="Overdue" value={String(sales.filter((i) => i.status === 'overdue').length)} changeType="down" color="#ef4444" />
                <KPICard icon="📈" label="Avg Order Value" value={fmt(Math.round(totalSales / sales.length))} change="+4.2%" changeType="up" color="#6366f1" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowInvoiceForm(true)} style={actionBtn('#22c55e')}>+ Create Invoice</button>
                <button style={actionBtn('#3b82f6')}>📤 Send Reminders</button>
            </div>

            {/* Revenue by Channel */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🏪 Revenue by Channel</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { name: 'Wholesale', amount: 620000, color: '#3b82f6', icon: '📦' },
                        { name: 'Retail POS', amount: 310000, color: '#8b5cf6', icon: '🏪' },
                        { name: 'E-Commerce', amount: 248000, color: '#22c55e', icon: '🛒' },
                        { name: 'Direct Invoice', amount: 186000, color: '#f59e0b', icon: '🧾' },
                    ].map((ch) => (
                        <div key={ch.name} style={{ padding: '0.75rem', background: `${ch.color}08`, borderRadius: 10, border: `1px solid ${ch.color}20` }}>
                            <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{ch.icon}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 4 }}>{ch.name}</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(ch.amount)}</div>
                        </div>
                    ))}
                </div>
            </div>

            <TransactionList transactions={sales} title="All Sales & Invoices" showFilter={false} />
        </div>
    );

    /* ========== EXPENSES ========== */
    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Total Expenses" value={fmt(totalExpenses)} change="-2.1%" changeType="down" color="#ef4444" />
                <KPICard icon="📊" label="This Week" value={fmt(85500)} changeType="neutral" color="#6366f1" />
                <KPICard icon="📉" label="Avg Daily" value={fmt(Math.round(totalExpenses / 30))} changeType="neutral" color="#8b5cf6" />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => setShowAddExpense(true)} style={actionBtn('#ef4444')}>+ Add Expense</button>
            </div>

            {showAddExpense && (
                <div style={{ ...cardStyle, marginBottom: '1.5rem', border: '2px solid #3b82f6' }}>
                    <h3 style={{ ...cardTitle, marginBottom: '1rem' }}>➕ Add Business Expense</h3>
                    <form onSubmit={handleAddExpense}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Description *</label>
                                <input type="text" value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} placeholder="What did you spend on?" style={inputStyle} required />
                            </div>
                            <div>
                                <label style={labelStyle}>Amount (LKR) *</label>
                                <input type="number" value={expenseForm.amount || ''} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: parseFloat(e.target.value) || 0 }))} placeholder="0" style={inputStyle} min="0" step="100" required />
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={labelStyle}>Category</label>
                                <select value={expenseForm.category} onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))} style={inputStyle}>
                                    {businessExpenseCategories.map((c) => (
                                        <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Date</label>
                                <input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} style={inputStyle} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowAddExpense(false)} style={{ ...actionBtn('#94a3b8'), background: '#f1f5f9', color: '#64748b' }}>Cancel</button>
                            <button type="submit" style={actionBtn('#3b82f6')}>💾 Save Expense</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Category Cards */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📂 Expense Categories</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {businessExpenseCategories.map((cat) => {
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

            <TransactionList transactions={expenses} title="All Expenses" showFilter={false} />
        </div>
    );

    /* ========== PAYROLL & EPF/ETF ========== */
    const renderPayroll = () => {
        const totalBasic = sampleEmployees.reduce((s, e) => s + e.basic, 0);
        const totalEpfEmp = sampleEmployees.reduce((s, e) => s + e.epfEmp, 0);
        const totalEpfEr = sampleEmployees.reduce((s, e) => s + e.epfEr, 0);
        const totalEtf = sampleEmployees.reduce((s, e) => s + e.etf, 0);
        const totalApit = sampleEmployees.reduce((s, e) => s + e.apit, 0);
        const totalNetPay = sampleEmployees.reduce((s, e) => s + e.netPay, 0);
        const totalCost = totalBasic + totalEpfEr + totalEtf;
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="👥" label="Employees" value={String(sampleEmployees.length)} changeType="neutral" color="#6366f1" />
                    <KPICard icon="💰" label="Total Payroll" value={fmt(totalBasic)} changeType="neutral" color="#3b82f6" />
                    <KPICard icon="🏛️" label="EPF + ETF (Employer)" value={fmt(totalEpfEr + totalEtf)} changeType="neutral" color="#f59e0b" />
                    <KPICard icon="💸" label="Total Cost to Business" value={fmt(totalCost)} changeType="neutral" color="#ef4444" />
                </div>

                {/* Payroll Table */}
                <div style={cardStyle}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3 style={{ ...cardTitle, margin: 0 }}>👥 March 2026 Payroll</h3>
                        <button style={actionBtn('#6366f1')}>+ Add Employee</button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {['Employee', 'Role', 'Basic', 'EPF (8%)', 'EPF-Er (12%)', 'ETF (3%)', 'APIT', 'Net Pay'].map(h => (
                                    <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>{h}</th>
                                ))}
                            </tr></thead>
                            <tbody>{sampleEmployees.map(e => (
                                <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{e.name}</td>
                                    <td style={{ padding: '0.5rem', color: '#64748b' }}>{e.role}</td>
                                    <td style={{ padding: '0.5rem' }}>{fmt(e.basic)}</td>
                                    <td style={{ padding: '0.5rem', color: '#ef4444' }}>({fmt(e.epfEmp)})</td>
                                    <td style={{ padding: '0.5rem', color: '#f59e0b' }}>{fmt(e.epfEr)}</td>
                                    <td style={{ padding: '0.5rem', color: '#f59e0b' }}>{fmt(e.etf)}</td>
                                    <td style={{ padding: '0.5rem', color: e.apit > 0 ? '#ef4444' : '#94a3b8' }}>{e.apit > 0 ? `(${fmt(e.apit)})` : '—'}</td>
                                    <td style={{ padding: '0.5rem', fontWeight: 700, color: '#22c55e' }}>{fmt(e.netPay)}</td>
                                </tr>
                            ))}</tbody>
                            <tfoot><tr style={{ borderTop: '2px solid #1e293b', fontWeight: 700 }}>
                                <td colSpan={2} style={{ padding: '0.5rem' }}>TOTALS</td>
                                <td style={{ padding: '0.5rem' }}>{fmt(totalBasic)}</td>
                                <td style={{ padding: '0.5rem', color: '#ef4444' }}>({fmt(totalEpfEmp)})</td>
                                <td style={{ padding: '0.5rem', color: '#f59e0b' }}>{fmt(totalEpfEr)}</td>
                                <td style={{ padding: '0.5rem', color: '#f59e0b' }}>{fmt(totalEtf)}</td>
                                <td style={{ padding: '0.5rem', color: '#ef4444' }}>({fmt(totalApit)})</td>
                                <td style={{ padding: '0.5rem', color: '#22c55e' }}>{fmt(totalNetPay)}</td>
                            </tr></tfoot>
                        </table>
                    </div>
                </div>

                {/* EPF/ETF Remittance Summary */}
                <div style={{ ...cardStyle, marginTop: '1rem', background: '#fffbeb', border: '1px solid #fef3c7' }}>
                    <h3 style={{ ...cardTitle, color: '#92400e' }}>🏛️ EPF/ETF Remittance Due</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>EPF (Employee 8%)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(totalEpfEmp)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>EPF (Employer 12%)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(totalEpfEr)}</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'white', borderRadius: 8 }}>
                            <div style={{ fontSize: '0.78rem', color: '#92400e' }}>ETF (3%)</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{fmt(totalEtf)}</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#92400e' }}>
                        ⚠️ EPF = Employee 8% + Employer 12% → remit to Central Bank. ETF 3% → remit to ETF Board. Due by 15th of following month.
                    </div>
                </div>
            </div>
        );
    };

    /* ========== PURCHASE ORDERS ========== */
    const renderPurchaseOrders = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📥" label="Total POs" value={String(samplePurchaseOrders.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="✅" label="Approved" value={String(samplePurchaseOrders.filter(p => p.status === 'approved').length)} changeType="up" color="#22c55e" />
                <KPICard icon="⏳" label="Pending" value={String(samplePurchaseOrders.filter(p => p.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="📦" label="Received" value={String(samplePurchaseOrders.filter(p => p.status === 'received').length)} changeType="neutral" color="#3b82f6" />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button style={actionBtn('#6366f1')}>+ New Purchase Order</button>
            </div>
            <div style={cardStyle}>
                <h3 style={cardTitle}>📥 Purchase Orders</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Supplier', 'Items', 'Total', 'Date', 'Delivery', 'Status'].map(h => (
                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>{samplePurchaseOrders.map(po => (
                        <tr key={po.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{po.supplier}</td>
                            <td style={{ padding: '0.5rem', fontSize: '0.78rem', color: '#64748b' }}>{po.items}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(po.total)}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{po.date}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{po.delivery}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                                    color: po.status === 'received' ? '#22c55e' : po.status === 'approved' ? '#3b82f6' : '#f59e0b',
                                    background: po.status === 'received' ? '#dcfce7' : po.status === 'approved' ? '#dbeafe' : '#fef3c7',
                                }}>{po.status}</span>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    /* ========== INVENTORY ========== */
    const renderInventory = () => (
        <div>
            {/* Inventory KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📦" label="Total SKUs" value={String(sampleInventory.length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="⚠️" label="Low Stock" value={String(lowStockItems)} change={lowStockItems > 0 ? 'Reorder now' : 'All good'} changeType={lowStockItems > 0 ? 'down' : 'up'} color="#f59e0b" />
                <KPICard icon="💰" label="Inventory Value" value={fmt(totalInventoryValue)} changeType="neutral" color="#22c55e" />
                <KPICard icon="📈" label="Stock Turnover" value="3.2x" change="+0.4x" changeType="up" color="#6366f1" />
            </div>

            {/* Inventory Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button style={actionBtn('#22c55e')}>+ Add Product</button>
                <button style={actionBtn('#3b82f6')}>📥 Stock In</button>
                <button style={actionBtn('#f59e0b')}>📤 Stock Out</button>
            </div>

            {/* Inventory Table */}
            <div style={cardStyle}>
                <h3 style={cardTitle}>📦 Products Inventory</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                {['Product', 'SKU', 'Category', 'Qty', 'Reorder At', 'Unit Price', 'Stock Value', 'Status'].map((h) => (
                                    <th key={h} style={{ padding: '0.65rem 0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {sampleInventory.map((item) => {
                                const isLow = item.qty <= item.reorderAt;
                                const stockValue = item.qty * item.unitPrice;
                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9', background: isLow ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 500 }}>{item.name}</td>
                                        <td style={{ padding: '0.65rem 0.5rem', color: '#94a3b8', fontFamily: 'monospace', fontSize: '0.78rem' }}>{item.sku}</td>
                                        <td style={{ padding: '0.65rem 0.5rem' }}>
                                            <span style={{ padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', fontSize: '0.75rem' }}>{item.category}</span>
                                        </td>
                                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600, color: isLow ? '#ef4444' : '#1e293b' }}>{item.qty}</td>
                                        <td style={{ padding: '0.65rem 0.5rem', color: '#94a3b8' }}>{item.reorderAt}</td>
                                        <td style={{ padding: '0.65rem 0.5rem' }}>{fmt(item.unitPrice)}</td>
                                        <td style={{ padding: '0.65rem 0.5rem', fontWeight: 600 }}>{fmt(stockValue)}</td>
                                        <td style={{ padding: '0.65rem 0.5rem' }}>
                                            <span style={{
                                                padding: '3px 10px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600,
                                                color: isLow ? '#ef4444' : '#22c55e',
                                                background: isLow ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                                            }}>
                                                {isLow ? '⚠️ Low' : '✅ In Stock'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    /* ========== BANKING ========== */
    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {sampleBankAccounts.map((acc) => (
                    <div key={acc.id} style={{ ...cardStyle, borderTop: `3px solid ${acc.type === 'current' ? '#3b82f6' : acc.type === 'savings' ? '#22c55e' : '#f59e0b'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{acc.name}</span>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>{acc.type}</span>
                        </div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 4 }}>{fmt(acc.balance)}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{acc.bank}</div>
                    </div>
                ))}
            </div>

            <div style={{ ...cardStyle, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e3a5f, #1e293b)', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Business Balance</div>
                        <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(sampleBankAccounts.reduce((s, a) => s + a.balance, 0))}</div>
                    </div>
                    <div style={{ fontSize: '3rem', opacity: 0.3 }}>🏦</div>
                </div>
            </div>

            {/* Cash Flow */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>💹 Cash Flow (This Month)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(34,197,94,0.05)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Money In</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>{fmt(totalSales)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: 10 }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Money Out</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#ef4444' }}>{fmt(totalExpenses)}</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(99,102,241,0.05)', borderRadius: 10, border: '1px solid rgba(99,102,241,0.15)' }}>
                        <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>Net Cash Flow</div>
                        <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6366f1' }}>{fmt(netProfit)}</div>
                    </div>
                </div>
            </div>

            {/* Cheques */}
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

    /* ========== REPORTS & TAX ========== */
    const renderReports = () => (
        <div>
            {/* P&L */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>📊 Monthly Profit & Loss</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.5rem 0' }}>
                    <div style={plRow}>
                        <span style={{ fontWeight: 600, color: '#22c55e' }}>💰 Total Revenue</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>{fmt(totalSales)}</span>
                    </div>
                    <div style={{ height: 1, background: '#f1f5f9' }} />
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', margin: '0.25rem 0' }}>OPERATING COSTS</div>
                    {businessExpenseCategories.map((cat) => {
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
                    <div style={plRow}>
                        <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Profit Margin</span>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366f1' }}>{totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0}%</span>
                    </div>
                </div>
            </div>

            {/* Tax Summary */}
            <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
                <h3 style={cardTitle}>🧾 Business Tax Summary (Estimated)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', padding: '0.5rem 0' }}>
                    {[
                        { label: 'Gross Revenue', value: fmt(totalSales), color: '#22c55e' },
                        { label: 'Deductible Costs', value: fmt(totalExpenses), color: '#ef4444' },
                        { label: 'Taxable Profit', value: fmt(netProfit), color: '#6366f1' },
                        { label: 'VAT Collected (Est.)', value: fmt(Math.round(totalSales * 0.18)), color: '#f59e0b' },
                    ].map((t) => (
                        <div key={t.label} style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: 10 }}>
                            <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: 4 }}>{t.label}</div>
                            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: t.color }}>{t.value}</div>
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7' }}>
                    <span style={{ fontSize: '0.8rem', color: '#92400e' }}>⚠️ VAT at 18%. APIT/Corporate Income Tax rates depend on business type. Consult your tax advisor for official IRD filings.</span>
                </div>
            </div>

            {/* Available Reports */}
            <div style={cardStyle}>
                <h3 style={cardTitle}>📋 Available Reports</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { name: 'Profit & Loss', icon: '📊', desc: 'Revenue & cost breakdown' },
                        { name: 'VAT Return', icon: '🧾', desc: 'VAT 18% collected & paid' },
                        { name: 'Sales by Channel', icon: '🏪', desc: 'POS, wholesale, e-commerce' },
                        { name: 'Customer Analysis', icon: '👥', desc: 'Top buyers & revenue' },
                        { name: 'Inventory Report', icon: '📦', desc: 'Stock levels & value' },
                        { name: 'Cash Flow', icon: '💹', desc: 'Money in vs money out' },
                        { name: 'Bank Reconciliation', icon: '🏦', desc: 'Match bank vs recorded' },
                        { name: 'Expense Analysis', icon: '📂', desc: 'Cost categories & trends' },
                        { name: 'Income Tax (APIT)', icon: '🇱🇰', desc: 'Estimated annual returns' },
                    ].map((r) => (
                        <div key={r.name} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, cursor: 'pointer', border: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 4 }}>
                                <span style={{ fontSize: '1.1rem' }}>{r.icon}</span>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{r.name}</span>
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.desc}</div>
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
                <h3 style={cardTitle}>⚙️ Business Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem 0' }}>
                    {[
                        { label: 'Business Name', value: 'My Business (Pvt) Ltd', icon: '🏢' },
                        { label: 'BR Number', value: 'PV-00012345', icon: '📋' },
                        { label: 'VAT Registration', value: 'VAT-LK-001234 (18%)', icon: '🧾' },
                        { label: 'EPF Employer No.', value: 'E/P/23456', icon: '🏛️' },
                        { label: 'ETF Employer No.', value: 'ETF/23456', icon: '🏛️' },
                        { label: 'IRD TIN', value: '123456789', icon: '🔑' },
                        { label: 'Financial Year', value: 'April 2025 – March 2026', icon: '📅' },
                        { label: 'Default Tax Rate', value: 'VAT 18%', icon: '📊' },
                        { label: 'Inventory Tracking', value: 'Enabled', icon: '📦' },
                        { label: 'Payroll Auto-Calc', value: 'Enabled (EPF/ETF/APIT)', icon: '💰' },
                    ].map((s) => (
                        <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <span style={{ fontSize: '1.1rem' }}>{s.icon}</span>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{s.label}</span>
                            </div>
                            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>{s.value}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <DashboardLayout
                profession="business"
                professionLabel="Business Owner"
                professionIcon="💼"
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

export default BusinessDashboard;
