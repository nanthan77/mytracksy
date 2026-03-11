import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, TextField, Switch, FormControlLabel,
  Button, Alert, CircularProgress, Divider,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import SaveIcon from '@mui/icons-material/Save';

interface ProfessionSettingsData {
  verification_required: boolean;
  auto_approve: boolean;
  custom_verification_label: string;
  welcome_message: string;
  max_free_ai_notes: number;
}

const DEFAULT_SETTINGS: ProfessionSettingsData = {
  verification_required: true,
  auto_approve: false,
  custom_verification_label: '',
  welcome_message: '',
  max_free_ai_notes: 5,
};

export default function ProfessionSettings() {
  const { professionId } = useParams<{ professionId: string }>();
  const [settings, setSettings] = useState<ProfessionSettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  useEffect(() => {
    if (!professionId) return;
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'system_settings', `profession_config_${professionId}`);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          setSettings({ ...DEFAULT_SETTINGS, ...snap.data() } as ProfessionSettingsData);
        } else {
          setSettings({ ...DEFAULT_SETTINGS, custom_verification_label: profession?.verificationLabel || '' });
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, [professionId]);

  const handleSave = async () => {
    if (!professionId) return;
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      const docRef = doc(db, 'system_settings', `profession_config_${professionId}`);
      await setDoc(docRef, settings, { merge: true });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        {profession?.icon} {profession?.label} Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Configure settings specific to {profession?.label || 'this profession'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Settings saved successfully</Alert>}

      <Card sx={{ maxWidth: 600 }}>
        <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.verification_required}
                  onChange={e => setSettings(prev => ({ ...prev, verification_required: e.target.checked }))}
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Require Verification</Typography>
                  <Typography variant="caption" color="text.secondary">
                    New users must provide verification ID before approval
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.auto_approve}
                  onChange={e => setSettings(prev => ({ ...prev, auto_approve: e.target.checked }))}
                  color="warning"
                />
              }
              label={
                <Box>
                  <Typography variant="subtitle2">Auto-Approve Users</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Automatically approve new registrations (not recommended)
                  </Typography>
                </Box>
              }
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>Verification Label</Typography>
            <TextField
              value={settings.custom_verification_label}
              onChange={e => setSettings(prev => ({ ...prev, custom_verification_label: e.target.value }))}
              size="small"
              fullWidth
              placeholder={profession?.verificationLabel || 'Verification ID'}
              helperText="Label shown to users when they register (e.g., 'SLMC Number', 'Bar Registration')"
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>Free AI Voice Notes Limit</Typography>
            <TextField
              type="number"
              value={settings.max_free_ai_notes}
              onChange={e => setSettings(prev => ({ ...prev, max_free_ai_notes: Number(e.target.value) }))}
              size="small"
              sx={{ width: 200 }}
              InputProps={{ endAdornment: <Typography variant="body2" color="text.secondary" ml={1}>per month</Typography> }}
            />
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" mb={1}>Welcome Message</Typography>
            <TextField
              value={settings.welcome_message}
              onChange={e => setSettings(prev => ({ ...prev, welcome_message: e.target.value }))}
              multiline
              rows={3}
              fullWidth
              placeholder="Custom welcome message shown to new users after approval"
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
