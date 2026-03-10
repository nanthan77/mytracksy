/**
 * Doctor Finance Service — Firestore CRUD for Medical Dashboard
 *
 * Collections:
 *   users/{uid}/income        — channeling payments, private practice income
 *   users/{uid}/expenses      — deductible expenses (Golden List categories)
 *   users/{uid}/receipts      — scanned receipt data
 *   users/{uid}/channeling    — hospital channeling tracker entries
 *   users/{uid}/govIncome     — government salary config (APIT)
 *
 * All writes go to Firestore. Reads use onSnapshot for real-time updates.
 * Falls back gracefully if Firestore is unreachable (offline-first with cache).
 */

import {
    collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
    onSnapshot, query, orderBy, where,
    serverTimestamp, setDoc, getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ==================== TYPES ====================

export interface IncomeEntry {
    id?: string;
    description: string;
    amount: number;
    category: string;       // 'Channeling', 'Private Clinic', 'Consultation', 'Procedure', etc.
    source: string;          // Hospital name or clinic
    date: string;            // YYYY-MM-DD
    whtDeducted: number;     // Withholding Tax (5% from hospitals)
    status: 'received' | 'pending' | 'overdue';
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface ExpenseEntry {
    id?: string;
    description: string;
    amount: number;
    category: string;       // Golden List category name
    date: string;
    receiptId?: string;     // Link to receipt
    isCapitalItem: boolean;
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface ReceiptEntry {
    id?: string;
    imageData: string;      // base64 or Firebase Storage URL
    amount: number;
    vendor: string;
    date: string;
    category: string;
    ocrConfidence?: number;
    ocrRawText?: string;
    capturedAt: string;
    expenseId?: string;     // Linked expense
    createdAt?: any;
}

export interface ChannelingEntry {
    id?: string;
    hospitalName: string;
    date: string;
    patientsCount: number;
    grossFee: number;       // Per-patient fee × count
    facilityFee: number;    // Hospital's cut
    whtDeducted: number;    // 5% WHT
    netPayable: number;     // What doctor should receive
    status: 'pending' | 'received' | 'overdue';
    paymentDate?: string;   // When actually paid
    contactNumber?: string; // Hospital accounts department
    notes?: string;
    createdAt?: any;
    updatedAt?: any;
}

export interface GovIncomeConfig {
    basicSalary: number;
    datAllowance: number;   // Disturbance, Availability & Transport
    otherAllowances: number;
    monthlyAPIT: number;    // APIT already deducted
    updatedAt?: any;
}

// ==================== HELPER ====================

function userCol(uid: string, colName: string) {
    return collection(db, 'users', uid, colName);
}

function userDocRef(uid: string, colName: string, docId: string) {
    return doc(db, 'users', uid, colName, docId);
}

// ==================== INCOME CRUD ====================

export async function addIncome(uid: string, entry: Omit<IncomeEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCol(uid, 'income'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateIncome(uid: string, id: string, updates: Partial<IncomeEntry>): Promise<void> {
    await updateDoc(userDocRef(uid, 'income', id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteIncome(uid: string, id: string): Promise<void> {
    await deleteDoc(userDocRef(uid, 'income', id));
}

export function subscribeIncome(uid: string, callback: (entries: IncomeEntry[]) => void): () => void {
    const q = query(userCol(uid, 'income'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || null,
            updatedAt: d.data().updatedAt?.toDate?.() || null,
        })) as IncomeEntry[];
        callback(entries);
    }, (error) => {
        console.error('Income subscription error:', error);
        callback([]);
    });
}

// ==================== EXPENSE CRUD ====================

export async function addExpense(uid: string, entry: Omit<ExpenseEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCol(uid, 'expenses'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateExpense(uid: string, id: string, updates: Partial<ExpenseEntry>): Promise<void> {
    await updateDoc(userDocRef(uid, 'expenses', id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function deleteExpense(uid: string, id: string): Promise<void> {
    await deleteDoc(userDocRef(uid, 'expenses', id));
}

export function subscribeExpenses(uid: string, callback: (entries: ExpenseEntry[]) => void): () => void {
    const q = query(userCol(uid, 'expenses'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || null,
            updatedAt: d.data().updatedAt?.toDate?.() || null,
        })) as ExpenseEntry[];
        callback(entries);
    }, (error) => {
        console.error('Expense subscription error:', error);
        callback([]);
    });
}

// ==================== RECEIPT CRUD ====================

export async function addReceipt(uid: string, entry: Omit<ReceiptEntry, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(userCol(uid, 'receipts'), {
        ...entry,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

export async function deleteReceipt(uid: string, id: string): Promise<void> {
    await deleteDoc(userDocRef(uid, 'receipts', id));
}

export function subscribeReceipts(uid: string, callback: (entries: ReceiptEntry[]) => void): () => void {
    const q = query(userCol(uid, 'receipts'), orderBy('capturedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || null,
        })) as ReceiptEntry[];
        callback(entries);
    }, (error) => {
        console.error('Receipt subscription error:', error);
        callback([]);
    });
}

// ==================== CHANNELING CRUD ====================

export async function addChanneling(uid: string, entry: Omit<ChannelingEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const ref = await addDoc(userCol(uid, 'channeling'), {
        ...entry,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateChanneling(uid: string, id: string, updates: Partial<ChannelingEntry>): Promise<void> {
    await updateDoc(userDocRef(uid, 'channeling', id), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

export async function markChannelingReceived(uid: string, id: string): Promise<void> {
    await updateDoc(userDocRef(uid, 'channeling', id), {
        status: 'received',
        paymentDate: new Date().toISOString().split('T')[0],
        updatedAt: serverTimestamp(),
    });
}

export function subscribeChanneling(uid: string, callback: (entries: ChannelingEntry[]) => void): () => void {
    const q = query(userCol(uid, 'channeling'), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const entries = snapshot.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || null,
            updatedAt: d.data().updatedAt?.toDate?.() || null,
        })) as ChannelingEntry[];
        callback(entries);
    }, (error) => {
        console.error('Channeling subscription error:', error);
        callback([]);
    });
}

// ==================== GOV INCOME CONFIG ====================

export async function saveGovIncomeConfig(uid: string, config: GovIncomeConfig): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'settings', 'govIncome'), {
        ...config,
        updatedAt: serverTimestamp(),
    });
}

export async function getGovIncomeConfig(uid: string): Promise<GovIncomeConfig | null> {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'govIncome'));
    if (snap.exists()) return snap.data() as GovIncomeConfig;
    return null;
}

export function subscribeGovIncomeConfig(uid: string, callback: (config: GovIncomeConfig | null) => void): () => void {
    return onSnapshot(doc(db, 'users', uid, 'settings', 'govIncome'), (snap) => {
        if (snap.exists()) {
            callback(snap.data() as GovIncomeConfig);
        } else {
            callback(null);
        }
    }, (error) => {
        console.error('Gov income config error:', error);
        callback(null);
    });
}

// ==================== AGGREGATE HELPERS ====================

/** Get annual totals for tax calculation */
export async function getAnnualTotals(uid: string, taxYear: string = '2025/26') {
    // Tax year runs Apr-Mar. e.g. 2025/26 = Apr 2025 – Mar 2026
    const [startYear] = taxYear.split('/').map(Number);
    const startDate = `${startYear}-04-01`;
    const endDate = `${startYear + 1}-03-31`;

    const incomeQ = query(
        userCol(uid, 'income'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    );
    const expenseQ = query(
        userCol(uid, 'expenses'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    );

    const [inSnap, exSnap] = await Promise.all([
        getDocs(incomeQ),
        getDocs(expenseQ),
    ]);

    const totalPrivateIncome = inSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);
    const totalWHT = inSnap.docs.reduce((s, d) => s + (d.data().whtDeducted || 0), 0);
    const totalExpenses = exSnap.docs.reduce((s, d) => s + (d.data().amount || 0), 0);

    return { totalPrivateIncome, totalWHT, totalExpenses };
}

/** Get all data for auditor export */
export async function getExportData(uid: string) {
    const [incSnap, expSnap, rcptSnap] = await Promise.all([
        getDocs(query(userCol(uid, 'income'), orderBy('date', 'asc'))),
        getDocs(query(userCol(uid, 'expenses'), orderBy('date', 'asc'))),
        getDocs(query(userCol(uid, 'receipts'), orderBy('capturedAt', 'asc'))),
    ]);

    return {
        income: incSnap.docs.map(d => ({ id: d.id, ...d.data() })) as IncomeEntry[],
        expenses: expSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ExpenseEntry[],
        receipts: rcptSnap.docs.map(d => ({ id: d.id, ...d.data() })) as ReceiptEntry[],
    };
}
