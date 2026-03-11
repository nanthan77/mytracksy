import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface DoctorLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const DoctorLandingPage: React.FC<DoctorLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [navSolid, setNavSolid] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'annual' | 'monthly'>('annual');

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

    return (
        <>
            <Helmet>
                <title>MyTracksy Medical | Best Clinic & Tax Software for Doctors in Sri Lanka</title>
                <meta name="description" content="The ultimate AI-powered clinic management and tax automation software designed specifically for Sri Lankan doctors. Automate your private practice revenue, clinical notes, and IRD tax compliance." />
                <meta name="keywords" content="doctor software sri lanka, clinic management system, medical billing software, sri lanka doctor tax, private channeling software, AI clinical notes sinhala tamil" />
                <link rel="canonical" href="https://mytracksy.lk/medical" />

                {/* Open Graph / Social */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://mytracksy.lk/medical" />
                <meta property="og:title" content="MyTracksy Medical | Clinic & Tax Software for Sri Lankan Doctors" />
                <meta property="og:description" content="Automate your channeling revenue, clinical notes, and IRD tax compliance seamlessly." />
                <meta property="og:image" content="https://mytracksy.lk/assets/hero-doctor.png" />

                {/* JSON-LD Schema Markup */}
                <script type="application/ld+json">
                    {`
                        {
                            "@context": "https://schema.org",
                            "@type": "SoftwareApplication",
                            "name": "MyTracksy Medical",
                            "applicationCategory": "MedicalSoftware",
                            "operatingSystem": "Web, Android, iOS",
                            "description": "AI-powered clinic management and tax automation software for doctors in Sri Lanka.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "LKR"
                            },
                            "author": {
                                "@type": "Organization",
                                "name": "SafeNetCreations"
                            }
                        }
                    `}
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
                    .nav-links, .hero-image { display: none !important; }
                    .lt-h1 { font-size: 3rem !important; }
                    .hero-btns { justify-content: center; }
                    .glass-card { padding: 24px !important; }
                }
            `}</style>

            <div className="lt-c">
                {/* Navbar */}
                <nav className={`lt-nav ${navSolid ? 'lt-nav-s' : ''}`}>
                    <div className="lt-i" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', gap: 16 }}>
                            <button onClick={onBack} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>← Back to Platform</button>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #0ea5e9, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(14,165,233,0.15)' }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 4v16m-8-8h16" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                                    </svg>
                                </div>
                                <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>Medical <sup style={{ fontSize: 10, color: '#0ea5e9', fontWeight: 700 }}>PRO</sup></span>
                            </div>
                        </div>
                        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                            {['Clinical Intelligence', 'Financial Orchestration', 'Security', 'Pricing'].map((link) => {
                                const sectionMap: Record<string, string> = {
                                    'Clinical Intelligence': 'ai-superpowers',
                                    'Financial Orchestration': 'platform',
                                    'Security': 'security',
                                    'Pricing': 'pricing'
                                };
                                return (
                                    <span key={link} onClick={() => document.getElementById(sectionMap[link])?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'color 0.2s' }}>{link}</span>
                                )
                            })}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                            <span onClick={onLogin} style={{ fontSize: 14, fontWeight: 600, color: '#0f172a', cursor: 'pointer' }}>Sign In</span>
                            <button onClick={onGetStarted} className="btn-primary" style={{ padding: '10px 24px' }}>Deploy Infrastructure</button>
                        </div>
                    </div>
                </nav>

                {/* Hero Section */}
                <header style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 120, paddingBottom: 80, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at top right, rgba(14,165,233,0.08) 0%, transparent 60%), radial-gradient(circle at bottom left, rgba(59,130,246,0.05) 0%, transparent 60%)' }}>
                    <div style={{ position: 'absolute', top: '10%', right: '5%', width: 500, height: 500, background: 'linear-gradient(135deg, #e0f2fe, #f8fafc)', borderRadius: '50%', filter: 'blur(80px)', zIndex: -1, animation: 'float-slow 20s ease-in-out infinite' }} />
                    <div style={{ position: 'absolute', bottom: '10%', left: '5%', width: 400, height: 400, background: 'linear-gradient(135deg, #f0f9ff, #f8fafc)', borderRadius: '50%', filter: 'blur(60px)', zIndex: -1, animation: 'float-slow 25s ease-in-out infinite reverse' }} />

                    <div className="lt-i">
                        <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '4rem', alignItems: 'center' }}>
                            <div style={{ zIndex: 2 }}>
                                <div className="sr" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.15)', color: '#0284c7', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>
                                    <span style={{ fontSize: 16 }}>🇱🇰</span> Built Exclusively for Sri Lankan Medical Professionals
                                </div>

                                <h1 className="sr lt-h1" style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24, color: '#0f172a' }}>
                                    You Mastered Medicine. <br />
                                    <span style={{ color: '#0ea5e9' }}>Let Us Handle The Accounting.</span>
                                </h1>

                                <p className="sr" style={{ fontSize: 18, color: '#475569', lineHeight: 1.7, marginBottom: 36, maxWidth: 600 }}>
                                    Juggling Government ward rounds, evening channeling, and complex IRD taxes? MyTracksy is the ultimate <strong>Cash Management & Accounting app</strong> designed specifically for Sri Lankan junior doctors and solo practitioners. Track your private income, manage clinic expenses, and instantly share standard financial reports with your auditor. Start with our powerful free accounting tier.
                                </p>

                                <div className="hero-btns sr" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', transitionDelay: '0.1s', marginBottom: 16 }}>
                                    <button onClick={onGetStarted} className="btn-primary" style={{ padding: '18px 36px', fontSize: 16 }}>
                                        👉 Start Your 14-Day Free Trial
                                    </button>
                                    <button onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })} className="btn-secondary" style={{ padding: '18px 36px', fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                                        ▶ Watch the 1-Minute Demo
                                    </button>
                                </div>

                                <div className="sr" style={{ fontSize: 13, color: '#64748b', fontWeight: 600, transitionDelay: '0.2s', display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ color: '#10b981' }}>✓</span> No App Store required. 100% Tax-Deductible Professional Software.
                                </div>
                            </div>

                            <div className="hero-image sr" style={{ position: 'relative', transitionDelay: '0.2s', zIndex: 2 }}>
                                <div style={{ background: '#0f172a', borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px -20px rgba(14,165,233,0.25), 0 20px 40px -20px rgba(0,0,0,0.2)', padding: '8px', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: 12, paddingLeft: 12, paddingTop: 8 }}>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffb020' }} />
                                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
                                        </div>
                                    </div>

                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 16, background: '#000' }}>
                                        {/*
                                          REPLACE YOUR_YOUTUBE_VIDEO_ID below with your actual YouTube video ID.
                                          Example: If your YouTube URL is https://youtube.com/watch?v=abc123xyz
                                          then use "abc123xyz" as the ID in both places below.
                                        */}
                                        <iframe
                                            src="https://www.youtube.com/embed/YOUR_YOUTUBE_VIDEO_ID?autoplay=1&mute=1&loop=1&playlist=YOUR_YOUTUBE_VIDEO_ID&controls=0&showinfo=0&rel=0&modestbranding=1"
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
                <section id="platform" style={{ padding: '120px 0', background: '#f1f5f9', position: 'relative' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 80 }}>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Accounting Designed specifically For Clinicians</h2>
                            <p style={{ fontSize: 18, color: '#475569', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                Discard legacy ledgers and complex accounting software. Manage your single-clinic bookkeeping, track your daily cash flow, and effortlessly compile RAMIS-ready tax exports. <strong>Core accounting is free forever.</strong>
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 40 }}>
                            <div className="glass-card sr" style={{ padding: 40 }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(14,165,233,0.4)', border: '1px solid rgba(14,165,233,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_prescription_billing_1773217275109.png" alt="Solo Practitioner Bookkeeping" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Solo Practice Bookkeeping</h3>
                                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                                    Perfect for Junior Doctors and solo practitioners. Track incoming cash from private channels, log traveling expenses, and keep your daily clinic cash register perfectly balanced, all from your phone.
                                </p>
                            </div>

                            <div className="glass-card sr" style={{ padding: 40, transitionDelay: '100ms' }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(16,185,129,0.4)', border: '1px solid rgba(16,185,129,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_clinic_revenue_1773217260607.png" alt="Zero-Touch Bank Sync" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Zero-Touch Bank Integrations</h3>
                                <p style={{ fontSize: 16, color: '#475569', lineHeight: 1.7, marginBottom: 20 }}>
                                    Establish automated email forwarding protocols from your banking institutions. The matrix reads securely forwarded alerts to log private channeling deposits instantly, exposing missing payments effortlessly.
                                </p>
                            </div>

                            <div className="glass-card sr" style={{ padding: 40, transitionDelay: '200ms' }}>
                                <div style={{ width: 80, height: 80, borderRadius: 20, background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 32, boxShadow: '0 12px 30px -10px rgba(139,92,246,0.4)', border: '1px solid rgba(139,92,246,0.2)', overflow: 'hidden' }}>
                                    <img src="/assets/healthcare/healthcare_tax_compliance_1773217329017.png" alt="Auditor Export Engine" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                <section id="ai-superpowers" style={{ padding: '140px 0 100px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
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
                            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.1 }}>
                                Upgrade Your Practice with<br />
                                <span style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    AI Clinical Superpowers.
                                </span>
                            </h2>
                            <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 700, margin: '0 auto', lineHeight: 1.7 }}>
                                Need to do heavy lifting? Use your MyTracksy Token Wallet to access elite, time-saving AI tools instantly.
                            </p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32 }}>
                            {/* Card 1 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #8b5cf6, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(139,92,246,0.1)' }}>📄</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>1-Click Referral Letters</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, flex: 1 }}>
                                    Turn a messy 30-second casual voice note into a beautifully formatted, highly polite PDF Referral Letter to a Consultant in <strong style={{ color: '#e2e8f0', fontWeight: 600 }}>5 seconds</strong>.
                                </p>
                            </div>

                            {/* Card 2 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transitionDelay: '100ms' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #0ea5e9, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(14,165,233,0.2), rgba(14,165,233,0.05))', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(14,165,233,0.1)' }}>📉</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>Vision AI Lab Trends</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, flex: 1 }}>
                                    Snap a photo of 4 faded, printed blood reports from the last 6 months. The AI instantly draws a clean trend-graph of the patient's Fasting Blood Sugar right on your screen.
                                </p>
                            </div>

                            {/* Card 3 */}
                            <div className="glass-card sr" style={{ padding: 40, background: 'rgba(30,41,59,0.4)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transitionDelay: '200ms' }}>
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, transparent, #10b981, transparent)' }} />
                                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24, boxShadow: 'inset 0 0 20px rgba(16,185,129,0.1)' }}>🗣️</div>
                                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', marginBottom: 16 }}>Patient Translator</h3>
                                <p style={{ fontSize: 16, color: '#94a3b8', lineHeight: 1.7, flex: 1 }}>
                                    Dictate dosage instructions in English, and instantly generate a polite Sinhala/Tamil PDF "Take-Home Card" to WhatsApp to your patient.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PDPA & Security */}
                <section id="security" style={{ padding: '140px 0', background: '#0f172a', color: '#ffffff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 800, height: 800, background: 'radial-gradient(circle, rgba(14,165,233,0.15) 0%, transparent 60%)', filter: 'blur(100px)', zIndex: 0 }} />
                    <div className="lt-i" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 80, alignItems: 'center' }}>

                        <div className="sr">
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 99, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bae6fd', fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 24 }}>System Integrity</div>
                            <h2 className="text-gradient-white" style={{ fontSize: '3.5rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 24, lineHeight: 1.1 }}>PDPA No. 9 of 2022 Fully Compliant.</h2>
                            <p style={{ fontSize: 18, color: '#cbd5e1', lineHeight: 1.7, marginBottom: 32 }}>
                                Medical data is classified as Special Category Personal Data. Our infrastructure enforces Local-First Storage, Enterprise B2B API contracts (zero public model training), and AES-256 Cloud Encryption.
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                {[
                                    '100% Automated anonymization of patient identifiers.',
                                    'Voice data is permanently neutralized milliseconds after text processing.',
                                    'Hosted entirely on compliant South Asian (Singapore/Mumbai) server clusters.'
                                ].map((item, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#60a5fa" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                        </div>
                                        <span style={{ fontSize: 16, color: '#e2e8f0' }}>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="sr" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, position: 'relative' }}>
                            <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, backdropFilter: 'blur(20px)', transform: 'translateY(40px)' }}>
                                <div style={{ fontSize: 32, marginBottom: 16 }}>🏦</div>
                                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>CBSL Payments</h4>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>Integrated exclusively with Central Bank of Sri Lanka approved gateways.</p>
                            </div>
                            <div style={{ background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 24, padding: 32, backdropFilter: 'blur(20px)' }}>
                                <div style={{ fontSize: 32, marginBottom: 16 }}>📜</div>
                                <h4 style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc', marginBottom: 8 }}>CA Verified</h4>
                                <p style={{ fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>Tax estimation logic stringently audited against Inland Revenue parameters.</p>
                            </div>
                        </div>

                    </div>
                </section>

                {/* ===== PRICING SECTION ===== */}
                <section id="pricing" style={{ padding: '120px 0', background: '#fcfcfc', position: 'relative' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 60 }}>
                            <div className="pp-badge" style={{ display: 'inline-block', background: 'rgba(14,165,233,0.08)', color: '#0284c7', padding: '6px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 16 }}>Costs less than ONE channeling consultation</div>
                            <h2 style={{ fontSize: '3rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.03em', marginBottom: 24 }}>Put your taxes and clinical notes on autopilot.</h2>
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
                            <div className="sr" style={{ padding: '48px 32px', background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 100px -20px rgba(14,165,233,0.3)', position: 'relative', transform: 'scale(1.05)', zIndex: 2 }}>
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
                                    <div style={{ lineHeight: 1.5 }}><strong>100% Tax Deductible.</strong> When you subscribe, MyTracksy instantly logs this invoice into your expense tracker as "Professional Medical Software," legally lowering your IRD taxable income.</div>
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
                                <button onClick={onGetStarted} className="btn-secondary" style={{ width: '100%', marginBottom: 32, padding: '16px', fontSize: 16, background: '#f8fafc' }}>Contact Sales</button>

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
                        <div className="sr" style={{ marginTop: 60, padding: '40px 48px', background: '#ffffff', borderRadius: 32, border: '1px solid rgba(0,0,0,0.08)', display: 'flex', gap: 48, alignItems: 'center', boxShadow: '0 20px 40px -20px rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
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

                            <h2 style={{ fontSize: '3.5rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.03em', marginBottom: 24, position: 'relative', zIndex: 1 }}>Deploy Your Administrative Superiority.</h2>
                            <p style={{ fontSize: 18, color: '#e0e7ff', maxWidth: 600, margin: '0 auto 48px', lineHeight: 1.7, position: 'relative', zIndex: 1 }}>
                                Reclaim twenty operational hours per month. Integrate your practice into the definitive financial architecture built for Sri Lankan Doctors.
                            </p>

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <button onClick={onGetStarted} className="btn-primary" style={{ padding: '20px 48px', fontSize: 18, background: '#ffffff', color: '#0f172a' }}>
                                    Initiate 14-Day Free Deployment
                                </button>
                                <div style={{ marginTop: 20, fontSize: 14, color: '#e0e7ff', fontWeight: 600 }}>100% Tax Deductible Corporate Expense.</div>
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
                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Is MyTracksy recognized for IRD Tax purposes in Sri Lanka?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Yes. MyTracksy exports all your channeling income and business expenses (clinic rent, locum payments, vehicle maintenance) into a consolidated, Chartered Accountant-friendly format specifically aligned with Inland Revenue Department (IRD) requirements for APIT/PAYE calculations.</p>
                            </div>

                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Does the AI voice dictation support Sinhala and Tamil medical terms?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Our proprietary Clinical AI Voice Vault is trained to understand "Singlish" and local medical colloquialisms. You can dictate naturally (e.g., "patient presenting with unappu, query dengue"), and the AI will format it into standard English clinical notes or generate Sinhala/Tamil take-home PDF cards for the patient.</p>
                            </div>

                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Is patient data safe and PDPA compliant?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Absolutely. MyTracksy operates under the strict guidelines of Sri Lanka's Personal Data Protection Act (PDPA) No. 9 of 2022. We utilize bank-grade AES-256 encryption. Patient data is never used to train global AI models, and all processing is securely firewalled.</p>
                            </div>

                            <div style={{ padding: 24, borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 12 }}>Can I use it offline in Government hospital wards where there is no signal?</h3>
                                <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.6 }}>Yes! MyTracksy is a PWA (Progressive Web App) with an offline-first architecture. You can rapidly log patients, expenses, and notes deep inside concrete hospital wards without internet. Everything automatically syncs to the cloud the moment your phone reconnects to 4G or WiFi.</p>
                            </div>
                        </div>
                    </div>
                    {/* FAQ JSON-LD Schema */}
                    <Helmet>
                        <script type="application/ld+json">
                            {`
                                {
                                  "@context": "https://schema.org",
                                  "@type": "FAQPage",
                                  "mainEntity": [{
                                    "@type": "Question",
                                    "name": "Is MyTracksy recognized for IRD Tax purposes in Sri Lanka?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Yes. MyTracksy exports all your channeling income and business expenses into a consolidated, Chartered Accountant-friendly format specifically aligned with Inland Revenue Department (IRD) requirements for APIT/PAYE calculations."
                                    }
                                  }, {
                                    "@type": "Question",
                                    "name": "Does the AI voice dictation support Sinhala and Tamil medical terms?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Our proprietary Clinical AI Voice Vault is trained to understand 'Singlish' and local medical colloquialisms to format them into standard clinical notes."
                                    }
                                  }, {
                                    "@type": "Question",
                                    "name": "Can I use it offline in Government hospital wards where there is no signal?",
                                    "acceptedAnswer": {
                                      "@type": "Answer",
                                      "text": "Yes! MyTracksy is a PWA with an offline-first architecture. You can log patients and notes without internet, and it automatically syncs when you reconnect."
                                    }
                                  }]
                                }
                            `}
                        </script>
                    </Helmet>
                </section>

                {/* Footer */}
                <footer style={{ background: '#f8fafc', padding: '80px 0 40px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 80 }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', letterSpacing: '-0.04em', marginBottom: 16 }}>
                                    MyTracksy <span style={{ color: '#0ea5e9' }}>Medical Professionals</span>
                                </div>
                                <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.7, maxWidth: 350 }}>
                                    The definitive financial architecture platform utilized by leading doctors and surgeons across Sri Lanka.
                                </p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>System Capabilities</h4>
                                {['Clinical Intelligence', 'Revenue Syndication', 'Security Protocols', 'AI Extensibility'].map(l => {
                                    const sectionMap: Record<string, string> = {
                                        'Clinical Intelligence': 'platform',
                                        'Revenue Syndication': 'platform',
                                        'Security Protocols': 'security',
                                        'AI Extensibility': 'ai-superpowers'
                                    };
                                    return (
                                        <div key={l} onClick={() => document.getElementById(sectionMap[l])?.scrollIntoView({ behavior: 'smooth' })} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                    )
                                })}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 24 }}>Compliance</h4>
                                {['PDPA No.9 2022 Adherence', 'Terms of Operations', 'Data Sovereignty Doctrine'].map(l => (
                                    <div key={l} onClick={() => l === 'PDPA No.9 2022 Adherence' ? document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' }) : undefined} style={{ fontSize: 15, color: '#64748b', marginBottom: 12, cursor: 'pointer' }}>{l}</div>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, paddingTop: 32, borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                            <div style={{ fontSize: 14, color: '#94a3b8' }}>
                                © 2026 MyTracksy Enterprise Systems. Designed & Built in Sri Lanka by <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>SafeNetCreations</a>.
                            </div>
                            <div style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                                Medical Infrastructure Operational
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
};

export default DoctorLandingPage;
