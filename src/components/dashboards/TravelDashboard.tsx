import React, { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useRouteNav } from '../../hooks/useRouteNav';

interface Props { userName: string; onChangeProfession: () => void; onLogout: () => void; }

const navItems = [
    { id: 'overview', label: 'Dashboard', icon: '📊' },
    { id: 'bookings', label: 'Bookings', icon: '📅' },
    { id: 'packages', label: 'Packages', icon: '🏖️' },
    { id: 'guides', label: 'Guides & Drivers', icon: '👤' },
    { id: 'reviews', label: 'Reviews & Ratings', icon: '⭐' },
    { id: 'expenses', label: 'Expenses', icon: '💸' },
    { id: 'banking', label: 'Banking', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
];

const bookings = [
    { id: 'bk1', client: 'Johnson Family (UK)', package: 'Cultural Triangle Tour', pax: 4, amount: 385000, status: 'confirmed', date: '2026-03-15' },
    { id: 'bk2', client: 'Tanaka Yuki (Japan)', package: 'Beach & Safari', pax: 2, amount: 220000, status: 'confirmed', date: '2026-03-18' },
    { id: 'bk3', client: 'Schmidt Group (Germany)', package: 'Adventure Sri Lanka', pax: 6, amount: 540000, status: 'pending', date: '2026-03-22' },
    { id: 'bk4', client: 'Kumar Family (India)', package: 'Temple & Heritage', pax: 5, amount: 280000, status: 'confirmed', date: '2026-04-01' },
    { id: 'bk5', client: 'Smith Couple (Australia)', package: 'Honeymoon Package', pax: 2, amount: 195000, status: 'completed', date: '2026-03-05' },
];

const packages = [
    { name: 'Cultural Triangle Tour', duration: '7 Days', price: 95000, bookings: 12, rating: 4.8 },
    { name: 'Beach & Safari', duration: '5 Days', price: 110000, bookings: 8, rating: 4.9 },
    { name: 'Adventure Sri Lanka', duration: '10 Days', price: 90000, bookings: 15, rating: 4.7 },
    { name: 'Honeymoon Package', duration: '6 Days', price: 97500, bookings: 6, rating: 5.0 },
    { name: 'Temple & Heritage', duration: '4 Days', price: 56000, bookings: 10, rating: 4.6 },
];

const guides = [
    { name: 'Chaminda Perera', role: 'Senior Guide (English/German)', licence: 'SLTDA/G-1234', trips: 28, rating: 4.9, phone: '077-1234567', status: 'on-tour' },
    { name: 'Kumara Silva', role: 'Guide (English/French)', licence: 'SLTDA/G-2345', trips: 22, rating: 4.7, phone: '071-2345678', status: 'available' },
    { name: 'Ravi Jayasuriya', role: 'Driver + Guide (English)', licence: 'SLTDA/G-3456', trips: 35, rating: 4.8, phone: '076-3456789', status: 'on-tour' },
    { name: 'Nadeeka Fernando', role: 'Cultural Specialist (Japanese)', licence: 'SLTDA/G-4567', trips: 15, rating: 5.0, phone: '078-4567890', status: 'available' },
];

const reviews = [
    { client: 'Johnson Family (UK)', package: 'Cultural Triangle Tour', rating: 5, comment: 'Absolutely wonderful! Chaminda was an excellent guide. Sigiriya was breathtaking.', date: '2026-03-08' },
    { client: 'Smith Couple (AU)', package: 'Honeymoon Package', rating: 5, comment: 'The Bentota beach resort was perfect. Great attention to detail!', date: '2026-03-06' },
    { client: 'Mueller (DE)', package: 'Adventure Sri Lanka', rating: 4, comment: 'Great trek in Knuckles Range. Food could have been better at the eco-lodge.', date: '2026-02-28' },
    { client: 'Tanaka Group (JP)', package: 'Temple & Heritage', rating: 5, comment: 'Nadeeka spoke perfect Japanese. Temple of the Tooth was spiritual experience.', date: '2026-02-20' },
];

const incomeData: Transaction[] = [
    { id: 'i1', type: 'income', amount: 385000, description: 'Cultural Triangle — Johnson (UK)', category: 'Tour', date: '2026-03-10', status: 'paid' },
    { id: 'i2', type: 'income', amount: 220000, description: 'Beach & Safari — Tanaka (JP)', category: 'Tour', date: '2026-03-08', status: 'paid' },
    { id: 'i3', type: 'income', amount: 540000, description: 'Adventure — Schmidt (DE)', category: 'Tour', date: '2026-03-07', status: 'pending' },
    { id: 'i4', type: 'income', amount: 195000, description: 'Honeymoon — Smith (AU)', category: 'Tour', date: '2026-03-05', status: 'paid' },
];

const expenseData: Transaction[] = [
    { id: 'e1', type: 'expense', amount: 120000, description: 'Hotel bookings (Heritance, Jetwing)', category: 'Hotels', date: '2026-03-09', status: 'completed' },
    { id: 'e2', type: 'expense', amount: 85000, description: 'Vehicle hire & drivers', category: 'Transport', date: '2026-03-08', status: 'completed' },
    { id: 'e3', type: 'expense', amount: 45000, description: 'Safari permits + guide fees', category: 'Activities', date: '2026-03-07', status: 'completed' },
    { id: 'e4', type: 'expense', amount: 35000, description: 'Staff salaries', category: 'Staff', date: '2026-03-01', status: 'completed' },
    { id: 'e5', type: 'expense', amount: 18000, description: 'SLTDA licence + insurance', category: 'Licences', date: '2026-03-01', status: 'completed' },
];

const banks = [
    { id: 'b1', name: 'Business Account', bank: 'Commercial Bank', balance: 1450000, type: 'current' },
    { id: 'b2', name: 'USD Account', bank: 'HNB', balance: 2800, type: 'forex' },
    { id: 'b3', name: 'Savings', bank: 'NSB', balance: 850000, type: 'savings' },
];

const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
const cs: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const ct: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

const TravelDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const totI = incomeData.reduce((s, t) => s + t.amount, 0);
    const totE = expenseData.reduce((s, t) => s + t.amount, 0);

    const renderContent = () => {
        switch (activeNav) {
            case 'overview': return renderOverview();
            case 'bookings': return renderBookings();
            case 'packages': return renderPackages();
            case 'guides': return renderGuides();
            case 'reviews': return renderReviews();
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
                <KPICard icon="💰" label="Revenue" value={fmt(totI)} change="+18%" changeType="up" color="#22c55e" />
                <KPICard icon="📅" label="Bookings" value={String(bookings.length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="👥" label="Guests" value={String(bookings.reduce((s, b) => s + b.pax, 0))} changeType="up" color="#8b5cf6" />
                <KPICard icon="⏳" label="Pending" value={String(bookings.filter((b) => b.status === 'pending').length)} changeType="neutral" color="#f59e0b" />
                <KPICard icon="⭐" label="Avg Rating" value="4.8" changeType="up" color="#6366f1" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={cs}><h3 style={ct}>📅 Upcoming Bookings</h3>
                    {bookings.filter((b) => b.status !== 'completed').map((b) => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                            <div><div style={{ fontSize: '0.82rem', fontWeight: 500 }}>{b.client}</div><div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{b.package} · {b.pax} pax</div></div>
                            <div style={{ textAlign: 'right' }}><div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{fmt(b.amount)}</div>
                                <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: 8, background: b.status === 'confirmed' ? '#dcfce7' : '#fef3c7', color: b.status === 'confirmed' ? '#22c55e' : '#f59e0b' }}>{b.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={cs}><h3 style={ct}>🌍 Guest Origins</h3>
                    {[{ n: '🇬🇧 United Kingdom', p: 30, c: '#3b82f6' }, { n: '🇩🇪 Germany', p: 25, c: '#f59e0b' }, { n: '🇦🇺 Australia', p: 18, c: '#22c55e' }, { n: '🇯🇵 Japan', p: 15, c: '#ef4444' }, { n: '🇮🇳 India', p: 12, c: '#8b5cf6' }].map((o) => (
                        <div key={o.n} style={{ marginBottom: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}><span style={{ fontSize: '0.82rem' }}>{o.n}</span><span style={{ fontSize: '0.82rem', fontWeight: 600 }}>{o.p}%</span></div>
                            <div style={{ height: 6, background: '#f1f5f9', borderRadius: 3 }}><div style={{ height: '100%', width: `${o.p}%`, background: o.c, borderRadius: 3 }} /></div>
                        </div>
                    ))}
                </div>
            </div>
            <TransactionList transactions={[...incomeData, ...expenseData].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6)} title="Recent Transactions" />
        </div>
    );

    const renderBookings = () => (
        <div><div style={cs}><h3 style={ct}>📋 All Bookings</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Client', 'Package', 'Pax', 'Amount', 'Date', 'Status'].map((h) => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
                <tbody>{bookings.map((b) => (<tr key={b.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{b.client}</td><td style={{ padding: '0.5rem' }}>{b.package}</td>
                    <td style={{ padding: '0.5rem' }}>{b.pax}</td><td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(b.amount)}</td>
                    <td style={{ padding: '0.5rem' }}>{b.date}</td>
                    <td style={{ padding: '0.5rem' }}><span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: b.status === 'confirmed' ? '#dcfce7' : b.status === 'pending' ? '#fef3c7' : '#f1f5f9', color: b.status === 'confirmed' ? '#22c55e' : b.status === 'pending' ? '#f59e0b' : '#64748b' }}>{b.status}</span></td>
                </tr>))}</tbody>
            </table>
        </div></div>
    );

    const renderPackages = () => (<div><div style={cs}><h3 style={ct}>🏖️ Tour Packages</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead><tr style={{ borderBottom: '2px solid #e2e8f0' }}>{['Package', 'Duration', 'Price/Person', 'Bookings', 'Rating'].map((h) => (<th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: '0.75rem' }}>{h}</th>))}</tr></thead>
            <tbody>{packages.map((p) => (<tr key={p.name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.5rem', fontWeight: 500 }}>{p.name}</td><td style={{ padding: '0.5rem' }}>{p.duration}</td>
                <td style={{ padding: '0.5rem', fontWeight: 600 }}>{fmt(p.price)}</td><td style={{ padding: '0.5rem' }}>{p.bookings}</td>
                <td style={{ padding: '0.5rem' }}>⭐ {p.rating}</td>
            </tr>))}</tbody>
        </table>
    </div></div>);

    /* ========== GUIDES & DRIVERS ========== */
    const renderGuides = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="👤" label="Total Guides" value={String(guides.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="🏃" label="On Tour" value={String(guides.filter(g => g.status === 'on-tour').length)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="⭐" label="Avg Rating" value="4.85" changeType="up" color="#22c55e" />
            </div>
            <div style={cs}><h3 style={ct}>👤 Tour Guides & Drivers</h3>
                {guides.map(g => (
                    <div key={g.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.5rem' }}>
                        <div>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{g.name}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{g.role} · {g.licence}</div>
                            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{g.phone} · {g.trips} trips</div>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f59e0b' }}>⭐ {g.rating}</span>
                            <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: '0.72rem', fontWeight: 600, background: g.status === 'on-tour' ? '#dbeafe' : '#dcfce7', color: g.status === 'on-tour' ? '#3b82f6' : '#22c55e' }}>{g.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    /* ========== REVIEWS & RATINGS ========== */
    const renderReviews = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="⭐" label="Avg Rating" value="4.75" changeType="up" color="#f59e0b" />
                <KPICard icon="💬" label="Total Reviews" value={String(reviews.length)} changeType="neutral" color="#6366f1" />
                <KPICard icon="🏆" label="5-Star Reviews" value={String(reviews.filter(r => r.rating === 5).length)} changeType="up" color="#22c55e" />
            </div>
            <div style={cs}><h3 style={ct}>⭐ Guest Reviews</h3>
                {reviews.map((r, i) => (
                    <div key={i} style={{ padding: '0.75rem', background: '#f8fafc', borderRadius: 8, marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <div><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{r.client}</span><span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 8 }}>{r.package}</span></div>
                            <div><span style={{ color: '#f59e0b' }}>{'⭐'.repeat(r.rating)}</span><span style={{ fontSize: '0.72rem', color: '#94a3b8', marginLeft: 6 }}>{r.date}</span></div>
                        </div>
                        <div style={{ fontSize: '0.82rem', color: '#475569', fontStyle: 'italic' }}>&quot;{r.comment}&quot;</div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderExpenses = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <KPICard icon="🏨" label="Hotels" value={fmt(120000)} changeType="neutral" color="#6366f1" />
                <KPICard icon="🚗" label="Transport" value={fmt(85000)} changeType="neutral" color="#3b82f6" />
                <KPICard icon="🎫" label="Activities" value={fmt(45000)} changeType="neutral" color="#22c55e" />
            </div>
            <TransactionList transactions={expenseData} title="All Expenses" showFilter={false} />
        </div>
    );

    const renderBanking = () => (
        <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {banks.map((a) => (<div key={a.id} style={{ ...cs, borderTop: `3px solid ${a.type === 'current' ? '#3b82f6' : a.type === 'forex' ? '#f59e0b' : '#22c55e'}` }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{a.name}</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0.3rem 0' }}>{a.type === 'forex' ? `USD ${a.balance.toLocaleString()}` : fmt(a.balance)}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{a.bank}</div>
                </div>))}
            </div>
            <div style={{ ...cs, background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white' }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.7 }}>Total LKR Balance</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: 4 }}>{fmt(banks.filter((b) => b.type !== 'forex').reduce((s, a) => s + a.balance, 0))}</div>
            </div>
        </div>
    );

    const renderReports = () => (<div><div style={cs}><h3 style={ct}>📋 Reports</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
            {['📊 P&L Statement', '📅 Booking Report', '🏖️ Package Performance', '🌍 Market Analysis', '👥 Guest Demographics', '⭐ Guide Performance', '🧾 Tax (VAT/NBT)', '💰 Commission Report', '📈 Revenue Forecast'].map((r) => (
                <div key={r} style={{ padding: '0.85rem', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', fontSize: '0.85rem', fontWeight: 500 }}>{r}</div>
            ))}
        </div>
    </div></div>);

    const renderSettings = () => (<div><div style={cs}><h3 style={ct}>⚙️ Travel Agency Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[['✈️ Agency Name', 'Ceylon Trails (Pvt) Ltd'], ['📋 SLTDA Licence', 'SLTDA/TA/2024/0892'], ['🏢 BR Number', 'PV/2024/01234'], ['💱 Currencies', 'LKR / USD / EUR / GBP'], ['🌍 Key Markets', 'UK, Germany, Australia, Japan, India'], ['📱 Booking Platform', 'TripAdvisor + Direct'], ['📅 Tax Year', '2025/2026'], ['🧾 VAT Registered', 'Yes — VAT No: 114567890-7000']].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8fafc', borderRadius: 8 }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{l}</span><span style={{ fontSize: '0.85rem', color: '#64748b' }}>{v}</span>
                </div>
            ))}
        </div>
    </div></div>);

    return (
        <DashboardLayout profession="travel" professionLabel="Travel & Tourism" professionIcon="✈️" userName={userName} navItems={navItems} activeNav={activeNav} onNavChange={setActiveNav} onChangeProfession={onChangeProfession} onLogout={onLogout}>
            {renderContent()}
        </DashboardLayout>
    );
};

export default TravelDashboard;
