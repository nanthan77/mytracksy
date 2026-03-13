import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPricingForProfession } from '../config/pricingConfig';

interface LensTracksyLandingProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const faqs = [
    {
        question: 'How does LensTracksy stop late album-delivery payments?',
        answer: 'Each wedding or commercial shoot gets an Event Folio with milestone billing. LensTracksy tracks the advance, shoot-day, pre-shoot, and album-delivery balances, then queues polite WhatsApp reminders before the due date so the studio stays the good cop.',
    },
    {
        question: 'Can I see the true net profit after crew, drone, and album costs?',
        answer: 'Yes. Every event tracks the package value, paid milestones, and crew or lab payouts. The dashboard shows the live net margin after second shooters, lighting assistants, album printers, rentals, and travel costs are deducted.',
    },
    {
        question: 'Does LensTracksy handle camera and drone depreciation for Sri Lankan tax?',
        answer: 'Yes. LensTracksy is designed around the common 20% straight-line depreciation pattern for studio gear, including cameras, drones, lighting rigs, laptops, and editing machines, so year-end deductions stay visible instead of getting forgotten.',
    },
    {
        question: 'Is LensTracksy installable as a mobile app for studio owners and team leads?',
        answer: 'Yes. The `/studios` route is built as a dedicated PWA with home-screen install support, fast mobile navigation, and direct deep links into events, gear, and AI tools.',
    },
];

const solveGrid = [
    {
        icon: '🗓️',
        title: 'Milestone Billing on Autopilot',
        desc: 'Split every package into advance, shoot-day, pre-shoot, and album-delivery checkpoints. LensTracksy handles reminder timing and keeps the awkward payment chase out of your WhatsApp chat.',
    },
    {
        icon: '💸',
        title: 'True Event Profitability',
        desc: 'Log the second shooter, drone malli, album press, gear rental, and travel costs inside the event itself. You stop guessing the margin and start seeing the real net profit of each wedding.',
    },
    {
        icon: '📸',
        title: 'Gear Tax-Hack Vault',
        desc: 'Store high-ticket camera, drone, MacBook, and lighting receipts in one place. The app keeps the annual depreciation deduction visible so the tax shield is not lost at year-end.',
    },
    {
        icon: '⚖️',
        title: 'AI Contracts and Client Protection',
        desc: 'Generate polished contracts, decode messy client voice notes into shot lists, and draft delay-apology messages that protect your studio reputation.',
    },
];

const aiTools = [
    {
        name: 'Ironclad Contract Builder',
        token: '3 Tokens',
        desc: 'Speak the scope, total price, non-refundable advance, revision cap, and raw-file policy. LensTracksy turns it into a clean contract draft.',
    },
    {
        name: 'Voice Note Shot-List Decoder',
        token: '2 Tokens',
        desc: 'Turn long bride and family voice notes into a short wedding-day checklist for the phone in your hand.',
    },
    {
        name: 'Angry Client Diplomat',
        token: '1 Token',
        desc: 'Draft professional delay notices for albums, edits, or power-cut disruptions without sounding defensive or careless.',
    },
];

const rolloutNotes = [
    'Camera-store partnership ready: pair free trials with Sony, Canon, DJI, and MacBook purchases so photographers track ROI from day one.',
    'Second-shooter viral loop: assign freelancers into events and let them receive their brief and payout note inside the same app flow.',
    'Wedding-exhibition pitch: lead with “stop chasing couples for the final album balance” because every Colombo studio already feels that pain.',
];

const freeTierGuardrails = [
    'Free forever for one-camera shooters',
    '3 active shoots per month',
    'Upgrade for WhatsApp reminders, team payouts, and full gear tax automation',
];

const LensTracksyLanding: React.FC<LensTracksyLandingProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [mounted, setMounted] = useState(false);
    const [navSolid, setNavSolid] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const pricing = useMemo(() => getPricingForProfession('studios'), []);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setNavSolid(window.scrollY > 24);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const structuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'LensTracksy',
            url: 'https://mytracksy.lk/studios',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Android, iOS',
            image: 'https://mytracksy.lk/logos/mytracksy-logo.png',
            description: 'LensTracksy is the MyTracksy finance operating system for Sri Lankan wedding photographers and production studios, built for milestone billing, crew payouts, gear depreciation, and mobile PWA workflows.',
            offers: {
                '@type': 'AggregateOffer',
                lowPrice: Math.min(...pricing.tiers.map((tier) => tier.monthlyPrice)),
                highPrice: Math.max(...pricing.tiers.map((tier) => tier.monthlyPrice)),
                priceCurrency: 'LKR',
                offerCount: pricing.tiers.length,
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'MyTracksy', item: 'https://mytracksy.lk/' },
                { '@type': 'ListItem', position: 2, name: 'LensTracksy', item: 'https://mytracksy.lk/studios' },
            ],
        },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0c0a09',
            color: '#fafaf9',
            fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
            overflowX: 'hidden',
        }}>
            <Helmet>
                <title>LensTracksy | Wedding Studio Billing, Gear Tax, and AI Client Workflow App</title>
                <meta
                    name="description"
                    content="LensTracksy helps Sri Lankan wedding photographers and studios manage milestone billing, crew payouts, gear depreciation, AI contracts, and mobile PWA workflows from one finance operating system."
                />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <link rel="canonical" href="https://mytracksy.lk/studios" />
                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="MyTracksy" />
                <meta property="og:url" content="https://mytracksy.lk/studios" />
                <meta property="og:title" content="LensTracksy | Wedding Studio Billing, Gear Tax, and AI Client Workflow App" />
                <meta
                    property="og:description"
                    content="Stop chasing album balances, track crew and lab payouts, and run a Sri Lankan wedding studio from one installable mobile workflow."
                />
                <meta property="og:image" content="https://mytracksy.lk/logos/mytracksy-logo.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="LensTracksy | Wedding Studio Billing, Gear Tax, and AI Client Workflow App" />
                <meta
                    name="twitter:description"
                    content="The financial studio for Sri Lankan visual creatives: milestone billing, gear depreciation, AI contracts, and true event profit tracking."
                />
                <meta name="twitter:image" content="https://mytracksy.lk/logos/mytracksy-logo.png" />
                <meta name="theme-color" content="#b45309" />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; }
                @keyframes lensFloat {
                    0%, 100% { transform: translate3d(0, 0, 0); }
                    50% { transform: translate3d(0, -18px, 0); }
                }
                @keyframes lensPulse {
                    0%, 100% { opacity: 0.45; }
                    50% { opacity: 0.9; }
                }
                .lens-shell { width: min(1180px, calc(100% - 32px)); margin: 0 auto; }
                .lens-card {
                    background: rgba(28, 25, 23, 0.78);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 28px;
                    backdrop-filter: blur(18px);
                    box-shadow: 0 24px 60px rgba(0,0,0,0.18);
                }
                .lens-btn {
                    border: none;
                    border-radius: 999px;
                    cursor: pointer;
                    font: inherit;
                    font-weight: 700;
                    transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
                }
                .lens-btn:hover { transform: translateY(-2px); }
                .lens-outline {
                    background: rgba(255,255,255,0.04);
                    border: 1px solid rgba(255,255,255,0.12);
                    color: #fafaf9;
                }
                .lens-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 20px; }
                .lens-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; }
                .lens-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
                .lens-muted { color: rgba(231, 229, 228, 0.68); }
                @media (max-width: 980px) {
                    .lens-grid-4, .lens-grid-3, .lens-grid-2 { grid-template-columns: 1fr; }
                    .lens-hide-mobile { display: none !important; }
                    .lens-hero-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
                    .lens-nav-actions { gap: 10px !important; }
                }
            `}</style>

            <nav style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 40,
                padding: '18px 0',
                background: navSolid ? 'rgba(12,10,9,0.82)' : 'transparent',
                backdropFilter: navSolid ? 'blur(18px)' : 'none',
                borderBottom: navSolid ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
                transition: 'all 0.25s ease',
            }}>
                <div className="lens-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button
                            onClick={onBack}
                            className="lens-btn lens-outline"
                            style={{ padding: '10px 14px', fontSize: 13 }}
                        >
                            ← All professions
                        </button>
                        <button
                            type="button"
                            onClick={onBack}
                            style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                        >
                            <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ width: 42, height: 42, objectFit: 'contain' }} />
                            <div>
                                <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                    MyTracksy Studios
                                </div>
                                <div style={{ fontSize: 21, fontWeight: 800, letterSpacing: '-0.03em' }}>LensTracksy</div>
                            </div>
                        </button>
                    </div>
                    <div className="lens-nav-actions" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <button onClick={onLogin} style={{ background: 'none', border: 'none', color: '#f5f5f4', fontWeight: 700, cursor: 'pointer' }}>
                            Log in
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="lens-btn"
                            style={{
                                padding: '12px 20px',
                                background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                                color: '#fff',
                                boxShadow: '0 14px 30px rgba(180,83,9,0.32)',
                            }}
                        >
                            Start free
                        </button>
                    </div>
                </div>
            </nav>

            <header style={{
                paddingTop: 130,
                paddingBottom: 84,
                position: 'relative',
                overflow: 'hidden',
                background: 'radial-gradient(circle at top right, rgba(251,191,36,0.18), transparent 28%), radial-gradient(circle at bottom left, rgba(120,53,15,0.42), transparent 38%), linear-gradient(180deg, #0c0a09 0%, #1c1917 50%, #0c0a09 100%)',
            }}>
                <div style={{
                    position: 'absolute',
                    top: '12%',
                    right: '10%',
                    width: 280,
                    height: 280,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(245,158,11,0.38), transparent 72%)',
                    filter: 'blur(32px)',
                    animation: 'lensPulse 6s ease-in-out infinite',
                }} />
                <div style={{
                    position: 'absolute',
                    bottom: '10%',
                    left: '6%',
                    width: 220,
                    height: 220,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(120,53,15,0.38), transparent 72%)',
                    filter: 'blur(32px)',
                    animation: 'lensFloat 8s ease-in-out infinite',
                }} />
                <div className="lens-shell lens-hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 40, alignItems: 'center' }}>
                    <div style={{
                        opacity: mounted ? 1 : 0,
                        transform: mounted ? 'translateY(0)' : 'translateY(18px)',
                        transition: 'all 0.8s ease',
                    }}>
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 14px',
                            borderRadius: 999,
                            border: '1px solid rgba(251,191,36,0.28)',
                            background: 'rgba(251,191,36,0.08)',
                            color: '#fbbf24',
                            fontSize: 12.5,
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            marginBottom: 24,
                        }}>
                            🇱🇰 The financial studio for Sri Lankan visual creatives
                        </div>

                        <h1 style={{ fontSize: 'clamp(3rem, 5vw, 5.2rem)', lineHeight: 1.02, letterSpacing: '-0.05em', marginBottom: 22 }}>
                            Focus on the shot.
                            <br />
                            <span style={{ color: '#fbbf24' }}>Let AI chase the payments.</span>
                        </h1>

                        <p className="lens-muted" style={{ fontSize: 18, lineHeight: 1.78, maxWidth: 700, marginBottom: 30 }}>
                            LensTracksy is the project, billing, and tax operating system for Sri Lankan wedding photographers,
                            commercial studios, and production houses. Stop handing over albums before the final balance lands.
                            Track crew payouts, protect your real margin, and keep the tax value of your LKR 3 million camera kit visible.
                        </p>

                        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
                            <button
                                onClick={onGetStarted}
                                className="lens-btn"
                                style={{
                                    padding: '16px 26px',
                                    background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                                    color: '#fff',
                                    boxShadow: '0 16px 34px rgba(180,83,9,0.34)',
                                }}
                            >
                                Start free as a solo shooter
                            </button>
                            <button
                                onClick={() => document.getElementById('lens-pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                className="lens-btn lens-outline"
                                style={{ padding: '16px 26px' }}
                            >
                                Compare paid plans
                            </button>
                        </div>

                        <div style={{
                            padding: '16px 18px',
                            borderRadius: 22,
                            background: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            marginBottom: 24,
                            maxWidth: 720,
                        }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                                Free solo photographer mode
                            </div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {freeTierGuardrails.map((item) => (
                                    <span
                                        key={item}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: 999,
                                            background: 'rgba(251,191,36,0.08)',
                                            border: '1px solid rgba(251,191,36,0.18)',
                                            color: '#fde68a',
                                            fontSize: 12.5,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            {['Installable PWA', 'WhatsApp reminder flows', '20% gear depreciation engine'].map((item) => (
                                <span
                                    key={item}
                                    style={{
                                        padding: '8px 12px',
                                        borderRadius: 999,
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: '#e7e5e4',
                                        fontSize: 13,
                                        fontWeight: 700,
                                    }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="lens-card" style={{ padding: 24, position: 'relative' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                            <div>
                                <div style={{ fontSize: 12, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                                    Event Folio
                                </div>
                                <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6 }}>
                                    Perera Wedding
                                </div>
                            </div>
                            <div style={{
                                borderRadius: 999,
                                padding: '7px 11px',
                                background: 'rgba(239,68,68,0.12)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                color: '#fca5a5',
                                fontWeight: 800,
                                fontSize: 12,
                            }}>
                                Album balance late
                            </div>
                        </div>

                        <div className="lens-grid-2" style={{ marginBottom: 18 }}>
                            <div style={{ padding: 18, borderRadius: 22, background: 'rgba(255,255,255,0.04)' }}>
                                <div className="lens-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    Package value
                                </div>
                                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>LKR 800,000</div>
                                <div style={{ fontSize: 13, color: '#a8a29e', marginTop: 4 }}>20 / 40 / 20 / 20 milestone flow</div>
                            </div>
                            <div style={{ padding: 18, borderRadius: 22, background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(180,83,9,0.1))' }}>
                                <div className="lens-muted" style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                    True net margin
                                </div>
                                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>33%</div>
                                <div style={{ fontSize: 13, color: '#fde68a', marginTop: 4 }}>After crew, printing, travel, and rentals</div>
                            </div>
                        </div>

                        {[
                            { label: 'Advance paid', amount: 'LKR 160,000', status: 'Paid', color: '#22c55e' },
                            { label: 'Wedding day milestone', amount: 'LKR 320,000', status: 'Due in 3 days', color: '#f59e0b' },
                            { label: 'Album delivery balance', amount: 'LKR 160,000', status: 'Overdue 29 days', color: '#ef4444' },
                        ].map((row) => (
                            <div key={row.label} style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '14px 0',
                                borderTop: '1px solid rgba(255,255,255,0.08)',
                            }}>
                                <div>
                                    <div style={{ fontWeight: 700 }}>{row.label}</div>
                                    <div className="lens-muted" style={{ fontSize: 13 }}>{row.amount}</div>
                                </div>
                                <div style={{ color: row.color, fontWeight: 800, fontSize: 13 }}>{row.status}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <section style={{ padding: '0 0 92px' }}>
                <div className="lens-shell">
                    <div className="lens-grid-4">
                        {solveGrid.map((item) => (
                            <div key={item.title} className="lens-card" style={{ padding: 26 }}>
                                <div style={{ fontSize: 34, marginBottom: 16 }}>{item.icon}</div>
                                <h2 style={{ fontSize: 22, letterSpacing: '-0.03em', marginBottom: 12 }}>{item.title}</h2>
                                <p className="lens-muted" style={{ fontSize: 15, lineHeight: 1.75 }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section id="lens-pricing" style={{ padding: '24px 0 92px', background: 'linear-gradient(180deg, rgba(28,25,23,0.32), rgba(12,10,9,0.94))' }}>
                <div className="lens-shell">
                    <div style={{ textAlign: 'center', marginBottom: 44 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
                            Pricing built for studio size
                        </div>
                        <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.6rem)', letterSpacing: '-0.04em', marginBottom: 14 }}>
                            From solo shooter to multi-team studio
                        </h2>
                        <p className="lens-muted" style={{ maxWidth: 760, margin: '0 auto', fontSize: 16, lineHeight: 1.75 }}>
                            Start free if you are a solo photographer. Upgrade only when you need automated reminders, bigger event volume, team payouts, and the full studio tax shield.
                        </p>
                    </div>

                    <div className="lens-grid-3">
                        {pricing.tiers.map((tier) => (
                            <div
                                key={tier.id}
                                className="lens-card"
                                style={{
                                    padding: 30,
                                    border: tier.highlighted ? '1px solid rgba(251,191,36,0.36)' : '1px solid rgba(255,255,255,0.08)',
                                    boxShadow: tier.highlighted ? '0 28px 80px rgba(180,83,9,0.24)' : undefined,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 18 }}>
                                    <div>
                                        <h3 style={{ fontSize: 24, letterSpacing: '-0.03em', marginBottom: 6 }}>{tier.name}</h3>
                                        <div className="lens-muted" style={{ fontSize: 14 }}>
                                            {tier.badge || (tier.tierKey === 'free' ? 'Best for one-camera solo photographers' : 'Built for Sri Lankan studios')}
                                        </div>
                                    </div>
                                    {(tier.highlighted || tier.tierKey === 'free') && (
                                        <div style={{
                                            padding: '8px 12px',
                                            borderRadius: 999,
                                            background: tier.tierKey === 'free' ? 'rgba(74,222,128,0.12)' : 'rgba(251,191,36,0.14)',
                                            color: tier.tierKey === 'free' ? '#86efac' : '#fbbf24',
                                            fontSize: 12,
                                            fontWeight: 800,
                                        }}>
                                            {tier.tierKey === 'free' ? 'Free forever' : 'Most popular'}
                                        </div>
                                    )}
                                </div>
                                <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: '-0.05em', marginBottom: 6 }}>
                                    {tier.monthlyPrice === 0 ? 'Free' : `LKR ${tier.monthlyPrice.toLocaleString('en-LK')}`}
                                </div>
                                <div className="lens-muted" style={{ fontSize: 14, marginBottom: 20 }}>
                                    {tier.monthlyPrice === 0
                                        ? 'Free forever while you stay inside the solo limits'
                                        : `/ month or LKR ${tier.annualPrice.toLocaleString('en-LK')} yearly`}
                                </div>

                                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
                                    {tier.features.map((feature) => (
                                        <li key={feature} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', color: '#f5f5f4', fontSize: 14.5, lineHeight: 1.6 }}>
                                            <span style={{ color: '#fbbf24', fontWeight: 800 }}>✓</span>
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    onClick={onGetStarted}
                                    className="lens-btn"
                                    style={{
                                        width: '100%',
                                        marginTop: 24,
                                        padding: '14px 18px',
                                        background: tier.highlighted
                                            ? 'linear-gradient(135deg, #f59e0b, #b45309)'
                                            : tier.tierKey === 'free'
                                                ? 'linear-gradient(135deg, #16a34a, #15803d)'
                                                : 'rgba(255,255,255,0.06)',
                                        color: '#fff',
                                        border: tier.highlighted || tier.tierKey === 'free' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    }}
                                >
                                    {tier.tierKey === 'free' ? 'Start free' : tier.highlighted ? 'Start pro trial' : 'Talk to sales'}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '0 0 92px' }}>
                <div className="lens-shell">
                    <div className="lens-grid-3">
                        {aiTools.map((tool) => (
                            <div key={tool.name} className="lens-card" style={{ padding: 26 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
                                    <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: '-0.03em' }}>{tool.name}</div>
                                    <div style={{ color: '#fbbf24', fontWeight: 800, fontSize: 13 }}>{tool.token}</div>
                                </div>
                                <p className="lens-muted" style={{ fontSize: 15, lineHeight: 1.7 }}>{tool.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section style={{ padding: '0 0 96px' }}>
                <div className="lens-shell lens-card" style={{ padding: 32 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 0.95fr', gap: 24 }} className="lens-grid-2">
                        <div>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fbbf24', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                                Built to spread inside the creative industry
                            </div>
                            <h2 style={{ fontSize: 'clamp(2rem, 3vw, 3rem)', letterSpacing: '-0.04em', marginBottom: 14 }}>
                                LensTracksy fits how Sri Lankan wedding studios actually work
                            </h2>
                            <p className="lens-muted" style={{ fontSize: 16, lineHeight: 1.8 }}>
                                The growth engine is simple: camera stores, second shooters, and exhausted wedding-expo vendors all understand the pain of lost margins and delayed album collections immediately.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gap: 14 }}>
                            {rolloutNotes.map((note) => (
                                <div key={note} style={{
                                    padding: '16px 18px',
                                    borderRadius: 20,
                                    background: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: '#e7e5e4',
                                    fontSize: 14.5,
                                    lineHeight: 1.7,
                                }}>
                                    {note}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <section style={{ padding: '0 0 100px' }}>
                <div className="lens-shell">
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <h2 style={{ fontSize: 'clamp(2rem, 3.4vw, 3rem)', letterSpacing: '-0.04em', marginBottom: 12 }}>
                            Questions studio owners actually ask
                        </h2>
                        <p className="lens-muted" style={{ fontSize: 16 }}>
                            Clean answers for Google, AI crawlers, and real buyers evaluating the workflow.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gap: 14 }}>
                        {faqs.map((faq, index) => {
                            const isOpen = openFaq === index;
                            return (
                                <div key={faq.question} className="lens-card" style={{ padding: 0 }}>
                                    <button
                                        onClick={() => setOpenFaq(isOpen ? null : index)}
                                        style={{
                                            width: '100%',
                                            padding: '22px 24px',
                                            background: 'none',
                                            border: 'none',
                                            color: '#fafaf9',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            gap: 16,
                                            textAlign: 'left',
                                            fontSize: 16,
                                            fontWeight: 800,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        <span>{faq.question}</span>
                                        <span style={{ color: '#fbbf24', fontSize: 22 }}>{isOpen ? '−' : '+'}</span>
                                    </button>
                                    {isOpen && (
                                        <div style={{ padding: '0 24px 22px', color: '#d6d3d1', fontSize: 15, lineHeight: 1.78 }}>
                                            {faq.answer}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            <footer style={{ padding: '0 0 42px' }}>
                <div className="lens-shell" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 18,
                    flexWrap: 'wrap',
                    paddingTop: 24,
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em' }}>Built for the visionaries of Sri Lanka.</div>
                        <div className="lens-muted" style={{ fontSize: 14, marginTop: 4 }}>
                            Designed and engineered by <a href="https://safenetcreations.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', fontWeight: 700 }}>SafeNet Creations</a>.
                        </div>
                    </div>
                    <button
                        onClick={onGetStarted}
                        className="lens-btn"
                        style={{
                            padding: '13px 20px',
                            background: 'linear-gradient(135deg, #f59e0b, #b45309)',
                            color: '#fff',
                        }}
                    >
                        Launch LensTracksy
                    </button>
                </div>
            </footer>
        </div>
    );
};

export default LensTracksyLanding;
