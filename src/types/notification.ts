export interface Notification {
  id: string;
  userId: string;
  type: 'budget_alert' | 'budget_exceeded' | 'spending_milestone' | 'weekly_summary' | 'monthly_summary';
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRead: boolean;
  isActionable: boolean;
  actionText?: string;
  actionUrl?: string;
  relatedBudgetId?: string;
  relatedExpenseId?: string;
  metadata?: {
    budgetName?: string;
    spentAmount?: number;
    budgetAmount?: number;
    percentage?: number;
    category?: string;
    period?: string;
  };
  createdAt: Date;
  readAt?: Date;
}

export interface NotificationSettings {
  id: string;
  userId: string;
  budgetAlerts: boolean;
  budgetThreshold: number; // Percentage (e.g., 80 for 80%)
  spendingMilestones: boolean;
  weeklySummary: boolean;
  monthlySummary: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
  inAppNotifications: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationFormData = Omit<NotificationSettings, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;