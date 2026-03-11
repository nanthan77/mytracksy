import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AdminApp from './AdminApp';
import { AdminAuthProvider } from './auth/AdminAuthContext';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6366f1' },
    secondary: { main: '#ec4899' },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: '"Inter", sans-serif',
  },
  shape: { borderRadius: 12 },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BrowserRouter>
        <AdminAuthProvider>
          <AdminApp />
        </AdminAuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
