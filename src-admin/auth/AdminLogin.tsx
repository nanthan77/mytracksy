import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Divider } from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import { useAdminAuthContext } from './AdminAuthContext';

export default function AdminLogin() {
  const { login, loginWithGoogle, loading, error, user, role } = useAdminAuthContext();

  // Redirect to dashboard if already authenticated
  if (user && role) {
    return <Navigate to="/" replace />;
  }
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(email, password);
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
    }}>
      <Card sx={{ maxWidth: 420, width: '100%', mx: 2 }}>
        <CardContent sx={{ p: 4 }}>
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
