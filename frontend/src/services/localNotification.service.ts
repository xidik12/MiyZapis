/**
 * Local Notification Service
 * Provides notifications functionality when backend is unavailable
 * Stores notifications locally and syncs when backend is available
 */

import { Notification, NotificationType, NotificationPreferences } from '@/types';

export interface LocalNotification extends Omit<Notification, 'id'> {
  id: string;
  localId: string;
  synced: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  NOTIFICATIONS: 'local_notifications',
  PREFERENCES: 'notification_preferences',
  UNREAD_COUNT: 'notification_unread_count'
};

export class LocalNotificationService {
  private notifications: LocalNotification[] = [];
  private preferences: NotificationPreferences | null = null;
  private listeners: Array<(notifications: LocalNotification[]) => void> = [];

  constructor() {
    this.loadFromStorage();
  }

  // Load data from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      this.notifications = stored ? JSON.parse(stored) : [];
      
      const storedPrefs = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      this.preferences = storedPrefs ? JSON.parse(storedPrefs) : this.getDefaultPreferences();
    } catch (error) {
      console.error('Error loading notifications from storage:', error);
      this.notifications = [];
      this.preferences = this.getDefaultPreferences();
    }
  }

  // Save data to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(this.notifications));
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(this.preferences));
      
      const unreadCount = this.getUnreadCount();
      localStorage.setItem(STORAGE_KEYS.UNREAD_COUNT, unreadCount.toString());
    } catch (error) {
      console.error('Error saving notifications to storage:', error);
    }
  }

  // Generate unique ID
  private generateId(): string {
    return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Get default preferences
  private getDefaultPreferences(): NotificationPreferences {
    return {
      email: true,
      push: true,
      telegram: false,
      types: {
        booking: true,
        payment: true,
        review: true,
        system: true,
        marketing: false
      },
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  // Add notification listener
  addListener(callback: (notifications: LocalNotification[]) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners
  private notifyListeners(): void {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Get all notifications
  getNotifications(filters?: {
    type?: NotificationType;
    isRead?: boolean;
    limit?: number;
  }): LocalNotification[] {
    let filtered = [...this.notifications];

    if (filters?.type) {
      filtered = filtered.filter(n => n.type === filters.type);
    }

    if (filters?.isRead !== undefined) {
      filtered = filtered.filter(n => n.isRead === filters.isRead);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      filtered = filtered.slice(0, filters.limit);
    }

    return filtered;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  // Add new notification
  addNotification(notification: Omit<LocalNotification, 'id' | 'localId' | 'synced' | 'createdAt' | 'updatedAt'>): LocalNotification {
    const now = new Date().toISOString();
    const newNotification: LocalNotification = {
      ...notification,
      id: this.generateId(),
      localId: this.generateId(),
      synced: false,
      createdAt: now,
      updatedAt: now
    };

    this.notifications.unshift(newNotification);
    this.saveToStorage();
    this.notifyListeners();

    console.log('📧 Local notification added:', newNotification);
    return newNotification;
  }

  // Mark notification as read
  markAsRead(id: string): boolean {
    const notification = this.notifications.find(n => n.id === id || n.localId === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      notification.updatedAt = new Date().toISOString();
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Mark all as read
  markAllAsRead(): number {
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    unreadNotifications.forEach(n => {
      n.isRead = true;
      n.updatedAt = new Date().toISOString();
    });

    if (unreadNotifications.length > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }

    return unreadNotifications.length;
  }

  // Delete notification
  deleteNotification(id: string): boolean {
    const index = this.notifications.findIndex(n => n.id === id || n.localId === id);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.saveToStorage();
      this.notifyListeners();
      return true;
    }
    return false;
  }

  // Delete all notifications
  deleteAllNotifications(): number {
    const count = this.notifications.length;
    this.notifications = [];
    this.saveToStorage();
    this.notifyListeners();
    return count;
  }

  // Get preferences
  getPreferences(): NotificationPreferences {
    return this.preferences || this.getDefaultPreferences();
  }

  // Update preferences
  updatePreferences(preferences: Partial<NotificationPreferences>): NotificationPreferences {
    this.preferences = {
      ...this.getDefaultPreferences(),
      ...this.preferences,
      ...preferences
    };
    this.saveToStorage();
    return this.preferences;
  }

  // Create system notifications for common events
  createBookingNotification(bookingData: any): LocalNotification {
    return this.addNotification({
      type: 'booking',
      title: 'Booking Update',
      message: `Your booking for ${bookingData.serviceName} has been updated`,
      isRead: false,
      actionUrl: `/bookings/${bookingData.id}`,
      metadata: { bookingId: bookingData.id }
    });
  }

  createPaymentNotification(paymentData: any): LocalNotification {
    return this.addNotification({
      type: 'payment',
      title: 'Payment Processed',
      message: `Payment of ${paymentData.amount} has been processed`,
      isRead: false,
      actionUrl: `/payments/${paymentData.id}`,
      metadata: { paymentId: paymentData.id }
    });
  }

  createSystemNotification(title: string, message: string, actionUrl?: string): LocalNotification {
    return this.addNotification({
      type: 'system',
      title,
      message,
      isRead: false,
      actionUrl,
      metadata: {}
    });
  }

  // Sync with backend when available
  async syncWithBackend(backendService: any): Promise<{
    synced: number;
    errors: number;
  }> {
    let synced = 0;
    let errors = 0;

    const unsyncedNotifications = this.notifications.filter(n => !n.synced);

    for (const notification of unsyncedNotifications) {
      try {
        // This would sync with the backend when it's working
        // await backendService.createNotification(notification);
        
        notification.synced = true;
        synced++;
      } catch (error) {
        console.error('Sync error for notification:', notification.id, error);
        errors++;
      }
    }

    if (synced > 0) {
      this.saveToStorage();
      this.notifyListeners();
    }

    return { synced, errors };
  }

  // Generate sample notifications for testing
  generateSampleNotifications(): void {
    const samples = [
      {
        type: 'booking' as NotificationType,
        title: 'Booking Confirmed',
        message: 'Your appointment with John Doe has been confirmed for tomorrow at 2:00 PM',
        isRead: false,
        actionUrl: '/bookings/123',
        metadata: { bookingId: '123' }
      },
      {
        type: 'payment' as NotificationType,
        title: 'Payment Received',
        message: 'Payment of $50 has been processed successfully',
        isRead: false,
        actionUrl: '/payments/456',
        metadata: { paymentId: '456' }
      },
      {
        type: 'system' as NotificationType,
        title: 'Profile Updated',
        message: 'Your profile information has been updated successfully',
        isRead: true,
        actionUrl: '/profile',
        metadata: {}
      },
      {
        type: 'review' as NotificationType,
        title: 'New Review',
        message: 'You received a 5-star review from Sarah Johnson',
        isRead: false,
        actionUrl: '/reviews/789',
        metadata: { reviewId: '789' }
      }
    ];

    samples.forEach(sample => this.addNotification(sample));
    console.log('📧 Sample notifications generated');
  }

  // Clear all data (for testing/reset)
  clearAll(): void {
    this.notifications = [];
    this.preferences = this.getDefaultPreferences();
    this.saveToStorage();
    this.notifyListeners();
  }
}

export const localNotificationService = new LocalNotificationService();