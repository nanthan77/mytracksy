import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  FormControlLabel,
  Switch,
  Grid,
  Alert,
  InputAdornment,
  Chip
} from '@mui/material';
import { LoadingButton } from '@mui/lab';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IncomeFormData } from '../../types/income';

const incomeSchema = yup.object({
  amount: yup.number()
    .required('Amount is required')
    .positive('Amount must be positive')
    .min(0.01, 'Amount must be at least $0.01'),
  source: yup.string().required('Source is required'),
  description: yup.string().required('Description is required').min(2, 'Description must be at least 2 characters'),
  category: yup.string().required('Category is required'),
  date: yup.date().required('Date is required'),
  recurring: yup.boolean(),
  frequency: yup.string().when('recurring', {
    is: true,
    then: () => yup.string().required('Frequency is required when recurring'),
    otherwise: () => yup.string().optional()
  }),
  taxable: yup.boolean(),
  notes: yup.string().optional(),
  tags: yup.array().of(yup.string()).optional()
});

interface IncomeFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: IncomeFormData) => Promise<boolean>;
  initialData?: Partial<IncomeFormData>;
  title?: string;
}

const IncomeForm: React.FC<IncomeFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Add Income'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(incomeSchema) as any,
    defaultValues: {
      amount: 0,
      source: '',
      description: '',
      category: 'salary',
      date: new Date(),
      recurring: false,
      frequency: '',
      taxable: true,
      notes: '',
      tags: [],
      ...initialData
    }
  });

  const tags = watch('tags') || [];
  const recurring = watch('recurring');

  const handleFormSubmit = async (data: any) => {
    try {
      setError('');
      setLoading(true);
      const success = await onSubmit(data as IncomeFormData);
      if (success) {
        reset();
        setTagInput('');
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save income');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    setTagInput('');
    onClose();
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag: string) => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const handleTagKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  const incomeCategories = [
    { value: 'salary', label: 'Salary' },
    { value: 'freelance', label: 'Freelance' },
    { value: 'business', label: 'Business' },
    { value: 'investment', label: 'Investment' },
    { value: 'rental', label: 'Rental' },
    { value: 'pension', label: 'Pension' },
    { value: 'benefits', label: 'Benefits' },
    { value: 'gifts', label: 'Gifts' },
    { value: 'other', label: 'Other' }
  ];

  const incomeSources = [
    { value: 'primary_job', label: 'Primary Job' },
    { value: 'secondary_job', label: 'Secondary Job' },
    { value: 'freelance_work', label: 'Freelance Work' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'business_revenue', label: 'Business Revenue' },
    { value: 'investments', label: 'Investments' },
    { value: 'rental_income', label: 'Rental Income' },
    { value: 'pension', label: 'Pension' },
    { value: 'social_security', label: 'Social Security' },
    { value: 'unemployment', label: 'Unemployment Benefits' },
    { value: 'disability', label: 'Disability Benefits' },
    { value: 'tax_refund', label: 'Tax Refund' },
    { value: 'bonus', label: 'Bonus' },
    { value: 'commission', label: 'Commission' },
    { value: 'gifts', label: 'Gifts' },
    { value: 'other', label: 'Other' }
  ];

  const frequencies = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'yearly', label: 'Yearly' }
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Amount"
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
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        {...field}
                        label="Date"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            error: !!errors.date,
                            helperText: errors.date?.message
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
              </Grid>

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    error={!!errors.description}
                    helperText={errors.description?.message}
                    placeholder="e.g., Monthly salary, Freelance project payment"
                  />
                )}
              />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="source"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        select
                        label="Source"
                        fullWidth
                        error={!!errors.source}
                        helperText={errors.source?.message}
                      >
                        {incomeSources.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
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
                        {incomeCategories.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            {option.label}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="recurring"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Recurring Income"
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Controller
                    name="taxable"
                    control={control}
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch {...field} checked={field.value} />}
                        label="Taxable Income"
                      />
                    )}
                  />
                </Grid>
              </Grid>

              {recurring && (
                <Controller
                  name="frequency"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      select
                      label="Frequency"
                      fullWidth
                      error={!!errors.frequency}
                      helperText={errors.frequency?.message}
                    >
                      {frequencies.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}

              <Box>
                <TextField
                  label="Add Tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleTagKeyPress}
                  placeholder="Press Enter to add"
                  InputProps={{
                    endAdornment: (
                      <Button onClick={addTag} disabled={!tagInput.trim()}>
                        Add
                      </Button>
                    )
                  }}
                  fullWidth
                />
                {tags.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {tags.map((tag: string, index: number) => (
                      <Chip
                        key={index}
                        label={tag}
                        onDelete={() => removeTag(tag)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                )}
              </Box>

              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Notes (Optional)"
                    multiline
                    rows={3}
                    fullWidth
                    error={!!errors.notes}
                    helperText={errors.notes?.message}
                    placeholder="Additional notes or details..."
                  />
                )}
              />

              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <LoadingButton
              type="submit"
              variant="contained"
              loading={loading}
              disabled={loading}
            >
              {initialData ? 'Update Income' : 'Add Income'}
            </LoadingButton>
          </DialogActions>
        </form>
      </Dialog>
    </LocalizationProvider>
  );
};

export default IncomeForm;