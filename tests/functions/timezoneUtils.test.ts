import { describe, expect, it } from 'vitest';
import { addColomboDays, getColomboDateKey, getColomboDayRange } from '../../functions/src/timezoneUtils';

describe('timezoneUtils', () => {
  it('formats Colombo date keys using local Colombo day', () => {
    const utcLateNight = new Date('2026-03-11T21:00:00.000Z');
    expect(getColomboDateKey(utcLateNight)).toBe('2026-03-12');
  });

  it('adds Colombo days without drifting to UTC day boundaries', () => {
    const base = new Date('2026-03-11T20:00:00.000Z');
    expect(getColomboDateKey(addColomboDays(base, 1))).toBe('2026-03-13');
    expect(getColomboDateKey(addColomboDays(base, -1))).toBe('2026-03-11');
  });

  it('returns the UTC range for a Colombo-local day', () => {
    const { start, end } = getColomboDayRange(new Date('2026-03-12T01:00:00.000Z'));
    expect(start.toISOString()).toBe('2026-03-11T18:30:00.000Z');
    expect(end.toISOString()).toBe('2026-03-12T18:29:59.999Z');
  });
});
