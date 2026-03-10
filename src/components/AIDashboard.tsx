import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  LinearProgress,
  Chip,
  Alert,
  TextField,
  Button,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  IconButton,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Psychology,
  TrendingUp,
  Warning,
  Lightbulb,
  Security,
  ExpandMore,
  Send,
  AutoAwesome,
  SmartToy,
  Analytics,
  PredictiveText,
  Shield,
  CurrencyExchange,
  Timeline,
  Psychology as PsychologyIcon
} from '@mui/icons-material';
import { aiCategorizationService, AIInsight, CategoryPrediction } from '../services/aiCategorizationService';

interface AIDashboardProps {
  expenses: any[];
  onCategoryUpdate?: (expenseId: string, newCategory: string) => void;
  onInsightAction?: (insight: AIInsight) => void;
}

interface SmartQuery {
  id: string;
  query: string;
  answer: string;
  timestamp: Date;
  language: 'en' | 'si' | 'ta';
}

export const AIDashboard: React.FC<AIDashboardProps> = ({
  expenses,
  onCategoryUpdate,
  onInsightAction
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [smartQuery, setSmartQuery] = useState('');
  const [queryHistory, setQueryHistory] = useState<SmartQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);
  const [predictiveBudget, setPredictiveBudget] = useState<any>(null);
  const [uncategorizedExpenses, setUncategorizedExpenses] = useState<any[]>([]);
  const [queryLanguage, setQueryLanguage] = useState<'en' | 'si' | 'ta'>('en');

  // Common queries for different languages
  const commonQueries = {
    en: [
      "How much did I spend on food this month?",
      "What's my biggest expense category?",
      "Show me unusual transactions",
      "When do I spend the most?",
      "Compare this month to last month",
      "What are my cultural expenses?"
    ],
    si: [
      "මම මේ මාසයේ ආහාර සඳහා කීයද වියදම් කළේ?",
      "මගේ විශාලතම වියදම් කාණ්ඩය කුමක්ද?",
      "අසාමාන්‍ය ගනුදෙනු පෙන්වන්න",
      "මම වැඩිපුරම වියදම් කරන්නේ කවදාද?",
      "මේ මාසය පසුගිය මාසය සමඟ සංසන්දනය කරන්න"
    ],
    ta: [
      "இந்த மாதம் உணவுக்கு எவ்வளவு செலவு செய்தேன்?",
      "எனது மிகப்பெரிய செலவு வகை எது?",
      "அசாதாரண பரிவர்த்தனைகளைக் காட்டு",
      "நான் எப்போது அதிகம் செலவு செய்கிறேன்?",
      "இந்த மாதத்தை கடந்த மாதத்துடன் ஒப்பிடு"
    ]
  };

  useEffect(() => {
    loadAIInsights();
    loadUncategorizedExpenses();
    generatePredictiveBudget();
  }, [expenses]);

  const loadAIInsights = async () => {
    setLoading(true);
    try {
      const generatedInsights = await aiCategorizationService.generateFinancialInsights(
        expenses,
        'current-user',
        'month'
      );
      setInsights(generatedInsights);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUncategorizedExpenses = () => {
    const uncategorized = expenses.filter(expense => 
      !expense.category || 
      expense.category === 'Other' || 
      expense.category === 'Uncategorized'
    );
    setUncategorizedExpenses(uncategorized);
  };

  const generatePredictiveBudget = async () => {
    try {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const budget = await aiCategorizationService.generatePredictiveBudget(
        expenses,
        'current-user',
        nextMonth
      );
      setPredictiveBudget(budget);
    } catch (error) {
      console.error('Error generating predictive budget:', error);
    }
  };

  const handleSmartQuery = async () => {
    if (!smartQuery.trim()) return;

    setQueryLoading(true);
    try {
      const response = await aiCategorizationService.processNaturalLanguageQuery(
        smartQuery,
        expenses,
        queryLanguage
      );

      const newQuery: SmartQuery = {
        id: Date.now().toString(),
        query: smartQuery,
        answer: response.answer,
        timestamp: new Date(),
        language: queryLanguage
      };

      setQueryHistory(prev => [newQuery, ...prev.slice(0, 9)]);
      setSmartQuery('');
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setQueryLoading(false);
    }
  };

  const handleQuickQuery = (query: string) => {
    setSmartQuery(query);
    handleSmartQuery();
  };

  const categorizeExpense = async (expense: any) => {
    try {
      const prediction = await aiCategorizationService.categorizeExpense(
        expense.description,
        expense.merchant || '',
        expense.amount,
        'current-user',
        { isPoyaDay: false }
      );

      if (onCategoryUpdate) {
        onCategoryUpdate(expense.id, prediction.category);
      }

      // Remove from uncategorized list
      setUncategorizedExpenses(prev => 
        prev.filter(exp => exp.id !== expense.id)
      );
    } catch (error) {
      console.error('Error categorizing expense:', error);
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'spending_pattern': return <TrendingUp />;
      case 'budget_warning': return <Warning />;
      case 'saving_opportunity': return <Lightbulb />;
      case 'fraud_alert': return <Security />;
      case 'cultural_insight': return <AutoAwesome />;
      default: return <Psychology />;
    }
  };

  const getInsightColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'success';
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Psychology color="primary" />
        AI Financial Intelligence
      </Typography>

      <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab icon={<SmartToy />} label="AI Insights" />
        <Tab icon={<PredictiveText />} label="Smart Query" />
        <Tab icon={<Analytics />} label="Predictive Budget" />
        <Tab icon={<AutoAwesome />} label="Auto-Categorize" />
      </Tabs>

      {/* AI Insights Tab */}
      {activeTab === 0 && (
        <Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={2}>
              {insights.map((insight, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        {getInsightIcon(insight.type)}
                        <Typography variant="h6" sx={{ flexGrow: 1 }}>
                          {insight.title}
                        </Typography>
                        <Chip 
                          label={insight.priority} 
                          color={getInsightColor(insight.priority) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {insight.description}
                      </Typography>
                      
                      <LinearProgress 
                        variant="determinate" 
                        value={insight.confidence * 100} 
                        sx={{ mb: 2 }}
                      />
                      
                      {insight.recommendations.length > 0 && (
                        <Accordion>
                          <AccordionSummary expandIcon={<ExpandMore />}>
                            <Typography variant="subtitle2">
                              Recommendations ({insight.recommendations.length})
                            </Typography>
                          </AccordionSummary>
                          <AccordionDetails>
                            <List dense>
                              {insight.recommendations.map((rec, idx) => (
                                <ListItem key={idx}>
                                  <ListItemIcon>
                                    <Lightbulb fontSize="small" />
                                  </ListItemIcon>
                                  <ListItemText primary={rec} />
                                </ListItem>
                              ))}
                            </List>
                          </AccordionDetails>
                        </Accordion>
                      )}
                      
                      {insight.actionable && (
                        <Button 
                          variant="contained" 
                          size="small" 
                          sx={{ mt: 1 }}
                          onClick={() => onInsightAction?.(insight)}
                        >
                          Take Action
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
              
              {insights.length === 0 && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    No AI insights available yet. Add more expenses to get personalized recommendations!
                  </Alert>
                </Grid>
              )}
            </Grid>
          )}
        </Box>
      )}

      {/* Smart Query Tab */}
      {activeTab === 1 && (
        <Box>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🤖 Ask Your AI Financial Assistant
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Button 
                  size="small" 
                  variant={queryLanguage === 'en' ? 'contained' : 'outlined'}
                  onClick={() => setQueryLanguage('en')}
                >
                  English
                </Button>
                <Button 
                  size="small" 
                  variant={queryLanguage === 'si' ? 'contained' : 'outlined'}
                  onClick={() => setQueryLanguage('si')}
                >
                  සිංහල
                </Button>
                <Button 
                  size="small" 
                  variant={queryLanguage === 'ta' ? 'contained' : 'outlined'}
                  onClick={() => setQueryLanguage('ta')}
                >
                  தமிழ்
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  fullWidth
                  placeholder={
                    queryLanguage === 'si' ? 'ඔබේ මූල්‍ය ප්‍රශ්නය අසන්න...' :
                    queryLanguage === 'ta' ? 'உங்கள் நிதி கேள்வியைக் கேளுங்கள்...' :
                    'Ask your financial question...'
                  }
                  value={smartQuery}
                  onChange={(e) => setSmartQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSmartQuery()}
                  disabled={queryLoading}
                />
                <Button 
                  variant="contained" 
                  onClick={handleSmartQuery}
                  disabled={queryLoading || !smartQuery.trim()}
                  startIcon={queryLoading ? <CircularProgress size={20} /> : <Send />}
                >
                  Ask
                </Button>
              </Box>
              
              <Typography variant="subtitle2" gutterBottom>
                Quick Questions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {commonQueries[queryLanguage].map((query, index) => (
                  <Chip
                    key={index}
                    label={query}
                    size="small"
                    onClick={() => handleQuickQuery(query)}
                    clickable
                  />
                ))}
              </Box>
            </CardContent>
          </Card>
          
          {/* Query History */}
          <Grid container spacing={2}>
            {queryHistory.map((query) => (
              <Grid item xs={12} key={query.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
                        👤
                      </Avatar>
                      <Typography variant="subtitle2">
                        {query.query}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {query.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: 'secondary.main' }}>
                        🤖
                      </Avatar>
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {query.answer}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Predictive Budget Tab */}
      {activeTab === 2 && (
        <Box>
          {predictiveBudget ? (
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📈 Next Month Predictions
                    </Typography>
                    
                    <Grid container spacing={2}>
                      {Object.entries(predictiveBudget.predictedExpenses || {}).map(([category, amount]) => (
                        <Grid item xs={12} sm={6} key={category}>
                          <Box sx={{ p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                            <Typography variant="subtitle2">{category}</Typography>
                            <Typography variant="h6" color="primary">
                              LKR {(amount as number).toLocaleString()}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="subtitle1" gutterBottom>
                      🎯 AI Recommendations
                    </Typography>
                    <List>
                      {(predictiveBudget.recommendations || []).map((rec: string, index: number) => (
                        <ListItem key={index}>
                          <ListItemIcon>
                            <Lightbulb color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={rec} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Card sx={{ mb: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      🎊 Cultural Events
                    </Typography>
                    {(predictiveBudget.culturalEvents || []).map((event: any, index: number) => (
                      <Box key={index} sx={{ mb: 1 }}>
                        <Typography variant="subtitle2">{event.name}</Typography>
                        <Chip 
                          label={event.impact} 
                          size="small" 
                          color={event.impact === 'high' ? 'warning' : 'info'} 
                        />
                      </Box>
                    ))}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      💰 Saving Goals
                    </Typography>
                    {(predictiveBudget.savingGoals || []).map((goal: any, index: number) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Typography variant="subtitle2">{goal.category}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          Save LKR {goal.amount?.toLocaleString()}
                        </Typography>
                        <Typography variant="caption">{goal.reason}</Typography>
                      </Box>
                    ))}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">
              Loading predictive budget analysis...
            </Alert>
          )}
        </Box>
      )}

      {/* Auto-Categorize Tab */}
      {activeTab === 3 && (
        <Box>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🎯 Smart Expense Categorization
              </Typography>
              
              {uncategorizedExpenses.length > 0 ? (
                <>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Found {uncategorizedExpenses.length} expenses that need categorization
                  </Typography>
                  
                  <Grid container spacing={2}>
                    {uncategorizedExpenses.map((expense) => (
                      <Grid item xs={12} md={6} key={expense.id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Typography variant="subtitle1">
                              {expense.description}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {expense.merchant} • LKR {expense.amount?.toLocaleString()}
                            </Typography>
                            <Typography variant="caption">
                              {new Date(expense.date).toLocaleDateString()}
                            </Typography>
                            
                            <Box sx={{ mt: 2 }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<AutoAwesome />}
                                onClick={() => categorizeExpense(expense)}
                              >
                                AI Categorize
                              </Button>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </>
              ) : (
                <Alert severity="success">
                  🎉 All expenses are properly categorized! The AI is keeping your finances organized.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
};

export default AIDashboard;