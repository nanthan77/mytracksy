/**
 * AIUsageMonitor.tsx — OpenAI Cost & Voice Note Usage Tracker
 *
 * Shows aggregate AI usage stats per user — PDPA safe.
 * Never reads actual voice notes or transcriptions.
 */

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserUsage {
    id: string;
    name?: string;
    email?: string;
    voiceNotesUsed: number;
    estimatedCost: number;  // USD estimate
    tier: string;
    aiDisabled?: boolean;
}

// Rough cost estimates based on OpenAI Whisper pricing
const COST_PER_MINUTE = 0.006;  // $0.006/min for Whisper
const AVG_NOTE_MINUTES = 2;      // Average voice note length

export default function AIUsageMonitor() {
    const [users, setUsers] = useState<UserUsage[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCost, setTotalCost] = useState(0);
    const [totalNotes, setTotalNotes] = useState(0);

    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                const usageData: UserUsage[] = [];

                for (const userDoc of usersSnap.docs) {
                    const data = userDoc.data();

                    // Get usage quota — PDPA safe (count only, no content)
                    const quotaSnap = await getDoc(doc(db, `users/${userDoc.id}/usage_quotas/current_month`));
                    const notesUsed = quotaSnap.exists() ? quotaSnap.data()?.ai_voice_notes_used || 0 : 0;

                    // Get subscription tier
                    const subSnap = await getDoc(doc(db, `users/${userDoc.id}/subscription/current`));
                    const tier = subSnap.exists() ? subSnap.data()?.tier || 'free' : 'free';

                    const cost = notesUsed * AVG_NOTE_MINUTES * COST_PER_MINUTE;

                    usageData.push({
                        id: userDoc.id,
                        name: data.name || data.displayName,
                        email: data.email,
                        voiceNotesUsed: notesUsed,
                        estimatedCost: cost,
                        tier,
                        aiDisabled: data.ai_disabled || false,
                    });
                }

                // Sort by voice notes used (heavy users first)
                usageData.sort((a, b) => b.voiceNotesUsed - a.voiceNotesUsed);

                const totalNotes = usageData.reduce((sum, u) => sum + u.voiceNotesUsed, 0);
                const totalCost = usageData.reduce((sum, u) => sum + u.estimatedCost, 0);

                setUsers(usageData);
                setTotalNotes(totalNotes);
                setTotalCost(totalCost);
            } catch (err) {
                console.error('Usage fetch error:', err);
            }
            setLoading(false);
        };

        fetchUsage();
    }, []);

    const toggleAI = async (userId: string, disable: boolean) => {
        try {
            await updateDoc(doc(db, 'users', userId), { ai_disabled: disable });
            setUsers(prev => prev.map(u =>
                u.id === userId ? { ...u, aiDisabled: disable } : u
            ));
        } catch (err) {
            console.error('Toggle AI error:', err);
        }
    };

    const s: Record<string, React.CSSProperties> = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
        },
        kpi: {
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '1rem',
            padding: '1.25rem',
        },
        kpiLabel: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, margin: 0 },
        kpiValue: { color: '#fff', fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0' },
        card: {
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '1rem',
            padding: '1rem',
            overflow: 'auto' as const,
        },
        th: {
            textAlign: 'left' as const,
            padding: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            color: '#94a3b8',
            fontSize: '0.7rem',
            fontWeight: 600,
            textTransform: 'uppercase' as const,
        },
        td: {
            padding: '0.75rem',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.8rem',
            color: '#e2e8f0',
        },
        alertBadge: {
            background: 'rgba(248,113,113,0.2)',
            color: '#f87171',
            padding: '0.2rem 0.5rem',
            borderRadius: '1rem',
            fontSize: '0.65rem',
            fontWeight: 700,
        },
        toggleBtn: {
            padding: '0.35rem 0.6rem',
            borderRadius: '0.35rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            cursor: 'pointer',
            border: 'none',
        },
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: '#a5b4fc' }}>Loading AI usage data...</div>;
    }

    // Determine heavy users (> 20 notes/month)
    const heavyUsers = users.filter(u => u.voiceNotesUsed > 20);

    return (
        <div>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                🤖 AI Usage & Cost Monitor
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                OpenAI Whisper API cost tracking. PDPA Safe — shows usage counts only.
            </p>

            {/* KPIs */}
            <div style={s.grid}>
                <div style={s.kpi}>
                    <p style={s.kpiLabel}>🎙️ Total Voice Notes</p>
                    <h2 style={s.kpiValue}>{totalNotes}</h2>
                </div>
                <div style={s.kpi}>
                    <p style={s.kpiLabel}>💵 Est. API Cost (USD)</p>
                    <h2 style={{ ...s.kpiValue, color: '#34d399' }}>${totalCost.toFixed(2)}</h2>
                </div>
                <div style={s.kpi}>
                    <p style={s.kpiLabel}>⚠️ Heavy Users</p>
                    <h2 style={{ ...s.kpiValue, color: heavyUsers.length > 0 ? '#f87171' : '#34d399' }}>
                        {heavyUsers.length}
                    </h2>
                </div>
                <div style={s.kpi}>
                    <p style={s.kpiLabel}>📊 Avg Notes/User</p>
                    <h2 style={s.kpiValue}>
                        {users.length > 0 ? (totalNotes / users.length).toFixed(1) : '0'}
                    </h2>
                </div>
            </div>

            {/* Heavy Users Alert */}
            {heavyUsers.length > 0 && (
                <div style={{
                    background: 'rgba(248,113,113,0.1)',
                    border: '1px solid rgba(248,113,113,0.2)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                }}>
                    <h3 style={{ color: '#fca5a5', fontSize: '0.9rem', fontWeight: 700, margin: '0 0 0.5rem' }}>
                        🚨 Heavy Users Alert ({heavyUsers.length})
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.75rem', margin: 0 }}>
                        These users have exceeded 20 voice notes this month. Review for potential abuse.
                    </p>
                </div>
            )}

            {/* Usage Table */}
            <div style={s.card}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr>
                            <th style={s.th}>User</th>
                            <th style={s.th}>Tier</th>
                            <th style={s.th}>Notes/Month</th>
                            <th style={s.th}>Est. Cost</th>
                            <th style={s.th}>Status</th>
                            <th style={s.th}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id}>
                                <td style={s.td}>
                                    <div>{u.name || '—'}</div>
                                    <div style={{ color: '#64748b', fontSize: '0.7rem' }}>{u.email}</div>
                                </td>
                                <td style={s.td}>
                                    <span style={{
                                        background: u.tier === 'pro' ? 'rgba(167,139,250,0.2)' : 'rgba(255,255,255,0.05)',
                                        color: u.tier === 'pro' ? '#a78bfa' : '#94a3b8',
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '1rem',
                                        fontSize: '0.65rem',
                                        fontWeight: 700,
                                    }}>
                                        {u.tier.toUpperCase()}
                                    </span>
                                </td>
                                <td style={s.td}>
                                    <span>{u.voiceNotesUsed}</span>
                                    {u.voiceNotesUsed > 20 && (
                                        <span style={{ ...s.alertBadge, marginLeft: '0.5rem' }}>HIGH</span>
                                    )}
                                </td>
                                <td style={s.td}>${u.estimatedCost.toFixed(3)}</td>
                                <td style={s.td}>
                                    {u.aiDisabled ? (
                                        <span style={{ color: '#f87171', fontSize: '0.75rem' }}>🔴 Disabled</span>
                                    ) : (
                                        <span style={{ color: '#34d399', fontSize: '0.75rem' }}>🟢 Active</span>
                                    )}
                                </td>
                                <td style={s.td}>
                                    <button
                                        style={{
                                            ...s.toggleBtn,
                                            background: u.aiDisabled ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)',
                                            color: u.aiDisabled ? '#34d399' : '#f87171',
                                        }}
                                        onClick={() => toggleAI(u.id, !u.aiDisabled)}
                                    >
                                        {u.aiDisabled ? '✅ Enable AI' : '🚫 Disable AI'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {users.length === 0 && (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem', fontSize: '0.85rem' }}>
                        No usage data available yet.
                    </p>
                )}
            </div>
        </div>
    );
}
