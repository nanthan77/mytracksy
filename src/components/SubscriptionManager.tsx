import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, setDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../config/firebase';
import { getPricingForProfession } from '../config/pricingConfig';
import { ProfessionType } from '../contexts/AuthContext';

const functions = getFunctions(undefined, 'asia-south1');

interface SubData {
    tier: 'free' | 'pro' | 'chambers';
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

/** Profession-specific registration field config */
const REGISTRATION_FIELDS: Record<string, { icon: string; label: string; placeholder: string; firestoreKey: string; description: string }> = {
    medical: { icon: '🏥', label: 'SLMC Registration Number', placeholder: 'e.g. 28475', firestoreKey: 'slmc_number', description: 'Required for tax-deductible invoice generation' },
    legal: { icon: '⚖️', label: 'BASL Registration Number', placeholder: 'e.g. 12345', firestoreKey: 'basl_number', description: 'Bar Association of Sri Lanka registration' },
    engineering: { icon: '🔧', label: 'IESL Membership Number', placeholder: 'e.g. AM-12345', firestoreKey: 'iesl_number', description: 'Institution of Engineers Sri Lanka membership' },
    tourism: { icon: '🏖️', label: 'SLTDA License Number', placeholder: 'e.g. TG-2024-001', firestoreKey: 'sltda_number', description: 'Sri Lanka Tourism Development Authority license' },
    travel: { icon: '✈️', label: 'SLTDA License Number', placeholder: 'e.g. TG-2024-001', firestoreKey: 'sltda_number', description: 'Sri Lanka Tourism Development Authority license' },
    studios: { icon: '📸', label: 'Studio TIN / BR Number', placeholder: 'e.g. PV-2025-1147', firestoreKey: 'studio_registration', description: 'Optional business registration or tax reference for invoices' },
};

/** Profession-specific Pro features */
const PRO_FEATURES: Record<string, [string, string][]> = {
    medical: [
        ['🎙️', 'Unlimited AI Voice-to-Text Clinical Vault'],
        ['🤖', 'Zero-Touch Accounting: Bank Email Auto-Sync'],
        ['📊', 'Automated IRD Tax Estimator & Auditor Export'],
        ['👥', 'Assistant Login Portal for clinic staff'],
        ['📅', 'Smart Traffic Alerts & Schedule Optimizer'],
        ['📱', 'Priority Support & Early Access to Features'],
    ],
    legal: [
        ['⚖️', 'Trust vs Operating Accounting with 1-Click Fee Notes'],
        ['📋', 'Unlimited AI Voice Case Minutes (English & Sinhala)'],
        ['🔍', 'Conflict of Interest Scanner'],
        ['🤖', '50 AI Tokens/month (Demand Letters, Judgment Summaries)'],
        ['📊', 'Automated IRD Tax Estimator & Auditor Export'],
        ['📱', 'Priority Support & Early Access to Features'],
    ],
    tourism: [
        ['🗺️', 'Trip-Based Contextual Accounting'],
        ['💱', 'Multi-Currency CBSL Auto-Sync (USD/EUR/GBP)'],
        ['📋', 'Commission Tracker (Kutti Ledger)'],
        ['🤖', 'AI Route & Itinerary Generator'],
        ['📄', 'Driver Settlement PDF Engine'],
        ['📊', '1-Click IRD Tax Export'],
    ],
    travel: [
        ['🗺️', 'Trip-Based Contextual Accounting'],
        ['💱', 'Multi-Currency CBSL Auto-Sync (USD/EUR/GBP)'],
        ['📋', 'Commission Tracker (Kutti Ledger)'],
        ['🤖', 'AI Route & Itinerary Generator'],
        ['📄', 'Driver Settlement PDF Engine'],
        ['📊', '1-Click IRD Tax Export'],
    ],
    creator: [
        ['💰', 'AdSense USD Auto-Convert (CBSL Rate)'],
        ['🤝', 'Brand Deal CRM & Invoice Generator'],
        ['🎥', 'Gear Vault (Depreciation Write-Offs)'],
        ['🏦', 'Bank-Ready Income Statements'],
        ['📊', 'Multi-Platform Revenue Dashboard'],
        ['🤖', 'AI Content Tax Advisor'],
    ],
    studios: [
        ['🗓️', 'Event Folio milestone billing'],
        ['💸', 'Crew, lab, and gear-rent profit tracker'],
        ['📷', 'Gear vault with depreciation write-offs'],
        ['⚠️', 'Nekath clash detector and travel warning'],
        ['📄', 'AI contract and quotation builder'],
        ['💬', 'Client voice-note decoder and diplomat AI'],
    ],
    engineering: [
        ['📁', 'Unlimited Project Folios'],
        ['🧱', 'Material Cost Estimator'],
        ['👷', 'Sub-Contractor Payment Tracker'],
        ['📋', 'BOQ-Linked Expense Logging'],
        ['📝', 'Variation Order Management'],
        ['🤖', 'AI Site Report Generator'],
    ],
    aquaculture: [
        ['🐟', 'Up to 5 Ponds with Voice AI Logs'],
        ['🌾', 'Feed Inventory & FCR Tracker'],
        ['📄', 'Harvest Delivery Notes (PDF)'],
        ['📊', 'Pond-by-Pond Profitability'],
        ['☁️', 'Cloud Backup & Sync'],
        ['👤', '1 Admin Login'],
    ],
    business: [
        ['📄', 'Smart Invoicing & Quotations'],
        ['🤖', 'Expense Categorization AI'],
        ['🧾', 'IRD Tax Automation'],
        ['🏢', 'Multi-Entity Management'],
        ['☁️', 'Cloud Backup & Sync'],
        ['📱', 'Priority Support'],
    ],
    trading: [
        ['📈', 'Unlimited Trade Logging'],
        ['💱', 'Multi-Currency Portfolio (CSE/Forex)'],
        ['🧾', 'Capital Gains Tax Calculator'],
        ['💰', 'Dividend Income Tracker'],
        ['🤖', 'AI Market Insights'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
    automotive: [
        ['🔧', 'Unlimited Job Cards'],
        ['📦', 'Parts Inventory Management'],
        ['🚗', 'Customer Vehicle History'],
        ['📄', 'Invoice & Quotation Generator'],
        ['👷', 'Mechanic Productivity Tracker'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
    marketing: [
        ['🎯', 'Unlimited Client Projects'],
        ['📊', 'Campaign Budget Tracker'],
        ['📄', 'Retainer & Invoice Manager'],
        ['💰', 'Ad Spend vs Revenue Analytics'],
        ['🤖', 'AI Brief Generator'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
    transportation: [
        ['🚛', 'Unlimited Trip Logging'],
        ['⛽', 'Fuel Efficiency Analytics'],
        ['💰', 'Driver Payment Settlements'],
        ['🔧', 'Vehicle Maintenance Tracker'],
        ['📊', 'Route Revenue Reports'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
    retail: [
        ['🏪', 'Unlimited Sales Tracking'],
        ['📦', 'Inventory Management'],
        ['💰', 'Supplier Payment Tracker'],
        ['🧾', 'Daily Cash Reconciliation'],
        ['📋', 'Customer Credit Book'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
    individual: [
        ['💰', 'Unlimited Transaction Tracking'],
        ['👨‍👩‍👧', 'Family Budget Sharing'],
        ['📈', 'Investment Portfolio Tracker'],
        ['🔔', 'Bill Reminder & Auto-Log'],
        ['🧾', 'Tax Filing Helper (APIT)'],
        ['☁️', 'Cloud Backup & Sync'],
    ],
};

/** Default features for professions without custom lists */
const DEFAULT_PRO_FEATURES: [string, string][] = [
    ['🎙️', 'Unlimited AI Voice Notes'],
    ['🤖', 'Smart Automation Tools'],
    ['📊', 'Advanced Reports & Analytics'],
    ['👥', 'Multi-User Access'],
    ['📅', 'Priority Support'],
    ['📱', 'Early Access to New Features'],
];

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

export default function SubscriptionManager() {
    const { currentUser } = useAuth();
    const [sub, setSub] = useState<SubData | null>(null);
    const [quota, setQuota] = useState<UsageQuota | null>(null);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [regNumber, setRegNumber] = useState('');
    const [loading, setLoading] = useState(true);
    const [activating, setActivating] = useState(false);
    const [savingReg, setSavingReg] = useState(false);
    const profession = detectProfession();
    const pricing = getPricingForProfession(profession);
    const regField = REGISTRATION_FIELDS[profession];

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

            // Professional registration number
            const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
            if (userSnap.exists() && regField) {
                setRegNumber(userSnap.data()[regField.firestoreKey] || '');
            }
        } catch (err) {
            console.error('Error loading subscription data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleActivateDemo = async () => {
        if (!currentUser?.uid) return;
        setActivating(true);
        try {
            // Call Cloud Function to initiate PayHere preapproval checkout
            const initCheckout = httpsCallable(functions, 'handlePayHerePreapproval');
            const result = await initCheckout({
                plan_type: 'monthly',
                tier: 'pro',
                profession,
            });
            const data = result.data as { checkout_url?: string; success?: boolean };

            if (data.checkout_url) {
                // Redirect to PayHere hosted checkout page
                window.location.href = data.checkout_url;
            } else {
                // Fallback: direct PayHere sandbox URL for testing
                alert('Payment gateway is being configured. Please contact support@mytracksy.lk for early access.');
            }
        } catch (err: any) {
            console.error('Payment initiation error:', err);
            alert('Unable to connect to payment gateway. Please try again or contact support@mytracksy.lk');
        } finally {
            setActivating(false);
        }
    };

    const handleSaveRegNumber = async () => {
        if (!currentUser?.uid || !regNumber.trim() || !regField) return;
        setSavingReg(true);
        try {
            await setDoc(doc(db, 'users', currentUser.uid), { [regField.firestoreKey]: regNumber.trim() }, { merge: true });
        } catch (err) {
            console.error('Registration save error:', err);
        } finally {
            setSavingReg(false);
        }
    };

    if (loading) {
        return <div style={{ padding: '2rem', textAlign: 'center', color: '#a5b4fc' }}>Loading subscription...</div>;
    }

    const isPro = (sub?.tier === 'pro' || sub?.tier === 'chambers') && sub?.status === 'active';
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
                    {isPro
                        ? (sub?.tier === 'chambers' ? 'The Chambers Plan' : pricing.tiers.find(t => t.tierKey === 'pro')?.name || 'Pro Plan')
                        : (pricing.tiers.find(t => t.tierKey === 'free')?.name || 'Free Plan')
                    }
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
                        🚀 Upgrade to {pricing.tiers.find(t => t.tierKey === 'pro')?.name || 'Pro'}
                    </h4>
                    {pricing.tiers.filter(t => t.tierKey !== 'free').map((tier) => (
                        <div key={tier.id} style={{
                            background: tier.highlighted ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '0.75rem',
                            padding: '0.75rem',
                            marginBottom: '0.5rem',
                            border: tier.highlighted ? '1px solid rgba(139,92,246,0.4)' : '1px solid rgba(255,255,255,0.08)',
                        }}>
                            <div style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.25rem' }}>
                                {tier.name} {tier.badge && <span style={{ fontSize: '0.65rem', color: '#6ee7b7' }}>({tier.badge})</span>}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', padding: '0.35rem 0.6rem' }}>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>LKR {tier.monthlyPrice.toLocaleString()}</div>
                                    <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>per month</div>
                                </div>
                                <div style={{ background: 'rgba(99,102,241,0.2)', borderRadius: '0.5rem', padding: '0.35rem 0.6rem', border: '1px solid rgba(139,92,246,0.3)' }}>
                                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>LKR {tier.annualPrice.toLocaleString()}</div>
                                    <div style={{ color: '#6ee7b7', fontSize: '0.65rem' }}>per year (SAVE {Math.round((1 - tier.annualPrice / (tier.monthlyPrice * 12)) * 100)}%)</div>
                                </div>
                            </div>
                            {tier.aiTokens > 0 && (
                                <div style={{ color: '#a5b4fc', fontSize: '0.7rem' }}>🤖 {tier.aiTokens} AI Tokens/month</div>
                            )}
                        </div>
                    ))}
                    <div style={{ color: '#6ee7b7', fontSize: '0.75rem', marginBottom: '0.75rem' }}>
                        🧾 100% Tax Deductible — auto-logged as expense
                    </div>
                    <button
                        onClick={handleActivateDemo}
                        disabled={activating}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: activating
                                ? 'linear-gradient(135deg, #6b7280, #4b5563)'
                                : 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            color: '#fff',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '0.75rem',
                            cursor: activating ? 'wait' : 'pointer',
                            fontSize: '0.9rem',
                            opacity: activating ? 0.7 : 1,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        {activating ? '⏳ Connecting to PayHere...' : '🚀 Upgrade Now'}
                    </button>
                </div>
            )}

            {/* Professional Registration Number (only for professions with registration fields) */}
            {regField && (
                <div style={{
                    background: '#1e293b',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    marginBottom: '1rem',
                    border: '1px solid rgba(255,255,255,0.1)',
                }}>
                    <label style={{ color: '#e2e8f0', fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                        {regField.icon} {regField.label}
                    </label>
                    <p style={{ color: '#94a3b8', fontSize: '0.7rem', margin: '0 0 0.5rem' }}>
                        {regField.description}
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            value={regNumber}
                            onChange={e => setRegNumber(e.target.value)}
                            placeholder={regField.placeholder}
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
                            onClick={handleSaveRegNumber}
                            disabled={savingReg}
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
                            {savingReg ? '...' : 'Save'}
                        </button>
                    </div>
                </div>
            )}

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
                {(PRO_FEATURES[profession] || DEFAULT_PRO_FEATURES).map(([icon, text], i) => (
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
