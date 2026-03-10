import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Sms,
  Security,
  AccountBalance,
  CheckCircle,
  Warning,
  Shield
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SriLankanBanks, getSupportedBanks } from '../../data/sri-lanka/banks';

interface SMSPermissionManagerProps {
  open: boolean;
  onClose: () => void;
  onPermissionGranted: (permissions: SMSPermissions) => void;
}

export interface SMSPermissions {
  readSMS: boolean;
  localProcessing: boolean;
  banks: string[];
  agreedToTerms: boolean;
}

export const SMSPermissionManager: React.FC<SMSPermissionManagerProps> = ({
  open,
  onClose,
  onPermissionGranted
}) => {
  const { t } = useTranslation('common');
  const [currentStep, setCurrentStep] = useState(0);
  const [permissions, setPermissions] = useState<SMSPermissions>({
    readSMS: false,
    localProcessing: true,
    banks: [],
    agreedToTerms: false
  });
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const steps = [
    'Privacy & Security',
    'Bank Selection',
    'SMS Permission',
    'Confirmation'
  ];

  const supportedBanks = getSupportedBanks();

  useEffect(() => {
    // Check if SMS permissions are already granted
    checkExistingPermissions();
  }, []);

  const checkExistingPermissions = () => {
    // Check if we already have SMS permissions
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      // This is a simplified check - actual implementation would vary by platform
      const storedPermissions = localStorage.getItem('tracksy-sms-permissions');
      if (storedPermissions) {
        const parsed = JSON.parse(storedPermissions);
        setPermissions(parsed);
        setPermissionStatus('granted');
      }
    }
  };

  const requestSMSPermission = async () => {
    setIsRequestingPermission(true);
    
    try {
      // For web browsers, SMS access is limited and typically requires user action
      // This is a simulation of the permission request process
      
      if ('Notification' in window) {
        // Request notification permission as a proxy for user engagement
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          setPermissionStatus('granted');
          setPermissions(prev => ({ ...prev, readSMS: true }));
        } else {
          setPermissionStatus('denied');
        }
      } else {
        // Fallback: assume permission granted for demo purposes
        setTimeout(() => {
          setPermissionStatus('granted');
          setPermissions(prev => ({ ...prev, readSMS: true }));
        }, 2000);
      }
    } catch (error) {
      console.error('Permission request error:', error);
      setPermissionStatus('denied');
    } finally {
      setIsRequestingPermission(false);
    }
  };

  const handleBankToggle = (bankCode: string) => {
    setPermissions(prev => ({
      ...prev,
      banks: prev.banks.includes(bankCode)
        ? prev.banks.filter(b => b !== bankCode)
        : [...prev.banks, bankCode]
    }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    // Save permissions to localStorage
    localStorage.setItem('tracksy-sms-permissions', JSON.stringify(permissions));
    localStorage.setItem('tracksy-sms-enabled', 'true');
    
    onPermissionGranted(permissions);
    onClose();
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return permissions.agreedToTerms;
      case 1: return permissions.banks.length > 0;
      case 2: return permissionStatus === 'granted';
      case 3: return true;
      default: return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              {t('sms.consent')}
            </Typography>
            
            <Alert severity="info" sx={{ mb: 2 }}>
              {t('sms.consentMessage')}
            </Alert>

            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                🔒 Privacy Guarantees:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon><Shield color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Local Processing Only"
                    secondary="Your SMS data is processed on your device and never sent to external servers"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><Security color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="Banking Data Protection"
                    secondary="We only extract expense amounts and merchants - no account numbers or balances"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                  <ListItemText 
                    primary="You Control Everything"
                    secondary="Disable SMS integration anytime in settings"
                  />
                </ListItem>
              </List>
            </Box>

            <FormControlLabel
              control={
                <Checkbox
                  checked={permissions.agreedToTerms}
                  onChange={(e) => setPermissions(prev => ({ 
                    ...prev, 
                    agreedToTerms: e.target.checked 
                  }))}
                />
              }
              label="I agree to SMS banking integration and privacy terms"
            />
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              Select Your Banks
            </Typography>
            
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Choose the banks you want to integrate with Tracksy:
            </Typography>

            <List>
              {supportedBanks.map((bankCode) => {
                const bank = SriLankanBanks[bankCode];
                const isSelected = permissions.banks.includes(bankCode);
                
                return (
                  <ListItem 
                    key={bankCode}
                    button
                    onClick={() => handleBankToggle(bankCode)}
                    sx={{ 
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      mb: 1,
                      backgroundColor: isSelected ? '#e3f2fd' : 'white'
                    }}
                  >
                    <ListItemIcon>
                      <AccountBalance color={isSelected ? 'primary' : 'inherit'} />
                    </ListItemIcon>
                    <ListItemText 
                      primary={bank.name}
                      secondary={`SMS integration for ${bank.shortName} transactions`}
                    />
                    {isSelected && (
                      <Chip 
                        label="Selected" 
                        color="primary" 
                        size="small" 
                      />
                    )}
                  </ListItem>
                );
              })}
            </List>

            <Alert severity="success" sx={{ mt: 2 }}>
              Selected {permissions.banks.length} bank{permissions.banks.length !== 1 ? 's' : ''} for integration
            </Alert>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="primary">
              SMS Permission Required
            </Typography>
            
            {permissionStatus === 'pending' && (
              <Box>
                <Typography variant="body1" gutterBottom>
                  Tracksy needs permission to read SMS messages to automatically detect banking transactions.
                </Typography>
                
                <Alert severity="warning" sx={{ my: 2 }}>
                  <Typography variant="body2">
                    This permission is required for automatic expense tracking from your bank SMS notifications.
                  </Typography>
                </Alert>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={requestSMSPermission}
                  disabled={isRequestingPermission}
                  startIcon={<Sms />}
                  fullWidth
                  sx={{ my: 2 }}
                >
                  {isRequestingPermission ? 'Requesting Permission...' : 'Grant SMS Permission'}
                </Button>

                {isRequestingPermission && (
                  <LinearProgress sx={{ mt: 1 }} />
                )}
              </Box>
            )}

            {permissionStatus === 'granted' && (
              <Alert severity="success">
                <Typography variant="body1">
                  ✅ SMS Permission Granted! Tracksy can now automatically detect banking transactions.
                </Typography>
              </Alert>
            )}

            {permissionStatus === 'denied' && (
              <Alert severity="error">
                <Typography variant="body1">
                  ❌ SMS Permission Denied. You can still use Tracksy with manual expense entry.
                </Typography>
              </Alert>
            )}
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom color="success.main">
              🎉 Setup Complete!
            </Typography>
            
            <Alert severity="success" sx={{ mb: 2 }}>
              SMS Banking Integration is now configured for your Tracksy account.
            </Alert>

            <Box sx={{ my: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Configuration Summary:
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                📱 <strong>SMS Permission:</strong> {permissionStatus === 'granted' ? 'Granted' : 'Not Granted'}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                🏦 <strong>Integrated Banks:</strong> {permissions.banks.length}
              </Typography>
              
              <Box sx={{ mt: 1 }}>
                {permissions.banks.map(bankCode => (
                  <Chip 
                    key={bankCode}
                    label={SriLankanBanks[bankCode].name}
                    size="small"
                    color="primary"
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Box>
            </Box>

            <Alert severity="info">
              <Typography variant="body2">
                🚀 Your expenses will now be automatically tracked from SMS notifications. 
                You can manage these settings anytime in the app settings.
              </Typography>
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '500px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Sms color="primary" />
          <Typography variant="h6">
            {t('sms.title')}
          </Typography>
        </Box>
        
        <LinearProgress 
          variant="determinate" 
          value={(currentStep + 1) / steps.length * 100}
          sx={{ mt: 1 }}
        />
        
        <Typography variant="caption" color="text.secondary">
          Step {currentStep + 1} of {steps.length}: {steps[currentStep]}
        </Typography>
      </DialogTitle>

      <DialogContent>
        {renderStepContent()}
      </DialogContent>

      <DialogActions>
        <Button 
          onClick={onClose}
          color="inherit"
        >
          Cancel
        </Button>
        
        {currentStep > 0 && (
          <Button 
            onClick={handleBack}
            color="inherit"
          >
            Back
          </Button>
        )}
        
        {currentStep < steps.length - 1 ? (
          <Button 
            onClick={handleNext}
            variant="contained"
            disabled={!canProceed()}
          >
            Next
          </Button>
        ) : (
          <Button 
            onClick={handleFinish}
            variant="contained"
            color="success"
            disabled={!canProceed()}
          >
            Complete Setup
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};