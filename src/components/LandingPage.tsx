import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ProfessionType } from '../contexts/AuthContext';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onDemoProfession: (profession: ProfessionType) => void;
    onProfessionPage?: (slug: string) => void;
}

const MAIN_LANDING_FAQS = [
    {
        question: 'What is MyTracksy and who is it built for?',
        answer: 'MyTracksy is a Sri Lankan professional finance platform built for medical, legal, engineering, business, creator, and other profession-specific workflows. It combines income tracking, expenses, tax-ready exports, and profession-aware operational tools in one web app and PWA.',
    },
    {
        question: 'Can MyTracksy work on mobile as a fast installable web app?',
        answer: 'Yes. MyTracksy supports mobile-first PWA installs so professionals can open their workspace from the home screen, work with fast app-like navigation, and keep critical workflows close at hand.',
    },
    {
        question: 'Does MyTracksy support Sri Lankan tax and compliance workflows?',
        answer: 'Yes. MyTracksy is designed around Sri Lankan business and professional workflows, including expense categorization, auditor-friendly exports, and profession-specific reporting needs.',
    },
    {
        question: 'Which MyTracksy profession page should I start with?',
        answer: 'Start with the landing page for your profession. The medical, business, creator, and photography studio routes now have the most specialized installable mobile experiences, each with its own workflow shell and PWA identity.',
    },
];

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onProfessionPage }) => {
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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

    const professions: { iconMatch: string; name: string; color: string; gradient: string; type: ProfessionType; slug: string; tagline: string }[] = [
        { iconMatch: 'profession_doctor', name: 'Healthcare & Medical', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)', type: 'medical', slug: 'medical', tagline: 'Unified practice & revenue orchestration' },
        { iconMatch: 'profession_lawyer', name: 'Legal Practices', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', type: 'legal', slug: 'legal', tagline: 'Streamlined trust accounting & billing' },
        { iconMatch: 'profession_business', name: 'Corporate Business', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', type: 'business', slug: 'business', tagline: 'Multi-entity financial governance' },
        { iconMatch: 'profession_engineer', name: 'Civil & Architectural Firms', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', type: 'engineering', slug: 'engineering', tagline: 'BOQ variance & subcontractor ledgers' },
        { iconMatch: 'profession_trader', name: 'Trading & Markets', color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', type: 'trading', slug: 'trading', tagline: 'Real-time equity margin & analytics' },
        { iconMatch: 'profession_auto', name: 'Automotive Networks', color: '#64748b', gradient: 'linear-gradient(135deg,#64748b,#475569)', type: 'automotive', slug: 'automotive', tagline: 'End-to-end workshop inventory control' },
        { iconMatch: 'profession_marketing', name: 'Marketing Agencies', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#db2777)', type: 'marketing', slug: 'marketing', tagline: 'Automated campaign ROI optimization' },
        { iconMatch: 'profession_travel', name: 'Travel & Tourism', color: '#06b6d4', gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', type: 'travel', slug: 'travel', tagline: 'Comprehensive booking ledger systems' },
        { iconMatch: 'profession_transport', name: 'Logistics & Fleet', color: '#d97706', gradient: 'linear-gradient(135deg,#d97706,#b45309)', type: 'transportation', slug: 'transportation', tagline: 'Optimized fleet telematics & fuel tracking' },
        { iconMatch: 'profession_retail', name: 'Retail Commerce', color: '#16a34a', gradient: 'linear-gradient(135deg,#16a34a,#15803d)', type: 'retail', slug: 'retail', tagline: 'Integrated multi-location POS oversight' },
        { iconMatch: 'profession_aquaculture', name: 'Aquaculture Sector', color: '#0284c7', gradient: 'linear-gradient(135deg,#0284c7,#0369a1)', type: 'aquaculture', slug: 'aquaculture', tagline: 'Advanced harvest yield modeling' },
        { iconMatch: 'profession_personal', name: 'Private Wealth', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', type: 'individual', slug: 'individual', tagline: 'Secure personal wealth architecture' },
        { iconMatch: 'icon_creator', name: 'Digital Creators', color: '#a855f7', gradient: 'linear-gradient(135deg,#a855f7,#7e22ce)', type: 'creator', slug: 'creator', tagline: 'Multi-currency SaaS for Content Creators' },
        { iconMatch: 'profession_studios', name: 'Wedding Studios', color: '#b45309', gradient: 'linear-gradient(135deg,#b45309,#78350f)', type: 'studios', slug: 'studios', tagline: 'Free solo plan, milestone billing, crew profit, and gear tax vaults' },
    ];

    const iconMap: Record<string, string> = {
        profession_aquaculture: '/assets/professions/profession_aquaculture_1773215316236.png',
        profession_auto: '/assets/professions/profession_auto_1773215201791.png',
        profession_business: '/assets/professions/profession_business_1773215155357.png',
        profession_doctor: '/assets/professions/profession_doctor_1773215125010.png',
        profession_engineer: '/assets/professions/profession_engineer_1773215171114.png',
        profession_lawyer: '/assets/professions/profession_lawyer_1773215139946.png',
        profession_marketing: '/assets/professions/profession_marketing_1773215238062.png',
        profession_personal: '/assets/professions/profession_personal_1773215331363.png',
        profession_retail: '/assets/professions/profession_retail_1773215293921.png',
        profession_studios: '/assets/professions/profession_studios.svg',
        profession_trader: '/assets/professions/profession_trader_1773215186011.png',
        profession_transport: '/assets/professions/profession_transport_1773215278251.png',
        profession_travel: '/assets/professions/profession_travel_1773215259443.png',
    };

    const getIconUrl = (matchData: string) => {
        return iconMap[matchData] || '';
    };

    const handleProfessionClick = (slug: string) => {
        if (onProfessionPage) { onProfessionPage(slug); } else { window.location.href = `/${slug}`; }
    };

    const landingStructuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MyTracksy',
            url: 'https://mytracksy.lk/',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Android, iOS',
            image: 'https://mytracksy.lk/logos/mytracksy-logo.png',
            description: 'MyTracksy is a profession-specific finance and operations platform for Sri Lankan professionals and businesses, including medical, legal, business, creator, and photography studios.',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'LKR',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'MyTracksy profession landing pages',
            itemListElement: professions.map((profession, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: profession.name,
                url: `https://mytracksy.lk/${profession.slug}`,
            })),
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: MAIN_LANDING_FAQS.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: faq.answer,
                },
            })),
        },
    ];

    return (
        <>
            <Helmet>
                <title>MyTracksy | Professional Finance & Workflow Software for Sri Lankan Businesses</title>
                <meta
                    name="description"
                    content="MyTracksy helps Sri Lankan professionals manage income, expenses, tax-ready exports, and profession-specific workflows across medical, legal, engineering, business, creator, photography studio, and other sectors."
                />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <link rel="canonical" href="https://mytracksy.lk/" />
                <link rel="preload" as="image" href="/assets/hero-main.png" />
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://mytracksy.lk/" />
                <meta property="og:title" content="MyTracksy | Professional Finance & Workflow Software for Sri Lankan Businesses" />
                <meta
                    property="og:description"
                    content="Profession-specific finance, tax-ready exports, and operational workflows for Sri Lankan medical, legal, business, engineering, creator, and photography studio teams."
                />
                <meta property="og:image" content="https://mytracksy.lk/logos/mytracksy-logo.png" />
                <meta property="og:image:alt" content="MyTracksy logo" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="MyTracksy | Professional Finance & Workflow Software for Sri Lankan Businesses" />
                <meta
                    name="twitter:description"
                    content="Profession-specific finance, tax-ready exports, and operational workflows for Sri Lankan medical, legal, business, engineering, creator, and photography studio teams."
                />
                <meta name="twitter:image" content="https://mytracksy.lk/logos/mytracksy-logo.png" />
                <script type="application/ld+json">
                    {JSON.stringify(landingStructuredData)}
                </script>
            </Helmet>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fcfcfc; }
                .lt-c { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; overflow-x: hidden; -webkit-font-smoothing: antialiased; }
                .lt-i { max-width: 1300px; margin: 0 auto; padding: 0 5%; }
                .sr { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                
                @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
                @keyframes pulse-ring { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(1.3); opacity: 0; } }

                .lt-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 20px 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .lt-nav-s { padding: 16px 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid rgba(0, 0, 0, 0.04); box-shadow: 0 1px 20px rgba(0, 0, 0, 0.03); }
                
                .btn-primary { 
                    background: linear-gradient(135deg, #0ea5e9, #6366f1); color: #fff; border: none; padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(99, 102, 241, 0.3); font-family: inherit; letter-spacing: -0.01em;
                }
                .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4); }
                .btn-secondary {
                    background: rgba(255,255,255,0.8); color: #0f172a; border: 1px solid rgba(0,0,0,0.08); padding: 14px 32px; border-radius: 99px; font-weight: 600; font-size: 15px; cursor: pointer; transition: all 0.3s ease; backdrop-filter: blur(10px); font-family: inherit;
                }
                .btn-secondary:hover { background: #fff; border-color: rgba(0,0,0,0.15); transform: translateY(-3px); box-shadow: 0 8px 20px rgba(0,0,0,0.06); }
                
                .glass-card {
                    background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.8); box-shadow: 0 4px 24px -6px rgba(0, 0, 0, 0.04), 0 1px 4px rgba(0,0,0,0.02); transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                }
                .glass-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px -8px rgba(0,0,0,0.08); border-color: rgba(99,102,241,0.2); }
                
                .text-gradient { background: linear-gradient(135deg, #0f172a, #334155, #6366f1); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: gradient-bg 8s linear infinite; }
                .text-gradient-white { background: linear-gradient(135deg, #ffffff, #e2e8f0, #c7d2fe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

                @media (max-width: 900px) {
                    .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .prof-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important; }
                    .nav-links, .hero-image { display: none !important; }
                    .lt-h1 { font-size: 3rem !important; }
                    .hero-btns { justify-content: center; }
                }
            `}</style>

            <div className="lt-c">
                {/* Enterprise Navbar */}
                <nav className={`lt-nav ${navSolid ? 'lt-nav-s' : ''}`}>
                    <div className="lt-i" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                            <img
                                src="/logos/mytracksy-logo.png"
                                alt="MyTracksy"
                                style={{ width: 164, height: 52, objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
                            />
                        </div>
                        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            {['Platform', 'Solutions', 'Security', 'Enterprise'].map((link) => {
                                const sectionMap: Record<string, string> = {
                                    'Platform': 'platform',
                                    'Solutions': 'solutions',
                                    'Security': 'platform',
                                    'Enterprise': 'enterprise'
                                };
                                return (
                                    <span key={link} style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'color 0.2s' }} onClick={() => document.getElementById(sectionMap[link])?.scrollIntoView({ behavior: 'smooth' })}>{link}</span>
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span onClick={onLogin} style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>Sign In</span>
                            <button onClick={onGetStarted} className="btn-primary" style={{ padding: '10px 24px' }}>Request Demo</button>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 120, paddingBottom: 80, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at top right, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(14,165,233,0.08) 0%, transparent 60%)' }}>

                    {/* Abstract Decorative Elements */}
                    <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, background: 'linear-gradient(135deg, #e0e7ff, #f8fafc)', borderRadius: '50%', filter: 'blur(80px)', zIndex: -1, animation: 'float-slow 20s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, background: 'linear-gradient(135deg, #f0fdfa, #f8fafc)', borderRadius: '50%', filter: 'blur(60px)', zIndex: -1, animation: 'float-slow 25s ease-in-out infinite reverse' }} />

                    <div className="lt-i">
                        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '4rem', alignItems: 'center' }}>
                            <div style={{ zIndex: 2 }}>
                                <div className="sr" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)', color: '#2563eb', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 32 }}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} /> Next-Gen Financial Architecture
                                </div>

                                <h1 className="sr lt-h1" style={{ fontSize: '4.5rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.04em', marginBottom: 28, color: '#0f172a' }}>
                                    Financial Command Center for <span className="text-gradient">Modern Enterprise.</span>
                                </h1>

                                <p className="sr" style={{ fontSize: 19, color: '#475569', lineHeight: 1.7, marginBottom: 40, maxWidth: 600 }}>
                                    MyTracksy delivers institutional-grade financial intelligence, bespoke operational data structures, and PDPA-compliant infrastructure engineered explicitly for specialized professional sectors in Sri Lanka.
                                </p>

                                <div className="hero-btns sr" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', transitionDelay: '0.1s' }}>
                                    <button onClick={onGetStarted} className="btn-primary" style={{ padding: '18px 40px', fontSize: 16 }}>Deploy Infrastructure →</button>
                                    <button onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary" style={{ padding: '18px 40px', fontSize: 16 }}>Explore Capabilities</button>
                                </div>

                                <div className="sr" style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 32, opacity: 0.8, transitionDelay: '0.2s' }}>
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>12+</div>
                                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Supported Industries</div>
                                    </div>
                                    <div style={{ width: 1, height: 40, background: 'rgba(0,0,0,0.1)' }} />
                                    <div>
                                        <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>100%</div>
                                        <div style={{ fontSize: 13, color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>On-Device Encryption</div>
                                    </div>
                                </div>
                            </div>

                            {/* Premium Dashboard Visualization */}
                            <div className="hero-image sr" style={{ position: 'relative', transitionDelay: '0.2s', zIndex: 2 }}>
                                <div style={{ background: '#ffffff', borderRadius: 32, border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 40px 100px -20px rgba(15,23,42,0.12), 0 20px 40px -20px rgba(0,0,0,0.05)', padding: '12px', position: 'relative' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12, paddingLeft: 12, paddingTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444' }} />
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffb020' }} />
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#22c55e' }} />
                                        </div>
                                    </div>
                                    <img
                                        src="/assets/hero-main.png"
                                        alt="MyTracksy financial dashboard for Sri Lankan professionals"
                                        loading="eager"
                                        fetchPriority="high"
                                        decoding="async"
                                        style={{ width: '100%', borderRadius: 24, display: 'block' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Vertical Space */}
                <div style={{ height: 100, background: 'linear-gradient(to bottom, #fcfcfc, #f1f5f9)' }} />

                {/* Sector Specific Solutions */}
                <section id="solutions" style={{ padding: '120px 0', background: '#f1f5f9', position: 'relative' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 80 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Industry-Specific Cognitive Engines</h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                Generic accounting fails modern enterprise. MyTracksy deploys distinct operational modules for every major Sri Lankan workflow, meticulously architected around the unique regulatory and functional requirements of your sector.
                            </p>
                        </div>

                        <div className="prof-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }}>
                            {professions.map((prof, i) => (
                                <div key={i} className="glass-card sr" onClick={() => handleProfessionClick(prof.slug)} style={{ padding: 32, cursor: 'pointer', transitionDelay: `${i * 50}ms`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: 120, height: 120, background: prof.gradient, opacity: 0.05, borderRadius: '0 0 0 100%', pointerEvents: 'none' }} />

                                    <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, boxShadow: `0 12px 30px -10px ${prof.color}40`, border: `1px solid ${prof.color}20`, overflow: 'hidden' }}>
                                        {getIconUrl(prof.iconMatch) ? (
                                            <img
                                                src={getIconUrl(prof.iconMatch)}
                                                alt={prof.name}
                                                loading="lazy"
                                                decoding="async"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        ) : (
                                            <span style={{ fontSize: 40 }}>{prof.iconMatch === 'icon_creator' ? '🎥' : prof.iconMatch === 'profession_studios' ? '📸' : '📊'}</span>
                                        )}
                                    </div>

                                    <h3 style={{ fontSize: 19, fontWeight: 800, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>{prof.name}</h3>
                                    <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{prof.tagline}</p>

                                    <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: prof.color }}>
                                        Deploy Module
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Core Architecture */}
                <section id="platform" style={{ padding: '140px 0', background: '#0f172a', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: 0 }} />
                    <div className="lt-i" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 100 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>System Capabilities</div>
                            <h2 className="lt-h1 text-gradient-white" style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24 }}>Enterprise-Grade Infrastructure</h2>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 40 }}>
                            {[
                                { title: 'Automated Compliance matrix', desc: 'Real-time EPF/ETF calculations, VAT ledgers, and withholding tax adherence perfectly synchronized with Sri Lankan Inland Revenue Division mandates.', icon: '🏛️' },
                                { title: 'Zero-Trust Data Sovereignty', desc: 'Absolute privacy enforcement. Financial ledgers remain cryptographically secured on local hardware. Zero passive server transmission.', icon: '🔐' },
                                { title: 'Predictive NLP Analytics', desc: 'Deploy AI-driven voice transcriptions across Sinhala, Tamil, and English environments for frictionless ledger orchestration.', icon: '🧠' }
                            ].map((ft, i) => (
                                <div key={i} className="sr" style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 40, backdropFilter: 'blur(20px)' }}>
                                    <div style={{ fontSize: 40, marginBottom: 24 }}>{ft.icon}</div>
                                    <h3 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', marginBottom: 16 }}>{ft.title}</h3>
                                    <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.7 }}>{ft.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section id="faq" style={{ padding: '100px 0', background: '#ffffff', borderTop: '1px solid rgba(15,23,42,0.05)' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.12)', color: '#0369a1', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 20 }}>
                                Search-ready answers
                            </div>
                            <h2 style={{ fontSize: '2.9rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 18 }}>
                                Questions Search Engines And AI Crawlers Can Understand
                            </h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 760, margin: '0 auto', lineHeight: 1.75 }}>
                                Clear answers for Google, AI overviews, assistants, and direct visitors evaluating whether MyTracksy fits their profession and workflow.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
                            {MAIN_LANDING_FAQS.map((faq, index) => (
                                <article
                                    key={faq.question}
                                    className="glass-card sr"
                                    style={{ padding: 28, transitionDelay: `${index * 60}ms`, background: '#ffffff' }}
                                >
                                    <h3 style={{ fontSize: 19, fontWeight: 750, color: '#0f172a', marginBottom: 12, letterSpacing: '-0.02em' }}>
                                        {faq.question}
                                    </h3>
                                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.75 }}>
                                        {faq.answer}
                                    </p>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section id="enterprise" style={{ padding: '120px 0', background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)', textAlign: 'center' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)', borderRadius: 40, padding: '80px 40px', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.2)' }}>
                            <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(99,102,241,0.3) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />

                            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 24, position: 'relative', zIndex: 1 }}>Modernize Your Operations.</h2>
                            <p style={{ fontSize: 18, color: '#cbd5e1', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                                Initiate the deployment of your specialized financial infrastructure. Compliance, intelligence, and data sovereignty included.
                            </p>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <button onClick={onGetStarted} className="btn-primary" style={{ padding: '20px 48px', fontSize: 18, background: '#ffffff', color: '#0f172a' }}>
                                    Deploy Free Environment
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Footer */}
                <footer style={{ background: '#f8fafc', padding: '80px 0 40px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 80 }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                                    <img
                                        src="/logos/mytracksy-logo.png"
                                        alt="MyTracksy"
                                        style={{ width: 172, height: 56, objectFit: 'contain', objectPosition: 'left center', display: 'block' }}
                                    />
                                </div>
                                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 350 }}>
                                    The definitive financial architecture platform utilized by leading professionals across Sri Lanka.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Platform Architecture</h4>
                                {['Core Infrastructure', 'Security Protocols', 'API Endpoints', 'Compliance Matrix'].map(l => (
                                    <div key={l} onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                ))}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Legal & Privacy</h4>
                                {['PDPA Compliance Center', 'Terms of Operations', 'Data Sovereignty Policy'].map(l => (
                                    <div key={l} onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: 14, color: '#94a3b8' }}>
                                © 2026 MyTracksy Enterprise Systems. Designed & Built in Sri Lanka by <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>SafeNetCreations</a>.
                            </div>
                            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                Core Systems Operational
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default LandingPage;
