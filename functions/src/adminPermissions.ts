import * as functions from 'firebase-functions/v1';
import { HttpsError as V2HttpsError } from 'firebase-functions/v2/https';
import { getAuth, UserRecord } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

// Founder/super-admin bootstrap accounts.
// Configurable via environment so access is revocable WITHOUT a code change:
//   firebase functions:secrets:set or .env → FOUNDER_UIDS="uid1,uid2"  FOUNDER_EMAILS="a@b.lk"
// Set FOUNDER_UIDS="-" and FOUNDER_EMAILS="-" to disable the bypass entirely
// (then admin access comes only from custom claims / admin_users docs).
const parseCsvEnv = (raw: string | undefined, fallback: string[]): string[] => {
  if (raw === undefined) return fallback;
  if (raw.trim() === '-' || raw.trim() === '') return [];
  return raw.split(',').map(s => s.trim()).filter(Boolean);
};

const FOUNDER_UIDS = parseCsvEnv(process.env.FOUNDER_UIDS, ['eyuHN6ZeYZgi2fSBM3bmslfzAhX2']);
const FOUNDER_EMAILS = parseCsvEnv(process.env.FOUNDER_EMAILS, ['ceo@mytracksy.lk', 'nanthan77@gmail.com']);

export const ADMIN_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'manage_roles',
    'view_analytics', 'send_notifications', 'manage_tax_engine',
    'view_audit_log', 'manage_ai_usage',
  ],
  profession_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'view_analytics',
    'send_notifications', 'view_audit_log',
  ],
  support_agent: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'view_audit_log',
  ],
  viewer: ['view_dashboard', 'view_analytics'],
};

export interface AdminIdentity {
  uid: string;
  email: string;
  role: AdminRole;
  professions: string[];
}

type CallableAuth = {
  uid: string;
  token?: Record<string, unknown>;
};

type CallableRequestLike = {
  auth?: CallableAuth;
  rawRequest?: {
    ip?: string;
    headers?: Record<string, unknown>;
  };
};

function isAdminRole(value: unknown): value is AdminRole {
  return (
    value === 'super_admin' ||
    value === 'profession_admin' ||
    value === 'support_agent' ||
    value === 'viewer'
  );
}

function normalizeProfessions(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function tokenString(token: Record<string, unknown> | undefined, key: string): string {
  const value = token?.[key];
  return typeof value === 'string' ? value : '';
}

function isFounder(uid: string, email: string): boolean {
  return FOUNDER_UIDS.includes(uid) || (email !== '' && FOUNDER_EMAILS.includes(email));
}

function roleFromRecord(user: UserRecord, token?: Record<string, unknown>): AdminRole | null {
  const email = user.email || tokenString(token, 'email');
  if (isFounder(user.uid, email)) return 'super_admin';

  const tokenRole = token?.admin_role;
  if (isAdminRole(tokenRole)) return tokenRole;

  const claimRole = user.customClaims?.admin_role;
  if (isAdminRole(claimRole)) return claimRole;

  if (token?.admin === true || user.customClaims?.admin === true) return 'super_admin';

  return null;
}

export function hasAdminPermission(role: AdminRole, permission?: string): boolean {
  if (!permission) return true;
  return ADMIN_PERMISSIONS[role]?.includes(permission) ?? false;
}

export async function resolveAdminIdentity(auth: CallableAuth): Promise<AdminIdentity | null> {
  const db = getFirestore();
  const user = await getAuth().getUser(auth.uid);
  const email = user.email || tokenString(auth.token, 'email');
  let role = roleFromRecord(user, auth.token);
  let professions = role === 'super_admin' ? ['all'] : normalizeProfessions(auth.token?.admin_professions);

  const adminDoc = await db.collection('admin_users').doc(auth.uid).get();
  if (adminDoc.exists) {
    const data = adminDoc.data() || {};
    if (data.status === 'disabled') return null;
    if (!role && isAdminRole(data.role)) role = data.role;
    if (!professions.length) professions = normalizeProfessions(data.professions);
  }

  if (!role) {
    const legacyDoc = await db.doc('system_settings/admin_users').get();
    const legacyUids = normalizeProfessions(legacyDoc.data()?.uids);
    if (legacyUids.includes(auth.uid)) {
      role = 'super_admin';
      professions = ['all'];
    }
  }

  if (!role) return null;
  if (role === 'super_admin') professions = ['all'];

  return { uid: auth.uid, email, role, professions };
}

async function isMaintenanceLocked(role: AdminRole): Promise<boolean> {
  if (role === 'super_admin') return false;
  const snap = await getFirestore().doc('system_settings/admin_config').get();
  return snap.data()?.maintenance_mode === true;
}

async function validateIpAllowlist(identity: AdminIdentity, requestIp: string): Promise<void> {
  const db = getFirestore();
  const adminDoc = await db.collection('admin_users').doc(identity.uid).get();
  if (!adminDoc.exists) return;

  const allowedIps = normalizeProfessions(adminDoc.data()?.allowed_ips);
  if (allowedIps.length > 0 && !allowedIps.includes(requestIp)) {
    await db.collection('admin_audit_log').add({
      action: 'ip_blocked',
      performed_by: identity.uid,
      role: identity.role,
      profession: 'system',
      ip_address: requestIp || 'unknown',
      reason: 'IP not in allowlist',
      timestamp: FieldValue.serverTimestamp(),
    });
    throw new functions.https.HttpsError('permission-denied', 'IP not allowed');
  }
}

async function recordDeniedAccess(auth: CallableAuth | undefined, reason: string, requestIp: string): Promise<void> {
  if (!auth?.uid) return;
  await getFirestore().collection('admin_audit_log').add({
    action: 'access_denied',
    performed_by: auth.uid,
    role: tokenString(auth.token, 'admin_role') || 'none',
    profession: 'system',
    ip_address: requestIp || 'unknown',
    reason,
    timestamp: FieldValue.serverTimestamp(),
  });
}

async function updateAdminSession(identity: AdminIdentity, request: CallableRequestLike | functions.https.CallableContext): Promise<void> {
  const rawRequest = 'rawRequest' in request ? request.rawRequest : undefined;
  await getFirestore().collection('admin_sessions').doc(identity.uid).set({
    last_activity: FieldValue.serverTimestamp(),
    ip_address: rawRequest?.ip || 'unknown',
    user_agent: rawRequest?.headers?.['user-agent'] || 'unknown',
    expires_at: new Date(Date.now() + 30 * 60 * 1000),
  }, { merge: true });
}

async function requireIdentity(
  auth: CallableAuth | undefined,
  requestIp: string,
  makeError: (code: string, message: string) => Error
): Promise<AdminIdentity> {
  if (!auth) {
    throw makeError('unauthenticated', 'Must be logged in');
  }

  const identity = await resolveAdminIdentity(auth);
  if (!identity) {
    await recordDeniedAccess(auth, 'Admin access required', requestIp);
    throw makeError('permission-denied', 'Admin access required');
  }

  return identity;
}

export async function requireAdminAccessV1(
  context: functions.https.CallableContext,
  requiredRoles: AdminRole[],
  requiredPermission?: string,
  requiredProfession?: string
): Promise<AdminIdentity> {
  const requestIp = context.rawRequest?.ip || 'unknown';
  const identity = await requireIdentity(
    context.auth ? { uid: context.auth.uid, token: context.auth.token } : undefined,
    requestIp,
    (code, message) => new functions.https.HttpsError(code as functions.https.FunctionsErrorCode, message)
  );

  if (await isMaintenanceLocked(identity.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Admin panel is in maintenance mode');
  }
  if (!requiredRoles.includes(identity.role)) {
    await recordDeniedAccess(context.auth ? { uid: context.auth.uid, token: context.auth.token } : undefined, `Required role: ${requiredRoles.join(',')}`, requestIp);
    throw new functions.https.HttpsError('permission-denied', 'Insufficient role');
  }
  if (!hasAdminPermission(identity.role, requiredPermission)) {
    throw new functions.https.HttpsError('permission-denied', 'Insufficient permission');
  }
  if (requiredProfession && identity.role !== 'super_admin' && !identity.professions.includes(requiredProfession)) {
    throw new functions.https.HttpsError('permission-denied', 'No access to this profession');
  }

  await validateIpAllowlist(identity, requestIp);
  await updateAdminSession(identity, context);
  return identity;
}

export async function requireAdminAccessV2(
  request: CallableRequestLike,
  requiredRoles: AdminRole[],
  requiredPermission?: string,
  requiredProfession?: string
): Promise<AdminIdentity> {
  const requestIp = request.rawRequest?.ip || 'unknown';
  const identity = await requireIdentity(
    request.auth,
    requestIp,
    (code, message) => new V2HttpsError(code as any, message)
  );

  if (await isMaintenanceLocked(identity.role)) {
    throw new V2HttpsError('permission-denied', 'Admin panel is in maintenance mode');
  }
  if (!requiredRoles.includes(identity.role)) {
    await recordDeniedAccess(request.auth, `Required role: ${requiredRoles.join(',')}`, requestIp);
    throw new V2HttpsError('permission-denied', 'Insufficient role');
  }
  if (!hasAdminPermission(identity.role, requiredPermission)) {
    throw new V2HttpsError('permission-denied', 'Insufficient permission');
  }
  if (requiredProfession && identity.role !== 'super_admin' && !identity.professions.includes(requiredProfession)) {
    throw new V2HttpsError('permission-denied', 'No access to this profession');
  }

  await validateIpAllowlist(identity, requestIp);
  await updateAdminSession(identity, request);
  return identity;
}
