/**
 * DoctorDirectory.tsx — SLMC Verification Queue + Doctor CRM
 *
 * Searchable data table of all registered doctors.
 * PDPA: shows only metadata (name, email, SLMC, hospital, status).
 * NEVER queries clinical_notes, transactions, or voice_vault sub-collections.
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';

interface DoctorRecord {
    id: string;
    name?: string;
    email?: string;
    slmc_number?: string;
    hospital?: string;
    phone?: string;
    status?: string;
    profession?: string;
    created_at?: any;
    verified_at?: any;
}

export default function DoctorDirectory() {
    const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [showOverrideModal, setShowOverrideModal] = useState<DoctorRecord | null>(null);

    useEffect(() => {
        // Real-time listener — PDPA safe: queries only root user docs, not sub-collections
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            const docs: DoctorRecord[] = snap.docs.map(d => ({
                id: d.id,
                ...d.data(),
            }));
            setDoctors(docs);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filteredDoctors = doctors
        .filter(d => {
            if (filter === 'pending') return d.status === 'pending_verification';
            if (filter === 'active') return d.status === 'active';
            if (filter === 'suspended') return d.status === 'suspended';
            return true;
        })
        .filter(d => {
            if (!search) return true;
            const q = search.toLowerCase();
            return (
                (d.name || '').toLowerCase().includes(q) ||
                (d.email || '').toLowerCase().includes(q) ||
                (d.slmc_number || '').toLowerCase().includes(q) ||
                (d.hospital || '').toLowerCase().includes(q)
            );
        });

    const handleApprove = async (userId: string) => {
        setActionLoading(userId);
        try {
            await updateDoc(doc(db, 'users', userId), {
                status: 'active',
                verified_at: serverTimestamp(),
            });
        } catch (err) {
            console.error('Approve error:', err);
        }
        setActionLoading(null);
    };

    const handleSuspend = async (userId: string) => {
        setActionLoading(userId);
        try {
            await updateDoc(doc(db, 'users', userId), {
                status: 'suspended',
                suspended_at: serverTimestamp(),
            });
        } catch (err) {
            console.error('Suspend error:', err);
        }
        setActionLoading(null);
    };

    const handleReactivate = async (userId: string) => {
        setActionLoading(userId);
        try {
            await updateDoc(doc(db, 'users', userId), {
                status: 'active',
            });
        } catch (err) {
            console.error('Reactivate error:', err);
        }
        setActionLoading(null);
    };

    const handleOverride = async (userId: string, tier: string) => {
        setActionLoading(userId);
        try {
            const functions = getFunctions(undefined, 'asia-south1');
            const overrideFn = httpsCallable(functions, 'overrideSubscription');
            await overrideFn({ userId, tier, reason: 'Admin manual override' });
        } catch (err) {
            console.error('Override error:', err);
        }
        setActionLoading(null);
        setShowOverrideModal(null);
    };

    const s: Record<string, React.CSSProperties> = {
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            flexWrap: 'wrap' as const,
            gap: '1rem',
        },
        searchBar: {
            display: 'flex',
            gap: '0.5rem',
            flex: 1,
            maxWidth: '600px',
        },
        input: {
            flex: 1,
            padding: '0.6rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
        },
        filterGroup: {
            display: 'flex',
            gap: '0.25rem',
        },
        filterBtn: {
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.4rem',
            color: '#94a3b8',
            fontSize: '0.75rem',
            fontWeight: 600,
            cursor: 'pointer',
        },
        filterBtnActive: {
            background: 'rgba(99,102,241,0.2)',
            borderColor: 'rgba(99,102,241,0.4)',
            color: '#c7d2fe',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse' as const,
        },
        th: {
            textAlign: 'left' as const,
            padding: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.05em',
        },
        td: {
            padding: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.8rem',
            color: '#e2e8f0',
        },
        statusBadge: {
            padding: '0.2rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.65rem',
            fontWeight: 700,
        },
        actionBtn: {
            padding: '0.35rem 0.6rem',
            borderRadius: '0.35rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
            marginRight: '0.25rem',
        },
        card: {
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '1rem',
            padding: '1rem',
            overflow: 'auto' as const,
        },
        modal: {
            position: 'fixed' as const,
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
        },
        modalCard: {
            background: '#1e1b4b',
            border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%',
        },
    };

    const statusColors: Record<string, { bg: string; color: string }> = {
        active: { bg: 'rgba(52,211,153,0.2)', color: '#34d399' },
        pending_verification: { bg: 'rgba(251,191,36,0.2)', color: '#fbbf24' },
        suspended: { bg: 'rgba(248,113,113,0.2)', color: '#f87171' },
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#a5b4fc' }}>
                Loading doctors...
            </div>
        );
    }

    return (
        <div>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                🏥 Doctor Directory & SLMC Verification
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                🔒 PDPA Safe — Showing metadata only. No clinical data or bank details.
            </p>

            <div style={s.header}>
                <div style={s.searchBar}>
                    <input
                        style={s.input}
                        placeholder="🔍 Search name, email, SLMC, hospital..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={s.filterGroup}>
                    {(['all', 'pending', 'active', 'suspended'] as const).map(f => (
                        <button
                            key={f}
                            style={{ ...s.filterBtn, ...(filter === f ? s.filterBtnActive : {}) }}
                            onClick={() => setFilter(f)}
                        >
                            {f === 'all' && `All (${doctors.length})`}
                            {f === 'pending' && `⏳ Pending (${doctors.filter(d => d.status === 'pending_verification').length})`}
                            {f === 'active' && `✅ Active (${doctors.filter(d => d.status === 'active').length})`}
                            {f === 'suspended' && `🚫 Suspended (${doctors.filter(d => d.status === 'suspended').length})`}
                        </button>
                    ))}
                </div>
            </div>

            <div style={s.card}>
                <table style={s.table}>
                    <thead>
                        <tr>
                            <th style={s.th}>Name</th>
                            <th style={s.th}>Email</th>
                            <th style={s.th}>SLMC #</th>
                            <th style={s.th}>Hospital</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDoctors.map(doc => {
                            const sc = statusColors[doc.status || 'active'] || statusColors.active;
                            return (
                                <tr key={doc.id}>
                                    <td style={s.td}>{doc.name || '—'}</td>
                                    <td style={{ ...s.td, color: '#94a3b8' }}>{doc.email || '—'}</td>
                                    <td style={s.td}>{doc.slmc_number || '—'}</td>
                                    <td style={s.td}>{doc.hospital || '—'}</td>
                                    <td style={s.td}>
                                        <span style={{
                                            ...s.statusBadge,
                                            background: sc.bg,
                                            color: sc.color,
                                        }}>
                                            {doc.status || 'active'}
                                        </span>
                                    </td>
                                    <td style={s.td}>
                                        {doc.status === 'pending_verification' && (
                                            <button
                                                style={{ ...s.actionBtn, background: '#34d399', color: '#000' }}
                                                onClick={() => handleApprove(doc.id)}
                                                disabled={actionLoading === doc.id}
                                            >
                                                {actionLoading === doc.id ? '...' : '✅ Approve'}
                                            </button>
                                        )}
                                        {doc.status === 'active' && (
                                            <button
                                                style={{ ...s.actionBtn, background: 'rgba(248,113,113,0.2)', color: '#f87171' }}
                                                onClick={() => handleSuspend(doc.id)}
                                                disabled={actionLoading === doc.id}
                                            >
                                                {actionLoading === doc.id ? '...' : '🚫 Suspend'}
                                            </button>
                                        )}
                                        {doc.status === 'suspended' && (
                                            <button
                                                style={{ ...s.actionBtn, background: 'rgba(52,211,153,0.2)', color: '#34d399' }}
                                                onClick={() => handleReactivate(doc.id)}
                                                disabled={actionLoading === doc.id}
                                            >
                                                {actionLoading === doc.id ? '...' : '🔓 Reactivate'}
                                            </button>
                                        )}
                                        <button
                                            style={{ ...s.actionBtn, background: 'rgba(167,139,250,0.2)', color: '#a78bfa' }}
                                            onClick={() => setShowOverrideModal(doc)}
                                        >
                                            ⚡ Plan
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {filteredDoctors.length === 0 && (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                        No doctors match your search.
                    </p>
                )}
            </div>

            {/* Override Subscription Modal */}
            {showOverrideModal && (
                <div style={s.modal} onClick={() => setShowOverrideModal(null)}>
                    <div style={s.modalCard} onClick={e => e.stopPropagation()}>
                        <h3 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.1rem' }}>
                            ⚡ Override Subscription
                        </h3>
                        <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 1.5rem' }}>
                            {showOverrideModal.name || showOverrideModal.email}
                        </p>

                        {(['free', 'pro', 'lifetime'] as const).map(tier => (
                            <button
                                key={tier}
                                style={{
                                    display: 'block',
                                    width: '100%',
                                    padding: '0.75rem',
                                    marginBottom: '0.5rem',
                                    background: tier === 'lifetime' ? 'rgba(167,139,250,0.2)' : tier === 'pro' ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '0.5rem',
                                    color: '#fff',
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    textAlign: 'left' as const,
                                }}
                                onClick={() => handleOverride(showOverrideModal.id, tier)}
                                disabled={actionLoading === showOverrideModal.id}
                            >
                                {tier === 'free' && '🆓 Free Plan'}
                                {tier === 'pro' && '⭐ Pro Plan (1 year)'}
                                {tier === 'lifetime' && '💎 Lifetime Pro (Forever)'}
                            </button>
                        ))}

                        <button
                            style={{ ...s.actionBtn, marginTop: '0.5rem', color: '#94a3b8', background: 'none' }}
                            onClick={() => setShowOverrideModal(null)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
