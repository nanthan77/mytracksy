import React from 'react';
import { Card, CardContent, Typography, Box, Skeleton } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // percentage change
  loading?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export default function StatCard({ title, value, subtitle, trend, loading, icon, color }: StatCardProps) {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Skeleton width="60%" height={20} />
          <Skeleton width="40%" height={40} sx={{ mt: 1 }} />
          <Skeleton width="50%" height={16} sx={{ mt: 1 }} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            {title}
          </Typography>
          {icon && (
            <Box sx={{
              p: 1, borderRadius: 2, bgcolor: color ? `${color}20` : 'rgba(99, 102, 241, 0.12)',
              color: color || '#6366f1', display: 'flex',
            }}>
              {icon}
            </Box>
          )}
        </Box>
        <Typography variant="h4" fontWeight={700} sx={{ mt: 1, color: color || 'text.primary' }}>
          {value}
        </Typography>
        {(subtitle || trend !== undefined) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', color: trend >= 0 ? '#22c55e' : '#ef4444' }}>
                {trend >= 0 ? <TrendingUpIcon fontSize="small" /> : <TrendingDownIcon fontSize="small" />}
                <Typography variant="caption" fontWeight={600}>
                  {Math.abs(trend).toFixed(1)}%
                </Typography>
              </Box>
            )}
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
