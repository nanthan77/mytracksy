import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface CreatorLandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onBack: () => void;
}

const CreatorLandingPage: React.FC<CreatorLandingPageProps> = ({ onGetStarted, onLogin, onBack }) => {
    const [mounted, setMounted] = useState(false);
    const [navSolid, setNavSolid] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleScroll = () => setNavSolid(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: '💵',
            title: 'The USD Tax Shield',
            desc: 'Bringing AdSense USD into Sri Lanka without proper proof? You might get taxed at the maximum bracket. Log your foreign income in USD; we auto-convert it using CBSL rates and tag it for IRD "Service Export" tax exemptions.',
        },
        {
            icon: '🎥',
            title: 'The Brand Deal CRM & Invoicing',
            desc: 'Never forget a pending payment. Track every sponsorship from "Pitching" to "Paid." Generate 1-click professional PDF invoices with your TIN to send to local agencies. Stop using messy Word docs.',
        },
        {
            icon: '📸',
            title: 'The Gear Tax-Hack',
            desc: 'Bought a new LKR 1.2M MacBook or Sony A7IV? Log it in your Gear Vault. Our engine automatically calculates your legal IRD depreciation write-offs, saving you millions in taxes.',
        },
        {
            icon: '🏦',
            title: 'Bank-Ready Income Proof',
            desc: 'Getting rejected for a car lease because you don\'t have a corporate "payslip"? Generate official "Digital Creator Income Statements" to prove your wealth to banks and embassies.',
        }
    ];

    return (
        <div style={{
            minHeight: '100vh',
            fontFamily: "'Inter', -apple-system, sans-serif",
            background: '#09090b', // Zinc 950
            color: '#f4f4f5', // Zinc 100
            overflowX: 'hidden'
        }}>
            <Helmet>
                <title>MyTracksy Creator - Financial App for Sri Lankan Creators</title>
                <meta name="theme-color" content="#09090b" />
            </Helmet>

            <style>{`
                @keyframes pulse-glow {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 1; }
                }
                .glow-border {
                    box-shadow: 0 0 20px rgba(168, 85, 247, 0.4), inset 0 0 20px rgba(34, 211, 238, 0.2);
                    border: 1px solid rgba(168, 85, 247, 0.5);
                }
                .text-gradient {
                    background: linear-gradient(135deg, #c084fc, #22d3ee);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .hero-bg {
                    background-image: url('/assets/healthcare/creator_hero_bg.png');
                    background-size: cover;
                    background-position: center;
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
                background: navSolid ? 'rgba(9, 9, 11, 0.9)' : 'transparent',
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
                        <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 24 }}>🎥</span> MyTracksy <span className="text-gradient">Creator</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
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
            <header className="hero-bg" style={{
                position: 'relative', paddingTop: 160, paddingBottom: 100,
                minHeight: '90vh', display: 'flex', alignItems: 'center'
            }}>
                {/* Dark Overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to bottom, rgba(9,9,11,0.7) 0%, #09090b 100%)',
                    zIndex: 0
                }} />

                {/* Purple Glow Element */}
                <div style={{
                    position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%, -50%)',
                    width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)',
                    zIndex: 0, filter: 'blur(50px)', animation: 'pulse-glow 6s infinite ease-in-out'
                }} />

                <div style={{
                    maxWidth: 1200, margin: '0 auto', padding: '0 2rem', position: 'relative', zIndex: 1,
                    textAlign: 'center',
                    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                    transition: 'all 0.8s ease'
                }}>
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        background: 'rgba(168, 85, 247, 0.1)', color: '#d8b4fe',
                        padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 600,
                        border: '1px solid rgba(168, 85, 247, 0.3)', marginBottom: 24,
                        letterSpacing: '0.05em'
                    }}>
                        🇱🇰 THE #1 FINANCIAL APP FOR SRI LANKAN CREATORS
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(3rem, 6vw, 5rem)', fontWeight: 800, lineHeight: 1.1,
                        marginBottom: 24, letterSpacing: '-0.03em'
                    }}>
                        You Mastered the Algorithm.<br />
                        <span className="text-gradient">Let AI Master Your Taxes.</span>
                    </h1>

                    <p style={{
                        fontSize: 'clamp(1.1rem, 2vw, 1.25rem)', color: '#a1a1aa', maxWidth: 800, margin: '0 auto 40px',
                        lineHeight: 1.6, fontWeight: 400
                    }}>
                        The ultimate financial and tax super-app for Sri Lankan YouTubers, Influencers, and Freelancers. Stop stressing about IRD audits, chasing late brand payments, and tracking USD exchange rates. Manage your brand deals, automate your tax write-offs for expensive camera gear, and generate PR-agency-ready invoices in seconds.
                    </p>

                    <button onClick={onGetStarted} className="glow-border" style={{
                        background: '#18181b', color: '#fff', border: 'none',
                        padding: '16px 48px', fontSize: 18, fontWeight: 700, borderRadius: 12,
                        cursor: 'pointer', transition: 'all 0.3s ease',
                        display: 'inline-flex', alignItems: 'center', gap: 10
                    }} onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                        onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}>
                        Start 14-Day Free Trial <span style={{ color: '#22d3ee' }}>→</span>
                    </button>
                    <div style={{ marginTop: 16, fontSize: 13, color: '#71717a' }}>
                        No credit card required. Cancel anytime.
                    </div>
                </div>
            </header>

            {/* Agitate & Solve Grid */}
            <section style={{ padding: '100px 2rem', background: '#09090b', position: 'relative' }}>
                <div style={{ maxWidth: 1200, margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: 60 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 16 }}>Built for the Creator Economy</h2>
                        <p style={{ fontSize: 18, color: '#a1a1aa' }}>Solve the massive financial hurdles unique to digital creators in Sri Lanka.</p>
                    </div>

                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                        gap: 24
                    }}>
                        {features.map((f, i) => (
                            <div key={i} className="glass-card" style={{
                                padding: 32, borderRadius: 24, transition: 'all 0.3s ease'
                            }} onMouseOver={e => (e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.4)')}
                                onMouseOut={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}>
                                <div style={{
                                    width: 56, height: 56, borderRadius: 16, background: 'rgba(34, 211, 238, 0.1)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 28, marginBottom: 24, border: '1px solid rgba(34, 211, 238, 0.2)'
                                }}>
                                    {f.icon}
                                </div>
                                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#f4f4f5' }}>{f.title}</h3>
                                <p style={{ fontSize: 15, lineHeight: 1.6, color: '#a1a1aa' }}>{f.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing Hook */}
            <section style={{ padding: '80px 2rem', background: '#09090b' }}>
                <div style={{
                    maxWidth: 800, margin: '0 auto', background: 'linear-gradient(135deg, rgba(24,24,27,0.8), rgba(9,9,11,0.9))',
                    borderRadius: 32, padding: '60px 40px', textAlign: 'center',
                    border: '1px solid rgba(168, 85, 247, 0.3)', position: 'relative', overflow: 'hidden'
                }} className="glow-border">
                    <div style={{
                        position: 'absolute', top: 0, right: 0, width: 300, height: 300,
                        background: 'radial-gradient(circle, rgba(34,211,238,0.1) 0%, transparent 70%)',
                        filter: 'blur(40px)', zIndex: 0
                    }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8, color: '#fff' }}>Pro Creator Plan</h2>
                        <div style={{ fontSize: '3rem', fontWeight: 900, color: '#22d3ee', margin: '24px 0', letterSpacing: '-0.03em' }}>
                            LKR 2,900 <span style={{ fontSize: 18, fontWeight: 500, color: '#71717a' }}>/ month</span>
                        </div>
                        <p style={{ fontSize: 16, color: '#a1a1aa', lineHeight: 1.6, marginBottom: 32 }}>
                            <strong style={{ color: '#d8b4fe' }}>100% Tax Deductible.</strong> Your subscription is a legally recognized business expense for digital entrepreneurs. The app literally pays for itself in IRD tax savings.
                        </p>
                        <button onClick={onGetStarted} style={{
                            background: 'linear-gradient(135deg, #a855f7, #06b6d4)', color: '#fff',
                            border: 'none', padding: '16px 40px', fontSize: 16, fontWeight: 700,
                            borderRadius: 12, cursor: 'pointer', transition: 'opacity 0.2s', width: '100%', maxWidth: 300
                        }} onMouseOver={e => (e.currentTarget.style.opacity = '0.9')}
                            onMouseOut={e => (e.currentTarget.style.opacity = '1')}>
                            Get Started Now
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                padding: '40px 2rem', borderTop: '1px solid rgba(255,255,255,0.05)',
                textAlign: 'center', background: '#09090b', color: '#71717a', fontSize: 14
            }}>
                <div style={{ marginBottom: 16 }}>
                    Designed & Engineered by <a href="https://safenetcreations.com" target="_blank" rel="noopener noreferrer" style={{ color: '#c084fc', textDecoration: 'none', fontWeight: 500 }}>SafeNet Creations</a>
                </div>
                <div>© {new Date().getFullYear()} MyTracksy Creator. All rights reserved.</div>
            </footer>
        </div>
    );
};

export default CreatorLandingPage;
