import React from 'react';

interface TaxSpeedometerProps {
    annualPrivateIncome: number;
    annualGovIncome: number;
    annualExpenses: number;
    whtDeducted: number;
}

// Sri Lanka IRD 2025/26 Tax Brackets (after personal relief of Rs. 1,200,000)
const TAX_BRACKETS = [
    { min: 0, max: 500000, rate: 0.06, label: '6%' },
    { min: 500000, max: 1000000, rate: 0.12, label: '12%' },
    { min: 1000000, max: 1500000, rate: 0.18, label: '18%' },
    { min: 1500000, max: 2000000, rate: 0.24, label: '24%' },
    { min: 2000000, max: 2500000, rate: 0.30, label: '30%' },
    { min: 2500000, max: Infinity, rate: 0.36, label: '36%' },
];

const PERSONAL_RELIEF = 1200000;

function calculateTax(taxableIncome: number): { tax: number; bracket: string; effectiveRate: number; breakdown: { bracket: string; taxable: number; tax: number }[] } {
    if (taxableIncome <= 0) return { tax: 0, bracket: '0%', effectiveRate: 0, breakdown: [] };

    let remaining = taxableIncome;
    let totalTax = 0;
    let currentBracket = '6%';
    const breakdown: { bracket: string; taxable: number; tax: number }[] = [];

    for (const b of TAX_BRACKETS) {
        if (remaining <= 0) break;
        const width = b.max === Infinity ? remaining : b.max - b.min;
        const inBracket = Math.min(remaining, width);
        const bracketTax = inBracket * b.rate;
        totalTax += bracketTax;
        currentBracket = b.label;
        breakdown.push({ bracket: b.label, taxable: inBracket, tax: bracketTax });
        remaining -= inBracket;
    }

    return {
        tax: Math.round(totalTax),
        bracket: currentBracket,
        effectiveRate: taxableIncome > 0 ? (totalTax / taxableIncome) * 100 : 0,
        breakdown,
    };
}

const fmt = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const TaxSpeedometer: React.FC<TaxSpeedometerProps> = ({
    annualPrivateIncome,
    annualGovIncome,
    annualExpenses,
    whtDeducted,
}) => {
    const totalIncome = annualPrivateIncome + annualGovIncome;
    const taxableIncome = Math.max(0, totalIncome - annualExpenses - PERSONAL_RELIEF);
    const { tax, bracket, effectiveRate, breakdown } = calculateTax(taxableIncome);
    const netTaxOwed = Math.max(0, tax - whtDeducted);
    const quarterlyPayment = Math.round(netTaxOwed / 4);

    // Gauge calculation (0-100%)
    const maxGaugeIncome = 5000000; // 5M for full gauge
    const gaugePercent = Math.min(100, (taxableIncome / maxGaugeIncome) * 100);
    const gaugeColor = gaugePercent < 25 ? '#22c55e' : gaugePercent < 50 ? '#f59e0b' : gaugePercent < 75 ? '#f97316' : '#ef4444';
    const dangerLevel = gaugePercent < 25 ? 'Low' : gaugePercent < 50 ? 'Moderate' : gaugePercent < 75 ? 'High' : 'Critical';

    // SVG semicircle gauge
    const radius = 90;
    const circumference = Math.PI * radius;
    const dashOffset = circumference - (gaugePercent / 100) * circumference;

    return (
        <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={kpiCard}>
                    <div style={kpiLabel}>Total Income (YTD)</div>
                    <div style={kpiValue}>{fmt(totalIncome)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Gov + Private</div>
                </div>
                <div style={kpiCard}>
                    <div style={kpiLabel}>Taxable Income</div>
                    <div style={{ ...kpiValue, color: '#6366f1' }}>{fmt(taxableIncome)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>After relief & expenses</div>
                </div>
                <div style={kpiCard}>
                    <div style={kpiLabel}>Tax Owed (Net)</div>
                    <div style={{ ...kpiValue, color: '#ef4444' }}>{fmt(netTaxOwed)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>After WHT credit</div>
                </div>
                <div style={kpiCard}>
                    <div style={kpiLabel}>Quarterly Payment</div>
                    <div style={{ ...kpiValue, color: '#f59e0b' }}>{fmt(quarterlyPayment)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Set aside per quarter</div>
                </div>
            </div>

            {/* Gauge + Breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                {/* Tax Danger Gauge */}
                <div style={card}>
                    <h3 style={cardTitle}>🌡️ Tax Danger Gauge</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1rem 0' }}>
                        <svg width="220" height="130" viewBox="0 0 220 130">
                            {/* Background arc */}
                            <path
                                d="M 20 120 A 90 90 0 0 1 200 120"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="16"
                                strokeLinecap="round"
                            />
                            {/* Active arc */}
                            <path
                                d="M 20 120 A 90 90 0 0 1 200 120"
                                fill="none"
                                stroke={gaugeColor}
                                strokeWidth="16"
                                strokeLinecap="round"
                                strokeDasharray={`${circumference}`}
                                strokeDashoffset={dashOffset}
                                style={{ transition: 'stroke-dashoffset 1s ease, stroke 0.5s ease' }}
                            />
                            {/* Center text */}
                            <text x="110" y="90" textAnchor="middle" fontSize="28" fontWeight="800" fill={gaugeColor}>
                                {bracket}
                            </text>
                            <text x="110" y="115" textAnchor="middle" fontSize="12" fill="#94a3b8">
                                {dangerLevel} Risk
                            </text>
                        </svg>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem' }}>
                            {['6%', '12%', '18%', '24%', '30%', '36%'].map((b, i) => (
                                <div key={b} style={{
                                    padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700,
                                    background: b === bracket ? gaugeColor : '#f1f5f9',
                                    color: b === bracket ? 'white' : '#94a3b8',
                                }}>
                                    {b}
                                </div>
                            ))}
                        </div>

                        <div style={{ marginTop: '1rem', padding: '10px 16px', background: `${gaugeColor}10`, borderRadius: 8, border: `1px solid ${gaugeColor}30`, fontSize: 13, textAlign: 'center' }}>
                            <span style={{ fontWeight: 700, color: gaugeColor }}>Effective rate: {effectiveRate.toFixed(1)}%</span>
                            <span style={{ color: '#64748b' }}> • Set aside </span>
                            <span style={{ fontWeight: 700, color: '#1e293b' }}>{fmt(quarterlyPayment)}</span>
                            <span style={{ color: '#64748b' }}> this quarter</span>
                        </div>
                    </div>
                </div>

                {/* Tax Breakdown */}
                <div style={card}>
                    <h3 style={cardTitle}>📊 Tax Bracket Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {/* Personal Relief */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#dcfce7', borderRadius: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>✅ Personal Relief</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>−{fmt(PERSONAL_RELIEF)}</span>
                        </div>

                        {breakdown.map((b, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#f8fafc', borderRadius: 8, border: '1px solid #f1f5f9' }}>
                                <div>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{b.bracket} bracket</span>
                                    <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>on {fmt(b.taxable)}</span>
                                </div>
                                <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>{fmt(b.tax)}</span>
                            </div>
                        ))}

                        <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />

                        {/* Total tax */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#fef2f2', borderRadius: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#991b1b' }}>Gross Tax</span>
                            <span style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>{fmt(tax)}</span>
                        </div>

                        {/* WHT Credit */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: '#dbeafe', borderRadius: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#1e40af' }}>WHT Credit (5% channeling)</span>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#3b82f6' }}>−{fmt(whtDeducted)}</span>
                        </div>

                        {/* Net owed */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', background: 'linear-gradient(135deg, #1e293b, #334155)', borderRadius: 8 }}>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>Net Tax Owed</span>
                            <span style={{ fontSize: 16, fontWeight: 800, color: '#fbbf24' }}>{fmt(netTaxOwed)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quarterly Payment Schedule */}
            <div style={card}>
                <h3 style={cardTitle}>📅 Quarterly Tax Payment Schedule (IRD)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    {[
                        { q: 'Q1', due: 'Aug 15', period: 'Apr–Jun', status: 'paid' },
                        { q: 'Q2', due: 'Nov 15', period: 'Jul–Sep', status: 'upcoming' },
                        { q: 'Q3', due: 'Feb 15', period: 'Oct–Dec', status: 'upcoming' },
                        { q: 'Q4', due: 'May 15', period: 'Jan–Mar', status: 'upcoming' },
                    ].map(item => (
                        <div key={item.q} style={{
                            padding: '1rem', borderRadius: 10, textAlign: 'center',
                            background: item.status === 'paid' ? '#dcfce7' : '#f8fafc',
                            border: `2px solid ${item.status === 'paid' ? '#22c55e' : '#e2e8f0'}`,
                        }}>
                            <div style={{ fontSize: 20, fontWeight: 800, color: item.status === 'paid' ? '#22c55e' : '#1e293b' }}>{item.q}</div>
                            <div style={{ fontSize: 13, color: '#64748b', margin: '4px 0' }}>{item.period}</div>
                            <div style={{ fontSize: 16, fontWeight: 700, color: item.status === 'paid' ? '#22c55e' : '#f59e0b' }}>{fmt(quarterlyPayment)}</div>
                            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Due: {item.due}</div>
                            {item.status === 'paid' && <div style={{ fontSize: 12, fontWeight: 700, color: '#22c55e', marginTop: 4 }}>✅ Paid</div>}
                            {item.status === 'upcoming' && <div style={{ fontSize: 12, fontWeight: 600, color: '#f59e0b', marginTop: 4 }}>⏳ Upcoming</div>}
                        </div>
                    ))}
                </div>
                <div style={{ marginTop: '1rem', padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fef3c7', fontSize: 12, color: '#92400e' }}>
                    ⚠️ Tax year runs April to March. Quarterly payments are due on the 15th of the month following each quarter. Late payments incur 20% penalty + interest.
                </div>
            </div>
        </div>
    );
};

const card: React.CSSProperties = {
    background: 'white', borderRadius: 12, padding: '1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
};
const cardTitle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };
const kpiCard: React.CSSProperties = { ...card, textAlign: 'center' as const };
const kpiLabel: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginBottom: 4 };
const kpiValue: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' };

export default TaxSpeedometer;
