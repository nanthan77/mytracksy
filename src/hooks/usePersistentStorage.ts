import { useState, useEffect } from 'react';

// ============================================
// Persistent Storage Hook
// Prevents iOS Safari from wiping IndexedDB
// when the phone runs low on storage
// ============================================

interface PersistentStorageState {
  isSupported: boolean;
  isPersisted: boolean;
  storageEstimate: { usage: number; quota: number } | null;
  checked: boolean;
}

export function usePersistentStorage() {
  const [state, setState] = useState<PersistentStorageState>({
    isSupported: typeof navigator !== 'undefined' && !!navigator.storage && !!navigator.storage.persist,
    isPersisted: false,
    storageEstimate: null,
    checked: false,
  });

  useEffect(() => {
    async function requestPersistence() {
      if (!navigator.storage || !navigator.storage.persist) {
        setState(prev => ({ ...prev, checked: true }));
        return;
      }

      try {
        // Check if already persisted
        const alreadyPersisted = await navigator.storage.persisted();
        
        if (!alreadyPersisted) {
          // Request persistent storage
          const granted = await navigator.storage.persist();
          console.log(`[PersistentStorage] Persistence ${granted ? 'GRANTED ✅' : 'DENIED ❌'}`);
          
          if (granted) {
            console.log('[PersistentStorage] Mission-critical medical data is now protected from auto-deletion');
          }
          
          setState(prev => ({ ...prev, isPersisted: granted, checked: true }));
        } else {
          console.log('[PersistentStorage] Already persisted ✅');
          setState(prev => ({ ...prev, isPersisted: true, checked: true }));
        }

        // Get storage estimate
        if (navigator.storage.estimate) {
          const estimate = await navigator.storage.estimate();
          setState(prev => ({
            ...prev,
            storageEstimate: {
              usage: estimate.usage || 0,
              quota: estimate.quota || 0,
            },
          }));
          
          const usageMB = ((estimate.usage || 0) / (1024 * 1024)).toFixed(2);
          const quotaMB = ((estimate.quota || 0) / (1024 * 1024)).toFixed(0);
          console.log(`[PersistentStorage] Using ${usageMB} MB of ${quotaMB} MB`);
        }
      } catch (err) {
        console.error('[PersistentStorage] Error:', err);
        setState(prev => ({ ...prev, checked: true }));
      }
    }

    requestPersistence();
  }, []);

  const getUsagePercent = (): number => {
    if (!state.storageEstimate || !state.storageEstimate.quota) return 0;
    return Math.round((state.storageEstimate.usage / state.storageEstimate.quota) * 100);
  };

  return {
    ...state,
    getUsagePercent,
  };
}

export default usePersistentStorage;