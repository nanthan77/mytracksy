import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Tooltip
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  MarkEmailRead as MarkAllReadIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { Notification } from '../../types/notification';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    if (notification.isActionable && notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    
    handleClose();
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    await deleteNotification(notificationId);
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon color="error" fontSize="small" />;
      case 'high':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'medium':
        return <InfoIcon color="info" fontSize="small" />;
      default:
        return <CheckCircleIcon color="success" fontSize="small" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      return format(date, 'MMM d');
    }
  };

  const recentNotifications = notifications.slice(0, 10);

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="large"
        >
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
          </Badge>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 500,
            overflow: 'auto'
          }
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Notifications
            </Typography>
            {unreadCount > 0 && (
              <Button
                size="small"
                startIcon={<MarkAllReadIcon />}
                onClick={handleMarkAllRead}
              >
                Mark all read
              </Button>
            )}
          </Box>
          {unreadCount > 0 && (
            <Typography variant="body2" color="text.secondary">
              {unreadCount} unread notification{unreadCount === 1 ? '' : 's'}
            </Typography>
          )}
        </Box>

        {/* Notifications List */}
        {recentNotifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          recentNotifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <MenuItem
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  px: 2,
                  backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.selected'
                  }
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {getSeverityIcon(notification.severity)}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontWeight: notification.isRead ? 'normal' : 'bold',
                          lineHeight: 1.2
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => handleDeleteNotification(notification.id, e)}
                        sx={{ ml: 1, p: 0.5 }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {notification.message}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {formatRelativeTime(notification.createdAt)}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Chip
                            label={notification.severity}
                            size="small"
                            color={getSeverityColor(notification.severity) as any}
                            variant="outlined"
                            sx={{ height: 20, fontSize: '0.65rem' }}
                          />
                          {!notification.isRead && (
                            <Chip
                              label="New"
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.65rem' }}
                            />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  }
                />
              </MenuItem>
              {index < recentNotifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}

        {/* Footer */}
        {notifications.length > 10 && (
          <>
            <Divider />
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Button
                size="small"
                onClick={() => {
                  navigate('/notifications');
                  handleClose();
                }}
              >
                View all notifications
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default NotificationBell;