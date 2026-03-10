import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (currentUser) {
    // If user is logged in, redirect to dashboard or return URL
    const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;