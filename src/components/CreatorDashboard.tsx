import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import MarketingDashboard from './dashboards/MarketingDashboard';

interface CreatorDashboardProps {
    sidebarCollapsed: boolean;
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const mockChartData = [
    { name: 'Jan', usd: 1200, lkr: 360000 },
    { name: 'Feb', usd: 1800, lkr: 540000 },
    { name: 'Mar', usd: 2400, lkr: 720000 },
    { name: 'Apr', usd: 3100, lkr: 930000 },
    { name: 'May', usd: 2800, lkr: 840000 },
    { name: 'Jun', usd: 4200, lkr: 1260000 },
];

const mockBrandDeals = [
    { id: 1, brand: 'Sony Lanka', status: 'Payment Pending', amount: 'LKR 150,000', date: 'Oct 15' },
    { id: 2, brand: 'Keells', status: 'In Progress', amount: 'LKR 80,000', date: 'Oct 28' },
    { id: 3, brand: 'NordVPN', status: 'Pitching', amount: '$500 USD', date: 'Nov 05' },
];

const mockGear = [
    { item: 'Sony A7IV', cost: 'LKR 850,000', depreciation: 'LKR 170,000/yr', bought: '2023' },
    { item: 'MacBook Pro M3', cost: 'LKR 1,100,000', depreciation: 'LKR 220,000/yr', bought: '2024' },
];

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
    sidebarCollapsed,
    userName,
    onChangeProfession,
    onLogout
}) => {
    const [activeTab, setActiveTab] = useState<'finance' | 'deals' | 'gear' | 'marketing'>('finance');

    const StatCard = ({ title, value, sub, icon, isNeon = false }: any) => (
        <div style={{
            background: isNeon ? 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(34,211,238,0.15))' : 'rgba(24, 24, 27, 0.7)',
            border: `1px solid ${isNeon ? 'rgba(168,85,247,0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
            borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 12,
            boxShadow: isNeon ? '0 0 20px rgba(168,85,247,0.1)' : 'none'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>{title}</span>
                <span style={{ fontSize: 20 }}>{icon}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isNeon ? '#e879f9' : '#fff' }}>{value}</div>
            <div style={{ fontSize: 13, color: '#22d3ee', fontWeight: 500 }}>{sub}</div>
        </div>
    );

    return (
        <div style={{
            padding: '2rem',
            color: '#f4f4f5',
            minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                        Creator Studio <span style={{ fontSize: 12, background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(168,85,247,0.3)' }}>PRO</span>
                    </h1>
                    <p style={{ color: '#a1a1aa', fontSize: 15 }}>Manage your USD income, brand sponsorships, and gear depreciation.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button style={{
                        background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.3)',
                        color: '#67e8f9', padding: '10px 16px', borderRadius: 8, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                    }}>
                        📄 Generate Income Proof (Visa)
                    </button>
                    <button style={{
                        background: '#a855f7', color: '#fff', border: 'none',
                        padding: '10px 16px', borderRadius: 8, fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
                    }}>
                        + New Income / Deal
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 16 }}>
                {[
                    { id: 'finance', label: 'Multi-Currency Ledger', icon: '💰' },
                    { id: 'deals', label: 'Brand Deal CRM', icon: '🤝' },
                    { id: 'gear', label: 'Gear Vault (Tax)', icon: '📸' },
                    { id: 'marketing', label: 'AI Marketing Toolkit', icon: '🚀' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        style={{
                            background: activeTab === tab.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                            border: 'none', color: activeTab === tab.id ? '#fff' : '#a1a1aa',
                            padding: '10px 20px', borderRadius: 8, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', gap: 8
                        }}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'finance' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                        <StatCard title="Total YTD Revenue" value="LKR 4,180,000" sub="Includes USD conversions" icon="💴" isNeon />
                        <StatCard title="Foreign Income (USD)" value="$12,400" sub="Tagged as Service Export (Exempt)" icon="💵" />
                        <StatCard title="Pending Brand Payments" value="LKR 320,000" sub="3 Invoices Overdue" icon="⏱️" />
                        <StatCard title="Tax Write-Offs (Gear)" value="LKR 450,000" sub="Automated Depreciation" icon="🛡️" />
                    </div>

                    <div style={{ background: 'rgba(24, 24, 27, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>USD vs LKR Income Trajectory</h3>
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={mockChartData}>
                                    <defs>
                                        <linearGradient id="colorUsd" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLkr" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                                    <RechartsTooltip
                                        contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="lkr" stroke="#a855f7" fillOpacity={1} fill="url(#colorLkr)" name="LKR Total" />
                                    <Area type="monotone" dataKey="usd" stroke="#22d3ee" fillOpacity={1} fill="url(#colorUsd)" name="USD Converted" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'deals' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700 }}>Active Sponsorships</h2>
                        <button style={{ background: '#27272a', border: '1px solid #3f3f46', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer' }}>Filter Status ▼</button>
                    </div>

                    <div style={{ background: 'rgba(24, 24, 27, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#a1a1aa', fontSize: 13 }}>
                                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Brand / Agency</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Amount</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Deliverable Date</th>
                                    <th style={{ padding: '16px 24px', fontWeight: 600 }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {mockBrandDeals.map(deal => (
                                    <tr key={deal.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 500 }}>{deal.brand}</td>
                                        <td style={{ padding: '16px 24px', color: '#22d3ee', fontWeight: 600 }}>{deal.amount}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                background: deal.status.includes('Pending') ? 'rgba(245,158,11,0.1)' : deal.status.includes('Pitching') ? 'rgba(56,189,248,0.1)' : 'rgba(168,85,247,0.1)',
                                                color: deal.status.includes('Pending') ? '#fcd34d' : deal.status.includes('Pitching') ? '#7dd3fc' : '#d8b4fe',
                                                padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 600
                                            }}>
                                                {deal.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', color: '#a1a1aa', fontSize: 14 }}>{deal.date}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            {deal.status.includes('Pending') && (
                                                <button style={{ background: '#fff', color: '#000', border: 'none', padding: '6px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                                                    Generate Invoice
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'gear' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: 12, padding: 20, display: 'flex', gap: 16 }}>
                        <div style={{ fontSize: 24 }}>💡</div>
                        <div>
                            <h4 style={{ color: '#e879f9', fontWeight: 600, marginBottom: 4 }}>IRD Asset Depreciation Explained</h4>
                            <p style={{ color: '#d8b4fe', fontSize: 14, lineHeight: 1.5, opacity: 0.9 }}>
                                You cannot deduct the full LKR 1M of a camera in Year 1. The Sri Lankan IRD requires depreciating it over 5 years (20% per year). We automatically calculate this for your End of Year tax report here.
                            </p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                        {mockGear.map((g, i) => (
                            <div key={i} style={{ background: 'rgba(24, 24, 27, 0.7)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: 16, padding: 24 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 600 }}>{g.item}</h3>
                                    <span style={{ color: '#a1a1aa', fontSize: 14 }}>{g.bought}</span>
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 4 }}>Purchase Cost</div>
                                    <div style={{ fontSize: 16, fontWeight: 500 }}>{g.cost}</div>
                                </div>
                                <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: 12, marginTop: 12 }}>
                                    <div style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 4 }}>Claimable Tax Deduction (This Year)</div>
                                    <div style={{ fontSize: 20, fontWeight: 700, color: '#22d3ee' }}>{g.depreciation}</div>
                                </div>
                            </div>
                        ))}

                        <button style={{
                            background: 'transparent', border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 16,
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            color: '#a1a1aa', minHeight: 200, cursor: 'pointer', transition: 'border-color 0.2s'
                        }} onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)'} onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                            <span style={{ fontSize: 32, marginBottom: 12 }}>+</span>
                            <span style={{ fontWeight: 600 }}>Log New Equipment Purchase</span>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'marketing' && (
                <div style={{ animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ marginBottom: 24 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>AI Token Store & Automations</h2>
                        <p style={{ color: '#a1a1aa', fontSize: 14 }}>Spend your tokens to generate YouTube scripts from competitor videos, pitch emails, or thumbnail concepts.</p>
                    </div>
                    {/* Reusing existing marketing intelligence platform */}
                    <div style={{ background: 'rgba(24,24,27,0.5)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                        <MarketingDashboard
                            userName={userName}
                            onChangeProfession={onChangeProfession}
                            onLogout={onLogout}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default CreatorDashboard;
