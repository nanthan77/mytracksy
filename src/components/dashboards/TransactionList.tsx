import React, { useState } from 'react';

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: string;
    status?: 'completed' | 'pending' | 'overdue' | 'paid';
}

interface TransactionListProps {
    transactions: Transaction[];
    title?: string;
    showFilter?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
    transactions,
    title = 'Recent Transactions',
    showFilter = true,
}) => {
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');

    const filtered =
        filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);

    const formatCurrency = (amount: number) =>
        `LKR ${amount.toLocaleString('en-LK')}`;

    const statusColors: Record<string, string> = {
        completed: '#22c55e',
        pending: '#f59e0b',
        overdue: '#ef4444',
        paid: '#22c55e',
    };

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <h3 style={styles.title}>{title}</h3>
                {showFilter && (
                    <div style={styles.filters}>
                        {(['all', 'income', 'expense'] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    ...styles.filterBtn,
                                    ...(filter === f ? styles.filterBtnActive : {}),
                                }}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {filtered.length === 0 ? (
                <div style={styles.empty}>No transactions yet. Add your first one!</div>
            ) : (
                <div style={styles.list}>
                    {filtered.map((t) => (
                        <div key={t.id} style={styles.row}>
                            <div style={styles.rowLeft}>
                                <div
                                    style={{
                                        ...styles.typeIcon,
                                        background:
                                            t.type === 'income'
                                                ? 'rgba(34,197,94,0.1)'
                                                : 'rgba(239,68,68,0.1)',
                                        color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                    }}
                                >
                                    {t.type === 'income' ? '↓' : '↑'}
                                </div>
                                <div>
                                    <div style={styles.rowDesc}>{t.description}</div>
                                    <div style={styles.rowMeta}>
                                        {t.category} · {t.date}
                                    </div>
                                </div>
                            </div>
                            <div style={styles.rowRight}>
                                <div
                                    style={{
                                        ...styles.rowAmount,
                                        color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                    }}
                                >
                                    {t.type === 'income' ? '+' : '-'}
                                    {formatCurrency(t.amount)}
                                </div>
                                {t.status && (
                                    <div
                                        style={{
                                            ...styles.statusBadge,
                                            color: statusColors[t.status] || '#94a3b8',
                                            background: `${statusColors[t.status] || '#94a3b8'}15`,
                                        }}
                                    >
                                        {t.status}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        border: '1px solid #f1f5f9',
        overflow: 'hidden',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid #f1f5f9',
    },
    title: {
        margin: 0,
        fontSize: '1rem',
        fontWeight: 600,
        color: '#1e293b',
    },
    filters: {
        display: 'flex',
        gap: 4,
    },
    filterBtn: {
        padding: '4px 12px',
        border: '1px solid #e2e8f0',
        borderRadius: 6,
        background: 'white',
        color: '#64748b',
        fontSize: '0.78rem',
        cursor: 'pointer',
        fontWeight: 500,
    },
    filterBtnActive: {
        background: '#6366f1',
        color: 'white',
        borderColor: '#6366f1',
    },
    list: {
        maxHeight: 400,
        overflowY: 'auto' as const,
    },
    row: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.85rem 1.25rem',
        borderBottom: '1px solid #f8fafc',
        transition: 'background 0.15s ease',
    },
    rowLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    typeIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '1rem',
        flexShrink: 0,
    },
    rowDesc: {
        fontSize: '0.88rem',
        fontWeight: 500,
        color: '#1e293b',
    },
    rowMeta: {
        fontSize: '0.75rem',
        color: '#94a3b8',
        marginTop: 2,
    },
    rowRight: {
        textAlign: 'right' as const,
    },
    rowAmount: {
        fontSize: '0.9rem',
        fontWeight: 600,
    },
    statusBadge: {
        fontSize: '0.7rem',
        fontWeight: 600,
        padding: '2px 8px',
        borderRadius: 10,
        marginTop: 4,
        display: 'inline-block',
        textTransform: 'capitalize' as const,
    },
    empty: {
        padding: '2rem',
        textAlign: 'center' as const,
        color: '#94a3b8',
        fontSize: '0.9rem',
    },
};

export default TransactionList;
