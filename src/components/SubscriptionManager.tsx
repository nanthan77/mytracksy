import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

interface SubData {
    tier: 'free' | 'pro';
    status: string;
    current_period_end?: any;
    provider?: string;
    plan_type?: string;
    amount_cents?: number;
}

interface Invoice {
    invoice_id: string;
    date: any;
    amount_cents: number;
    plan_label: string;
    download_url?: string;
}

interface UsageQuota {
    month_id: string;
    ai_voice_notes_used: number;
}

const FREE_QUOTA = 5;

export default function SubscriptionManager() {
    const { currentUser } = useAuth();
    const [sub, setSub] = useState<SubData | null>(null);
    const [quota, setQuota] = useState<UsageQuota | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [slmcNumber, setSlmcNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [savingSlmc, setSavingSlmc] = useState(false);

    useEffect(() => {
        if (currentUser?.uid) loadData();
    }, [currentUser?.uid]);

    const loadData = async () => {
        if (!currentUser?.uid) return;
        try {
            // Subscription
            const subSnap = await getDoc(doc(db, 'users', currentUser.uid, 'subscription', 'current'));
            if (subSnap.exists()) setSub(subSnap.data() as SubData);
            else setSub({ tier: 'free', status: 'active' });

            // Quota
            const quotaSnap = await getDoc(doc(db, 'users', currentUser.uid, 'usage_quotas', 'current_month'));
            if (quotaSnap.exists()) setQuota(quotaSnap.data() as UsageQuota);

            // Invoices
            const invoiceQuery = query(
                collection(db, 'users', currentUser.uid, 'app_invoices'),
                orderBy('date', 'desc'),
                limit(10)
            );
            const invoiceSnap = await getDocs(invoiceQuery);
            setInvoices(invoiceSnap.docs.map(d => d.data() as Invoice));

            // SLMC
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists()) setSlmcNumber(userSnap.data().slmc_number || '');
        } catch (err) {
            console.error('Error loading subscription data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateDemo = async () => {
        // In production, redirect to payment flow
        alert('Payment integration coming soon! Contact support@mytracksy.lk for early access.');
    };

    const handleSaveSlmc = async () => {
        if (!currentUser?.uid || !slmcNumber.trim()) return;
        setSavingSlmc(true);
        try {
            await setDoc(doc(db, 'users', currentUser.uid), { slmc_number: slmcNumber.trim() }, { merge: true });
        } catch (err) {
            console.error('SLMC save error:', err);
        } finally {
            setSavingSlmc(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#a5b4fc' }}>Loading subscription...</div>;
    }

    const isPro = sub?.tier === 'pro' && sub?.status === 'active';
    const monthId = `${new Date().getFullYear()}_${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const used = quota?.month_id === monthId ? quota.ai_voice_notes_used : 0;
    const pct = isPro ? 0 : Math.min((used / FREE_QUOTA) * 100, 100);

    return (
        <div style={{ padding: '1rem' }}>
            {/* Plan card */}
            <div style={{
                background: isPro
                    ? 'linear-gradient(135deg, #312e81, #4338ca)'
                    : 'linear-gradient(135deg, #1e293b, #334155)',
                borderRadius: '1rem',
                padding: '1.5rem',
                marginBottom: '1rem',
                border: isPro ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                        <span style={{
                            background: isPro ? 'linear-gradient(135deg, #f59e0b, #f97316)' : '#475569',
                            color: isPro ? '#1e1b4b' : '#e2e8f0',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.75rem',
                            borderRadius: '2rem',
                        }}>
                            {isPro ? '⭐ PRO' : 'FREE'}
                        </span>
                    </div>
                    <span style={{ color: '#6ee7b7', fontSize: '0.8rem', fontWeight: 600 }}>
                        {sub?.status === 'active' ? '● Active' : `○ ${sub?.status || 'Inactive'}`}
                    </span>
                </div>

                <h3 style={{ color: '#fff', fontSize: '1.25rem', margin: '0 0 0.25rem' }}>
                    {isPro ? 'MyTracksy Pro' : 'MyTracksy Free'}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>
                    {isPro
                        ? `${sub?.plan_type === 'annual' ? 'Annual' : 'Monthly'} plan · ${sub?.provider === 'demo' ? 'Demo mode' :
                            sub?.provider === 'payhere_web' ? 'via PayHere' :
                                sub?.provider || 'Active'
                        }`
                        : `${FREE_QUOTA} AI voice notes/month · Manual accounting`
                    }
                </p>
                {isPro && sub?.current_period_end && (
                    <p style={{ color: '#6ee7b7', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                        Renews: {new Date(sub.current_period_end.seconds ? sub.current_period_end.seconds * 1000 : sub.current_period_end).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                )}
            </div>

            {/* Usage meter (Free only) */}
            {!isPro && (
                <div style={{
                    background: '#1e293b',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600 }}>AI Voice Notes</span>
                        <span style={{ color: pct >= 100 ? '#ef4444' : '#a5b4fc', fontSize: '0.85rem', fontWeight: 700 }}>
                            {used} / {FREE_QUOTA}
                        </span>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '0.5rem', height: '8px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${pct}%`,
                            height: '100%',
                            borderRadius: '0.5rem',
                            background: pct >= 100
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : pct >= 80
                                    ? 'linear-gradient(90deg, #f59e0b, #f97316)'
                                    : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                            transition: 'width 0.5s ease',
                        }} />
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '0.5rem' }}>
                        {pct >= 100
                            ? '🔒 Limit reached — upgrade to Pro for unlimited AI notes'
                            : `${FREE_QUOTA - used} notes remaining this month`
                        }
                    </p>
                </div>
            )}

            {/* Upgrade button (Free only) */}
            {!isPro && (
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.15))',
                    borderRadius: '0.75rem',
                    padding: '1.25rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(139,92,246,0.3)',
                    textAlign: 'center',
                }}>
                    <h4 style={{ color: '#c7d2fe', fontSize: '0.95rem', margin: '0 0 0.5rem' }}>
                        🚀 Upgrade to Pro
                    </h4>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem' }}>
                            <div style={{ color: '#fff', fontWeight: 700 }}>LKR 2,900</div>
                            <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>per month</div>
                        </div>
                        <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '0.5rem', padding: '0.5rem 0.75rem', border: '1px solid rgba(139,92,246,0.4)' }}>
                            <div style={{ color: '#fff', fontWeight: 700 }}>LKR 25,000</div>
                            <div style={{ color: '#6ee7b7', fontSize: '0.7rem' }}>per year (SAVE 28%)</div>
                        </div>
                    </div>
                    <div style={{ color: '#6ee7b7', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        🧾 100% Tax Deductible — auto-logged as expense
                    </div>
                    <button
                        onClick={handleActivateDemo}
                        disabled={false}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                        }}
                    >
                        {'🚀 Upgrade to Pro'}
                    </button>
                </div>
            )}

            {/* SLMC Number */}
            <div style={{
                background: '#1e293b',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginBottom: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <label style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                    🏥 SLMC Registration Number
                </label>
                <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0 0 0.5rem' }}>
                    Required for tax-deductible invoice generation
                </p>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                        value={slmcNumber}
                        onChange={e => setSlmcNumber(e.target.value)}
                        placeholder="e.g. 28475"
                        style={{
                            flex: 1,
                            padding: '0.6rem 0.75rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: '0.5rem',
                            color: '#fff',
                            fontSize: '0.9rem',
                        }}
                    />
                    <button
                        onClick={handleSaveSlmc}
                        disabled={savingSlmc}
                        style={{
                            padding: '0.6rem 1rem',
                            background: '#4338ca',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                        }}
                    >
                        {savingSlmc ? '...' : 'Save'}
                    </button>
                </div>
            </div>

            {/* Invoice history */}
            <div style={{
                background: '#1e293b',
                borderRadius: '0.75rem',
                padding: '1rem',
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <h4 style={{ color: '#e2e8f0', fontSize: '0.9rem', margin: '0 0 0.75rem' }}>
                    📄 Invoice History
                </h4>
                {invoices.length === 0 ? (
                    <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center', padding: '1rem' }}>
                        No invoices yet. Invoices are generated automatically when you subscribe.
                    </p>
                ) : (
                    invoices.map((inv, i) => (
                        <div key={i} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.6rem 0',
                            borderBottom: i < invoices.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                        }}>
                            <div>
                                <div style={{ color: '#e2e8f0', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {inv.invoice_id}
                                </div>
                                <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                                    {inv.date?.seconds
                                        ? new Date(inv.date.seconds * 1000).toLocaleDateString('en-GB')
                                        : 'N/A'
                                    } · LKR {((inv.amount_cents || 0) / 100).toLocaleString()}
                                </div>
                            </div>
                            {inv.download_url && (
                                <a
                                    href={inv.download_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        color: '#8b5cf6',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        textDecoration: 'none',
                                    }}
                                >
                                    📥 Download
                                </a>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Pro features list */}
            <div style={{
                background: 'rgba(99,102,241,0.05)',
                borderRadius: '0.75rem',
                padding: '1rem',
                marginTop: '1rem',
                border: '1px solid rgba(99,102,241,0.1)',
            }}>
                <h4 style={{ color: '#c7d2fe', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>
                    {isPro ? '✅ Your Pro Features' : '🔒 Pro Features Include'}
                </h4>
                {[
                    ['🎙️', 'Unlimited AI Voice-to-Text Clinical Vault'],
                    ['🤖', 'Zero-Touch Accounting: Bank Email Auto-Sync'],
                    ['📊', 'Automated IRD Tax Estimator & Auditor Export'],
                    ['👥', 'Assistant Login Portal for clinic staff'],
                    ['📅', 'Smart Traffic Alerts & Schedule Optimizer'],
                    ['📱', 'Priority Support & Early Access to Features'],
                ].map(([icon, text], i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.35rem 0',
                        color: isPro ? '#e2e8f0' : '#94a3b8',
                        fontSize: '0.8rem',
                    }}>
                        <span>{icon}</span>
                        <span>{text}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
