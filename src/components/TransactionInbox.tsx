/**
 * TransactionInbox — Swipe-to-approve pending transactions
 *
 * Shows a card-based inbox of pending_review transactions.
 * Swipe right (or tap ✅) = Cleared | Swipe left (or tap ❌) = Ignored.
 * Sources are badged: 📧 Email, 🎤 Voice, 📸 Receipt, ✏️ Manual
 */

import React, { useState, useRef, useEffect } from 'react';
import {
    subscribePendingReview,
    approveTransaction,
    ignoreTransaction,
    formatLKR,
    type UniversalTransaction,
} from '../services/accountingCoreService';

interface TransactionInboxProps {
    uid?: string;
}

const SOURCE_BADGES: Record<string, { icon: string; label: string; color: string }> = {
    email_auto_sync: { icon: '📧', label: 'Email', color: '#6366f1' },
    voice_ai: { icon: '🎤', label: 'Voice', color: '#f59e0b' },
    receipt_scan: { icon: '📸', label: 'Receipt', color: '#10b981' },
    manual_entry: { icon: '✏️', label: 'Manual', color: '#64748b' },
};

interface SwipeableCardProps {
    txn: UniversalTransaction;
    onApprove: () => void;
    onIgnore: () => void;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({ txn, onApprove, onIgnore }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const [startX, setStartX] = useState(0);
    const [dismissed, setDismissed] = useState(false);

    const badge = SOURCE_BADGES[txn.source] || SOURCE_BADGES.manual_entry;
    const isIncome = txn.type === 'income';

    const handleTouchStart = (e: React.TouchEvent) => {
        setStartX(e.touches[0].clientX);
        setIsSwiping(true);
    };
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isSwiping) return;
        const diff = e.touches[0].clientX - startX;
        setOffset(diff);
    };
    const handleTouchEnd = () => {
        setIsSwiping(false);
        if (offset > 100) {
            setDismissed(true);
            setTimeout(onApprove, 300);
        } else if (offset < -100) {
            setDismissed(true);
            setTimeout(onIgnore, 300);
        } else {
            setOffset(0);
        }
    };

    const bgColor = offset > 60 ? 'rgba(34,197,94,0.15)' :
        offset < -60 ? 'rgba(239,68,68,0.15)' : 'white';

    if (dismissed) return null;

    return (
        <div
            ref={cardRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
                background: bgColor,
                borderRadius: 14,
                padding: '16px 20px',
                marginBottom: 10,
                border: '1px solid rgba(226,232,240,0.8)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                transform: `translateX(${offset}px)`,
                transition: isSwiping ? 'none' : 'all 0.3s ease',
                opacity: dismissed ? 0 : 1,
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Swipe hints */}
            {offset > 30 && (
                <div style={{
                    position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 24, opacity: Math.min(offset / 100, 1),
                }}>✅</div>
            )}
            {offset < -30 && (
                <div style={{
                    position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 24, opacity: Math.min(Math.abs(offset) / 100, 1),
                }}>❌</div>
            )}

            {/* Source badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span style={{
                    fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                    background: `${badge.color}15`, color: badge.color,
                    fontFamily: "'Inter', sans-serif",
                }}>
                    {badge.icon} {badge.label}
                </span>
                <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: "'Inter', sans-serif" }}>
                    {txn.date}
                </span>
            </div>

            {/* Amount + Vendor */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{
                        fontSize: 16, fontWeight: 700, color: isIncome ? '#22c55e' : '#ef4444',
                        fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em',
                    }}>
                        {isIncome ? '+' : '-'}{formatLKR(txn.amount_cents)}
                    </div>
                    <div style={{
                        fontSize: 13, color: '#475569', fontWeight: 500, marginTop: 2,
                        fontFamily: "'Inter', sans-serif",
                    }}>
                        {txn.vendor || txn.description}
                    </div>
                    {txn.category_name && (
                        <div style={{ fontSize: 11.5, color: '#94a3b8', marginTop: 2 }}>
                            {txn.category_name}
                        </div>
                    )}
                </div>

                {/* Action buttons (for non-touch devices) */}
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDismissed(true); setTimeout(onApprove, 200); }}
                        style={{
                            width: 38, height: 38, borderRadius: 10, border: 'none',
                            background: 'rgba(34,197,94,0.1)', color: '#22c55e',
                            fontSize: 18, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title="Approve"
                    >✓</button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setDismissed(true); setTimeout(onIgnore, 200); }}
                        style={{
                            width: 38, height: 38, borderRadius: 10, border: 'none',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            fontSize: 18, cursor: 'pointer', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        title="Ignore"
                    >✕</button>
                </div>
            </div>
        </div>
    );
};

// ════════════════════════════════════════════════════════════════

const TransactionInbox: React.FC<TransactionInboxProps> = ({ uid }) => {
    const [pending, setPending] = useState<UniversalTransaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!uid) { setLoading(false); return; }
        setLoading(true);
        const unsub = subscribePendingReview(uid, (txns) => {
            setPending(txns);
            setLoading(false);
        });
        return unsub;
    }, [uid]);

    const handleApprove = async (txnId: string) => {
        if (!uid || !txnId) return;
        try {
            await approveTransaction(uid, txnId);
        } catch (err) {
            console.error('Failed to approve transaction:', err);
        }
    };

    const handleIgnore = async (txnId: string) => {
        if (!uid || !txnId) return;
        try {
            await ignoreTransaction(uid, txnId);
        } catch (err) {
            console.error('Failed to ignore transaction:', err);
        }
    };

    if (!uid) {
        return (
            <div style={{
                padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8',
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
                <div style={{ fontSize: 14 }}>Sign in to see your transaction inbox</div>
            </div>
        );
    }

    if (loading) {
        return (
            <div style={{
                padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8',
                fontFamily: "'Inter', sans-serif",
            }}>
                <div style={{ fontSize: 14 }}>Loading inbox...</div>
            </div>
        );
    }

    return (
        <div style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                .inbox-header {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 16px;
                }
                .inbox-badge {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    color: white; font-size: 12px; font-weight: 600;
                    padding: 4px 12px; border-radius: 20px;
                    box-shadow: 0 2px 8px rgba(99,102,241,0.3);
                }
                .inbox-hint {
                    font-size: 12px; color: #94a3b8; margin-bottom: 12px;
                    display: flex; align-items: center; gap: 6px;
                }
            `}</style>

            <div className="inbox-header">
                <h3 style={{
                    margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a',
                    letterSpacing: '-0.01em',
                }}>
                    📥 Transaction Inbox
                </h3>
                {pending.length > 0 && (
                    <span className="inbox-badge">
                        {pending.length} pending
                    </span>
                )}
            </div>

            {pending.length > 0 && (
                <div className="inbox-hint">
                    💡 Swipe right to approve, left to ignore
                </div>
            )}

            {pending.length === 0 ? (
                <div style={{
                    padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8',
                    background: 'white', borderRadius: 14,
                    border: '1px solid rgba(226,232,240,0.8)',
                }}>
                    <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>All caught up!</div>
                    <div style={{ fontSize: 12, marginTop: 4 }}>No pending transactions to review</div>
                </div>
            ) : (
                <div>
                    {pending.map(txn => (
                        <SwipeableCard
                            key={txn.id}
                            txn={txn}
                            onApprove={() => handleApprove(txn.id!)}
                            onIgnore={() => handleIgnore(txn.id!)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TransactionInbox;
