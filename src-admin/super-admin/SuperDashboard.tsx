import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Alert, CircularProgress } from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSIONS } from '../../shared/constants/professions';
import StatCard from '../shared/components/StatCard';
import ProfessionTile from '../shared/components/ProfessionTile';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';

interface GlobalStats {
  total_users: number;
  active_users: number;
  total_mrr_cents: number;
  profession_breakdown: Record<string, {
    total: number;
    active: number;
    pro: number;
    mrr: number;
  }>;
}

export default function SuperDashboard() {
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const getGlobalStats = httpsCallable<void, GlobalStats>(functions, 'getGlobalStats');
        const result = await getGlobalStats();
        setStats(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalPro = stats
    ? Object.values(stats.profession_breakdown).reduce((sum, p) => sum + p.pro, 0)
    : 0;

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Overview of all professions and platform metrics
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* Global KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats?.total_users?.toLocaleString() || '—'}
            icon={<PeopleIcon fontSize="small" />}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Users"
            value={stats?.active_users?.toLocaleString() || '—'}
            subtitle="currently active"
            icon={<PersonIcon fontSize="small" />}
            color="#22c55e"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={stats ? `LKR ${(stats.total_mrr_cents / 100).toLocaleString()}` : '—'}
            subtitle="MRR"
            icon={<AttachMoneyIcon fontSize="small" />}
            color="#f59e0b"
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pro Users"
            value={totalPro.toLocaleString()}
            subtitle="paid subscribers"
            icon={<VerifiedUserIcon fontSize="small" />}
            color="#8b5cf6"
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Profession Tiles */}
      <Typography variant="h6" fontWeight={600} mb={2}>
        Professions
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {PROFESSIONS.map(prof => {
            const profStats = stats?.profession_breakdown?.[prof.id];
            return (
              <Grid item xs={12} sm={6} md={4} lg={3} key={prof.id}>
                <ProfessionTile
                  id={prof.id}
                  label={prof.label}
                  icon={prof.icon}
                  color={prof.color}
                  totalUsers={profStats?.total || 0}
                  activeUsers={profStats?.active || 0}
                  proUsers={profStats?.pro || 0}
                  mrr={profStats?.mrr || 0}
                />
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
