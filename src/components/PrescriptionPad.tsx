import React, { useState } from 'react';

const commonDrugs = [
    { name: 'Paracetamol 500mg', dose: '1 tab', freq: 'TDS', days: 3, category: 'Analgesic' },
    { name: 'Amoxicillin 500mg', dose: '1 cap', freq: 'TDS', days: 5, category: 'Antibiotic' },
    { name: 'Omeprazole 20mg', dose: '1 cap', freq: 'BD', days: 14, category: 'GI' },
    { name: 'Metformin 500mg', dose: '1 tab', freq: 'BD', days: 30, category: 'Diabetic' },
    { name: 'Amlodipine 5mg', dose: '1 tab', freq: 'OD', days: 30, category: 'Cardiac' },
    { name: 'Losartan 50mg', dose: '1 tab', freq: 'OD', days: 30, category: 'Cardiac' },
    { name: 'Atorvastatin 10mg', dose: '1 tab', freq: 'ON', days: 30, category: 'Lipid' },
    { name: 'Cetirizine 10mg', dose: '1 tab', freq: 'OD', days: 7, category: 'Allergy' },
    { name: 'Salbutamol inhaler', dose: '2 puffs', freq: 'PRN', days: 30, category: 'Respiratory' },
    { name: 'Diclofenac 50mg', dose: '1 tab', freq: 'BD', days: 5, category: 'NSAID' },
    { name: 'Domperidone 10mg', dose: '1 tab', freq: 'TDS', days: 5, category: 'GI' },
    { name: 'Metronidazole 400mg', dose: '1 tab', freq: 'TDS', days: 7, category: 'Antibiotic' },
];

const categoryColors: Record<string, string> = {
    Analgesic: '#f59e0b',
    Antibiotic: '#ef4444',
    GI: '#8b5cf6',
    Diabetic: '#06b6d4',
    Cardiac: '#ec4899',
    Lipid: '#f97316',
    Allergy: '#14b8a6',
    Respiratory: '#3b82f6',
    NSAID: '#eab308',
};

/* Frequency label map for readability */
const freqLabels: Record<string, string> = {
    OD: 'Once daily',
    BD: 'Twice daily',
    TDS: 'Three times daily',
    QDS: 'Four times daily',
    ON: 'At night',
    PRN: 'As needed',
    SOS: 'If needed',
};

interface PrescriptionItem { name: string; dose: string; freq: string; days: number; category?: string; }

interface Props { patientName?: string; onClose?: () => void; }

const PrescriptionPad: React.FC<Props> = ({ patientName = '', onClose }) => {
    const [items, setItems] = useState<PrescriptionItem[]>([]);
    const [search, setSearch] = useState('');
    const [patient, setPatient] = useState(patientName);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);

    const categories = Array.from(new Set(commonDrugs.map(d => d.category)));

    const filtered = commonDrugs.filter(d => {
        const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase());
        const matchCat = !activeCategory || d.category === activeCategory;
        return matchSearch && matchCat;
    });

    const addDrug = (drug: typeof commonDrugs[0]) => {
        setItems(prev => [...prev, { name: drug.name, dose: drug.dose, freq: drug.freq, days: drug.days, category: drug.category }]);
    };

    const removeDrug = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const now = new Date().toLocaleDateString('en-LK');
        w.document.write(`<html><head><title>Prescription</title><style>
            body{font-family:'Segoe UI',system-ui,sans-serif;padding:40px;max-width:650px;margin:0 auto;color:#1e293b}
            h1{font-size:20px;border-bottom:2px solid #1e293b;padding-bottom:10px;margin-bottom:16px}
            .meta{display:flex;justify-content:space-between;margin-bottom:20px;font-size:14px;color:#475569}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th{padding:10px 12px;text-align:left;font-size:13px;font-weight:700;color:#475569;background:#f8fafc;border-bottom:2px solid #e2e8f0}
            td{padding:10px 12px;font-size:14px;border-bottom:1px solid #f1f5f9}
            .drug-name{font-weight:600;color:#1e293b}
            .footer{margin-top:60px;display:flex;justify-content:space-between;font-size:14px;color:#475569}
        </style></head><body>`);
        w.document.write(`<h1>℞ Prescription</h1>`);
        w.document.write(`<div class="meta"><div><strong>Patient:</strong> ${patient || '___________'}</div><div><strong>Date:</strong> ${now}</div></div>`);
        w.document.write('<table><thead><tr><th>#</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>');
        items.forEach((item, i) => {
            w.document.write(`<tr><td>${i + 1}</td><td class="drug-name">${item.name}</td><td>${item.dose}</td><td>${item.freq} (${freqLabels[item.freq] || item.freq})</td><td>${item.days} days</td></tr>`);
        });
        w.document.write('</tbody></table><div class="footer"><div>Doctor\'s Signature: ___________</div><div>SLMC Reg: ___________</div></div></body></html>');
        w.document.close();
        w.print();
    };

    const card: React.CSSProperties = {
        background: 'white', borderRadius: 14, padding: '1.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        border: '1px solid #e2e8f0',
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em' }}>
                    💊 Prescription Pad
                </h2>
                {onClose && (
                    <button onClick={onClose} style={{
                        background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8,
                        padding: '8px 16px', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: '#475569',
                        transition: 'all 0.2s',
                    }}>← Back</button>
                )}
            </div>

            {/* Patient Name */}
            <div style={{ ...card, marginBottom: '1.25rem' }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Patient Name
                </label>
                <input
                    value={patient} onChange={e => setPatient(e.target.value)}
                    placeholder="Enter patient name"
                    style={{
                        width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                        fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                        transition: 'border-color 0.2s', color: '#1e293b',
                    }}
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                {/* ===== Drug Picker ===== */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        Common Medications
                    </h3>
                    <p style={{ margin: '0 0 0.75rem', fontSize: 13.5, color: '#64748b' }}>
                        Tap any medication to add it to the prescription
                    </p>

                    {/* Search */}
                    <input
                        value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search medication or category..."
                        style={{
                            width: '100%', padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                            fontSize: 14, outline: 'none', fontFamily: 'inherit', marginBottom: 10,
                            boxSizing: 'border-box', color: '#1e293b', background: '#f8fafc',
                        }}
                    />

                    {/* Category Filter Pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                        <button
                            onClick={() => setActiveCategory(null)}
                            style={{
                                padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                background: !activeCategory ? '#6366f1' : '#f1f5f9',
                                color: !activeCategory ? 'white' : '#64748b',
                            }}
                        >All</button>
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                                style={{
                                    padding: '5px 12px', borderRadius: 20, fontSize: 12.5, fontWeight: 600,
                                    cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                                    background: activeCategory === cat ? (categoryColors[cat] || '#6366f1') : '#f1f5f9',
                                    color: activeCategory === cat ? 'white' : '#64748b',
                                }}
                            >{cat}</button>
                        ))}
                    </div>

                    {/* Drug List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 380, overflowY: 'auto' }}>
                        {filtered.map((d, i) => {
                            const catColor = categoryColors[d.category] || '#6366f1';
                            return (
                                <button key={i} onClick={() => addDrug(d)} style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    padding: '12px 14px', background: '#fafbfc', border: '1px solid #e8ecf1',
                                    borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                                    transition: 'all 0.15s ease',
                                    borderLeft: `3px solid ${catColor}`,
                                }}>
                                    <div>
                                        <div style={{ fontSize: 14.5, fontWeight: 600, color: '#1e293b', marginBottom: 3 }}>
                                            {d.name}
                                        </div>
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                            <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{d.dose}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                                            <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{d.freq}</span>
                                            <span style={{ width: 3, height: 3, borderRadius: '50%', background: '#cbd5e1', flexShrink: 0 }} />
                                            <span style={{ fontSize: 12.5, color: '#475569', fontWeight: 500 }}>{d.days} days</span>
                                        </div>
                                    </div>
                                    <span style={{
                                        fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                                        background: `${catColor}12`, color: catColor,
                                    }}>{d.category}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ===== Current Prescription ===== */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                        ℞ Current Prescription
                    </h3>
                    <p style={{ margin: '0 0 0.75rem', fontSize: 13.5, color: '#64748b' }}>
                        {items.length} medication{items.length !== 1 ? 's' : ''} added
                    </p>

                    {items.length === 0 ? (
                        <div style={{
                            padding: 32, textAlign: 'center', color: '#94a3b8', fontSize: 14,
                            background: '#f8fafc', borderRadius: 10, border: '2px dashed #e2e8f0',
                        }}>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
                            Tap medications on the left to add them here
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                                {items.map((item, i) => {
                                    const catColor = categoryColors[item.category || ''] || '#6366f1';
                                    return (
                                        <div key={i} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '14px 16px', background: 'white', borderRadius: 10,
                                            border: '1.5px solid #e2e8f0', borderLeft: `4px solid ${catColor}`,
                                        }}>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 4 }}>
                                                    {i + 1}. {item.name}
                                                </div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                                                    <span style={{
                                                        fontSize: 12.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                                                        background: '#f0f9ff', color: '#0369a1',
                                                    }}>{item.dose}</span>
                                                    <span style={{
                                                        fontSize: 12.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                                                        background: '#f0fdf4', color: '#15803d',
                                                    }}>{item.freq} — {freqLabels[item.freq] || item.freq}</span>
                                                    <span style={{
                                                        fontSize: 12.5, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                                                        background: '#fefce8', color: '#a16207',
                                                    }}>{item.days} days</span>
                                                </div>
                                            </div>
                                            <button onClick={() => removeDrug(i)} style={{
                                                background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
                                                color: '#dc2626', padding: '6px 10px', cursor: 'pointer',
                                                fontSize: 13, fontWeight: 700, transition: 'all 0.2s', marginLeft: 12,
                                            }}>✕</button>
                                        </div>
                                    );
                                })}
                            </div>

                            <button onClick={handlePrint} style={{
                                width: '100%', padding: 14, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                color: 'white', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700,
                                cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
                                letterSpacing: '-0.01em', transition: 'all 0.2s',
                            }}>
                                🖨️ Print Prescription
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PrescriptionPad;
