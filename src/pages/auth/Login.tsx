import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Link,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../context/AuthContext';
import { loginSchema, LoginFormData } from '../../utils/validation';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { ROUTES } from '../../utils/constants';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError('');
      setLoading(true);
      console.log('Attempting login with:', { email: data.email });
      await login(data.email, data.password);
      console.log('Login successful, navigating...');
      // Redirect to the page they were trying to access or dashboard
      const from = (location.state as any)?.from?.pathname || ROUTES.DASHBOARD;
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(getAuthErrorMessage(err.code) || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Sign in to your MyTracksy account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('email')}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register('password')}
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2, position: 'relative' }}
            >
              {loading && (
                <CircularProgress
                  size={24}
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    marginTop: '-12px',
                    marginLeft: '-12px',
                  }}
                />
              )}
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box textAlign="center">
              <Typography variant="body2">
                Don't have an account?{' '}
                <Link component={RouterLink} to={ROUTES.REGISTER} variant="body2">
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;