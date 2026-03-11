import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { getPricingForProfession } from '../config/pricingConfig';

/* ───────────────────── Theme Constants ───────────────────── */
const OCEAN = '#0c4a6e';
const OCEAN_LIGHT = '#0e5a82';
const OCEAN_MID = '#155e75';
const CYAN = '#06b6d4';
const CYAN_DARK = '#0891b2';
const CYAN_LIGHT = '#22d3ee';
const AQUA_GREEN = '#10b981';
const WHITE = '#ffffff';
const GRAY_100 = '#f0f9ff';
const GRAY_300 = '#bae6fd';
const GRAY_400 = '#7dd3fc';
const GRAY_600 = '#475569';
const SAND = '#fef3c7';

const FONT_HEADING = "'Playfair Display', Georgia, serif";
const FONT_BODY = "'Inter', 'Plus Jakarta Sans', system-ui, sans-serif";

/* ───────────────────── Props ───────────────────── */
interface AquaLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

/* ───────────────────── Component ───────────────────── */
const AquaLandingPage: React.FC<AquaLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [navSolid, setNavSolid] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

    const pricing = getPricingForProfession('aquaculture');

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
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        (entry.target as HTMLElement).style.opacity = '1';
                        (entry.target as HTMLElement).style.transform = 'translateY(0)';
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
        );
        setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => observer.observe(el));
        }, 100);
        return () => observer.disconnect();
    }, []);

    /* ── Helpers ── */
    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    const formatLKR = (amount: number): string => {
        return `LKR ${amount.toLocaleString('en-LK')}`;
    };

    /* ───────────────────── RENDER ───────────────────── */
    return (
        <>
            {/* ═══ SEO / Helmet ═══ */}
            <Helmet>
                <title>AquaTracksy | Voice-Powered Farm Finance for Sri Lankan Aquaculture</title>
                <meta name="description" content="The first financial OS for Sri Lanka's Blue Economy. Track pond costs, feed inventory, and harvest profits using just your voice. Tamil & Sinhala Voice AI. Offline-first. Built for Shrimp, Sea Cucumber, and Seaweed farmers." />
                <meta name="keywords" content="aquaculture software sri lanka, shrimp farming app, sea cucumber tracking, pond management app, feed conversion ratio tracker, harvest accounting, voice AI farming, aqua farm finance, NAQDA compliance, fish farming software" />
                <link rel="canonical" href="https://mytracksy.lk/aqua" />
                <meta property="og:title" content="AquaTracksy — Voice-Powered Farm Finance for Aquaculture" />
                <meta property="og:description" content="Wet hands? No problem. Track your farm with your voice. The ultimate offline financial app for Shrimp, Sea Cucumber, and Seaweed farmers." />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://mytracksy.lk/aqua" />
                <script type="application/ld+json">{JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "SoftwareApplication",
                    "name": "AquaTracksy",
                    "applicationCategory": "FinanceApplication",
                    "operatingSystem": "Web, Android, iOS",
                    "description": "Voice-powered aquaculture financial management for Sri Lankan farmers. Pond-by-pond profit tracking, feed inventory & FCR, harvest invoicing.",
                    "offers": { "@type": "AggregateOffer", "priceCurrency": "LKR", "lowPrice": "0", "highPrice": "14900" }
                })}</script>
            </Helmet>

            {/* ═══ Injected Styles ═══ */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
                .sr { opacity: 0; transform: translateY(32px); transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1); }
                .aqua-pillar-card { background: ${WHITE}; border-radius: 16px; padding: 32px; box-shadow: 0 4px 24px rgba(0,0,0,0.08); border: 1px solid #e0f2fe; transition: transform 0.25s, box-shadow 0.25s; }
                .aqua-pillar-card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(6,182,212,0.15); }
                .aqua-workflow-step { background: linear-gradient(135deg, #ecfeff 0%, #f0f9ff 100%); border-radius: 12px; padding: 16px; text-align: center; position: relative; }
                .aqua-workflow-arrow { color: ${CYAN}; font-size: 20px; display: flex; align-items: center; font-weight: 700; }
                .aqua-voice-btn { background: linear-gradient(135deg, ${CYAN} 0%, ${AQUA_GREEN} 100%); border: none; border-radius: 50%; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 8px 32px rgba(6,182,212,0.4); transition: transform 0.2s, box-shadow 0.2s; animation: voicePulse 2s infinite; }
                .aqua-voice-btn:hover { transform: scale(1.1); box-shadow: 0 12px 40px rgba(6,182,212,0.6); }
                @keyframes voicePulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(6,182,212,0.4); } 50% { box-shadow: 0 0 0 20px rgba(6,182,212,0); } }
                .aqua-token-card { background: ${WHITE}; border-radius: 16px; padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e0f2fe; text-align: center; }
                .aqua-grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
                .aqua-grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
                .aqua-wave-divider { position: relative; overflow: hidden; }
                .aqua-wave-divider::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 60px; background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 60'%3E%3Cpath fill='%23ffffff' d='M0,30 C240,60 480,0 720,30 C960,60 1200,0 1440,30 L1440,60 L0,60 Z'/%3E%3C/svg%3E") no-repeat bottom center; background-size: cover; }
                @media (max-width: 768px) {
                    .aqua-grid-2 { grid-template-columns: 1fr; }
                    .aqua-grid-4 { grid-template-columns: repeat(2, 1fr); }
                    .aqua-workflow-arrow { transform: rotate(90deg); justify-content: center; }
                    .aqua-voice-btn { width: 100px; height: 100px; }
                }
                @media (max-width: 480px) {
                    .aqua-grid-4 { grid-template-columns: 1fr; }
                }
            `}</style>

            <div style={{ background: WHITE, fontFamily: FONT_BODY, color: '#1e293b', minHeight: '100vh' }}>
                {/* ═══ Navigation ═══ */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
                    background: navSolid ? OCEAN : 'transparent',
                    backdropFilter: navSolid ? 'blur(12px)' : 'none',
                    transition: 'background 0.3s, backdrop-filter 0.3s',
                    borderBottom: navSolid ? '1px solid rgba(6,182,212,0.2)' : 'none',
                }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 64 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <button onClick={onBack} style={{ background: 'none', border: 'none', color: WHITE, fontSize: 20, cursor: 'pointer', padding: '4px 8px' }}>←</button>
                            <span style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 22, color: WHITE }}>
                                🐟 Aqua<span style={{ color: CYAN_LIGHT }}>Tracksy</span>
                            </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            {['Voice Engine', 'Pond Accounting', 'AI Tokens', 'Pricing'].map((label, i) => (
                                <button key={label} onClick={() => scrollTo(['voice', 'accounting', 'ai-tokens', 'pricing'][i])}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: 14, cursor: 'pointer', fontWeight: 500, display: window.innerWidth < 768 && i > 1 ? 'none' : 'block' }}>
                                    {label}
                                </button>
                            ))}
                            <button onClick={onLogin} style={{ background: 'none', border: `1px solid ${CYAN}`, color: CYAN_LIGHT, padding: '8px 20px', borderRadius: 8, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>Sign In</button>
                        </div>
                    </div>
                </nav>

                {/* ═══ SECTION 1 — Hero ═══ */}
                <section style={{
                    background: `linear-gradient(160deg, ${OCEAN} 0%, #0c4a6e 40%, #164e63 70%, #134e4a 100%)`,
                    padding: '140px 24px 100px',
                    textAlign: 'center',
                    position: 'relative',
                    overflow: 'hidden',
                }} className="aqua-wave-divider">
                    {/* Floating bubbles decoration */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.08, pointerEvents: 'none' }}>
                        {[...Array(6)].map((_, i) => (
                            <div key={i} style={{
                                position: 'absolute',
                                width: 40 + i * 20,
                                height: 40 + i * 20,
                                borderRadius: '50%',
                                border: '2px solid white',
                                left: `${10 + i * 15}%`,
                                top: `${20 + (i % 3) * 25}%`,
                            }} />
                        ))}
                    </div>

                    <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 2 }}>
                        <span style={{
                            display: 'inline-block',
                            background: 'rgba(6,182,212,0.2)',
                            border: '1px solid rgba(6,182,212,0.4)',
                            color: CYAN_LIGHT,
                            fontSize: 13,
                            fontWeight: 600,
                            padding: '6px 16px',
                            borderRadius: 20,
                            marginBottom: 24,
                            letterSpacing: '0.5px',
                        }}>
                            🇱🇰 THE FINANCIAL OS FOR SRI LANKA'S BLUE ECONOMY
                        </span>

                        <h1 style={{
                            fontFamily: FONT_HEADING, fontSize: 'clamp(32px, 5vw, 56px)',
                            fontWeight: 800, color: WHITE, lineHeight: 1.15, marginBottom: 20,
                        }}>
                            Wet Hands? No Problem.<br />
                            <span style={{ color: CYAN_LIGHT }}>Track Your Farm With Your Voice.</span>
                        </h1>

                        <p style={{
                            fontSize: 18, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7,
                            maxWidth: 640, margin: '0 auto 16px',
                        }}>
                            The ultimate offline financial app for Shrimp, Sea Cucumber, and Seaweed farmers.
                            Track daily feed costs, worker payments, and exact profit margins per pond —
                            <strong style={{ color: CYAN_LIGHT }}> using just your voice</strong>. Speak in Tamil or Sinhala.
                        </p>

                        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 36 }}>
                            Stop using soggy CR books. Let AI build your farm's balance sheet instantly.
                        </p>

                        {/* Giant Voice Button */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
                            <button className="aqua-voice-btn" onClick={onGetStarted} style={{ fontSize: 48 }}>
                                🎙️
                            </button>
                        </div>

                        <button onClick={onGetStarted} style={{
                            background: `linear-gradient(135deg, ${CYAN} 0%, ${AQUA_GREEN} 100%)`,
                            color: WHITE, border: 'none', padding: '16px 40px', borderRadius: 12,
                            fontSize: 17, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(6,182,212,0.4)',
                        }}>
                            Start Your 14-Day Free Trial →
                        </button>
                    </div>
                </section>

                {/* ═══ SECTION 2 — The Voice Engine ═══ */}
                <section id="voice" style={{ padding: '80px 24px', background: WHITE }}>
                    <div className="sr" style={{ maxWidth: 1000, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <span style={{ color: CYAN_DARK, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                                CORE INNOVATION
                            </span>
                            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: OCEAN, marginTop: 8 }}>
                                The "Wet-Hands" Voice Accountant
                            </h2>
                            <p style={{ color: GRAY_600, fontSize: 17, maxWidth: 600, margin: '12px auto 0', lineHeight: 1.6 }}>
                                Tamil &amp; Sinhala NLP — One massive button, zero typing required.
                            </p>
                        </div>

                        {/* Voice Demo Flow */}
                        <div className="aqua-pillar-card" style={{ maxWidth: 800, margin: '0 auto', background: `linear-gradient(135deg, #ecfeff 0%, #f0f9ff 100%)`, border: '2px solid #a5f3fc' }}>
                            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                <span style={{ fontSize: 48 }}>🎙️</span>
                                <p style={{ fontWeight: 700, color: OCEAN, fontSize: 18, marginTop: 8 }}>The Problem</p>
                                <p style={{ color: GRAY_600, fontSize: 15 }}>
                                    A farm manager standing on the edge of a lagoon with wet, muddy hands cannot pull out a smartphone and type into Excel.
                                </p>
                            </div>

                            <div style={{ background: WHITE, borderRadius: 12, padding: 24, marginBottom: 20 }}>
                                <p style={{ fontWeight: 700, color: OCEAN, fontSize: 16, marginBottom: 12 }}>🗣️ Just speak naturally:</p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                    <div style={{ background: '#f0fdfa', padding: 16, borderRadius: 10, borderLeft: `4px solid ${AQUA_GREEN}` }}>
                                        <p style={{ fontSize: 14, color: OCEAN, fontStyle: 'italic', marginBottom: 4 }}>
                                            "Pond 3 ta kema kilo visai, baas ta daaha dunna"
                                        </p>
                                        <p style={{ fontSize: 12, color: GRAY_600 }}>Sinhala — logging feed + labor payment</p>
                                    </div>
                                    <div style={{ background: '#f0fdfa', padding: 16, borderRadius: 10, borderLeft: `4px solid ${AQUA_GREEN}` }}>
                                        <p style={{ fontSize: 14, color: OCEAN, fontStyle: 'italic', marginBottom: 4 }}>
                                            "Kulam moonukku iruvathu kilo feed, velai aalukku aayiram rupa"
                                        </p>
                                        <p style={{ fontSize: 12, color: GRAY_600 }}>Tamil — same action, understood perfectly</p>
                                    </div>
                                </div>
                            </div>

                            <div style={{ background: '#ecfdf5', borderRadius: 12, padding: 20, textAlign: 'center' }}>
                                <p style={{ fontWeight: 700, color: '#065f46', fontSize: 16, marginBottom: 8 }}>✅ The AI Magic</p>
                                <p style={{ color: '#047857', fontSize: 14, lineHeight: 1.6 }}>
                                    Translates regional slang → Deducts 20kg from Feed Inventory → Logs LKR 1,000 as Labor Expense → Tags cost to <strong>Pond 3</strong> — automatically.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 3 — Pond-by-Pond Accounting Engine ═══ */}
                <section id="accounting" style={{ padding: '80px 24px', background: GRAY_100 }}>
                    <div className="sr" style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <span style={{ color: CYAN_DARK, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                                THE AQUACULTURE FINANCIAL ENGINE
                            </span>
                            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 700, color: OCEAN, marginTop: 8 }}>
                                Cycle-Based Accounting. Per-Pond Profits.
                            </h2>
                            <p style={{ color: GRAY_600, fontSize: 17, maxWidth: 650, margin: '12px auto 0', lineHeight: 1.6 }}>
                                Aquaculture accounting runs on Crop Cycles — not months. A 120-day shrimp cycle or 6-month sea cucumber grow-out. Every rupee tracked to the exact pond.
                            </p>
                        </div>

                        {/* 4-Pillar Overview Strip */}
                        <div className="aqua-grid-4" style={{ marginBottom: 48 }}>
                            {[
                                { icon: '📊', label: 'Pond-by-Pond P&L', desc: 'Know which pond makes money' },
                                { icon: '📦', label: 'Feed & FCR Tracker', desc: 'Stop overfeeding, stop theft' },
                                { icon: '🧾', label: 'Harvest Invoices', desc: 'Export-ready delivery notes' },
                                { icon: '📋', label: 'NAQDA Reports', desc: 'Bank loan & license-ready' },
                            ].map((p) => (
                                <div key={p.label} style={{
                                    background: WHITE, borderRadius: 12, padding: 20, textAlign: 'center',
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)', border: '1px solid #e0f2fe',
                                }}>
                                    <span style={{ fontSize: 32, display: 'block', marginBottom: 8 }}>{p.icon}</span>
                                    <p style={{ fontWeight: 700, color: OCEAN, fontSize: 15, marginBottom: 4 }}>{p.label}</p>
                                    <p style={{ color: GRAY_600, fontSize: 13 }}>{p.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Pillar 1 — Pond-by-Pond Profit Center */}
                        <div className="aqua-pillar-card sr" style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>📊</span>
                                <div>
                                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: OCEAN }}>
                                        Pond-by-Pond Profit Center
                                    </h3>
                                    <span style={{ background: '#ecfdf5', color: '#065f46', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12 }}>
                                        BATCH ACCOUNTING
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: GRAY_600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                                You have 10 sea cucumber pens. You buy LKR 2 Million in feed. Which pen is profitable and which is bleeding money? Every expense — Seed/PL, Feed, Labor, Probiotics — is tagged to a specific Pond ID and Batch.
                            </p>

                            {/* Workflow: How Harvest Day Works */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {[
                                    { step: '1', label: 'Tag Expense to Pond' },
                                    { step: '2', label: 'Track All Cycle Costs' },
                                    { step: '3', label: 'Harvest & Weigh' },
                                    { step: '4', label: 'Instant Cost/Kg & Profit' },
                                ].map((s, i) => (
                                    <React.Fragment key={s.step}>
                                        <div className="aqua-workflow-step" style={{ flex: '1 1 140px', minWidth: 120 }}>
                                            <div style={{ background: CYAN, color: WHITE, width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, margin: '0 auto 8px' }}>{s.step}</div>
                                            <p style={{ fontSize: 13, fontWeight: 600, color: OCEAN }}>{s.label}</p>
                                        </div>
                                        {i < 3 && <span className="aqua-workflow-arrow">→</span>}
                                    </React.Fragment>
                                ))}
                            </div>

                            <div style={{ background: '#fffbeb', borderRadius: 10, padding: 16, marginTop: 20, textAlign: 'center', border: '1px solid #fde68a' }}>
                                <p style={{ color: '#92400e', fontSize: 14, fontWeight: 600 }}>
                                    💡 On harvest day, instantly see: <strong>Cost of Production per Kg</strong> — know your true profit margin before you sell.
                                </p>
                            </div>
                        </div>

                        {/* Pillar 2 — Feed Inventory & FCR Tracker */}
                        <div className="aqua-pillar-card sr" style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>📦</span>
                                <div>
                                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: OCEAN }}>
                                        Feed Inventory &amp; FCR Tracker
                                    </h3>
                                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12 }}>
                                        ANTI-THEFT + EFFICIENCY
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: GRAY_600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                                Feed is 60% of your cost. If staff steals feed or overfeeds, your farm goes bankrupt. When you buy 100 bags, they go into the app's "Warehouse." Every voice log silently counts down inventory.
                            </p>

                            <div className="aqua-grid-2">
                                <div style={{ background: '#f0fdfa', borderRadius: 12, padding: 20 }}>
                                    <p style={{ fontWeight: 700, color: '#065f46', fontSize: 15, marginBottom: 12 }}>📦 Warehouse Tracking</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {[
                                            { item: 'Grower Feed', qty: '420 kg / 500 kg', pct: 84 },
                                            { item: 'Starter Feed', qty: '150 kg / 200 kg', pct: 75 },
                                            { item: 'Probiotics', qty: '8 L / 20 L', pct: 40 },
                                        ].map((f) => (
                                            <div key={f.item}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                                                    <span style={{ fontWeight: 600, color: OCEAN }}>{f.item}</span>
                                                    <span style={{ color: GRAY_600 }}>{f.qty}</span>
                                                </div>
                                                <div style={{ background: '#d1fae5', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                                                    <div style={{ background: f.pct > 50 ? AQUA_GREEN : '#f59e0b', width: `${f.pct}%`, height: '100%', borderRadius: 4 }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div style={{ background: '#fff7ed', borderRadius: 12, padding: 20 }}>
                                    <p style={{ fontWeight: 700, color: '#9a3412', fontSize: 15, marginBottom: 12 }}>🔬 FCR Calculator</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 12px', background: WHITE, borderRadius: 8 }}>
                                            <span style={{ color: OCEAN }}>Feed Used (Pond 3)</span>
                                            <span style={{ fontWeight: 700, color: '#9a3412' }}>1,800 kg</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '8px 12px', background: WHITE, borderRadius: 8 }}>
                                            <span style={{ color: OCEAN }}>Harvested Weight</span>
                                            <span style={{ fontWeight: 700, color: '#065f46' }}>1,000 kg</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, padding: '10px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>
                                            <span style={{ fontWeight: 700, color: '#991b1b' }}>FCR</span>
                                            <span style={{ fontWeight: 800, color: '#991b1b' }}>1.8 ⚠️</span>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: 12, color: '#9a3412', marginTop: 10, fontStyle: 'italic' }}>
                                        "Your FCR is 1.8 — you are overfeeding Pond 3. Target: 1.4"
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Pillar 3 — USD Exporter Harvest Ledger */}
                        <div className="aqua-pillar-card sr" style={{ marginBottom: 32 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>🧾</span>
                                <div>
                                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: OCEAN }}>
                                        Export-Ready Harvest Invoices
                                    </h3>
                                    <span style={{ background: '#e0f2fe', color: '#0c4a6e', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12 }}>
                                        USD / LKR DUAL CURRENCY
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: GRAY_600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                                Sea cucumbers and shrimp are exported to China and Singapore. Tracking fluctuating grading weights and calculating the final payout from Colombo export agents is confusing — until now.
                            </p>

                            {/* Mock Harvest Delivery Note */}
                            <div style={{ background: '#f8fafc', borderRadius: 12, padding: 24, border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
                                    <p style={{ fontWeight: 700, color: OCEAN, fontSize: 16 }}>📄 Harvest Delivery Note</p>
                                    <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 8 }}>PDF → WhatsApp</span>
                                </div>
                                <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #e2e8f0' }}>
                                            <th style={{ textAlign: 'left', padding: '8px 4px', color: GRAY_600 }}>Grade</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: GRAY_600 }}>Weight (kg)</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: GRAY_600 }}>Rate (USD)</th>
                                            <th style={{ textAlign: 'right', padding: '8px 4px', color: GRAY_600 }}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { grade: 'Grade A (Large)', weight: '180', rate: '$28', sub: '$5,040' },
                                            { grade: 'Grade B (Medium)', weight: '320', rate: '$18', sub: '$5,760' },
                                            { grade: 'Grade C (Small)', weight: '120', rate: '$9', sub: '$1,080' },
                                        ].map((row) => (
                                            <tr key={row.grade} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                                <td style={{ padding: '10px 4px', fontWeight: 500, color: OCEAN }}>{row.grade}</td>
                                                <td style={{ padding: '10px 4px', textAlign: 'right', color: GRAY_600 }}>{row.weight}</td>
                                                <td style={{ padding: '10px 4px', textAlign: 'right', color: GRAY_600 }}>{row.rate}</td>
                                                <td style={{ padding: '10px 4px', textAlign: 'right', fontWeight: 700, color: '#065f46' }}>{row.sub}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ borderTop: '2px solid #0c4a6e' }}>
                                            <td colSpan={3} style={{ padding: '12px 4px', fontWeight: 700, color: OCEAN }}>Total Payout</td>
                                            <td style={{ padding: '12px 4px', textAlign: 'right', fontWeight: 800, color: OCEAN, fontSize: 16 }}>$11,880</td>
                                        </tr>
                                    </tbody>
                                </table>
                                <p style={{ fontSize: 12, color: GRAY_600, marginTop: 12, textAlign: 'center' }}>
                                    ≈ LKR 3,564,000 @ Rs.300/USD • Auto-generated &amp; WhatsApp-ready
                                </p>
                            </div>
                        </div>

                        {/* Pillar 4 — NAQDA / Bank Reports */}
                        <div className="aqua-pillar-card sr">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                <span style={{ fontSize: 28 }}>📋</span>
                                <div>
                                    <h3 style={{ fontFamily: FONT_HEADING, fontSize: 22, fontWeight: 700, color: OCEAN }}>
                                        NAQDA &amp; Bank Loan Reports
                                    </h3>
                                    <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 12 }}>
                                        1-CLICK COMPLIANCE
                                    </span>
                                </div>
                            </div>

                            <p style={{ color: GRAY_600, fontSize: 15, lineHeight: 1.6, marginBottom: 20 }}>
                                Need a BOC agricultural loan for LKR 5 Million expansion? Banks require strict P&amp;L statements. One click compiles 6 months of voice logs into a perfect "Farm Financial Health PDF."
                            </p>

                            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                {[
                                    { icon: '🏦', title: 'BOC Loan Application', desc: 'Complete P&L for agricultural lending' },
                                    { icon: '📝', title: 'NAQDA License Renewal', desc: 'Operational records & compliance data' },
                                    { icon: '📊', title: '6-Month Farm Health PDF', desc: 'Revenue, costs, FCR trends per pond' },
                                ].map((r) => (
                                    <div key={r.title} style={{ flex: '1 1 200px', background: '#f5f3ff', borderRadius: 10, padding: 16 }}>
                                        <span style={{ fontSize: 24 }}>{r.icon}</span>
                                        <p style={{ fontWeight: 600, color: OCEAN, fontSize: 14, marginTop: 8 }}>{r.title}</p>
                                        <p style={{ color: GRAY_600, fontSize: 12, marginTop: 4 }}>{r.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 4 — Aqua AI Token Store ═══ */}
                <section id="ai-tokens" style={{ padding: '80px 24px', background: `linear-gradient(180deg, ${OCEAN} 0%, #164e63 100%)` }}>
                    <div className="sr" style={{ maxWidth: 1000, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <span style={{ color: CYAN_LIGHT, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase' }}>
                                AI-POWERED ADD-ONS
                            </span>
                            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, color: WHITE, marginTop: 8 }}>
                                The Aqua AI Token Store
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 16, maxWidth: 580, margin: '12px auto 0', lineHeight: 1.6 }}>
                                Aquaculture is high-risk. A single disease outbreak can wipe out LKR 10 Million overnight. These AI tools protect your livestock.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                            {/* Token 1 — Water Quality Analyst */}
                            <div className="aqua-token-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 36 }}>🧪</span>
                                    <span style={{ background: '#fef3c7', color: '#92400e', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12 }}>3 Tokens</span>
                                </div>
                                <h4 style={{ fontWeight: 700, color: OCEAN, fontSize: 17, marginBottom: 8 }}>AI Water Quality Analyst</h4>
                                <p style={{ color: GRAY_600, fontSize: 14, lineHeight: 1.5 }}>
                                    Snap a photo of your handwritten water test log or chemical test strip. AI reads pH, Salinity, Ammonia and warns:
                                </p>
                                <div style={{ background: '#fef2f2', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #fecaca' }}>
                                    <p style={{ color: '#991b1b', fontSize: 13, fontWeight: 600 }}>
                                        ⚠️ "Ammonia spiking in Pond 2. Stop feeding for 24 hours. Apply Zeolite immediately."
                                    </p>
                                </div>
                            </div>

                            {/* Token 2 — Muddy Bill Scanner */}
                            <div className="aqua-token-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 36 }}>🧾</span>
                                    <span style={{ background: '#dbeafe', color: '#1e40af', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12 }}>2 Tokens</span>
                                </div>
                                <h4 style={{ fontWeight: 700, color: OCEAN, fontSize: 17, marginBottom: 8 }}>The Muddy Bill Scanner</h4>
                                <p style={{ color: GRAY_600, fontSize: 14, lineHeight: 1.5 }}>
                                    Farmers buy diesel and hardware daily from village shops. Snap a photo of the crumpled, faded Sinhala/Tamil receipt before it gets lost in the mud.
                                </p>
                                <div style={{ background: '#ecfdf5', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #a7f3d0' }}>
                                    <p style={{ color: '#065f46', fontSize: 13, fontWeight: 600 }}>
                                        ✅ Extracted: Diesel LKR 4,500 → "Farm Overhead" → Pond 1
                                    </p>
                                </div>
                            </div>

                            {/* Token 3 — NAQDA Report Generator */}
                            <div className="aqua-token-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                    <span style={{ fontSize: 36 }}>📑</span>
                                    <span style={{ background: '#ede9fe', color: '#5b21b6', fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 12 }}>5 Tokens</span>
                                </div>
                                <h4 style={{ fontWeight: 700, color: OCEAN, fontSize: 17, marginBottom: 8 }}>NAQDA / Bank Loan Report</h4>
                                <p style={{ color: GRAY_600, fontSize: 14, lineHeight: 1.5 }}>
                                    Low-interest BOC loans &amp; NAQDA license renewals need strict financial records. One click compiles 6 months of voice logs into a perfect PDF.
                                </p>
                                <div style={{ background: '#f5f3ff', borderRadius: 8, padding: 12, marginTop: 12, border: '1px solid #ddd6fe' }}>
                                    <p style={{ color: '#5b21b6', fontSize: 13, fontWeight: 600 }}>
                                        📊 Complete "Farm Financial Health Report" — audit-ready
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 5 — Security ═══ */}
                <section style={{ padding: '60px 24px', background: WHITE }}>
                    <div className="sr" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: OCEAN, marginBottom: 16 }}>
                            🔒 Your Farm Data Is Fort Knox Secure
                        </h2>
                        <p style={{ color: GRAY_600, fontSize: 15, lineHeight: 1.6, marginBottom: 24 }}>
                            Production data and buyer pricing stays 100% private. Works offline in areas with no signal — perfect for remote lagoons and coastal ponds.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, flexWrap: 'wrap' }}>
                            {[
                                { icon: '📱', label: 'Works 100% Offline' },
                                { icon: '🔐', label: 'AES-256 Encryption' },
                                { icon: '☁️', label: 'Auto Cloud Backup' },
                                { icon: '🇱🇰', label: 'Data Stays in Sri Lanka' },
                            ].map((s) => (
                                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8, background: GRAY_100, padding: '10px 16px', borderRadius: 10 }}>
                                    <span style={{ fontSize: 20 }}>{s.icon}</span>
                                    <span style={{ fontSize: 14, fontWeight: 600, color: OCEAN }}>{s.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 6 — Pricing ═══ */}
                <section id="pricing" style={{ padding: '80px 24px', background: GRAY_100 }}>
                    <div className="sr" style={{ maxWidth: 900, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 40 }}>
                            <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 700, color: OCEAN }}>
                                Farm Tiers
                            </h2>
                            <p style={{ color: GRAY_600, fontSize: 16, marginTop: 8 }}>Start free. Scale when you grow.</p>

                            {/* Billing toggle */}
                            <div style={{ display: 'inline-flex', background: WHITE, borderRadius: 10, padding: 4, marginTop: 20, border: '1px solid #e0f2fe' }}>
                                <button onClick={() => setBillingCycle('annual')}
                                    style={{
                                        padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        background: billingCycle === 'annual' ? CYAN : 'transparent',
                                        color: billingCycle === 'annual' ? WHITE : GRAY_600,
                                        fontWeight: 600, fontSize: 14,
                                    }}>Annual <span style={{ fontSize: 11 }}>(Save 15%)</span></button>
                                <button onClick={() => setBillingCycle('monthly')}
                                    style={{
                                        padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                                        background: billingCycle === 'monthly' ? CYAN : 'transparent',
                                        color: billingCycle === 'monthly' ? WHITE : GRAY_600,
                                        fontWeight: 600, fontSize: 14,
                                    }}>Monthly</button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                            {pricing.tiers.map((tier) => (
                                <div key={tier.id} style={{
                                    background: WHITE,
                                    border: tier.highlighted ? `2px solid ${CYAN}` : '1px solid #e0f2fe',
                                    borderRadius: 16,
                                    padding: 32,
                                    position: 'relative',
                                    boxShadow: tier.highlighted ? `0 8px 32px rgba(6,182,212,0.15)` : '0 2px 12px rgba(0,0,0,0.05)',
                                }}>
                                    {tier.highlighted && (
                                        <span style={{
                                            position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                            background: `linear-gradient(135deg, ${CYAN} 0%, ${AQUA_GREEN} 100%)`,
                                            color: WHITE, fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 12,
                                        }}>MOST POPULAR</span>
                                    )}
                                    <h3 style={{ fontWeight: 700, fontSize: 20, color: OCEAN, marginBottom: 8 }}>{tier.name}</h3>
                                    <div style={{ marginBottom: 20 }}>
                                        <span style={{ fontSize: 32, fontWeight: 800, color: OCEAN }}>
                                            {tier.monthlyPrice === 0 ? 'Free' : formatLKR(billingCycle === 'annual' ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice)}
                                        </span>
                                        {tier.monthlyPrice > 0 && <span style={{ color: GRAY_600, fontSize: 14 }}> /month</span>}
                                    </div>
                                    {tier.badge && (
                                        <div style={{ background: '#ecfdf5', padding: '8px 12px', borderRadius: 8, marginBottom: 16, fontSize: 12, color: '#065f46', fontWeight: 600 }}>
                                            {tier.badge}
                                        </div>
                                    )}
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}>
                                        {tier.features.map((f) => (
                                            <li key={f} style={{ padding: '6px 0', fontSize: 14, color: GRAY_600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ color: AQUA_GREEN }}>✓</span> {f}
                                            </li>
                                        ))}
                                        {tier.aiTokens > 0 && (
                                            <li style={{ padding: '6px 0', fontSize: 14, color: CYAN_DARK, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span>🤖</span> {tier.aiTokens} AI Tokens/month
                                            </li>
                                        )}
                                    </ul>
                                    <button onClick={onGetStarted} style={{
                                        width: '100%', padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        fontWeight: 700, fontSize: 15,
                                        background: tier.highlighted ? `linear-gradient(135deg, ${CYAN} 0%, ${AQUA_GREEN} 100%)` : GRAY_100,
                                        color: tier.highlighted ? WHITE : OCEAN,
                                    }}>
                                        {tier.monthlyPrice === 0 ? 'Start Free' : 'Subscribe Now'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Token Store */}
                        <div style={{ textAlign: 'center', marginTop: 32, background: WHITE, borderRadius: 12, padding: 24, border: '1px solid #e0f2fe' }}>
                            <p style={{ fontWeight: 700, color: OCEAN, fontSize: 16, marginBottom: 4 }}>🎯 Need More AI Tokens?</p>
                            <p style={{ color: GRAY_600, fontSize: 14 }}>
                                Top-up anytime: <strong style={{ color: OCEAN }}>{pricing.tokenStore.tokens} tokens for {formatLKR(pricing.tokenStore.price)}</strong>
                            </p>
                        </div>
                    </div>
                </section>

                {/* ═══ SECTION 7 — Social Proof ═══ */}
                <section style={{ padding: '60px 24px', background: WHITE }}>
                    <div className="sr" style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 28, fontWeight: 700, color: OCEAN, marginBottom: 32 }}>
                            Built for Real Farmers in Real Conditions
                        </h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                            {[
                                { region: '🦐 Puttalam / Chilaw', type: 'Shrimp Farms' },
                                { region: '🥒 Jaffna / Kilinochchi', type: 'Sea Cucumber Hatcheries' },
                                { region: '🌿 Batticaloa', type: 'Seaweed & Mud Crab' },
                                { region: '🐟 Negombo / Muthurajawela', type: 'Freshwater Fish' },
                            ].map((r) => (
                                <div key={r.region} style={{ background: GRAY_100, borderRadius: 12, padding: 20 }}>
                                    <p style={{ fontSize: 18, fontWeight: 700, color: OCEAN, marginBottom: 4 }}>{r.region}</p>
                                    <p style={{ fontSize: 14, color: GRAY_600 }}>{r.type}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ═══ CTA Banner ═══ */}
                <section style={{ padding: '60px 24px', background: `linear-gradient(135deg, ${OCEAN} 0%, #164e63 100%)`, textAlign: 'center' }}>
                    <div className="sr" style={{ maxWidth: 600, margin: '0 auto' }}>
                        <h2 style={{ fontFamily: FONT_HEADING, fontSize: 'clamp(24px, 4vw, 36px)', fontWeight: 700, color: WHITE, marginBottom: 16 }}>
                            Your Voice. Your Ponds. Your Profits.
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 16, marginBottom: 32, lineHeight: 1.6 }}>
                            Join the financial revolution for Sri Lanka's Blue Economy. Start tracking with your voice today.
                        </p>
                        <button onClick={onGetStarted} style={{
                            background: `linear-gradient(135deg, ${CYAN} 0%, ${AQUA_GREEN} 100%)`,
                            color: WHITE, border: 'none', padding: '16px 40px', borderRadius: 12,
                            fontSize: 17, fontWeight: 700, cursor: 'pointer',
                            boxShadow: '0 4px 20px rgba(6,182,212,0.4)',
                        }}>
                            Start Your 14-Day Free Trial →
                        </button>
                    </div>
                </section>

                {/* ═══ Footer ═══ */}
                <footer style={{ background: '#042f2e', padding: '40px 24px', borderTop: '1px solid rgba(6,182,212,0.2)' }}>
                    <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
                        <p style={{ fontFamily: FONT_HEADING, fontWeight: 700, fontSize: 18, color: WHITE, marginBottom: 8 }}>
                            🐟 Aqua<span style={{ color: CYAN_LIGHT }}>Tracksy</span>
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>
                            Empowering the Northern &amp; Coastal Sri Lankan Export Economy
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12 }}>
                            Designed &amp; Engineered by{' '}
                            <a href="https://safenetcreations.com" target="_blank" rel="noopener noreferrer" style={{ color: CYAN_LIGHT, fontWeight: 700, textDecoration: 'none' }}>
                                SafeNet Creations
                            </a>
                        </p>
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, marginTop: 12 }}>
                            © {new Date().getFullYear()} AquaTracksy by MyTracksy. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default AquaLandingPage;
