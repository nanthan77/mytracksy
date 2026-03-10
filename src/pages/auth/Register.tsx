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
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useAuth } from '../../context/AuthContext';
import { registerSchema, RegisterFormData } from '../../utils/validation';
import { getAuthErrorMessage } from '../../utils/authErrors';
import { ROUTES } from '../../utils/constants';

const Register: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema)
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError('');
      setLoading(true);
      console.log('Attempting registration with:', { email: data.email, displayName: data.displayName });
      await registerUser(data.email, data.password, data.displayName);
      console.log('Registration successful, navigating to dashboard');
      navigate(ROUTES.DASHBOARD);
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(getAuthErrorMessage(err.code) || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Create Account
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Join MyTracksy to start managing your expenses
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              {...register('displayName')}
              margin="normal"
              required
              fullWidth
              id="displayName"
              label="Full Name"
              name="displayName"
              autoComplete="name"
              autoFocus
              error={!!errors.displayName}
              helperText={errors.displayName?.message}
            />
            <TextField
              {...register('email')}
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
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
              autoComplete="new-password"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              {...register('confirmPassword')}
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
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
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <Link component={RouterLink} to={ROUTES.LOGIN} variant="body2">
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;