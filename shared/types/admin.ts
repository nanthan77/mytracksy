export type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

export interface AdminUser {
  uid: string;
  role: AdminRole;
  professions: string[];
  email: string;
  display_name: string;
  created_by: string;
  created_at: Date;
  last_login: Date | null;
  last_login_ip: string | null;
  allowed_ips: string[];
  session_timeout_minutes: number;
  status: 'active' | 'disabled';
}

export interface AdminSession {
  last_activity: Date;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  target_user: string;
  performed_by: string;
  profession: string;
  ip_address: string;
  role: AdminRole;
  reason?: string;
  new_tier?: string;
  timestamp: Date;
}

export interface AdminConfig {
  session_timeout_minutes: number;
  maintenance_mode: boolean;
  rate_limit_per_minute: number;
}

export const ROLE_PERMISSIONS: Record<AdminRole, string[]> = {
  super_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'manage_roles',
    'view_analytics', 'send_notifications', 'manage_tax_engine',
    'view_audit_log', 'manage_ai_usage'
  ],
  profession_admin: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'override_subscriptions', 'manage_settings', 'view_analytics',
    'send_notifications', 'view_audit_log'
  ],
  support_agent: [
    'view_dashboard', 'manage_users', 'approve_users', 'suspend_users',
    'view_audit_log'
  ],
  viewer: [
    'view_dashboard', 'view_analytics'
  ]
};

export function isAdminRole(value: unknown): value is AdminRole {
  return (
    value === 'super_admin' ||
    value === 'profession_admin' ||
    value === 'support_agent' ||
    value === 'viewer'
  );
}

export function hasAdminPermission(role: AdminRole | null | undefined, permission: string): boolean {
  if (!role || !permission) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAdminProfessionAccess(
  role: AdminRole | null | undefined,
  professions: string[] | undefined,
  professionId: string
): boolean {
  if (!role || !professionId) return false;
  if (role === 'super_admin') return true;
  return (professions || []).includes(professionId);
}
