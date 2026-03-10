import React from 'react';
import { Container, Box } from '@mui/material';
import IncomeList from '../../components/income/IncomeList';

const Income: React.FC = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <IncomeList />
      </Box>
    </Container>
  );
};

export default Income;