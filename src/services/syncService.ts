import { offlineStorageService, OfflineExpense, OfflineQueueItem, SyncConflict } from './offlineStorageService';
import { multiCompanyService } from './multiCompanyService';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSync: Date | null;
  pendingItems: number;
  conflicts: number;
  errors: string[];
}

export interface SyncOptions {
  forceFull?: boolean;
  maxRetries?: number;
  conflictResolution?: 'manual' | 'auto_local' | 'auto_server';
}

export class SyncService {
  private static instance: SyncService;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private lastSync: Date | null = null;
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();
  private backgroundSyncRegistered: boolean = false;

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  constructor() {
    this.setupNetworkListeners();
    this.setupBackgroundSync();
    this.loadLastSyncTime();
    
    // Auto-sync when coming back online
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners();
      setTimeout(() => this.performSync(), 1000);
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  /**
   * Get current sync status
   */
  public async getSyncStatus(): Promise<SyncStatus> {
    const pendingItems = await offlineStorageService.getPendingSyncItems();
    const conflicts = await offlineStorageService.getUnresolvedConflicts();
    
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing,
      lastSync: this.lastSync,
      pendingItems: pendingItems.length,
      conflicts: conflicts.length,
      errors: []
    };
  }

  /**
   * Add sync status listener
   */
  public addSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.add(listener);
  }

  /**
   * Remove sync status listener
   */
  public removeSyncListener(listener: (status: SyncStatus) => void): void {
    this.syncListeners.delete(listener);
  }

  /**
   * Perform manual sync
   */
  public async performSync(options: SyncOptions = {}): Promise<boolean> {
    if (!this.isOnline) {
      console.log('Cannot sync: offline');
      return false;
    }

    if (this.isSyncing) {
      console.log('Sync already in progress');
      return false;
    }

    this.isSyncing = true;
    this.notifyListeners();

    try {
      console.log('Starting sync process...');
      
      // Step 1: Upload pending changes
      await this.uploadPendingChanges(options);
      
      // Step 2: Download server changes (if full sync)
      if (options.forceFull) {
        await this.downloadServerChanges();
      }
      
      // Step 3: Handle conflicts
      await this.handleConflicts(options.conflictResolution || 'manual');
      
      this.lastSync = new Date();
      await offlineStorageService.storeSetting('lastSync', this.lastSync.toISOString());
      
      console.log('Sync completed successfully');
      return true;
      
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
      
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }
  }

  /**
   * Upload pending changes to server
   */
  private async uploadPendingChanges(options: SyncOptions): Promise<void> {
    const pendingItems = await offlineStorageService.getPendingSyncItems();
    console.log(`Uploading ${pendingItems.length} pending changes...`);

    for (const item of pendingItems) {
      try {
        await this.processSyncItem(item);
        await offlineStorageService.markSyncCompleted(item.id, item.data?.id);
        
      } catch (error) {
        console.error(`Failed to sync item ${item.id}:`, error);
        
        if (this.isConflictError(error)) {
          // Handle conflict
          await this.handleItemConflict(item, error);
        } else {
          // Mark as failed and retry later
          await offlineStorageService.markSyncFailed(item.id, error.message);
        }
      }
    }
  }

  /**
   * Process individual sync item
   */
  private async processSyncItem(item: OfflineQueueItem): Promise<any> {
    console.log(`Processing sync item: ${item.action} ${item.id}`);
    
    switch (item.action) {
      case 'create':
        return await this.createExpenseOnServer(item.data);
      
      case 'update':
        return await this.updateExpenseOnServer(item.data);
      
      case 'delete':
        return await this.deleteExpenseOnServer(item.data.id);
      
      default:
        throw new Error(`Unknown sync action: ${item.action}`);
    }
  }

  /**
   * Create expense on server
   */
  private async createExpenseOnServer(expenseData: OfflineExpense): Promise<any> {
    // Convert offline expense to server format
    const serverExpense = {
      userId: expenseData.userId,
      companyId: expenseData.companyId,
      amount: expenseData.amount,
      category: expenseData.category,
      description: expenseData.description,
      date: expenseData.date,
      paymentMethod: expenseData.paymentMethod,
      tags: expenseData.tags,
      metadata: {
        ...expenseData.metadata,
        clientId: expenseData.clientId,
        offline: false
      }
    };

    // If multi-company expense
    if (expenseData.companyId) {
      const result = await multiCompanyService.addMultiCompanyExpense(serverExpense);
      return result.expense;
    }

    // Regular expense - store in localStorage for now (in real app, this would be a server call)
    const expenses = this.getStoredExpenses();
    const newExpense = {
      ...serverExpense,
      id: `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    expenses.push(newExpense);
    localStorage.setItem('tracksy-expenses', JSON.stringify(expenses));
    
    return newExpense;
  }

  /**
   * Update expense on server
   */
  private async updateExpenseOnServer(expenseData: OfflineExpense): Promise<any> {
    // Check if server version exists and has been modified
    const serverExpense = await this.getServerExpense(expenseData.id);
    
    if (serverExpense && serverExpense.lastModified > expenseData.lastModified) {
      // Conflict detected
      throw new ConflictError('Concurrent modification detected', serverExpense);
    }

    // Update in multi-company service if applicable
    if (expenseData.companyId) {
      // For multi-company, we'd need to implement update in the service
      // For now, simulate successful update
      return { ...expenseData, updatedAt: new Date() };
    }

    // Update regular expense
    const expenses = this.getStoredExpenses();
    const index = expenses.findIndex(e => e.id === expenseData.id || e.clientId === expenseData.clientId);
    
    if (index === -1) {
      throw new Error('Expense not found on server');
    }

    expenses[index] = {
      ...expenses[index],
      ...expenseData,
      updatedAt: new Date()
    };
    
    localStorage.setItem('tracksy-expenses', JSON.stringify(expenses));
    return expenses[index];
  }

  /**
   * Delete expense on server
   */
  private async deleteExpenseOnServer(expenseId: string): Promise<void> {
    const expenses = this.getStoredExpenses();
    const filtered = expenses.filter(e => e.id !== expenseId);
    
    if (filtered.length === expenses.length) {
      throw new Error('Expense not found on server');
    }
    
    localStorage.setItem('tracksy-expenses', JSON.stringify(filtered));
  }

  /**
   * Download server changes (for full sync)
   */
  private async downloadServerChanges(): Promise<void> {
    console.log('Downloading server changes...');
    
    // Get last sync time
    const lastSyncTime = this.lastSync || new Date(0);
    
    // In a real app, this would fetch changes from server since lastSyncTime
    // For now, we'll simulate by checking localStorage
    const serverExpenses = this.getStoredExpenses();
    const changedExpenses = serverExpenses.filter(e => 
      new Date(e.updatedAt || e.createdAt) > lastSyncTime
    );

    console.log(`Found ${changedExpenses.length} server changes`);

    // Update local storage with server changes
    for (const serverExpense of changedExpenses) {
      const localExpense = await offlineStorageService.getData('expenses', serverExpense.id);
      
      if (!localExpense) {
        // New expense from server
        await this.storeServerExpense(serverExpense);
      } else if (localExpense.lastModified < new Date(serverExpense.updatedAt).getTime()) {
        // Server version is newer
        if (localExpense.syncStatus === 'pending') {
          // Conflict: local changes pending and server has newer version
          await this.createConflict(localExpense, serverExpense, 'concurrent_edit');
        } else {
          // Safe to update with server version
          await this.storeServerExpense(serverExpense);
        }
      }
    }
  }

  /**
   * Handle sync conflicts
   */
  private async handleConflicts(strategy: 'manual' | 'auto_local' | 'auto_server'): Promise<void> {
    const conflicts = await offlineStorageService.getUnresolvedConflicts();
    
    if (conflicts.length === 0) return;

    console.log(`Handling ${conflicts.length} conflicts with strategy: ${strategy}`);

    for (const conflict of conflicts) {
      switch (strategy) {
        case 'auto_local':
          await offlineStorageService.resolveConflict(conflict.id, 'local');
          break;
          
        case 'auto_server':
          await offlineStorageService.resolveConflict(conflict.id, 'server');
          break;
          
        case 'manual':
          // Leave for user to resolve manually
          console.log(`Manual resolution required for conflict: ${conflict.id}`);
          break;
      }
    }
  }

  /**
   * Handle individual item conflict
   */
  private async handleItemConflict(item: OfflineQueueItem, error: any): Promise<void> {
    if (error instanceof ConflictError) {
      await this.createConflict(item.data, error.serverData, 'concurrent_edit');
    }
  }

  /**
   * Create conflict record
   */
  private async createConflict(localData: OfflineExpense, serverData: any, type: 'update' | 'delete' | 'concurrent_edit'): Promise<void> {
    await offlineStorageService.storeSyncConflict({
      localData,
      serverData,
      conflictType: type,
      timestamp: Date.now(),
      resolved: false
    });
  }

  /**
   * Setup background sync for PWA
   */
  private async setupBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register('tracksy-expense-sync');
        this.backgroundSyncRegistered = true;
        console.log('Background sync registered successfully');
      } catch (error) {
        console.error('Failed to register background sync:', error);
      }
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    // Listen for network changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        console.log('Network status changed:', connection.effectiveType);
        this.notifyListeners();
      });
    }

    // Periodic online check
    setInterval(() => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (!wasOnline && this.isOnline) {
        console.log('Reconnected to internet');
        setTimeout(() => this.performSync(), 2000);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Load last sync time from storage
   */
  private async loadLastSyncTime(): Promise<void> {
    try {
      const lastSyncStr = await offlineStorageService.getSetting('lastSync');
      if (lastSyncStr) {
        this.lastSync = new Date(lastSyncStr);
      }
    } catch (error) {
      console.error('Failed to load last sync time:', error);
    }
  }

  /**
   * Notify all sync listeners
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    for (const listener of this.syncListeners) {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    }
  }

  /**
   * Check if error is a conflict error
   */
  private isConflictError(error: any): boolean {
    return error instanceof ConflictError || 
           error.code === 'CONFLICT' || 
           error.status === 409;
  }

  /**
   * Get server expense (simulated)
   */
  private async getServerExpense(expenseId: string): Promise<any> {
    const expenses = this.getStoredExpenses();
    return expenses.find(e => e.id === expenseId);
  }

  /**
   * Store server expense locally
   */
  private async storeServerExpense(serverExpense: any): Promise<void> {
    const offlineExpense: OfflineExpense = {
      id: serverExpense.id,
      userId: serverExpense.userId,
      companyId: serverExpense.companyId,
      amount: serverExpense.amount,
      category: serverExpense.category,
      description: serverExpense.description,
      date: new Date(serverExpense.date),
      paymentMethod: serverExpense.paymentMethod,
      tags: serverExpense.tags || [],
      metadata: {
        ...serverExpense.metadata,
        offline: false,
        timestamp: Date.now()
      },
      syncStatus: 'synced',
      lastModified: new Date(serverExpense.updatedAt || serverExpense.createdAt).getTime(),
      clientId: serverExpense.metadata?.clientId || 'server'
    };

    await offlineStorageService.putData('expenses', offlineExpense);
  }

  /**
   * Get stored expenses from localStorage (temporary implementation)
   */
  private getStoredExpenses(): any[] {
    try {
      const stored = localStorage.getItem('tracksy-expenses');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load stored expenses:', error);
      return [];
    }
  }

  /**
   * Force sync all pending changes
   */
  public async forceSyncAll(): Promise<boolean> {
    return await this.performSync({ 
      forceFull: true, 
      maxRetries: 3,
      conflictResolution: 'manual'
    });
  }

  /**
   * Get network quality info for sync optimization
   */
  public getNetworkInfo(): { effectiveType?: string; downlink?: number; rtt?: number } {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt
      };
    }
    return {};
  }

  /**
   * Estimate sync time based on pending items and network
   */
  public async estimateSyncTime(): Promise<number> {
    const pendingItems = await offlineStorageService.getPendingSyncItems();
    const networkInfo = this.getNetworkInfo();
    
    // Base time per item in milliseconds
    let timePerItem = 1000; // 1 second default
    
    // Adjust based on network quality
    if (networkInfo.effectiveType) {
      switch (networkInfo.effectiveType) {
        case 'slow-2g': timePerItem = 5000; break;
        case '2g': timePerItem = 3000; break;
        case '3g': timePerItem = 1500; break;
        case '4g': timePerItem = 500; break;
      }
    }
    
    return pendingItems.length * timePerItem;
  }
}

/**
 * Custom error for sync conflicts
 */
class ConflictError extends Error {
  public serverData: any;
  
  constructor(message: string, serverData: any) {
    super(message);
    this.name = 'ConflictError';
    this.serverData = serverData;
  }
}

export const syncService = SyncService.getInstance();