/**
 * Engineering Sync Service (EngiTracksy)
 *
 * Syncs Dexie.js local tables (engineering_projects, boq_items, site_inspections,
 * baas_ledger, retention_records) to Firestore under users/{uid}/.
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
import db, {
  EngineeringProject, BOQItem, SiteInspection, BaasLedgerEntry, RetentionRecord,
} from '../lib/db';

type EngTable = 'engineering_projects' | 'boq_items' | 'site_inspections' | 'baas_ledger' | 'retention_records';

function userCol(uid: string, col: string) {
  return collection(firestoreDb, 'users', uid, col);
}

function userDocRef(uid: string, col: string, docId: string) {
  return doc(firestoreDb, 'users', uid, col, docId);
}

// ────────────────────────────────────────────────────────────────
// PUSH: Flush all pending Dexie records to Firestore
// ────────────────────────────────────────────────────────────────
async function pushTable(uid: string, table: EngTable) {
  const dexieTable = db.table(table);
  const pending = await dexieTable.where({ sync_status: 'pending', userId: uid }).toArray();
  if (!pending.length) return;

  const batch = writeBatch(firestoreDb);
  for (const record of pending) {
    const fsId = record.firestoreId || doc(userCol(uid, table)).id;
    const { id: _localId, sync_status: _ss, firestoreId: _fid, ...payload } = record;
    batch.set(userDocRef(uid, table, fsId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    // Optimistically mark synced before commit
    await dexieTable.update(record.id!, { sync_status: 'synced', firestoreId: fsId });
  }

  try {
    await batch.commit();
  } catch (err) {
    // Rollback sync_status on failure
    for (const record of pending) {
      await dexieTable.update(record.id!, { sync_status: 'pending' }).catch(() => {});
    }
    console.error(`[EngSync] push ${table} failed`, err);
  }
}

export async function syncEngineeringToFirestore(uid: string) {
  const tables: EngTable[] = ['engineering_projects', 'boq_items', 'site_inspections', 'baas_ledger', 'retention_records'];
  await Promise.all(tables.map(t => pushTable(uid, t)));
}

// ────────────────────────────────────────────────────────────────
// SUBSCRIBE: Listen for Firestore changes and merge into Dexie
// ────────────────────────────────────────────────────────────────
function subscribeTable(uid: string, table: EngTable): () => void {
  const q = query(userCol(uid, table), orderBy('createdAt', 'desc'));
  return onSnapshot(q, async (snap) => {
    const dexieTable = db.table(table);
    for (const change of snap.docChanges()) {
      const data = change.doc.data();
      const fsId = change.doc.id;

      if (change.type === 'removed') {
        const existing = await dexieTable.where({ firestoreId: fsId, userId: uid }).first();
        if (existing) await dexieTable.delete(existing.id!);
        continue;
      }

      // add or modify
      const existing = await dexieTable.where({ firestoreId: fsId, userId: uid }).first();
      if (existing) {
        if (existing.sync_status === 'pending') continue; // local pending takes priority
        await dexieTable.update(existing.id!, { ...data, sync_status: 'synced', firestoreId: fsId });
      } else {
        await dexieTable.add({ ...data, sync_status: 'synced', firestoreId: fsId, userId: uid } as any);
      }
    }
  }, (err) => console.error(`[EngSync] subscribe ${table} error`, err));
}

export function subscribeEngineeringFromFirestore(uid: string): () => void {
  const tables: EngTable[] = ['engineering_projects', 'boq_items', 'site_inspections', 'baas_ledger', 'retention_records'];
  const unsubs = tables.map(t => subscribeTable(uid, t));
  return () => unsubs.forEach(fn => fn());
}

// ────────────────────────────────────────────────────────────────
// LIFECYCLE: Auto-sync on online/offline events
// ────────────────────────────────────────────────────────────────
let cleanupFn: (() => void) | null = null;

export function startEngineeringAutoSync(uid: string): () => void {
  if (cleanupFn) cleanupFn(); // prevent double-start

  const unsubFirestore = subscribeEngineeringFromFirestore(uid);

  const handleOnline = () => syncEngineeringToFirestore(uid);
  window.addEventListener('online', handleOnline);

  // Initial push if already online
  if (navigator.onLine) syncEngineeringToFirestore(uid);

  cleanupFn = () => {
    unsubFirestore();
    window.removeEventListener('online', handleOnline);
    cleanupFn = null;
  };

  return cleanupFn;
}

export function stopEngineeringAutoSync() {
  if (cleanupFn) cleanupFn();
}
