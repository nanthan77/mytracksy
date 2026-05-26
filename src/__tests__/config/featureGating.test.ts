import { describe, it, expect } from 'vitest';
import {
  getFeatureGating,
  isFeatureAccessible,
  getFeatureTierInfo,
} from '../../config/featureGating';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Feature Gating (Subscription Tiers)
// Coverage: tier hierarchy, access control, feature lookup
// ═══════════════════════════════════════════════════════════

describe('getFeatureGating', () => {
  it('returns medical feature gating', () => {
    const gating = getFeatureGating('medical');
    expect(gating).toBeDefined();
    expect(gating['briefing']).toBeDefined();
    expect(gating['briefing'].requiredTier).toBe('pro');
  });

  it('returns legal feature gating', () => {
    const gating = getFeatureGating('legal');
    expect(gating).toBeDefined();
    expect(gating['voicevault']).toBeDefined();
  });

  it('returns aquaculture feature gating', () => {
    const gating = getFeatureGating('aquaculture');
    expect(gating).toBeDefined();
    expect(gating['voicevault']).toBeDefined();
  });

  it('returns studios feature gating', () => {
    const gating = getFeatureGating('studios');
    expect(gating).toBeDefined();
    expect(gating['milestones']).toBeDefined();
  });

  it('returns empty object for unregistered profession', () => {
    const gating = getFeatureGating('individual');
    expect(gating).toEqual({});
  });
});

describe('isFeatureAccessible', () => {
  // Medical profession tests
  it('denies free user from pro feature', () => {
    expect(isFeatureAccessible('briefing', 'free', 'medical')).toBe(false);
  });

  it('allows pro user to access pro feature', () => {
    expect(isFeatureAccessible('briefing', 'pro', 'medical')).toBe(true);
  });

  it('allows chambers user to access pro feature', () => {
    expect(isFeatureAccessible('briefing', 'chambers', 'medical')).toBe(true);
  });

  // Ungated feature tests
  it('allows any tier for ungated features', () => {
    expect(isFeatureAccessible('dashboard', 'free', 'medical')).toBe(true);
    expect(isFeatureAccessible('expenses', 'free', 'individual')).toBe(true);
  });

  // Unknown profession
  it('allows all features for unregistered profession', () => {
    expect(isFeatureAccessible('anything', 'free', 'trading')).toBe(true);
  });

  // Tier hierarchy tests
  it('respects tier hierarchy: free < pro < chambers', () => {
    // Free user cannot access pro features
    expect(isFeatureAccessible('voicevault', 'free', 'medical')).toBe(false);
    // Pro user can access pro features
    expect(isFeatureAccessible('voicevault', 'pro', 'medical')).toBe(true);
    // Chambers user can access pro features
    expect(isFeatureAccessible('voicevault', 'chambers', 'medical')).toBe(true);
  });
});

describe('getFeatureTierInfo', () => {
  it('returns tier info for gated feature', () => {
    const info = getFeatureTierInfo('briefing', 'medical');
    expect(info).not.toBeNull();
    expect(info?.requiredTier).toBe('pro');
    expect(info?.badge).toBe('PRO');
    expect(info?.upgradePrompt).toContain('Pro subscription');
  });

  it('returns null for ungated feature', () => {
    const info = getFeatureTierInfo('dashboard', 'medical');
    expect(info).toBeNull();
  });

  it('returns null for unknown profession', () => {
    const info = getFeatureTierInfo('briefing', 'individual');
    expect(info).toBeNull();
  });

  it('returns studios feature info', () => {
    const info = getFeatureTierInfo('milestones', 'studios');
    expect(info).not.toBeNull();
    expect(info?.upgradePrompt).toContain('Premium Wedding Pro');
  });
});
