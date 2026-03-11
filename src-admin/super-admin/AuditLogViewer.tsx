import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Select, MenuItem, FormControl, InputLabel, IconButton,
  Chip, CircularProgress, Alert, Button, Tooltip,
} from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';

interface AuditEntry {
  id: string;
  action: string;
  performed_by: string;
  target_user?: string;
  profession?: string;
  ip_address: string;
  role?: string;
  reason?: string;
  timestamp: any;
}

const ACTION_COLORS: Record<string, string> = {
  admin_login: '#22c55e',
  assign_admin_role: '#6366f1',
  remove_admin_role: '#ef4444',
  approve_user: '#22c55e',
  suspend_user: '#f59e0b',
  override_subscription: '#8b5cf6',
  access_denied: '#ef4444',
  ip_blocked: '#ef4444',
};

export default function AuditLogViewer() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('');
  const [limit, setLimit] = useState(50);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const getAuditLog = httpsCallable<any, { entries: AuditEntry[] }>(functions, 'getAuditLog');
      const result = await getAuditLog({
        action: actionFilter || undefined,
        limit,
      });
      setEntries(result.data.entries);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [actionFilter, limit]);

  const formatTimestamp = (ts: any): string => {
    if (!ts) return '—';
    const date = ts._seconds ? new Date(ts._seconds * 1000) : new Date(ts);
    return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportCsv = () => {
    const headers = ['Timestamp', 'Action', 'Performed By', 'Target', 'Profession', 'IP', 'Reason'];
    const rows = entries.map(e => [
      formatTimestamp(e.timestamp), e.action, e.performed_by, e.target_user || '', e.profession || '', e.ip_address, e.reason || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Audit Log</Typography>
          <Typography variant="body2" color="text.secondary">All admin actions are immutably logged</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Export CSV">
            <IconButton onClick={exportCsv} disabled={entries.length === 0}><DownloadIcon /></IconButton>
          </Tooltip>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchLogs} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Action</InputLabel>
          <Select value={actionFilter} onChange={e => setActionFilter(e.target.value)} label="Filter by Action">
            <MenuItem value="">All Actions</MenuItem>
            <MenuItem value="admin_login">Admin Login</MenuItem>
            <MenuItem value="assign_admin_role">Assign Role</MenuItem>
            <MenuItem value="remove_admin_role">Remove Role</MenuItem>
            <MenuItem value="approve_user">Approve User</MenuItem>
            <MenuItem value="suspend_user">Suspend User</MenuItem>
            <MenuItem value="override_subscription">Override Subscription</MenuItem>
            <MenuItem value="access_denied">Access Denied</MenuItem>
            <MenuItem value="ip_blocked">IP Blocked</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Limit</InputLabel>
          <Select value={limit} onChange={e => setLimit(Number(e.target.value))} label="Limit">
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Performed By</TableCell>
                <TableCell>Target</TableCell>
                <TableCell>Profession</TableCell>
                <TableCell>IP Address</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>No audit entries found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map(entry => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap' }}>{formatTimestamp(entry.timestamp)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.action.replace(/_/g, ' ')}
                        size="small"
                        sx={{
                          bgcolor: `${ACTION_COLORS[entry.action] || '#64748b'}20`,
                          color: ACTION_COLORS[entry.action] || '#64748b',
                          fontWeight: 600,
                          fontSize: 11,
                          textTransform: 'capitalize',
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {entry.performed_by?.slice(0, 12)}...
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {entry.target_user ? (
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {entry.target_user.slice(0, 12)}...
                        </Typography>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{entry.profession || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {entry.ip_address}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.reason || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
