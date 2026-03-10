import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Alert,
  InputAdornment
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { BudgetFormData } from '../../types';
import { useCategories } from '../../hooks/useCategories';

const schema = yup.object({
  name: yup.string().required('Budget name is required').min(2, 'Name must be at least 2 characters'),
  amount: yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least $0.01'),
  category: yup.string().required('Category is required'),
  period: yup.string()
    .required('Period is required')
    .oneOf(['weekly', 'monthly', 'yearly'], 'Invalid period'),
  description: yup.string().optional(),
  alertThreshold: yup.number()
    .min(50, 'Alert threshold must be at least 50%')
    .max(100, 'Alert threshold cannot exceed 100%')
    .optional()
    .default(80)
});

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: BudgetFormData) => Promise<boolean>;
  initialData?: Partial<BudgetFormData>;
  title?: string;
  loading?: boolean;
}

const BudgetForm: React.FC<BudgetFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Create Budget',
  loading = false
}) => {
  const { categories } = useCategories();
  
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      amount: 0,
      category: '',
      period: 'monthly',
      description: '',
      alertThreshold: 80,
      ...initialData
    }
  });

  const handleFormSubmit = async (data: any) => {
    const success = await onSubmit(data as BudgetFormData);
    if (success) {
      reset();
      onClose();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat.name, label: cat.name }))
  ];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Budget Name"
                  fullWidth
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  placeholder="e.g., Monthly Food Budget"
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Budget Amount"
                  type="number"
                  fullWidth
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  inputProps={{
                    min: "0.01",
                    step: "0.01"
                  }}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Category"
                  fullWidth
                  error={!!errors.category}
                  helperText={errors.category?.message}
                >
                  {categoryOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />

            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Budget Period"
                  fullWidth
                  error={!!errors.period}
                  helperText={errors.period?.message}
                >
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="alertThreshold"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Alert Threshold"
                  type="number"
                  fullWidth
                  error={!!errors.alertThreshold}
                  helperText={errors.alertThreshold?.message || 'Get notified when spending reaches this percentage'}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                  inputProps={{
                    min: "50",
                    max: "100",
                    step: "5"
                  }}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Description (Optional)"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                  placeholder="Add notes about this budget..."
                />
              )}
            />

            {Object.keys(errors).length > 0 && (
              <Alert severity="error">
                Please fix the errors above before submitting.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting || loading}
            disabled={isSubmitting || loading}
          >
            {initialData ? 'Update Budget' : 'Create Budget'}
          </LoadingButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default BudgetForm;