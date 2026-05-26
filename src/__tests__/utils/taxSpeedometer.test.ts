import { describe, expect, it } from 'vitest';
import { calculateTax, PERSONAL_RELIEF, TAX_BRACKETS } from '../../components/TaxSpeedometer';

describe('TaxSpeedometer 2025/2026 Sri Lankan tax rules', () => {
  it('uses the current IRD personal relief', () => {
    expect(PERSONAL_RELIEF).toBe(1_800_000);
  });

  it('uses the current IRD progressive individual slabs', () => {
    expect(TAX_BRACKETS.map(({ max, rate }) => ({ max, rate }))).toEqual([
      { max: 1_000_000, rate: 0.06 },
      { max: 1_500_000, rate: 0.18 },
      { max: 2_000_000, rate: 0.24 },
      { max: 2_500_000, rate: 0.30 },
      { max: Infinity, rate: 0.36 },
    ]);
  });

  it('calculates progressive tax for boundary amounts', () => {
    expect(calculateTax(1_000_000).tax).toBe(60_000);
    expect(calculateTax(1_500_000).tax).toBe(150_000);
    expect(calculateTax(2_500_000).tax).toBe(420_000);
    expect(calculateTax(3_000_000).tax).toBe(600_000);
  });
});
