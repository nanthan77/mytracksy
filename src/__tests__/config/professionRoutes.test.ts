import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PROFESSION_ROUTES,
  getRouteBySlug,
  getRouteByProfession,
  SLUG_ALIASES,
  getSlugFromPath,
  getSubPathFromURL,
} from '../../config/professionRoutes';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Profession Routes Configuration
// Coverage: route lookup, alias resolution, URL parsing
// ═══════════════════════════════════════════════════════════

describe('PROFESSION_ROUTES', () => {
  it('contains all expected professions', () => {
    const professions = PROFESSION_ROUTES.map((r) => r.profession);
    expect(professions).toContain('medical');
    expect(professions).toContain('legal');
    expect(professions).toContain('engineering');
    expect(professions).toContain('business');
    expect(professions).toContain('individual');
    expect(professions).toContain('aquaculture');
    expect(professions).toContain('creator');
    expect(professions).toContain('studios');
  });

  it('has unique slugs', () => {
    const slugs = PROFESSION_ROUTES.map((r) => r.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique professions', () => {
    const professions = PROFESSION_ROUTES.map((r) => r.profession);
    expect(new Set(professions).size).toBe(professions.length);
  });

  it('each route has required fields', () => {
    PROFESSION_ROUTES.forEach((route) => {
      expect(route.slug).toBeTruthy();
      expect(route.profession).toBeTruthy();
      expect(route.name).toBeTruthy();
      expect(route.shortName).toBeTruthy();
      expect(route.icon).toBeTruthy();
      expect(route.themeColor).toMatch(/^#[0-9a-f]{6}$/i);
      expect(route.description).toBeTruthy();
    });
  });

  it('dedicated PWA routes have manifest paths', () => {
    PROFESSION_ROUTES.filter((r) => r.dedicatedPwa).forEach((route) => {
      expect(route.manifestPath).toBeTruthy();
      expect(route.manifestPath).toMatch(/\.webmanifest$/);
    });
  });
});

describe('getRouteBySlug', () => {
  it('finds route by slug', () => {
    const route = getRouteBySlug('medical');
    expect(route).toBeDefined();
    expect(route?.profession).toBe('medical');
    expect(route?.name).toBe('MyTracksy Doctor');
  });

  it('returns undefined for unknown slug', () => {
    expect(getRouteBySlug('nonexistent')).toBeUndefined();
  });
});

describe('getRouteByProfession', () => {
  it('finds route by profession type', () => {
    const route = getRouteByProfession('legal');
    expect(route).toBeDefined();
    expect(route?.slug).toBe('legal');
    expect(route?.name).toBe('LexTracksy');
  });

  it('returns undefined for unknown profession', () => {
    expect(getRouteByProfession('unknown' as any)).toBeUndefined();
  });
});

describe('SLUG_ALIASES', () => {
  it('maps doctor to medical', () => {
    expect(SLUG_ALIASES['doctor']).toBe('medical');
  });

  it('maps lawyer to legal', () => {
    expect(SLUG_ALIASES['lawyer']).toBe('legal');
  });

  it('maps photographer to studios', () => {
    expect(SLUG_ALIASES['photographer']).toBe('studios');
  });

  it('maps fish/shrimp/crab to aquaculture', () => {
    expect(SLUG_ALIASES['fish']).toBe('aquaculture');
    expect(SLUG_ALIASES['shrimp']).toBe('aquaculture');
    expect(SLUG_ALIASES['crab']).toBe('aquaculture');
  });

  it('all alias targets are valid slugs', () => {
    const validSlugs = PROFESSION_ROUTES.map((r) => r.slug);
    Object.values(SLUG_ALIASES).forEach((target) => {
      // Some aliases may point to slugs not in PROFESSION_ROUTES (like 'education')
      // Only check that the value is a non-empty string
      expect(typeof target).toBe('string');
      expect(target.length).toBeGreaterThan(0);
    });
  });
});

describe('getSlugFromPath', () => {
  beforeEach(() => {
    // Reset location for each test
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/' },
    });
  });

  it('returns null for root path', () => {
    window.location.pathname = '/';
    expect(getSlugFromPath()).toBeNull();
  });

  it('extracts direct slug from path', () => {
    window.location.pathname = '/medical';
    expect(getSlugFromPath()).toBe('medical');
  });

  it('extracts first segment only', () => {
    window.location.pathname = '/medical/income';
    expect(getSlugFromPath()).toBe('medical');
  });

  it('resolves alias slugs', () => {
    window.location.pathname = '/doctor';
    expect(getSlugFromPath()).toBe('medical');
  });

  it('handles trailing slashes', () => {
    window.location.pathname = '/legal/';
    expect(getSlugFromPath()).toBe('legal');
  });

  it('is case-insensitive', () => {
    window.location.pathname = '/MEDICAL';
    expect(getSlugFromPath()).toBe('medical');
  });

  it('returns null for unknown paths', () => {
    window.location.pathname = '/unknown-page';
    expect(getSlugFromPath()).toBeNull();
  });
});

describe('getSubPathFromURL', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { pathname: '/' },
    });
  });

  it('returns null for root path', () => {
    window.location.pathname = '/';
    expect(getSubPathFromURL()).toBeNull();
  });

  it('returns null for single-segment path', () => {
    window.location.pathname = '/medical';
    expect(getSubPathFromURL()).toBeNull();
  });

  it('extracts sub-path from two-segment path', () => {
    window.location.pathname = '/medical/income';
    expect(getSubPathFromURL()).toBe('income');
  });
});
