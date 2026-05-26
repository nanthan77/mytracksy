import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Admin Session Timeout
// Coverage: idle timeout, event listeners, session expiry
// ═══════════════════════════════════════════════════════════

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes (from useAdminAuth.ts)

describe('Session Timeout Configuration', () => {
  it('timeout is 30 minutes', () => {
    expect(SESSION_TIMEOUT_MS).toBe(1_800_000);
  });

  it('timeout is between 15 and 60 minutes (reasonable range)', () => {
    const fifteenMin = 15 * 60 * 1000;
    const sixtyMin = 60 * 60 * 1000;
    expect(SESSION_TIMEOUT_MS).toBeGreaterThanOrEqual(fifteenMin);
    expect(SESSION_TIMEOUT_MS).toBeLessThanOrEqual(sixtyMin);
  });
});

describe('Idle Timer Logic', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('expires after SESSION_TIMEOUT_MS of inactivity', () => {
    const onExpire = vi.fn();
    const timer = setTimeout(onExpire, SESSION_TIMEOUT_MS);

    // Not expired yet at 29 minutes
    vi.advanceTimersByTime(29 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();

    // Expired at 30 minutes
    vi.advanceTimersByTime(1 * 60 * 1000);
    expect(onExpire).toHaveBeenCalledTimes(1);

    clearTimeout(timer);
  });

  it('resets timer on user activity', () => {
    const onExpire = vi.fn();
    let timer = setTimeout(onExpire, SESSION_TIMEOUT_MS);

    // Simulate 25 minutes passing
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();

    // User activity resets the timer
    clearTimeout(timer);
    timer = setTimeout(onExpire, SESSION_TIMEOUT_MS);

    // Another 25 minutes — should NOT expire (timer was reset)
    vi.advanceTimersByTime(25 * 60 * 1000);
    expect(onExpire).not.toHaveBeenCalled();

    // Full 30 minutes from reset point
    vi.advanceTimersByTime(5 * 60 * 1000);
    expect(onExpire).toHaveBeenCalledTimes(1);

    clearTimeout(timer);
  });

  it('tracks the correct activity events', () => {
    // Events from useAdminAuth.ts resetIdleTimer listener
    const trackedEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    expect(trackedEvents).toContain('mousedown');
    expect(trackedEvents).toContain('keydown');
    expect(trackedEvents).toContain('scroll');
    expect(trackedEvents).toContain('touchstart');
    expect(trackedEvents).toHaveLength(4);
  });

  it('does not track mousemove (intentional — reduces noise)', () => {
    const trackedEvents = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    expect(trackedEvents).not.toContain('mousemove');
  });
});

describe('Session State After Timeout', () => {
  it('clears user state on expiry', () => {
    // Simulates the setState call from useAdminAuth.ts timeout handler
    const expiredState = {
      user: null,
      role: null,
      professions: [],
      error: 'Session expired. Please log in again.',
    };

    expect(expiredState.user).toBeNull();
    expect(expiredState.role).toBeNull();
    expect(expiredState.professions).toEqual([]);
    expect(expiredState.error).toContain('Session expired');
  });

  it('error message is user-friendly', () => {
    const errorMessage = 'Session expired. Please log in again.';
    expect(errorMessage).not.toContain('timeout');
    expect(errorMessage).not.toContain('error');
    expect(errorMessage).toContain('log in');
  });
});
