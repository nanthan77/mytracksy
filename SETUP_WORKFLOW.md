# Tracksy Setup Workflow Guide

## 🚀 Quick Start Guide

This document outlines the complete workflow for setting up and running the Tracksy personal finance tracker application.

## 📋 Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn** package manager
- **Git** for version control
- **Firebase account** (optional - mock auth is enabled by default)

## 🛠️ Project Structure

```
mytracksynew/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/              # Main application pages
│   ├── services/           # Firebase and API services
│   ├── context/            # React contexts (Auth, etc.)
│   ├── hooks/              # Custom React hooks
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── standalone files/       # Complete HTML versions
│   ├── mytracksy-complete.html
│   ├── mytracksy-advanced.html
│   └── mytracksy-pwa.html
└── package.json           # Dependencies and scripts
```

## 🎯 Setup Workflow

### Step 1: Navigate to Project Directory
```bash
cd /Users/nanthan/mytracksynew
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Start Development Server
```bash
npm run dev
```

### Step 4: Access Application
- **React App**: http://localhost:5173/
- **Standalone HTML**: Open mytracksy-complete.html directly in browser

## 🔧 Configuration Options

### Authentication Mode
The app supports two authentication modes:

#### 1. Mock Authentication (Default)
```typescript
// src/context/AuthContext.tsx
const [useMockAuth] = useState(true);
```
- **Auto-login**: Enabled with test user
- **Credentials**: test@example.com / password123
- **No Firebase setup required**

#### 2. Firebase Authentication
```typescript
// src/context/AuthContext.tsx
const [useMockAuth] = useState(false);
```
- **Requires**: Firebase project setup
- **Config**: Update src/services/firebase.ts with your credentials

### Firebase Configuration
If using real Firebase authentication, update the config:

```typescript
// src/services/firebase.ts
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-messaging-sender-id",
  appId: "your-app-id"
};
```

## 🎨 Features Overview

### Core Features
- **Dashboard**: Financial overview with charts and metrics
- **Expense Tracking**: Add, categorize, and manage expenses
- **Budget Management**: Set budgets and track spending progress
- **Income Tracking**: Record and manage income sources
- **Data Visualization**: Charts and graphs for financial insights

### UI Components
- **Material-UI**: Professional design system
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Theme**: Theme switching capability
- **TypeScript**: Type-safe development

## 🔍 Troubleshooting Common Issues

### White Screen on Localhost
**Symptoms**: Blank white page when accessing http://localhost:5173/

**Solutions**:
1. **Check Console Errors**: Open browser dev tools (F12) and check console
2. **Authentication Issue**: Ensure mock auth is enabled in AuthContext.tsx
3. **Port Conflict**: Try different port with `npm run dev -- --port 3000`
4. **Clear Cache**: Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)

### Development Server Won't Start
**Symptoms**: `npm run dev` fails or shows errors

**Solutions**:
1. **Kill Existing Processes**: `pkill -f vite`
2. **Clear Node Modules**: `rm -rf node_modules && npm install`
3. **Check Port Usage**: `lsof -i :5173`
4. **Update Dependencies**: `npm update`

### Authentication Errors
**Symptoms**: Login failures or authentication loops

**Solutions**:
1. **Enable Mock Auth**: Set `useMockAuth = true` in AuthContext.tsx
2. **Clear Local Storage**: Browser dev tools > Application > Local Storage > Clear
3. **Check Firebase Config**: Verify credentials if using real Firebase

### Build Errors
**Symptoms**: TypeScript or compilation errors

**Solutions**:
1. **Check Types**: Ensure all imports have proper type definitions
2. **Update TypeScript**: `npm install typescript@latest`
3. **Clear Build Cache**: `rm -rf dist && npm run build`

## 📁 Alternative Access Methods

### Standalone HTML Files
If the React development server has issues, use the standalone versions:

1. **Complete Version**: `mytracksy-complete.html`
   - Full features with local storage
   - No server required
   - Works offline

2. **PWA Version**: `mytracksy-pwa.html`
   - Progressive Web App features
   - Service worker enabled
   - Installable on mobile

3. **Advanced Version**: `mytracksy-advanced.html`
   - Advanced features and charts
   - Enhanced UI components

### Opening Standalone Files
```bash
# Method 1: Command line
open mytracksy-complete.html

# Method 2: Direct browser
# Navigate to file:///Users/nanthan/mytracksynew/mytracksy-complete.html
```

## 🚀 Production Build

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize project
firebase init hosting

# Deploy
firebase deploy
```

## 📊 Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint checks |
| `npm run test` | Run test suite |

## 🔄 Workflow Summary

1. **Start Development**: `cd /Users/nanthan/mytracksynew && npm run dev`
2. **Access App**: http://localhost:5173/
3. **Auto-Login**: Enabled by default (Test User)
4. **Develop Features**: Edit files in src/ directory
5. **Test Changes**: Hot reload enabled
6. **Fallback Option**: Use mytracksy-complete.html if needed

## 📝 Notes

- **Mock Authentication**: Enabled by default for easy development
- **Data Persistence**: Uses localStorage in mock mode
- **Responsive Design**: Optimized for all screen sizes
- **TypeScript**: Full type safety throughout the application
- **Material-UI**: Professional and consistent design system

## 🆘 Emergency Access

If all else fails, the standalone HTML files provide full functionality:
- No server setup required
- No dependencies needed
- Works directly in any modern browser
- Full feature parity with React version

---

**Created**: July 2025  
**Last Updated**: Current session  
**Version**: 1.0  
**Status**: Production Ready