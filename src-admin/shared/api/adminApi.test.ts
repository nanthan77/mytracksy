import { beforeEach, describe, expect, it, vi } from 'vitest';
import { httpsCallable } from 'firebase/functions';
import { adminApi } from './adminApi';
import { functions } from '../../../shared/firebase/config';

vi.mock('../../../shared/firebase/config', () => ({
  functions: { region: 'asia-south1' },
}));

describe('adminApi callable payloads', () => {
  const callable = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    callable.mockResolvedValue({ data: { success: true } });
    vi.mocked(httpsCallable).mockReturnValue(callable as never);
  });

  it('sends the production approve user payload', async () => {
    await adminApi.approveUser('user-123');

    expect(httpsCallable).toHaveBeenCalledWith(functions, 'approveDoctor');
    expect(callable).toHaveBeenCalledWith({ userId: 'user-123' });
  });

  it('sends the production suspend user payload', async () => {
    await adminApi.suspendUser('user-123', 'Compliance review');

    expect(httpsCallable).toHaveBeenCalledWith(functions, 'suspendUser');
    expect(callable).toHaveBeenCalledWith({ userId: 'user-123', reason: 'Compliance review' });
  });

  it('sends the production subscription override payload', async () => {
    await adminApi.overrideSubscription('user-123', 'chambers', 'Paid by invoice');

    expect(httpsCallable).toHaveBeenCalledWith(functions, 'overrideSubscription');
    expect(callable).toHaveBeenCalledWith({ userId: 'user-123', tier: 'chambers', reason: 'Paid by invoice' });
  });

  it('sends role management payloads through the guarded callable', async () => {
    await adminApi.assignAdminRole({
      targetUid: 'admin-1',
      role: 'profession_admin',
      professions: ['medical'],
      displayName: 'Medical Admin',
    });

    expect(httpsCallable).toHaveBeenCalledWith(functions, 'assignAdminRole');
    expect(callable).toHaveBeenCalledWith({
      targetUid: 'admin-1',
      role: 'profession_admin',
      professions: ['medical'],
      displayName: 'Medical Admin',
    });
  });

  it('sends settings changes through protected callables', async () => {
    await adminApi.updateAdminConfig({
      session_timeout_minutes: 30,
      maintenance_mode: false,
      rate_limit_per_minute: 100,
    });

    expect(httpsCallable).toHaveBeenCalledWith(functions, 'updateAdminConfig');
    expect(callable).toHaveBeenCalledWith({
      session_timeout_minutes: 30,
      maintenance_mode: false,
      rate_limit_per_minute: 100,
    });
  });
});
