import { ProfessionType } from '../contexts/AuthContext';

export interface ProfessionRouteConfig {
    slug: string;
    profession: ProfessionType;
    name: string;
    shortName: string;
    icon: string;
    themeColor: string;
    description: string;
    dedicatedPwa?: boolean;
}

export const PROFESSION_ROUTES: ProfessionRouteConfig[] = [
    {
        slug: 'medical',
        profession: 'medical',
        name: 'MyTracksy Doctor',
        shortName: 'Dr Tracksy',
        icon: '🩺',
        themeColor: '#0ea5e9',
        description: 'Doctor\'s personal assistant — Schedule, prescriptions, voice notes',
        dedicatedPwa: true,
    },
    {
        slug: 'legal',
        profession: 'legal',
        name: 'LexTracksy',
        shortName: 'LexTracksy',
        icon: '⚖️',
        themeColor: '#0f172a',
        description: 'AI-Powered Legal Practice Management for Sri Lankan Attorneys-at-Law',
        dedicatedPwa: true,
    },
    {
        slug: 'engineering',
        profession: 'engineering',
        name: 'MyTracksy Engineer',
        shortName: 'Eng Tracksy',
        icon: '⚙️',
        themeColor: '#f59e0b',
        description: 'Engineering project tracking — Projects, budgets, site logs',
    },
    {
        slug: 'business',
        profession: 'business',
        name: 'MyTracksy Business',
        shortName: 'Biz Tracksy',
        icon: '💼',
        themeColor: '#10b981',
        description: 'Business management — Multi-company, invoicing, analytics',
    },
    {
        slug: 'individual',
        profession: 'individual',
        name: 'MyTracksy Personal',
        shortName: 'My Tracksy',
        icon: '👤',
        themeColor: '#8b5cf6',
        description: 'Personal finance — Expenses, savings, budget goals',
    },
    {
        slug: 'trading',
        profession: 'trading',
        name: 'MyTracksy Trader',
        shortName: 'Trade Tracksy',
        icon: '📈',
        themeColor: '#ef4444',
        description: 'Trading & inventory — Buy/sell tracking, profit margins',
    },
    {
        slug: 'automotive',
        profession: 'automotive',
        name: 'MyTracksy Auto',
        shortName: 'Auto Tracksy',
        icon: '🚗',
        themeColor: '#64748b',
        description: 'Automotive workshop — Service jobs, parts, billing',
    },
    {
        slug: 'marketing',
        profession: 'marketing',
        name: 'MyTracksy Marketing',
        shortName: 'Mkt Tracksy',
        icon: '📣',
        themeColor: '#ec4899',
        description: 'Marketing agency — Campaigns, clients, ROI tracking',
    },
    {
        slug: 'travel',
        profession: 'travel',
        name: 'MyTracksy Travel',
        shortName: 'Travel Tracksy',
        icon: '✈️',
        themeColor: '#06b6d4',
        description: 'Travel agency — Bookings, commissions, tour packages',
    },
    {
        slug: 'transportation',
        profession: 'transportation',
        name: 'MyTracksy Transport',
        shortName: 'Trans Tracksy',
        icon: '🚚',
        themeColor: '#d97706',
        description: 'Fleet management — Trips, fuel, driver tracking',
    },
    {
        slug: 'retail',
        profession: 'retail',
        name: 'MyTracksy Retail',
        shortName: 'Retail Tracksy',
        icon: '🏪',
        themeColor: '#16a34a',
        description: 'Retail shop — POS, inventory, supplier management',
    },
    {
        slug: 'aquaculture',
        profession: 'aquaculture',
        name: 'MyTracksy Aqua',
        shortName: 'Aqua Tracksy',
        icon: '🐟',
        themeColor: '#0284c7',
        description: 'Aquaculture — Pond management, harvest tracking, feed logs',
    },
    {
        slug: 'creator',
        profession: 'creator',
        name: 'MyTracksy Creator',
        shortName: 'Creator Tracksy',
        icon: '🎥',
        themeColor: '#facc15',
        description: 'Digital Creator — Foreign income tracking, 5% tax calculator, sponsorships',
    },
];

/** Get route config by URL slug */
export function getRouteBySlug(slug: string): ProfessionRouteConfig | undefined {
    return PROFESSION_ROUTES.find(r => r.slug === slug);
}

/** Get route config by profession type */
export function getRouteByProfession(profession: ProfessionType): ProfessionRouteConfig | undefined {
    return PROFESSION_ROUTES.find(r => r.profession === profession);
}

/** Get slug from current URL path */
export function getSlugFromPath(): string | null {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!path) return null;
    const route = PROFESSION_ROUTES.find(r => r.slug === path);
    return route ? route.slug : null;
}
