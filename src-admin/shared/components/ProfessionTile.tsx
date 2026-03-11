import React from 'react';
import { Card, CardActionArea, CardContent, Typography, Box, Chip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

interface ProfessionTileProps {
  id: string;
  label: string;
  icon: string;
  color: string;
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  mrr: number;
}

export default function ProfessionTile({ id, label, icon, color, totalUsers, activeUsers, proUsers, mrr }: ProfessionTileProps) {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-4px)', boxShadow: `0 8px 24px ${color}30` },
        borderTop: `3px solid ${color}`,
      }}
    >
      <CardActionArea onClick={() => navigate(`/profession/${id}`)} sx={{ height: '100%' }}>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" component="span">{icon}</Typography>
            <Chip
              label={`${proUsers} Pro`}
              size="small"
              sx={{ bgcolor: `${color}20`, color: color, fontWeight: 600, fontSize: 11 }}
            />
          </Box>
          <Typography variant="subtitle1" fontWeight={700}>{label}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <PeopleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {totalUsers.toLocaleString()} users
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mx: 0.5 }}>•</Typography>
            <Typography variant="body2" color="#22c55e" fontWeight={600}>
              {activeUsers.toLocaleString()} active
            </Typography>
          </Box>
          {mrr > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <TrendingUpIcon sx={{ fontSize: 14, color: '#22c55e' }} />
              <Typography variant="caption" color="text.secondary">
                LKR {(mrr / 100).toLocaleString()}/mo
              </Typography>
            </Box>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
