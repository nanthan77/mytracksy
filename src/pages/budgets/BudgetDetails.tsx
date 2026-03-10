import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Skeleton,
  Breadcrumbs,
  Link
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import BudgetComparison from '../../components/budgets/BudgetComparison';
import { useBudgets } from '../../hooks/useBudgets';

const BudgetDetails: React.FC = () => {
  const { budgetId } = useParams<{ budgetId: string }>();
  const navigate = useNavigate();
  const { budgets, loading, error } = useBudgets();

  const budget = budgets.find(b => b.id === budgetId);

  const handleBack = () => {
    navigate('/budgets');
  };

  const handleEdit = () => {
    // This would typically open the edit form
    // For now, navigate back to budgets page
    navigate('/budgets');
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Skeleton variant="text" width={200} height={40} />
          <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Budgets
          </Button>
        </Box>
      </Container>
    );
  }

  if (!budget) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4, mb: 4 }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            Budget not found. It may have been deleted or you may not have permission to view it.
          </Alert>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
          >
            Back to Budgets
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Breadcrumbs */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link
            component="button"
            variant="body2"
            onClick={handleBack}
            sx={{ cursor: 'pointer', textDecoration: 'none' }}
          >
            Budgets
          </Link>
          <Typography variant="body2" color="text.primary">
            {budget.name}
          </Typography>
        </Breadcrumbs>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              {budget.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Detailed analysis and spending comparison for this budget
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
            >
              Back
            </Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleEdit}
            >
              Edit Budget
            </Button>
          </Box>
        </Box>

        {/* Budget Comparison with Details */}
        <BudgetComparison budget={budget} showDetails />
      </Box>
    </Container>
  );
};

export default BudgetDetails;