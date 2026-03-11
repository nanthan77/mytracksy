import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Switch, FormControlLabel,
  Button, Alert, CircularProgress, Divider,
} from '@mui/material';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import SaveIcon from '@mui/icons-material/Save';

interface AdminConfig {
  session_timeout_minutes: number;
  maintenance_mode: boolean;
  rate_limit_per_minute: number;
}

const DEFAULT_CONFIG: AdminConfig = {
  session_timeout_minutes: 30,
  maintenance_mode: false,
  rate_limit_per_minute: 100,
};

export default function SystemSettings() {
  const [config, setConfig] = useState<AdminConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'system_settings', 'admin_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setConfig({ ...DEFAULT_CONFIG, ...snap.data() } as AdminConfig);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const docRef = doc(db, 'system_settings', 'admin_config');
      await setDoc(docRef, config, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>System Settings</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure global admin panel behavior
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully</Alert>}

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" mb={1}>Session Timeout</Typography>
            <TextField
              type="number"
              value={config.session_timeout_minutes}
              onChange={e => setConfig(prev => ({ ...prev, session_timeout_minutes: Number(e.target.value) }))}
              size="small"
              InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary" ml={1}>minutes</Typography> }}
              sx={{ width: 200 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Admins are auto-logged out after this idle period
            </Typography>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>Rate Limiting</Typography>
            <TextField
              type="number"
              value={config.rate_limit_per_minute}
              onChange={e => setConfig(prev => ({ ...prev, rate_limit_per_minute: Number(e.target.value) }))}
              size="small"
              InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary" ml={1}>req/min</Typography> }}
              sx={{ width: 200 }}
            />
            <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
              Maximum API requests per admin per minute
            </Typography>
          </Box>

          <Divider />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={config.maintenance_mode}
                  onChange={e => setConfig(prev => ({ ...prev, maintenance_mode: e.target.checked }))}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Maintenance Mode</Typography>
                  <Typography variant="caption" color="text.secondary">
                    When enabled, non-super-admin users cannot access the admin panel
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} /> : <SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            sx={{ alignSelf: 'flex-start' }}
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
