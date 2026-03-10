import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  AttachMoney as MoneyIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { Budget } from '../../types';
import { useActiveBudgets } from '../../hooks/useBudgets';

const BudgetInsights: React.FC = () => {
  const { activeBudgets, loading } = useActiveBudgets();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const calculateInsights = (): {
    totalBudget: number;
    totalSpent: number;
    overBudgetCount: number;
    nearLimitCount: number;
    onTrackCount: number;
    averageProgress: number;
    mostOverBudget: Budget | null;
    bestPerforming: Budget | null;
    recommendations: string[];
    budgetAnalysis?: any[];
  } => {
    if (activeBudgets.length === 0) {
      return {
        totalBudget: 0,
        totalSpent: 0,
        overBudgetCount: 0,
        nearLimitCount: 0,
        onTrackCount: 0,
        averageProgress: 0,
        mostOverBudget: null,
        bestPerforming: null,
        recommendations: []
      };
    }

    const totalBudget = activeBudgets.reduce((sum, budget) => sum + budget.amount, 0);
    const totalSpent = activeBudgets.reduce((sum, budget) => sum + (budget.spent || 0), 0);

    let overBudgetCount = 0;
    let nearLimitCount = 0;
    let onTrackCount = 0;
    let mostOverBudget: Budget | null = null;
    let bestPerforming: Budget | null = null;
    let maxOverage = 0;
    let bestProgress = Infinity;

    const budgetAnalysis = activeBudgets.map(budget => {
      const spent = budget.spent || 0;
      const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
      const remaining = budget.amount - spent;
      const overage = spent - budget.amount;

      let status: 'over' | 'near' | 'under';
      if (progress >= 100) {
        status = 'over';
        overBudgetCount++;
        if (overage > maxOverage) {
          maxOverage = overage;
          mostOverBudget = budget;
        }
      } else if (progress >= 80) {
        status = 'near';
        nearLimitCount++;
      } else {
        status = 'under';
        onTrackCount++;
        if (progress < bestProgress) {
          bestProgress = progress;
          bestPerforming = budget;
        }
      }

      return { budget, progress, remaining, status };
    });

    const averageProgress = budgetAnalysis.reduce((sum, item) => sum + item.progress, 0) / budgetAnalysis.length;

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (overBudgetCount > 0) {
      recommendations.push(`${overBudgetCount} budget${overBudgetCount === 1 ? ' is' : 's are'} over the limit. Review spending in these categories.`);
    }
    
    if (nearLimitCount > 0) {
      recommendations.push(`${nearLimitCount} budget${nearLimitCount === 1 ? ' is' : 's are'} near the limit. Monitor spending closely.`);
    }
    
    if (totalSpent > totalBudget * 0.9) {
      recommendations.push('Overall spending is high. Consider reducing expenses or adjusting budgets.');
    } else if (totalSpent < totalBudget * 0.5) {
      recommendations.push('You\'re spending well below your budgets. Consider reallocating funds or increasing savings.');
    }

    return {
      totalBudget,
      totalSpent,
      overBudgetCount,
      nearLimitCount,
      onTrackCount,
      averageProgress,
      mostOverBudget,
      bestPerforming,
      recommendations,
      budgetAnalysis
    };
  };

  const insights = calculateInsights();

  if (loading) {
    return (
      <Box>
        <Typography variant="h6" gutterBottom>
          Budget Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Loading insights...
        </Typography>
      </Box>
    );
  }

  if (activeBudgets.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Budget Insights
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create some budgets to see insights and recommendations.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Budget Insights
      </Typography>

      {/* Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <MoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {formatCurrency(insights.totalSpent)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of {formatCurrency(insights.totalBudget)} spent
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {((insights.totalSpent / insights.totalBudget) * 100).toFixed(1)}% overall
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {insights.onTrackCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                On Track
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <WarningIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {insights.nearLimitCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Near Limit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <TrendingUpIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h6">
                {insights.overBudgetCount}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Over Budget
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Performance Highlights */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Highlights
            </Typography>
            
            {insights.mostOverBudget && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <WarningIcon color="error" fontSize="small" />
                  <Typography variant="subtitle2" color="error.main">
                    Most Over Budget
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {insights.mostOverBudget.name}
                </Typography>
                <Typography variant="body2" color="error.main">
                  {formatCurrency((insights.mostOverBudget.spent || 0) - insights.mostOverBudget.amount)} over
                </Typography>
              </Box>
            )}

            {insights.bestPerforming && (
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircleIcon color="success" fontSize="small" />
                  <Typography variant="subtitle2" color="success.main">
                    Best Performing
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {insights.bestPerforming.name}
                </Typography>
                <Typography variant="body2" color="success.main">
                  {((insights.bestPerforming.spent || 0) / insights.bestPerforming.amount * 100).toFixed(1)}% used
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Average Progress
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SpeedIcon 
                  color={insights.averageProgress > 100 ? 'error' : insights.averageProgress > 80 ? 'warning' : 'success'}
                  fontSize="small" 
                />
                <Typography 
                  variant="h6"
                  color={insights.averageProgress > 100 ? 'error.main' : insights.averageProgress > 80 ? 'warning.main' : 'success.main'}
                >
                  {insights.averageProgress.toFixed(1)}%
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Recommendations */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recommendations
            </Typography>
            
            {insights.recommendations.length > 0 ? (
              <List dense>
                {insights.recommendations.map((recommendation, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <TrendingUpIcon fontSize="small" color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary={recommendation}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography variant="body2" color="text.secondary">
                All budgets are performing well! Keep up the good work.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* Quick Budget Status */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Budget Status Overview
            </Typography>
            <Grid container spacing={2}>
              {activeBudgets.map((budget) => {
                const spent = budget.spent || 0;
                const progress = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
                const status = progress >= 100 ? 'over' : progress >= 80 ? 'near' : 'under';
                
                return (
                  <Grid item xs={12} sm={6} md={4} key={budget.id}>
                    <Box sx={{ 
                      p: 2, 
                      border: '1px solid', 
                      borderColor: 'divider', 
                      borderRadius: 1,
                      '&:hover': { bgcolor: 'grey.50' }
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" noWrap>
                          {budget.name}
                        </Typography>
                        <Chip
                          size="small"
                          label={status === 'over' ? 'Over' : status === 'near' ? 'Near' : 'Good'}
                          color={status === 'over' ? 'error' : status === 'near' ? 'warning' : 'success'}
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(spent)} / {formatCurrency(budget.amount)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {progress.toFixed(1)}% • {budget.category} • {budget.period}
                      </Typography>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BudgetInsights;