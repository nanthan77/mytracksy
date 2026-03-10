import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  LinearProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  Alert,
  Switch,
  FormControlLabel,
  Button,
  ButtonGroup,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  TrendingFlat,
  Analytics,
  AttachMoney,
  AccountBalance,
  Category,
  Store,
  Timeline,
  PieChart,
  BarChart,
  ShowChart,
  Warning,
  CheckCircle,
  Info,
  ExpandMore,
  FilterList,
  DateRange,
  Business,
  Group,
  Assignment,
  CreditCard,
  Receipt,
  Lightbulb,
  Event,
  EmojiEvents,
  LocalAtm
} from '@mui/icons-material';
import {
  advancedAnalyticsService,
  AdvancedAnalyticsData,
  AnalyticsFilters,
  PeriodFilter
} from '../../services/advancedAnalyticsService';
import { multiCompanyService } from '../../services/multiCompanyService';
import { budgetAlertService } from '../../services/budgetAlertService';

interface AdvancedAnalyticsDashboardProps {
  onNavigateToExpense?: (expenseId: string) => void;
}

export const AdvancedAnalyticsDashboard: React.FC<AdvancedAnalyticsDashboardProps> = ({
  onNavigateToExpense
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [analyticsData, setAnalyticsData] = useState<AdvancedAnalyticsData | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [realTimeMode, setRealTimeMode] = useState(false);
  const [showForecasts, setShowForecasts] = useState(true);
  const [showCultural, setShowCultural] = useState(true);

  const companies = multiCompanyService.getUserCompanies();

  useEffect(() => {
    loadAnalyticsData();
    loadDashboardData();
  }, [selectedPeriod, selectedCompany]);

  useEffect(() => {
    if (realTimeMode) {
      const interval = setInterval(() => {
        loadDashboardData();
      }, 30000); // Update every 30 seconds

      return () => clearInterval(interval);
    }
  }, [realTimeMode, selectedCompany]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const filters: AnalyticsFilters = {
        companyId: selectedCompany || undefined,
        period: getPeriodFilter(selectedPeriod)
      };

      const data = await advancedAnalyticsService.generateAdvancedAnalytics(filters);
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const data = await advancedAnalyticsService.getDashboardData(selectedCompany || undefined);
      setDashboardData(data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getPeriodFilter = (period: string): PeriodFilter => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(endDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(endDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    return {
      startDate,
      endDate,
      period: period as any
    };
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getBudgetHealthColor = (health: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (health) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'warning': return 'warning';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp color="success" />;
      case 'down': return <TrendingDown color="error" />;
      case 'stable': return <TrendingFlat color="info" />;
    }
  };

  const renderOverviewTab = () => (
    <Grid container spacing={3}>
      {/* Quick Stats */}
      <Grid item xs={12}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            <Analytics sx={{ mr: 1, verticalAlign: 'middle' }} />
            Real-time Overview
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="primary">
                    {dashboardData ? formatCurrency(dashboardData.todaySpending) : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Today's Spending
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="success.main">
                    {dashboardData ? formatCurrency(dashboardData.weekSpending) : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="h4" color="warning.main">
                    {dashboardData ? formatCurrency(dashboardData.monthSpending) : '-'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This Month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Typography variant="h4" color={dashboardData ? getBudgetHealthColor(dashboardData.budgetHealth) : 'info'}>
                      {dashboardData?.budgetHealth || 'Loading...'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      Budget Health
                    </Typography>
                  </Box>
                  {dashboardData?.activeAlerts > 0 && (
                    <Chip 
                      label={`${dashboardData.activeAlerts} alerts`} 
                      color="warning" 
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Top Categories */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
              Top Categories
            </Typography>
            {dashboardData?.topCategories?.map((category, index) => (
              <Box key={index} mb={2}>
                <Box display="flex" justifyContent="between" alignItems="center">
                  <Box display="flex" alignItems="center">
                    <Typography variant="body1" sx={{ mr: 1 }}>
                      {category.icon}
                    </Typography>
                    <Typography variant="body1">
                      {category.category}
                    </Typography>
                  </Box>
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(category.amount)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((category.amount / (dashboardData.monthSpending || 1)) * 100, 100)}
                  sx={{ height: 6, borderRadius: 3, mt: 1 }}
                />
              </Box>
            ))}
          </CardContent>
        </Card>
      </Grid>

      {/* Recent Transactions */}
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Receipt sx={{ mr: 1, verticalAlign: 'middle' }} />
              Recent Transactions
            </Typography>
            <List>
              {dashboardData?.recentTransactions?.map((transaction, index) => (
                <ListItem key={index} divider>
                  <ListItemText
                    primary={transaction.description}
                    secondary={`${transaction.category} • ${transaction.date.toLocaleDateString()}`}
                  />
                  <Typography variant="body1" fontWeight="bold">
                    {formatCurrency(transaction.amount)}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>

      {/* Cultural Events Impact */}
      {showCultural && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                Upcoming Cultural Events
              </Typography>
              <Grid container spacing={2}>
                {dashboardData?.culturalEvents?.map((event, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Box p={2} border={1} borderColor="divider" borderRadius={2}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {event.event}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.date}
                      </Typography>
                      <Chip
                        label={`${event.impact} impact`}
                        color={event.impact === 'high' ? 'error' : event.impact === 'medium' ? 'warning' : 'success'}
                        size="small"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}

      {/* Summary Analytics */}
      {analyticsData && (
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <BarChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                Period Summary ({selectedPeriod})
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {formatCurrency(analyticsData.summary.totalExpenses)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="success.main">
                      {analyticsData.summary.totalTransactions}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Transactions
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="warning.main">
                      {formatCurrency(analyticsData.summary.averagePerTransaction)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Average / Transaction
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" display="flex" alignItems="center" justifyContent="center">
                    <Typography variant="h4" color={analyticsData.summary.monthlyGrowth >= 0 ? 'success.main' : 'error.main'}>
                      {analyticsData.summary.monthlyGrowth >= 0 ? '+' : ''}{analyticsData.summary.monthlyGrowth.toFixed(1)}%
                    </Typography>
                    {getTrendIcon(analyticsData.summary.monthlyGrowth > 5 ? 'up' : analyticsData.summary.monthlyGrowth < -5 ? 'down' : 'stable')}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Monthly Growth
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      )}
    </Grid>
  );

  const renderInsightsTab = () => (
    <Grid container spacing={3}>
      {analyticsData && (
        <>
          {/* Top Categories Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <PieChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Top Categories
                </Typography>
                {analyticsData.insights.topCategories.map((category, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="between">
                      <Typography variant="body1">{category.category}</Typography>
                      <Box>
                        <Typography variant="body1" component="span">
                          {formatCurrency(category.amount)}
                        </Typography>
                        <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                          ({category.percentage.toFixed(1)}%)
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={category.percentage}
                      sx={{ height: 8, borderRadius: 4, mt: 1 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Top Merchants */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Store sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Top Merchants
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Merchant</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Transactions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analyticsData.insights.topMerchants.slice(0, 5).map((merchant, index) => (
                      <TableRow key={index}>
                        <TableCell>{merchant.merchant}</TableCell>
                        <TableCell align="right">{formatCurrency(merchant.amount)}</TableCell>
                        <TableCell align="right">{merchant.transactions}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </Grid>

          {/* Spending Trends */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <ShowChart sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Spending Trends
                </Typography>
                <Grid container spacing={2}>
                  {analyticsData.insights.spendingTrends.slice(-6).map((trend, index) => (
                    <Grid item xs={6} sm={4} md={2} key={index}>
                      <Box textAlign="center" p={1} border={1} borderColor="divider" borderRadius={2}>
                        <Typography variant="body2" color="text.secondary">
                          {trend.month}
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(trend.amount)}
                        </Typography>
                        <Box display="flex" alignItems="center" justifyContent="center">
                          <Typography 
                            variant="caption" 
                            color={trend.change >= 0 ? 'success.main' : 'error.main'}
                          >
                            {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}%
                          </Typography>
                          {getTrendIcon(trend.change > 5 ? 'up' : trend.change < -5 ? 'down' : 'stable')}
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Budget Performance */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <AccountBalance sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Budget Performance
                </Typography>
                <Grid container spacing={2}>
                  {analyticsData.insights.budgetPerformance.map((budget, index) => (
                    <Grid item xs={12} md={6} lg={4} key={index}>
                      <Box p={2} border={1} borderColor="divider" borderRadius={2}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {budget.category}
                        </Typography>
                        <Box display="flex" justifyContent="between" mt={1}>
                          <Typography variant="body2">Budgeted:</Typography>
                          <Typography variant="body2">{formatCurrency(budget.budgeted)}</Typography>
                        </Box>
                        <Box display="flex" justifyContent="between">
                          <Typography variant="body2">Spent:</Typography>
                          <Typography variant="body2">{formatCurrency(budget.spent)}</Typography>
                        </Box>
                        <Box mt={1}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min((budget.spent / budget.budgeted) * 100, 100)}
                            color={budget.spent > budget.budgeted ? 'error' : 'primary'}
                            sx={{ height: 6, borderRadius: 3 }}
                          />
                          <Typography 
                            variant="caption" 
                            color={budget.variance > 0 ? 'error.main' : 'success.main'}
                          >
                            {budget.variance >= 0 ? '+' : ''}{budget.variance.toFixed(1)}% variance
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Cultural Impact Analysis */}
          {showCultural && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <EmojiEvents sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Cultural Events Impact
                  </Typography>
                  <Grid container spacing={2}>
                    {analyticsData.insights.culturalImpact.map((impact, index) => (
                      <Grid item xs={12} md={4} key={index}>
                        <Box p={2} border={1} borderColor="divider" borderRadius={2}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {impact.event}
                          </Typography>
                          <Typography variant="h6" color="warning.main">
                            +{impact.increase}% increase
                          </Typography>
                          <Box mt={1}>
                            {impact.categories.map((category, catIndex) => (
                              <Chip
                                key={catIndex}
                                label={category}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Payment Method Breakdown */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <CreditCard sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Payment Methods
                </Typography>
                {Object.entries(analyticsData.insights.paymentMethodBreakdown).map(([method, data]) => (
                  <Box key={method} mb={2}>
                    <Box display="flex" justifyContent="between">
                      <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                        {method.replace('-', ' ')}
                      </Typography>
                      <Box>
                        <Typography variant="body1" component="span">
                          {formatCurrency(data.amount)}
                        </Typography>
                        <Typography variant="body2" component="span" color="text.secondary" sx={{ ml: 1 }}>
                          ({data.count} transactions)
                        </Typography>
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(data.amount / analyticsData.summary.totalExpenses) * 100}
                      sx={{ height: 6, borderRadius: 3, mt: 1 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderForecastsTab = () => (
    <Grid container spacing={3}>
      {analyticsData && showForecasts && (
        <>
          {/* Monthly Forecast */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Timeline sx={{ mr: 1, verticalAlign: 'middle' }} />
                  6-Month Spending Forecast
                </Typography>
                <Grid container spacing={2}>
                  {analyticsData.forecasts.monthlyForecast.map((forecast, index) => (
                    <Grid item xs={6} sm={4} md={2} key={index}>
                      <Box textAlign="center" p={2} border={1} borderColor="divider" borderRadius={2}>
                        <Typography variant="body2" color="text.secondary">
                          {forecast.month}
                        </Typography>
                        <Typography variant="h6">
                          {formatCurrency(forecast.predicted)}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={forecast.confidence * 100}
                          sx={{ height: 4, borderRadius: 2, mt: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {(forecast.confidence * 100).toFixed(0)}% confidence
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Category Forecasts */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Category sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Category Forecasts
                </Typography>
                {Object.entries(analyticsData.forecasts.categoryForecasts).map(([category, forecast]) => (
                  <Box key={category} mb={2}>
                    <Box display="flex" justifyContent="between" alignItems="center">
                      <Typography variant="body1">{category}</Typography>
                      <Box display="flex" alignItems="center">
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                          {formatCurrency(forecast.current)} → {formatCurrency(forecast.predicted)}
                        </Typography>
                        {getTrendIcon(forecast.trend)}
                      </Box>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((forecast.predicted / forecast.current) * 50, 100)}
                      color={forecast.trend === 'up' ? 'warning' : forecast.trend === 'down' ? 'success' : 'info'}
                      sx={{ height: 6, borderRadius: 3, mt: 1 }}
                    />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Budget Risk Analysis */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Budget Risk Analysis
                </Typography>
                {analyticsData.forecasts.budgetRiskAnalysis.map((risk, index) => (
                  <Box key={index} mb={2}>
                    <Box display="flex" justifyContent="between" alignItems="center">
                      <Typography variant="body1">{risk.category}</Typography>
                      <Chip
                        label={risk.riskLevel}
                        color={risk.riskLevel === 'high' ? 'error' : risk.riskLevel === 'medium' ? 'warning' : 'success'}
                        size="small"
                      />
                    </Box>
                    {risk.daysToExceed > 0 && (
                      <Typography variant="body2" color="text.secondary">
                        Budget may be exceeded in {risk.daysToExceed} days
                      </Typography>
                    )}
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </>
      )}
    </Grid>
  );

  const renderRecommendationsTab = () => (
    <Grid container spacing={3}>
      {analyticsData && (
        <>
          {/* Budget Optimizations */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <Lightbulb sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Budget Optimization Recommendations
                </Typography>
                {analyticsData.recommendations.budgetOptimizations.map((opt, index) => (
                  <Accordion key={index}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box display="flex" justifyContent="between" alignItems="center" width="100%">
                        <Typography variant="subtitle1">{opt.category}</Typography>
                        <Box display="flex" alignItems="center">
                          <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                            {formatCurrency(opt.currentBudget)} → {formatCurrency(opt.recommendedBudget)}
                          </Typography>
                          <Chip
                            label={`${formatCurrency(opt.potentialSavings)} savings`}
                            color="success"
                            size="small"
                          />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body2" paragraph>
                        {opt.reasoning}
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={opt.confidence * 100}
                        sx={{ height: 4, borderRadius: 2 }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {(opt.confidence * 100).toFixed(0)}% confidence
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Cost Savings */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  <LocalAtm sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Cost Saving Opportunities
                </Typography>
                {analyticsData.recommendations.costSavings.map((saving, index) => (
                  <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={2}>
                    <Box display="flex" justifyContent="between" alignItems="center" mb={1}>
                      <Typography variant="subtitle2">{saving.category}</Typography>
                      <Chip
                        label={formatCurrency(saving.potentialSavings)}
                        color="success"
                        size="small"
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {saving.suggestion}
                    </Typography>
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>

          {/* Cultural Preparation */}
          {showCultural && (
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    <Event sx={{ mr: 1, verticalAlign: 'middle' }} />
                    Cultural Event Preparation
                  </Typography>
                  {analyticsData.recommendations.culturalPreparation.map((prep, index) => (
                    <Box key={index} mb={2} p={2} border={1} borderColor="divider" borderRadius={2}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {prep.event}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {prep.date}
                      </Typography>
                      <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                        Suggested Budget: {formatCurrency(prep.suggestedBudget)}
                      </Typography>
                      <Box mt={1}>
                        {prep.categories.map((category, catIndex) => (
                          <Chip
                            key={catIndex}
                            label={category}
                            size="small"
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </>
      )}
    </Grid>
  );

  if (loading && !analyticsData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header Controls */}
      <Box mb={3}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Period</InputLabel>
              <Select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
              >
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
                <MenuItem value="quarter">Last Quarter</MenuItem>
                <MenuItem value="year">Last Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth>
              <InputLabel>Company</InputLabel>
              <Select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
              >
                <MenuItem value="">All Companies</MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={realTimeMode}
                  onChange={(e) => setRealTimeMode(e.target.checked)}
                />
              }
              label="Real-time Updates"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <ButtonGroup>
              <Button
                variant={showForecasts ? 'contained' : 'outlined'}
                onClick={() => setShowForecasts(!showForecasts)}
                size="small"
              >
                Forecasts
              </Button>
              <Button
                variant={showCultural ? 'contained' : 'outlined'}
                onClick={() => setShowCultural(!showCultural)}
                size="small"
              >
                Cultural
              </Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Box>

      {/* Main Content */}
      <Box>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="Overview" icon={<Analytics />} />
          <Tab label="Insights" icon={<PieChart />} />
          <Tab label="Forecasts" icon={<Timeline />} />
          <Tab label="Recommendations" icon={<Lightbulb />} />
        </Tabs>

        {activeTab === 0 && renderOverviewTab()}
        {activeTab === 1 && renderInsightsTab()}
        {activeTab === 2 && renderForecastsTab()}
        {activeTab === 3 && renderRecommendationsTab()}
      </Box>
    </Box>
  );
};