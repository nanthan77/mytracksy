import React from 'react';
import { AppBar, Toolbar, IconButton, Typography, Box, Chip, Button } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAdminAuth } from '../../auth/useAdminAuth';
import { DRAWER_WIDTH } from './AdminSidebar';

interface AdminHeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const ROLE_LABELS: Record<string, { label: string; color: 'error' | 'primary' | 'warning' | 'default' }> = {
  super_admin: { label: 'Super Admin', color: 'error' },
  profession_admin: { label: 'Prof. Admin', color: 'primary' },
  support_agent: { label: 'Support', color: 'warning' },
  viewer: { label: 'Viewer', color: 'default' },
};

export default function AdminHeader({ onMenuClick, title }: AdminHeaderProps) {
  const { user, role, logout } = useAdminAuth();

  const roleInfo = role ? ROLE_LABELS[role] : null;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        ml: { md: `${DRAWER_WIDTH}px` },
        bgcolor: '#0f172a',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ mr: 2, display: { md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>

        {title && (
          <Typography variant="h6" fontWeight={600} noWrap sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        )}
        {!title && <Box sx={{ flexGrow: 1 }} />}

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {roleInfo && (
            <Chip label={roleInfo.label} color={roleInfo.color} size="small" variant="outlined" />
          )}
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            {user?.email}
          </Typography>
          <Button
            size="small"
            startIcon={<LogoutIcon />}
            onClick={logout}
            sx={{ color: 'text.secondary', textTransform: 'none' }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
