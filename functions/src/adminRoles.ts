import * as functions from 'firebase-functions/v1';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { AdminRole, requireAdminAccessV1 } from './adminPermissions';

const db = getFirestore();
const auth = getAuth();

// ─── Middleware: Verify role + profession access ────────────────
export async function requireRole(
  context: functions.https.CallableContext,
  requiredRoles: AdminRole[],
  requiredProfession?: string
): Promise<{ uid: string; role: AdminRole; professions: string[] }> {
  return requireAdminAccessV1(context, requiredRoles, undefined, requiredProfession);
}

// ─── Assign admin role to a user ────────────────────────────────
export const assignAdminRole = functions.region('asia-south1').https.onCall(
  async (data: { targetUid: string; role: AdminRole; professions: string[]; displayName: string }, context) => {
    const caller = await requireRole(context, ['super_admin']);

    const { targetUid, role, professions, displayName } = data;
    if (!targetUid || !role || !professions) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Set custom claims
    await auth.setCustomUserClaims(targetUid, {
      admin: role === 'super_admin',
      admin_role: role,
      admin_professions: professions,
    });

    // Create/update admin_users doc
    const targetUser = await auth.getUser(targetUid);
    await db.collection('admin_users').doc(targetUid).set({
      role,
      professions,
      email: targetUser.email || '',
      display_name: displayName || targetUser.displayName || '',
      created_by: caller.uid,
      created_at: FieldValue.serverTimestamp(),
      last_login: null,
      last_login_ip: null,
      allowed_ips: [],
      session_timeout_minutes: 30,
      status: 'active',
    }, { merge: true });

    // Audit log
    await db.collection('admin_audit_log').add({
      action: 'assign_admin_role',
      performed_by: caller.uid,
      target_user: targetUid,
      role: caller.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      reason: `Assigned ${role} for ${professions.join(',')}`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// ─── Remove admin role from a user ──────────────────────────────
export const removeAdminRole = functions.region('asia-south1').https.onCall(
  async (data: { targetUid: string }, context) => {
    const caller = await requireRole(context, ['super_admin']);

    await auth.setCustomUserClaims(data.targetUid, {
      admin: false,
      admin_role: null,
      admin_professions: null,
    });

    await db.collection('admin_users').doc(data.targetUid).update({
      status: 'disabled',
    });

    await db.collection('admin_audit_log').add({
      action: 'remove_admin_role',
      performed_by: caller.uid,
      target_user: data.targetUid,
      role: caller.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
    });

    return { success: true };
  }
);

// ─── Verify admin access (called on login) ──────────────────────
export const verifyAdminAccess = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    const result = await requireRole(context, ['super_admin', 'profession_admin', 'support_agent', 'viewer']);

    // Log login
    await db.collection('admin_audit_log').add({
      action: 'admin_login',
      performed_by: result.uid,
      target_user: result.uid,
      role: result.role,
      profession: 'system',
      ip_address: context.rawRequest?.ip || 'unknown',
      timestamp: FieldValue.serverTimestamp(),
    });

    // Update last_login (use set+merge so it works even if doc doesn't exist yet)
    await db.collection('admin_users').doc(result.uid).set({
      last_login: FieldValue.serverTimestamp(),
      last_login_ip: context.rawRequest?.ip || 'unknown',
      role: result.role,
      status: 'active',
    }, { merge: true });

    return {
      role: result.role,
      professions: result.professions,
    };
  }
);

// ─── List all admin users ───────────────────────────────────────
export const listAdminUsers = functions.region('asia-south1').https.onCall(
  async (_data, context) => {
    await requireRole(context, ['super_admin']);

    const snapshot = await db.collection('admin_users').where('status', '==', 'active').get();
    const admins = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() }));

    return { admins };
  }
);
