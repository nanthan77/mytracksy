import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import CategoryForm from '../forms/CategoryForm';
import { useCategories } from '../../hooks/useCategories';
import { CategoryFormData, Category } from '../../types';

const CategoryManager: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Category | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  const {
    categories,
    error,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  const customCategories = categories.filter(cat => !cat.isDefault);
  const defaultCategories = categories.filter(cat => cat.isDefault);

  const handleAddCategory = async (data: CategoryFormData): Promise<boolean> => {
    const categoryId = await createCategory(data);
    if (categoryId) {
      setSuccessMessage('Category added successfully!');
      return true;
    }
    return false;
  };

  const handleEditCategory = async (data: CategoryFormData): Promise<boolean> => {
    if (!editingCategory) return false;
    
    const success = await updateCategory(editingCategory.id, data);
    if (success) {
      setSuccessMessage('Category updated successfully!');
      setEditingCategory(null);
      return true;
    }
    return false;
  };

  const handleDeleteCategory = async () => {
    if (!deleteConfirm) return;
    
    const success = await deleteCategory(deleteConfirm.id);
    if (success) {
      setSuccessMessage('Category deleted successfully!');
    }
    setDeleteConfirm(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteConfirm(category);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const CategoryCard: React.FC<{ category: Category; showActions?: boolean }> = ({ 
    category, 
    showActions = false 
  }) => (
    <Card sx={{ height: '100%', position: 'relative' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 48,
              height: 48,
              backgroundColor: category.color + '20',
              borderRadius: 2,
              mr: 2
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{category.icon}</span>
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" noWrap>
              {category.name}
            </Typography>
            {category.isDefault && (
              <Chip label="Default" size="small" variant="outlined" />
            )}
          </Box>
        </Box>
        
        {showActions && !category.isDefault && (
          <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
            <IconButton
              size="small"
              onClick={() => handleEdit(category)}
              color="primary"
            >
              <EditIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleDelete(category)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Manage Categories
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowForm(true)}
        >
          Add Category
        </Button>
      </Box>

      {/* Default Categories */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
          Default Categories
        </Typography>
        <Grid container spacing={2}>
          {defaultCategories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <CategoryCard category={category} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Custom Categories */}
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: 'text.secondary' }}>
          Your Custom Categories
        </Typography>
        
        {customCategories.length === 0 ? (
          <Box 
            sx={{ 
              textAlign: 'center', 
              py: 6,
              bgcolor: 'grey.50',
              borderRadius: 2,
              border: '2px dashed',
              borderColor: 'grey.300'
            }}
          >
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No custom categories yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Create your own categories to better organize your expenses
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowForm(true)}
            >
              Add Your First Category
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {customCategories.map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category.id}>
                <CategoryCard category={category} showActions />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      {/* Category Form Dialog */}
      <CategoryForm
        open={showForm}
        onClose={closeForm}
        onSubmit={editingCategory ? handleEditCategory : handleAddCategory}
        initialData={editingCategory ? {
          name: editingCategory.name,
          icon: editingCategory.icon,
          color: editingCategory.color
        } : undefined}
        title={editingCategory ? 'Edit Category' : 'Add New Category'}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          Are you sure you want to delete the category "{deleteConfirm?.name}"? 
          This action cannot be undone.
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button onClick={handleDeleteCategory} color="error" variant="contained">
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
    </Box>
  );
};

export default CategoryManager;