import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAdminAuthContext } from './AdminAuthContext';

const LOGO_SRC = '/mytracksy-logo.png';

export default function AdminLogin() {
  const { login, loginWithGoogle, loading, error, user, role } = useAdminAuthContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Redirect to dashboard if already authenticated (AFTER all hooks)
  if (user && role) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      px: 2,
      py: { xs: 4, sm: 6 },
      background: 'linear-gradient(135deg, #07111f 0%, #0f172a 48%, #112d22 100%)',
    }}>
      <Card sx={{
        maxWidth: 440,
        width: '100%',
        borderRadius: '8px',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        boxShadow: '0 28px 90px rgba(2, 6, 23, 0.5)',
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(18px)',
      }}>
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Box
              component="img"
              src={LOGO_SRC}
              alt="MyTracksy"
              sx={{
                width: { xs: 116, sm: 140 },
                height: { xs: 116, sm: 140 },
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 18px 45px rgba(0, 0, 0, 0.28)',
                backgroundColor: 'rgba(255, 255, 255, 0.96)',
              }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={1}>
            MyTracksy Admin
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Authorized personnel only
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<GoogleIcon />}
            onClick={loginWithGoogle}
            disabled={loading}
            sx={{ py: 1.5, mb: 2, textTransform: 'none', fontWeight: 600 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Sign in with Google'}
          </Button>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="text.secondary">or use email</Typography>
          </Divider>

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} margin="normal" required />
            <TextField fullWidth label="Password" type="password" value={password}
              onChange={e => setPassword(e.target.value)} margin="normal" required />
            <Button fullWidth type="submit" variant="contained" size="large"
              disabled={loading} sx={{ mt: 2, py: 1.5 }}>
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </form>

          <Typography variant="caption" color="text.secondary" textAlign="center" display="block" mt={3}>
            Protected under PDPA Sri Lanka. All actions are logged.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
