import { useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { auth, functions } from '../../shared/firebase/config';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

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

      try {
        const verifyAccess = httpsCallable<void, { role: AdminRole; professions: string[] }>(
          functions, 'verifyAdminAccess'
        );
        const result = await verifyAccess();
        setState({
          user,
          role: result.data.role,
          professions: result.data.professions,
          loading: false,
          error: null,
        });
        resetIdleTimer();
      } catch (err: any) {
        setState({
          user,
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
    } catch (err: any) {
      setState(prev => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const logout = async () => {
    await signOut(auth);
    setState({ user: null, role: null, professions: [], loading: false, error: null });
  };

  const hasPermission = (permission: string): boolean => {
    if (!state.role) return false;
    const PERMISSIONS: Record<AdminRole, string[]> = {
      super_admin: ['view_dashboard','manage_users','approve_users','suspend_users','override_subscriptions','manage_settings','manage_roles','view_analytics','send_notifications','manage_tax_engine','view_audit_log','manage_ai_usage'],
      profession_admin: ['view_dashboard','manage_users','approve_users','suspend_users','override_subscriptions','manage_settings','view_analytics','send_notifications','view_audit_log'],
      support_agent: ['view_dashboard','manage_users','approve_users','suspend_users','view_audit_log'],
      viewer: ['view_dashboard','view_analytics'],
    };
    return PERMISSIONS[state.role]?.includes(permission) ?? false;
  };

  const hasProfessionAccess = (professionId: string): boolean => {
    if (state.role === 'super_admin') return true;
    return state.professions.includes(professionId);
  };

  return { ...state, login, loginWithGoogle, logout, hasPermission, hasProfessionAccess };
}
