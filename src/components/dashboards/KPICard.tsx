import React from 'react';

interface KPICardProps {
    icon: string;
    label: string;
    value: string;
    change?: string;
    changeType?: 'up' | 'down' | 'neutral';
    color?: string;
}

const KPICard: React.FC<KPICardProps> = ({
    icon,
    label,
    value,
    change,
    changeType = 'neutral',
    color = '#6366f1',
}) => {
    const changeColor =
        changeType === 'up' ? '#22c55e' : changeType === 'down' ? '#ef4444' : '#94a3b8';
    const changeIcon =
        changeType === 'up' ? '↑' : changeType === 'down' ? '↓' : '';

    return (
        <div style={styles.card}>
            <div style={styles.header}>
                <div style={{ ...styles.iconCircle, background: `${color}18` }}>
                    <span style={{ fontSize: '1.3rem' }}>{icon}</span>
                </div>
                {change && (
                    <span style={{ ...styles.change, color: changeColor }}>
                        {changeIcon} {change}
                    </span>
                )}
            </div>
            <div style={styles.value}>{value}</div>
            <div style={styles.label}>{label}</div>
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    card: {
        background: 'white',
        borderRadius: 12,
        padding: '1.25rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        transition: 'box-shadow 0.2s ease',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '0.75rem',
    },
    iconCircle: {
        width: 42,
        height: 42,
        borderRadius: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    change: {
        fontSize: '0.78rem',
        fontWeight: 600,
    },
    value: {
        fontSize: '1.6rem',
        fontWeight: 700,
        color: '#1e293b',
        marginBottom: 4,
    },
    label: {
        fontSize: '0.82rem',
        color: '#94a3b8',
        fontWeight: 500,
    },
};

export default KPICard;
