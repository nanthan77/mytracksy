/**
 * SmartScheduler — Premium "Personal Assistant" Calendar
 *
 * Dual-roster system for Sri Lankan doctors:
 *  - Government shifts (blue) — rigid 24-hr rotations
 *  - Private channeling (green) — flexible 2-hr slots
 *  - Conflict detection with visual warnings
 *  - 1-in-4, 1-in-3 shift rotation templates
 *  - Smart commute alerts w/ Waze/Google Maps deeplinks
 *  - Saved hospital locations
 */

import React, { useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────

interface ScheduleEvent {
    id: string;
    title: string;
    type: 'gov_shift' | 'private_channeling' | 'personal';
    start_time: string;
    end_time: string;
    location?: string;
    origin_lat_lng?: string;
    destination_lat_lng?: string;
    requires_traffic_alert: boolean;
    notes?: string;
}

interface SavedLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    type: 'government' | 'private' | 'home';
}

// ─── Shift Templates ────────────────────────────────────────────

const SHIFT_TEMPLATES = [
    { id: '1in4_night', name: '1-in-4 Night Shift', pattern: [0, 0, 0, 1], hours: { start: 16, end: 8 }, desc: 'Every 4th night (4 PM → 8 AM next day)' },
    { id: '1in3_night', name: '1-in-3 Night Shift', pattern: [0, 0, 1], hours: { start: 16, end: 8 }, desc: 'Every 3rd night (4 PM → 8 AM next day)' },
    { id: '1in4_weekend', name: '1-in-4 Weekend On-Call', pattern: [0, 0, 0, 1], hours: { start: 8, end: 8 }, desc: 'Every 4th weekend (24-hr Saturday)' },
    { id: 'morning_ward', name: 'Daily Ward Round', pattern: [1, 1, 1, 1, 1, 0, 0], hours: { start: 7, end: 13 }, desc: 'Mon-Fri Ward Round (7 AM → 1 PM)' },
    { id: '24hr_casualty', name: '24-Hour Casualty', pattern: [0, 0, 0, 0, 1], hours: { start: 8, end: 8 }, desc: 'Every 5th day full casualty shift' },
];

// ─── Popular Sri Lankan Hospitals ────────────────────────────────

const POPULAR_HOSPITALS: SavedLocation[] = [
    { id: 'nhsl', name: 'National Hospital (NHSL)', lat: 6.9192, lng: 79.8683, type: 'government' },
    { id: 'lrh', name: "Lady Ridgeway Hospital (LRH)", lat: 6.9166, lng: 79.8635, type: 'government' },
    { id: 'dmc', name: 'De Soysa Maternity (DMC)', lat: 6.9145, lng: 79.8642, type: 'government' },
    { id: 'karapitiya', name: 'Karapitiya Teaching Hospital', lat: 6.0595, lng: 80.2303, type: 'government' },
    { id: 'kandy', name: 'Kandy General Hospital', lat: 7.2879, lng: 80.6357, type: 'government' },
    { id: 'nawaloka', name: 'Nawaloka Hospital', lat: 6.9274, lng: 79.8540, type: 'private' },
    { id: 'asiri', name: 'Asiri Central Hospital', lat: 6.9070, lng: 79.8572, type: 'private' },
    { id: 'durdans', name: 'Durdans Hospital', lat: 6.8945, lng: 79.8586, type: 'private' },
    { id: 'lanka', name: 'Lanka Hospital', lat: 6.8880, lng: 79.8744, type: 'private' },
    { id: 'hemas', name: 'Hemas Hospital Wattala', lat: 6.9784, lng: 79.8886, type: 'private' },
];

// ─── Sample Events ──────────────────────────────────────────────

const sampleEvents: ScheduleEvent[] = [
    {
        id: 'e1', title: 'Morning Ward Round', type: 'gov_shift',
        start_time: '2026-03-10T07:00', end_time: '2026-03-10T13:00',
        location: 'NHSL', requires_traffic_alert: false,
    },
    {
        id: 'e2', title: 'Channeling - Nawaloka', type: 'private_channeling',
        start_time: '2026-03-10T16:30', end_time: '2026-03-10T19:00',
        location: 'Nawaloka Hospital', origin_lat_lng: '6.919, 79.868',
        destination_lat_lng: '6.927, 79.854', requires_traffic_alert: true,
    },
    {
        id: 'e3', title: '24-Hour Casualty', type: 'gov_shift',
        start_time: '2026-03-12T08:00', end_time: '2026-03-13T08:00',
        location: 'NHSL', requires_traffic_alert: false,
    },
    {
        id: 'e4', title: 'Channeling - Asiri', type: 'private_channeling',
        start_time: '2026-03-12T18:00', end_time: '2026-03-12T20:00',
        location: 'Asiri Central',
        requires_traffic_alert: true,
        notes: '⚠️ Conflict: You are on 24-Hr Casualty at NHSL!',
    },
    {
        id: 'e5', title: 'Channeling - Durdans', type: 'private_channeling',
        start_time: '2026-03-11T17:00', end_time: '2026-03-11T19:30',
        location: 'Durdans Hospital', requires_traffic_alert: true,
    },
];

// ─── Traffic Alert Sample ────────────────────────────────────────

const sampleAlert = {
    title: 'Channeling - Nawaloka', traffic_level: 'Heavy', travel_duration_mins: 42,
    leave_time: '3:38 PM', event_time: '4:30 PM',
    waze_url: 'https://waze.com/ul?ll=6.927,79.854&navigate=yes',
    google_maps_url: 'https://www.google.com/maps/dir/?api=1&origin=6.919,79.868&destination=6.927,79.854&travelmode=driving',
};

// ────────────────────────────────────────────────────────────────

const SmartScheduler: React.FC = () => {
    const [events, setEvents] = useState<ScheduleEvent[]>(sampleEvents);
    const [activeTab, setActiveTab] = useState<'calendar' | 'templates' | 'locations' | 'alerts'>('calendar');
    const [showAddEvent, setShowAddEvent] = useState(false);
    const [newEvent, setNewEvent] = useState<Partial<ScheduleEvent>>({
        type: 'private_channeling', requires_traffic_alert: true,
    });

    // Get events for a specific date
    const getEventsForDate = (dateStr: string) =>
        events.filter(e => e.start_time.startsWith(dateStr));

    // Generate 7-day calendar starting from today
    const weekDays = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() + i);
        return d;
    });

    const typeConfig: Record<string, { color: string; bg: string; label: string; border: string }> = {
        gov_shift: { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', label: 'Govt', border: 'rgba(59,130,246,0.3)' },
        private_channeling: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)', label: 'Private', border: 'rgba(34,197,94,0.3)' },
        personal: { color: '#a855f7', bg: 'rgba(168,85,247,0.08)', label: 'Personal', border: 'rgba(168,85,247,0.3)' },
    };

    const hasConflict = (event: ScheduleEvent) =>
        event.type === 'private_channeling' && events.some(e =>
            e.id !== event.id && e.type === 'gov_shift' &&
            new Date(e.start_time) < new Date(event.end_time) &&
            new Date(e.end_time) > new Date(event.start_time)
        );

    return (
        <div style={{ fontFamily: "'Inter', sans-serif", maxWidth: 960, margin: '0 auto' }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                .sch-tab { padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer;
                    font-size: 13px; font-weight: 600; transition: all 0.2s; background: transparent; color: #94a3b8; }
                .sch-tab.active { background: #1e293b; color: white; }
                .sch-tab:hover:not(.active) { background: rgba(30,41,59,0.05); color: #475569; }
                .event-card { border-radius: 10px; padding: 12px 14px; margin-bottom: 6px; cursor: pointer;
                    transition: all 0.2s; border-left: 3px solid; position: relative; }
                .event-card:hover { transform: translateX(2px); box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
                .conflict-badge { position: absolute; top: -6px; right: -6px; background: #ef4444;
                    color: white; font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
                    animation: pulse-conflict 1.5s ease-in-out infinite; }
                @keyframes pulse-conflict { 0%,100%{opacity:1} 50%{opacity:0.6} }
                .day-col { flex: 1; min-width: 120px; border-right: 1px solid rgba(226,232,240,0.5);
                    padding: 0 8px; }
                .day-col:last-child { border-right: none; }
                .template-card { background: white; border: 1px solid rgba(226,232,240,0.8); border-radius: 12px;
                    padding: 16px; cursor: pointer; transition: all 0.2s; }
                .template-card:hover { border-color: #6366f1; box-shadow: 0 4px 12px rgba(99,102,241,0.1); }
                .loc-chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
                    border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer;
                    transition: all 0.2s; border: 1px solid; margin: 4px; }
                .loc-chip:hover { transform: scale(1.02); }
                .alert-card { background: linear-gradient(135deg, #0f172a, #1e293b); border-radius: 14px;
                    padding: 20px; color: white; }
                .nav-btn { display: flex; gap: 10px; margin-top: 12px; }
                .nav-btn a { flex: 1; text-align: center; padding: 10px; border-radius: 10px;
                    text-decoration: none; font-size: 13px; font-weight: 600; transition: all 0.2s; }
                .nav-btn a:hover { transform: translateY(-1px); }
                .add-form { background: white; border: 1px solid rgba(226,232,240,0.8); border-radius: 14px;
                    padding: 20px; margin-bottom: 16px; }
                .add-form input, .add-form select { width: 100%; padding: 8px 12px; border-radius: 8px;
                    border: 1px solid #e2e8f0; font-size: 13px; margin-top: 4px; }
                .add-form label { font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase;
                    letter-spacing: 0.5px; }
            `}</style>

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
                borderRadius: 18, padding: '20px 24px', marginBottom: 16, color: 'white',
                position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: -20, right: -20, width: 100, height: 100,
                    borderRadius: '50%', background: 'rgba(255,255,255,0.08)'
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 26 }}>📅</span>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Smart Scheduler</h2>
                        <p style={{ margin: 0, fontSize: 12, opacity: 0.8 }}>
                            Dual-roster management with traffic alerts
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6', border: '2px solid white' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>Govt Shifts</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: '#22c55e', border: '2px solid white' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>Private Channeling</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444', border: '2px solid white' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, opacity: 0.9 }}>Conflicts</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{
                display: 'flex', gap: 4, marginBottom: 16, background: 'rgba(241,245,249,0.8)',
                padding: 4, borderRadius: 10
            }}>
                {(['calendar', 'templates', 'locations', 'alerts'] as const).map(tab => (
                    <button key={tab} className={`sch-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab === 'calendar' ? '📅 Calendar' : tab === 'templates' ? '🔄 Shift Templates'
                            : tab === 'locations' ? '📍 Hospitals' : '🚗 Traffic Alerts'}
                    </button>
                ))}
            </div>

            {/* ═══ CALENDAR TAB ═══ */}
            {activeTab === 'calendar' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>This Week</h3>
                        <button onClick={() => setShowAddEvent(!showAddEvent)} style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: showAddEvent ? '#ef4444' : '#1e293b', color: 'white',
                            fontSize: 12, fontWeight: 600,
                        }}>
                            {showAddEvent ? '✕ Cancel' : '+ Add Event'}
                        </button>
                    </div>

                    {/* Add Event Form */}
                    {showAddEvent && (
                        <div className="add-form">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                                <div>
                                    <label>Title</label>
                                    <input placeholder="e.g. Channeling - Nawaloka" value={newEvent.title || ''}
                                        onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} />
                                </div>
                                <div>
                                    <label>Type</label>
                                    <select value={newEvent.type} onChange={e => setNewEvent({
                                        ...newEvent, type: e.target.value as ScheduleEvent['type']
                                    })}>
                                        <option value="gov_shift">🔵 Government Shift</option>
                                        <option value="private_channeling">🟢 Private Channeling</option>
                                        <option value="personal">🟣 Personal</option>
                                    </select>
                                </div>
                                <div>
                                    <label>Start Time</label>
                                    <input type="datetime-local" value={newEvent.start_time || ''}
                                        onChange={e => setNewEvent({ ...newEvent, start_time: e.target.value })} />
                                </div>
                                <div>
                                    <label>End Time</label>
                                    <input type="datetime-local" value={newEvent.end_time || ''}
                                        onChange={e => setNewEvent({ ...newEvent, end_time: e.target.value })} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <input type="checkbox" id="traffic-check" checked={newEvent.requires_traffic_alert}
                                    onChange={e => setNewEvent({ ...newEvent, requires_traffic_alert: e.target.checked })} />
                                <label htmlFor="traffic-check" style={{ fontSize: 12, fontWeight: 500, color: '#475569', textTransform: 'none', letterSpacing: 0 }}>
                                    🚗 Enable smart traffic alerts
                                </label>
                            </div>
                            <button onClick={() => {
                                if (newEvent.title && newEvent.start_time && newEvent.end_time) {
                                    setEvents([...events, { ...newEvent, id: `e${Date.now()}` } as ScheduleEvent]);
                                    setShowAddEvent(false);
                                    setNewEvent({ type: 'private_channeling', requires_traffic_alert: true });
                                }
                            }} style={{
                                marginTop: 12, padding: '8px 20px', borderRadius: 8, border: 'none',
                                background: '#1e293b', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                            }}>
                                Save Event
                            </button>
                        </div>
                    )}

                    {/* 7-Day Calendar Grid */}
                    <div style={{
                        display: 'flex', overflowX: 'auto', gap: 0,
                        background: 'white', borderRadius: 14, border: '1px solid rgba(226,232,240,0.8)',
                        padding: '12px 4px', minHeight: 300
                    }}>
                        {weekDays.map(day => {
                            const dateStr = day.toISOString().split('T')[0];
                            const dayEvents = getEventsForDate(dateStr);
                            const isToday = dateStr === new Date().toISOString().split('T')[0];
                            return (
                                <div key={dateStr} className="day-col">
                                    <div style={{
                                        textAlign: 'center', marginBottom: 10, paddingBottom: 8,
                                        borderBottom: '1px solid rgba(226,232,240,0.5)',
                                    }}>
                                        <div style={{
                                            fontSize: 10, fontWeight: 600, color: '#94a3b8',
                                            textTransform: 'uppercase'
                                        }}>
                                            {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                        </div>
                                        <div style={{
                                            fontSize: 18, fontWeight: 800, color: isToday ? 'white' : '#1e293b',
                                            background: isToday ? '#3b82f6' : 'transparent',
                                            borderRadius: 8, width: 32, height: 32, display: 'flex',
                                            alignItems: 'center', justifyContent: 'center', margin: '4px auto 0',
                                        }}>
                                            {day.getDate()}
                                        </div>
                                    </div>

                                    {dayEvents.length === 0 && (
                                        <div style={{ fontSize: 11, color: '#cbd5e1', textAlign: 'center', padding: '20px 4px' }}>
                                            No events
                                        </div>
                                    )}

                                    {dayEvents.map(event => {
                                        const config = typeConfig[event.type] || typeConfig.personal;
                                        const conflict = hasConflict(event);
                                        const startH = new Date(event.start_time).toLocaleTimeString('en-US', {
                                            hour: 'numeric', minute: '2-digit', hour12: true
                                        });
                                        return (
                                            <div key={event.id} className="event-card" style={{
                                                background: conflict ? 'rgba(239,68,68,0.06)' : config.bg,
                                                borderColor: conflict ? '#ef4444' : config.color,
                                            }}>
                                                {conflict && <div className="conflict-badge">⚠️ CLASH</div>}
                                                <div style={{
                                                    fontSize: 11, fontWeight: 700, color: config.color,
                                                    marginBottom: 2
                                                }}>
                                                    {config.label}
                                                </div>
                                                <div style={{
                                                    fontSize: 12, fontWeight: 600, color: '#1e293b',
                                                    lineHeight: 1.3, marginBottom: 4
                                                }}>
                                                    {event.title}
                                                </div>
                                                <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 500 }}>
                                                    {startH} • {event.location || ''}
                                                </div>
                                                {event.requires_traffic_alert && (
                                                    <div style={{ fontSize: 9, color: '#f59e0b', fontWeight: 600, marginTop: 4 }}>
                                                        🚗 Traffic alert
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ SHIFT TEMPLATES TAB ═══ */}
            {activeTab === 'templates' && (
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 12 }}>
                        🔄 Shift Rotation Templates
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                        Select a template to auto-populate your calendar for the next 6 months.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                        {SHIFT_TEMPLATES.map(template => (
                            <div key={template.id} className="template-card">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                    <span style={{ fontSize: 22 }}>🔵</span>
                                    <div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                                            {template.name}
                                        </div>
                                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{template.desc}</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 600 }}>Pattern:</span>
                                    {template.pattern.map((v, i) => (
                                        <div key={i} style={{
                                            width: 18, height: 18, borderRadius: 4, fontSize: 10,
                                            fontWeight: 700, display: 'flex', alignItems: 'center',
                                            justifyContent: 'center',
                                            background: v ? '#3b82f6' : 'rgba(226,232,240,0.5)',
                                            color: v ? 'white' : '#94a3b8',
                                        }}>
                                            {v ? '✓' : '-'}
                                        </div>
                                    ))}
                                </div>

                                <button style={{
                                    width: '100%', padding: '8px', borderRadius: 8, border: '1px solid #e2e8f0',
                                    background: 'rgba(241,245,249,0.8)', cursor: 'pointer', fontSize: 12,
                                    fontWeight: 600, color: '#3b82f6',
                                }}>
                                    Apply Template →
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ═══ LOCATIONS TAB ═══ */}
            {activeTab === 'locations' && (
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                        📍 Saved Hospital Locations
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                        Pre-saved hospitals for quick event creation and traffic routing.
                    </p>

                    <div style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase',
                            letterSpacing: '0.5px', marginBottom: 8
                        }}>
                            🏥 Government Hospitals
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {POPULAR_HOSPITALS.filter(h => h.type === 'government').map(h => (
                                <div key={h.id} className="loc-chip" style={{
                                    background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.2)',
                                    color: '#1e40af',
                                }}>
                                    🏥 {h.name}
                                    <span style={{ fontSize: 9, color: '#94a3b8' }}>
                                        {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        <div style={{
                            fontSize: 11, fontWeight: 700, color: '#22c55e', textTransform: 'uppercase',
                            letterSpacing: '0.5px', marginBottom: 8
                        }}>
                            🏨 Private Hospitals
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                            {POPULAR_HOSPITALS.filter(h => h.type === 'private').map(h => (
                                <div key={h.id} className="loc-chip" style={{
                                    background: 'rgba(34,197,94,0.06)', borderColor: 'rgba(34,197,94,0.2)',
                                    color: '#166534',
                                }}>
                                    🏨 {h.name}
                                    <span style={{ fontSize: 9, color: '#94a3b8' }}>
                                        {h.lat.toFixed(3)}, {h.lng.toFixed(3)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ TRAFFIC ALERTS TAB ═══ */}
            {activeTab === 'alerts' && (
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                        🚗 Smart Commute Alerts
                    </h3>
                    <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
                        Automated traffic-aware departure reminders. Uses ONE Google Maps API call per event.
                    </p>

                    {/* Sample Alert */}
                    <div className="alert-card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                            <span style={{ fontSize: 20 }}>🟠</span>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700 }}>
                                    {sampleAlert.traffic_level} Traffic → {sampleAlert.title}
                                </div>
                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                    Today • Next scheduled appointment
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12,
                            background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 12, marginBottom: 12,
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Travel Time</div>
                                <div style={{ fontSize: 20, fontWeight: 800 }}>{sampleAlert.travel_duration_mins}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>minutes</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Leave By</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{sampleAlert.leave_time}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>today</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Arrive By</div>
                                <div style={{ fontSize: 20, fontWeight: 800, color: '#22c55e' }}>{sampleAlert.event_time}</div>
                                <div style={{ fontSize: 10, color: '#94a3b8' }}>on time</div>
                            </div>
                        </div>

                        {/* Waze + Google Maps buttons */}
                        <div className="nav-btn">
                            <a href={sampleAlert.waze_url} target="_blank" rel="noopener noreferrer"
                                style={{ background: '#33ccff', color: '#1a1a2e' }}>
                                🗺️ Open Waze
                            </a>
                            <a href={sampleAlert.google_maps_url} target="_blank" rel="noopener noreferrer"
                                style={{ background: '#4285f4', color: 'white' }}>
                                📍 Google Maps
                            </a>
                        </div>
                    </div>

                    {/* How it works */}
                    <div style={{
                        background: 'rgba(241,245,249,0.8)', borderRadius: 12, padding: 16,
                        border: '1px solid rgba(226,232,240,0.8)',
                    }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 10 }}>
                            ⚡ How Smart Commute Works
                        </div>
                        {[
                            { step: '1', text: 'You create a channeling event with traffic alerts ON', icon: '📅' },
                            { step: '2', text: 'A Cloud Task sleeps until 75 minutes before your event', icon: '⏰' },
                            { step: '3', text: 'It pings Google Maps ONCE for real-time Colombo traffic', icon: '🗺️' },
                            { step: '4', text: 'Calculates leave time with a 10-min parking buffer', icon: '🧮' },
                            { step: '5', text: 'Sends you a push notification with Waze deeplink', icon: '📲' },
                        ].map(s => (
                            <div key={s.step} style={{
                                display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8,
                            }}>
                                <div style={{
                                    width: 24, height: 24, borderRadius: 6, background: '#1e293b',
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                                }}>{s.step}</div>
                                <span style={{ fontSize: 12, color: '#475569' }}>{s.icon} {s.text}</span>
                            </div>
                        ))}
                        <div style={{
                            marginTop: 10, padding: '8px 12px', background: 'rgba(34,197,94,0.08)',
                            borderRadius: 8, fontSize: 11, color: '#16a34a', fontWeight: 600,
                        }}>
                            💰 Cost: ~$0.005 per alert (ONE API call per event, no GPS tracking)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SmartScheduler;
