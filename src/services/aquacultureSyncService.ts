/**
 * Aquaculture Sync Service (AquaTracksy)
 *
 * Syncs Dexie.js local tables (aqua_ponds, aqua_feed_logs, aqua_water_logs,
 * aqua_harvest_sales, aqua_expenses) to Firestore under users/{uid}/.
 *
 * Strategy:
 *   WRITE → Dexie first (offline-first), then push to Firestore
 *   READ  → Dexie live query (instant), Firestore listener backfills
 *   SYNC  → On online event, flush all pending records to Firestore
 */

import {
  collection, doc, setDoc, onSnapshot, query, orderBy,
  serverTimestamp, writeBatch,
} from 'firebase/firestore';
import { db as firestoreDb } from '../config/firebase';
import db from '../lib/db';

type AquaTable = 'aqua_ponds' | 'aqua_feed_logs' | 'aqua_water_logs' | 'aqua_harvest_sales' | 'aqua_expenses';

function userCol(uid: string, col: string) {
  return collection(firestoreDb, 'users', uid, col);
}

function userDocRef(uid: string, col: string, docId: string) {
  return doc(firestoreDb, 'users', uid, col, docId);
}

// ────────────────────────────────────────────────────────────────
// PUSH: Flush all pending Dexie records to Firestore
// ────────────────────────────────────────────────────────────────
async function pushTable(uid: string, table: AquaTable) {
  const dexieTable = db.table(table);
  const pending = await dexieTable.where({ sync_status: 'pending', userId: uid }).toArray();
  if (!pending.length) return;

  const batch = writeBatch(firestoreDb);
  for (const record of pending) {
    const fsId = record.firestoreId || doc(userCol(uid, table)).id;
    const { id: _localId, sync_status: _ss, firestoreId: _fid, ...payload } = record;
    batch.set(userDocRef(uid, table, fsId), { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    await dexieTable.update(record.id!, { sync_status: 'synced', firestoreId: fsId });
  }

  try {
    await batch.commit();
  } catch (err) {
    for (const record of pending) {
      await dexieTable.update(record.id!, { sync_status: 'pending' }).catch(() => {});
    }
    console.error(`[AquaSync] push ${table} failed`, err);
  }
}

export async function syncAquacultureToFirestore(uid: string) {
  const tables: AquaTable[] = ['aqua_ponds', 'aqua_feed_logs', 'aqua_water_logs', 'aqua_harvest_sales', 'aqua_expenses'];
  await Promise.all(tables.map(t => pushTable(uid, t)));
}

// ────────────────────────────────────────────────────────────────
// SUBSCRIBE: Listen for Firestore changes and merge into Dexie
// ────────────────────────────────────────────────────────────────
function subscribeTable(uid: string, table: AquaTable): () => void {
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

      const existing = await dexieTable.where({ firestoreId: fsId, userId: uid }).first();
      if (existing) {
        if (existing.sync_status === 'pending') continue;
        await dexieTable.update(existing.id!, { ...data, sync_status: 'synced', firestoreId: fsId });
      } else {
        await dexieTable.add({ ...data, sync_status: 'synced', firestoreId: fsId, userId: uid } as any);
      }
    }
  }, (err) => console.error(`[AquaSync] subscribe ${table} error`, err));
}

export function subscribeAquacultureFromFirestore(uid: string): () => void {
  const tables: AquaTable[] = ['aqua_ponds', 'aqua_feed_logs', 'aqua_water_logs', 'aqua_harvest_sales', 'aqua_expenses'];
  const unsubs = tables.map(t => subscribeTable(uid, t));
  return () => unsubs.forEach(fn => fn());
}

// ────────────────────────────────────────────────────────────────
// LIFECYCLE: Auto-sync on online/offline events
// ────────────────────────────────────────────────────────────────
let cleanupFn: (() => void) | null = null;

export function startAquacultureAutoSync(uid: string): () => void {
  if (cleanupFn) cleanupFn();

  const unsubFirestore = subscribeAquacultureFromFirestore(uid);
  const handleOnline = () => syncAquacultureToFirestore(uid);
  window.addEventListener('online', handleOnline);

  if (navigator.onLine) syncAquacultureToFirestore(uid);

  cleanupFn = () => {
    unsubFirestore();
    window.removeEventListener('online', handleOnline);
    cleanupFn = null;
  };

  return cleanupFn;
}

export function stopAquacultureAutoSync() {
  if (cleanupFn) cleanupFn();
}
