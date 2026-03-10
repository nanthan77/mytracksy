import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Typography,
  LinearProgress,
  Alert,
  Chip,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Mic,
  MicOff,
  VolumeUp,
  CheckCircle,
  Error,
  Refresh,
  Settings,
  CloudOff
} from '@mui/icons-material';
import { useVoiceRecognition } from '../../hooks/useVoiceRecognition';
import { geminiService, VoiceCommandResult } from '../../services/geminiService';
import { advancedVoiceService, MultiStepTransaction } from '../../services/advancedVoiceService';
import { culturalIntegrationService } from '../../services/culturalIntegrationService';
import { offlineVoiceService } from '../../services/offlineVoiceService';
import { offlineStorageService } from '../../services/offlineStorageService';
import { syncService } from '../../services/syncService';
import { useExpenses } from '../../hooks/useExpenses';
import { useNotifications } from '../../hooks/useNotifications';

interface VoiceEnhancedProps {
  onExpenseAdded?: (expense: any) => void;
  disabled?: boolean;
}

export const VoiceEnhanced: React.FC<VoiceEnhancedProps> = ({
  onExpenseAdded,
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [lastResult, setLastResult] = useState<VoiceCommandResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingExpense, setPendingExpense] = useState<any>(null);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'si' | 'ta'>('en');
  const [activeTransaction, setActiveTransaction] = useState<MultiStepTransaction | null>(null);
  const [culturalContext, setCulturalContext] = useState<any>(null);
  const [workflowStep, setWorkflowStep] = useState<string>('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<any>(null);

  const { addExpense } = useExpenses();
  const { showNotification } = useNotifications();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport,
    currentLanguage
  } = useVoiceRecognition();

  const handleVoiceCommand = useCallback(async (voiceTranscript: string) => {
    if (!voiceTranscript.trim()) return;

    setIsProcessing(true);
    setError(null);
    setCommandHistory(prev => [voiceTranscript, ...prev.slice(0, 4)]);

    try {
      // Check if offline and use offline voice processing
      if (isOffline) {
        console.log('Processing voice command offline...');
        const offlineResult = await offlineVoiceService.processOfflineVoice(
          voiceTranscript, 
          voiceLanguage
        );
        
        if (offlineResult.intent === 'add_expense' && offlineResult.amount) {
          // Create expense with offline processing
          const expense = {
            amount: offlineResult.amount,
            description: offlineResult.description || `${offlineResult.category || 'Expense'} (offline)`,
            category: offlineResult.category || 'Miscellaneous',
            date: new Date(),
            paymentMethod: 'cash',
            tags: ['voice-entry', 'offline', 'advanced-voice'],
            metadata: {
              source: 'voice',
              confidence: offlineResult.confidence,
              offline: true,
              timestamp: Date.now()
            }
          };
          
          await addExpenseOffline(expense);
          speakText(`Added ${expense.amount} rupees for ${expense.category} offline. Will sync when online.`);
          return;
        } else {
          speakText('Command processed offline with limited functionality.');
          return;
        }
      }

      // Check if we're in the middle of a multi-step transaction
      if (activeTransaction) {
        const result = await advancedVoiceService.continueMultiStepTransaction(
          activeTransaction.id, 
          voiceTranscript
        );
        
        setActiveTransaction(result.transaction);
        setWorkflowStep(result.nextPrompt || '');
        
        // Speak the response
        speakText(result.response);
        
        if (result.isComplete) {
          setActiveTransaction(null);
          if (result.transaction.finalExpense) {
            await addExpenseFromVoice(result.transaction.finalExpense);
          }
        }
        
        return;
      }

      // Process new voice command with advanced service
      const advancedResult = await advancedVoiceService.processAdvancedVoiceCommand(
        voiceTranscript, 
        voiceLanguage
      );

      // Handle multi-step transactions
      if (advancedResult.multiStepTransaction) {
        setActiveTransaction(advancedResult.multiStepTransaction);
        setWorkflowStep(getNextStepPrompt(advancedResult.multiStepTransaction));
      }

      // Speak all responses
      for (const response of advancedResult.responses) {
        speakText(response);
      }

      // Process simple commands with fallback to Gemini
      if (!advancedResult.multiStepTransaction && advancedResult.commands.length > 0) {
        const command = advancedResult.commands[0];
        
        if (command.intent === 'add_expense' && command.parameters.amount) {
          // Create expense from advanced command
          const expense = {
            amount: command.parameters.amount,
            description: command.parameters.description,
            category: 'Miscellaneous', // Will be enhanced by merchant recognition
            date: new Date(),
            paymentMethod: 'cash',
            tags: ['voice-entry', 'advanced-voice'],
            culturalContext: command.culturalContext
          };
          
          await addExpenseFromVoice(expense);
        } else if (command.intent === 'unknown') {
          // Fallback to Gemini for unknown commands
          await handleGeminiCommand(voiceTranscript);
        }
      }
    } catch (error) {
      console.error('Voice processing error:', error);
      setError('Failed to process voice command. Please try again.');
      showNotification('Voice processing failed', 'error');
    } finally {
      setIsProcessing(false);
    }
  }, [voiceLanguage, activeTransaction, addExpense, showNotification]);

  // Fallback to Gemini for unknown commands
  const handleGeminiCommand = useCallback(async (voiceTranscript: string) => {
    try {
      const context = {
        recentCategories: ['Food', 'Transport', 'Shopping'],
        commonMerchants: ['Keells', 'Arpico', 'Cafe Mocha'],
        userLanguage: voiceLanguage,
        currency: 'LKR'
      };

      const result = await geminiService.processVoiceCommand(voiceTranscript, context);
      setLastResult(result);
      setConfidence(result.confidence);

      if (result.confidence > 0.8 && result.amount > 0) {
        await addExpenseFromVoice(result);
      } else {
        const expense = {
          amount: result.amount,
          category: result.category,
          description: result.description,
          date: result.date,
          paymentMethod: 'cash',
          tags: [`voice-${result.language}`, 'voice-entry']
        };
        setPendingExpense(expense);
        setShowConfirmation(true);
      }
    } catch (error) {
      console.error('Gemini processing error:', error);
      speakText('I couldn\'t understand that command. Please try again.');
    }
  }, [voiceLanguage, addExpense, showNotification]);

  // Helper function to speak text
  const speakText = useCallback((text: string) => {
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = voiceLanguage === 'si' ? 'si-LK' : voiceLanguage === 'ta' ? 'ta-LK' : 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.log('Text-to-speech not available');
    }
  }, [voiceLanguage]);

  // Helper function to get next step prompt
  const getNextStepPrompt = useCallback((transaction: MultiStepTransaction): string => {
    if (transaction.currentStep >= transaction.steps.length) {
      return 'Transaction complete!';
    }
    const step = transaction.steps[transaction.currentStep];
    return `Step ${transaction.currentStep + 1}: ${step.intent}`;
  }, []);

  // Load cultural context and setup offline listeners on component mount
  useEffect(() => {
    const context = culturalIntegrationService.getCurrentCulturalContext();
    setCulturalContext(context);
    setVoiceLanguage(context.language);
    
    // Setup offline/online listeners
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync when coming back online
      syncService.performSync();
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Setup sync status listener
    const handleSyncStatusChange = (status: any) => {
      setSyncStatus(status);
    };
    
    syncService.addSyncListener(handleSyncStatusChange);
    
    // Load initial sync status
    syncService.getSyncStatus().then(setSyncStatus);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      syncService.removeSyncListener(handleSyncStatusChange);
    };
  }, []);

  const addExpenseFromVoice = async (result: VoiceCommandResult) => {
    try {
      const expense = {
        amount: result.amount,
        category: result.category,
        description: result.description,
        date: result.date,
        paymentMethod: 'cash',
        tags: [`voice-${result.language}`, 'voice-entry']
      };

      await addExpense(expense);
      
      showNotification(
        `Added ${result.amount} LKR for ${result.description}`,
        'success'
      );

      if (onExpenseAdded) {
        onExpenseAdded(expense);
      }

      // Provide voice feedback
      speakFeedback(`Expense added successfully. ${result.amount} rupees for ${result.category}.`, result.language);
      
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense. Please try again.');
    }
  };

  const addExpenseOffline = async (expense: any) => {
    try {
      const offlineExpense = await offlineStorageService.storeExpenseOffline({
        userId: 'current-user',
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        date: expense.date,
        paymentMethod: expense.paymentMethod,
        tags: expense.tags,
        metadata: expense.metadata
      });

      showNotification(
        `Added ${expense.amount} LKR offline - will sync when online`,
        'info'
      );

      if (onExpenseAdded) {
        onExpenseAdded(offlineExpense);
      }
      
    } catch (error) {
      console.error('Error adding offline expense:', error);
      setError('Failed to add expense offline. Please try again.');
    }
  };

  const speakFeedback = (text: string, language: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'si' ? 'si-LK' : language === 'ta' ? 'ta-LK' : 'en-US';
      utterance.rate = 0.8;
      speechSynthesis.speak(utterance);
    }
  };

  const handleStartListening = () => {
    resetTranscript();
    setError(null);
    setLastResult(null);
    startListening();
  };

  const handleStopListening = () => {
    stopListening();
    if (transcript) {
      handleVoiceCommand(transcript);
    }
  };

  const handleConfirmExpense = async () => {
    if (pendingExpense) {
      await addExpense(pendingExpense);
      showNotification(`Added ${pendingExpense.amount} LKR expense`, 'success');
      if (onExpenseAdded) onExpenseAdded(pendingExpense);
    }
    setShowConfirmation(false);
    setPendingExpense(null);
  };

  const handleRejectExpense = () => {
    setShowConfirmation(false);
    setPendingExpense(null);
    setLastResult(null);
  };

  if (!hasRecognitionSupport) {
    return (
      <Alert severity="warning">
        Voice recognition is not supported in your browser. Please use Chrome, Edge, or Safari.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Card elevation={3}>
        <CardContent>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" component="h2">
              Voice Expense Entry
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1}>
              <Chip 
                label={`${currentLanguage.toUpperCase()}`}
                size="small"
                color="primary"
              />
              {isOffline ? (
                <Chip 
                  label="Offline Mode"
                  size="small"
                  color="warning"
                  icon={<CloudOff />}
                />
              ) : (
                geminiService.isAvailable() && (
                  <Chip 
                    label="AI Enhanced"
                    size="small"
                    color="success"
                  />
                )
              )}
              {syncStatus?.pendingItems > 0 && (
                <Chip 
                  label={`${syncStatus.pendingItems} pending`}
                  size="small"
                  color="info"
                />
              )}
            </Box>
          </Box>

          {/* Voice Control Button */}
          <Box display="flex" justifyContent="center" mb={3}>
            <Button
              variant={isListening ? "contained" : "outlined"}
              color={isListening ? "error" : "primary"}
              size="large"
              startIcon={isListening ? <MicOff /> : <Mic />}
              onClick={isListening ? handleStopListening : handleStartListening}
              disabled={disabled || isProcessing}
              sx={{
                minWidth: 200,
                minHeight: 60,
                fontSize: '1.1rem',
                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0.7)' },
                  '70%': { boxShadow: '0 0 0 10px rgba(25, 118, 210, 0)' },
                  '100%': { boxShadow: '0 0 0 0 rgba(25, 118, 210, 0)' }
                }
              }}
            >
              {isListening ? 'Stop Listening' : 'Start Voice Entry'}
            </Button>
          </Box>

          {/* Processing Indicator */}
          {isProcessing && (
            <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Processing voice command...
              </Typography>
            </Box>
          )}

          {/* Current Transcript */}
          {isListening && transcript && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Current Input:
              </Typography>
              <Alert severity="info" sx={{ mb: 1 }}>
                {transcript}
              </Alert>
            </Box>
          )}

          {/* Confidence Meter */}
          {confidence > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Processing Confidence: {Math.round(confidence * 100)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={confidence * 100}
                color={confidence > 0.8 ? 'success' : confidence > 0.5 ? 'warning' : 'error'}
              />
            </Box>
          )}

          {/* Last Result */}
          {lastResult && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Processed Result:
              </Typography>
              <Card variant="outlined">
                <CardContent sx={{ py: 1 }}>
                  <Typography variant="body2">
                    <strong>Amount:</strong> LKR {lastResult.amount.toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Category:</strong> {lastResult.category}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Description:</strong> {lastResult.description}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Language:</strong> {lastResult.language.toUpperCase()}
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* Cultural Context */}
          {culturalContext && culturalContext.culturalMessage && (
            <Box mb={2}>
              <Alert severity="info" icon={<Settings />}>
                <Typography variant="body2">
                  <strong>Cultural Context:</strong> {culturalContext.culturalMessage}
                </Typography>
                {culturalContext.upcomingEvents.length > 0 && (
                  <Box mt={1}>
                    <Typography variant="caption">
                      Suggested categories: {culturalContext.suggestedCategories.slice(0, 3).join(', ')}
                    </Typography>
                  </Box>
                )}
              </Alert>
            </Box>
          )}

          {/* Active Workflow */}
          {activeTransaction && (
            <Box mb={2}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Multi-step transaction in progress</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  Step {activeTransaction.currentStep + 1} of {activeTransaction.steps.length}
                </Typography>
                {workflowStep && (
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {workflowStep}
                  </Typography>
                )}
                <Box mt={1}>
                  <Button 
                    size="small" 
                    onClick={() => setActiveTransaction(null)}
                    color="inherit"
                  >
                    Cancel Workflow
                  </Button>
                </Box>
              </Alert>
            </Box>
          )}

          {/* Command History */}
          {commandHistory.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Recent Commands:
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {commandHistory.slice(0, 2).map((command, index) => (
                  <Chip
                    key={index}
                    label={command}
                    size="small"
                    variant="outlined"
                    sx={{ alignSelf: 'flex-start' }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Quick Actions */}
          <Box display="flex" justifyContent="center" gap={1}>
            <Tooltip title="Clear transcript">
              <IconButton onClick={resetTranscript} size="small">
                <Refresh />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Test voice feedback">
              <IconButton 
                onClick={() => speakFeedback('Voice system is working', voiceLanguage)}
                size="small"
              >
                <VolumeUp />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Usage Tips */}
          <Box mt={2}>
            <Typography variant="caption" color="text.secondary" display="block">
              <strong>Try saying:</strong> "I spent 500 rupees on coffee" or "මම කෝපි එකට රුපියල් 500ක් වියදම් කළා"
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onClose={handleRejectExpense}>
        <DialogTitle>Confirm Expense</DialogTitle>
        <DialogContent>
          {pendingExpense && (
            <Box>
              <Typography gutterBottom>
                Please confirm this expense:
              </Typography>
              <Typography variant="body2">
                <strong>Amount:</strong> LKR {pendingExpense.amount?.toLocaleString()}
              </Typography>
              <Typography variant="body2">
                <strong>Category:</strong> {pendingExpense.category}
              </Typography>
              <Typography variant="body2">
                <strong>Description:</strong> {pendingExpense.description}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Confidence: {Math.round((lastResult?.confidence || 0) * 100)}%
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRejectExpense} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmExpense} color="primary" variant="contained">
            Add Expense
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};