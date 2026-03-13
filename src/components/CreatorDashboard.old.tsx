import React, { useEffect, useMemo, useState } from 'react';
import { useRouteNav } from '../hooks/useRouteNav';
import DashboardLayout from './dashboards/DashboardLayout';
import KPICard from './dashboards/KPICard';
import TransactionList, { Transaction } from './dashboards/TransactionList';
import { useIsCompactMobile } from './dashboards/useIsCompactMobile';

interface CreatorDashboardProps {
    sidebarCollapsed?: boolean;
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

type CreatorNavId = 'overview' | 'deals' | 'proofs' | 'finance' | 'tax' | 'gear' | 'ai';
type CreatorMobileTabId = 'home' | 'dealsHub' | 'money' | 'gearLab' | 'aiLab';

const navItems: { id: CreatorNavId; label: string; icon: string }[] = [
    { id: 'overview', label: 'Creator Home', icon: '🏠' },
    { id: 'deals', label: 'Brand Deals', icon: '🤝' },
    { id: 'proofs', label: 'Proof Vault', icon: '🧾' },
    { id: 'finance', label: 'Revenue', icon: '💵' },
    { id: 'tax', label: 'Tax Shield', icon: '🛡️' },
    { id: 'gear', label: 'Gear Vault', icon: '📸' },
    { id: 'ai', label: 'AI Studio', icon: '🧠' },
];

const CREATOR_MOBILE_TABS: { id: CreatorMobileTabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'dealsHub', label: 'Deals', icon: '🤝' },
    { id: 'money', label: 'Money', icon: '💵' },
    { id: 'gearLab', label: 'Gear', icon: '📸' },
    { id: 'aiLab', label: 'AI', icon: '🧠' },
];

const CREATOR_MOBILE_GROUPS: Record<CreatorMobileTabId, CreatorNavId[]> = {
    home: ['overview'],
    dealsHub: ['deals', 'proofs'],
    money: ['finance', 'tax'],
    gearLab: ['gear'],
    aiLab: ['ai'],
};

const CREATOR_MOBILE_DEFAULT_NAV: Record<CreatorMobileTabId, CreatorNavId> = {
    home: 'overview',
    dealsHub: 'deals',
    money: 'finance',
    gearLab: 'gear',
    aiLab: 'ai',
};

const CREATOR_SHORTCUT_NAV: Record<string, CreatorNavId> = {
    overview: 'overview',
    deals: 'deals',
    proofs: 'proofs',
    finance: 'finance',
    tax: 'tax',
    gear: 'gear',
    ai: 'ai',
    invoice: 'proofs',
};

const creatorTransactions: Transaction[] = [
    { id: 'ct1', type: 'income', amount: 485000, description: 'AdSense settlement', category: 'YouTube USD', date: '2026-03-10', status: 'paid' },
    { id: 'ct2', type: 'income', amount: 320000, description: 'Sony Lanka campaign', category: 'Brand deal', date: '2026-03-08', status: 'paid' },
    { id: 'ct3', type: 'income', amount: 185000, description: 'Affiliate payout', category: 'Affiliate', date: '2026-03-05', status: 'pending' },
    { id: 'ct4', type: 'expense', amount: 112000, description: 'Editor retainer', category: 'Production', date: '2026-03-04', status: 'completed' },
    { id: 'ct5', type: 'expense', amount: 68000, description: 'Thumbnail design sprint', category: 'Creative ops', date: '2026-03-03', status: 'completed' },
    { id: 'ct6', type: 'expense', amount: 93000, description: 'Studio lights and props', category: 'Gear', date: '2026-03-01', status: 'completed' },
];

const dealPipeline = [
    { brand: 'Dialog', stage: 'Invoice ready', amount: 'LKR 420,000', platform: 'YouTube + Shorts', due: 'Mar 14', owner: 'Media agency' },
    { brand: 'Keells', stage: 'Shoot booked', amount: 'LKR 180,000', platform: 'Instagram Reels', due: 'Mar 16', owner: 'Brand manager' },
    { brand: 'NordVPN', stage: 'Pitch sent', amount: '$900', platform: 'Integrated ad', due: 'Mar 19', owner: 'Inbound sponsor' },
    { brand: 'Daraz', stage: 'Negotiating', amount: 'LKR 260,000', platform: 'Live commerce', due: 'Mar 21', owner: 'Agency desk' },
];

const proofVaultItems = [
    { title: 'Bank-ready income statement', status: 'Updated today', detail: '12-month creator income proof with FX conversions', action: 'Export PDF' },
    { title: 'Embassy cashflow pack', status: 'Ready', detail: 'Sponsor contracts, payouts, and remittance proof in one file', action: 'Download bundle' },
    { title: 'IRD evidence folder', status: '3 items pending', detail: 'Invoice PDFs, bank alerts, and foreign income source proof', action: 'Review docs' },
];

const payoutChannels = [
    { channel: 'AdSense', currency: 'USD', balance: '$4,820', rhythm: 'Monthly', color: '#0ea5e9' },
    { channel: 'Wise Creator Account', currency: 'USD', balance: '$2,140', rhythm: 'Weekly', color: '#22c55e' },
    { channel: 'Commercial Bank LKR', currency: 'LKR', balance: 'LKR 1,240,000', rhythm: 'Daily', color: '#f59e0b' },
];

const deductibleBuckets = [
    { label: 'Gear depreciation pool', value: 'LKR 448,000', note: 'Cameras, lenses, laptop, audio kit' },
    { label: 'Production operating costs', value: 'LKR 186,000', note: 'Editors, transport, props, freelancers' },
    { label: 'Software and subscriptions', value: 'LKR 92,000', note: 'Adobe, CapCut, Notion, storage' },
];

const gearVaultItems = [
    { name: 'Sony A7 IV body', cost: 'LKR 860,000', claim: 'LKR 172,000 this year', life: '5-year asset', health: 'Strong proof set' },
    { name: 'MacBook Pro M3', cost: 'LKR 1,180,000', claim: 'LKR 236,000 this year', life: '5-year asset', health: 'Invoice + serial saved' },
    { name: 'DJI Mic kit', cost: 'LKR 165,000', claim: 'LKR 33,000 this year', life: '5-year asset', health: 'Claim ready' },
];

const aiPlaybooks = [
    { title: 'Hook generator', desc: 'Generate 10 Sri Lanka-relevant opening hooks from one campaign brief.', token: '12 tokens', badge: 'Fast' },
    { title: 'Brand pitch writer', desc: 'Turn a deliverable list into a clean outbound pitch with pricing anchors.', token: '18 tokens', badge: 'Deal closer' },
    { title: 'Thumbnail angle lab', desc: 'Generate clickable concept directions from your last 3 high-retention videos.', token: '20 tokens', badge: 'High CTR' },
    { title: 'Content repurposer', desc: 'Turn one long-form script into shorts, captions, and community posts.', token: '16 tokens', badge: 'Repurpose' },
];

const contentOps = [
    { title: 'Avurudu sponsor deck', due: 'Today', status: 'Needs pricing revision' },
    { title: 'Weekly payout reconciliation', due: 'Tomorrow', status: '2 Wise transfers unmatched' },
    { title: 'Gear proof upload', due: 'Fri', status: 'Upload lens invoice and warranty card' },
];

const fmtLkr = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`;

function getCreatorMobileTab(activeNav: CreatorNavId): CreatorMobileTabId {
    const match = CREATOR_MOBILE_TABS.find((tab) => CREATOR_MOBILE_GROUPS[tab.id].includes(activeNav));
    return match?.id || 'home';
}

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.94)',
    border: '1px solid rgba(226,232,240,0.9)',
    borderRadius: 22,
    boxShadow: '0 10px 30px rgba(15,23,42,0.06)',
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#9333ea',
    marginBottom: 10,
};

const CreatorDashboard: React.FC<CreatorDashboardProps> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const validNavIds = useMemo(() => navItems.map(n => n.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const isCompactMobile = useIsCompactMobile();

    const activeNavItem = useMemo(
        () => navItems.find((item) => item.id === activeNav) || navItems[0],
        [activeNav]
    );
    const activeMobileTab = useMemo(() => getCreatorMobileTab(activeNav), [activeNav]);
    const activeMobileSections = useMemo(
        () => CREATOR_MOBILE_GROUPS[activeMobileTab].map((navId) => navItems.find((item) => item.id === navId)).filter(Boolean) as typeof navItems,
        [activeMobileTab]
    );

    useEffect(() => {
        const applyShortcutFromLocation = () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (!action) return;

            const targetNav = CREATOR_SHORTCUT_NAV[action];
            if (targetNav) {
                setActiveNav(targetNav);
                params.delete('action');
                const qs = params.toString();
                const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
                window.history.replaceState({}, '', nextUrl);
            }
        };

        applyShortcutFromLocation();
        window.addEventListener('popstate', applyShortcutFromLocation);
        return () => window.removeEventListener('popstate', applyShortcutFromLocation);
    }, []);

    const handleMobileTabChange = (tabId: string) => {
        const nextTab = tabId as CreatorMobileTabId;
        const group = CREATOR_MOBILE_GROUPS[nextTab];
        if (group.includes(activeNav)) return;
        setActiveNav(CREATOR_MOBILE_DEFAULT_NAV[nextTab]);
    };

    const renderMobileSectionNav = () => {
        if (!isCompactMobile || activeMobileSections.length <= 1) return null;

        return (
            <div style={{
                display: 'flex',
                gap: 8,
                overflowX: 'auto',
                paddingBottom: 4,
                marginBottom: 14,
                scrollbarWidth: 'none',
            }}>
                {activeMobileSections.map((item) => {
                    const active = activeNav === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setActiveNav(item.id)}
                            style={{
                                border: 'none',
                                borderRadius: 999,
                                padding: '9px 14px',
                                whiteSpace: 'nowrap',
                                background: active ? 'linear-gradient(135deg, #a855f7, #06b6d4)' : 'rgba(255,255,255,0.9)',
                                color: active ? '#fff' : '#475569',
                                boxShadow: active ? '0 10px 22px rgba(168,85,247,0.24)' : 'inset 0 0 0 1px rgba(226,232,240,0.92)',
                                fontSize: 12.5,
                                fontWeight: active ? 700 : 600,
                                minHeight: 38,
                                cursor: 'pointer',
                            }}
                        >
                            {item.icon} {item.label}
                        </button>
                    );
                })}
            </div>
        );
    };

    const ActionButton = ({ icon, label, accent, onClick }: { icon: string; label: string; accent: string; onClick?: () => void }) => (
        <button
            onClick={onClick}
            style={{
                border: '1px solid rgba(226,232,240,0.9)',
                background: 'rgba(255,255,255,0.92)',
                borderRadius: 18,
                padding: isCompactMobile ? '14px 12px' : '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                minHeight: isCompactMobile ? 88 : 100,
                boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
            }}
        >
            <span style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${accent}14`,
                color: accent,
                fontSize: 18,
            }}>
                {icon}
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a', textAlign: 'left' }}>{label}</span>
        </button>
    );

    const renderOverview = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{
                ...cardStyle,
                padding: isCompactMobile ? 18 : 24,
                background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(88,28,135,0.95) 55%, rgba(6,182,212,0.88))',
                color: '#fff',
                overflow: 'hidden',
                position: 'relative',
            }}>
                <div style={{ position: 'absolute', right: -50, top: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(12px)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ddd6fe' }}>Creator command center</div>
                    <h1 style={{ fontSize: isCompactMobile ? 24 : 30, fontWeight: 800, margin: '8px 0 10px', letterSpacing: '-0.04em' }}>
                        Keep your deals, dollars, gear, and AI production in one app.
                    </h1>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.82)', maxWidth: 620, fontSize: isCompactMobile ? 13.5 : 15.5, lineHeight: 1.6 }}>
                        Track foreign income, sponsor cash, tax proof, depreciation, and content ops without jumping between spreadsheets, WhatsApp, bank alerts, and notes.
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <KPICard icon="💸" label="Pending sponsor cash" value="LKR 860,000" change="+2 deals" changeType="up" color="#a855f7" compact={isCompactMobile} />
                <KPICard icon="🌍" label="Foreign income YTD" value="$14,820" change="+18%" changeType="up" color="#06b6d4" compact={isCompactMobile} />
                <KPICard icon="🛡️" label="Deduction shield" value="LKR 726,000" change="IRD-ready" changeType="neutral" color="#f59e0b" compact={isCompactMobile} />
                <KPICard icon="🧠" label="AI workflow queue" value="8 jobs" change="3 ready now" changeType="neutral" color="#22c55e" compact={isCompactMobile} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : '1.05fr 0.95fr', gap: 18 }}>
                <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Quick actions</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                        <ActionButton icon="🤝" label="Log new brand deal" accent="#a855f7" onClick={() => setActiveNav('deals')} />
                        <ActionButton icon="📄" label="Export income proof" accent="#06b6d4" onClick={() => setActiveNav('proofs')} />
                        <ActionButton icon="💵" label="Reconcile payouts" accent="#22c55e" onClick={() => setActiveNav('finance')} />
                        <ActionButton icon="📸" label="Add gear purchase" accent="#f59e0b" onClick={() => setActiveNav('gear')} />
                    </div>
                </div>

                <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>This week</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {contentOps.map((task) => (
                            <div key={task.title} style={{
                                padding: '12px 14px',
                                borderRadius: 16,
                                background: '#f8fafc',
                                border: '1px solid rgba(226,232,240,0.9)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{task.title}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{task.status}</div>
                                    </div>
                                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7c3aed', background: 'rgba(168,85,247,0.1)', borderRadius: 999, padding: '5px 9px', whiteSpace: 'nowrap' }}>
                                        {task.due}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : '1.1fr 0.9fr', gap: 18 }}>
                <TransactionList transactions={creatorTransactions} title="Recent creator cashflow" compact={isCompactMobile} />

                <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>AI sprint</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {aiPlaybooks.slice(0, 3).map((item) => (
                            <div key={item.title} style={{
                                padding: '14px 15px',
                                borderRadius: 18,
                                background: 'linear-gradient(135deg, rgba(168,85,247,0.08), rgba(6,182,212,0.08))',
                                border: '1px solid rgba(168,85,247,0.14)',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                                    <span style={{ fontSize: 10.5, fontWeight: 800, color: '#a855f7', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{item.badge}</span>
                                </div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>{item.desc}</div>
                                <div style={{ fontSize: 11.5, color: '#0ea5e9', fontWeight: 700, marginTop: 10 }}>{item.token}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderDeals = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    <div>
                        <div style={sectionLabelStyle}>Brand pipeline</div>
                        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Sponsorships from pitch to paid</h2>
                    </div>
                    <button style={{
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 16px',
                        background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                        color: '#fff',
                        fontWeight: 700,
                        cursor: 'pointer',
                    }}>
                        + New deal
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                    {dealPipeline.map((deal) => (
                        <div key={deal.brand} style={{
                            padding: '16px 16px 18px',
                            borderRadius: 18,
                            background: '#f8fafc',
                            border: '1px solid rgba(226,232,240,0.92)',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div>
                                    <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{deal.brand}</div>
                                    <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 4 }}>{deal.platform}</div>
                                </div>
                                <span style={{
                                    fontSize: 11,
                                    fontWeight: 800,
                                    padding: '6px 9px',
                                    borderRadius: 999,
                                    background: 'rgba(168,85,247,0.1)',
                                    color: '#7c3aed',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {deal.stage}
                                </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 16 }}>
                                <div>
                                    <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Value</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{deal.amount}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11.5, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Deadline</div>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginTop: 4 }}>{deal.due}</div>
                                </div>
                            </div>

                            <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 14 }}>Owner: {deal.owner}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderProofs = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{
                ...cardStyle,
                padding: isCompactMobile ? 16 : 20,
                background: 'linear-gradient(135deg, rgba(14,165,233,0.09), rgba(16,185,129,0.08))',
            }}>
                <div style={sectionLabelStyle}>Proof vault</div>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>Documents that make creator income look bank-ready</h2>
                <p style={{ color: '#475569', margin: '10px 0 0', fontSize: 14, lineHeight: 1.6 }}>
                    Keep sponsorship contracts, payout alerts, FX conversions, and income summaries together so banks, embassies, auditors, and partners get one clean story.
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {proofVaultItems.map((item) => (
                    <div key={item.title} style={{ ...cardStyle, padding: 18 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                            {item.status}
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{item.title}</div>
                        <div style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginTop: 8 }}>{item.detail}</div>
                        <button style={{
                            marginTop: 16,
                            border: 'none',
                            borderRadius: 12,
                            padding: '11px 14px',
                            background: '#0f172a',
                            color: '#fff',
                            fontWeight: 700,
                            cursor: 'pointer',
                            width: '100%',
                        }}>
                            {item.action}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderFinance = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
                <KPICard icon="💰" label="March collected" value="LKR 1,265,000" change="+24%" changeType="up" color="#22c55e" compact={isCompactMobile} />
                <KPICard icon="🌍" label="FX reserve" value="$6,960" change="CBSL synced" changeType="neutral" color="#06b6d4" compact={isCompactMobile} />
                <KPICard icon="🧾" label="Invoices waiting" value="3" change="2 due this week" changeType="neutral" color="#a855f7" compact={isCompactMobile} />
                <KPICard icon="🏦" label="Net runway" value="41 days" change="Healthy" changeType="up" color="#f59e0b" compact={isCompactMobile} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : '0.95fr 1.05fr', gap: 18 }}>
                <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Payout channels</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {payoutChannels.map((channel) => (
                            <div key={channel.channel} style={{
                                padding: '14px 15px',
                                borderRadius: 18,
                                border: '1px solid rgba(226,232,240,0.92)',
                                background: '#f8fafc',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{channel.channel}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>{channel.rhythm} reconciliation</div>
                                    </div>
                                    <span style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        letterSpacing: '0.05em',
                                        color: channel.color,
                                        background: `${channel.color}18`,
                                        borderRadius: 999,
                                        padding: '5px 8px',
                                    }}>
                                        {channel.currency}
                                    </span>
                                </div>
                                <div style={{ marginTop: 12, fontSize: 18, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em' }}>{channel.balance}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <TransactionList transactions={creatorTransactions} title="Revenue and payout feed" compact={isCompactMobile} />
            </div>
        </div>
    );

    const renderTax = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : '0.9fr 1.1fr', gap: 18 }}>
                <div style={{
                    ...cardStyle,
                    padding: isCompactMobile ? 18 : 22,
                    background: 'linear-gradient(135deg, rgba(250,204,21,0.1), rgba(168,85,247,0.08))',
                }}>
                    <div style={sectionLabelStyle}>Tax shield</div>
                    <div style={{ fontSize: isCompactMobile ? 28 : 36, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em' }}>LKR 726,000</div>
                    <div style={{ fontSize: 13.5, color: '#475569', lineHeight: 1.6, marginTop: 10 }}>
                        Current deductible pool from production costs, platform software, travel, and creator gear depreciation.
                    </div>
                    <div style={{ marginTop: 18, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(250,204,21,0.2)', color: '#92400e', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>Foreign income tracked</span>
                        <span style={{ background: 'rgba(168,85,247,0.16)', color: '#7c3aed', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 700 }}>Depreciation synced</span>
                    </div>
                </div>

                <div style={{ ...cardStyle, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Deduction buckets</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {deductibleBuckets.map((bucket) => (
                            <div key={bucket.label} style={{
                                padding: '14px 15px',
                                borderRadius: 18,
                                border: '1px solid rgba(226,232,240,0.92)',
                                background: '#f8fafc',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                    <div style={{ minWidth: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{bucket.label}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 4, lineHeight: 1.5 }}>{bucket.note}</div>
                                    </div>
                                    <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', whiteSpace: 'nowrap' }}>{bucket.value}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderGear = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                {gearVaultItems.map((item) => (
                    <div key={item.name} style={{ ...cardStyle, padding: 18 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(245,158,11,0.12)', color: '#d97706', fontSize: 20, marginBottom: 14 }}>
                            📸
                        </div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{item.name}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Purchase cost</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginTop: 4 }}>{item.cost}</div>
                        <div style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>Claim this year</div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#0891b2', marginTop: 4 }}>{item.claim}</div>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 12.5, color: '#64748b' }}>
                            <span>{item.life}</span>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>{item.health}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                ...cardStyle,
                padding: isCompactMobile ? 18 : 20,
                borderStyle: 'dashed',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: isCompactMobile ? 'flex-start' : 'center',
                gap: 16,
                flexDirection: isCompactMobile ? 'column' : 'row',
            }}>
                <div>
                    <div style={sectionLabelStyle}>Next asset log</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#0f172a' }}>Add drones, lenses, rigs, and studio equipment as soon as you buy them.</div>
                    <div style={{ fontSize: 13, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>The faster you attach invoice proof, the cleaner your depreciation records become later.</div>
                </div>
                <button style={{
                    border: 'none',
                    borderRadius: 14,
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #f59e0b, #ea580c)',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                }}>
                    + Log purchase
                </button>
            </div>
        </div>
    );

    const renderAi = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {renderMobileSectionNav()}

            <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                {aiPlaybooks.map((item) => (
                    <div key={item.title} style={{
                        ...cardStyle,
                        padding: 18,
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(88,28,135,0.96))',
                        color: '#fff',
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                            <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>{item.title}</div>
                            <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', color: '#67e8f9' }}>{item.badge}</span>
                        </div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'rgba(255,255,255,0.8)', marginTop: 10 }}>{item.desc}</div>
                        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <span style={{ color: '#c4b5fd', fontSize: 12.5, fontWeight: 700 }}>{item.token}</span>
                            <button style={{
                                border: 'none',
                                borderRadius: 12,
                                padding: '10px 14px',
                                background: 'rgba(255,255,255,0.1)',
                                color: '#fff',
                                fontWeight: 700,
                                cursor: 'pointer',
                            }}>
                                Run workflow
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{
                ...cardStyle,
                padding: isCompactMobile ? 16 : 20,
                background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(34,197,94,0.07))',
            }}>
                <div style={sectionLabelStyle}>Automation board</div>
                <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))', gap: 12 }}>
                    {contentOps.map((task) => (
                        <div key={task.title} style={{
                            padding: '14px 15px',
                            borderRadius: 18,
                            background: '#ffffff',
                            border: '1px solid rgba(226,232,240,0.92)',
                        }}>
                            <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{task.title}</div>
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 8, lineHeight: 1.6 }}>{task.status}</div>
                            <div style={{ marginTop: 12, fontSize: 11.5, fontWeight: 800, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Due {task.due}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeNav) {
            case 'overview':
                return renderOverview();
            case 'deals':
                return renderDeals();
            case 'proofs':
                return renderProofs();
            case 'finance':
                return renderFinance();
            case 'tax':
                return renderTax();
            case 'gear':
                return renderGear();
            case 'ai':
                return renderAi();
            default:
                return renderOverview();
        }
    };

    const mobileTitleMap: Record<CreatorMobileTabId, string> = {
        home: 'Creator Home',
        dealsHub: activeNav === 'proofs' ? 'Proof Vault' : 'Deal Pipeline',
        money: activeNav === 'tax' ? 'Tax Shield' : 'Revenue Hub',
        gearLab: 'Gear Vault',
        aiLab: 'AI Studio',
    };

    const mobileSubtitleMap: Record<CreatorMobileTabId, string> = {
        home: 'Daily creator pulse, tasks, and shortcuts',
        dealsHub: activeNav === 'proofs' ? 'Statements, invoices, and proof packs' : 'Sponsors, deliverables, and invoicing',
        money: activeNav === 'tax' ? 'Deduction tracking and creator tax prep' : 'Payouts, FX, and cashflow',
        gearLab: 'Assets, depreciation, and purchase proof',
        aiLab: 'Hooks, pitches, repurposing, and automation',
    };

    return (
        <DashboardLayout
            profession="creator"
            professionLabel="Creator Studio"
            professionIcon="🎥"
            userName={userName}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={(id) => setActiveNav(id as CreatorNavId)}
            onChangeProfession={onChangeProfession}
            onLogout={onLogout}
            mobileShell={{
                enabled: true,
                tabs: CREATOR_MOBILE_TABS,
                activeTab: activeMobileTab,
                onTabChange: handleMobileTabChange,
                activeTitle: mobileTitleMap[activeMobileTab],
                activeSubtitle: mobileSubtitleMap[activeMobileTab],
                headerAction: (
                    <button
                        onClick={() => setActiveNav(activeMobileTab === 'dealsHub' ? 'deals' : 'overview')}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 14,
                            border: 'none',
                            background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
                            color: '#fff',
                            fontSize: 22,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 10px 24px rgba(168,85,247,0.26)',
                        }}
                        aria-label="Quick add"
                    >
                        +
                    </button>
                ),
                accentColor: '#a855f7',
                activeTabBackground: 'linear-gradient(135deg, rgba(168,85,247,0.16), rgba(6,182,212,0.16))',
                background: 'linear-gradient(180deg, #0f0820 0%, #180d2f 24%, #f5f3ff 24.1%, #f8fafc 100%)',
                headerBackground: 'rgba(15,8,32,0.88)',
                navBackground: 'rgba(14,12,26,0.94)',
                subtitleColor: '#cbd5e1',
            }}
        >
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 22,
                color: '#0f172a',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
                {!isCompactMobile && (
                    <header style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: 16,
                        padding: '26px 28px',
                        borderRadius: 28,
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(88,28,135,0.95) 55%, rgba(6,182,212,0.9))',
                        color: '#fff',
                        boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
                    }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ddd6fe' }}>
                                Creator-native mobile PWA
                            </div>
                            <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 10px', letterSpacing: '-0.05em' }}>
                                Run your creator business without spreadsheet debt.
                            </h1>
                            <p style={{ margin: 0, maxWidth: 720, color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.7 }}>
                                MyTracksy Creator turns sponsor ops, revenue proof, gear depreciation, and AI production tasks into one workflow instead of five scattered tools.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                            <button
                                onClick={() => setActiveNav('proofs')}
                                style={{
                                    borderRadius: 14,
                                    border: '1px solid rgba(255,255,255,0.14)',
                                    background: 'rgba(255,255,255,0.08)',
                                    color: '#fff',
                                    padding: '12px 16px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                }}
                            >
                                Export proof pack
                            </button>
                            <button
                                onClick={() => setActiveNav('deals')}
                                style={{
                                    borderRadius: 14,
                                    border: 'none',
                                    background: '#fff',
                                    color: '#6d28d9',
                                    padding: '12px 18px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                }}
                            >
                                + New deal
                            </button>
                        </div>
                    </header>
                )}

                {!isCompactMobile && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {navItems.map((item) => {
                            const active = activeNav === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveNav(item.id)}
                                    style={{
                                        border: 'none',
                                        borderRadius: 999,
                                        padding: '11px 16px',
                                        background: active ? 'linear-gradient(135deg, #a855f7, #06b6d4)' : '#ffffff',
                                        color: active ? '#fff' : '#475569',
                                        boxShadow: active ? '0 12px 24px rgba(168,85,247,0.2)' : 'inset 0 0 0 1px rgba(226,232,240,0.9)',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                    }}
                                >
                                    {item.icon} {item.label}
                                </button>
                            );
                        })}
                    </div>
                )}

                {renderContent()}
            </div>
        </DashboardLayout>
    );
};

export default CreatorDashboard;
