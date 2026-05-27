import { describe, it, expect } from 'vitest';
import {
  AdminRole,
  hasAdminPermission,
  hasAdminProfessionAccess,
} from '../../../shared/types/admin';

// ═══════════════════════════════════════════════════════════
// UNIT TESTS — Admin Auth Guard Logic
// Coverage: route protection rules, role-based access, redirects
// Tests the guard decision logic without React rendering
// ═══════════════════════════════════════════════════════════

interface GuardConfig {
  requiredRoles?: AdminRole[];
  requiredPermission?: string;
  requiredProfession?: string;
  routeProfession?: string;
}

interface AuthState {
  user: { uid: string } | null;
  role: AdminRole | null;
  professions: string[];
}

type GuardResult = 'loading' | 'redirect_login' | 'access_denied' | 'redirect_home' | 'allowed';

// Extracted guard logic from AdminAuthGuard.tsx
function evaluateGuard(
  config: GuardConfig,
  state: AuthState & { loading: boolean },
  hasPermission: (p: string) => boolean,
  hasProfessionAccess: (p: string) => boolean
): GuardResult {
  if (state.loading) return 'loading';
  if (!state.user || !state.role) return 'redirect_login';
  if (config.requiredRoles && !config.requiredRoles.includes(state.role)) return 'access_denied';
  if (config.requiredPermission && !hasPermission(config.requiredPermission)) return 'redirect_home';
  const professionToCheck = config.requiredProfession || config.routeProfession;
  if (professionToCheck && !hasProfessionAccess(professionToCheck)) return 'redirect_home';
  return 'allowed';
}

function makeHasPermission(role: AdminRole | null) {
  return (permission: string) => hasAdminPermission(role, permission);
}

function makeHasProfessionAccess(role: AdminRole | null, professions: string[]) {
  return (professionId: string) => hasAdminProfessionAccess(role, professions, professionId);
}

describe('AdminAuthGuard Logic', () => {
  describe('loading state', () => {
    it('returns loading when auth is loading', () => {
      const result = evaluateGuard(
        {},
        { user: null, role: null, professions: [], loading: true },
        () => false,
        () => false
      );
      expect(result).toBe('loading');
    });
  });

  describe('unauthenticated', () => {
    it('redirects to login when no user', () => {
      const result = evaluateGuard(
        {},
        { user: null, role: null, professions: [], loading: false },
        () => false,
        () => false
      );
      expect(result).toBe('redirect_login');
    });

    it('redirects to login when user exists but no role', () => {
      const result = evaluateGuard(
        {},
        { user: { uid: 'abc' }, role: null, professions: [], loading: false },
        () => false,
        () => false
      );
      expect(result).toBe('redirect_login');
    });
  });

  describe('role-based access', () => {
    const superAdmin = {
      user: { uid: 'admin1' },
      role: 'super_admin' as AdminRole,
      professions: [],
      loading: false,
    };

    const profAdmin = {
      user: { uid: 'padmin1' },
      role: 'profession_admin' as AdminRole,
      professions: ['medical', 'legal'],
      loading: false,
    };

    const viewer = {
      user: { uid: 'viewer1' },
      role: 'viewer' as AdminRole,
      professions: ['medical'],
      loading: false,
    };

    it('allows super_admin to super_admin route', () => {
      const result = evaluateGuard(
        { requiredRoles: ['super_admin'] },
        superAdmin,
        makeHasPermission('super_admin'),
        makeHasProfessionAccess('super_admin', [])
      );
      expect(result).toBe('allowed');
    });

    it('denies profession_admin from super_admin-only route', () => {
      const result = evaluateGuard(
        { requiredRoles: ['super_admin'] },
        profAdmin,
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical'])
      );
      expect(result).toBe('access_denied');
    });

    it('denies viewer from super_admin-only route', () => {
      const result = evaluateGuard(
        { requiredRoles: ['super_admin'] },
        viewer,
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', ['medical'])
      );
      expect(result).toBe('access_denied');
    });

    it('allows profession_admin to multi-role route', () => {
      const result = evaluateGuard(
        { requiredRoles: ['super_admin', 'profession_admin', 'support_agent', 'viewer'] },
        profAdmin,
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical'])
      );
      expect(result).toBe('allowed');
    });

    it('allows viewer to multi-role route', () => {
      const result = evaluateGuard(
        { requiredRoles: ['super_admin', 'profession_admin', 'support_agent', 'viewer'] },
        viewer,
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', ['medical'])
      );
      expect(result).toBe('allowed');
    });

    it('allows when no requiredRoles specified', () => {
      const result = evaluateGuard(
        {},
        viewer,
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', ['medical'])
      );
      expect(result).toBe('allowed');
    });
  });

  describe('permission-based access', () => {
    it('allows when user has required permission', () => {
      const result = evaluateGuard(
        { requiredPermission: 'manage_users' },
        { user: { uid: 'a' }, role: 'super_admin', professions: [], loading: false },
        makeHasPermission('super_admin'),
        makeHasProfessionAccess('super_admin', [])
      );
      expect(result).toBe('allowed');
    });

    it('redirects home when user lacks required permission', () => {
      const result = evaluateGuard(
        { requiredPermission: 'manage_roles' },
        { user: { uid: 'a' }, role: 'viewer', professions: [], loading: false },
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', [])
      );
      expect(result).toBe('redirect_home');
    });

    it('viewer cannot access manage_settings route', () => {
      const result = evaluateGuard(
        { requiredPermission: 'manage_settings' },
        { user: { uid: 'a' }, role: 'viewer', professions: [], loading: false },
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', [])
      );
      expect(result).toBe('redirect_home');
    });

    it('support_agent cannot access override_subscriptions route', () => {
      const result = evaluateGuard(
        { requiredPermission: 'override_subscriptions' },
        { user: { uid: 'a' }, role: 'support_agent', professions: [], loading: false },
        makeHasPermission('support_agent'),
        makeHasProfessionAccess('support_agent', [])
      );
      expect(result).toBe('redirect_home');
    });
  });

  describe('profession-based access', () => {
    it('super_admin can access any profession', () => {
      const result = evaluateGuard(
        { requiredProfession: 'medical' },
        { user: { uid: 'a' }, role: 'super_admin', professions: [], loading: false },
        makeHasPermission('super_admin'),
        makeHasProfessionAccess('super_admin', [])
      );
      expect(result).toBe('allowed');
    });

    it('profession_admin can access assigned profession', () => {
      const result = evaluateGuard(
        { requiredProfession: 'medical' },
        { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical', 'legal'], loading: false },
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical', 'legal'])
      );
      expect(result).toBe('allowed');
    });

    it('profession_admin cannot access unassigned profession', () => {
      const result = evaluateGuard(
        { requiredProfession: 'engineering' },
        { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical', 'legal'], loading: false },
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical', 'legal'])
      );
      expect(result).toBe('redirect_home');
    });

    it('viewer cannot access unassigned profession', () => {
      const result = evaluateGuard(
        { requiredProfession: 'business' },
        { user: { uid: 'a' }, role: 'viewer', professions: ['medical'], loading: false },
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', ['medical'])
      );
      expect(result).toBe('redirect_home');
    });
  });

  describe('combined guards', () => {
    it('checks role AND permission AND profession', () => {
      // Must pass all three: role check, permission check, profession check
      const result = evaluateGuard(
        {
          requiredRoles: ['super_admin', 'profession_admin'],
          requiredPermission: 'approve_users',
          requiredProfession: 'medical',
        },
        { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical'], loading: false },
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical'])
      );
      expect(result).toBe('allowed');
    });

    it('fails combined guard on role mismatch', () => {
      const result = evaluateGuard(
        {
          requiredRoles: ['super_admin'],
          requiredPermission: 'approve_users',
          requiredProfession: 'medical',
        },
        { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical'], loading: false },
        makeHasPermission('profession_admin'),
        makeHasProfessionAccess('profession_admin', ['medical'])
      );
      expect(result).toBe('access_denied');
    });

    it('fails combined guard on permission mismatch', () => {
      const result = evaluateGuard(
        {
          requiredRoles: ['super_admin', 'profession_admin', 'viewer'],
          requiredPermission: 'manage_roles',
        },
        { user: { uid: 'a' }, role: 'viewer', professions: [], loading: false },
        makeHasPermission('viewer'),
        makeHasProfessionAccess('viewer', [])
      );
      expect(result).toBe('redirect_home');
    });
  });

  describe('admin route coverage', () => {
    // Verify access patterns for all admin routes from AdminApp.tsx

    it('/ (SuperDashboard) — super_admin only', () => {
      expect(
        evaluateGuard(
          { requiredRoles: ['super_admin'] },
          { user: { uid: 'a' }, role: 'super_admin', professions: [], loading: false },
          makeHasPermission('super_admin'),
          makeHasProfessionAccess('super_admin', [])
        )
      ).toBe('allowed');

      expect(
        evaluateGuard(
          { requiredRoles: ['super_admin'] },
          { user: { uid: 'a' }, role: 'profession_admin', professions: [], loading: false },
          makeHasPermission('profession_admin'),
          makeHasProfessionAccess('profession_admin', [])
        )
      ).toBe('access_denied');
    });

    it('/roles — requires manage_roles permission', () => {
      expect(
        evaluateGuard(
          { requiredRoles: ['super_admin'], requiredPermission: 'manage_roles' },
          { user: { uid: 'a' }, role: 'super_admin', professions: [], loading: false },
          makeHasPermission('super_admin'),
          makeHasProfessionAccess('super_admin', [])
        )
      ).toBe('allowed');
    });

    it('/profession/:id — all roles, profession check', () => {
      // profession_admin with access
      expect(
        evaluateGuard(
          { requiredRoles: ['super_admin', 'profession_admin', 'support_agent', 'viewer'], routeProfession: 'medical' },
          { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical'], loading: false },
          makeHasPermission('profession_admin'),
          makeHasProfessionAccess('profession_admin', ['medical'])
        )
      ).toBe('allowed');

      // profession_admin without access
      expect(
        evaluateGuard(
          { requiredRoles: ['super_admin', 'profession_admin', 'support_agent', 'viewer'], routeProfession: 'legal' },
          { user: { uid: 'a' }, role: 'profession_admin', professions: ['medical'], loading: false },
          makeHasPermission('profession_admin'),
          makeHasProfessionAccess('profession_admin', ['medical'])
        )
      ).toBe('redirect_home');
    });
  });
});
