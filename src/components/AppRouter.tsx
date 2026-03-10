import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

// Import pages
import Dashboard from '../pages/dashboard/Dashboard';
import Expenses from '../pages/expenses/Expenses';
import Budgets from '../pages/budgets/Budgets';
import BudgetDetails from '../pages/budgets/BudgetDetails';
import Income from '../pages/income/Income';
import Settings from '../pages/settings/Settings';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Import components
import ProtectedRoute from './common/ProtectedRoute';
import PublicRoute from './common/PublicRoute';
import Layout from './layout/Layout';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* Public routes - redirect to dashboard if logged in */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.REGISTER}
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      
      {/* Protected routes with layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
                <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
                <Route path={ROUTES.EXPENSES} element={<Expenses />} />
                <Route path={ROUTES.BUDGETS} element={<Budgets />} />
                <Route path="/budgets/:budgetId" element={<BudgetDetails />} />
                <Route path={ROUTES.INCOME} element={<Income />} />
                <Route path={ROUTES.SETTINGS} element={<Settings />} />
                {/* Catch all route - redirect to dashboard */}
                <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRouter;