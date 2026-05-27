import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { auth } from '../../shared/firebase/config';
import { AdminRole, hasAdminPermission, hasAdminProfessionAccess } from '../../shared/types/admin';
import { adminApi } from '../shared/api/adminApi';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

interface AdminAuthState {
  user: User | null;
  role: AdminRole | null;
  professions: string[];
  loading: boolean;
  error: string | null;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function useAdminAuth() {
  const [state, setState] = useState<AdminAuthState>({
    user: null, role: null, professions: [], loading: true, error: null,
  });
  const idleTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => {
      signOut(auth);
      setState(prev => ({ ...prev, user: null, role: null, professions: [], error: 'Session expired. Please log in again.' }));
    }, SESSION_TIMEOUT_MS);
  }, []);

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetIdleTimer));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, professions: [], loading: false, error: null });
        return;
      }

      setState(prev => ({ ...prev, user, loading: true, error: null }));

      try {
        const result = await adminApi.verifyAdminAccess();
        setState({
          user,
          role: result.role,
          professions: result.professions,
          loading: false,
          error: null,
        });
        resetIdleTimer();
      } catch (err: any) {
        await signOut(auth);
        setState({
          user: null,
          role: null,
          professions: [],
          loading: false,
          error: err.message || 'Access denied',
        });
      }
    });

    return () => unsubscribe();
  }, [resetIdleTimer]);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setState({ user: null, role: null, professions: [], loading: false, error: null });
  };

  const hasPermission = (permission: string): boolean => {
    return hasAdminPermission(state.role, permission);
  };

  const hasProfessionAccess = (professionId: string): boolean => {
    return hasAdminProfessionAccess(state.role, state.professions, professionId);
  };

  return { ...state, login, loginWithGoogle, logout, hasPermission, hasProfessionAccess };
}
