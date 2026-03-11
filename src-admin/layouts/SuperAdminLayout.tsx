import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import AdminSidebar, { DRAWER_WIDTH } from '../shared/components/AdminSidebar';
import AdminHeader from '../shared/components/AdminHeader';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <AdminHeader onMenuClick={() => setMobileOpen(!mobileOpen)} title="Super Admin" />
      <AdminSidebar
        variant="super"
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar /> {/* Spacer for fixed AppBar */}
        {children}
      </Box>
    </Box>
  );
}
