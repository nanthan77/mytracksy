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

export interface CourtDiaryEntry {
  id?: number;
  date: string;
  caseId: string;
  caseTitle?: string;
  court: string;
  courtNo: string;
  time: string;
  judge: string;
  hearingType: 'trial' | 'mention' | 'inquiry' | 'support' | 'argument' | 'judgment' | 'other';
  notes?: string;
  status: 'confirmed' | 'tentative' | 'adjourned' | 'completed' | 'cancelled';
  courtLocation: 'hulftsdorp' | 'outstation';
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface TrustTransaction {
  id?: number;
  date: string;
  clientId: string;
  clientName: string;
  type: 'appearance_fee' | 'court_stamp' | 'typist_fee' | 'retainer_receipt' | 'refund' | 'transfer';
  amount: number;
  description: string;
  category: string;
  account: 'trust' | 'operating';
  caseId?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface CaseRecord {
  id?: number;
  clientName: string;
  clientPhone?: string;    // For WhatsApp integration
  clientEmail?: string;    // For document delivery
  caseTitle: string;
  caseNumber: string;
  caseType: 'civil' | 'criminal' | 'corporate' | 'estate' | 'ip' | 'family' | 'labour' | 'other';
  court: string;
  judge: string;
  status: 'active' | 'pending' | 'completed' | 'archived';
  retainerBalance: number;
  totalBilled: number;
  totalPaid: number;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

// ============================================
// Aquaculture Tables (AquaTracksy)
// ============================================

export interface AquaPond {
  id?: number;
  name: string;
  species: string;
  area: string;
  stockCount: number;
  stage: 'fingerling' | 'growing' | 'pre-harvest' | 'harvested' | 'idle';
  estHarvest: string;
  waterQuality: 'Good' | 'Fair' | 'Poor';
  cycleId?: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  updatedAt?: number;
  firestoreId?: string;
}

export interface AquaFeedLog {
  id?: number;
  date: string;
  pondId: number;
  pondName: string;
  feedType: string;
  quantity: number;
  cost: number;
  fcr?: number;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface AquaWaterLog {
  id?: number;
  date: string;
  pondId: number;
  pondName: string;
  ph: number;
  dissolvedOxygen: number;
  temperature: number;
  ammonia: number;
  salinity?: string;
  status: 'Good' | 'Fair' | 'Poor';
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface AquaHarvestSale {
  id?: number;
  date: string;
  pondId?: number;
  pondName?: string;
  species: string;
  quantity: number;
  pricePerKg: number;
  totalAmount: number;
  buyer?: string;
  grade?: 'A' | 'B' | 'C';
  currency: 'LKR' | 'USD';
  description?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface AquaExpense {
  id?: number;
  date: string;
  category: 'Feed' | 'Stock' | 'Labour' | 'Utilities' | 'Chemicals' | 'Licences' | 'Equipment' | 'Transport' | 'Other';
  amount: number;
  description: string;
  pondId?: number;
  pondName?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

// ============================================
// Engineering Tables (EngiTracksy)
// ============================================

export interface EngineeringProject {
  id?: number;
  name: string;
  client: string;
  value: number;           // Contract value in cents
  stage: 'design' | 'foundation' | 'construction' | 'finishing' | 'completed' | 'defects';
  pct: number;             // Completion percentage
  ictadGrade: string;      // e.g. C1, C3
  caseRef?: string;        // Project reference number
  startDate?: string;
  endDate?: string;
  retentionPct: number;    // Retention % held (typically 5-10)
  retentionReleaseDate?: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  updatedAt?: number;
  firestoreId?: string;
}

export interface BOQItem {
  id?: number;
  projectId: number;
  projectName: string;
  item: string;
  unit: string;
  qty: number;
  estimatedRate: number;   // Rate from BOQ estimate
  actualRate?: number;     // Real purchase rate
  amount?: number;         // qty × actualRate
  status: 'pending' | 'ordered' | 'partial' | 'completed';
  category?: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface SiteInspection {
  id?: number;
  projectId: number;
  projectName: string;
  date: string;
  inspector: string;
  type: 'structural' | 'foundation' | 'safety' | 'concrete_test' | 'electrical' | 'plumbing' | 'other';
  findings: string;
  status: 'passed' | 'issues' | 'failed';
  photoUrl?: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface BaasLedgerEntry {
  id?: number;
  projectId?: number;
  projectName?: string;
  baasName: string;        // Subcontractor name
  baasPhone?: string;      // For WhatsApp
  type: 'advance' | 'payment' | 'settlement' | 'deduction';
  amount: number;          // In cents
  description: string;
  date: string;
  workDescription?: string;
  completedWork?: number;  // % of work done
  voucherNo?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface RetentionRecord {
  id?: number;
  projectId: number;
  projectName: string;
  client: string;
  retentionPct: number;
  retentionAmount: number; // In cents
  releaseDate: string;
  whtRate: number;         // WHT rate (2% for construction)
  whtAmount: number;       // Computed WHT amount
  netRelease: number;      // retentionAmount - whtAmount
  status: 'held' | 'partially_released' | 'released' | 'disputed';
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

// ============================================
// Creator Tables (CreatorTracksy)
// ============================================

export interface CreatorBrandDeal {
  id?: number;
  brand: string;
  platform: string;        // YouTube, Instagram, TikTok, etc.
  stage: 'pitch' | 'negotiating' | 'shoot_booked' | 'delivered' | 'invoice_sent' | 'paid' | 'cancelled';
  amount: number;
  currency: 'LKR' | 'USD';
  deliverables: string;
  dueDate?: string;
  contactName?: string;
  contactPhone?: string;   // For WhatsApp
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  updatedAt?: number;
  firestoreId?: string;
}

export interface CreatorGearItem {
  id?: number;
  name: string;
  category: 'Camera' | 'Lens' | 'Audio' | 'Lighting' | 'Computer' | 'Drone' | 'Accessories' | 'Software' | 'Other';
  purchaseCost: number;
  purchaseDate: string;
  usefulLifeYears: number; // IRD depreciation life (typically 5)
  annualDepreciation: number; // purchaseCost / usefulLifeYears
  invoiceRef?: string;
  serialNumber?: string;
  notes?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface CreatorRevenue {
  id?: number;
  date: string;
  source: 'AdSense' | 'Brand Deal' | 'Affiliate' | 'Wise' | 'PayPal' | 'Freelance' | 'Other';
  amount: number;
  currency: 'LKR' | 'USD';
  lkrAmount: number;       // Converted at CBSL rate
  cbslRate?: number;       // Exchange rate used
  description: string;
  brandDealId?: number;    // Links to CreatorBrandDeal
  platform?: string;
  sync_status: 'pending' | 'synced' | 'error';
  userId: string;
  createdAt: number;
  firestoreId?: string;
}

export interface CreatorExpense {
  id?: number;
  date: string;
  category: 'Production' | 'Software' | 'Travel' | 'Equipment' | 'Creative Ops' | 'Office' | 'Marketing' | 'Freelancer' | 'Other';
  amount: number;
  description: string;
  taxDeductible: boolean;
  gearItemId?: number;     // Links to CreatorGearItem for depreciation
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
  court_diary!: Table<CourtDiaryEntry>;
  trust_transactions!: Table<TrustTransaction>;
  case_records!: Table<CaseRecord>;
  aqua_ponds!: Table<AquaPond>;
  aqua_feed_logs!: Table<AquaFeedLog>;
  aqua_water_logs!: Table<AquaWaterLog>;
  aqua_harvest_sales!: Table<AquaHarvestSale>;
  aqua_expenses!: Table<AquaExpense>;
  // Engineering tables (EngiTracksy)
  engineering_projects!: Table<EngineeringProject>;
  boq_items!: Table<BOQItem>;
  site_inspections!: Table<SiteInspection>;
  baas_ledger!: Table<BaasLedgerEntry>;
  retention_records!: Table<RetentionRecord>;
  // Creator tables (CreatorTracksy)
  creator_brand_deals!: Table<CreatorBrandDeal>;
  creator_gear_items!: Table<CreatorGearItem>;
  creator_revenue!: Table<CreatorRevenue>;
  creator_expenses!: Table<CreatorExpense>;

  constructor() {
    super('MyTracksyLocalDB');

    this.version(1).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
    });

    this.version(2).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
      court_diary: '++id, date, caseId, court, courtNo, time, hearingType, status, courtLocation, sync_status, userId, firestoreId',
      trust_transactions: '++id, date, clientId, type, amount, account, caseId, sync_status, userId, firestoreId',
      case_records: '++id, caseNumber, caseType, court, status, clientName, sync_status, userId, firestoreId',
    });

    // Aquaculture tables (AquaTracksy)
    this.version(3).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
      court_diary: '++id, date, caseId, court, courtNo, time, hearingType, status, courtLocation, sync_status, userId, firestoreId',
      trust_transactions: '++id, date, clientId, type, amount, account, caseId, sync_status, userId, firestoreId',
      case_records: '++id, caseNumber, caseType, court, status, clientName, sync_status, userId, firestoreId',
      aqua_ponds: '++id, name, species, stage, sync_status, userId, createdAt, firestoreId',
      aqua_feed_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_water_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_harvest_sales: '++id, date, species, sync_status, userId, createdAt, firestoreId',
      aqua_expenses: '++id, date, category, sync_status, userId, createdAt, firestoreId',
    });

    // Engineering tables (EngiTracksy)
    this.version(4).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
      court_diary: '++id, date, caseId, court, courtNo, time, hearingType, status, courtLocation, sync_status, userId, firestoreId',
      trust_transactions: '++id, date, clientId, type, amount, account, caseId, sync_status, userId, firestoreId',
      case_records: '++id, caseNumber, caseType, court, status, clientName, sync_status, userId, firestoreId',
      aqua_ponds: '++id, name, species, stage, sync_status, userId, createdAt, firestoreId',
      aqua_feed_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_water_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_harvest_sales: '++id, date, species, sync_status, userId, createdAt, firestoreId',
      aqua_expenses: '++id, date, category, sync_status, userId, createdAt, firestoreId',
      engineering_projects: '++id, name, client, stage, ictadGrade, sync_status, userId, createdAt, firestoreId',
      boq_items: '++id, projectId, item, status, sync_status, userId, createdAt, firestoreId',
      site_inspections: '++id, projectId, date, type, status, sync_status, userId, createdAt, firestoreId',
      baas_ledger: '++id, projectId, baasName, type, date, sync_status, userId, createdAt, firestoreId',
      retention_records: '++id, projectId, client, status, releaseDate, sync_status, userId, createdAt, firestoreId',
    });

    // Creator tables (CreatorTracksy)
    this.version(5).stores({
      transactions: '++id, date, amount, category, type, sync_status, userId, createdAt, firestoreId',
      clinical_notes: '++id, date, patientId, noteType, sync_status, userId, createdAt, firestoreId',
      offline_audio_queue: '++id, timestamp, status, userId, purpose',
      wallet_transactions: '++id, type, status, userId, createdAt, sync_status, firestoreId',
      receipts: '++id, date, amount, vendor, category, sync_status, userId, createdAt, firestoreId',
      court_diary: '++id, date, caseId, court, courtNo, time, hearingType, status, courtLocation, sync_status, userId, firestoreId',
      trust_transactions: '++id, date, clientId, type, amount, account, caseId, sync_status, userId, firestoreId',
      case_records: '++id, caseNumber, caseType, court, status, clientName, sync_status, userId, firestoreId',
      aqua_ponds: '++id, name, species, stage, sync_status, userId, createdAt, firestoreId',
      aqua_feed_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_water_logs: '++id, date, pondId, sync_status, userId, createdAt, firestoreId',
      aqua_harvest_sales: '++id, date, species, sync_status, userId, createdAt, firestoreId',
      aqua_expenses: '++id, date, category, sync_status, userId, createdAt, firestoreId',
      engineering_projects: '++id, name, client, stage, ictadGrade, sync_status, userId, createdAt, firestoreId',
      boq_items: '++id, projectId, item, status, sync_status, userId, createdAt, firestoreId',
      site_inspections: '++id, projectId, date, type, status, sync_status, userId, createdAt, firestoreId',
      baas_ledger: '++id, projectId, baasName, type, date, sync_status, userId, createdAt, firestoreId',
      retention_records: '++id, projectId, client, status, releaseDate, sync_status, userId, createdAt, firestoreId',
      creator_brand_deals: '++id, brand, stage, platform, sync_status, userId, createdAt, firestoreId',
      creator_gear_items: '++id, name, category, sync_status, userId, createdAt, firestoreId',
      creator_revenue: '++id, date, source, currency, sync_status, userId, createdAt, firestoreId',
      creator_expenses: '++id, date, category, sync_status, userId, createdAt, firestoreId',
    });
  }
}

export const db = new MyTracksyLocalDB();

// Helper: Get pending count for sync indicator
export async function getPendingSyncCount(userId: string): Promise<number> {
  const counts = await Promise.all([
    db.transactions.where({ sync_status: 'pending', userId }).count(),
    db.clinical_notes.where({ sync_status: 'pending', userId }).count(),
    db.offline_audio_queue.where({ status: 'pending', userId }).count(),
    db.wallet_transactions.where({ sync_status: 'pending', userId }).count(),
    db.receipts.where({ sync_status: 'pending', userId }).count(),
    db.court_diary.where({ sync_status: 'pending', userId }).count(),
    db.trust_transactions.where({ sync_status: 'pending', userId }).count(),
    db.case_records.where({ sync_status: 'pending', userId }).count(),
    db.aqua_ponds.where({ sync_status: 'pending', userId }).count(),
    db.aqua_feed_logs.where({ sync_status: 'pending', userId }).count(),
    db.aqua_water_logs.where({ sync_status: 'pending', userId }).count(),
    db.aqua_harvest_sales.where({ sync_status: 'pending', userId }).count(),
    db.aqua_expenses.where({ sync_status: 'pending', userId }).count(),
    db.engineering_projects.where({ sync_status: 'pending', userId }).count(),
    db.boq_items.where({ sync_status: 'pending', userId }).count(),
    db.site_inspections.where({ sync_status: 'pending', userId }).count(),
    db.baas_ledger.where({ sync_status: 'pending', userId }).count(),
    db.retention_records.where({ sync_status: 'pending', userId }).count(),
    db.creator_brand_deals.where({ sync_status: 'pending', userId }).count(),
    db.creator_gear_items.where({ sync_status: 'pending', userId }).count(),
    db.creator_revenue.where({ sync_status: 'pending', userId }).count(),
    db.creator_expenses.where({ sync_status: 'pending', userId }).count(),
  ]);
  return counts.reduce((sum, c) => sum + c, 0);
}

// Helper: Clear all local data for a user (logout)
export async function clearUserLocalData(userId: string): Promise<void> {
  await Promise.all([
    db.transactions.where({ userId }).delete(),
    db.clinical_notes.where({ userId }).delete(),
    db.offline_audio_queue.where({ userId }).delete(),
    db.wallet_transactions.where({ userId }).delete(),
    db.receipts.where({ userId }).delete(),
    db.court_diary.where({ userId }).delete(),
    db.trust_transactions.where({ userId }).delete(),
    db.case_records.where({ userId }).delete(),
    db.aqua_ponds.where({ userId }).delete(),
    db.aqua_feed_logs.where({ userId }).delete(),
    db.aqua_water_logs.where({ userId }).delete(),
    db.aqua_harvest_sales.where({ userId }).delete(),
    db.aqua_expenses.where({ userId }).delete(),
    db.engineering_projects.where({ userId }).delete(),
    db.boq_items.where({ userId }).delete(),
    db.site_inspections.where({ userId }).delete(),
    db.baas_ledger.where({ userId }).delete(),
    db.retention_records.where({ userId }).delete(),
    db.creator_brand_deals.where({ userId }).delete(),
    db.creator_gear_items.where({ userId }).delete(),
    db.creator_revenue.where({ userId }).delete(),
    db.creator_expenses.where({ userId }).delete(),
  ]);
}

export default db;
