import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface BudgetProgressData {
  name: string;
  spent: number;
  budget: number;
  remaining: number;
}

interface BudgetProgressChartProps {
  data: BudgetProgressData[];
  title?: string;
}

const BudgetProgressChart: React.FC<BudgetProgressChartProps> = ({
  data,
  title = 'Budget Progress'
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(Math.abs(value));
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const spent = payload.find((p: any) => p.dataKey === 'spent')?.value || 0;
      const budget = payload.find((p: any) => p.dataKey === 'budget')?.value || 0;
      const percentage = budget > 0 ? ((spent / budget) * 100).toFixed(1) : '0';

      return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom fontWeight="bold">
            {label}
          </Typography>
          <Typography variant="body2" sx={{ color: '#1976d2' }}>
            Spent: {formatCurrency(spent)} ({percentage}%)
          </Typography>
          <Typography variant="body2" sx={{ color: '#f57c00' }}>
            Budget: {formatCurrency(budget)}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ color: spent > budget ? '#d32f2f' : '#388e3c' }}
          >
            {spent > budget 
              ? `Over by: ${formatCurrency(spent - budget)}`
              : `Remaining: ${formatCurrency(budget - spent)}`
            }
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.spent, d.budget))
  );

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No budget data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            domain={[0, maxValue * 1.1]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar
            dataKey="spent"
            fill="#1976d2"
            name="Spent"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="budget"
            fill="#f57c00"
            name="Budget"
            radius={[4, 4, 0, 0]}
            fillOpacity={0.7}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default BudgetProgressChart;