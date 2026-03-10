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
  Box,
  Alert,
  CircularProgress,
  Grid
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CategoryFormData } from '../../types';

// Available icons for categories
const CATEGORY_ICONS = [
  '🍽️', '🚗', '🛍️', '🎬', '💡', '🏥', '📚', '✈️', '📦',
  '🎮', '🏠', '💰', '🎵', '🏃', '☕', '🎨', '🧽', '🔧',
  '📱', '💻', '👕', '🎯', '🎪', '🚶', '🏖️', '🎭', '🍕'
];

// Available colors for categories
const CATEGORY_COLORS = [
  '#FF6B35', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#AEB6BF', '#85C1E9',
  '#F8C471', '#82E0AA', '#D7BDE2', '#A9DFBF', '#F9E79F'
];

const categorySchema = yup.object().shape({
  name: yup
    .string()
    .required('Category name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(30, 'Name must be less than 30 characters'),
  icon: yup
    .string()
    .required('Please select an icon'),
  color: yup
    .string()
    .required('Please select a color')
});

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<boolean>;
  initialData?: Partial<CategoryFormData>;
  title?: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
  title = 'Add Category'
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: '',
      color: '',
      ...initialData
    }
  });

  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      setError('');
      setLoading(true);
      const success = await onSubmit(data);
      if (success) {
        reset();
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setError('');
    onClose();
  };

  return (
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
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                margin="normal"
                required
                fullWidth
                label="Category Name"
                placeholder="e.g., Groceries, Transport, etc."
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />

          <Controller
            name="icon"
            control={control}
            render={({ field }) => (
              <FormControl fullWidth margin="normal" error={!!errors.icon}>
                <InputLabel>Icon *</InputLabel>
                <Select {...field} label="Icon *" value={field.value || ''}>
                  {CATEGORY_ICONS.map((icon) => (
                    <MenuItem key={icon} value={icon}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ marginRight: 8, fontSize: '1.2rem' }}>{icon}</span>
                        {icon}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {errors.icon && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                    {errors.icon.message}
                  </Box>
                )}
              </FormControl>
            )}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <Box sx={{ mt: 3 }}>
                <InputLabel sx={{ mb: 1, color: errors.color ? 'error.main' : 'text.primary' }}>
                  Color *
                </InputLabel>
                <Grid container spacing={1}>
                  {CATEGORY_COLORS.map((color) => (
                    <Grid item key={color}>
                      <Box
                        onClick={() => field.onChange(color)}
                        sx={{
                          width: 40,
                          height: 40,
                          backgroundColor: color,
                          borderRadius: 1,
                          cursor: 'pointer',
                          border: field.value === color ? '3px solid' : '2px solid',
                          borderColor: field.value === color ? 'primary.main' : 'grey.300',
                          '&:hover': {
                            borderColor: 'primary.main'
                          }
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>
                {errors.color && (
                  <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 1 }}>
                    {errors.color.message}
                  </Box>
                )}
              </Box>
            )}
          />

          {/* Preview */}
          {selectedIcon && selectedColor && (
            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 40,
                    height: 40,
                    backgroundColor: selectedColor + '20',
                    borderRadius: 1,
                    mr: 2
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{selectedIcon}</span>
                </Box>
                <Box>
                  <Box sx={{ fontWeight: 600 }}>Preview</Box>
                  <Box sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>
                    This is how your category will appear
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
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
          {loading ? 'Saving...' : 'Save Category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CategoryForm;