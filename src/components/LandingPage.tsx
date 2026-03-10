import React, { useState, useEffect } from 'react';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const professions = [
        { icon: '🩺', name: 'Medical', color: '#0ea5e9' },
        { icon: '⚖️', name: 'Legal', color: '#6366f1' },
        { icon: '📈', name: 'Business', color: '#059669' },
        { icon: '⚙️', name: 'Engineering', color: '#ea580c' },
        { icon: '📊', name: 'Trading', color: '#3b82f6' },
        { icon: '🚗', name: 'Automotive', color: '#dc2626' },
        { icon: '📢', name: 'Marketing', color: '#7c3aed' },
        { icon: '✈️', name: 'Travel', color: '#1e40af' },
        { icon: '🚛', name: 'Transport', color: '#ea580c' },
        { icon: '🛒', name: 'Retail', color: '#0d9488' },
        { icon: '🐟', name: 'Aquaculture', color: '#0891b2' },
        { icon: '👤', name: 'Individual', color: '#7c3aed' },
    ];

    const features = [
        { icon: '🇱🇰', title: 'Sri Lankan Tax Compliance', desc: 'Built-in EPF/ETF, APIT, VAT & withholding tax compliance. Automated government portal integrations.' },
        { icon: '🏛️', title: 'Government Integration', desc: 'Direct integration with IRD, CBSL, and regulatory bodies. Stay compliant automatically.' },
        { icon: '📊', title: 'Powerful Insights', desc: 'Real-time analytics, revenue forecasting, and AI-powered financial intelligence for smarter decisions.' },
        { icon: '📱', title: 'Mobile-First Design', desc: 'Manage your finances anywhere. Optimized for every device — desktop, tablet, and mobile.' },
        { icon: '👥', title: 'Multi-User Enterprise', desc: 'Collaborate with your team. Role-based access, multi-entity, and branch management.' },
        { icon: '🔒', title: 'Enterprise Security', desc: '256-bit encryption, SOC2 compliance, and GDPR-ready. Your data is always secure.' },
    ];

    const plans = [
        {
            name: 'Starter', price: 'Free', period: 'forever', desc: 'Perfect for getting started', color: '#6366f1',
            features: ['5 transactions/month', 'Basic reports', '1 profession', 'Mobile access', 'Email support']
        },
        {
            name: 'Personal Pro', price: 'LKR 390', period: '/month', desc: 'Everything for your personal finances', color: '#8b5cf6', popular: true,
            features: ['Unlimited transactions', 'Advanced analytics', 'All professions', 'Tax reports', 'Priority support', 'Data export', 'Multi-currency']
        },
        {
            name: 'Business', price: 'LKR 1,200', period: '/month', desc: 'Built for teams & businesses', color: '#059669',
            features: ['Everything in Pro', 'Multi-user access', 'Custom branding', 'API access', 'Dedicated manager', 'SLA guarantee', 'Onboarding support']
        },
    ];

    const stats = [
        { value: '10,000+', label: 'Professionals' },
        { value: '12', label: 'Professions' },
        { value: '99.9%', label: 'Uptime' },
        { value: 'LKR 2B+', label: 'Tracked' },
    ];

    return (
        <>
            <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-15px); } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        .landing-btn { padding: 14px 32px; border: none; border-radius: 10px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; font-family: 'Inter', sans-serif; letter-spacing: -0.01em; }
        .landing-btn:active { transform: scale(0.97); }
        .landing-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.35); }
        .landing-btn-primary:hover { box-shadow: 0 8px 30px rgba(99,102,241,0.45); transform: translateY(-2px); }
        .landing-btn-outline { background: transparent; color: white; border: 1.5px solid rgba(255,255,255,0.25); }
        .landing-btn-outline:hover { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.4); }
        .landing-btn-dark { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 4px 15px rgba(99,102,241,0.35); }
        .landing-btn-dark:hover { box-shadow: 0 8px 25px rgba(99,102,241,0.45); transform: translateY(-2px); }
        .feature-card { background: white; border-radius: 16px; padding: 2rem; border: 1px solid #f1f5f9; transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); border-color: rgba(99,102,241,0.2); }
        .price-card { background: white; border-radius: 20px; padding: 2rem; border: 1px solid #e2e8f0; transition: all 0.3s ease; position: relative; overflow: hidden; }
        .price-card:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.08); }
        .price-card.popular { border: 2px solid #8b5cf6; box-shadow: 0 20px 40px rgba(139,92,246,0.15); }
        .nav-link { color: rgba(255,255,255,0.65); font-size: 14px; font-weight: 450; text-decoration: none; padding: 6px 14px; border-radius: 8px; transition: all 0.2s ease; cursor: pointer; background: none; border: none; font-family: 'Inter', sans-serif; }
        .nav-link:hover { color: white; background: rgba(255,255,255,0.08); }
        .profession-pill { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); transition: all 0.3s ease; }
        .profession-pill:hover { background: rgba(255,255,255,0.12); transform: translateY(-2px); }
      `}</style>

            <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", color: '#0f172a' }}>

                {/* ============ NAVBAR ============ */}
                <nav style={{
                    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, padding: '16px 0',
                    background: 'rgba(15,12,41,0.85)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                                width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
                            }}>💰</div>
                            <span style={{ fontSize: 18, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>MyTracksy</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="nav-link" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
                            <button className="nav-link" onClick={() => document.getElementById('professions')?.scrollIntoView({ behavior: 'smooth' })}>Professions</button>
                            <button className="nav-link" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Pricing</button>
                            <button className="nav-link" onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>Contact</button>
                            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.12)', margin: '0 8px' }} />
                            <button onClick={onLogin} className="nav-link" style={{ fontWeight: 500 }}>Log in</button>
                            <button onClick={onGetStarted} className="landing-btn landing-btn-primary" style={{ padding: '9px 20px', fontSize: 13 }}>Get Started Free</button>
                        </div>
                    </div>
                </nav>

                {/* ============ HERO ============ */}
                <section style={{
                    minHeight: '100vh', display: 'flex', alignItems: 'center', position: 'relative', overflow: 'hidden',
                    background: 'linear-gradient(135deg, #0f0c29 0%, #1a1145 30%, #302b63 60%, #0f172a 100%)',
                    paddingTop: 80,
                }}>
                    {/* Orbs */}
                    {[
                        { w: 500, h: 500, t: '-10%', l: '-5%', bg: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', d: '8s' },
                        { w: 400, h: 400, t: '50%', l: '65%', bg: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', d: '12s' },
                        { w: 300, h: 300, t: '20%', l: '85%', bg: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)', d: '10s' },
                    ].map((o, i) => (
                        <div key={i} style={{
                            position: 'absolute', width: o.w, height: o.h, top: o.t, left: o.l,
                            background: o.bg, borderRadius: '50%', filter: 'blur(80px)',
                            animation: `float ${o.d} ease-in-out infinite`, pointerEvents: 'none',
                        }} />
                    ))}
                    {/* Grid overlay */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative', zIndex: 2, width: '100%' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                            {/* Left */}
                            <div style={{
                                opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
                            }}>
                                <div style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
                                    borderRadius: 20, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
                                    marginBottom: 24, fontSize: 13, color: '#a5b4fc', fontWeight: 500,
                                }}>
                                    🇱🇰 Built for Sri Lanka
                                </div>
                                <h1 style={{
                                    fontSize: '3.5rem', fontWeight: 800, color: 'white', lineHeight: 1.1,
                                    letterSpacing: '-0.04em', marginBottom: 20,
                                }}>
                                    Sri Lankan<br />
                                    <span style={{
                                        background: 'linear-gradient(135deg, #a5b4fc, #c084fc, #f0abfc)',
                                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                    }}>Financial Intelligence</span><br />Platform
                                </h1>
                                <p style={{
                                    fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
                                    maxWidth: 480, marginBottom: 32, fontWeight: 400,
                                }}>
                                    Control your income, expenses, government portal integrations, and grow your business. Built for Sri Lankan professionals and businesses.
                                </p>
                                <div style={{ display: 'flex', gap: 12, marginBottom: 40 }}>
                                    <button onClick={onGetStarted} className="landing-btn landing-btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
                                        Get Started Free →
                                    </button>
                                    <button onClick={onLogin} className="landing-btn landing-btn-outline">
                                        Watch Demo
                                    </button>
                                </div>
                                {/* Stats */}
                                <div style={{ display: 'flex', gap: 32 }}>
                                    {stats.map(s => (
                                        <div key={s.label}>
                                            <div style={{ fontSize: 22, fontWeight: 700, color: 'white' }}>{s.value}</div>
                                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right — Dashboard preview mockup */}
                            <div style={{
                                opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 1s cubic-bezier(0.16,1,0.3,1) 0.2s',
                            }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.03)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.08)',
                                    padding: 20, backdropFilter: 'blur(12px)',
                                    boxShadow: '0 40px 80px rgba(0,0,0,0.3)',
                                    animation: 'float 6s ease-in-out infinite',
                                }}>
                                    {/* Mini dashboard mockup */}
                                    <div style={{ background: '#0f172a', borderRadius: 14, padding: 16, marginBottom: 12 }}>
                                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                            {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {[
                                                { label: 'Revenue', value: 'LKR 2.4M', icon: '📈', c: '#22c55e' },
                                                { label: 'Expenses', value: 'LKR 1.8M', icon: '📉', c: '#ef4444' },
                                                { label: 'Profit', value: 'LKR 620K', icon: '💰', c: '#8b5cf6' },
                                                { label: 'Clients', value: '47', icon: '👥', c: '#3b82f6' },
                                            ].map(kpi => (
                                                <div key={kpi.label} style={{
                                                    background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                }}>
                                                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 4 }}>{kpi.icon} {kpi.label}</div>
                                                    <div style={{ fontSize: 18, fontWeight: 700, color: kpi.c }}>{kpi.value}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Mini chart bars */}
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 60, padding: '0 8px' }}>
                                        {[45, 65, 35, 80, 55, 90, 70, 60, 85, 45, 75, 65].map((h, i) => (
                                            <div key={i} style={{
                                                flex: 1, height: `${h}%`, borderRadius: 4,
                                                background: `linear-gradient(180deg, rgba(99,102,241,${0.5 + h / 200}), rgba(139,92,246,${0.3 + h / 200}))`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============ PROFESSIONS STRIP ============ */}
                <section id="professions" style={{ background: '#f8fafc', padding: '48px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                        <p style={{ textAlign: 'center', fontSize: 14, color: '#94a3b8', fontWeight: 500, marginBottom: 20, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            Tailored for 12 professions
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 10 }}>
                            {professions.map(p => (
                                <span key={p.name} className="profession-pill" style={{ color: p.color, background: `${p.color}0A`, borderColor: `${p.color}20` }}>
                                    <span>{p.icon}</span> {p.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ FEATURES ============ */}
                <section id="features" style={{ padding: '80px 0', background: 'white' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
                                Why Choose MyTracksy?
                            </h2>
                            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 550, margin: '0 auto', lineHeight: 1.6 }}>
                                Complete financial management and tax compliance built for Sri Lankan professionals and businesses
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                            {features.map(f => (
                                <div key={f.title} className="feature-card">
                                    <div style={{ fontSize: '2rem', marginBottom: 16 }}>{f.icon}</div>
                                    <h3 style={{ fontSize: 17, fontWeight: 650, marginBottom: 8, letterSpacing: '-0.01em' }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ PRICING ============ */}
                <section id="pricing" style={{ padding: '80px 0', background: '#f8fafc' }}>
                    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
                        <div style={{ textAlign: 'center', marginBottom: 56 }}>
                            <h2 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
                                Simple, Transparent Pricing
                            </h2>
                            <p style={{ fontSize: 16, color: '#64748b', maxWidth: 500, margin: '0 auto' }}>
                                Start free. Upgrade when you need more power.
                            </p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                            {plans.map(plan => (
                                <div key={plan.name} className={`price-card ${plan.popular ? 'popular' : ''}`}>
                                    {plan.popular && (
                                        <div style={{
                                            position: 'absolute', top: -1, left: 0, right: 0, height: 3,
                                            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                                        }} />
                                    )}
                                    {plan.popular && (
                                        <span style={{
                                            display: 'inline-block', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            color: 'white', fontSize: 11, fontWeight: 600, padding: '3px 12px', borderRadius: 6, marginBottom: 16,
                                        }}>Most Popular</span>
                                    )}
                                    <div style={{ fontSize: 13, fontWeight: 600, color: plan.color, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                        {plan.name}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                                        <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.price}</span>
                                        <span style={{ fontSize: 14, color: '#94a3b8' }}>{plan.period}</span>
                                    </div>
                                    <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>{plan.desc}</p>
                                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                                        {plan.features.map(f => (
                                            <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 14, color: '#475569' }}>
                                                <span style={{ color: '#22c55e', fontSize: 14, fontWeight: 700 }}>✓</span> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button onClick={onGetStarted} className="landing-btn" style={{
                                        width: '100%', padding: '12px',
                                        background: plan.popular ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : '#f1f5f9',
                                        color: plan.popular ? 'white' : '#475569',
                                        boxShadow: plan.popular ? '0 4px 12px rgba(99,102,241,0.3)' : 'none',
                                    }}>
                                        {plan.price === 'Free' ? 'Start Free' : 'Start Free Trial'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ============ CTA ============ */}
                <section style={{
                    padding: '80px 0',
                    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                    textAlign: 'center', position: 'relative', overflow: 'hidden',
                }}>
                    <div style={{
                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
                        width: 600, height: 600, borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                        filter: 'blur(80px)', pointerEvents: 'none',
                    }} />
                    <div style={{ position: 'relative', zIndex: 2, maxWidth: 600, margin: '0 auto', padding: '0 24px' }}>
                        <h2 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', marginBottom: 16 }}>
                            Ready to Transform Your Financial Management?
                        </h2>
                        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', marginBottom: 32, lineHeight: 1.6 }}>
                            Join thousands of Sri Lankan professionals who manage their finances smarter with MyTracksy.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={onGetStarted} className="landing-btn landing-btn-primary" style={{ fontSize: 16, padding: '16px 36px' }}>
                                Start Free Trial →
                            </button>
                            <button onClick={onLogin} className="landing-btn landing-btn-outline">
                                Contact Sales
                            </button>
                        </div>
                    </div>
                </section>

                {/* ============ FOOTER ============ */}
                <footer id="contact" style={{ background: '#0f172a', padding: '48px 0 28px', color: 'rgba(255,255,255,0.5)' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 32, marginBottom: 40 }}>
                            {/* Brand */}
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>💰</div>
                                    <span style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>MyTracksy</span>
                                </div>
                                <p style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 280 }}>
                                    Professional finance management platform built exclusively for Sri Lankan professionals and businesses.
                                </p>
                            </div>
                            {/* Links */}
                            {[
                                { title: 'Product', links: ['Features', 'Pricing', 'Integrations', 'API'] },
                                { title: 'Company', links: ['About', 'Careers', 'Blog', 'Press'] },
                                { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'Webinars'] },
                                { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'GDPR'] },
                            ].map(col => (
                                <div key={col.title}>
                                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 14, letterSpacing: '0.02em' }}>{col.title}</div>
                                    {col.links.map(l => (
                                        <div key={l} style={{ fontSize: 13, marginBottom: 8, cursor: 'pointer', transition: 'color 0.2s' }}>{l}</div>
                                    ))}
                                </div>
                            ))}
                        </div>
                        {/* Bottom */}
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 12 }}>© 2026 MyTracksy. All rights reserved.</span>
                            <span style={{ fontSize: 12 }}>
                                Architected by{' '}
                                <a href="https://safenetcreations.com/" target="_blank" rel="noopener noreferrer" style={{ color: '#a5b4fc', textDecoration: 'none', fontWeight: 500, transition: 'color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.color = '#c084fc')} onMouseLeave={e => (e.currentTarget.style.color = '#a5b4fc')}>
                                    SafeNet Creations
                                </a>
                            </span>
                            <span style={{ fontSize: 12 }}>🇱🇰 Proudly built in Sri Lanka</span>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
};

export default LandingPage;
