import React, { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Tabs,
  Tab,
  Fab,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Dashboard,
  Mic,
  Sms,
  Analytics,
  Business,
  TrendingUp,
  Sync,
  CloudDownload,
  Psychology,
  Group,
  AccountBalance,
  Api,
  Menu as MenuIcon,
  Settings,
  ExitToApp,
  Notifications,
  Language,
  Home
} from '@mui/icons-material';

// Import all components
import { VoiceEnhanced } from './features/voice-enhanced/VoiceEnhanced';
import { SMSBanking } from './features/sms-banking/SMSBanking';
import { MerchantAnalytics } from './features/analytics/MerchantAnalytics';
import { MultiCompanyManager } from './features/multi-company/MultiCompanyManager';
import { AdvancedAnalyticsDashboard } from './features/analytics/AdvancedAnalyticsDashboard';
import { OfflineSync } from './components/OfflineSync';
import { ExportDialog } from './components/ExportDialog';
import { AIDashboard } from './components/AIDashboard';
import { MasterDashboard } from './components/MasterDashboard';

// Import services
import { aiCategorizationService } from './services/aiCategorizationService';
import { familySharingService } from './services/familySharingService';
import { investmentTrackingService } from './services/investmentTrackingService';
import { businessIntelligenceService } from './services/businessIntelligenceService';
import { enterpriseApiService } from './services/enterpriseApiService';

// Internationalization
import { useTranslation } from 'react-i18next';
import './i18n';

// Theme configuration
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Segoe UI", "Noto Sans Sinhala", "Noto Sans Tamil", Arial, sans-serif',
    h4: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 500,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function App() {
  const { t, i18n } = useTranslation();
  
  // Main state
  const [activeTab, setActiveTab] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [currentUser] = useState({
    name: 'Demo User',
    email: 'demo@tracksy.lk',
    avatar: '🇱🇰'
  });
  
  // Data state
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Counters for badges
  const [voiceExpenseCount, setVoiceExpenseCount] = useState(0);
  const [smsExpenseCount, setSmsExpenseCount] = useState(0);
  const [notifications, setNotifications] = useState(3);

  // Menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    // Initialize demo data
    initializeDemoData();
    
    // Set up periodic updates
    const interval = setInterval(() => {
      // Simulate real-time updates
      if (Math.random() > 0.95) {
        addDemoExpense();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const initializeDemoData = () => {
    const demoExpenses = [
      {
        id: '1',
        amount: 2500,
        category: 'Food & Dining',
        description: 'Lunch at Hotel Galadari',
        date: new Date().toISOString(),
        paymentMethod: 'card',
        source: 'demo'
      },
      {
        id: '2',
        amount: 1200,
        category: 'Transport',
        description: 'Uber ride to Colombo',
        date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'digital',
        source: 'demo'
      },
      {
        id: '3',
        amount: 5000,
        category: 'Religious & Cultural',
        description: 'Temple donation',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        paymentMethod: 'cash',
        source: 'demo',
        culturalContext: 'Poya day offering'
      }
    ];
    
    setExpenses(demoExpenses);
  };

  const addDemoExpense = () => {
    const categories = ['Food & Dining', 'Transport', 'Shopping', 'Entertainment'];
    const descriptions = [
      'Coffee at Cafe Mocha',
      'Three-wheeler fare',
      'Keells Super purchase',
      'Movie ticket at Majestic City'
    ];
    
    const newExpense = {
      id: Date.now().toString(),
      amount: Math.floor(Math.random() * 3000) + 500,
      category: categories[Math.floor(Math.random() * categories.length)],
      description: descriptions[Math.floor(Math.random() * descriptions.length)],
      date: new Date().toISOString(),
      paymentMethod: 'card',
      source: 'auto-demo'
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    showNotification('New expense auto-detected!', 'info');
  };

  const handleVoiceExpenseAdded = (expense: any) => {
    const newExpense = {
      ...expense,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      source: 'voice'
    };
    
    setExpenses(prev => [newExpense, ...prev]);
    setVoiceExpenseCount(prev => prev + 1);
    showNotification(`Voice expense added: LKR ${expense.amount}`, 'success');
  };

  const handleSMSTransactionDetected = (transaction: any) => {
    const expense = {
      id: Date.now().toString(),
      amount: transaction.amount,
      category: transaction.category,
      description: `${transaction.merchant} (SMS Auto-detected)`,
      date: new Date().toISOString(),
      paymentMethod: 'card',
      source: 'sms',
      bankCode: transaction.bankCode
    };

    setExpenses(prev => [expense, ...prev]);
    setSmsExpenseCount(prev => prev + 1);
    showNotification(`SMS transaction detected: LKR ${transaction.amount}`, 'info');
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    setLanguageMenuAnchor(null);
    showNotification(`Language changed to ${language === 'si' ? 'Sinhala' : language === 'ta' ? 'Tamil' : 'English'}`, 'success');
  };

  const showNotification = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  const handleExportComplete = (format: string, filename: string) => {
    showNotification(`Export completed: ${filename}`, 'success');
  };

  const drawerItems = [
    { text: 'Dashboard', icon: <Dashboard />, tab: 0 },
    { text: 'AI Intelligence', icon: <Psychology />, tab: 1 },
    { text: 'Voice Entry', icon: <Mic />, tab: 2 },
    { text: 'SMS Banking', icon: <Sms />, tab: 3 },
    { text: 'Analytics', icon: <Analytics />, tab: 4 },
    { text: 'Multi-Company', icon: <Business />, tab: 5 },
    { text: 'Advanced Analytics', icon: <TrendingUp />, tab: 6 },
    { text: 'Family Sharing', icon: <Group />, tab: 7 },
    { text: 'Investments', icon: <AccountBalance />, tab: 8 },
    { text: 'Enterprise API', icon: <Api />, tab: 9 },
    { text: 'Sync & Offline', icon: <Sync />, tab: 10 },
  ];

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      {/* App Bar */}
      <AppBar position="fixed" elevation={2}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={() => setDrawerOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            🇱🇰 MyTracksy Sri Lanka
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.8 }}>
              All 12 Phases Complete
            </Typography>
          </Typography>

          {/* Language Menu */}
          <IconButton
            color="inherit"
            onClick={(e) => setLanguageMenuAnchor(e.currentTarget)}
          >
            <Language />
          </IconButton>
          
          {/* Notifications */}
          <IconButton color="inherit">
            <Badge badgeContent={notifications} color="error">
              <Notifications />
            </Badge>
          </IconButton>

          {/* User Menu */}
          <IconButton
            color="inherit"
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {currentUser.avatar}
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      >
        <Box sx={{ width: 280, pt: 2 }}>
          <Typography variant="h6" sx={{ px: 3, pb: 2, color: 'primary.main' }}>
            Navigation
          </Typography>
          <List>
            {drawerItems.map((item, index) => (
              <ListItem
                button
                key={item.text}
                onClick={() => {
                  setActiveTab(item.tab);
                  setDrawerOpen(false);
                }}
                selected={activeTab === item.tab}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Welcome Card */}
        {activeTab === 0 && (
          <Card sx={{ mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Typography variant="h4" gutterBottom>
                🎉 Welcome to MyTracksy Complete Platform!
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                All 12 development phases successfully implemented
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h3" color="inherit">{expenses.length}</Typography>
                  <Typography variant="body2">Total Expenses</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h3" color="inherit">{voiceExpenseCount}</Typography>
                  <Typography variant="body2">Voice Entries</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h3" color="inherit">{smsExpenseCount}</Typography>
                  <Typography variant="body2">SMS Detected</Typography>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="h3" color="inherit">12</Typography>
                  <Typography variant="body2">Phases Complete</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}

        {/* Tab Content */}
        <TabPanel value={activeTab} index={0}>
          <MasterDashboard 
            expenses={expenses}
            onExpenseUpdate={setExpenses}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <AIDashboard 
            expenses={expenses}
            onCategoryUpdate={(id, category) => {
              setExpenses(prev => prev.map(exp => 
                exp.id === id ? { ...exp, category } : exp
              ));
            }}
          />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Mic color="primary" />
                Voice-Enhanced Expense Entry
              </Typography>
              <VoiceEnhanced 
                onExpenseAdded={handleVoiceExpenseAdded}
                disabled={false}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={3}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sms color="primary" />
                SMS Banking Integration
              </Typography>
              <SMSBanking 
                onTransactionDetected={handleSMSTransactionDetected}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Analytics color="primary" />
                Merchant Analytics
              </Typography>
              <MerchantAnalytics 
                expenses={expenses}
                timeRange="month"
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={5}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business color="primary" />
                Multi-Company Management
              </Typography>
              <MultiCompanyManager 
                onExpenseAdded={handleVoiceExpenseAdded}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={6}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" />
                Advanced Analytics Dashboard
              </Typography>
              <AdvancedAnalyticsDashboard 
                onNavigateToExpense={(id) => console.log('Navigate to expense:', id)}
              />
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={7}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group color="primary" />
                Family Expense Sharing
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="h6">👨‍👩‍👧‍👦 Family Collaboration Features</Typography>
                <Typography>
                  • Real-time expense sharing with family members<br/>
                  • Cultural role-based permissions<br/>
                  • Shared budgets and family financial goals<br/>
                  • Sri Lankan family structure awareness
                </Typography>
              </Alert>
              <Typography variant="body1">
                Family sharing service ready with {familySharingService.getFamilyMembers().length} members configured.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={8}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccountBalance color="primary" />
                Investment Portfolio Tracking
              </Typography>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="h6">📈 Investment Features</Typography>
                <Typography>
                  • CSE stock market integration<br/>
                  • Cryptocurrency portfolio tracking<br/>
                  • Sri Lankan market analysis<br/>
                  • Real-time performance monitoring
                </Typography>
              </Alert>
              <Typography variant="body1">
                Investment tracking service active with {investmentTrackingService.getPortfolios().length} portfolios.
              </Typography>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={9}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Api color="primary" />
                Enterprise API Ecosystem
              </Typography>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="h6">🔗 Enterprise Integration</Typography>
                <Typography>
                  • Sri Lankan bank API connections (CB, HNB, Sampath)<br/>
                  • Accounting software integrations<br/>
                  • Webhook system for real-time updates<br/>
                  • API key management and security
                </Typography>
              </Alert>
              <Grid container spacing={2}>
                {Object.entries(enterpriseApiService.getApiUsageStats()).map(([key, value]) => (
                  <Grid item xs={6} md={3} key={key}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">{value}</Typography>
                        <Typography variant="caption">{key.replace(/([A-Z])/g, ' $1').trim()}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </TabPanel>

        <TabPanel value={activeTab} index={10}>
          <Card>
            <CardContent>
              <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Sync color="primary" />
                Offline Sync & Data Management
              </Typography>
              <OfflineSync />
            </CardContent>
          </Card>
        </TabPanel>
      </Container>

      {/* Floating Action Buttons */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Fab
          color="primary"
          onClick={() => setShowExportDialog(true)}
          size="medium"
        >
          <CloudDownload />
        </Fab>
        
        <Fab
          color="secondary"
          onClick={() => setActiveTab(2)}
          size="medium"
        >
          <Badge badgeContent={voiceExpenseCount} color="success">
            <Mic />
          </Badge>
        </Fab>
      </Box>

      {/* Dialogs and Menus */}
      <ExportDialog
        open={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        expenses={expenses}
        onExportComplete={handleExportComplete}
      />

      {/* User Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><Settings /></ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>
          <ListItemIcon><ExitToApp /></ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Language Menu */}
      <Menu
        anchorEl={languageMenuAnchor}
        open={Boolean(languageMenuAnchor)}
        onClose={() => setLanguageMenuAnchor(null)}
      >
        <MenuItem onClick={() => handleLanguageChange('en')}>
          🇺🇸 English
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('si')}>
          🇱🇰 සිංහල
        </MenuItem>
        <MenuItem onClick={() => handleLanguageChange('ta')}>
          🇱🇰 தமிழ்
        </MenuItem>
      </Menu>

      {/* Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}

export default App;