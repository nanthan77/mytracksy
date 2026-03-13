import React, { useEffect, useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import KPICard from './KPICard';
import TransactionList, { Transaction } from './TransactionList';
import { useIsCompactMobile } from './useIsCompactMobile';
import { useRouteNav } from '../../hooks/useRouteNav';
import { useAuth } from '../../context/AuthContext';
import { useSubscriptionTier } from '../../hooks/useSubscriptionTier';
import { getFeatureTierInfo, isFeatureAccessible } from '../../config/featureGating';
import { getPricingForProfession } from '../../config/pricingConfig';
import SubscriptionManager from '../SubscriptionManager';
import { addTransaction, fromCents, seedChartOfAccounts, subscribeTransactions, toCents } from '../../services/accountingCoreService';
import {
    StudioAiDraft,
    StudioAiDraftType,
    StudioAsset,
    StudioAssetCategory,
    StudioEvent,
    StudioEventStatus,
    StudioExpense,
    StudioExpenseCategory,
    StudioMilestone,
    addStudioAiDraft,
    addStudioAsset,
    addStudioEvent,
    addStudioExpense,
    addStudioMilestone,
    subscribeStudioAiDrafts,
    subscribeStudioAssets,
    subscribeStudioEvents,
    subscribeStudioExpenses,
    subscribeStudioMilestones,
    updateStudioEvent,
    updateStudioMilestone,
} from '../../services/studiosService';

interface Props {
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

type StudiosNavId =
    | 'overview'
    | 'events'
    | 'milestones'
    | 'profit'
    | 'calendar'
    | 'gear'
    | 'tax'
    | 'contracts'
    | 'voice'
    | 'diplomat'
    | 'subscription';

type StudiosMobileTabId = 'home' | 'events' | 'cash' | 'gear' | 'ai';

interface NavItem {
    id: StudiosNavId;
    label: string;
    icon: string;
    locked?: boolean;
    tierBadge?: string;
}

interface FeedbackState {
    type: 'success' | 'error' | 'info';
    text: string;
}

interface EventSummary {
    event: StudioEvent;
    paid: number;
    due: number;
    totalExpenses: number;
    netProfit: number;
    margin: number;
    progress: number;
    overdueMilestone?: StudioMilestone;
    nextMilestone?: StudioMilestone;
    accent: string;
    statusLabel: string;
}

const navItems: NavItem[] = [
    { id: 'overview', label: 'Studio Home', icon: '🏠' },
    { id: 'events', label: 'Event Folios', icon: '💍' },
    { id: 'milestones', label: 'Milestones', icon: '💳' },
    { id: 'profit', label: 'True Profit', icon: '📈' },
    { id: 'calendar', label: 'Nekath Calendar', icon: '🗓️' },
    { id: 'gear', label: 'Gear Vault', icon: '📸' },
    { id: 'tax', label: 'Tax Shield', icon: '🧾' },
    { id: 'contracts', label: 'AI Contracts', icon: '📄' },
    { id: 'voice', label: 'Voice Decoder', icon: '🎙️' },
    { id: 'diplomat', label: 'Client Diplomat', icon: '💬' },
    { id: 'subscription', label: 'Upgrade', icon: '⭐' },
];

const mobileTabs: { id: StudiosMobileTabId; label: string; icon: string }[] = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'events', label: 'Events', icon: '💍' },
    { id: 'cash', label: 'Cash', icon: '📈' },
    { id: 'gear', label: 'Gear', icon: '📸' },
    { id: 'ai', label: 'AI', icon: '✨' },
];

const mobileGroups: Record<StudiosMobileTabId, StudiosNavId[]> = {
    home: ['overview'],
    events: ['events', 'milestones', 'calendar'],
    cash: ['profit', 'tax'],
    gear: ['gear'],
    ai: ['contracts', 'voice', 'diplomat', 'subscription'],
};

const mobileDefaultNav: Record<StudiosMobileTabId, StudiosNavId> = {
    home: 'overview',
    events: 'events',
    cash: 'profit',
    gear: 'gear',
    ai: 'contracts',
};

const shortcutMap: Record<string, StudiosNavId> = {
    overview: 'overview',
    home: 'overview',
    folio: 'events',
    events: 'events',
    milestones: 'milestones',
    billing: 'milestones',
    reminders: 'milestones',
    profit: 'profit',
    crew: 'profit',
    calendar: 'calendar',
    nekath: 'calendar',
    gear: 'gear',
    assets: 'gear',
    tax: 'tax',
    depreciation: 'tax',
    contracts: 'contracts',
    quote: 'contracts',
    voice: 'voice',
    shotlist: 'voice',
    diplomat: 'diplomat',
    client: 'diplomat',
    subscription: 'subscription',
    upgrade: 'subscription',
};

const sectionSubtitles: Record<StudiosNavId, string> = {
    overview: 'Cash pressure, weekend load, and overdue album balances in one mobile board.',
    events: 'Every wedding, commercial shoot, and delivery job in one event folio stack.',
    milestones: 'Advance, shoot-day, pre-shoot, and album-delivery checkpoints with reminder timing.',
    profit: 'Gross versus crew, lab, travel, and rental leakage before you quote the next job.',
    calendar: 'Nekath-heavy weekends with clash warnings before you promise the impossible.',
    gear: 'Camera, drone, laptop, and lighting assets with receipt-backed tracking.',
    tax: 'Annual depreciation shield and studio deduction view built for Sri Lankan reporting.',
    contracts: 'Saved contract drafts to protect scope, revisions, and copyright.',
    voice: 'Turn chaotic client voice notes into clean, phone-ready wedding-day shot lists.',
    diplomat: 'Delay notices and boundary-setting replies that keep the brand premium.',
    subscription: 'Unlock automation, AI tools, and unlimited studio workflows.',
};

const shellCard: React.CSSProperties = {
    background: 'rgba(255,255,255,0.96)',
    border: '1px solid rgba(231,229,228,0.92)',
    borderRadius: 24,
    boxShadow: '0 16px 36px rgba(28,25,23,0.06)',
};

const sectionLabelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#b45309',
    marginBottom: 10,
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    borderRadius: 14,
    border: '1px solid rgba(214,211,209,0.95)',
    background: '#fff',
    fontSize: 14,
    color: '#1c1917',
    boxSizing: 'border-box',
    fontFamily: 'inherit',
};

const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    minHeight: 110,
    resize: 'vertical',
};

const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    color: '#78716c',
    marginBottom: 8,
};

const secondaryButton: React.CSSProperties = {
    border: '1px solid rgba(214,211,209,0.95)',
    background: 'rgba(255,255,255,0.96)',
    color: '#44403c',
    borderRadius: 14,
    padding: '11px 14px',
    fontSize: 13.5,
    fontWeight: 700,
    cursor: 'pointer',
};

const emptyStateStyle: React.CSSProperties = {
    ...shellCard,
    padding: 24,
    textAlign: 'center',
    color: '#78716c',
};

const statusOptions: StudioEventStatus[] = ['lead', 'booked', 'shot', 'editing', 'delivered', 'archived'];
const expenseCategoryOptions: StudioExpenseCategory[] = ['freelancer', 'printing', 'gear_rent', 'travel', 'album', 'assistant', 'other'];
const assetCategoryOptions: StudioAssetCategory[] = ['camera_gear', 'drone', 'computer', 'lighting', 'lens', 'audio', 'other'];
const aiDraftCosts: Record<StudioAiDraftType, number> = { contract: 3, voice: 2, diplomat: 1 };

const todayIso = () => new Date().toISOString().split('T')[0];
const currentMonthKey = () => todayIso().slice(0, 7);

const fmtLkr = (value: number) => `LKR ${Math.round(value).toLocaleString('en-LK')}`;

function getMobileTab(activeNav: StudiosNavId): StudiosMobileTabId {
    const match = mobileTabs.find((tab) => mobileGroups[tab.id].includes(activeNav));
    return match?.id || 'home';
}

function formatShortDate(value: string) {
    if (!value) return 'No date';
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString('en-LK', { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatDistanceLabel(dateValue: string) {
    const due = new Date(`${dateValue}T00:00:00`);
    if (Number.isNaN(due.getTime())) return 'Date not set';

    const now = new Date();
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const diffDays = Math.round((dueDay - today) / 86400000);

    if (diffDays < 0) return `Overdue ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`;
    if (diffDays === 0) return 'Due today';
    if (diffDays === 1) return 'Due tomorrow';
    return `Due in ${diffDays} days`;
}

function normalizeStatusLabel(status: StudioEventStatus) {
    switch (status) {
        case 'lead':
            return 'Lead';
        case 'booked':
            return 'Booked';
        case 'shot':
            return 'Shot';
        case 'editing':
            return 'Editing';
        case 'delivered':
            return 'Delivered';
        case 'archived':
            return 'Archived';
        default:
            return status;
    }
}

function getAccentForSummary(summary: Pick<EventSummary, 'overdueMilestone' | 'nextMilestone' | 'event'>) {
    if (summary.overdueMilestone) return '#ef4444';
    if (summary.nextMilestone) return '#f59e0b';
    if (summary.event.status === 'editing') return '#0ea5e9';
    if (summary.event.status === 'delivered') return '#16a34a';
    return '#b45309';
}

function getLocationTag(location: string) {
    return location.split('•')[0].split(',')[0].trim().toLowerCase();
}

function buildContractPreview(title: string, prompt: string, relatedEvent?: string) {
    return [
        `Contract draft for ${title}${relatedEvent ? ` • ${relatedEvent}` : ''}`,
        '',
        '1. Scope',
        `This assignment will be delivered exactly as described: ${prompt}`,
        '',
        '2. Payment',
        'Booking remains confirmed only after the agreed advance is cleared. Outstanding milestone balances must be settled before final delivery or album handover.',
        '',
        '3. Revisions and Files',
        'Edited output is supplied in the studio delivery format. RAW files, extra revisions, and rush changes remain outside the base scope unless approved in writing.',
        '',
        '4. Client Duties',
        'The client is responsible for access, permits, vendor coordination, and meals for the assigned crew during extended coverage.',
        '',
        '5. Delay Protection',
        'External vendor or print delays will be communicated promptly, with the delivery timeline updated in writing while quality standards are protected.',
    ].join('\n');
}

function buildVoicePreview(prompt: string) {
    const lines = prompt
        .split(/\n|\.|,/)
        .map((line) => line.trim())
        .filter(Boolean)
        .slice(0, 8);

    if (!lines.length) {
        return 'Shot list ready:\n- Capture immediate family after ceremony\n- Confirm couple portraits before reception opens\n- Secure ring and detail shots before sunset';
    }

    return `Shot list ready:\n${lines.map((line) => `- ${line.charAt(0).toUpperCase()}${line.slice(1)}`).join('\n')}`;
}

function buildDiplomatPreview(title: string, prompt: string, relatedEvent?: string) {
    return [
        `Hi ${relatedEvent || 'there'},`,
        '',
        `Thank you for your patience regarding ${title.toLowerCase()}. ${prompt}`,
        '',
        'Our studio is protecting the final quality of your delivery and is actively monitoring the next available completion window. We will keep you updated with a clear status checkpoint and do everything possible to avoid further inconvenience.',
        '',
        'Thank you for your trust,',
        'LensTracksy Studio Desk',
    ].join('\n');
}

const StudiosDashboard: React.FC<Props> = ({ userName, onChangeProfession, onLogout }) => {
    const { currentUser } = useAuth();
    const uid = currentUser?.uid || '';
    const isCompactMobile = useIsCompactMobile();
    const subscriptionState = useSubscriptionTier();

    const validNavIds = useMemo(() => navItems.map((item) => item.id), []);
    const [activeNav, setActiveNav] = useRouteNav(validNavIds, 'overview');

    const [studioEvents, setStudioEvents] = useState<StudioEvent[]>([]);
    const [studioMilestones, setStudioMilestones] = useState<StudioMilestone[]>([]);
    const [studioExpenses, setStudioExpenses] = useState<StudioExpense[]>([]);
    const [studioAssets, setStudioAssets] = useState<StudioAsset[]>([]);
    const [studioDrafts, setStudioDrafts] = useState<StudioAiDraft[]>([]);
    const [cashFeed, setCashFeed] = useState<Transaction[]>([]);
    const [feedback, setFeedback] = useState<FeedbackState | null>(null);
    const [upgradePromptFeature, setUpgradePromptFeature] = useState<StudiosNavId | null>(null);
    const [savingKey, setSavingKey] = useState<string | null>(null);

    const [showEventForm, setShowEventForm] = useState(false);
    const [showMilestoneForm, setShowMilestoneForm] = useState(false);
    const [showExpenseForm, setShowExpenseForm] = useState(false);
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [showDraftForm, setShowDraftForm] = useState<StudioAiDraftType | null>(null);

    const [eventForm, setEventForm] = useState({
        clientName: '',
        eventDate: todayIso(),
        startTime: '08:00',
        location: '',
        packageName: '',
        totalValue: '',
        status: 'booked' as StudioEventStatus,
        shootType: 'Wedding',
        notes: '',
    });

    const [milestoneForm, setMilestoneForm] = useState({
        eventId: '',
        title: 'Album Delivery',
        amount: '',
        dueDate: todayIso(),
        paymentLink: '',
        notes: '',
    });

    const [expenseForm, setExpenseForm] = useState({
        eventId: '',
        payeeName: '',
        amount: '',
        category: 'freelancer' as StudioExpenseCategory,
        date: todayIso(),
        notes: '',
    });

    const [assetForm, setAssetForm] = useState({
        itemName: '',
        purchaseDate: todayIso(),
        purchasePrice: '',
        category: 'camera_gear' as StudioAssetCategory,
        receiptImageUrl: '',
        notes: '',
    });

    const [draftForm, setDraftForm] = useState({
        title: '',
        prompt: '',
        relatedEventId: '',
    });

    const studiosPricing = useMemo(() => getPricingForProfession('studios'), []);
    const proTier = useMemo(() => studiosPricing.tiers.find((tier) => tier.tierKey === 'pro'), [studiosPricing]);

    const gatedNavItems = useMemo(() => {
        return navItems.map((item) => {
            const tierInfo = getFeatureTierInfo(item.id, 'studios');
            if (!tierInfo) return { ...item, locked: false, tierBadge: '' };
            return {
                ...item,
                locked: !isFeatureAccessible(item.id, subscriptionState.tier, 'studios'),
                tierBadge: tierInfo.badge,
            };
        });
    }, [subscriptionState.tier]);

    const activeNavItem = useMemo(
        () => gatedNavItems.find((item) => item.id === activeNav) || gatedNavItems[0],
        [activeNav, gatedNavItems]
    );

    const activeMobileTab = useMemo(() => getMobileTab(activeNav as StudiosNavId), [activeNav]);
    const activeMobileSections = useMemo(
        () => mobileGroups[activeMobileTab]
            .map((navId) => gatedNavItems.find((item) => item.id === navId))
            .filter(Boolean) as NavItem[],
        [activeMobileTab, gatedNavItems]
    );

    useEffect(() => {
        if (!feedback) return undefined;
        const timer = window.setTimeout(() => setFeedback(null), 4200);
        return () => window.clearTimeout(timer);
    }, [feedback]);

    useEffect(() => {
        if (!uid) return;
        seedChartOfAccounts(uid, 'studios').catch((error) => {
            console.error('Failed to seed studio chart of accounts:', error);
        });
    }, [uid]);

    useEffect(() => {
        if (!uid) return;

        const unsubEvents = subscribeStudioEvents(uid, setStudioEvents);
        const unsubMilestones = subscribeStudioMilestones(uid, setStudioMilestones);
        const unsubExpenses = subscribeStudioExpenses(uid, setStudioExpenses);
        const unsubAssets = subscribeStudioAssets(uid, setStudioAssets);
        const unsubDrafts = subscribeStudioAiDrafts(uid, setStudioDrafts);
        const unsubTransactions = subscribeTransactions(uid, (entries) => {
            setCashFeed(entries.slice(0, 8).map((entry) => ({
                id: entry.id || '',
                type: entry.type,
                amount: fromCents(entry.amount_cents),
                description: entry.description,
                category: entry.category_name || entry.vendor || 'Studio cashflow',
                date: entry.date,
                status: entry.type === 'income'
                    ? (entry.status === 'cleared' ? 'received' : 'pending')
                    : (entry.status === 'cleared' ? 'completed' : 'pending'),
            })));
        });

        return () => {
            unsubEvents();
            unsubMilestones();
            unsubExpenses();
            unsubAssets();
            unsubDrafts();
            unsubTransactions();
        };
    }, [uid]);

    useEffect(() => {
        const applyShortcutFromLocation = () => {
            const params = new URLSearchParams(window.location.search);
            const action = params.get('action');
            if (!action) return;

            const targetNav = shortcutMap[action];
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

    useEffect(() => {
        if (activeNav === 'subscription') return;
        const activeItem = gatedNavItems.find((item) => item.id === activeNav);
        if (!activeItem?.locked) return;
        setUpgradePromptFeature(activeNav as StudiosNavId);
        setActiveNav('subscription');
    }, [activeNav, gatedNavItems, setActiveNav]);

    useEffect(() => {
        if (!studioEvents.length) return;
        if (!milestoneForm.eventId) {
            setMilestoneForm((current) => ({ ...current, eventId: studioEvents[0].id || '' }));
        }
        if (!expenseForm.eventId) {
            setExpenseForm((current) => ({ ...current, eventId: studioEvents[0].id || '' }));
        }
        if (!draftForm.relatedEventId) {
            setDraftForm((current) => ({ ...current, relatedEventId: studioEvents[0].id || '' }));
        }
    }, [studioEvents, milestoneForm.eventId, expenseForm.eventId, draftForm.relatedEventId]);

    const studioEventMap = useMemo(
        () => Object.fromEntries(studioEvents.map((event) => [event.id || '', event])),
        [studioEvents]
    );

    const eventSummaries = useMemo<EventSummary[]>(() => {
        return studioEvents.map((event) => {
            const milestones = studioMilestones
                .filter((item) => item.eventId === event.id)
                .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
            const payouts = studioExpenses.filter((item) => item.eventId === event.id);
            const paid = milestones.filter((item) => item.status === 'paid').reduce((sum, item) => sum + item.amount, 0);
            const due = Math.max(event.totalValue - paid, 0);
            const totalExpenses = payouts.reduce((sum, item) => sum + item.amount, 0);
            const netProfit = paid - totalExpenses;
            const margin = paid > 0 ? Math.round((netProfit / paid) * 100) : 0;
            const overdueMilestone = milestones.find((item) => item.status === 'unpaid' && item.dueDate < todayIso());
            const nextMilestone = milestones.find((item) => item.status === 'unpaid' && item.dueDate >= todayIso());

            const baseSummary = {
                event,
                paid,
                due,
                totalExpenses,
                netProfit,
                margin,
                progress: event.totalValue > 0 ? Math.max(0, Math.min(100, Math.round((paid / event.totalValue) * 100))) : 0,
                overdueMilestone,
                nextMilestone,
                accent: '#b45309',
                statusLabel: overdueMilestone ? `${overdueMilestone.title} overdue` : normalizeStatusLabel(event.status),
            } as EventSummary;

            return {
                ...baseSummary,
                accent: getAccentForSummary(baseSummary),
            };
        }).sort((a, b) => a.event.eventDate.localeCompare(b.event.eventDate));
    }, [studioEvents, studioMilestones, studioExpenses]);

    const activeMonthEvents = useMemo(
        () => studioEvents.filter((event) => event.eventDate.startsWith(currentMonthKey()) && !['delivered', 'archived'].includes(event.status)),
        [studioEvents]
    );

    const eventLimit = subscriptionState.isFree ? 3 : Number.POSITIVE_INFINITY;
    const assetLimit = subscriptionState.isFree ? 1 : Number.POSITIVE_INFINITY;
    const eventLimitReached = activeMonthEvents.length >= eventLimit;
    const assetLimitReached = studioAssets.length >= assetLimit;

    const outstandingBalance = useMemo(
        () => eventSummaries.reduce((sum, summary) => sum + summary.due, 0),
        [eventSummaries]
    );

    const monthlyRevenue = useMemo(
        () => studioMilestones
            .filter((item) => item.status === 'paid' && (item.paidDate || item.dueDate).startsWith(currentMonthKey()))
            .reduce((sum, item) => sum + item.amount, 0),
        [studioMilestones]
    );

    const monthlyPayouts = useMemo(
        () => studioExpenses
            .filter((item) => item.date.startsWith(currentMonthKey()))
            .reduce((sum, item) => sum + item.amount, 0),
        [studioExpenses]
    );

    const monthlyMarginPct = monthlyRevenue > 0 ? Math.round(((monthlyRevenue - monthlyPayouts) / monthlyRevenue) * 100) : 0;

    const gearRows = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return studioAssets.map((asset) => {
            const purchaseYear = Number(asset.purchaseDate.slice(0, 4));
            const yearsActive = Number.isNaN(purchaseYear) ? 1 : Math.min(Math.max(currentYear - purchaseYear + 1, 1), 5);
            const depreciationActive = Number.isNaN(purchaseYear) ? true : (currentYear - purchaseYear) < 5;
            const deduction = depreciationActive ? Math.round(asset.purchasePrice * 0.2) : 0;
            return {
                ...asset,
                deduction,
                life: `Year ${yearsActive} / 5`,
            };
        });
    }, [studioAssets]);

    const annualDepreciationTotal = useMemo(
        () => gearRows.reduce((sum, asset) => sum + asset.deduction, 0),
        [gearRows]
    );

    const clashWarnings = useMemo(() => {
        const byDate = studioEvents.reduce<Record<string, StudioEvent[]>>((acc, event) => {
            if (['archived', 'delivered'].includes(event.status)) return acc;
            acc[event.eventDate] = acc[event.eventDate] || [];
            acc[event.eventDate].push(event);
            return acc;
        }, {});

        return Object.entries(byDate)
            .filter(([, events]) => events.length > 1)
            .map(([date, events]) => {
                const locations = Array.from(new Set(events.map((event) => getLocationTag(event.location))));
                const firstTime = events
                    .map((event) => event.startTime || '00:00')
                    .sort()[0];
                const lastTime = events
                    .map((event) => event.startTime || '00:00')
                    .sort()
                    .slice(-1)[0];
                const firstMinutes = Number(firstTime.slice(0, 2)) * 60 + Number(firstTime.slice(3, 5));
                const lastMinutes = Number(lastTime.slice(0, 2)) * 60 + Number(lastTime.slice(3, 5));
                const tightTurn = Math.abs(lastMinutes - firstMinutes) <= 90;

                if (locations.length > 1) {
                    return {
                        day: formatShortDate(date),
                        line: `${events[0].clientName} + ${events[1].clientName}`,
                        status: 'Travel clash',
                        recommendation: 'Assign a second team or decline one booking before the couple locks the date.',
                        accent: '#ef4444',
                    };
                }

                if (tightTurn) {
                    return {
                        day: formatShortDate(date),
                        line: `${events.length} shoots inside one location window`,
                        status: 'Buffer risk',
                        recommendation: 'Move kit dispatch earlier or split editing and capture duties across crew.',
                        accent: '#f59e0b',
                    };
                }

                return {
                    day: formatShortDate(date),
                    line: `${events.length} active jobs on the same auspicious date`,
                    status: 'Crew split',
                    recommendation: 'Lock freelancers and transport before taking one more couple on the same date.',
                    accent: '#0ea5e9',
                };
            })
            .slice(0, 4);
    }, [studioEvents]);

    const draftGroups = useMemo(() => {
        return {
            contract: studioDrafts.filter((draft) => draft.type === 'contract'),
            voice: studioDrafts.filter((draft) => draft.type === 'voice'),
            diplomat: studioDrafts.filter((draft) => draft.type === 'diplomat'),
        };
    }, [studioDrafts]);

    const latestEventSummary = eventSummaries[0];
    const urgentMilestones = studioMilestones
        .filter((item) => item.status === 'unpaid')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .slice(0, 4);
    const payoutLines = studioExpenses.slice(0, 6);

    const heroKpis = useMemo(() => ([
        {
            icon: '💰',
            label: 'Outstanding balances',
            value: fmtLkr(outstandingBalance),
            change: `${urgentMilestones.length} unpaid checkpoints`,
            changeType: outstandingBalance > 0 ? 'down' as const : 'neutral' as const,
            color: outstandingBalance > 0 ? '#dc2626' : '#16a34a',
        },
        {
            icon: '📈',
            label: 'Net margin this month',
            value: `${monthlyMarginPct}%`,
            change: fmtLkr(monthlyRevenue - monthlyPayouts),
            changeType: monthlyMarginPct >= 0 ? 'up' as const : 'down' as const,
            color: monthlyMarginPct >= 0 ? '#16a34a' : '#dc2626',
        },
        {
            icon: '📸',
            label: 'Depreciation shield',
            value: fmtLkr(annualDepreciationTotal),
            change: `${studioAssets.length} gear asset${studioAssets.length === 1 ? '' : 's'}`,
            changeType: 'neutral' as const,
            color: '#b45309',
        },
        {
            icon: '🗓️',
            label: 'High-pressure dates',
            value: `${clashWarnings.length}`,
            change: clashWarnings.length ? 'Resolve conflicts' : 'No clash alerts',
            changeType: clashWarnings.length ? 'down' as const : 'up' as const,
            color: '#0f766e',
        },
    ]), [annualDepreciationTotal, clashWarnings.length, monthlyMarginPct, monthlyPayouts, monthlyRevenue, outstandingBalance, studioAssets.length, urgentMilestones.length]);

    const pushFeedback = (type: FeedbackState['type'], text: string) => {
        setFeedback({ type, text });
    };

    const handleGatedNavChange = (navId: string) => {
        const navItem = gatedNavItems.find((item) => item.id === navId);
        if (navItem?.locked) {
            setUpgradePromptFeature(navId as StudiosNavId);
            setActiveNav('subscription');
            return;
        }

        setUpgradePromptFeature(null);
        setActiveNav(navId);
    };

    const handleMobileTabChange = (tabId: string) => {
        const nextTab = tabId as StudiosMobileTabId;
        if (mobileGroups[nextTab].includes(activeNav as StudiosNavId)) return;
        handleGatedNavChange(mobileDefaultNav[nextTab]);
    };

    const handleAddEvent = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!uid) return;

        const totalValue = Number(eventForm.totalValue);
        if (!eventForm.clientName.trim() || !eventForm.location.trim() || !eventForm.packageName.trim() || !totalValue) {
            pushFeedback('error', 'Add the client, location, package, and value before saving the event.');
            return;
        }

        if (subscriptionState.isFree && eventLimitReached) {
            setUpgradePromptFeature('events');
            setActiveNav('subscription');
            pushFeedback('info', 'Free Solo Photographer includes up to 3 active shoots per month. Upgrade to add more.');
            return;
        }

        setSavingKey('event');
        try {
            await addStudioEvent(uid, {
                clientName: eventForm.clientName.trim(),
                eventDate: eventForm.eventDate,
                startTime: eventForm.startTime,
                location: eventForm.location.trim(),
                packageName: eventForm.packageName.trim(),
                totalValue,
                status: eventForm.status,
                shootType: eventForm.shootType.trim(),
                notes: eventForm.notes.trim(),
            });

            setEventForm({
                clientName: '',
                eventDate: todayIso(),
                startTime: '08:00',
                location: '',
                packageName: '',
                totalValue: '',
                status: 'booked',
                shootType: 'Wedding',
                notes: '',
            });
            setShowEventForm(false);
            pushFeedback('success', 'Studio event saved to Firestore.');
        } catch (error) {
            console.error('Failed to add studio event:', error);
            pushFeedback('error', 'Could not save the studio event. Check Firestore permissions and try again.');
        } finally {
            setSavingKey(null);
        }
    };

    const handleEventStatusChange = async (eventId: string, status: StudioEventStatus) => {
        if (!uid) return;
        try {
            await updateStudioEvent(uid, eventId, { status });
            pushFeedback('success', 'Event status updated.');
        } catch (error) {
            console.error('Failed to update studio event:', error);
            pushFeedback('error', 'Could not update the event status.');
        }
    };

    const handleAddMilestone = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!uid) return;

        const amount = Number(milestoneForm.amount);
        const relatedEvent = studioEventMap[milestoneForm.eventId];
        if (!relatedEvent || !milestoneForm.title.trim() || !amount) {
            pushFeedback('error', 'Pick an event and add a milestone title and amount.');
            return;
        }

        setSavingKey('milestone');
        try {
            await addStudioMilestone(uid, {
                eventId: milestoneForm.eventId,
                eventName: relatedEvent.packageName,
                clientName: relatedEvent.clientName,
                title: milestoneForm.title.trim(),
                amount,
                dueDate: milestoneForm.dueDate,
                status: 'unpaid',
                paymentLink: milestoneForm.paymentLink.trim(),
                notes: milestoneForm.notes.trim(),
            });

            setMilestoneForm((current) => ({
                ...current,
                title: 'Album Delivery',
                amount: '',
                dueDate: todayIso(),
                paymentLink: '',
                notes: '',
            }));
            setShowMilestoneForm(false);
            pushFeedback('success', 'Milestone saved and ready for follow-up.');
        } catch (error) {
            console.error('Failed to add studio milestone:', error);
            pushFeedback('error', 'Could not save the milestone.');
        } finally {
            setSavingKey(null);
        }
    };

    const handleMarkMilestonePaid = async (milestone: StudioMilestone) => {
        if (!uid || !milestone.id) return;

        setSavingKey(`milestone-${milestone.id}`);
        try {
            await updateStudioMilestone(uid, milestone.id, {
                status: 'paid',
                paidDate: todayIso(),
            });

            await addTransaction(uid, {
                date: todayIso(),
                amount_cents: toCents(milestone.amount),
                type: 'income',
                status: 'cleared',
                source: 'manual_entry',
                vendor: `${milestone.clientName} • ${milestone.title}`,
                category_id: '',
                category_name: 'Studio milestone payment',
                description: `${milestone.eventName} — ${milestone.title}`,
                metadata: {
                    studio_event_id: milestone.eventId,
                    studio_milestone_id: milestone.id,
                },
            });

            pushFeedback('success', 'Milestone marked paid and posted into the cash feed.');
        } catch (error) {
            console.error('Failed to mark milestone paid:', error);
            pushFeedback('error', 'Could not mark the milestone as paid.');
        } finally {
            setSavingKey(null);
        }
    };

    const handleAddExpense = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!uid) return;

        const amount = Number(expenseForm.amount);
        const relatedEvent = studioEventMap[expenseForm.eventId];
        if (!relatedEvent || !expenseForm.payeeName.trim() || !amount) {
            pushFeedback('error', 'Pick the event, payee, and amount before logging the payout.');
            return;
        }

        setSavingKey('expense');
        try {
            await addStudioExpense(uid, {
                eventId: expenseForm.eventId,
                eventName: relatedEvent.packageName,
                payeeName: expenseForm.payeeName.trim(),
                amount,
                category: expenseForm.category,
                date: expenseForm.date,
                notes: expenseForm.notes.trim(),
            });

            await addTransaction(uid, {
                date: expenseForm.date,
                amount_cents: toCents(amount),
                type: 'expense',
                status: 'cleared',
                source: 'manual_entry',
                vendor: expenseForm.payeeName.trim(),
                category_id: '',
                category_name: expenseForm.category.replace('_', ' '),
                description: `${relatedEvent.packageName} — ${expenseForm.payeeName.trim()}`,
                metadata: {
                    studio_event_id: expenseForm.eventId,
                    studio_category: expenseForm.category,
                },
            });

            setExpenseForm((current) => ({
                ...current,
                payeeName: '',
                amount: '',
                date: todayIso(),
                notes: '',
            }));
            setShowExpenseForm(false);
            pushFeedback('success', 'Crew or vendor payout logged to Firestore and accounting.');
        } catch (error) {
            console.error('Failed to add studio expense:', error);
            pushFeedback('error', 'Could not log the payout.');
        } finally {
            setSavingKey(null);
        }
    };

    const handleAddAsset = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!uid) return;

        const purchasePrice = Number(assetForm.purchasePrice);
        if (!assetForm.itemName.trim() || !purchasePrice) {
            pushFeedback('error', 'Add the gear name and purchase value before saving.');
            return;
        }

        if (subscriptionState.isFree && assetLimitReached) {
            setUpgradePromptFeature('gear');
            setActiveNav('subscription');
            pushFeedback('info', 'Free Solo Photographer includes one main gear setup. Upgrade for an unlimited vault.');
            return;
        }

        setSavingKey('asset');
        try {
            await addStudioAsset(uid, {
                itemName: assetForm.itemName.trim(),
                purchaseDate: assetForm.purchaseDate,
                purchasePrice,
                category: assetForm.category,
                receiptImageUrl: assetForm.receiptImageUrl.trim(),
                notes: assetForm.notes.trim(),
            });

            await addTransaction(uid, {
                date: assetForm.purchaseDate,
                amount_cents: toCents(purchasePrice),
                type: 'expense',
                status: 'cleared',
                source: 'manual_entry',
                vendor: 'Capital asset purchase',
                category_id: '',
                category_name: 'Camera & gear asset',
                description: assetForm.itemName.trim(),
                metadata: {
                    is_capital_item: true,
                    studio_asset_category: assetForm.category,
                },
            });

            setAssetForm({
                itemName: '',
                purchaseDate: todayIso(),
                purchasePrice: '',
                category: 'camera_gear',
                receiptImageUrl: '',
                notes: '',
            });
            setShowAssetForm(false);
            pushFeedback('success', 'Gear asset stored and linked to the accounting feed.');
        } catch (error) {
            console.error('Failed to add studio asset:', error);
            pushFeedback('error', 'Could not save the gear asset.');
        } finally {
            setSavingKey(null);
        }
    };

    const handleSaveDraft = async (type: StudioAiDraftType) => {
        if (!uid) return;

        if (!draftForm.title.trim() || !draftForm.prompt.trim()) {
            pushFeedback('error', 'Add a title and prompt before saving the draft.');
            return;
        }

        const relatedEvent = studioEventMap[draftForm.relatedEventId];
        let result = '';
        if (type === 'contract') {
            result = buildContractPreview(draftForm.title.trim(), draftForm.prompt.trim(), relatedEvent?.clientName);
        } else if (type === 'voice') {
            result = buildVoicePreview(draftForm.prompt.trim());
        } else {
            result = buildDiplomatPreview(draftForm.title.trim(), draftForm.prompt.trim(), relatedEvent?.clientName);
        }

        setSavingKey(`draft-${type}`);
        try {
            await addStudioAiDraft(uid, {
                type,
                title: draftForm.title.trim(),
                prompt: draftForm.prompt.trim(),
                result,
                relatedEventId: relatedEvent?.id,
                relatedEventName: relatedEvent?.clientName,
                tokenCost: aiDraftCosts[type],
            });

            setDraftForm({
                title: '',
                prompt: '',
                relatedEventId: studioEvents[0]?.id || '',
            });
            setShowDraftForm(null);
            pushFeedback('success', `${type === 'contract' ? 'Contract' : type === 'voice' ? 'Shot-list' : 'Client'} draft saved to Firestore.`);
        } catch (error) {
            console.error('Failed to save AI draft:', error);
            pushFeedback('error', 'Could not save the draft. Paid studio features require an active Pro plan.');
        } finally {
            setSavingKey(null);
        }
    };

    const renderFeedback = () => {
        if (!feedback) return null;
        const color = feedback.type === 'success' ? '#16a34a' : feedback.type === 'error' ? '#dc2626' : '#b45309';
        const background = feedback.type === 'success' ? 'rgba(22,163,74,0.08)' : feedback.type === 'error' ? 'rgba(220,38,38,0.08)' : 'rgba(180,83,9,0.08)';

        return (
            <div style={{
                ...shellCard,
                padding: '12px 14px',
                marginBottom: 14,
                borderColor: `${color}22`,
                background,
                color,
                fontSize: 13.5,
                fontWeight: 700,
            }}>
                {feedback.text}
            </div>
        );
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
                            onClick={() => handleGatedNavChange(item.id)}
                            style={{
                                border: 'none',
                                borderRadius: 999,
                                padding: '9px 14px',
                                whiteSpace: 'nowrap',
                                background: active ? 'linear-gradient(135deg, #b45309, #78350f)' : item.locked ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.92)',
                                color: active ? '#fff' : item.locked ? '#b45309' : '#57534e',
                                boxShadow: active ? '0 10px 22px rgba(180,83,9,0.24)' : 'inset 0 0 0 1px rgba(231,229,228,0.95)',
                                fontSize: 12.5,
                                fontWeight: active ? 700 : 600,
                                minHeight: 38,
                                cursor: 'pointer',
                            }}
                        >
                            {item.locked ? '🔒' : item.icon} {item.label}
                            {item.locked && <span style={{ marginLeft: 5, fontSize: 9, fontWeight: 800 }}>{item.tierBadge}</span>}
                        </button>
                    );
                })}
            </div>
        );
    };

    const ActionButton = ({
        icon,
        label,
        accent,
        onClick,
    }: {
        icon: string;
        label: string;
        accent: string;
        onClick: () => void;
    }) => (
        <button
            onClick={onClick}
            style={{
                border: '1px solid rgba(231,229,228,0.92)',
                background: 'rgba(255,255,255,0.95)',
                borderRadius: 18,
                padding: isCompactMobile ? '14px 12px' : '16px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 8,
                cursor: 'pointer',
                minHeight: isCompactMobile ? 88 : 100,
                boxShadow: '0 8px 18px rgba(28,25,23,0.04)',
            }}
        >
            <div style={{
                width: 38,
                height: 38,
                borderRadius: 14,
                background: `${accent}18`,
                color: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
            }}>
                {icon}
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1c1917', letterSpacing: '-0.01em' }}>{label}</div>
        </button>
    );

    const renderEventForm = () => {
        if (!showEventForm) return null;
        return (
            <form onSubmit={handleAddEvent} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>New event folio</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    <div>
                        <label style={labelStyle}>Client</label>
                        <input style={inputStyle} value={eventForm.clientName} onChange={(e) => setEventForm((current) => ({ ...current, clientName: e.target.value }))} placeholder="Perera Wedding" />
                    </div>
                    <div>
                        <label style={labelStyle}>Package name</label>
                        <input style={inputStyle} value={eventForm.packageName} onChange={(e) => setEventForm((current) => ({ ...current, packageName: e.target.value }))} placeholder="Cinematic wedding package" />
                    </div>
                    <div>
                        <label style={labelStyle}>Event date</label>
                        <input type="date" style={inputStyle} value={eventForm.eventDate} onChange={(e) => setEventForm((current) => ({ ...current, eventDate: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Start time</label>
                        <input type="time" style={inputStyle} value={eventForm.startTime} onChange={(e) => setEventForm((current) => ({ ...current, startTime: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Location</label>
                        <input style={inputStyle} value={eventForm.location} onChange={(e) => setEventForm((current) => ({ ...current, location: e.target.value }))} placeholder="Colombo 07 • Church + ballroom" />
                    </div>
                    <div>
                        <label style={labelStyle}>Package value</label>
                        <input type="number" style={inputStyle} value={eventForm.totalValue} onChange={(e) => setEventForm((current) => ({ ...current, totalValue: e.target.value }))} placeholder="800000" />
                    </div>
                    <div>
                        <label style={labelStyle}>Shoot type</label>
                        <input style={inputStyle} value={eventForm.shootType} onChange={(e) => setEventForm((current) => ({ ...current, shootType: e.target.value }))} placeholder="Wedding / Commercial / Homecoming" />
                    </div>
                    <div>
                        <label style={labelStyle}>Status</label>
                        <select style={inputStyle} value={eventForm.status} onChange={(e) => setEventForm((current) => ({ ...current, status: e.target.value as StudioEventStatus }))}>
                            {statusOptions.map((status) => <option key={status} value={status}>{normalizeStatusLabel(status)}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea style={textareaStyle} value={eventForm.notes} onChange={(e) => setEventForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Coverage notes, venue access, or team instructions" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button type="button" style={secondaryButton} onClick={() => setShowEventForm(false)}>Cancel</button>
                    <button type="submit" style={{ ...secondaryButton, background: 'linear-gradient(135deg, #b45309, #7c2d12)', color: '#fff', borderColor: 'transparent' }}>
                        {savingKey === 'event' ? 'Saving...' : 'Save Event'}
                    </button>
                </div>
            </form>
        );
    };

    const renderMilestoneForm = () => {
        if (!showMilestoneForm) return null;
        return (
            <form onSubmit={handleAddMilestone} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Milestone billing</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    <div>
                        <label style={labelStyle}>Event</label>
                        <select style={inputStyle} value={milestoneForm.eventId} onChange={(e) => setMilestoneForm((current) => ({ ...current, eventId: e.target.value }))}>
                            {studioEvents.map((event) => <option key={event.id} value={event.id}>{event.clientName} • {event.packageName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Milestone title</label>
                        <input style={inputStyle} value={milestoneForm.title} onChange={(e) => setMilestoneForm((current) => ({ ...current, title: e.target.value }))} placeholder="Shoot day / Album delivery" />
                    </div>
                    <div>
                        <label style={labelStyle}>Amount</label>
                        <input type="number" style={inputStyle} value={milestoneForm.amount} onChange={(e) => setMilestoneForm((current) => ({ ...current, amount: e.target.value }))} placeholder="320000" />
                    </div>
                    <div>
                        <label style={labelStyle}>Due date</label>
                        <input type="date" style={inputStyle} value={milestoneForm.dueDate} onChange={(e) => setMilestoneForm((current) => ({ ...current, dueDate: e.target.value }))} />
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Payment link</label>
                    <input style={inputStyle} value={milestoneForm.paymentLink} onChange={(e) => setMilestoneForm((current) => ({ ...current, paymentLink: e.target.value }))} placeholder="Secure payment URL" />
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Internal note</label>
                    <textarea style={textareaStyle} value={milestoneForm.notes} onChange={(e) => setMilestoneForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Album held until final clearance, reminder tone, or client context" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button type="button" style={secondaryButton} onClick={() => setShowMilestoneForm(false)}>Cancel</button>
                    <button type="submit" style={{ ...secondaryButton, background: 'linear-gradient(135deg, #b45309, #7c2d12)', color: '#fff', borderColor: 'transparent' }}>
                        {savingKey === 'milestone' ? 'Saving...' : 'Save Milestone'}
                    </button>
                </div>
            </form>
        );
    };

    const renderExpenseForm = () => {
        if (!showExpenseForm) return null;
        return (
            <form onSubmit={handleAddExpense} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Crew and lab payout</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    <div>
                        <label style={labelStyle}>Event</label>
                        <select style={inputStyle} value={expenseForm.eventId} onChange={(e) => setExpenseForm((current) => ({ ...current, eventId: e.target.value }))}>
                            {studioEvents.map((event) => <option key={event.id} value={event.id}>{event.clientName} • {event.packageName}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Payee</label>
                        <input style={inputStyle} value={expenseForm.payeeName} onChange={(e) => setExpenseForm((current) => ({ ...current, payeeName: e.target.value }))} placeholder="Drone operator / Seya Colour" />
                    </div>
                    <div>
                        <label style={labelStyle}>Amount</label>
                        <input type="number" style={inputStyle} value={expenseForm.amount} onChange={(e) => setExpenseForm((current) => ({ ...current, amount: e.target.value }))} placeholder="25000" />
                    </div>
                    <div>
                        <label style={labelStyle}>Category</label>
                        <select style={inputStyle} value={expenseForm.category} onChange={(e) => setExpenseForm((current) => ({ ...current, category: e.target.value as StudioExpenseCategory }))}>
                            {expenseCategoryOptions.map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={labelStyle}>Date</label>
                        <input type="date" style={inputStyle} value={expenseForm.date} onChange={(e) => setExpenseForm((current) => ({ ...current, date: e.target.value }))} />
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Note</label>
                    <textarea style={textareaStyle} value={expenseForm.notes} onChange={(e) => setExpenseForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Who was paid, what was delivered, and whether cash or transfer cleared" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button type="button" style={secondaryButton} onClick={() => setShowExpenseForm(false)}>Cancel</button>
                    <button type="submit" style={{ ...secondaryButton, background: 'linear-gradient(135deg, #b45309, #7c2d12)', color: '#fff', borderColor: 'transparent' }}>
                        {savingKey === 'expense' ? 'Saving...' : 'Log Payout'}
                    </button>
                </div>
            </form>
        );
    };

    const renderAssetForm = () => {
        if (!showAssetForm) return null;
        return (
            <form onSubmit={handleAddAsset} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Gear vault</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    <div>
                        <label style={labelStyle}>Asset name</label>
                        <input style={inputStyle} value={assetForm.itemName} onChange={(e) => setAssetForm((current) => ({ ...current, itemName: e.target.value }))} placeholder="Sony A7 IV body" />
                    </div>
                    <div>
                        <label style={labelStyle}>Purchase value</label>
                        <input type="number" style={inputStyle} value={assetForm.purchasePrice} onChange={(e) => setAssetForm((current) => ({ ...current, purchasePrice: e.target.value }))} placeholder="1200000" />
                    </div>
                    <div>
                        <label style={labelStyle}>Purchase date</label>
                        <input type="date" style={inputStyle} value={assetForm.purchaseDate} onChange={(e) => setAssetForm((current) => ({ ...current, purchaseDate: e.target.value }))} />
                    </div>
                    <div>
                        <label style={labelStyle}>Category</label>
                        <select style={inputStyle} value={assetForm.category} onChange={(e) => setAssetForm((current) => ({ ...current, category: e.target.value as StudioAssetCategory }))}>
                            {assetCategoryOptions.map((category) => <option key={category} value={category}>{category.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Receipt image URL</label>
                    <input style={inputStyle} value={assetForm.receiptImageUrl} onChange={(e) => setAssetForm((current) => ({ ...current, receiptImageUrl: e.target.value }))} placeholder="Storage URL or uploaded receipt path" />
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Notes</label>
                    <textarea style={textareaStyle} value={assetForm.notes} onChange={(e) => setAssetForm((current) => ({ ...current, notes: e.target.value }))} placeholder="Serial, seller, warranty, or planned tax treatment" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                    <button type="button" style={secondaryButton} onClick={() => setShowAssetForm(false)}>Cancel</button>
                    <button type="submit" style={{ ...secondaryButton, background: 'linear-gradient(135deg, #b45309, #7c2d12)', color: '#fff', borderColor: 'transparent' }}>
                        {savingKey === 'asset' ? 'Saving...' : 'Save Asset'}
                    </button>
                </div>
            </form>
        );
    };

    const renderDraftComposer = (type: StudioAiDraftType, title: string, placeholder: string) => {
        if (showDraftForm !== type) return null;
        return (
            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>{title}</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    <div>
                        <label style={labelStyle}>Draft title</label>
                        <input style={inputStyle} value={draftForm.title} onChange={(e) => setDraftForm((current) => ({ ...current, title: e.target.value }))} placeholder={title} />
                    </div>
                    <div>
                        <label style={labelStyle}>Event</label>
                        <select style={inputStyle} value={draftForm.relatedEventId} onChange={(e) => setDraftForm((current) => ({ ...current, relatedEventId: e.target.value }))}>
                            <option value="">General studio draft</option>
                            {studioEvents.map((event) => <option key={event.id} value={event.id}>{event.clientName} • {event.packageName}</option>)}
                        </select>
                    </div>
                </div>
                <div style={{ marginTop: 12 }}>
                    <label style={labelStyle}>Prompt</label>
                    <textarea style={textareaStyle} value={draftForm.prompt} onChange={(e) => setDraftForm((current) => ({ ...current, prompt: e.target.value }))} placeholder={placeholder} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
                    <div style={{ fontSize: 12.5, color: '#78716c' }}>
                        Saved as a Firestore-backed studio draft. Upgrade is enforced before access.
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button type="button" style={secondaryButton} onClick={() => setShowDraftForm(null)}>Cancel</button>
                        <button type="button" style={{ ...secondaryButton, background: 'linear-gradient(135deg, #b45309, #7c2d12)', color: '#fff', borderColor: 'transparent' }} onClick={() => handleSaveDraft(type)}>
                            {savingKey === `draft-${type}` ? 'Saving...' : 'Save Draft'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderOverview = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{
                ...shellCard,
                padding: isCompactMobile ? 18 : 24,
                background: 'linear-gradient(135deg, #1c1917 0%, #292524 62%, #0f172a 100%)',
                color: '#fff',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' }}>
                    <div style={{ maxWidth: 560 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fbbf24', marginBottom: 10 }}>
                            LensTracksy command view
                        </div>
                        <h2 style={{ fontSize: isCompactMobile ? 24 : 32, fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.04, margin: 0 }}>
                            Keep the art premium.
                            <br />
                            Keep the cash disciplined.
                        </h2>
                        <p style={{ margin: '14px 0 0', color: 'rgba(255,255,255,0.72)', fontSize: 14.5, lineHeight: 1.7 }}>
                            Live event folios, payment checkpoints, crew payouts, and depreciation-ready gear now come straight from Firestore instead of static demo cards.
                        </p>
                    </div>
                    <div style={{ minWidth: isCompactMobile ? '100%' : 260, display: 'grid', gap: 10 }}>
                        {[
                            ['Next shoot', latestEventSummary ? `${latestEventSummary.event.clientName} • ${formatShortDate(latestEventSummary.event.eventDate)}` : 'No upcoming folios yet'],
                            ['Cash due now', fmtLkr(outstandingBalance)],
                            ['Plan status', subscriptionState.isFree ? `${activeMonthEvents.length}/3 active shoots` : `${subscriptionState.tier.toUpperCase()} plan active`],
                        ].map(([label, value]) => (
                            <div key={label} style={{
                                padding: '12px 14px',
                                borderRadius: 18,
                                background: 'rgba(255,255,255,0.08)',
                                border: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.62)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>
                                    {label}
                                </div>
                                <div style={{ fontSize: 15, fontWeight: 700, marginTop: 6 }}>{value}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                gap: 12,
            }}>
                {heroKpis.map((kpi) => (
                    <KPICard key={kpi.label} compact={isCompactMobile} {...kpi} />
                ))}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                gap: 12,
            }}>
                <ActionButton icon="💍" label="New event folio" accent="#b45309" onClick={() => setShowEventForm((current) => !current)} />
                <ActionButton icon="💳" label="Milestone queue" accent="#0ea5e9" onClick={() => handleGatedNavChange('milestones')} />
                <ActionButton icon="💸" label="Log payout" accent="#16a34a" onClick={() => { setShowExpenseForm(true); setActiveNav('profit'); }} />
                <ActionButton icon="📸" label="Add gear receipt" accent="#7c3aed" onClick={() => { setShowAssetForm(true); setActiveNav('gear'); }} />
            </div>

            {renderEventForm()}

            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? '1fr' : '1.1fr 0.9fr',
                gap: 16,
            }}>
                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Urgent milestone leaks</div>
                    {urgentMilestones.length === 0 ? (
                        <div style={{ padding: 18, borderRadius: 18, background: '#fafaf9', color: '#78716c', fontSize: 13.5 }}>
                            No unpaid checkpoints right now. Add a milestone to start tracking reminder pressure.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {urgentMilestones.map((item) => (
                                <div key={item.id} style={{
                                    padding: 14,
                                    borderRadius: 18,
                                    background: '#fafaf9',
                                    border: `1px solid ${item.dueDate < todayIso() ? '#ef4444' : '#f59e0b'}24`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.02em' }}>{item.clientName}</div>
                                            <div style={{ fontSize: 13, color: '#57534e', marginTop: 2 }}>{item.title}</div>
                                        </div>
                                        <div style={{ color: item.dueDate < todayIso() ? '#ef4444' : '#f59e0b', fontWeight: 800, fontSize: 12.5 }}>{formatDistanceLabel(item.dueDate)}</div>
                                    </div>
                                    <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginTop: 12 }}>
                                        {fmtLkr(item.amount)}
                                    </div>
                                    <div style={{ fontSize: 12.5, color: '#78716c', marginTop: 8, lineHeight: 1.6 }}>
                                        {item.notes || 'Ready for reminder follow-up or payment confirmation.'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={sectionLabelStyle}>Nekath risk watch</div>
                    {clashWarnings.length === 0 ? (
                        <div style={{ padding: 18, borderRadius: 18, background: '#fafaf9', color: '#78716c', fontSize: 13.5 }}>
                            No date clashes detected yet. Once you load multiple shoots, the calendar will warn about impossible travel or crew overlap.
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: 12 }}>
                            {clashWarnings.map((warning) => (
                                <div key={`${warning.day}-${warning.line}`} style={{
                                    padding: 14,
                                    borderRadius: 18,
                                    background: 'linear-gradient(135deg, rgba(255,250,245,1), rgba(255,255,255,0.96))',
                                    border: `1px solid ${warning.accent}22`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                                        <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917' }}>{warning.day}</div>
                                        <div style={{ fontSize: 12.5, fontWeight: 800, color: warning.accent }}>{warning.status}</div>
                                    </div>
                                    <div style={{ fontSize: 13.5, color: '#44403c', marginTop: 8 }}>{warning.line}</div>
                                    <div style={{ fontSize: 12.5, color: '#78716c', marginTop: 8, lineHeight: 1.6 }}>{warning.recommendation}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <TransactionList title="Studio cash feed" transactions={cashFeed} compact={isCompactMobile} />
        </div>
    );

    const renderEvents = () => (
        <div style={{ display: 'grid', gap: 14 }}>
            {renderEventForm()}
            {!eventSummaries.length && (
                <div style={emptyStateStyle}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💍</div>
                    No studio folios yet. Add your first wedding or commercial job to start tracking cash and delivery pressure.
                </div>
            )}
            {eventSummaries.map((summary) => (
                <div key={summary.event.id} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.03em' }}>{summary.event.clientName}</div>
                            <div style={{ fontSize: 13.5, color: '#78716c', marginTop: 4 }}>
                                {formatShortDate(summary.event.eventDate)} • {summary.event.location}
                            </div>
                            <div style={{ fontSize: 12.5, color: '#a8a29e', marginTop: 4 }}>{summary.event.packageName}</div>
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <div style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                background: `${summary.accent}14`,
                                color: summary.accent,
                                fontSize: 12.5,
                                fontWeight: 800,
                            }}>
                                {summary.statusLabel}
                            </div>
                            <select
                                value={summary.event.status}
                                onChange={(e) => handleEventStatusChange(summary.event.id || '', e.target.value as StudioEventStatus)}
                                style={{ ...inputStyle, padding: '8px 10px', width: 140 }}
                            >
                                {statusOptions.map((status) => <option key={status} value={status}>{normalizeStatusLabel(status)}</option>)}
                            </select>
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                        gap: 12,
                        marginTop: 16,
                    }}>
                        <div style={{ padding: 14, borderRadius: 18, background: '#fafaf9' }}>
                            <div style={{ fontSize: 11.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Package value</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{fmtLkr(summary.event.totalValue)}</div>
                        </div>
                        <div style={{ padding: 14, borderRadius: 18, background: '#fafaf9' }}>
                            <div style={{ fontSize: 11.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Collected</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#16a34a' }}>{fmtLkr(summary.paid)}</div>
                        </div>
                        <div style={{ padding: 14, borderRadius: 18, background: '#fafaf9' }}>
                            <div style={{ fontSize: 11.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Still due</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#dc2626' }}>{fmtLkr(summary.due)}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12.5, color: '#78716c' }}>
                            <span>Collection progress</span>
                            <span>{summary.progress}%</span>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: '#f5f5f4', overflow: 'hidden' }}>
                            <div style={{ width: `${summary.progress}%`, height: '100%', background: 'linear-gradient(90deg, #f59e0b, #b45309)' }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginTop: 16 }}>
                        <button style={secondaryButton} onClick={() => { setExpenseForm((current) => ({ ...current, eventId: summary.event.id || '' })); setShowExpenseForm(true); setActiveNav('profit'); }}>
                            Log payout
                        </button>
                        <button style={secondaryButton} onClick={() => { setMilestoneForm((current) => ({ ...current, eventId: summary.event.id || '' })); handleGatedNavChange('milestones'); setShowMilestoneForm(true); }}>
                            Add milestone
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );

    const renderMilestones = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {renderMilestoneForm()}
            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Reminder engine</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    {[
                        ['3 days before due', 'Queue the due amount, payment link, and client context for your WhatsApp reminder workflow.'],
                        ['Due date morning', 'Keep overdue balances visible before you promise the album handover or final edit.'],
                        ['After payment lands', 'Mark the milestone paid and the dashboard updates the event cash position instantly.'],
                    ].map(([title, detail]) => (
                        <div key={title} style={{ padding: 16, borderRadius: 18, background: '#fafaf9', border: '1px solid rgba(231,229,228,0.9)' }}>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', marginBottom: 8 }}>{title}</div>
                            <div style={{ fontSize: 13, color: '#78716c', lineHeight: 1.65 }}>{detail}</div>
                        </div>
                    ))}
                </div>
            </div>

            {!studioMilestones.length && (
                <div style={emptyStateStyle}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💳</div>
                    No milestones yet. Save advance, shoot-day, and album-delivery checkpoints to make late payments visible.
                </div>
            )}

            {studioMilestones.map((item) => (
                <div key={item.id} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.03em' }}>{item.clientName}</div>
                            <div style={{ fontSize: 13.5, color: '#57534e', marginTop: 4 }}>{item.title}</div>
                            <div style={{ fontSize: 12.5, color: '#a8a29e', marginTop: 4 }}>{item.eventName}</div>
                        </div>
                        <div style={{ textAlign: isCompactMobile ? 'left' : 'right' }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>{fmtLkr(item.amount)}</div>
                            <div style={{ fontSize: 12.5, fontWeight: 800, color: item.status === 'paid' ? '#16a34a' : item.dueDate < todayIso() ? '#ef4444' : '#f59e0b' }}>
                                {item.status === 'paid' ? `Paid ${item.paidDate || ''}`.trim() : formatDistanceLabel(item.dueDate)}
                            </div>
                        </div>
                    </div>
                    <div style={{ marginTop: 12, padding: 14, borderRadius: 18, background: item.status === 'paid' ? 'rgba(22,163,74,0.08)' : `${item.dueDate < todayIso() ? '#ef4444' : '#f59e0b'}10`, color: '#57534e', fontSize: 13.5, lineHeight: 1.65 }}>
                        {item.notes || (item.paymentLink ? `Payment link ready: ${item.paymentLink}` : 'No reminder note yet.')}
                    </div>
                    {item.status !== 'paid' && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                            <button
                                style={{ ...secondaryButton, background: 'linear-gradient(135deg, #16a34a, #15803d)', color: '#fff', borderColor: 'transparent' }}
                                onClick={() => handleMarkMilestonePaid(item)}
                            >
                                {savingKey === `milestone-${item.id}` ? 'Updating...' : 'Mark Paid'}
                            </button>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderProfit = () => {
        const summary = latestEventSummary;
        const gross = summary?.paid || 0;
        const totalExpenses = summary?.totalExpenses || 0;
        const net = summary?.netProfit || 0;
        const margin = summary?.margin || 0;

        return (
            <div style={{ display: 'grid', gap: 16 }}>
                {renderExpenseForm()}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : '0.9fr 1.1fr',
                    gap: 16,
                }}>
                    <div style={{ ...shellCard, padding: isCompactMobile ? 18 : 22 }}>
                        <div style={sectionLabelStyle}>Margin snapshot</div>
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0 16px' }}>
                            <div style={{
                                width: 190,
                                height: 190,
                                borderRadius: '50%',
                                background: `conic-gradient(#16a34a 0 ${Math.max(0, margin)}%, #f59e0b ${Math.max(0, margin)}% 85%, #ef4444 85% 100%)`,
                                display: 'grid',
                                placeItems: 'center',
                            }}>
                                <div style={{
                                    width: 122,
                                    height: 122,
                                    borderRadius: '50%',
                                    background: '#fff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    textAlign: 'center',
                                }}>
                                    <div>
                                        <div style={{ fontSize: 34, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>{margin}%</div>
                                        <div style={{ fontSize: 12.5, color: '#78716c', marginTop: 4 }}>Net margin</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gap: 8 }}>
                            {[
                                ['Collected revenue', fmtLkr(gross), '#0f172a'],
                                ['Crew & lab payouts', fmtLkr(totalExpenses), '#dc2626'],
                                ['True net', fmtLkr(net), '#16a34a'],
                            ].map(([label, value, color]) => (
                                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13.5 }}>
                                    <span style={{ color: '#78716c' }}>{label}</span>
                                    <span style={{ fontWeight: 800, color }}>{value}</span>
                                </div>
                            ))}
                        </div>
                        {summary && (
                            <div style={{ marginTop: 12, fontSize: 12.5, color: '#78716c' }}>
                                Based on {summary.event.clientName} • {summary.event.packageName}
                            </div>
                        )}
                    </div>

                    <div style={{ ...shellCard, padding: isCompactMobile ? 18 : 22 }}>
                        <div style={sectionLabelStyle}>Crew and lab leakage</div>
                        {!payoutLines.length ? (
                            <div style={{ padding: 14, borderRadius: 18, background: '#fafaf9', color: '#78716c', fontSize: 13.5 }}>
                                No crew or vendor payouts logged yet. Add one to reveal real event profit.
                            </div>
                        ) : (
                            <div style={{ display: 'grid', gap: 12 }}>
                                {payoutLines.map((line) => (
                                    <div key={line.id} style={{
                                        padding: 14,
                                        borderRadius: 18,
                                        background: '#fafaf9',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        gap: 12,
                                    }}>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#1c1917' }}>{line.payeeName}</div>
                                            <div style={{ fontSize: 12.5, color: '#78716c', marginTop: 3 }}>{line.category.replace('_', ' ')} • {line.eventName}</div>
                                        </div>
                                        <div style={{ fontSize: 15, fontWeight: 800, color: '#dc2626' }}>
                                            -{fmtLkr(line.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <TransactionList title="Event profit cashflow" transactions={cashFeed} compact={isCompactMobile} />
            </div>
        );
    };

    const renderCalendar = () => (
        <div style={{ display: 'grid', gap: 14 }}>
            {!clashWarnings.length && (
                <div style={emptyStateStyle}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🗓️</div>
                    No Nekath conflicts yet. Add overlapping event folios and the clash detector will flag impossible dates.
                </div>
            )}
            {clashWarnings.map((warning) => (
                <div key={`${warning.day}-${warning.line}`} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 19, fontWeight: 800, color: '#1c1917' }}>{warning.day}</div>
                            <div style={{ fontSize: 13.5, color: '#57534e', marginTop: 4 }}>{warning.line}</div>
                        </div>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            background: `${warning.accent}14`,
                            color: warning.accent,
                            fontWeight: 800,
                            fontSize: 12,
                        }}>
                            {warning.status}
                        </div>
                    </div>
                    <div style={{ marginTop: 14, padding: 14, borderRadius: 18, background: '#fafaf9', color: '#78716c', fontSize: 13.5, lineHeight: 1.65 }}>
                        {warning.recommendation}
                    </div>
                </div>
            ))}
        </div>
    );

    const renderGear = () => (
        <div style={{ display: 'grid', gap: 14 }}>
            {renderAssetForm()}
            {!gearRows.length && (
                <div style={emptyStateStyle}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📸</div>
                    No gear assets saved yet. Add cameras, drones, and edit rigs so depreciation is no longer lost at tax time.
                </div>
            )}
            {gearRows.map((asset) => (
                <div key={asset.id} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.03em' }}>{asset.itemName}</div>
                            <div style={{ fontSize: 13.5, color: '#57534e', marginTop: 4 }}>{asset.category.replace('_', ' ')} • Purchased {asset.purchaseDate}</div>
                        </div>
                        <div style={{
                            padding: '8px 12px',
                            borderRadius: 999,
                            background: 'rgba(22,163,74,0.12)',
                            color: '#15803d',
                            fontWeight: 800,
                            fontSize: 12,
                        }}>
                            {asset.life}
                        </div>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                        gap: 12,
                        marginTop: 14,
                    }}>
                        <div style={{ padding: 14, borderRadius: 18, background: '#fafaf9' }}>
                            <div style={{ fontSize: 11.5, color: '#78716c', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Purchase cost</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8 }}>{fmtLkr(asset.purchasePrice)}</div>
                        </div>
                        <div style={{ padding: 14, borderRadius: 18, background: 'rgba(22,163,74,0.08)' }}>
                            <div style={{ fontSize: 11.5, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 800 }}>Annual deduction</div>
                            <div style={{ fontSize: 24, fontWeight: 800, marginTop: 8, color: '#166534' }}>{fmtLkr(asset.deduction)}</div>
                        </div>
                    </div>
                    {asset.receiptImageUrl && (
                        <div style={{ marginTop: 12, fontSize: 12.5, color: '#78716c' }}>
                            Receipt: {asset.receiptImageUrl}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    const renderTax = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: isCompactMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(4, minmax(0, 1fr))',
                gap: 12,
            }}>
                <KPICard icon="🧾" label="Annual depreciation total" value={fmtLkr(annualDepreciationTotal)} change={`${new Date().getFullYear()} tax year`} color="#b45309" compact={isCompactMobile} />
                <KPICard icon="📉" label="Taxable income reduced" value={fmtLkr(annualDepreciationTotal)} change="Legal capital-asset deduction" color="#0ea5e9" compact={isCompactMobile} />
                <KPICard icon="💼" label="Capital assets active" value={`${studioAssets.length} item${studioAssets.length === 1 ? '' : 's'}`} change={studioAssets.length ? 'Receipt-backed vault' : 'No gear yet'} color="#16a34a" compact={isCompactMobile} />
                <KPICard icon="📦" label="Receipt health" value={studioAssets.length ? `${studioAssets.filter((item) => item.receiptImageUrl).length}/${studioAssets.length}` : '0'} change="Assets with proof" color="#7c3aed" compact={isCompactMobile} />
            </div>

            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Studio tax shield board</div>
                <div style={{ display: 'grid', gap: 12 }}>
                    {gearRows.length ? gearRows.map((asset) => (
                        <div key={asset.id} style={{
                            padding: 14,
                            borderRadius: 18,
                            background: '#fafaf9',
                            color: '#57534e',
                            fontSize: 13.5,
                            lineHeight: 1.7,
                        }}>
                            <strong style={{ color: '#1c1917' }}>{asset.itemName}</strong> contributes {fmtLkr(asset.deduction)} in annual depreciation while it remains inside the five-year cycle.
                        </div>
                    )) : (
                        <div style={{
                            padding: 14,
                            borderRadius: 18,
                            background: '#fafaf9',
                            color: '#57534e',
                            fontSize: 13.5,
                            lineHeight: 1.7,
                        }}>
                            Save at least one camera, drone, or edit rig in the Gear Vault to start building the annual depreciation shield.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDraftHistory = (type: StudioAiDraftType, drafts: StudioAiDraft[]) => {
        if (!drafts.length) {
            return (
                <div style={{ padding: 18, borderRadius: 18, background: '#fafaf9', color: '#78716c', fontSize: 13.5 }}>
                    No saved drafts yet. Use the composer above to generate and store a live studio draft instead of relying on placeholder examples.
                </div>
            );
        }

        return (
            <div style={{ display: 'grid', gap: 14 }}>
                {drafts.map((draft) => (
                    <div key={draft.id} style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                            <div>
                                <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1917' }}>{draft.title}</div>
                                <div style={{ fontSize: 12.5, color: '#78716c', marginTop: 4 }}>
                                    {draft.relatedEventName || 'General studio draft'} • {type.toUpperCase()}
                                </div>
                            </div>
                            <div style={{
                                padding: '8px 12px',
                                borderRadius: 999,
                                background: 'rgba(124,58,237,0.12)',
                                color: '#7c3aed',
                                fontWeight: 800,
                                fontSize: 12,
                            }}>
                                {draft.tokenCost} token{draft.tokenCost === 1 ? '' : 's'}
                            </div>
                        </div>
                        <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: '#fafaf9', color: '#44403c', fontSize: 13.5, lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>
                            {draft.result}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    const renderContracts = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {renderDraftComposer('contract', 'Contract builder', 'Perera Wedding on 12th May. Total LKR 500k. Non-refundable advance 100k. Max 2 revisions. Meals by client. RAW files excluded.')}
            <div style={{ ...shellCard, padding: isCompactMobile ? 16 : 20 }}>
                <div style={sectionLabelStyle}>Protected scope clauses</div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isCompactMobile ? '1fr' : 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                }}>
                    {[
                        ['Non-refundable advance', 'Protect booking commitment before prep begins.'],
                        ['Revision cap', 'Stop endless album revision loops from killing the schedule.'],
                        ['RAW file clause', 'Set clean boundaries around editing and deliverables.'],
                    ].map(([title, detail]) => (
                        <div key={title} style={{ padding: 18, borderRadius: 18, background: '#fafaf9', border: '1px solid rgba(231,229,228,0.92)' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1c1917', marginBottom: 8 }}>{title}</div>
                            <div style={{ fontSize: 13.5, color: '#78716c', lineHeight: 1.65 }}>{detail}</div>
                        </div>
                    ))}
                </div>
            </div>
            {renderDraftHistory('contract', draftGroups.contract)}
        </div>
    );

    const renderVoice = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {renderDraftComposer('voice', 'Voice decoder', 'Bride side after church exit, cousins before lunch, rings with flowers, car shot, office team during reception')}
            {renderDraftHistory('voice', draftGroups.voice)}
        </div>
    );

    const renderDiplomat = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {renderDraftComposer('diplomat', 'Client diplomat', 'Album printing is delayed by the press. We need a message that keeps the studio premium while resetting expectations politely.')}
            {renderDraftHistory('diplomat', draftGroups.diplomat)}
        </div>
    );

    const renderUpgradeBanner = () => {
        if (!upgradePromptFeature) return null;
        const tierInfo = getFeatureTierInfo(upgradePromptFeature, 'studios');
        const lockedItem = navItems.find((item) => item.id === upgradePromptFeature);
        if (!tierInfo || !proTier) return null;

        return (
            <div style={{
                ...shellCard,
                padding: isCompactMobile ? 16 : 20,
                background: 'linear-gradient(135deg, rgba(180,83,9,0.12), rgba(124,58,237,0.08))',
                borderColor: 'rgba(180,83,9,0.18)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#b45309' }}>
                            {tierInfo.badge} required
                        </div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1c1917', marginTop: 6 }}>{lockedItem?.label || activeNavItem.label}</div>
                        <div style={{ fontSize: 14, color: '#57534e', marginTop: 8, lineHeight: 1.7 }}>{tierInfo.upgradePrompt}</div>
                    </div>
                    <div style={{ minWidth: 220 }}>
                        <div style={{ fontSize: 13, color: '#78716c' }}>Recommended plan</div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1917', marginTop: 4 }}>{proTier.name}</div>
                        <div style={{ fontSize: 14, color: '#57534e', marginTop: 6 }}>LKR {proTier.monthlyPrice.toLocaleString('en-LK')} / month</div>
                    </div>
                </div>
            </div>
        );
    };

    const renderSubscription = () => (
        <div style={{ display: 'grid', gap: 16 }}>
            {renderUpgradeBanner()}
            <SubscriptionManager />
        </div>
    );

    const content = (() => {
        switch (activeNav as StudiosNavId) {
            case 'events':
                return renderEvents();
            case 'milestones':
                return renderMilestones();
            case 'profit':
                return renderProfit();
            case 'calendar':
                return renderCalendar();
            case 'gear':
                return renderGear();
            case 'tax':
                return renderTax();
            case 'contracts':
                return renderContracts();
            case 'voice':
                return renderVoice();
            case 'diplomat':
                return renderDiplomat();
            case 'subscription':
                return renderSubscription();
            case 'overview':
            default:
                return renderOverview();
        }
    })();

    return (
        <DashboardLayout
            profession="studios"
            professionLabel="LensTracksy"
            professionIcon="📸"
            userName={userName}
            navItems={gatedNavItems}
            activeNav={activeNav}
            onNavChange={handleGatedNavChange}
            onChangeProfession={onChangeProfession}
            onLogout={onLogout}
            mobileShell={{
                enabled: true,
                tabs: mobileTabs,
                activeTab: activeMobileTab,
                onTabChange: handleMobileTabChange,
                activeTitle: activeNavItem.label,
                activeSubtitle: sectionSubtitles[activeNav as StudiosNavId],
                accentColor: '#b45309',
                activeTabBackground: 'linear-gradient(135deg, rgba(180,83,9,0.18), rgba(120,53,15,0.12))',
                background: 'linear-gradient(180deg, #fffaf5 0%, #fafaf9 42%, #ffffff 100%)',
                headerBackground: 'rgba(255,250,245,0.92)',
                navBackground: 'rgba(255,255,255,0.96)',
                subtitleColor: '#78716c',
            }}
        >
            {renderFeedback()}
            {renderMobileSectionNav()}
            {content}
            {isCompactMobile && activeNav !== 'subscription' && (
                <button
                    onClick={() => handleGatedNavChange('voice')}
                    style={{
                        position: 'fixed',
                        right: 16,
                        bottom: 'calc(var(--safe-area-bottom) + 88px)',
                        zIndex: 145,
                        border: 'none',
                        borderRadius: 999,
                        padding: '14px 16px',
                        background: 'linear-gradient(135deg, #b45309, #7c2d12)',
                        color: '#fff',
                        boxShadow: '0 16px 30px rgba(180,83,9,0.28)',
                        fontWeight: 800,
                        fontSize: 13,
                        cursor: 'pointer',
                    }}
                >
                    🎙 Voice drafts
                </button>
            )}
        </DashboardLayout>
    );
};

export default StudiosDashboard;
