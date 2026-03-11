import React from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Box, Typography, Divider } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import GavelIcon from '@mui/icons-material/Gavel';
import SettingsIcon from '@mui/icons-material/Settings';
import BarChartIcon from '@mui/icons-material/BarChart';
import HistoryIcon from '@mui/icons-material/History';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import TuneIcon from '@mui/icons-material/Tune';

const DRAWER_WIDTH = 260;

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface AdminSidebarProps {
  variant: 'super' | 'profession';
  professionId?: string;
  professionLabel?: string;
  professionIcon?: string;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function AdminSidebar({ variant, professionId, professionLabel, professionIcon, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const superAdminNav: NavItem[] = [
    { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { label: 'Role Management', path: '/roles', icon: <GavelIcon /> },
    { label: 'Audit Log', path: '/audit', icon: <HistoryIcon /> },
    { label: 'Analytics', path: '/analytics', icon: <BarChartIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const professionNav: NavItem[] = professionId ? [
    { label: 'Dashboard', path: `/profession/${professionId}`, icon: <DashboardIcon /> },
    { label: 'Users', path: `/profession/${professionId}/users`, icon: <PeopleIcon /> },
    { label: 'Verification', path: `/profession/${professionId}/verification`, icon: <VerifiedUserIcon /> },
    { label: 'Subscriptions', path: `/profession/${professionId}/subscriptions`, icon: <CreditCardIcon /> },
    { label: 'Analytics', path: `/profession/${professionId}/analytics`, icon: <BarChartIcon /> },
    { label: 'Settings', path: `/profession/${professionId}/settings`, icon: <TuneIcon /> },
  ] : [];

  const navItems = variant === 'super' ? superAdminNav : professionNav;

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 1.5 }}>
        <Box>
          <Typography variant="h6" fontWeight={700} sx={{ color: '#6366f1', letterSpacing: '-0.5px' }}>
            {variant === 'super' ? 'MyTracksy' : (professionIcon || '') + ' ' + (professionLabel || '')}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {variant === 'super' ? 'Super Admin Console' : 'Profession Admin'}
          </Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1, py: 1 }}>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => { navigate(item.path); onMobileClose(); }}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'rgba(99, 102, 241, 0.12)',
                color: '#6366f1',
                '& .MuiListItemIcon-root': { color: '#6366f1' },
              },
              '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
          </ListItemButton>
        ))}
      </List>
      {variant === 'profession' && (
        <>
          <Divider />
          <List sx={{ px: 1, py: 1 }}>
            <ListItemButton
              onClick={() => navigate('/')}
              sx={{ borderRadius: 2, '&:hover': { bgcolor: 'rgba(99, 102, 241, 0.08)' } }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}><ArrowBackIcon /></ListItemIcon>
              <ListItemText primary="All Professions" primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} />
            </ListItemButton>
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.06)' },
        }}
      >
        {drawerContent}
      </Drawer>
      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: DRAWER_WIDTH, bgcolor: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.06)' },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export { DRAWER_WIDTH };
