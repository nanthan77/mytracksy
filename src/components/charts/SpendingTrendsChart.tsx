import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';
import { format, subDays, eachDayOfInterval } from 'date-fns';

interface SpendingData {
  date: string;
  amount: number;
  budget?: number;
}

interface SpendingTrendsChartProps {
  data: SpendingData[];
  title?: string;
  period?: 'week' | 'month' | 'year';
}

const SpendingTrendsChart: React.FC<SpendingTrendsChartProps> = ({
  data,
  title = 'Spending Trends',
  period = 'month'
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (period) {
      case 'week':
        return format(date, 'EEE');
      case 'month':
        return format(date, 'MMM d');
      case 'year':
        return format(date, 'MMM');
      default:
        return format(date, 'MMM d');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            {format(new Date(label), 'MMM d, yyyy')}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {formatCurrency(entry.value)}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxisLabel}
            interval="preserveStartEnd"
          />
          <YAxis tickFormatter={formatCurrency} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="#1976d2"
            strokeWidth={2}
            dot={{ fill: '#1976d2', strokeWidth: 2, r: 4 }}
            name="Spending"
          />
          {data.some(d => d.budget) && (
            <Line
              type="monotone"
              dataKey="budget"
              stroke="#f57c00"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ fill: '#f57c00', strokeWidth: 2, r: 4 }}
              name="Budget"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default SpendingTrendsChart;