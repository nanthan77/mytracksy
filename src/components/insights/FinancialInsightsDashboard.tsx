import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  Chip
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { analyticsService, FinancialSummary } from '../../services/analyticsService';
import SpendingTrendsChart from '../charts/SpendingTrendsChart';
import CategoryBreakdownChart from '../charts/CategoryBreakdownChart';
import BudgetProgressChart from '../charts/BudgetProgressChart';

const FinancialInsightsDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [spendingTrends, setSpendingTrends] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [budgetData, setBudgetData] = useState<any[]>([]);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, period]);

  const loadDashboardData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      const [
        summaryData,
        trendsData,
        categoryBreakdown,
        budgetAnalysis,
        spendingComparison
      ] = await Promise.all([
        analyticsService.getFinancialSummary(currentUser.uid, period),
        analyticsService.getSpendingTrends(currentUser.uid, period === 'month' ? 'month' : 'quarter'),
        analyticsService.getCategoryBreakdown(currentUser.uid),
        analyticsService.getBudgetAnalysis(currentUser.uid),
        analyticsService.getSpendingComparison(currentUser.uid)
      ]);

      setSummary(summaryData);
      setSpendingTrends(trendsData);
      setCategoryData(categoryBreakdown);
      setBudgetData(budgetAnalysis);
      setComparison(spendingComparison);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getChangeIcon = (change: number) => {
    return change >= 0 ? 
      <TrendingUpIcon color={change > 0 ? 'error' : 'inherit'} fontSize="small" /> :
      <TrendingDownIcon color="success" fontSize="small" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'error.main';
    if (change < 0) return 'success.main';
    return 'text.secondary';
  };

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Financial Insights
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} />
            </Grid>
          ))}
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={350} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Skeleton variant="rectangular" height={350} />
          </Grid>
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Financial Insights
        </Typography>
        <FormControl sx={{ minWidth: 120 }}>
          <InputLabel>Period</InputLabel>
          <Select
            value={period}
            label="Period"
            onChange={(e) => setPeriod(e.target.value as any)}
          >
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="quarter">This Quarter</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <MoneyIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Total Spent
                </Typography>
              </Box>
              <Typography variant="h4" component="div" gutterBottom>
                {formatCurrency(summary?.totalSpent || 0)}
              </Typography>
              {comparison && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getChangeIcon(comparison.change)}
                  <Typography 
                    variant="body2" 
                    sx={{ color: getChangeColor(comparison.change), ml: 0.5 }}
                  >
                    {comparison.change >= 0 ? '+' : ''}{formatCurrency(comparison.change)} vs last month
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Budget Usage
                </Typography>
              </Box>
              <Typography variant="h4" component="div" gutterBottom>
                {formatPercentage(summary?.budgetUtilization || 0)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(summary?.totalSpent || 0)} of {formatCurrency(summary?.totalBudget || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <PieChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Top Category
                </Typography>
              </Box>
              <Typography variant="h6" component="div" gutterBottom>
                {summary?.topCategory || 'No expenses'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatCurrency(summary?.topCategoryAmount || 0)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <BarChartIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6" component="div">
                  Daily Average
                </Typography>
              </Box>
              <Typography variant="h4" component="div" gutterBottom>
                {formatCurrency(summary?.avgDailySpending || 0)}
              </Typography>
              {summary && summary.overspentBudgets > 0 && (
                <Chip
                  label={`${summary.overspentBudgets} over budget`}
                  color="error"
                  size="small"
                />
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Spending Trends */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <SpendingTrendsChart
                data={spendingTrends}
                title="Spending Trends"
                period={period === 'month' ? 'month' : 'quarter'}
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Category Breakdown */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <CategoryBreakdownChart
                data={categoryData}
                title="Spending by Category"
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Budget Progress */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <BudgetProgressChart
                data={budgetData}
                title="Budget Progress"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Insights */}
      {summary && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Financial Health Score
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" component="div">
                    {Math.round(100 - summary.budgetUtilization)}/100
                  </Typography>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Based on budget utilization and savings rate
                    </Typography>
                    {summary.budgetUtilization > 90 && (
                      <Chip label="Review spending" color="warning" size="small" />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Savings Rate
                </Typography>
                <Typography variant="h4" component="div" gutterBottom>
                  {formatPercentage(summary.savingsRate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {summary.savingsRate > 20 ? 'Excellent saving habits!' : 
                   summary.savingsRate > 10 ? 'Good progress on savings' :
                   'Consider increasing your savings rate'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default FinancialInsightsDashboard;