import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  Grid,
  FormControlLabel,
  Checkbox,
  Link
} from '@mui/material';
import {
  Google as GoogleIcon,
  Phone as PhoneIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToPhone?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onSwitchToRegister,
  onSwitchToPhone
}) => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'rememberMe' ? checked : value
    }));
    setError('');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(formData.email, formData.password);
      onSuccess?.();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      await signInWithGoogle();
      onSuccess?.();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }

    try {
      await resetPassword(formData.email);
      setResetEmailSent(true);
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Login failed. Please try again';
    }
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
            🇱🇰 MyTracksy
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Welcome Back!
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to your financial intelligence platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {resetEmailSent && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Password reset email sent! Check your inbox.
          </Alert>
        )}

        <form onSubmit={handleEmailLogin}>
          <TextField
            fullWidth
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            margin="normal"
            required
            disabled={loading}
            placeholder="your.email@example.com"
          />

          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            margin="normal"
            required
            disabled={loading}
            placeholder="Enter your password"
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, mb: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              }
              label="Remember me"
            />
            
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={handlePasswordReset}
              disabled={loading}
            >
              Forgot password?
            </Link>
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign In'}
          </Button>
        </form>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              Continue with Google
            </Button>
          </Grid>
          
          <Grid item xs={12}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              startIcon={<PhoneIcon />}
              onClick={onSwitchToPhone}
              disabled={loading}
              sx={{ mb: 1 }}
            >
              Sign in with Phone (Sri Lanka)
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Don't have an account?{' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToRegister}
              disabled={loading}
            >
              Sign up here
            </Link>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <LanguageIcon fontSize="small" />
            🇺🇸 English | 🇱🇰 සිංහල | 🇱🇰 தமிழ்
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};