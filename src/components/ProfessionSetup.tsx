import React, { useState, useEffect } from 'react';
import { ProfessionType } from '../types/profession';

const professions: {
    id: ProfessionType; title: string; subtitle: string; icon: string;
    gradient: string; primaryColor: string; features: string[];
    stats: { value: string; label: string }[];
}[] = [
        {
            id: 'medical', title: 'Medical Professional', subtitle: 'Doctors, Surgeons, Specialists', icon: '🩺',
            gradient: 'linear-gradient(135deg, #0c4a6e, #075985)', primaryColor: '#0ea5e9',
            features: ['Multi-hospital management', 'CME credit tracking & SLMC compliance', 'Medical equipment tracking', 'Research expense management', 'Medical voice recognition'],
            stats: [{ value: '50+', label: 'Features' }, { value: '15+', label: 'Specialties' }, { value: '3', label: 'Languages' }]
        },
        {
            id: 'legal', title: 'Legal Professional', subtitle: 'Lawyers, Attorneys, Legal Advisors', icon: '⚖️',
            gradient: 'linear-gradient(135deg, #1e2124, #374151)', primaryColor: '#6366f1',
            features: ['Case & client portfolio management', 'Billable hours tracking', 'Court fee calculators', 'Bar Association compliance', 'Legal research tracking'],
            stats: [{ value: '40+', label: 'Features' }, { value: '12+', label: 'Practice Areas' }, { value: '3', label: 'Court Levels' }]
        },
        {
            id: 'engineering', title: 'Engineering Professional', subtitle: 'Engineers, Architects, Technical Specialists', icon: '⚙️',
            gradient: 'linear-gradient(135deg, #7c2d12, #1e3a8a)', primaryColor: '#ea580c',
            features: ['Multi-project tracking', 'Software license management', 'IESL certification tracking', 'Cost allocation & profitability', 'Equipment depreciation'],
            stats: [{ value: '45+', label: 'Features' }, { value: '20+', label: 'Disciplines' }, { value: '100+', label: 'Tools' }]
        },
        {
            id: 'business', title: 'Business Owner / CEO', subtitle: 'Entrepreneurs, Executives, Business Leaders', icon: '📈',
            gradient: 'linear-gradient(135deg, #064e3b, #92400e)', primaryColor: '#059669',
            features: ['Multi-entity management', 'Executive analytics', 'Payroll & HR management', 'Revenue forecasting', 'Investor relations'],
            stats: [{ value: '60+', label: 'Features' }, { value: '25+', label: 'Industries' }, { value: '∞', label: 'Entities' }]
        },
        {
            id: 'individual', title: 'Individual User', subtitle: 'Personal Finance Management', icon: '👤',
            gradient: 'linear-gradient(135deg, #581c87, #7c2d12)', primaryColor: '#7c3aed',
            features: ['Family budget management', 'Savings goals & investments', 'Education expense planning', 'Healthcare tracking', 'Travel budget management'],
            stats: [{ value: '35+', label: 'Features' }, { value: '15+', label: 'Categories' }, { value: '100%', label: 'Custom' }]
        },
        {
            id: 'trading', title: 'Trading & Investment', subtitle: 'Traders, Financial Analysts, Investment Advisors', icon: '📊',
            gradient: 'linear-gradient(135deg, #1a365d, #2c5282)', primaryColor: '#3b82f6',
            features: ['Real-time P&L integration', 'Tax loss harvesting', 'Multiple brokerage management', 'Regulatory compliance', 'Performance analytics'],
            stats: [{ value: '65+', label: 'Features' }, { value: '10+', label: 'Asset Classes' }, { value: '24/7', label: 'Coverage' }]
        },
        {
            id: 'automotive', title: 'Automotive Sales', subtitle: 'Car Sales, Dealership Staff, Auto Finance', icon: '🚗',
            gradient: 'linear-gradient(135deg, #dc2626, #64748b)', primaryColor: '#dc2626',
            features: ['Commission tracking', 'Customer relationship expenses', 'Vehicle inventory costs', 'Seasonal expense planning', 'Multi-location support'],
            stats: [{ value: '50+', label: 'Features' }, { value: '25+', label: 'Brands' }, { value: '∞', label: 'Locations' }]
        },
        {
            id: 'marketing', title: 'Marketing & Digital', subtitle: 'Marketers, Social Media, Content Creators', icon: '📢',
            gradient: 'linear-gradient(135deg, #7c3aed, #ea580c)', primaryColor: '#7c3aed',
            features: ['Campaign ROI tracking', 'Multi-platform ad analytics', 'Client project separation', 'Creative asset tracking', 'Subscription management'],
            stats: [{ value: '70+', label: 'Tools' }, { value: '15+', label: 'Platforms' }, { value: '∞', label: 'Campaigns' }]
        },
        {
            id: 'travel', title: 'Travel Industry', subtitle: 'Travel Agents, Tour Operators, Hotel Sales', icon: '✈️',
            gradient: 'linear-gradient(135deg, #1e40af, #059669)', primaryColor: '#1e40af',
            features: ['Destination expense tracking', 'Familiarization trips', 'Client entertainment analytics', 'Seasonal optimization', 'Multi-currency support'],
            stats: [{ value: '55+', label: 'Features' }, { value: '200+', label: 'Destinations' }, { value: '150+', label: 'Currencies' }]
        },
        {
            id: 'transportation', title: 'Transportation', subtitle: 'Drivers, Delivery, Courier Services', icon: '🚛',
            gradient: 'linear-gradient(135deg, #ea580c, #2563eb)', primaryColor: '#ea580c',
            features: ['GPS mileage tracking', 'Fuel efficiency analytics', 'Vehicle maintenance scheduling', 'Safety certification', 'Fleet management'],
            stats: [{ value: '45+', label: 'Features' }, { value: '20+', label: 'Vehicle Types' }, { value: '24/7', label: 'Tracking' }]
        },
        {
            id: 'retail', title: 'Retail & Sales', subtitle: 'Retail Managers, Sales Reps, Merchandising', icon: '🛒',
            gradient: 'linear-gradient(135deg, #0d9488, #f59e0b)', primaryColor: '#0d9488',
            features: ['Seasonal expense planning', 'Inventory sourcing tracking', 'Customer service analytics', 'Multi-location management', 'Sales correlation analysis'],
            stats: [{ value: '60+', label: 'Features' }, { value: '50+', label: 'Categories' }, { value: '∞', label: 'Stores' }]
        },
        {
            id: 'aquaculture', title: 'Aquaculture & Marine', subtitle: 'Shrimp, Sea Cucumber, Fish Farming & Export', icon: '🐟',
            gradient: 'linear-gradient(135deg, #0891b2, #22c55e)', primaryColor: '#0891b2',
            features: ['Pond & Tank management', 'Water quality monitoring', 'Feed management & FCR', 'Harvest yield analytics', 'Export documentation'],
            stats: [{ value: '25+', label: 'Species' }, { value: '360°', label: 'Management' }, { value: 'Global', label: 'Export' }]
        },
        {
            id: 'creator', title: 'Digital Creator', subtitle: 'YouTubers, Streamers, Content Creators', icon: '🎥',
            gradient: 'linear-gradient(135deg, #a16207, #ca8a04)', primaryColor: '#eab308',
            features: ['Foreign income tracking (USD to LKR)', '5% Sri Lanka Tax Calculator', 'Sponsorship & AdSense tracking', 'Equipment depreciation', 'Production expense management'],
            stats: [{ value: 'Multi', label: 'Currency' }, { value: '5%', label: 'Tax Calc' }, { value: 'Auto', label: 'Tracking' }]
        },
        {
            id: 'studios', title: 'Photography Studio', subtitle: 'Wedding Photographers, Production Houses, Freelance Creatives', icon: '📸',
            gradient: 'linear-gradient(135deg, #1c1917, #b45309)', primaryColor: '#b45309',
            features: ['Event folio milestone billing', 'Crew & album payout tracking', 'Gear depreciation vault', 'Nekath clash detector', 'AI contracts & client WhatsApp tools'],
            stats: [{ value: '5', label: 'Milestone flows' }, { value: '20%', label: 'Gear dep.' }, { value: 'AI', label: 'Studio Ops' }]
        },
    ];

interface ProfessionSetupProps { onProfessionSelected: (profession: ProfessionType) => void; onBackToHome?: () => void; }

const ProfessionSetup: React.FC<ProfessionSetupProps> = ({ onProfessionSelected, onBackToHome }) => {
    const [selected, setSelected] = useState<ProfessionType | null>(null);
    const [mounted, setMounted] = useState(false);

    // Creator specific state
    const [creatorData, setCreatorData] = useState({
        primaryPlatform: '',
        receivesForeignIncome: false,
        tinNumber: ''
    });

    useEffect(() => { setMounted(true); }, []);
    useEffect(() => {
        const stored = localStorage.getItem('myTracksyProfession');
        if (stored) { try { const d = JSON.parse(stored); if (d.profession) setSelected(d.profession); } catch { } }
    }, []);

    const handleContinue = () => {
        if (!selected) return;

        const payload: any = { profession: selected, selectedAt: new Date().toISOString() };
        if (selected === 'creator') {
            payload.creatorSettings = creatorData;
        }

        localStorage.setItem('myTracksyProfession', JSON.stringify(payload));
        onProfessionSelected(selected);
    };

    return (
        <>
            <style>{`
                @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .prof-card { animation-fill-mode: forwards !important; background: rgba(255,255,255,0.97); border-radius: 16px; padding: 1.5rem; cursor: pointer; border: 2px solid transparent; transition: all 0.3s cubic-bezier(0.4,0,0.2,1); position: relative; overflow: hidden; font-family: 'Inter', sans-serif; }
                @media (prefers-reduced-motion: reduce) { .prof-card { animation: none !important; opacity: 1 !important; transform: none !important; } }
                .prof-card:hover { transform: translateY(-3px); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
                .prof-continue-btn { padding: 14px 48px; border: none; border-radius: 12px; font-size: 15px; font-weight: 650; color: white; background: linear-gradient(135deg, #6366f1, #8b5cf6); font-family: 'Inter', sans-serif; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 6px 20px rgba(99,102,241,0.3); letter-spacing: -0.01em; }
                .prof-continue-btn:hover { box-shadow: 0 10px 30px rgba(99,102,241,0.4); transform: translateY(-2px); }
                .prof-continue-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }
            `}</style>

            <div style={{
                minHeight: '100vh', position: 'relative', overflow: 'hidden',
                fontFamily: "'Inter', -apple-system, sans-serif",
            }}>
                {/* Background */}
                <div style={{
                    position: 'fixed', inset: 0, zIndex: -1,
                    background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
                }} />

                <div style={{ maxWidth: 1400, margin: '0 auto', padding: '2.5rem 2rem', position: 'relative', zIndex: 1 }}>
                    {/* Header */}
                    <div style={{
                        textAlign: 'center', marginBottom: '2.5rem', color: 'white',
                        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.8s ease',
                    }}>
                        {onBackToHome && (
                            <button onClick={onBackToHome} style={{
                                position: 'absolute', top: '1.5rem', left: '2rem',
                                background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: 10, padding: '8px 18px', color: 'white', fontSize: 14,
                                fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                backdropFilter: 'blur(8px)', transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', gap: 6,
                            }}
                                onMouseOver={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.2)'; }}
                                onMouseOut={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                            >← Back to Home</button>
                        )}
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.3rem', boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                            }}>💰</div>
                            <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em' }}>MyTracksy</span>
                        </div>
                        <h1 style={{
                            fontSize: '2.25rem', fontWeight: 800, marginBottom: '0.75rem',
                            letterSpacing: '-0.03em', lineHeight: 1.2,
                        }}>
                            Choose Your Professional Path
                        </h1>
                        <p style={{ fontSize: 16, opacity: 0.6, maxWidth: 600, margin: '0 auto', lineHeight: 1.6, fontWeight: 400 }}>
                            Select your profession to unlock a customized experience designed specifically for your industry needs
                        </p>
                    </div>

                    {/* Grid */}
                    <div style={{
                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                        gap: '1.25rem', marginBottom: '2rem',
                    }} role="listbox" aria-label="Select your profession">
                        {professions.map((p, i) => (
                            <button key={p.id} onClick={() => setSelected(p.id)} className="prof-card" role="option" aria-selected={selected === p.id} tabIndex={0}
                                style={{
                                    borderColor: selected === p.id ? p.primaryColor : 'transparent',
                                    boxShadow: selected === p.id
                                        ? `0 0 0 3px ${p.primaryColor}33, 0 20px 40px rgba(0,0,0,0.15)`
                                        : '0 4px 15px rgba(0,0,0,0.06)',
                                    transform: selected === p.id ? 'translateY(-4px)' : undefined,
                                    animation: mounted ? `fadeUp 0.5s ease ${i * 0.04}s both` : 'none',
                                }}>
                                {/* Top bar */}
                                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.gradient }} />

                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: '1.25rem' }}>
                                    <div style={{
                                        width: 48, height: 48, borderRadius: 12, background: p.primaryColor,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '1.5rem', flexShrink: 0, boxShadow: `0 4px 12px ${p.primaryColor}33`,
                                    }}>{p.icon}</div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>{p.title}</div>
                                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 400 }}>{p.subtitle}</div>
                                    </div>
                                </div>

                                {/* Features */}
                                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
                                    {p.features.map((f, fi) => (
                                        <li key={fi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', color: '#475569', fontSize: 13, fontWeight: 400 }}>
                                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.primaryColor, flexShrink: 0, opacity: 0.7 }} />
                                            {f}
                                        </li>
                                    ))}
                                </ul>

                                {/* Stats */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                                    {p.stats.map((s, si) => (
                                        <div key={si} style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: p.primaryColor }}>{s.value}</div>
                                            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400 }}>{s.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Creator Onboarding Fields */}
                    {selected === 'creator' && (
                        <div style={{ maxWidth: 800, margin: '0 auto 2rem', padding: '2rem', background: 'rgba(24, 24, 27, 0.95)', border: '1px solid rgba(234, 179, 8, 0.3)', borderRadius: 16, animation: 'fadeUp 0.4s ease' }}>
                            <h3 style={{ fontSize: 20, fontWeight: 700, color: '#facc15', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span>🎥</span> Creator Tax & Compliance Setup
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Primary Platform</label>
                                    <select
                                        value={creatorData.primaryPlatform}
                                        onChange={e => setCreatorData({ ...creatorData, primaryPlatform: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 15 }}
                                    >
                                        <option value="" disabled>Select your main platform...</option>
                                        <option value="youtube">YouTube</option>
                                        <option value="tiktok">TikTok</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="freelance">Freelance / Fiverr / Upwork</option>
                                    </select>
                                </div>

                                <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={creatorData.receivesForeignIncome}
                                            onChange={e => setCreatorData({ ...creatorData, receivesForeignIncome: e.target.checked })}
                                            style={{ width: 18, height: 18, marginTop: 2, accentColor: '#eab308' }}
                                        />
                                        <div>
                                            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>I receive foreign income (USD/EUR) into a local bank</div>
                                            <div style={{ fontSize: 13, color: '#a1a1aa', lineHeight: 1.5 }}>
                                                Crucial: Sri Lanka now taxes foreign income at 5%. Selecting this unlocks our Service Export exemptions scanner to ensure your AdSense/Upwork income is taxed correctly, preventing standard high bracket taxation by the IRD.
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#a1a1aa', marginBottom: 8 }}>Tax Identification Number (TIN)</label>
                                    <input
                                        type="text"
                                        placeholder="Enter your TIN for corporate invoicing (e.g., 2XXXXXXXXXX)"
                                        value={creatorData.tinNumber}
                                        onChange={e => setCreatorData({ ...creatorData, tinNumber: e.target.value })}
                                        style={{ width: '100%', padding: '12px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: 15 }}
                                    />
                                    <div style={{ fontSize: 12, color: '#71717a', marginTop: 6 }}>Brands (like Keells, Daraz) require this on invoices before paying you.</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action */}
                    <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: '2rem' }}>
                        <button
                            onClick={handleContinue}
                            disabled={!selected || (selected === 'creator' && !creatorData.primaryPlatform)}
                            className="prof-continue-btn"
                        >
                            {selected === 'creator' && !creatorData.primaryPlatform
                                ? 'Complete setup above'
                                : selected ? `Continue as ${professions.find(p => p.id === selected)?.title} →` : 'Select a profession to continue'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ProfessionSetup;
