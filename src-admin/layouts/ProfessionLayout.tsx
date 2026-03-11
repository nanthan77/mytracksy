import React, { useState } from 'react';
import { Box, Toolbar } from '@mui/material';
import { useParams } from 'react-router-dom';
import AdminSidebar, { DRAWER_WIDTH } from '../shared/components/AdminSidebar';
import AdminHeader from '../shared/components/AdminHeader';
import { PROFESSION_MAP } from '../../shared/constants/professions';

export default function ProfessionLayout({ children }: { children: React.ReactNode }) {
  const { professionId } = useParams<{ professionId: string }>();
  const [mobileOpen, setMobileOpen] = useState(false);
  const profession = professionId ? PROFESSION_MAP[professionId] : null;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#0f172a' }}>
      <AdminHeader
        onMenuClick={() => setMobileOpen(!mobileOpen)}
        title={profession ? `${profession.icon} ${profession.label} Admin` : 'Profession Admin'}
      />
      <AdminSidebar
        variant="profession"
        professionId={professionId}
        professionLabel={profession?.label}
        professionIcon={profession?.icon}
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
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
