import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'projects', label: 'Projects', icon: '🏗️' },
    { id: 'boq', label: 'BOQ Manager', icon: '📦' },
    { id: 'inspections', label: 'Site Inspections', icon: '🔍' },
    { id: 'invoices', label: 'Invoicing', icon: '🧾' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const projects = [
    { id: 'p1', name: 'Colombo Mall Extension', client: 'ABC Developers', value: 2500000, stage: 'Construction', pct: 65, ictadGrade: 'C1' },
    { id: 'p2', name: 'Galle Apartment Block', client: 'Southern Realty', value: 1800000, stage: 'Foundation', pct: 25, ictadGrade: 'C3' },
    { id: 'p3', name: 'Bridge Renovation — Kandy', client: 'RDA', value: 4200000, stage: 'Design', pct: 10, ictadGrade: 'C1' },
    { id: 'p4', name: 'Jaffna Water Treatment', client: 'NWS&DB', value: 3500000, stage: 'Completed', pct: 100, ictadGrade: 'C2' },
];

const boqItems = [
    { id: 'bq1', item: 'Reinforcement Steel (Y16)', unit: 'MT', qty: 25, rate: 285000, project: 'Colombo Mall', status: 'ordered' },
    { id: 'bq2', item: 'Ready-Mix Concrete (Grade 25)', unit: 'm³', qty: 120, rate: 18500, project: 'Colombo Mall', status: 'partial' },
    { id: 'bq3', item: 'Pile Foundation 600mm', unit: 'nos', qty: 48, rate: 45000, project: 'Galle Apt', status: 'completed' },
    { id: 'bq4', item: 'Formwork — Column/Beam', unit: 'm²', qty: 350, rate: 1200, project: 'Colombo Mall', status: 'ordered' },
    { id: 'bq5', item: 'Waterproofing Membrane', unit: 'm²', qty: 200, rate: 2800, project: 'Bridge Kandy', status: 'pending' },
];

const siteInspections = [
    { id: 'si1', project: 'Colombo Mall Extension', date: '2026-03-12', inspector: 'Eng. Perera', type: 'Structural', findings: 'Column alignment OK, rebar spacing verified', status: 'passed' },
    { id: 'si2', project: 'Galle Apartment Block', date: '2026-03-10', inspector: 'Eng. Fernando', type: 'Foundation', findings: 'Pile integrity test — 2 piles need re-driving', status: 'issues' },
    { id: 'si3', project: 'Bridge Renovation — Kandy', date: '2026-03-08', inspector: 'Eng. Silva', type: 'Safety Audit', findings: 'PPE compliance 95%, scaffolding OK', status: 'passed' },
    { id: 'si4', project: 'Colombo Mall Extension', date: '2026-03-05', inspector: 'Eng. Perera', type: 'Concrete Test', findings: 'Cube test 28-day strength: 32 MPa (Pass)', status: 'passed' },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 450000, description: 'Progress claim #4 — Colombo Mall', category: 'Construction', date: '2026-03-10', status: 'paid' },
    { id: 'i2', type: 'income', amount: 250000, description: 'Milestone — Galle Apt foundation', category: 'Foundation', date: '2026-03-07', status: 'pending' },
    { id: 'i3', type: 'income', amount: 180000, description: 'Design fee — Bridge Renovation', category: 'Design', date: '2026-03-04', status: 'paid' },
    { id: 'i4', type: 'income', amount: 350000, description: 'Final payment — Jaffna WTP', category: 'Completed', date: '2026-03-01', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 185000, description: 'Concrete & steel delivery', category: 'Site Materials', date: '2026-03-09', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 95000, description: 'Crane hire — Week 10', category: 'Equipment Hire', date: '2026-03-08', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 120000, description: 'Labour — site workers', category: 'Labour / Sub-Con', date: '2026-03-07', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 25000, description: 'AutoCAD licence renewal', category: 'Software / CAD', date: '2026-03-05', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Project Account', bank: 'Bank of Ceylon', balance: 4250000, type: 'current' },
    { id: 'b2', name: 'Operating Account', bank: 'Commercial Bank', balance: 1180000, type: 'current' },
    { id: 'b3', name: 'FD — Retention', bank: 'Peoples Bank', balance: 2000000, type: 'fixed' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };
const ab = (c: string): React.CSSProperties => ({ padding: '0.55rem 1.25rem', border: 'none', borderRadius: 8, background: c, color: 'white', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' });

const EngineeringDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const [activeNav, setActiveNav] = useState('overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);
    const net = totI - totE;
    const active = projects.filter((p) => p.pct < 100).length;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'projects': return renderProjects();
            case 'boq': return renderBOQ();
            case 'inspections': return renderInspections();
            case 'invoices': return renderInvoices();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+11%" changeType="up" color="#22c55e" />
            <KPICard icon="💸" label="Costs" value={fmt(totE)} changeType="neutral" color="#ef4444" />
            <KPICard icon="📈" label="Margin" value={fmt(net)} changeType="up" color="#6366f1" />
            <KPICard icon="🏗️" label="Active Projects" value={String(active)} changeType="neutral" color="#3b82f6" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={cs}><h3 style={ct}>🏗️ Project Progress</h3>
                {projects.map((p) => (<div key={p.id} style={{ marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 500 }}>{p.name}</span>
                        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: p.pct === 100 ? '#22c55e' : '#6366f1' }}>{p.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}>
                        <div style={{ height: '100%', width: `${p.pct}%`, background: p.pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #6366f1, #8b5cf6)', borderRadius: 4 }} />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{p.client} · {fmt(p.value)} · ICTAD: {p.ictadGrade}</div>
                </div>))}
            </div>
            <div style={cs}><h3 style={ct}>📂 Cost Breakdown</h3>
                {[{ n: '🧱 Site Materials', a: 185000, p: 43 }, { n: '👷 Labour', a: 120000, p: 28 }, { n: '🏗️ Equipment', a: 95000, p: 22 }, { n: '💻 Software', a: 25000, p: 6 }].map((c) => (
                    <div key={c.n} style={{ marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{c.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(c.a)}</span></div>
                        <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${c.p}%`, background: '#6366f1', borderRadius: 3 }} /></div>
                    </div>
                ))}
            </div>
        </div>
        <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
    </div>);

    const renderProjects = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🏗️" label="Active" value={String(active)} changeType="neutral" color="#3b82f6" />
            <KPICard icon="✅" label="Completed" value={String(projects.filter((p) => p.pct === 100).length)} changeType="up" color="#22c55e" />
            <KPICard icon="💰" label="Pipeline" value={fmt(projects.reduce((s, p) => s + p.value, 0))} changeType="neutral" color="#6366f1" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button style={ab('#6366f1')}>+ New Project</button>
        </div>
        <div style={cs}><h3 style={ct}>📋 All Projects</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Project', 'Client', 'ICTAD', 'Value', 'Stage', 'Progress'].map((h) => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                <tbody>{projects.map((p) => (<tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.6rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.6rem' }}>{p.client}</td>
                    <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 8, background: '#eef2ff', color: '#6366f1', fontSize: '0.72rem', fontWeight: 600 }}>{p.ictadGrade}</span></td>
                    <td style={{ padding: '0.6rem', fontWeight: 600 }}>{fmt(p.value)}</td>
                    <td style={{ padding: '0.6rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, background: '#f1f5f9', fontSize: '0.75rem' }}>{p.stage}</span></td>
                    <td style={{ padding: '0.6rem', width: 120 }}><div style={{ height: 8, background: '#f1f5f9', borderRadius: 4 }}><div style={{ height: '100%', width: `${p.pct}%`, background: p.pct === 100 ? '#22c55e' : '#6366f1', borderRadius: 4 }} /></div></td>
                </tr>))}</tbody>
            </table>
        </div>
    </div>);

    /* ========== BOQ MANAGER ========== */
    const renderBOQ = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="📦" label="BOQ Items" value={String(boqItems.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="✅" label="Completed" value={String(boqItems.filter(b => b.status === 'completed').length)} changeType="up" color="#22c55e" />
            <KPICard icon="⏳" label="Pending" value={String(boqItems.filter(b => b.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="💰" label="Total Value" value={fmt(boqItems.reduce((s, b) => s + (b.qty * b.rate), 0))} changeType="neutral" color="#3b82f6" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button style={ab('#6366f1')}>+ Add BOQ Item</button>
            <button style={ab('#3b82f6')}>📤 Import from Excel</button>
        </div>
        <div style={cs}><h3 style={ct}>📦 Bill of Quantities</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                        {['Item', 'Unit', 'Qty', 'Rate (LKR)', 'Amount', 'Project', 'Status'].map(h => (
                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.72rem' }}>{h}</th>
                        ))}
                    </tr></thead>
                    <tbody>{boqItems.map(b => (
                        <tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{b.item}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{b.unit}</td>
                            <td style={{ padding: '0.5rem' }}>{b.qty}</td>
                            <td style={{ padding: '0.5rem' }}>{b.rate.toLocaleString()}</td>
                            <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(b.qty * b.rate)}</td>
                            <td style={{ padding: '0.5rem', color: '#64748b' }}>{b.project}</td>
                            <td style={{ padding: '0.5rem' }}>
                                <span style={{
                                    padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 600,
                                    color: b.status === 'completed' ? '#22c55e' : b.status === 'ordered' ? '#3b82f6' : b.status === 'partial' ? '#f59e0b' : '#94a3b8',
                                    background: b.status === 'completed' ? '#dcfce7' : b.status === 'ordered' ? '#dbeafe' : b.status === 'partial' ? '#fef3c7' : '#f1f5f9',
                                }}>{b.status}</span>
                            </td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    </div>);

    /* ========== SITE INSPECTIONS ========== */
    const renderInspections = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="🔍" label="Total Inspections" value={String(siteInspections.length)} changeType="neutral" color="#6366f1" />
            <KPICard icon="✅" label="Passed" value={String(siteInspections.filter(i => i.status === 'passed').length)} changeType="up" color="#22c55e" />
            <KPICard icon="⚠️" label="Issues Found" value={String(siteInspections.filter(i => i.status === 'issues').length)} changeType="down" color="#ef4444" />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <button style={ab('#6366f1')}>+ Log Inspection</button>
        </div>
        <div style={cs}><h3 style={ct}>🔍 Site Inspection Log</h3>
            {siteInspections.map(si => (
                <div key={si.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '0.75rem 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: si.status === 'passed' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', fontSize: '1.2rem' }}>{si.status === 'passed' ? '✅' : '⚠️'}</div>
                        <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{si.project}</div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{si.type} · Inspector: {si.inspector}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>{si.findings}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#6366f1' }}>{si.date}</div>
                        <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: '0.68rem', fontWeight: 600, background: si.status === 'passed' ? '#dcfce7' : '#fee2e2', color: si.status === 'passed' ? '#22c55e' : '#ef4444' }}>{si.status}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>);

    const renderInvoices = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="💰" label="Billed" value={fmt(totI)} changeType="up" color="#22c55e" />
            <KPICard icon="⏳" label="Pending" value={String(incomeData.filter((i) => i.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
            <KPICard icon="📈" label="Avg Claim" value={fmt(Math.round(totI / incomeData.length))} changeType="neutral" color="#6366f1" />
        </div>
        <TransactionList transactions={incomeData} title="Progress Claims & Invoices" showFilter={false} />
    </div>);

    const renderExpenses = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            <KPICard icon="💸" label="Total Costs" value={fmt(totE)} changeType="neutral" color="#ef4444" />
            <KPICard icon="📊" label="This Week" value={fmt(280000)} changeType="neutral" color="#6366f1" />
            <KPICard icon="📉" label="Avg Daily" value={fmt(Math.round(totE / 30))} changeType="neutral" color="#8b5cf6" />
        </div>
        <TransactionList transactions={expenseData} title="All Expenses" showFilter={false} />
    </div>);

    const renderBanking = () => (<div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
            {banks.map((a) => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'current' ? '#3b82f6' : '#f59e0b'}` }}>
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

    const renderReports = () => (<div><div style={cs}><h3 style={ct}>📋 Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {[
                { n: '📊 Project P&L', d: 'Revenue & cost per project' },
                { n: '🧾 Progress Claims', d: 'All claims & status' },
                { n: '📂 Cost Analysis', d: 'Category-wise breakdown' },
                { n: '🧱 Material Usage', d: 'BOQ consumption report' },
                { n: '👷 Sub-Con Pay', d: 'Sub-contractor payments' },
                { n: '🧾 Tax (APIT)', d: 'Estimated IRD returns' },
                { n: '🔍 Inspection Log', d: 'All site inspections' },
                { n: '📦 BOQ Summary', d: 'Bill of quantities report' },
                { n: '📈 Retention Track', d: 'Retention money tracker' },
            ].map((r) => (
                <div key={r.n} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 2 }}>{r.n}</div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{r.d}</div>
                </div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Engineering Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
                ['🏗️ Firm Name', 'My Engineering Firm (Pvt) Ltd'],
                ['📋 IESL Registration', 'IESL/CM/2020/4567'],
                ['🏛️ ICTAD Grade', 'C1 — Building & Civil'],
                ['📜 CIDA Registration', 'CIDA/2024/CS/892'],
                ['🔧 Specialization', 'Civil & Structural Engineering'],
                ['🧾 VAT Registration', 'VAT-LK-005678 (18%)'],
                ['🔑 IRD TIN', '567890123'],
                ['📅 Financial Year', 'April 2025 – March 2026'],
                ['🏦 Retention Policy', '10% for 12 months'],
                ['⚠️ PI Insurance', 'SLIC Policy — Active'],
            ].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="engineering" professionLabel="Engineering" professionIcon="🔧" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default EngineeringDashboard;
