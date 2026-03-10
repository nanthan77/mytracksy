/**
 * MorningBriefing — "Today's Ward Round" Widget
 *
 * Shows the doctor their pending action items from yesterday's
 * clinical voice notes as a checklist. The "killer feature"
 * that turns the app into an Ivy-League Medical Assistant.
 */

import React, { useState, useEffect } from 'react';

// ─── Types ──────────────────────────────────────────────────────

interface BriefingItem {
    actionId: string;
    noteId: string;
    task: string;
    urgency: 'today' | 'tomorrow' | 'this_week' | 'routine';
    patient: string;
    tags: string[];
    is_rare_case: boolean;
    is_completed: boolean;
}

// ─── Sample Briefing Data ───────────────────────────────────────

const sampleBriefing: BriefingItem[] = [
    {
        actionId: 'a1', noteId: 'n1',
        task: 'Review Liver Profile for Ward 15, Bed 4 (Stevens-Johnson)',
        urgency: 'today', patient: 'K.M., 45M, Ward 15',
        tags: ['#StevensJohnson', '#RareCase'], is_rare_case: true, is_completed: false,
    },
    {
        actionId: 'a2', noteId: 'n2',
        task: 'Order FBC for suspected Dengue patient',
        urgency: 'today', patient: 'A.B., 32F, Ward 8',
        tags: ['#Dengue', '#LabWork'], is_rare_case: false, is_completed: false,
    },
    {
        actionId: 'a3', noteId: 'n3',
        task: 'Check ECG results — ACS workup',
        urgency: 'today', patient: 'R.P., 58M, ICU',
        tags: ['#Cardiology', '#Urgent'], is_rare_case: false, is_completed: false,
    },
    {
        actionId: 'a4', noteId: 'n4',
        task: 'Review HbA1c result — adjust Metformin dose',
        urgency: 'tomorrow', patient: 'A.W., 50F',
        tags: ['#Diabetes', '#LabWork'], is_rare_case: false, is_completed: false,
    },
    {
        actionId: 'a5', noteId: 'n5',
        task: 'Follow up Guillain-Barré patient — repeat MRI',
        urgency: 'this_week', patient: 'S.K., 28F, Ward 12',
        tags: ['#RareCase', '#Neurology', '#Imaging'], is_rare_case: true, is_completed: true,
    },
];

// ────────────────────────────────────────────────────────────────

const MorningBriefing: React.FC = () => {
    const [items, setItems] = useState<BriefingItem[]>(sampleBriefing);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good Morning, Doctor');
        else if (hour < 17) setGreeting('Good Afternoon, Doctor');
        else setGreeting('Good Evening, Doctor');
    }, []);

    const toggleItem = (id: string) => {
        setItems(prev => prev.map(item =>
            item.actionId === id ? { ...item, is_completed: !item.is_completed } : item
        ));
    };

    const completed = items.filter(i => i.is_completed).length;
    const total = items.length;
    const urgent = items.filter(i => i.urgency === 'today' && !i.is_completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const urgencyConfig: Record<string, { label: string; color: string; bg: string }> = {
        today: { label: 'Today', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
        tomorrow: { label: 'Tomorrow', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
        this_week: { label: 'This Week', color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
        routine: { label: 'Routine', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' },
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: '0 auto' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

                .briefing-card {
                    background: white; border-radius: 14px; padding: 14px 18px;
                    border: 1px solid rgba(226,232,240,0.8); margin-bottom: 8px;
                    transition: all 0.3s ease; cursor: pointer;
                    display: flex; align-items: flex-start; gap: 14px;
                }
                .briefing-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.05); }
                .briefing-card.completed {
                    opacity: 0.5; text-decoration: line-through;
                    background: rgba(241,245,249,0.5);
                }
                .briefing-card.rare {
                    border-left: 3px solid #f59e0b;
                    background: linear-gradient(135deg, white, rgba(245,158,11,0.02));
                }

                .checkbox-circle {
                    width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0;
                    border: 2px solid #cbd5e1; display: flex; align-items: center;
                    justify-content: center; cursor: pointer; transition: all 0.2s;
                    margin-top: 2px;
                }
                .checkbox-circle.checked {
                    background: linear-gradient(135deg, #22c55e, #16a34a);
                    border-color: #22c55e; color: white;
                }
                .checkbox-circle:hover:not(.checked) {
                    border-color: #6366f1; background: rgba(99,102,241,0.05);
                }

                .urgency-pill {
                    display: inline-block; padding: 2px 8px; border-radius: 6px;
                    font-size: 10px; font-weight: 600; letter-spacing: 0.3px;
                }

                .progress-bar-bg {
                    height: 6px; background: rgba(226,232,240,0.6); border-radius: 3px;
                    overflow: hidden; flex: 1;
                }
                .progress-bar-fill {
                    height: 100%; border-radius: 3px; transition: width 0.5s ease;
                    background: linear-gradient(90deg, #22c55e, #16a34a);
                }
            `}</style>

            {/* Hero Header */}
            <div style={{
                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                borderRadius: 18, padding: '24px 28px', marginBottom: 20,
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -30, right: -30, width: 120, height: 120,
                    borderRadius: '50%', background: 'rgba(99,102,241,0.15)',
                }} />
                <div style={{
                    position: 'absolute', bottom: -20, right: 40, width: 80, height: 80,
                    borderRadius: '50%', background: 'rgba(245,158,11,0.1)',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <span style={{ fontSize: 28 }}>🌅</span>
                    <div>
                        <h2 style={{
                            margin: 0, fontSize: 18, fontWeight: 800, color: 'white',
                            letterSpacing: '-0.02em',
                        }}>
                            {greeting}
                        </h2>
                        <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
                            Today's Ward Round — {new Date().toLocaleDateString('en-LK', {
                                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                </div>

                {/* Progress */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                    <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
                        {completed}/{total} done
                    </span>
                </div>

                {/* Stats */}
                <div style={{
                    display: 'flex', gap: 20, marginTop: 14,
                }}>
                    {urgent > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: '#ef4444',
                                animation: 'pulse-ring 1.5s ease-in-out infinite',
                            }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#ef4444' }}>
                                {urgent} urgent
                            </span>
                        </div>
                    )}
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                        📋 {total - completed} pending
                    </span>
                    <span style={{ fontSize: 12, color: '#64748b' }}>
                        ⭐ {items.filter(i => i.is_rare_case).length} rare cases
                    </span>
                </div>
            </div>

            {/* Action Items Checklist */}
            {['today', 'tomorrow', 'this_week', 'routine'].map(urgency => {
                const group = items.filter(i => i.urgency === urgency);
                if (group.length === 0) return null;
                const config = urgencyConfig[urgency];

                return (
                    <div key={urgency} style={{ marginBottom: 16 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: config.color,
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            marginBottom: 8, paddingLeft: 4,
                        }}>
                            {urgency === 'today' ? '🔴' : urgency === 'tomorrow' ? '🟡' : '🔵'}{' '}
                            {config.label} ({group.filter(i => !i.is_completed).length} pending)
                        </div>

                        {group.map(item => (
                            <div
                                key={item.actionId}
                                className={`briefing-card ${item.is_completed ? 'completed' : ''} ${item.is_rare_case ? 'rare' : ''}`}
                                onClick={() => toggleItem(item.actionId)}
                            >
                                <div className={`checkbox-circle ${item.is_completed ? 'checked' : ''}`}>
                                    {item.is_completed && '✓'}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: 13.5, fontWeight: 500, color: '#1e293b',
                                        lineHeight: 1.5, marginBottom: 6,
                                    }}>
                                        {item.task}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{
                                            fontSize: 11, color: '#6366f1', fontWeight: 500,
                                        }}>
                                            🧑‍⚕️ {item.patient}
                                        </span>

                                        {item.is_rare_case && (
                                            <span style={{
                                                fontSize: 10, fontWeight: 600, color: '#d97706',
                                                background: 'rgba(245,158,11,0.1)',
                                                padding: '1px 6px', borderRadius: 4,
                                            }}>
                                                ⭐ Rare
                                            </span>
                                        )}

                                        {item.tags.slice(0, 3).map(tag => (
                                            <span key={tag} style={{
                                                fontSize: 10, color: '#94a3b8', fontWeight: 500,
                                            }}>
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <span className="urgency-pill" style={{
                                    color: config.color, background: config.bg,
                                }}>
                                    {config.label}
                                </span>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* All complete state */}
            {completed === total && (
                <div style={{
                    textAlign: 'center', padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.05), rgba(22,163,74,0.05))',
                    borderRadius: 14, border: '1px solid rgba(34,197,94,0.2)',
                }}>
                    <div style={{ fontSize: 40, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#16a34a' }}>
                        All tasks completed!
                    </div>
                    <div style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
                        Great work, Doctor. Have a productive ward round.
                    </div>
                </div>
            )}
        </div>
    );
};

export default MorningBriefing;
