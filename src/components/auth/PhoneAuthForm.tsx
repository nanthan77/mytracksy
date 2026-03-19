import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  InputAdornment,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  Phone as PhoneIcon,
  ArrowBack as ArrowBackIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import { RecaptchaVerifier } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { auth } from '../../config/firebase';

interface PhoneAuthFormProps {
  onSuccess?: () => void;
  onBack?: () => void;
}

export const PhoneAuthForm: React.FC<PhoneAuthFormProps> = ({
  onSuccess,
  onBack
}) => {
  const { signInWithPhone } = useAuth();
  
  const [activeStep, setActiveStep] = useState(0);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);

  const steps = ['Enter Phone Number', 'Verify Code'];

  useEffect(() => {
    // Initialize reCAPTCHA
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
      callback: () => {
        console.log('reCAPTCHA solved');
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try again.');
      }
    });
    
    setRecaptchaVerifier(verifier);

    return () => {
      verifier.clear();
    };
  }, []);

  const formatSriLankanPhoneNumber = (phone: string): string => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Handle different Sri Lankan number formats
    if (digits.startsWith('94')) {
      return `+${digits}`;
    } else if (digits.startsWith('0')) {
      return `+94${digits.substring(1)}`;
    } else if (digits.length === 9) {
      return `+94${digits}`;
    }
    
    return `+94${digits}`;
  };

  const validateSriLankanPhoneNumber = (phone: string): boolean => {
    const formatted = formatSriLankanPhoneNumber(phone);
    // Sri Lankan mobile numbers: +94 7X XXX XXXX
    const sriLankanMobileRegex = /^\+947[0-9]{8}$/;
    return sriLankanMobileRegex.test(formatted);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      setError('Please enter your phone number');
      return;
    }

    if (!validateSriLankanPhoneNumber(phoneNumber)) {
      setError('Please enter a valid Sri Lankan mobile number (07X XXX XXXX)');
      return;
    }

    if (!recaptchaVerifier) {
      setError('reCAPTCHA not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formattedPhone = formatSriLankanPhoneNumber(phoneNumber);
      const result = await signInWithPhone(formattedPhone, recaptchaVerifier);
      setConfirmationResult(result);
      setActiveStep(1);
    } catch (error: any) {
      setError(getErrorMessage(error.code));
      // Reset reCAPTCHA on error
      recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const handleCodeVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    if (!confirmationResult) {
      setError('No verification in progress. Please start over.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await confirmationResult.confirm(verificationCode);
      onSuccess?.();
    } catch (error: any) {
      setError(getErrorMessage(error.code));
    } finally {
      setLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/invalid-phone-number':
        return 'Invalid phone number format';
      case 'auth/missing-phone-number':
        return 'Phone number is required';
      case 'auth/quota-exceeded':
        return 'SMS quota exceeded. Please try again later';
      case 'auth/invalid-verification-code':
        return 'Invalid verification code';
      case 'auth/code-expired':
        return 'Verification code has expired';
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later';
      default:
        return 'Verification failed. Please try again';
    }
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Auto-format as user types
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      value = digits;
    } else if (digits.length <= 6) {
      value = `${digits.slice(0, 3)} ${digits.slice(3)}`;
    } else if (digits.length <= 9) {
      value = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
    } else {
      value = `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
    
    // Add leading 0 if not present
    if (value && !value.startsWith('0')) {
      value = `0${value}`;
    }
    
    setPhoneNumber(value);
    setError('');
  };

  return (
    <Card sx={{ maxWidth: 400, mx: 'auto', mt: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
            🇱🇰 MyTracksy
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Phone Verification
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in with your Sri Lankan mobile number
          </Typography>
        </Box>

        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <form onSubmit={handlePhoneSubmit}>
            <TextField
              fullWidth
              label="Mobile Number"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="071 234 5678"
              disabled={loading}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PhoneIcon color="primary" />
                    +94
                  </InputAdornment>
                ),
              }}
              helperText="Enter your Sri Lankan mobile number"
              sx={{ mb: 2 }}
            />

            {/* reCAPTCHA container */}
            <Box id="recaptcha-container" sx={{ mb: 2 }} />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || !phoneNumber}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Verification Code'}
            </Button>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                We'll send a 6-digit verification code to your phone via SMS.
                Standard messaging rates may apply.
              </Typography>
            </Alert>
          </form>
        )}

        {activeStep === 1 && (
          <form onSubmit={handleCodeVerification}>
            <Box sx={{ textAlign: 'center', mb: 2 }}>
              <SecurityIcon color="primary" sx={{ fontSize: 48, mb: 1 }} />
              <Typography variant="body1" gutterBottom>
                Enter the 6-digit code sent to:
              </Typography>
              <Typography variant="h6" color="primary">
                {formatSriLankanPhoneNumber(phoneNumber)}
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Verification Code"
              value={verificationCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setVerificationCode(value);
                setError('');
              }}
              placeholder="123456"
              disabled={loading}
              inputProps={{
                maxLength: 6,
                style: { textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.5rem' }
              }}
              sx={{ mb: 2 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading || verificationCode.length !== 6}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify Code'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                type="button"
                variant="body2"
                onClick={() => {
                  setActiveStep(0);
                  setVerificationCode('');
                  setConfirmationResult(null);
                }}
                disabled={loading}
              >
                Change phone number
              </Link>
            </Box>
          </form>
        )}

        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onBack}
            disabled={loading}
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
          >
            <ArrowBackIcon fontSize="small" />
            Back to other sign-in options
          </Link>
        </Box>
      </CardContent>
    </Card>
  );
};