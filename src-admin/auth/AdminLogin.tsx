import React, { useState } from 'react';
import { Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { useAdminAuth } from './useAdminAuth';

export default function AdminLogin() {
  const { login, loading, error } = useAdminAuth();
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

          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email}
              onChange={e => setEmail(e.target.value)} margin="normal" required autoFocus />
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
