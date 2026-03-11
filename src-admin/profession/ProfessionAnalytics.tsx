import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

interface ProfessionStats {
  total_users: number;
  active_users: number;
  pending_users: number;
  suspended_users: number;
  pro_users: number;
  free_users: number;
  mrr_cents: number;
  ai_voice_notes_total: number;
  estimated_ai_cost_usd: number;
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#64748b'];

export default function ProfessionAnalytics() {
  const { professionId } = useParams<{ professionId: string }>();
  const [stats, setStats] = useState<ProfessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  useEffect(() => {
    if (!professionId) return;
    const fetchStats = async () => {
      try {
        setLoading(true);
        const getProfessionStats = httpsCallable<{ profession: string }, ProfessionStats>(functions, 'getProfessionStats');
        const result = await getProfessionStats({ profession: professionId });
        setStats(result.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [professionId]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  const subscriptionData = [
    { name: 'Pro', value: stats.pro_users },
    { name: 'Free', value: stats.free_users },
  ];

  const statusBarData = [
    { name: 'Active', value: stats.active_users, color: '#22c55e' },
    { name: 'Pending', value: stats.pending_users, color: '#f59e0b' },
    { name: 'Suspended', value: stats.suspended_users, color: '#ef4444' },
  ];

  const aiUsageData = [
    { name: 'Voice Notes', value: stats.ai_voice_notes_total },
    { name: 'Est. Cost (USD)', value: Number(stats.estimated_ai_cost_usd.toFixed(2)) },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        {profession?.icon} {profession?.label} Analytics
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Detailed metrics for {profession?.label || ''} users
      </Typography>

      <Grid container spacing={3}>
        {/* Subscription Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Subscription Distribution</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                    {subscriptionData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* User Status */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>User Status Breakdown</Typography>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusBarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {statusBarData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* AI Usage */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>AI Voice Notes Usage</Typography>
              <Grid container spacing={3}>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Total Voice Notes</Typography>
                  <Typography variant="h4" fontWeight={700}>{stats.ai_voice_notes_total.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Estimated AI Cost</Typography>
                  <Typography variant="h4" fontWeight={700}>${stats.estimated_ai_cost_usd.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">MRR</Typography>
                  <Typography variant="h4" fontWeight={700}>LKR {(stats.mrr_cents / 100).toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="body2" color="text.secondary">Pro Conversion</Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.active_users > 0 ? ((stats.pro_users / stats.active_users) * 100).toFixed(1) : '0'}%
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
