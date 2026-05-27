import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../shared/firebase/config';
import type { AdminConfig, AdminRole } from '../../../shared/types/admin';

export interface ProfessionSettingsData {
  verification_required: boolean;
  auto_approve: boolean;
  custom_verification_label: string;
  welcome_message: string;
  max_free_ai_notes: number;
}

export interface AdminUserPayload {
  targetUid: string;
  role: AdminRole;
  professions: string[];
  displayName: string;
}

async function callAdminFunction<TInput, TOutput>(name: string, payload?: TInput): Promise<TOutput> {
  const fn = httpsCallable<TInput | undefined, TOutput>(functions, name);
  const result = payload === undefined ? await fn() : await fn(payload);
  return result.data;
}

export const adminApi = {
  verifyAdminAccess: () =>
    callAdminFunction<void, { role: AdminRole; professions: string[] }>('verifyAdminAccess'),

  getGlobalStats: <TOutput>() =>
    callAdminFunction<void, TOutput>('getGlobalStats'),

  getProfessionStats: <TOutput>(profession: string) =>
    callAdminFunction<{ profession: string }, TOutput>('getProfessionStats', { profession }),

  getAuditLog: <TOutput>(params: { profession?: string; action?: string; limit?: number }) =>
    callAdminFunction<typeof params, TOutput>('getAuditLog', params),

  getProfessionUsers: <TOutput>(params: { profession: string; status?: string; limit?: number; startAfter?: string | null }) =>
    callAdminFunction<typeof params, TOutput>('getProfessionUsers', params),

  approveUser: (userId: string) =>
    callAdminFunction<{ userId: string }, { success: boolean; message: string }>('approveDoctor', { userId }),

  suspendUser: (userId: string, reason: string) =>
    callAdminFunction<{ userId: string; reason: string }, { success: boolean; message: string }>('suspendUser', { userId, reason }),

  overrideSubscription: (userId: string, tier: string, reason: string) =>
    callAdminFunction<{ userId: string; tier: string; reason: string }, { success: boolean; message: string }>(
      'overrideSubscription',
      { userId, tier, reason }
    ),

  listAdminUsers: <TOutput>() =>
    callAdminFunction<void, TOutput>('listAdminUsers'),

  assignAdminRole: (payload: AdminUserPayload) =>
    callAdminFunction<AdminUserPayload, { success: boolean }>('assignAdminRole', payload),

  removeAdminRole: (targetUid: string) =>
    callAdminFunction<{ targetUid: string }, { success: boolean }>('removeAdminRole', { targetUid }),

  getAdminConfig: () =>
    callAdminFunction<void, { config: AdminConfig }>('getAdminConfig'),

  updateAdminConfig: (config: AdminConfig) =>
    callAdminFunction<AdminConfig, { success: boolean; config: AdminConfig }>('updateAdminConfig', config),

  getProfessionConfig: (profession: string) =>
    callAdminFunction<{ profession: string }, { settings: ProfessionSettingsData }>('getProfessionConfig', { profession }),

  updateProfessionConfig: (profession: string, settings: ProfessionSettingsData) =>
    callAdminFunction<{ profession: string; settings: ProfessionSettingsData }, { success: boolean; settings: ProfessionSettingsData }>(
      'updateProfessionConfig',
      { profession, settings }
    ),
};
