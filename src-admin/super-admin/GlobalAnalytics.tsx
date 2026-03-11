import React, { useEffect, useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, CircularProgress, Alert } from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSIONS } from '../../shared/constants/professions';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface GlobalStats {
  total_users: number;
  active_users: number;
  total_mrr_cents: number;
  profession_breakdown: Record<string, { total: number; active: number; pro: number; mrr: number }>;
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b'];

export default function GlobalAnalytics() {
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
        setError(err.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!stats) return null;

  // Prepare chart data
  const professionBarData = PROFESSIONS.map(prof => {
    const data = stats.profession_breakdown[prof.id];
    return {
      name: prof.label,
      total: data?.total || 0,
      active: data?.active || 0,
      pro: data?.pro || 0,
      color: prof.color,
    };
  }).filter(d => d.total > 0);

  const totalPro = Object.values(stats.profession_breakdown).reduce((sum, p) => sum + p.pro, 0);
  const totalFree = stats.active_users - totalPro;
  const subscriptionPieData = [
    { name: 'Pro', value: totalPro },
    { name: 'Free', value: totalFree > 0 ? totalFree : 0 },
  ];

  const revenueBarData = PROFESSIONS.map(prof => {
    const data = stats.profession_breakdown[prof.id];
    return {
      name: prof.label,
      mrr: data?.mrr ? data.mrr / 100 : 0,
      color: prof.color,
    };
  }).filter(d => d.mrr > 0);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>Global Analytics</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Platform-wide metrics across all professions
      </Typography>

      <Grid container spacing={3}>
        {/* Users per Profession */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Users by Profession</Typography>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={professionBarData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="active" name="Active" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pro" name="Pro" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Subscription Distribution */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Subscription Split</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {subscriptionPieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index]} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Revenue by Profession */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>Monthly Revenue by Profession (LKR)</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueBarData} margin={{ top: 5, right: 20, left: 0, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
                    formatter={(value: number) => [`LKR ${value.toLocaleString()}`, 'MRR']}
                  />
                  <Bar dataKey="mrr" name="MRR" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
