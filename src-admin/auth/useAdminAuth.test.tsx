import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getRedirectResult, onAuthStateChanged, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { useAdminAuth } from './useAdminAuth';

vi.mock('../shared/api/adminApi', () => ({
  adminApi: {
    verifyAdminAccess: vi.fn(),
  },
}));

describe('useAdminAuth Google login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRedirectResult).mockResolvedValue(null);
    vi.mocked(signInWithRedirect).mockResolvedValue(undefined as never);
    vi.mocked(onAuthStateChanged).mockImplementation((_auth: any, callback: any) => {
      callback(null);
      return vi.fn();
    });
  });

  it('falls back to redirect when Google popup is blocked', async () => {
    vi.mocked(signInWithPopup).mockRejectedValue({
      code: 'auth/popup-blocked',
      message: 'Firebase: Error (auth/popup-blocked).',
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(true);
  });

  it('does not redirect when the user closes the Google popup', async () => {
    vi.mocked(signInWithPopup).mockRejectedValue({
      code: 'auth/popup-closed-by-user',
      message: 'The popup has been closed by the user.',
    });

    const { result } = renderHook(() => useAdminAuth());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.loginWithGoogle();
    });

    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Google sign-in was cancelled.');
  });
});
