import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'ponds', label: 'Ponds & Tanks', icon: '🐟' },
    { id: 'feed', label: 'Feed Management', icon: '🌾' },
    { id: 'water', label: 'Water Quality', icon: '🧪' },
    { id: 'harvest', label: 'Harvest & Sales', icon: '📦' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const ponds = [
    { id: 'p1', name: 'Pond A — Tilapia', species: 'Nile Tilapia', area: '0.5 acres', stockCount: 5000, stage: 'Growing', estHarvest: '2026-04-15', waterQuality: 'Good' },
    { id: 'p2', name: 'Pond B — Shrimp', species: 'Vannamei Shrimp', area: '1 acre', stockCount: 25000, stage: 'Pre-harvest', estHarvest: '2026-03-20', waterQuality: 'Good' },
    { id: 'p3', name: 'Pond C — Tilapia', species: 'Red Tilapia', area: '0.75 acres', stockCount: 3500, stage: 'Fingerling', estHarvest: '2026-06-01', waterQuality: 'Fair' },
    { id: 'p4', name: 'Tank D — Crab', species: 'Mud Crab', area: '0.25 acres', stockCount: 800, stage: 'Growing', estHarvest: '2026-05-10', waterQuality: 'Good' },
];

const feedLog = [
    { date: '2026-03-10', pond: 'Pond A', type: 'Prima Aqua Grow', qty: '15 kg', cost: 4500, fcr: 1.4 },
    { date: '2026-03-10', pond: 'Pond B', type: 'CIC Shrimp Feed', qty: '25 kg', cost: 12500, fcr: 1.2 },
    { date: '2026-03-10', pond: 'Pond C', type: 'Prima Starter', qty: '8 kg', cost: 3200, fcr: 1.6 },
    { date: '2026-03-10', pond: 'Tank D', type: 'Trash Fish + Pellets', qty: '10 kg', cost: 2800, fcr: 2.1 },
    { date: '2026-03-09', pond: 'Pond A', type: 'Prima Aqua Grow', qty: '15 kg', cost: 4500, fcr: 1.4 },
    { date: '2026-03-09', pond: 'Pond B', type: 'CIC Shrimp Feed', qty: '25 kg', cost: 12500, fcr: 1.2 },
];

const waterLog = [
    { pond: 'Pond A', ph: 7.2, do2: 5.8, temp: 28, ammonia: 0.02, salinity: '-', date: '2026-03-10', status: 'Good' },
    { pond: 'Pond B', ph: 8.1, do2: 4.5, temp: 29, ammonia: 0.05, salinity: '18 ppt', date: '2026-03-10', status: 'Good' },
    { pond: 'Pond C', ph: 6.8, do2: 3.8, temp: 30, ammonia: 0.12, salinity: '-', date: '2026-03-10', status: 'Fair' },
    { pond: 'Tank D', ph: 7.5, do2: 5.2, temp: 27, ammonia: 0.03, salinity: '22 ppt', date: '2026-03-10', status: 'Good' },
];

const salesData: Transaction[] = [
    { id: 's1', type: 'income', amount: 185000, description: 'Shrimp — 250kg @ 740/kg', category: 'Shrimp', date: '2026-03-08', status: 'paid' },
    { id: 's2', type: 'income', amount: 65000, description: 'Tilapia — 200kg @ 325/kg (Pettah)', category: 'Tilapia', date: '2026-03-05', status: 'paid' },
    { id: 's3', type: 'income', amount: 120000, description: 'Mud crab export — 50kg @ 2400/kg', category: 'Crab', date: '2026-03-03', status: 'paid' },
    { id: 's4', type: 'income', amount: 45000, description: 'Fingerling sales — 2000 pcs', category: 'Fingerlings', date: '2026-03-01', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 85000, description: 'Fish feed — Prima / CIC', category: 'Feed', date: '2026-03-07', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 35000, description: 'Fingerling purchase — 5000 pcs', category: 'Stock', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 45000, description: 'Farm workers (3)', category: 'Labour', date: '2026-03-01', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 12000, description: 'Aerators electricity', category: 'Utilities', date: '2026-03-02', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 8500, description: 'Water quality chemicals', category: 'Chemicals', date: '2026-03-05', status: 'completed' },
    { id: 'e6', type: 'expense', amount: 6000, description: 'NAQDA licence renewal', category: 'Licences', date: '2026-03-01', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Farm Account', bank: 'Peoples Bank', balance: 580000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'BOC', balance: 420000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const AquacultureDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const [activeNav, setActiveNav] = useState('overview');
    const totI = salesData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'ponds': return renderPonds();
            case 'feed': return renderFeed();
            case 'water': return renderWater();
            case 'harvest': return renderHarvest();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+15%" changeType="up" color="#22c55e" />
            <KPICard icon="🐟" label="Ponds" value={String(ponds.length)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="📦" label="Harvest Soon" value={String(ponds.filter(p => p.stage === 'Pre-harvest').length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="💸" label="Feed Cost" value={fmt(85000)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="⚠️" label="Water Issues" value={String(ponds.filter(p => p.waterQuality === 'Fair').length)} changeType="down" color="#ef4444" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={cs}><h3 style={ct}>🐟 Pond Status</h3>
                {ponds.map(p => (<div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{p.name}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{p.species} · {p.stockCount.toLocaleString()} pcs · {p.area}</div></div>
                    <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: 8, fontWeight: 600, background: p.stage === 'Pre-harvest' ? '#dcfce7' : p.stage === 'Growing' ? '#dbeafe' : '#fef3c7', color: p.stage === 'Pre-harvest' ? '#22c55e' : p.stage === 'Growing' ? '#3b82f6' : '#f59e0b' }}>{p.stage}</span>
                        <div style={{ fontSize: '0.7rem', color: p.waterQuality === 'Good' ? '#22c55e' : '#f59e0b', marginTop: 2 }}>Water: {p.waterQuality}</div>
                    </div>
                </div>))}
            </div>
            <div style={cs}><h3 style={ct}>📈 Revenue by Species</h3>
                {[{ n: '🦐 Shrimp', a: 185000, p: 45, c: '#ef4444' }, { n: '🦀 Mud Crab', a: 120000, p: 29, c: '#f59e0b' }, { n: '🐟 Tilapia', a: 65000, p: 16, c: '#3b82f6' }, { n: '🐠 Fingerlings', a: 45000, p: 10, c: '#22c55e' }].map(s => (
                    <div key={s.n} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{s.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(s.a)}</span></div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${s.p}%`, background: s.c, borderRadius: 3 }} /></div>
                    </div>
                ))}
            </div>
        </div>
        <TransactionList transactions={[...salesData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>);

    const renderPonds = () => (<div style={cs}><h3 style={ct}>🐟 Ponds & Tanks</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Pond', 'Species', 'Area', 'Stock', 'Stage', 'Harvest', 'Water'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
            <tbody>{ponds.map(p => (<tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.5rem' }}>{p.species}</td>
                <td style={{ padding: '0.5rem' }}>{p.area}</td><td style={{ padding: '0.5rem' }}>{p.stockCount.toLocaleString()}</td>
                <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: p.stage === 'Pre-harvest' ? '#dcfce7' : p.stage === 'Growing' ? '#dbeafe' : '#fef3c7', color: p.stage === 'Pre-harvest' ? '#22c55e' : p.stage === 'Growing' ? '#3b82f6' : '#f59e0b' }}>{p.stage}</span></td>
                <td style={{ padding: '0.5rem' }}>{p.estHarvest}</td>
                <td style={{ padding: '0.5rem', color: p.waterQuality === 'Good' ? '#22c55e' : '#f59e0b', fontWeight: 600 }}>{p.waterQuality}</td>
            </tr>))}</tbody>
        </table>
    </div>);

    const renderFeed = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🌾" label="Daily Feed" value={`${feedLog.filter(f => f.date === '2026-03-10').reduce((s, f) => s + parseInt(f.qty), 0)} kg`} changeType="neutral" color="#f59e0b" />
            <KPICard icon="💰" label="Daily Cost" value={fmt(feedLog.filter(f => f.date === '2026-03-10').reduce((s, f) => s + f.cost, 0))} changeType="neutral" color="#ef4444" />
            <KPICard icon="📊" label="Avg FCR" value="1.53" changeType="neutral" color="#6366f1" />
        </div>
        <div style={cs}><h3 style={ct}>🌾 Feed Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Date', 'Pond', 'Feed Type', 'Qty', 'Cost', 'FCR'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{feedLog.map((f, i) => (<tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{f.date}</td><td style={{ padding: '0.5rem' }}>{f.pond}</td>
                    <td style={{ padding: '0.5rem' }}>{f.type}</td><td style={{ padding: '0.5rem' }}>{f.qty}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(f.cost)}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600, color: f.fcr <= 1.5 ? '#22c55e' : '#f59e0b' }}>{f.fcr}</td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderWater = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🧪" label="Tested Today" value={String(waterLog.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="✅" label="Good" value={String(waterLog.filter(w => w.status === 'Good').length)} changeType="up" color="#22c55e" />
            <KPICard icon="⚠️" label="Needs Attention" value={String(waterLog.filter(w => w.status === 'Fair').length)} changeType="down" color="#f59e0b" />
        </div>
        <div style={cs}><h3 style={ct}>🧪 Water Quality Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Pond', 'pH', 'DO₂', 'Temp °C', 'Ammonia', 'Salinity', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{waterLog.map(w => (<tr key={w.pond} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{w.pond}</td>
                    <td style={{ padding: '0.5rem' }}>{w.ph}</td><td style={{ padding: '0.5rem' }}>{w.do2} mg/L</td>
                    <td style={{ padding: '0.5rem' }}>{w.temp}°C</td><td style={{ padding: '0.5rem' }}>{w.ammonia} mg/L</td>
                    <td style={{ padding: '0.5rem' }}>{w.salinity}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: w.status === 'Good' ? '#dcfce7' : '#fef3c7', color: w.status === 'Good' ? '#22c55e' : '#f59e0b' }}>{w.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderHarvest = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🦐" label="Shrimp" value={fmt(185000)} changeType="up" color="#ef4444" />
            <KPICard icon="🦀" label="Crab" value={fmt(120000)} changeType="up" color="#f59e0b" />
            <KPICard icon="🐟" label="Tilapia" value={fmt(65000)} changeType="neutral" color="#3b82f6" />
        </div>
        <TransactionList transactions={salesData} title="Harvest & Sales" showFilter={false} />
    </div>);

    const renderExpenses = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🌾" label="Feed" value={fmt(85000)} changeType="neutral" color="#6366f1" />
            <KPICard icon="👷" label="Labour" value={fmt(45000)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="🧪" label="Chemicals" value={fmt(8500)} changeType="neutral" color="#f59e0b" />
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
            {['📊 Farm P&L', '🐟 Harvest Summary', '🧪 Water Quality', '🌾 Feed Usage & FCR', '🦐 Species Performance', '📦 Stock Mortality', '🧾 Tax (APIT)', '💰 Export Revenue', '📈 Growth Analysis'].map(r => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div>);

    const renderSettings = () => (<div style={cs}><h3 style={ct}>⚙️ Farm Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['🐟 Farm Name', 'Chilaw Aqua Farm'], ['📋 NAQDA Licence', 'NAQDA/AQ/2024/0345'], ['🌊 Location', 'Chilaw, Puttalam District'], ['🐟 Species', 'Tilapia, Vannamei Shrimp, Mud Crab'], ['📦 Export Licence', 'DFAR/EXP/2024/089'], ['🧪 Lab Partner', 'NARA Water Testing Lab'], ['📅 Tax Year', '2025/2026'], ['💱 Export Currency', 'LKR / USD']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div>);

    return (
        <DashboardLayout profession="aquaculture" professionLabel="Aquaculture" professionIcon="🐟" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default AquacultureDashboard;
