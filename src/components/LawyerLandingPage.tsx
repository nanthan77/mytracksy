import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPricingForProfession } from '../config/pricingConfig';

/* ───────────────────── Theme Constants ───────────────────── */
const NAVY = '#0f172a';
const NAVY_LIGHT = '#1e293b';
const NAVY_MID = '#334155';
const GOLD = '#f59e0b';
const GOLD_DARK = '#d97706';
const GOLD_LIGHT = '#fbbf24';
const WHITE = '#ffffff';
const GRAY_100 = '#f1f5f9';
const GRAY_300 = '#cbd5e1';
const GRAY_400 = '#94a3b8';
const GRAY_600 = '#475569';

const FONT_HEADING = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

/* ───────────────────── Props ───────────────────── */
interface LawyerLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

/* ───────────────────── Component ───────────────────── */
const LawyerLandingPage: React.FC<LawyerLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [navSolid, setNavSolid] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

    const pricing = getPricingForProfession('legal');

    /* ── Scroll listener for nav ── */
    useEffect(() => {
        const handleScroll = () => {
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    /* ── IntersectionObserver for scroll-reveal ── */
    useEffect(() => {
        const revealElement = (el: Element) => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.transform = 'translateY(0)';
        };
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        revealElement(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
        );
        const timer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    revealElement(el);
                } else {
                    observer.observe(el);
                }
            });
        }, 150);
        const fallbackTimer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => {
                if ((el as HTMLElement).style.opacity !== '1') revealElement(el);
            });
        }, 3000);
        return () => { clearTimeout(timer); clearTimeout(fallbackTimer); observer.disconnect(); };
    }, []);

    /* ── Helpers ── */
    const scrollTo = (id: string) => {
        const el = document.getElementById(id);
        if (el) {
            const y = el.getBoundingClientRect().top + window.scrollY - 80;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };

    const formatLKR = (amount: number): string => {
        return `LKR ${amount.toLocaleString('en-LK')}`;
    };

    /* ───────────────────── RENDER ───────────────────── */
    return (
        <>
            {/* ═══ SEO / Helmet ═══ */}
            <Helmet>
                <title>LexTracksy | AI Legal Practice Management for Sri Lankan Attorneys</title>
                <meta name="description" content="Complete legal accounting engine for Sri Lankan Attorneys-at-Law. Dual-Wallet Ledger, Court Steps Expense Tracker, 1-Click Fee Notes, Notary Escrow, IRD Tax Deductions. AI add-ons included." />
                <meta name="keywords" content="lawyer accounting software sri lanka, legal practice management, attorney billing software, trust account ledger, fee note generator, court expense tracker, notary escrow, IRD tax deductions lawyers, BASL software" />
                <link rel="canonical" href="https://mytracksy.com/legal" />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="LexTracksy | Legal Accounting Engine for Sri Lankan Attorneys" />
                <meta property="og:description" content="Dual-Wallet Ledger, Fee Notes, Expense Tracker, Notary Escrow & IRD Tax Deductions. AI add-ons included." />
                <meta property="og:url" content="https://mytracksy.com/legal" />
                <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

                {/* JSON-LD Schema */}
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "LexTracksy",
                            "applicationCategory": "BusinessApplication",
                            "operatingSystem": "Web, Android, iOS",
                            "description": "Complete legal accounting engine with Dual-Wallet Ledger, Fee Notes, Expense Tracker, Notary Escrow and IRD Tax Deductions for Attorneys-at-Law in Sri Lanka.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "LKR"
                            },
                            "author": {
                                "@type": "Organization",
                                "name": "SafeNet Creations"
                            }
                        }
                    `}
                </script>
            </Helmet>

            {/* ═══ Global Styles ═══ */}
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-padding-top: 80px; scroll-behavior: smooth; }
                body { background: #fcfcfc; }

                .lex-root {
                    font-family: ${FONT_BODY};
                    color: ${NAVY};
                    line-height: 1.6;
                    overflow-x: clip;
                    -webkit-font-smoothing: antialiased;
                }
                .lex-container {
                    max-width: 1300px;
                    margin: 0 auto;
                    padding: 0 5%;
                }
                .sr {
                    opacity: 0;
                    transform: translateY(32px);
                    transition: opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1),
                                transform 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                }

                @keyframes goldPulse {
                    0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.4); }
                    50% { box-shadow: 0 0 20px 4px rgba(245, 158, 11, 0.15); }
                }
                @keyframes floatSlow {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-18px); }
                }

                .lex-nav {
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    z-index: 1000;
                    padding: 20px 0;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .lex-nav-solid {
                    padding: 14px 0;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(24px) saturate(180%);
                    -webkit-backdrop-filter: blur(24px) saturate(180%);
                    border-bottom: 1px solid rgba(245, 158, 11, 0.15);
                    box-shadow: 0 2px 24px rgba(0, 0, 0, 0.15);
                }

                .lex-feature-card {
                    background: ${WHITE};
                    border-radius: 20px;
                    border: 1px solid rgba(0,0,0,0.06);
                    box-shadow: 0 4px 24px -6px rgba(0,0,0,0.06);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    padding: 40px;
                }
                .lex-feature-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 40px -8px rgba(0,0,0,0.1);
                    border-color: rgba(245, 158, 11, 0.25);
                }

                .lex-ai-card {
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 20px;
                    border: 1px solid rgba(255,255,255,0.08);
                    backdrop-filter: blur(20px);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    padding: 40px;
                    position: relative;
                    overflow: hidden;
                }
                .lex-ai-card:hover {
                    transform: translateY(-6px);
                    border-color: rgba(245, 158, 11, 0.3);
                    box-shadow: 0 20px 40px -8px rgba(245, 158, 11, 0.1);
                }

                .lex-pricing-card {
                    background: ${WHITE};
                    border-radius: 24px;
                    border: 1px solid rgba(0,0,0,0.08);
                    box-shadow: 0 20px 40px -20px rgba(0,0,0,0.06);
                    padding: 48px 32px;
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .lex-pricing-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 24px 48px -16px rgba(0,0,0,0.1);
                }

                .lex-pillar-card {
                    background: ${WHITE};
                    border-radius: 24px;
                    border: 1px solid rgba(0,0,0,0.06);
                    box-shadow: 0 4px 32px -8px rgba(0,0,0,0.06);
                    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    padding: 48px;
                    position: relative;
                    overflow: hidden;
                }
                .lex-pillar-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 24px 48px -12px rgba(0,0,0,0.1);
                    border-color: rgba(245,158,11,0.2);
                }
                .lex-pillar-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    height: 4px;
                    background: linear-gradient(90deg, ${GOLD}, ${GOLD_DARK});
                }

                .lex-workflow-step {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    background: #f8fafc;
                    border-radius: 12px;
                    border: 1px solid rgba(0,0,0,0.04);
                    transition: all 0.3s;
                }
                .lex-workflow-step:hover {
                    background: #fffbeb;
                    border-color: rgba(245,158,11,0.15);
                }

                .lex-workflow-arrow {
                    color: ${GOLD};
                    font-size: 18px;
                    font-weight: 800;
                    flex-shrink: 0;
                }

                .lex-tax-card {
                    background: ${WHITE};
                    border-radius: 16px;
                    border: 1px solid rgba(0,0,0,0.06);
                    padding: 24px;
                    text-align: center;
                    transition: all 0.3s;
                }
                .lex-tax-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 12px 24px -6px rgba(0,0,0,0.08);
                    border-color: rgba(16,185,129,0.3);
                }

                .lex-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

                @media (max-width: 768px) {
                    .lex-nav-links { display: none !important; }
                    .lex-nav-back { display: none !important; }
                    .lex-nav-right-full { display: none !important; }
                    .lex-nav-right-mobile { display: flex !important; }
                    .lex-hero-headline { font-size: 2.4rem !important; }
                    .lex-hero-sub { font-size: 16px !important; }
                    .lex-hero-ctas { flex-direction: column; align-items: stretch; }
                    .lex-section-title { font-size: 2rem !important; }
                    .lex-grid-3 { grid-template-columns: 1fr !important; }
                    .lex-grid-2 { grid-template-columns: 1fr !important; }
                    .lex-security-badges { flex-direction: column; }
                    .lex-pricing-grid { grid-template-columns: 1fr !important; }
                    .lex-pricing-highlighted { transform: none !important; }
                    .lex-footer-bottom { flex-direction: column; text-align: center; }
                    .lex-token-callout { flex-direction: column; }
                    .lex-pillar-card { padding: 32px 24px !important; }
                    .lex-pillar-inner { flex-direction: column !important; }
                }
            `}</style>

            <div className="lex-root">

                {/* ═══════════════════════════════════════════════
                    1. FIXED NAVIGATION BAR
                ═══════════════════════════════════════════════ */}
                <nav className={`lex-nav ${navSolid ? 'lex-nav-solid' : ''}`}>
                    <div className="lex-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Left: Back + Logo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button
                                onClick={onBack}
                                className="lex-nav-back"
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    color: WHITE,
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    padding: '8px 16px',
                                    borderRadius: 99,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    fontFamily: FONT_BODY,
                                    transition: 'all 0.3s',
                                }}
                            >
                                ← Back
                            </button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                                <span style={{ fontSize: 20, fontWeight: 800, color: GOLD, fontFamily: FONT_HEADING, letterSpacing: '-0.01em' }}>
                                    LexTracksy
                                </span>
                            </div>
                        </div>

                        {/* Center: Nav Links */}
                        <div className="lex-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            {[
                                { label: 'Accounting Engine', target: 'accounting' },
                                { label: 'Tax Deductions', target: 'tax' },
                                { label: 'AI Add-Ons', target: 'ai-tools' },
                                { label: 'Pricing', target: 'pricing' },
                            ].map((link) => (
                                <span
                                    key={link.label}
                                    onClick={() => scrollTo(link.target)}
                                    style={{
                                        fontSize: 14,
                                        fontWeight: 600,
                                        color: WHITE,
                                        cursor: 'pointer',
                                        transition: 'color 0.2s',
                                        opacity: 0.85,
                                    }}
                                >
                                    {link.label}
                                </span>
                            ))}
                        </div>

                        {/* Right: Login + CTA (Desktop) */}
                        <div className="lex-nav-right-full" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span
                                onClick={onLogin}
                                style={{ fontSize: 14, fontWeight: 600, color: WHITE, cursor: 'pointer', opacity: 0.85 }}
                            >
                                Sign In
                            </span>
                            <button
                                onClick={onGetStarted}
                                style={{
                                    background: GOLD,
                                    color: NAVY,
                                    border: 'none',
                                    padding: '10px 24px',
                                    borderRadius: 99,
                                    fontWeight: 700,
                                    fontSize: 14,
                                    cursor: 'pointer',
                                    fontFamily: FONT_BODY,
                                    transition: 'all 0.3s',
                                    boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)',
                                }}
                            >
                                Start Free Trial
                            </button>
                        </div>

                        {/* Right: Mobile compact nav */}
                        <div className="lex-nav-right-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
                            <span onClick={onLogin} style={{ color: WHITE, fontWeight: 600, fontSize: 14, cursor: 'pointer', opacity: 0.85 }}>Sign In</span>
                            <button onClick={onGetStarted} style={{
                                background: GOLD, color: NAVY, border: 'none',
                                padding: '8px 18px', borderRadius: 99, fontWeight: 700, fontSize: 13,
                                cursor: 'pointer', fontFamily: FONT_BODY,
                            }}>Start Free</button>
                        </div>
                    </div>
                </nav>

                {/* ═══════════════════════════════════════════════
                    2. HERO SECTION
                ═══════════════════════════════════════════════ */}
                <header
                    id="hero"
                    style={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        paddingTop: 120,
                        paddingBottom: 80,
                        position: 'relative',
                        overflow: 'hidden',
                        background: NAVY,
                        color: WHITE,
                    }}
                >
                    {/* Radial Gold Glows */}
                    <div style={{
                        position: 'absolute', top: '5%', right: '10%',
                        width: 500, height: 500,
                        background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 65%)',
                        borderRadius: '50%', filter: 'blur(80px)', zIndex: 0,
                        animation: 'floatSlow 20s ease-in-out infinite',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '10%', left: '5%',
                        width: 400, height: 400,
                        background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 60%)',
                        borderRadius: '50%', filter: 'blur(70px)', zIndex: 0,
                        animation: 'floatSlow 25s ease-in-out infinite reverse',
                    }} />
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%',
                        width: 600, height: 600,
                        background: 'radial-gradient(circle, rgba(217,119,6,0.08) 0%, transparent 55%)',
                        borderRadius: '50%', filter: 'blur(100px)', zIndex: 0,
                        transform: 'translate(-50%, -50%)',
                    }} />

                    <div className="lex-container" style={{ position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: 900, margin: '0 auto' }}>
                        <div className="sr" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '8px 18px', borderRadius: 99,
                            background: 'rgba(245,158,11,0.1)', border: `1px solid rgba(245,158,11,0.3)`,
                            color: GOLD_LIGHT, fontSize: 13, fontWeight: 700,
                            letterSpacing: '0.04em', textTransform: 'uppercase',
                            marginBottom: 28,
                        }}>
                            <span style={{ fontSize: 16 }}>🇱🇰</span> Built for Sri Lankan Attorneys-at-Law
                        </div>

                        <h1 className="sr lex-hero-headline" style={{
                            fontSize: '3.8rem', fontWeight: 800,
                            lineHeight: 1.1, letterSpacing: '-0.02em',
                            marginBottom: 28, color: WHITE,
                            fontFamily: FONT_HEADING,
                        }}>
                            You Mastered the Law.{' '}
                            <span style={{ color: GOLD }}>Let Us Master Your Accounts.</span>
                        </h1>

                        <p className="sr lex-hero-sub" style={{
                            fontSize: 19, color: GRAY_300,
                            lineHeight: 1.75, marginBottom: 44,
                            maxWidth: 720, margin: '0 auto 44px',
                            fontFamily: FONT_BODY,
                        }}>
                            The only practice management app that separates your Client Trust Account from your
                            Taxable Income — automatically. With built-in Fee Notes, Expense Tracking, and IRD Tax Deductions.
                            AI-powered add-ons included.
                        </p>

                        <div className="sr lex-hero-ctas" style={{
                            display: 'flex', gap: 16,
                            justifyContent: 'center', flexWrap: 'wrap',
                        }}>
                            <button
                                onClick={onGetStarted}
                                style={{
                                    background: GOLD, color: NAVY,
                                    border: 'none', padding: '18px 40px',
                                    borderRadius: 99, fontWeight: 700, fontSize: 16,
                                    cursor: 'pointer', fontFamily: FONT_BODY,
                                    transition: 'all 0.3s',
                                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                                    animation: 'goldPulse 3s ease-in-out infinite',
                                }}
                            >
                                Start 14-Day Free Trial
                            </button>
                            <button
                                onClick={onGetStarted}
                                style={{
                                    background: 'transparent',
                                    color: GOLD,
                                    border: `2px solid ${GOLD}`,
                                    padding: '18px 40px',
                                    borderRadius: 99, fontWeight: 700, fontSize: 16,
                                    cursor: 'pointer', fontFamily: FONT_BODY,
                                    transition: 'all 0.3s',
                                    display: 'flex', alignItems: 'center', gap: 8,
                                }}
                            >
                                ▶ Watch Demo
                            </button>
                        </div>

                        <div className="sr" style={{
                            marginTop: 24, fontSize: 13, color: GRAY_400,
                            fontWeight: 600, display: 'flex',
                            alignItems: 'center', gap: 8, justifyContent: 'center',
                        }}>
                            <span style={{ color: '#34d399' }}>✓</span> No credit card required. Works offline from day one.
                        </div>

                        {/* Inline PWA Install Link */}
                        <div className="sr" style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
                            <button
                                onClick={onGetStarted}
                                style={{
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: `1px solid rgba(245, 158, 11, 0.3)`,
                                    borderRadius: 99,
                                    padding: '10px 24px',
                                    color: GOLD_LIGHT,
                                    fontSize: 14,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.3s ease',
                                    fontFamily: FONT_BODY,
                                }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.18)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245, 158, 11, 0.1)'; }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                📲 Free App — Install Now
                            </button>
                        </div>
                    </div>
                </header>

                {/* ═══════════════════════════════════════════════
                    3. THE LEGAL ACCOUNTING ENGINE — 4 PILLARS
                ═══════════════════════════════════════════════ */}
                <section id="accounting" style={{ padding: '120px 0', background: WHITE, position: 'relative' }}>
                    <div className="lex-container">
                        {/* Section Header */}
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 32 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '8px 18px', borderRadius: 99,
                                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)',
                                color: GOLD_DARK, fontSize: 13, fontWeight: 700,
                                letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24,
                            }}>
                                ⚙️ Core Product
                            </div>
                            <h2 className="lex-section-title" style={{
                                fontSize: '3rem', fontWeight: 800, color: NAVY,
                                letterSpacing: '-0.02em', marginBottom: 20,
                                fontFamily: FONT_HEADING,
                            }}>
                                The Legal Accounting Engine
                            </h2>
                            <p style={{ fontSize: 18, color: GRAY_600, maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                A complete financial operating system built specifically for how Sri Lankan lawyers handle money.
                                Four integrated pillars that automate everything from retainer tracking to tax deductions.
                            </p>
                        </div>

                        {/* 4-Pillar Overview Strip */}
                        <div className="sr" style={{
                            display: 'flex', justifyContent: 'center', gap: 16,
                            flexWrap: 'wrap', marginBottom: 72,
                        }}>
                            {[
                                { num: '1', label: 'Dual-Wallet Ledger', icon: '🏦' },
                                { num: '2', label: 'Expense Tracker', icon: '📋' },
                                { num: '3', label: '1-Click Fee Note', icon: '📄' },
                                { num: '4', label: 'Notary Escrow', icon: '🔒' },
                            ].map((p) => (
                                <div key={p.num} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '12px 20px', borderRadius: 99,
                                    background: NAVY, color: WHITE,
                                    fontSize: 14, fontWeight: 700,
                                    boxShadow: '0 4px 12px rgba(15,23,42,0.15)',
                                }}>
                                    <span style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: GOLD, color: NAVY,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 13, fontWeight: 800,
                                    }}>{p.num}</span>
                                    <span>{p.icon} {p.label}</span>
                                </div>
                            ))}
                        </div>

                        {/* ── PILLAR 1: Dual-Wallet Ledger ── */}
                        <div className="sr lex-pillar-card" style={{ marginBottom: 40 }}>
                            <div className="lex-pillar-inner" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 40, boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                                }}>🏦</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '4px 12px', borderRadius: 99,
                                        background: 'rgba(245,158,11,0.1)', color: GOLD_DARK,
                                        fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase', marginBottom: 12,
                                    }}>Pillar 1</div>
                                    <h3 style={{
                                        fontSize: 28, fontWeight: 800, color: NAVY,
                                        marginBottom: 16, fontFamily: FONT_HEADING, letterSpacing: '-0.01em',
                                    }}>
                                        Dual-Wallet Ledger
                                    </h3>
                                    <p style={{
                                        fontSize: 13, fontWeight: 700, color: GOLD_DARK,
                                        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12,
                                    }}>
                                        Retainers vs Revenue — Never Mix Client Money Again
                                    </p>
                                    <p style={{ fontSize: 16, color: GRAY_600, lineHeight: 1.8, marginBottom: 24 }}>
                                        Every rupee a client pays you as a retainer goes into a <strong style={{ color: NAVY }}>Trust Wallet</strong> — untouchable
                                        until you record work done. When you log an appearance fee, the system automatically transfers
                                        exactly that amount from Trust to your <strong style={{ color: NAVY }}>Operating Wallet</strong>, making it taxable income.
                                        No manual calculations. No mixing. No BASL compliance headaches.
                                    </p>

                                    {/* Workflow Visualization */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            How It Works:
                                        </div>
                                        {[
                                            { step: '1', text: 'Client pays LKR 200,000 retainer → Enters Trust Wallet' },
                                            { step: '2', text: 'You record an appearance (LKR 15,000) → System auto-transfers Trust → Operating' },
                                            { step: '3', text: 'Operating Wallet = Taxable Income, tracked automatically for IRD' },
                                            { step: '4', text: 'Trust balance always visible — client can ask anytime, you have the answer' },
                                        ].map((item) => (
                                            <div key={item.step} className="lex-workflow-step">
                                                <span style={{
                                                    width: 28, height: 28, borderRadius: '50%',
                                                    background: NAVY, color: GOLD,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: 13, fontWeight: 800, flexShrink: 0,
                                                }}>{item.step}</span>
                                                <span style={{ fontSize: 14, color: NAVY_MID, fontWeight: 500, lineHeight: 1.5 }}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── PILLAR 2: Court Steps Expense Tracker ── */}
                        <div className="sr lex-pillar-card" style={{ marginBottom: 40 }}>
                            <div className="lex-pillar-inner" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 40, boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                                }}>📋</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '4px 12px', borderRadius: 99,
                                        background: 'rgba(245,158,11,0.1)', color: GOLD_DARK,
                                        fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase', marginBottom: 12,
                                    }}>Pillar 2</div>
                                    <h3 style={{
                                        fontSize: 28, fontWeight: 800, color: NAVY,
                                        marginBottom: 16, fontFamily: FONT_HEADING, letterSpacing: '-0.01em',
                                    }}>
                                        Court Steps Expense Tracker
                                    </h3>
                                    <p style={{
                                        fontSize: 13, fontWeight: 700, color: GOLD_DARK,
                                        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12,
                                    }}>
                                        Track Every Reimbursable — Stop Losing Money on Court Stamps
                                    </p>
                                    <p style={{ fontSize: 16, color: GRAY_600, lineHeight: 1.8, marginBottom: 24 }}>
                                        Every time you pay for court stamps, typist fees, junior counsel fees, or transport out of pocket,
                                        log it against the specific case. The app tracks your <strong style={{ color: NAVY }}>Unbilled Reimbursables</strong> —
                                        money your clients owe you. When you generate a Fee Note, these expenses auto-populate.
                                        No more forgotten stamps. No more subsidizing clients.
                                    </p>

                                    {/* Expense Types Grid */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                                        {[
                                            { icon: '🏛️', label: 'Court Stamps' },
                                            { icon: '⌨️', label: 'Typist Fees' },
                                            { icon: '👨‍⚖️', label: 'Junior Counsel' },
                                            { icon: '🚗', label: 'Transport' },
                                            { icon: '📋', label: 'Filing Fees' },
                                            { icon: '📝', label: 'Notarial Charges' },
                                        ].map((exp) => (
                                            <div key={exp.label} style={{
                                                display: 'flex', alignItems: 'center', gap: 8,
                                                padding: '8px 16px', borderRadius: 99,
                                                background: '#f1f5f9', border: '1px solid rgba(0,0,0,0.06)',
                                                fontSize: 13, fontWeight: 600, color: NAVY_MID,
                                            }}>
                                                <span>{exp.icon}</span> {exp.label}
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        padding: '16px 20px', borderRadius: 16,
                                        background: '#fffbeb', border: '1px solid #fde68a',
                                        display: 'flex', gap: 12, alignItems: 'center',
                                    }}>
                                        <span style={{ fontSize: 24 }}>💡</span>
                                        <span style={{ fontSize: 14, color: '#92400e', fontWeight: 600, lineHeight: 1.5 }}>
                                            Your dashboard shows total Unbilled Reimbursables across all cases —
                                            so you always know how much clients owe you.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── PILLAR 3: 1-Click Fee Note ── */}
                        <div className="sr lex-pillar-card" style={{ marginBottom: 40 }}>
                            <div className="lex-pillar-inner" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 40, boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                                }}>📄</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '4px 12px', borderRadius: 99,
                                        background: 'rgba(245,158,11,0.1)', color: GOLD_DARK,
                                        fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase', marginBottom: 12,
                                    }}>Pillar 3</div>
                                    <h3 style={{
                                        fontSize: 28, fontWeight: 800, color: NAVY,
                                        marginBottom: 16, fontFamily: FONT_HEADING, letterSpacing: '-0.01em',
                                    }}>
                                        1-Click Fee Note
                                    </h3>
                                    <p style={{
                                        fontSize: 13, fontWeight: 700, color: GOLD_DARK,
                                        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12,
                                    }}>
                                        Professional PDF Invoices — Send Before You Leave the Courtroom
                                    </p>
                                    <p style={{ fontSize: 16, color: GRAY_600, lineHeight: 1.8, marginBottom: 24 }}>
                                        Generate a polished PDF Fee Note in one click. The system automatically pulls your
                                        appearance fees, drafting fees, court stamp reimbursables, and deducts any retainer
                                        balance — producing a detailed, professional invoice. Share it instantly via
                                        WhatsApp with a PayHere payment link embedded.
                                    </p>

                                    {/* Fee Note Breakdown */}
                                    <div style={{
                                        background: '#f8fafc', borderRadius: 16, padding: 24,
                                        border: '1px solid rgba(0,0,0,0.06)', marginBottom: 16,
                                    }}>
                                        <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            What Your Fee Note Includes:
                                        </div>
                                        {[
                                            { label: 'Appearance Fees', desc: '5 appearances × LKR 15,000', amount: '75,000' },
                                            { label: 'Drafting & Research', desc: 'Motion drafting, petition prep', amount: '25,000' },
                                            { label: 'Court Stamps & Filing', desc: 'Auto-pulled from Pillar 2', amount: '8,500' },
                                            { label: 'Less: Retainer Used', desc: 'Deducted from Trust Wallet', amount: '-50,000' },
                                        ].map((line) => (
                                            <div key={line.label} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '10px 0', borderBottom: '1px solid rgba(0,0,0,0.04)',
                                            }}>
                                                <div>
                                                    <div style={{ fontSize: 15, fontWeight: 600, color: NAVY }}>{line.label}</div>
                                                    <div style={{ fontSize: 13, color: GRAY_400 }}>{line.desc}</div>
                                                </div>
                                                <div style={{
                                                    fontSize: 15, fontWeight: 700,
                                                    color: line.amount.startsWith('-') ? '#ef4444' : NAVY,
                                                }}>LKR {line.amount}</div>
                                            </div>
                                        ))}
                                        <div style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '14px 0 0', marginTop: 8,
                                            borderTop: `2px solid ${NAVY}`,
                                        }}>
                                            <div style={{ fontSize: 16, fontWeight: 800, color: NAVY }}>Balance Due</div>
                                            <div style={{ fontSize: 20, fontWeight: 800, color: GOLD_DARK }}>LKR 58,500</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 18px', borderRadius: 99,
                                            background: '#dcfce7', color: '#166534',
                                            fontSize: 13, fontWeight: 700,
                                        }}>
                                            📱 WhatsApp Ready
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 18px', borderRadius: 99,
                                            background: '#dbeafe', color: '#1e40af',
                                            fontSize: 13, fontWeight: 700,
                                        }}>
                                            💳 PayHere Link Embedded
                                        </div>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '10px 18px', borderRadius: 99,
                                            background: '#fef3c7', color: '#92400e',
                                            fontSize: 13, fontWeight: 700,
                                        }}>
                                            📄 Professional PDF
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ── PILLAR 4: Notary Public Escrow Tracker ── */}
                        <div className="sr lex-pillar-card" style={{ marginBottom: 0 }}>
                            <div className="lex-pillar-inner" style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: 20, flexShrink: 0,
                                    background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 40, boxShadow: '0 8px 24px rgba(15,23,42,0.2)',
                                }}>🔒</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '4px 12px', borderRadius: 99,
                                        background: 'rgba(245,158,11,0.1)', color: GOLD_DARK,
                                        fontSize: 12, fontWeight: 800, letterSpacing: '0.05em',
                                        textTransform: 'uppercase', marginBottom: 12,
                                    }}>Pillar 4</div>
                                    <h3 style={{
                                        fontSize: 28, fontWeight: 800, color: NAVY,
                                        marginBottom: 16, fontFamily: FONT_HEADING, letterSpacing: '-0.01em',
                                    }}>
                                        Notary Public Escrow Tracker
                                    </h3>
                                    <p style={{
                                        fontSize: 13, fontWeight: 700, color: GOLD_DARK,
                                        textTransform: 'uppercase', letterSpacing: '0.03em', marginBottom: 12,
                                    }}>
                                        Government Money Stays Locked. Your Reputation Stays Clean.
                                    </p>
                                    <p style={{ fontSize: 16, color: GRAY_600, lineHeight: 1.8, marginBottom: 24 }}>
                                        When a client gives you stamp duty money, the system locks it in a
                                        <strong style={{ color: NAVY }}> Government Escrow</strong> wallet with a countdown timer
                                        showing when those stamps must be purchased and submitted. This prevents
                                        accidental spending of government-destined funds — protecting you from
                                        disciplinary action by the Notaries Commission.
                                    </p>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {[
                                            { icon: '💰', text: 'Client pays LKR 150,000 stamp duty → Locked in Government Escrow' },
                                            { icon: '⏳', text: 'Countdown timer: "14 days remaining to purchase stamps"' },
                                            { icon: '🚨', text: 'Alert at 7 days, 3 days, 1 day — never miss a deadline' },
                                            { icon: '✅', text: 'Mark as "Stamps Purchased" → Escrow released, transaction logged' },
                                        ].map((item, i) => (
                                            <div key={i} className="lex-workflow-step">
                                                <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
                                                <span style={{ fontSize: 14, color: NAVY_MID, fontWeight: 500, lineHeight: 1.5 }}>{item.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    4. IRD TAX DEDUCTIONS
                ═══════════════════════════════════════════════ */}
                <section id="tax" style={{
                    padding: '100px 0',
                    background: `linear-gradient(180deg, ${GRAY_100}, #f8fafc)`,
                    position: 'relative',
                }}>
                    <div className="lex-container">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '8px 18px', borderRadius: 99,
                                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                                color: '#059669', fontSize: 13, fontWeight: 700,
                                letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24,
                            }}>
                                💰 Save Money on Taxes
                            </div>
                            <h2 className="lex-section-title" style={{
                                fontSize: '3rem', fontWeight: 800, color: NAVY,
                                letterSpacing: '-0.02em', marginBottom: 20,
                                fontFamily: FONT_HEADING,
                            }}>
                                IRD Tax Deductions — Pre-Loaded
                            </h2>
                            <p style={{ fontSize: 18, color: GRAY_600, maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
                                Stop overpaying the Inland Revenue Department. Every legitimate deduction for
                                legal professionals, pre-loaded and ready to track.
                            </p>
                        </div>

                        <div className="sr lex-grid-3" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: 24,
                            marginBottom: 40,
                        }}>
                            {[
                                { icon: '⚖️', title: 'BASL Annual Subscription', desc: 'Bar Association of Sri Lanka membership fees — fully deductible' },
                                { icon: '📜', title: 'Notary License Renewal', desc: 'Annual notary public license renewal fees' },
                                { icon: '👨‍⚖️', title: 'Junior Counsel Salaries', desc: 'Wages paid to junior counsel and apprentice attorneys' },
                                { icon: '🏢', title: 'Chamber Rent', desc: 'Office rent, electricity, water, and maintenance of your chambers' },
                                { icon: '👔', title: 'Professional Attire', desc: 'Court dress including coat, bands, and gown' },
                                { icon: '📚', title: 'Legal Subscriptions', desc: 'Law reports, journals, LawNet access, and legal databases' },
                            ].map((item) => (
                                <div key={item.title} className="lex-tax-card">
                                    <div style={{ fontSize: 36, marginBottom: 16 }}>{item.icon}</div>
                                    <h4 style={{
                                        fontSize: 17, fontWeight: 700, color: NAVY,
                                        marginBottom: 8, fontFamily: FONT_HEADING,
                                    }}>{item.title}</h4>
                                    <p style={{ fontSize: 14, color: GRAY_600, lineHeight: 1.6 }}>{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <div className="sr" style={{
                            padding: '24px 32px', borderRadius: 20,
                            background: '#ecfdf5', border: '1px solid rgba(16,185,129,0.2)',
                            textAlign: 'center',
                        }}>
                            <p style={{ fontSize: 16, color: '#065f46', fontWeight: 600, lineHeight: 1.6 }}>
                                🎯 All deductions are categorized per IRD guidelines. At year-end, generate a
                                <strong> Tax Deduction Summary</strong> report with one click — ready for your accountant or self-filing.
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    5. SMART PRACTICE TOOLS + AI ADD-ONS (Compact)
                ═══════════════════════════════════════════════ */}
                <section id="ai-tools" style={{
                    padding: '100px 0', background: NAVY,
                    position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '10%', left: '-10%',
                        width: 500, height: 500,
                        background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 60%)',
                        filter: 'blur(80px)', zIndex: 0,
                    }} />
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
                        background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)',
                    }} />

                    <div className="lex-container" style={{ position: 'relative', zIndex: 1 }}>
                        {/* Court Diary Feature */}
                        <div className="sr" style={{
                            display: 'flex', gap: 48, alignItems: 'center',
                            marginBottom: 72, flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: '1 1 350px' }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '6px 14px', borderRadius: 99,
                                    background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                                    color: GOLD_LIGHT, fontSize: 12, fontWeight: 700,
                                    letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 16,
                                }}>
                                    📅 Practice Management
                                </div>
                                <h3 style={{
                                    fontSize: 28, fontWeight: 800, color: WHITE,
                                    marginBottom: 16, fontFamily: FONT_HEADING, lineHeight: 1.2,
                                }}>
                                    Smart Court Diary
                                </h3>
                                <p style={{ fontSize: 16, color: GRAY_400, lineHeight: 1.8, marginBottom: 20 }}>
                                    Detects scheduling clashes between Hulftsdorp and Outstation courts.
                                    Instant Conflict of Interest checks across all your active cases.
                                    Never double-book a hearing again.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {['Hulftsdorp + Outstation clash detection', 'Conflict of Interest alerts', 'Case-linked diary entries', 'Offline-first — works without signal'].map((f) => (
                                        <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#e2e8f0' }}>
                                            <span style={{ color: '#34d399', fontSize: 14 }}>✓</span> {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div style={{
                                flex: '1 1 300px',
                                background: 'rgba(30, 41, 59, 0.5)',
                                borderRadius: 20, padding: 32,
                                border: '1px solid rgba(255,255,255,0.08)',
                                textAlign: 'center',
                            }}>
                                <div style={{ fontSize: 64, marginBottom: 16 }}>📅</div>
                                <div style={{ fontSize: 14, color: GRAY_400, fontWeight: 600 }}>
                                    Integrated with your Accounting Engine — every court date links to case expenses and billing
                                </div>
                            </div>
                        </div>

                        {/* AI Add-Ons (Compact) */}
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '8px 16px', borderRadius: 99,
                                background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
                                color: GOLD_LIGHT, fontSize: 13, fontWeight: 700,
                                letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 20,
                            }}>
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: GOLD, boxShadow: `0 0 12px ${GOLD}`,
                                }} />
                                Token-Powered Add-Ons
                            </div>
                            <h3 style={{
                                fontSize: 24, fontWeight: 800, color: WHITE,
                                fontFamily: FONT_HEADING, marginBottom: 12,
                            }}>
                                AI-Powered Extras
                            </h3>
                            <p style={{ fontSize: 15, color: GRAY_400, maxWidth: 550, margin: '0 auto', lineHeight: 1.7 }}>
                                The shiny tools that save you hours — available as token-based add-ons.
                            </p>
                        </div>

                        <div className="lex-grid-3" style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24,
                        }}>
                            {[
                                { icon: '📜', title: 'Letter of Demand', desc: 'AI-generated with proper legal formatting and clause references.' },
                                { icon: '🔍', title: 'Vision AI for Deeds', desc: 'Extract title details from 50-year-old faded deeds.' },
                                { icon: '⚡', title: 'Judgment Summarizer', desc: 'Summarize Supreme Court Judgments into citable briefs.' },
                            ].map((card) => (
                                <div key={card.title} className="lex-ai-card" style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{
                                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                        background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                                    }} />
                                    <div style={{ fontSize: 32, marginBottom: 16 }}>{card.icon}</div>
                                    <h4 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 10, fontFamily: FONT_HEADING }}>
                                        {card.title}
                                    </h4>
                                    <p style={{ fontSize: 14, color: GRAY_400, lineHeight: 1.7, flex: 1, marginBottom: 16 }}>
                                        {card.desc}
                                    </p>
                                    <span style={{
                                        display: 'inline-block',
                                        background: 'rgba(245,158,11,0.15)', color: GOLD_LIGHT,
                                        border: '1px solid rgba(245,158,11,0.3)',
                                        padding: '5px 14px', borderRadius: 99,
                                        fontSize: 11, fontWeight: 700,
                                        letterSpacing: '0.04em', textTransform: 'uppercase',
                                        alignSelf: 'flex-start',
                                    }}>
                                        Coming Soon
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    5. SECURITY BANNER
                ═══════════════════════════════════════════════ */}
                <section id="security" style={{
                    padding: '100px 0', background: GRAY_100, position: 'relative',
                }}>
                    <div className="lex-container">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 60 }}>
                            <h2 className="lex-section-title" style={{
                                fontSize: '3rem', fontWeight: 800, color: NAVY,
                                letterSpacing: '-0.02em', marginBottom: 20,
                                fontFamily: FONT_HEADING,
                            }}>
                                Your Privilege. Our Priority.
                            </h2>
                            <p style={{ fontSize: 18, color: GRAY_600, maxWidth: 600, margin: '0 auto', lineHeight: 1.7 }}>
                                Enterprise-grade security that meets the highest standards of attorney-client confidentiality.
                            </p>
                        </div>

                        <div className="sr lex-security-badges" style={{
                            display: 'flex', gap: 32,
                            justifyContent: 'center', flexWrap: 'wrap',
                        }}>
                            {[
                                { icon: '🔐', text: 'Bank-Grade AES-256 Encryption' },
                                { icon: '🛡️', text: 'Strict Attorney-Client Privilege Protocols' },
                                { icon: '✅', text: '100% Compliant with Sri Lanka PDPA No. 9 of 2022' },
                            ].map((badge) => (
                                <div key={badge.text} style={{
                                    flex: '1 1 280px', maxWidth: 360,
                                    background: WHITE,
                                    borderRadius: 20, padding: '36px 32px',
                                    textAlign: 'center',
                                    border: '1px solid rgba(0,0,0,0.06)',
                                    boxShadow: '0 4px 16px -4px rgba(0,0,0,0.04)',
                                    transition: 'all 0.3s',
                                }}>
                                    <div style={{ fontSize: 40, marginBottom: 16 }}>{badge.icon}</div>
                                    <p style={{
                                        fontSize: 16, fontWeight: 600, color: NAVY,
                                        lineHeight: 1.5,
                                    }}>
                                        {badge.text}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    6. PRICING SECTION
                ═══════════════════════════════════════════════ */}
                <section id="pricing" style={{ padding: '120px 0', background: '#f8fafc', position: 'relative' }}>
                    <div className="lex-container">
                        {/* Section Header */}
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 56 }}>
                            <h2 className="lex-section-title" style={{
                                fontSize: '3rem', fontWeight: 800, color: NAVY,
                                letterSpacing: '-0.02em', marginBottom: 20,
                                fontFamily: FONT_HEADING,
                            }}>
                                Simple, Transparent Pricing
                            </h2>
                            <p style={{ fontSize: 18, color: GRAY_600, maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
                                Plans crafted for every stage of your legal career, from pupil to senior counsel.
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="sr" style={{ display: 'flex', justifyContent: 'center', marginBottom: 56 }}>
                            <div style={{
                                background: GRAY_100, padding: 6, borderRadius: 99,
                                display: 'inline-flex', alignItems: 'center',
                            }}>
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    style={{
                                        padding: '12px 32px', borderRadius: 99,
                                        border: 'none',
                                        background: billingCycle === 'monthly' ? WHITE : 'transparent',
                                        color: billingCycle === 'monthly' ? NAVY : GRAY_400,
                                        fontWeight: 700, fontSize: 15,
                                        cursor: 'pointer', transition: 'all 0.3s',
                                        boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                        fontFamily: FONT_BODY,
                                    }}
                                >
                                    Monthly
                                </button>
                                <button
                                    onClick={() => setBillingCycle('annual')}
                                    style={{
                                        padding: '12px 32px', borderRadius: 99,
                                        border: 'none',
                                        background: billingCycle === 'annual' ? WHITE : 'transparent',
                                        color: billingCycle === 'annual' ? NAVY : GRAY_400,
                                        fontWeight: 700, fontSize: 15,
                                        cursor: 'pointer', transition: 'all 0.3s',
                                        boxShadow: billingCycle === 'annual' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                                        fontFamily: FONT_BODY,
                                    }}
                                >
                                    Annual{' '}
                                    <span style={{
                                        background: '#10b981', color: WHITE,
                                        padding: '4px 10px', borderRadius: 99,
                                        fontSize: 12, fontWeight: 800, marginLeft: 8,
                                    }}>
                                        Save More!
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Pricing Cards */}
                        <div className="lex-pricing-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${pricing.tiers.length}, 1fr)`,
                            gap: 32,
                            alignItems: 'stretch',
                        }}>
                            {pricing.tiers.map((tier, idx) => {
                                const isHighlighted = tier.highlighted === true;
                                const price = billingCycle === 'annual' ? tier.annualPrice : tier.monthlyPrice;
                                const isFree = price === 0;
                                const monthlyEquivalent = billingCycle === 'annual' && tier.annualPrice > 0
                                    ? Math.round(tier.annualPrice / 12)
                                    : null;
                                const strikethroughAnnual = billingCycle === 'annual' && tier.monthlyPrice > 0
                                    ? tier.monthlyPrice * 12
                                    : null;

                                return (
                                    <div
                                        key={tier.id}
                                        className={`sr lex-pricing-card ${isHighlighted ? 'lex-pricing-highlighted' : ''}`}
                                        style={{
                                            transitionDelay: `${idx * 100}ms`,
                                            ...(isHighlighted ? {
                                                background: `linear-gradient(135deg, ${NAVY}, ${NAVY_LIGHT})`,
                                                border: `2px solid ${GOLD}`,
                                                boxShadow: '0 40px 80px -20px rgba(245, 158, 11, 0.2)',
                                                position: 'relative' as const,
                                                transform: 'scale(1.04)',
                                                zIndex: 2,
                                            } : {}),
                                        }}
                                    >
                                        {/* "Most Popular" badge */}
                                        {isHighlighted && (
                                            <div style={{
                                                position: 'absolute', top: -16, left: '50%',
                                                transform: 'translateX(-50%)',
                                                background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
                                                color: NAVY, padding: '6px 20px',
                                                borderRadius: 99, fontSize: 13, fontWeight: 800,
                                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                                boxShadow: '0 8px 16px rgba(245,158,11,0.3)',
                                                whiteSpace: 'nowrap',
                                            }}>
                                                Most Popular
                                            </div>
                                        )}

                                        {/* Tier Name */}
                                        <div style={{
                                            fontSize: 14, fontWeight: 800,
                                            color: isHighlighted ? GOLD_LIGHT : GOLD_DARK,
                                            textTransform: 'uppercase', marginBottom: 8,
                                            letterSpacing: '0.05em',
                                        }}>
                                            {tier.tierKey === 'free' ? '🌱' : tier.tierKey === 'pro' ? '⚖️' : '🏛️'} Tier {idx + 1}
                                        </div>
                                        <div style={{
                                            fontSize: 24, fontWeight: 800,
                                            color: isHighlighted ? WHITE : NAVY,
                                            marginBottom: 16, fontFamily: FONT_HEADING,
                                        }}>
                                            {tier.name}
                                        </div>

                                        {/* Price */}
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                            {strikethroughAnnual && strikethroughAnnual > price ? (
                                                <span style={{
                                                    fontSize: '1.4rem', fontWeight: 600,
                                                    color: GRAY_400, textDecoration: 'line-through',
                                                }}>
                                                    {formatLKR(strikethroughAnnual)}
                                                </span>
                                            ) : null}
                                            <span style={{
                                                fontSize: '2.8rem', fontWeight: 800,
                                                color: isHighlighted ? WHITE : NAVY,
                                                letterSpacing: '-0.04em',
                                            }}>
                                                {isFree ? 'Free' : formatLKR(price)}
                                            </span>
                                        </div>
                                        <div style={{
                                            fontSize: 14,
                                            color: isHighlighted ? GRAY_400 : GRAY_600,
                                            fontWeight: 600, marginBottom: 32,
                                        }}>
                                            {isFree
                                                ? 'Free Forever — No credit card required'
                                                : billingCycle === 'annual' && monthlyEquivalent
                                                    ? `/ year — That's just ${formatLKR(monthlyEquivalent)}/mo`
                                                    : '/ month'
                                            }
                                        </div>

                                        {/* CTA Button */}
                                        <button
                                            onClick={onGetStarted}
                                            style={{
                                                width: '100%',
                                                marginBottom: 32,
                                                padding: '16px',
                                                borderRadius: 99,
                                                fontWeight: 700,
                                                fontSize: 16,
                                                cursor: 'pointer',
                                                fontFamily: FONT_BODY,
                                                transition: 'all 0.3s',
                                                ...(isHighlighted ? {
                                                    background: `linear-gradient(135deg, ${GOLD}, ${GOLD_DARK})`,
                                                    color: NAVY,
                                                    border: 'none',
                                                    boxShadow: '0 6px 20px rgba(245,158,11,0.3)',
                                                } : {
                                                    background: '#f8fafc',
                                                    color: NAVY,
                                                    border: '1px solid rgba(0,0,0,0.1)',
                                                }),
                                            }}
                                        >
                                            {isFree ? 'Get Started Free' : tier.tierKey === 'chambers' ? 'Contact Sales' : 'Start 14-Day Free Trial'}
                                        </button>

                                        {/* Badge callout */}
                                        {tier.badge && (
                                            <div style={{
                                                fontSize: 13,
                                                color: isHighlighted ? GRAY_300 : GRAY_600,
                                                background: isHighlighted ? 'rgba(255,255,255,0.05)' : GRAY_100,
                                                padding: 16, borderRadius: 16,
                                                marginBottom: 28,
                                                display: 'flex', gap: 12, alignItems: 'flex-start',
                                                lineHeight: 1.5,
                                            }}>
                                                <div style={{ fontSize: 20 }}>🛡️</div>
                                                <div><strong>{tier.badge}</strong></div>
                                            </div>
                                        )}

                                        {/* Feature List */}
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                            {tier.features.map((feature, fi) => (
                                                <div key={fi} style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                                    fontSize: 15,
                                                    color: isHighlighted ? '#e2e8f0' : GRAY_600,
                                                    fontWeight: 500,
                                                }}>
                                                    <span style={{ color: '#34d399', fontSize: 14, marginTop: 2, flexShrink: 0 }}>✓</span>
                                                    <span style={{ lineHeight: 1.5 }}>{feature}</span>
                                                </div>
                                            ))}
                                            {tier.aiTokens > 0 && (
                                                <div style={{
                                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                                    fontSize: 15, fontWeight: 700,
                                                    color: isHighlighted ? GOLD_LIGHT : GOLD_DARK,
                                                }}>
                                                    <span style={{ fontSize: 14, marginTop: 2, flexShrink: 0 }}>🎁</span>
                                                    <span style={{ lineHeight: 1.5 }}>{tier.aiTokens} AI Tokens/month included</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Token Store Callout */}
                        <div className="sr lex-token-callout" style={{
                            marginTop: 56, padding: '36px 44px',
                            background: WHITE, borderRadius: 24,
                            border: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex', gap: 40, alignItems: 'center',
                            boxShadow: '0 10px 30px -12px rgba(0,0,0,0.05)',
                            flexWrap: 'wrap',
                        }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <div style={{
                                    fontSize: 14, fontWeight: 800, color: GOLD_DARK,
                                    textTransform: 'uppercase', marginBottom: 12,
                                    letterSpacing: '0.05em',
                                }}>
                                    🪙 AI Token Store — Pay-As-You-Go
                                </div>
                                <h3 style={{
                                    fontSize: '1.8rem', fontWeight: 800, color: NAVY,
                                    marginBottom: 16, letterSpacing: '-0.02em',
                                    lineHeight: 1.2, fontFamily: FONT_HEADING,
                                }}>
                                    Need more AI power?
                                </h3>
                                <div style={{
                                    display: 'inline-block',
                                    background: '#fffbeb', color: '#b45309',
                                    padding: '14px 22px', borderRadius: 16,
                                    fontSize: 17, fontWeight: 800,
                                    border: '1px solid #fde68a',
                                }}>
                                    {formatLKR(pricing.tokenStore.price)}{' '}
                                    <span style={{ fontSize: 14, fontWeight: 600, color: GOLD_DARK, opacity: 0.8 }}>
                                        for {pricing.tokenStore.tokens} Tokens
                                    </span>
                                </div>
                            </div>
                            <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                                {[
                                    { t: '1 Token', d: 'Generate a PDF Letter of Demand' },
                                    { t: '2 Tokens', d: 'AI Case Minutes from voice note' },
                                    { t: '3 Tokens', d: 'Vision AI deed title extraction' },
                                    { t: '5 Tokens', d: 'Summarize a Supreme Court Judgment' },
                                ].map((item, i) => (
                                    <div key={i} style={{
                                        display: 'flex', gap: 16, alignItems: 'center',
                                        background: '#f8fafc', padding: '12px 16px',
                                        borderRadius: 12,
                                    }}>
                                        <div style={{
                                            background: NAVY, color: WHITE,
                                            fontSize: 12, fontWeight: 800,
                                            padding: '4px 10px', borderRadius: 8,
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {item.t}
                                        </div>
                                        <div style={{ fontSize: 14, color: NAVY_MID, fontWeight: 500, lineHeight: 1.4 }}>
                                            {item.d}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══════════════════════════════════════════════
                    7. FOOTER
                ═══════════════════════════════════════════════ */}
                <footer style={{
                    background: NAVY, padding: '72px 0 40px',
                    borderTop: `1px solid rgba(245,158,11,0.1)`,
                }}>
                    <div className="lex-container">
                        {/* Logo + Description */}
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                justifyContent: 'center', marginBottom: 16,
                            }}>
                                <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ width: 36, height: 36, objectFit: 'contain' }} />
                                <span style={{
                                    fontSize: 24, fontWeight: 800, color: GOLD,
                                    fontFamily: FONT_HEADING,
                                }}>
                                    LexTracksy
                                </span>
                            </div>
                            <p style={{
                                fontSize: 15, color: GRAY_400, lineHeight: 1.7,
                                maxWidth: 450, margin: '0 auto',
                            }}>
                                Complete legal accounting engine with AI-powered add-ons, built exclusively for Sri Lankan Attorneys-at-Law.
                            </p>
                        </div>

                        {/* Links Row */}
                        <div style={{
                            display: 'flex', justifyContent: 'center', gap: 32,
                            marginBottom: 40, flexWrap: 'wrap',
                        }}>
                            {['Terms', 'Privacy', 'PDPA'].map((link) => (
                                <span key={link} style={{
                                    fontSize: 14, color: GRAY_400, cursor: 'pointer',
                                    fontWeight: 500, transition: 'color 0.2s',
                                }}>
                                    {link}
                                </span>
                            ))}
                        </div>

                        {/* Divider */}
                        <div style={{
                            height: 1,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                            marginBottom: 32,
                        }} />

                        {/* Bottom Bar */}
                        <div className="lex-footer-bottom" style={{
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', flexWrap: 'wrap', gap: 16,
                        }}>
                            <div style={{ fontSize: 13, color: GRAY_400 }}>
                                Designed & Engineered by{' '}
                                <a
                                    href="https://safenetcreations.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ color: GOLD, textDecoration: 'none', fontWeight: 600 }}
                                >
                                    SafeNet Creations
                                </a>
                            </div>
                            <div style={{ fontSize: 13, color: GRAY_400 }}>
                                © 2026 LexTracksy. A MyTracksy Professional Product.
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default LawyerLandingPage;
