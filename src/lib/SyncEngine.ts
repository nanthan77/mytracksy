import { db, type LocalTransaction, type ClinicalNote, type LocalReceipt, type WalletTransaction } from './db';
import { getFirestore, collection, writeBatch, doc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================
// MyTracksy Smart Sync Engine
// Local-First + Zero Retention Cloud Backup
// ============================================

type SyncStatus = 'idle' | 'syncing' | 'error' | 'offline';

interface SyncResult {
  success: boolean;
  synced: number;
  errors: number;
  timestamp: number;
}

class SyncEngine {
  private status: SyncStatus = 'idle';
  private listeners: Set<(status: SyncStatus) => void> = new Set();
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly MAX_BATCH_SIZE = 450; // Firestore batch limit is 500

  constructor() {
    // Auto-sync when network comes back
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncEngine] Network restored — triggering sync');
        this.pushPendingDataToCloud();
      });

      // Periodic sync every 5 minutes when online
      setInterval(() => {
        if (navigator.onLine && this.status === 'idle') {
          this.pushPendingDataToCloud();
        }
      }, 5 * 60 * 1000);
    }
  }

  // Subscribe to sync status changes
  onStatusChange(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: SyncStatus) {
    this.status = status;
    this.listeners.forEach(fn => fn(status));
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  // =============================================
  // PUSH: Local → Cloud (Background Sync)
  // =============================================
  async pushPendingDataToCloud(): Promise<SyncResult> {
    if (!navigator.onLine) {
      this.setStatus('offline');
      return { success: false, synced: 0, errors: 0, timestamp: Date.now() };
    }

    if (this.status === 'syncing') {
      return { success: false, synced: 0, errors: 0, timestamp: Date.now() };
    }

    this.setStatus('syncing');
    let totalSynced = 0;
    let totalErrors = 0;

    try {
      const firestore = getFirestore();

      // 1. Sync Transactions
      const pendingTxns = await db.transactions.where('sync_status').equals('pending').toArray();
      if (pendingTxns.length > 0) {
        const result = await this.syncCollection(firestore, 'transactions', pendingTxns, 'transactions');
        totalSynced += result.synced;
        totalErrors += result.errors;
      }

      // 2. Sync Clinical Notes
      const pendingNotes = await db.clinical_notes.where('sync_status').equals('pending').toArray();
      if (pendingNotes.length > 0) {
        const result = await this.syncCollection(firestore, 'clinical_notes', pendingNotes, 'clinical_notes');
        totalSynced += result.synced;
        totalErrors += result.errors;
      }

      // 3. Sync Wallet Transactions
      const pendingWallet = await db.wallet_transactions.where('sync_status').equals('pending').toArray();
      if (pendingWallet.length > 0) {
        const result = await this.syncCollection(firestore, 'wallet_transactions', pendingWallet, 'wallet_transactions');
        totalSynced += result.synced;
        totalErrors += result.errors;
      }

      // 4. Sync Receipts (with image upload)
      const pendingReceipts = await db.receipts.where('sync_status').equals('pending').toArray();
      if (pendingReceipts.length > 0) {
        const result = await this.syncReceiptsWithImages(firestore, pendingReceipts);
        totalSynced += result.synced;
        totalErrors += result.errors;
      }

      // 5. Upload pending audio blobs then DELETE local copies
      const pendingAudio = await db.offline_audio_queue.where('status').equals('pending').toArray();
      if (pendingAudio.length > 0) {
        const result = await this.syncAudioBlobs(pendingAudio);
        totalSynced += result.synced;
        totalErrors += result.errors;
      }

      this.setStatus('idle');
      return { success: totalErrors === 0, synced: totalSynced, errors: totalErrors, timestamp: Date.now() };
    } catch (err) {
      console.error('[SyncEngine] Push failed:', err);
      this.setStatus('error');
      // Retry in 30 seconds
      if (this.retryTimeout) clearTimeout(this.retryTimeout);
      this.retryTimeout = setTimeout(() => this.pushPendingDataToCloud(), 30_000);
      return { success: false, synced: totalSynced, errors: totalErrors + 1, timestamp: Date.now() };
    }
  }

  private async syncCollection(
    firestore: ReturnType<typeof getFirestore>,
    collectionName: string,
    items: (LocalTransaction | ClinicalNote | WalletTransaction)[],
    tableName: 'transactions' | 'clinical_notes' | 'wallet_transactions'
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;

    // Process in batches of MAX_BATCH_SIZE
    for (let i = 0; i < items.length; i += this.MAX_BATCH_SIZE) {
      const chunk = items.slice(i, i + this.MAX_BATCH_SIZE);
      const batch = writeBatch(firestore);

      for (const item of chunk) {
        const userId = item.userId;
        const docRef = item.firestoreId
          ? doc(firestore, `users/${userId}/${collectionName}`, item.firestoreId)
          : doc(collection(firestore, `users/${userId}/${collectionName}`));
        
        // Strip local-only fields before sending to cloud
        const { id, sync_status, ...cloudData } = item as any;
        batch.set(docRef, { ...cloudData, firestoreId: docRef.id, updatedAt: Date.now() }, { merge: true });
      }

      try {
        await batch.commit();
        // Mark local records as synced
        for (const item of chunk) {
          if (item.id !== undefined) {
            await db[tableName].update(item.id, { sync_status: 'synced' } as any);
          }
        }
        synced += chunk.length;
      } catch (err) {
        console.error(`[SyncEngine] Batch commit failed for ${collectionName}:`, err);
        for (const item of chunk) {
          if (item.id !== undefined) {
            await db[tableName].update(item.id, { sync_status: 'error' } as any);
          }
        }
        errors += chunk.length;
      }
    }

    return { synced, errors };
  }

  private async syncReceiptsWithImages(
    firestore: ReturnType<typeof getFirestore>,
    receipts: LocalReceipt[]
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;
    const storage = getStorage();

    for (const receipt of receipts) {
      try {
        let imageUrl = receipt.imageUrl;

        // Upload image blob to Cloud Storage if exists
        if (receipt.imageBlob) {
          const storageRef = ref(storage, `users/${receipt.userId}/receipts/${Date.now()}_receipt.jpg`);
          await uploadBytes(storageRef, receipt.imageBlob);
          imageUrl = await getDownloadURL(storageRef);
        }

        // Write to Firestore
        const docRef = receipt.firestoreId
          ? doc(firestore, `users/${receipt.userId}/receipts`, receipt.firestoreId)
          : doc(collection(firestore, `users/${receipt.userId}/receipts`));

        const { id, sync_status, imageBlob, ...cloudData } = receipt;
        await writeBatch(firestore).set(docRef, { ...cloudData, imageUrl, firestoreId: docRef.id, updatedAt: Date.now() }).commit();

        // Mark synced & remove blob to free storage
        if (receipt.id !== undefined) {
          await db.receipts.update(receipt.id, { sync_status: 'synced', imageUrl, imageBlob: undefined } as any);
        }
        synced++;
      } catch (err) {
        console.error('[SyncEngine] Receipt sync failed:', err);
        if (receipt.id !== undefined) {
          await db.receipts.update(receipt.id, { sync_status: 'error' });
        }
        errors++;
      }
    }

    return { synced, errors };
  }

  private async syncAudioBlobs(
    audioRecords: import('./db').OfflineAudioRecord[]
  ): Promise<{ synced: number; errors: number }> {
    let synced = 0;
    let errors = 0;
    const storage = getStorage();

    for (const audio of audioRecords) {
      try {
        // Mark as uploading
        if (audio.id !== undefined) {
          await db.offline_audio_queue.update(audio.id, { status: 'uploading' });
        }

        const storageRef = ref(storage, `users/${audio.userId}/audio/${audio.timestamp}_${audio.purpose}.${audio.mimeType.split('/')[1] || 'webm'}`);
        await uploadBytes(storageRef, audio.blob);

        // ZERO RETENTION: Delete local blob immediately after successful upload
        if (audio.id !== undefined) {
          await db.offline_audio_queue.delete(audio.id);
        }
        synced++;
        console.log(`[SyncEngine] Audio uploaded & local blob destroyed (Zero Retention)`);
      } catch (err) {
        console.error('[SyncEngine] Audio upload failed:', err);
        if (audio.id !== undefined) {
          const retryCount = (audio.retryCount || 0) + 1;
          if (retryCount >= 5) {
            await db.offline_audio_queue.update(audio.id, { status: 'failed', retryCount });
          } else {
            await db.offline_audio_queue.update(audio.id, { status: 'pending', retryCount });
          }
        }
        errors++;
      }
    }

    return { synced, errors };
  }

  // =============================================
  // PULL: Cloud → Local (Cache Recovery)
  // =============================================
  async restoreLocalFromCloud(userId: string): Promise<void> {
    if (!navigator.onLine) {
      console.warn('[SyncEngine] Cannot restore — offline');
      return;
    }

    this.setStatus('syncing');
    const firestore = getFirestore();

    try {
      // Check if local DB already has data for this user
      const localTxnCount = await db.transactions.where({ userId }).count();
      
      if (localTxnCount === 0) {
        console.log('[SyncEngine] Empty local DB detected — restoring from cloud...');

        // Restore transactions (last 6 months)
        const sixMonthsAgo = Date.now() - (180 * 24 * 60 * 60 * 1000);
        const txnSnap = await getDocs(
          query(collection(firestore, `users/${userId}/transactions`), where('createdAt', '>=', sixMonthsAgo), orderBy('createdAt', 'desc'), limit(1000))
        );
        if (!txnSnap.empty) {
          const txns = txnSnap.docs.map(d => ({ ...d.data(), firestoreId: d.id, sync_status: 'synced' as const, userId }));
          await db.transactions.bulkPut(txns as any[]);
          console.log(`[SyncEngine] Restored ${txns.length} transactions`);
        }

        // Restore clinical notes (last 3 months)
        const threeMonthsAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        const notesSnap = await getDocs(
          query(collection(firestore, `users/${userId}/clinical_notes`), where('createdAt', '>=', threeMonthsAgo), orderBy('createdAt', 'desc'), limit(500))
        );
        if (!notesSnap.empty) {
          const notes = notesSnap.docs.map(d => ({ ...d.data(), firestoreId: d.id, sync_status: 'synced' as const, userId }));
          await db.clinical_notes.bulkPut(notes as any[]);
          console.log(`[SyncEngine] Restored ${notes.length} clinical notes`);
        }

        // Restore wallet transactions (all time)
        const walletSnap = await getDocs(
          query(collection(firestore, `users/${userId}/wallet_transactions`), orderBy('createdAt', 'desc'), limit(500))
        );
        if (!walletSnap.empty) {
          const wallet = walletSnap.docs.map(d => ({ ...d.data(), firestoreId: d.id, sync_status: 'synced' as const, userId }));
          await db.wallet_transactions.bulkPut(wallet as any[]);
          console.log(`[SyncEngine] Restored ${wallet.length} wallet transactions`);
        }
      }

      this.setStatus('idle');
    } catch (err) {
      console.error('[SyncEngine] Restore failed:', err);
      this.setStatus('error');
    }
  }
}

// Singleton export
export const syncEngine = new SyncEngine();
export default syncEngine;
