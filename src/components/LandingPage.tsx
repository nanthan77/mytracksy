import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ProfessionType } from '../contexts/AuthContext';

interface LandingPageProps {
    onGetStarted: () => void;
    onLogin: () => void;
    onDemoProfession: (profession: ProfessionType) => void;
    onProfessionPage?: (slug: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin, onDemoProfession, onProfessionPage }) => {
    const [mounted, setMounted] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const [scrollY, setScrollY] = useState(0);
    const [navSolid, setNavSolid] = useState(false);

    // Scroll-triggered animations
    useEffect(() => {
        setMounted(true);
        const handleScroll = () => {
            setScrollY(window.scrollY);
            setNavSolid(window.scrollY > 60);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // IntersectionObserver for scroll reveals
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

    // Animated counter hook
    const AnimatedNumber: React.FC<{ value: string; suffix?: string }> = ({ value, suffix }) => {
        const [display, setDisplay] = useState('0');
        const ref = useRef<HTMLDivElement>(null);
        useEffect(() => {
            const num = parseInt(value);
            if (isNaN(num)) { setDisplay(value); return; }
            const observer = new IntersectionObserver(([entry]) => {
                if (entry.isIntersecting) {
                    let start = 0;
                    const duration = 1800;
                    const step = (ts: number) => {
                        if (!start) start = ts;
                        const progress = Math.min((ts - start) / duration, 1);
                        const eased = 1 - Math.pow(1 - progress, 4);
                        setDisplay(Math.floor(eased * num).toString());
                        if (progress < 1) requestAnimationFrame(step);
                    };
                    requestAnimationFrame(step);
                    observer.disconnect();
                }
            }, { threshold: 0.5 });
            if (ref.current) observer.observe(ref.current);
            return () => observer.disconnect();
        }, [value]);
        return <div ref={ref}>{display}{suffix}</div>;
    };

    const professions: { icon: string; name: string; color: string; gradient: string; type: ProfessionType; slug: string; tagline: string }[] = [
        { icon: '🩺', name: 'Doctors', color: '#0ea5e9', gradient: 'linear-gradient(135deg,#0ea5e9,#0284c7)', type: 'medical', slug: 'dr', tagline: 'Practice management made simple' },
        { icon: '⚖️', name: 'Lawyers', color: '#6366f1', gradient: 'linear-gradient(135deg,#6366f1,#4f46e5)', type: 'legal', slug: 'lawyer', tagline: 'Case & billing at your fingertips' },
        { icon: '💼', name: 'Business', color: '#10b981', gradient: 'linear-gradient(135deg,#10b981,#059669)', type: 'business', slug: 'biz', tagline: 'Multi-entity financial control' },
        { icon: '⚙️', name: 'Engineers', color: '#f59e0b', gradient: 'linear-gradient(135deg,#f59e0b,#d97706)', type: 'engineering', slug: 'engineer', tagline: 'Projects & budgets on track' },
        { icon: '📈', name: 'Traders', color: '#ef4444', gradient: 'linear-gradient(135deg,#ef4444,#dc2626)', type: 'trading', slug: 'trader', tagline: 'Buy/sell & margins in real-time' },
        { icon: '🚗', name: 'Automotive', color: '#64748b', gradient: 'linear-gradient(135deg,#64748b,#475569)', type: 'automotive', slug: 'auto', tagline: 'Workshop jobs & parts billing' },
        { icon: '📣', name: 'Marketing', color: '#ec4899', gradient: 'linear-gradient(135deg,#ec4899,#db2777)', type: 'marketing', slug: 'marketing', tagline: 'Campaigns & ROI tracking' },
        { icon: '✈️', name: 'Travel', color: '#06b6d4', gradient: 'linear-gradient(135deg,#06b6d4,#0891b2)', type: 'travel', slug: 'travel', tagline: 'Bookings & commission control' },
        { icon: '🚚', name: 'Transport', color: '#d97706', gradient: 'linear-gradient(135deg,#d97706,#b45309)', type: 'transportation', slug: 'transport', tagline: 'Fleet, fuel & driver logs' },
        { icon: '🏪', name: 'Retail', color: '#16a34a', gradient: 'linear-gradient(135deg,#16a34a,#15803d)', type: 'retail', slug: 'retail', tagline: 'POS, inventory & suppliers' },
        { icon: '🐟', name: 'Aquaculture', color: '#0284c7', gradient: 'linear-gradient(135deg,#0284c7,#0369a1)', type: 'aquaculture', slug: 'aqua', tagline: 'Pond, harvest & feed tracking' },
        { icon: '👤', name: 'Personal', color: '#8b5cf6', gradient: 'linear-gradient(135deg,#8b5cf6,#7c3aed)', type: 'individual', slug: 'personal', tagline: 'Your money, your goals' },
    ];

    const commonSections = [
        { icon: '📊', title: 'Accounting & Tax', desc: 'Automated bookkeeping, EPF/ETF, APIT, VAT & withholding tax compliance. Government portal integration built in.', color: '#6366f1' },
        { icon: '📣', title: 'Marketing & Sales', desc: 'Track campaign ROI, client acquisition costs, and sales pipeline. Built-in CRM for every profession.', color: '#ec4899' },
        { icon: '🔍', title: 'SEO & AEO Ready', desc: 'Your digital presence matters. Built-in SEO tools, Google Business integration, and AI-powered answer engine optimization.', color: '#f59e0b' },
        { icon: '🛡️', title: 'Data Lives On Your Device', desc: 'Compliant with Sri Lankan government regulations. Zero server-side data storage — your personal & financial data never leaves your device.', color: '#10b981' },
        { icon: '🤖', title: 'AI-Powered Insights', desc: 'Smart categorization, predictive analytics, voice commands in Sinhala, Tamil & English. Your AI financial assistant.', color: '#0ea5e9' },
        { icon: '🏛️', title: 'Government Compliant', desc: 'Built to meet Sri Lankan Personal Data Protection Act (PDPA) standards. IRD, CBSL, and regulatory body integration ready.', color: '#8b5cf6' },
    ];

    const faqItems = [
        { q: 'Is MyTracksy really free to start?', a: 'Yes! Every profession gets a free tier with essential features. No credit card required. Sign up with your Google account and start immediately.' },
        { q: 'Where is my data stored?', a: 'Your data stays 100% on your device. We follow Sri Lankan government data protection regulations — no personal or financial data is stored on our servers. You own your data completely.' },
        { q: 'Which professions are supported?', a: 'We support 12 professions: Doctors, Lawyers, Engineers, Business owners, Traders, Automotive workshops, Marketing agencies, Travel agencies, Transport/Fleet, Retail shops, Aquaculture farms, and Personal finance.' },
        { q: 'Can I upgrade or downgrade anytime?', a: 'Absolutely. Switch between plans instantly. No lock-in contracts, no cancellation fees. Your data stays safe regardless of your plan.' },
        { q: 'Is it compliant with Sri Lankan tax laws?', a: 'Yes. MyTracksy includes built-in EPF/ETF, APIT, VAT, and withholding tax calculations. We integrate with IRD and other government portals for seamless compliance.' },
        { q: 'Does it work offline?', a: 'Yes! MyTracksy is a PWA (Progressive Web App) that works fully offline. Your data syncs automatically when you reconnect — perfect for areas with limited connectivity.' },
    ];

    const handleProfessionClick = (slug: string) => {
        if (onProfessionPage) { onProfessionPage(slug); } else { window.location.href = `/${slug}`; }
    };

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                *{box-sizing:border-box;margin:0;padding:0;}
                @keyframes fadeUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
                @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
                @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-15px)}}
                @keyframes orbMove1{0%{transform:translate(0,0) scale(1)}33%{transform:translate(60px,-80px) scale(1.15)}66%{transform:translate(-40px,40px) scale(0.9)}100%{transform:translate(0,0) scale(1)}}
                @keyframes orbMove2{0%{transform:translate(0,0) scale(1)}33%{transform:translate(-50px,60px) scale(1.1)}66%{transform:translate(30px,-50px) scale(0.95)}100%{transform:translate(0,0) scale(1)}}
                @keyframes orbMove3{0%{transform:translate(0,0) scale(1)}50%{transform:translate(40px,30px) scale(1.08)}100%{transform:translate(0,0) scale(1)}}
                @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
                @keyframes scaleIn{from{opacity:0;transform:scale(0.85)}to{opacity:1;transform:scale(1)}}
                @keyframes slideInLeft{from{opacity:0;transform:translateX(-40px)}to{opacity:1;transform:translateX(0)}}
                @keyframes borderRotate{0%{--angle:0deg}100%{--angle:360deg}}
                @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.15)}50%{box-shadow:0 0 40px rgba(99,102,241,0.3)}}
                .lt-c{font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0f172a;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale}
                .lt-s{padding:100px 24px}
                .lt-i{max-width:1200px;margin:0 auto}
                .sr{opacity:0;transform:translateY(40px);transition:opacity .8s cubic-bezier(0.16,1,0.3,1),transform .8s cubic-bezier(0.16,1,0.3,1)}
                .lt-btn{padding:14px 32px;border:none;border-radius:14px;font-size:15px;font-weight:600;cursor:pointer;transition:all .4s cubic-bezier(0.16,1,0.3,1);font-family:inherit;letter-spacing:-0.01em;display:inline-flex;align-items:center;gap:8px;position:relative;overflow:hidden}
                .lt-btn:hover{transform:translateY(-3px)}
                .lt-btn:active{transform:scale(0.97)}
                .lt-btn-p{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 4px 20px rgba(99,102,241,0.35),0 1px 3px rgba(0,0,0,0.1)}
                .lt-btn-p:hover{box-shadow:0 12px 40px rgba(99,102,241,0.45),0 4px 12px rgba(0,0,0,0.1)}
                .lt-btn-p::after{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.2),transparent);opacity:0;transition:opacity .3s}
                .lt-btn-p:hover::after{opacity:1}
                .lt-btn-o{background:transparent;color:#6366f1;border:2px solid rgba(99,102,241,0.2);backdrop-filter:blur(8px)}
                .lt-btn-o:hover{border-color:#6366f1;background:rgba(99,102,241,0.04);box-shadow:0 8px 25px rgba(99,102,241,0.1)}
                .lt-h{font-weight:800;letter-spacing:-0.04em;line-height:1.05}
                .lt-sub{color:#64748b;font-size:18px;line-height:1.75;max-width:580px;font-weight:400}
                .lt-badge{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:50px;font-size:12px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase}
                .lt-nav{position:fixed;top:0;left:0;right:0;z-index:1000;padding:16px 0;transition:all .4s cubic-bezier(0.16,1,0.3,1)}
                .lt-nav-s{background:rgba(255,255,255,0.85);backdrop-filter:blur(24px) saturate(180%);-webkit-backdrop-filter:blur(24px) saturate(180%);border-bottom:1px solid rgba(0,0,0,0.04);box-shadow:0 1px 20px rgba(0,0,0,0.03)}
                .lt-nl{color:#475569;font-size:14px;font-weight:500;text-decoration:none;padding:8px 16px;border-radius:10px;transition:all .25s;cursor:pointer;background:none;border:none;font-family:inherit}
                .lt-nl:hover{color:#0f172a;background:rgba(99,102,241,0.06)}
                .lt-tile{background:rgba(255,255,255,0.8);backdrop-filter:blur(12px);border-radius:22px;padding:30px 24px;border:1px solid rgba(255,255,255,0.6);cursor:pointer;transition:all .5s cubic-bezier(0.16,1,0.3,1);text-align:center;position:relative;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04),0 4px 12px rgba(0,0,0,0.02)}
                .lt-tile:hover{transform:translateY(-10px) scale(1.02);box-shadow:0 25px 60px rgba(0,0,0,0.1),0 8px 20px rgba(0,0,0,0.04);border-color:rgba(99,102,241,0.2)}
                .lt-tile:hover .lt-tile-bar{opacity:1}
                .lt-tile:hover .lt-tile-icon{transform:scale(1.12)}
                .lt-tile:hover .lt-tile-arrow{opacity:1;transform:translateX(0)}
                .lt-tile-bar{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .4s}
                .lt-tile-icon{transition:transform .4s cubic-bezier(0.16,1,0.3,1)}
                .lt-tile-arrow{opacity:0;transform:translateX(-8px);transition:all .3s ease;font-size:13px;font-weight:600}
                .lt-fc{background:rgba(255,255,255,0.7);backdrop-filter:blur(12px);border-radius:22px;padding:36px 32px;border:1px solid rgba(255,255,255,0.5);transition:all .4s cubic-bezier(0.16,1,0.3,1);box-shadow:0 1px 3px rgba(0,0,0,0.03)}
                .lt-fc:hover{transform:translateY(-6px);box-shadow:0 20px 50px rgba(0,0,0,0.08);border-color:rgba(99,102,241,0.15)}
                .lt-faq{border:1px solid rgba(0,0,0,0.06);border-radius:18px;overflow:hidden;transition:all .3s;background:rgba(255,255,255,0.8);backdrop-filter:blur(8px)}
                .lt-faq:hover{border-color:rgba(99,102,241,0.15);box-shadow:0 4px 20px rgba(0,0,0,0.04)}
                .lt-faq-q{padding:22px 24px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;font-weight:600;font-size:15px;background:none;border:none;width:100%;text-align:left;font-family:inherit;color:#0f172a;letter-spacing:-0.01em}
                .lt-faq-a{padding:0 24px 22px;color:#64748b;font-size:14px;line-height:1.8}
                @media(max-width:768px){
                    .lt-hero-g{grid-template-columns:1fr!important;text-align:center}
                    .lt-prof-g{grid-template-columns:1fr 1fr!important}
                    .lt-feat-g{grid-template-columns:1fr!important}
                    .lt-sec-g{grid-template-columns:1fr!important}
                    .lt-nav-lk{display:none!important}
                    .lt-hero-t{font-size:2.6rem!important}
                    .lt-stats{grid-template-columns:1fr 1fr!important}
                    .lt-hero-phone{display:none!important}
                }
            `}</style>

            <div className="lt-c">
                {/* ===== NAVBAR ===== */}
                <nav className={`lt-nav ${navSolid ? 'lt-nav-s' : ''}`} style={{ background: navSolid ? undefined : 'transparent' }}>
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>💰</div>
                            <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.04em' }}>MyTracksy</span>
                        </div>
                        <div className="lt-nav-lk" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <button className="lt-nl" onClick={() => document.getElementById('professions')?.scrollIntoView({ behavior: 'smooth' })}>Professions</button>
                            <button className="lt-nl" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>Features</button>
                            <button className="lt-nl" onClick={() => document.getElementById('security')?.scrollIntoView({ behavior: 'smooth' })}>Security</button>
                            <button className="lt-nl" onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>FAQ</button>
                            <div style={{ width: 1, height: 22, background: '#e2e8f0', margin: '0 12px' }} />
                            <button onClick={onLogin} className="lt-nl" style={{ fontWeight: 600, color: '#6366f1' }}>Log in</button>
                            <button onClick={onGetStarted} className="lt-btn lt-btn-p" style={{ padding: '10px 24px', fontSize: 13, borderRadius: 12 }}>Get Started Free</button>
                        </div>
                    </div>
                </nav>

                {/* ===== HERO ===== */}
                <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 100, paddingBottom: 60, background: 'linear-gradient(180deg,#fafaff 0%,#f8fafc 40%,#fff 100%)', position: 'relative', overflow: 'hidden' }}>
                    {/* Animated gradient orbs */}
                    <div style={{ position: 'absolute', width: 700, height: 700, top: '-20%', right: '-15%', background: 'radial-gradient(circle,rgba(99,102,241,0.08) 0%,rgba(139,92,246,0.04) 40%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbMove1 20s ease-in-out infinite', filter: 'blur(40px)' }} />
                    <div style={{ position: 'absolute', width: 500, height: 500, bottom: '0%', left: '-10%', background: 'radial-gradient(circle,rgba(236,72,153,0.06) 0%,rgba(139,92,246,0.03) 40%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbMove2 25s ease-in-out infinite', filter: 'blur(30px)' }} />
                    <div style={{ position: 'absolute', width: 400, height: 400, top: '40%', left: '50%', background: 'radial-gradient(circle,rgba(6,182,212,0.05) 0%,transparent 70%)', borderRadius: '50%', pointerEvents: 'none', animation: 'orbMove3 18s ease-in-out infinite', filter: 'blur(35px)' }} />
                    {/* Dot grid */}
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(99,102,241,0.04) 1px,transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none', opacity: 0.6 }} />

                    <div className="lt-i" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="lt-hero-g" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }}>
                            <div style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(30px)', transition: 'all 1s cubic-bezier(0.16,1,0.3,1)' }}>
                                <div className="lt-badge" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1', marginBottom: 28, border: '1px solid rgba(99,102,241,0.12)' }}>
                                    🇱🇰 Built for Sri Lankan Professionals
                                </div>
                                <h1 className="lt-h lt-hero-t" style={{ fontSize: '4rem', marginBottom: 24 }}>
                                    Your Profession.<br />
                                    <span style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 30%,#ec4899 70%,#f472b6 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '300% 300%', animation: 'gradientShift 6s ease infinite' }}>Your Finance App.</span>
                                </h1>
                                <p className="lt-sub" style={{ marginBottom: 36, fontSize: 19 }}>
                                    12 profession-specific financial tools. One powerful platform. Your data stays on your device — compliant with Sri Lankan data protection laws.
                                </p>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <button onClick={onGetStarted} className="lt-btn lt-btn-p" style={{ fontSize: 16, padding: '18px 40px', borderRadius: 16 }}>
                                        Start Free — No Credit Card →
                                    </button>
                                    <button onClick={() => document.getElementById('professions')?.scrollIntoView({ behavior: 'smooth' })} className="lt-btn lt-btn-o" style={{ borderRadius: 16 }}>
                                        Explore Professions
                                    </button>
                                </div>
                                <div style={{ marginTop: 36, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                                    {[{ icon: '🔒', text: 'Data on your device only' }, { icon: '🇱🇰', text: 'PDPA Compliant' }, { icon: '⚡', text: 'Works offline' }].map((b, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600, color: '#059669', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 12, backdropFilter: 'blur(8px)' }}>
                                            {b.icon} {b.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Hero Right — Phone Mockup */}
                            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(40px)', transition: 'all 1.2s cubic-bezier(0.16,1,0.3,1) 0.3s' }}>
                                <div style={{ width: 300, height: 600, background: 'linear-gradient(180deg,#1e1b4b 0%,#312e81 100%)', borderRadius: 40, border: '8px solid #1e1b4b', boxShadow: '0 60px 120px -20px rgba(99,102,241,0.25), 0 0 0 1px rgba(99,102,241,0.1)', position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 120, height: 28, background: '#1e1b4b', borderRadius: '0 0 20px 20px' }} />
                                    <div style={{ padding: '50px 20px 20px', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div style={{ color: '#c7d2fe', fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>MyTracksy Dashboard</div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                            {professions.slice(0, 6).map((p, i) => (
                                                <div key={i} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 10px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)', animation: `float ${3 + i * 0.5}s ease-in-out infinite`, animationDelay: `${i * 0.2}s` }}>
                                                    <div style={{ fontSize: 24, marginBottom: 4 }}>{p.icon}</div>
                                                    <div style={{ fontSize: 11, color: '#e0e7ff', fontWeight: 600 }}>{p.name}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div style={{ marginTop: 'auto', background: 'rgba(99,102,241,0.15)', borderRadius: 16, padding: '14px 16px', border: '1px solid rgba(99,102,241,0.2)' }}>
                                            <div style={{ fontSize: 11, color: '#a5b4fc', marginBottom: 4 }}>Monthly Revenue</div>
                                            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>LKR 4.2M</div>
                                            <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>↑ 12.5% vs last month</div>
                                        </div>
                                    </div>
                                </div>
                                {/* Floating badges around phone */}
                                {[
                                    { icon: '🔒', text: 'Encrypted', top: '10%', right: '-60px', delay: '0s' },
                                    { icon: '📊', text: 'Real-time', top: '45%', left: '-70px', delay: '1s' },
                                    { icon: '⚡', text: 'Offline', bottom: '20%', right: '-55px', delay: '2s' },
                                ].map((badge, i) => (
                                    <div key={i} style={{ position: 'absolute', ...badge as any, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderRadius: 14, padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#1e1b4b', boxShadow: '0 8px 30px -8px rgba(0,0,0,0.1), 0 0 0 1px rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', gap: 6, animation: `float 4s ease-in-out infinite`, animationDelay: badge.delay, whiteSpace: 'nowrap' }}>
                                        {badge.icon} {badge.text}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ Stats Bar ══════ */}
                <section style={{ padding: '60px 0', background: 'linear-gradient(135deg,#1e1b4b 0%,#312e81 100%)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                    <div className="lt-i" style={{ position: 'relative', zIndex: 2 }}>
                        <div className="lt-stats-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '2rem', textAlign: 'center' }}>
                            {[
                                { value: 12, suffix: '', label: 'Professions', icon: '🎯' },
                                { value: 100, suffix: '%', label: 'Data On-Device', icon: '🔒' },
                                { value: 0, suffix: '', label: 'Server Storage', icon: '🛡️' },
                                { value: 24, suffix: '/7', label: 'Offline Access', icon: '⚡' },
                            ].map((s, i) => (
                                <div key={i} className="sr" style={{ transitionDelay: `${i * 100}ms` }}>
                                    <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
                                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', lineHeight: 1 }}>
                                        <AnimatedNumber value={s.value} />{s.suffix}
                                    </div>
                                    <div style={{ fontSize: 14, color: '#c7d2fe', fontWeight: 500, marginTop: 8 }}>{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ Professions Grid ══════ */}
                <section id="professions" className="lt-s" style={{ background: '#fafafa' }}>
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <div className="lt-badge" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.12)', marginBottom: 20 }}>12 Professions</div>
                            <h2 className="lt-h" style={{ fontSize: '2.8rem', marginBottom: 16 }}>One Platform. <span style={{ color: '#6366f1' }}>Every Profession.</span></h2>
                            <p className="lt-sub" style={{ maxWidth: 560, margin: '0 auto' }}>Each profession gets a custom-tailored financial dashboard with industry-specific tools, reports, and compliance features.</p>
                        </div>
                        <div className="lt-prof-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
                            {professions.map((p, i) => (
                                <div key={i} className="lt-tile sr" onClick={() => handleProfessionClick(p.slug)} style={{ cursor: 'pointer', borderRadius: 20, padding: 28, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', transitionDelay: `${i * 50}ms`, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: p.gradient, opacity: 0.04, borderRadius: '0 20px 0 100%' }} />
                                    <div style={{ width: 52, height: 52, borderRadius: 16, background: p.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16, boxShadow: `0 8px 24px -8px ${p.color}40` }}>{p.icon}</div>
                                    <h3 style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.02em' }}>{p.name}</h3>
                                    <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{p.tagline}</p>
                                    <div style={{ marginTop: 16, fontSize: 13, fontWeight: 700, color: p.color, display: 'flex', alignItems: 'center', gap: 6 }}>
                                        Explore <span style={{ transition: 'transform 0.3s' }}>→</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ Features Grid ══════ */}
                <section id="features" className="lt-s">
                    <div className="lt-i">
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 64 }}>
                            <div className="lt-badge" style={{ background: 'rgba(16,185,129,0.06)', color: '#059669', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 20 }}>Built-in Features</div>
                            <h2 className="lt-h" style={{ fontSize: '2.8rem', marginBottom: 16 }}>Everything You Need. <span style={{ color: '#10b981' }}>Built In.</span></h2>
                            <p className="lt-sub" style={{ maxWidth: 560, margin: '0 auto' }}>Every profession includes these powerful features — no add-ons, no hidden costs for essentials.</p>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }} className="lt-feat-g">
                            {commonSections.map((f, i) => (
                                <div key={i} className="lt-fc sr" style={{ borderRadius: 24, padding: 36, background: '#fff', border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)', transitionDelay: `${i * 80}ms`, position: 'relative', overflow: 'hidden' }}>
                                    <div style={{ position: 'absolute', bottom: -40, right: -40, width: 120, height: 120, background: f.color, opacity: 0.03, borderRadius: '50%' }} />
                                    <div style={{ width: 56, height: 56, borderRadius: 18, background: `${f.color}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, marginBottom: 20 }}>{f.icon}</div>
                                    <h3 style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 10, letterSpacing: '-0.02em' }}>{f.title}</h3>
                                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ══════ Security & Privacy ══════ */}
                <section className="lt-s" style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 100%)', color: '#fff' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5rem', alignItems: 'center' }} className="lt-sec-g">
                            <div className="sr">
                                <div className="lt-badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#34d399', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 20 }}>🛡️ Data Protection</div>
                                <h2 className="lt-h" style={{ fontSize: '2.5rem', color: '#fff', marginBottom: 20 }}>Your Data. <span style={{ color: '#34d399' }}>Your Device.</span></h2>
                                <p style={{ fontSize: 17, color: '#94a3b8', lineHeight: 1.8, marginBottom: 32 }}>
                                    Built from day one to comply with Sri Lanka's Personal Data Protection Act (PDPA). We don't just claim privacy — we architect for it.
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                    {[
                                        { icon: '🔐', title: 'Zero Server Storage', desc: 'Personal & financial data never leaves your device' },
                                        { icon: '🇱🇰', title: 'PDPA Compliant', desc: 'Meets all Sri Lankan data protection requirements' },
                                        { icon: '📱', title: 'Offline-First', desc: 'Full functionality without internet connection' },
                                        { icon: '🗑️', title: 'Full Data Control', desc: 'Export or delete your data anytime — no questions asked' },
                                    ].map((item, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 16, padding: '16px 20px', background: 'rgba(255,255,255,0.04)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.3s', cursor: 'default' }}>
                                            <div style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</div>
                                            <div>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 2 }}>{item.title}</div>
                                                <div style={{ fontSize: 13, color: '#94a3b8' }}>{item.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="sr" style={{ display: 'flex', justifyContent: 'center' }}>
                                <div style={{ width: 340, height: 340, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.15), rgba(16,185,129,0.1), transparent 70%)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ fontSize: 80 }}>🛡️</div>
                                    <div style={{ position: 'absolute', inset: -20, borderRadius: '50%', border: '1px dashed rgba(99,102,241,0.15)', animation: 'borderRotate 20s linear infinite' }} />
                                    <div style={{ position: 'absolute', inset: -50, borderRadius: '50%', border: '1px dashed rgba(16,185,129,0.1)', animation: 'borderRotate 30s linear infinite reverse' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ══════ FAQ ══════ */}
                <section id="faq" className="lt-s" style={{ background: '#fafafa' }}>
                    <div className="lt-i" style={{ maxWidth: 800, margin: '0 auto' }}>
                        <div className="sr" style={{ textAlign: 'center', marginBottom: 56 }}>
                            <div className="lt-badge" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.12)', marginBottom: 20 }}>FAQ</div>
                            <h2 className="lt-h" style={{ fontSize: '2.5rem', marginBottom: 16 }}>Common Questions</h2>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {faqItems.map((faq, i) => {
                                const isOpen = openFaq === i;
                                return (
                                    <div key={i} className="lt-faq sr" onClick={() => setOpenFaq(isOpen ? null : i)} style={{ background: '#fff', borderRadius: 18, padding: '22px 28px', cursor: 'pointer', border: '1px solid rgba(0,0,0,0.04)', transition: 'all 0.3s', boxShadow: isOpen ? '0 8px 30px -12px rgba(99,102,241,0.12)' : 'none' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.01em', margin: 0 }}>{faq.q}</h3>
                                            <span style={{ fontSize: 20, color: '#6366f1', transition: 'transform 0.3s', transform: isOpen ? 'rotate(45deg)' : 'rotate(0)', flexShrink: 0, marginLeft: 16 }}>+</span>
                                        </div>
                                        <div style={{ maxHeight: isOpen ? 200 : 0, overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
                                            <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.7, marginTop: 14, marginBottom: 0 }}>{faq.a}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ══════ CTA ══════ */}
                <section className="lt-s" style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#ec4899 100%)', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
                    <div className="lt-i" style={{ position: 'relative', zIndex: 2, textAlign: 'center' }}>
                        <div className="sr">
                            <h2 className="lt-h" style={{ fontSize: '3rem', color: '#fff', marginBottom: 20 }}>Ready to Transform Your Finances?</h2>
                            <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
                                Join thousands of Sri Lankan professionals managing their finances smarter. Start free today.
                            </p>
                            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                                <button onClick={onGetStarted} style={{ padding: '18px 48px', fontSize: 17, fontWeight: 800, background: '#fff', color: '#6366f1', border: 'none', borderRadius: 16, cursor: 'pointer', letterSpacing: '-0.02em', boxShadow: '0 8px 30px -8px rgba(0,0,0,0.2)', transition: 'all 0.3s' }}>
                                    Start Free Now →
                                </button>
                            </div>
                            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 20 }}>No credit card required • Data stays on your device • Cancel anytime</p>
                        </div>
                    </div>
                </section>

                {/* ══════ Footer ══════ */}
                <footer style={{ background: '#0f172a', padding: '60px 0 40px', color: '#94a3b8' }}>
                    <div className="lt-i">
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: 48 }} className="lt-foot-g">
                            <div>
                                <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em', marginBottom: 16 }}>
                                    <span style={{ color: '#6366f1' }}>My</span>Tracksy
                                </div>
                                <p style={{ fontSize: 14, lineHeight: 1.7, maxWidth: 280 }}>Professional financial management for every Sri Lankan profession. Your data, your device, your control.</p>
                            </div>
                            <div>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Product</h4>
                                {['Features', 'Pricing', 'Professions', 'Security'].map((l, i) => (
                                    <div key={i} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}>{l}</div>
                                ))}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Legal</h4>
                                {['Privacy Policy', 'Terms of Service', 'PDPA Compliance', 'Data Policy'].map((l, i) => (
                                    <div key={i} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}>{l}</div>
                                ))}
                            </div>
                            <div>
                                <h4 style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Support</h4>
                                {['Help Center', 'Contact Us', 'Community', 'Status'].map((l, i) => (
                                    <div key={i} style={{ fontSize: 14, marginBottom: 10, cursor: 'pointer', transition: 'color 0.2s' }}>{l}</div>
                                ))}
                            </div>
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                            <div style={{ fontSize: 13 }}>© 2025 MyTracksy. Built with 🇱🇰 for Sri Lankan professionals.</div>
                            <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#34d399' }} />
                                All systems operational
                            </div>
                        </div>
                    </div>
                </footer>

            </div>
        </>
    );
}

export default LandingPage;
