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

interface PrescriptionItem { name: string; dose: string; freq: string; days: number; }

interface Props { patientName?: string; onClose?: () => void; }

const PrescriptionPad: React.FC<Props> = ({ patientName = '', onClose }) => {
    const [items, setItems] = useState<PrescriptionItem[]>([]);
    const [search, setSearch] = useState('');
    const [patient, setPatient] = useState(patientName);

    const filtered = search ? commonDrugs.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.category.toLowerCase().includes(search.toLowerCase())) : commonDrugs;

    const addDrug = (drug: typeof commonDrugs[0]) => {
        setItems(prev => [...prev, { name: drug.name, dose: drug.dose, freq: drug.freq, days: drug.days }]);
    };

    const removeDrug = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

    const handlePrint = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const now = new Date().toLocaleDateString('en-LK');
        w.document.write(`<html><head><title>Prescription</title><style>body{font-family:serif;padding:40px;max-width:600px;margin:0 auto}h1{font-size:18px;border-bottom:2px solid #000;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{padding:8px;text-align:left;border-bottom:1px solid #ddd;font-size:14px}th{font-weight:bold}.footer{margin-top:60px;display:flex;justify-content:space-between;font-size:14px}</style></head><body>`);
        w.document.write(`<h1>℞ Prescription</h1><p><strong>Patient:</strong> ${patient || '___________'} &nbsp; <strong>Date:</strong> ${now}</p>`);
        w.document.write('<table><thead><tr><th>#</th><th>Medication</th><th>Dose</th><th>Frequency</th><th>Days</th></tr></thead><tbody>');
        items.forEach((item, i) => { w.document.write(`<tr><td>${i + 1}</td><td>${item.name}</td><td>${item.dose}</td><td>${item.freq}</td><td>${item.days}</td></tr>`); });
        w.document.write('</tbody></table><div class="footer"><div>Doctor\'s Signature: ___________</div><div>SLMC Reg: ___________</div></div></body></html>');
        w.document.close();
        w.print();
    };

    const card: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>💊 Prescription Pad</h2>
                {onClose && <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748b' }}>← Back</button>}
            </div>

            {/* Patient Name */}
            <div style={{ ...card, marginBottom: '1rem' }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 }}>Patient Name</label>
                <input value={patient} onChange={e => setPatient(e.target.value)} placeholder="Enter patient name" style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Drug picker */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>Common Medications — Tap to add</h3>
                    <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search drug..." style={{ width: '100%', padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 10, boxSizing: 'border-box' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 320, overflowY: 'auto' }}>
                        {filtered.map((d, i) => (
                            <button key={i} onClick={() => addDrug(d)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#f8fafc', border: '1px solid #f1f5f9', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', textAlign: 'left' }}>
                                <span style={{ fontWeight: 600 }}>{d.name}</span>
                                <span style={{ fontSize: 11, color: '#94a3b8' }}>{d.dose} · {d.freq} · {d.days}d</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Current prescription */}
                <div style={card}>
                    <h3 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 600, color: '#1e293b' }}>℞ Current Prescription ({items.length} items)</h3>
                    {items.length === 0 ? (
                        <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Tap medications on the left to add them</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                                {items.map((item, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(99,102,241,0.05)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.1)' }}>
                                        <div>
                                            <div style={{ fontSize: 13, fontWeight: 600 }}>{i + 1}. {item.name}</div>
                                            <div style={{ fontSize: 11, color: '#6366f1' }}>{item.dose} · {item.freq} · {item.days} days</div>
                                        </div>
                                        <button onClick={() => removeDrug(i)} style={{ background: '#fef2f2', border: 'none', borderRadius: 6, color: '#ef4444', padding: '4px 8px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>✕</button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handlePrint} style={{ width: '100%', padding: 12, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
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
