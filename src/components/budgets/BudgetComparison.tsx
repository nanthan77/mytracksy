import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  Alert
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { Budget } from '../../types';
import { useBudgetProgress } from '../../hooks/useBudgets';
import { format, differenceInDays } from 'date-fns';

interface BudgetComparisonProps {
  budget: Budget;
  showDetails?: boolean;
}

const BudgetComparison: React.FC<BudgetComparisonProps> = ({ 
  budget, 
  showDetails = false 
}) => {
  const progress = useBudgetProgress(budget);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const remaining = differenceInDays(budget.endDate, now);
    return Math.max(0, remaining);
  };

  const getDailyBudget = () => {
    const totalDays = differenceInDays(budget.endDate, budget.startDate) + 1;
    return budget.amount / totalDays;
  };

  const getDailySpending = () => {
    const daysElapsed = differenceInDays(new Date(), budget.startDate) + 1;
    const spent = budget.spent || 0;
    return daysElapsed > 0 ? spent / daysElapsed : 0;
  };

  const getProjectedSpending = () => {
    const dailySpending = getDailySpending();
    const totalDays = differenceInDays(budget.endDate, budget.startDate) + 1;
    return dailySpending * totalDays;
  };

  const getSpendingTrend = () => {
    const dailyBudget = getDailyBudget();
    const dailySpending = getDailySpending();
    const difference = dailySpending - dailyBudget;
    const percentageDiff = dailyBudget > 0 ? (difference / dailyBudget) * 100 : 0;

    return {
      difference,
      percentageDiff: Math.abs(percentageDiff),
      isOverBudget: difference > 0,
      severity: Math.abs(percentageDiff) > 20 ? 'high' : Math.abs(percentageDiff) > 10 ? 'medium' : 'low'
    };
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'over':
        return 'error';
      case 'near':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getRecommendation = () => {
    const trend = getSpendingTrend();
    const daysRemaining = getDaysRemaining();
    const remainingBudget = budget.amount - (budget.spent || 0);
    const recommendedDaily = daysRemaining > 0 ? remainingBudget / daysRemaining : 0;

    if (progress.status === 'over') {
      return {
        type: 'error',
        message: `You've exceeded your budget by ${formatCurrency(Math.abs(progress.remaining))}. Consider reviewing your spending habits.`
      };
    }

    if (trend.isOverBudget && trend.severity === 'high') {
      return {
        type: 'warning',
        message: `You're spending ${trend.percentageDiff.toFixed(1)}% more than planned daily. Try to limit to ${formatCurrency(recommendedDaily)} per day.`
      };
    }

    if (progress.status === 'near') {
      return {
        type: 'warning',
        message: `You're approaching your budget limit. You have ${formatCurrency(remainingBudget)} left for ${daysRemaining} days.`
      };
    }

    return {
      type: 'success',
      message: `You're on track! You can spend up to ${formatCurrency(recommendedDaily)} per day for the remaining ${daysRemaining} days.`
    };
  };

  const trend = getSpendingTrend();
  const projectedSpending = getProjectedSpending();
  const recommendation = getRecommendation();
  const daysRemaining = getDaysRemaining();

  return (
    <Box>
      {/* Main Comparison Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" component="div">
              {budget.name}
            </Typography>
            <Chip
              icon={progress.status === 'over' ? <WarningIcon /> : <CheckCircleIcon />}
              label={progress.status === 'over' ? 'Over Budget' : progress.status === 'near' ? 'Near Limit' : 'On Track'}
              color={progress.status === 'over' ? 'error' : progress.status === 'near' ? 'warning' : 'success'}
              variant="outlined"
            />
          </Box>

          <Grid container spacing={3}>
            {/* Budget vs Actual */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Spent vs Budget
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {progress.percentage.toFixed(1)}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(progress.percentage, 100)}
                  color={getProgressColor()}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" color={progress.status === 'over' ? 'error.main' : 'text.primary'}>
                    {formatCurrency(budget.spent || 0)}
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(budget.amount)}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Projected vs Budget */}
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Projected Spending
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {projectedSpending > budget.amount ? (
                      <TrendingUpIcon color="error" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="success" fontSize="small" />
                    )}
                    <Typography
                      variant="body2"
                      color={projectedSpending > budget.amount ? 'error.main' : 'success.main'}
                    >
                      {((projectedSpending / budget.amount) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((projectedSpending / budget.amount) * 100, 100)}
                  color={projectedSpending > budget.amount ? 'error' : 'success'}
                  sx={{ height: 8, borderRadius: 4, mb: 1 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography
                    variant="h6"
                    color={projectedSpending > budget.amount ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(projectedSpending)}
                  </Typography>
                  <Typography variant="h6">
                    {formatCurrency(budget.amount)}
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {/* Recommendation */}
          <Alert severity={recommendation.type as any} sx={{ mt: 2 }}>
            {recommendation.message}
          </Alert>
        </CardContent>
      </Card>

      {/* Detailed Analysis */}
      {showDetails && (
        <Grid container spacing={3}>
          {/* Daily Spending Analysis */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Daily Spending Analysis
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Daily Budget:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {formatCurrency(getDailyBudget())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Actual Daily Avg:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color={trend.isOverBudget ? 'error.main' : 'success.main'}
                  >
                    {formatCurrency(getDailySpending())}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Difference:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {trend.isOverBudget ? (
                      <TrendingUpIcon color="error" fontSize="small" />
                    ) : (
                      <TrendingDownIcon color="success" fontSize="small" />
                    )}
                    <Typography
                      variant="body1"
                      fontWeight="medium"
                      color={trend.isOverBudget ? 'error.main' : 'success.main'}
                    >
                      {trend.isOverBudget ? '+' : ''}{formatCurrency(trend.difference)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Period Information */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Budget Period
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Period:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {format(budget.startDate, 'MMM d')} - {format(budget.endDate, 'MMM d, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Days Remaining:
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {daysRemaining} days
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining Budget:
                  </Typography>
                  <Typography
                    variant="body1"
                    fontWeight="medium"
                    color={progress.remaining >= 0 ? 'success.main' : 'error.main'}
                  >
                    {formatCurrency(Math.abs(progress.remaining))}
                    {progress.remaining < 0 && ' over'}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default BudgetComparison;