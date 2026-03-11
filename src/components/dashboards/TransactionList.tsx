import React, { useState } from 'react';

export interface Transaction {
    id: string;
    type: 'income' | 'expense';
    amount: number;
    description: string;
    category: string;
    date: string;
    status?: 'completed' | 'pending' | 'overdue' | 'paid' | 'received';
}

interface TransactionListProps {
    transactions: Transaction[];
    title?: string;
    showFilter?: boolean;
    compact?: boolean;
}

const TransactionList: React.FC<TransactionListProps> = ({
    transactions, title = 'Recent Transactions', showFilter = true, compact = false,
}) => {
    const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
    const filtered = filter === 'all' ? transactions : transactions.filter(t => t.type === filter);
    const fmt = (amount: number) => `LKR ${amount.toLocaleString('en-LK')}`;

    const statusConfig: Record<string, { color: string; bg: string }> = {
        completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
        paid: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        overdue: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    };

    return (
        <>
            <style>{`
                .txn-filter-btn { padding: 5px 14px; border: 1px solid #e2e8f0; border-radius: 7px; background: white; color: #64748b; font-size: 12.5px; font-family: 'Inter', sans-serif; font-weight: 500; cursor: pointer; transition: all 0.2s ease; }
                .txn-filter-btn:hover { background: #f8fafc; border-color: #cbd5e1; }
                .txn-filter-btn.active { background: #6366f1; color: white; border-color: #6366f1; box-shadow: 0 2px 6px rgba(99,102,241,0.25); }
                .txn-row { display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-bottom: 1px solid rgba(241,245,249,0.8); transition: background 0.15s ease; }
                .txn-row:hover { background: rgba(248,250,252,0.8); }
                .txn-row:last-child { border-bottom: none; }
                .txn-filter-compact { padding: 4px 12px; font-size: 11.5px; min-width: unset; min-height: 34px; }
            `}</style>

            <div style={{
                background: 'white', borderRadius: compact ? 18 : 14, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                border: '1px solid rgba(226,232,240,0.8)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: compact ? '14px 16px' : '16px 20px', borderBottom: '1px solid #f1f5f9',
                    gap: 12,
                    flexWrap: compact ? 'wrap' : 'nowrap',
                }}>
                    <h3 style={{
                        margin: 0, fontSize: compact ? 14 : 15, fontWeight: 650, color: '#0f172a',
                        fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em',
                    }}>{title}</h3>
                    {showFilter && (
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {(['all', 'income', 'expense'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`txn-filter-btn ${compact ? 'txn-filter-compact' : ''} ${filter === f ? 'active' : ''}`}>
                                    {f.charAt(0).toUpperCase() + f.slice(1)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* List */}
                {filtered.length === 0 ? (
                    <div style={{
                        padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8', fontSize: 14,
                    }}>
                        <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                        No transactions yet
                    </div>
                ) : (
                    <div style={{ maxHeight: compact ? 'none' : 420, overflowY: compact ? 'visible' : 'auto', padding: compact ? 12 : 0 }}>
                        {filtered.map(t => (
                            compact ? (
                                <div key={t.id} style={{
                                    padding: '13px 14px',
                                    borderRadius: 14,
                                    background: '#f8fafc',
                                    border: '1px solid rgba(226,232,240,0.9)',
                                    marginBottom: 10,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 10,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontWeight: 700, fontSize: 15, flexShrink: 0,
                                                background: t.type === 'income' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                                color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                            }}>
                                                {t.type === 'income' ? '↓' : '↑'}
                                            </div>
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1e293b', letterSpacing: '-0.01em' }}>{t.description}</div>
                                                <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>{t.category}</div>
                                            </div>
                                        </div>
                                        <div style={{
                                            fontSize: 13.5, fontWeight: 700, letterSpacing: '-0.01em', flexShrink: 0,
                                            color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                        }}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                                        <div style={{ fontSize: 11.5, color: '#64748b' }}>{t.date}</div>
                                        {t.status && (
                                            <div style={{
                                                fontSize: 10.5, fontWeight: 700, padding: '3px 8px', borderRadius: 999,
                                                display: 'inline-block', textTransform: 'capitalize',
                                                color: statusConfig[t.status]?.color || '#94a3b8',
                                                background: statusConfig[t.status]?.bg || 'rgba(148,163,184,0.08)',
                                            }}>{t.status}</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div key={t.id} className="txn-row">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: 10,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: 16, flexShrink: 0,
                                            background: t.type === 'income' ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                            color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                        }}>
                                            {t.type === 'income' ? '↓' : '↑'}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: 14, fontWeight: 500, color: '#1e293b', letterSpacing: '-0.01em' }}>{t.description}</div>
                                            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, fontWeight: 400 }}>{t.category} · {t.date}</div>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                                            color: t.type === 'income' ? '#22c55e' : '#ef4444',
                                        }}>
                                            {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                                        </div>
                                        {t.status && (
                                            <div style={{
                                                fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 6,
                                                marginTop: 4, display: 'inline-block', textTransform: 'capitalize',
                                                color: statusConfig[t.status]?.color || '#94a3b8',
                                                background: statusConfig[t.status]?.bg || 'rgba(148,163,184,0.08)',
                                            }}>{t.status}</div>
                                        )}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default TransactionList;
