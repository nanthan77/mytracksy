import React, { useEffect, useState } from 'react';
import { Box, Grid, Typography, Alert, CircularProgress, Card, CardContent, List, ListItem, ListItemText, Chip } from '@mui/material';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import StatCard from '../shared/components/StatCard';
import PeopleIcon from '@mui/icons-material/People';
import PersonIcon from '@mui/icons-material/Person';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import BlockIcon from '@mui/icons-material/Block';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
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

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  timestamp: any;
  reason?: string;
}

const PIE_COLORS = ['#6366f1', '#22c55e', '#64748b'];

export default function ProfessionDashboard() {
  const { professionId } = useParams<{ professionId: string }>();
  const [stats, setStats] = useState<ProfessionStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;
  const accentColor = profession?.color || '#6366f1';

  useEffect(() => {
    if (!professionId) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsResult, auditResult] = await Promise.all([
          httpsCallable<{ profession: string }, ProfessionStats>(functions, 'getProfessionStats')({ profession: professionId }),
          httpsCallable<any, { entries: AuditEntry[] }>(functions, 'getAuditLog')({ profession: professionId, limit: 10 }),
        ]);
        setStats(statsResult.data);
        setRecentActivity(auditResult.data.entries);
      } catch (err: any) {
        setError(err.message || 'Failed to load profession data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [professionId]);

  if (!profession) {
    return <Alert severity="error">Unknown profession: {professionId}</Alert>;
  }

  const subscriptionData = stats ? [
    { name: 'Pro', value: stats.pro_users },
    { name: 'Free', value: stats.free_users },
  ] : [];

  const statusData = stats ? [
    { name: 'Active', value: stats.active_users, color: '#22c55e' },
    { name: 'Pending', value: stats.pending_users, color: '#f59e0b' },
    { name: 'Suspended', value: stats.suspended_users, color: '#ef4444' },
  ] : [];

  const formatTimestamp = (ts: any): string => {
    if (!ts) return '—';
    const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={0.5}>
        {profession.icon} {profession.label} Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Metrics and activity for {profession.label} users
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {/* KPI Cards */}
      <Grid container spacing={2.5} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Total Users" value={stats?.total_users?.toLocaleString() || '—'} icon={<PeopleIcon fontSize="small" />} loading={loading} color={accentColor} />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Active" value={stats?.active_users?.toLocaleString() || '—'} icon={<PersonIcon fontSize="small" />} loading={loading} color="#22c55e" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Pending" value={stats?.pending_users?.toLocaleString() || '—'} icon={<HourglassTopIcon fontSize="small" />} loading={loading} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Pro Users" value={stats?.pro_users?.toLocaleString() || '—'} icon={<VerifiedUserIcon fontSize="small" />} loading={loading} color="#8b5cf6" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="MRR" value={stats ? `LKR ${(stats.mrr_cents / 100).toLocaleString()}` : '—'} icon={<AttachMoneyIcon fontSize="small" />} loading={loading} color="#f59e0b" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard title="Suspended" value={stats?.suspended_users?.toLocaleString() || '—'} icon={<BlockIcon fontSize="small" />} loading={loading} color="#ef4444" />
        </Grid>
      </Grid>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Status Breakdown */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>User Status</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statusData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 12 }} width={80} />
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {statusData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Subscription Split */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Subscription Split</Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={subscriptionData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value"
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

          {/* Recent Activity */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} mb={2}>Recent Activity</Typography>
                {recentActivity.length === 0 ? (
                  <Typography color="text.secondary" py={2}>No recent activity</Typography>
                ) : (
                  <List dense disablePadding>
                    {recentActivity.slice(0, 8).map(entry => (
                      <ListItem key={entry.id} disableGutters sx={{ py: 0.5 }}>
                        <ListItemText
                          primary={
                            <Chip label={entry.action.replace(/_/g, ' ')} size="small" sx={{ fontSize: 10, height: 20, textTransform: 'capitalize' }} />
                          }
                          secondary={formatTimestamp(entry.timestamp)}
                          secondaryTypographyProps={{ variant: 'caption' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
