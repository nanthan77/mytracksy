import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import './index.css'

console.log('Main.tsx loaded');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <App />
      </AuthProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Root element not found');
}