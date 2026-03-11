import Dexie, { type Table } from 'dexie';

// ============================================
// MyTracksy Local-First Database (Dexie.js)
// PDPA Compliant | AES-256 Cloud Backup Ready
// ============================================

export interface LocalTransaction {
  id?: number;
  date: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  description: string;
  paymentMethod?: string;
  hospital?: string;
  taxDeductible?: boolean;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  updatedAt?: number;
  firestoreId?: string; // Maps to cloud document ID
}

export interface ClinicalNote {
  id?: number;
  date: string;
  text: string;
  tags: string[];
  patientId?: string;
  patientName?: string;
  noteType: 'voice' | 'typed' | 'quick';
  audioProcessed?: boolean;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface OfflineAudioRecord {
  id?: number;
  blob: Blob;
  timestamp: number;
  status: 'pending' | 'uploading' | 'uploaded' | 'failed';
  userId: string;
  duration?: number;
  mimeType: string;
  purpose: 'clinical_note' | 'voice_command' | 'receipt_dictation';
  retryCount?: number;
}

export interface WalletTransaction {
  id?: number;
  type: 'topup' | 'spend' | 'auto_reload' | 'refund';
  amount_lkr: number;
  tokens: number;
  package_id?: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  payhere_order_id?: string;
  userId: string;
  createdAt: number;
  sync_status: 'pending' | 'synced' | 'error';
  firestoreId?: string;
}

export interface LocalReceipt {
  id?: number;
  imageBlob?: Blob;
  imageUrl?: string;
  amount: number;
  vendor: string;
  date: string;
  category: string;
  ocrText?: string;
  taxDeductible?: boolean;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

class MyTracksyLocalDB extends Dexie {
  transactions!: Table<LocalTransaction>;
  clinical_notes!: Table<ClinicalNote>;
  offline_audio_queue!: Table<OfflineAudioRecord>;
  wallet_transactions!: Table<WalletTransaction>;
  receipts!: Table<LocalReceipt>;

  constructor() {
    super('MyTracksyLocalDB');
    
    this.version(1).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
    });
  }
}

export const db = new MyTracksyLocalDB();

// Helper: Get pending count for sync indicator
export async function getPendingSyncCount(userId: string): Promise<number> {
  const [txn, notes, audio, wallet, receipts] = await Promise.all([
    db.transactions.where({ sync_status: 'pending', userId }).count(),
    db.clinical_notes.where({ sync_status: 'pending', userId }).count(),
    db.offline_audio_queue.where({ status: 'pending', userId }).count(),
    db.wallet_transactions.where({ sync_status: 'pending', userId }).count(),
    db.receipts.where({ sync_status: 'pending', userId }).count(),
  ]);
  return txn + notes + audio + wallet + receipts;
}

// Helper: Clear all local data for a user (logout)
export async function clearUserLocalData(userId: string): Promise<void> {
  await Promise.all([
    db.transactions.where({ userId }).delete(),
    db.clinical_notes.where({ userId }).delete(),
    db.offline_audio_queue.where({ userId }).delete(),
    db.wallet_transactions.where({ userId }).delete(),
    db.receipts.where({ userId }).delete(),
  ]);
}

export default db;
