import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Chip,
  LinearProgress,
  IconButton,
  Badge,
  Divider,
  Paper,
  Tab,
  Tabs,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress
} from '@mui/material';
import {
  LinkedIn,
  Facebook,
  Edit,
  Settings,
  TrendingUp,
  TrendingDown,
  AccountBalance,
  Business,
  NotificationsActive,
  Star,
  EmojiEvents,
  Schedule,
  AttachMoney,
  Group,
  Assessment,
  Timeline,
  Verified,
  Language,
  LocationOn,
  Phone,
  Email,
  CalendarToday,
  WorkspacePremium
} from '@mui/icons-material';

interface UserProfileProps {
  user?: any;
  userProfile?: any;
  onBack?: () => void;
}

// Mock data for demonstration
const mockUserData = {
  personalInfo: {
    displayName: 'Samantha Perera',
    email: 'samantha.perera@tracksy.lk',
    phone: '+94 77 123 4567',
    location: 'Colombo, Western Province',
    district: 'Colombo',
    joinedDate: '2023-06-15',
    accountType: 'premium',
    memberType: 'family_head',
    preferredLanguage: 'en',
    isEmailVerified: true,
    isPhoneVerified: true
  },
  socialProfiles: {
    linkedin: {
      connected: true,
      profileUrl: 'linkedin.com/in/samantha-perera',
      connections: 245,
      headline: 'Financial Consultant & Entrepreneur'
    },
    facebook: {
      connected: true,
      profileUrl: 'facebook.com/samantha.perera.business',
      friends: 892,
      businessPage: 'Perera Financial Services'
    }
  },
  companies: [
    {
      id: 1,
      name: 'Perera Financial Services',
      industry: 'Financial Consulting',
      role: 'Founder & CEO',
      employees: 8,
      revenue: 2500000,
      expenses: 1800000,
      profit: 700000,
      profitMargin: 28,
      established: '2021',
      healthScore: 85,
      growth: 15.2
    },
    {
      id: 2,
      name: 'Ceylon Investment Partners',
      industry: 'Investment Management',
      role: 'Managing Partner',
      employees: 3,
      revenue: 1200000,
      expenses: 800000,
      profit: 400000,
      profitMargin: 33.3,
      established: '2022',
      healthScore: 92,
      growth: 22.8
    }
  ],
  upcomingPayments: [
    {
      id: 1,
      title: 'Office Rent - Colombo',
      amount: 85000,
      dueDate: '2025-07-15',
      priority: 'high',
      category: 'Utilities',
      isRecurring: true,
      company: 'Perera Financial Services'
    },
    {
      id: 2,
      title: 'Staff Salaries',
      amount: 450000,
      dueDate: '2025-07-30',
      priority: 'high',
      category: 'Payroll',
      isRecurring: true,
      company: 'Perera Financial Services'
    },
    {
      id: 3,
      title: 'Business Loan - Commercial Bank',
      amount: 125000,
      dueDate: '2025-08-05',
      priority: 'medium',
      category: 'Loans',
      isRecurring: true,
      company: 'Ceylon Investment Partners'
    },
    {
      id: 4,
      title: 'Software Licenses',
      amount: 35000,
      dueDate: '2025-08-12',
      priority: 'low',
      category: 'Equipment',
      isRecurring: false,
      company: 'Perera Financial Services'
    }
  ],
  goals: [
    {
      id: 1,
      title: 'Expand to Kandy Office',
      target: 5000000,
      current: 3200000,
      deadline: '2025-12-31',
      category: 'Business Growth'
    },
    {
      id: 2,
      title: 'Emergency Fund Target',
      target: 1000000,
      current: 750000,
      deadline: '2025-09-30',
      category: 'Financial Security'
    },
    {
      id: 3,
      title: 'Team Expansion',
      target: 15,
      current: 11,
      deadline: '2025-11-30',
      category: 'Human Resources'
    }
  ],
  achievements: [
    {
      id: 1,
      title: 'Financial Discipline Master',
      description: 'Stayed within budget for 6 consecutive months',
      icon: '🎯',
      earnedDate: '2025-06-01',
      type: 'budget'
    },
    {
      id: 2,
      title: 'Growth Champion',
      description: 'Achieved 20%+ revenue growth',
      icon: '📈',
      earnedDate: '2025-05-15',
      type: 'growth'
    },
    {
      id: 3,
      title: 'Community Leader',
      description: 'Helped 50+ users with financial insights',
      icon: '🤝',
      earnedDate: '2025-04-20',
      type: 'community'
    },
    {
      id: 4,
      title: 'Tech Innovator',
      description: 'Early adopter of all 12 MyTracksy phases',
      icon: '🚀',
      earnedDate: '2025-07-06',
      type: 'innovation'
    }
  ],
  analytics: {
    monthlyRevenue: [1800000, 2100000, 1950000, 2300000, 2500000, 2200000],
    monthlyExpenses: [1400000, 1600000, 1500000, 1750000, 1800000, 1650000],
    categories: [
      { name: 'Salaries', amount: 450000, percentage: 35 },
      { name: 'Office Rent', amount: 120000, percentage: 9 },
      { name: 'Marketing', amount: 200000, percentage: 15 },
      { name: 'Technology', amount: 150000, percentage: 12 },
      { name: 'Utilities', amount: 80000, percentage: 6 },
      { name: 'Other', amount: 300000, percentage: 23 }
    ]
  }
};

const TabPanel = ({ children, value, index }: any) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

export const UserProfile: React.FC<UserProfileProps> = ({ user, userProfile, onBack }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [userData, setUserData] = useState(mockUserData);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  const getGoalProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {onBack && (
        <Box sx={{ p: 2 }}>
          <Button 
            onClick={onBack} 
            startIcon={<Settings />}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            ← Back to MyTracksy
          </Button>
        </Box>
      )}
      <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header Section */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Verified sx={{ color: 'success.main', bgcolor: 'white', borderRadius: '50%', p: 0.5 }} />
                }
              >
                <Avatar
                  sx={{ width: 120, height: 120, border: '4px solid white' }}
                  src="/api/placeholder/120/120"
                >
                  {userData.personalInfo.displayName.charAt(0)}
                </Avatar>
              </Badge>
            </Grid>
            
            <Grid item xs>
              <Typography variant="h3" gutterBottom>
                {userData.personalInfo.displayName}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                {userData.socialProfiles.linkedin.headline}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item>
                  <Chip 
                    icon={<LocationOn />} 
                    label={userData.personalInfo.location}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    icon={<WorkspacePremium />} 
                    label={userData.personalInfo.accountType.toUpperCase()}
                    sx={{ bgcolor: 'rgba(255,215,0,0.8)', color: 'black' }}
                  />
                </Grid>
                <Grid item>
                  <Chip 
                    icon={<Language />} 
                    label={userData.personalInfo.preferredLanguage === 'si' ? 'සිංහල' : 
                           userData.personalInfo.preferredLanguage === 'ta' ? 'தமிழ்' : 'English'}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                  />
                </Grid>
              </Grid>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  startIcon={<LinkedIn />}
                  sx={{ bgcolor: '#0077B5', '&:hover': { bgcolor: '#005885' } }}
                  disabled={!userData.socialProfiles.linkedin.connected}
                >
                  LinkedIn ({userData.socialProfiles.linkedin.connections})
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Facebook />}
                  sx={{ bgcolor: '#1877F2', '&:hover': { bgcolor: '#0C63D4' } }}
                  disabled={!userData.socialProfiles.facebook.connected}
                >
                  Facebook ({userData.socialProfiles.facebook.friends})
                </Button>
                <Button variant="outlined" startIcon={<Edit />} sx={{ color: 'white', borderColor: 'white' }}>
                  Edit Profile
                </Button>
              </Box>
            </Grid>

            <Grid item>
              <Paper sx={{ p: 2, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}>
                <Typography variant="h4">{userData.companies.length}</Typography>
                <Typography variant="body2">Companies</Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <Card sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Assessment />} label="Overview" />
          <Tab icon={<Business />} label="Companies" />
          <Tab icon={<NotificationsActive />} label="Payments" />
          <Tab icon={<EmojiEvents />} label="Goals & Achievements" />
          <Tab icon={<Timeline />} label="Analytics" />
          <Tab icon={<Settings />} label="Settings" />
        </Tabs>
      </Card>

      {/* Tab Content */}
      <TabPanel value={activeTab} index={0}>
        {/* Overview Tab */}
        <Grid container spacing={3}>
          {/* Quick Stats */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <AccountBalance color="primary" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5">
                      {formatCurrency(userData.companies.reduce((sum, c) => sum + c.revenue, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Revenue</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <TrendingUp color="success" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5">
                      {formatCurrency(userData.companies.reduce((sum, c) => sum + c.profit, 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Profit</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Group color="info" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5">
                      {userData.companies.reduce((sum, c) => sum + c.employees, 0)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Total Employees</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Star color="warning" sx={{ fontSize: 40, mb: 1 }} />
                    <Typography variant="h5">{userData.achievements.length}</Typography>
                    <Typography variant="body2" color="text.secondary">Achievements</Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Grid>

          {/* Recent Achievements */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <EmojiEvents color="warning" />
                  Recent Achievements
                </Typography>
                <List>
                  {userData.achievements.slice(0, 3).map((achievement) => (
                    <ListItem key={achievement.id}>
                      <ListItemIcon>
                        <Typography variant="h6">{achievement.icon}</Typography>
                      </ListItemIcon>
                      <ListItemText
                        primary={achievement.title}
                        secondary={achievement.description}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Urgent Payments */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsActive color="error" />
                  Urgent Payments
                </Typography>
                <List>
                  {userData.upcomingPayments
                    .filter(p => getDaysUntilDue(p.dueDate) <= 7)
                    .slice(0, 3)
                    .map((payment) => (
                      <ListItem key={payment.id}>
                        <ListItemIcon>
                          <AttachMoney color={getPriorityColor(payment.priority)} />
                        </ListItemIcon>
                        <ListItemText
                          primary={payment.title}
                          secondary={`${formatCurrency(payment.amount)} - Due in ${getDaysUntilDue(payment.dueDate)} days`}
                        />
                      </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        {/* Companies Tab */}
        <Grid container spacing={3}>
          {userData.companies.map((company) => (
            <Grid item xs={12} md={6} key={company.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{company.name}</Typography>
                    <Chip 
                      label={`Health Score: ${company.healthScore}%`}
                      color={company.healthScore >= 80 ? 'success' : company.healthScore >= 60 ? 'warning' : 'error'}
                    />
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {company.industry} • {company.role} • Est. {company.established}
                  </Typography>

                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Revenue</Typography>
                      <Typography variant="h6" color="primary">
                        {formatCurrency(company.revenue)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Profit</Typography>
                      <Typography variant="h6" color="success.main">
                        {formatCurrency(company.profit)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Employees</Typography>
                      <Typography variant="h6">{company.employees}</Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2">Growth</Typography>
                      <Typography variant="h6" color={company.growth > 0 ? 'success.main' : 'error.main'}>
                        {company.growth > 0 ? '+' : ''}{company.growth}%
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      Profit Margin: {company.profitMargin}%
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={company.profitMargin} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        {/* Payments Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Alert severity="info">
              You have {userData.upcomingPayments.filter(p => getDaysUntilDue(p.dueDate) <= 7).length} payments due within the next 7 days.
            </Alert>
          </Grid>
          
          {userData.upcomingPayments.map((payment) => (
            <Grid item xs={12} md={6} key={payment.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">{payment.title}</Typography>
                    <Chip 
                      label={payment.priority.toUpperCase()}
                      color={getPriorityColor(payment.priority)}
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="h4" color="primary" gutterBottom>
                    {formatCurrency(payment.amount)}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <CalendarToday fontSize="small" />
                    <Typography variant="body2">
                      Due: {new Date(payment.dueDate).toLocaleDateString()} 
                      ({getDaysUntilDue(payment.dueDate)} days)
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Chip label={payment.category} size="small" />
                    <Chip label={payment.company} size="small" variant="outlined" />
                    {payment.isRecurring && <Chip label="Recurring" size="small" color="info" />}
                  </Box>
                  
                  <Button variant="contained" size="small" sx={{ mr: 1 }}>
                    Pay Now
                  </Button>
                  <Button variant="outlined" size="small">
                    Schedule
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {/* Goals & Achievements Tab */}
        <Grid container spacing={3}>
          {/* Goals Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp color="primary" />
              Current Goals
            </Typography>
          </Grid>
          
          {userData.goals.map((goal) => (
            <Grid item xs={12} md={4} key={goal.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>{goal.title}</Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {goal.category}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Progress</Typography>
                    <Typography variant="body2">
                      {getGoalProgress(goal.current, goal.target).toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <LinearProgress 
                    variant="determinate" 
                    value={getGoalProgress(goal.current, goal.target)}
                    sx={{ height: 8, borderRadius: 4, mb: 2 }}
                  />
                  
                  <Typography variant="body2">
                    {typeof goal.current === 'number' && goal.current > 1000 
                      ? formatCurrency(goal.current) 
                      : goal.current} / {typeof goal.target === 'number' && goal.target > 1000 
                      ? formatCurrency(goal.target) 
                      : goal.target}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary">
                    Deadline: {new Date(goal.deadline).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          {/* Achievements Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3 }}>
              <EmojiEvents color="warning" />
              Your Achievements
            </Typography>
          </Grid>
          
          {userData.achievements.map((achievement) => (
            <Grid item xs={12} sm={6} md={3} key={achievement.id}>
              <Card sx={{ textAlign: 'center', height: '100%' }}>
                <CardContent>
                  <Typography variant="h2" sx={{ mb: 1 }}>
                    {achievement.icon}
                  </Typography>
                  <Typography variant="h6" gutterBottom>
                    {achievement.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {achievement.description}
                  </Typography>
                  <Chip 
                    label={new Date(achievement.earnedDate).toLocaleDateString()}
                    size="small"
                    color="primary"
                  />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={4}>
        {/* Analytics Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom>Financial Analytics Dashboard</Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Advanced analytics powered by MyTracksy's AI intelligence system.
            </Alert>
          </Grid>
          
          {/* Revenue vs Expenses Chart Placeholder */}
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Revenue vs Expenses (6 Months)</Typography>
                <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.50' }}>
                  <Typography color="text.secondary">
                    📊 Interactive Chart - Revenue & Expenses Trends
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Key Metrics */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Key Metrics</Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary="Average Profit Margin"
                      secondary="30.7%"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Cash Flow Health"
                      secondary="Excellent"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Growth Rate"
                      secondary="+19.0%"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary="Financial Score"
                      secondary="88/100"
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          {/* Expense Categories */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Expense Categories</Typography>
                <Grid container spacing={2}>
                  {userData.analytics.categories.map((category, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                      <Box sx={{ p: 2, border: '1px solid', borderColor: 'grey.300', borderRadius: 1 }}>
                        <Typography variant="subtitle1">{category.name}</Typography>
                        <Typography variant="h6" color="primary">
                          {formatCurrency(category.amount)}
                        </Typography>
                        <LinearProgress 
                          variant="determinate" 
                          value={category.percentage} 
                          sx={{ mt: 1 }}
                        />
                        <Typography variant="caption">{category.percentage}% of total</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={5}>
        {/* Settings Tab */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Account Information</Typography>
                <List>
                  <ListItem>
                    <ListItemIcon><Email /></ListItemIcon>
                    <ListItemText 
                      primary="Email" 
                      secondary={userData.personalInfo.email}
                    />
                    <Chip label={userData.personalInfo.isEmailVerified ? "Verified" : "Pending"} 
                          color={userData.personalInfo.isEmailVerified ? "success" : "warning"} 
                          size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Phone /></ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={userData.personalInfo.phone}
                    />
                    <Chip label={userData.personalInfo.isPhoneVerified ? "Verified" : "Pending"} 
                          color={userData.personalInfo.isPhoneVerified ? "success" : "warning"} 
                          size="small" />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocationOn /></ListItemIcon>
                    <ListItemText 
                      primary="Location" 
                      secondary={userData.personalInfo.location}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CalendarToday /></ListItemIcon>
                    <ListItemText 
                      primary="Member Since" 
                      secondary={new Date(userData.personalInfo.joinedDate).toLocaleDateString()}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Privacy & Security</Typography>
                <List>
                  <ListItem>
                    <ListItemText primary="Two-Factor Authentication" secondary="Enhanced security for your account" />
                    <Button variant="outlined" size="small">Enable</Button>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Data Export" secondary="Download your financial data" />
                    <Button variant="outlined" size="small">Export</Button>
                  </ListItem>
                  <ListItem>
                    <ListItemText primary="Account Deletion" secondary="Permanently delete your account" />
                    <Button variant="outlined" color="error" size="small">Delete</Button>
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
      </Container>
    </Box>
  );
};