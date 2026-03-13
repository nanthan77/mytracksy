import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import { HelmetProvider } from 'react-helmet-async'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      const scriptUrl =
        registration.active?.scriptURL ||
        registration.waiting?.scriptURL ||
        registration.installing?.scriptURL ||
        '';

      if (scriptUrl.endsWith('/sw.js')) {
        registration.unregister().catch(() => undefined);
      }
    });
  });

  caches.keys().then((cacheNames) => {
    cacheNames
      .filter((cacheName) => cacheName === 'tracksy-v1')
      .forEach((cacheName) => {
        caches.delete(cacheName).catch(() => undefined);
      });
  });
}

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <HelmetProvider>
        <ErrorBoundary>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </HelmetProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}
