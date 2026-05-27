import * as functions from 'firebase-functions/v1';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { requireRole } from './adminRoles';

const db = getFirestore();

interface AdminConfig {
  session_timeout_minutes: number;
  maintenance_mode: boolean;
  rate_limit_per_minute: number;
}

interface ProfessionSettingsData {
  verification_required: boolean;
  auto_approve: boolean;
  custom_verification_label: string;
  welcome_message: string;
  max_free_ai_notes: number;
}

const DEFAULT_ADMIN_CONFIG: AdminConfig = {
  session_timeout_minutes: 30,
  maintenance_mode: false,
  rate_limit_per_minute: 100,
};

const DEFAULT_PROFESSION_SETTINGS: ProfessionSettingsData = {
  verification_required: true,
  auto_approve: false,
  custom_verification_label: '',
  welcome_message: '',
  max_free_ai_notes: 5,
};

function assertNumberRange(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new functions.https.HttpsError('invalid-argument', `${field} must be between ${min} and ${max}`);
  }
  return Math.round(value);
}

function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new functions.https.HttpsError('invalid-argument', `${field} must be true or false`);
  }
  return value;
}

function assertString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', `${field} must be text`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new functions.https.HttpsError('invalid-argument', `${field} must be ${maxLength} characters or less`);
  }
  return trimmed;
}

export function validateAdminConfigInput(input: Partial<AdminConfig>): AdminConfig {
  return {
    session_timeout_minutes: assertNumberRange(input.session_timeout_minutes, 'session_timeout_minutes', 15, 60),
    maintenance_mode: assertBoolean(input.maintenance_mode, 'maintenance_mode'),
    rate_limit_per_minute: assertNumberRange(input.rate_limit_per_minute, 'rate_limit_per_minute', 10, 1000),
  };
}

export function validateProfessionSettingsInput(input: Partial<ProfessionSettingsData>): ProfessionSettingsData {
  return {
    verification_required: assertBoolean(input.verification_required, 'verification_required'),
    auto_approve: assertBoolean(input.auto_approve, 'auto_approve'),
    custom_verification_label: assertString(input.custom_verification_label || '', 'custom_verification_label', 80),
    welcome_message: assertString(input.welcome_message || '', 'welcome_message', 500),
    max_free_ai_notes: assertNumberRange(input.max_free_ai_notes, 'max_free_ai_notes', 0, 100),
  };
}

export const getAdminConfig = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    await requireRole(context, ['super_admin']);
    const snap = await db.doc('system_settings/admin_config').get();
    return { config: { ...DEFAULT_ADMIN_CONFIG, ...(snap.data() || {}) } };
  }
);

export const updateAdminConfig = functions.region('asia-south1').https.onCall(
  async (data: Partial<AdminConfig>, context) => {
    const caller = await requireRole(context, ['super_admin']);
    const config = validateAdminConfigInput(data || {});

    await db.doc('system_settings/admin_config').set({
      ...config,
      updated_at: FieldValue.serverTimestamp(),
      updated_by: caller.uid,
    }, { merge: true });

    await db.collection('admin_audit_log').add({
      action: 'update_admin_config',
      performed_by: caller.uid,
      role: caller.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      reason: 'Updated global admin settings',
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, config };
  }
);

export const getProfessionConfig = functions.region('asia-south1').https.onCall(
  async (data: { profession: string }, context) => {
    const profession = data?.profession;
    if (!profession) throw new functions.https.HttpsError('invalid-argument', 'profession is required');
    await requireRole(context, ['super_admin', 'profession_admin', 'support_agent', 'viewer'], profession);

    const snap = await db.doc(`system_settings/profession_config_${profession}`).get();
    return { settings: { ...DEFAULT_PROFESSION_SETTINGS, ...(snap.data() || {}) } };
  }
);

export const updateProfessionConfig = functions.region('asia-south1').https.onCall(
  async (data: { profession: string; settings: Partial<ProfessionSettingsData> }, context) => {
    const profession = data?.profession;
    if (!profession) throw new functions.https.HttpsError('invalid-argument', 'profession is required');
    const caller = await requireRole(context, ['super_admin', 'profession_admin'], profession);
    const settings = validateProfessionSettingsInput(data.settings || {});

    await db.doc(`system_settings/profession_config_${profession}`).set({
      ...settings,
      updated_at: FieldValue.serverTimestamp(),
      updated_by: caller.uid,
    }, { merge: true });

    await db.collection('admin_audit_log').add({
      action: 'update_profession_config',
      performed_by: caller.uid,
      role: caller.role,
      profession,
      ip_address: context.rawRequest?.ip || 'unknown',
      reason: `Updated ${profession} settings`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true, settings };
  }
);
