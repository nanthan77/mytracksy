import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminAuth } from './auth/useAdminAuth';
import AdminLogin from './auth/AdminLogin';
import AdminAuthGuard from './auth/AdminAuthGuard';
import SuperAdminLayout from './layouts/SuperAdminLayout';
import ProfessionLayout from './layouts/ProfessionLayout';

// Super Admin pages
import SuperDashboard from './super-admin/SuperDashboard';
import UserRoleManager from './super-admin/UserRoleManager';
import AuditLogViewer from './super-admin/AuditLogViewer';
import SystemSettings from './super-admin/SystemSettings';
import GlobalAnalytics from './super-admin/GlobalAnalytics';

// Profession pages
import ProfessionDashboard from './profession/ProfessionDashboard';
import UserDirectory from './profession/UserDirectory';
import VerificationQueue from './profession/VerificationQueue';
import SubscriptionManager from './profession/SubscriptionManager';
import ProfessionAnalytics from './profession/ProfessionAnalytics';
import ProfessionSettings from './profession/ProfessionSettings';

export default function AdminApp() {
  const { role, professions } = useAdminAuth();

  const getDefaultRedirect = () => {
    if (role === 'super_admin') return '/';
    if (professions.length > 0) return `/profession/${professions[0]}`;
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<AdminLogin />} />

      {/* Super Admin routes */}
      <Route path="/" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><SuperDashboard /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/roles" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><UserRoleManager /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/audit" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><AuditLogViewer /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/settings" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><SystemSettings /></SuperAdminLayout>
        </AdminAuthGuard>
      } />
      <Route path="/analytics" element={
        <AdminAuthGuard requiredRoles={['super_admin']}>
          <SuperAdminLayout><GlobalAnalytics /></SuperAdminLayout>
        </AdminAuthGuard>
      } />

      {/* Per-profession routes */}
      <Route path="/profession/:professionId" element={
        <AdminAuthGuard requiredRoles={['super_admin', 'profession_admin', 'support_agent', 'viewer']}>
          <ProfessionLayout><ProfessionDashboard /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/users" element={
        <AdminAuthGuard requiredPermission="manage_users">
          <ProfessionLayout><UserDirectory /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/verification" element={
        <AdminAuthGuard requiredPermission="approve_users">
          <ProfessionLayout><VerificationQueue /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/subscriptions" element={
        <AdminAuthGuard requiredPermission="override_subscriptions">
          <ProfessionLayout><SubscriptionManager /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/analytics" element={
        <AdminAuthGuard requiredPermission="view_analytics">
          <ProfessionLayout><ProfessionAnalytics /></ProfessionLayout>
        </AdminAuthGuard>
      } />
      <Route path="/profession/:professionId/settings" element={
        <AdminAuthGuard requiredPermission="manage_settings">
          <ProfessionLayout><ProfessionSettings /></ProfessionLayout>
        </AdminAuthGuard>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
    </Routes>
  );
}
