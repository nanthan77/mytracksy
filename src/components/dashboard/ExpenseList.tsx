import React, { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Chip,
  Box,
  Avatar,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert
} from '@mui/material';
import {
  Delete,
  Edit,
  MoreVert,
  AttachMoney,
  Category,
  CalendarToday,
  LocationOn,
  Payment
} from '@mui/icons-material';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMethod?: string;
  location?: string;
  tags?: string[];
  createdAt: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  onEditExpense?: (expense: Expense) => void;
}

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: string } = {
    'Food & Dining': '🍽️',
    'Transportation': '🚗',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Bills & Utilities': '📋',
    'Healthcare': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Groceries': '🛒',
    'Fuel': '⛽',
    'Rent': '🏠',
    'Insurance': '🛡️',
    'Investment': '📈',
    'Savings': '💰',
    'Other': '📝'
  };
  return iconMap[category] || '💰';
};

const getCategoryColor = (category: string): "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" => {
  const colorMap: { [key: string]: "default" | "primary" | "secondary" | "success" | "error" | "info" | "warning" } = {
    'Food & Dining': 'warning',
    'Transportation': 'info',
    'Shopping': 'secondary',
    'Entertainment': 'primary',
    'Bills & Utilities': 'error',
    'Healthcare': 'error',
    'Education': 'info',
    'Travel': 'primary',
    'Groceries': 'success',
    'Fuel': 'warning',
    'Rent': 'error',
    'Insurance': 'info',
    'Investment': 'success',
    'Savings': 'success',
    'Other': 'default'
  };
  return colorMap[category] || 'default';
};

export const ExpenseList: React.FC<ExpenseListProps> = ({ 
  expenses, 
  onDeleteExpense, 
  onEditExpense 
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Expense | null>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, expense: Expense) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedExpense(expense);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedExpense(null);
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
    handleMenuClose();
  };

  const handleEditClick = () => {
    if (selectedExpense) {
      setEditFormData(selectedExpense);
      setEditDialogOpen(true);
    }
    handleMenuClose();
  };

  const handleDeleteConfirm = () => {
    if (selectedExpense) {
      onDeleteExpense(selectedExpense.id);
    }
    setDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleEditSubmit = () => {
    if (editFormData && onEditExpense) {
      onEditExpense(editFormData);
    }
    setEditDialogOpen(false);
    setEditFormData(null);
  };

  const formatCurrency = (amount: number) => {
    return `LKR ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-LK', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (expenses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No expenses recorded yet
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start tracking your expenses by adding your first transaction
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <List>
        {expenses.map((expense, index) => (
          <React.Fragment key={expense.id}>
            <ListItem
              sx={{
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)'
                },
                borderRadius: 1,
                mb: 0.5
              }}
            >
              <ListItemIcon>
                <Avatar
                  sx={{
                    bgcolor: 'transparent',
                    fontSize: '1.5rem'
                  }}
                >
                  {getCategoryIcon(expense.category)}
                </Avatar>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                      {expense.description}
                    </Typography>
                    <Chip
                      label={expense.category}
                      size="small"
                      color={getCategoryColor(expense.category)}
                      variant="outlined"
                    />
                  </Box>
                }
                secondary={
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday sx={{ fontSize: '0.875rem' }} />
                        <Typography variant="caption">
                          {formatDate(expense.date)}
                        </Typography>
                      </Box>
                      
                      {expense.paymentMethod && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Payment sx={{ fontSize: '0.875rem' }} />
                          <Typography variant="caption">
                            {expense.paymentMethod}
                          </Typography>
                        </Box>
                      )}
                      
                      {expense.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOn sx={{ fontSize: '0.875rem' }} />
                          <Typography variant="caption">
                            {expense.location}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                    
                    {expense.tags && expense.tags.length > 0 && (
                      <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {expense.tags.map((tag, tagIndex) => (
                          <Chip
                            key={tagIndex}
                            label={tag}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: '20px' }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                }
              />
              
              <Box sx={{ textAlign: 'right', mr: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: 'primary.main'
                  }}
                >
                  {formatCurrency(expense.amount)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(expense.createdAt).toLocaleTimeString('en-LK', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Typography>
              </Box>
              
              <ListItemSecondaryAction>
                <IconButton
                  edge="end"
                  onClick={(e) => handleMenuOpen(e, expense)}
                >
                  <MoreVert />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            
            {index < expenses.length - 1 && <Divider variant="inset" component="li" />}
          </React.Fragment>
        ))}
      </List>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleEditClick}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this expense?
          </Typography>
          {selectedExpense && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              <strong>{selectedExpense.description}</strong><br />
              Amount: {formatCurrency(selectedExpense.amount)}<br />
              Date: {formatDate(selectedExpense.date)}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          {editFormData && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editFormData.amount}
                onChange={(e) => setEditFormData({ ...editFormData, amount: parseFloat(e.target.value) || 0 })}
                InputProps={{
                  startAdornment: <AttachMoney />,
                  endAdornment: 'LKR'
                }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Location"
                value={editFormData.location || ''}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};