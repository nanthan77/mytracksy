import React from 'react';
import { Container, Box } from '@mui/material';
import BudgetList from '../../components/budgets/BudgetList';

const Budgets: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <BudgetList />
      </Box>
    </Container>
  );
};

export default Budgets;