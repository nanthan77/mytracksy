import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useRouteNav } from '../../hooks/useRouteNav';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '📈' },
    { id: 'watchlist', label: 'Watchlist', icon: '👁️' },
    { id: 'trades', label: 'Trades', icon: '🔄' },
    { id: 'dividends', label: 'Dividends & IPO', icon: '💎' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const holdings = [
    { symbol: 'JKH', name: 'John Keells Holdings', qty: 500, avgPrice: 185, currentPrice: 198, change: '+7.0%', sector: 'Conglomerate' },
    { symbol: 'COMB', name: 'Commercial Bank', qty: 300, avgPrice: 95, currentPrice: 102, change: '+7.4%', sector: 'Banking' },
    { symbol: 'DIAL', name: 'Dialog Axiata', qty: 2000, avgPrice: 10.5, currentPrice: 11.2, change: '+6.7%', sector: 'Telecom' },
    { symbol: 'CTC', name: 'Ceylon Tobacco', qty: 100, avgPrice: 1150, currentPrice: 1085, change: '-5.7%', sector: 'Consumer' },
    { symbol: 'SAMP', name: 'Sampath Bank', qty: 400, avgPrice: 72, currentPrice: 78, change: '+8.3%', sector: 'Banking' },
];

const watchlistItems = [
    { symbol: 'EXPO', name: 'Expolanka Holdings', price: 215, change: '+3.2%', volume: '1.2M', sector: 'Logistics' },
    { symbol: 'HNBF', name: 'HNB Finance', price: 8.4, change: '-1.2%', volume: '850K', sector: 'Finance' },
    { symbol: 'CARG', name: 'Cargills Ceylon', price: 315, change: '+0.8%', volume: '425K', sector: 'Retail' },
    { symbol: 'LOLC', name: 'LOLC Holdings', price: 485, change: '+5.1%', volume: '2.1M', sector: 'Finance' },
    { symbol: 'HHL', name: 'Hemas Holdings', price: 78, change: '+2.4%', volume: '680K', sector: 'Conglomerate' },
    { symbol: 'AHUN', name: 'Aitken Spence', price: 125, change: '-0.5%', volume: '350K', sector: 'Conglomerate' },
];

const dividendHistory = [
    { date: '2026-03-15', symbol: 'JKH', type: 'Final', amount: 45000, perShare: 'Rs. 5.00' },
    { date: '2026-03-01', symbol: 'SAMP', type: 'Interim', amount: 15600, perShare: 'Rs. 3.00' },
    { date: '2026-02-15', symbol: 'COMB', type: 'Final', amount: 12000, perShare: 'Rs. 4.00' },
    { date: '2026-01-20', symbol: 'CTC', type: 'Final', amount: 85000, perShare: 'Rs. 85.00' },
    { date: '2025-12-10', symbol: 'DIAL', type: 'Interim', amount: 6000, perShare: 'Rs. 0.30' },
];

const upcomingIPOs = [
    { company: 'Lanka Solar Energy PLC', sector: 'Energy', price: 'Rs. 25-30', openDate: '2026-04-01', closeDate: '2026-04-15', status: 'Upcoming' },
    { company: 'DigiPay Lanka Ltd', sector: 'Fintech', price: 'Rs. 15-18', openDate: '2026-04-20', closeDate: '2026-05-05', status: 'Announced' },
];

const trades: Transaction[] = [
    { id: 't1', type: 'income', amount: 198000, description: 'SOLD 1000x JKH @ 198', category: 'CSE', date: '2026-03-10', status: 'paid' },
    { id: 't2', type: 'expense', amount: 102000, description: 'BUY 1000x COMB @ 102', category: 'CSE', date: '2026-03-09', status: 'completed' },
    { id: 't3', type: 'income', amount: 45000, description: 'Dividend — JKH', category: 'Dividend', date: '2026-03-07', status: 'paid' },
    { id: 't4', type: 'expense', amount: 22400, description: 'BUY 2000x DIAL @ 11.2', category: 'CSE', date: '2026-03-05', status: 'completed' },
    { id: 't5', type: 'income', amount: 15600, description: 'Dividend — SAMP', category: 'Dividend', date: '2026-03-01', status: 'paid' },
];

const banks = [
    { id: 'b1', name: 'Trading Account', bank: 'NDB Securities', balance: 1850000, type: 'trading' },
    { id: 'b2', name: 'Savings', bank: 'Commercial Bank', balance: 2200000, type: 'savings' },
    { id: 'b3', name: 'Fixed Deposit', bank: 'NSB', balance: 1000000, type: 'fixed' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const TradingDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const portfolioValue = holdings.reduce((s, h) => s + h.qty * h.currentPrice, 0);
    const portfolioCost = holdings.reduce((s, h) => s + h.qty * h.avgPrice, 0);
    const unrealizedPL = portfolioValue - portfolioCost;

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'portfolio': return renderPortfolio();
            case 'watchlist': return renderWatchlist();
            case 'trades': return renderTrades();
            case 'dividends': return renderDividends();
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
                <KPICard icon="📊" label="Portfolio Value" value={fmt(portfolioValue)} changeType="up" color="#6366f1" />
                <KPICard icon="📈" label="Unrealized P/L" value={fmt(unrealizedPL)} change={`${unrealizedPL >= 0 ? '+' : ''}${((unrealizedPL / portfolioCost) * 100).toFixed(1)}%`} changeType={unrealizedPL >= 0 ? 'up' : 'down'} color={unrealizedPL >= 0 ? '#22c55e' : '#ef4444'} />
                <KPICard icon="💰" label="Dividends (YTD)" value={fmt(163600)} change="+12%" changeType="up" color="#22c55e" />
                <KPICard icon="🔄" label="Trades This Month" value="5" changeType="neutral" color="#3b82f6" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cs}><h3 style={ct}>📈 Top Holdings (CSE)</h3>
                    {holdings.map((h) => (
                        <div key={h.symbol} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div><div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.symbol}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{h.name}</div></div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{fmt(h.qty * h.currentPrice)}</div>
                                <div style={{ fontSize: '0.72rem', color: h.change.startsWith('+') ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{h.change}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={cs}><h3 style={ct}>📊 Sector Allocation</h3>
                    {[{ n: 'Conglomerates', p: 35, c: '#6366f1' }, { n: 'Banking', p: 30, c: '#3b82f6' }, { n: 'Telecom', p: 15, c: '#22c55e' }, { n: 'Consumer', p: 12, c: '#f59e0b' }, { n: 'Other', p: 8, c: '#94a3b8' }].map((s) => (
                        <div key={s.n} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{s.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{s.p}%</span></div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${s.p}%`, background: s.c, borderRadius: 3 }} /></div>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={trades.slice(0, 5)} title="Recent Trades" />
        </div>
    );

    const renderPortfolio = () => (
        <div>
            <div style={{ ...cs, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div><div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Portfolio Value</div><div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(portfolioValue)}</div></div>
                    <div><div style={{ fontSize: '0.85rem', opacity: 0.7 }}>P/L</div><div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4, color: unrealizedPL >= 0 ? '#4ade80' : '#f87171' }}>{fmt(unrealizedPL)}</div></div>
                </div>
            </div>
            <div style={cs}><h3 style={ct}>📋 Holdings</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Symbol', 'Sector', 'Qty', 'Avg Price', 'Current', 'Value', 'P/L'].map((h) => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{holdings.map((h) => {
                        const pl = (h.currentPrice - h.avgPrice) * h.qty; return (
                            <tr key={h.symbol} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.6rem', fontWeight: 600 }}>{h.symbol}</td>
                                <td style={{ padding: '0.6rem', fontSize: '0.78rem', color: '#64748b' }}>{h.sector}</td>
                                <td style={{ padding: '0.6rem' }}>{h.qty}</td>
                                <td style={{ padding: '0.6rem' }}>{h.avgPrice.toFixed(2)}</td><td style={{ padding: '0.6rem' }}>{h.currentPrice.toFixed(2)}</td>
                                <td style={{ padding: '0.6rem', fontWeight: 600 }}>{fmt(h.qty * h.currentPrice)}</td>
                                <td style={{ padding: '0.6rem', fontWeight: 600, color: pl >= 0 ? '#22c55e' : '#ef4444' }}>{pl >= 0 ? '+' : ''}{fmt(pl)}</td>
                            </tr>);
                    })}</tbody>
                </table>
            </div>
        </div>
    );

    /* ========== WATCHLIST ========== */
    const renderWatchlist = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="👁️" label="Watching" value={String(watchlistItems.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="📈" label="Gainers" value={String(watchlistItems.filter(w => w.change.startsWith('+')).length)} changeType="up" color="#22c55e" />
                <KPICard icon="📉" label="Losers" value={String(watchlistItems.filter(w => w.change.startsWith('-')).length)} changeType="down" color="#ef4444" />
            </div>
            <div style={cs}><h3 style={ct}>👁️ My Watchlist</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Symbol', 'Company', 'Price', 'Change', 'Volume', 'Sector'].map(h => (<th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.78rem' }}>{h}</th>))}</tr></thead>
                    <tbody>{watchlistItems.map(w => (
                        <tr key={w.symbol} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '0.6rem', fontWeight: 600 }}>{w.symbol}</td>
                            <td style={{ padding: '0.6rem', fontSize: '0.8rem' }}>{w.name}</td>
                            <td style={{ padding: '0.6rem' }}>Rs. {w.price}</td>
                            <td style={{ padding: '0.6rem', fontWeight: 600, color: w.change.startsWith('+') ? '#22c55e' : '#ef4444' }}>{w.change}</td>
                            <td style={{ padding: '0.6rem', color: '#64748b' }}>{w.volume}</td>
                            <td style={{ padding: '0.6rem', fontSize: '0.78rem', color: '#64748b' }}>{w.sector}</td>
                        </tr>
                    ))}</tbody>
                </table>
            </div>
        </div>
    );

    const renderTrades = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="🔄" label="Total Trades" value="5" changeType="neutral" color="#3b82f6" />
                <KPICard icon="💰" label="Realized P/L" value={fmt(13000)} changeType="up" color="#22c55e" />
                <KPICard icon="📈" label="Win Rate" value="80%" changeType="up" color="#6366f1" />
            </div>
            <TransactionList transactions={trades} title="Trade History" showFilter={false} />
        </div>
    );

    /* ========== DIVIDENDS & IPO ========== */
    const renderDividends = () => {
        const totalDiv = dividendHistory.reduce((s, d) => s + d.amount, 0);
        return (
            <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <KPICard icon="💎" label="Total Dividends" value={fmt(totalDiv)} changeType="up" color="#22c55e" />
                    <KPICard icon="📊" label="Dividend Yield" value="4.8%" changeType="up" color="#6366f1" />
                    <KPICard icon="🔔" label="Upcoming IPOs" value={String(upcomingIPOs.length)} changeType="neutral" color="#f59e0b" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={cs}><h3 style={ct}>💰 Dividend History</h3>
                        {dividendHistory.map((d, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{d.symbol} — {d.type}</div>
                                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{d.date} · {d.perShare}/share</div>
                                </div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}>{fmt(d.amount)}</div>
                            </div>
                        ))}
                    </div>
                    <div style={cs}><h3 style={ct}>🆕 Upcoming IPOs</h3>
                        {upcomingIPOs.map((ipo, i) => (
                            <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 10, marginBottom: '0.75rem', border: '1px solid #f1f5f9' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 4 }}>{ipo.company}</div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.25rem', fontSize: '0.75rem', color: '#64748b' }}>
                                    <span>Sector: {ipo.sector}</span><span>Price: {ipo.price}</span>
                                    <span>Open: {ipo.openDate}</span><span>Close: {ipo.closeDate}</span>
                                </div>
                                <span style={{ display: 'inline-block', marginTop: 6, padding: '2px 8px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 600, background: '#dbeafe', color: '#2563eb' }}>{ipo.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="💸" label="Brokerage Fees" value={fmt(12500)} changeType="neutral" color="#ef4444" />
                <KPICard icon="🧾" label="SEC Levy + CSE" value={fmt(3200)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="📊" label="Total Costs" value={fmt(15700)} changeType="neutral" color="#6366f1" />
            </div>
            <div style={cs}><h3 style={ct}>💸 Trading Cost Breakdown</h3>
                {[{ n: 'Brokerage Commission', a: 12500, c: '#ef4444' }, { n: 'SEC Levy (0.15%)', a: 1500, c: '#f59e0b' }, { n: 'CSE Fee (0.04%)', a: 400, c: '#3b82f6' }, { n: 'Share Transfer Fee', a: 800, c: '#8b5cf6' }, { n: 'CDS Fee', a: 500, c: '#64748b' }].map(e => (
                    <div key={e.n} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid #f1f5f9' }}>
                        <span style={{ fontSize: '0.85rem' }}>{e.n}</span><span style={{ fontSize: '0.85rem', fontWeight: 600, color: e.c }}>{fmt(e.a)}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {banks.map((a) => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'trading' ? '#6366f1' : a.type === 'savings' ? '#22c55e' : '#f59e0b'}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.3rem 0' }}>{fmt(a.balance)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.bank}</div>
                </div>))}
            </div>
            <div style={{ ...cs, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total Cash + Portfolio</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(banks.reduce((s, a) => s + a.balance, 0) + portfolioValue)}</div>
            </div>
        </div>
    );

    const renderReports = () => (<div><div style={cs}><h3 style={ct}>📋 Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {['📊 Portfolio Summary', '📈 P/L Statement', '💰 Dividend Income', '📂 Sector Analysis', '🔄 Trade History', '🧾 Capital Gains Tax', '📝 Watchlist Report', '🆕 IPO Analysis', '📈 Performance'].map((r) => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Trading Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['📈 Primary Broker', 'NDB Securities'], ['🏦 CDS Account', 'CDS-2026-00458'], ['💱 Currency', 'LKR'], ['📊 Default Market', 'Colombo Stock Exchange (CSE)'], ['🔑 IRD TIN', '456789012'], ['📅 Tax Year', '2025/2026'], ['💰 CGT Rate', '10% (Listed shares)'], ['📱 Price Alerts', 'Enabled']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="trading" professionLabel="Trading & Investment" professionIcon="📈" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default TradingDashboard;
