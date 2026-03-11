import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Chip, IconButton,
  Alert, CircularProgress, Checkbox, FormGroup, FormControlLabel, Tooltip,
} from '@mui/material';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../shared/firebase/config';
import { PROFESSIONS } from '../../shared/constants/professions';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import RefreshIcon from '@mui/icons-material/Refresh';

type AdminRole = 'super_admin' | 'profession_admin' | 'support_agent' | 'viewer';

interface AdminUser {
  uid: string;
  email: string;
  display_name: string;
  role: AdminRole;
  professions: string[];
  status: 'active' | 'disabled';
  last_login: any;
  created_at: any;
}

const ROLE_OPTIONS: { value: AdminRole; label: string; color: string }[] = [
  { value: 'super_admin', label: 'Super Admin', color: '#ef4444' },
  { value: 'profession_admin', label: 'Profession Admin', color: '#6366f1' },
  { value: 'support_agent', label: 'Support Agent', color: '#f59e0b' },
  { value: 'viewer', label: 'Viewer', color: '#64748b' },
];

export default function UserRoleManager() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);

  // Form state
  const [formUid, setFormUid] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('viewer');
  const [formProfessions, setFormProfessions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      setError(null);
      const listAdmins = httpsCallable<void, { admins: AdminUser[] }>(functions, 'listAdminUsers');
      const result = await listAdmins();
      setAdmins(result.data.admins);
    } catch (err: any) {
      setError(err.message || 'Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  const openAddDialog = () => {
    setEditingAdmin(null);
    setFormUid('');
    setFormEmail('');
    setFormName('');
    setFormRole('viewer');
    setFormProfessions([]);
    setDialogOpen(true);
  };

  const openEditDialog = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFormUid(admin.uid);
    setFormEmail(admin.email);
    setFormName(admin.display_name);
    setFormRole(admin.role);
    setFormProfessions(admin.professions || []);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const assignRole = httpsCallable(functions, 'assignAdminRole');
      await assignRole({
        targetUid: formUid,
        role: formRole,
        professions: formRole === 'super_admin' ? ['all'] : formProfessions,
        displayName: formName,
      });
      setDialogOpen(false);
      await fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to save admin role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (uid: string) => {
    if (!confirm('Are you sure you want to remove this admin?')) return;
    try {
      setError(null);
      const removeRole = httpsCallable(functions, 'removeAdminRole');
      await removeRole({ targetUid: uid });
      await fetchAdmins();
    } catch (err: any) {
      setError(err.message || 'Failed to remove admin');
    }
  };

  const toggleProfession = (profId: string) => {
    setFormProfessions(prev =>
      prev.includes(profId) ? prev.filter(p => p !== profId) : [...prev, profId]
    );
  };

  const getRoleChip = (role: AdminRole) => {
    const opt = ROLE_OPTIONS.find(r => r.value === role);
    return opt ? (
      <Chip label={opt.label} size="small" sx={{ bgcolor: `${opt.color}20`, color: opt.color, fontWeight: 600 }} />
    ) : null;
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return 'Never';
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp._seconds ? timestamp._seconds * 1000 : timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Role Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage admin users and their access levels</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAdmins} disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Admin
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Professions</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="text.secondary" py={3}>No admin users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                admins.map(admin => (
                  <TableRow key={admin.uid} hover>
                    <TableCell>
                      <Typography fontWeight={600}>{admin.display_name || '—'}</Typography>
                    </TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>{getRoleChip(admin.role)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {admin.role === 'super_admin' ? (
                          <Chip label="All" size="small" variant="outlined" />
                        ) : (
                          (admin.professions || []).map(p => {
                            const prof = PROFESSIONS.find(pr => pr.id === p);
                            return prof ? (
                              <Chip
                                key={p}
                                label={`${prof.icon} ${prof.label}`}
                                size="small"
                                sx={{ bgcolor: `${prof.color}15`, color: prof.color, fontSize: 11 }}
                              />
                            ) : null;
                          })
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={admin.status}
                        size="small"
                        color={admin.status === 'active' ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(admin.last_login)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditDialog(admin)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" color="error" onClick={() => handleRemove(admin.uid)}>
                          <BlockIcon fontSize="small" />
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

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Add Admin'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {!editingAdmin && (
              <TextField
                label="User UID"
                value={formUid}
                onChange={e => setFormUid(e.target.value)}
                fullWidth
                required
                helperText="Firebase Auth UID of the user to grant admin access"
              />
            )}
            <TextField
              label="Display Name"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Role</InputLabel>
              <Select value={formRole} onChange={e => setFormRole(e.target.value as AdminRole)} label="Role">
                {ROLE_OPTIONS.map(opt => (
                  <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {formRole !== 'super_admin' && (
              <Box>
                <Typography variant="subtitle2" mb={1}>Profession Access</Typography>
                <FormGroup sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {PROFESSIONS.map(prof => (
                    <FormControlLabel
                      key={prof.id}
                      control={
                        <Checkbox
                          checked={formProfessions.includes(prof.id)}
                          onChange={() => toggleProfession(prof.id)}
                          size="small"
                        />
                      }
                      label={
                        <Typography variant="body2">{prof.icon} {prof.label}</Typography>
                      }
                    />
                  ))}
                </FormGroup>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || (!editingAdmin && !formUid)}
          >
            {saving ? <CircularProgress size={20} /> : (editingAdmin ? 'Update' : 'Assign Role')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
