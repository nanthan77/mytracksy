import React, { useState, useRef, useCallback, useEffect } from 'react';

// ─── Types ───────────────────────────────────────────────────────
export type VoiceIntentType = 'income' | 'expense' | 'appointment' | 'note' | 'unknown';

export interface ParsedVoiceAction {
    intent: VoiceIntentType;
    raw: string;
    amount?: number;
    description?: string;
    patient?: string;
    category?: string;
    time?: string;
    hospital?: string;
}

interface VoiceInputProps {
    onAction: (action: ParsedVoiceAction) => void;
    /** Visible on all pages, floats bottom-right */
    position?: 'float' | 'inline';
    /** Placeholder for the text fallback input */
    placeholder?: string;
    floatingOffset?: {
        bottom?: number;
        right?: number;
    };
}

// ─── Smart parser ────────────────────────────────────────────────
const incomeKeywords = ['paid', 'received', 'collected', 'earned', 'consultation', 'surgery', 'channeling', 'fee', 'income', 'payment'];
const expenseKeywords = ['bought', 'spent', 'purchased', 'fuel', 'petrol', 'diesel', 'subscription', 'expense', 'cost', 'rent', 'electricity', 'phone', 'food', 'lunch', 'dinner', 'parking', 'toll', 'maintenance'];
const appointmentKeywords = ['appointment', 'schedule', 'book', 'booking', 'next', 'patient coming', 'channelling', 'slot'];
const noteKeywords = ['note', 'blood pressure', 'bp', 'diagnosis', 'prescribe', 'prescription', 'symptoms', 'weight', 'sugar', 'level', 'observe', 'review', 'follow up', 'followup'];

const expenseCategoryMap: Record<string, string> = {
    fuel: 'Vehicle / Transport', petrol: 'Vehicle / Transport', diesel: 'Vehicle / Transport', toll: 'Vehicle / Transport', parking: 'Vehicle / Transport',
    stethoscope: 'Medical Equipment', equipment: 'Medical Equipment', instrument: 'Medical Equipment', battery: 'Medical Equipment',
    subscription: 'Medical Subscriptions', journal: 'Medical Subscriptions',
    conference: 'Conference Travel', workshop: 'CME / Training', cme: 'CME / Training', training: 'CME / Training', course: 'CME / Training',
    insurance: 'Insurance',
    hospital: 'Hospital Fees',
    food: 'Office Supplies', lunch: 'Office Supplies', dinner: 'Office Supplies', supplies: 'Office Supplies',
};

function parseVoiceInput(text: string): ParsedVoiceAction {
    const lower = text.toLowerCase().trim();
    const result: ParsedVoiceAction = { intent: 'unknown', raw: text };

    // Extract amount (look for numbers, possibly with commas)
    const amountMatch = lower.match(/(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/);
    if (amountMatch) {
        result.amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    }

    // Extract time
    const timeMatch = lower.match(/(\d{1,2}(?::\d{2})?\s*(?:am|pm))/i);
    if (timeMatch) result.time = timeMatch[1];

    // Detect intent
    const hasIncome = incomeKeywords.some(k => lower.includes(k));
    const hasExpense = expenseKeywords.some(k => lower.includes(k));
    const hasAppointment = appointmentKeywords.some(k => lower.includes(k));
    const hasNote = noteKeywords.some(k => lower.includes(k));

    if (hasNote) {
        result.intent = 'note';
        // Try to extract patient name (capitalize first word that isn't a keyword)
        const words = text.split(/\s+/);
        const nameCandidate = words.find(w => w.length > 2 && /^[A-Z]/.test(w) && !noteKeywords.some(k => k.includes(w.toLowerCase())));
        if (nameCandidate) result.patient = nameCandidate;
        result.description = text.replace(/^(note|Note|NOTE)[:\s]*/i, '').trim();
    } else if (hasAppointment) {
        result.intent = 'appointment';
        result.description = text;
        // Try to find hospital name
        const hospitals = ['asiri', 'lanka hospital', 'nawaloka', 'private clinic', 'durdans', 'hemas'];
        for (const h of hospitals) {
            if (lower.includes(h)) { result.hospital = h.charAt(0).toUpperCase() + h.slice(1); break; }
        }
    } else if (hasIncome) {
        result.intent = 'income';
        result.category = 'Consultation';
        if (lower.includes('surgery')) result.category = 'Surgery';
        else if (lower.includes('channeling') || lower.includes('channelling')) result.category = 'Channeling';
        else if (lower.includes('lab')) result.category = 'Lab Work';
        else if (lower.includes('follow')) result.category = 'Follow-up';
        // Extract patient name
        const words = text.split(/\s+/);
        const nameCandidate = words.find(w => w.length > 2 && /^[A-Z]/.test(w) && !incomeKeywords.some(k => k.includes(w.toLowerCase())));
        if (nameCandidate) result.patient = nameCandidate;
        result.description = text;
    } else if (hasExpense) {
        result.intent = 'expense';
        // Match expense category
        for (const [keyword, category] of Object.entries(expenseCategoryMap)) {
            if (lower.includes(keyword)) { result.category = category; break; }
        }
        if (!result.category) result.category = 'Office Supplies';
        result.description = text;
    } else if (result.amount) {
        // Has a number but no clear keyword — ask user to clarify, default to expense
        result.intent = 'expense';
        result.category = 'Office Supplies';
        result.description = text;
    } else {
        result.intent = 'note';
        result.description = text;
    }

    return result;
}

// ─── Component ───────────────────────────────────────────────────
const VoiceInput: React.FC<VoiceInputProps> = ({
    onAction,
    position = 'float',
    placeholder = 'Tap mic or type...',
    floatingOffset,
}) => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [parsedAction, setParsedAction] = useState<ParsedVoiceAction | null>(null);
    const [textInput, setTextInput] = useState('');
    const [showPanel, setShowPanel] = useState(false);
    const [supported, setSupported] = useState(true);
    const recognitionRef = useRef<any>(null);
    const pulseRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interim = '';
            let final = '';
            for (let i = 0; i < event.results.length; i++) {
                const t = event.results[i][0].transcript;
                if (event.results[i].isFinal) final += t;
                else interim += t;
            }
            setTranscript(final || interim);
        };
        recognition.onend = () => {
            setIsListening(false);
        };
        recognition.onerror = () => {
            setIsListening(false);
        };
        recognitionRef.current = recognition;
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) return;
        setTranscript('');
        setParsedAction(null);
        setIsListening(true);
        setShowPanel(true);
        try { recognitionRef.current.start(); } catch { }
    }, []);

    const stopListening = useCallback(() => {
        if (!recognitionRef.current) return;
        recognitionRef.current.stop();
        setIsListening(false);
    }, []);

    const handleProcess = useCallback(() => {
        const text = transcript || textInput;
        if (!text.trim()) return;
        const parsed = parseVoiceInput(text);
        setParsedAction(parsed);
    }, [transcript, textInput]);

    const handleConfirm = useCallback(() => {
        if (parsedAction) {
            onAction(parsedAction);
            setParsedAction(null);
            setTranscript('');
            setTextInput('');
            setShowPanel(false);
        }
    }, [parsedAction, onAction]);

    const handleDismiss = useCallback(() => {
        setParsedAction(null);
        setTranscript('');
        setTextInput('');
        setShowPanel(false);
        if (isListening) stopListening();
    }, [isListening, stopListening]);

    // Auto-process when speech ends with final transcript
    useEffect(() => {
        if (!isListening && transcript.trim()) {
            const parsed = parseVoiceInput(transcript);
            setParsedAction(parsed);
        }
    }, [isListening, transcript]);

    const handleTextSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (textInput.trim()) {
            const parsed = parseVoiceInput(textInput);
            setParsedAction(parsed);
            setTranscript(textInput);
        }
    };

    const intentConfig: Record<VoiceIntentType, { icon: string; label: string; color: string; bg: string }> = {
        income: { icon: '💰', label: 'Add Income', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
        expense: { icon: '💸', label: 'Add Expense', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        appointment: { icon: '📅', label: 'New Appointment', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        note: { icon: '📝', label: 'Patient Note', color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
        unknown: { icon: '❓', label: 'Action', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
    };

    const fmt = (n: number) => `LKR ${n.toLocaleString('en-LK')}`;
    const fabBottom = floatingOffset?.bottom ?? 28;
    const fabRight = floatingOffset?.right ?? 28;
    const panelBottom = fabBottom + 72;

    // ─── Floating button + panel ──────────────────────────────
    if (position === 'float') {
        return (
            <>
                <style>{`
                    @keyframes voicePulse { 0% { box-shadow: 0 0 0 0 rgba(99,102,241,0.5); } 70% { box-shadow: 0 0 0 20px rgba(99,102,241,0); } 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0); } }
                    @keyframes voiceWave { 0%,100% { height: 8px; } 50% { height: 24px; } }
                    .voice-fab { position: fixed; z-index: 9999; width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 24px; transition: all 0.3s ease; font-family: 'Inter', sans-serif; }
                    .voice-fab:hover { transform: scale(1.08); }
                    .voice-fab.idle { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; box-shadow: 0 6px 24px rgba(99,102,241,0.4); }
                    .voice-fab.listening { background: linear-gradient(135deg, #ef4444, #f97316); color: white; animation: voicePulse 1.5s infinite; }
                    .voice-panel { position: fixed; z-index: 9998; width: 380px; background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05); overflow: hidden; font-family: 'Inter', sans-serif; }
                `}</style>

                {/* Floating Mic Button */}
                <button
                    className={`voice-fab ${isListening ? 'listening' : 'idle'}`}
                    onClick={() => {
                        if (isListening) stopListening();
                        else if (showPanel && !isListening) { setShowPanel(false); }
                        else { startListening(); }
                    }}
                    style={{ bottom: fabBottom, right: fabRight }}
                    title={isListening ? 'Stop recording' : 'Voice command'}
                >
                    {isListening ? '⏹' : '🎤'}
                </button>

                {/* Panel */}
                {showPanel && (
                    <div className="voice-panel" style={{ bottom: panelBottom, right: fabRight, width: floatingOffset ? 'min(380px, calc(100vw - 24px))' : 380 }}>
                        {/* Header */}
                        <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: 15, fontWeight: 700 }}>
                                    {isListening ? '🎙️ Listening...' : '🎤 Voice Assistant'}
                                </div>
                                <button onClick={handleDismiss} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', padding: '4px 10px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>✕</button>
                            </div>
                            {isListening && (
                                <div style={{ display: 'flex', gap: 3, alignItems: 'center', justifyContent: 'center', height: 30, marginTop: 8 }}>
                                    {[0, 1, 2, 3, 4].map(i => (
                                        <div key={i} style={{
                                            width: 4, height: 8, background: 'rgba(255,255,255,0.8)', borderRadius: 2,
                                            animation: `voiceWave 0.8s ease-in-out ${i * 0.1}s infinite`,
                                        }} />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Transcript / Input */}
                        <div style={{ padding: '16px 20px' }}>
                            {transcript ? (
                                <div style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, lineHeight: 1.6, color: '#1e293b', minHeight: 40, marginBottom: 12 }}>
                                    "{transcript}"
                                </div>
                            ) : (
                                <form onSubmit={handleTextSubmit} style={{ marginBottom: 12 }}>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <input
                                            type="text"
                                            value={textInput}
                                            onChange={e => setTextInput(e.target.value)}
                                            placeholder={supported ? placeholder : 'Type your command...'}
                                            style={{ flex: 1, padding: '10px 14px', border: '1.5px solid #e2e8f0', borderRadius: 10, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
                                            autoFocus
                                        />
                                        <button type="submit" style={{ padding: '10px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>→</button>
                                    </div>
                                    {!supported && <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 6 }}>⚠️ Voice not supported in this browser. Use text input.</div>}
                                </form>
                            )}

                            {/* Parsed Action Card */}
                            {parsedAction && (
                                <div style={{ background: intentConfig[parsedAction.intent].bg, border: `1.5px solid ${intentConfig[parsedAction.intent].color}30`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                                        <span style={{ fontSize: 20 }}>{intentConfig[parsedAction.intent].icon}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: intentConfig[parsedAction.intent].color }}>
                                            {intentConfig[parsedAction.intent].label}
                                        </span>
                                    </div>
                                    {parsedAction.amount && (
                                        <div style={{ fontSize: 22, fontWeight: 800, color: '#1e293b', marginBottom: 6, letterSpacing: '-0.02em' }}>
                                            {fmt(parsedAction.amount)}
                                        </div>
                                    )}
                                    {parsedAction.description && (
                                        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                                            📋 {parsedAction.description}
                                        </div>
                                    )}
                                    {parsedAction.category && (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            📂 {parsedAction.category}
                                        </div>
                                    )}
                                    {parsedAction.patient && (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            🧑‍⚕️ {parsedAction.patient}
                                        </div>
                                    )}
                                    {parsedAction.hospital && (
                                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                                            🏥 {parsedAction.hospital}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Action Buttons */}
                            {parsedAction && (
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={handleConfirm} style={{
                                        flex: 1, padding: '11px', border: 'none', borderRadius: 10,
                                        background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white',
                                        fontSize: 14, fontWeight: 700, cursor: 'pointer',
                                        boxShadow: '0 3px 12px rgba(34,197,94,0.3)',
                                    }}>
                                        ✓ Confirm & Save
                                    </button>
                                    <button onClick={() => { setParsedAction(null); setTranscript(''); setTextInput(''); }} style={{
                                        padding: '11px 16px', border: '1.5px solid #e2e8f0', borderRadius: 10,
                                        background: 'white', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                                    }}>
                                        ✕
                                    </button>
                                </div>
                            )}

                            {/* Quick suggestions when no action */}
                            {!parsedAction && !transcript && (
                                <div>
                                    <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Try saying:</div>
                                    {[
                                        '"Kumara paid 7500 for consultation"',
                                        '"Bought fuel 3500"',
                                        '"Note: BP 140 over 90"',
                                        '"Appointment Dilani 5pm Lanka Hospital"',
                                    ].map(s => (
                                        <div key={s}
                                            onClick={() => { setTextInput(s.replace(/"/g, '')); }}
                                            style={{ fontSize: 13, color: '#6366f1', padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}>
                                            💡 {s}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </>
        );
    }

    // ─── Inline variant ───────────────────────────────────────
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
                onClick={() => isListening ? stopListening() : startListening()}
                style={{
                    width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
                    background: isListening ? 'linear-gradient(135deg, #ef4444, #f97316)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    color: 'white', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: isListening ? 'voicePulse 1.5s infinite' : 'none',
                }}
            >
                {isListening ? '⏹' : '🎤'}
            </button>
            <input
                type="text"
                value={transcript || textInput}
                onChange={e => { setTextInput(e.target.value); setTranscript(''); }}
                onKeyDown={e => { if (e.key === 'Enter') handleProcess(); }}
                placeholder={placeholder}
                style={{ flex: 1, padding: '8px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit' }}
            />
            {(transcript || textInput) && (
                <button onClick={handleProcess} style={{
                    padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 8,
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>Parse</button>
            )}
        </div>
    );
};

export default VoiceInput;
export { parseVoiceInput };
