// Application constants

export const EXPENSE_CATEGORIES = [
  { id: 'food', name: 'Food & Dining', icon: '🍽️', color: '#FF6B35' },
  { id: 'transport', name: 'Transportation', icon: '🚗', color: '#4ECDC4' },
  { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#45B7D1' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', color: '#96CEB4' },
  { id: 'bills', name: 'Bills & Utilities', icon: '💡', color: '#FFEAA7' },
  { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#DDA0DD' },
  { id: 'education', name: 'Education', icon: '📚', color: '#98D8C8' },
  { id: 'travel', name: 'Travel', icon: '✈️', color: '#F7DC6F' },
  { id: 'other', name: 'Other', icon: '📦', color: '#AEB6BF' }
];

export const BUDGET_PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  INPUT: 'YYYY-MM-DD',
  TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  EXPENSES: '/expenses',
  BUDGETS: '/budgets',
  INCOME: '/income',
  SETTINGS: '/settings',
  LOGIN: '/login',
  REGISTER: '/register'
};