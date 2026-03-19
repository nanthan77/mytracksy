import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    Building2, HardHat, TrendingUp, ShieldCheck,
    ArrowRight, CheckCircle2, Calculator, Users,
    Map, Landmark, Lightbulb, Play,
    BarChart3, Grip, Star, Zap, Clock
} from 'lucide-react';
import { getPricingForProfession } from '../config/pricingConfig';

interface EngineerLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const faqs = [
    {
        question: 'Is EngiTracksy compliant with CIDA/ICTAD regulations?',
        answer: 'Yes, EngiTracksy is engineered to align with CIDA (Construction Industry Development Authority) standards, ensuring your project documentation and financial tracking meet Sri Lankan regulatory requirements.',
    },
    {
        question: 'Can I import my existing BOQs?',
        answer: 'Absolutely. EngiTracksy allows you to seamlessly import your standard Excel BOQs. The system will map your items and instantly set up tracking for material purchases, labor costs, and physical progress against your estimates.',
    },
    {
        question: 'How does the "Baas" Ledger handle daily petty cash?',
        answer: 'Site engineers can log petty cash advances to subcontractors directly from their phones. These are automatically tallied against completed work, generating digital payment vouchers and eliminating disputes during final settlement.',
    },
    {
        question: 'Will this work offline at remote sites?',
        answer: 'EngiTracksy is built as a Progressive Web App (PWA) with offline capabilities. Site engineers can log data even without an internet connection, and the system synchronizes automatically once a connection is re-established.',
    },
    {
        question: 'How does EngiTracksy handle Variation Orders?',
        answer: 'When a client requests additional work or design changes, you can create a Variation Order directly from the active BOQ. The system tracks the cost impact, generates approval documents, and automatically adjusts the project\'s financial forecast.',
    },
    {
        question: 'Can multiple site engineers use it simultaneously?',
        answer: 'Yes. With Pro, your site engineers, QS team, and project managers can all log data simultaneously from different locations. All entries sync in real-time with conflict resolution built in.',
    },
    {
        question: 'Does it support IESL CPD tracking?',
        answer: 'EngiTracksy automatically generates professional development logs based on your project activities, which can be exported for IESL Continuing Professional Development (CPD) submissions.',
    },
];

const testimonials = [
    {
        name: 'Eng. Kamal Perera',
        title: 'Senior Civil Engineer, IESL',
        text: 'We saved Rs. 1.2M on our last housing project just from BOQ variance alerts. The cement overspend detection alone paid for the entire year.',
        rating: 5,
    },
    {
        name: 'Archt. Dilshan Fernando',
        title: 'Principal Architect, DF Associates',
        text: 'The Baas Ledger eliminated payment disputes with our subcontractors. No more lost CR books or arguing over advances.',
        rating: 5,
    },
    {
        name: 'Eng. Sachini Jayawardena',
        title: 'Project Manager, CIDA Grade C1',
        text: 'Managing retention money across 8 active projects was a nightmare. EngiTracksy\'s Retention Vault saved us from missing Rs. 3.5M in releases.',
        rating: 5,
    },
];

const trustStats = [
    { value: '320+', label: 'Engineers & Firms', icon: HardHat },
    { value: 'Rs. 2.1B', label: 'Projects Tracked', icon: Building2 },
    { value: '99.7%', label: 'Uptime SLA', icon: Zap },
    { value: '< 3 min', label: 'Avg. Setup Time', icon: Clock },
];

const EngineerLandingPage: React.FC<EngineerLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [activeTab, setActiveTab] = useState('profitability');
    const [navSolid, setNavSolid] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
    const pricing = getPricingForProfession('engineering');

    useEffect(() => {
        setIsVisible(true);
        window.scrollTo(0, 0);

        const handleScroll = () => {
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const revealElement = (el: HTMLElement) => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    revealElement(entry.target as HTMLElement);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.05, rootMargin: '0px 0px -40px 0px' });
        const timer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    revealElement(el as HTMLElement);
                } else {
                    observer.observe(el);
                }
            });
        }, 150);
        const fallbackTimer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => {
                if ((el as HTMLElement).style.opacity !== '1') revealElement(el as HTMLElement);
            });
        }, 3000);
        return () => { clearTimeout(timer); clearTimeout(fallbackTimer); observer.disconnect(); };
    }, []);

    // Structured data for SEO
    useEffect(() => {
        const schemaData = {
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'EngiTracksy',
            url: window.location.href,
            provider: {
                '@type': 'Organization',
                name: 'EngiTracksy Workspace',
            },
            description: 'EngiTracksy helps Sri Lankan construction firms, civil engineers, and architects track BOQs, manage the baas ledger, and automate retention taxes.',
            mainEntityOfPage: {
                '@type': 'WebPage',
                '@id': window.location.href,
            },
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    return (
        <>
            <Helmet>
                <title>EngiTracksy | Construction ERP & BOQ Tracker for Sri Lanka</title>
                <meta name="description" content="EngiTracksy helps Sri Lankan construction firms, civil engineers, and architects manage BOQ variances, subcontractor ledgers, site AI progress, and retention taxes." />
                <meta name="keywords" content="construction software sri lanka, civil engineer erp, boq tracking, contractor app, baas ledger, ictad software" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <link rel="canonical" href="https://mytracksy.com/engineering" />
                <link rel="preload" as="image" href="/civil_engineering_hero_bg_1773246455725.png" />

                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="MyTracksy" />
                <meta property="og:url" content="https://mytracksy.com/engineering" />
                <meta property="og:title" content="EngiTracksy | Construction ERP & BOQ Tracker for Sri Lanka" />
                <meta property="og:description" content="Manage construction finances with AI." />
                <meta property="og:image" content="/engineering_hero_bg_1773246380742.png" />
                <meta property="og:image:alt" content="MyTracksy logo" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="EngiTracksy | Construction ERP & BOQ Tracker for Sri Lanka" />
                <meta name="twitter:description" content="Manage construction finances with AI." />
                <meta name="twitter:image" content="/engineering_hero_bg_1773246380742.png" />
            </Helmet>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                html { scroll-padding-top: 80px; scroll-behavior: smooth; }
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fafafa; }
                .lt-c { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; overflow-x: clip; -webkit-font-smoothing: antialiased; }
                .lt-i { max-width: 1300px; margin: 0 auto; padding: 0 5%; }
                .sr { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                @keyframes bounce-slow { 0%, 100% { transform: translateY(-10%); } 50% { transform: translateY(0); } }

                .animate-bounce-slow { animation: bounce-slow 4s infinite; }
                .animate-float { animation: float-slow 6s infinite; }
                .animate-pulse-slow { animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }

                .lt-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 20px 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .lt-nav-s { padding: 16px 0; background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid rgba(0, 0, 0, 0.05); box-shadow: 0 1px 20px rgba(0, 0, 0, 0.03); }
                
                .btn-primary { 
                    background: linear-gradient(135deg, #f97316, #d97706); color: #fff; border: none; padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(249, 115, 22, 0.3); font-family: inherit; letter-spacing: -0.01em;
                }
                .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(249, 115, 22, 0.4); }
                
                .btn-secondary {
                    background: rgba(255,255,255,0.8); color: #0f172a; border: 1px solid rgba(0,0,0,0.08); padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px); font-family: inherit;
                }
                .btn-secondary:hover { background: #fff; border-color: rgba(0,0,0,0.15); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
                
                .btn-dark {
                    background: #0f172a; color: #fff; border: 1px solid #1e293b; padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; font-family: inherit;
                }
                .btn-dark:hover { background: #1e293b; transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.2); }

                .glass-card {
                    background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0,0,0,0.02); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -8px rgba(0,0,0,0.08); border-color: rgba(249,115,22,0.2); }
                
                .glass-card-dark {
                    background: rgba(30, 41, 59, 0.5); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.2); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card-dark:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -8px rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.15); }

                .text-gradient { background: linear-gradient(135deg, #0f172a, #334155, #f97316); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: gradient-bg 8s linear infinite; }
                .text-gradient-orange { background: linear-gradient(135deg, #f97316, #d97706); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
                .text-gradient-white { background: linear-gradient(135deg, #ffffff, #e2e8f0, #ffedd5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

                .tab-btn { display: flex; align-items: center; gap: 8px; padding: 12px 24px; border-radius: 99px; font-weight: 600; font-size: 14px; cursor: pointer; transition: all 0.3s ease; border: none; font-family: inherit; }
                .tab-btn.active { background: #0f172a; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                .tab-btn.inactive { background: #f1f5f9; color: #475569; }
                .tab-btn.inactive:hover { background: #e2e8f0; }

                .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

                @media (max-width: 900px) {
                    .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .nav-links, .hero-image { display: none !important; }
                    .engi-nav-back { display: none !important; }
                    .engi-nav-right-full { display: none !important; }
                    .engi-nav-right-mobile { display: flex !important; }
                    .lt-h1 { font-size: 3rem !important; }
                    .hero-btns { justify-content: center; }
                    .glass-card, .glass-card-dark { padding: 24px !important; }
                    .tabs-container { justify-content: flex-start !important; overflow-x: auto; padding-bottom: 8px; }
                    .tab-btn { white-space: nowrap; }
                }
            `}</style>

            <div className="lt-c">
                {/* Premium Navigation */}
                <nav className={`lt-nav ${navSolid ? 'lt-nav-s' : ''}`}>
                    <div className="lt-i" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={onBack} className="btn-secondary engi-nav-back" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                                ← Back
                            </button>
                            <div onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                                <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                                    <Building2 style={{ width: 24, height: 24, color: '#fff' }} />
                                </div>
                                <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.03em', color: '#0f172a' }}>EngiTracksy</span>
                            </div>
                        </div>
                        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            {['Core Features', 'Baas Ledger', 'Site AI', 'Pricing'].map((link) => {
                                const sectionMap: Record<string, string> = {
                                    'Core Features': 'features',
                                    'Baas Ledger': 'features',
                                    'Site AI': 'ai',
                                    'Pricing': 'pricing'
                                };
                                return (
                                    <span key={link} onClick={() => { const el = document.getElementById(sectionMap[link]); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }} style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'color 0.2s' }}>{link}</span>
                                )
                            })}
                        </div>
                        {/* Desktop right nav */}
                        <div className="engi-nav-right-full" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span onClick={onLogin} style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }} className="nav-links">Log in</span>
                            <button onClick={onGetStarted} className="btn-dark" style={{ padding: '10px 24px' }}>Start Free Trial</button>
                        </div>
                        {/* Mobile right nav */}
                        <div className="engi-nav-right-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
                            <span onClick={onLogin} style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer' }}>Sign In</span>
                            <button onClick={onGetStarted} className="btn-dark" style={{ padding: '8px 18px', fontSize: 13 }}>Start Free</button>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header style={{
                    position: 'relative',
                    paddingTop: 160,
                    paddingBottom: 100,
                    overflow: 'hidden',
                    background: '#fafafa'
                }}>
                    {/* Background Accents */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.03, zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 800, height: 800, background: 'linear-gradient(135deg, rgba(255,237,213,0.8), rgba(254,243,199,0.3))', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(30%, -50%)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 600, height: 600, background: 'linear-gradient(135deg, rgba(241,245,249,0.8), transparent)', borderRadius: '50%', filter: 'blur(80px)', transform: 'translate(-25%, 33%)', zIndex: 0 }} />

                    <div className="lt-i" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 64, alignItems: 'center' }}>
                            {/* Left Content */}
                            <div style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(40px)', transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 99, background: '#fff7ed', border: '1px solid #ffedd5', marginBottom: 32 }}>
                                    <span className="animate-pulse-slow" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f97316' }}></span>
                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#c2410c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Engineered for Sri Lanka</span>
                                </div>

                                <h1 className="lt-h1" style={{ fontSize: '4.5rem', fontWeight: 800, color: '#0f172a', lineHeight: 1.1, letterSpacing: '-0.03em', marginBottom: 32 }}>
                                    Build <span className="text-gradient-orange">Profitable</span> Projects.
                                </h1>

                                <p style={{ fontSize: 20, color: '#475569', lineHeight: 1.6, marginBottom: 40, maxWidth: 550 }}>
                                    The ultimate financial ERP for Civil Engineers, Architects, and ICTAD/CIDA registered Construction Firms. Track BOQs, manage the "Baas" ledger, and automate retention tax shields.
                                </p>

                                <div className="hero-btns" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 48 }}>
                                    <button onClick={onGetStarted} className="btn-primary" style={{ padding: '18px 36px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Start Building Free
                                        <ArrowRight style={{ width: 20, height: 20 }} />
                                    </button>
                                    <button
                                        onClick={() => { const el = document.getElementById('features'); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }}
                                        className="btn-secondary"
                                        style={{ padding: '18px 36px', fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}
                                    >
                                        <Play style={{ width: 20, height: 20, color: '#f97316', fill: 'currentColor' }} />
                                        See How It Works
                                    </button>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', fontSize: 14, fontWeight: 600, color: '#64748b' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} /> CIDA Compliant
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} /> BOQ Integration
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <CheckCircle2 style={{ width: 20, height: 20, color: '#10b981' }} /> iOS & Android
                                    </div>
                                </div>

                                {/* Inline PWA Install Link */}
                                <button
                                    onClick={onGetStarted}
                                    style={{
                                        marginTop: 20,
                                        background: 'rgba(249, 115, 22, 0.08)',
                                        border: '1px solid rgba(249, 115, 22, 0.25)',
                                        borderRadius: 99,
                                        padding: '10px 24px',
                                        color: '#ea580c',
                                        fontSize: 14,
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        transition: 'all 0.3s ease',
                                        fontFamily: 'inherit',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249, 115, 22, 0.08)'; }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    📲 Free App — Install Now
                                </button>
                            </div>

                            {/* Right Content */}
                            <div className="hero-image" style={{ opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateX(0)' : 'translateX(40px)', transition: 'all 1s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: '300ms', position: 'relative' }}>
                                <div style={{ position: 'relative', borderRadius: 40, background: '#fff', border: '1px solid #e2e8f0', padding: 8, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #f8fafc, #fff)', opacity: 0.5, zIndex: 0 }} />
                                    <img
                                        src="https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&q=80&w=800"
                                        alt="Heavy Engineering Machinery"
                                        style={{ position: 'relative', zIndex: 1, borderRadius: 32, width: '100%', height: 'auto', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }}
                                    />

                                    {/* Floating Element 1 */}
                                    <div className="animate-bounce-slow" style={{ position: 'absolute', top: 48, left: -24, zIndex: 2, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', padding: 16, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 24, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <TrendingUp style={{ width: 24, height: 24, color: '#059669' }} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Project Margin</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>+12% vs BOQ</p>
                                        </div>
                                    </div>

                                    {/* Floating Element 2 */}
                                    <div className="animate-float" style={{ position: 'absolute', bottom: 96, right: -32, zIndex: 2, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', padding: 16, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                                        <div style={{ width: 48, height: 48, borderRadius: 24, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <HardHat style={{ width: 24, height: 24, color: '#ea580c' }} />
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Masonry Team</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Advance Settled</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Trust Stats Banner */}
                <section style={{ background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '40px 0' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
                            {trustStats.map((stat, i) => (
                                <div key={i} className="sr" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                        <stat.icon style={{ width: 24, height: 24, color: '#ea580c' }} />
                                    </div>
                                    <div style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>{stat.value}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#64748b' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The Sri Lankan Construction Problem */}
                <section style={{ padding: '100px 0', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: 'linear-gradient(90deg, transparent, #334155, transparent)' }} />
                    <div style={{ position: 'absolute', bottom: '-50%', right: '-25%', width: 800, height: 800, background: 'rgba(249,115,22,0.1)', borderRadius: '50%', filter: 'blur(100px)', pointerEvents: 'none' }} />

                    <div className="lt-i" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="sr" style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto', marginBottom: 64 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 24 }}>
                                The Site vs. The Office <span className="text-gradient-orange">Disconnect.</span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6 }}>
                                You win a tender based on a tight BOQ, but once earth breaks, chaos begins. Material prices fluctuate, "baas" (subcontractors) demand daily cash, and retention money gets trapped. By the end of the project, your paper profit means nothing.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                            <div className="glass-card-dark sr" style={{ padding: 40 }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <Calculator style={{ width: 28, height: 28, color: '#f87171' }} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>The BOQ Trap</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6 }}>
                                    You estimated cement at Rs. 2,400, but bought it at Rs. 2,800. Tracking this variance across thousands of items in Excel is impossible. You overspend without realizing it until the final audit.
                                </p>
                            </div>

                            <div className="glass-card-dark sr" style={{ padding: 40, transitionDelay: '100ms' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <Users style={{ width: 28, height: 28, color: '#fbbf24' }} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>The "Baas" Ledger Nightmare</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6 }}>
                                    Subcontractors take daily petty cash advances. When it's time to settle the final bill against completed work, the CR books are lost, and disputes arise over who was paid what.
                                </p>
                            </div>

                            <div className="glass-card-dark sr" style={{ padding: 40, transitionDelay: '200ms' }}>
                                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                    <ShieldCheck style={{ width: 28, height: 28, color: '#fb923c' }} />
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Retention & WHT Bleed</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6 }}>
                                    Clients hold back 5-10% as retention money. Keeping track of release dates across 15 projects, while accounting for Withholding Tax (WHT) correctly, requires a dedicated accountant.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Core Architecture (Tabs) */}
                <section id="features" style={{ padding: '100px 0', background: '#fff' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>The EngiTracksy Architecture</span>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginTop: 12 }}>
                                A Financial ERP Built for the Site.
                            </h2>
                        </div>

                        <div className="tabs-container sr" style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 48, cursor: 'default' }}>
                            {[
                                { id: 'profitability', label: 'BOQ & Profitability', icon: Calculator },
                                { id: 'subcontractor', label: 'Subcontractor / Baas', icon: HardHat },
                                { id: 'retention', label: 'Retention & WHT', icon: Landmark }
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`tab-btn ${activeTab === tab.id ? 'active' : 'inactive'}`}
                                >
                                    <tab.icon style={{ width: 16, height: 16 }} />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="sr" style={{ background: '#f8fafc', borderRadius: 40, border: '1px solid #e2e8f0', padding: 48 }}>
                            {activeTab === 'profitability' && (
                                <div className="animate-fade-in hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                            <TrendingUp style={{ width: 24, height: 24, color: '#ea580c' }} />
                                        </div>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 24, lineHeight: 1.2 }}>Live BOQ Variance Tracking</h3>
                                        <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.6, marginBottom: 32 }}>
                                            Import your Excel BOQ. As site engineers log daily material purchases and labor costs from their phones, EngiTracksy instantly calculates the variance.
                                        </p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {['Automated Material Cost vs. Estimated Cost alerts', 'Live Project P&L down to the foundation level', 'One-click import of ICTAD standard rates'].map((item, i) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                        <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
                                                    </div>
                                                    <span style={{ fontSize: 16, color: '#334155', fontWeight: 500 }}>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <img src="https://images.unsplash.com/photo-1541888087406-ebfaa78dc3b5?auto=format&fit=crop&q=80&w=600" alt="MyTracksy engineering dashboard showing BOQ variance tracking for construction projects" style={{ width: '100%', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', aspectRatio: '4/3', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: -24, left: -24, background: '#fff', padding: 16, borderRadius: 16, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ background: '#fef2f2', padding: 12, borderRadius: 12 }}>
                                                <BarChart3 style={{ color: '#ef4444', width: 24, height: 24 }} />
                                            </div>
                                            <div>
                                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Cement Budget Alert</p>
                                                <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Overspent by 12% in Block A</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'subcontractor' && (
                                <div className="animate-fade-in hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 48, alignItems: 'center' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img src="https://images.unsplash.com/photo-1504307651254-35680f356f12?auto=format&fit=crop&q=80&w=600" alt="Subcontractor payment management interface for engineering firms" style={{ maxWidth: 350, margin: '0 auto', display: 'block', borderRadius: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', aspectRatio: '3/4', objectFit: 'cover' }} />
                                    </div>
                                    <div>
                                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                            <Users style={{ width: 24, height: 24, color: '#d97706' }} />
                                        </div>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 24, lineHeight: 1.2 }}>The Smart "Baas" Ledger</h3>
                                        <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.6, marginBottom: 32 }}>
                                            Throw away the CR books. Track every petty cash advance, piece-rate calculation, and final settlement for every subcontractor across multiple sites.
                                        </p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {['Track cash advances against completed physical progress', 'Auto-generate digital payment vouchers', 'Prevent double-payments and disputes with clear logs'].map((item, i) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                        <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
                                                    </div>
                                                    <span style={{ fontSize: 16, color: '#334155', fontWeight: 500 }}>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'retention' && (
                                <div className="animate-fade-in hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 48, alignItems: 'center' }}>
                                    <div>
                                        <div style={{ width: 48, height: 48, borderRadius: 16, background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                                            <ShieldCheck style={{ width: 24, height: 24, color: '#0284c7' }} />
                                        </div>
                                        <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 24, lineHeight: 1.2 }}>Retention Vault & WHT Shields</h3>
                                        <p style={{ fontSize: 18, color: '#475569', lineHeight: 1.6, marginBottom: 32 }}>
                                            Construction cash flow is tied up in retentions and complex taxes. EngiTracksy categorizes these automatically so you never lose track of money owed to you.
                                        </p>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {['Automated alerts for retention money release dates', 'WHT (Withholding Tax) certificate tracking to claim tax credits', 'Generate compliant milestone invoices instantly'].map((item, i) => (
                                                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                                        <CheckCircle2 style={{ width: 16, height: 16, color: '#059669' }} />
                                                    </div>
                                                    <span style={{ fontSize: 16, color: '#334155', fontWeight: 500 }}>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div style={{ background: '#fff', padding: 24, borderRadius: 24, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 16 }}>
                                                <h4 style={{ margin: 0, fontWeight: 700, color: '#0f172a' }}>Retention Tracker</h4>
                                                <span style={{ background: '#ffedd5', color: '#c2410c', padding: '4px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>LKR 4.5M Locked</span>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                                {[
                                                    { project: 'Luxury Villa - Colombo 7', amount: '2,500,000', date: 'Release: Oct 2026', status: 'Pending' },
                                                    { project: 'Office Complex - Rajagiriya', amount: '2,000,000', date: 'Release: Dec 2026', status: 'Pending' }
                                                ].map((ret, i) => (
                                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, background: '#f8fafc', borderRadius: 16 }}>
                                                        <div>
                                                            <p style={{ margin: '0 0 4px', fontWeight: 600, color: '#0f172a' }}>{ret.project}</p>
                                                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{ret.date}</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right' }}>
                                                            <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#334155' }}>Rs. {ret.amount}</p>
                                                            <p style={{ margin: 0, fontSize: 12, color: '#ea580c', fontWeight: 600 }}>{ret.status}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* Accounting Made Easy Section */}
                <section style={{ padding: '100px 0', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                    <div className="lt-i sr" style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 24 }}>
                                Basic Accounting to <span className="text-gradient-orange">Firm & AI.</span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, maxWidth: 700, margin: '0 auto' }}>
                                Start as a single independent engineer sending invoices on WhatsApp. Scale up to a full firm with AI-driven reconciliations, cost tracking, and automated customer billing.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>
                            <div className="glass-card-dark" style={{ padding: 40 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Single Engineer Invoicing</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>Create professional milestone invoices and automatically send them via WhatsApp to your clients in 1-click.</p>
                                <div style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 700 }}>WhatsApp Ready</div>
                            </div>
                            <div className="glass-card-dark" style={{ padding: 40 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>Full Firm Accounting</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>Scale your operations. Manage team expenses, petty cash, payroll, and project-based Profit & Loss statements instantly.</p>
                                <div style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 700 }}>Multi-User Access</div>
                            </div>
                            <div className="glass-card-dark" style={{ padding: 40 }}>
                                <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 16 }}>AI Financial Autopilot</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24 }}>Let AI predict your cash flow gaps, track retention releases, and match supplier invoices to BOQ estimations automatically.</p>
                                <div style={{ padding: '8px 16px', borderRadius: 99, background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', display: 'inline-flex', alignItems: 'center', fontSize: 14, fontWeight: 700 }}>AI Powered</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Superpowers for Site */}
                <section id="ai" style={{ padding: '100px 0', background: '#fafafa', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 500, height: 500, background: 'rgba(186,230,253,0.4)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(50%, -50%)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: 500, height: 500, background: 'rgba(254,215,170,0.4)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(-50%, 50%)', zIndex: 0 }} />

                    <div className="lt-i" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.5fr)', gap: 64, alignItems: 'center' }}>
                            <div className="sr" style={{ position: 'relative', maxWidth: 350, margin: '0 auto', width: '100%' }}>
                                <img src="https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&q=80&w=600" alt="AI-powered construction site scanner for automated cost tracking" style={{ borderRadius: 40, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)', position: 'relative', zIndex: 10, width: '100%', height: 'auto', display: 'block', aspectRatio: '3/4', objectFit: 'cover' }} />
                                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.2), transparent)', borderRadius: 40, zIndex: 20 }} />
                            </div>

                            <div className="sr">
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', marginBottom: 24 }}>
                                    <Lightbulb style={{ width: 16, height: 16, color: '#f97316' }} />
                                    <span style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>Site AI Scanner</span>
                                </div>

                                <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 24 }}>
                                    Turn Site Photos into Structural Progress Data.
                                </h2>

                                <p style={{ fontSize: 18, color: '#475569', marginBottom: 32, lineHeight: 1.6 }}>
                                    Stop sending WhatsApp voice notes from the site. Snap a picture of the concrete pour or brickwork. Our AI analyzes the structural elements (beams, columns, walls) and instantly updates the physical progress percentage against the BOQ schedule.
                                </p>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
                                    <div className="glass-card" style={{ padding: 24 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Grip style={{ width: 20, height: 20, color: '#ea580c' }} />
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Automated Reinforcement Checks</h4>
                                        <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>Detect rebar layouts from photos and cross-reference with structural drawings.</p>
                                    </div>

                                    <div className="glass-card" style={{ padding: 24 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                            <Map style={{ width: 20, height: 20, color: '#0284c7' }} />
                                        </div>
                                        <h4 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Daily Drone Mapping</h4>
                                        <p style={{ margin: 0, fontSize: 14, color: '#64748b', lineHeight: 1.5 }}>Sync drone topographical data automatically to calculate earthwork volume cubes.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== PRICING SECTION — from pricingConfig ===== */}
                <section id="pricing" style={{ padding: '120px 0', background: '#fff', borderTop: '1px solid #f1f5f9' }}>
                    <div className="lt-i sr" style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ textAlign: 'center', marginBottom: 48 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em', marginBottom: 16 }}>
                                Ready to build better profit margins?
                            </h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 600, margin: '0 auto', marginBottom: 24 }}>
                                Join the top civil engineering firms in Sri Lanka using EngiTracksy to guarantee profitability on every slab poured.
                            </p>
                            {/* Billing Toggle */}
                            <div style={{ display: 'inline-flex', background: '#f1f5f9', borderRadius: 99, padding: 4 }}>
                                <button onClick={() => setBillingCycle('monthly')} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: billingCycle === 'monthly' ? '#0f172a' : 'transparent', color: billingCycle === 'monthly' ? '#fff' : '#64748b', fontFamily: 'inherit', transition: 'all 0.3s' }}>Monthly</button>
                                <button onClick={() => setBillingCycle('annual')} style={{ padding: '8px 20px', borderRadius: 99, border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', background: billingCycle === 'annual' ? '#0f172a' : 'transparent', color: billingCycle === 'annual' ? '#fff' : '#64748b', fontFamily: 'inherit', transition: 'all 0.3s' }}>
                                    Annual <span style={{ color: billingCycle === 'annual' ? '#f97316' : '#94a3b8', fontSize: 12 }}>Save 28%</span>
                                </button>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${pricing.tiers.length}, 1fr)`, gap: 24, position: 'relative', zIndex: 1 }}>
                            {pricing.tiers.map((tier) => (
                                <div key={tier.id} style={{
                                    background: tier.highlighted ? 'linear-gradient(135deg, #0f172a, #1e293b)' : '#fff',
                                    border: tier.highlighted ? '2px solid #f97316' : '1px solid #e2e8f0',
                                    borderRadius: 24,
                                    padding: 32,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transform: tier.highlighted ? 'scale(1.05)' : 'none',
                                    boxShadow: tier.highlighted ? '0 20px 40px rgba(249,115,22,0.2)' : '0 4px 12px rgba(0,0,0,0.05)',
                                    zIndex: tier.highlighted ? 2 : 1,
                                    position: 'relative',
                                }}>
                                    {tier.highlighted && (
                                        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: '#f97316', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 99, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Most Popular</div>
                                    )}
                                    <h3 style={{ fontSize: 20, fontWeight: 700, color: tier.highlighted ? '#fff' : '#0f172a', marginBottom: 8 }}>{tier.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 24 }}>
                                        <span style={{ fontSize: '2.5rem', fontWeight: 800, color: tier.highlighted ? '#fff' : '#0f172a', letterSpacing: '-0.02em' }}>
                                            {tier.monthlyPrice === 0 ? 'Free' : `Rs. ${(billingCycle === 'annual' ? Math.round(tier.annualPrice / 12) : tier.monthlyPrice).toLocaleString()}`}
                                        </span>
                                        {tier.monthlyPrice > 0 && <span style={{ fontSize: 14, color: '#64748b', fontWeight: 600 }}>/mo</span>}
                                    </div>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32, flex: 1 }}>
                                        {tier.features.map((feat, fi) => (
                                            <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 12, color: tier.highlighted ? '#cbd5e1' : '#475569', fontSize: 14 }}>
                                                <CheckCircle2 style={{ width: 16, height: 16, color: '#f97316', flexShrink: 0 }} />
                                                {feat}
                                            </li>
                                        ))}
                                    </ul>
                                    {tier.badge && (
                                        <div style={{ padding: '8px 12px', background: tier.highlighted ? 'rgba(249,115,22,0.1)' : '#fff7ed', borderRadius: 12, fontSize: 12, fontWeight: 600, color: '#ea580c', textAlign: 'center', marginBottom: 16 }}>
                                            {tier.badge}
                                        </div>
                                    )}
                                    <button onClick={onGetStarted} className={tier.highlighted ? 'btn-primary' : 'btn-dark'} style={{ width: '100%', padding: 14, fontSize: 16, borderRadius: 12 }}>
                                        {tier.monthlyPrice === 0 ? 'Start Free' : 'Start 14-Day Trial'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section */}
                <section style={{ padding: '100px 0', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 600, height: 600, background: 'rgba(249,115,22,0.08)', borderRadius: '50%', filter: 'blur(100px)', transform: 'translate(30%, -40%)' }} />
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 16 }}>
                                Trusted by Sri Lanka's <span className="text-gradient-orange">Top Engineers</span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#94a3b8' }}>Real results from real construction professionals.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                            {testimonials.map((t, i) => (
                                <div key={i} className="glass-card-dark sr" style={{ padding: 32, transitionDelay: `${i * 100}ms` }}>
                                    <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                                        {Array.from({ length: t.rating }).map((_, si) => (
                                            <Star key={si} style={{ width: 16, height: 16, color: '#f97316', fill: '#f97316' }} />
                                        ))}
                                    </div>
                                    <p style={{ fontSize: 16, color: '#e2e8f0', lineHeight: 1.6, marginBottom: 24, fontStyle: 'italic' }}>
                                        "{t.text}"
                                    </p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>
                                            {t.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 14 }}>{t.name}</p>
                                            <p style={{ margin: 0, color: '#94a3b8', fontSize: 12 }}>{t.title}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* FAQ / AEO SEO Section */}
                <section id="faq" style={{ padding: '80px 0', background: '#fafafa', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="lt-i sr" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 60 }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 16 }}>Frequently Asked Questions</h2>
                            <p style={{ fontSize: 17, color: '#475569' }}>Common questions about implementing EngiTracksy in your construction workflows.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {faqs.map((faq) => (
                                <div key={faq.question} style={{ padding: 24, borderRadius: 16, background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{faq.question}</h3>
                                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6, margin: 0 }}>{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{ background: '#fff', padding: '80px 0 40px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 80 }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ height: 48, objectFit: 'contain' }} />
                                    <span style={{ fontSize: 20, fontWeight: 800, color: '#ea580c' }}>EngiTracksy</span>
                                </div>
                                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 350 }}>
                                    The definitive financial ERP utilized by leading civil engineers and construction firms across Sri Lanka.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>System Capabilities</h4>
                                {['BOQ Tracking', 'Subcontractor Ledger', 'Site AI Scanner', 'Retention Vault'].map(l => {
                                    const sectionMap: Record<string, string> = {
                                        'BOQ Tracking': 'features',
                                        'Subcontractor Ledger': 'features',
                                        'Site AI Scanner': 'ai',
                                        'Retention Vault': 'features'
                                    };
                                    return (
                                        <div key={l} onClick={() => { const el = document.getElementById(sectionMap[l]); if (el) { const y = el.getBoundingClientRect().top + window.scrollY - 80; window.scrollTo({ top: y, behavior: 'smooth' }); } }} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                    )
                                })}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Compliance</h4>
                                {['CIDA/ICTAD Guidelines', 'Terms of Operations', 'Data Sovereignty Doctrine'].map(l => (
                                    <div key={l} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: 14, color: '#94a3b8' }}>
                                © 2026 MyTracksy Enterprise Systems. Designed & Built in Sri Lanka by <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#ea580c', textDecoration: 'none', fontWeight: 600 }}>SafeNetCreations</a>.
                            </div>
                            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                Engineering Infrastructure Operational
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default EngineerLandingPage;
