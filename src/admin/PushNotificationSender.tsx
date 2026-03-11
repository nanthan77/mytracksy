/**
 * PushNotificationSender.tsx — Bulk FCM Push Notification Sender
 *
 * Send targeted push notifications to All / Free / Pro users.
 * Logs send history in Firestore.
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';

interface PushLog {
    id: string;
    title: string;
    body: string;
    target: string;
    target_count: number;
    success_count: number;
    failure_count: number;
    sent_at?: any;
}

export default function PushNotificationSender() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [target, setTarget] = useState<'all' | 'free' | 'pro'>('all');
    const [sending, setSending] = useState(false);
    const [result, setResult] = useState<string>('');
    const [history, setHistory] = useState<PushLog[]>([]);

    useEffect(() => {
        // Listen for push history
        const q = query(
            collection(db, 'system_settings/push_log/history'),
            orderBy('sent_at', 'desc'),
            limit(20)
        );
        const unsub = onSnapshot(q, (snap) => {
            setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as PushLog)));
        }, (err) => {
            console.warn('Push history listener error:', err);
        });
        return () => unsub();
    }, []);

    const handleSend = async () => {
        if (!title.trim() || !body.trim()) {
            setResult('❌ Title and body are required');
            return;
        }

        setSending(true);
        setResult('');
        try {
            const functions = getFunctions(undefined, 'asia-south1');
            const sendFn = httpsCallable(functions, 'sendBulkPush');
            const res = await sendFn({ title, body, target });
            const data = res.data as any;

            setResult(`✅ ${data.message}`);
            setTitle('');
            setBody('');
        } catch (err: any) {
            setResult(`❌ Error: ${err.message}`);
        }
        setSending(false);
        setTimeout(() => setResult(''), 8000);
    };

    const presets = [
        {
            label: '🚨 Tax Update',
            title: '🚨 New IRD Tax Rules Applied',
            body: 'The 2026 Sri Lankan APIT tax brackets have been updated in your dashboard. Check "Tax Calculator" now.',
            target: 'all' as const,
        },
        {
            label: '⭐ Pro Promo',
            title: '⭐ Weekend Pro Offer: 20% Off!',
            body: 'Upgrade to Pro this weekend and save 20% on your annual plan. Unlock unlimited AI Voice Notes & Smart Calendar.',
            target: 'free' as const,
        },
        {
            label: '📱 Update',
            title: '📱 New Feature Available',
            body: 'We\'ve added Smart Traffic Alerts for Colombo! Update your schedule to get real-time travel time estimates.',
            target: 'all' as const,
        },
    ];

    const s: Record<string, React.CSSProperties> = {
        card: {
            background: 'linear-gradient(135deg, rgba(30,27,75,0.8), rgba(15,23,42,0.9))',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '1.5rem',
        },
        label: { color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.35rem', display: 'block' },
        input: {
            width: '100%',
            padding: '0.7rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box' as const,
            marginBottom: '1rem',
        },
        textarea: {
            width: '100%',
            padding: '0.7rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.85rem',
            outline: 'none',
            boxSizing: 'border-box' as const,
            marginBottom: '1rem',
            minHeight: '80px',
            resize: 'vertical' as const,
            fontFamily: 'inherit',
        },
        targetGroup: {
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1rem',
        },
        targetBtn: {
            flex: 1,
            padding: '0.65rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            color: '#94a3b8',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center' as const,
        },
        targetBtnActive: {
            background: 'rgba(99,102,241,0.2)',
            borderColor: 'rgba(99,102,241,0.4)',
            color: '#c7d2fe',
        },
        sendBtn: {
            padding: '0.85rem 2rem',
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            border: 'none',
            borderRadius: '0.75rem',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            width: '100%',
        },
        presetBtn: {
            padding: '0.5rem 0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            color: '#94a3b8',
            fontSize: '0.75rem',
            cursor: 'pointer',
            fontWeight: 500,
        },
        historyRow: {
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: '0.5rem',
            padding: '0.65rem 0',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            fontSize: '0.75rem',
            alignItems: 'center',
        },
    };

    return (
        <div>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                📢 Push Notification Sender
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Send bulk FCM notifications to all users or specific segments.
            </p>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', alignSelf: 'center' }}>Quick:</span>
                {presets.map((p, i) => (
                    <button
                        key={i}
                        style={s.presetBtn}
                        onClick={() => {
                            setTitle(p.title);
                            setBody(p.body);
                            setTarget(p.target);
                        }}
                    >
                        {p.label}
                    </button>
                ))}
            </div>

            {/* Compose */}
            <div style={s.card}>
                <h3 style={{ color: '#c7d2fe', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                    ✍️ Compose Notification
                </h3>

                <label style={s.label}>Notification Title</label>
                <input
                    style={s.input}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. 🚨 System Update: New Tax Rules Applied"
                />

                <label style={s.label}>Message Body</label>
                <textarea
                    style={s.textarea}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="e.g. The new 2026 IRD tax rules have been applied to your dashboard."
                />

                <label style={s.label}>Target Audience</label>
                <div style={s.targetGroup}>
                    {([
                        { id: 'all', label: '👥 All Users', emoji: '🌐' },
                        { id: 'free', label: '🆓 Free Users', emoji: '🆓' },
                        { id: 'pro', label: '⭐ Pro Users', emoji: '⭐' },
                    ] as const).map(t => (
                        <button
                            key={t.id}
                            style={{
                                ...s.targetBtn,
                                ...(target === t.id ? s.targetBtnActive : {}),
                            }}
                            onClick={() => setTarget(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                <button
                    style={{ ...s.sendBtn, opacity: sending ? 0.7 : 1 }}
                    onClick={handleSend}
                    disabled={sending}
                >
                    {sending ? '⏳ Sending to all devices...' : '📢 Send Push Notification'}
                </button>

                {result && (
                    <p style={{
                        color: result.includes('✅') ? '#34d399' : '#f87171',
                        fontSize: '0.85rem',
                        textAlign: 'center',
                        marginTop: '1rem',
                    }}>
                        {result}
                    </p>
                )}
            </div>

            {/* History */}
            <div style={s.card}>
                <h3 style={{ color: '#c7d2fe', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                    📋 Send History
                </h3>

                <div style={{ ...s.historyRow, borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>NOTIFICATION</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>TARGET</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>RESULT</span>
                    <span style={{ color: '#94a3b8', fontWeight: 600, fontSize: '0.7rem' }}>DATE</span>
                </div>

                {history.length === 0 ? (
                    <p style={{ color: '#64748b', textAlign: 'center', padding: '1.5rem', fontSize: '0.8rem' }}>
                        No notifications sent yet
                    </p>
                ) : (
                    history.map(h => (
                        <div key={h.id} style={s.historyRow}>
                            <div>
                                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>{h.title}</div>
                                <div style={{ color: '#64748b', fontSize: '0.65rem' }}>{h.body?.substring(0, 60)}...</div>
                            </div>
                            <span style={{ color: '#c7d2fe' }}>{h.target?.toUpperCase()}</span>
                            <span style={{ color: '#34d399' }}>✅ {h.success_count || 0}/{h.target_count || 0}</span>
                            <span style={{ color: '#64748b' }}>
                                {h.sent_at?.seconds
                                    ? new Date(h.sent_at.seconds * 1000).toLocaleDateString()
                                    : '—'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
