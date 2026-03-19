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
  Link,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import {
  Google as GoogleIcon,
  Phone as PhoneIcon,
  PersonAdd as PersonAddIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
  onSwitchToPhone?: () => void;
}

// Sri Lankan districts for location selection
const sriLankanDistricts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 'Nuwara Eliya',
  'Galle', 'Matara', 'Hambantota', 'Jaffna', 'Kilinochchi', 'Mannar',
  'Vavuniya', 'Mullaitivu', 'Batticaloa', 'Ampara', 'Trincomalee',
  'Kurunegala', 'Puttalam', 'Anuradhapura', 'Polonnaruwa', 'Badulla',
  'Moneragala', 'Ratnapura', 'Kegalle'
];

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onSwitchToLogin,
  onSwitchToPhone
}) => {
  const { signUp, signInWithGoogle, setupSriLankanProfile } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    district: '',
    preferredLanguage: 'en' as 'en' | 'si' | 'ta',
    agreedToTerms: false,
    agreedToPrivacy: false,
    receiveUpdates: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'agreedToTerms' || name === 'agreedToPrivacy' || name === 'receiveUpdates' ? checked : value
    }));
    setError('');

    // Check password strength
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password: string) => {
    if (password.length < 6) {
      setPasswordStrength('Too short');
    } else if (password.length < 8) {
      setPasswordStrength('Weak');
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordStrength('Medium');
    } else {
      setPasswordStrength('Strong');
    }
  };

  const validateForm = (): string | null => {
    if (!formData.firstName || !formData.lastName) {
      return 'Please enter your full name';
    }
    
    if (!formData.email) {
      return 'Please enter your email address';
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    
    if (!formData.agreedToTerms) {
      return 'Please agree to the Terms of Service';
    }
    
    if (!formData.agreedToPrivacy) {
      return 'Please agree to the Privacy Policy';
    }
    
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const displayName = `${formData.firstName} ${formData.lastName}`;
      await signUp(formData.email, formData.password, displayName);
      
      // Setup Sri Lankan specific profile
      await setupSriLankanProfile({
        displayName,
        preferredLanguage: formData.preferredLanguage,
        location: {
          district: formData.district,
          country: 'LK'
        },
        preferences: {
          notifications: formData.receiveUpdates,
          voiceCommands: true,
          smsIntegration: true,
          culturalAlerts: true,
          investmentTracking: false
        }
      });
      
      onSuccess?.();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
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

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password is too weak';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'Registration failed. Please try again';
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 'Strong': return 'success';
      case 'Medium': return 'warning';
      case 'Weak': return 'error';
      default: return 'error';
    }
  };

  return (
    <Card sx={{ maxWidth: 500, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
            🇱🇰 MyTracksy
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Create Your Account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Join Sri Lanka's smartest financial platform
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleRegister}>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter first name"
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter last name"
              />
            </Grid>
          </Grid>

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

          <FormControl fullWidth margin="normal">
            <InputLabel>District (Optional)</InputLabel>
            <Select
              name="district"
              value={formData.district}
              onChange={handleInputChange}
              label="District (Optional)"
              disabled={loading}
            >
              <MenuItem value="">Select your district</MenuItem>
              {sriLankanDistricts.map(district => (
                <MenuItem key={district} value={district}>
                  {district}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Preferred Language</InputLabel>
            <Select
              name="preferredLanguage"
              value={formData.preferredLanguage}
              onChange={handleInputChange}
              label="Preferred Language"
              disabled={loading}
            >
              <MenuItem value="en">🇺🇸 English</MenuItem>
              <MenuItem value="si">🇱🇰 සිංහල (Sinhala)</MenuItem>
              <MenuItem value="ta">🇱🇰 தமிழ் (Tamil)</MenuItem>
            </Select>
          </FormControl>

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
            placeholder="Create a strong password"
          />

          {formData.password && (
            <Alert severity={getPasswordStrengthColor() as any} sx={{ mt: 1 }}>
              Password strength: {passwordStrength}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            margin="normal"
            required
            disabled={loading}
            placeholder="Confirm your password"
          />

          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="/terms" target="_blank" rel="noopener noreferrer">Terms of Service</Link>
                </Typography>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="agreedToPrivacy"
                  checked={formData.agreedToPrivacy}
                  onChange={handleInputChange}
                  disabled={loading}
                  required
                />
              }
              label={
                <Typography variant="body2">
                  I agree to the{' '}
                  <Link href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>
                </Typography>
              }
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  name="receiveUpdates"
                  checked={formData.receiveUpdates}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              }
              label={
                <Typography variant="body2">
                  Send me updates about new features and Sri Lankan financial insights
                </Typography>
              }
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            startIcon={<PersonAddIcon />}
            sx={{ mt: 3, mb: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Account'}
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
              onClick={handleGoogleRegister}
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
            >
              Register with Phone (Sri Lanka)
            </Button>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Already have an account?{' '}
            <Link
              component="button"
              type="button"
              variant="body2"
              onClick={onSwitchToLogin}
              disabled={loading}
            >
              Sign in here
            </Link>
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
