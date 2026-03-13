import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useRouteNav } from '../../hooks/useRouteNav';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'fleet', label: 'Fleet', icon: '🚛' },
    { id: 'trips', label: 'Trips & Jobs', icon: '📦' },
    { id: 'drivers', label: 'Drivers', icon: '👷' },
    { id: 'fuel', label: 'Fuel Log', icon: '⛽' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const fleet = [
    { id: 'v1', reg: 'WP LD-4521', type: 'Lorry (14ft)', driver: 'Kamal', status: 'on-trip', km: 185000, nextService: '2026-03-25' },
    { id: 'v2', reg: 'WP LA-7823', type: 'Lorry (20ft)', driver: 'Nimal', status: 'available', km: 120000, nextService: '2026-04-10' },
    { id: 'v3', reg: 'SP QC-3345', type: 'Truck (Prime Mover)', driver: 'Sunil', status: 'on-trip', km: 340000, nextService: '2026-03-18' },
    { id: 'v4', reg: 'WP KD-1190', type: 'Van (Delivery)', driver: 'Ravi', status: 'maintenance', km: 95000, nextService: '2026-03-12' },
];

const drivers = [
    { name: 'Kamal Perera', licence: 'HVL-A1', vehicle: 'WP LD-4521', salary: 65000, phone: '077-1234567', trips: 45, status: 'on-trip' },
    { name: 'Nimal Silva', licence: 'HVL-B2', vehicle: 'WP LA-7823', salary: 65000, phone: '071-2345678', trips: 38, status: 'available' },
    { name: 'Sunil Fernando', licence: 'HVL-PRIME', vehicle: 'SP QC-3345', salary: 80000, phone: '076-3456789', trips: 52, status: 'on-trip' },
    { name: 'Ravi Jayawardena', licence: 'LVL-C', vehicle: 'WP KD-1190', salary: 55000, phone: '078-4567890', trips: 30, status: 'off-duty' },
];

const fuelLog = [
    { date: '2026-03-10', vehicle: 'WP LD-4521', litres: 85, cost: 34000, station: 'IOC Kadawatha', km: 185000 },
    { date: '2026-03-09', vehicle: 'SP QC-3345', litres: 120, cost: 48000, station: 'Lanka IOC Peliyagoda', km: 340000 },
    { date: '2026-03-08', vehicle: 'WP LA-7823', litres: 65, cost: 26000, station: 'Ceylon Petroleum Kelaniya', km: 120000 },
    { date: '2026-03-07', vehicle: 'WP KD-1190', litres: 35, cost: 14000, station: 'IOC Nugegoda', km: 95000 },
];

const trips = [
    { id: 't1', from: 'Colombo', to: 'Jaffna', cargo: 'Building materials', weight: '8 Tons', amount: 85000, vehicle: 'WP LD-4521', status: 'in-transit', date: '2026-03-10' },
    { id: 't2', from: 'Kandy', to: 'Galle', cargo: 'Consumer goods', weight: '5 Tons', amount: 45000, vehicle: 'WP LA-7823', status: 'completed', date: '2026-03-09' },
    { id: 't3', from: 'Colombo Port', to: 'Katunayake FTZ', cargo: 'Raw materials', weight: '20 Tons', amount: 120000, vehicle: 'SP QC-3345', status: 'in-transit', date: '2026-03-10' },
    { id: 't4', from: 'Colombo', to: 'Kurunegala', cargo: 'E-commerce parcels', weight: '1.5 Tons', amount: 28000, vehicle: 'WP KD-1190', status: 'scheduled', date: '2026-03-12' },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 85000, description: 'Colombo to Jaffna — Building materials', category: 'Long Haul', date: '2026-03-10', status: 'pending' },
    { id: 'i2', type: 'income', amount: 45000, description: 'Kandy to Galle — Consumer goods', category: 'Short Haul', date: '2026-03-09', status: 'paid' },
    { id: 'i3', type: 'income', amount: 120000, description: 'Port to FTZ — Container', category: 'Container', date: '2026-03-10', status: 'pending' },
    { id: 'i4', type: 'income', amount: 28000, description: 'Colombo to Kurunegala — Parcels', category: 'Delivery', date: '2026-03-08', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 95000, description: 'Diesel — all vehicles', category: 'Fuel', date: '2026-03-08', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 120000, description: 'Driver salaries', category: 'Salaries', date: '2026-03-01', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 35000, description: 'Tire replacement — SP QC-3345', category: 'Maintenance', date: '2026-03-05', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 18000, description: 'Insurance renewal', category: 'Insurance', date: '2026-03-01', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 8500, description: 'RMV revenue licence', category: 'Licences', date: '2026-03-02', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Business Account', bank: 'Peoples Bank', balance: 1250000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'BOC', balance: 680000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const TransportationDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'fleet': return renderFleet();
            case 'trips': return renderTrips();
            case 'drivers': return renderDrivers();
            case 'fuel': return renderFuel();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.85rem', marginBottom: '1.5rem' }}>
            <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+12%" changeType="up" color="#22c55e" />
            <KPICard icon="🚛" label="Fleet" value={String(fleet.length)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="📦" label="Active Trips" value={String(trips.filter(t => t.status === 'in-transit').length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="⛽" label="Fuel Cost" value={fmt(95000)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="🔧" label="Maintenance" value={String(fleet.filter(v => v.status === 'maintenance').length)} changeType="down" color="#ef4444" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={cs}><h3 style={ct}>🚛 Fleet Status</h3>
                {fleet.map(v => (<div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{v.reg} — {v.type}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{v.driver} · {v.km.toLocaleString()} km</div></div>
                    <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 8, fontWeight: 600, alignSelf: 'center', background: v.status === 'on-trip' ? '#dbeafe' : v.status === 'available' ? '#dcfce7' : '#fef2f2', color: v.status === 'on-trip' ? '#3b82f6' : v.status === 'available' ? '#22c55e' : '#ef4444' }}>{v.status}</span>
                </div>))}
            </div>
            <div style={cs}><h3 style={ct}>📦 Active Trips</h3>
                {trips.filter(t => t.status !== 'completed').map(t => (<div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{t.from} → {t.to}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{t.cargo} · {t.weight}</div></div>
                    <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(t.amount)}</div>
                        <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 8, background: t.status === 'in-transit' ? '#dbeafe' : '#fef3c7', color: t.status === 'in-transit' ? '#3b82f6' : '#f59e0b' }}>{t.status}</span></div>
                </div>))}
            </div>
        </div>
        <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>);

    const renderFleet = () => (<div style={cs}><h3 style={ct}>🚛 Fleet</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Reg #', 'Type', 'Driver', 'KM', 'Next Service', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
            <tbody>{fleet.map(v => (<tr key={v.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{v.reg}</td><td style={{ padding: '0.5rem' }}>{v.type}</td>
                <td style={{ padding: '0.5rem' }}>{v.driver}</td><td style={{ padding: '0.5rem' }}>{v.km.toLocaleString()}</td>
                <td style={{ padding: '0.5rem', color: '#6366f1' }}>{v.nextService}</td>
                <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: v.status === 'on-trip' ? '#dbeafe' : v.status === 'available' ? '#dcfce7' : '#fef2f2', color: v.status === 'on-trip' ? '#3b82f6' : v.status === 'available' ? '#22c55e' : '#ef4444' }}>{v.status}</span></td>
            </tr>))}</tbody>
        </table>
    </div>);

    const renderTrips = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="📦" label="Total Trips" value={String(trips.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="🚛" label="In Transit" value={String(trips.filter(t => t.status === 'in-transit').length)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="💰" label="Revenue" value={fmt(totI)} changeType="up" color="#22c55e" />
        </div>
        <div style={cs}><h3 style={ct}>📦 All Trips</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Route', 'Cargo', 'Weight', 'Vehicle', 'Amount', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{trips.map(t => (<tr key={t.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{t.from} → {t.to}</td><td style={{ padding: '0.5rem' }}>{t.cargo}</td>
                    <td style={{ padding: '0.5rem' }}>{t.weight}</td><td style={{ padding: '0.5rem' }}>{t.vehicle}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(t.amount)}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: t.status === 'completed' ? '#dcfce7' : t.status === 'in-transit' ? '#dbeafe' : '#fef3c7', color: t.status === 'completed' ? '#22c55e' : t.status === 'in-transit' ? '#3b82f6' : '#f59e0b' }}>{t.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderDrivers = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="👷" label="Total Drivers" value={String(drivers.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="💰" label="Payroll" value={fmt(drivers.reduce((s, d) => s + d.salary, 0))} changeType="neutral" color="#3b82f6" />
            <KPICard icon="📦" label="Total Trips" value={String(drivers.reduce((s, d) => s + d.trips, 0))} changeType="up" color="#22c55e" />
        </div>
        <div style={cs}><h3 style={ct}>👷 Driver Roster</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Driver', 'Licence', 'Vehicle', 'Salary', 'Trips', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{drivers.map(d => (<tr key={d.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem' }}><div style={{ fontWeight: 600 }}>{d.name}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{d.phone}</div></td>
                    <td style={{ padding: '0.5rem' }}>{d.licence}</td><td style={{ padding: '0.5rem' }}>{d.vehicle}</td>
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(d.salary)}</td><td style={{ padding: '0.5rem' }}>{d.trips}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: d.status === 'on-trip' ? '#dbeafe' : d.status === 'available' ? '#dcfce7' : '#f1f5f9', color: d.status === 'on-trip' ? '#3b82f6' : d.status === 'available' ? '#22c55e' : '#64748b' }}>{d.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderFuel = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="⛽" label="Total Litres" value={`${fuelLog.reduce((s, f) => s + f.litres, 0)} L`} changeType="neutral" color="#f59e0b" />
            <KPICard icon="💰" label="Total Cost" value={fmt(fuelLog.reduce((s, f) => s + f.cost, 0))} changeType="neutral" color="#ef4444" />
            <KPICard icon="📊" label="Avg/L" value={`LKR ${Math.round(fuelLog.reduce((s, f) => s + f.cost, 0) / fuelLog.reduce((s, f) => s + f.litres, 0))}`} changeType="neutral" color="#6366f1" />
        </div>
        <div style={cs}><h3 style={ct}>⛽ Fuel Log</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Date', 'Vehicle', 'Litres', 'Cost', 'Station', 'Odometer'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{fuelLog.map((f, i) => (<tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{f.date}</td><td style={{ padding: '0.5rem' }}>{f.vehicle}</td>
                    <td style={{ padding: '0.5rem' }}>{f.litres} L</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(f.cost)}</td>
                    <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{f.station}</td><td style={{ padding: '0.5rem' }}>{f.km.toLocaleString()} km</td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    const renderExpenses = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="⛽" label="Fuel" value={fmt(95000)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="👷" label="Salaries" value={fmt(120000)} changeType="neutral" color="#6366f1" />
            <KPICard icon="🔧" label="Maintenance" value={fmt(35000)} changeType="neutral" color="#ef4444" />
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
            {['📊 Fleet P&L', '⛽ Fuel Report', '🚛 Vehicle History', '📦 Trip Summary', '👷 Driver Performance', '🔧 Maintenance Log', '🧾 Tax (APIT)', '📈 Revenue/KM', '💰 Payroll'].map(r => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div>);

    const renderSettings = () => (<div style={cs}><h3 style={ct}>⚙️ Transport Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['🚛 Company', 'Lanka Express Transport'], ['📋 NTC Licence', 'NTC/2024/L-0567'], ['🏢 BR Number', 'PV/2024/00789'], ['👷 Drivers', '4 Active'], ['⛽ Fuel Cards', 'IOC Fleet Card'], ['📅 Tax Year', '2025/2026'], ['🧾 EPF/ETF', 'E-78901']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div>);

    return (
        <DashboardLayout profession="transportation" professionLabel="Transportation" professionIcon="🚛" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default TransportationDashboard;
