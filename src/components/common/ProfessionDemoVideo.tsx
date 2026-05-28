import React from 'react';

export interface ProfessionDemo {
    src: string;
    poster: string;
    title: string;
    caption: string;
    accentColor: string;
}

const PROFESSION_DEMOS: Record<string, ProfessionDemo> = {
    medical: {
        src: '/assets/videos/doctor-demo.mp4',
        poster: '/assets/healthcare/healthcare_clinic_revenue_1773217260607.png',
        title: 'MyTracksy Doctor App demo video',
        caption: 'A quick walkthrough of clinic billing, pricing tiers, and practice finance workflows.',
        accentColor: '#0ea5e9',
    },
    legal: {
        src: '/assets/videos/legal-demo.mp4',
        poster: '/assets/professions/profession_lawyer_1773215139946.png',
        title: 'LexTracksy legal practice demo video',
        caption: 'See client trust ledgers, fee notes, court costs, and IRD-ready reporting in one flow.',
        accentColor: '#f59e0b',
    },
    engineering: {
        src: '/assets/videos/engineering-demo.mp4',
        poster: '/assets/professions/profession_engineer_1773215171114.png',
        title: 'EngiTracksy construction project demo video',
        caption: 'Preview BOQ variance, site cash, retention, and project margin tracking.',
        accentColor: '#f97316',
    },
    business: {
        src: '/assets/videos/business-demo.mp4',
        poster: '/assets/professions/profession_business_1773215155357.png',
        title: 'BizTracksy SME dashboard demo video',
        caption: 'A multi-company workflow for stock, VAT, debtors, supplier bills, and owner cash flow.',
        accentColor: '#fbbf24',
    },
    individual: {
        src: '/assets/videos/individual-demo.mp4',
        poster: '/assets/professions/profession_personal_1773215331363.png',
        title: 'MyTracksy Personal finance demo video',
        caption: 'A mobile-first view of expenses, budgets, savings goals, and bill tracking.',
        accentColor: '#8b5cf6',
    },
    trading: {
        src: '/assets/videos/trading-demo.mp4',
        poster: '/assets/professions/profession_trader_1773215186011.png',
        title: 'TradeTracksy wholesale margin demo video',
        caption: 'Track buy-sell transactions, supplier ledgers, FIFO stock, and margin by SKU.',
        accentColor: '#ef4444',
    },
    automotive: {
        src: '/assets/videos/automotive-demo.mp4',
        poster: '/assets/professions/profession_auto_1773215201791.png',
        title: 'AutoTracksy workshop demo video',
        caption: 'Preview job cards, vehicle history, parts inventory, invoices, and mechanic payouts.',
        accentColor: '#94a3b8',
    },
    marketing: {
        src: '/assets/videos/marketing-demo.mp4',
        poster: '/assets/professions/profession_marketing_1773215238062.png',
        title: 'MarketingTracksy agency finance demo video',
        caption: 'Manage campaign spend, retainers, freelancers, claims, and client profitability.',
        accentColor: '#ec4899',
    },
    travel: {
        src: '/assets/videos/travel-demo.mp4',
        poster: '/assets/professions/profession_travel_1773215259443.png',
        title: 'TravelTracksy booking finance demo video',
        caption: 'Preview package costing, hotel and guide supplier costs, commissions, and booking margins.',
        accentColor: '#06b6d4',
    },
    tourism: {
        src: '/assets/videos/tourism-demo.mp4',
        poster: '/assets/images/sri_lanka_tourism_hero.png',
        title: 'TourTracksy tourism operator demo video',
        caption: 'See itinerary quotes, multi-currency payments, supplier payouts, and tour margin control.',
        accentColor: '#4f46e5',
    },
    transportation: {
        src: '/assets/videos/transportation-demo.mp4',
        poster: '/assets/professions/profession_transport_1773215278251.png',
        title: 'TransTracksy fleet finance demo video',
        caption: 'Track trips, routes, fuel cost, driver payouts, maintenance, and profit per vehicle.',
        accentColor: '#d97706',
    },
    retail: {
        src: '/assets/videos/retail-demo.mp4',
        poster: '/assets/professions/profession_retail_1773215293921.png',
        title: 'RetailTracksy shop demo video',
        caption: 'Preview stock, supplier bills, daily cash close, POS flow, and retail profit controls.',
        accentColor: '#16a34a',
    },
    aquaculture: {
        src: '/assets/videos/aquaculture-demo.mp4',
        poster: '/assets/professions/profession_aquaculture_1773215316236.png',
        title: 'AquaTracksy pond accounting demo video',
        caption: 'See voice-led feed, labor, pond cost, inventory, and harvest margin workflows.',
        accentColor: '#06b6d4',
    },
    creator: {
        src: '/assets/videos/creator-demo.mp4',
        poster: '/assets/healthcare/creator_hero_bg.png',
        title: 'CreatorTracksy income and tax demo video',
        caption: 'Preview brand deals, USD income, creator invoices, gear write-offs, and tax exports.',
        accentColor: '#a855f7',
    },
    studios: {
        src: '/assets/videos/studios-demo.mp4',
        poster: '/assets/professions/profession_studios.svg',
        title: 'LensTracksy studio finance demo video',
        caption: 'See event folios, package milestones, crew payouts, album balances, and payment reminders.',
        accentColor: '#f59e0b',
    },
};

const DEMO_ALIASES: Record<string, string> = {
    dr: 'medical',
    doctor: 'medical',
    lawyer: 'legal',
    attorney: 'legal',
    construction: 'engineering',
    photographer: 'studios',
    photography: 'studios',
    studio: 'studios',
};

export function getProfessionDemo(slug: string): ProfessionDemo {
    const key = DEMO_ALIASES[slug] ?? slug;
    return PROFESSION_DEMOS[key] ?? PROFESSION_DEMOS.individual;
}

interface ProfessionDemoVideoProps {
    slug: string;
    title?: string;
    caption?: string;
    accentColor?: string;
    variant?: 'light' | 'dark';
    compact?: boolean;
    className?: string;
    style?: React.CSSProperties;
}

const ProfessionDemoVideo: React.FC<ProfessionDemoVideoProps> = ({
    slug,
    title,
    caption,
    accentColor,
    variant = 'light',
    compact = false,
    className,
    style,
}) => {
    const demo = getProfessionDemo(slug);
    const accent = accentColor ?? demo.accentColor;
    const isDark = variant === 'dark';

    return (
        <figure className={className} style={{ margin: 0, ...style }}>
            <div
                style={{
                    borderRadius: compact ? 20 : 28,
                    overflow: 'hidden',
                    background: isDark ? 'rgba(2,6,23,0.72)' : '#ffffff',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.14)' : `${accent}22`}`,
                    boxShadow: isDark
                        ? `0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px ${accent}18`
                        : `0 34px 76px -28px ${accent}80, 0 16px 40px -28px rgba(15,23,42,0.38)`,
                    padding: compact ? 6 : 8,
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: compact ? '8px 10px 10px' : '10px 12px 12px',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b' }} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                    </div>
                    <span
                        style={{
                            color: isDark ? '#cbd5e1' : '#64748b',
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                        }}
                    >
                        {title ?? 'Product Demo'}
                    </span>
                </div>
                <div
                    style={{
                        position: 'relative',
                        aspectRatio: '16 / 9',
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: compact ? 16 : 20,
                        background: '#020617',
                    }}
                >
                    <video
                        src={demo.src}
                        poster={demo.poster}
                        autoPlay
                        muted
                        loop
                        playsInline
                        controls
                        preload="metadata"
                        controlsList="nodownload"
                        aria-label={demo.title}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            border: 'none',
                        }}
                    >
                        <a href={demo.src}>{demo.title}</a>
                    </video>
                </div>
            </div>
            {(caption ?? demo.caption) && (
                <figcaption
                    style={{
                        marginTop: 14,
                        color: isDark ? '#cbd5e1' : '#64748b',
                        fontSize: compact ? 13 : 14,
                        lineHeight: 1.6,
                        textAlign: 'center',
                    }}
                >
                    {caption ?? demo.caption}
                </figcaption>
            )}
        </figure>
    );
};

export default ProfessionDemoVideo;

interface ProfessionDemoSectionProps {
    slug: string;
    id?: string;
    eyebrow?: string;
    heading?: string;
    body?: string;
    accentColor?: string;
    variant?: 'light' | 'dark';
    background?: string;
    maxWidth?: number;
}

export const ProfessionDemoSection: React.FC<ProfessionDemoSectionProps> = ({
    slug,
    id = 'demo',
    eyebrow = 'Product Demo',
    heading,
    body,
    accentColor,
    variant = 'light',
    background,
    maxWidth = 1180,
}) => {
    const demo = getProfessionDemo(slug);
    const accent = accentColor ?? demo.accentColor;
    const isDark = variant === 'dark';

    return (
        <section
            id={id}
            style={{
                padding: '88px 24px',
                background: background ?? (isDark ? '#0f172a' : '#ffffff'),
                color: isDark ? '#f8fafc' : '#0f172a',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    maxWidth,
                    margin: '0 auto',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 380px), 1fr))',
                    gap: 40,
                    alignItems: 'center',
                }}
            >
                <div>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '7px 14px',
                            borderRadius: 999,
                            background: `${accent}18`,
                            border: `1px solid ${accent}30`,
                            color: accent,
                            fontSize: 12,
                            fontWeight: 800,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            marginBottom: 18,
                        }}
                    >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent }} />
                        {eyebrow}
                    </div>
                    <h2
                        style={{
                            fontSize: 'clamp(2rem, 4vw, 3.4rem)',
                            lineHeight: 1.08,
                            letterSpacing: '-0.04em',
                            margin: '0 0 18px',
                            color: isDark ? '#ffffff' : '#0f172a',
                        }}
                    >
                        {heading ?? demo.title}
                    </h2>
                    <p
                        style={{
                            margin: 0,
                            color: isDark ? '#cbd5e1' : '#64748b',
                            fontSize: 17,
                            lineHeight: 1.75,
                            maxWidth: 560,
                        }}
                    >
                        {body ?? demo.caption}
                    </p>
                </div>
                <ProfessionDemoVideo
                    slug={slug}
                    title={eyebrow}
                    caption={body ?? demo.caption}
                    accentColor={accent}
                    variant={variant}
                />
            </div>
        </section>
    );
};
