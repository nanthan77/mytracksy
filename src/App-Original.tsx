import React, { useState, useEffect } from 'react';
import SimpleLogin from './components/SimpleLogin';
import { parseVoiceCommand, generateCommandResponse } from './utils/voiceCommands';
import { VoiceEnhanced } from './features/voice-enhanced/VoiceEnhanced';
import { SMSBanking } from './features/sms-banking/SMSBanking';
import { MerchantAnalytics } from './features/analytics/MerchantAnalytics';
import { MultiCompanyManager } from './features/multi-company/MultiCompanyManager';
import { AdvancedAnalyticsDashboard } from './features/analytics/AdvancedAnalyticsDashboard';
import { OfflineSync } from './components/OfflineSync';
import { ExportDialog } from './components/ExportDialog';
import { useTranslation } from 'react-i18next';
import { Box, Fab, Badge, Tab, Tabs, Button, Typography } from '@mui/material';
import { Mic, Sms, Analytics, Business, TrendingUp, Sync, CloudDownload } from '@mui/icons-material';
import './i18n';

function App() {
  const { t, i18n } = useTranslation('common');
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showVoicePanel, setShowVoicePanel] = useState(false);
  const [voiceExpenseCount, setVoiceExpenseCount] = useState(0);
  const [smsExpenseCount, setSmsExpenseCount] = useState(0);
  const [activeTab, setActiveTab] = useState(0);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  // Finance tracking state
  const [expenses, setExpenses] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [balance, setBalance] = useState(50000); // Starting balance in LKR

  // Check for stored login or auto-login
  useEffect(() => {
    const storedUser = localStorage.getItem('tracksyUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
      setIsLoggedIn(true);
    } else {
      // Auto-login after 2 seconds if no stored user
      setTimeout(() => {
        if (!isLoggedIn) {
          const autoUser = { 
            email: 'demo@tracksy.lk', 
            name: 'Demo User', 
            uid: 'auto-' + Date.now() 
          };
          setCurrentUser(autoUser);
          setIsLoggedIn(true);
          try {
            localStorage.setItem('tracksyUser', JSON.stringify(autoUser));
            const utterance = new SpeechSynthesisUtterance('Auto-login successful! Welcome to Tracksy Sri Lanka!');
            window.speechSynthesis.speak(utterance);
          } catch (error) {
            // Ignore errors
          }
        }
      }, 2000);
    }
  }, [isLoggedIn]);

  const handleLogin = (email: string, password: string) => {
    // Make login always work - no validation, no errors
    const user = { 
      email: email || 'user@tracksy.lk', 
      name: 'Tracksy User', 
      uid: Date.now().toString() 
    };
    
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginError('');
    setLoginLoading(false);
    
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      const utterance = new SpeechSynthesisUtterance('Welcome to Tracksy Sri Lanka!');
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Ignore any errors
    }
  };

  const handleRegister = (email: string, password: string) => {
    // Make registration always work - no validation, no errors
    const user = { 
      email: email || 'user@tracksy.lk', 
      name: 'New User', 
      uid: Date.now().toString() 
    };
    
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginError('');
    setLoginLoading(false);
    
    try {
      localStorage.setItem('tracksyUser', JSON.stringify(user));
      const utterance = new SpeechSynthesisUtterance('Account created! Welcome to Tracksy Sri Lanka!');
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Ignore any errors
    }
  };

  const handleSkipLogin = () => {
    const guestUser = { email: 'guest@tracksy.lk', name: 'Guest User', uid: 'guest' };
    setCurrentUser(guestUser);
    setIsLoggedIn(true);
    
    // Voice announcement
    try {
      const utterance = new SpeechSynthesisUtterance('Welcome to Tracksy Sri Lanka demo! Voice finance app is ready.');
      window.speechSynthesis.speak(utterance);
    } catch (voiceError) {
      console.log('Voice not available');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    localStorage.removeItem('tracksyUser');
    
    // Voice announcement
    try {
      const utterance = new SpeechSynthesisUtterance('Logged out successfully. Thank you for using Tracksy!');
      window.speechSynthesis.speak(utterance);
    } catch (voiceError) {
      console.log('Voice not available');
    }
  };

  // Enhanced voice expense handler
  const handleVoiceExpenseAdded = (expense: any) => {
    setExpenses(prev => [expense, ...prev]);
    setVoiceExpenseCount(prev => prev + 1);
    setBalance(prev => prev - expense.amount);
    
    // Voice confirmation in user's language
    const message = t('voice.feedback.added');
    try {
      const utterance = new SpeechSynthesisUtterance(`${message}. ${expense.amount} ${t('currency.lkr')} ${t('expense.for')} ${expense.category}.`);
      utterance.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      window.speechSynthesis.speak(utterance);
    } catch (voiceError) {
      console.log('Voice feedback not available');
    }
  };

  // Language change handler
  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // SMS transaction handler
  const handleSMSTransactionDetected = (transaction: any) => {
    const expense = {
      amount: transaction.amount,
      category: transaction.category,
      description: `${transaction.merchant} (SMS Auto-detected from ${transaction.bankName})`,
      date: transaction.date,
      paymentMethod: 'card',
      tags: ['sms-banking', transaction.bankCode, 'auto-detected']
    };

    setExpenses(prev => [expense, ...prev]);
    setSmsExpenseCount(prev => prev + 1);
    setBalance(prev => prev - expense.amount);
    
    // Voice confirmation in user's language
    try {
      const message = `SMS expense detected: ${transaction.amount} rupees at ${transaction.merchant}`;
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    } catch (voiceError) {
      console.log('Voice feedback not available');
    }
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript('🎙️ Listening...');
      };

      recognition.onresult = (event) => {
        const result = event.results[0][0].transcript;
        setTranscript(`"${result}"`);
        
        // Parse the voice command using multilingual parser
        const parsedCommand = parseVoiceCommand(result, currentLanguage);
        
        if (parsedCommand) {
          // Handle the parsed command
          handleVoiceCommand(parsedCommand);
          
          // Generate appropriate response
          const response = generateCommandResponse(parsedCommand);
          const utterance = new SpeechSynthesisUtterance(response);
          utterance.lang = recognition.lang;
          window.speechSynthesis.speak(utterance);
        } else {
          // Default response if command not recognized
          const responses = {
            en: 'Command received. Try saying: Add expense 500 rupees for food',
            si: 'අණ ලැබුණි. උදාහරණයක් ලෙස කියන්න: ආහාර සඳහා රුපියල් පන්සිය වියදම් එකතු කරන්න',
            ta: 'கட்டளை பெறப்பட்டது. உதாரணம்: உணவுக்கு ஐநூறு ரூபாய் செலவு சேர்க்க'
          };
          
          const utterance = new SpeechSynthesisUtterance(responses[currentLanguage as keyof typeof responses]);
          utterance.lang = recognition.lang;
          window.speechSynthesis.speak(utterance);
        }
      };

      recognition.onerror = () => {
        setTranscript('❌ Error occurred - Please try again');
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Speech recognition not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  };

  // Handle voice commands
  const handleVoiceCommand = (command: any) => {
    console.log('Processing voice command:', command);
    
    switch (command.action) {
      case 'add_expense':
        if (command.amount && command.category) {
          const newExpense = {
            id: Date.now(),
            amount: command.amount,
            category: command.category,
            date: new Date().toLocaleDateString(),
            description: `${command.category} expense`
          };
          setExpenses(prev => [...prev, newExpense]);
          setBalance(prev => prev - command.amount);
          console.log(`Added expense: ${command.amount} LKR for ${command.category}`);
        }
        break;
        
      case 'show_balance':
        const balanceMessage = {
          en: `Your current balance is ${balance.toLocaleString()} rupees`,
          si: `ඔබගේ වර්තමාන ශේෂය රුපියල් ${balance.toLocaleString()} කි`,
          ta: `உங்கள் தற்போதைய இருப்பு ${balance.toLocaleString()} ரூபாய்`
        };
        const utterance = new SpeechSynthesisUtterance(balanceMessage[currentLanguage as keyof typeof balanceMessage]);
        utterance.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
        window.speechSynthesis.speak(utterance);
        break;
        
      case 'set_budget':
        if (command.amount && command.category) {
          const newBudget = {
            id: Date.now(),
            category: command.category,
            amount: command.amount,
            spent: 0,
            period: 'monthly'
          };
          setBudgets(prev => [...prev, newBudget]);
          console.log(`Set budget: ${command.amount} LKR for ${command.category}`);
        }
        break;
        
      default:
        console.log('Unknown command action:', command.action);
    }
  };

  const changeLanguage = (lang: string) => {
    setCurrentLanguage(lang);
    setTranscript('');
    
    const announcements = {
      en: 'Language changed to English',
      si: 'භාෂාව සිංහලට වෙනස් කරන ලදී',
      ta: 'மொழி தமிழுக்கு மாற்றப்பட்டது'
    };
    
    const utterance = new SpeechSynthesisUtterance(announcements[lang as keyof typeof announcements]);
    utterance.lang = lang === 'si' ? 'si-LK' : lang === 'ta' ? 'ta-LK' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  // Show login page if not logged in
  if (!isLoggedIn) {
    return (
      <SimpleLogin
        onLogin={handleLogin}
        onRegister={handleRegister}
        onSkipLogin={handleSkipLogin}
        loading={loginLoading}
        error={loginError}
      />
    );
  }

  // Show main app if logged in
  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: '"Segoe UI", "Noto Sans Sinhala", "Noto Sans Tamil", Arial, sans-serif',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh',
      color: '#333'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* User Info and Logout */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <div>
            <h2 style={{ margin: '0', color: '#1976d2' }}>Welcome, {currentUser?.name || currentUser?.email}!</h2>
            <p style={{ margin: '5px 0 0 0', color: '#666' }}>🇱🇰 Tracksy Sri Lanka - Voice Finance</p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Logout
          </button>
        </div>

        <h1 style={{ 
          color: '#1976d2', 
          textAlign: 'center',
          marginBottom: '10px',
          fontSize: '2.5rem'
        }}>
          🇱🇰 Tracksy Sri Lanka
        </h1>
        <p style={{ 
          textAlign: 'center', 
          fontSize: '1.2rem',
          color: '#28a745',
          fontWeight: 'bold'
        }}>
          Voice-Enabled Personal Finance App
        </p>
        
        {/* Language Selection */}
        <div style={{ 
          marginTop: '30px', 
          padding: '20px', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '15px', color: '#1976d2' }}>🌍 Select Language / භාෂාව තෝරන්න / மொழியைத் தேர்ந்தெடுக்கவும்</h2>
          
          <button 
            onClick={() => handleLanguageChange('en')}
            style={{
              margin: '5px',
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: currentLanguage === 'en' ? '#1976d2' : '#e0e0e0',
              color: currentLanguage === 'en' ? 'white' : '#333',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🇺🇸 English
          </button>
          
          <button 
            onClick={() => handleLanguageChange('si')}
            style={{
              margin: '5px',
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: currentLanguage === 'si' ? '#1976d2' : '#e0e0e0',
              color: currentLanguage === 'si' ? 'white' : '#333',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🇱🇰 සිංහල
          </button>
          
          <button 
            onClick={() => handleLanguageChange('ta')}
            style={{
              margin: '5px',
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: currentLanguage === 'ta' ? '#1976d2' : '#e0e0e0',
              color: currentLanguage === 'ta' ? 'white' : '#333',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            🇱🇰 தமிழ்
          </button>
        </div>

        {/* Enhanced Input Methods */}
        <div style={{ 
          marginTop: '20px', 
          backgroundColor: 'white', 
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
            sx={{ borderBottom: '1px solid #e0e0e0' }}
          >
            <Tab 
              icon={<Badge badgeContent={voiceExpenseCount} color="success"><Mic /></Badge>} 
              label="Voice Entry" 
            />
            <Tab 
              icon={<Badge badgeContent={smsExpenseCount} color="success"><Sms /></Badge>} 
              label="SMS Banking" 
            />
            <Tab 
              icon={<Analytics />} 
              label="Analytics" 
            />
            <Tab 
              icon={<Business />} 
              label="Multi-Company" 
            />
            <Tab 
              icon={<TrendingUp />} 
              label="Advanced Analytics" 
            />
            <Tab 
              icon={<Sync />} 
              label="Sync & Offline" 
            />
            <Tab 
              icon={<CloudDownload />} 
              label="Export & Reports" 
            />
          </Tabs>
          
          <Box sx={{ p: 2 }}>
            {activeTab === 0 && (
              <VoiceEnhanced 
                onExpenseAdded={handleVoiceExpenseAdded}
                disabled={false}
              />
            )}
            
            {activeTab === 1 && (
              <SMSBanking 
                onTransactionDetected={handleSMSTransactionDetected}
              />
            )}
            
            {activeTab === 2 && (
              <MerchantAnalytics 
                expenses={expenses}
                timeRange="month"
              />
            )}
            
            {activeTab === 3 && (
              <MultiCompanyManager 
                onExpenseAdded={handleVoiceExpenseAdded}
              />
            )}
            
            {activeTab === 4 && (
              <AdvancedAnalyticsDashboard 
                onNavigateToExpense={(id) => console.log('Navigate to expense:', id)}
              />
            )}
            
            {activeTab === 5 && (
              <OfflineSync />
            )}
            
            {activeTab === 6 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CloudDownload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Export & Reports
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Generate comprehensive reports and export your financial data
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CloudDownload />}
                  onClick={() => setShowExportDialog(true)}
                >
                  Open Export Center
                </Button>
              </Box>
            )}
          </Box>
        </div>

        {/* Financial Dashboard */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#e3f2fd', 
          borderRadius: '12px',
          border: '2px solid #1976d2'
        }}>
          <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>💰 Financial Dashboard</h3>
          
          {/* Balance Display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <h4 style={{ margin: '0', color: '#28a745' }}>Current Balance</h4>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
                LKR {balance.toLocaleString()}
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <h4 style={{ margin: '0', color: '#dc3545' }}>Total Expenses</h4>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#dc3545' }}>
                LKR {expenses.reduce((sum, exp) => sum + exp.amount, 0).toLocaleString()}
              </p>
            </div>
            
            <div style={{
              backgroundColor: 'white',
              padding: '15px',
              borderRadius: '8px',
              textAlign: 'center',
              minWidth: '150px'
            }}>
              <h4 style={{ margin: '0', color: '#ffc107' }}>Active Budgets</h4>
              <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold', color: '#ffc107' }}>
                {budgets.length}
              </p>
            </div>
          </div>

          {/* Recent Expenses */}
          {expenses.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>🧾 Recent Expenses</h4>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px' }}>
                {expenses.slice(-3).reverse().map((expense, index) => (
                  <div key={expense.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: index < 2 ? '1px solid #eee' : 'none'
                  }}>
                    <div>
                      <strong>{expense.category}</strong>
                      <br />
                      <small style={{ color: '#666' }}>{expense.date}</small>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#dc3545' }}>
                      -LKR {expense.amount.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Budgets */}
          {budgets.length > 0 && (
            <div>
              <h4 style={{ color: '#1976d2', marginBottom: '10px' }}>📊 Active Budgets</h4>
              <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px' }}>
                {budgets.map((budget, index) => (
                  <div key={budget.id} style={{
                    padding: '8px 0',
                    borderBottom: index < budgets.length - 1 ? '1px solid #eee' : 'none'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{budget.category}</strong>
                      <span>LKR {budget.amount.toLocaleString()}</span>
                    </div>
                    <small style={{ color: '#666' }}>{budget.period}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Features Overview */}
        <div style={{ 
          marginTop: '20px', 
          padding: '20px', 
          backgroundColor: '#e8f5e8', 
          borderRadius: '12px',
          border: '2px solid #28a745'
        }}>
          <h3 style={{ color: '#155724', marginBottom: '15px' }}>🚀 Features Now Working</h3>
          <div style={{ fontSize: '16px', lineHeight: '1.8' }}>
            <p>✅ <strong>Voice Commands</strong> - Add expenses, check balance, set budgets</p>
            <p>✅ <strong>Multilingual Support</strong> - English, Sinhala, Tamil voice recognition</p>
            <p>✅ <strong>Sri Lankan Rupees</strong> - Local currency with proper formatting</p>
            <p>✅ <strong>Real-time Updates</strong> - Voice commands instantly update your data</p>
            <p>✅ <strong>Smart Categorization</strong> - Understands local expense categories</p>
          </div>
        </div>

        {/* Floating Action Buttons */}
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
          <Fab
            color="primary"
            aria-label="voice"
            sx={{ mr: 1 }}
            onClick={() => {
              setActiveTab(0);
              setShowVoicePanel(!showVoicePanel);
            }}
          >
            <Badge badgeContent={voiceExpenseCount} color="success">
              <Mic />
            </Badge>
          </Fab>
          
          <Fab
            color="secondary"
            aria-label="sms"
            sx={{ mr: 1 }}
            onClick={() => {
              setActiveTab(1);
              setShowVoicePanel(!showVoicePanel);
            }}
          >
            <Badge badgeContent={smsExpenseCount} color="success">
              <Sms />
            </Badge>
          </Fab>
          
          <Fab
            color="default"
            aria-label="analytics"
            onClick={() => {
              setActiveTab(2);
              setShowVoicePanel(false);
            }}
          >
            <Analytics />
          </Fab>
        </Box>

        {/* Quick Input Panel */}
        {showVoicePanel && (
          <Box
            sx={{
              position: 'fixed',
              bottom: 80,
              right: 16,
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
              zIndex: 999,
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: 3,
              border: '2px solid #1976d2',
              overflow: 'hidden'
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              variant="fullWidth"
              size="small"
            >
              <Tab icon={<Mic />} label="Voice" />
              <Tab icon={<Sms />} label="SMS" />
              <Tab icon={<Analytics />} label="Analytics" />
            </Tabs>
            
            <Box sx={{ p: 1 }}>
              {activeTab === 0 && (
                <VoiceEnhanced 
                  onExpenseAdded={handleVoiceExpenseAdded}
                  disabled={false}
                />
              )}
              
              {activeTab === 1 && (
                <SMSBanking 
                  onTransactionDetected={handleSMSTransactionDetected}
                />
              )}
              
              {activeTab === 2 && (
                <MerchantAnalytics 
                  expenses={expenses}
                  timeRange="month"
                />
              )}
              
              {activeTab === 3 && (
                <MultiCompanyManager 
                  onExpenseAdded={handleVoiceExpenseAdded}
                />
              )}
              
              {activeTab === 4 && (
                <AdvancedAnalyticsDashboard 
                  onNavigateToExpense={(id) => console.log('Navigate to expense:', id)}
                />
              )}
            </Box>
          </Box>
        )}

        {/* Export Dialog */}
        <ExportDialog
          open={showExportDialog}
          onClose={() => setShowExportDialog(false)}
          expenses={expenses}
          onExportComplete={(format, filename) => {
            console.log(`Export completed: ${format} - ${filename}`);
            // Optional: Show success notification
            try {
              const utterance = new SpeechSynthesisUtterance(`Export completed successfully. ${filename} has been downloaded.`);
              utterance.lang = currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US';
              window.speechSynthesis.speak(utterance);
            } catch (error) {
              console.log('Voice feedback not available');
            }
          }}
        />
      </div>
    </div>
  );
}

export default App;