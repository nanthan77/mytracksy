import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Tabs,
  Tab,
  Paper
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import BudgetCard from './BudgetCard';
import BudgetForm from '../forms/BudgetForm';
import BudgetInsights from './BudgetInsights';
import { useBudgets, useActiveBudgets } from '../../hooks/useBudgets';
import { Budget, BudgetFormData } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`budget-tabpanel-${index}`}
      aria-labelledby={`budget-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const BudgetList: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Budget | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    budgets,
    loading: allBudgetsLoading,
    error,
    createBudget,
    updateBudget,
    deleteBudget,
    updateBudgetSpending
  } = useBudgets();

  const {
    activeBudgets,
    loading: activeBudgetsLoading
  } = useActiveBudgets();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleCreateBudget = async (data: BudgetFormData): Promise<boolean> => {
    const budgetId = await createBudget(data);
    if (budgetId) {
      setSuccessMessage('Budget created successfully!');
      await updateBudgetSpending(); // Update spending for new budget
      return true;
    }
    return false;
  };

  const handleEditBudget = async (data: BudgetFormData): Promise<boolean> => {
    if (!editingBudget) return false;
    
    const success = await updateBudget(editingBudget.id, data);
    if (success) {
      setSuccessMessage('Budget updated successfully!');
      setEditingBudget(null);
      await updateBudgetSpending(); // Update spending after edit
      return true;
    }
    return false;
  };

  const handleDeleteBudget = async () => {
    if (!deleteConfirm) return;
    
    const success = await deleteBudget(deleteConfirm.id);
    if (success) {
      setSuccessMessage('Budget deleted successfully!');
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (budget: Budget) => {
    setDeleteConfirm(budget);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const BudgetGrid: React.FC<{ budgets: Budget[]; loading: boolean }> = ({ budgets, loading }) => {
    if (loading) {
      return (
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      );
    }

    if (budgets.length === 0) {
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
            {activeTab === 0 ? 'No active budgets' : 'No budgets created yet'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {activeTab === 0 
              ? 'Create a budget to start tracking your spending'
              : 'Get started by creating your first budget'
            }
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
          >
            Create Budget
          </Button>
        </Box>
      );
    }

    return (
      <Grid container spacing={3}>
        {budgets.map((budget) => (
          <Grid item xs={12} sm={6} md={4} key={budget.id}>
            <BudgetCard
              budget={budget}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Budgets
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Create Budget
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={`Active (${activeBudgets.length})`} />
          <Tab label={`All Budgets (${budgets.length})`} />
          <Tab label="Insights" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <BudgetGrid budgets={activeBudgets} loading={activeBudgetsLoading} />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <BudgetGrid budgets={budgets} loading={allBudgetsLoading} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <BudgetInsights />
      </TabPanel>

      {/* Budget Form Dialog */}
      <BudgetForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingBudget ? handleEditBudget : handleCreateBudget}
        initialData={editingBudget ? {
          name: editingBudget.name,
          amount: editingBudget.amount,
          category: editingBudget.category,
          period: editingBudget.period,
          description: editingBudget.description,
          alertThreshold: editingBudget.alertThreshold
        } : undefined}
        title={editingBudget ? 'Edit Budget' : 'Create Budget'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Budget</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the budget "{deleteConfirm?.name}"? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteBudget} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Message */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success" sx={{ width: '100%' }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default BudgetList;