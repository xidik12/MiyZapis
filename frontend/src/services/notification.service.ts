import { apiClient } from './api';
import {
  Notification,
  NotificationType,
  NotificationPreferences,
  Pagination,
  ApiResponse
} from '@/types';

export class NotificationService {
  // Get user notifications
  async getNotifications(filters: {
    type?: NotificationType;
    isRead?: boolean;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    notifications: Notification[];
    unreadCount: number;
    pagination: Pagination;
  }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<{
        notifications: Notification[];
        unreadCount: number;
        pagination: Pagination;
      }>(`/notifications?${params}`);
      
      if (!response.success || !response.data) {
        // Return empty data instead of throwing
        return {
          notifications: [],
          unreadCount: 0,
          pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
        };
      }
      return response.data;
    } catch (error) {
      // Return empty data for any API errors to prevent app crashes
      console.warn('Notifications API error:', error);
      return {
        notifications: [],
        unreadCount: 0,
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 }
      };
    }
  }

  // Get unread notification count
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get unread count');
    }
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(`/notifications/${notificationId}/read`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark notification as read');
    }
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string; markedCount: number }> {
    const response = await apiClient.put<{ message: string; markedCount: number }>('/notifications/mark-all-read');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark all notifications as read');
    }
    return response.data;
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/notifications/${notificationId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete notification');
    }
    return response.data;
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<{ message: string; deletedCount: number }> {
    const response = await apiClient.delete<{ message: string; deletedCount: number }>('/notifications/all');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete all notifications');
    }
    return response.data;
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    const response = await apiClient.get<NotificationPreferences>('/notifications/preferences');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get notification preferences');
    }
    return response.data;
  }

  // Update notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<{
    message: string;
    preferences: NotificationPreferences;
  }> {
    const response = await apiClient.post<{
      message: string;
      preferences: NotificationPreferences;
    }>('/notifications/preferences', preferences);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update notification preferences');
    }
    return response.data;
  }

  // Send test notification
  async sendTestNotification(type: NotificationType): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>('/notifications/test', { type });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send test notification');
    }
    return response.data;
  }

  // Register for push notifications
  async registerPushNotifications(data: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
    deviceInfo?: {
      userAgent: string;
      platform: string;
    };
  }): Promise<{ message: string; subscriptionId: string }> {
    const response = await apiClient.post<{ message: string; subscriptionId: string }>('/notifications/push/register', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to register push notifications');
    }
    return response.data;
  }

  // Unregister push notifications
  async unregisterPushNotifications(subscriptionId?: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/notifications/push/unregister', {
      data: { subscriptionId }
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to unregister push notifications');
    }
    return response.data;
  }

  // Get notification templates (for admin/specialist customization)
  async getNotificationTemplates(): Promise<Array<{
    type: NotificationType;
    title: string;
    message: string;
    isCustomizable: boolean;
    variables: string[];
  }>> {
    const response = await apiClient.get('/notifications/templates');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get notification templates');
    }
    return response.data.templates;
  }

  // Create custom notification
  async createCustomNotification(data: {
    recipientId?: string;
    recipientType?: 'customer' | 'specialist' | 'all';
    title: string;
    message: string;
    actionUrl?: string;
    scheduledAt?: string;
  }): Promise<{ message: string; notificationId: string }> {
    const response = await apiClient.post<{ message: string; notificationId: string }>('/notifications/custom', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create custom notification');
    }
    return response.data;
  }

  // Get notification delivery status
  async getDeliveryStatus(notificationId: string): Promise<{
    status: 'pending' | 'sent' | 'delivered' | 'failed';
    sentAt?: string;
    deliveredAt?: string;
    failureReason?: string;
    channels: Array<{
      type: 'email' | 'push' | 'telegram';
      status: 'pending' | 'sent' | 'delivered' | 'failed';
      sentAt?: string;
      deliveredAt?: string;
      failureReason?: string;
    }>;
  }> {
    const response = await apiClient.get(`/notifications/${notificationId}/delivery-status`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get delivery status');
    }
    return response.data;
  }

  // Schedule bulk notifications
  async scheduleBulkNotifications(data: {
    recipientIds: string[];
    title: string;
    message: string;
    scheduledAt: string;
    channels: Array<'email' | 'push' | 'telegram'>;
  }): Promise<{ message: string; scheduledCount: number; jobId: string }> {
    const response = await apiClient.post<{ message: string; scheduledCount: number; jobId: string }>('/notifications/bulk/schedule', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to schedule bulk notifications');
    }
    return response.data;
  }

  // Cancel scheduled notification
  async cancelScheduledNotification(jobId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/notifications/scheduled/${jobId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to cancel scheduled notification');
    }
    return response.data;
  }

  // Get notification analytics
  async getNotificationAnalytics(period: 'week' | 'month' | 'quarter' = 'month'): Promise<{
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    deliveryRate: number;
    openRate: number;
    byType: Array<{
      type: NotificationType;
      sent: number;
      delivered: number;
      opened: number;
      rate: number;
    }>;
    byChannel: Array<{
      channel: 'email' | 'push' | 'telegram';
      sent: number;
      delivered: number;
      rate: number;
    }>;
    timeline: Array<{
      date: string;
      sent: number;
      delivered: number;
      opened: number;
    }>;
  }> {
    const response = await apiClient.get(`/notifications/analytics?period=${period}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get notification analytics');
    }
    return response.data;
  }

  // Snooze notifications
  async snoozeNotifications(duration: 'hour' | 'day' | 'week'): Promise<{ message: string; snoozedUntil: string }> {
    const response = await apiClient.post<{ message: string; snoozedUntil: string }>('/notifications/snooze', { duration });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to snooze notifications');
    }
    return response.data;
  }

  // Unsnooze notifications
  async unsnoozeNotifications(): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>('/notifications/snooze');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to unsnooze notifications');
    }
    return response.data;
  }

  // Archive old notifications
  async archiveOldNotifications(olderThanDays: number = 30): Promise<{ message: string; archivedCount: number }> {
    const response = await apiClient.post<{ message: string; archivedCount: number }>('/notifications/archive', {
      olderThanDays
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to archive old notifications');
    }
    return response.data;
  }

  // Export notifications
  async exportNotifications(filters: {
    type?: NotificationType;
    startDate?: string;
    endDate?: string;
    format?: 'csv' | 'json';
  } = {}): Promise<void> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const format = filters.format || 'csv';
    await apiClient.download(`/notifications/export?${params}`, `notifications.${format}`);
  }
}

export const notificationService = new NotificationService();