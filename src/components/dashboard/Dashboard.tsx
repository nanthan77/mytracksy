import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Fab,
  Dialog,
  Alert,
  Chip,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Divider
} from '@mui/material';
import {
  Add,
  AccountBox,
  Logout,
  TrendingUp,
  AccountBalance,
  Assessment,
  Notifications,
  Settings,
  Mic,
  Upload,
  Download,
  People as FamilyIcon,
  Security,
  Psychology,
  Business,
  Api,
  Analytics,
  SmartToy,
  Groups,
  ShowChart,
  DataUsage,
  CloudUpload
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { ExpenseForm } from './ExpenseForm';
import { ExpenseList } from './ExpenseList';
import { useExpenses } from '../../hooks/useExpenses';
import { useFirebaseStorage } from '../../hooks/useFirebaseStorage';

interface DashboardProps {
  onShowProfile: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onShowProfile }) => {
  const { user, logout } = useAuth();
  const { expenses, addExpense, deleteExpense, loading: expensesLoading } = useExpenses();
  const { uploadFile, downloadFile, deleteFile, getFileList } = useFirebaseStorage();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [notification, setNotification] = useState<string | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleMenuClose();
  };

  const handleAddExpense = async (expenseData: any) => {
    try {
      await addExpense(expenseData);
      setShowAddExpense(false);
      setNotification('Expense added successfully!');
      setTimeout(() => setNotification(null), 3000);
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      setUploadProgress(0);
      const uploadTask = await uploadFile(file, 'exports');
      
      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
        },
        () => {
          setUploadProgress(100);
          setNotification('File uploaded successfully!');
          setTimeout(() => {
            setNotification(null);
            setShowUploadDialog(false);
            setUploadProgress(0);
          }, 2000);
        }
      );
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const thisMonthExpenses = expenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, expense) => sum + expense.amount, 0);

  const phases = [
    { id: 1, name: 'Voice Commands', icon: <Mic />, status: 'active', description: 'Add expenses using voice' },
    { id: 2, name: 'SMS Banking', icon: <Assessment />, status: 'active', description: 'SMS transaction parsing' },
    { id: 3, name: 'Analytics', icon: <Analytics />, status: 'active', description: 'Advanced financial insights' },
    { id: 4, name: 'Export/Import', icon: <CloudUpload />, status: 'active', description: 'Data backup & restore' },
    { id: 5, name: 'Cultural Integration', icon: <FamilyIcon />, status: 'active', description: 'Sri Lankan festivals & Poya days' },
    { id: 6, name: 'Budgeting', icon: <AccountBalance />, status: 'active', description: 'Smart budget management' },
    { id: 7, name: 'Security', icon: <Security />, status: 'active', description: 'Banking-grade encryption' },
    { id: 8, name: 'AI Intelligence', icon: <SmartToy />, status: 'active', description: 'ML-powered categorization' },
    { id: 9, name: 'Family Sharing', icon: <Groups />, status: 'active', description: 'Real-time collaboration' },
    { id: 10, name: 'Investments', icon: <ShowChart />, status: 'active', description: 'CSE stocks & crypto tracking' },
    { id: 11, name: 'Business Intelligence', icon: <Psychology />, status: 'active', description: 'Predictive analytics' },
    { id: 12, name: 'Enterprise APIs', icon: <Api />, status: 'active', description: 'Third-party integrations' }
  ];

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="sticky" sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🇱🇰 MyTracksy Sri Lanka
          </Typography>
          
          <IconButton color="inherit" sx={{ mr: 1 }}>
            <Notifications />
          </IconButton>
          
          <IconButton onClick={handleMenuOpen} sx={{ p: 0 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
              {user?.displayName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          >
            <MenuItem onClick={onShowProfile}>
              <AccountBox sx={{ mr: 1 }} /> Profile
            </MenuItem>
            <MenuItem onClick={handleMenuClose}>
              <Settings sx={{ mr: 1 }} /> Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ mr: 1 }} /> Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Notification */}
      {notification && (
        <Alert severity="success" sx={{ m: 2 }}>
          {notification}
        </Alert>
      )}

      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Total Expenses</Typography>
                <Typography variant="h4" color="primary">
                  {formatCurrency(totalExpenses)}
                </Typography>
                <Typography variant="body2">All time</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>This Month</Typography>
                <Typography variant="h4" color="secondary">
                  {formatCurrency(thisMonthExpenses)}
                </Typography>
                <Typography variant="body2">Current month</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Categories</Typography>
                <Typography variant="h4" color="info.main">
                  {[...new Set(expenses.map(e => e.category))].length}
                </Typography>
                <Typography variant="body2">Active categories</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom>Transactions</Typography>
                <Typography variant="h4" color="success.main">
                  {expenses.length}
                </Typography>
                <Typography variant="body2">Total transactions</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Phases Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              🚀 All 12 Phases Active
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              Your MyTracksy platform has all enterprise features enabled and ready to use.
            </Typography>
            
            <Grid container spacing={2}>
              {phases.map((phase) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={phase.id}>
                  <Paper sx={{ p: 2, height: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {phase.icon}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                        Phase {phase.id}
                      </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                      {phase.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {phase.description}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      <Chip 
                        label="Active" 
                        color="success" 
                        size="small" 
                        variant="outlined"
                      />
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Grid container spacing={3}>
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Transactions
                </Typography>
                {expensesLoading ? (
                  <LinearProgress />
                ) : (
                  <ExpenseList 
                    expenses={expenses.slice(0, 10)} 
                    onDeleteExpense={deleteExpense}
                  />
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Quick Actions
                </Typography>
                <List>
                  <ListItem button onClick={() => setShowAddExpense(true)}>
                    <ListItemIcon><Add /></ListItemIcon>
                    <ListItemText primary="Add Expense" secondary="Record new transaction" />
                  </ListItem>
                  <ListItem button onClick={() => setShowUploadDialog(true)}>
                    <ListItemIcon><Upload /></ListItemIcon>
                    <ListItemText primary="Upload File" secondary="Import data or documents" />
                  </ListItem>
                  <ListItem button>
                    <ListItemIcon><Download /></ListItemIcon>
                    <ListItemText primary="Export Data" secondary="Download your financial data" />
                  </ListItem>
                  <ListItem button onClick={onShowProfile}>
                    <ListItemIcon><AccountBox /></ListItemIcon>
                    <ListItemText primary="View Profile" secondary="Manage your account" />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        onClick={() => setShowAddExpense(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000
        }}
      >
        <Add />
      </Fab>

      {/* Add Expense Dialog */}
      <Dialog 
        open={showAddExpense} 
        onClose={() => setShowAddExpense(false)}
        maxWidth="sm"
        fullWidth
      >
        <ExpenseForm 
          onSubmit={handleAddExpense}
          onCancel={() => setShowAddExpense(false)}
        />
      </Dialog>

      {/* Upload Dialog */}
      <Dialog 
        open={showUploadDialog} 
        onClose={() => setShowUploadDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Upload File
          </Typography>
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                handleFileUpload(file);
              }
            }}
            style={{ marginBottom: 16, width: '100%' }}
          />
          {uploadProgress > 0 && (
            <Box>
              <Typography variant="body2">Upload Progress: {uploadProgress.toFixed(0)}%</Typography>
              <LinearProgress variant="determinate" value={uploadProgress} sx={{ mt: 1 }} />
            </Box>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};