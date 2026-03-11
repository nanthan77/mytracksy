import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip, CircularProgress,
  Alert, Avatar, Divider, IconButton, Tooltip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';

interface PendingUser {
  uid: string;
  email: string;
  name: string;
  status: string;
  profession: string;
  verification_id: string;
  subscription_tier: string;
  created_at: string | null;
}

export default function VerificationQueue() {
  const { professionId } = useParams<{ professionId: string }>();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  const fetchPending = async () => {
    if (!professionId) return;
    try {
      setLoading(true);
      setError(null);
      const getProfessionUsers = httpsCallable<any, { users: PendingUser[] }>(
        functions, 'getProfessionUsers'
      );
      const result = await getProfessionUsers({
        profession: professionId,
        status: 'pending_verification',
        limit: 50,
      });
      setUsers(result.data.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load verification queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, [professionId]);

  const handleApprove = async (uid: string) => {
    try {
      setActionLoading(uid);
      const approve = httpsCallable(functions, 'approveDoctor');
      await approve({ uid });
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (uid: string) => {
    try {
      setActionLoading(uid);
      const suspend = httpsCallable(functions, 'suspendUser');
      await suspend({ uid, reason: 'Verification rejected' });
      setUsers(prev => prev.filter(u => u.uid !== uid));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Verification Queue</Typography>
          <Typography variant="body2" color="text.secondary">
            {users.length} pending verification{users.length !== 1 ? 's' : ''} for {profession?.label || ''}
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchPending} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : users.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon sx={{ fontSize: 48, color: '#22c55e', mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>All caught up!</Typography>
            <Typography color="text.secondary">No pending verifications</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {users.map(user => (
            <Grid item xs={12} sm={6} md={4} key={user.uid}>
              <Card sx={{ height: '100%', borderLeft: `3px solid ${profession?.color || '#6366f1'}` }}>
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${profession?.color || '#6366f1'}20`, color: profession?.color || '#6366f1' }}>
                      <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={600} noWrap>{user.name || 'Unknown'}</Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {profession?.verificationLabel || 'Verification ID'}
                    </Typography>
                    <Typography variant="body2" fontWeight={600} sx={{ fontFamily: 'monospace' }}>
                      {user.verification_id || 'Not provided'}
                    </Typography>
                  </Box>

                  <Typography variant="caption" color="text.secondary">
                    Applied: {formatDate(user.created_at)}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      fullWidth
                      startIcon={actionLoading === user.uid ? <CircularProgress size={16} /> : <CheckCircleIcon />}
                      onClick={() => handleApprove(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      fullWidth
                      startIcon={<CancelIcon />}
                      onClick={() => handleReject(user.uid)}
                      disabled={actionLoading === user.uid}
                    >
                      Reject
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
