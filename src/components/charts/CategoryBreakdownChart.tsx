import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { Box, Typography, Paper } from '@mui/material';

interface CategoryData {
  name: string;
  value: number;
  color?: string;
}

interface CategoryBreakdownChartProps {
  data: CategoryData[];
  title?: string;
}

const CategoryBreakdownChart: React.FC<CategoryBreakdownChartProps> = ({
  data,
  title = 'Spending by Category'
}) => {
  const COLORS = [
    '#1976d2', '#f57c00', '#388e3c', '#d32f2f', '#7b1fa2',
    '#1976d2', '#00796b', '#5d4037', '#616161', '#f57c00'
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const total = data.reduce((sum, entry) => sum + entry.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : '0';
      
      return (
        <Paper sx={{ p: 2, border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="body2" gutterBottom>
            {data.name}
          </Typography>
          <Typography variant="body2" sx={{ color: data.color }}>
            {formatCurrency(data.value)} ({percentage}%)
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null; // Don't show labels for slices less than 5%
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (data.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          No spending data available
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
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={CustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value, entry: any) => (
              <span style={{ color: entry.color }}>
                {value}: {formatCurrency(entry.payload.value)}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default CategoryBreakdownChart;