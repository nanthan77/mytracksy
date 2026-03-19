import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPricingForProfession, PAYWALL_ANCHORS } from '../config/pricingConfig';
import { ProfessionType } from '../types/profession';

interface SubscriptionGateProps {
    children: React.ReactNode;
    featureName?: string;
    featureIcon?: string;
}

interface SubscriptionData {
    tier: 'free' | 'pro';
    status: 'active' | 'past_due' | 'canceled';
    current_period_end?: any;
}

interface UsageQuota {
    month_id: string;
    ai_voice_notes_used: number;
}

const FREE_QUOTA = 5;

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
    },
    card: {
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #1e1b4b 100%)',
        borderRadius: '1.5rem',
        maxWidth: '440px',
        width: '100%',
        padding: '2.5rem 2rem',
        textAlign: 'center' as const,
        boxShadow: '0 25px 60px rgba(99, 102, 241, 0.3)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
    },
    badge: {
        display: 'inline-block',
        background: 'linear-gradient(135deg, #f59e0b, #f97316)',
        color: '#1e1b4b',
        fontSize: '0.7rem',
        fontWeight: 800,
        padding: '0.25rem 0.75rem',
        borderRadius: '2rem',
        letterSpacing: '0.05em',
        marginBottom: '1rem',
    },
    icon: {
        fontSize: '3rem',
        marginBottom: '0.75rem',
    },
    title: {
        fontSize: '1.5rem',
        color: '#fff',
        fontWeight: 700,
        margin: '0 0 0.5rem',
    },
    subtitle: {
        color: '#a5b4fc',
        fontSize: '0.9rem',
        margin: '0 0 1.5rem',
        lineHeight: 1.5,
    },
    quotaBar: {
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '1rem',
        padding: '1rem',
        marginBottom: '1.5rem',
    },
    quotaText: {
        color: '#e0e7ff',
        fontSize: '0.85rem',
        marginBottom: '0.5rem',
    },
    progressBg: {
        background: 'rgba(255,255,255,0.15)',
        borderRadius: '0.5rem',
        height: '8px',
        overflow: 'hidden' as const,
    },
    progressFill: {
        height: '100%',
        borderRadius: '0.5rem',
        transition: 'width 0.5s ease',
    },
    priceSection: {
        marginBottom: '1.5rem',
    },
    priceRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '0.75rem',
        marginBottom: '0.5rem',
        border: '1px solid rgba(255,255,255,0.1)',
    },
    priceRowBest: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.75rem',
        background: 'rgba(99, 102, 241, 0.2)',
        borderRadius: '0.75rem',
        marginBottom: '0.5rem',
        border: '1.5px solid rgba(139, 92, 246, 0.5)',
    },
    priceLabel: {
        color: '#c7d2fe',
        fontSize: '0.85rem',
    },
    priceAmount: {
        color: '#fff',
        fontSize: '1rem',
        fontWeight: 700,
    },
    saveBadge: {
        fontSize: '0.65rem',
        background: '#10b981',
        color: '#fff',
        padding: '0.1rem 0.4rem',
        borderRadius: '0.25rem',
        fontWeight: 700,
        marginLeft: '0.5rem',
    },
    anchor: {
        color: '#94a3b8',
        fontSize: '0.75rem',
        fontStyle: 'italic' as const,
        margin: '0.5rem 0 1rem',
    },
    taxBadge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: 'rgba(16, 185, 129, 0.15)',
        color: '#6ee7b7',
        fontSize: '0.75rem',
        fontWeight: 600,
        padding: '0.4rem 0.8rem',
        borderRadius: '2rem',
        marginBottom: '1.5rem',
        border: '1px solid rgba(16, 185, 129, 0.3)',
    },
    btnPro: {
        width: '100%',
        padding: '0.9rem',
        fontSize: '1rem',
        fontWeight: 700,
        color: '#fff',
        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
        border: 'none',
        borderRadius: '0.75rem',
        cursor: 'pointer',
        marginBottom: '0.75rem',
        transition: 'transform 0.2s',
    },
    btnSkip: {
        background: 'none',
        border: 'none',
        color: '#6b7280',
        fontSize: '0.8rem',
        cursor: 'pointer',
        padding: '0.5rem',
    },
};

/** Detect current profession from localStorage */
function detectProfession(): ProfessionType {
    try {
        const stored = localStorage.getItem('myTracksyProfession');
        if (stored) {
            const data = JSON.parse(stored);
            if (data.profession) return data.profession as ProfessionType;
        }
    } catch { }
    return 'individual';
}

export default function SubscriptionGate({ children, featureName = 'AI Voice Vault', featureIcon = '🎙️' }: SubscriptionGateProps) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isPro, setIsPro] = useState(false);
    const [quotaUsed, setQuotaUsed] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const [activating, setActivating] = useState(false);
    const profession = detectProfession();
    const pricing = getPricingForProfession(profession);
    const proTier = pricing.tiers.find(t => t.tierKey === 'pro');
    const anchorText = PAYWALL_ANCHORS[profession] || '💡 Less than your daily coffee';

    useEffect(() => {
        if (!currentUser?.uid) {
            setLoading(false);
            return;
        }
        checkSubscription();
    }, [currentUser?.uid]);

    const checkSubscription = async () => {
        if (!currentUser?.uid) return;
        try {
            const subRef = doc(db, 'users', currentUser.uid, 'subscription', 'current');
            const subSnap = await getDoc(subRef);

            if (subSnap.exists()) {
                const data = subSnap.data() as SubscriptionData;
                if (data.tier === 'pro' && data.status === 'active') {
                    setIsPro(true);
                    setLoading(false);
                    return;
                }
            }

            // Check quota
            const monthId = getCurrentMonthId();
            const quotaRef = doc(db, 'users', currentUser.uid, 'usage_quotas', 'current_month');
            const quotaSnap = await getDoc(quotaRef);

            if (quotaSnap.exists()) {
                const qData = quotaSnap.data() as UsageQuota;
                if (qData.month_id === monthId) {
                    setQuotaUsed(qData.ai_voice_notes_used || 0);
                    if (qData.ai_voice_notes_used >= FREE_QUOTA) {
                        setShowPaywall(true);
                    }
                }
            }

            setLoading(false);
        } catch (err) {
            console.error('Subscription check error:', err);
            setLoading(false);
        }
    };

    const getCurrentMonthId = () => {
        const now = new Date();
        return `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}`;
    };

    const handleActivateDemo = async () => {
        // In production, redirect to payment flow
        // Demo mode: show coming soon message
        alert('Payment integration coming soon! Contact support@mytracksy.com for early access.');
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem', color: '#a5b4fc' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔐</div>
                    Verifying access...
                </div>
            </div>
        );
    }

    // Pro user — show content normally
    if (isPro) return <>{children}</>;

    // Free user under quota — show content with quota bar
    if (!showPaywall) {
        return (
            <div>
                {/* Quota indicator */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))',
                    borderRadius: '0.75rem',
                    padding: '0.75rem 1rem',
                    margin: '0 0 1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid rgba(139,92,246,0.2)',
                }}>
                    <span style={{ color: '#c7d2fe', fontSize: '0.8rem' }}>
                        {featureIcon} Free: {quotaUsed}/{FREE_QUOTA} used
                    </span>
                    <span style={{
                        background: quotaUsed >= 4 ? '#ef4444' : '#8b5cf6',
                        color: '#fff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '1rem',
                    }}>
                        {FREE_QUOTA - quotaUsed} left
                    </span>
                </div>
                {children}
            </div>
        );
    }

    // Paywall overlay
    const pct = Math.min((quotaUsed / FREE_QUOTA) * 100, 100);

    return (
        <div style={styles.overlay}>
            <div style={styles.card}>
                <div style={styles.badge}>PRO UPGRADE</div>
                <div style={styles.icon}>{featureIcon}</div>
                <h2 style={styles.title}>Unlock {featureName}</h2>
                <p style={styles.subtitle}>
                    You've used all {FREE_QUOTA} free AI voice notes this month.
                    Upgrade to Pro for unlimited access.
                </p>

                {/* Quota bar */}
                <div style={styles.quotaBar}>
                    <div style={styles.quotaText}>
                        {quotaUsed} / {FREE_QUOTA} Free Notes Used
                    </div>
                    <div style={styles.progressBg}>
                        <div style={{
                            ...styles.progressFill,
                            width: `${pct}%`,
                            background: pct >= 100
                                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                                : 'linear-gradient(90deg, #8b5cf6, #6366f1)',
                        }} />
                    </div>
                </div>

                {/* Pricing */}
                <div style={styles.priceSection}>
                    <div style={styles.priceRow}>
                        <span style={styles.priceLabel}>Monthly</span>
                        <span style={styles.priceAmount}>LKR {(proTier?.monthlyPrice || 2900).toLocaleString()}/mo</span>
                    </div>
                    <div style={styles.priceRowBest}>
                        <span style={styles.priceLabel}>
                            Annual
                            <span style={styles.saveBadge}>SAVE {proTier ? Math.round((1 - proTier.annualPrice / (proTier.monthlyPrice * 12)) * 100) : 28}%</span>
                        </span>
                        <span style={styles.priceAmount}>LKR {(proTier?.annualPrice || 25000).toLocaleString()}/yr</span>
                    </div>
                </div>

                <p style={styles.anchor}>
                    {anchorText}
                </p>

                <div style={styles.taxBadge}>
                    🧾 100% Tax Deductible — Auto-logged to your expenses
                </div>

                <button
                    style={styles.btnPro}
                    onClick={handleActivateDemo}
                    disabled={false}
                >
                    {'🚀 Upgrade to Pro'}
                </button>
                <button
                    style={styles.btnSkip}
                    onClick={() => setShowPaywall(false)}
                >
                    Maybe later
                </button>
            </div>
        </div>
    );
}
