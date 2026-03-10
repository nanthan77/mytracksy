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
    transactions, title = 'Recent Transactions', showFilter = true,
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
            `}</style>

            <div style={{
                background: 'white', borderRadius: 14, overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
                border: '1px solid rgba(226,232,240,0.8)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '16px 20px', borderBottom: '1px solid #f1f5f9',
                }}>
                    <h3 style={{
                        margin: 0, fontSize: 15, fontWeight: 650, color: '#0f172a',
                        fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em',
                    }}>{title}</h3>
                    {showFilter && (
                        <div style={{ display: 'flex', gap: 4 }}>
                            {(['all', 'income', 'expense'] as const).map(f => (
                                <button key={f} onClick={() => setFilter(f)}
                                    className={`txn-filter-btn ${filter === f ? 'active' : ''}`}>
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
                    <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                        {filtered.map(t => (
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
                        ))}
                    </div>
                )}
            </div>
        </>
    );
};

export default TransactionList;
