// Notification service - adapted for React Native
import { apiClient } from './api';
import {
  Notification,
  NotificationType,
  NotificationPreferences,
  Pagination,
} from '../types';

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
      throw new Error(response.error?.message || 'Failed to get notifications');
    }
    
    return response.data;
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark notification as read');
    }
    return response.data;
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>('/notifications/mark-all-read');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark all notifications as read');
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
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const response = await apiClient.put<NotificationPreferences>('/notifications/preferences', preferences);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update notification preferences');
    }
    return response.data;
  }

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get unread count');
    }
    return response.data.unreadCount || 0;
  }
}

export const notificationService = new NotificationService();

