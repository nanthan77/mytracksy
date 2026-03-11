import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Chip, CircularProgress, Alert, TextField,
  InputAdornment, ToggleButton, ToggleButtonGroup, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import RestoreIcon from '@mui/icons-material/Restore';

interface UserRow {
  uid: string;
  email: string;
  name: string;
  status: string;
  profession: string;
  verification_id: string;
  subscription_tier: string;
  created_at: string | null;
}

const STATUS_COLORS: Record<string, 'success' | 'warning' | 'error' | 'default'> = {
  active: 'success',
  pending_verification: 'warning',
  suspended: 'error',
};

export default function UserDirectory() {
  const { professionId } = useParams<{ professionId: string }>();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [lastDocId, setLastDocId] = useState<string | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  const fetchUsers = async (append = false) => {
    if (!professionId) return;
    try {
      setLoading(true);
      setError(null);
      const getProfessionUsers = httpsCallable<any, { users: UserRow[]; hasMore: boolean; lastDocId: string | null }>(
        functions, 'getProfessionUsers'
      );
      const result = await getProfessionUsers({
        profession: professionId,
        status: statusFilter || undefined,
        limit: 25,
        startAfter: append ? lastDocId : undefined,
      });
      setUsers(prev => append ? [...prev, ...result.data.users] : result.data.users);
      setHasMore(result.data.hasMore);
      setLastDocId(result.data.lastDocId);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [professionId, statusFilter]);

  const handleApprove = async (uid: string) => {
    try {
      setActionLoading(true);
      const approve = httpsCallable(functions, 'approveDoctor');
      await approve({ uid });
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!selectedUser) return;
    try {
      setActionLoading(true);
      const suspend = httpsCallable(functions, 'suspendUser');
      await suspend({ uid: selectedUser.uid, reason: suspendReason });
      setActionDialogOpen(false);
      setSuspendReason('');
      await fetchUsers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = search
    ? users.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
    : users;

  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>User Directory</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage {profession?.label || ''} users
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => fetchUsers()} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 280 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />
        <ToggleButtonGroup
          value={statusFilter}
          exclusive
          onChange={(_, val) => setStatusFilter(val || '')}
          size="small"
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="active">Active</ToggleButton>
          <ToggleButton value="pending_verification">Pending</ToggleButton>
          <ToggleButton value="suspended">Suspended</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading && users.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>{profession?.verificationLabel || 'Verification ID'}</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Plan</TableCell>
                  <TableCell>Joined</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" py={3}>No users found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map(user => (
                    <TableRow key={user.uid} hover>
                      <TableCell><Typography fontWeight={600}>{user.name || '—'}</Typography></TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {user.verification_id || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status?.replace(/_/g, ' ')}
                          size="small"
                          color={STATUS_COLORS[user.status] || 'default'}
                          variant="outlined"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.subscription_tier}
                          size="small"
                          sx={{
                            bgcolor: user.subscription_tier === 'pro' ? '#6366f120' : user.subscription_tier === 'lifetime' ? '#f59e0b20' : 'transparent',
                            color: user.subscription_tier === 'pro' ? '#6366f1' : user.subscription_tier === 'lifetime' ? '#f59e0b' : '#64748b',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                          }}
                        />
                      </TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell align="right">
                        {user.status === 'pending_verification' && (
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => handleApprove(user.uid)} disabled={actionLoading}>
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {user.status === 'active' && (
                          <Tooltip title="Suspend">
                            <IconButton size="small" color="error" onClick={() => { setSelectedUser(user); setActionDialogOpen(true); }}>
                              <BlockIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {user.status === 'suspended' && (
                          <Tooltip title="Reactivate">
                            <IconButton size="small" color="success" onClick={() => handleApprove(user.uid)} disabled={actionLoading}>
                              <RestoreIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {hasMore && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button onClick={() => fetchUsers(true)} disabled={loading}>
                {loading ? <CircularProgress size={20} /> : 'Load More'}
              </Button>
            </Box>
          )}
        </>
      )}

      {/* Suspend Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Suspend User</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Suspending <strong>{selectedUser?.name || selectedUser?.email}</strong>
          </Typography>
          <TextField
            fullWidth
            label="Reason for suspension"
            value={suspendReason}
            onChange={e => setSuspendReason(e.target.value)}
            multiline
            rows={3}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleSuspend} disabled={!suspendReason || actionLoading}>
            {actionLoading ? <CircularProgress size={20} /> : 'Suspend'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
