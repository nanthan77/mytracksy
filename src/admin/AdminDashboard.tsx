/**
 * AdminDashboard.tsx — KPI Overview
 *
 * Shows: Total users, Active Pro subs, MRR, Pending verifications, AI usage.
 * PDPA Safe: only aggregate counts, never individual clinical data.
 */

import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, getDoc, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

interface AdminStats {
    totalUsers: number;
    activeUsers: number;
    pendingVerification: number;
    suspendedUsers: number;
    proUsers: number;
    freeUsers: number;
    totalVoiceNotesThisMonth: number;
    mrr: number;
    professionBreakdown: Record<string, number>;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [recentAudit, setRecentAudit] = useState<any[]>([]);

    useEffect(() => {
        // Fetch stats by aggregating user data — PDPA safe (metadata only)
        const fetchStats = async () => {
            try {
                const usersSnap = await getDocs(collection(db, 'users'));
                let totalUsers = 0, activeUsers = 0, pendingVerification = 0;
                let suspendedUsers = 0, proUsers = 0, totalVoiceNotes = 0, mrr = 0;
                const professionBreakdown: Record<string, number> = {};

                for (const userDoc of usersSnap.docs) {
                    totalUsers++;
                    const data = userDoc.data();
                    if (data.status === 'active') activeUsers++;
                    else if (data.status === 'pending_verification') pendingVerification++;
                    else if (data.status === 'suspended') suspendedUsers++;

                    // Track profession breakdown
                    const prof = data.profession || 'individual';
                    professionBreakdown[prof] = (professionBreakdown[prof] || 0) + 1;

                    // Check subscription & compute MRR dynamically
                    const subSnap = await getDoc(doc(db, `users/${userDoc.id}/subscription/current`));
                    if (subSnap.exists()) {
                        const subData = subSnap.data();
                        if (subData?.status === 'active' && subData?.tier !== 'free') {
                            proUsers++;
                            mrr += (subData.amount_cents || 290000) / 100;
                        }
                    }

                    // Count voice notes
                    const quotaSnap = await getDoc(doc(db, `users/${userDoc.id}/usage_quotas/current_month`));
                    if (quotaSnap.exists()) {
                        totalVoiceNotes += quotaSnap.data()?.ai_voice_notes_used || 0;
                    }
                }

                setStats({
                    totalUsers,
                    activeUsers,
                    pendingVerification,
                    suspendedUsers,
                    proUsers,
                    freeUsers: activeUsers - proUsers,
                    totalVoiceNotesThisMonth: totalVoiceNotes,
                    mrr: mrr || proUsers * 2900,
                    professionBreakdown,
                });
            } catch (err) {
                console.error('Stats fetch error:', err);
            }
            setLoading(false);
        };

        fetchStats();

        // Listen for recent audit log
        const auditQuery = query(collection(db, 'admin_audit_log'));
        const unsub = onSnapshot(auditQuery, (snap) => {
            const logs = snap.docs
                .map(d => ({ id: d.id, ...d.data() }))
                .sort((a: any, b: any) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
                .slice(0, 10);
            setRecentAudit(logs);
        });

        return () => unsub();
    }, []);

    const s: Record<string, React.CSSProperties> = {
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '2rem',
        },
        card: {
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '1rem',
            padding: '1.25rem',
            backdropFilter: 'blur(10px)',
        },
        cardLabel: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, margin: 0 },
        cardValue: { color: '#fff', fontSize: '2rem', fontWeight: 800, margin: '0.5rem 0 0' },
        cardSub: { color: '#a5b4fc', fontSize: '0.7rem', margin: '0.25rem 0 0' },
        sectionTitle: { color: '#c7d2fe', fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem' },
        auditRow: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.5rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.8rem',
        },
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#a5b4fc' }}>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
                <div>Loading admin dashboard...</div>
            </div>
        );
    }

    const kpis = [
        { icon: '👥', label: 'Total Users', value: stats?.totalUsers || 0, sub: 'Registered accounts' },
        { icon: '✅', label: 'Active Users', value: stats?.activeUsers || 0, sub: 'Verified & active', color: '#34d399' },
        { icon: '⏳', label: 'Pending SLMC', value: stats?.pendingVerification || 0, sub: 'Awaiting verification', color: '#fbbf24' },
        { icon: '⭐', label: 'Pro Users', value: stats?.proUsers || 0, sub: `MRR: LKR ${(stats?.mrr || 0).toLocaleString()}`, color: '#a78bfa' },
        { icon: '🆓', label: 'Free Users', value: stats?.freeUsers || 0, sub: 'Potential upgrades' },
        { icon: '🚫', label: 'Suspended', value: stats?.suspendedUsers || 0, sub: 'Account frozen', color: '#f87171' },
        { icon: '🎙️', label: 'Voice Notes', value: stats?.totalVoiceNotesThisMonth || 0, sub: 'AI calls this month' },
        { icon: '💰', label: 'Est. MRR', value: `LKR ${((stats?.mrr || 0) / 1000).toFixed(0)}K`, sub: 'Monthly recurring revenue', color: '#34d399' },
    ];

    return (
        <div>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '1.5rem' }}>
                📊 Admin Dashboard
            </h1>

            <div style={s.grid}>
                {kpis.map(kpi => (
                    <div key={kpi.label} style={s.card}>
                        <p style={s.cardLabel}>{kpi.icon} {kpi.label}</p>
                        <h2 style={{ ...s.cardValue, color: kpi.color || '#fff' }}>
                            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                        </h2>
                        <p style={s.cardSub}>{kpi.sub}</p>
                    </div>
                ))}
            </div>

            {/* Profession Breakdown */}
            <h2 style={s.sectionTitle}>👥 Users by Profession</h2>
            <div style={{ ...s.card, padding: '1rem', marginBottom: '2rem' }}>
                {Object.entries(stats?.professionBreakdown || {}).length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                        No users registered yet
                    </p>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(stats?.professionBreakdown || {})
                            .sort(([, a], [, b]) => b - a)
                            .map(([prof, count]) => (
                                <div key={prof} style={{
                                    background: 'rgba(99,102,241,0.1)',
                                    borderRadius: '0.5rem',
                                    padding: '0.6rem',
                                    textAlign: 'center',
                                    border: '1px solid rgba(139,92,246,0.2)',
                                }}>
                                    <div style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700 }}>{count}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'capitalize' as const }}>{prof}</div>
                                </div>
                            ))}
                    </div>
                )}
            </div>

            <h2 style={s.sectionTitle}>📝 Recent Admin Actions</h2>
            <div style={{ ...s.card, padding: '1rem' }}>
                {recentAudit.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                        No admin actions recorded yet
                    </p>
                ) : (
                    recentAudit.map((log: any) => (
                        <div key={log.id} style={s.auditRow}>
                            <span style={{ color: '#c7d2fe' }}>
                                {log.action === 'approve_doctor' && '✅ User Approved'}
                                {log.action === 'suspend_user' && '🚫 User Suspended'}
                                {log.action === 'override_subscription' && `🔄 Sub Override → ${log.new_tier}`}
                            </span>
                            <span style={{ color: '#64748b' }}>
                                {log.timestamp?.seconds
                                    ? new Date(log.timestamp.seconds * 1000).toLocaleString()
                                    : '—'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
