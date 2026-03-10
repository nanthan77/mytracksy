export interface OfflineExpense {
  id: string;
  userId: string;
  companyId?: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  paymentMethod: 'cash' | 'card' | 'bank-transfer' | 'reimbursement';
  tags: string[];
  metadata: {
    source: 'manual' | 'voice' | 'sms' | 'import';
    confidence?: number;
    culturalContext?: any;
    location?: string;
    offline: boolean;
    timestamp: number;
  };
  syncStatus: 'pending' | 'synced' | 'conflict' | 'failed';
  lastModified: number;
  clientId: string; // Unique client identifier for conflict resolution
}

export interface SyncConflict {
  id: string;
  localData: OfflineExpense;
  serverData: any;
  conflictType: 'update' | 'delete' | 'concurrent_edit';
  timestamp: number;
  resolved: boolean;
}

export interface OfflineQueueItem {
  id: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
}

export class OfflineStorageService {
  private static instance: OfflineStorageService;
  private dbName = 'TracksyOfflineDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;
  private clientId: string;

  // Store names
  private stores = {
    expenses: 'expenses',
    budgets: 'budgets',
    companies: 'companies',
    syncQueue: 'syncQueue',
    conflicts: 'conflicts',
    culturalData: 'culturalData',
    merchants: 'merchants',
    settings: 'settings'
  };

  public static getInstance(): OfflineStorageService {
    if (!OfflineStorageService.instance) {
      OfflineStorageService.instance = new OfflineStorageService();
    }
    return OfflineStorageService.instance;
  }

  constructor() {
    this.clientId = this.generateClientId();
    this.initializeDatabase();
  }

  /**
   * Initialize IndexedDB database with all required stores
   */
  private async initializeDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Expenses store
        if (!db.objectStoreNames.contains(this.stores.expenses)) {
          const expenseStore = db.createObjectStore(this.stores.expenses, { keyPath: 'id' });
          expenseStore.createIndex('syncStatus', 'syncStatus', { unique: false });
          expenseStore.createIndex('lastModified', 'lastModified', { unique: false });
          expenseStore.createIndex('date', 'date', { unique: false });
          expenseStore.createIndex('companyId', 'companyId', { unique: false });
        }

        // Budgets store
        if (!db.objectStoreNames.contains(this.stores.budgets)) {
          const budgetStore = db.createObjectStore(this.stores.budgets, { keyPath: 'id' });
          budgetStore.createIndex('category', 'category', { unique: false });
          budgetStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Companies store
        if (!db.objectStoreNames.contains(this.stores.companies)) {
          const companyStore = db.createObjectStore(this.stores.companies, { keyPath: 'id' });
          companyStore.createIndex('isActive', 'isActive', { unique: false });
        }

        // Sync queue store
        if (!db.objectStoreNames.contains(this.stores.syncQueue)) {
          const syncStore = db.createObjectStore(this.stores.syncQueue, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('action', 'action', { unique: false });
        }

        // Conflicts store
        if (!db.objectStoreNames.contains(this.stores.conflicts)) {
          const conflictStore = db.createObjectStore(this.stores.conflicts, { keyPath: 'id' });
          conflictStore.createIndex('resolved', 'resolved', { unique: false });
          conflictStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Cultural data store
        if (!db.objectStoreNames.contains(this.stores.culturalData)) {
          db.createObjectStore(this.stores.culturalData, { keyPath: 'id' });
        }

        // Merchants store
        if (!db.objectStoreNames.contains(this.stores.merchants)) {
          const merchantStore = db.createObjectStore(this.stores.merchants, { keyPath: 'name' });
          merchantStore.createIndex('category', 'category', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains(this.stores.settings)) {
          db.createObjectStore(this.stores.settings, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Store expense offline with sync marking
   */
  public async storeExpenseOffline(expenseData: Omit<OfflineExpense, 'id' | 'syncStatus' | 'lastModified' | 'clientId'>): Promise<OfflineExpense> {
    const expense: OfflineExpense = {
      ...expenseData,
      id: this.generateExpenseId(),
      syncStatus: 'pending',
      lastModified: Date.now(),
      clientId: this.clientId,
      metadata: {
        ...expenseData.metadata,
        offline: true,
        timestamp: Date.now()
      }
    };

    await this.putData(this.stores.expenses, expense);
    
    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateSyncId(),
      action: 'create',
      data: expense,
      timestamp: Date.now(),
      retryCount: 0
    });

    return expense;
  }

  /**
   * Update existing expense offline
   */
  public async updateExpenseOffline(expenseId: string, updates: Partial<OfflineExpense>): Promise<OfflineExpense | null> {
    const existing = await this.getData(this.stores.expenses, expenseId);
    if (!existing) return null;

    const updated: OfflineExpense = {
      ...existing,
      ...updates,
      lastModified: Date.now(),
      syncStatus: 'pending'
    };

    await this.putData(this.stores.expenses, updated);
    
    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateSyncId(),
      action: 'update',
      data: updated,
      timestamp: Date.now(),
      retryCount: 0
    });

    return updated;
  }

  /**
   * Delete expense offline
   */
  public async deleteExpenseOffline(expenseId: string): Promise<boolean> {
    const existing = await this.getData(this.stores.expenses, expenseId);
    if (!existing) return false;

    // Mark as deleted but keep for sync
    const deleted: OfflineExpense = {
      ...existing,
      lastModified: Date.now(),
      syncStatus: 'pending',
      metadata: {
        ...existing.metadata,
        deleted: true
      }
    };

    await this.putData(this.stores.expenses, deleted);
    
    // Add to sync queue
    await this.addToSyncQueue({
      id: this.generateSyncId(),
      action: 'delete',
      data: { id: expenseId },
      timestamp: Date.now(),
      retryCount: 0
    });

    return true;
  }

  /**
   * Get all offline expenses
   */
  public async getOfflineExpenses(filters?: {
    companyId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    syncStatus?: 'pending' | 'synced' | 'conflict' | 'failed';
  }): Promise<OfflineExpense[]> {
    const expenses = await this.getAllData(this.stores.expenses) as OfflineExpense[];
    
    if (!filters) return expenses.filter(e => !e.metadata.deleted);

    return expenses.filter(expense => {
      if (expense.metadata.deleted) return false;
      
      if (filters.companyId && expense.companyId !== filters.companyId) return false;
      if (filters.syncStatus && expense.syncStatus !== filters.syncStatus) return false;
      if (filters.dateFrom && new Date(expense.date) < filters.dateFrom) return false;
      if (filters.dateTo && new Date(expense.date) > filters.dateTo) return false;
      
      return true;
    });
  }

  /**
   * Get pending sync items
   */
  public async getPendingSyncItems(): Promise<OfflineQueueItem[]> {
    const items = await this.getAllData(this.stores.syncQueue) as OfflineQueueItem[];
    return items.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Mark sync item as completed
   */
  public async markSyncCompleted(syncId: string, expenseId?: string): Promise<void> {
    // Remove from sync queue
    await this.deleteData(this.stores.syncQueue, syncId);
    
    // Update expense sync status if provided
    if (expenseId) {
      const expense = await this.getData(this.stores.expenses, expenseId);
      if (expense) {
        expense.syncStatus = 'synced';
        await this.putData(this.stores.expenses, expense);
      }
    }
  }

  /**
   * Mark sync item as failed and increment retry count
   */
  public async markSyncFailed(syncId: string, error?: string): Promise<void> {
    const item = await this.getData(this.stores.syncQueue, syncId) as OfflineQueueItem;
    if (!item) return;

    item.retryCount += 1;
    item.lastAttempt = Date.now();

    // Remove if too many retries
    if (item.retryCount >= 5) {
      await this.deleteData(this.stores.syncQueue, syncId);
      
      // Mark related expense as failed
      if (item.data?.id) {
        const expense = await this.getData(this.stores.expenses, item.data.id);
        if (expense) {
          expense.syncStatus = 'failed';
          expense.metadata.syncError = error;
          await this.putData(this.stores.expenses, expense);
        }
      }
    } else {
      await this.putData(this.stores.syncQueue, item);
    }
  }

  /**
   * Store sync conflict for user resolution
   */
  public async storeSyncConflict(conflict: Omit<SyncConflict, 'id'>): Promise<void> {
    const conflictData: SyncConflict = {
      ...conflict,
      id: this.generateConflictId()
    };

    await this.putData(this.stores.conflicts, conflictData);
  }

  /**
   * Get unresolved conflicts
   */
  public async getUnresolvedConflicts(): Promise<SyncConflict[]> {
    const conflicts = await this.getAllData(this.stores.conflicts) as SyncConflict[];
    return conflicts.filter(c => !c.resolved);
  }

  /**
   * Resolve conflict with user choice
   */
  public async resolveConflict(conflictId: string, resolution: 'local' | 'server' | 'merge'): Promise<void> {
    const conflict = await this.getData(this.stores.conflicts, conflictId) as SyncConflict;
    if (!conflict) return;

    let resolvedData: OfflineExpense;

    switch (resolution) {
      case 'local':
        resolvedData = conflict.localData;
        break;
      case 'server':
        resolvedData = {
          ...conflict.serverData,
          syncStatus: 'synced',
          clientId: this.clientId
        };
        break;
      case 'merge':
        // Simple merge strategy - combine data with local taking precedence for user-editable fields
        resolvedData = {
          ...conflict.serverData,
          description: conflict.localData.description,
          category: conflict.localData.category,
          tags: [...new Set([...conflict.localData.tags, ...conflict.serverData.tags])],
          syncStatus: 'pending',
          lastModified: Date.now(),
          clientId: this.clientId
        };
        break;
    }

    // Update expense with resolved data
    await this.putData(this.stores.expenses, resolvedData);

    // Mark conflict as resolved
    conflict.resolved = true;
    await this.putData(this.stores.conflicts, conflict);

    // Add to sync queue if resolution requires sync
    if (resolution !== 'server') {
      await this.addToSyncQueue({
        id: this.generateSyncId(),
        action: 'update',
        data: resolvedData,
        timestamp: Date.now(),
        retryCount: 0
      });
    }
  }

  /**
   * Cache cultural data for offline use
   */
  public async cacheCulturalData(data: any): Promise<void> {
    await this.putData(this.stores.culturalData, {
      id: 'cultural_events',
      data,
      lastUpdated: Date.now()
    });
  }

  /**
   * Get cached cultural data
   */
  public async getCachedCulturalData(): Promise<any> {
    const cached = await this.getData(this.stores.culturalData, 'cultural_events');
    return cached?.data || null;
  }

  /**
   * Cache merchant data for offline recognition
   */
  public async cacheMerchantData(merchants: Array<{ name: string; category: string; confidence: number }>): Promise<void> {
    for (const merchant of merchants) {
      await this.putData(this.stores.merchants, merchant);
    }
  }

  /**
   * Get cached merchant data
   */
  public async getCachedMerchants(): Promise<Array<{ name: string; category: string; confidence: number }>> {
    return await this.getAllData(this.stores.merchants) as Array<{ name: string; category: string; confidence: number }>;
  }

  /**
   * Search cached merchants
   */
  public async searchMerchants(query: string): Promise<Array<{ name: string; category: string; confidence: number }>> {
    const merchants = await this.getCachedMerchants();
    const lowerQuery = query.toLowerCase();
    
    return merchants
      .filter(merchant => merchant.name.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  /**
   * Store app settings
   */
  public async storeSetting(key: string, value: any): Promise<void> {
    await this.putData(this.stores.settings, { key, value, timestamp: Date.now() });
  }

  /**
   * Get app setting
   */
  public async getSetting(key: string): Promise<any> {
    const setting = await this.getData(this.stores.settings, key);
    return setting?.value;
  }

  /**
   * Get storage usage statistics
   */
  public async getStorageStats(): Promise<{
    totalExpenses: number;
    pendingSync: number;
    conflicts: number;
    cacheSize: number;
  }> {
    const expenses = await this.getAllData(this.stores.expenses);
    const syncQueue = await this.getAllData(this.stores.syncQueue);
    const conflicts = await this.getAllData(this.stores.conflicts);
    
    return {
      totalExpenses: expenses.length,
      pendingSync: syncQueue.length,
      conflicts: conflicts.filter((c: any) => !c.resolved).length,
      cacheSize: this.estimateStorageSize(expenses) + this.estimateStorageSize(syncQueue)
    };
  }

  /**
   * Clear all offline data (for logout/reset)
   */
  public async clearAllData(): Promise<void> {
    const stores = Object.values(this.stores);
    for (const storeName of stores) {
      await this.clearStore(storeName);
    }
  }

  // Private helper methods

  private async addToSyncQueue(item: OfflineQueueItem): Promise<void> {
    await this.putData(this.stores.syncQueue, item);
  }

  private async getData(storeName: string, id: string): Promise<any> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async putData(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async deleteData(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private async getAllData(storeName: string): Promise<any[]> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(storeName: string): Promise<void> {
    if (!this.db) await this.initializeDatabase();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExpenseId(): string {
    return `expense_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateStorageSize(data: any[]): number {
    return JSON.stringify(data).length;
  }
}

export const offlineStorageService = OfflineStorageService.getInstance();