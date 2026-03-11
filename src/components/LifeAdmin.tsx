/**
 * LifeAdmin — Premium "Life Admin" Task Manager
 *
 * Pre-loaded Sri Lankan professional templates:
 *  - SLMC Renewal, GMOA, College of Surgeons/Physicians
 *  - Vehicle Revenue License, Insurance, Leasing
 *  - IRD Quarterly Tax, Annual Return
 *  - Clinic Rent, Indemnity Insurance
 *
 * Sends FCM reminders at 30, 7, and 1 day before due date.
 */

import React, { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────

interface LifeAdminTask {
    id: string;
    title: string;
    category: string;
    description: string;
    due_date: string;
    status: 'pending' | 'completed' | 'overdue';
    recurring: string;
    icon: string;
    url?: string;
}

// ─── Templates ──────────────────────────────────────────────────

const TEMPLATES = [
    { id: 'slmc', title: 'SLMC Annual Renewal', cat: 'professional', desc: 'Sri Lanka Medical Council registration', recurring: 'yearly', icon: '🏥', url: 'https://srilankmedicalcouncil.org/' },
    { id: 'gmoa', title: 'GMOA Subscription', cat: 'professional', desc: "Govt Medical Officers' Association", recurring: 'yearly', icon: '👨‍⚕️' },
    { id: 'surgeons', title: 'College of Surgeons Membership', cat: 'professional', desc: 'College of Surgeons of Sri Lanka', recurring: 'yearly', icon: '🔬' },
    { id: 'physicians', title: 'Ceylon College of Physicians', cat: 'professional', desc: 'Annual membership fee', recurring: 'yearly', icon: '🩺' },
    { id: 'pgim', title: 'PGIM Exam Registration', cat: 'professional', desc: 'Postgraduate Institute of Medicine deadline', recurring: 'custom', icon: '📚' },
    { id: 'uptodate', title: 'UpToDate Subscription', cat: 'cme', desc: 'Medical decision support renewal', recurring: 'yearly', icon: '📖' },
    { id: 'bmj', title: 'BMJ Journal Subscription', cat: 'cme', desc: 'British Medical Journal annual', recurring: 'yearly', icon: '📰' },
    { id: 'vehicle', title: 'Vehicle Revenue License', cat: 'vehicle', desc: 'Annual DMT renewal', recurring: 'yearly', icon: '🚗', url: 'https://www.motortraffic.gov.lk/' },
    { id: 'insurance', title: 'Vehicle Insurance Renewal', cat: 'vehicle', desc: 'Third party or comprehensive', recurring: 'yearly', icon: '🛡️' },
    { id: 'leasing', title: 'Vehicle Leasing Payment', cat: 'finance', desc: 'Monthly installment', recurring: 'monthly', icon: '💳' },
    { id: 'quarterly_tax', title: 'Quarterly IRD Tax Payment', cat: 'tax', desc: 'Linked to Accountant module', recurring: 'quarterly', icon: '🧾' },
    { id: 'annual_tax', title: 'Annual Tax Return Filing', cat: 'tax', desc: 'IRD annual deadline', recurring: 'yearly', icon: '📋' },
    { id: 'clinic_rent', title: 'Clinic Rent Payment', cat: 'clinic', desc: 'Monthly dispensary rent', recurring: 'monthly', icon: '🏠' },
    { id: 'indemnity', title: 'Professional Indemnity Insurance', cat: 'professional', desc: 'Malpractice insurance renewal', recurring: 'yearly', icon: '⚖️' },
];

// ─── Sample Active Tasks ────────────────────────────────────────

const sampleTasks: LifeAdminTask[] = [
    { id: 't1', title: 'SLMC Annual Renewal', category: 'professional', description: 'Due for 2026', due_date: '2026-03-31', status: 'pending', recurring: 'yearly', icon: '🏥', url: 'https://srilankmedicalcouncil.org/' },
    { id: 't2', title: 'Quarterly IRD Tax Payment', category: 'tax', description: 'Q1 2026 installment', due_date: '2026-03-15', status: 'overdue', recurring: 'quarterly', icon: '🧾' },
    { id: 't3', title: 'Vehicle Revenue License', category: 'vehicle', description: 'Toyota Aqua - WP KG-1234', due_date: '2026-04-15', status: 'pending', recurring: 'yearly', icon: '🚗' },
    { id: 't4', title: 'GMOA Subscription', category: 'professional', description: '2026 membership', due_date: '2026-01-15', status: 'completed', recurring: 'yearly', icon: '👨‍⚕️' },
    { id: 't5', title: 'Vehicle Leasing Payment', category: 'finance', description: 'March installment', due_date: '2026-03-05', status: 'completed', recurring: 'monthly', icon: '💳' },
    { id: 't6', title: 'UpToDate Subscription', category: 'cme', description: 'Annual renewal', due_date: '2026-06-01', status: 'pending', recurring: 'yearly', icon: '📖' },
    { id: 't7', title: 'Professional Indemnity Insurance', category: 'professional', description: 'Malpractice cover renewal', due_date: '2026-05-20', status: 'pending', recurring: 'yearly', icon: '⚖️' },
];

// ────────────────────────────────────────────────────────────────

const categoryColors: Record<string, { color: string; bg: string }> = {
    professional: { color: '#6366f1', bg: 'rgba(99,102,241,0.08)' },
    cme: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    vehicle: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
    finance: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
    tax: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
    clinic: { color: '#06b6d4', bg: 'rgba(6,182,212,0.08)' },
};

const LifeAdmin: React.FC = () => {
    const [tasks, setTasks] = useState<LifeAdminTask[]>(sampleTasks);
    const [filter, setFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
    const [showTemplates, setShowTemplates] = useState(false);

    const toggleComplete = (id: string) => {
        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' } : t
        ));
    };

    const filteredTasks = tasks.filter(t => filter === 'all' || t.status === filter);
    const overdue = tasks.filter(t => t.status === 'overdue').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const completed = tasks.filter(t => t.status === 'completed').length;

    const getDaysUntil = (date: string) => {
        const diff = Math.ceil((new Date(date).getTime() - Date.now()) / (86400000));
        if (diff < 0) return `${Math.abs(diff)}d overdue`;
        if (diff === 0) return 'Today';
        if (diff === 1) return 'Tomorrow';
        if (diff <= 7) return `${diff} days`;
        if (diff <= 30) return `${Math.ceil(diff / 7)} weeks`;
        return `${Math.ceil(diff / 30)} months`;
    };

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 900, margin: '0 auto' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                .la-card {
                    background: white; border-radius: 12px; padding: 14px 16px;
                    border: 1px solid rgba(226,232,240,0.8); margin-bottom: 8px;
                    display: flex; align-items: center; gap: 14px;
                    transition: all 0.2s; cursor: pointer;
                }
                .la-card:hover { box-shadow: 0 2px 10px rgba(0,0,0,0.04); }
                .la-card.completed { opacity: 0.5; }
                .la-card.overdue { border-left: 3px solid #ef4444; background: rgba(239,68,68,0.02); }
                .la-check {
                    width: 22px; height: 22px; border-radius: 50%; border: 2px solid #cbd5e1;
                    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
                    cursor: pointer; transition: all 0.2s; font-size: 12px;
                }
                .la-check.done { background: #22c55e; border-color: #22c55e; color: white; }
                .la-check:hover:not(.done) { border-color: #22c55e; }
                .filter-btn { padding: 5px 12px; border-radius: 6px; border: 1px solid #e2e8f0;
                    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
                    background: white; color: #64748b; }
                .filter-btn.active { background: #1e293b; color: white; border-color: #1e293b; }
                .template-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 10px; }
                .tmpl-card { padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0;
                    cursor: pointer; transition: all 0.2s; background: white; }
                .tmpl-card:hover { border-color: #6366f1; background: rgba(99,102,241,0.02); }
            `}</style>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                borderRadius: 18, padding: '20px 24px', marginBottom: 16, color: 'white',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{ fontSize: 26 }}>📋</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Life Admin</h2>
                        <p style={{ margin: 0, fontSize: 12, opacity: 0.85 }}>
                            Professional renewals, taxes & vehicle reminders
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: 16 }}>
                    {overdue > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fbbf24' }} />
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{overdue} overdue</span>
                        </div>
                    )}
                    <span style={{ fontSize: 12, opacity: 0.8 }}>📌 {pending} pending</span>
                    <span style={{ fontSize: 12, opacity: 0.8 }}>✅ {completed} done</span>
                </div>
            </div>

            {/* Filters + Add */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14
            }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    {(['all', 'overdue', 'pending', 'completed'] as const).map(f => (
                        <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}>
                            {f === 'all' ? 'All' : f === 'overdue' ? '🔴 Overdue' : f === 'pending' ? '⏳ Pending' : '✅ Done'}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowTemplates(!showTemplates)} style={{
                    padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    background: showTemplates ? '#ef4444' : '#7c3aed', color: 'white',
                    fontSize: 12, fontWeight: 600,
                }}>
                    {showTemplates ? '✕ Close' : '+ Add from Template'}
                </button>
            </div>

            {/* Template Grid */}
            {showTemplates && (
                <div style={{
                    marginBottom: 16, padding: 16, background: 'rgba(241,245,249,0.8)',
                    borderRadius: 14, border: '1px solid rgba(226,232,240,0.8)'
                }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                        🇱🇰 Sri Lankan Professional Templates
                    </div>
                    <div className="template-grid">
                        {TEMPLATES.map(t => {
                            const catColor = categoryColors[t.cat] || categoryColors.professional;
                            return (
                                <div key={t.id} className="tmpl-card" onClick={() => {
                                    const newTask: LifeAdminTask = {
                                        id: `t${Date.now()}`, title: t.title, category: t.cat,
                                        description: t.desc, due_date: '',
                                        status: 'pending', recurring: t.recurring, icon: t.icon,
                                        url: t.url,
                                    };
                                    setTasks([newTask, ...tasks]);
                                    setShowTemplates(false);
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                        <span style={{ fontSize: 18 }}>{t.icon}</span>
                                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b' }}>{t.title}</div>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#94a3b8' }}>{t.desc}</div>
                                    <div style={{
                                        marginTop: 6, fontSize: 9, fontWeight: 600, color: catColor.color,
                                        background: catColor.bg, padding: '2px 6px', borderRadius: 4,
                                        display: 'inline-block',
                                    }}>
                                        {t.recurring}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Task List */}
            {filteredTasks.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '3rem', color: '#94a3b8',
                    background: 'rgba(241,245,249,0.5)', borderRadius: 14,
                }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📋</div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>No {filter} tasks</div>
                </div>
            ) : (
                filteredTasks.sort((a, b) => {
                    // Overdue first, then by date
                    if (a.status === 'overdue' && b.status !== 'overdue') return -1;
                    if (b.status === 'overdue' && a.status !== 'overdue') return 1;
                    if (a.status === 'completed' && b.status !== 'completed') return 1;
                    if (b.status === 'completed' && a.status !== 'completed') return -1;
                    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
                }).map(task => {
                    const catColor = categoryColors[task.category] || categoryColors.professional;
                    const daysText = task.due_date ? getDaysUntil(task.due_date) : 'No date set';
                    return (
                        <div key={task.id}
                            className={`la-card ${task.status}`}
                            onClick={() => toggleComplete(task.id)}>
                            <div className={`la-check ${task.status === 'completed' ? 'done' : ''}`}>
                                {task.status === 'completed' && '✓'}
                            </div>

                            <span style={{ fontSize: 20, flexShrink: 0 }}>{task.icon}</span>

                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    fontSize: 13.5, fontWeight: 600, color: '#1e293b',
                                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                }}>
                                    {task.title}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                                    {task.description}
                                </div>
                            </div>

                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                                    color: catColor.color, background: catColor.bg,
                                }}>
                                    {task.category}
                                </span>
                                <div style={{
                                    fontSize: 11, fontWeight: 600, marginTop: 4,
                                    color: task.status === 'overdue' ? '#ef4444'
                                        : daysText.includes('d') && !daysText.includes('overdue') ? '#f59e0b'
                                            : '#94a3b8',
                                }}>
                                    {daysText}
                                </div>
                            </div>

                            {task.url && (
                                <a href={task.url} target="_blank" rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    style={{
                                        fontSize: 10, fontWeight: 600, color: '#6366f1',
                                        padding: '4px 8px', borderRadius: 6,
                                        background: 'rgba(99,102,241,0.08)',
                                        textDecoration: 'none', flexShrink: 0,
                                    }}>
                                    🔗 Pay
                                </a>
                            )}
                        </div>
                    );
                })
            )}

            {/* Reminder Info */}
            <div style={{
                marginTop: 16, padding: 14, background: 'rgba(99,102,241,0.04)',
                borderRadius: 12, border: '1px solid rgba(99,102,241,0.1)',
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#6366f1', marginBottom: 6 }}>
                    🔔 Automatic Reminders
                </div>
                <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.6 }}>
                    Push notifications are sent automatically at <strong>30 days</strong>,{' '}
                    <strong>7 days</strong>, and <strong>1 day</strong> before each due date.
                    Never miss an SLMC renewal or IRD payment again.
                </div>
            </div>
        </div>
    );
};

export default LifeAdmin;
