/**
 * Legal Sync Service
 *
 * Syncs Dexie.js local tables (court_diary, trust_transactions, case_records)
 * to Firestore under users/{uid}/.
 *
 * Strategy:
 *   WRITE → Dexie first (offline-first), then push to Firestore
 *   READ  → Dexie live query (instant), Firestore listener backfills
 *   SYNC  → On online event, flush all pending records to Firestore
 */

import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db as firestoreDb } from '../config/firebase';
import db, { CourtDiaryEntry, TrustTransaction, CaseRecord } from '../lib/db';

type LegalTable = 'court_diary' | 'trust_transactions' | 'case_records';

function userCol(uid: string, col: string) {
  return collection(firestoreDb, 'users', uid, col);
}

function userDocRef(uid: string, col: string, docId: string) {
  return doc(firestoreDb, 'users', uid, col, docId);
}

// ────────────────────────────────────────────────────────────────
// PUSH: Dexie → Firestore (for pending records)
// ────────────────────────────────────────────────────────────────

async function pushPendingTable<T extends { id?: number; sync_status: string; userId: string; firestoreId?: string }>(
  table: LegalTable,
  uid: string,
) {
  const dexieTable = db[table] as any;
  const pending: T[] = await dexieTable
    .where({ sync_status: 'pending', userId: uid })
    .toArray();

  if (pending.length === 0) return;

  const batch = writeBatch(firestoreDb);
  const updates: { localId: number; firestoreId: string }[] = [];

  for (const record of pending) {
    const localId = record.id!;
    const firestoreId = record.firestoreId || `${table}_${localId}_${Date.now()}`;
    const ref = userDocRef(uid, table, firestoreId);

    // Strip local-only fields before sending to Firestore
    const { id, sync_status, firestoreId: _fid, ...data } = record as any;
    batch.set(ref, { ...data, updatedAt: serverTimestamp() }, { merge: true });
    updates.push({ localId, firestoreId });
  }

  await batch.commit();

  // Mark as synced in Dexie
  await db.transaction('rw', dexieTable, async () => {
    for (const { localId, firestoreId } of updates) {
      await dexieTable.update(localId, { sync_status: 'synced', firestoreId });
    }
  });

  console.log(`[LegalSync] Pushed ${updates.length} ${table} records to Firestore`);
}

/** Push all pending legal records to Firestore. */
export async function syncLegalToFirestore(uid: string): Promise<void> {
  try {
    await Promise.all([
      pushPendingTable('court_diary', uid),
      pushPendingTable('trust_transactions', uid),
      pushPendingTable('case_records', uid),
    ]);
  } catch (err) {
    console.error('[LegalSync] Sync failed:', err);
  }
}

// ────────────────────────────────────────────────────────────────
// PULL: Firestore → Dexie (real-time listener for cloud changes)
// ────────────────────────────────────────────────────────────────

function subscribeFirestoreTable<T>(
  uid: string,
  table: LegalTable,
  mapDoc: (data: any) => Omit<T, 'id'>,
): () => void {
  const q = query(userCol(uid, table));

  return onSnapshot(q, async (snap) => {
    const dexieTable = db[table] as any;

    for (const change of snap.docChanges()) {
      const firestoreId = change.doc.id;
      const data = change.doc.data();

      if (change.type === 'added' || change.type === 'modified') {
        // Check if this record already exists locally
        const existing = await dexieTable
          .where({ firestoreId, userId: uid })
          .first();

        if (existing) {
          // Only update if the cloud version is newer (avoid overwriting pending local changes)
          if (existing.sync_status === 'synced') {
            await dexieTable.update(existing.id, {
              ...mapDoc(data),
              sync_status: 'synced',
              firestoreId,
            });
          }
        } else {
          // New record from cloud — insert
          await dexieTable.add({
            ...mapDoc(data),
            sync_status: 'synced',
            firestoreId,
            userId: uid,
          });
        }
      } else if (change.type === 'removed') {
        const existing = await dexieTable
          .where({ firestoreId, userId: uid })
          .first();
        if (existing) {
          await dexieTable.delete(existing.id);
        }
      }
    }
  }, (err) => {
    console.error(`[LegalSync] Firestore listener error for ${table}:`, err);
  });
}

/** Subscribe to Firestore changes and merge into Dexie. Returns unsubscribe function. */
export function subscribeLegalFromFirestore(uid: string): () => void {
  const unsub1 = subscribeFirestoreTable<CourtDiaryEntry>(uid, 'court_diary', (data) => ({
    date: data.date || '',
    caseId: data.caseId || '',
    caseTitle: data.caseTitle || '',
    court: data.court || '',
    courtNo: data.courtNo || '',
    time: data.time || '09:00',
    judge: data.judge || '',
    hearingType: data.hearingType || 'mention',
    notes: data.notes || '',
    status: data.status || 'confirmed',
    courtLocation: data.courtLocation || 'hulftsdorp',
    sync_status: 'synced' as const,
    userId: uid,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
  }));

  const unsub2 = subscribeFirestoreTable<TrustTransaction>(uid, 'trust_transactions', (data) => ({
    date: data.date || '',
    clientId: data.clientId || '',
    clientName: data.clientName || '',
    type: data.type || 'appearance_fee',
    amount: data.amount || 0,
    description: data.description || '',
    category: data.category || '',
    account: data.account || 'trust',
    caseId: data.caseId || '',
    sync_status: 'synced' as const,
    userId: uid,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
  }));

  const unsub3 = subscribeFirestoreTable<CaseRecord>(uid, 'case_records', (data) => ({
    clientName: data.clientName || '',
    clientPhone: data.clientPhone || '',
    clientEmail: data.clientEmail || '',
    caseTitle: data.caseTitle || '',
    caseNumber: data.caseNumber || '',
    caseType: data.caseType || 'civil',
    court: data.court || '',
    judge: data.judge || '',
    status: data.status || 'active',
    retainerBalance: data.retainerBalance || 0,
    totalBilled: data.totalBilled || 0,
    totalPaid: data.totalPaid || 0,
    sync_status: 'synced' as const,
    userId: uid,
    createdAt: data.createdAt?.toMillis?.() || Date.now(),
  }));

  return () => {
    unsub1();
    unsub2();
    unsub3();
  };
}

// ────────────────────────────────────────────────────────────────
// AUTO-SYNC: Register online/offline listeners
// ────────────────────────────────────────────────────────────────

let autoSyncCleanup: (() => void) | null = null;

export function startLegalAutoSync(uid: string): () => void {
  // Initial push
  syncLegalToFirestore(uid).catch(console.error);

  // Listen for Firestore changes
  const unsubFirestore = subscribeLegalFromFirestore(uid);

  // Re-sync when coming back online
  const handleOnline = () => {
    console.log('[LegalSync] Back online — syncing legal data');
    syncLegalToFirestore(uid).catch(console.error);
  };
  window.addEventListener('online', handleOnline);

  const cleanup = () => {
    unsubFirestore();
    window.removeEventListener('online', handleOnline);
  };

  autoSyncCleanup = cleanup;
  return cleanup;
}

export function stopLegalAutoSync(): void {
  autoSyncCleanup?.();
  autoSyncCleanup = null;
}
