/**
 * TaxEngineEditor.tsx — Dynamic Tax Brackets Editor
 *
 * Edit APIT/PAYE percentages and relief amount.
 * Saves to system_settings/tax_config → instant push to all apps.
 */

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

interface TaxBracket {
    threshold: number;    // LKR
    percentage: number;   // %
}

interface TaxConfig {
    brackets: TaxBracket[];
    standard_relief: number;
    personal_relief: number;
    updated_at?: any;
    updated_by?: string;
    fiscal_year?: string;
}

const DEFAULT_CONFIG: TaxConfig = {
    brackets: [
        { threshold: 1200000, percentage: 6 },
        { threshold: 1200000, percentage: 12 },
        { threshold: 1200000, percentage: 18 },
        { threshold: 1200000, percentage: 24 },
        { threshold: 1200000, percentage: 30 },
        { threshold: Infinity, percentage: 36 },
    ],
    standard_relief: 1200000,
    personal_relief: 0,
    fiscal_year: '2025/2026',
};

export default function TaxEngineEditor() {
    const [config, setConfig] = useState<TaxConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState('');

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const snap = await getDoc(doc(db, 'system_settings', 'tax_config'));
                if (snap.exists()) {
                    const data = snap.data() as TaxConfig;
                    setConfig({
                        ...DEFAULT_CONFIG,
                        ...data,
                        brackets: data.brackets || DEFAULT_CONFIG.brackets,
                    });
                }
            } catch (err) {
                console.error('Tax config fetch error:', err);
            }
            setLoading(false);
        };
        fetchConfig();
    }, []);

    const handleBracketChange = (index: number, field: 'threshold' | 'percentage', value: number) => {
        const updated = [...config.brackets];
        updated[index] = { ...updated[index], [field]: value };
        setConfig({ ...config, brackets: updated });
    };

    const addBracket = () => {
        setConfig({
            ...config,
            brackets: [...config.brackets, { threshold: 1200000, percentage: 0 }],
        });
    };

    const removeBracket = (index: number) => {
        if (config.brackets.length <= 1) return;
        const updated = config.brackets.filter((_, i) => i !== index);
        setConfig({ ...config, brackets: updated });
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage('');
        try {
            await setDoc(doc(db, 'system_settings', 'tax_config'), {
                brackets: config.brackets,
                standard_relief: config.standard_relief,
                personal_relief: config.personal_relief,
                fiscal_year: config.fiscal_year,
                updated_at: serverTimestamp(),
            });
            setSaveMessage('✅ Tax config published! All apps will update instantly.');
        } catch (err: any) {
            setSaveMessage(`❌ Error: ${err.message}`);
        }
        setSaving(false);
        setTimeout(() => setSaveMessage(''), 5000);
    };

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
            padding: '0.6rem 0.75rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '0.5rem',
            color: '#fff',
            fontSize: '0.85rem',
            width: '100%',
            outline: 'none',
            boxSizing: 'border-box' as const,
        },
        bracketRow: {
            display: 'grid',
            gridTemplateColumns: '1fr 100px 40px',
            gap: '0.5rem',
            alignItems: 'center',
            marginBottom: '0.5rem',
        },
        removeBtn: {
            background: 'rgba(248,113,113,0.2)',
            border: 'none',
            color: '#f87171',
            borderRadius: '0.35rem',
            padding: '0.5rem',
            cursor: 'pointer',
            fontSize: '0.8rem',
        },
        saveBtn: {
            padding: '0.85rem 2rem',
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            border: 'none',
            borderRadius: '0.75rem',
            color: '#fff',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
        },
        addBtn: {
            padding: '0.5rem 1rem',
            background: 'rgba(52,211,153,0.2)',
            border: '1px solid rgba(52,211,153,0.3)',
            borderRadius: '0.5rem',
            color: '#34d399',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer',
        },
    };

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '4rem', color: '#a5b4fc' }}>Loading tax config...</div>;
    }

    return (
        <div>
            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                🧾 Tax Engine Configurator
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '1.5rem' }}>
                Update Sri Lankan APIT brackets. Changes push to all mobile apps instantly.
            </p>

            {/* Fiscal Year & Relief */}
            <div style={s.card}>
                <h3 style={{ color: '#c7d2fe', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                    📅 Fiscal Year & Relief
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div>
                        <label style={s.label}>Fiscal Year</label>
                        <input
                            style={s.input}
                            value={config.fiscal_year || ''}
                            onChange={e => setConfig({ ...config, fiscal_year: e.target.value })}
                            placeholder="e.g. 2025/2026"
                        />
                    </div>
                    <div>
                        <label style={s.label}>Standard Relief (LKR)</label>
                        <input
                            style={s.input}
                            type="number"
                            value={config.standard_relief}
                            onChange={e => setConfig({ ...config, standard_relief: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <label style={s.label}>Personal Relief (LKR)</label>
                        <input
                            style={s.input}
                            type="number"
                            value={config.personal_relief}
                            onChange={e => setConfig({ ...config, personal_relief: Number(e.target.value) })}
                        />
                    </div>
                </div>
            </div>

            {/* Tax Brackets */}
            <div style={s.card}>
                <h3 style={{ color: '#c7d2fe', fontSize: '0.95rem', fontWeight: 700, margin: '0 0 1rem' }}>
                    📊 Progressive APIT Tax Brackets
                </h3>

                <div style={{ ...s.bracketRow, marginBottom: '0.75rem' }}>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>SLAB AMOUNT (LKR)</span>
                    <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600 }}>TAX %</span>
                    <span></span>
                </div>

                {config.brackets.map((bracket, i) => (
                    <div key={i} style={s.bracketRow}>
                        <input
                            style={s.input}
                            type="number"
                            value={bracket.threshold === Infinity ? '' : bracket.threshold}
                            onChange={e => handleBracketChange(i, 'threshold', Number(e.target.value) || 0)}
                            placeholder={bracket.threshold === Infinity ? '∞ (Remainder)' : 'Amount'}
                        />
                        <input
                            style={s.input}
                            type="number"
                            value={bracket.percentage}
                            onChange={e => handleBracketChange(i, 'percentage', Number(e.target.value) || 0)}
                        />
                        <button style={s.removeBtn} onClick={() => removeBracket(i)}>✕</button>
                    </div>
                ))}

                <button style={s.addBtn} onClick={addBracket}>
                    + Add Bracket
                </button>
            </div>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <button style={s.saveBtn} onClick={handleSave} disabled={saving}>
                    {saving ? '⏳ Publishing...' : '🚀 Save & Publish to All Apps'}
                </button>
                {saveMessage && (
                    <span style={{ color: saveMessage.includes('✅') ? '#34d399' : '#f87171', fontSize: '0.85rem' }}>
                        {saveMessage}
                    </span>
                )}
            </div>
        </div>
    );
}
