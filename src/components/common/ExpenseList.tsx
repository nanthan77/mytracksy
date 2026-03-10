import React, { useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Skeleton,
  Divider
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { Expense } from '../../types';
import ExpenseItem from './ExpenseItem';

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore: () => void;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onViewReceipt?: (receiptUrl: string) => void;
  emptyMessage?: string;
}

const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  loading,
  error,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete,
  onViewReceipt,
  emptyMessage = 'No expenses found. Start by adding your first expense!'
}) => {
  const [loadingMore, setLoadingMore] = useState(false);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await onLoadMore();
    setLoadingMore(false);
  };

  // Group expenses by date
  const groupedExpenses = expenses.reduce((groups: { [key: string]: Expense[] }, expense) => {
    const dateKey = expense.date.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(expense);
    return groups;
  }, {});

  const sortedDateKeys = Object.keys(groupedExpenses).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  if (loading && expenses.length === 0) {
    return (
      <Box>
        {[...Array(5)].map((_, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={120} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (expenses.length === 0) {
    return (
      <Box 
        sx={{ 
          textAlign: 'center', 
          py: 8,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '2px dashed',
          borderColor: 'grey.300'
        }}
      >
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {emptyMessage}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your spending to better understand your financial habits.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {sortedDateKeys.map((dateKey) => (
        <Box key={dateKey} sx={{ mb: 3 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              mb: 2, 
              color: 'text.secondary',
              fontWeight: 600,
              position: 'sticky',
              top: 64,
              bgcolor: 'background.default',
              zIndex: 1,
              py: 1
            }}
          >
            {new Date(dateKey).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Typography>
          
          {groupedExpenses[dateKey].map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onEdit={onEdit}
              onDelete={onDelete}
              onViewReceipt={onViewReceipt}
            />
          ))}
          
          <Divider sx={{ mt: 2 }} />
        </Box>
      ))}
      
      {hasMore && (
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <LoadingButton
            loading={loadingMore}
            onClick={handleLoadMore}
            variant="outlined"
            size="large"
          >
            Load More Expenses
          </LoadingButton>
        </Box>
      )}
      
      {loading && expenses.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <CircularProgress size={24} />
        </Box>
      )}
    </Box>
  );
};

export default ExpenseList;