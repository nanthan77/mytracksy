import { useState, useEffect, useCallback } from 'react';
import { Notification as AppNotification, NotificationSettings } from '../types/notification';
import { notificationService } from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

export const useNotifications = (autoLoad = true) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userNotifications = await notificationService.getUserNotifications(currentUser.uid);
      setNotifications(userNotifications);
      
      const count = await notificationService.getUnreadCount(currentUser.uid);
      setUnreadCount(count);
    } catch (err: any) {
      setError(err.message || 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const markAsRead = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setError(null);
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true, readAt: new Date() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
      return false;
    }
  }, []);

  const markAllAsRead = useCallback(async (): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      setError(null);
      await notificationService.markAllAsRead(currentUser.uid);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ 
          ...notification, 
          isRead: true, 
          readAt: new Date() 
        }))
      );
      
      setUnreadCount(0);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to mark all notifications as read');
      return false;
    }
  }, [currentUser]);

  const deleteNotification = useCallback(async (notificationId: string): Promise<boolean> => {
    try {
      setError(null);
      await notificationService.deleteNotification(notificationId);
      
      // Update local state
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(notification => notification.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification');
      return false;
    }
  }, [notifications]);

  const refresh = useCallback(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Simple notification helper for in-app alerts
  const showNotification = useCallback((message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    // For now, just use browser notification or console
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Tracksy', {
        body: message,
        icon: '/favicon.ico'
      });
    } else {
      console.log(`${type.toUpperCase()}: ${message}`);
    }
  }, []);

  useEffect(() => {
    if (autoLoad && currentUser) {
      loadNotifications();
    }
  }, [autoLoad, currentUser, loadNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh,
    showNotification
  };
};

export const useNotificationSettings = () => {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);
      const userSettings = await notificationService.getNotificationSettings(currentUser.uid);
      setSettings(userSettings);
    } catch (err: any) {
      setError(err.message || 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateSettings = useCallback(async (updates: Partial<NotificationSettings>): Promise<boolean> => {
    if (!settings) return false;

    try {
      setError(null);
      await notificationService.updateNotificationSettings(settings.id, updates);
      setSettings(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update notification settings');
      return false;
    }
  }, [settings]);

  useEffect(() => {
    if (currentUser) {
      loadSettings();
    }
  }, [currentUser, loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    refresh: loadSettings
  };
};

export const useNotificationAlerts = () => {
  const { currentUser } = useAuth();

  const checkBudgetAlerts = useCallback(async (budgets: any[]): Promise<void> => {
    if (!currentUser) return;

    try {
      const settings = await notificationService.getNotificationSettings(currentUser.uid);
      
      for (const budget of budgets) {
        await notificationService.checkBudgetAlerts(budget, settings);
      }
    } catch (err: any) {
      console.error('Failed to check budget alerts:', err);
    }
  }, [currentUser]);

  return {
    checkBudgetAlerts
  };
};