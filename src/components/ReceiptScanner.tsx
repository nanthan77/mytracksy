import React, { useState, useRef } from 'react';
import { GOLDEN_LIST, autoCategorizeDr, getCategoryByName } from '../config/goldenListCategories';

interface Receipt {
    id: string;
    imageData: string; // base64
    amount: number;
    vendor: string;
    date: string;
    category: string;
    capturedAt: string;
}

interface ReceiptScannerProps {
    onReceiptSaved?: (receipt: Receipt) => void;
}

const fmt = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const ReceiptScanner: React.FC<ReceiptScannerProps> = ({ onReceiptSaved }) => {
    const [receipts, setReceipts] = useState<Receipt[]>(() => {
        try {
            const stored = localStorage.getItem('tracksy_receipts');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    });

    const [showCapture, setShowCapture] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [form, setForm] = useState({ amount: 0, vendor: '', date: new Date().toISOString().split('T')[0], category: GOLDEN_LIST[0].name });
    const [searchTerm, setSearchTerm] = useState('');
    const [showGuide, setShowGuide] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (ev) => {
            const base64 = ev.target?.result as string;
            setPreviewImage(base64);
            setShowCapture(true);
        };
        reader.readAsDataURL(file);
    };

    const handleSave = () => {
        if (!form.vendor || !form.amount) return;

        const receipt: Receipt = {
            id: `rcpt-${Date.now()}`,
            imageData: previewImage || '',
            amount: form.amount,
            vendor: form.vendor,
            date: form.date,
            category: form.category || autoCategorizeDr(form.vendor),
            capturedAt: new Date().toISOString(),
        };

        const updated = [receipt, ...receipts];
        setReceipts(updated);
        try {
            localStorage.setItem('tracksy_receipts', JSON.stringify(updated));
        } catch { /* storage full */ }

        onReceiptSaved?.(receipt);
        setShowCapture(false);
        setPreviewImage(null);
        setForm({ amount: 0, vendor: '', date: new Date().toISOString().split('T')[0], category: GOLDEN_LIST[0].name });
    };

    const handleDelete = (id: string) => {
        const updated = receipts.filter(r => r.id !== id);
        setReceipts(updated);
        localStorage.setItem('tracksy_receipts', JSON.stringify(updated));
    };

    const totalAmount = receipts.reduce((s, r) => s + r.amount, 0);
    const thisMonth = receipts.filter(r => r.date.startsWith(new Date().toISOString().slice(0, 7)));
    const filtered = receipts.filter(r =>
        !searchTerm || r.vendor.toLowerCase().includes(searchTerm.toLowerCase()) || r.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedCat = getCategoryByName(form.category);

    return (
        <div>
            {/* KPI Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={kpiCard}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Receipts</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>{receipts.length}</div>
                </div>
                <div style={kpiCard}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Total Claimed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#6366f1' }}>{fmt(totalAmount)}</div>
                </div>
                <div style={kpiCard}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>This Month</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#22c55e' }}>{thisMonth.length}</div>
                </div>
                <div style={kpiCard}>
                    <div style={{ fontSize: 12, color: '#94a3b8' }}>Cloud Backed</div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#3b82f6' }}>{receipts.filter(r => r.imageData).length}</div>
                </div>
            </div>

            {/* Capture Button + Guide Toggle */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <button onClick={() => fileInputRef.current?.click()} style={{
                    padding: '12px 24px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
                }}>
                    📸 Scan Receipt
                </button>
                <button onClick={() => setShowGuide(!showGuide)} style={{
                    padding: '12px 20px', background: showGuide ? '#f59e0b' : '#fffbeb',
                    color: showGuide ? 'white' : '#92400e', border: '1.5px solid #f59e0b',
                    borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                    📜 What Can I Claim?
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />

                <div style={{ flex: 1 }}>
                    <input
                        value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                        placeholder="🔍 Search receipts by vendor or category..."
                        style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                </div>
            </div>

            {/* ===== GOLDEN LIST GUIDE ===== */}
            {showGuide && (
                <div style={{ ...card, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #fffbeb, #fef3c7)', border: '2px solid #fbbf24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#92400e' }}>📜 The Golden List — Tax-Deductible Categories</h3>
                        <button onClick={() => setShowGuide(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: '#92400e' }}>✕</button>
                    </div>
                    <div style={{ padding: '0.5rem', background: '#fef9c3', borderRadius: 8, marginBottom: '0.75rem', fontSize: 12, color: '#854d0e' }}>
                        ⚠️ <strong>Private income only:</strong> These deductions apply to your channeling/clinic income, NOT your Government salary.
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                        {GOLDEN_LIST.filter(c => c.id !== 'other').map(cat => (
                            <div key={cat.id} style={{ padding: '0.6rem', background: 'white', borderRadius: 8, border: `1px solid ${cat.color}25`, fontSize: 12 }}>
                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{cat.icon} {cat.name}</div>
                                <div style={{ color: '#64748b', fontStyle: 'italic' }}>{cat.taxNote}</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Capture Form (Modal) */}
            {showCapture && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                    <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', maxWidth: 480, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 700 }}>📸 Receipt Details</h3>

                        {/* Preview */}
                        {previewImage && (
                            <div style={{ marginBottom: '1rem', borderRadius: 10, overflow: 'hidden', border: '2px solid #e2e8f0' }}>
                                <img src={previewImage} alt="Receipt" style={{ width: '100%', maxHeight: 200, objectFit: 'cover' }} />
                            </div>
                        )}

                        {/* Form */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div>
                                <label style={labelStyle}>Vendor / Shop *</label>
                                <input value={form.vendor} onChange={e => {
                                    const vendor = e.target.value;
                                    const autocat = autoCategorizeDr(vendor);
                                    setForm(p => ({ ...p, vendor, category: autocat !== 'Other Deductible Expense' ? autocat : p.category }));
                                }}
                                    placeholder="e.g. SLMC, State Pharmaceuticals, Dialog" style={inputStyle} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <div>
                                    <label style={labelStyle}>Amount (Rs.) *</label>
                                    <input type="number" value={form.amount || ''} onChange={e => setForm(p => ({ ...p, amount: parseFloat(e.target.value) || 0 }))}
                                        placeholder="0" style={inputStyle} min="0" step="10" />
                                </div>
                                <div>
                                    <label style={labelStyle}>Date</label>
                                    <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={inputStyle} />
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Category (Tax Deductible)</label>
                                <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle}>
                                    {GOLDEN_LIST.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                                </select>
                            </div>
                            {/* Tax Note */}
                            {selectedCat && (
                                <div style={{ padding: '8px 12px', background: `${selectedCat.color}08`, borderRadius: 8, border: `1px solid ${selectedCat.color}20`, fontSize: 12 }}>
                                    <span style={{ color: selectedCat.color, fontWeight: 600 }}>{selectedCat.icon} Tax Note:</span>{' '}
                                    <span style={{ color: '#475569' }}>{selectedCat.taxNote}</span>
                                    {selectedCat.isCapitalItem && (
                                        <span style={{ display: 'block', marginTop: 4, color: '#f59e0b', fontWeight: 600 }}>⚡ Capital item — logged for annual depreciation claim.</span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowCapture(false); setPreviewImage(null); }}
                                style={{ padding: '10px 20px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                            <button onClick={handleSave}
                                style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>💾 Save Receipt</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Receipt Gallery */}
            <div style={card}>
                <h3 style={cardTitleStyle}>📋 Receipt Gallery ({filtered.length})</h3>
                {filtered.length === 0 ? (
                    <div style={{ padding: 32, textAlign: 'center', color: '#94a3b8' }}>
                        <div style={{ fontSize: 48, marginBottom: 8 }}>📸</div>
                        <div style={{ fontSize: 14 }}>No receipts yet. Tap "Scan Receipt" to capture one.</div>
                        <div style={{ fontSize: 12, marginTop: 4 }}>Sri Lankan thermal receipts fade fast — digitize them now!</div>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '0.75rem' }}>
                        {filtered.map(r => {
                            const cat = GOLDEN_LIST.find(c => c.name === r.category) || GOLDEN_LIST[GOLDEN_LIST.length - 1];
                            return (
                                <div key={r.id} style={{ display: 'flex', gap: 12, padding: '12px', background: '#f8fafc', borderRadius: 10, border: '1px solid #f1f5f9', alignItems: 'flex-start' }}>
                                    {/* Thumbnail */}
                                    {r.imageData ? (
                                        <div style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', flexShrink: 0, border: '1px solid #e2e8f0' }}>
                                            <img src={r.imageData} alt="Receipt" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    ) : (
                                        <div style={{ width: 60, height: 60, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>📄</div>
                                    )}
                                    {/* Details */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#1e293b' }}>{r.vendor}</div>
                                            <div style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>{fmt(r.amount)}</div>
                                        </div>
                                        <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                            <span>{r.date}</span>
                                            <span style={{ background: `${cat.color}15`, color: cat.color, padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{cat.icon} {r.category}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDelete(r.id)} style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', fontSize: 14, padding: 4 }}>✕</button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Info */}
            <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#dbeafe', borderRadius: 10, border: '1px solid #bfdbfe', fontSize: 12, color: '#1e40af' }}>
                💡 <strong>Tip:</strong> Sri Lankan thermal receipts (fuel, pharmacy) fade within weeks. Scan them immediately to preserve as digital tax deductions. All receipts are backed up locally and can be exported with the Auditor Export feature.
            </div>
        </div>
    );
};

const card: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const cardTitleStyle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };
const kpiCard: React.CSSProperties = { ...card, textAlign: 'center' as const };
const labelStyle: React.CSSProperties = { fontSize: '0.82rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 4 };
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.55rem 0.75rem', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: '0.88rem', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const };

export default ReceiptScanner;
