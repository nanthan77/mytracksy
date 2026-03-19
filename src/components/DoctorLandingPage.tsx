import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface DoctorLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const MEDICAL_FAQS = [
    {
        question: 'Is MyTracksy Medical suitable for IRD tax work in Sri Lanka?',
        answer: 'MyTracksy Medical exports channeling income, clinic costs, travel, subscriptions, and practice expenses into auditor-friendly formats aligned with Sri Lankan IRD workflows and tax review needs.',
    },
    {
        question: 'Does the voice workflow support Sinhala, Tamil, and mixed medical speech?',
        answer: 'The clinical voice workflow is designed for Sri Lankan usage patterns, including Sinhala, Tamil, English, and mixed speech patterns often used in local medical environments.',
    },
    {
        question: 'How does MyTracksy handle patient and practice data?',
        answer: 'MyTracksy Medical is designed for PDPA-ready operations with role-based access controls, encryption in transit and at rest, ephemeral voice processing, and contractual restrictions on AI vendor data usage. Security features are continuously reviewed as Sri Lankan data protection regulations evolve.',
    },
    {
        question: 'Can doctors use MyTracksy Medical in wards or clinics with weak internet?',
        answer: 'MyTracksy Medical is built as a progressive web app, so doctors can continue using key workflows on mobile and keep app-like access from the home screen even when connectivity is unreliable.',
    },
];

const DoctorLandingPage: React.FC<DoctorLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [navSolid, setNavSolid] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);
    const [showIOSGuide, setShowIOSGuide] = useState(false);

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;

    useEffect(() => {
        if (isStandalone) { setIsInstalled(true); return; }
        const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
        window.addEventListener('beforeinstallprompt', handler);
        window.addEventListener('appinstalled', () => setIsInstalled(true));
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (isIOS) { setShowIOSGuide(!showIOSGuide); return; }
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setIsInstalled(true);
        setDeferredPrompt(null);
    };

    useEffect(() => {
        const handleScroll = () => {
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        // Progressive enhancement: add js-ready class so CSS can enable animations
        document.documentElement.classList.add('js-ready');

        const revealElement = (el: Element) => {
            el.classList.add('sr-visible');
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

        // Observe all .sr elements after a brief delay for DOM readiness
        const timer = setTimeout(() => {
            const srElements = document.querySelectorAll('.sr');
            srElements.forEach((el) => {
                // Immediately reveal elements already in viewport
                const rect = el.getBoundingClientRect();
                if (rect.top < window.innerHeight && rect.bottom > 0) {
                    revealElement(el);
                } else {
                    observer.observe(el);
                }
            });
        }, 150);

        // Fallback: reveal ALL still-hidden .sr elements after 2.5 seconds
        const fallbackTimer = setTimeout(() => {
            document.querySelectorAll('.sr').forEach((el) => {
                if (!el.classList.contains('sr-visible')) {
                    revealElement(el);
                }
            });
        }, 2500);

        return () => {
            clearTimeout(timer);
            clearTimeout(fallbackTimer);
            observer.disconnect();
            document.documentElement.classList.remove('js-ready');
        };
    }, []);

    const medicalStructuredData = [
        {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'MyTracksy Medical',
            url: 'https://mytracksy.com/medical',
            applicationCategory: 'MedicalBusiness',
            operatingSystem: 'Web, Android, iOS',
            image: 'https://mytracksy.com/logos/mytracksy-logo.png',
            description: 'MyTracksy Medical helps Sri Lankan doctors manage channeling income, clinic expenses, AI voice notes, patient workflows, and tax-ready exports in one fast PWA.',
            offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'LKR',
            },
            publisher: {
                '@type': 'Organization',
                name: 'MyTracksy',
                url: 'https://mytracksy.com/',
                logo: 'https://mytracksy.com/logos/mytracksy-logo.png',
            },
        },
        {
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'MyTracksy',
                    item: 'https://mytracksy.com/',
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: 'Medical',
                    item: 'https://mytracksy.com/medical',
                },
            ],
        },
        {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: MEDICAL_FAQS.map((faq) => ({
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
                <title>MyTracksy Medical | Clinic, Tax & Practice Management for Sri Lankan Doctors</title>
                <meta name="description" content="MyTracksy Medical helps Sri Lankan doctors manage clinic income, channeling, expenses, voice notes, patients, and IRD-ready tax workflows from one fast mobile-friendly PWA." />
                <meta name="keywords" content="doctor software sri lanka, clinic management system, medical billing software, sri lanka doctor tax, private channeling software, AI clinical notes sinhala tamil" />
                <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
                <link rel="canonical" href="https://mytracksy.com/medical" />
                <link rel="preload" as="image" href="/assets/healthcare/sri_lankan_doctors_hero_bg.png" />

                <meta property="og:type" content="website" />
                <meta property="og:site_name" content="MyTracksy" />
                <meta property="og:url" content="https://mytracksy.com/medical" />
                <meta property="og:title" content="MyTracksy Medical | Clinic, Tax & Practice Management for Sri Lankan Doctors" />
                <meta property="og:description" content="Track channeling income, clinic expenses, AI voice notes, patient workflows, and tax-ready exports in one doctor-first workspace." />
                <meta property="og:image" content="https://mytracksy.com/logos/mytracksy-logo.png" />
                <meta property="og:image:alt" content="MyTracksy logo" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content="MyTracksy Medical | Clinic, Tax & Practice Management for Sri Lankan Doctors" />
                <meta name="twitter:description" content="Track channeling income, clinic expenses, AI voice notes, patient workflows, and tax-ready exports in one doctor-first workspace." />
                <meta name="twitter:image" content="https://mytracksy.com/logos/mytracksy-logo.png" />

                <script type="application/ld+json">
                    {JSON.stringify(medicalStructuredData)}
                </script>
            </Helmet>

            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                * { box-sizing: border-box; margin: 0; padding: 0; }
                html { scroll-padding-top: 80px; scroll-behavior: smooth; }
                body { background: #fcfcfc; }
                .lt-c { font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; color: #0f172a; line-height: 1.6; overflow-x: clip; -webkit-font-smoothing: antialiased; }
                .lt-i { max-width: 1300px; margin: 0 auto; padding: 0 5%; }
                /* Progressive enhancement: content visible by default. Only hide for animation when JS has loaded. */
                .sr { opacity: 1; transform: none; }
                html.js-ready .sr { opacity: 0; transform: translateY(40px); transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
                html.js-ready .sr.sr-visible { opacity: 1; transform: translateY(0); }
                /* A11y/SEO: Never hide content from reduced-motion users, screen readers, or print */
                @media (prefers-reduced-motion: reduce) { html.js-ready .sr { opacity: 1 !important; transform: none !important; transition: none !important; } }
                @media print { .sr { opacity: 1 !important; transform: none !important; } }

                @keyframes gradient-bg { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
                @keyframes float-slow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }

                /* A11y: Skip navigation link */
                .skip-nav { position: absolute; top: -100px; left: 16px; z-index: 10000; background: #0f172a; color: #fff; padding: 12px 24px; border-radius: 0 0 8px 8px; font-weight: 700; font-size: 14px; text-decoration: none; transition: top 0.2s ease; }
                .skip-nav:focus { top: 0; outline: 3px solid #0ea5e9; outline-offset: 2px; }

                /* A11y: Focus visible indicators for ALL interactive elements */
                *:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; border-radius: 4px; }
                button:focus-visible, a:focus-visible { outline: 2px solid #2563EB; outline-offset: 2px; }

                .lt-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; padding: 20px 0; transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .lt-nav-s { padding: 16px 0; background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(24px) saturate(180%); -webkit-backdrop-filter: blur(24px) saturate(180%); border-bottom: 1px solid rgba(0, 0, 0, 0.04); box-shadow: 0 1px 20px rgba(0, 0, 0, 0.03); }

                /* A11y: Nav link buttons with proper touch targets (44px min) */
                .nav-link-btn { background: none; border: none; font-size: 14px; font-weight: 600; color: #475569; cursor: pointer; transition: color 0.2s; font-family: inherit; padding: 12px 8px; min-height: 44px; min-width: 44px; display: inline-flex; align-items: center; }
                .nav-link-btn:hover { color: #0f172a; }

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

                .text-gradient { background: linear-gradient(135deg, #0f172a, #1e293b, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-size: 200% auto; animation: gradient-bg 8s linear infinite; }
                .text-gradient-white { background: linear-gradient(135deg, #ffffff, #f1f5f9, #e0e7ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }

                /* A11y: Footer link buttons */
                .footer-link-btn { background: none; border: none; font-size: 15px; color: #475569; margin-bottom: 12px; cursor: pointer; font-family: inherit; padding: 4px 0; text-align: left; transition: color 0.2s; display: block; }
                .footer-link-btn:hover { color: #0ea5e9; }

                @media (max-width: 900px) {
                    .hero-grid { grid-template-columns: 1fr !important; text-align: center; }
                    .nav-links, .hero-image { display: none !important; }
                    .lt-h1 { font-size: 2.5rem !important; }
                    .hero-btns { justify-content: center; flex-direction: column; align-items: center; }
                    .glass-card { padding: 24px !important; }
                    .nav-back-btn { display: none !important; }
                    .nav-right-full { display: none !important; }
                    .nav-right-mobile { display: flex !important; }
                    .lt-nav .lt-i { padding: 0 16px !important; }
                    .security-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
                    .pricing-pro-card { transform: none !important; }
                    .footer-grid-brand { grid-column: span 1 !important; }
                    .token-store-card { flex-direction: column !important; padding: 24px !important; }
                }
            `}</style>

            <div className="lt-c">
                {/* A11y: Skip navigation link */}
                <a href="#main-content" className="skip-nav">Skip to main content</a>

                {/* Navbar */}
                <nav className={`lt-nav ${navSolid ? 'lt-nav-s' : ''}`} aria-label="Medical page navigation">
                    <div className="lt-i" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={onBack} className="btn-secondary nav-back-btn" style={{ padding: '8px 16px', fontSize: 13 }}>← Back to Platform</button>
                            <a href="/medical" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }} aria-label="MyTracksy Medical home">
                                <img src="/logos/mytracksy-logo.png" alt="MyTracksy Logo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
                                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>Medical <sup style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 700 }}>PRO</sup></span>
                            </a>
                        </div>
                        {/* A11y: Convert nav <span> to <button> elements with proper touch targets */}
                        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            {['Clinical Intelligence', 'Financial Orchestration', 'Security', 'Pricing'].map((link) => {
                                const sectionMap: Record<string, string> = {
                                    'Clinical Intelligence': 'ai-superpowers',
                                    'Financial Orchestration': 'platform',
                                    'Security': 'security',
                                    'Pricing': 'pricing'
                                };
                                return (
                                    <button key={link} className="nav-link-btn" onClick={() => {
                                        const el = document.getElementById(sectionMap[link]);
                                        if (el) {
                                            const navHeight = 80;
                                            const y = el.getBoundingClientRect().top + window.scrollY - navHeight;
                                            window.scrollTo({ top: y, behavior: 'smooth' });
                                        }
                                    }}>{link}</button>
                                )
                            })}
                        </div>
                        {/* Desktop right nav - A11y: Convert Sign In <span> to <button> */}
                        <div className="nav-right-full" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <button onClick={onLogin} className="nav-link-btn" style={{ color: '#0f172a' }}>Sign In</button>
                            <button onClick={onGetStarted} className="btn-primary" style={{ padding: '10px 24px' }}>Start Free</button>
                        </div>
                        {/* Mobile right nav - A11y: Convert Sign In <span> to <button> */}
                        <div className="nav-right-mobile" style={{ display: 'none', alignItems: 'center', gap: 10 }}>
                            <button onClick={onLogin} className="nav-link-btn" style={{ fontSize: 13, color: navSolid ? '#0f172a' : '#fff' }}>Sign In</button>
                            <button onClick={onGetStarted} className="btn-primary" style={{ padding: '8px 18px', fontSize: 12 }}>Start Free</button>
                        </div>
                    </div>
                </nav>

                {/* A11y: Wrap in <main> landmark */}
                <main id="main-content">
                {/* Hero Section */}
                <header style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    paddingTop: 120,
                    paddingBottom: 80,
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundImage: 'radial-gradient(circle at center, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.95) 100%), url("/assets/healthcare/sri_lankan_doctors_hero_bg.png")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    color: '#fff'
                }}>
                    <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, background: 'linear-gradient(135deg, rgba(14,165,233,0.3), rgba(99,102,241,0.2))', borderRadius: '50%', filter: 'blur(100px)', zIndex: 0, animation: 'float-slow 20s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(125,211,252,0.1))', borderRadius: '50%', filter: 'blur(80px)', zIndex: 0, animation: 'float-slow 25s ease-in-out infinite reverse' }} />

                    <div className="lt-i">
                        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '4rem', alignItems: 'center' }}>
                            <div style={{ zIndex: 2 }}>
                                <div className="sr" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.3)', color: '#38bdf8', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24, backdropFilter: 'blur(10px)' }}>
                                    <span style={{ fontSize: 16 }}>🇱🇰</span> Built for Sri Lankan Medical Professionals
                                </div>

                                <h1 className="sr lt-h1" style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24, color: '#f8fafc' }}>
                                    You Mastered Medicine. <br />
                                    <span style={{ color: '#38bdf8' }}>Let Us Handle The Accounting.</span>
                                </h1>

                                <p className="sr" style={{ fontSize: 18, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 36, maxWidth: 600 }}>
                                    Juggling Government ward rounds, evening channeling, and complex IRD taxes? MyTracksy is the ultimate <strong>Cash Management & Accounting app</strong> designed specifically for Sri Lankan junior doctors and solo practitioners. Track your private income, manage clinic expenses, and instantly share standard financial reports with your auditor. Start with our powerful free accounting tier.
                                </p>

                                <div className="hero-btns" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16, opacity: 1 }}>
                                    <button onClick={onGetStarted} className="btn-primary" style={{ padding: '18px 36px', fontSize: 16 }}>
                                        👉 Start Your 14-Day Free Trial
                                    </button>
                                    <button onClick={() => {
                                        const hero = document.querySelector('.hero-image iframe') as HTMLIFrameElement;
                                        if (hero) {
                                            hero.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                        } else {
                                            document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                        }
                                    }} className="btn-secondary" style={{ padding: '18px 36px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        ▶ Watch the 1-Minute Demo
                                    </button>
                                </div>

                                <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, opacity: 1 }}>
                                    <span style={{ color: '#34d399' }}>✓</span> No App Store required. Professional software — may qualify as a tax-deductible business expense.*
                                </div>

                                {/* One-line PWA Install Direct Link */}
                                {!isInstalled && (
                                    <div style={{ marginTop: 16, opacity: 1 }}>
                                        <button
                                            onClick={handleInstallClick}
                                            style={{
                                                background: 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))',
                                                border: '1px solid rgba(14,165,233,0.3)',
                                                borderRadius: 99,
                                                padding: '10px 24px',
                                                color: '#38bdf8',
                                                fontSize: 14,
                                                fontWeight: 700,
                                                cursor: 'pointer',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                backdropFilter: 'blur(10px)',
                                                transition: 'all 0.3s ease',
                                                fontFamily: 'inherit',
                                                letterSpacing: '-0.01em',
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14,165,233,0.25), rgba(99,102,241,0.25))'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.2)'; }}
                                            onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.15))'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
                                            {isIOS ? '📲 Free App — Add to Home Screen' : '📲 Free App — Install Now'}
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="hero-image sr" style={{ position: 'relative', transitionDelay: '0.2s', zIndex: 2 }}>
                                <div style={{ background: 'rgba(15,23,42,0.8)', backdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.5), 0 20px 40px -20px rgba(14,165,233,0.2)', padding: '8px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12, paddingLeft: 12, paddingTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffb020' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                        </div>
                                    </div>

                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 16, background: '#000' }}>
                                        <iframe
                                            src="https://www.youtube.com/embed/mId3maCwHXg?autoplay=1&mute=1&loop=1&playlist=mId3maCwHXg&controls=0&showinfo=0&rel=0&modestbranding=1"
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                                            allow="autoplay; encrypted-media"
                                            allowFullScreen
                                            title="MyTracksy Doctor App — Pricing Tiers Demo"
                                            loading="lazy"
                                        />
                                    </div>
                                </div>
                                <div style={{ position: 'absolute', inset: -20, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', filter: 'blur(60px)', opacity: 0.15, zIndex: -1, borderRadius: '50%' }} />
                            </div>
                        </div>
                    </div>
                </header>



                {/* Vertical Space */}
                <div style={{ height: 60, background: 'linear-gradient(to bottom, #fcfcfc, #f1f5f9)' }} />

                {/* Core Architecture */}
                <section id="platform" aria-labelledby="platform-heading" style={{ padding: '120px 0', background: '#f1f5f9', position: 'relative' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 80 }}>
                            <h2 id="platform-heading" style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Accounting Designed specifically For Clinicians</h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                Discard legacy ledgers and complex accounting software. Manage your single-clinic bookkeeping, track your daily cash flow, and effortlessly compile RAMIS-ready tax exports. <strong>Core accounting is free forever.</strong>
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 40 }}>
                            <div className="glass-card sr" style={{ padding: 40 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(14,165,233,0.4)', border: '1px solid rgba(14,165,233,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_prescription_billing_1773217275109.png" alt="MyTracksy prescription billing and solo practice bookkeeping for doctors" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Solo Practice Bookkeeping</h3>
                                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                                    Perfect for Junior Doctors and solo practitioners. Track incoming cash from private channels, log traveling expenses, and keep your daily clinic cash register perfectly balanced, all from your phone.
                                </p>
                            </div>

                            <div className="glass-card sr" style={{ padding: 40, transitionDelay: '100ms' }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(16,185,129,0.4)', border: '1px solid rgba(16,185,129,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_clinic_revenue_1773217260607.png" alt="Clinic revenue tracking dashboard with automated bank sync for medical practices" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Zero-Touch Bank Integrations</h3>
                                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                                    Establish automated email forwarding protocols from your banking institutions. The matrix reads securely forwarded alerts to log private channeling deposits instantly, exposing missing payments effortlessly.
                                </p>
                            </div>

                            <div className="glass-card sr" style={{ padding: 40, transitionDelay: '200ms' }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(139,92,246,0.4)', border: '1px solid rgba(139,92,246,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_tax_compliance_1773217329017.png" alt="Tax compliance and auditor-ready export tools for Sri Lankan medical professionals" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>1-Click Auditor Excel Exports</h3>
                                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                                    Stop sending shoeboxes of receipts. Automatically compile clean, formatted Excel sheets of your income and expenses, complete with tax telemetry, ready to pass directly to your Auditor at financial year-end.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Superpowers */}
                <section id="ai-superpowers" aria-labelledby="ai-heading" style={{ padding: '140px 0 100px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
                    {/* Glowing Orbs */}
                    <div style={{ position: 'absolute', top: '10%', left: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 60%)', filter: 'blur(80px)', zIndex: 0 }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />

                    <div className="lt-i" style={{ position: 'relative', zIndex: 1 }}>
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 80 }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#d8b4fe', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#a855f7', boxShadow: '0 0 12px #a855f7' }}></span>
                                Token Wallet Powered
                            </div>
                            <h2 id="ai-heading" style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.1 }}>
                                Upgrade Your Practice with<br />
                                <span style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    AI Clinical Superpowers.
                                </span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#cbd5e1', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                Need to do heavy lifting? Use your MyTracksy Token Wallet to access elite, time-saving AI tools instantly.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
                            {/* Card 1 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(139,92,246,0.1)' }}>📄</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>1-Click Referral Letters</h3>
                                <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, flex: 1 }}>
                                    Turn a messy 30-second casual voice note into a beautifully formatted, highly polite PDF Referral Letter to a Consultant in <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>5 seconds</strong>.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transitionDelay: '100ms' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.05))', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(14,165,233,0.1)' }}>📉</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>Vision AI Lab Trends</h3>
                                <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, flex: 1 }}>
                                    Snap a photo of 4 faded, printed blood reports from the last 6 months. The AI instantly draws a clean trend-graph of the patient's Fasting Blood Sugar right on your screen.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transitionDelay: '200ms' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(16,185,129,0.1)' }}>🗣️</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>Patient Translator</h3>
                                <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.7, flex: 1 }}>
                                    Dictate dosage instructions in English, and instantly generate a polite Sinhala/Tamil PDF "Take-Home Card" to WhatsApp to your patient.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ===== TRUST & COMPLIANCE ===== */}
                <section className="sr" style={{ padding: '100px 24px', background: 'linear-gradient(180deg, #0c1222 0%, #111827 100%)' }}>
                    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(45,212,191,0.1)', border: '1px solid rgba(45,212,191,0.25)', borderRadius: 100, padding: '8px 20px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: '#5eead4', marginBottom: 20 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                                Built for Medical-Grade Operations
                            </span>
                            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 38px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.15, color: '#f1f5f9', marginBottom: 14 }}>
                                Your Practice Data, Protected by Design
                            </h2>
                            <p style={{ fontSize: 16, lineHeight: 1.7, color: '#94a3b8', maxWidth: 580, margin: '0 auto' }}>
                                Architected for the regulatory reality of Sri Lankan medical practice — where patient data is special-category information.
                            </p>
                        </div>

                        {/* PDPA-Ready Banner */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'linear-gradient(135deg, rgba(45,212,191,0.08), rgba(99,102,241,0.08))', border: '1px solid rgba(45,212,191,0.2)', borderRadius: 12, padding: '14px 24px', marginBottom: 48, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                            <div style={{ width: 32, height: 32, background: 'rgba(45,212,191,0.12)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                            </div>
                            <span style={{ fontSize: 14, fontWeight: 500, color: '#2dd4bf' }}>
                                Built for PDPA-Ready Operations <span style={{ color: '#64748b', fontWeight: 400 }}>— Act No. 9 of 2022</span>
                            </span>
                        </div>

                        {/* Trust Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
                            {[
                                { icon: '🛡️', color: '#818cf8', label: 'SYSTEM INTEGRITY', title: 'PDPA-Aligned Data Handling', body: 'Designed for handling special-category medical data with role-based access controls, encryption in transit and at rest, and auditable processing controls.' },
                                { icon: '🔒', color: '#2dd4bf', label: 'PRIVACY CONTROLS', title: 'Automated Redaction & Pseudonymization', body: 'Patient-identifier redaction workflows applied based on your deployment policy and workflow configuration.' },
                                { icon: '🎙️', color: '#fb7185', label: 'VOICE PROCESSING', title: 'Ephemeral Voice Handling', body: 'Voice inputs processed using ephemeral controls with vendor restrictions designed to minimize retention and prevent public model training use.' },
                                { icon: '☁️', color: '#38bdf8', label: 'CLOUD INFRASTRUCTURE', title: 'Enterprise Cloud with Safeguards', body: 'Hosted on enterprise-grade cloud infrastructure with cross-border processing safeguards, encryption, and audit logging.' },
                                { icon: '💳', color: '#34d399', label: 'PAYMENT PROCESSING', title: 'Sri Lanka-Licensed Channels', body: 'Integrates with Sri Lanka-licensed and authorized payment providers and acquiring channels, subject to merchant onboarding.' },
                                { icon: '📋', color: '#fbbf24', label: 'TAX LOGIC', title: 'IRD-Aligned Tax Estimation', body: 'Tax workflows built against applicable Sri Lankan tax rules, designed for periodic review by qualified tax professionals including CA Sri Lanka members.' },
                            ].map((card, i) => (
                                <div key={i} style={{ background: '#1a2332', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '28px 24px', transition: 'border-color 0.3s, transform 0.3s' }} onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99,102,241,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }} onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}>
                                    <span style={{ fontSize: 24, marginBottom: 16, display: 'block' }}>{card.icon}</span>
                                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#64748b', marginBottom: 6 }}>{card.label}</div>
                                    <div style={{ fontSize: 16, fontWeight: 600, color: '#f1f5f9', marginBottom: 10, lineHeight: 1.35 }}>{card.title}</div>
                                    <div style={{ fontSize: 13.5, lineHeight: 1.65, color: '#94a3b8' }}>{card.body}</div>
                                </div>
                            ))}
                        </div>

                        {/* Legal footnote */}
                        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', maxWidth: 640, margin: '36px auto 0', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28 }}>
                            MyTracksy is designed to support compliance with the Personal Data Protection Act, No. 9 of 2022. Compliance status depends on your deployment configuration, operational policies, and ongoing governance practices.
                        </p>
                    </div>
                </section>

                {/* ===== PRICING SECTION ===== */}
                <section id="pricing" aria-labelledby="pricing-heading" style={{ padding: '120px 0', background: '#fcfcfc', position: 'relative' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 60 }}>
                            <div className="pp-badge" style={{ display: 'inline-block', background: 'rgba(14,165,233,0.08)', color: '#0284c7', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 16 }}>Costs less than ONE channeling consultation</div>
                            <h2 id="pricing-heading" style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Put your taxes and clinical notes on autopilot.</h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 650, margin: '0 auto', lineHeight: 1.7 }}>
                                Why spend LKR 50,000+ on accountant fees and lose hundreds of thousands in forgotten hospital payments?
                            </p>
                        </div>

                        {/* Billing Toggle */}
                        <div className="sr" style={{ display: 'flex', justifyContent: 'center', marginBottom: 60 }}>
                            <div style={{ background: '#f1f5f9', padding: 6, borderRadius: 99, display: 'inline-flex', position: 'relative', alignItems: 'center' }}>
                                <button onClick={() => setBillingCycle('monthly')} style={{ padding: '12px 32px', borderRadius: 99, border: 'none', background: billingCycle === 'monthly' ? '#fff' : 'transparent', color: billingCycle === 'monthly' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s', boxShadow: billingCycle === 'monthly' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                                    Monthly
                                </button>
                                <button onClick={() => setBillingCycle('annual')} style={{ padding: '12px 32px', borderRadius: 99, border: 'none', background: billingCycle === 'annual' ? '#fff' : 'transparent', color: billingCycle === 'annual' ? '#0f172a' : '#64748b', fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all 0.3s', boxShadow: billingCycle === 'annual' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none' }}>
                                    Annual <span style={{ background: '#10b981', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 800, marginLeft: 8 }}>2 Months Free!</span>
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, alignItems: 'stretch' }}>
                            {/* Free Tier */}
                            <div className="sr glass-card" style={{ padding: '48px 32px', background: '#ffffff', borderRadius: 32, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>🌱 Tier 1</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Intern / Basic</div>
                                <div style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.04em' }}>LKR 0</div>
                                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 32 }}>Free Forever — No credit card required</div>
                                <button onClick={onGetStarted} className="btn-secondary" style={{ width: '100%', marginBottom: 40, padding: '16px' }}>Get Started Free</button>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { t: 'Basic Dual-Roster Calendar (Manual scheduling)', i: '✅' },
                                        { t: 'Manual Ledger — Input Income & Expenses', i: '✅' },
                                        { t: 'Basic IRD Tax Estimator (View-only brackets)', i: '✅' },
                                        { t: 'PWA — Works Offline on Any Device', i: '✅' },
                                        { t: '5 Free AI Voice Notes / month', i: '🎁' },
                                        { t: 'Bank Auto-Sync', i: '❌' },
                                        { t: 'Smart Receipt Scanner', i: '❌' },
                                        { t: 'Auditor Excel Export', i: '❌' },
                                    ].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: '#475569', fontWeight: 500 }}>
                                            <div style={{ fontSize: 16 }}>{f.i}</div>
                                            <div style={{ lineHeight: 1.5, opacity: f.i === '❌' ? 0.5 : 1 }}>{f.t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Pro Tier (Highlighted) */}
                            <div className="sr pricing-pro-card" style={{ padding: '48px 32px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px -20px rgba(14,165,233,0.3)', position: 'relative', transform: 'scale(1.05)', zIndex: 2 }}>
                                <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg, #38bdf8, #0ea5e9)', color: '#fff', padding: '6px 20px', borderRadius: 99, fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', boxShadow: '0 8px 16px rgba(14,165,233,0.3)' }}>Most Popular</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>🥇 Tier 2</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 16 }}>Pro / Consultant</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                    {billingCycle === 'annual' ? (
                                        <>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through' }}>LKR 34,800</span>
                                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>LKR 29,000</span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.04em' }}>LKR 2,900</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 14, color: '#94a3b8', fontWeight: 600, marginBottom: 32 }}>
                                    {billingCycle === 'annual' ? '/ year — That\'s just LKR 2,417/mo (2 Months Free!)' : '/ month'}
                                </div>
                                <button onClick={onGetStarted} className="btn-primary" style={{ width: '100%', marginBottom: 32, padding: '16px', background: 'linear-gradient(135deg, #38bdf8, #0284c7)', fontSize: 16 }}>Start Your 14-Day Free Trial</button>

                                <div style={{ fontSize: 13, color: '#cbd5e1', background: 'rgba(255,255,255,0.05)', padding: 16, borderRadius: 16, marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 20 }}>🛡️</div>
                                    <div style={{ lineHeight: 1.5 }}><strong>May qualify as a tax-deductible expense.</strong> When you subscribe, MyTracksy logs this invoice into your expense tracker as "Professional Medical Software," which may help reduce your taxable income. Consult your tax advisor.</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { t: 'Unlimited Offline AI Voice-to-Text Clinical Notes', i: '🎙️' },
                                        { t: 'Zero-Touch Accounting — Bank Email Auto-Sync', i: '🏦' },
                                        { t: 'Live IRD Tax Estimator (Real-time APIT/PAYE)', i: '⚖️' },
                                        { t: 'Smart Receipt Scanner for SLMC/fuel deductions', i: '📸' },
                                        { t: '1-Click Auditor Excel/ZIP Export', i: '📑' },
                                        { t: 'Smart Commute — Live WhatsApp traffic alerts', i: '🚗' },
                                        { t: '50 Free AI Tokens every month for Premium Add-ons!', i: '🎁' }
                                    ].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: f.i === '🎁' ? '#fff' : '#e2e8f0', fontWeight: f.i === '🎁' ? 700 : 500 }}>
                                            <div style={{ fontSize: 16 }}>✅ {f.i}</div>
                                            <div style={{ lineHeight: 1.5 }}>{f.t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Enterprise Tier */}
                            <div className="sr glass-card" style={{ padding: '48px 32px', background: '#ffffff', borderRadius: 32, border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)' }}>
                                <div style={{ position: 'absolute', top: 16, right: 16, background: '#f8fafc', color: '#64748b', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Elite</div>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#8b5cf6', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.05em' }}>💎 Tier 3</div>
                                <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Clinic Director</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                                    {billingCycle === 'annual' ? (
                                        <>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: '#94a3b8', textDecoration: 'line-through' }}>LKR 90,000</span>
                                            <span style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>LKR 75,000</span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>LKR 7,500</span>
                                    )}
                                </div>
                                <div style={{ fontSize: 14, color: '#64748b', fontWeight: 600, marginBottom: 32 }}>
                                    {billingCycle === 'annual' ? '/ year — That\'s just LKR 6,250/mo' : '/ month'}
                                </div>
                                <button onClick={() => window.open('mailto:hello@mytracksy.com?subject=Clinic%20Director%20Plan%20Inquiry', '_blank')} className="btn-secondary" style={{ width: '100%', marginBottom: 32, padding: '16px', fontSize: 16, background: '#f8fafc' }}>Contact Sales</button>

                                <div style={{ fontSize: 13, color: '#475569', background: '#f1f5f9', padding: 16, borderRadius: 16, marginBottom: 32, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                                    <div style={{ fontSize: 20 }}>💡</div>
                                    <div style={{ lineHeight: 1.5 }}>Replace a LKR 35,000/month receptionist and POS system with one app. The Clinic Director plan pays for itself in week one.</div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>Everything in Pro, plus:</div>
                                    {[
                                        { t: 'Assistant Sub-Login — Restricted web dashboard for your clinic nurse/dispenser', i: '👥' },
                                        { t: 'Live Cash Dashboard — See front-desk cash totals on your phone during consultations', i: '📊' },
                                        { t: 'AI WhatsApp Receptionist — Patients WhatsApp your clinic to ask availability & get queue numbers automatically', i: '🤖' },
                                        { t: '200 Free AI Tokens every month', i: '🎁' }
                                    ].map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, fontSize: 15, color: '#475569', fontWeight: f.i === '🎁' ? 700 : 500 }}>
                                            <div style={{ fontSize: 16 }}>✅ {f.i}</div>
                                            <div style={{ lineHeight: 1.5 }}>{f.t}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* AI Token Store Add-on */}
                        <div className="sr token-store-card" style={{ marginTop: 60, padding: '40px 48px', background: '#ffffff', borderRadius: 32, border: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 48, alignItems: 'center', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                            <div style={{ flex: '1 1 300px' }}>
                                <div style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.05em' }}>🪙 AI Token Store — Pay-As-You-Go</div>
                                <h3 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginBottom: 16, letterSpacing: '-0.02em', lineHeight: 1.2 }}>Run out of your monthly free tokens? Top up instantly.</h3>
                                <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>Tokens never expire. A doctor will happily spend LKR 15 — the price of a piece of chewing gum — to generate a referral letter in 3 seconds rather than writing it by hand while 20 patients wait outside.</p>
                                <div style={{ display: 'inline-block', background: '#fffbeb', color: '#b45309', padding: '16px 24px', borderRadius: 16, fontSize: 18, fontWeight: 800, border: '1px solid #fde68a' }}>
                                    LKR 1,500 <span style={{ fontSize: 14, fontWeight: 600, color: '#d97706', opacity: 0.8 }}>for 100 AI Tokens (LKR 15 each)</span>
                                </div>
                            </div>
                            <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    { t: '1 Token', d: 'Generate a PDF Referral Letter to a hospital' },
                                    { t: '1 Token', d: 'Generate a printable Sick Leave Medical Certificate' },
                                    { t: '2 Tokens', d: 'Translate dosage instructions into Sinhala/Tamil PDF Take-Home Card' },
                                    { t: '3 Tokens', d: 'Vision AI reads 4 faded lab reports & draws a trend graph' },
                                    { t: '15 Tokens', d: 'Draft a 5-page PGIM Academic Casebook from voice notes' }
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', background: '#f8fafc', padding: '12px 16px', borderRadius: 12 }}>
                                        <div style={{ background: '#0f172a', color: '#fff', fontSize: 13, fontWeight: 800, padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>{item.t}</div>
                                        <div style={{ fontSize: 14, color: '#334155', fontWeight: 500, lineHeight: 1.4 }}>{item.d}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </section>

                {/* Final CTA */}
                <section style={{ padding: '120px 0', background: 'linear-gradient(135deg, #f1f5f9 0%, #ffffff 100%)', textAlign: 'center' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', borderRadius: 40, padding: '80px 40px', position: 'relative', overflow: 'hidden', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.2)' }}>
                            <div style={{ position: 'absolute', right: '-10%', top: '-20%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(60px)' }} />

                            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 24, position: 'relative', zIndex: 1 }}>Start Managing Your Practice Like a Pro.</h2>
                            <p style={{ fontSize: 18, color: '#e0e7ff', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                                Reclaim 20+ hours per month. The complete accounting and clinical workflow platform built specifically for Sri Lankan Doctors.
                            </p>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <button onClick={onGetStarted} className="btn-primary" style={{ padding: '20px 48px', fontSize: 18, background: '#ffffff', color: '#0f172a' }}>
                                    Start Your 14-Day Free Trial
                                </button>
                                <div style={{ marginTop: 20, fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>No credit card required. *Consult your tax advisor on deductibility.</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQ / AEO SEO Section */}
                <section id="faq" style={{ padding: '80px 0', background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="lt-i sr" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', marginBottom: 60 }}>
                            <h2 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 16 }}>Frequently Asked Questions</h2>
                            <p style={{ fontSize: 17, color: '#475569' }}>Everything Sri Lankan medical professionals need to know about MyTracksy.</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                            {MEDICAL_FAQS.map((faq) => (
                                <div key={faq.question} style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>{faq.question}</h3>
                                    <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>{faq.answer}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                </main>
                {/* Footer - A11y: Fix heading hierarchy H4→H3, convert divs to buttons, fix contrast */}
                <footer style={{ background: '#f8fafc', padding: '80px 0 40px', borderTop: '1px solid rgba(0,0,0,0.05)' }} role="contentinfo">
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 80 }}>
                            <div className="footer-grid-brand" style={{ gridColumn: 'span 2' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                    <img src="/logos/mytracksy-logo.png" alt="MyTracksy" style={{ height: 48, objectFit: 'contain' }} />
                                    <span style={{ fontSize: 20, fontWeight: 800, color: '#0ea5e9' }}>Medical</span>
                                </div>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.7, maxWidth: 350 }}>
                                    The complete accounting and practice management platform trusted by doctors and surgeons across Sri Lanka.
                                </p>
                            </div>
                            <div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>System Capabilities</h3>
                                {['Clinical Intelligence', 'Revenue Syndication', 'Security Protocols', 'AI Extensibility'].map(l => {
                                    const sectionMap: Record<string, string> = {
                                        'Clinical Intelligence': 'platform',
                                        'Revenue Syndication': 'platform',
                                        'Security Protocols': 'security',
                                        'AI Extensibility': 'ai-superpowers'
                                    };
                                    return (
                                        <button key={l} className="footer-link-btn" onClick={() => {
                                            const el = document.getElementById(sectionMap[l]);
                                            if (el) {
                                                const y = el.getBoundingClientRect().top + window.scrollY - 80;
                                                window.scrollTo({ top: y, behavior: 'smooth' });
                                            }
                                        }}>{l}</button>
                                    )
                                })}
                            </div>
                            <div>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Compliance</h3>
                                {['PDPA-Ready Operations', 'Terms of Service', 'Data Protection Policy'].map(l => (
                                    <button key={l} className="footer-link-btn" onClick={() => {
                                        if (l === 'PDPA-Ready Operations') {
                                            const el = document.getElementById('security');
                                            if (el) {
                                                const y = el.getBoundingClientRect().top + window.scrollY - 80;
                                                window.scrollTo({ top: y, behavior: 'smooth' });
                                            }
                                        }
                                    }}>{l}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: 14, color: '#475569' }}>
                                © 2026 MyTracksy Enterprise Systems. Designed & Built in Sri Lanka by <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#2563EB', textDecoration: 'underline', fontWeight: 600 }}>SafeNetCreations</a>.
                            </div>
                            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: '#059669', fontWeight: 600 }}>
                                <span aria-hidden="true" style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                All Systems Operational
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default DoctorLandingPage;
