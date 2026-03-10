import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Transaction } from './dashboards/TransactionList';

interface Receipt {
    id: string;
    imageData: string;
    amount: number;
    vendor: string;
    date: string;
    category: string;
    capturedAt: string;
}

interface AuditorExportProps {
    invoices: Transaction[];
    expenses: Transaction[];
}

const fmt = (n: number) => `Rs. ${n.toLocaleString('en-LK')}`;

const AuditorExport: React.FC<AuditorExportProps> = ({ invoices, expenses }) => {
    const [selectedYear, setSelectedYear] = useState('2025/26');
    const [exporting, setExporting] = useState(false);
    const [exported, setExported] = useState(false);

    // Load receipts from localStorage
    const getReceipts = (): Receipt[] => {
        try {
            const stored = localStorage.getItem('tracksy_receipts');
            return stored ? JSON.parse(stored) : [];
        } catch { return []; }
    };

    const handleExport = async () => {
        setExporting(true);

        try {
            const allTransactions = [...invoices, ...expenses].sort((a, b) => a.date.localeCompare(b.date));
            const receipts = getReceipts();

            // ===== 1. Create Excel Workbook =====
            const wb = XLSX.utils.book_new();

            // Sheet 1: General Ledger
            const ledgerData = [
                ['MyTracksy — General Ledger'],
                [`Year of Assessment: ${selectedYear}`],
                [`Generated: ${new Date().toLocaleDateString('en-LK')}`],
                [],
                ['Date', 'Description', 'Category', 'Type', 'Debit (Expense)', 'Credit (Income)', 'Status', 'Receipt ID'],
            ];

            let runningBalance = 0;
            allTransactions.forEach(t => {
                const debit = t.type === 'expense' ? t.amount : 0;
                const credit = t.type === 'income' ? t.amount : 0;
                runningBalance += credit - debit;
                ledgerData.push([
                    t.date,
                    t.description,
                    t.category,
                    t.type.toUpperCase(),
                    debit ? debit.toString() : '',
                    credit ? credit.toString() : '',
                    t.status || '',
                    '',
                ]);
            });

            ledgerData.push([]);
            ledgerData.push(['', '', '', 'TOTALS',
                expenses.reduce((s, e) => s + e.amount, 0).toString(),
                invoices.reduce((s, i) => s + i.amount, 0).toString(),
                '', '']);

            const ws1 = XLSX.utils.aoa_to_sheet(ledgerData);
            // Set column widths
            ws1['!cols'] = [
                { wch: 12 }, { wch: 35 }, { wch: 20 }, { wch: 10 },
                { wch: 18 }, { wch: 18 }, { wch: 12 }, { wch: 15 },
            ];
            XLSX.utils.book_append_sheet(wb, ws1, 'General Ledger');

            // Sheet 2: P&L Summary
            const totalIncome = invoices.reduce((s, i) => s + i.amount, 0);
            const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);

            const plData = [
                ['MyTracksy — Profit & Loss Statement'],
                [`Year of Assessment: ${selectedYear}`],
                [],
                ['REVENUE'],
                ['Category', 'Amount (LKR)'],
            ];

            // Group income by category
            const incomeByCategory: Record<string, number> = {};
            invoices.forEach(i => { incomeByCategory[i.category] = (incomeByCategory[i.category] || 0) + i.amount; });
            Object.entries(incomeByCategory).forEach(([cat, amt]) => {
                plData.push([cat, amt.toString()]);
            });
            plData.push(['Total Revenue', totalIncome.toString()]);
            plData.push([]);
            plData.push(['EXPENSES']);
            plData.push(['Category', 'Amount (LKR)']);

            // Group expenses by category
            const expenseByCategory: Record<string, number> = {};
            expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
            Object.entries(expenseByCategory).forEach(([cat, amt]) => {
                plData.push([cat, amt.toString()]);
            });
            plData.push(['Total Expenses', totalExpense.toString()]);
            plData.push([]);
            plData.push(['NET PROFIT / (LOSS)', (totalIncome - totalExpense).toString()]);

            const ws2 = XLSX.utils.aoa_to_sheet(plData);
            ws2['!cols'] = [{ wch: 30 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws2, 'P&L Summary');

            // Sheet 3: Receipt Index
            const receiptData = [
                ['MyTracksy — Receipt Index'],
                [`Year of Assessment: ${selectedYear}`],
                [],
                ['Receipt ID', 'Date', 'Vendor', 'Category', 'Amount (LKR)', 'Captured At', 'Has Image'],
            ];
            receipts.forEach(r => {
                receiptData.push([r.id, r.date, r.vendor, r.category, r.amount.toString(), r.capturedAt, r.imageData ? 'Yes' : 'No']);
            });
            const ws3 = XLSX.utils.aoa_to_sheet(receiptData);
            ws3['!cols'] = [{ wch: 18 }, { wch: 12 }, { wch: 25 }, { wch: 18 }, { wch: 15 }, { wch: 22 }, { wch: 10 }];
            XLSX.utils.book_append_sheet(wb, ws3, 'Receipt Index');

            // Generate Excel buffer
            const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

            // ===== 2. Create ZIP =====
            const zip = new JSZip();

            // Add Excel file
            zip.file(`MyTracksy_Ledger_${selectedYear.replace('/', '-')}.xlsx`, excelBuffer);

            // Add receipt images
            const receiptFolder = zip.folder('Receipts');
            receipts.forEach((r, i) => {
                if (r.imageData && receiptFolder) {
                    // Extract base64 data
                    const base64Data = r.imageData.split(',')[1];
                    if (base64Data) {
                        const ext = r.imageData.includes('png') ? 'png' : 'jpg';
                        receiptFolder.file(`${r.date}_${r.vendor.replace(/[^a-zA-Z0-9]/g, '_')}_${i + 1}.${ext}`, base64Data, { base64: true });
                    }
                }
            });

            // Generate and download ZIP
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            saveAs(zipBlob, `MyTracksy_AuditorPack_${selectedYear.replace('/', '-')}.zip`);

            setExported(true);
            setTimeout(() => setExported(false), 5000);
        } catch (err) {
            console.error('Export error:', err);
            alert('Export failed. Please try again.');
        } finally {
            setExporting(false);
        }
    };

    const totalIncome = invoices.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    const receipts = getReceipts();

    return (
        <div>
            {/* Header Card */}
            <div style={{ ...card, marginBottom: '1.5rem', background: 'linear-gradient(135deg, #1e293b, #334155)', color: 'white', textAlign: 'center', padding: '2rem' }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>📦</div>
                <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.4rem', fontWeight: 800 }}>Auditor Export Pack</h2>
                <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>
                    One-tap export for your Chartered Accountant. Saves 20+ hours of sorting receipts.
                </p>
            </div>

            {/* Year Selector + Export Button */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                <div style={{ ...card, flex: 1, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>📅 Year of Assessment:</span>
                    <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
                        style={{ padding: '8px 16px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, fontWeight: 600, outline: 'none', cursor: 'pointer' }}>
                        <option value="2024/25">2024/25 (Apr 2024 – Mar 2025)</option>
                        <option value="2025/26">2025/26 (Apr 2025 – Mar 2026)</option>
                    </select>
                </div>

                <button onClick={handleExport} disabled={exporting}
                    style={{
                        padding: '14px 32px', background: exported ? '#22c55e' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: 'white', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700,
                        cursor: exporting ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                        boxShadow: '0 4px 16px rgba(99,102,241,0.3)', opacity: exporting ? 0.7 : 1,
                        transition: 'all 0.3s ease',
                    }}>
                    {exporting ? '⏳ Generating...' : exported ? '✅ Downloaded!' : '📦 Export ZIP'}
                </button>
            </div>

            {/* What's Included */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={card}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📊</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>General Ledger (Excel)</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>All transactions with Date, Description, Category, Debit/Credit columns</div>
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#6366f1' }}>{invoices.length + expenses.length} entries</div>
                </div>
                <div style={card}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📈</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>P&L Summary</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Revenue & expenses grouped by category with net profit calculation</div>
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#22c55e' }}>Net: {fmt(totalIncome - totalExpense)}</div>
                </div>
                <div style={card}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>📸</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>Receipt Images</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>All scanned receipts organized in a digital folder</div>
                    <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#f59e0b' }}>{receipts.length} receipts</div>
                </div>
            </div>

            {/* Summary Preview */}
            <div style={card}>
                <h3 style={cardTitleStyle}>📋 Export Preview — {selectedYear}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Revenue Sources</div>
                        {(() => {
                            const byCategory: Record<string, number> = {};
                            invoices.forEach(i => { byCategory[i.category] = (byCategory[i.category] || 0) + i.amount; });
                            return Object.entries(byCategory).map(([cat, amt]) => (
                                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 13, color: '#1e293b' }}>{cat}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>{fmt(amt)}</span>
                                </div>
                            ));
                        })()}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 14 }}>
                            <span>Total Revenue</span>
                            <span style={{ color: '#22c55e' }}>{fmt(totalIncome)}</span>
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginBottom: 8, textTransform: 'uppercase' }}>Expense Categories</div>
                        {(() => {
                            const byCategory: Record<string, number> = {};
                            expenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + e.amount; });
                            return Object.entries(byCategory).map(([cat, amt]) => (
                                <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                                    <span style={{ fontSize: 13, color: '#1e293b' }}>{cat}</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: '#ef4444' }}>{fmt(amt)}</span>
                                </div>
                            ));
                        })()}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 14 }}>
                            <span>Total Expenses</span>
                            <span style={{ color: '#ef4444' }}>{fmt(totalExpense)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Info */}
            <div style={{ marginTop: '1rem', padding: '12px 16px', background: '#dcfce7', borderRadius: 10, border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
                💡 <strong>For Your Accountant:</strong> The exported ZIP contains a perfectly formatted Excel workbook (General Ledger + P&L + Receipt Index) and all receipt images. This can save Rs. 15,000-30,000 in accountant fees and 20+ hours of manual sorting.
            </div>
        </div>
    );
};

const card: React.CSSProperties = { background: 'white', borderRadius: 12, padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9' };
const cardTitleStyle: React.CSSProperties = { margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 600, color: '#1e293b' };

export default AuditorExport;
