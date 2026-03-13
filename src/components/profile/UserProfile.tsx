import React, { useState, useRef } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Avatar,
  Typography,
  Button,
  Chip,
  IconButton,
  Badge,
  Divider,
  Tab,
  Tabs,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar
} from '@mui/material';
import {
  Edit,
  Settings,
  AccountBalance,
  Verified,
  Email,
  CalendarToday,
  WorkspacePremium,
  PhotoCamera,
  Security,
  Download,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../config/firebase';

interface UserProfileProps {
  user?: any;
  userProfile?: any;
  onBack?: () => void;
}

const TabPanel = ({ children, value, index }: any) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
  </div>
);

export const UserProfile: React.FC<UserProfileProps> = ({ onBack }) => {
  const { currentUser, updateUserProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User';
  const initials = displayName.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);

  const handleEditOpen = () => {
    setEditName(currentUser?.displayName || '');
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile(editName.trim());
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
      setEditOpen(false);
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to update profile', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    if (!file.type.startsWith('image/')) {
      setSnackbar({ open: true, message: 'Please select an image file', severity: 'error' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSnackbar({ open: true, message: 'Image must be under 5MB', severity: 'error' });
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const storageRef = ref(storage, `users/${currentUser.uid}/profile/avatar.${ext}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      await updateUserProfile(displayName, photoURL);
      setSnackbar({ open: true, message: 'Profile photo updated', severity: 'success' });
    } catch (error: any) {
      setSnackbar({ open: true, message: error.message || 'Failed to upload photo', severity: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDataExport = () => {
    if (!currentUser) return;
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        profile: {
          displayName: currentUser.displayName,
          email: currentUser.email,
          uid: currentUser.uid,
        },
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mytracksy-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSnackbar({ open: true, message: 'Data exported successfully', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'Export failed', severity: 'error' });
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <Typography color="text.secondary">Please sign in to view your profile.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {onBack && (
        <Box sx={{ p: 2 }}>
          <Button
            onClick={onBack}
            startIcon={<Settings />}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            &larr; Back to MyTracksy
          </Button>
        </Box>
      )}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header Section */}
        <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <CardContent sx={{ p: 4 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    uploading ? (
                      <CircularProgress size={24} sx={{ color: 'white' }} />
                    ) : (
                      <IconButton
                        onClick={handlePhotoClick}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.9)',
                          width: 32, height: 32,
                          '&:hover': { bgcolor: 'white' },
                        }}
                      >
                        <PhotoCamera sx={{ fontSize: 16, color: '#667eea' }} />
                      </IconButton>
                    )
                  }
                >
                  <Avatar
                    sx={{ width: 120, height: 120, border: '4px solid white', fontSize: 40 }}
                    src={currentUser.photoURL || undefined}
                  >
                    {initials}
                  </Avatar>
                </Badge>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  style={{ display: 'none' }}
                  onChange={handlePhotoUpload}
                />
              </Grid>

              <Grid item xs>
                <Typography variant="h3" gutterBottom>
                  {displayName}
                </Typography>
                <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                  {currentUser.email}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item>
                    <Chip
                      icon={<WorkspacePremium />}
                      label="MEMBER"
                      sx={{ bgcolor: 'rgba(255,215,0,0.8)', color: 'black' }}
                    />
                  </Grid>
                  <Grid item>
                    <Chip
                      icon={<Verified />}
                      label="Verified"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                    />
                  </Grid>
                </Grid>

                <Button
                  variant="outlined"
                  startIcon={<Edit />}
                  sx={{ color: 'white', borderColor: 'white' }}
                  onClick={handleEditOpen}
                >
                  Edit Profile
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <Card sx={{ mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab icon={<AccountBalance />} label="Overview" />
            <Tab icon={<Settings />} label="Settings" />
          </Tabs>
        </Card>

        {/* Overview Tab */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Account Information</Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><Email /></ListItemIcon>
                      <ListItemText
                        primary="Email"
                        secondary={currentUser.email}
                      />
                      <Chip label="Verified" color="success" size="small" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CalendarToday /></ListItemIcon>
                      <ListItemText
                        primary="Status"
                        secondary="Active Member"
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Profile Completeness</Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><CheckCircle color={currentUser.email ? 'success' : 'disabled'} /></ListItemIcon>
                      <ListItemText primary="Email verified" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color={currentUser.displayName ? 'success' : 'disabled'} /></ListItemIcon>
                      <ListItemText primary="Display name set" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><CheckCircle color={currentUser.photoURL ? 'success' : 'disabled'} /></ListItemIcon>
                      <ListItemText primary="Profile photo uploaded" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Settings Tab */}
        <TabPanel value={activeTab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Privacy &amp; Security</Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon><Security /></ListItemIcon>
                      <ListItemText primary="Biometric Lock" secondary="Protect sensitive data with FaceID/Fingerprint" />
                      <Button variant="outlined" size="small">Configure</Button>
                    </ListItem>
                    <ListItem>
                      <ListItemIcon><Download /></ListItemIcon>
                      <ListItemText primary="Data Export" secondary="Download your data as JSON" />
                      <Button variant="outlined" size="small" onClick={handleDataExport}>Export</Button>
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>Account Actions</Typography>
                  <List>
                    <ListItem>
                      <ListItemText primary="Sign Out" secondary="Sign out of your account" />
                      <Button variant="outlined" color="warning" size="small" onClick={logout}>
                        Sign Out
                      </Button>
                    </ListItem>
                  </List>
                  <Divider sx={{ my: 2 }} />
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    Account deletion is permanent and cannot be undone.
                  </Alert>
                  <Typography variant="body2" color="text.secondary">
                    To delete your account, please contact support at support@mytracksy.lk
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      </Container>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Display Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" disabled={saving || !editName.trim()}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
