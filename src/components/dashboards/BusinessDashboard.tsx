import React, { useEffect, useMemo } from 'react';
import { useRouteNav } from '../../hooks/useRouteNav';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useIsCompactMobile } from './useIsCompactMobile';

interface Props {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

type BusinessNavId = 'overview' | 'pos' | 'invoices' | 'pdc' | 'tax' | 'reports' | 'ai';
type BusinessMobileTabId = 'home' | 'sales' | 'cash' | 'taxes' | 'more';

interface NavItem {
    id: BusinessNavId;
    label: string;
    icon: string;
}

const navItems: NavItem[] = [
    { id: 'overview', label: 'Business HQ', icon: '🏢' },
    { id: 'pos', label: 'Pocket POS', icon: '🏪' },
    { id: 'invoices', label: 'Invoicing', icon: '🧾' },
    { id: 'pdc', label: 'Collections', icon: '📜' },
    { id: 'tax', label: 'Tax Control', icon: '🏦' },
    { id: 'reports', label: 'Reports', icon: '📊' },
    { id: 'ai', label: 'AI Ops', icon: '🤖' },
];

const BUSINESS_MOBILE_TABS: { id: BusinessMobileTabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏢' },
    { id: 'sales', label: 'Sales', icon: '🏪' },
    { id: 'cash', label: 'Cash', icon: '💸' },
    { id: 'taxes', label: 'Tax', icon: '🏦' },
    { id: 'more', label: 'More', icon: '🤖' },
];

const BUSINESS_MOBILE_GROUPS: Record<BusinessMobileTabId, BusinessNavId[]> = {
    home: ['overview'],
    sales: ['pos', 'invoices'],
    cash: ['pdc', 'reports'],
    taxes: ['tax'],
    more: ['ai'],
};

const BUSINESS_MOBILE_DEFAULT_NAV: Record<BusinessMobileTabId, BusinessNavId> = {
    home: 'overview',
    sales: 'pos',
    cash: 'pdc',
    taxes: 'tax',
    more: 'ai',
};

const BUSINESS_SHORTCUT_NAV: Record<string, BusinessNavId> = {
    overview: 'overview',
    sales: 'pos',
    pos: 'pos',
    invoices: 'invoices',
    receivables: 'pdc',
    collections: 'pdc',
    tax: 'tax',
    reports: 'reports',
    ai: 'ai',
};

const businessTransactions: Transaction[] = [
    { id: 'bt1', type: 'income', amount: 485000, description: 'Main branch sales settlement', category: 'Retail sales', date: '2026-03-12', status: 'received' },
    { id: 'bt2', type: 'income', amount: 162000, description: 'Invoice INV-4021 paid', category: 'B2B receivable', date: '2026-03-11', status: 'paid' },
    { id: 'bt3', type: 'expense', amount: 89000, description: 'Supplier payout - Lanka Foods', category: 'Inventory', date: '2026-03-11', status: 'completed' },
    { id: 'bt4', type: 'expense', amount: 54000, description: 'Outlet staff advance', category: 'Payroll', date: '2026-03-10', status: 'completed' },
    { id: 'bt5', type: 'income', amount: 228000, description: 'WhatsApp order batch', category: 'Digital sales', date: '2026-03-10', status: 'pending' },
    { id: 'bt6', type: 'expense', amount: 74000, description: 'VAT reserve top-up', category: 'Tax buffer', date: '2026-03-09', status: 'pending' },
];

const branchPulse = [
    { name: 'Colombo 03 Flagship', sales: 'LKR 142,500', trend: '+12%', trendColor: '#16a34a', note: 'Peak lunch rush from card sales' },
    { name: 'Kandy Micro Outlet', sales: 'LKR 88,000', trend: '+6%', trendColor: '#0ea5e9', note: 'Strong walk-in and delivery mix' },
    { name: 'Online Orders', sales: 'LKR 59,500', trend: '-3%', trendColor: '#f97316', note: 'Ad spend paused after midnight' },
];

const invoiceQueue = [
    { client: 'Crown Build (Pvt) Ltd', status: 'Ready to send', amount: 'LKR 420,000', due: 'Today', accent: '#16a34a' },
    { client: 'Atlas Office Supply', status: 'Follow-up in 2 days', amount: 'LKR 145,000', due: 'Mar 15', accent: '#f59e0b' },
    { client: 'Sapphire Hotels', status: 'Overdue 6 days', amount: 'LKR 288,000', due: 'Mar 06', accent: '#ef4444' },
];

const debtorPipeline = [
    { name: 'Kandy Hardware Ltd.', status: 'Overdue 45 days', amount: 'LKR 450,000', note: 'WhatsApp reminder queued for 9:00 AM', accent: '#ef4444' },
    { name: 'Nisal Constructions', status: 'Due in 2 days', amount: 'LKR 125,000', note: 'Sales rep follow-up assigned', accent: '#f59e0b' },
    { name: 'Lanka Office Hub', status: 'Cheque lands Friday', amount: 'LKR 210,000', note: 'PDC vault alert armed', accent: '#0ea5e9' },
];

const pdcVault = [
    'BOC cheque 8934 • Sep 15 • LKR 50K',
    'ComBank cheque 112 • Oct 01 • LKR 200K',
    'DFCC cheque 4481 • Oct 08 • LKR 90K',
];

const topSkus = [
    { name: 'Coconut milk cartons', units: '42 sold', margin: '31% margin' },
    { name: 'Frozen prawns 1kg', units: '25 sold', margin: '28% margin' },
    { name: 'Organic rice packs', units: '36 sold', margin: '24% margin' },
];

const lowStock = [
    { name: 'Prawn skewers', stock: '4 packs left', supplier: 'Restock before 2 PM' },
    { name: 'Thermal rolls', stock: '2 rolls left', supplier: 'Auto-order draft ready' },
    { name: 'Cardamom syrup', stock: '1 bottle left', supplier: 'Supplier responds in 18 min' },
];

const taxChecklist = [
    { title: 'VAT filing pack', detail: 'Sales vs purchase mismatch cleared. Ready for review.', action: 'Review pack' },
    { title: 'Corporate tax reserve', detail: 'LKR 230,000 held aside for next filing cycle.', action: 'Open reserve' },
    { title: 'Input VAT proof locker', detail: '11 scanned supplier invoices extracted this week.', action: 'Check docs' },
];

const reportTiles = [
    { title: 'Cash runway board', detail: '19 days of runway if ad spend stays flat', accent: '#0f172a' },
    { title: 'Branch profitability stack', detail: 'Colombo 03 margin leads at 18.4%', accent: '#16a34a' },
    { title: 'Receivable recovery forecast', detail: 'LKR 785,000 likely to clear this week', accent: '#0ea5e9' },
];

const aiPlaybooks = [
    { title: 'Vision bill entry', desc: 'Snap supplier bills, capture line items, and update AP instantly.', token: '5 tokens', badge: 'Fast' },
    { title: 'Sales forecaster', desc: 'Predict outlet demand and reorder windows from the last 8 weeks.', token: '10 tokens', badge: 'Forecast' },
    { title: 'Debtor chase writer', desc: 'Generate polite WhatsApp or email follow-ups in your business tone.', token: '4 tokens', badge: 'Collections' },
    { title: 'Tax anomaly scanner', desc: 'Spot missing invoices, weak proof sets, and VAT mismatches.', token: '8 tokens', badge: 'Compliance' },
];

const quickActions = [
    { icon: '🧾', label: 'Create invoice', accent: '#10b981', target: 'invoices' as BusinessNavId },
    { icon: '📦', label: 'Log supplier bill', accent: '#0ea5e9', target: 'ai' as BusinessNavId },
    { icon: '💬', label: 'Chase debtor', accent: '#f97316', target: 'pdc' as BusinessNavId },
    { icon: '🏦', label: 'Prep tax pack', accent: '#0f172a', target: 'tax' as BusinessNavId },
];

const fmtLkr = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`;

function getBusinessMobileTab(activeNav: BusinessNavId): BusinessMobileTabId {
    const match = BUSINESS_MOBILE_TABS.find((tab) => BUSINESS_MOBILE_GROUPS[tab.id].includes(activeNav));
    return match?.id || 'home';
}

const shellCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(226,232,240,0.92)',
    borderRadius: 22,
    boxShadow: '0 12px 30px rgba(15,23,42,0.06)',
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#047857',
    marginBottom: 10,
};

const BusinessDashboard: React.FC<Props> = ({
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const validNavIds = useMemo(() => navItems.map((item) => item.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');
    const isCompactMobile = useIsCompactMobile();

    const activeMobileTab = useMemo(() => getBusinessMobileTab(activeNav as BusinessNavId), [activeNav]);
    const activeMobileSections = useMemo(
        () => BUSINESS_MOBILE_GROUPS[activeMobileTab]
            .map((navId) => navItems.find((item) => item.id === navId))
            .filter(Boolean) as NavItem[],
        [activeMobileTab]
    );

    useEffect(() => {
        const applyShortcutFromLocation = () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (!action) return;

            const targetNav = BUSINESS_SHORTCUT_NAV[action];
            if (!targetNav) return;

            setActiveNav(targetNav);
            params.delete('action');
            const query = params.toString();
            const nextUrl = query ? `${window.location.pathname}?${query}` : window.location.pathname;
            window.history.replaceState({}, '', nextUrl);
        };

        applyShortcutFromLocation();
        window.addEventListener('popstate', applyShortcutFromLocation);
        return () => window.removeEventListener('popstate', applyShortcutFromLocation);
    }, [setActiveNav]);

    const handleMobileTabChange = (tabId: string) => {
        const nextTab = tabId as BusinessMobileTabId;
        if (BUSINESS_MOBILE_GROUPS[nextTab].includes(activeNav as BusinessNavId)) return;
        setActiveNav(BUSINESS_MOBILE_DEFAULT_NAV[nextTab]);
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
                                background: active ? 'linear-gradient(135deg, #10b981, #0f766e)' : 'rgba(255,255,255,0.92)',
                                color: active ? '#fff' : '#475569',
                                boxShadow: active ? '0 10px 22px rgba(16,185,129,0.22)' : 'inset 0 0 0 1px rgba(226,232,240,0.95)',
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

    const QuickActionButton = ({ icon, label, accent, target }: { icon: string; label: string; accent: string; target: BusinessNavId }) => (
        <button
            onClick={() => setActiveNav(target)}
            style={{
                border: '1px solid rgba(226,232,240,0.92)',
                background: 'rgba(255,255,255,0.94)',
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
                background: `${accent}15`,
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
            <div style={{
                ...shellCard,
                padding: isCompactMobile ? 18 : 24,
                background: isCompactMobile
                    ? 'linear-gradient(135deg, #0f172a, #064e3b)'
                    : 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(6,95,70,0.96) 52%, rgba(16,185,129,0.88))',
                color: '#fff',
            }}>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>
                    Business-native mobile PWA
                </div>
                <h2 style={{ margin: '8px 0 10px', fontSize: isCompactMobile ? 22 : 30, fontWeight: 900, letterSpacing: '-0.05em' }}>
                    Run sales, cash, tax, and collections from one pocket command center.
                </h2>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: isCompactMobile ? 13 : 15, lineHeight: 1.7 }}>
                    Biz Tracksy compresses outlet pulse, invoice recovery, and tax prep into one business dashboard that feels native on mobile.
                </p>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
                gap: 12,
            }}>
                <KPICard icon="💰" label="Today sales" value="LKR 142,500" change="+12%" changeType="up" color="#10b981" compact={isCompactMobile} />
                <KPICard icon="🧾" label="Open invoices" value="17" change="3 today" changeType="neutral" color="#0ea5e9" compact={isCompactMobile} />
                <KPICard icon="💸" label="Cash to collect" value="LKR 785,000" change="2 urgent" changeType="down" color="#f97316" compact={isCompactMobile} />
                <KPICard icon="🏦" label="VAT reserve" value="LKR 230,000" change="On track" changeType="up" color="#0f172a" compact={isCompactMobile} />
            </div>

            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Quick actions</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    {quickActions.map((action) => (
                        <QuickActionButton
                            key={action.label}
                            icon={action.icon}
                            label={action.label}
                            accent={action.accent}
                            target={action.target}
                        />
                    ))}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1.1fr 0.9fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Outlet pulse</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {branchPulse.map((branch) => (
                            <div key={branch.name} style={{
                                borderRadius: 18,
                                border: '1px solid rgba(226,232,240,0.92)',
                                background: '#f8fafc',
                                padding: isCompactMobile ? '14px 14px' : '16px 16px',
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{branch.name}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 3 }}>{branch.note}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>{branch.sales}</div>
                                        <div style={{ fontSize: 12, color: branch.trendColor, fontWeight: 700 }}>{branch.trend}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Invoice board</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {invoiceQueue.map((invoice) => (
                            <button
                                key={invoice.client}
                                onClick={() => setActiveNav('invoices')}
                                style={{
                                    border: '1px solid rgba(226,232,240,0.95)',
                                    borderRadius: 18,
                                    background: '#fff',
                                    padding: '14px 14px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                    <div>
                                        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{invoice.client}</div>
                                        <div style={{ fontSize: 12, color: invoice.accent, fontWeight: 700, marginTop: 4 }}>{invoice.status}</div>
                                    </div>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{invoice.amount}</div>
                                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{invoice.due}</div>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <TransactionList
                transactions={businessTransactions}
                title="Cash movements"
                showFilter={!isCompactMobile}
                compact={isCompactMobile}
            />
        </div>
    );

    const renderPos = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: 12,
            }}>
                <KPICard icon="🏪" label="Transactions" value="34" change="Avg LKR 4,191" changeType="neutral" color="#10b981" compact={isCompactMobile} />
                <KPICard icon="📱" label="Card ratio" value="61%" change="+8%" changeType="up" color="#0ea5e9" compact={isCompactMobile} />
                <KPICard icon="📦" label="Low stock items" value="5" change="Action now" changeType="down" color="#f97316" compact={isCompactMobile} />
            </div>

            <div style={{
                ...shellCard,
                padding: isCompactMobile ? 18 : 24,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(14,165,233,0.08))',
            }}>
                <div style={sectionLabelStyle}>Pocket POS</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: isCompactMobile ? 'flex-start' : 'center', flexDirection: isCompactMobile ? 'column' : 'row' }}>
                    <div>
                        <h3 style={{ margin: '0 0 8px', fontSize: isCompactMobile ? 20 : 24, fontWeight: 850, letterSpacing: '-0.04em', color: '#0f172a' }}>
                            Ready for the next checkout rush.
                        </h3>
                        <p style={{ margin: 0, color: '#475569', fontSize: 13.5, lineHeight: 1.7 }}>
                            Scan products, take card or cash, and drop stock automatically without dragging a desktop POS into mobile.
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <button style={primaryButtonStyle}>📷 Scan item</button>
                        <button style={secondaryButtonStyle}>⌨️ Manual entry</button>
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1fr 1fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Top SKUs</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {topSkus.map((item) => (
                            <div key={item.name} style={listCardStyle}>
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>{item.units}</div>
                                </div>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#16a34a' }}>{item.margin}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Low stock radar</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {lowStock.map((item) => (
                            <div key={item.name} style={listCardStyle}>
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.name}</div>
                                    <div style={{ fontSize: 11.5, color: '#f97316', marginTop: 4 }}>{item.stock}</div>
                                </div>
                                <span style={{ fontSize: 11.5, color: '#64748b', textAlign: 'right', maxWidth: 120 }}>{item.supplier}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderInvoices = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Invoice queue</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {invoiceQueue.map((invoice) => (
                        <div key={invoice.client} style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{invoice.client}</div>
                                <div style={{ fontSize: 11.5, color: invoice.accent, fontWeight: 700, marginTop: 4 }}>{invoice.status}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0f172a' }}>{invoice.amount}</div>
                                <div style={{ fontSize: 11.5, color: '#64748b' }}>{invoice.due}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1fr 1fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Fast templates</div>
                    <div style={{ display: 'grid', gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
                        {['Wholesale batch', 'Monthly retainer', 'Custom quotation'].map((template) => (
                            <button key={template} style={templateButtonStyle}>
                                {template}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Collection forecast</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Likely this week</div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>High-confidence recovery across 5 invoices</div>
                            </div>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#16a34a' }}>LKR 610,000</span>
                        </div>
                        <div style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>At risk</div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>Escalate via WhatsApp or call</div>
                            </div>
                            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#ef4444' }}>LKR 175,000</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderCollections = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Debtor pipeline</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {debtorPipeline.map((debtor) => (
                        <div key={debtor.name} style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{debtor.name}</div>
                                <div style={{ fontSize: 11.5, color: debtor.accent, fontWeight: 700, marginTop: 4 }}>{debtor.status}</div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>{debtor.note}</div>
                            </div>
                            <button style={{
                                ...secondaryButtonStyle,
                                padding: '8px 12px',
                                fontSize: 12,
                                color: debtor.accent,
                                borderColor: `${debtor.accent}33`,
                            }}>
                                {debtor.amount}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1fr 1fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>PDC vault</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {pdcVault.map((item) => (
                            <span key={item} style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                border: '1px solid rgba(14,165,233,0.2)',
                                color: '#0369a1',
                                background: 'rgba(14,165,233,0.08)',
                                fontSize: 11.5,
                                fontWeight: 700,
                            }}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Recovery rhythm</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {['9:00 AM WhatsApp nudges', '1:30 PM sales rep follow-ups', '4:00 PM cheque deposit checks'].map((item) => (
                            <div key={item} style={listCardStyle}>
                                <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{item}</span>
                                <span style={{ fontSize: 11.5, color: '#64748b' }}>Live</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );

    const renderTax = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: 12,
            }}>
                <KPICard icon="📤" label="Output VAT" value="LKR 350,000" change="Collected" changeType="neutral" color="#ef4444" compact={isCompactMobile} />
                <KPICard icon="📥" label="Input VAT" value="LKR 120,000" change="Captured" changeType="up" color="#16a34a" compact={isCompactMobile} />
                <KPICard icon="⚠️" label="Net liability" value="LKR 230,000" change="Due next month" changeType="down" color="#f59e0b" compact={isCompactMobile} />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1fr 1fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Compliance board</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {taxChecklist.map((item) => (
                            <div key={item.title} style={listCardStyle}>
                                <div>
                                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>{item.title}</div>
                                    <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>{item.detail}</div>
                                </div>
                                <button style={{ ...secondaryButtonStyle, padding: '8px 12px', fontSize: 12 }}>{item.action}</button>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Tax notes</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Next filing deadline</div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>VAT pack cut-off lands in 14 days</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#ef4444' }}>14 days</span>
                        </div>
                        <div style={listCardStyle}>
                            <div>
                                <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0f172a' }}>Missing proof risk</div>
                                <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 4 }}>2 supplier invoices need clearer scans</div>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f97316' }}>Review</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderReports = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                gap: 14,
            }}>
                {reportTiles.map((tile) => (
                    <div key={tile.title} style={{ ...shellCard, padding: isCompactMobile ? 16 : 18 }}>
                        <div style={{ ...sectionLabelStyle, color: tile.accent }}>{tile.title}</div>
                        <div style={{ fontSize: 14, color: '#0f172a', fontWeight: 700, lineHeight: 1.6 }}>{tile.detail}</div>
                    </div>
                ))}
            </div>

            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Board pack</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr 1fr' : 'repeat(4, minmax(0, 1fr))',
                    gap: 10,
                }}>
                    {['Profit & Loss', 'Cashflow', 'Branch snapshot', 'Tax export'].map((label) => (
                        <button key={label} style={templateButtonStyle}>{label}</button>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderAi = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                gap: 14,
            }}>
                {aiPlaybooks.map((item) => (
                    <div key={item.title} style={{ ...shellCard, padding: isCompactMobile ? 16 : 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
                            <div>
                                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0f172a' }}>{item.title}</div>
                                <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 8, lineHeight: 1.7 }}>{item.desc}</div>
                            </div>
                            <span style={{
                                padding: '5px 10px',
                                borderRadius: 999,
                                background: 'rgba(16,185,129,0.12)',
                                color: '#047857',
                                fontSize: 11,
                                fontWeight: 800,
                                whiteSpace: 'nowrap',
                            }}>
                                {item.badge}
                            </span>
                        </div>
                        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#0f766e' }}>{item.token}</span>
                            <button style={secondaryButtonStyle}>Launch</button>
                        </div>
                    </div>
                ))}
            </div>

            {isCompactMobile && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button onClick={onLogout} style={{ ...secondaryButtonStyle, minHeight: 48 }}>🚪 Sign out</button>
                    <button onClick={onChangeProfession} style={{ ...secondaryButtonStyle, minHeight: 48 }}>🌐 Web professions</button>
                </div>
            )}
        </div>
    );

    const renderContent = () => {
        switch (activeNav) {
            case 'overview':
                return renderOverview();
            case 'pos':
                return renderPos();
            case 'invoices':
                return renderInvoices();
            case 'pdc':
                return renderCollections();
            case 'tax':
                return renderTax();
            case 'reports':
                return renderReports();
            case 'ai':
                return renderAi();
            default:
                return renderOverview();
        }
    };

    const mobileTitleMap: Record<BusinessMobileTabId, string> = {
        home: 'Business HQ',
        sales: activeNav === 'invoices' ? 'Invoice Desk' : 'Pocket POS',
        cash: activeNav === 'reports' ? 'Cash Reports' : 'Collections Engine',
        taxes: 'Tax Control',
        more: 'AI Ops',
    };

    const mobileSubtitleMap: Record<BusinessMobileTabId, string> = {
        home: 'Sales pulse, quick actions, and branch visibility',
        sales: activeNav === 'invoices' ? 'Issue invoices, follow up, and collect faster' : 'Checkout, stock, and best-selling items',
        cash: activeNav === 'reports' ? 'Runway, profitability, and board-ready exports' : 'Debtors, PDC reminders, and recovery cadence',
        taxes: 'VAT, filing prep, and compliance proof',
        more: 'AI automations and business ops tools',
    };

    return (
        <DashboardLayout
            profession="business"
            professionLabel="Biz Tracksy"
            professionIcon="💼"
            userName={userName}
            navItems={navItems}
            activeNav={activeNav}
            onNavChange={(id) => setActiveNav(id as BusinessNavId)}
            onChangeProfession={onChangeProfession}
            onLogout={onLogout}
            mobileShell={{
                enabled: true,
                tabs: BUSINESS_MOBILE_TABS,
                activeTab: activeMobileTab,
                onTabChange: handleMobileTabChange,
                activeTitle: mobileTitleMap[activeMobileTab],
                activeSubtitle: mobileSubtitleMap[activeMobileTab],
                headerAction: (
                    <button
                        onClick={() => setActiveNav(activeMobileTab === 'sales' ? 'invoices' : 'overview')}
                        style={{
                            width: 38,
                            height: 38,
                            borderRadius: 14,
                            border: 'none',
                            background: 'linear-gradient(135deg, #10b981, #0f766e)',
                            color: '#fff',
                            fontSize: 22,
                            fontWeight: 700,
                            cursor: 'pointer',
                            boxShadow: '0 10px 24px rgba(16,185,129,0.26)',
                        }}
                        aria-label="Quick add"
                    >
                        +
                    </button>
                ),
                accentColor: '#10b981',
                activeTabBackground: 'linear-gradient(135deg, rgba(16,185,129,0.16), rgba(14,165,233,0.14))',
                background: 'linear-gradient(180deg, #071713 0%, #0b2b24 24%, #effcf7 24.1%, #f8fafc 100%)',
                headerBackground: 'rgba(7,23,19,0.9)',
                navBackground: 'rgba(7,18,15,0.95)',
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
                        background: 'linear-gradient(135deg, rgba(15,23,42,0.98), rgba(6,95,70,0.96) 55%, rgba(16,185,129,0.88))',
                        color: '#fff',
                        boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
                    }}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#bbf7d0' }}>
                                Business-first mobile PWA
                            </div>
                            <h1 style={{ fontSize: 30, fontWeight: 900, margin: '8px 0 10px', letterSpacing: '-0.05em' }}>
                                Replace the cashbook, debtor sheet, and POS tab chaos.
                            </h1>
                            <p style={{ margin: 0, maxWidth: 720, color: 'rgba(255,255,255,0.78)', fontSize: 15, lineHeight: 1.7 }}>
                                MyTracksy Business turns daily retail sales, invoicing, collections, tax prep, and AI business ops into one compact operating system.
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                            <button onClick={() => setActiveNav('invoices')} style={heroGhostButtonStyle}>
                                Export invoice pack
                            </button>
                            <button onClick={() => setActiveNav('pos')} style={heroPrimaryButtonStyle}>
                                Open POS
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
                                        background: active ? 'linear-gradient(135deg, #10b981, #0f766e)' : '#ffffff',
                                        color: active ? '#fff' : '#475569',
                                        boxShadow: active ? '0 12px 24px rgba(16,185,129,0.22)' : 'inset 0 0 0 1px rgba(226,232,240,0.9)',
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

                {renderMobileSectionNav()}
                {renderContent()}
            </div>
        </DashboardLayout>
    );
};

const listCardStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    border: '1px solid rgba(226,232,240,0.9)',
    background: '#f8fafc',
    padding: '14px 14px',
};

const primaryButtonStyle: React.CSSProperties = {
    border: 'none',
    borderRadius: 14,
    background: 'linear-gradient(135deg, #10b981, #0f766e)',
    color: '#fff',
    padding: '11px 16px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
    minHeight: 42,
};

const secondaryButtonStyle: React.CSSProperties = {
    border: '1px solid rgba(203,213,225,0.9)',
    borderRadius: 14,
    background: '#fff',
    color: '#334155',
    padding: '10px 14px',
    fontSize: 13,
    fontWeight: 700,
    cursor: 'pointer',
};

const templateButtonStyle: React.CSSProperties = {
    border: '1px solid rgba(226,232,240,0.95)',
    borderRadius: 16,
    background: '#fff',
    color: '#0f172a',
    padding: '12px 14px',
    fontSize: 12.5,
    fontWeight: 700,
    textAlign: 'left',
    cursor: 'pointer',
    minHeight: 52,
};

const heroPrimaryButtonStyle: React.CSSProperties = {
    borderRadius: 14,
    border: 'none',
    background: '#fff',
    color: '#047857',
    padding: '12px 18px',
    fontWeight: 800,
    cursor: 'pointer',
};

const heroGhostButtonStyle: React.CSSProperties = {
    borderRadius: 14,
    border: '1px solid rgba(255,255,255,0.14)',
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    padding: '12px 16px',
    fontWeight: 700,
    cursor: 'pointer',
};

export default BusinessDashboard;
