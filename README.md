# MyTracksy - Personal Expense Tracker

A modern, secure personal expense tracking application built with React, TypeScript, and Firebase.

## 🚀 Features

- **Expense Management**: Add, edit, delete, and categorize expenses
- **Budget Tracking**: Set monthly/weekly/yearly budgets with spending alerts
- **Analytics**: Visual insights into spending patterns and trends
- **Security**: Firebase Authentication with secure data access
- **Responsive**: Mobile-first design that works on all devices
- **Offline**: Works offline with data sync when connected

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Firebase (Auth, Firestore, Storage)
- **UI**: Material-UI / Tailwind CSS (TBD)
- **State**: React Context + useReducer
- **Testing**: Vitest, React Testing Library
- **Deployment**: Firebase Hosting

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Generic components (Button, Modal, etc.)
│   ├── layout/         # Layout components (Header, Sidebar, etc.)
│   └── forms/          # Form-specific components
├── pages/              # Page components
│   ├── auth/           # Login, Register pages
│   ├── dashboard/      # Dashboard page
│   ├── expenses/       # Expense management pages
│   ├── budgets/        # Budget management pages
│   └── settings/       # Settings page
├── hooks/              # Custom React hooks
├── context/            # React Context providers
├── services/           # API and Firebase services
├── types/              # TypeScript type definitions
├── utils/              # Utility functions and constants
└── assets/             # Static assets (images, icons)
```

## 🏗️ Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

## 📋 Development Phases

1. **Foundation** - Project setup, routing, layout ✅
2. **Authentication** - Firebase auth, protected routes
3. **Core Expenses** - CRUD operations, filtering
4. **Budget Features** - Budget vs actual, insights
5. **Advanced Features** - Receipts, export, recurring bills
6. **UI/UX** - Responsive design, performance, PWA
7. **Security & Testing** - Security rules, unit tests
8. **Deployment** - CI/CD, monitoring, analytics

## 📝 License

Private project for personal use.