import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  LinearProgress,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Badge,
  Button,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  TrendingUp,
  Storefront,
  Category,
  Timeline,
  ExpandMore,
  Insights,
  LocationOn,
  Schedule,
  AttachMoney,
  StarRate,
  Refresh,
  FilterList
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { merchantRecognitionService } from '../../services/merchantRecognitionService';

interface MerchantAnalyticsProps {
  expenses: any[];
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

interface SpendingPattern {
  category: string;
  amount: number;
  percentage: number;
  transactions: number;
  topMerchants: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

export const MerchantAnalytics: React.FC<MerchantAnalyticsProps> = ({
  expenses,
  timeRange = 'month'
}) => {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState(0);
  const [spendingPatterns, setSpendingPatterns] = useState<SpendingPattern[]>([]);
  const [merchantStats, setMerchantStats] = useState<any>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeSpendingPatterns();
  }, [expenses, timeRange]);

  const analyzeSpendingPatterns = () => {
    setLoading(true);

    // Get merchant analytics from the service
    const analytics = merchantRecognitionService.getMerchantAnalytics();
    setMerchantStats(analytics);

    // Analyze spending patterns from expenses
    const categoryMap = new Map<string, {
      amount: number;
      transactions: number;
      merchants: Map<string, { amount: number; count: number; }>;
    }>();

    let totalSpent = 0;

    expenses.forEach(expense => {
      totalSpent += expense.amount;
      const category = expense.category || 'Miscellaneous';
      
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          amount: 0,
          transactions: 0,
          merchants: new Map()
        });
      }

      const categoryData = categoryMap.get(category)!;
      categoryData.amount += expense.amount;
      categoryData.transactions += 1;

      const merchant = expense.merchant || 'Unknown';
      if (!categoryData.merchants.has(merchant)) {
        categoryData.merchants.set(merchant, { amount: 0, count: 0 });
      }
      
      const merchantData = categoryData.merchants.get(merchant)!;
      merchantData.amount += expense.amount;
      merchantData.count += 1;
    });

    // Convert to spending patterns
    const patterns: SpendingPattern[] = Array.from(categoryMap.entries()).map(([category, data]) => {
      const topMerchants = Array.from(data.merchants.entries())
        .map(([name, merchantData]) => ({
          name,
          amount: merchantData.amount,
          count: merchantData.count
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5);

      return {
        category,
        amount: data.amount,
        percentage: totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0,
        transactions: data.transactions,
        topMerchants
      };
    }).sort((a, b) => b.amount - a.amount);

    setSpendingPatterns(patterns);
    generateInsights(patterns, analytics);
    setLoading(false);
  };

  const generateInsights = (patterns: SpendingPattern[], analytics: any) => {
    const newInsights: string[] = [];

    // Top spending category
    if (patterns.length > 0) {
      const topCategory = patterns[0];
      newInsights.push(`Your highest spending category is ${topCategory.category} (${topCategory.percentage.toFixed(1)}% of total)`);
    }

    // Frequent merchants
    if (analytics.frequentMerchants.length > 0) {
      const topMerchant = analytics.frequentMerchants[0];
      newInsights.push(`You shop most frequently at ${topMerchant.merchantName} (${topMerchant.frequency} transactions)`);
    }

    // Category diversification
    const significantCategories = patterns.filter(p => p.percentage > 5).length;
    if (significantCategories <= 2) {
      newInsights.push('Consider diversifying your spending across more categories for better budget balance');
    } else if (significantCategories > 8) {
      newInsights.push('You have diverse spending patterns across many categories');
    }

    // Transaction patterns
    const avgTransactionValue = patterns.reduce((sum, p) => sum + p.amount, 0) / 
                                patterns.reduce((sum, p) => sum + p.transactions, 0);
    if (avgTransactionValue > 2000) {
      newInsights.push('You tend to make high-value transactions - consider breaking large purchases into smaller ones');
    }

    setInsights(newInsights);
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, React.ReactNode> = {
      'Food & Dining': '🍽️',
      'Groceries': '🛒',
      'Transport': '🚗',
      'Healthcare': '🏥',
      'Entertainment': '🎬',
      'Bills & Utilities': '💡',
      'Fuel': '⛽',
      'Shopping': '🛍️',
      'Education': '📚',
      'Religious': '🕉️'
    };
    return icons[category] || '📊';
  };

  const getCategoryColor = (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
    return colors[index % colors.length] as any;
  };

  const renderSpendingPatterns = () => (
    <Grid container spacing={3}>
      {spendingPatterns.map((pattern, index) => (
        <Grid item xs={12} md={6} lg={4} key={pattern.category}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <Avatar sx={{ mr: 1, bgcolor: 'primary.light' }}>
                  {getCategoryIcon(pattern.category)}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" noWrap>
                    {pattern.category}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {pattern.transactions} transactions
                  </Typography>
                </Box>
                <Chip 
                  label={`${pattern.percentage.toFixed(1)}%`}
                  color={getCategoryColor(index)}
                  size="small"
                />
              </Box>

              <Typography variant="h5" color="primary" gutterBottom>
                LKR {pattern.amount.toLocaleString()}
              </Typography>

              <LinearProgress 
                variant="determinate" 
                value={pattern.percentage} 
                sx={{ mb: 2, height: 8, borderRadius: 4 }}
                color={getCategoryColor(index)}
              />

              {pattern.topMerchants.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Top Merchants:
                  </Typography>
                  {pattern.topMerchants.slice(0, 3).map((merchant, idx) => (
                    <Typography key={idx} variant="caption" display="block" color="text.secondary">
                      {merchant.name}: LKR {merchant.amount.toLocaleString()} ({merchant.count}x)
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );

  const renderMerchantStats = () => (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Storefront sx={{ mr: 1, verticalAlign: 'middle' }} />
              Merchant Statistics
            </Typography>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Total Merchants</Typography>
              <Chip label={merchantStats?.totalMerchants || 0} color="primary" />
            </Box>
            
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Typography variant="body2">Categories Used</Typography>
              <Chip label={merchantStats?.categoriesUsed?.length || 0} color="secondary" />
            </Box>

            <Box mt={2}>
              <Typography variant="subtitle2" gutterBottom>Categories:</Typography>
              <Box display="flex" flexWrap="wrap" gap={0.5}>
                {merchantStats?.categoriesUsed?.map((category: string, index: number) => (
                  <Chip 
                    key={category} 
                    label={category} 
                    size="small" 
                    variant="outlined"
                    color={getCategoryColor(index)}
                  />
                ))}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={6}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <StarRate sx={{ mr: 1, verticalAlign: 'middle' }} />
              Frequent Merchants
            </Typography>
            
            <List dense>
              {merchantStats?.frequentMerchants?.slice(0, 5).map((merchant: any, index: number) => (
                <ListItem key={merchant.merchantName}>
                  <ListItemIcon>
                    <Badge badgeContent={merchant.frequency} color="primary">
                      <Storefront />
                    </Badge>
                  </ListItemIcon>
                  <ListItemText
                    primary={merchant.merchantName}
                    secondary={`${merchant.category} • Last seen: ${new Date(merchant.lastSeen).toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  const renderInsights = () => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          <Insights sx={{ mr: 1, verticalAlign: 'middle' }} />
          Spending Insights
        </Typography>
        
        {insights.map((insight, index) => (
          <Alert key={index} severity="info" sx={{ mb: 1 }}>
            {insight}
          </Alert>
        ))}

        {insights.length === 0 && (
          <Alert severity="info">
            Add more transactions to get personalized spending insights!
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <Box textAlign="center">
          <LinearProgress sx={{ mb: 2, width: 200 }} />
          <Typography variant="body2" color="text.secondary">
            Analyzing spending patterns...
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
          Merchant Analytics
        </Typography>
        
        <Tooltip title="Refresh Analytics">
          <IconButton onClick={analyzeSpendingPatterns} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs 
        value={activeTab} 
        onChange={(e, newValue) => setActiveTab(newValue)}
        sx={{ mb: 3 }}
      >
        <Tab label="Spending Patterns" icon={<Category />} />
        <Tab label="Merchant Stats" icon={<Storefront />} />
        <Tab label="Insights" icon={<Insights />} />
      </Tabs>

      {activeTab === 0 && renderSpendingPatterns()}
      {activeTab === 1 && renderMerchantStats()}
      {activeTab === 2 && renderInsights()}

      {spendingPatterns.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No spending data available. Start adding expenses to see detailed analytics!
        </Alert>
      )}
    </Box>
  );
};