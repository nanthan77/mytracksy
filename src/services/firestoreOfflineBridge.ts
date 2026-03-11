/**
 * Firestore Offline Bridge
 *
 * Wraps Firestore with IndexedDB offline fallback.
 * - WRITE: Save to IndexedDB immediately → queue for Firestore
 * - READ:  Read from IndexedDB first → listen to Firestore for updates
 * - SYNC:  On network recovery, flush IndexedDB queue to Firestore
 *
 * Handles: transactions, clinical_notes, schedule, life_admin, audio_queue
 */

const DB_NAME = 'TracksyOfflineBridgeDB';
const DB_VERSION = 2;

interface OfflineDoc {
    id: string;
    collection: string;
    userId: string;
    data: any;
    timestamp: number;
    syncStatus: 'pending' | 'synced' | 'failed';
    retryCount: number;
    lastAttempt?: number;
}

interface AudioQueueItem {
    id: string;
    userId: string;
    blob: ArrayBuffer;
    filename: string;
    mimeType: string;
    timestamp: number;
    uploaded: boolean;
    retryCount: number;
}

type SyncListener = (status: { pending: number; syncing: boolean; lastSync: number | null }) => void;

class FirestoreOfflineBridge {
    private static instance: FirestoreOfflineBridge;
    private db: IDBDatabase | null = null;
    private isOnline = navigator.onLine;
    private isSyncing = false;
    private lastSync: number | null = null;
    private listeners: SyncListener[] = [];

    private readonly STORES = {
        docs: 'offline_docs',
        audio: 'audio_queue',
        meta: 'sync_meta',
    };

    static getInstance(): FirestoreOfflineBridge {
        if (!FirestoreOfflineBridge.instance) {
            FirestoreOfflineBridge.instance = new FirestoreOfflineBridge();
        }
        return FirestoreOfflineBridge.instance;
    }

    private constructor() {
        this.setupNetworkListeners();
        this.initDB();
    }

    // ─── IndexedDB Setup ──────────────────────────────────────────

    private async initDB(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Offline documents store
                if (!db.objectStoreNames.contains(this.STORES.docs)) {
                    const docsStore = db.createObjectStore(this.STORES.docs, { keyPath: 'id' });
                    docsStore.createIndex('collection', 'collection', { unique: false });
                    docsStore.createIndex('userId', 'userId', { unique: false });
                    docsStore.createIndex('syncStatus', 'syncStatus', { unique: false });
                    docsStore.createIndex('collection_userId', ['collection', 'userId'], { unique: false });
                }

                // Audio queue store
                if (!db.objectStoreNames.contains(this.STORES.audio)) {
                    const audioStore = db.createObjectStore(this.STORES.audio, { keyPath: 'id' });
                    audioStore.createIndex('userId', 'userId', { unique: false });
                    audioStore.createIndex('uploaded', 'uploaded', { unique: false });
                }

                // Sync metadata store
                if (!db.objectStoreNames.contains(this.STORES.meta)) {
                    db.createObjectStore(this.STORES.meta, { keyPath: 'key' });
                }
            };

            request.onsuccess = () => {
                this.db = request.result;
                this.loadLastSync();
                resolve();
            };

            request.onerror = () => reject(request.error);
        });
    }

    private async ensureDB(): Promise<IDBDatabase> {
        if (!this.db) await this.initDB();
        return this.db!;
    }

    // ─── Network Listeners ────────────────────────────────────────

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            console.log('[OfflineBridge] Back online — triggering sync');
            this.isOnline = true;
            this.syncAll();
            // Also tell the service worker
            navigator.serviceWorker?.controller?.postMessage({ type: 'SYNC_AUDIO' });
        });

        window.addEventListener('offline', () => {
            console.log('[OfflineBridge] Gone offline');
            this.isOnline = false;
            this.notifyListeners();
        });

        // Listen for service worker sync trigger
        navigator.serviceWorker?.addEventListener('message', (event) => {
            if (event.data?.type === 'TRIGGER_SYNC') {
                this.syncAll();
            }
        });
    }

    // ─── WRITE (Offline-First) ────────────────────────────────────

    async saveDocument(
        collection: string,
        userId: string,
        data: any,
        docId?: string
    ): Promise<string> {
        const db = await this.ensureDB();
        const id = docId || `${collection}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const doc: OfflineDoc = {
            id,
            collection,
            userId,
            data: { ...data, _localTimestamp: Date.now() },
            timestamp: Date.now(),
            syncStatus: 'pending',
            retryCount: 0,
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.docs, 'readwrite');
            tx.objectStore(this.STORES.docs).put(doc);
            tx.oncomplete = () => {
                this.notifyListeners();
                // Try immediate sync if online
                if (this.isOnline) {
                    this.syncDocument(doc).catch(console.error);
                }
                resolve(id);
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    // ─── AUDIO QUEUE (for Voice Vault offline recordings) ─────────

    async queueAudio(
        userId: string,
        audioBlob: Blob,
        filename: string
    ): Promise<string> {
        const db = await this.ensureDB();
        const id = `audio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const arrayBuffer = await audioBlob.arrayBuffer();

        const item: AudioQueueItem = {
            id,
            userId,
            blob: arrayBuffer,
            filename,
            mimeType: audioBlob.type || 'audio/m4a',
            timestamp: Date.now(),
            uploaded: false,
            retryCount: 0,
        };

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.audio, 'readwrite');
            tx.objectStore(this.STORES.audio).put(item);
            tx.oncomplete = () => {
                this.notifyListeners();
                if (this.isOnline) {
                    this.syncAudioQueue(userId).catch(console.error);
                }
                resolve(id);
            };
            tx.onerror = () => reject(tx.error);
        });
    }

    // ─── READ (Offline-First) ─────────────────────────────────────

    async getDocuments(collection: string, userId: string): Promise<any[]> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.docs, 'readonly');
            const index = tx.objectStore(this.STORES.docs).index('collection_userId');
            const request = index.getAll([collection, userId]);

            request.onsuccess = () => {
                const docs = (request.result as OfflineDoc[])
                    .sort((a, b) => b.timestamp - a.timestamp)
                    .map(d => ({ id: d.id, ...d.data, _syncStatus: d.syncStatus }));
                resolve(docs);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getDocument(docId: string): Promise<any | null> {
        const db = await this.ensureDB();

        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.docs, 'readonly');
            const request = tx.objectStore(this.STORES.docs).get(docId);

            request.onsuccess = () => {
                const doc = request.result as OfflineDoc | undefined;
                resolve(doc ? { id: doc.id, ...doc.data, _syncStatus: doc.syncStatus } : null);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // ─── SYNC ENGINE ──────────────────────────────────────────────

    async syncAll(): Promise<void> {
        if (this.isSyncing || !this.isOnline) return;
        this.isSyncing = true;
        this.notifyListeners();

        try {
            // 1. Sync pending documents
            const db = await this.ensureDB();
            const pending = await this.getPendingDocs(db);
            console.log(`[OfflineBridge] Syncing ${pending.length} pending docs`);

            for (const doc of pending) {
                await this.syncDocument(doc);
            }

            // 2. Sync audio queue
            const audioItems = await this.getPendingAudio(db);
            console.log(`[OfflineBridge] Syncing ${audioItems.length} pending audio files`);

            for (const item of audioItems) {
                await this.syncAudioItem(item);
            }

            this.lastSync = Date.now();
            await this.saveLastSync();
        } catch (err) {
            console.error('[OfflineBridge] Sync failed:', err);
        } finally {
            this.isSyncing = false;
            this.notifyListeners();
        }
    }

    private async syncDocument(doc: OfflineDoc): Promise<void> {
        try {
            // Dynamic import to avoid loading Firebase when offline
            const { getFirestore, doc: firestoreDoc, setDoc } = await import('firebase/firestore');
            const { getApp } = await import('firebase/app');

            const db = getFirestore(getApp());
            const docRef = firestoreDoc(db, `users/${doc.userId}/${doc.collection}/${doc.id}`);
            await setDoc(docRef, doc.data, { merge: true });

            // Mark as synced in IndexedDB
            await this.updateDocSyncStatus(doc.id, 'synced');
            console.log(`[OfflineBridge] Synced doc: ${doc.collection}/${doc.id}`);
        } catch (err) {
            console.error(`[OfflineBridge] Failed to sync doc ${doc.id}:`, err);
            await this.updateDocSyncStatus(doc.id, 'failed', (doc.retryCount || 0) + 1);
        }
    }

    private async syncAudioItem(item: AudioQueueItem): Promise<void> {
        try {
            const { getStorage, ref, uploadBytes } = await import('firebase/storage');
            const { getApp } = await import('firebase/app');

            const storage = getStorage(getApp());
            const storagePath = `users/${item.userId}/pending_audio/${item.id}.m4a`;
            const storageRef = ref(storage, storagePath);

            const blob = new Blob([item.blob], { type: item.mimeType });
            await uploadBytes(storageRef, blob);

            // Mark as uploaded
            const db = await this.ensureDB();
            const tx = db.transaction(this.STORES.audio, 'readwrite');
            const existing = await new Promise<AudioQueueItem>((resolve) => {
                const req = tx.objectStore(this.STORES.audio).get(item.id);
                req.onsuccess = () => resolve(req.result);
            });
            if (existing) {
                existing.uploaded = true;
                tx.objectStore(this.STORES.audio).put(existing);
            }

            console.log(`[OfflineBridge] Uploaded audio: ${item.filename}`);
        } catch (err) {
            console.error(`[OfflineBridge] Failed to upload audio ${item.id}:`, err);
        }
    }

    private async syncAudioQueue(userId: string): Promise<void> {
        const db = await this.ensureDB();
        const items = await this.getPendingAudio(db, userId);
        for (const item of items) {
            await this.syncAudioItem(item);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────

    private getPendingDocs(db: IDBDatabase): Promise<OfflineDoc[]> {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.docs, 'readonly');
            const index = tx.objectStore(this.STORES.docs).index('syncStatus');
            const request = index.getAll('pending');
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    private getPendingAudio(db: IDBDatabase, userId?: string): Promise<AudioQueueItem[]> {
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.audio, 'readonly');
            const index = tx.objectStore(this.STORES.audio).index('uploaded');
            const request = index.getAll(false);
            request.onsuccess = () => {
                let items = request.result as AudioQueueItem[];
                if (userId) items = items.filter(i => i.userId === userId);
                resolve(items);
            };
            request.onerror = () => reject(request.error);
        });
    }

    private async updateDocSyncStatus(docId: string, status: OfflineDoc['syncStatus'], retryCount?: number): Promise<void> {
        const db = await this.ensureDB();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(this.STORES.docs, 'readwrite');
            const store = tx.objectStore(this.STORES.docs);
            const getReq = store.get(docId);
            getReq.onsuccess = () => {
                const doc = getReq.result as OfflineDoc;
                if (doc) {
                    doc.syncStatus = status;
                    if (retryCount !== undefined) doc.retryCount = retryCount;
                    doc.lastAttempt = Date.now();
                    store.put(doc);
                }
            };
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        });
    }

    private async loadLastSync(): Promise<void> {
        try {
            const db = await this.ensureDB();
            const tx = db.transaction(this.STORES.meta, 'readonly');
            const request = tx.objectStore(this.STORES.meta).get('lastSync');
            request.onsuccess = () => {
                if (request.result) {
                    this.lastSync = request.result.value;
                }
            };
        } catch { /* ignore */ }
    }

    private async saveLastSync(): Promise<void> {
        try {
            const db = await this.ensureDB();
            const tx = db.transaction(this.STORES.meta, 'readwrite');
            tx.objectStore(this.STORES.meta).put({ key: 'lastSync', value: this.lastSync });
        } catch { /* ignore */ }
    }

    // ─── Status ───────────────────────────────────────────────────

    async getPendingCount(): Promise<number> {
        try {
            const db = await this.ensureDB();
            const docs = await this.getPendingDocs(db);
            const audio = await this.getPendingAudio(db);
            return docs.length + audio.length;
        } catch { return 0; }
    }

    getStatus(): { isOnline: boolean; isSyncing: boolean; lastSync: number | null } {
        return { isOnline: this.isOnline, isSyncing: this.isSyncing, lastSync: this.lastSync };
    }

    addListener(listener: SyncListener): void {
        this.listeners.push(listener);
    }

    removeListener(listener: SyncListener): void {
        this.listeners = this.listeners.filter(l => l !== listener);
    }

    private async notifyListeners(): Promise<void> {
        const pending = await this.getPendingCount();
        const status = { pending, syncing: this.isSyncing, lastSync: this.lastSync };
        this.listeners.forEach(l => l(status));
    }
}

export const offlineBridge = FirestoreOfflineBridge.getInstance();
export default FirestoreOfflineBridge;
