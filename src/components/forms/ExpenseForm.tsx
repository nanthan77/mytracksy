import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Chip,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { expenseSchema } from '../../utils/validation';
import { ExpenseFormData } from '../../types';
import { useCategories } from '../../hooks/useCategories';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ExpenseFormData) => Promise<boolean>;
  initialData?: Partial<ExpenseFormData>;
  title?: string;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Add Expense'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tagInput, setTagInput] = useState('');
  const { categories } = useCategories();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm({
    resolver: yupResolver(expenseSchema) as any,
    defaultValues: {
      description: '',
      amount: 0,
      category: '',
      date: new Date(),
      paymentMethod: 'card',
      notes: '',
      tags: [],
      ...initialData
    }
  });

  const tags = watch('tags') || [];

  const handleFormSubmit = async (data: any) => {
    try {
      setError('');
      setLoading(true);
      const success = await onSubmit(data as ExpenseFormData);
      if (success) {
        reset();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
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
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setValue('tags', newTags);
  };

  const handleTagKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addTag();
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" noValidate sx={{ mt: 1 }}>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Description"
                  placeholder="What did you spend on?"
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="amount"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  required
                  fullWidth
                  label="Amount"
                  type="number"
                  inputProps={{ min: 0, step: 0.01 }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>
                  }}
                  error={!!errors.amount}
                  helperText={errors.amount?.message}
                />
              )}
            />

            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal" error={!!errors.category}>
                  <InputLabel>Category *</InputLabel>
                  <Select {...field} label="Category *">
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ marginRight: 8 }}>{category.icon}</span>
                          {category.name}
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.category && (
                    <FormHelperText>{errors.category.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePicker
                  {...field}
                  label="Date *"
                  maxDate={new Date()}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      margin: 'normal',
                      error: !!errors.date,
                      helperText: errors.date?.message
                    }
                  }}
                />
              )}
            />

            <Controller
              name="paymentMethod"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth margin="normal">
                  <InputLabel>Payment Method</InputLabel>
                  <Select {...field} label="Payment Method">
                    <MenuItem value="cash">Cash</MenuItem>
                    <MenuItem value="card">Card</MenuItem>
                    <MenuItem value="transfer">Transfer</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  margin="normal"
                  fullWidth
                  label="Notes"
                  multiline
                  rows={2}
                  placeholder="Additional details..."
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                />
              )}
            />

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Tags"
                placeholder="Add tags (press Enter)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={handleTagKeyPress}
                InputProps={{
                  endAdornment: (
                    <Button onClick={addTag} disabled={!tagInput.trim()}>
                      Add
                    </Button>
                  )
                }}
              />
              
              {tags.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {tags.map((tag) => (
                    <Chip
                      key={tag}
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
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit(handleFormSubmit)}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Saving...' : 'Save Expense'}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
};

export default ExpenseForm;