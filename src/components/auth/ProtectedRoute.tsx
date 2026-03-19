import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box, Typography } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireEmailVerification?: boolean;
  requirePhoneVerification?: boolean;
  minimumAccountType?: 'basic' | 'premium' | 'enterprise';
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireEmailVerification = false,
  requirePhoneVerification = false,
  minimumAccountType = 'basic',
  redirectTo = '/auth'
}) => {
  const { currentUser, userProfile, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h6" color="primary">
          🇱🇰 MyTracksy
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Verifying your access...
        </Typography>
      </Box>
    );
  }

  // Redirect if not authenticated
  if (!currentUser) {
    return <Navigate to={redirectTo} replace />;
  }

  // Check email verification requirement
  if (requireEmailVerification && !currentUser.emailVerified) {
    return <Navigate to="/verify-email" replace />;
  }

  // Check phone verification requirement
  if (requirePhoneVerification && userProfile && !userProfile.isPhoneVerified) {
    return <Navigate to="/verify-phone" replace />;
  }

  // Check account type requirement
  if (userProfile && minimumAccountType !== 'basic') {
    const accountTypeOrder = { basic: 0, premium: 1, enterprise: 2 };
    const userTypeLevel = accountTypeOrder[userProfile.accountType];
    const requiredLevel = accountTypeOrder[minimumAccountType];
    
    if (userTypeLevel < requiredLevel) {
      return <Navigate to="/upgrade-account" replace />;
    }
  }

  // All checks passed, render the protected content
  return <>{children}</>;
};