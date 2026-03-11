import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  Alert, IconButton, Tooltip,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSION_MAP } from '../../shared/constants/professions';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';

interface UserRow {
  uid: string;
  email: string;
  name: string;
  status: string;
  subscription_tier: string;
}

const TIER_COLORS: Record<string, string> = {
  free: '#64748b',
  pro: '#6366f1',
  lifetime: '#f59e0b',
};

export default function SubscriptionManager() {
  const { professionId } = useParams<{ professionId: string }>();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [newTier, setNewTier] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  const fetchUsers = async () => {
    if (!professionId) return;
    try {
      setLoading(true);
      setError(null);
      const getProfessionUsers = httpsCallable<any, { users: UserRow[] }>(functions, 'getProfessionUsers');
      const result = await getProfessionUsers({ profession: professionId, status: 'active', limit: 100 });
      setUsers(result.data.users);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [professionId]);

  const openOverrideDialog = (user: UserRow) => {
    setSelectedUser(user);
    setNewTier(user.subscription_tier);
    setReason('');
    setDialogOpen(true);
  };

  const handleOverride = async () => {
    if (!selectedUser || !newTier || !reason) return;
    try {
      setSaving(true);
      setError(null);
      const override = httpsCallable(functions, 'overrideSubscription');
      await override({ uid: selectedUser.uid, newTier, reason });
      setDialogOpen(false);
      await fetchUsers();
    } catch (err: any) {
      setError(err.message || 'Failed to override subscription');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Subscription Manager</Typography>
          <Typography variant="body2" color="text.secondary">
            Override subscription plans for {profession?.label || ''} users
          </Typography>
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={fetchUsers} disabled={loading}><RefreshIcon /></IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Current Plan</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" py={3}>No active users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                users.map(user => (
                  <TableRow key={user.uid} hover>
                    <TableCell><Typography fontWeight={600}>{user.name || '—'}</Typography></TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={user.subscription_tier}
                        size="small"
                        sx={{
                          bgcolor: `${TIER_COLORS[user.subscription_tier] || '#64748b'}20`,
                          color: TIER_COLORS[user.subscription_tier] || '#64748b',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Override Plan">
                        <IconButton size="small" onClick={() => openOverrideDialog(user)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Override Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Override Subscription</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            Changing plan for <strong>{selectedUser?.name || selectedUser?.email}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>New Plan</InputLabel>
            <Select value={newTier} onChange={e => setNewTier(e.target.value)} label="New Plan">
              <MenuItem value="free">Free</MenuItem>
              <MenuItem value="pro">Pro</MenuItem>
              <MenuItem value="lifetime">Lifetime</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Reason for override"
            value={reason}
            onChange={e => setReason(e.target.value)}
            multiline
            rows={2}
            required
            helperText="This will be recorded in the audit log"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleOverride} disabled={!reason || saving}>
            {saving ? <CircularProgress size={20} /> : 'Override'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
