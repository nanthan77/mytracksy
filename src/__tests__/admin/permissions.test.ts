import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Admin RBAC Permission System
// Coverage: role hierarchy, permission checks, profession access
// Tests the permission logic extracted from useAdminAuth.ts
// ═══════════════════════════════════════════════════════════

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

// Extracted permission matrix from useAdminAuth.ts
const PERMISSIONS: Record<AdminRole, string[]> = {
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

function hasPermission(role: AdminRole | null, permission: string): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.includes(permission) ?? false;
}

function hasProfessionAccess(
  role: AdminRole | null,
  professions: string[],
  professionId: string
): boolean {
  if (role === 'super_admin') return true;
  return professions.includes(professionId);
}

describe('Admin Permission Matrix', () => {
  describe('super_admin', () => {
    const role: AdminRole = 'super_admin';

    it('has all 12 permissions', () => {
      expect(PERMISSIONS[role]).toHaveLength(12);
    });

    it('can manage roles', () => {
      expect(hasPermission(role, 'manage_roles')).toBe(true);
    });

    it('can manage tax engine', () => {
      expect(hasPermission(role, 'manage_tax_engine')).toBe(true);
    });

    it('can manage AI usage', () => {
      expect(hasPermission(role, 'manage_ai_usage')).toBe(true);
    });

    it('can view dashboard', () => {
      expect(hasPermission(role, 'view_dashboard')).toBe(true);
    });

    it('can manage users', () => {
      expect(hasPermission(role, 'manage_users')).toBe(true);
    });

    it('can override subscriptions', () => {
      expect(hasPermission(role, 'override_subscriptions')).toBe(true);
    });

    it('can send notifications', () => {
      expect(hasPermission(role, 'send_notifications')).toBe(true);
    });

    it('has access to ALL professions regardless of list', () => {
      expect(hasProfessionAccess(role, [], 'medical')).toBe(true);
      expect(hasProfessionAccess(role, [], 'legal')).toBe(true);
      expect(hasProfessionAccess(role, [], 'anything')).toBe(true);
    });
  });

  describe('profession_admin', () => {
    const role: AdminRole = 'profession_admin';

    it('has 9 permissions', () => {
      expect(PERMISSIONS[role]).toHaveLength(9);
    });

    it('CANNOT manage roles', () => {
      expect(hasPermission(role, 'manage_roles')).toBe(false);
    });

    it('CANNOT manage tax engine', () => {
      expect(hasPermission(role, 'manage_tax_engine')).toBe(false);
    });

    it('CANNOT manage AI usage', () => {
      expect(hasPermission(role, 'manage_ai_usage')).toBe(false);
    });

    it('CAN approve and suspend users', () => {
      expect(hasPermission(role, 'approve_users')).toBe(true);
      expect(hasPermission(role, 'suspend_users')).toBe(true);
    });

    it('CAN override subscriptions', () => {
      expect(hasPermission(role, 'override_subscriptions')).toBe(true);
    });

    it('CAN view analytics', () => {
      expect(hasPermission(role, 'view_analytics')).toBe(true);
    });

    it('only has access to assigned professions', () => {
      const professions = ['medical', 'legal'];
      expect(hasProfessionAccess(role, professions, 'medical')).toBe(true);
      expect(hasProfessionAccess(role, professions, 'legal')).toBe(true);
      expect(hasProfessionAccess(role, professions, 'engineering')).toBe(false);
      expect(hasProfessionAccess(role, professions, 'business')).toBe(false);
    });
  });

  describe('support_agent', () => {
    const role: AdminRole = 'support_agent';

    it('has 5 permissions', () => {
      expect(PERMISSIONS[role]).toHaveLength(5);
    });

    it('CANNOT manage settings', () => {
      expect(hasPermission(role, 'manage_settings')).toBe(false);
    });

    it('CANNOT override subscriptions', () => {
      expect(hasPermission(role, 'override_subscriptions')).toBe(false);
    });

    it('CANNOT view analytics', () => {
      expect(hasPermission(role, 'view_analytics')).toBe(false);
    });

    it('CANNOT send notifications', () => {
      expect(hasPermission(role, 'send_notifications')).toBe(false);
    });

    it('CAN approve and suspend users', () => {
      expect(hasPermission(role, 'approve_users')).toBe(true);
      expect(hasPermission(role, 'suspend_users')).toBe(true);
    });

    it('CAN view audit log', () => {
      expect(hasPermission(role, 'view_audit_log')).toBe(true);
    });

    it('only has access to assigned professions', () => {
      const professions = ['medical'];
      expect(hasProfessionAccess(role, professions, 'medical')).toBe(true);
      expect(hasProfessionAccess(role, professions, 'legal')).toBe(false);
    });
  });

  describe('viewer', () => {
    const role: AdminRole = 'viewer';

    it('has only 2 permissions', () => {
      expect(PERMISSIONS[role]).toHaveLength(2);
    });

    it('CAN view dashboard', () => {
      expect(hasPermission(role, 'view_dashboard')).toBe(true);
    });

    it('CAN view analytics', () => {
      expect(hasPermission(role, 'view_analytics')).toBe(true);
    });

    it('CANNOT manage users', () => {
      expect(hasPermission(role, 'manage_users')).toBe(false);
    });

    it('CANNOT approve users', () => {
      expect(hasPermission(role, 'approve_users')).toBe(false);
    });

    it('CANNOT suspend users', () => {
      expect(hasPermission(role, 'suspend_users')).toBe(false);
    });

    it('CANNOT manage settings', () => {
      expect(hasPermission(role, 'manage_settings')).toBe(false);
    });

    it('CANNOT view audit log', () => {
      expect(hasPermission(role, 'view_audit_log')).toBe(false);
    });

    it('CANNOT send notifications', () => {
      expect(hasPermission(role, 'send_notifications')).toBe(false);
    });
  });

  describe('null role (unauthenticated)', () => {
    it('has no permissions', () => {
      expect(hasPermission(null, 'view_dashboard')).toBe(false);
      expect(hasPermission(null, 'manage_users')).toBe(false);
      expect(hasPermission(null, 'manage_roles')).toBe(false);
    });

    it('has no profession access without role', () => {
      expect(hasProfessionAccess(null, [], 'medical')).toBe(false);
      // Note: hasProfessionAccess with null role but matching profession list
      // still returns true from Array.includes — this is by design since
      // the role null check happens at the guard level, not here
      expect(hasProfessionAccess(null, ['medical'], 'medical')).toBe(true);
    });
  });

  describe('permission hierarchy validation', () => {
    it('super_admin has all profession_admin permissions', () => {
      PERMISSIONS['profession_admin'].forEach((perm) => {
        expect(PERMISSIONS['super_admin']).toContain(perm);
      });
    });

    it('profession_admin has all support_agent permissions', () => {
      PERMISSIONS['support_agent'].forEach((perm) => {
        expect(PERMISSIONS['profession_admin']).toContain(perm);
      });
    });

    it('support_agent does NOT have view_analytics (viewer-only)', () => {
      // NOTE: This is a hierarchy gap — support_agent lacks view_analytics
      // which viewer has. This means support_agent is NOT a strict superset
      // of viewer permissions. This may be intentional (support agents
      // handle user issues, not analytics) or a bug.
      expect(PERMISSIONS['support_agent']).not.toContain('view_analytics');
      expect(PERMISSIONS['viewer']).toContain('view_analytics');
    });

    it('permission count decreases down the hierarchy', () => {
      expect(PERMISSIONS['super_admin'].length).toBeGreaterThan(
        PERMISSIONS['profession_admin'].length
      );
      expect(PERMISSIONS['profession_admin'].length).toBeGreaterThan(
        PERMISSIONS['support_agent'].length
      );
      expect(PERMISSIONS['support_agent'].length).toBeGreaterThan(
        PERMISSIONS['viewer'].length
      );
    });
  });

  describe('critical permission isolation', () => {
    it('only super_admin can manage roles', () => {
      expect(hasPermission('super_admin', 'manage_roles')).toBe(true);
      expect(hasPermission('profession_admin', 'manage_roles')).toBe(false);
      expect(hasPermission('support_agent', 'manage_roles')).toBe(false);
      expect(hasPermission('viewer', 'manage_roles')).toBe(false);
    });

    it('only super_admin can manage tax engine', () => {
      expect(hasPermission('super_admin', 'manage_tax_engine')).toBe(true);
      expect(hasPermission('profession_admin', 'manage_tax_engine')).toBe(false);
      expect(hasPermission('support_agent', 'manage_tax_engine')).toBe(false);
      expect(hasPermission('viewer', 'manage_tax_engine')).toBe(false);
    });

    it('only super_admin can manage AI usage', () => {
      expect(hasPermission('super_admin', 'manage_ai_usage')).toBe(true);
      expect(hasPermission('profession_admin', 'manage_ai_usage')).toBe(false);
      expect(hasPermission('support_agent', 'manage_ai_usage')).toBe(false);
      expect(hasPermission('viewer', 'manage_ai_usage')).toBe(false);
    });

    it('viewer and support_agent cannot override subscriptions', () => {
      expect(hasPermission('viewer', 'override_subscriptions')).toBe(false);
      expect(hasPermission('support_agent', 'override_subscriptions')).toBe(false);
    });
  });

  describe('unknown/invalid permissions', () => {
    it('rejects unknown permission strings', () => {
      expect(hasPermission('super_admin', 'delete_database')).toBe(false);
      expect(hasPermission('super_admin', 'root_access')).toBe(false);
      expect(hasPermission('super_admin', '')).toBe(false);
    });
  });
});
