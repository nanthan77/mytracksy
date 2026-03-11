import React, { createContext, useContext } from 'react';
import { useAdminAuth } from './useAdminAuth';

type AdminAuthReturn = ReturnType<typeof useAdminAuth>;

const AdminAuthContext = createContext<AdminAuthReturn | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAdminAuth();
  return <AdminAuthContext.Provider value={auth}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuthContext(): AdminAuthReturn {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuthContext must be inside AdminAuthProvider');
  return ctx;
}
