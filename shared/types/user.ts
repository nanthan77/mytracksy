export type UserStatus = 'active' | 'pending_verification' | 'suspended';
export type SubscriptionTier = 'free' | 'pro' | 'lifetime';

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  profession: string;
  status: UserStatus;
  created_at: Date;
  verification_id?: string;
  hospital?: string;
  subscription: {
    tier: SubscriptionTier;
    status: string;
    provider: string;
    current_period_end?: Date;
    amount_cents?: number;
  };
  usage_quotas?: {
    ai_voice_notes_used: number;
  };
}
