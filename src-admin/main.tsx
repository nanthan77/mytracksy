import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import AdminApp from './AdminApp';

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
        <AdminApp />
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
