import { useState, useEffect, useCallback } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db as firestoreDb } from '../config/firebase';
import { submitPayHereForm, PayHereFormPayload } from '../utils/payhere';

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
  purchaseInProgress: boolean;
}

// Wallet payment functions are deployed in us-central1.
const walletFunctions = getFunctions(undefined, 'us-central1');

function paymentErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return fallback;
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
    purchaseInProgress: false,
  });

  // Real-time Firestore listener for wallet balance
  useEffect(() => {
    if (!userId) {
      setWallet(prev => ({ ...prev, isLoading: false }));
      return;
    }

    // Quick load from localStorage for instant UI while Firestore connects
    const cached = localStorage.getItem(`wallet_${userId}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setWallet(prev => ({ ...prev, ...parsed, isLoading: true }));
      } catch { /* ignore corrupt cache */ }
    }

    // Subscribe to wallet balance in Firestore (real-time)
    const unsubBalance = onSnapshot(
      doc(firestoreDb, 'users', userId, 'wallet', 'current_balance'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setWallet(prev => ({
            ...prev,
            tokenBalance: data.ai_tokens ?? 0,
            totalSpentLKR: data.total_lifetime_spend_lkr ?? 0,
            autoReloadEnabled: data.auto_reload_enabled ?? false,
            autoReloadThreshold: data.auto_reload_threshold ?? 10,
            autoReloadPackage: data.auto_reload_package ?? 'pack_100',
            isLoading: false,
          }));
        } else {
          // No wallet doc yet — user hasn't topped up
          setWallet(prev => ({
            ...prev,
            tokenBalance: 0,
            totalSpentLKR: 0,
            isLoading: false,
          }));
        }
      },
      (error) => {
        console.error('[Wallet] Firestore listener error:', error);
        setWallet(prev => ({ ...prev, isLoading: false }));
      }
    );

    // Subscribe to saved payment method
    const unsubCard = onSnapshot(
      doc(firestoreDb, 'users', userId, 'payment_methods', 'payhere_card'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          const maskedValue = data.masked_card || data.card_masked || '';
          const last4 = typeof maskedValue === 'string'
            ? (maskedValue.match(/(\d{4})$/)?.[1] || maskedValue.replace(/\D/g, '').slice(-4) || '****')
            : '****';
          setWallet(prev => ({
            ...prev,
            savedCard: data.customer_token ? {
              masked: last4,
              type: data.card_type || data.card_brand || 'Card',
              customerToken: data.customer_token,
            } : null,
            autoReloadEnabled: data.auto_reload_enabled ?? prev.autoReloadEnabled,
            autoReloadThreshold: data.auto_reload_threshold ?? prev.autoReloadThreshold,
            autoReloadPackage: data.auto_reload_package ?? prev.autoReloadPackage,
          }));
        }
      },
      (error) => {
        console.warn('[Wallet] Card listener error:', error);
      }
    );

    return () => {
      unsubBalance();
      unsubCard();
    };
  }, [userId]);

  // Persist wallet state to localStorage (for instant UI on next load)
  useEffect(() => {
    if (!userId || wallet.isLoading) return;
    const { isLoading, showBuyModal, showOutOfTokens, purchaseInProgress, ...persistable } = wallet;
    localStorage.setItem(`wallet_${userId}`, JSON.stringify(persistable));
  }, [wallet, userId]);

  // Spend tokens via Cloud Function (atomic server-side deduction)
  const spendTokens = useCallback(async (amount: number, description: string): Promise<boolean> => {
    if (wallet.tokenBalance < amount) {
      setWallet(prev => ({ ...prev, showOutOfTokens: true }));
      return false;
    }

    try {
      const spendFn = httpsCallable(walletFunctions, 'spendTokens');
      const result = await spendFn({ amount, feature: 'ai_tool', description });
      const data = result.data as { success: boolean; remaining_tokens?: number };

      if (data.success) {
        console.log(`[Wallet] Spent ${amount} tokens: ${description}. Remaining: ${data.remaining_tokens}`);
        return true;
      } else {
        setWallet(prev => ({ ...prev, showOutOfTokens: true }));
        return false;
      }
    } catch (error: any) {
      console.error('[Wallet] Token spend error:', error);
      // If server says insufficient, show modal
      if (error?.code === 'functions/failed-precondition') {
        setWallet(prev => ({ ...prev, showOutOfTokens: true }));
      }
      return false;
    }
  }, [wallet.tokenBalance]);

  const addTokens = useCallback((tokens: number, amountLKR: number) => {
    // This is now handled by the Firestore listener after server-side topup
    // Keep for backward compat / optimistic UI
    setWallet(prev => ({
      ...prev,
      tokenBalance: prev.tokenBalance + tokens,
      totalSpentLKR: prev.totalSpentLKR + amountLKR,
      lastTopUp: { date: new Date().toISOString(), tokens, amount: amountLKR },
      showOutOfTokens: false,
    }));
    console.log(`[Wallet] Added ${tokens} tokens (LKR ${amountLKR.toLocaleString()})`);
  }, []);

  const linkPayHereCard = useCallback(async (packageId?: string): Promise<boolean> => {
    if (!userId) return false;

    setWallet(prev => ({ ...prev, purchaseInProgress: true }));

    try {
      const initFn = httpsCallable(walletFunctions, 'initPayHerePreapproval');
      const result = await initFn({ packageId });
      const payload = result.data as PayHereFormPayload;

      if (!payload?.actionUrl || !payload?.fields) {
        throw new Error('PayHere did not return checkout fields');
      }

      submitPayHereForm(payload);
      return true;
    } catch (error) {
      console.error('[Wallet] PayHere card link error:', error);
      setWallet(prev => ({ ...prev, purchaseInProgress: false }));
      return false;
    }
  }, [userId]);

  const toggleAutoReload = useCallback(async (enabled: boolean) => {
    if (enabled && !wallet.savedCard) {
      await linkPayHereCard();
      return;
    }

    setWallet(prev => ({ ...prev, autoReloadEnabled: enabled }));

    try {
      const updateFn = httpsCallable(walletFunctions, 'updatePayHereAutoReload');
      await updateFn({
        enabled,
        threshold: wallet.autoReloadThreshold,
        packageId: wallet.autoReloadPackage,
      });
    } catch (error) {
      console.error('[Wallet] Auto-reload update error:', error);
      setWallet(prev => ({ ...prev, autoReloadEnabled: !enabled }));
      if (typeof window !== 'undefined') {
        window.alert(paymentErrorMessage(error, 'Unable to update auto-reload. Please try again later.'));
      }
    }
  }, [linkPayHereCard, wallet.autoReloadPackage, wallet.autoReloadThreshold, wallet.savedCard]);

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

  // 1-Click purchase via Cloud Function (charges saved PayHere card)
  const oneClickPurchase = useCallback(async (packageId: string): Promise<boolean> => {
    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return false;

    if (!wallet.savedCard) {
      // No saved card — send the user through PayHere preapproval with this package.
      return linkPayHereCard(packageId);
    }

    setWallet(prev => ({ ...prev, purchaseInProgress: true }));

    try {
      const topUpFn = httpsCallable(walletFunctions, 'oneClickTopUp');
      const result = await topUpFn({ packageId });
      const data = result.data as { success: boolean; new_balance?: number };

      if (data.success) {
        console.log(`[Wallet] 1-Click topup success: ${pkg.label}. New balance: ${data.new_balance}`);
        setWallet(prev => ({
          ...prev,
          purchaseInProgress: false,
          showBuyModal: false,
          lastTopUp: { date: new Date().toISOString(), tokens: pkg.tokens, amount: pkg.price_lkr },
        }));
        // Balance will auto-update via Firestore listener
        return true;
      } else {
        setWallet(prev => ({ ...prev, purchaseInProgress: false }));
        return false;
      }
    } catch (error: any) {
      console.error('[Wallet] 1-Click topup error:', error);
      setWallet(prev => ({ ...prev, purchaseInProgress: false }));
      // If card is expired/invalid, prompt to re-add
      if (error?.code === 'functions/failed-precondition') {
        await linkPayHereCard(packageId);
      }
      return false;
    }
  }, [linkPayHereCard, wallet.savedCard]);

  return {
    ...wallet,
    spendTokens,
    addTokens,
    toggleAutoReload,
    setAutoReloadPackage,
    openBuyModal,
    closeBuyModal,
    dismissOutOfTokens,
    linkPayHereCard,
    oneClickPurchase,
    purchaseTokens: oneClickPurchase,
  };
}

export default useTokenWallet;
