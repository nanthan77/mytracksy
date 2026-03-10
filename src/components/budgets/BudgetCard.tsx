import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Box,
  Typography,
  LinearProgress,
  IconButton,
  Menu,
  MenuItem,
  Chip,
  Tooltip
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { Budget } from '../../types';
import { useBudgetProgress } from '../../hooks/useBudgets';
import { format } from 'date-fns';

interface BudgetCardProps {
  budget: Budget;
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

const BudgetCard: React.FC<BudgetCardProps> = ({ budget, onEdit, onDelete }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const progress = useBudgetProgress(budget);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleEdit = () => {
    onEdit(budget);
    handleMenuClose();
  };

  const handleDelete = () => {
    onDelete(budget);
    handleMenuClose();
  };

  const handleViewDetails = () => {
    navigate(`/budgets/${budget.id}`);
    handleMenuClose();
  };

  const getProgressColor = () => {
    switch (progress.status) {
      case 'over':
        return 'error';
      case 'near':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'over':
        return <WarningIcon color="error" fontSize="small" />;
      case 'near':
        return <WarningIcon color="warning" fontSize="small" />;
      default:
        return <CheckCircleIcon color="success" fontSize="small" />;
    }
  };

  const getStatusText = () => {
    switch (progress.status) {
      case 'over':
        return 'Over Budget';
      case 'near':
        return 'Near Limit';
      default:
        return 'On Track';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    return period.charAt(0).toUpperCase() + period.slice(1);
  };

  const isActive = () => {
    const now = new Date();
    return now >= budget.startDate && now <= budget.endDate;
  };

  return (
    <Card 
      sx={{ 
        height: '100%',
        border: progress.status === 'over' ? '2px solid' : '1px solid',
        borderColor: progress.status === 'over' ? 'error.main' : 'divider',
        backgroundColor: progress.status === 'over' ? 'error.light' : 'background.paper',
        '&:hover': {
          elevation: 4
        }
      }}
    >
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="div" noWrap sx={{ mb: 0.5 }}>
              {budget.name}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                label={budget.category === 'all' ? 'All Categories' : budget.category}
                size="small"
                variant="outlined"
              />
              <Chip 
                label={formatPeriod(budget.period)}
                size="small"
                color="primary"
                variant="outlined"
              />
              {!isActive() && (
                <Chip 
                  label="Inactive"
                  size="small"
                  color="default"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVertIcon />
          </IconButton>
        </Box>

        {/* Progress */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Progress
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {getStatusIcon()}
              <Typography variant="body2" color="text.secondary">
                {getStatusText()}
              </Typography>
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(progress.percentage, 100)}
            color={getProgressColor()}
            sx={{ height: 8, borderRadius: 4 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {progress.percentage.toFixed(1)}% used
          </Typography>
        </Box>

        {/* Amount Details */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Spent
            </Typography>
            <Typography variant="h6" color={progress.status === 'over' ? 'error.main' : 'text.primary'}>
              {formatCurrency(budget.spent || 0)}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="body2" color="text.secondary">
              Budget
            </Typography>
            <Typography variant="h6">
              {formatCurrency(budget.amount)}
            </Typography>
          </Box>
        </Box>

        {/* Remaining/Over Amount */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="body2" 
            color={progress.remaining >= 0 ? 'success.main' : 'error.main'}
            sx={{ fontWeight: 'medium' }}
          >
            {progress.remaining >= 0 
              ? `${formatCurrency(progress.remaining)} remaining`
              : `${formatCurrency(Math.abs(progress.remaining))} over budget`
            }
          </Typography>
        </Box>

        {/* Period Dates */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            {format(budget.startDate, 'MMM d')} - {format(budget.endDate, 'MMM d, yyyy')}
          </Typography>
          {budget.alertThreshold && progress.percentage >= budget.alertThreshold && (
            <Tooltip title={`Alert threshold: ${budget.alertThreshold}%`}>
              <WarningIcon color="warning" fontSize="small" />
            </Tooltip>
          )}
        </Box>

        {/* Description */}
        {budget.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontStyle: 'italic' }}>
            {budget.description}
          </Typography>
        )}
      </CardContent>

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
        <MenuItem onClick={handleViewDetails}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          View Details
        </MenuItem>
        <MenuItem onClick={handleEdit}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Budget
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete Budget
        </MenuItem>
      </Menu>
    </Card>
  );
};

export default BudgetCard;