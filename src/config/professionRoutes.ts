import { ProfessionType } from '../types/profession';

export interface ProfessionRouteConfig {
    slug: string;
    profession: ProfessionType;
    name: string;
    shortName: string;
    icon: string;
    themeColor: string;
    description: string;
    dedicatedPwa?: boolean;
    manifestPath?: string;
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
        manifestPath: '/medical.webmanifest',
    },
    {
        slug: 'legal',
        profession: 'legal',
        name: 'LexTracksy',
        shortName: 'LexTracksy',
        icon: '⚖️',
        themeColor: '#0f172a',
        description: 'AI-Powered Legal Practice Management for Sri Lankan Attorneys-at-Law',
    },
    {
        slug: 'engineering',
        profession: 'engineering',
        name: 'EngiTracksy',
        shortName: 'EngiTracksy',
        icon: '🏗️',
        themeColor: '#f97316',
        description: 'AI-Powered Project Financial Management for Civil, Mechanical & Electrical Engineers',
    },
    {
        slug: 'business',
        profession: 'business',
        name: 'MyTracksy Business',
        shortName: 'Biz Tracksy',
        icon: '💼',
        themeColor: '#10b981',
        description: 'Business management — Multi-company, invoicing, analytics',
        dedicatedPwa: true,
        manifestPath: '/business.webmanifest',
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
        slug: 'tourism',
        profession: 'tourism',
        name: 'MyTracksy Tourism',
        shortName: 'Tour Tracksy',
        icon: '✈️', // Reusing travel icon, or could be a new one like 🗺️
        themeColor: '#4f46e5', // Indigo from the instruction
        description: 'Tourism agency — Bookings, commissions, tour packages, multi-currency wallets',
        dedicatedPwa: true,
        manifestPath: '/tourism.webmanifest',
    },
    {
        slug: 'creator',
        profession: 'creator',
        name: 'MyTracksy Creator',
        shortName: 'Creator Tracksy',
        icon: '🎥',
        themeColor: '#a855f7',
        description: 'Digital Creator — Foreign income tracking, 5% tax calculator, sponsorships',
        dedicatedPwa: true,
        manifestPath: '/creator.webmanifest',
    },
    {
        slug: 'studios',
        profession: 'studios',
        name: 'LensTracksy',
        shortName: 'LensTracksy',
        icon: '📸',
        themeColor: '#b45309',
        description: 'Wedding studio finance OS — events, milestones, gear vault, AI client workflows',
        dedicatedPwa: true,
        manifestPath: '/studios.webmanifest',
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

/** Shorthand slug aliases → canonical slug mapping */
export const SLUG_ALIASES: Record<string, string> = {
    // Common aliases mapping to primary slugs
    tutor: 'education',
    doctor: 'medical',
    nurse: 'medical',
    construction: 'engineering',
    plumber: 'engineering',
    influencer: 'creator',
    youtuber: 'creator',
    blogger: 'creator',
    photographer: 'studios',
    photography: 'studios',
    studio: 'studios',
    studios: 'studios',
    wedding: 'studios',
    lawyer: 'legal',
    attorney: 'legal',
    consultant: 'business',
    'small-business': 'business',
    fish: 'aquaculture',
    shrimp: 'aquaculture',
    crab: 'aquaculture',
    farmer: 'aquaculture',
    tourism: 'tourism',
    travel: 'tourism',
    guide: 'tourism',
    agency: 'tourism'
};

/** Get slug from current URL path (supports shorthand aliases) */
export function getSlugFromPath(): string | null {
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!path) return null;
    // Extract first segment only (e.g. /medical/income → 'medical')
    const firstSegment = path.split('/')[0];
    // Check direct match first
    const directRoute = PROFESSION_ROUTES.find(r => r.slug === firstSegment);
    if (directRoute) return directRoute.slug;
    // Check shorthand alias
    const canonical = SLUG_ALIASES[firstSegment];
    if (canonical) return canonical;
    return null;
}

/** Extract the sub-path (nav section) from the URL: /medical/income → 'income' */
export function getSubPathFromURL(): string | null {
    const parts = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase().split('/');
    return parts[1] || null;
}
