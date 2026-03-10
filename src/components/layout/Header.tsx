import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  ListItemIcon,
  ListItemText,
  Alert,
  Snackbar
} from '@mui/material';
import { 
  ExitToApp, 
  Settings as SettingsIcon,
  Person as PersonIcon 
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import NotificationBell from '../notifications/NotificationBell';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [logoutError, setLogoutError] = React.useState('');
  const [showLogoutError, setShowLogoutError] = React.useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    navigate(ROUTES.SETTINGS);
    handleClose();
  };

  const handleSettings = () => {
    navigate(ROUTES.SETTINGS);
    handleClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      handleClose();
    } catch (error: any) {
      console.error('Failed to log out:', error);
      setLogoutError('Failed to log out. Please try again.');
      setShowLogoutError(true);
      handleClose();
    }
  };

  const getDisplayName = () => {
    if (currentUser?.displayName) {
      return currentUser.displayName;
    }
    if (currentUser?.email) {
      return currentUser.email.split('@')[0];
    }
    return 'User';
  };

  const getInitials = () => {
    const name = getDisplayName();
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <>
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            MyTracksy
          </Typography>
          
          {currentUser && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ mr: 2, display: { xs: 'none', sm: 'block' } }}
              >
                Welcome, {getDisplayName()}
              </Typography>
              <NotificationBell />
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {currentUser.photoURL ? (
                  <Avatar src={currentUser.photoURL} sx={{ width: 32, height: 32 }} />
                ) : (
                  <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                    {getInitials()}
                  </Avatar>
                )}
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                  sx: { minWidth: 200 }
                }}
              >
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Profile</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleSettings}>
                  <ListItemIcon>
                    <SettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Settings</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <ExitToApp fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              </Menu>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Snackbar
        open={showLogoutError}
        autoHideDuration={6000}
        onClose={() => setShowLogoutError(false)}
      >
        <Alert 
          onClose={() => setShowLogoutError(false)} 
          severity="error"
          sx={{ width: '100%' }}
        >
          {logoutError}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Header;