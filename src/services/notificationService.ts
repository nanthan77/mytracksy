import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Notification, NotificationSettings } from '../types/notification';
import { Budget } from '../types';

const NOTIFICATIONS_COLLECTION = 'notifications';
const NOTIFICATION_SETTINGS_COLLECTION = 'notificationSettings';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Convert Date to Firestore timestamp
const dateToTimestamp = (date: Date): Timestamp => {
  return Timestamp.fromDate(date);
};

// Convert Firestore document to Notification
const docToNotification = (doc: any): Notification => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
    readAt: data.readAt ? timestampToDate(data.readAt) : undefined
  };
};

// Convert Firestore document to NotificationSettings
const docToNotificationSettings = (doc: any): NotificationSettings => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: timestampToDate(data.createdAt),
    updatedAt: timestampToDate(data.updatedAt)
  };
};

export const notificationService = {
  // Create a notification
  async createNotification(userId: string, notificationData: Omit<Notification, 'id' | 'userId' | 'createdAt'>): Promise<string> {
    const notification = {
      ...notificationData,
      userId,
      createdAt: dateToTimestamp(new Date())
    };

    const docRef = await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    return docRef.id;
  },

  // Get user notifications
  async getUserNotifications(userId: string, limitCount = 50): Promise<Notification[]> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotification);
  },

  // Get unread notifications count
  async getUnreadCount(userId: string): Promise<number> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  },

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<void> {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, {
      isRead: true,
      readAt: dateToTimestamp(new Date())
    });
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<void> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('isRead', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((document) => {
      batch.update(document.ref, {
        isRead: true,
        readAt: dateToTimestamp(new Date())
      });
    });

    await batch.commit();
  },

  // Delete notification
  async deleteNotification(notificationId: string): Promise<void> {
    const docRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(docRef);
  },

  // Delete old notifications (older than 30 days)
  async cleanupOldNotifications(userId: string): Promise<void> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('createdAt', '<', dateToTimestamp(thirtyDaysAgo))
    );

    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);

    querySnapshot.docs.forEach((document) => {
      batch.delete(document.ref);
    });

    await batch.commit();
  },

  // Get or create notification settings
  async getNotificationSettings(userId: string): Promise<NotificationSettings> {
    const q = query(
      collection(db, NOTIFICATION_SETTINGS_COLLECTION),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return docToNotificationSettings(querySnapshot.docs[0]);
    }

    // Create default settings
    const defaultSettings = {
      userId,
      budgetAlerts: true,
      budgetThreshold: 80,
      spendingMilestones: true,
      weeklySummary: true,
      monthlySummary: true,
      pushNotifications: true,
      emailNotifications: false,
      inAppNotifications: true,
      createdAt: dateToTimestamp(new Date()),
      updatedAt: dateToTimestamp(new Date())
    };

    const docRef = await addDoc(collection(db, NOTIFICATION_SETTINGS_COLLECTION), defaultSettings);
    return { id: docRef.id, ...defaultSettings, createdAt: new Date(), updatedAt: new Date() };
  },

  // Update notification settings
  async updateNotificationSettings(settingsId: string, updates: Partial<NotificationSettings>): Promise<void> {
    const docRef = doc(db, NOTIFICATION_SETTINGS_COLLECTION, settingsId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: dateToTimestamp(new Date())
    });
  },

  // Check budget and create alerts
  async checkBudgetAlerts(budget: Budget, settings: NotificationSettings): Promise<void> {
    if (!settings.budgetAlerts) return;

    const spent = budget.spent || 0;
    const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

    // Check if we should create an alert
    const shouldAlert = percentage >= settings.budgetThreshold && percentage < 100;
    const shouldAlertExceeded = percentage >= 100;

    if (shouldAlert) {
      // Check if we already sent this alert recently (within 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const existingAlerts = await this.getRecentBudgetAlerts(budget.userId, budget.id, oneDayAgo);
      
      if (existingAlerts.length === 0) {
        await this.createNotification(budget.userId, {
          type: 'budget_alert',
          title: `Budget Alert: ${budget.name}`,
          message: `You've used ${percentage.toFixed(1)}% of your ${budget.name} budget (${this.formatCurrency(spent)} of ${this.formatCurrency(budget.amount)}).`,
          severity: percentage >= 90 ? 'high' : 'medium',
          isRead: false,
          isActionable: true,
          actionText: 'View Budget',
          actionUrl: `/budgets/${budget.id}`,
          relatedBudgetId: budget.id,
          metadata: {
            budgetName: budget.name,
            spentAmount: spent,
            budgetAmount: budget.amount,
            percentage,
            category: budget.category,
            period: budget.period
          }
        });
      }
    }

    if (shouldAlertExceeded) {
      // Check if we already sent exceeded alert
      const existingExceededAlerts = await this.getRecentBudgetExceededAlerts(budget.userId, budget.id, new Date(budget.startDate));
      
      if (existingExceededAlerts.length === 0) {
        await this.createNotification(budget.userId, {
          type: 'budget_exceeded',
          title: `Budget Exceeded: ${budget.name}`,
          message: `You've exceeded your ${budget.name} budget by ${this.formatCurrency(spent - budget.amount)}. Consider reviewing your spending.`,
          severity: 'critical',
          isRead: false,
          isActionable: true,
          actionText: 'Review Budget',
          actionUrl: `/budgets/${budget.id}`,
          relatedBudgetId: budget.id,
          metadata: {
            budgetName: budget.name,
            spentAmount: spent,
            budgetAmount: budget.amount,
            percentage,
            category: budget.category,
            period: budget.period
          }
        });
      }
    }
  },

  // Get recent budget alerts
  async getRecentBudgetAlerts(userId: string, budgetId: string, since: Date): Promise<Notification[]> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('relatedBudgetId', '==', budgetId),
      where('type', '==', 'budget_alert'),
      where('createdAt', '>=', dateToTimestamp(since))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotification);
  },

  // Get recent budget exceeded alerts
  async getRecentBudgetExceededAlerts(userId: string, budgetId: string, since: Date): Promise<Notification[]> {
    const q = query(
      collection(db, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('relatedBudgetId', '==', budgetId),
      where('type', '==', 'budget_exceeded'),
      where('createdAt', '>=', dateToTimestamp(since))
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docToNotification);
  },

  // Create spending milestone notification
  async createSpendingMilestone(userId: string, amount: number, period: string): Promise<void> {
    await this.createNotification(userId, {
      type: 'spending_milestone',
      title: 'Spending Milestone Reached',
      message: `You've spent ${this.formatCurrency(amount)} this ${period}.`,
      severity: 'low',
      isRead: false,
      isActionable: true,
      actionText: 'View Expenses',
      actionUrl: '/expenses',
      metadata: {
        spentAmount: amount,
        period
      }
    });
  },

  // Format currency
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
};