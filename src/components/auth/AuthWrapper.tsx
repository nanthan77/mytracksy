import React, { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Alert,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PhoneAuthForm } from './PhoneAuthForm';

type AuthMode = 'login' | 'register' | 'phone';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [showEmailVerification, setShowEmailVerification] = useState(false);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      >
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <CircularProgress size={60} sx={{ mb: 2 }} />
          <Typography variant="h6" color="primary">
            🇱🇰 MyTracksy
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Loading your financial intelligence platform...
          </Typography>
        </Paper>
      </Box>
    );
  }

  // Show email verification prompt if user is signed in but email not verified
  if (currentUser && !currentUser.emailVerified && !showEmailVerification) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <EmailIcon color="primary" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h5" gutterBottom>
            Verify Your Email
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            We've sent a verification link to <strong>{currentUser.email}</strong>.
            Please check your email and click the verification link to continue.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3 }}>
            <strong>Why verify your email?</strong><br/>
            Email verification is required for:
            <br/>• Banking integrations
            <br/>• Investment tracking
            <br/>• Family sharing features
            <br/>• Security alerts
          </Alert>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              variant="contained"
              onClick={() => setShowEmailVerification(true)}
            >
              I've verified my email
            </Button>
            <Button
              variant="outlined"
              onClick={() => window.location.reload()}
            >
              Refresh page
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  // Show app if user is authenticated and verified
  if (currentUser && (currentUser.emailVerified || showEmailVerification)) {
    return <>{children}</>;
  }

  // Show authentication forms
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4, color: 'white' }}>
          <Typography variant="h2" gutterBottom sx={{ fontWeight: 'bold' }}>
            🇱🇰 MyTracksy Sri Lanka
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 1 }}>
            Enterprise-Grade Financial Intelligence Platform
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.8 }}>
            All 12 Phases Complete • AI-Powered • Sri Lankan Culture Aware
          </Typography>
        </Box>

        {/* Success notification for email verification */}
        {showEmailVerification && (
          <Alert
            severity="success"
            icon={<CheckCircleIcon />}
            sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}
          >
            <strong>Email verified successfully!</strong> Welcome to MyTracksy!
          </Alert>
        )}

        {/* Authentication Forms */}
        {authMode === 'login' && (
          <LoginForm
            onSuccess={() => {
              if (currentUser && !currentUser.emailVerified) {
                setShowEmailVerification(false);
              }
            }}
            onSwitchToRegister={() => setAuthMode('register')}
            onSwitchToPhone={() => setAuthMode('phone')}
          />
        )}

        {authMode === 'register' && (
          <RegisterForm
            onSuccess={() => {
              if (currentUser && !currentUser.emailVerified) {
                setShowEmailVerification(false);
              }
            }}
            onSwitchToLogin={() => setAuthMode('login')}
            onSwitchToPhone={() => setAuthMode('phone')}
          />
        )}

        {authMode === 'phone' && (
          <PhoneAuthForm
            onSuccess={() => {
              // Phone auth users are automatically verified
            }}
            onBack={() => setAuthMode('login')}
          />
        )}

        {/* Features Preview */}
        <Box sx={{ mt: 6, textAlign: 'center', color: 'white' }}>
          <Typography variant="h6" sx={{ mb: 2, opacity: 0.9 }}>
            🚀 What's Waiting for You
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
              gap: 3,
              maxWidth: 800,
              mx: 'auto'
            }}
          >
            <Paper
              sx={{
                p: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography variant="h6" gutterBottom>🧠 AI Intelligence</Typography>
              <Typography variant="body2">
                Smart categorization, fraud detection, predictive budgeting
              </Typography>
            </Paper>
            
            <Paper
              sx={{
                p: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography variant="h6" gutterBottom>🇱🇰 Cultural Aware</Typography>
              <Typography variant="body2">
                Poya days, festivals, local banking, CSE integration
              </Typography>
            </Paper>
            
            <Paper
              sx={{
                p: 2,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              <Typography variant="h6" gutterBottom>👨‍👩‍👧‍👦 Family Ready</Typography>
              <Typography variant="body2">
                Real-time sharing, family goals, role-based permissions
              </Typography>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};