import React, { useState } from 'react';
import {
  Box,
  Typography,
  Switch,
  FormGroup,
  FormControlLabel,
  Slider,
  Alert,
  Snackbar,
  Paper,
  Divider,
  Button
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import {
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  PhoneIphone as PhoneIcon,
  Warning as WarningIcon,
  Timeline as TimelineIcon,
  CalendarToday as CalendarIcon
} from '@mui/icons-material';
import { useNotificationSettings } from '../../hooks/useNotifications';
import { NotificationSettings } from '../../types/notification';

const NotificationSettingsComponent: React.FC = () => {
  const { settings, loading, error, updateSettings } = useNotificationSettings();
  const [localSettings, setLocalSettings] = useState<Partial<NotificationSettings>>({});
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Update local settings when settings are loaded
  React.useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleToggle = (field: keyof NotificationSettings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setLocalSettings(prev => ({
      ...prev,
      [field]: event.target.checked
    }));
  };

  const handleThresholdChange = (_event: Event, newValue: number | number[]) => {
    setLocalSettings(prev => ({
      ...prev,
      budgetThreshold: newValue as number
    }));
  };

  const handleSave = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const success = await updateSettings(localSettings);
      if (success) {
        setSuccessMessage('Notification settings saved successfully!');
      }
    } catch (err: any) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = () => {
    if (!settings) return false;
    return JSON.stringify(localSettings) !== JSON.stringify(settings);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Notification Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading settings...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Notification Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure when and how you receive notifications about your budgets and spending.
      </Typography>

      {/* Budget Alerts Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <WarningIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Budget Alerts
          </Typography>
        </Box>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.budgetAlerts || false}
                onChange={handleToggle('budgetAlerts')}
              />
            }
            label="Enable budget alerts"
          />
        </FormGroup>

        {localSettings.budgetAlerts && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" gutterBottom>
              Alert when spending reaches:
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={localSettings.budgetThreshold || 80}
                onChange={handleThresholdChange}
                min={50}
                max={100}
                step={5}
                marks={[
                  { value: 50, label: '50%' },
                  { value: 75, label: '75%' },
                  { value: 90, label: '90%' },
                  { value: 100, label: '100%' }
                ]}
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value}%`}
              />
            </Box>
            <Typography variant="caption" color="text.secondary">
              You'll receive an alert when your spending reaches {localSettings.budgetThreshold || 80}% of any budget
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Spending Milestones Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimelineIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Spending Milestones
          </Typography>
        </Box>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.spendingMilestones || false}
                onChange={handleToggle('spendingMilestones')}
              />
            }
            label="Notify about spending milestones"
          />
        </FormGroup>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Get notified when you reach significant spending amounts
        </Typography>
      </Paper>

      {/* Summary Reports Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <CalendarIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">
            Summary Reports
          </Typography>
        </Box>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.weeklySummary || false}
                onChange={handleToggle('weeklySummary')}
              />
            }
            label="Weekly spending summary"
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.monthlySummary || false}
                onChange={handleToggle('monthlySummary')}
              />
            }
            label="Monthly spending summary"
          />
        </FormGroup>
      </Paper>

      {/* Delivery Methods Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Delivery Methods
        </Typography>
        
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.inAppNotifications || false}
                onChange={handleToggle('inAppNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <NotificationsIcon sx={{ mr: 1, fontSize: 20 }} />
                In-app notifications
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.pushNotifications || false}
                onChange={handleToggle('pushNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PhoneIcon sx={{ mr: 1, fontSize: 20 }} />
                Push notifications
              </Box>
            }
          />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.emailNotifications || false}
                onChange={handleToggle('emailNotifications')}
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EmailIcon sx={{ mr: 1, fontSize: 20 }} />
                Email notifications
              </Box>
            }
          />
        </FormGroup>
        
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Choose how you want to receive notifications
        </Typography>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          variant="outlined"
          onClick={() => setLocalSettings(settings || {})}
          disabled={!hasChanges()}
        >
          Reset
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSave}
          loading={saving}
          disabled={!hasChanges()}
        >
          Save Changes
        </LoadingButton>
      </Box>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettingsComponent;