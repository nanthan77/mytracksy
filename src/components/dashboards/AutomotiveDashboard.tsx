import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'jobs', label: 'Job Cards', icon: '🔧' },
    { id: 'estimates', label: 'Estimates', icon: '📝' },
    { id: 'parts', label: 'Parts & Stock', icon: '📦' },
    { id: 'customers', label: 'Customers & Vehicles', icon: '🚗' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const jobs = [
    { id: 'j1', vehicle: 'Toyota Axio — WP KA-1234', customer: 'Mr. Silva', type: 'Full Service', amount: 18500, status: 'in-progress', date: '2026-03-10' },
    { id: 'j2', vehicle: 'Honda Vezel — WP CAB-5678', customer: 'Mrs. Perera', type: 'Brake Repair', amount: 12000, status: 'completed', date: '2026-03-09' },
    { id: 'j3', vehicle: 'Suzuki Alto — WP KG-9012', customer: 'Mr. Fernando', type: 'Engine Tune-up', amount: 8500, status: 'completed', date: '2026-03-08' },
    { id: 'j4', vehicle: 'BMW 320i — WP KE-3456', customer: 'Dr. Jayawardena', type: 'AC Repair + Gas', amount: 22000, status: 'in-progress', date: '2026-03-10' },
    { id: 'j5', vehicle: 'Tata Dimo Batta — 65-7890', customer: 'Lanka Logistics', type: 'Clutch Replacement', amount: 35000, status: 'pending', date: '2026-03-11' },
];

const estimates = [
    { id: 'est1', vehicle: 'Nissan X-Trail — WP KH-4567', customer: 'Mr. Bandara', work: 'Timing Belt + Water Pump', parts: 28000, labour: 12000, total: 40000, status: 'sent', date: '2026-03-09' },
    { id: 'est2', vehicle: 'Toyota Prado — WP KD-8901', customer: 'Mr. Wickramasinghe', work: 'Suspension Overhaul', parts: 85000, labour: 25000, total: 110000, status: 'approved', date: '2026-03-08' },
    { id: 'est3', vehicle: 'Honda Fit — WP CAA-2345', customer: 'Ms. Ranasinghe', work: 'Full Respray', parts: 45000, labour: 35000, total: 80000, status: 'draft', date: '2026-03-10' },
];

const customerVehicles = [
    { customer: 'Mr. Silva', phone: '077-1234567', vehicles: 2, lastVisit: '2026-03-10', totalSpent: 145000 },
    { customer: 'Mrs. Perera', phone: '071-2345678', vehicles: 1, lastVisit: '2026-03-09', totalSpent: 85000 },
    { customer: 'Dr. Jayawardena', phone: '076-3456789', vehicles: 3, lastVisit: '2026-03-10', totalSpent: 320000 },
    { customer: 'Mr. Fernando', phone: '078-4567890', vehicles: 1, lastVisit: '2026-03-08', totalSpent: 62000 },
    { customer: 'Lanka Logistics', phone: '011-5678901', vehicles: 8, lastVisit: '2026-03-11', totalSpent: 890000 },
];

const parts = [
    { name: 'Engine Oil 5W-30', stock: 45, unit: 'L', reorder: 20, price: 1200 },
    { name: 'Brake Pads (Front)', stock: 8, unit: 'set', reorder: 10, price: 3500 },
    { name: 'Oil Filter (Universal)', stock: 32, unit: 'pc', reorder: 15, price: 450 },
    { name: 'Air Filter', stock: 18, unit: 'pc', reorder: 10, price: 850 },
    { name: 'Spark Plugs', stock: 24, unit: 'pc', reorder: 20, price: 650 },
    { name: 'Coolant', stock: 5, unit: 'L', reorder: 15, price: 800 },
    { name: 'AC Gas R134a', stock: 12, unit: 'can', reorder: 10, price: 2500 },
    { name: 'Timing Belt (Toyota)', stock: 3, unit: 'pc', reorder: 5, price: 8500 },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 18500, description: 'Full service — Toyota Axio', category: 'Service', date: '2026-03-10', status: 'pending' },
    { id: 'i2', type: 'income', amount: 12000, description: 'Brake repair — Honda Vezel', category: 'Repair', date: '2026-03-09', status: 'paid' },
    { id: 'i3', type: 'income', amount: 8500, description: 'Engine tune-up — Suzuki Alto', category: 'Service', date: '2026-03-08', status: 'paid' },
    { id: 'i4', type: 'income', amount: 22000, description: 'AC repair — BMW 320i', category: 'Repair', date: '2026-03-10', status: 'pending' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 45000, description: 'Parts order — Scan Auto', category: 'Parts Purchase', date: '2026-03-08', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 80000, description: 'Mechanic salaries (3 staff)', category: 'Staff', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 25000, description: 'Workshop rent — Nugegoda', category: 'Rent', date: '2026-03-01', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 8500, description: 'Electricity + water', category: 'Utilities', date: '2026-03-02', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Workshop Account', bank: 'Bank of Ceylon', balance: 485000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'HNB', balance: 850000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const AutomotiveDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const [activeNav, setActiveNav] = useState('overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'jobs': return renderJobs();
            case 'estimates': return renderEstimates();
            case 'parts': return renderParts();
            case 'customers': return renderCustomers();
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
                <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+8%" changeType="up" color="#22c55e" />
                <KPICard icon="💸" label="Costs" value={fmt(totE)} changeType="neutral" color="#ef4444" />
                <KPICard icon="🔧" label="Active Jobs" value={String(jobs.filter((j) => j.status === 'in-progress').length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="⏳" label="Pending" value={String(jobs.filter((j) => j.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="⚠️" label="Low Stock" value={String(parts.filter((p) => p.stock <= p.reorder).length)} changeType="down" color="#ef4444" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cs}><h3 style={ct}>🔧 Today&apos;s Jobs</h3>
                    {jobs.filter((j) => j.status !== 'completed').map((j) => (
                        <div key={j.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{j.vehicle}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{j.customer} · {j.type}</div></div>
                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(j.amount)}</div>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 8, background: j.status === 'in-progress' ? '#dbeafe' : '#fef3c7', color: j.status === 'in-progress' ? '#3b82f6' : '#f59e0b' }}>{j.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={cs}><h3 style={ct}>⚠️ Low Stock Alerts</h3>
                    {parts.filter((p) => p.stock <= p.reorder).map((p) => (
                        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <span style={{ fontSize: '0.82rem' }}>{p.name}</span>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#ef4444' }}>{p.stock} {p.unit} left</span>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
        </div>
    );

    const renderJobs = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="🔧" label="In Progress" value={String(jobs.filter((j) => j.status === 'in-progress').length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="✅" label="Completed" value={String(jobs.filter((j) => j.status === 'completed').length)} changeType="up" color="#22c55e" />
                <KPICard icon="💰" label="Total Value" value={fmt(jobs.reduce((s, j) => s + j.amount, 0))} changeType="neutral" color="#6366f1" />
            </div>
            <div style={cs}><h3 style={ct}>📋 All Job Cards</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Vehicle', 'Customer', 'Job', 'Amount', 'Status'].map((h) => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{jobs.map((j) => (<tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.6rem', fontWeight: 500 }}>{j.vehicle}</td><td style={{ padding: '0.6rem' }}>{j.customer}</td>
                        <td style={{ padding: '0.6rem' }}>{j.type}</td><td style={{ padding: '0.6rem', fontWeight: 600 }}>{fmt(j.amount)}</td>
                        <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: j.status === 'completed' ? '#dcfce7' : j.status === 'in-progress' ? '#dbeafe' : '#fef3c7', color: j.status === 'completed' ? '#22c55e' : j.status === 'in-progress' ? '#3b82f6' : '#f59e0b' }}>{j.status}</span></td>
                    </tr>))}</tbody>
                </table>
            </div>
        </div>
    );

    /* ========== ESTIMATES ========== */
    const renderEstimates = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📝" label="Total Estimates" value={String(estimates.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="✅" label="Approved" value={String(estimates.filter(e => e.status === 'approved').length)} changeType="up" color="#22c55e" />
                <KPICard icon="💰" label="Pipeline Value" value={fmt(estimates.reduce((s, e) => s + e.total, 0))} changeType="neutral" color="#f59e0b" />
            </div>
            <div style={cs}><h3 style={ct}>📝 Estimate Quotations</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Vehicle', 'Customer', 'Work Description', 'Parts', 'Labour', 'Total', 'Status'].map(h => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{estimates.map(e => (
                        <tr key={e.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem', fontWeight: 500, fontSize: '0.8rem' }}>{e.vehicle}</td>
                            <td style={{ padding: '0.6rem' }}>{e.customer}</td>
                            <td style={{ padding: '0.6rem' }}>{e.work}</td>
                            <td style={{ padding: '0.6rem' }}>{fmt(e.parts)}</td>
                            <td style={{ padding: '0.6rem' }}>{fmt(e.labour)}</td>
                            <td style={{ padding: '0.6rem', fontWeight: 700 }}>{fmt(e.total)}</td>
                            <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: e.status === 'approved' ? '#dcfce7' : e.status === 'sent' ? '#dbeafe' : '#f1f5f9', color: e.status === 'approved' ? '#22c55e' : e.status === 'sent' ? '#3b82f6' : '#64748b' }}>{e.status}</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const renderParts = () => (<div><div style={cs}><h3 style={ct}>📦 Parts Inventory</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Part', 'Stock', 'Reorder Level', 'Unit Price', 'Status'].map((h) => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
            <tbody>{parts.map((p) => (<tr key={p.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.6rem' }}>{p.stock} {p.unit}</td>
                <td style={{ padding: '0.6rem' }}>{p.reorder} {p.unit}</td><td style={{ padding: '0.6rem', fontWeight: 600 }}>{fmt(p.price)}</td>
                <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: p.stock <= p.reorder ? '#fef2f2' : '#f0fdf4', color: p.stock <= p.reorder ? '#ef4444' : '#22c55e' }}>{p.stock <= p.reorder ? '⚠️ Low' : '✅ OK'}</span></td>
            </tr>))}</tbody>
        </table>
    </div></div>);

    /* ========== CUSTOMERS & VEHICLES ========== */
    const renderCustomers = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="👥" label="Total Customers" value={String(customerVehicles.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="🚗" label="Total Vehicles" value={String(customerVehicles.reduce((s, c) => s + c.vehicles, 0))} changeType="neutral" color="#3b82f6" />
                <KPICard icon="💰" label="Lifetime Revenue" value={fmt(customerVehicles.reduce((s, c) => s + c.totalSpent, 0))} changeType="up" color="#22c55e" />
            </div>
            <div style={cs}><h3 style={ct}>👥 Customer Database</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Customer', 'Phone', 'Vehicles', 'Last Visit', 'Total Spent'].map(h => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{customerVehicles.map(c => (
                        <tr key={c.customer} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem', fontWeight: 600 }}>{c.customer}</td>
                            <td style={{ padding: '0.6rem' }}>{c.phone}</td>
                            <td style={{ padding: '0.6rem' }}>{c.vehicles}</td>
                            <td style={{ padding: '0.6rem' }}>{c.lastVisit}</td>
                            <td style={{ padding: '0.6rem', fontWeight: 600, color: '#22c55e' }}>{fmt(c.totalSpent)}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Total" value={fmt(totE)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📦" label="Parts" value={fmt(45000)} changeType="neutral" color="#6366f1" />
                <KPICard icon="👷" label="Salaries" value={fmt(80000)} changeType="neutral" color="#8b5cf6" />
            </div>
            <TransactionList transactions={expenseData} title="All Expenses" showFilter={false} />
        </div>
    );

    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {banks.map((a) => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'current' ? '#3b82f6' : '#22c55e'}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.3rem 0' }}>{fmt(a.balance)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.bank}</div>
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
            {['📊 P&L Statement', '🔧 Job Summary', '📦 Parts Usage', '👥 Customer Report', '🚗 Vehicle History', '🧾 Tax (APIT)', '📝 Estimates Report', '📦 Stock Valuation', '📈 Revenue Analysis'].map((r) => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Workshop Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['🔧 Workshop Name', 'Auto Care Nugegoda'], ['📋 BR Number', 'PV/2024/00456'], ['🏢 RMV Approved', 'Yes — Emission Testing'], ['🚗 Specialization', 'General / Japanese & European'], ['👷 Staff Count', '4 Mechanics + 1 Helper'], ['💱 Labour Rate', 'LKR 1,500/hr'], ['📅 Tax Year', '2025/2026'], ['📱 SMS Alerts', 'Enabled — Service Reminders']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="automotive" professionLabel="Automotive" professionIcon="🔧" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default AutomotiveDashboard;
