import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  CircularProgress,
  Badge,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Sms,
  AccountBalance,
  CheckCircle,
  Error,
  Warning,
  Settings,
  Refresh,
  Visibility,
  Delete,
  TrendingUp,
  Security
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { SMSPermissionManager, SMSPermissions } from './SMSPermissionManager';
import { smsParser, SMSTransaction, SMSParsingResult } from './SMSParser';
import { SriLankanBanks } from '../../data/sri-lanka/banks';
import { useExpenses } from '../../hooks/useExpenses';
import { useNotifications } from '../../hooks/useNotifications';
import { merchantRecognitionService } from '../../services/merchantRecognitionService';

interface SMSBankingProps {
  onTransactionDetected?: (transaction: SMSTransaction) => void;
}

export const SMSBanking: React.FC<SMSBankingProps> = ({
  onTransactionDetected
}) => {
  const { t } = useTranslation('common');
  const { addExpense } = useExpenses();
  const { showNotification } = useNotifications();
  
  const [isEnabled, setIsEnabled] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissions, setPermissions] = useState<SMSPermissions | null>(null);
  const [detectedTransactions, setDetectedTransactions] = useState<SMSTransaction[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stats, setStats] = useState({
    totalDetected: 0,
    totalAdded: 0,
    successRate: 0
  });
  const [selectedTransaction, setSelectedTransaction] = useState<SMSTransaction | null>(null);
  const [showTransactionDialog, setShowTransactionDialog] = useState(false);

  useEffect(() => {
    // Check if SMS integration is already enabled
    const smsEnabled = localStorage.getItem('tracksy-sms-enabled') === 'true';
    const storedPermissions = localStorage.getItem('tracksy-sms-permissions');
    
    if (smsEnabled && storedPermissions) {
      setIsEnabled(true);
      setPermissions(JSON.parse(storedPermissions));
      loadStoredTransactions();
    }
  }, []);

  const loadStoredTransactions = () => {
    const stored = localStorage.getItem('tracksy-sms-transactions');
    if (stored) {
      const transactions = JSON.parse(stored);
      setDetectedTransactions(transactions);
      updateStats(transactions);
    }
  };

  const updateStats = (transactions: SMSTransaction[]) => {
    const total = transactions.length;
    const added = transactions.filter(t => t.confidence > 0.7).length;
    const successRate = total > 0 ? (added / total) * 100 : 0;
    
    setStats({
      totalDetected: total,
      totalAdded: added,
      successRate: Math.round(successRate)
    });
  };

  const handlePermissionGranted = (newPermissions: SMSPermissions) => {
    setPermissions(newPermissions);
    setIsEnabled(true);
    
    showNotification(
      `SMS Banking enabled for ${newPermissions.banks.length} banks`,
      'success'
    );

    // Start demo mode with sample transactions
    startDemoMode();
  };

  const startDemoMode = () => {
    // Simulate SMS transactions for demo purposes
    setTimeout(() => {
      simulateSMSTransaction("BOC: Rs.1,250.00 spent at KEELLS SUPER on 06/07/2024. Bal: Rs.45,750.00");
    }, 3000);
    
    setTimeout(() => {
      simulateSMSTransaction("COMBANK: LKR 800 spent at UBER on 06/07/2024. Available Bal: LKR 12,500");
    }, 8000);
    
    setTimeout(() => {
      simulateSMSTransaction("SAMPATH: Rs 2,500 spent at CAFE MOCHA on 06/07/2024");
    }, 15000);
  };

  const simulateSMSTransaction = useCallback((smsText: string) => {
    setIsProcessing(true);
    
    setTimeout(() => {
      const result = smsParser.parseSMS(smsText);
      
      if (result.success && result.transaction) {
        const newTransaction = result.transaction;
        
        setDetectedTransactions(prev => {
          const updated = [newTransaction, ...prev];
          
          // Store in localStorage
          localStorage.setItem('tracksy-sms-transactions', JSON.stringify(updated));
          updateStats(updated);
          
          return updated;
        });

        showNotification(
          `SMS Transaction detected: ${newTransaction.amount} LKR at ${newTransaction.merchant}`,
          'info'
        );

        // Auto-add high confidence transactions
        if (newTransaction.confidence > 0.8) {
          addTransactionAsExpense(newTransaction);
        }

        if (onTransactionDetected) {
          onTransactionDetected(newTransaction);
        }
      }
      
      setIsProcessing(false);
    }, 2000);
  }, [showNotification, onTransactionDetected]);

  const addTransactionAsExpense = async (transaction: SMSTransaction) => {
    try {
      const expense = {
        amount: transaction.amount,
        category: transaction.category,
        description: `${transaction.merchant} (SMS Auto-detected)`,
        date: transaction.date,
        paymentMethod: 'card',
        tags: ['sms-banking', transaction.bankCode, 'auto-detected']
      };

      await addExpense(expense);
      
      showNotification(
        `Added expense: ${transaction.amount} LKR for ${transaction.category}`,
        'success'
      );
    } catch (error) {
      console.error('Error adding SMS transaction as expense:', error);
      showNotification('Failed to add SMS transaction as expense', 'error');
    }
  };

  const handleToggleEnable = () => {
    if (isEnabled) {
      // Disable SMS integration
      setIsEnabled(false);
      localStorage.setItem('tracksy-sms-enabled', 'false');
      showNotification('SMS Banking disabled', 'info');
    } else {
      // Show permission dialog to enable
      setShowPermissionDialog(true);
    }
  };

  const testSMSParser = () => {
    setIsProcessing(true);
    
    const results = smsParser.testWithSampleSMS();
    const successfulTransactions = results
      .filter(r => r.success)
      .map(r => r.transaction!)
      .slice(0, 3);

    setTimeout(() => {
      setDetectedTransactions(prev => {
        const updated = [...successfulTransactions, ...prev];
        localStorage.setItem('tracksy-sms-transactions', JSON.stringify(updated));
        updateStats(updated);
        return updated;
      });

      showNotification(`Processed ${successfulTransactions.length} test SMS transactions`, 'success');
      setIsProcessing(false);
    }, 1500);
  };

  const viewTransactionDetails = (transaction: SMSTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionDialog(true);
  };

  const deleteTransaction = (transactionId: string) => {
    setDetectedTransactions(prev => {
      const updated = prev.filter(t => t.id !== transactionId);
      localStorage.setItem('tracksy-sms-transactions', JSON.stringify(updated));
      updateStats(updated);
      return updated;
    });
    
    showNotification('Transaction removed', 'info');
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'success';
    if (confidence >= 0.6) return 'warning';
    return 'error';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  return (
    <Box>
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="between" mb={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <Sms color="primary" />
              <Typography variant="h6" component="h2">
                {t('sms.title')}
              </Typography>
              {isProcessing && <CircularProgress size={20} />}
            </Box>
            
            <FormControlLabel
              control={
                <Switch
                  checked={isEnabled}
                  onChange={handleToggleEnable}
                  color="primary"
                />
              }
              label={isEnabled ? 'Enabled' : 'Disabled'}
            />
          </Box>

          {!isEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Enable SMS Banking to automatically track expenses from your bank SMS notifications.
                Your SMS data is processed locally and never shared.
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={() => setShowPermissionDialog(true)}
                sx={{ mt: 1 }}
              >
                {t('sms.enable')}
              </Button>
            </Alert>
          )}

          {isEnabled && permissions && (
            <Box>
              {/* Integration Status */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Integrated Banks:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {permissions.banks.map(bankCode => (
                    <Chip
                      key={bankCode}
                      label={SriLankanBanks[bankCode]?.name}
                      size="small"
                      color="primary"
                      icon={<AccountBalance />}
                    />
                  ))}
                </Box>
              </Box>

              {/* Statistics */}
              <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  SMS Banking Statistics
                </Typography>
                <Box display="flex" gap={3}>
                  <Box textAlign="center">
                    <Typography variant="h6" color="primary">
                      {stats.totalDetected}
                    </Typography>
                    <Typography variant="caption">
                      Detected
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="success.main">
                      {stats.totalAdded}
                    </Typography>
                    <Typography variant="caption">
                      Added
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" color="warning.main">
                      {stats.successRate}%
                    </Typography>
                    <Typography variant="caption">
                      Success Rate
                    </Typography>
                  </Box>
                </Box>
              </Box>

              {/* Action Buttons */}
              <Box display="flex" gap={1} mb={2}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Refresh />}
                  onClick={testSMSParser}
                  disabled={isProcessing}
                >
                  Test Parser
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Settings />}
                  onClick={() => setShowPermissionDialog(true)}
                >
                  Settings
                </Button>
                
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<TrendingUp />}
                  onClick={() => {
                    const analytics = merchantRecognitionService.getMerchantAnalytics();
                    showNotification(
                      `Analytics: ${analytics.totalMerchants} merchants, ${analytics.topCategories.length} categories`,
                      'info'
                    );
                  }}
                >
                  Analytics
                </Button>
              </Box>

              {/* Recent Transactions */}
              {detectedTransactions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent SMS Transactions ({detectedTransactions.length})
                  </Typography>
                  
                  <List dense>
                    {detectedTransactions.slice(0, 5).map((transaction, index) => (
                      <React.Fragment key={transaction.id}>
                        <ListItem
                          button
                          onClick={() => viewTransactionDetails(transaction)}
                        >
                          <ListItemIcon>
                            <Badge 
                              badgeContent={Math.round(transaction.confidence * 100)} 
                              color={getConfidenceColor(transaction.confidence)}
                            >
                              <AccountBalance />
                            </Badge>
                          </ListItemIcon>
                          
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="body2">
                                  {transaction.merchant}
                                </Typography>
                                <Chip 
                                  label={`${getConfidenceLabel(transaction.confidence)}`}
                                  size="small"
                                  color={getConfidenceColor(transaction.confidence)}
                                />
                              </Box>
                            }
                            secondary={
                              <Box>
                                <Typography variant="caption" display="block">
                                  {transaction.bankName} • LKR {transaction.amount.toLocaleString()}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {transaction.date.toLocaleDateString()} • {transaction.category}
                                </Typography>
                              </Box>
                            }
                          />
                          
                          <ListItemSecondaryAction>
                            <Tooltip title="Delete transaction">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTransaction(transaction.id);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </ListItemSecondaryAction>
                        </ListItem>
                        {index < detectedTransactions.slice(0, 5).length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>

                  {detectedTransactions.length > 5 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      ... and {detectedTransactions.length - 5} more transactions
                    </Typography>
                  )}
                </Box>
              )}

              {detectedTransactions.length === 0 && (
                <Alert severity="info">
                  <Typography variant="body2">
                    No SMS transactions detected yet. The system will automatically process banking SMS notifications.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Permission Dialog */}
      <SMSPermissionManager
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        onPermissionGranted={handlePermissionGranted}
      />

      {/* Transaction Details Dialog */}
      <Dialog
        open={showTransactionDialog}
        onClose={() => setShowTransactionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          SMS Transaction Details
        </DialogTitle>
        <DialogContent>
          {selectedTransaction && (
            <Box>
              <Typography variant="h6" gutterBottom>
                {selectedTransaction.merchant}
              </Typography>
              
              <Typography variant="body1" gutterBottom>
                <strong>Amount:</strong> LKR {selectedTransaction.amount.toLocaleString()}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Bank:</strong> {selectedTransaction.bankName}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Category:</strong> {selectedTransaction.category}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Date:</strong> {selectedTransaction.date.toLocaleString()}
              </Typography>
              
              <Typography variant="body2" gutterBottom>
                <strong>Confidence:</strong> {Math.round(selectedTransaction.confidence * 100)}%
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Typography variant="subtitle2" gutterBottom>
                Raw SMS:
              </Typography>
              <Typography variant="caption" sx={{ 
                backgroundColor: '#f5f5f5', 
                p: 1, 
                borderRadius: 1,
                display: 'block'
              }}>
                {selectedTransaction.rawSMS}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTransactionDialog(false)}>
            Close
          </Button>
          {selectedTransaction && (
            <Button
              onClick={() => {
                addTransactionAsExpense(selectedTransaction);
                setShowTransactionDialog(false);
              }}
              variant="contained"
              color="primary"
            >
              Add as Expense
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};