import React, { useState, useEffect } from 'react';
import { ProfessionType } from '../contexts/AuthContext';

// Profession data matching build/profession-setup.html
const professions: {
    id: ProfessionType;
    title: string;
    subtitle: string;
    icon: string;
    gradient: string;
    primaryColor: string;
    features: string[];
    stats: { value: string; label: string }[];
}[] = [
        {
            id: 'medical',
            title: 'Medical Professional',
            subtitle: 'Doctors, Surgeons, Specialists',
            icon: '🩺',
            gradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 100%)',
            primaryColor: '#0ea5e9',
            features: [
                'Multi-hospital management (Government & Private)',
                'CME credit tracking & SLMC compliance',
                'Medical equipment & instrument tracking',
                'Research & conference expense management',
                'Medical terminology voice recognition',
            ],
            stats: [
                { value: '50+', label: 'Medical Features' },
                { value: '15+', label: 'Specialties' },
                { value: '3', label: 'Languages' },
            ],
        },
        {
            id: 'legal',
            title: 'Legal Professional',
            subtitle: 'Lawyers, Attorneys, Legal Advisors',
            icon: '⚖️',
            gradient: 'linear-gradient(135deg, #1e2124 0%, #374151 100%)',
            primaryColor: '#1e3a8a',
            features: [
                'Case & client portfolio management',
                'Billable hours tracking & time allocation',
                'Court fee calculators (Supreme, Appeal, High)',
                'Bar Association compliance & CLE tracking',
                'Legal research & database subscriptions',
            ],
            stats: [
                { value: '40+', label: 'Legal Features' },
                { value: '12+', label: 'Practice Areas' },
                { value: '3', label: 'Court Levels' },
            ],
        },
        {
            id: 'engineering',
            title: 'Engineering Professional',
            subtitle: 'Engineers, Architects, Technical Specialists',
            icon: '⚙️',
            gradient: 'linear-gradient(135deg, #7c2d12 0%, #1e3a8a 100%)',
            primaryColor: '#ea580c',
            features: [
                'Multi-project tracking & resource allocation',
                'Software licenses & technical tool management',
                'IESL certification & professional development',
                'Project cost allocation & profitability analysis',
                'Equipment maintenance & depreciation tracking',
            ],
            stats: [
                { value: '45+', label: 'Engineering Features' },
                { value: '20+', label: 'Disciplines' },
                { value: '100+', label: 'Software Tools' },
            ],
        },
        {
            id: 'business',
            title: 'Business Owner/CEO',
            subtitle: 'Entrepreneurs, Executives, Business Leaders',
            icon: '📈',
            gradient: 'linear-gradient(135deg, #064e3b 0%, #92400e 100%)',
            primaryColor: '#059669',
            features: [
                'Multi-entity & subsidiary management',
                'Executive analytics & strategic planning',
                'Employee expense & payroll management',
                'Revenue forecasting & cash flow analysis',
                'Investor relations & board reporting',
            ],
            stats: [
                { value: '60+', label: 'Business Features' },
                { value: '25+', label: 'Industries' },
                { value: '∞', label: 'Entities' },
            ],
        },
        {
            id: 'individual',
            title: 'Individual User',
            subtitle: 'Personal Finance Management',
            icon: '👤',
            gradient: 'linear-gradient(135deg, #581c87 0%, #7c2d12 100%)',
            primaryColor: '#7c3aed',
            features: [
                'Family & household budget management',
                'Personal savings goals & investment tracking',
                'Education & children\'s expense planning',
                'Healthcare & family wellness tracking',
                'Travel & entertainment budget management',
            ],
            stats: [
                { value: '35+', label: 'Personal Features' },
                { value: '15+', label: 'Categories' },
                { value: '100%', label: 'Customizable' },
            ],
        },
        {
            id: 'trading',
            title: 'Trading & Investment',
            subtitle: 'Traders, Financial Analysts, Investment Advisors',
            icon: '📊',
            gradient: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)',
            primaryColor: '#1a365d',
            features: [
                'Real-time P&L integration with trading platforms',
                'Tax loss harvesting & capital gains tracking',
                'Multiple account & brokerage management',
                'Regulatory compliance & licensing tracking',
                'Performance analytics vs. expenses correlation',
            ],
            stats: [
                { value: '65+', label: 'Trading Features' },
                { value: '10+', label: 'Asset Classes' },
                { value: '24/7', label: 'Market Coverage' },
            ],
        },
        {
            id: 'automotive',
            title: 'Automotive Sales',
            subtitle: 'Car Sales, Dealership Staff, Auto Finance',
            icon: '🚗',
            gradient: 'linear-gradient(135deg, #dc2626 0%, #64748b 100%)',
            primaryColor: '#dc2626',
            features: [
                'Commission tracking & sales performance',
                'Customer relationship management expenses',
                'Vehicle demonstration & inventory costs',
                'Seasonal expense planning & optimization',
                'Multi-location dealership support',
            ],
            stats: [
                { value: '50+', label: 'Sales Features' },
                { value: '25+', label: 'Vehicle Brands' },
                { value: '∞', label: 'Locations' },
            ],
        },
        {
            id: 'marketing',
            title: 'Marketing & Digital',
            subtitle: 'Marketers, Social Media, Content Creators',
            icon: '📢',
            gradient: 'linear-gradient(135deg, #7c3aed 0%, #ea580c 100%)',
            primaryColor: '#7c3aed',
            features: [
                'Campaign cost allocation & ROI tracking',
                'Multi-platform advertising spend analytics',
                'Client project expense separation',
                'Creative asset & content creation tracking',
                'Design tools & software subscription management',
            ],
            stats: [
                { value: '70+', label: 'Marketing Tools' },
                { value: '15+', label: 'Platforms' },
                { value: '∞', label: 'Campaigns' },
            ],
        },
        {
            id: 'travel',
            title: 'Travel Industry',
            subtitle: 'Travel Agents, Tour Operators, Hotel Sales',
            icon: '✈️',
            gradient: 'linear-gradient(135deg, #1e40af 0%, #059669 100%)',
            primaryColor: '#1e40af',
            features: [
                'Destination expense tracking by region',
                'Familiarization trip management',
                'Client entertainment & relationship analytics',
                'Seasonal expense planning & optimization',
                'Multi-currency transaction support',
            ],
            stats: [
                { value: '55+', label: 'Travel Features' },
                { value: '200+', label: 'Destinations' },
                { value: '150+', label: 'Currencies' },
            ],
        },
        {
            id: 'transportation',
            title: 'Transportation',
            subtitle: 'Drivers, Delivery, Courier Services',
            icon: '🚛',
            gradient: 'linear-gradient(135deg, #ea580c 0%, #2563eb 100%)',
            primaryColor: '#ea580c',
            features: [
                'GPS mileage tracking & optimization',
                'Fuel efficiency analytics & cost tracking',
                'Vehicle maintenance & repair scheduling',
                'Commercial licensing & safety certification',
                'Multiple vehicle fleet management',
            ],
            stats: [
                { value: '45+', label: 'Transport Features' },
                { value: '20+', label: 'Vehicle Types' },
                { value: '24/7', label: 'Tracking' },
            ],
        },
        {
            id: 'retail',
            title: 'Retail & Sales',
            subtitle: 'Retail Managers, Sales Reps, Merchandising',
            icon: '🛒',
            gradient: 'linear-gradient(135deg, #0d9488 0%, #f59e0b 100%)',
            primaryColor: '#0d9488',
            features: [
                'Seasonal expense planning & holiday optimization',
                'Inventory research & product sourcing tracking',
                'Customer service training investment analytics',
                'Multi-location store expense management',
                'Sales performance correlation analysis',
            ],
            stats: [
                { value: '60+', label: 'Retail Features' },
                { value: '50+', label: 'Product Categories' },
                { value: '∞', label: 'Store Locations' },
            ],
        },
        {
            id: 'aquaculture',
            title: 'Aquaculture & Marine Farming',
            subtitle: 'Shrimp Farming, Sea Cucumber, Fish Farming & Export',
            icon: '🐟',
            gradient: 'linear-gradient(135deg, #0891b2 0%, #22c55e 100%)',
            primaryColor: '#0891b2',
            features: [
                'Pond & Tank Management Systems',
                'Water Quality & Environmental Monitoring',
                'Feed Management & Growth Tracking',
                'Harvest Yield & Mortality Analytics',
                'Export Documentation & Compliance',
            ],
            stats: [
                { value: '25+', label: 'Species Tracking' },
                { value: '360°', label: 'Farm Management' },
                { value: 'Global', label: 'Export Markets' },
            ],
        },
    ];

interface ProfessionSetupProps {
    onProfessionSelected: (profession: ProfessionType) => void;
}

const ProfessionSetup: React.FC<ProfessionSetupProps> = ({ onProfessionSelected }) => {
    const [selected, setSelected] = useState<ProfessionType | null>(null);

    // Check if a profession is already stored
    useEffect(() => {
        const stored = localStorage.getItem('myTracksyProfession');
        if (stored) {
            try {
                const data = JSON.parse(stored);
                if (data.profession) {
                    setSelected(data.profession);
                }
            } catch {
                // ignore
            }
        }
    }, []);

    const handleSelect = (id: ProfessionType) => {
        setSelected(id);
    };

    const handleContinue = () => {
        if (!selected) return;
        const professionProfile = {
            profession: selected,
            selectedAt: new Date().toISOString(),
        };
        localStorage.setItem('myTracksyProfession', JSON.stringify(professionProfile));
        onProfessionSelected(selected);
    };

    return (
        <div style={styles.wrapper}>
            {/* Background */}
            <div style={styles.bg} />

            <div style={styles.container}>
                {/* Header */}
                <div style={styles.header}>
                    <h1 style={styles.headerTitle}>🎯 Choose Your Professional Path</h1>
                    <p style={styles.headerSubtitle}>
                        Select your profession to unlock a customized MyTracksy experience designed specifically for your professional needs.
                    </p>
                </div>

                {/* Grid */}
                <div style={styles.grid}>
                    {professions.map((p) => (
                        <div
                            key={p.id}
                            onClick={() => handleSelect(p.id)}
                            style={{
                                ...styles.card,
                                borderColor: selected === p.id ? p.primaryColor : 'transparent',
                                boxShadow:
                                    selected === p.id
                                        ? `0 0 0 4px ${p.primaryColor}33, 0 20px 40px rgba(0,0,0,0.15)`
                                        : '0 10px 30px rgba(0,0,0,0.08)',
                                transform: selected === p.id ? 'translateY(-4px)' : 'translateY(0)',
                            }}
                        >
                            {/* Top color bar */}
                            <div style={{ ...styles.topBar, background: p.gradient }} />

                            {/* Header */}
                            <div style={styles.cardHeader}>
                                <div style={{ ...styles.iconCircle, background: p.primaryColor }}>
                                    <span style={{ fontSize: '1.6rem' }}>{p.icon}</span>
                                </div>
                                <div>
                                    <div style={styles.cardTitle}>{p.title}</div>
                                    <div style={styles.cardSubtitle}>{p.subtitle}</div>
                                </div>
                            </div>

                            {/* Features */}
                            <ul style={styles.featureList}>
                                {p.features.map((f, i) => (
                                    <li key={i} style={styles.featureItem}>
                                        <span style={{ ...styles.featureDot, background: p.primaryColor }} />
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            {/* Stats */}
                            <div style={styles.statsRow}>
                                {p.stats.map((s, i) => (
                                    <div key={i} style={styles.stat}>
                                        <div style={{ ...styles.statValue, color: p.primaryColor }}>{s.value}</div>
                                        <div style={styles.statLabel}>{s.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Selected info & button */}
                {selected && (
                    <div style={styles.selectedInfo}>
                        <h3 style={{ marginBottom: '0.5rem', color: '#1e293b' }}>
                            {professions.find((p) => p.id === selected)?.title} Dashboard
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                            Your dashboard will be customized with specialized features, terminology, and tools tailored to your industry.
                        </p>
                    </div>
                )}

                <div style={styles.actions}>
                    <button
                        onClick={handleContinue}
                        disabled={!selected}
                        style={{
                            ...styles.continueBtn,
                            opacity: selected ? 1 : 0.5,
                            cursor: selected ? 'pointer' : 'not-allowed',
                        }}
                    >
                        Continue to Dashboard →
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Inline styles ---
const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
    },
    bg: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        zIndex: -1,
    },
    container: {
        maxWidth: 1400,
        margin: '0 auto',
        padding: '2rem',
        position: 'relative',
        zIndex: 1,
    },
    header: {
        textAlign: 'center' as const,
        marginBottom: '2.5rem',
        color: 'white',
    },
    headerTitle: {
        fontSize: '2.5rem',
        fontWeight: 800,
        marginBottom: '0.75rem',
        background: 'linear-gradient(45deg, #fff, #f0f9ff)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    headerSubtitle: {
        fontSize: '1.1rem',
        opacity: 0.9,
        maxWidth: 700,
        margin: '0 auto',
        lineHeight: 1.6,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem',
    },
    card: {
        background: 'rgba(255,255,255,0.97)',
        borderRadius: 16,
        padding: '1.75rem',
        cursor: 'pointer',
        position: 'relative' as const,
        overflow: 'hidden',
        border: '3px solid transparent',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    topBar: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        right: 0,
        height: 5,
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        marginBottom: '1.25rem',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardTitle: {
        fontSize: '1.25rem',
        fontWeight: 700,
        color: '#1e293b',
    },
    cardSubtitle: {
        fontSize: '0.85rem',
        color: '#64748b',
    },
    featureList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
        marginBottom: '1.25rem',
    },
    featureItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        padding: '0.35rem 0',
        color: '#475569',
        fontSize: '0.88rem',
    },
    featureDot: {
        width: 7,
        height: 7,
        borderRadius: '50%',
        flexShrink: 0,
    },
    statsRow: {
        display: 'flex',
        justifyContent: 'space-between',
        paddingTop: '0.75rem',
        borderTop: '1px solid #e2e8f0',
    },
    stat: {
        textAlign: 'center' as const,
    },
    statValue: {
        fontSize: '1.1rem',
        fontWeight: 700,
    },
    statLabel: {
        fontSize: '0.75rem',
        color: '#94a3b8',
    },
    selectedInfo: {
        background: 'rgba(255,255,255,0.95)',
        borderRadius: 16,
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        animation: 'fadeIn 0.4s ease-out',
    },
    actions: {
        display: 'flex',
        justifyContent: 'center',
    },
    continueBtn: {
        padding: '0.9rem 2.5rem',
        border: 'none',
        borderRadius: 10,
        fontSize: '1.05rem',
        fontWeight: 700,
        color: 'white',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        boxShadow: '0 6px 20px rgba(102,126,234,0.35)',
        transition: 'all 0.3s ease',
    },
};

export default ProfessionSetup;
