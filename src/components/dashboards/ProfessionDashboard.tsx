import React from 'react';
import { ProfessionType } from '../../contexts/AuthContext';
import MedicalDashboard from './MedicalDashboard';
import BusinessDashboard from './BusinessDashboard';
import LegalDashboard from './LegalDashboard';
import EngineeringDashboard from './EngineeringDashboard';
import IndividualDashboard from './IndividualDashboard';
import TradingDashboard from './TradingDashboard';
import AutomotiveDashboard from './AutomotiveDashboard';
import MarketingDashboard from './MarketingDashboard';
import TravelDashboard from './TravelDashboard';
import TransportationDashboard from './TransportationDashboard';
import RetailDashboard from './RetailDashboard';
import AquacultureDashboard from './AquacultureDashboard';
import CreatorDashboard from '../CreatorDashboard';
import StudiosDashboard from './StudiosDashboard';

interface ProfessionDashboardProps {
    profession: ProfessionType;
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

/**
 * Routes each profession to its specialized dashboard.
 * Professions without a dedicated dashboard get a placeholder
 * that we'll build out one-by-one.
 */
const ProfessionDashboard: React.FC<ProfessionDashboardProps> = ({
    profession,
    userName,
    onChangeProfession,
    onLogout,
}) => {
    switch (profession) {
        case 'medical':
            return (
                <MedicalDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'business':
            return (
                <BusinessDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'legal':
            return (
                <LegalDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'engineering':
            return (
                <EngineeringDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'individual':
            return (
                <IndividualDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'trading':
            return (
                <TradingDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'automotive':
            return (
                <AutomotiveDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'marketing':
            return (
                <MarketingDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'travel':
        case 'tourism': // TourTracksy uses the robust Travel Dashboard
            return (
                <TravelDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'transportation':
            return (
                <TransportationDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'retail':
            return (
                <RetailDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'aquaculture':
            return (
                <AquacultureDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'creator':
            return (
                <CreatorDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        case 'studios':
            return (
                <StudiosDashboard
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );

        default:
            return (
                <ComingSoonDashboard
                    profession={profession}
                    userName={userName}
                    onChangeProfession={onChangeProfession}
                    onLogout={onLogout}
                />
            );
    }
};

/* ========== Coming Soon placeholder for professions not yet built ========== */
interface ComingSoonProps {
    profession: ProfessionType;
    userName: string;
    onChangeProfession: () => void;
    onLogout: () => void;
}

const professionMeta: Record<string, { icon: string; label: string; color: string }> = {
    medical: { icon: '🩺', label: 'Medical Professional', color: '#ef4444' },
    legal: { icon: '⚖️', label: 'Legal Professional', color: '#8b5cf6' },
    engineering: { icon: '🔧', label: 'Engineering', color: '#f59e0b' },
    business: { icon: '💼', label: 'Business', color: '#3b82f6' },
    individual: { icon: '👤', label: 'Individual', color: '#10b981' },
    trading: { icon: '📈', label: 'Trading', color: '#6366f1' },
    automotive: { icon: '🚗', label: 'Automotive', color: '#ec4899' },
    marketing: { icon: '📢', label: 'Marketing', color: '#14b8a6' },
    travel: { icon: '✈️', label: 'Travel', color: '#06b6d4' },
    transportation: { icon: '🚛', label: 'Transportation', color: '#f97316' },
    retail: { icon: '🏪', label: 'Retail', color: '#a855f7' },
    aquaculture: { icon: '🐟', label: 'Aquaculture', color: '#0ea5e9' },
    studios: { icon: '📸', label: 'Photography Studio', color: '#b45309' },
};

const ComingSoonDashboard: React.FC<ComingSoonProps> = ({
    profession,
    userName,
    onChangeProfession,
    onLogout,
}) => {
    const meta = professionMeta[profession] || { icon: '📊', label: profession, color: '#6366f1' };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: 'white',
            padding: '2rem',
        }}>
            {/* Header */}
            <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', display: 'flex', gap: '0.75rem' }}>
                <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem' }}>👋 {userName}</span>
                <button onClick={onChangeProfession} style={comingSoonBtn}>🔄 Change</button>
                <button onClick={onLogout} style={{ ...comingSoonBtn, color: '#f87171' }}>🚪 Logout</button>
            </div>

            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>{meta.icon}</div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem' }}>{meta.label} Dashboard</h1>
            <p style={{ fontSize: '1.1rem', opacity: 0.7, marginBottom: '2rem', textAlign: 'center', maxWidth: 500 }}>
                We're building a specialized dashboard tailored for {meta.label.toLowerCase()} professionals. Coming soon!
            </p>

            {/* Feature Preview */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem',
                maxWidth: 600, width: '100%', marginBottom: '2rem',
            }}>
                {['Invoicing', 'Expense Tracking', 'Reports', 'Banking', 'Tax Filing', 'Analytics'].map((f) => (
                    <div key={f} style={{
                        padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 12,
                        border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center',
                        fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)',
                    }}>
                        {f}
                    </div>
                ))}
            </div>

            <button onClick={onChangeProfession} style={{
                padding: '0.75rem 2rem', background: meta.color, border: 'none',
                borderRadius: 10, color: 'white', fontSize: '1rem', fontWeight: 600,
                cursor: 'pointer', boxShadow: `0 4px 15px ${meta.color}50`,
            }}>
                ← Back to Profession Selection
            </button>

            <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.4 }}>
                🇱🇰 MyTracksy SaaS · All 12 profession dashboards are live
            </div>
        </div>
    );
};

const comingSoonBtn: React.CSSProperties = {
    padding: '4px 12px',
    background: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 6,
    color: 'rgba(255,255,255,0.7)',
    fontSize: '0.8rem',
    cursor: 'pointer',
};

export default ProfessionDashboard;
