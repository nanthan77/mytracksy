import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface BizTracksyLandingProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const BizTracksyLanding: React.FC<BizTracksyLandingProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [mounted, setMounted] = useState(false);
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setNavSolid(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: '🏢',
            title: 'Multi-Company "God Mode"',
            desc: 'Own a pharmacy, a hotel, and a hardware store? Toggle between isolated company dashboards with one click, or switch to the "Consolidated View" to see your entire empire\'s net worth and daily cash flow.',
        },
        {
            icon: '📦',
            title: 'Pocket Inventory & Barcode Scanner',
            desc: 'Turn your phone into a high-speed POS system. Scan items using your camera, auto-deduct stock upon sale, and get push notifications before your best-selling items run out. Prevent staff theft permanently.',
        },
        {
            icon: '⏳',
            title: 'Zero-Touch Supplier Bills (Vision AI)',
            desc: 'Stop typing. Snap a photo of a 3-page Hemas or Darley Butler supplier invoice. Our Vision AI extracts all 50 items, updates your stock levels, and logs the Accounts Payable instantly.',
        },
        {
            icon: '💸',
            title: 'The PDC Vault & Debtor Chasing',
            desc: 'Millions trapped in unpaid credit? Our dashboard flags 30-day debtors and sends polite, automated WhatsApp reminders with a 1-click PayHere link. Never let a Post-Dated Cheque bounce again.',
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: '#09090b', // Obsidian Black
            color: '#f4f4f5',
            overflowX: 'hidden'
        }}>
            <Helmet>
                <title>BizTracksy | ERP for Sri Lankan SMEs & Multi-Business Owners</title>
                <meta name="theme-color" content="#09090b" />
            </Helmet>

            <style>{`
                @keyframes gold-pulse {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .gold-border {
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.3), inset 0 0 20px rgba(251, 191, 36, 0.15);
                    border: 1px solid rgba(245, 158, 11, 0.4);
                }
                .text-gold {
                    background: linear-gradient(135deg, #fbbf24, #d97706);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .glass-card {
                    background: rgba(24, 24, 27, 0.7);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
            `}</style>

            {/* Navigation */}
            <nav style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
                background: navSolid ? 'rgba(9, 9, 11, 0.95)' : 'transparent',
                backdropFilter: navSolid ? 'blur(12px)' : 'none',
                borderBottom: navSolid ? '1px solid rgba(255,255,255,0.05)' : 'none',
                transition: 'all 0.3s ease',
                padding: '1rem 2rem'
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={onBack} style={{
                            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%', width: 36, height: 36, color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}>
                            ←
                        </button>
                        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24 }}>💼</span> BizTracksy
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 16 }}>
                        <button onClick={onLogin} style={{
                            background: 'transparent', border: 'none', color: '#a1a1aa', fontWeight: 600,
                            padding: '8px 16px', cursor: 'pointer', transition: 'color 0.2s'
                        }} onMouseOver={e => (e.target as any).style.color = '#fff'} onMouseOut={e => (e.target as any).style.color = '#a1a1aa'}>
                            Log in
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header style={{
                position: 'relative', paddingTop: 160, paddingBottom: 100,
                minHeight: '90vh', display: 'flex', alignItems: 'center',
                background: 'radial-gradient(ellipse at top, #1e293b 0%, #09090b 70%)',
                overflow: 'hidden'
            }}>
                {/* Background Image Overlay */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
                    backgroundImage: 'url("https://images.unsplash.com/photo-1556740714-a8395b3bf30f?auto=format&fit=crop&q=80&w=2000")',
                    backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.15,
                    mixBlendMode: 'luminosity'
                }} />

                {/* Gold Glow Element */}
                <div style={{
                    position: 'absolute', top: '15%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '700px', height: '700px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 60%)',
                    zIndex: 0, filter: 'blur(50px)', animation: 'gold-pulse 8s infinite ease-in-out'
                }} />

                <div style={{
                    maxWidth: 1200, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1,
                    textAlign: 'center',
                    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s ease'
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(245, 158, 11, 0.1)', color: '#fbbf24',
                        padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700,
                        border: '1px solid rgba(245, 158, 11, 0.3)', marginBottom: 24,
                        letterSpacing: '0.05em'
                    }}>
                        🇱🇰 THE ULTIMATE ERP FOR SRI LANKAN SMEs & MULTI-BUSINESS OWNERS
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3rem, 6vw, 5.5rem)', fontWeight: 800, lineHeight: 1.05,
                        marginBottom: 24, letterSpacing: '-0.04em'
                    }}>
                        Sole Proprietor to PVT LTD.<br />
                        <span className="text-gold">Scale Your Enterprise.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: '#94a3b8', maxWidth: 850, margin: '0 auto 40px',
                        lineHeight: 1.7, fontWeight: 400
                    }}>
                        Built perfectly for the ambitious Sri Lankan entrepreneur managing everything from small businesses to enterprise-level PVT LTD operations.
                        BizTracksy replaces your physical CR books and WhatsApp groups with a multi-company "God Mode" dashboard. Track specific inventory, automate 18% VAT workflows, and chase debtors seamlessly.
                    </p>

                    <button onClick={onGetStarted} className="gold-border" style={{
                        background: '#0f172a', color: '#fff', border: 'none',
                        padding: '18px 48px', fontSize: 18, fontWeight: 700, borderRadius: 12,
                        cursor: 'pointer', transition: 'all 0.3s ease',
                        display: 'inline-flex', alignItems: 'center', gap: 10
                    }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                        Start Free <span style={{ color: '#fbbf24' }}>→</span>
                    </button>
                    <div style={{ marginTop: 16, fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
                        <span>✓ No Credit Card Required</span>
                        <span>•</span>
                        <span>✓ 100% Tax Deductible</span>
                    </div>
                </div>
            </header>

            {/* Agitate & Solve Grid */}
            <section style={{ padding: '100px 2rem', background: '#09090b', position: 'relative' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 80 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, color: '#f8fafc' }}>The Engine Behind Your Empire</h2>
                        <p style={{ fontSize: 18, color: '#94a3b8', maxWidth: 700, margin: '0 auto' }}>Designed specifically to eliminate the chaos of managing multiple SME operations in Sri Lanka.</p>
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                        gap: 24
                    }}>
                        {features.map((f, i) => (
                            <div key={i} className="glass-card" style={{
                                padding: 40, borderRadius: 24, transition: 'all 0.3s ease'
                            }} onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)')}
                                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}>
                                <div style={{
                                    width: 64, height: 64, borderRadius: 16, background: 'rgba(245, 158, 11, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 32, marginBottom: 24, border: '1px solid rgba(245, 158, 11, 0.2)'
                                }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16, color: '#f8fafc', letterSpacing: '-0.02em' }}>{f.title}</h3>
                                <p style={{ fontSize: 15, lineHeight: 1.7, color: '#94a3b8' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Strategy - The 3 Corporate Tiers */}
            <section style={{ padding: '80px 2rem', background: '#0f172a', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16, color: '#f8fafc' }}>Scaling Corporate Tiers</h2>
                        <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 600, margin: '0 auto' }}>
                            Costs less than a tea-boy's salary, but does the work of a LKR 150,000/month accounting department. Grow at your own pace.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32 }}>

                        {/* Free Startup Plan */}
                        <div className="glass-card" style={{ padding: 40, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Free Launch</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: '-0.03em' }}>
                                0 LKR
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#94a3b8', fontSize: 15, lineHeight: 2, flex: 1 }}>
                                <li>✓ Perfect for Sole Proprietors</li>
                                <li>✓ 1 Company Setup</li>
                                <li>✓ 5 Basic Invoices /mo</li>
                                <li>✓ Basic Cash Book</li>
                            </ul>
                            <button onClick={onGetStarted} style={{
                                width: '100%', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600,
                                transition: 'all 0.2s'
                            }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
                                Start Free Version
                            </button>
                        </div>

                        {/* Basic Accounting Plan */}
                        <div className="glass-card" style={{ padding: 40, borderRadius: 24, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Small Business</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', marginBottom: 24, letterSpacing: '-0.03em' }}>
                                999 LKR <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 500 }}>/ mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#94a3b8', fontSize: 15, lineHeight: 2, flex: 1 }}>
                                <li><strong>✓ Ideal for Small Teams</strong></li>
                                <li>✓ Unlimited WhatsApp Invoicing</li>
                                <li>✓ Debtor Tracking</li>
                                <li>✓ 2 Staff Logins (Cashier/Manager)</li>
                            </ul>
                            <button onClick={onGetStarted} style={{
                                width: '100%', padding: '16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                                color: '#fff', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontWeight: 600,
                                transition: 'all 0.2s'
                            }} onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                                onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}>
                                Upgrade Basic
                            </button>
                        </div>

                        {/* Enterprise Plan */}
                        <div className="glass-card gold-border" style={{ padding: 40, borderRadius: 24, position: 'relative', transform: 'scale(1.02)', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ position: 'absolute', top: -12, right: 32, background: 'linear-gradient(135deg, #fbbf24, #d97706)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700, color: '#fff' }}>
                                BEST VALUE
                            </div>
                            <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8, color: '#f8fafc' }}>Enterprise PVT LTD</h3>
                            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24', marginBottom: 24, letterSpacing: '-0.03em' }}>
                                19,900 LKR <span style={{ fontSize: 16, color: '#94a3b8', fontWeight: 500 }}>/ mo</span>
                            </div>
                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', color: '#cbd5e1', fontSize: 15, lineHeight: 2, flex: 1 }}>
                                <li><strong>✓ Manage Multiple Companies</strong></li>
                                <li>✓ Unlimited Staff Logins</li>
                                <li>✓ Vision AI Bill Extractions</li>
                                <li>✓ 18% VAT & SSCL Auto-Calculated</li>
                                <li>✓ Priority Chat Support</li>
                            </ul>
                            <button onClick={onGetStarted} style={{
                                width: '100%', padding: '16px', borderRadius: 12, background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                                color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700,
                                transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(245, 158, 11, 0.3)'
                            }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                                onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                                Deploy Entire Suite
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '40px 2rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center', background: '#09090b', color: '#64748b', fontSize: 14
            }}>
                <div style={{ marginBottom: 16 }}>
                    Built for the Sri Lankan SME Economy. Designed & Engineered by <a href="https://safenetcreations.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fbbf24', textDecoration: 'none', fontWeight: 600 }}>SafeNet Creations</a>
                </div>
                <div>© {new Date().getFullYear()} BizTracksy Enterprise. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default BizTracksyLanding;
