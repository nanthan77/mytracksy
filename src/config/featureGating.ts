import { TierKey } from './pricingConfig';

/**
 * Feature gating configuration.
 * Maps nav item IDs to their required subscription tier.
 * Items not listed here are available to all tiers (free).
 */

export type FeatureTier = {
  requiredTier: TierKey;
  /** Short label shown on the lock badge */
  badge: string;
  /** Description shown in upgrade prompt */
  upgradePrompt: string;
};

/**
 * Medical profession feature tiers.
 * 'free' = available to everyone
 * 'pro' = requires Pro subscription
 * 'chambers' = requires Chambers/Enterprise (not used for medical yet)
 */
const medicalFeatureGating: Record<string, FeatureTier> = {
  // Pro-only features
  briefing: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'AI Ward Round briefings require a Pro subscription.',
  },
  voicevault: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Unlimited AI Voice Vault requires a Pro subscription.',
  },
  scheduler: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Smart Scheduler requires a Pro subscription.',
  },
  lifeadmin: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Life Admin requires a Pro subscription.',
  },
  prescriptions: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Prescription Manager requires a Pro subscription.',
  },
  tax: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Tax Automation & IRD filing requires a Pro subscription.',
  },
  export: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Auditor Export requires a Pro subscription.',
  },
  reports: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Advanced Reports require a Pro subscription.',
  },
};

/**
 * Legal profession feature tiers.
 */
const legalFeatureGating: Record<string, FeatureTier> = {
  voicevault: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Unlimited AI Voice Vault requires an Independent Counsel subscription.',
  },
  briefing: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'AI Case Briefing requires an Independent Counsel subscription.',
  },
  scheduler: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Smart Scheduler requires an Independent Counsel subscription.',
  },
  lifeadmin: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Life Admin requires an Independent Counsel subscription.',
  },
  export: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Auditor Export requires an Independent Counsel subscription.',
  },
};

/**
 * Aquaculture profession feature tiers.
 */
const aquacultureFeatureGating: Record<string, FeatureTier> = {
  voicevault: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Unlimited Voice AI Logs require a Single Farm subscription.',
  },
  briefing: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Farm Briefing requires a Single Farm subscription.',
  },
};

const studiosFeatureGating: Record<string, FeatureTier> = {
  milestones: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Automated milestone reminders require the Premium Wedding Pro plan.',
  },
  tax: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'The full gear depreciation shield requires the Premium Wedding Pro plan.',
  },
  contracts: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'AI contract generation requires the Premium Wedding Pro plan.',
  },
  voice: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'Voice note shot-list decoding requires the Premium Wedding Pro plan.',
  },
  diplomat: {
    requiredTier: 'pro',
    badge: 'PRO',
    upgradePrompt: 'The client diplomat requires the Premium Wedding Pro plan.',
  },
};

const gatingRegistry: Record<string, Record<string, FeatureTier>> = {
  medical: medicalFeatureGating,
  legal: legalFeatureGating,
  aquaculture: aquacultureFeatureGating,
  studios: studiosFeatureGating,
};

/**
 * Get the feature gating config for a given profession.
 */
export function getFeatureGating(profession: string): Record<string, FeatureTier> {
  return gatingRegistry[profession] || {};
}

/**
 * Check if a feature is accessible for a given tier.
 */
export function isFeatureAccessible(
  featureId: string,
  userTier: TierKey,
  profession: string
): boolean {
  const gating = getFeatureGating(profession);
  const featureConfig = gating[featureId];

  // If no gating config, feature is free for all
  if (!featureConfig) return true;

  const tierHierarchy: Record<TierKey, number> = {
    free: 0,
    pro: 1,
    chambers: 2,
  };

  return tierHierarchy[userTier] >= tierHierarchy[featureConfig.requiredTier];
}

/**
 * Get the badge/tier info for a feature (if gated).
 */
export function getFeatureTierInfo(
  featureId: string,
  profession: string
): FeatureTier | null {
  const gating = getFeatureGating(profession);
  return gating[featureId] || null;
}
