/**
 * Medical Practice Service (MyTracksy Doctor)
 *
 * Local-first persistence for the medical dashboard, fixing the data-loss bug
 * where channeling shifts, quick notes, appointments and patients lived only
 * in React state.
 *
 * PDPA (Act No. 9 of 2022) design:
 *   • Patients, quick notes, appointments → LOCAL-ONLY (Dexie/IndexedDB).
 *     Patient-identifying data never leaves the device.
 *   • Channeling shifts → financial records (no patient identifiers) —
 *     stored locally AND synced to Firestore via SyncEngine.
 *   • Practice profile (SLMC #, renewals, TIN) → no patient data — stored
 *     locally and mirrored to Firestore (best-effort) for cross-device use.
 *
 * Guest/demo users (uid starts with `guest_`/`demo_`) never touch Firestore.
 */

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db as firestore } from '../config/firebase';
import {
    db,
    type MedicalChannelingShift,
    type MedicalQuickNote,
    type MedicalAppointment,
    type MedicalPatient,
    type MedicalPracticeProfile,
} from '../lib/db';
import { syncEngine } from '../lib/SyncEngine';

export type {
    MedicalChannelingShift,
    MedicalQuickNote,
    MedicalAppointment,
    MedicalPatient,
    MedicalPracticeProfile,
};

const isCloudUser = (uid: string) => !!uid && !uid.startsWith('guest_') && !uid.startsWith('demo_');

const todayStr = () => new Date().toISOString().split('T')[0];

/** Days a pending shift can wait before it is flagged overdue. */
export const SHIFT_OVERDUE_AFTER_DAYS = 14;

// ════════════════════════════════════════════════════════════════
//  CHANNELING SHIFTS (financial — local + cloud sync)
// ════════════════════════════════════════════════════════════════

export async function listChannelingShifts(userId: string): Promise<MedicalChannelingShift[]> {
    const shifts = await db.medical_channeling_shifts.where('userId').equals(userId).toArray();
    return shifts.sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
}

export async function addChannelingShift(
    userId: string,
    shift: Omit<MedicalChannelingShift, 'id' | 'userId' | 'createdAt' | 'sync_status'>
): Promise<MedicalChannelingShift> {
    const record: MedicalChannelingShift = {
        ...shift,
        id: `cs-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        createdAt: Date.now(),
        sync_status: 'pending',
    };
    await db.medical_channeling_shifts.put(record);
    if (isCloudUser(userId)) void syncEngine.pushPendingDataToCloud();
    return record;
}

export async function updateChannelingShift(
    userId: string,
    id: string,
    patch: Partial<MedicalChannelingShift>
): Promise<void> {
    await db.medical_channeling_shifts.update(id, { ...patch, sync_status: 'pending' as const });
    if (isCloudUser(userId)) void syncEngine.pushPendingDataToCloud();
}

export async function deleteChannelingShift(id: string): Promise<void> {
    await db.medical_channeling_shifts.delete(id);
}

/** Flag pending shifts older than SHIFT_OVERDUE_AFTER_DAYS as overdue. Returns updated count. */
export async function autoMarkOverdueShifts(userId: string): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SHIFT_OVERDUE_AFTER_DAYS);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    const stale = await db.medical_channeling_shifts
        .where('userId').equals(userId)
        .filter(s => s.status === 'pending' && s.date < cutoffStr)
        .toArray();

    for (const s of stale) {
        await db.medical_channeling_shifts.update(s.id, { status: 'overdue' as const, sync_status: 'pending' as const });
    }
    return stale.length;
}

/** Per-hospital WHT/AIT certificate summary — what the auditor asks for at filing time. */
export interface HospitalWhtSummary {
    hospital: string;
    shifts: number;
    grossReceived: number;
    whtEstimated: number;     // 5% of gross received
    certsCollected: number;   // shifts with whtCertReceived
    certsMissing: number;
}

export function whtSummaryByHospital(shifts: MedicalChannelingShift[]): HospitalWhtSummary[] {
    const map = new Map<string, HospitalWhtSummary>();
    for (const s of shifts) {
        if (s.status !== 'received') continue;
        const key = s.hospital || 'Unknown';
        const row = map.get(key) || { hospital: key, shifts: 0, grossReceived: 0, whtEstimated: 0, certsCollected: 0, certsMissing: 0 };
        row.shifts += 1;
        row.grossReceived += s.expected;
        row.whtEstimated = Math.round(row.grossReceived * 0.05);
        if (s.whtCertReceived) row.certsCollected += 1; else row.certsMissing += 1;
        map.set(key, row);
    }
    return Array.from(map.values()).sort((a, b) => b.grossReceived - a.grossReceived);
}

/** Common Sri Lankan private hospitals / channeling centres for quick entry. */
export const SL_CHANNELING_HOSPITALS = [
    'Asiri Central Hospital',
    'Asiri Surgical Hospital',
    'Asiri Medical Hospital',
    'Lanka Hospitals',
    'Nawaloka Hospital',
    'Durdans Hospital',
    'Hemas Hospital — Wattala',
    'Hemas Hospital — Thalawathugoda',
    'Ninewells Hospital',
    'Kings Hospital Colombo',
    'Golden Key Hospital',
    'Santa Dora Hospital',
    'Western Hospital',
    'Cooperative Hospital — Galle',
    'Suwasewana Hospital — Kandy',
    'Asiri Hospital — Kandy',
    'Mediport Clinic',
    'Own Private Clinic',
];

// ════════════════════════════════════════════════════════════════
//  QUICK NOTES (clinical — LOCAL ONLY, PDPA)
// ════════════════════════════════════════════════════════════════

export async function listQuickNotes(userId: string): Promise<MedicalQuickNote[]> {
    const notes = await db.medical_quick_notes.where('userId').equals(userId).toArray();
    return notes.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addQuickNote(
    userId: string,
    note: { text: string; patient?: string; type?: string }
): Promise<MedicalQuickNote> {
    const now = new Date();
    const record: MedicalQuickNote = {
        id: `qn-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        text: note.text,
        patient: note.patient,
        type: note.type || 'note',
        time: now.toLocaleTimeString('en-LK', { hour: '2-digit', minute: '2-digit' }),
        date: todayStr(),
        userId,
        createdAt: Date.now(),
    };
    await db.medical_quick_notes.put(record);
    return record;
}

export async function deleteQuickNote(id: string): Promise<void> {
    await db.medical_quick_notes.delete(id);
}

// ════════════════════════════════════════════════════════════════
//  APPOINTMENTS (contain patient names — LOCAL ONLY, PDPA)
// ════════════════════════════════════════════════════════════════

export async function listAppointments(userId: string): Promise<MedicalAppointment[]> {
    const appts = await db.medical_appointments.where('userId').equals(userId).toArray();
    return appts.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
}

export async function addAppointment(
    userId: string,
    appt: Omit<MedicalAppointment, 'id' | 'userId' | 'createdAt'>
): Promise<MedicalAppointment> {
    const record: MedicalAppointment = {
        ...appt,
        id: `ap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        createdAt: Date.now(),
    };
    await db.medical_appointments.put(record);
    return record;
}

export async function updateAppointment(id: string, patch: Partial<MedicalAppointment>): Promise<void> {
    await db.medical_appointments.update(id, patch);
}

export async function deleteAppointment(id: string): Promise<void> {
    await db.medical_appointments.delete(id);
}

// ════════════════════════════════════════════════════════════════
//  PATIENT REGISTRY (LOCAL ONLY, PDPA — never synced to cloud)
// ════════════════════════════════════════════════════════════════

export async function listPatients(userId: string): Promise<MedicalPatient[]> {
    const patients = await db.medical_patients.where('userId').equals(userId).toArray();
    return patients.sort((a, b) => (b.lastVisit || '').localeCompare(a.lastVisit || '') || b.createdAt - a.createdAt);
}

export async function addPatient(
    userId: string,
    patient: Omit<MedicalPatient, 'id' | 'userId' | 'createdAt' | 'visits' | 'lastVisit'> & Partial<Pick<MedicalPatient, 'visits' | 'lastVisit'>>
): Promise<MedicalPatient> {
    const record: MedicalPatient = {
        visits: 0,
        lastVisit: '',
        ...patient,
        id: `pt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        userId,
        createdAt: Date.now(),
    };
    await db.medical_patients.put(record);
    return record;
}

export async function updatePatient(id: string, patch: Partial<MedicalPatient>): Promise<void> {
    await db.medical_patients.update(id, patch);
}

export async function deletePatient(id: string): Promise<void> {
    await db.medical_patients.delete(id);
}

/** Record a visit: bumps visit count and lastVisit date. */
export async function recordPatientVisit(id: string): Promise<void> {
    const p = await db.medical_patients.get(id);
    if (!p) return;
    await db.medical_patients.update(id, { visits: (p.visits || 0) + 1, lastVisit: todayStr() });
}

// ════════════════════════════════════════════════════════════════
//  PRACTICE PROFILE (SLMC / indemnity / TIN — local + cloud mirror)
// ════════════════════════════════════════════════════════════════

export async function getPracticeProfile(userId: string): Promise<MedicalPracticeProfile | null> {
    // Local first (instant, offline-safe)
    const local = await db.medical_practice_profile.get(userId);

    // Cloud mirror (best-effort) — newer copy wins
    if (isCloudUser(userId)) {
        try {
            const snap = await getDoc(doc(firestore, `users/${userId}/practice/profile`));
            if (snap.exists()) {
                const cloud = snap.data() as MedicalPracticeProfile;
                if (!local || (cloud.updatedAt || 0) > (local.updatedAt || 0)) {
                    const merged = { ...cloud, userId };
                    await db.medical_practice_profile.put(merged);
                    return merged;
                }
            }
        } catch (err) {
            console.warn('[medicalPracticeService] Cloud profile fetch failed (offline?):', err);
        }
    }
    return local || null;
}

export async function savePracticeProfile(
    userId: string,
    patch: Partial<Omit<MedicalPracticeProfile, 'userId' | 'updatedAt'>>
): Promise<MedicalPracticeProfile> {
    const existing = await db.medical_practice_profile.get(userId);
    const next: MedicalPracticeProfile = { ...(existing || { userId }), ...patch, userId, updatedAt: Date.now() };
    await db.medical_practice_profile.put(next);

    if (isCloudUser(userId)) {
        // Best-effort mirror; local copy is the source of truth offline.
        setDoc(doc(firestore, `users/${userId}/practice/profile`), next, { merge: true })
            .catch(err => console.warn('[medicalPracticeService] Cloud profile mirror failed:', err));
    }
    return next;
}

/** Renewal reminders derived from the profile (SLMC, indemnity). */
export interface PracticeReminder {
    id: string;
    label: string;
    dueDate: string;
    daysLeft: number;
    severity: 'ok' | 'warning' | 'urgent' | 'overdue';
}

export function getPracticeReminders(profile: MedicalPracticeProfile | null, reference = new Date()): PracticeReminder[] {
    if (!profile) return [];
    const reminders: PracticeReminder[] = [];
    const push = (id: string, label: string, dueDate?: string) => {
        if (!dueDate) return;
        const due = new Date(`${dueDate}T00:00:00`);
        if (Number.isNaN(due.getTime())) return;
        const daysLeft = Math.ceil((due.getTime() - reference.getTime()) / 86_400_000);
        const severity: PracticeReminder['severity'] =
            daysLeft < 0 ? 'overdue' : daysLeft <= 14 ? 'urgent' : daysLeft <= 60 ? 'warning' : 'ok';
        reminders.push({ id, label, dueDate, daysLeft, severity });
    };
    push('slmc', 'SLMC Registration Renewal', profile.slmcRenewalDate);
    push('indemnity', `Indemnity Insurance${profile.indemnityProvider ? ` (${profile.indemnityProvider})` : ''}`, profile.indemnityExpiry);
    return reminders.sort((a, b) => a.daysLeft - b.daysLeft);
}

// ════════════════════════════════════════════════════════════════
//  IRD QUARTERLY INSTALMENTS (Sri Lanka tax year: Apr 1 – Mar 31)
// ════════════════════════════════════════════════════════════════

export interface IrdQuarter {
    q: string;
    period: string;
    dueDate: string;     // YYYY-MM-DD
    dueLabel: string;
    daysLeft: number;
    status: 'past' | 'due-soon' | 'upcoming';
}

/** Date-driven IRD instalment schedule for the CURRENT tax year (replaces the hardcoded one). */
export function getIrdQuarterSchedule(reference = new Date()): IrdQuarter[] {
    // Tax year starting April of (this year if month >= April, else last year)
    const startYear = reference.getMonth() >= 3 ? reference.getFullYear() : reference.getFullYear() - 1;
    const quarters = [
        { q: 'Q1', period: 'Apr–Jun', dueDate: `${startYear}-08-15` },
        { q: 'Q2', period: 'Jul–Sep', dueDate: `${startYear}-11-15` },
        { q: 'Q3', period: 'Oct–Dec', dueDate: `${startYear + 1}-02-15` },
        { q: 'Q4', period: 'Jan–Mar', dueDate: `${startYear + 1}-05-15` },
    ];
    return quarters.map(({ q, period, dueDate }) => {
        const due = new Date(`${dueDate}T00:00:00`);
        const daysLeft = Math.ceil((due.getTime() - reference.getTime()) / 86_400_000);
        const status: IrdQuarter['status'] = daysLeft < 0 ? 'past' : daysLeft <= 30 ? 'due-soon' : 'upcoming';
        const dueLabel = due.toLocaleDateString('en-LK', { month: 'short', day: 'numeric', year: 'numeric' });
        return { q, period, dueDate, dueLabel, daysLeft, status };
    });
}
