import { useState, useEffect, useCallback } from 'react';

// ============================================
// Token Wallet Hook
// Zero-Friction 1-Click Digital Wallet
// PayHere Integration | CBSL Compliant
// ============================================

export interface TokenPackage {
  id: string;
  tokens: number;
  price_lkr: number;
  label: string;
  popular?: boolean;
  savings?: string;
}

export const TOKEN_PACKAGES: TokenPackage[] = [
  { id: 'pack_50', tokens: 50, price_lkr: 750, label: '50 Tokens' },
  { id: 'pack_100', tokens: 100, price_lkr: 1500, label: '100 Tokens', popular: true },
  { id: 'pack_250', tokens: 250, price_lkr: 3500, label: '250 Tokens', savings: 'Save 7%' },
  { id: 'pack_500', tokens: 500, price_lkr: 6500, label: '500 Tokens', savings: 'Save 13%' },
  { id: 'pack_1000', tokens: 1000, price_lkr: 12000, label: '1,000 Tokens', savings: 'Save 20%' },
];

interface WalletState {
  tokenBalance: number;
  totalSpentLKR: number;
  savedCard: { masked: string; type: string; customerToken: string } | null;
  autoReloadEnabled: boolean;
  autoReloadThreshold: number;
  autoReloadPackage: string;
  isLoading: boolean;
  showBuyModal: boolean;
  showOutOfTokens: boolean;
  lastTopUp: { date: string; tokens: number; amount: number } | null;
}

export function useTokenWallet(userId: string | null) {
  const [wallet, setWallet] = useState<WalletState>({
    tokenBalance: 0,
    totalSpentLKR: 0,
    savedCard: null,
    autoReloadEnabled: false,
    autoReloadThreshold: 10,
    autoReloadPackage: 'pack_100',
    isLoading: true,
    showBuyModal: false,
    showOutOfTokens: false,
    lastTopUp: null,
  });

  // Load wallet data from localStorage (fallback) + Firestore
  useEffect(() => {
    if (!userId) return;

    // Quick load from localStorage for instant UI
    const cached = localStorage.getItem(`wallet_${userId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setWallet(prev => ({ ...prev, ...parsed, isLoading: false }));
      } catch {}
    }

    // TODO: Load from Firestore for authoritative balance
    // For now, use demo data
    setWallet(prev => ({
      ...prev,
      tokenBalance: prev.tokenBalance || 47,
      totalSpentLKR: prev.totalSpentLKR || 12000,
      savedCard: prev.savedCard || null,
      isLoading: false,
    }));
  }, [userId]);

  // Persist wallet state to localStorage
  useEffect(() => {
    if (!userId || wallet.isLoading) return;
    const { isLoading, showBuyModal, showOutOfTokens, ...persistable } = wallet;
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(persistable));
  }, [wallet, userId]);

  const spendTokens = useCallback((amount: number, description: string): boolean => {
    if (wallet.tokenBalance < amount) {
      setWallet(prev => ({ ...prev, showOutOfTokens: true }));
      return false;
    }

    setWallet(prev => ({
      ...prev,
      tokenBalance: prev.tokenBalance - amount,
    }));

    console.log(`[Wallet] Spent ${amount} tokens: ${description}`);
    return true;
  }, [wallet.tokenBalance]);

  const addTokens = useCallback((tokens: number, amountLKR: number) => {
    setWallet(prev => ({
      ...prev,
      tokenBalance: prev.tokenBalance + tokens,
      totalSpentLKR: prev.totalSpentLKR + amountLKR,
      lastTopUp: { date: new Date().toISOString(), tokens, amount: amountLKR },
      showOutOfTokens: false,
    }));
    console.log(`[Wallet] Added ${tokens} tokens (LKR ${amountLKR.toLocaleString()})`);
  }, []);

  const toggleAutoReload = useCallback((enabled: boolean) => {
    setWallet(prev => ({ ...prev, autoReloadEnabled: enabled }));
  }, []);

  const setAutoReloadPackage = useCallback((packageId: string) => {
    setWallet(prev => ({ ...prev, autoReloadPackage: packageId }));
  }, []);

  const openBuyModal = useCallback(() => {
    setWallet(prev => ({ ...prev, showBuyModal: true }));
  }, []);

  const closeBuyModal = useCallback(() => {
    setWallet(prev => ({ ...prev, showBuyModal: false }));
  }, []);

  const dismissOutOfTokens = useCallback(() => {
    setWallet(prev => ({ ...prev, showOutOfTokens: false }));
  }, []);

  // Simulate 1-click purchase (would call Firebase Cloud Function in production)
  const oneClickPurchase = useCallback(async (packageId: string): Promise<boolean> => {
    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return false;

    if (!wallet.savedCard) {
      // No saved card — redirect to web portal
      window.open('https://wallet.mytracksy.lk/topup', '_blank');
      return false;
    }

    // In production: Call Firebase Cloud Function 'oneClickTopUp'
    // const result = await httpsCallable(functions, 'oneClickTopUp')({ userId, packageId });
    
    // Simulate success
    addTokens(pkg.tokens, pkg.price_lkr);
    return true;
  }, [wallet.savedCard, addTokens]);

  return {
    ...wallet,
    spendTokens,
    addTokens,
    toggleAutoReload,
    setAutoReloadPackage,
    openBuyModal,
    closeBuyModal,
    dismissOutOfTokens,
    oneClickPurchase,
  };
}

export default useTokenWallet;