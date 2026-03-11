import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAdminAuthContext } from './AdminAuthContext';

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

interface Props {
  children: React.ReactNode;
  requiredRoles?: AdminRole[];
  requiredPermission?: string;
  requiredProfession?: string;
}

export default function AdminAuthGuard({ children, requiredRoles, requiredPermission, requiredProfession }: Props) {
  const { user, role, loading, hasPermission, hasProfessionAccess } = useAdminAuthContext();

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !requiredRoles.includes(role)) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
        <Typography variant="h4">Access Denied</Typography>
        <Typography color="text.secondary" mt={1}>You don't have permission to view this page.</Typography>
      </Box>
    );
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/" replace />;
  }

  if (requiredProfession && !hasProfessionAccess(requiredProfession)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
