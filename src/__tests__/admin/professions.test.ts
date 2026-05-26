import { describe, it, expect } from 'vitest';
import { PROFESSIONS, PROFESSION_MAP } from '../../../shared/constants/professions';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Admin Profession Constants
// Coverage: profession config structure, map lookup, data integrity
// ═══════════════════════════════════════════════════════════

describe('PROFESSIONS', () => {
  it('contains all configured professions', () => {
    expect(PROFESSIONS).toHaveLength(15);
  });

  it('has unique IDs', () => {
    const ids = PROFESSIONS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('has unique routes', () => {
    const routes = PROFESSIONS.map((p) => p.route);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('each profession has all required fields', () => {
    PROFESSIONS.forEach((p) => {
      expect(p.id).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.icon).toBeTruthy();
      expect(p.route).toMatch(/^\//);
      expect(p.verificationField).toBeTruthy();
      expect(p.verificationLabel).toBeTruthy();
      expect(p.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  it('includes all expected professions', () => {
    const ids = PROFESSIONS.map((p) => p.id);
    expect(ids).toContain('medical');
    expect(ids).toContain('legal');
    expect(ids).toContain('business');
    expect(ids).toContain('engineering');
    expect(ids).toContain('trading');
    expect(ids).toContain('automotive');
    expect(ids).toContain('marketing');
    expect(ids).toContain('travel');
    expect(ids).toContain('transportation');
    expect(ids).toContain('retail');
    expect(ids).toContain('aquaculture');
    expect(ids).toContain('tourism');
    expect(ids).toContain('creator');
    expect(ids).toContain('studios');
    expect(ids).toContain('individual');
  });

  it('medical profession has SLMC verification', () => {
    const medical = PROFESSIONS.find((p) => p.id === 'medical');
    expect(medical?.verificationField).toBe('slmc_number');
    expect(medical?.verificationLabel).toBe('SLMC Number');
  });

  it('legal profession has bar registration', () => {
    const legal = PROFESSIONS.find((p) => p.id === 'legal');
    expect(legal?.verificationField).toBe('bar_registration');
    expect(legal?.verificationLabel).toBe('Bar Registration');
  });

  it('aquaculture profession has NAQDA license', () => {
    const aqua = PROFESSIONS.find((p) => p.id === 'aquaculture');
    expect(aqua?.verificationField).toBe('naqda_license');
    expect(aqua?.verificationLabel).toBe('NAQDA License');
  });

  it('travel profession has SLTDA license', () => {
    const travel = PROFESSIONS.find((p) => p.id === 'travel');
    expect(travel?.verificationField).toBe('sltda_license');
    expect(travel?.verificationLabel).toBe('SLTDA License');
  });

  it('individual uses NIC number for verification', () => {
    const individual = PROFESSIONS.find((p) => p.id === 'individual');
    expect(individual?.verificationField).toBe('nic_number');
    expect(individual?.verificationLabel).toBe('NIC Number');
  });
});

describe('PROFESSION_MAP', () => {
  it('maps all profession IDs', () => {
    PROFESSIONS.forEach((p) => {
      expect(PROFESSION_MAP[p.id]).toBeDefined();
      expect(PROFESSION_MAP[p.id].id).toBe(p.id);
    });
  });

  it('returns correct config by ID', () => {
    expect(PROFESSION_MAP['medical'].label).toBe('Medical');
    expect(PROFESSION_MAP['legal'].label).toBe('Legal');
    expect(PROFESSION_MAP['engineering'].label).toBe('Engineering');
  });

  it('returns undefined for unknown ID', () => {
    expect(PROFESSION_MAP['unknown']).toBeUndefined();
  });

  it('preserves all fields in map', () => {
    const medical = PROFESSION_MAP['medical'];
    expect(medical.id).toBe('medical');
    expect(medical.label).toBe('Medical');
    expect(medical.icon).toBe('🩺');
    expect(medical.route).toBe('/dr');
    expect(medical.verificationField).toBe('slmc_number');
    expect(medical.verificationLabel).toBe('SLMC Number');
    expect(medical.color).toBe('#E53E3E');
  });
});
