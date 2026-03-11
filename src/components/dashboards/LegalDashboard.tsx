import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import db, { CourtDiaryEntry, TrustTransaction, CaseRecord } from '../../lib/db';
import DashboardLayout from './DashboardLayout';

// ─── Props ──────────────────────────────────────────────────────────
interface LegalDashboardProps {
  userName: string;
  onChangeProfession: () => void;
  onLogout: () => void;
}

// ─── Navigation ─────────────────────────────────────────────────────
const navItems = [
  { id: 'overview', label: 'Dashboard', icon: '📊' },
  { id: 'diary', label: 'Court Diary', icon: '📅' },
  { id: 'cases', label: 'Cases & Clients', icon: '📁' },
  { id: 'trust', label: 'Trust Accounting', icon: '🏦' },
  { id: 'ai', label: 'AI Tools', icon: '🤖' },
  { id: 'documents', label: 'Documents', icon: '📄' },
  { id: 'billing', label: 'Billing', icon: '💰' },
  { id: 'reports', label: 'Reports', icon: '📋' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

// ─── Constants ──────────────────────────────────────────────────────
const NAVY = '#0f172a';
const GOLD = '#f59e0b';
const WHITE = '#ffffff';

const formatLKR = (amount: number) =>
  new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);

const CASE_TYPE_COLORS: Record<string, string> = {
  civil: '#6366f1',
  criminal: '#ef4444',
  corporate: '#3b82f6',
  estate: '#8b5cf6',
  ip: '#f59e0b',
  family: '#ec4899',
  labour: '#14b8a6',
  other: '#64748b',
};

const TRANSACTION_TYPE_ICONS: Record<string, string> = {
  retainer_receipt: '💰',
  appearance_fee: '⚖️',
  court_stamp: '📜',
  typist_fee: '✍️',
  refund: '🔄',
  transfer: '➡️',
};

// ─── Sample data ────────────────────────────────────────────────────
const sampleCases: Partial<CaseRecord>[] = [
  { id: 1, clientName: 'Mr. Silva', caseTitle: 'Silva vs Perera — Property Dispute', caseNumber: 'DC/COL/2456', caseType: 'civil', court: 'Colombo District Court', judge: 'Hon. Justice Gunawardena', status: 'active', retainerBalance: 75000, totalBilled: 250000, totalPaid: 175000 },
  { id: 2, clientName: 'ABC Holdings', caseTitle: 'ABC Holdings — Company Registration', caseNumber: 'RGS/2026/045', caseType: 'corporate', court: 'Registrar of Companies', judge: '-', status: 'active', retainerBalance: 50000, totalBilled: 75000, totalPaid: 25000 },
  { id: 3, clientName: 'Mr. Fernando', caseTitle: 'Fernando — Criminal Defense', caseNumber: 'MC/KDY/1289', caseType: 'criminal', court: 'Kandy Magistrate Court', judge: 'Hon. Magistrate Wijeratne', status: 'active', retainerBalance: 100000, totalBilled: 150000, totalPaid: 50000 },
  { id: 4, clientName: 'Wijesinghe Family', caseTitle: 'Wijesinghe Estate — Will Probate', caseNumber: 'PROB/COL/089', caseType: 'estate', court: 'Colombo District Court', judge: 'Hon. Justice Perera', status: 'completed', retainerBalance: 0, totalBilled: 120000, totalPaid: 120000 },
  { id: 5, clientName: 'Tech Lanka Pvt', caseTitle: 'Tech Lanka — IP Protection', caseNumber: 'CHC/201/2026', caseType: 'ip', court: 'Commercial High Court', judge: 'Hon. Justice Perera', status: 'active', retainerBalance: 80000, totalBilled: 180000, totalPaid: 100000 },
];

const sampleDiary: Partial<CourtDiaryEntry>[] = [
  { date: '2026-03-18', caseId: 'c1', caseTitle: 'Silva vs Perera', court: 'Colombo District Court', courtNo: '12', time: '10:00 AM', judge: 'Hon. Justice Gunawardena', hearingType: 'trial', status: 'confirmed', courtLocation: 'hulftsdorp' },
  { date: '2026-03-18', caseId: 'c3', caseTitle: 'Fernando Defense', court: 'Kandy Magistrate Court', courtNo: '5', time: '9:30 AM', judge: 'Hon. Magistrate Wijeratne', hearingType: 'mention', status: 'confirmed', courtLocation: 'outstation' },
  { date: '2026-03-22', caseId: 'c5', caseTitle: 'Tech Lanka — IP', court: 'Commercial High Court', courtNo: '3', time: '2:00 PM', judge: 'Hon. Justice Perera', hearingType: 'argument', status: 'tentative', courtLocation: 'hulftsdorp' },
  { date: '2026-04-02', caseId: 'c4', caseTitle: 'Land Registry Appeal', court: 'Court of Appeal', courtNo: '1', time: '11:00 AM', judge: 'TBD', hearingType: 'inquiry', status: 'tentative', courtLocation: 'hulftsdorp' },
];

const sampleTrustTransactions: Partial<TrustTransaction>[] = [
  { date: '2026-03-10', clientName: 'ABC Holdings', type: 'retainer_receipt', amount: 75000, description: 'Retainer deposit', account: 'trust' },
  { date: '2026-03-08', clientName: 'Mr. Silva', type: 'appearance_fee', amount: 50000, description: 'Court appearance — District Court', account: 'operating' },
  { date: '2026-03-07', clientName: 'Tech Lanka Pvt', type: 'retainer_receipt', amount: 100000, description: 'IP consultation retainer', account: 'trust' },
  { date: '2026-03-05', clientName: 'Wijesinghe Family', type: 'appearance_fee', amount: 35000, description: 'Probate hearing', account: 'operating' },
  { date: '2026-03-05', clientName: 'Mr. Silva', type: 'court_stamp', amount: 2500, description: 'Court stamp fees', account: 'operating' },
  { date: '2026-03-01', clientName: 'Mr. Fernando', type: 'retainer_receipt', amount: 100000, description: 'Defense retainer', account: 'trust' },
];

const legalExpenseCategories = [
  { name: 'Office Rent', icon: '🏢', color: '#6366f1' },
  { name: 'Staff & Clerks', icon: '👥', color: '#8b5cf6' },
  { name: 'Court Fees', icon: '⚖️', color: '#ec4899' },
  { name: 'Research / Journals', icon: '📚', color: '#22c55e' },
  { name: 'Travel (Court)', icon: '🚗', color: '#f59e0b' },
  { name: 'Bar Association', icon: '🏛️', color: '#06b6d4' },
  { name: 'Office Supplies', icon: '📎', color: '#64748b' },
  { name: 'Insurance', icon: '🛡️', color: '#f97316' },
];

const legalDocuments = [
  { id: 'd1', name: 'Plaint — Silva vs Perera', type: 'Court Filing', case: 'Silva vs Perera', date: '2026-02-15', status: 'filed' },
  { id: 'd2', name: 'Power of Attorney — ABC Holdings', type: 'POA', case: 'ABC Holdings', date: '2026-03-01', status: 'active' },
  { id: 'd3', name: 'Bail Application — Fernando', type: 'Court Filing', case: 'Fernando Defense', date: '2026-03-05', status: 'filed' },
  { id: 'd4', name: 'Last Will — Wijesinghe Estate', type: 'Probate', case: 'Wijesinghe Estate', date: '2026-01-20', status: 'completed' },
  { id: 'd5', name: 'Non-Disclosure Agreement — Tech Lanka', type: 'Agreement', case: 'Tech Lanka', date: '2026-03-08', status: 'draft' },
  { id: 'd6', name: 'Deed of Transfer — Land Sale', type: 'Notarial', case: 'New Matter', date: '2026-03-10', status: 'draft' },
];

// ─── Reusable style objects ─────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  background: WHITE, borderRadius: 12, padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #f1f5f9',
};
const cardTitle: React.CSSProperties = {
  margin: '0 0 12px', fontSize: 15, fontWeight: 650, color: NAVY,
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: '1px solid #e2e8f0', fontSize: 14, fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
};
const selectStyle: React.CSSProperties = { ...inputStyle, background: WHITE };
const labelStyle: React.CSSProperties = {
  fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 4, display: 'block',
};
const primaryBtn: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: 'none',
  background: NAVY, color: WHITE, fontSize: 14, fontWeight: 600,
  cursor: 'pointer', fontFamily: 'inherit',
};
const secondaryBtn: React.CSSProperties = {
  padding: '10px 20px', borderRadius: 8, border: '1px solid #e2e8f0',
  background: WHITE, color: '#475569', fontSize: 14, fontWeight: 500,
  cursor: 'pointer', fontFamily: 'inherit',
};
const badgeBase: React.CSSProperties = {
  display: 'inline-block', padding: '2px 10px', borderRadius: 20,
  fontSize: 11, fontWeight: 650, textTransform: 'capitalize' as const,
};
const modalOverlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000,
};
const modalBox: React.CSSProperties = {
  background: WHITE, borderRadius: 16, padding: 24,
  width: '90%', maxWidth: 500, maxHeight: '80vh', overflowY: 'auto',
};

// =====================================================================
// LegalDashboard Component
// =====================================================================
const LegalDashboard: React.FC<LegalDashboardProps> = ({ userName, onChangeProfession, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [showAddDiary, setShowAddDiary] = useState(false);
  const [showAddCase, setShowAddCase] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // Form states
  const [newDiary, setNewDiary] = useState({
    date: '', caseId: '', court: '', courtNo: '', time: '', judge: '',
    hearingType: 'mention' as const, courtLocation: 'hulftsdorp' as const,
  });
  const [newCase, setNewCase] = useState({
    clientName: '', caseTitle: '', caseNumber: '', caseType: 'civil' as const, court: '', judge: '',
  });
  const [newTransaction, setNewTransaction] = useState({
    clientName: '', type: 'appearance_fee' as const, amount: 0, description: '', account: 'operating' as const,
  });

  // Settings
  const [baslNumber, setBaslNumber] = useState('');
  const [notaryLicense, setNotaryLicense] = useState('');
  const [indemnityInsurance, setIndemnityInsurance] = useState('');
  const [tinNumber, setTinNumber] = useState('');

  // Wake lock ref
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  // Load saved settings
  useEffect(() => {
    try {
      const saved = localStorage.getItem('legalSettings');
      if (saved) {
        const s = JSON.parse(saved);
        setBaslNumber(s.baslNumber || '');
        setNotaryLicense(s.notaryLicense || '');
        setIndemnityInsurance(s.indemnityInsurance || '');
        setTinNumber(s.tinNumber || '');
      }
    } catch { /* ignore */ }
  }, []);

  // ─── UserId & Live Queries ──────────────────────────────────────
  const storedUser = localStorage.getItem('tracksyUser');
  const userId = storedUser ? JSON.parse(storedUser)?.uid : '';

  const courtDiary = useLiveQuery(
    () => db.court_diary.where({ userId }).toArray(),
    [userId],
  ) || [];

  const trustTransactions = useLiveQuery(
    () => db.trust_transactions.where({ userId }).toArray(),
    [userId],
  ) || [];

  const caseRecords = useLiveQuery(
    () => db.case_records.where({ userId }).toArray(),
    [userId],
  ) || [];

  // Display data — fall back to samples
  const displayDiary = courtDiary.length > 0 ? courtDiary : sampleDiary as CourtDiaryEntry[];
  const displayCases = caseRecords.length > 0 ? caseRecords : sampleCases as CaseRecord[];
  const displayTransactions = trustTransactions.length > 0 ? trustTransactions : sampleTrustTransactions as TrustTransaction[];

  // ─── Computed Values ────────────────────────────────────────────
  const trustBalance = displayTransactions
    .filter(t => t.account === 'trust')
    .reduce((s, t) => s + (t.type === 'refund' ? -t.amount : t.amount), 0);

  const operatingIncome = displayTransactions
    .filter(t => t.account === 'operating')
    .reduce((s, t) => s + t.amount, 0);

  const activeCasesCount = displayCases.filter(c => c.status === 'active').length;

  // Conflict detection: same-date entries with different courtLocation
  const getConflictDates = () => {
    const dateMap: Record<string, Set<string>> = {};
    displayDiary.forEach(d => {
      if (!dateMap[d.date]) dateMap[d.date] = new Set();
      if (d.courtLocation) dateMap[d.date].add(d.courtLocation);
    });
    return Object.entries(dateMap)
      .filter(([, locations]) => locations.size > 1)
      .map(([date]) => date);
  };

  // ─── Dexie Add Functions ────────────────────────────────────────
  const handleAddDiary = async () => {
    await db.court_diary.add({
      ...newDiary,
      caseTitle: newDiary.caseId,
      notes: '',
      status: 'confirmed',
      sync_status: 'pending',
      userId,
      createdAt: Date.now(),
    } as CourtDiaryEntry);
    setShowAddDiary(false);
    setNewDiary({ date: '', caseId: '', court: '', courtNo: '', time: '', judge: '', hearingType: 'mention', courtLocation: 'hulftsdorp' });
  };

  const handleAddCase = async () => {
    await db.case_records.add({
      ...newCase,
      status: 'active',
      retainerBalance: 0,
      totalBilled: 0,
      totalPaid: 0,
      sync_status: 'pending',
      userId,
      createdAt: Date.now(),
    } as CaseRecord);
    setShowAddCase(false);
    setNewCase({ clientName: '', caseTitle: '', caseNumber: '', caseType: 'civil', court: '', judge: '' });
  };

  const handleAddTransaction = async () => {
    await db.trust_transactions.add({
      ...newTransaction,
      date: new Date().toISOString().slice(0, 10),
      clientId: '',
      category: '',
      sync_status: 'pending',
      userId,
      createdAt: Date.now(),
    } as TrustTransaction);
    setShowAddTransaction(false);
    setNewTransaction({ clientName: '', type: 'appearance_fee', amount: 0, description: '', account: 'operating' });
  };

  // ─── Wake Lock for Voice Recorder ───────────────────────────────
  const toggleRecording = async () => {
    if (!isRecording) {
      setIsRecording(true);
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch { /* ignore */ }
    } else {
      setIsRecording(false);
      try {
        if (wakeLockRef.current) {
          await wakeLockRef.current.release();
          wakeLockRef.current = null;
        }
      } catch { /* ignore */ }
    }
  };

  // ─── Settings Save ──────────────────────────────────────────────
  const handleSaveSettings = () => {
    localStorage.setItem('legalSettings', JSON.stringify({
      baslNumber, notaryLicense, indemnityInsurance, tinNumber,
    }));
    alert('Settings saved successfully.');
  };

  // =================================================================
  // TAB RENDERERS
  // =================================================================

  // ─── OVERVIEW TAB ───────────────────────────────────────────────
  const renderOverview = () => {
    const todayDiary = displayDiary.slice(0, 3);
    return (
      <div>
        {/* Wallet Cards Row */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            flex: '1 1 280px', padding: 20, borderRadius: 14,
            background: '#f8fafc', border: '1px solid #e2e8f0',
          }}>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginBottom: 4 }}>Client Retainers Held in Trust</div>
            <div style={{ fontSize: 28, fontWeight: 750, color: NAVY, letterSpacing: '-0.02em' }}>{formatLKR(trustBalance)}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Trust Account</div>
          </div>
          <div style={{
            flex: '1 1 280px', padding: 20, borderRadius: 14,
            background: '#f0fdf4', border: '1px solid #bbf7d0',
          }}>
            <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 500, marginBottom: 4 }}>My Taxable Operating Income</div>
            <div style={{ fontSize: 28, fontWeight: 750, color: '#15803d', letterSpacing: '-0.02em' }}>{formatLKR(operatingIncome)}</div>
            <div style={{ fontSize: 11, color: '#86efac', marginTop: 4 }}>Operating Account</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <button
            onClick={() => { setNewTransaction({ ...newTransaction, type: 'appearance_fee', account: 'operating' }); setShowAddTransaction(true); }}
            style={{ ...primaryBtn, background: NAVY, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>⚖️</span> Log Appearance Fee
          </button>
          <button
            onClick={() => { setNewTransaction({ ...newTransaction, type: 'court_stamp', account: 'operating' }); setShowAddTransaction(true); }}
            style={{ ...primaryBtn, background: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <span>📜</span> Log Out-of-Pocket Expense
          </button>
        </div>

        {/* Today's Court Diary */}
        <div style={{ ...cardStyle, marginBottom: 20 }}>
          <h3 style={cardTitle}>📅 Today's Court Diary</h3>
          {todayDiary.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>No upcoming hearings</div>
          ) : (
            todayDiary.map((entry, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '12px 0', borderBottom: i < todayDiary.length - 1 ? '1px solid #f1f5f9' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{entry.caseTitle}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {entry.court} &middot; Court {entry.courtNo} &middot; {entry.time}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>{entry.date}</div>
                  <span style={{
                    ...badgeBase,
                    color: entry.status === 'confirmed' ? '#22c55e' : GOLD,
                    background: entry.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                  }}>{entry.status}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Bottom Row: Active Cases + Token Balance */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '1 1 200px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>📁</div>
            <div style={{ fontSize: 28, fontWeight: 750, color: NAVY }}>{activeCasesCount}</div>
            <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Active Cases</div>
          </div>
          <div style={{
            ...cardStyle, flex: '1 1 200px', textAlign: 'center',
            background: `linear-gradient(135deg, ${GOLD}15, ${GOLD}08)`,
            border: `1px solid ${GOLD}30`,
          }}>
            <div style={{ fontSize: 40, marginBottom: 4 }}>🪙</div>
            <div style={{ fontSize: 28, fontWeight: 750, color: '#92400e' }}>45</div>
            <div style={{ fontSize: 13, color: '#b45309', fontWeight: 500 }}>Tokens Available</div>
          </div>
        </div>
      </div>
    );
  };

  // ─── COURT DIARY TAB ────────────────────────────────────────────
  const renderDiary = () => {
    const conflictDates = getConflictDates();

    // Group diary entries by date
    const grouped: Record<string, typeof displayDiary> = {};
    displayDiary.forEach(entry => {
      if (!grouped[entry.date]) grouped[entry.date] = [];
      grouped[entry.date].push(entry);
    });
    const sortedDates = Object.keys(grouped).sort();

    const hearingTypeColors: Record<string, string> = {
      trial: '#ef4444', mention: '#3b82f6', inquiry: '#8b5cf6',
      support: '#22c55e', argument: '#f59e0b', judgment: '#ec4899', other: '#64748b',
    };

    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: NAVY }}>📅 Court Diary</h2>
          <button onClick={() => setShowAddDiary(true)} style={primaryBtn}>+ Add Hearing</button>
        </div>

        {/* Conflict Alert */}
        {conflictDates.map(date => (
          <div key={date} style={{
            padding: '12px 16px', borderRadius: 10, marginBottom: 12,
            background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b',
            fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 16 }}>⚠️</span>
            Travel Conflict Detected — You have hearings at both Hulftsdorp and Outstation courts on {date}
          </div>
        ))}

        {/* Diary Entries Grouped by Date */}
        {sortedDates.map(date => (
          <div key={date} style={{ marginBottom: 20 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: '#6366f1', marginBottom: 8,
              padding: '6px 12px', background: '#eef2ff', borderRadius: 8, display: 'inline-block',
            }}>{date}</div>

            {grouped[date].map((entry, i) => (
              <div key={i} style={{
                ...cardStyle, marginBottom: 10,
                borderLeft: `3px solid ${hearingTypeColors[entry.hearingType] || '#64748b'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontSize: 15, fontWeight: 650, color: NAVY, marginBottom: 4 }}>{entry.caseTitle}</div>
                    <div style={{ fontSize: 13, color: '#475569', marginBottom: 2 }}>{entry.court} &middot; Court No. {entry.courtNo}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Judge: {entry.judge}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{entry.time}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        ...badgeBase,
                        color: hearingTypeColors[entry.hearingType] || '#64748b',
                        background: `${hearingTypeColors[entry.hearingType] || '#64748b'}18`,
                      }}>{entry.hearingType}</span>
                      <span style={{
                        ...badgeBase,
                        color: entry.status === 'confirmed' ? '#22c55e' : GOLD,
                        background: entry.status === 'confirmed' ? '#dcfce7' : '#fef3c7',
                      }}>{entry.status}</span>
                      <span style={{
                        ...badgeBase, fontSize: 10,
                        color: entry.courtLocation === 'hulftsdorp' ? '#6366f1' : '#f97316',
                        background: entry.courtLocation === 'hulftsdorp' ? '#eef2ff' : '#fff7ed',
                      }}>{entry.courtLocation === 'hulftsdorp' ? '🏛️ Hulftsdorp' : '🚗 Outstation'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  // ─── CASES & CLIENTS TAB ────────────────────────────────────────
  const renderCases = () => (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: NAVY }}>📁 Cases & Clients</h2>
        <button onClick={() => setShowAddCase(true)} style={primaryBtn}>+ New Case</button>
      </div>

      {/* Case Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
        {displayCases.map((c, i) => {
          const typeColor = CASE_TYPE_COLORS[c.caseType] || '#64748b';
          return (
            <div key={c.id || i} style={{
              ...cardStyle, borderTop: `3px solid ${typeColor}`,
              transition: 'box-shadow 0.2s ease',
            }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 15, fontWeight: 650, color: NAVY, marginBottom: 4 }}>{c.caseTitle}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>{c.caseNumber}</div>
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 4 }}>
                <span style={{ fontWeight: 500 }}>Client:</span> {c.clientName}
              </div>
              <div style={{ fontSize: 13, color: '#475569', marginBottom: 10 }}>
                <span style={{ fontWeight: 500 }}>Court:</span> {c.court}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{
                    ...badgeBase, color: typeColor, background: `${typeColor}15`,
                  }}>{c.caseType}</span>
                  <span style={{
                    ...badgeBase,
                    color: c.status === 'active' ? '#3b82f6' : c.status === 'completed' ? '#22c55e' : '#f59e0b',
                    background: c.status === 'active' ? '#dbeafe' : c.status === 'completed' ? '#dcfce7' : '#fef3c7',
                  }}>{c.status}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Retainer Balance</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: c.retainerBalance > 0 ? '#22c55e' : '#94a3b8' }}>
                    {formatLKR(c.retainerBalance)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── TRUST ACCOUNTING TAB ───────────────────────────────────────
  const renderTrust = () => (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: NAVY }}>🏦 Trust Accounting</h2>

      {/* Summary Cards */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ ...cardStyle, flex: '1 1 240px', borderLeft: '4px solid #6366f1' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Trust Balance</div>
          <div style={{ fontSize: 24, fontWeight: 750, color: NAVY }}>{formatLKR(trustBalance)}</div>
        </div>
        <div style={{ ...cardStyle, flex: '1 1 240px', borderLeft: '4px solid #22c55e' }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Operating Income</div>
          <div style={{ fontSize: 24, fontWeight: 750, color: '#15803d' }}>{formatLKR(operatingIncome)}</div>
        </div>
      </div>

      {/* Generate Fee Note */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={() => setShowAddTransaction(true)} style={primaryBtn}>+ Add Transaction</button>
        <button onClick={() => alert('Fee Note generation — Coming Soon')} style={secondaryBtn}>📄 Generate Fee Note</button>
      </div>

      {/* Transaction List */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Recent Transactions</h3>
        {displayTransactions.map((txn, i) => {
          const isIncome = txn.type === 'retainer_receipt';
          const icon = TRANSACTION_TYPE_ICONS[txn.type] || '💼';
          return (
            <div key={txn.id || i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: i < displayTransactions.length - 1 ? '1px solid #f1f5f9' : 'none',
              flexWrap: 'wrap', gap: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 200px' }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: isIncome ? '#f0fdf4' : '#f8fafc',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  flexShrink: 0,
                }}>{icon}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{txn.description}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{txn.date} &middot; {txn.clientName}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{
                  ...badgeBase, fontSize: 10,
                  color: '#6366f1', background: '#eef2ff',
                }}>{txn.type.replace(/_/g, ' ')}</span>
                <span style={{
                  ...badgeBase, fontSize: 10,
                  color: txn.account === 'trust' ? '#8b5cf6' : '#3b82f6',
                  background: txn.account === 'trust' ? '#f5f3ff' : '#eff6ff',
                }}>{txn.account}</span>
                <div style={{
                  fontSize: 15, fontWeight: 700, minWidth: 100, textAlign: 'right',
                  color: isIncome ? '#22c55e' : '#ef4444',
                }}>
                  {isIncome ? '+' : '-'}{formatLKR(txn.amount)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ─── AI TOOLS TAB ───────────────────────────────────────────────
  const renderAI = () => {
    const aiTools = [
      { icon: '📝', title: 'Draft Letter of Demand', desc: 'Generate a professional Letter of Demand', tokens: 1 },
      { icon: '👁️', title: 'Vision AI for Deeds', desc: 'Extract title details from scanned faded deeds', tokens: 3 },
      { icon: '📚', title: 'Judgment Summarizer', desc: 'Summarize Supreme Court Judgments', tokens: 5 },
    ];

    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: NAVY }}>🤖 AI-Powered Legal Tools</h2>
          <span style={{
            padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 650,
            background: `linear-gradient(135deg, ${GOLD}, #d97706)`, color: WHITE,
          }}>🪙 45 Tokens</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {aiTools.map((tool, i) => (
            <div key={i} style={{
              ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              border: `1px solid ${GOLD}30`, position: 'relative', overflow: 'hidden',
            }}>
              <div>
                <div style={{ fontSize: 32, marginBottom: 10 }}>{tool.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 650, color: NAVY, marginBottom: 6 }}>{tool.title}</div>
                <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12, lineHeight: 1.5 }}>{tool.desc}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#92400e' }}>🪙 {tool.tokens} Token{tool.tokens > 1 ? 's' : ''}</span>
                <span style={{
                  ...badgeBase, background: `${GOLD}20`, color: '#92400e', fontSize: 11,
                }}>Coming Soon</span>
              </div>
              <button disabled style={{
                ...primaryBtn, width: '100%', marginTop: 12, opacity: 0.5, cursor: 'not-allowed',
                background: '#94a3b8',
              }}>Coming Soon</button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── DOCUMENTS TAB ──────────────────────────────────────────────
  const renderDocuments = () => {
    const statusColors: Record<string, { color: string; bg: string }> = {
      filed: { color: '#22c55e', bg: '#dcfce7' },
      active: { color: '#3b82f6', bg: '#dbeafe' },
      draft: { color: '#f59e0b', bg: '#fef3c7' },
      completed: { color: '#8b5cf6', bg: '#f5f3ff' },
    };

    return (
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: NAVY }}>📄 Documents</h2>
        <div style={cardStyle}>
          {legalDocuments.map((doc, i) => {
            const sc = statusColors[doc.status] || { color: '#64748b', bg: '#f1f5f9' };
            return (
              <div key={doc.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '14px 0',
                borderBottom: i < legalDocuments.length - 1 ? '1px solid #f1f5f9' : 'none',
                flexWrap: 'wrap', gap: 8,
              }}>
                <div style={{ flex: '1 1 200px' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: NAVY }}>{doc.name}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {doc.case} &middot; {doc.date}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{
                    ...badgeBase, color: '#475569', background: '#f1f5f9',
                  }}>{doc.type}</span>
                  <span style={{
                    ...badgeBase, color: sc.color, background: sc.bg,
                  }}>{doc.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── BILLING TAB ────────────────────────────────────────────────
  const renderBilling = () => {
    const totalBilled = displayCases.reduce((s, c) => s + c.totalBilled, 0);
    const totalPaid = displayCases.reduce((s, c) => s + c.totalPaid, 0);
    const outstanding = totalBilled - totalPaid;

    return (
      <div>
        <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: NAVY }}>💰 Billing & Invoicing</h2>

        {/* Summary */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '1 1 180px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Billed</div>
            <div style={{ fontSize: 22, fontWeight: 750, color: NAVY }}>{formatLKR(totalBilled)}</div>
          </div>
          <div style={{ ...cardStyle, flex: '1 1 180px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Total Received</div>
            <div style={{ fontSize: 22, fontWeight: 750, color: '#22c55e' }}>{formatLKR(totalPaid)}</div>
          </div>
          <div style={{ ...cardStyle, flex: '1 1 180px', textAlign: 'center' }}>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>Outstanding</div>
            <div style={{ fontSize: 22, fontWeight: 750, color: outstanding > 0 ? '#ef4444' : '#22c55e' }}>{formatLKR(outstanding)}</div>
          </div>
        </div>

        <div style={{
          ...cardStyle, textAlign: 'center', padding: 40, color: '#94a3b8',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🧾</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Billing & Invoicing</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Coming in next update</div>
        </div>
      </div>
    );
  };

  // ─── REPORTS TAB ────────────────────────────────────────────────
  const renderReports = () => (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: NAVY }}>📋 Reports</h2>
      <div style={{
        ...cardStyle, textAlign: 'center', padding: 40, color: '#94a3b8',
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Reports</div>
        <div style={{ fontSize: 13, marginTop: 4 }}>Coming in next update</div>
      </div>
    </div>
  );

  // ─── SETTINGS TAB ───────────────────────────────────────────────
  const renderSettings = () => (
    <div>
      <h2 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 700, color: NAVY }}>⚙️ Legal Practice Settings</h2>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <h3 style={cardTitle}>Professional Details</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>BASL Registration Number</label>
            <input
              style={inputStyle}
              placeholder="e.g. BASL/2015/1234"
              value={baslNumber}
              onChange={e => setBaslNumber(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Notary Public License Number</label>
            <input
              style={inputStyle}
              placeholder="e.g. NP/WP/5678"
              value={notaryLicense}
              onChange={e => setNotaryLicense(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>Professional Indemnity Insurance</label>
            <input
              style={inputStyle}
              placeholder="e.g. SLIC Policy No."
              value={indemnityInsurance}
              onChange={e => setIndemnityInsurance(e.target.value)}
            />
          </div>
          <div>
            <label style={labelStyle}>IRD TIN Number</label>
            <input
              style={inputStyle}
              placeholder="e.g. 987654321"
              value={tinNumber}
              onChange={e => setTinNumber(e.target.value)}
            />
          </div>
          <button onClick={handleSaveSettings} style={primaryBtn}>Save Settings</button>
        </div>
      </div>

      {/* Expense Categories (display only) */}
      <div style={cardStyle}>
        <h3 style={cardTitle}>Expense Categories</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
          {legalExpenseCategories.map(cat => (
            <div key={cat.name} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
              borderRadius: 10, background: `${cat.color}08`, border: `1px solid ${cat.color}20`,
            }}>
              <span style={{ fontSize: 20 }}>{cat.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 500, color: '#475569' }}>{cat.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // =================================================================
  // Tab Router
  // =================================================================
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview': return renderOverview();
      case 'diary': return renderDiary();
      case 'cases': return renderCases();
      case 'trust': return renderTrust();
      case 'ai': return renderAI();
      case 'documents': return renderDocuments();
      case 'billing': return renderBilling();
      case 'reports': return renderReports();
      case 'settings': return renderSettings();
      default: return renderOverview();
    }
  };

  // =================================================================
  // MODALS
  // =================================================================

  const renderDiaryModal = () => (
    <div style={modalOverlay} onClick={() => setShowAddDiary(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>📅 Add Court Hearing</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input type="date" style={inputStyle} value={newDiary.date}
              onChange={e => setNewDiary({ ...newDiary, date: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Case Title / ID</label>
            <input style={inputStyle} placeholder="Case reference"
              value={newDiary.caseId} onChange={e => setNewDiary({ ...newDiary, caseId: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Court</label>
              <input style={inputStyle} placeholder="e.g. Colombo District Court"
                value={newDiary.court} onChange={e => setNewDiary({ ...newDiary, court: e.target.value })} />
            </div>
            <div style={{ flex: '0 0 100px' }}>
              <label style={labelStyle}>Court No.</label>
              <input style={inputStyle} placeholder="e.g. 12"
                value={newDiary.courtNo} onChange={e => setNewDiary({ ...newDiary, courtNo: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Time</label>
              <input style={inputStyle} placeholder="e.g. 10:00 AM"
                value={newDiary.time} onChange={e => setNewDiary({ ...newDiary, time: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Judge</label>
              <input style={inputStyle} placeholder="Hon. Justice..."
                value={newDiary.judge} onChange={e => setNewDiary({ ...newDiary, judge: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Hearing Type</label>
              <select style={selectStyle} value={newDiary.hearingType}
                onChange={e => setNewDiary({ ...newDiary, hearingType: e.target.value as any })}>
                <option value="mention">Mention</option>
                <option value="trial">Trial</option>
                <option value="inquiry">Inquiry</option>
                <option value="argument">Argument</option>
                <option value="support">Support</option>
                <option value="judgment">Judgment</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Court Location</label>
              <select style={selectStyle} value={newDiary.courtLocation}
                onChange={e => setNewDiary({ ...newDiary, courtLocation: e.target.value as any })}>
                <option value="hulftsdorp">Hulftsdorp</option>
                <option value="outstation">Outstation</option>
              </select>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={() => setShowAddDiary(false)} style={secondaryBtn}>Cancel</button>
          <button onClick={handleAddDiary} style={primaryBtn}>Save Hearing</button>
        </div>
      </div>
    </div>
  );

  const renderCaseModal = () => (
    <div style={modalOverlay} onClick={() => setShowAddCase(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>📁 Add New Case</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Client Name</label>
            <input style={inputStyle} placeholder="e.g. Mr. Perera"
              value={newCase.clientName} onChange={e => setNewCase({ ...newCase, clientName: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Case Title</label>
            <input style={inputStyle} placeholder="e.g. Perera vs Silva — Land Dispute"
              value={newCase.caseTitle} onChange={e => setNewCase({ ...newCase, caseTitle: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Case Number</label>
            <input style={inputStyle} placeholder="e.g. DC/COL/9999"
              value={newCase.caseNumber} onChange={e => setNewCase({ ...newCase, caseNumber: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Case Type</label>
              <select style={selectStyle} value={newCase.caseType}
                onChange={e => setNewCase({ ...newCase, caseType: e.target.value as any })}>
                <option value="civil">Civil</option>
                <option value="criminal">Criminal</option>
                <option value="corporate">Corporate</option>
                <option value="estate">Estate / Probate</option>
                <option value="ip">IP Law</option>
                <option value="family">Family</option>
                <option value="labour">Labour</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Court</label>
            <input style={inputStyle} placeholder="e.g. Colombo District Court"
              value={newCase.court} onChange={e => setNewCase({ ...newCase, court: e.target.value })} />
          </div>
          <div>
            <label style={labelStyle}>Judge</label>
            <input style={inputStyle} placeholder="Hon. Justice..."
              value={newCase.judge} onChange={e => setNewCase({ ...newCase, judge: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={() => setShowAddCase(false)} style={secondaryBtn}>Cancel</button>
          <button onClick={handleAddCase} style={primaryBtn}>Save Case</button>
        </div>
      </div>
    </div>
  );

  const renderTransactionModal = () => (
    <div style={modalOverlay} onClick={() => setShowAddTransaction(false)}>
      <div style={modalBox} onClick={e => e.stopPropagation()}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: NAVY }}>🏦 Add Transaction</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Client Name</label>
            <input style={inputStyle} placeholder="e.g. Mr. Silva"
              value={newTransaction.clientName} onChange={e => setNewTransaction({ ...newTransaction, clientName: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Transaction Type</label>
              <select style={selectStyle} value={newTransaction.type}
                onChange={e => setNewTransaction({ ...newTransaction, type: e.target.value as any })}>
                <option value="appearance_fee">Appearance Fee</option>
                <option value="court_stamp">Court Stamp</option>
                <option value="typist_fee">Typist Fee</option>
                <option value="retainer_receipt">Retainer Receipt</option>
                <option value="refund">Refund</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Account</label>
              <select style={selectStyle} value={newTransaction.account}
                onChange={e => setNewTransaction({ ...newTransaction, account: e.target.value as any })}>
                <option value="operating">Operating</option>
                <option value="trust">Trust</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Amount (LKR)</label>
            <input type="number" style={inputStyle} placeholder="0"
              value={newTransaction.amount || ''} onChange={e => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <input style={inputStyle} placeholder="e.g. Court appearance — District Court"
              value={newTransaction.description} onChange={e => setNewTransaction({ ...newTransaction, description: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button onClick={() => setShowAddTransaction(false)} style={secondaryBtn}>Cancel</button>
          <button onClick={handleAddTransaction} style={primaryBtn}>Save Transaction</button>
        </div>
      </div>
    </div>
  );

  // =================================================================
  // RENDER
  // =================================================================
  return (
    <DashboardLayout
      profession="legal"
      professionLabel="LexTracksy"
      professionIcon="⚖️"
      userName={userName}
      navItems={navItems}
      activeNav={activeTab}
      onNavChange={setActiveTab}
      onChangeProfession={onChangeProfession}
      onLogout={onLogout}
    >
      {/* Tab content */}
      {renderTabContent()}

      {/* FAB Voice Recorder */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000 }}>
        <button
          onClick={toggleRecording}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            border: 'none', cursor: 'pointer',
            background: isRecording
              ? '#ef4444'
              : `linear-gradient(135deg, ${GOLD}, #d97706)`,
            color: WHITE, fontSize: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isRecording
              ? '0 4px 20px rgba(239,68,68,0.45)'
              : '0 4px 20px rgba(245,158,11,0.35)',
            transition: 'all 0.3s ease',
            animation: isRecording ? 'pulse-recording 1.5s ease-in-out infinite' : 'none',
          }}
          title={isRecording ? 'Stop Recording' : 'Start Voice Note'}
        >
          {isRecording ? '⏹️' : '🎙️'}
        </button>
        <style>{`
          @keyframes pulse-recording {
            0%, 100% { box-shadow: 0 4px 20px rgba(239,68,68,0.45); transform: scale(1); }
            50% { box-shadow: 0 4px 30px rgba(239,68,68,0.7); transform: scale(1.08); }
          }
        `}</style>
      </div>

      {/* Modals */}
      {showAddDiary && renderDiaryModal()}
      {showAddCase && renderCaseModal()}
      {showAddTransaction && renderTransactionModal()}
    </DashboardLayout>
  );
};

export default LegalDashboard;
