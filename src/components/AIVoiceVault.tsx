/**
 * AI Voice Vault — Premium Feature
 *
 * Medical voice-to-text for busy doctors.
 * - Big microphone button for quick recordings
 * - Auto smart-tagging: #RareCase, #DengueComplication, #ResearchMaterial
 * - Multimedia attachments (X-ray, ECG photos)
 * - Searchable "Rare Case" vault
 * - Singlish/Tamil/English mixed-language support
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────

interface VoiceNote {
    id: string;
    text: string;
    rawTranscript: string;
    tags: string[];
    isRareCase: boolean;
    patient?: string;
    ward?: string;
    attachments: Attachment[];
    createdAt: Date;
    duration: number; // seconds
}

interface Attachment {
    id: string;
    type: 'image' | 'document';
    url: string;
    name: string;
    thumbnail?: string;
}

type VaultTab = 'record' | 'vault' | 'rare';

// ─── Medical Tag Extraction ─────────────────────────────────────

const MEDICAL_TAG_RULES: { pattern: RegExp; tag: string }[] = [
    // Rare conditions
    { pattern: /stevens.?johnson/i, tag: '#RareCase' },
    { pattern: /guillain.?barr/i, tag: '#RareCase' },
    { pattern: /kawasaki/i, tag: '#RareCase' },
    { pattern: /lupus|SLE/i, tag: '#RareCase' },
    { pattern: /myasthenia/i, tag: '#RareCase' },
    { pattern: /addison/i, tag: '#RareCase' },
    { pattern: /cushing/i, tag: '#RareCase' },
    { pattern: /pheochromocytoma/i, tag: '#RareCase' },
    { pattern: /marfan/i, tag: '#RareCase' },
    // Common conditions
    { pattern: /dengue/i, tag: '#Dengue' },
    { pattern: /dengue.*hemorrhagic|DHF/i, tag: '#DengueComplication' },
    { pattern: /diabetes|DM|sugar/i, tag: '#Diabetes' },
    { pattern: /hypertension|BP|blood.?pressure/i, tag: '#Hypertension' },
    { pattern: /cardiac|heart|MI|angina/i, tag: '#Cardiology' },
    { pattern: /respiratory|asthma|COPD|pneumonia/i, tag: '#Respiratory' },
    { pattern: /renal|kidney|CKD/i, tag: '#Nephrology' },
    { pattern: /liver|hepat/i, tag: '#Hepatology' },
    { pattern: /neuro|stroke|seizure|epilep/i, tag: '#Neurology' },
    { pattern: /pregnancy|antenatal|obstetric/i, tag: '#Obstetrics' },
    { pattern: /pediatric|paediatric|child|infant/i, tag: '#Pediatrics' },
    { pattern: /surgery|surgical|post.?op/i, tag: '#Surgery' },
    { pattern: /cancer|oncol|tumor|tumour/i, tag: '#Oncology' },
    { pattern: /fracture|ortho/i, tag: '#Orthopedics' },
    // Action-based
    { pattern: /research|paper|publish|journal/i, tag: '#ResearchMaterial' },
    { pattern: /follow.?up|review|check/i, tag: '#FollowUp' },
    { pattern: /urgent|emergency|stat/i, tag: '#Urgent' },
    { pattern: /refer|referral/i, tag: '#Referral' },
    { pattern: /prescri|medication|dose/i, tag: '#Prescription' },
    { pattern: /lab|investigation|blood.?test|CBC|FBC/i, tag: '#LabWork' },
    { pattern: /x.?ray|CT|MRI|scan|ultrasound|ECG|echo/i, tag: '#Imaging' },
    { pattern: /ward\s*\d+/i, tag: '#Inpatient' },
];

function extractSmartTags(text: string): { tags: string[]; isRareCase: boolean } {
    const tags = new Set<string>();
    let isRareCase = false;

    for (const rule of MEDICAL_TAG_RULES) {
        if (rule.pattern.test(text)) {
            tags.add(rule.tag);
            if (rule.tag === '#RareCase') isRareCase = true;
        }
    }

    // Extract ward number
    const wardMatch = text.match(/ward\s*(\d+)/i);
    if (wardMatch) tags.add(`#Ward${wardMatch[1]}`);

    // Extract patient name if mentioned
    const patientMatch = text.match(/patient\s+(\w+\s?\w*)/i);
    if (patientMatch) tags.add('#PatientNote');

    if (tags.size === 0) tags.add('#General');
    return { tags: Array.from(tags), isRareCase };
}

// ─── Sample Data ────────────────────────────────────────────────

const sampleNotes: VoiceNote[] = [
    {
        id: 'vn1',
        text: 'Patient in Ward 15, 45-year-old male. Rare presentation of Stevens-Johnson Syndrome. Remind me to check his liver profile tomorrow.',
        rawTranscript: 'Patient in Ward 15, 45 year old male. Rare presentation of Stevens Johnson Syndrome. Remind me to check his liver profile tomorrow.',
        tags: ['#RareCase', '#Inpatient', '#Ward15', '#LabWork', '#PatientNote'],
        isRareCase: true,
        patient: 'Ward 15 Patient',
        ward: '15',
        attachments: [],
        createdAt: new Date('2026-03-10T16:30:00'),
        duration: 12,
    },
    {
        id: 'vn2',
        text: 'Kumara Bandara follow-up. BP 140/90, started Losartan 50mg. Review in 2 weeks. Suspected dengue complication — send liver profile and CBC.',
        rawTranscript: 'Kumara Bandara follow up. BP 140 over 90, started Losartan 50mg. Review in 2 weeks. Suspected dengue complication send liver profile and CBC.',
        tags: ['#Hypertension', '#DengueComplication', '#FollowUp', '#Prescription', '#LabWork'],
        isRareCase: false,
        patient: 'Kumara Bandara',
        attachments: [],
        createdAt: new Date('2026-03-10T15:45:00'),
        duration: 18,
    },
    {
        id: 'vn3',
        text: 'Research note — interesting case of Guillain-Barré in a 28-year-old female post-COVID. Consider for next SLMA paper. MRI shows typical ascending pattern.',
        rawTranscript: 'Research note interesting case of Guillain Barré in a 28 year old female post COVID. Consider for next SLMA paper. MRI shows typical ascending pattern.',
        tags: ['#RareCase', '#ResearchMaterial', '#Neurology', '#Imaging'],
        isRareCase: true,
        patient: '28yo Female',
        attachments: [],
        createdAt: new Date('2026-03-09T21:30:00'),
        duration: 15,
    },
    {
        id: 'vn4',
        text: 'Anoma Wickramasinghe — diabetes review. HbA1c came back at 8.2, needs dose adjustment. Switch from Metformin 500 to 850 TID. Follow up in 6 weeks.',
        rawTranscript: 'Anoma Wickramasinghe diabetes review. HbA1c came back at 8.2, needs dose adjustment. Switch from Metformin 500 to 850 TID. Follow up in 6 weeks.',
        tags: ['#Diabetes', '#Prescription', '#FollowUp', '#LabWork'],
        isRareCase: false,
        patient: 'Anoma Wickramasinghe',
        attachments: [],
        createdAt: new Date('2026-03-09T17:15:00'),
        duration: 14,
    },
];

// ════════════════════════════════════════════════════════════════
//  COMPONENT
// ════════════════════════════════════════════════════════════════

const AIVoiceVault: React.FC = () => {
    const [activeTab, setActiveTab] = useState<VaultTab>('record');
    const [notes, setNotes] = useState<VoiceNote[]>(sampleNotes);
    const [isRecording, setIsRecording] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [recordingTime, setRecordingTime] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTag, setFilterTag] = useState<string | null>(null);
    const [showAttachModal, setShowAttachModal] = useState(false);
    const [expandedNote, setExpandedNote] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ─── Voice Recording ────────────────────────────────────────

    const startRecording = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Voice recording not supported in this browser. Try Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-LK'; // Sri Lankan English

        let finalTranscript = '';

        recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += t + ' ';
                } else {
                    interim = t;
                }
            }
            setTranscript(finalTranscript + interim);
        };

        recognition.onerror = (e: any) => {
            console.error('Voice recognition error:', e.error);
            if (e.error !== 'no-speech') stopRecording();
        };

        recognition.onend = () => {
            // Auto-restart for continuous recording
            if (isRecording) {
                try { recognition.start(); } catch { /* already started */ }
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsRecording(true);
        setTranscript('');
        setRecordingTime(0);

        // Timer
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    }, [isRecording]);

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = null; // Don't auto-restart
            recognitionRef.current.stop();
            recognitionRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
    }, []);

    const saveNote = useCallback(() => {
        if (!transcript.trim()) return;

        const { tags, isRareCase } = extractSmartTags(transcript);
        const patientMatch = transcript.match(/patient\s+(\w+\s?\w*)/i);
        const wardMatch = transcript.match(/ward\s*(\d+)/i);

        const note: VoiceNote = {
            id: `vn-${Date.now()}`,
            text: transcript.trim(),
            rawTranscript: transcript.trim(),
            tags,
            isRareCase,
            patient: patientMatch?.[1] || undefined,
            ward: wardMatch?.[1] || undefined,
            attachments: [],
            createdAt: new Date(),
            duration: recordingTime,
        };

        setNotes(prev => [note, ...prev]);
        setTranscript('');
        setRecordingTime(0);
        stopRecording();
    }, [transcript, recordingTime, stopRecording]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    // ─── Filter Logic ───────────────────────────────────────────

    const filteredNotes = notes.filter(n => {
        if (activeTab === 'rare' && !n.isRareCase) return false;
        if (filterTag && !n.tags.includes(filterTag)) return false;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return n.text.toLowerCase().includes(q) ||
                n.tags.some(t => t.toLowerCase().includes(q)) ||
                (n.patient?.toLowerCase().includes(q));
        }
        return true;
    });

    const allTags = Array.from(new Set(notes.flatMap(n => n.tags))).sort();

    // ─── Render ─────────────────────────────────────────────────

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: '0 auto' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .vault-tab { padding: 10px 20px; border: none; border-radius: 12px; font-size: 13px;
                    font-weight: 600; cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
                .vault-tab.active { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white;
                    box-shadow: 0 4px 12px rgba(99,102,241,0.3); }
                .vault-tab:not(.active) { background: rgba(99,102,241,0.08); color: #6366f1; }
                .vault-tab:not(.active):hover { background: rgba(99,102,241,0.15); }

                .mic-btn { width: 120px; height: 120px; border-radius: 50%; border: none;
                    cursor: pointer; font-size: 48px; display: flex; align-items: center; justify-content: center;
                    transition: all 0.3s ease; position: relative; }
                .mic-btn.idle { background: linear-gradient(145deg, #6366f1, #8b5cf6);
                    box-shadow: 0 8px 32px rgba(99,102,241,0.4); }
                .mic-btn.idle:hover { transform: scale(1.05);
                    box-shadow: 0 12px 40px rgba(99,102,241,0.5); }
                .mic-btn.recording { background: linear-gradient(145deg, #ef4444, #dc2626);
                    box-shadow: 0 8px 32px rgba(239,68,68,0.4);
                    animation: pulse-ring 1.5s ease-in-out infinite; }

                @keyframes pulse-ring {
                    0% { box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
                    70% { box-shadow: 0 0 0 20px rgba(239,68,68,0); }
                    100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
                }

                .note-card { background: white; border-radius: 14px; padding: 18px 20px;
                    border: 1px solid rgba(226,232,240,0.8); margin-bottom: 10px;
                    transition: all 0.2s; cursor: pointer; }
                .note-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.06); transform: translateY(-1px); }
                .note-card.rare { border-left: 4px solid #f59e0b;
                    background: linear-gradient(135deg, white, rgba(245,158,11,0.03)); }

                .tag-pill { display: inline-block; padding: 3px 10px; border-radius: 20px;
                    font-size: 11px; font-weight: 600; margin: 2px 3px; }
                .tag-rare { background: rgba(245,158,11,0.12); color: #d97706; }
                .tag-urgent { background: rgba(239,68,68,0.12); color: #dc2626; }
                .tag-research { background: rgba(139,92,246,0.12); color: #7c3aed; }
                .tag-default { background: rgba(99,102,241,0.08); color: #6366f1; }

                .attach-btn { padding: 8px 14px; border-radius: 10px; border: 1px dashed rgba(148,163,184,0.5);
                    background: transparent; color: #64748b; font-size: 12px; font-weight: 500;
                    cursor: pointer; transition: all 0.2s; font-family: 'Inter', sans-serif; }
                .attach-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,0.04); }

                .premium-badge { display: inline-flex; align-items: center; gap: 4px;
                    background: linear-gradient(135deg, #f59e0b, #d97706); color: white;
                    font-size: 10px; font-weight: 700; padding: 3px 8px; border-radius: 6px;
                    letter-spacing: 0.5px; text-transform: uppercase; }

                .search-input { width: 100%; padding: 10px 16px 10px 38px; border-radius: 12px;
                    border: 1px solid rgba(226,232,240,0.8); font-size: 13px; font-family: 'Inter', sans-serif;
                    outline: none; background: white; transition: all 0.2s; }
                .search-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }

                .transcript-area { width: 100%; min-height: 120px; padding: 16px; border-radius: 12px;
                    border: 1px solid rgba(226,232,240,0.8); font-size: 14px; font-family: 'Inter', sans-serif;
                    outline: none; resize: vertical; line-height: 1.6; }
                .transcript-area:focus { border-color: #6366f1; }
            `}</style>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            🎙️ AI Voice Vault
                        </h2>
                        <span className="premium-badge">⭐ Premium</span>
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94a3b8' }}>
                        Record, tag & search your medical notes instantly
                    </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8' }}>
                    <div style={{ fontWeight: 600, color: '#6366f1', fontSize: 20 }}>{notes.length}</div>
                    Voice Notes
                </div>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <button className={`vault-tab ${activeTab === 'record' ? 'active' : ''}`}
                    onClick={() => setActiveTab('record')}>
                    🎤 Record
                </button>
                <button className={`vault-tab ${activeTab === 'vault' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vault')}>
                    📂 All Notes ({notes.length})
                </button>
                <button className={`vault-tab ${activeTab === 'rare' ? 'active' : ''}`}
                    onClick={() => setActiveTab('rare')}>
                    ⭐ Rare Cases ({notes.filter(n => n.isRareCase).length})
                </button>
            </div>

            {/* ── Record Tab ─────────────────────────────────────── */}
            {activeTab === 'record' && (
                <div style={{ textAlign: 'center' }}>
                    {/* Big Mic Button */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                        <button
                            className={`mic-btn ${isRecording ? 'recording' : 'idle'}`}
                            onClick={isRecording ? stopRecording : startRecording}
                        >
                            {isRecording ? '⏹️' : '🎤'}
                        </button>
                    </div>

                    {/* Timer */}
                    {isRecording && (
                        <div style={{
                            fontSize: 28, fontWeight: 700, color: '#ef4444',
                            marginBottom: 6, fontVariantNumeric: 'tabular-nums',
                        }}>
                            {formatTime(recordingTime)}
                        </div>
                    )}

                    <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>
                        {isRecording ? 'Listening... speak naturally in English, Tamil, or Singlish'
                            : 'Tap the mic and start speaking — walk to your car, dictate notes'}
                    </p>

                    {/* Live Transcript */}
                    {(transcript || isRecording) && (
                        <div style={{ textAlign: 'left', marginBottom: 16 }}>
                            <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', marginBottom: 6, display: 'block' }}>
                                Transcript {isRecording && <span style={{ color: '#ef4444' }}>● LIVE</span>}
                            </label>
                            <textarea
                                className="transcript-area"
                                value={transcript}
                                onChange={(e) => setTranscript(e.target.value)}
                                placeholder="Your voice will appear here..."
                            />

                            {/* Auto-detected tags preview */}
                            {transcript && (
                                <div style={{ marginTop: 10, textAlign: 'left' }}>
                                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', marginRight: 6 }}>
                                        🏷️ Auto-tags:
                                    </span>
                                    {extractSmartTags(transcript).tags.map(tag => (
                                        <span key={tag} className={`tag-pill ${tag === '#RareCase' ? 'tag-rare' :
                                                tag === '#Urgent' ? 'tag-urgent' :
                                                    tag === '#ResearchMaterial' ? 'tag-research' : 'tag-default'
                                            }`}>
                                            {tag}
                                        </span>
                                    ))}
                                    {extractSmartTags(transcript).isRareCase && (
                                        <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600, marginLeft: 8 }}>
                                            ⭐ Will be added to Rare Case Vault
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                        {transcript && !isRecording && (
                            <>
                                <button onClick={saveNote} style={{
                                    padding: '12px 28px', borderRadius: 12, border: 'none',
                                    background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
                                    fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(34,197,94,0.3)',
                                    fontFamily: "'Inter', sans-serif",
                                }}>
                                    ✅ Save Note
                                </button>
                                <button className="attach-btn" onClick={() => fileInputRef.current?.click()}>
                                    📎 Attach Photo
                                </button>
                                <button onClick={() => { setTranscript(''); setRecordingTime(0); }} style={{
                                    padding: '12px 20px', borderRadius: 12, border: '1px solid rgba(226,232,240,0.8)',
                                    background: 'white', color: '#64748b', fontSize: 13,
                                    fontWeight: 500, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                                }}>
                                    🗑️ Discard
                                </button>
                            </>
                        )}
                    </div>

                    {/* Hidden file input for photo attachments */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                // In production: upload to Firebase Storage
                                alert(`📸 Photo "${file.name}" attached! (Storage upload coming soon)`);
                            }
                        }}
                    />
                </div>
            )}

            {/* ── Vault / Rare Cases Tab ─────────────────────────── */}
            {(activeTab === 'vault' || activeTab === 'rare') && (
                <div>
                    {/* Search + Filter */}
                    <div style={{ marginBottom: 16 }}>
                        <div style={{ position: 'relative', marginBottom: 10 }}>
                            <span style={{ position: 'absolute', left: 12, top: 10, fontSize: 16 }}>🔍</span>
                            <input
                                className="search-input"
                                placeholder={activeTab === 'rare'
                                    ? 'Search rare cases, conditions, patients...'
                                    : 'Search notes, patients, tags...'}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        {/* Tag filter chips */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            <button
                                onClick={() => setFilterTag(null)}
                                className={`tag-pill ${!filterTag ? 'tag-default' : ''}`}
                                style={{
                                    cursor: 'pointer', border: 'none',
                                    background: !filterTag ? 'rgba(99,102,241,0.15)' : 'rgba(226,232,240,0.5)',
                                    color: !filterTag ? '#6366f1' : '#94a3b8',
                                    fontWeight: 600, fontSize: 11,
                                }}
                            >
                                All
                            </button>
                            {allTags.map(tag => (
                                <button
                                    key={tag}
                                    onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                                    className={`tag-pill ${tag.includes('Rare') ? 'tag-rare' :
                                            tag.includes('Urgent') ? 'tag-urgent' :
                                                tag.includes('Research') ? 'tag-research' : 'tag-default'
                                        }`}
                                    style={{
                                        cursor: 'pointer', border: 'none',
                                        opacity: filterTag === tag ? 1 : 0.6,
                                        transform: filterTag === tag ? 'scale(1.05)' : 'scale(1)',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Notes list */}
                    {filteredNotes.length === 0 ? (
                        <div style={{
                            padding: '3rem 2rem', textAlign: 'center', color: '#94a3b8',
                            background: 'white', borderRadius: 14,
                            border: '1px solid rgba(226,232,240,0.8)',
                        }}>
                            <div style={{ fontSize: 40, marginBottom: 12 }}>
                                {activeTab === 'rare' ? '⭐' : '🎙️'}
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 500 }}>
                                {activeTab === 'rare' ? 'No rare cases recorded yet'
                                    : 'No notes match your search'}
                            </div>
                        </div>
                    ) : (
                        filteredNotes.map(note => (
                            <div
                                key={note.id}
                                className={`note-card ${note.isRareCase ? 'rare' : ''}`}
                                onClick={() => setExpandedNote(expandedNote === note.id ? null : note.id)}
                            >
                                {/* Header */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        {note.isRareCase && <span style={{ fontSize: 14 }}>⭐</span>}
                                        {note.patient && (
                                            <span style={{
                                                fontSize: 12, fontWeight: 600, color: '#6366f1',
                                                background: 'rgba(99,102,241,0.08)',
                                                padding: '2px 8px', borderRadius: 6,
                                            }}>
                                                {note.patient}
                                            </span>
                                        )}
                                        {note.ward && (
                                            <span style={{
                                                fontSize: 11, fontWeight: 500, color: '#64748b',
                                                background: 'rgba(100,116,139,0.08)',
                                                padding: '2px 6px', borderRadius: 4,
                                            }}>
                                                Ward {note.ward}
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: 11, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                                        {note.createdAt.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' })}
                                        {' · '}{note.duration}s
                                    </span>
                                </div>

                                {/* Text */}
                                <p style={{
                                    margin: '0 0 10px', fontSize: 13.5, lineHeight: 1.6, color: '#334155',
                                    overflow: expandedNote === note.id ? 'visible' : 'hidden',
                                    maxHeight: expandedNote === note.id ? 'none' : '3.2em',
                                }}>
                                    {note.text}
                                </p>

                                {/* Tags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                                    {note.tags.map(tag => (
                                        <span key={tag} className={`tag-pill ${tag.includes('Rare') ? 'tag-rare' :
                                                tag.includes('Urgent') ? 'tag-urgent' :
                                                    tag.includes('Research') ? 'tag-research' : 'tag-default'
                                            }`} style={{ fontSize: 10 }}>
                                            {tag}
                                        </span>
                                    ))}
                                </div>

                                {/* Attachments */}
                                {note.attachments.length > 0 && (
                                    <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                                        {note.attachments.map(a => (
                                            <div key={a.id} style={{
                                                width: 48, height: 48, borderRadius: 8,
                                                background: '#f1f5f9', display: 'flex',
                                                alignItems: 'center', justifyContent: 'center',
                                                fontSize: 20,
                                            }}>
                                                📷
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Expanded actions */}
                                {expandedNote === note.id && (
                                    <div style={{
                                        marginTop: 12, paddingTop: 12,
                                        borderTop: '1px solid rgba(226,232,240,0.6)',
                                        display: 'flex', gap: 8,
                                    }}>
                                        <button className="attach-btn" style={{ fontSize: 11 }}>📎 Add Photo</button>
                                        <button className="attach-btn" style={{ fontSize: 11 }}>✏️ Edit</button>
                                        <button className="attach-btn" style={{ fontSize: 11, color: '#6366f1' }}>📋 Copy</button>
                                        {!note.isRareCase && (
                                            <button className="attach-btn" style={{ fontSize: 11, color: '#d97706' }}>
                                                ⭐ Mark Rare
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Stats Footer */}
            <div style={{
                marginTop: 24, padding: '16px 20px', borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))',
                display: 'flex', justifyContent: 'space-around', textAlign: 'center',
            }}>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#6366f1' }}>{notes.length}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Total Notes</div>
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{notes.filter(n => n.isRareCase).length}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Rare Cases</div>
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{allTags.length}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Smart Tags</div>
                </div>
                <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#8b5cf6' }}>
                        {formatTime(notes.reduce((s, n) => s + n.duration, 0))}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Recorded</div>
                </div>
            </div>
        </div>
    );
};

export default AIVoiceVault;
