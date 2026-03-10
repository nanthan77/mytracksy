import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  MoreVert as MoreIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Expense } from '../../types';
import { useCategories } from '../../hooks/useCategories';

interface ExpenseItemProps {
  expense: Expense;
  onEdit?: (expense: Expense) => void;
  onDelete?: (expenseId: string) => void;
  onViewReceipt?: (receiptUrl: string) => void;
}

const ExpenseItem: React.FC<ExpenseItemProps> = ({
  expense,
  onEdit,
  onDelete,
  onViewReceipt
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const { getCategoryById } = useCategories();
  
  const category = getCategoryById(expense.category);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit?.(expense);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete?.(expense.id);
    handleMenuClose();
  };

  const handleViewReceipt = () => {
    if (expense.receiptUrl) {
      onViewReceipt?.(expense.receiptUrl);
    }
    handleMenuClose();
  };

  const getPaymentMethodColor = (method?: string) => {
    switch (method) {
      case 'cash': return 'success';
      case 'card': return 'primary';
      case 'transfer': return 'info';
      default: return 'default';
    }
  };

  return (
    <Card sx={{ mb: 2, '&:hover': { boxShadow: 2 } }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              {category && (
                <Typography component="span" sx={{ mr: 1, fontSize: '1.2rem' }}>
                  {category.icon}
                </Typography>
              )}
              <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                {expense.description}
              </Typography>
            </Box>
            
            <Typography variant="h5" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
              ${expense.amount.toFixed(2)}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              {category && (
                <Chip
                  label={category.name}
                  size="small"
                  sx={{ bgcolor: category.color + '20', color: category.color }}
                />
              )}
              
              {expense.paymentMethod && (
                <Chip
                  label={expense.paymentMethod.toUpperCase()}
                  size="small"
                  color={getPaymentMethodColor(expense.paymentMethod) as any}
                  variant="outlined"
                />
              )}
              
              {expense.receiptUrl && (
                <Chip
                  icon={<ReceiptIcon />}
                  label="Receipt"
                  size="small"
                  variant="outlined"
                  onClick={handleViewReceipt}
                  clickable
                />
              )}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
              {format(expense.date, 'MMM dd, yyyy')}
              {expense.notes && ' • ' + expense.notes}
            </Typography>
            
            {expense.tags && expense.tags.length > 0 && (
              <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {expense.tags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', height: 20 }}
                  />
                ))}
              </Box>
            )}
          </Box>
          
          <IconButton
            aria-label="more options"
            onClick={handleMenuClick}
            sx={{ ml: 1 }}
          >
            <MoreIcon />
          </IconButton>
        </Box>
      </CardContent>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
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
        {onEdit && (
          <MenuItem onClick={handleEdit}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        )}
        
        {expense.receiptUrl && onViewReceipt && (
          <MenuItem onClick={handleViewReceipt}>
            <ListItemIcon>
              <ReceiptIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Receipt</ListItemText>
          </MenuItem>
        )}
        
        {onDelete && (
          <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default ExpenseItem;