import React from 'react';

interface KPICardProps {
    icon: string;
    label: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    color?: string;
    compact?: boolean;
}

const KPICard: React.FC<KPICardProps> = ({
    icon, label, value, change, changeType = 'neutral', color = '#6366f1', compact = false,
}) => {
    const changeColor = changeType === 'up' ? '#22c55e' : changeType === 'down' ? '#ef4444' : '#94a3b8';
    const changeIcon = changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '';
    const changeBg = changeType === 'up' ? 'rgba(34,197,94,0.08)' : changeType === 'down' ? 'rgba(239,68,68,0.08)' : 'rgba(148,163,184,0.08)';

    return (
        <div style={{
            background: 'white', borderRadius: compact ? 16 : 14, padding: compact ? '1rem' : '1.25rem 1.35rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
            border: '1px solid rgba(226,232,240,0.8)',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            cursor: 'default', position: 'relative', overflow: 'hidden',
        }}
            onMouseEnter={e => {
                if (compact) return;
                (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 25px rgba(0,0,0,0.06), 0 2px 6px rgba(0,0,0,0.03)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                if (compact) return;
                (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}>
            {/* Subtle top accent line */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                opacity: 0.6,
            }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: compact ? 10 : 12, gap: 8 }}>
                <div style={{
                    width: compact ? 36 : 42, height: compact ? 36 : 42, borderRadius: compact ? 10 : 11,
                    background: `${color}0D`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: compact ? '1rem' : '1.25rem',
                }}>{icon}</div>
                {change && (
                    <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 2,
                        fontSize: compact ? 11 : 12, fontWeight: 600, color: changeColor,
                        background: changeBg, padding: compact ? '2px 7px' : '3px 8px', borderRadius: 6,
                    }}>{changeIcon} {change}</span>
                )}
            </div>
            <div style={{
                fontSize: compact ? '1.2rem' : '1.65rem', fontWeight: 700, color: '#0f172a', marginBottom: 3,
                letterSpacing: '-0.02em', fontFamily: "'Inter', sans-serif", lineHeight: 1.2,
            }}>{value}</div>
            <div style={{
                fontSize: compact ? 12 : 13, color: '#94a3b8', fontWeight: 450,
                letterSpacing: '0.01em',
            }}>{label}</div>
        </div>
    );
};

export default KPICard;
