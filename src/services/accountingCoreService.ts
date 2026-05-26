/**
 * Universal Accounting Core Service
 *
 * A single backend for ALL profession types (medical, retail, legal, etc.).
 * Uses a unified `transactions` collection + customisable `chart_of_accounts`.
 *
 * Schema (nested under users/{uid}):
 *   chart_of_accounts/{accountId}  — income/expense categories
 *   transactions/{transactionId}   — the core financial ledger
 *   settings/govIncome             — government salary (employment) config
 *   settings/preferences           — app preferences
 *
 * Key rules:
 *   • Money is stored as INTEGER CENTS (Rs. 45,000.00 → 4500000)
 *   • Idempotency keys prevent duplicate entries from email sync
 *   • Status workflow: pending_review → cleared | ignored
 */

import {
    collection, doc, addDoc, updateDoc, deleteDoc, getDocs,
    onSnapshot, query, orderBy, where,
    serverTimestamp, setDoc, getDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getDefaultAccounts } from '../config/defaultChartOfAccounts';

// ════════════════════════════════════════════════════════════════
//  TYPES
// ════════════════════════════════════════════════════════════════

export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending_review' | 'cleared' | 'ignored';
export type TransactionSource = 'manual_entry' | 'email_auto_sync' | 'voice_ai' | 'receipt_scan';
export type AccountType = 'income' | 'expense' | 'asset' | 'liability';

export interface ChartOfAccount {
    id?: string;
    name: string;
    type: AccountType;
    is_tax_deductible: boolean;
    metadata?: Record<string, any>;
    createdAt?: any;
}

export interface UniversalTransaction {
    id?: string;
    date: string;                    // ISO 8601 (YYYY-MM-DD)
    amount_cents: number;            // ALWAYS integer cents
    type: TransactionType;
    status: TransactionStatus;
    source: TransactionSource;
    vendor: string;
    category_id: string;             // → chart_of_accounts doc ID
    category_name?: string;          // Denormalised for quick display
    description: string;
    idempotency_key?: string;        // SHA-256(date + amount + vendor)
    receipt_url?: string;            // Firebase Storage path
    metadata?: Record<string, any>;  // wht_deducted_cents, is_capital_item, etc.
    createdAt?: any;
    updatedAt?: any;
}

export interface LegacyTransactionView {
    id: string;
    date: string;
    amount: number;
    type: TransactionType;
    status?: 'completed' | 'pending' | 'overdue' | 'paid' | 'received';
    category: string;
    description: string;
}

export interface LegacyTransactionInput {
    date: string;
    amount: number;
    type: TransactionType;
    category: string;
    description?: string;
    paymentMethod?: string;
    vendor?: string;
}

export interface GovIncomeConfig {
    basicSalary: number;             // Monthly basic (in LKR, not cents — display value)
    datAllowance: number;
    otherAllowances: number;
    monthlyAPIT: number;
    updatedAt?: any;
}

export interface UserProfile {
    email: string;
    displayName?: string;
    photoURL?: string;
    sync_email_prefix?: string;      // e.g. "user_888"
    app_type: string;                // profession key
    chart_seeded?: boolean;          // true after first seed
}

// ════════════════════════════════════════════════════════════════
//  HELPERS
// ════════════════════════════════════════════════════════════════

function userCol(uid: string, colName: string) {
    return collection(db, 'users', uid, colName);
}

function userDocRef(uid: string, colName: string, docId: string) {
    return doc(db, 'users', uid, colName, docId);
}

/** Convert LKR rupees (float) to integer cents. */
export function toCents(rupees: number): number {
    return Math.round(rupees * 100);
}

/** Convert integer cents back to LKR rupees for display. */
export function fromCents(cents: number): number {
    return cents / 100;
}

/** Format cents amount as "Rs. 45,000.00" */
export function formatLKR(cents: number): string {
    return `Rs. ${fromCents(cents).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
}

/** Generate an idempotency key from date + amount + vendor. */
export async function generateIdempotencyKey(date: string, amountCents: number, vendor: string): Promise<string> {
    const raw = `${date}|${amountCents}|${vendor.toLowerCase().trim()}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(raw);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ════════════════════════════════════════════════════════════════
//  CHART OF ACCOUNTS CRUD
// ════════════════════════════════════════════════════════════════

/** Seed default chart of accounts for a user's profession. Idempotent. */
export async function seedChartOfAccounts(uid: string, profession = 'individual'): Promise<void> {
    // Check if already seeded
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists() && userSnap.data()?.chart_seeded) return;

    const defaults = getDefaultAccounts(profession);
    const batch = writeBatch(db);

    for (const acct of defaults) {
        const ref = doc(collection(db, 'users', uid, 'chart_of_accounts'));
        batch.set(ref, {
            ...acct,
            createdAt: serverTimestamp(),
        });
    }

    // Mark as seeded on user profile
    batch.set(userRef, { chart_seeded: true }, { merge: true });

    await batch.commit();
}

/** Get all chart of accounts entries for a user. */
export async function getChartOfAccounts(uid: string): Promise<ChartOfAccount[]> {
    const snap = await getDocs(query(userCol(uid, 'chart_of_accounts'), orderBy('type'), orderBy('name')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChartOfAccount[];
}

/** Subscribe to chart of accounts in real-time. */
export function subscribeChartOfAccounts(
    uid: string,
    callback: (accounts: ChartOfAccount[]) => void
): () => void {
    const q = query(userCol(uid, 'chart_of_accounts'), orderBy('type'), orderBy('name'));
    return onSnapshot(q, (snap) => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })) as ChartOfAccount[]);
    }, (err) => {
        console.error('Chart of accounts subscription error:', err);
        callback([]);
    });
}

/** Add a custom category. */
export async function addAccount(uid: string, account: Omit<ChartOfAccount, 'id' | 'createdAt'>): Promise<string> {
    const ref = await addDoc(userCol(uid, 'chart_of_accounts'), {
        ...account,
        createdAt: serverTimestamp(),
    });
    return ref.id;
}

/** Delete a custom category. */
export async function deleteAccount(uid: string, accountId: string): Promise<void> {
    await deleteDoc(userDocRef(uid, 'chart_of_accounts', accountId));
}

// ════════════════════════════════════════════════════════════════
//  TRANSACTIONS CRUD
// ════════════════════════════════════════════════════════════════

/** Add a new transaction. Generates idempotency key automatically. */
export async function addTransaction(
    uid: string,
    entry: Omit<UniversalTransaction, 'id' | 'createdAt' | 'updatedAt' | 'idempotency_key'> | LegacyTransactionInput
): Promise<string> {
    const normalized = normalizeTransactionInput(entry);
    const idemKey = await generateIdempotencyKey(normalized.date, normalized.amount_cents, normalized.vendor);

    // Idempotency check — skip if duplicate
    const existing = query(
        userCol(uid, 'transactions'),
        where('idempotency_key', '==', idemKey)
    );
    const existingSnap = await getDocs(existing);
    if (!existingSnap.empty) {
        console.warn('Duplicate transaction detected, skipping:', idemKey);
        return existingSnap.docs[0].id;
    }

    const ref = await addDoc(userCol(uid, 'transactions'), {
        ...normalized,
        idempotency_key: idemKey,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

/** Update a transaction (e.g. change status, edit description). */
export async function updateTransaction(
    uid: string,
    transactionId: string,
    updates: Partial<UniversalTransaction>
): Promise<void> {
    await updateDoc(userDocRef(uid, 'transactions', transactionId), {
        ...updates,
        updatedAt: serverTimestamp(),
    });
}

/** Delete a transaction. */
export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
    await deleteDoc(userDocRef(uid, 'transactions', transactionId));
}

/** Approve: set status to 'cleared'. */
export async function approveTransaction(uid: string, transactionId: string): Promise<void> {
    await updateTransaction(uid, transactionId, { status: 'cleared' });
}

/** Ignore: set status to 'ignored'. */
export async function ignoreTransaction(uid: string, transactionId: string): Promise<void> {
    await updateTransaction(uid, transactionId, { status: 'ignored' });
}

// ════════════════════════════════════════════════════════════════
//  REAL-TIME SUBSCRIPTIONS
// ════════════════════════════════════════════════════════════════

export interface TransactionFilter {
    type?: TransactionType;
    status?: TransactionStatus;
    source?: TransactionSource;
}

function isLegacyTransactionInput(
    entry: Omit<UniversalTransaction, 'id' | 'createdAt' | 'updatedAt' | 'idempotency_key'> | LegacyTransactionInput
): entry is LegacyTransactionInput {
    return 'amount' in entry;
}

function normalizeTransactionInput(
    entry: Omit<UniversalTransaction, 'id' | 'createdAt' | 'updatedAt' | 'idempotency_key'> | LegacyTransactionInput
): Omit<UniversalTransaction, 'id' | 'createdAt' | 'updatedAt' | 'idempotency_key'> {
    if (!isLegacyTransactionInput(entry)) return entry;

    return {
        date: entry.date,
        amount_cents: toCents(entry.amount),
        type: entry.type,
        status: 'cleared',
        source: 'manual_entry',
        vendor: entry.vendor || entry.paymentMethod || entry.category,
        category_id: entry.category,
        category_name: entry.category,
        description: entry.description || entry.category,
        metadata: entry.paymentMethod ? { paymentMethod: entry.paymentMethod } : undefined,
    };
}

function toLegacyTransactionView(transaction: UniversalTransaction): LegacyTransactionView {
    return {
        id: transaction.id || '',
        date: transaction.date,
        amount: fromCents(transaction.amount_cents),
        type: transaction.type,
        status: transaction.status === 'cleared'
            ? (transaction.type === 'income' ? 'paid' : 'completed')
            : 'pending',
        category: transaction.category_name || transaction.category_id,
        description: transaction.description,
    };
}

/**
 * Subscribe to transactions with optional filters.
 * Always ordered by date descending.
 */
export function subscribeTransactions(
    uid: string,
    type: TransactionType,
    callback: (transactions: LegacyTransactionView[]) => void
): () => void;
export function subscribeTransactions(
    uid: string,
    callback: (transactions: UniversalTransaction[]) => void,
    filters?: TransactionFilter
): () => void;
export function subscribeTransactions(
    uid: string,
    typeOrCallback: TransactionType | ((transactions: UniversalTransaction[]) => void),
    filtersOrCallback?: TransactionFilter | ((transactions: LegacyTransactionView[]) => void)
): () => void {
    const legacyType = typeof typeOrCallback === 'string' ? typeOrCallback : null;
    const callback = typeof typeOrCallback === 'function'
        ? typeOrCallback
        : filtersOrCallback as (transactions: LegacyTransactionView[]) => void;
    const filters = legacyType
        ? { type: legacyType, status: 'cleared' as TransactionStatus }
        : filtersOrCallback as TransactionFilter | undefined;

    let q = query(userCol(uid, 'transactions'), orderBy('date', 'desc'));

    // Build filtered query (Firestore allows up to 1 inequality + multiple equality filters)
    if (filters?.type) {
        q = query(userCol(uid, 'transactions'), where('type', '==', filters.type), orderBy('date', 'desc'));
    }
    if (filters?.status) {
        q = query(userCol(uid, 'transactions'), where('status', '==', filters.status), orderBy('date', 'desc'));
    }
    // Combined filter
    if (filters?.type && filters?.status) {
        q = query(
            userCol(uid, 'transactions'),
            where('type', '==', filters.type),
            where('status', '==', filters.status),
            orderBy('date', 'desc')
        );
    }

    return onSnapshot(q, (snap) => {
        const txns = snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            createdAt: d.data().createdAt?.toDate?.() || null,
            updatedAt: d.data().updatedAt?.toDate?.() || null,
        })) as UniversalTransaction[];
        if (legacyType) {
            (callback as (transactions: LegacyTransactionView[]) => void)(txns.map(toLegacyTransactionView));
            return;
        }
        (callback as (transactions: UniversalTransaction[]) => void)(txns);
    }, (err) => {
        console.error('Transaction subscription error:', err);
        callback([]);
    });
}

/** Subscribe only to pending_review transactions (the Inbox). */
export function subscribePendingReview(
    uid: string,
    callback: (transactions: UniversalTransaction[]) => void
): () => void {
    return subscribeTransactions(uid, callback, { status: 'pending_review' });
}

/** Subscribe to cleared income transactions. */
export function subscribeClearedIncome(
    uid: string,
    callback: (transactions: UniversalTransaction[]) => void
): () => void {
    return subscribeTransactions(uid, callback, { type: 'income', status: 'cleared' });
}

/** Subscribe to cleared expense transactions. */
export function subscribeClearedExpenses(
    uid: string,
    callback: (transactions: UniversalTransaction[]) => void
): () => void {
    return subscribeTransactions(uid, callback, { type: 'expense', status: 'cleared' });
}

// ════════════════════════════════════════════════════════════════
//  GOV INCOME CONFIG
// ════════════════════════════════════════════════════════════════

export async function saveGovIncomeConfig(uid: string, config: GovIncomeConfig): Promise<void> {
    await setDoc(doc(db, 'users', uid, 'settings', 'govIncome'), {
        ...config,
        updatedAt: serverTimestamp(),
    });
}

export async function getGovIncomeConfig(uid: string): Promise<GovIncomeConfig | null> {
    const snap = await getDoc(doc(db, 'users', uid, 'settings', 'govIncome'));
    return snap.exists() ? (snap.data() as GovIncomeConfig) : null;
}

export function subscribeGovIncomeConfig(
    uid: string,
    callback: (config: GovIncomeConfig | null) => void
): () => void {
    return onSnapshot(doc(db, 'users', uid, 'settings', 'govIncome'), (snap) => {
        callback(snap.exists() ? (snap.data() as GovIncomeConfig) : null);
    }, (err) => {
        console.error('Gov income config error:', err);
        callback(null);
    });
}

// ════════════════════════════════════════════════════════════════
//  AGGREGATE HELPERS
// ════════════════════════════════════════════════════════════════

/** Get annual totals for tax calculation (tax year: Apr–Mar). */
export async function getAnnualTotals(uid: string, taxYear: string = '2025/26') {
    const [startYear] = taxYear.split('/').map(Number);
    const startDate = `${startYear}-04-01`;
    const endDate = `${startYear + 1}-03-31`;

    const baseCol = userCol(uid, 'transactions');

    const incomeQ = query(
        baseCol,
        where('type', '==', 'income'),
        where('status', '==', 'cleared'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    );
    const expenseQ = query(
        baseCol,
        where('type', '==', 'expense'),
        where('status', '==', 'cleared'),
        where('date', '>=', startDate),
        where('date', '<=', endDate)
    );

    const [inSnap, exSnap] = await Promise.all([getDocs(incomeQ), getDocs(expenseQ)]);

    const totalPrivateIncome_cents = inSnap.docs.reduce(
        (s, d) => s + (d.data().amount_cents || 0), 0
    );
    const totalWHT_cents = inSnap.docs.reduce(
        (s, d) => s + (d.data().metadata?.wht_deducted_cents || 0), 0
    );
    const totalExpenses_cents = exSnap.docs.reduce(
        (s, d) => s + (d.data().amount_cents || 0), 0
    );

    return {
        totalPrivateIncome: fromCents(totalPrivateIncome_cents),
        totalWHT: fromCents(totalWHT_cents),
        totalExpenses: fromCents(totalExpenses_cents),
        // Raw cents for precise calculations
        totalPrivateIncome_cents,
        totalWHT_cents,
        totalExpenses_cents,
    };
}

/** Get all transactions for auditor export. */
export async function getExportData(uid: string) {
    const allQ = query(
        userCol(uid, 'transactions'),
        where('status', '==', 'cleared'),
        orderBy('date', 'asc')
    );
    const snap = await getDocs(allQ);

    const transactions = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
    })) as UniversalTransaction[];

    return {
        income: transactions.filter(t => t.type === 'income'),
        expenses: transactions.filter(t => t.type === 'expense'),
        all: transactions,
    };
}
