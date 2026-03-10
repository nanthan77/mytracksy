import React, { useState, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Fab,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import ExpenseForm from '../../components/forms/ExpenseForm';
import ExpenseList from '../../components/common/ExpenseList';
import ExpenseFilter from '../../components/common/ExpenseFilter';
import { useExpenses } from '../../hooks/useExpenses';
import { ExpenseFormData, ExpenseFilter as ExpenseFilterType, Expense } from '../../types';

const Expenses: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [filter, setFilter] = useState<ExpenseFilterType>({});
  const [appliedFilter, setAppliedFilter] = useState<ExpenseFilterType>({});

  const {
    expenses,
    loading,
    error,
    hasMore,
    createExpense,
    updateExpense,
    deleteExpense,
    loadMore,
    refresh
  } = useExpenses(appliedFilter);

  const handleAddExpense = async (data: ExpenseFormData): Promise<boolean> => {
    const expenseId = await createExpense(data);
    if (expenseId) {
      setSuccessMessage('Expense added successfully!');
      return true;
    }
    return false;
  };

  const handleEditExpense = async (data: ExpenseFormData): Promise<boolean> => {
    if (!editingExpense) return false;
    
    const success = await updateExpense(editingExpense.id, data);
    if (success) {
      setSuccessMessage('Expense updated successfully!');
      setEditingExpense(null);
      return true;
    }
    return false;
  };

  const handleDeleteExpense = async () => {
    if (!deleteConfirm) return;
    
    const success = await deleteExpense(deleteConfirm);
    if (success) {
      setSuccessMessage('Expense deleted successfully!');
    }
    setDeleteConfirm(null);
  };

  const handleApplyFilter = useCallback(() => {
    setAppliedFilter({ ...filter });
  }, [filter]);

  const handleClearFilter = useCallback(() => {
    setFilter({});
    setAppliedFilter({});
  }, []);

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setShowForm(true);
  };

  const handleDelete = (expenseId: string) => {
    setDeleteConfirm(expenseId);
  };

  const handleViewReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingExpense(null);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Expenses
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            Add Expense
          </Button>
        </Box>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Track and manage all your expenses in one place.
        </Typography>

        {/* Expense Filter */}
        <ExpenseFilter
          filter={filter}
          onFilterChange={setFilter}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
        />

        {/* Expense List */}
        <ExpenseList
          expenses={expenses}
          loading={loading}
          error={error}
          hasMore={hasMore}
          onLoadMore={loadMore}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewReceipt={handleViewReceipt}
        />
      </Box>

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add expense"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setShowForm(true)}
      >
        <AddIcon />
      </Fab>

      {/* Expense Form Dialog */}
      <ExpenseForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingExpense ? handleEditExpense : handleAddExpense}
        initialData={editingExpense ? {
          description: editingExpense.description,
          amount: editingExpense.amount,
          category: editingExpense.category,
          date: editingExpense.date,
          paymentMethod: editingExpense.paymentMethod,
          notes: editingExpense.notes,
          tags: editingExpense.tags
        } : undefined}
        title={editingExpense ? 'Edit Expense' : 'Add New Expense'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          Are you sure you want to delete this expense? This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteExpense} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Message */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => {}}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Expenses;