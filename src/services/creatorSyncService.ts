/**
 * Creator Sync Service (CreatorTracksy)
 *
 * Syncs Dexie.js local tables (creator_brand_deals, creator_gear_items,
 * creator_revenue, creator_expenses) to Firestore under users/{uid}/.
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

type CreatorTable = 'creator_brand_deals' | 'creator_gear_items' | 'creator_revenue' | 'creator_expenses';

function userCol(uid: string, col: string) {
  return collection(firestoreDb, 'users', uid, col);
}

function userDocRef(uid: string, col: string, docId: string) {
  return doc(firestoreDb, 'users', uid, col, docId);
}

// ────────────────────────────────────────────────────────────────
// PUSH: Flush all pending Dexie records to Firestore
// ────────────────────────────────────────────────────────────────
async function pushTable(uid: string, table: CreatorTable) {
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
    console.error(`[CreatorSync] push ${table} failed`, err);
  }
}

export async function syncCreatorToFirestore(uid: string) {
  const tables: CreatorTable[] = ['creator_brand_deals', 'creator_gear_items', 'creator_revenue', 'creator_expenses'];
  await Promise.all(tables.map(t => pushTable(uid, t)));
}

// ────────────────────────────────────────────────────────────────
// SUBSCRIBE: Listen for Firestore changes and merge into Dexie
// ────────────────────────────────────────────────────────────────
function subscribeTable(uid: string, table: CreatorTable): () => void {
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
  }, (err) => console.error(`[CreatorSync] subscribe ${table} error`, err));
}

export function subscribeCreatorFromFirestore(uid: string): () => void {
  const tables: CreatorTable[] = ['creator_brand_deals', 'creator_gear_items', 'creator_revenue', 'creator_expenses'];
  const unsubs = tables.map(t => subscribeTable(uid, t));
  return () => unsubs.forEach(fn => fn());
}

// ────────────────────────────────────────────────────────────────
// LIFECYCLE: Auto-sync on online/offline events
// ────────────────────────────────────────────────────────────────
let cleanupFn: (() => void) | null = null;

export function startCreatorAutoSync(uid: string): () => void {
  if (cleanupFn) cleanupFn();

  const unsubFirestore = subscribeCreatorFromFirestore(uid);

  const handleOnline = () => syncCreatorToFirestore(uid);
  window.addEventListener('online', handleOnline);

  if (navigator.onLine) syncCreatorToFirestore(uid);

  cleanupFn = () => {
    unsubFirestore();
    window.removeEventListener('online', handleOnline);
    cleanupFn = null;
  };

  return cleanupFn;
}

export function stopCreatorAutoSync() {
  if (cleanupFn) cleanupFn();
}
