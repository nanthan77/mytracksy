import { useState, useCallback, useRef, useEffect } from 'react';

// ============================================
// Screen Wake Lock Hook
// Keeps screen awake during voice recording
// so Safari/Chrome doesn't kill the microphone
// ============================================

interface WakeLockState {
  isSupported: boolean;
  isActive: boolean;
  error: string | null;
}

export function useWakeLock() {
  const [state, setState] = useState<WakeLockState>({
    isSupported: typeof navigator !== 'undefined' && 'wakeLock' in navigator,
    isActive: false,
    error: null,
  });
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      setState(prev => ({ ...prev, error: 'Wake Lock API not supported on this device' }));
      return false;
    }

    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setState({ isSupported: true, isActive: true, error: null });

      // Re-acquire if page becomes visible again (e.g., tab switch back)
      wakeLockRef.current!.addEventListener('release', () => {
        setState(prev => ({ ...prev, isActive: false }));
      });

      console.log('[WakeLock] Screen wake lock acquired — mic safe');
      return true;
    } catch (err: any) {
      console.warn('[WakeLock] Failed to acquire:', err.message);
      setState(prev => ({ ...prev, isActive: false, error: err.message }));
      return false;
    }
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        setState(prev => ({ ...prev, isActive: false }));
        console.log('[WakeLock] Screen wake lock released');
      } catch (err: any) {
        console.warn('[WakeLock] Release failed:', err.message);
      }
    }
  }, []);

  // Auto-reacquire when page visibility changes (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && state.isActive && !wakeLockRef.current) {
        await requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Cleanup on unmount
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [state.isActive, requestWakeLock]);

  return {
    ...state,
    requestWakeLock,
    releaseWakeLock,
  };
}

export default useWakeLock;