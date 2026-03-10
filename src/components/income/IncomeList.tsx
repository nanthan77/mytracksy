import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Repeat as RepeatIcon,
  AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useIncome } from '../../hooks/useIncome';
import { Income, IncomeFormData } from '../../types/income';
import IncomeForm from '../forms/IncomeForm';

const IncomeList: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Income | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedIncome, setSelectedIncome] = useState<Income | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    incomes,
    loading,
    error,
    createIncome,
    updateIncome,
    deleteIncome
  } = useIncome();

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, income: Income) => {
    setAnchorEl(event.currentTarget);
    setSelectedIncome(income);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedIncome(null);
  };

  const handleCreateIncome = async (data: IncomeFormData): Promise<boolean> => {
    const incomeId = await createIncome(data);
    if (incomeId) {
      setSuccessMessage('Income added successfully!');
      return true;
    }
    return false;
  };

  const handleEditIncome = async (data: IncomeFormData): Promise<boolean> => {
    if (!editingIncome) return false;
    
    const success = await updateIncome(editingIncome.id, data);
    if (success) {
      setSuccessMessage('Income updated successfully!');
      setEditingIncome(null);
      return true;
    }
    return false;
  };

  const handleDeleteIncome = async () => {
    if (!deleteConfirm) return;
    
    const success = await deleteIncome(deleteConfirm.id);
    if (success) {
      setSuccessMessage('Income deleted successfully!');
    }
    setDeleteConfirm(null);
  };

  const handleEdit = () => {
    if (selectedIncome) {
      setEditingIncome(selectedIncome);
      setShowForm(true);
    }
    handleMenuClose();
  };

  const handleDelete = () => {
    if (selectedIncome) {
      setDeleteConfirm(selectedIncome);
    }
    handleMenuClose();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingIncome(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getSourceLabel = (source: string) => {
    const sourceMap: { [key: string]: string } = {
      'primary_job': 'Primary Job',
      'secondary_job': 'Secondary Job',
      'freelance_work': 'Freelance Work',
      'consulting': 'Consulting',
      'business_revenue': 'Business Revenue',
      'investments': 'Investments',
      'rental_income': 'Rental Income',
      'pension': 'Pension',
      'social_security': 'Social Security',
      'unemployment': 'Unemployment Benefits',
      'disability': 'Disability Benefits',
      'tax_refund': 'Tax Refund',
      'bonus': 'Bonus',
      'commission': 'Commission',
      'gifts': 'Gifts',
      'other': 'Other'
    };
    return sourceMap[source] || source;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: { [key: string]: any } = {
      'salary': 'primary',
      'freelance': 'secondary',
      'business': 'success',
      'investment': 'info',
      'rental': 'warning',
      'pension': 'default',
      'benefits': 'default',
      'gifts': 'error',
      'other': 'default'
    };
    return colorMap[category] || 'default';
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Income
          </Typography>
          <Skeleton variant="rectangular" width={120} height={36} />
        </Box>
        <Grid container spacing={3}>
          {[1, 2, 3].map((i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Income
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Add Income
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {incomes.length === 0 ? (
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
          <MoneyIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No income entries yet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start tracking your income to get a complete financial picture
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setShowForm(true)}
          >
            Add Your First Income
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {incomes.map((income) => (
            <Grid item xs={12} sm={6} md={4} key={income.id}>
              <Card sx={{ height: '100%', position: 'relative' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" component="div" noWrap>
                        {income.description}
                      </Typography>
                      <Typography variant="h4" color="success.main" sx={{ my: 1 }}>
                        {formatCurrency(income.amount)}
                      </Typography>
                    </Box>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleMenuOpen(e, income)}
                      sx={{ ml: 1 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip
                      label={income.category}
                      size="small"
                      color={getCategoryColor(income.category) as any}
                      variant="outlined"
                    />
                    {income.recurring && (
                      <Chip
                        icon={<RepeatIcon />}
                        label={income.frequency}
                        size="small"
                        color="info"
                        variant="outlined"
                      />
                    )}
                    {income.taxable && (
                      <Chip
                        label="Taxable"
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    )}
                  </Box>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Source: {getSourceLabel(income.source)}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Date: {format(income.date, 'MMM d, yyyy')}
                  </Typography>

                  {income.tags && income.tags.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      {income.tags.slice(0, 2).map((tag, index) => (
                        <Chip
                          key={index}
                          label={tag}
                          size="small"
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      ))}
                      {income.tags.length > 2 && (
                        <Chip
                          label={`+${income.tags.length - 2} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  )}

                  {income.notes && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {income.notes.length > 100 ? `${income.notes.substring(0, 100)}...` : income.notes}
                      </Typography>
                    </>
                  )}

                  {income.recurring && income.nextDate && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        Next: {format(income.nextDate, 'MMM d, yyyy')}
                      </Typography>
                    </>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Income
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Income
        </MenuItem>
      </Menu>

      {/* Income Form Dialog */}
      <IncomeForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingIncome ? handleEditIncome : handleCreateIncome}
        initialData={editingIncome ? {
          amount: editingIncome.amount,
          source: editingIncome.source,
          description: editingIncome.description,
          category: editingIncome.category,
          date: editingIncome.date,
          recurring: editingIncome.recurring,
          frequency: editingIncome.frequency,
          taxable: editingIncome.taxable,
          notes: editingIncome.notes,
          tags: editingIncome.tags
        } : undefined}
        title={editingIncome ? 'Edit Income' : 'Add Income'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Income</DialogTitle>
        <DialogContent>
          Are you sure you want to delete "{deleteConfirm?.description}"? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteIncome} color="error" variant="contained">
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

export default IncomeList;