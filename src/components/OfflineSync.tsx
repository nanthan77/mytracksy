import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Button,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  Badge,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress
} from '@mui/material';
import {
  Sync,
  SyncProblem,
  CloudOff,
  CloudDone,
  Warning,
  CheckCircle,
  Cancel,
  Refresh,
  ExpandMore,
  WifiOff,
  Wifi,
  Schedule,
  Error,
  Info,
  Settings,
  Storage,
  Queue,
  Speed,
  NetworkCheck
} from '@mui/icons-material';
import { syncService, SyncStatus } from '../services/syncService';
import { offlineStorageService, SyncConflict } from '../services/offlineStorageService';

export const OfflineSync: React.FC = () => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [selectedConflict, setSelectedConflict] = useState<SyncConflict | null>(null);
  const [autoSync, setAutoSync] = useState(true);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [networkInfo, setNetworkInfo] = useState<any>({});
  const [syncEstimate, setSyncEstimate] = useState<number>(0);

  useEffect(() => {
    loadSyncStatus();
    loadConflicts();
    loadStorageStats();
    loadNetworkInfo();
    
    // Set up sync status listener
    const handleSyncUpdate = (status: SyncStatus) => {
      setSyncStatus(status);
    };
    
    syncService.addSyncListener(handleSyncUpdate);
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadSyncStatus();
      loadStorageStats();
      loadNetworkInfo();
    }, 30000);

    return () => {
      syncService.removeSyncListener(handleSyncUpdate);
      clearInterval(interval);
    };
  }, []);

  const loadSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      setSyncStatus(status);
      
      const estimate = await syncService.estimateSyncTime();
      setSyncEstimate(estimate);
    } catch (error) {
      console.error('Failed to load sync status:', error);
    }
  };

  const loadConflicts = async () => {
    try {
      const conflictList = await offlineStorageService.getUnresolvedConflicts();
      setConflicts(conflictList);
    } catch (error) {
      console.error('Failed to load conflicts:', error);
    }
  };

  const loadStorageStats = async () => {
    try {
      const stats = await offlineStorageService.getStorageStats();
      setStorageStats(stats);
    } catch (error) {
      console.error('Failed to load storage stats:', error);
    }
  };

  const loadNetworkInfo = () => {
    const info = syncService.getNetworkInfo();
    setNetworkInfo(info);
  };

  const handleManualSync = async () => {
    try {
      await syncService.performSync();
      await loadSyncStatus();
      await loadConflicts();
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleForceSync = async () => {
    try {
      await syncService.forceSyncAll();
      await loadSyncStatus();
      await loadConflicts();
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const handleConflictClick = (conflict: SyncConflict) => {
    setSelectedConflict(conflict);
    setShowConflictDialog(true);
  };

  const handleResolveConflict = async (resolution: 'local' | 'server' | 'merge') => {
    if (!selectedConflict) return;
    
    try {
      await offlineStorageService.resolveConflict(selectedConflict.id, resolution);
      await loadConflicts();
      setShowConflictDialog(false);
      setSelectedConflict(null);
      
      // Trigger sync after conflict resolution
      await syncService.performSync();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'info' => {
    switch (status) {
      case 'synced': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      case 'conflict': return 'error';
      default: return 'info';
    }
  };

  const getNetworkQuality = (): { label: string; color: string; icon: any } => {
    if (!syncStatus?.isOnline) {
      return { label: 'Offline', color: '#f44336', icon: <WifiOff /> };
    }
    
    switch (networkInfo.effectiveType) {
      case '4g':
        return { label: 'Excellent', color: '#4caf50', icon: <Wifi /> };
      case '3g':
        return { label: 'Good', color: '#ff9800', icon: <Wifi /> };
      case '2g':
        return { label: 'Slow', color: '#f44336', icon: <Wifi /> };
      default:
        return { label: 'Unknown', color: '#9e9e9e', icon: <NetworkCheck /> };
    }
  };

  const formatSyncTime = (ms: number): string => {
    if (ms < 1000) return '< 1 sec';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds} sec`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!syncStatus) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  const networkQuality = getNetworkQuality();

  return (
    <Box>
      {/* Sync Status Overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
            <Typography variant="h6">
              <Sync sx={{ mr: 1, verticalAlign: 'middle' }} />
              Sync Status
            </Typography>
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                icon={networkQuality.icon}
                label={networkQuality.label}
                size="small"
                sx={{ color: networkQuality.color, borderColor: networkQuality.color }}
                variant="outlined"
              />
              {syncStatus.isSyncing && <CircularProgress size={16} />}
            </Box>
          </Box>

          <Box display="flex" gap={2} mb={3}>
            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Connection Status
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                {syncStatus.isOnline ? (
                  <CloudDone color="success" />
                ) : (
                  <CloudOff color="error" />
                )}
                <Typography variant="body1">
                  {syncStatus.isOnline ? 'Online' : 'Offline'}
                </Typography>
              </Box>
            </Box>

            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Last Sync
              </Typography>
              <Typography variant="body1">
                {syncStatus.lastSync 
                  ? syncStatus.lastSync.toLocaleString() 
                  : 'Never'
                }
              </Typography>
            </Box>

            <Box flex={1}>
              <Typography variant="body2" color="text.secondary">
                Pending Items
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Badge badgeContent={syncStatus.pendingItems} color="warning">
                  <Queue />
                </Badge>
                <Typography variant="body1">
                  {syncStatus.pendingItems} items
                </Typography>
              </Box>
            </Box>
          </Box>

          {syncStatus.pendingItems > 0 && (
            <Box mb={2}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Estimated sync time: {formatSyncTime(syncEstimate)}
              </Typography>
              <LinearProgress 
                variant={syncStatus.isSyncing ? 'indeterminate' : 'determinate'}
                value={syncStatus.isSyncing ? undefined : 0}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<Sync />}
              onClick={handleManualSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
            >
              {syncStatus.isSyncing ? 'Syncing...' : 'Sync Now'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleForceSync}
              disabled={!syncStatus.isOnline || syncStatus.isSyncing}
            >
              Force Sync All
            </Button>
            
            <FormControlLabel
              control={
                <Switch
                  checked={autoSync}
                  onChange={(e) => setAutoSync(e.target.checked)}
                />
              }
              label="Auto Sync"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Conflicts Section */}
      {conflicts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Warning sx={{ mr: 1, verticalAlign: 'middle' }} color="warning" />
              Sync Conflicts ({conflicts.length})
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              Some expenses have conflicts that need manual resolution.
            </Alert>

            <List>
              {conflicts.map((conflict) => (
                <ListItem key={conflict.id} divider>
                  <ListItemIcon>
                    <SyncProblem color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${conflict.conflictType} conflict`}
                    secondary={`${conflict.localData.description} - ${new Date(conflict.timestamp).toLocaleString()}`}
                  />
                  <ListItemSecondaryAction>
                    <Button
                      size="small"
                      onClick={() => handleConflictClick(conflict)}
                      color="warning"
                    >
                      Resolve
                    </Button>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Storage & Performance Stats */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Typography variant="h6">
            <Storage sx={{ mr: 1, verticalAlign: 'middle' }} />
            Storage & Performance
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          {storageStats && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Offline Storage Usage
              </Typography>
              <Box display="flex" gap={4} mb={3}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Expenses
                  </Typography>
                  <Typography variant="h6">
                    {storageStats.totalExpenses}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Cache Size
                  </Typography>
                  <Typography variant="h6">
                    {formatFileSize(storageStats.cacheSize)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Pending Sync
                  </Typography>
                  <Typography variant="h6">
                    {storageStats.pendingSync}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="subtitle2" gutterBottom>
                Network Information
              </Typography>
              <Box display="flex" gap={4}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Connection Type
                  </Typography>
                  <Typography variant="body1">
                    {networkInfo.effectiveType || 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Download Speed
                  </Typography>
                  <Typography variant="body1">
                    {networkInfo.downlink ? `${networkInfo.downlink} Mbps` : 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Round Trip Time
                  </Typography>
                  <Typography variant="body1">
                    {networkInfo.rtt ? `${networkInfo.rtt} ms` : 'Unknown'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Conflict Resolution Dialog */}
      <Dialog 
        open={showConflictDialog} 
        onClose={() => setShowConflictDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Resolve Sync Conflict
        </DialogTitle>
        <DialogContent>
          {selectedConflict && (
            <Box>
              <Alert severity="info" sx={{ mb: 2 }}>
                This expense was modified both locally and on the server. 
                Choose which version to keep.
              </Alert>

              <Box display="flex" gap={2}>
                {/* Local Version */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="primary">
                      Local Version
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Amount:</strong> {selectedConflict.localData.amount} LKR
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Category:</strong> {selectedConflict.localData.category}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Description:</strong> {selectedConflict.localData.description}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Modified:</strong> {new Date(selectedConflict.localData.lastModified).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>

                {/* Server Version */}
                <Card sx={{ flex: 1 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom color="secondary">
                      Server Version
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Amount:</strong> {selectedConflict.serverData.amount} LKR
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Category:</strong> {selectedConflict.serverData.category}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Description:</strong> {selectedConflict.serverData.description}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Last Modified:</strong> {new Date(selectedConflict.serverData.updatedAt).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConflictDialog(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => handleResolveConflict('local')}
            color="primary"
            variant="outlined"
          >
            Keep Local
          </Button>
          <Button 
            onClick={() => handleResolveConflict('server')}
            color="secondary"
            variant="outlined"
          >
            Keep Server
          </Button>
          <Button 
            onClick={() => handleResolveConflict('merge')}
            color="success"
            variant="contained"
          >
            Smart Merge
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};