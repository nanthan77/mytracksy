import React, { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'campaigns', label: 'Campaigns', icon: '📣' },
    { id: 'social', label: 'Social Media', icon: '📱' },
    { id: 'content', label: 'Content Calendar', icon: '📅' },
    { id: 'clients', label: 'Clients & Billing', icon: '👥' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const campaigns = [
    { id: 'c1', name: 'Keells Super Social Media', client: 'John Keells', platform: 'Facebook/Instagram', budget: 250000, spent: 180000, status: 'active', reach: '125K' },
    { id: 'c2', name: 'Dialog 5G Launch', client: 'Dialog Axiata', platform: 'Google Ads', budget: 500000, spent: 320000, status: 'active', reach: '450K' },
    { id: 'c3', name: 'Cinnamon Hotels Promo', client: 'Cinnamon Hotels', platform: 'Multi-channel', budget: 180000, spent: 180000, status: 'completed', reach: '85K' },
    { id: 'c4', name: 'Lanka Tiles Rebrand', client: 'Lanka Tiles', platform: 'Print + Digital', budget: 120000, spent: 45000, status: 'active', reach: '35K' },
];

const socialAccounts = [
    { platform: 'Facebook', handle: '@keellssuper', followers: '85K', engagement: '4.2%', posts: 24, growth: '+1.2K', color: '#1877f2' },
    { platform: 'Instagram', handle: '@dialogsl', followers: '120K', engagement: '5.8%', posts: 18, growth: '+3.5K', color: '#e4405f' },
    { platform: 'TikTok', handle: '@cinnamonhotels', followers: '45K', engagement: '8.1%', posts: 12, growth: '+5.2K', color: '#000' },
    { platform: 'LinkedIn', handle: 'Lanka Tiles PLC', followers: '12K', engagement: '2.4%', posts: 8, growth: '+450', color: '#0a66c2' },
    { platform: 'YouTube', handle: 'Dialog Sri Lanka', followers: '95K', engagement: '3.5%', posts: 4, growth: '+2.1K', color: '#ff0000' },
];

const contentCalendar = [
    { date: '2026-03-11', client: 'Dialog', type: 'Reel', platform: 'Instagram', topic: '5G Coverage Map — Colombo', status: 'scheduled' },
    { date: '2026-03-12', client: 'Keells', type: 'Carousel', platform: 'Facebook', topic: 'Weekly Deals — Avurudu Season', status: 'draft' },
    { date: '2026-03-13', client: 'Cinnamon', type: 'Video', platform: 'TikTok', topic: 'Room Tour — Bentota Resort', status: 'in-review' },
    { date: '2026-03-14', client: 'Lanka Tiles', type: 'Blog Post', platform: 'Website', topic: 'Best Tiles for Sri Lankan Climate', status: 'approved' },
    { date: '2026-03-15', client: 'Dialog', type: 'Story', platform: 'Instagram', topic: '5G Speed Test Challenge', status: 'scheduled' },
    { date: '2026-03-16', client: 'Keells', type: 'Post', platform: 'LinkedIn', topic: 'CSR Initiative — School Donations', status: 'draft' },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 180000, description: 'Retainer — Dialog Axiata', category: 'Retainer', date: '2026-03-01', status: 'paid' },
    { id: 'i2', type: 'income', amount: 95000, description: 'Campaign fee — Keells Social', category: 'Campaign', date: '2026-03-05', status: 'paid' },
    { id: 'i3', type: 'income', amount: 75000, description: 'Design work — Lanka Tiles', category: 'Design', date: '2026-03-07', status: 'pending' },
    { id: 'i4', type: 'income', amount: 120000, description: 'Final invoice — Cinnamon Hotels', category: 'Campaign', date: '2026-03-08', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 65000, description: 'Staff salaries', category: 'Staff', date: '2026-03-01', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 35000, description: 'Facebook ad spend (client)', category: 'Ad Spend', date: '2026-03-05', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 25000, description: 'Adobe Creative Suite', category: 'Software', date: '2026-03-01', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 15000, description: 'Office co-working space', category: 'Office', date: '2026-03-01', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Business Account', bank: 'Commercial Bank', balance: 680000, type: 'current' },
    { id: 'b2', name: 'Savings', bank: 'NSB', balance: 420000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const MarketingDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const [activeNav, setActiveNav] = useState('overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'campaigns': return renderCampaigns();
            case 'social': return renderSocial();
            case 'content': return renderContent2();
            case 'clients': return renderClients();
            case 'expenses': return renderExpenses();
            case 'banking': return renderBanking();
            case 'reports': return renderReports();
            case 'settings': return renderSettings();
            default: return renderOverview();
        }
    };

    const renderOverview = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+15%" changeType="up" color="#22c55e" />
                <KPICard icon="📣" label="Active Campaigns" value={String(campaigns.filter((c) => c.status === 'active').length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="👥" label="Active Clients" value="4" changeType="neutral" color="#8b5cf6" />
                <KPICard icon="📈" label="Total Reach" value="695K" change="+22%" changeType="up" color="#6366f1" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cs}><h3 style={ct}>📣 Active Campaigns</h3>
                    {campaigns.filter((c) => c.status === 'active').map((c) => (
                        <div key={c.id} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{c.name}</span>
                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{c.platform}</span>
                            </div>
                            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 3, marginBottom: 4 }}>
                                <div style={{ height: '100%', width: `${(c.spent / c.budget) * 100}%`, background: '#6366f1', borderRadius: 3 }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#94a3b8' }}>
                                <span>{fmt(c.spent)} / {fmt(c.budget)}</span><span>Reach: {c.reach}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={cs}><h3 style={ct}>📊 Revenue by Type</h3>
                    {[{ n: 'Retainer', a: 180000, p: 38, c: '#6366f1' }, { n: 'Campaign Fees', a: 215000, p: 46, c: '#3b82f6' }, { n: 'Design Work', a: 75000, p: 16, c: '#22c55e' }].map((s) => (
                        <div key={s.n} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{s.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{fmt(s.a)}</span></div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${s.p}%`, background: s.c, borderRadius: 3 }} /></div>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
        </div>
    );

    const renderCampaigns = () => (
        <div><div style={cs}><h3 style={ct}>📋 All Campaigns</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Campaign', 'Client', 'Platform', 'Budget', 'Spent', 'Reach', 'Status'].map((h) => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{campaigns.map((c) => (<tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{c.name}</td><td style={{ padding: '0.5rem' }}>{c.client}</td>
                    <td style={{ padding: '0.5rem' }}>{c.platform}</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(c.budget)}</td>
                    <td style={{ padding: '0.5rem' }}>{fmt(c.spent)}</td><td style={{ padding: '0.5rem' }}>{c.reach}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: c.status === 'active' ? '#dbeafe' : '#dcfce7', color: c.status === 'active' ? '#3b82f6' : '#22c55e' }}>{c.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div></div>
    );

    /* ========== SOCIAL MEDIA ANALYTICS ========== */
    const renderSocial = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📱" label="Accounts Managed" value={String(socialAccounts.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="👥" label="Total Followers" value="357K" changeType="up" color="#22c55e" />
                <KPICard icon="📈" label="Avg Engagement" value="4.8%" changeType="up" color="#3b82f6" />
            </div>
            <div style={cs}><h3 style={ct}>📱 Social Media Accounts</h3>
                {socialAccounts.map(acc => (
                    <div key={acc.platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.5rem', borderLeft: `3px solid ${acc.color}` }}>
                        <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{acc.platform} — {acc.handle}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{acc.posts} posts this month</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Followers</div><div style={{ fontSize: '0.85rem', fontWeight: 700 }}>{acc.followers}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Engagement</div><div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>{acc.engagement}</div></div>
                            <div style={{ textAlign: 'center' }}><div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Growth</div><div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#3b82f6' }}>{acc.growth}</div></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ========== CONTENT CALENDAR ========== */
    const renderContent2 = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="📅" label="Scheduled" value={String(contentCalendar.filter(c => c.status === 'scheduled').length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="📝" label="Drafts" value={String(contentCalendar.filter(c => c.status === 'draft').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="👁️" label="In Review" value={String(contentCalendar.filter(c => c.status === 'in-review').length)} changeType="neutral" color="#8b5cf6" />
                <KPICard icon="✅" label="Approved" value={String(contentCalendar.filter(c => c.status === 'approved').length)} changeType="up" color="#22c55e" />
            </div>
            <div style={cs}><h3 style={ct}>📅 Upcoming Content</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Date', 'Client', 'Type', 'Platform', 'Topic', 'Status'].map(h => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{contentCalendar.map((c, i) => (
                        <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.5rem', fontWeight: 500 }}>{c.date}</td>
                            <td style={{ padding: '0.5rem' }}>{c.client}</td>
                            <td style={{ padding: '0.5rem' }}>{c.type}</td>
                            <td style={{ padding: '0.5rem' }}>{c.platform}</td>
                            <td style={{ padding: '0.5rem', fontSize: '0.8rem' }}>{c.topic}</td>
                            <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: c.status === 'scheduled' ? '#dbeafe' : c.status === 'approved' ? '#dcfce7' : c.status === 'in-review' ? '#ede9fe' : '#fef3c7', color: c.status === 'scheduled' ? '#3b82f6' : c.status === 'approved' ? '#22c55e' : c.status === 'in-review' ? '#8b5cf6' : '#f59e0b' }}>{c.status}</span></td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const renderClients = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💰" label="Billed" value={fmt(totI)} changeType="up" color="#22c55e" />
                <KPICard icon="⏳" label="Pending" value={String(incomeData.filter((i) => i.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="👥" label="Clients" value="4" changeType="neutral" color="#6366f1" />
            </div>
            <TransactionList transactions={incomeData} title="Client Billing" showFilter={false} />
        </div>
    );

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Total" value={fmt(totE)} changeType="neutral" color="#ef4444" />
                <KPICard icon="📣" label="Ad Spend" value={fmt(35000)} changeType="neutral" color="#6366f1" />
                <KPICard icon="💻" label="Software" value={fmt(25000)} changeType="neutral" color="#8b5cf6" />
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
            {['📊 Agency P&L', '📣 Campaign ROI', '👥 Client Revenue', '📈 Social Analytics', '📅 Content Report', '📱 Engagement Summary', '💻 Ad Spend', '🧾 Tax (APIT)', '📊 Growth Report'].map((r) => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Agency Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['📣 Agency Name', 'Colombo Digital Agency'], ['📋 BR Number', 'PV/2025/00892'], ['🏢 Services', 'Social Media, SEO, Branding, Ad Management'], ['💱 Currency', 'LKR'], ['🔑 IRD TIN', '567890123'], ['📅 Tax Year', '2025/2026'], ['📱 Ad Platforms', 'Meta Business, Google Ads, TikTok Ads'], ['💰 Retainer Min', 'LKR 50,000/month']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="marketing" professionLabel="Marketing" professionIcon="📣" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default MarketingDashboard;
