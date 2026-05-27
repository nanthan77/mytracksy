import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
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

const REDIRECT_FALLBACK_ERRORS = new Set([
  'auth/popup-blocked',
  'auth/cancelled-popup-request',
  'auth/operation-not-supported-in-this-environment',
]);

function getAuthErrorMessage(error: any): string {
  switch (error?.code) {
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was cancelled.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';
    case 'auth/unauthorized-domain':
      return 'This admin domain is not authorized for Google sign-in.';
    default:
      return error?.message || 'Authentication failed. Please try again.';
  }
}

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
    let active = true;

    getRedirectResult(auth).catch((err: any) => {
      if (!active || err?.code === 'auth/no-auth-event') return;
      setState(prev => ({ ...prev, loading: false, error: getAuthErrorMessage(err) }));
    });

    return () => {
      active = false;
    };
  }, []);

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
      setState(prev => ({ ...prev, loading: false, error: getAuthErrorMessage(err) }));
    }
  };

  const loginWithGoogle = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      if (REDIRECT_FALLBACK_ERRORS.has(err?.code)) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr: any) {
          setState(prev => ({ ...prev, loading: false, error: getAuthErrorMessage(redirectErr) }));
          return;
        }
      }

      setState(prev => ({ ...prev, loading: false, error: getAuthErrorMessage(err) }));
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
