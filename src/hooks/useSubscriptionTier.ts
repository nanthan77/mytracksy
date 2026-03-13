import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { TierKey } from '../config/pricingConfig';

export interface SubscriptionState {
  tier: TierKey;
  status: 'active' | 'past_due' | 'canceled' | 'none';
  loading: boolean;
  isPro: boolean;
  isChambers: boolean;
  isFree: boolean;
}

/**
 * Centralized hook to check the current user's subscription tier.
 * Listens to Firestore `users/{uid}/subscription/current` in real-time.
 */
export function useSubscriptionTier(): SubscriptionState {
  const { currentUser } = useAuth();
  const [tier, setTier] = useState<TierKey>('free');
  const [status, setStatus] = useState<'active' | 'past_due' | 'canceled' | 'none'>('none');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setTier('free');
      setStatus('none');
      setLoading(false);
      return;
    }

    const subRef = doc(db, 'users', currentUser.uid, 'subscription', 'current');
    const unsub = onSnapshot(subRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const subTier = (data.tier as TierKey) || 'free';
        const subStatus = data.status || 'none';

        // Only count as active tier if subscription is active
        if (subStatus === 'active') {
          setTier(subTier);
        } else {
          setTier('free');
        }
        setStatus(subStatus);
      } else {
        setTier('free');
        setStatus('none');
      }
      setLoading(false);
    }, (err) => {
      console.error('Subscription listener error:', err);
      setTier('free');
      setStatus('none');
      setLoading(false);
    });

    return () => unsub();
  }, [currentUser?.uid]);

  return {
    tier,
    status,
    loading,
    isPro: tier === 'pro' || tier === 'chambers',
    isChambers: tier === 'chambers',
    isFree: tier === 'free',
  };
}
