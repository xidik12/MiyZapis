import { apiClient } from './api';
import { localNotificationService, LocalNotification } from './localNotification.service';
import {
  Notification,
  NotificationType,
  NotificationPreferences,
  Pagination,
  ApiResponse
} from '@/types';

export class NotificationService {
  private useLocalFallback = false;

  // Check if backend is available
  private async isBackendAvailable(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.success;
    } catch {
      return false;
    }
  }

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
    // Try backend first
    if (!this.useLocalFallback) {
      try {
        // Set default values to prevent backend issues
        const defaultFilters = {
          page: 1,
          limit: 20,
          ...filters
        };
        
        const params = new URLSearchParams();
        
        Object.entries(defaultFilters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.append(key, value.toString());
          }
        });

        console.log('📡 Attempting to fetch notifications from backend with params:', params.toString());

        const response = await apiClient.get<{
          notifications: Notification[];
          unreadCount: number;
          pagination: Pagination;
        }>(`/notifications?${params}`);
        
        if (response.success && response.data) {
          console.log('✅ Backend notifications fetched successfully:', response.data.notifications.length, 'notifications');
          return response.data;
        }
        
        throw new Error('Backend returned unsuccessful response');
        
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('🚨 Backend notifications failed, switching to local fallback:', {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText
        });
        
        this.useLocalFallback = true;
        
        // Generate sample data if no local notifications exist
        const localNotifications = localNotificationService.getNotifications();
        if (localNotifications.length === 0) {
          console.log('📧 No local notifications found, generating samples...');
          localNotificationService.generateSampleNotifications();
        }
      }
    }

    // Use local fallback
    console.log('💾 Using local notification service');
    const localNotifications = localNotificationService.getNotifications(filters);
    const unreadCount = localNotificationService.getUnreadCount();
    
    // Convert LocalNotification to Notification format
    const notifications: Notification[] = localNotifications.map(local => ({
      id: local.id,
      type: local.type,
      title: local.title,
      message: local.message,
      isRead: local.isRead,
      createdAt: local.createdAt,
      actionUrl: local.actionUrl,
      metadata: local.metadata
    }));

    const total = notifications.length;
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(total / limit);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    };
  }

  // Get unread notification count
  async getUnreadCount(): Promise<{ unreadCount: number }> {
    if (this.useLocalFallback) {
      const count = localNotificationService.getUnreadCount();
      return { unreadCount: count };
    }

    try {
      const response = await apiClient.get<{ unreadCount: number }>('/notifications/unread-count');
      
      if (!response.success || !response.data) {
        throw new Error('Backend unread count failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend unread count failed, using local fallback');
      this.useLocalFallback = true;
      const count = localNotificationService.getUnreadCount();
      return { unreadCount: count };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<{ message: string }> {
    if (this.useLocalFallback) {
      const success = localNotificationService.markAsRead(notificationId);
      return { message: success ? 'Notification marked as read' : 'Notification not found' };
    }

    try {
      const response = await apiClient.put<{ message: string }>(`/notifications/${notificationId}/read`);
      
      if (!response.success || !response.data) {
        throw new Error('Backend mark as read failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend mark as read failed, using local fallback');
      this.useLocalFallback = true;
      const success = localNotificationService.markAsRead(notificationId);
      return { message: success ? 'Notification marked as read' : 'Notification not found' };
    }
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<{ message: string; markedCount: number }> {
    if (this.useLocalFallback) {
      const markedCount = localNotificationService.markAllAsRead();
      return { message: `Marked ${markedCount} notifications as read`, markedCount };
    }

    try {
      const response = await apiClient.put<{ message: string; markedCount: number }>('/notifications/read-all');
      
      if (!response.success || !response.data) {
        throw new Error('Backend mark all as read failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend mark all as read failed, using local fallback');
      this.useLocalFallback = true;
      const markedCount = localNotificationService.markAllAsRead();
      return { message: `Marked ${markedCount} notifications as read`, markedCount };
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<{ message: string }> {
    if (this.useLocalFallback) {
      const success = localNotificationService.deleteNotification(notificationId);
      return { message: success ? 'Notification deleted' : 'Notification not found' };
    }

    try {
      const response = await apiClient.delete<{ message: string }>(`/notifications/${notificationId}`);
      
      if (!response.success || !response.data) {
        throw new Error('Backend delete failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend delete failed, using local fallback');
      this.useLocalFallback = true;
      const success = localNotificationService.deleteNotification(notificationId);
      return { message: success ? 'Notification deleted' : 'Notification not found' };
    }
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<{ message: string; deletedCount: number }> {
    if (this.useLocalFallback) {
      const deletedCount = localNotificationService.deleteAllNotifications();
      return { message: `Deleted ${deletedCount} notifications`, deletedCount };
    }

    try {
      const response = await apiClient.delete<{ message: string; deletedCount: number }>('/notifications/all');
      
      if (!response.success || !response.data) {
        throw new Error('Backend delete all failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend delete all failed, using local fallback');
      this.useLocalFallback = true;
      const deletedCount = localNotificationService.deleteAllNotifications();
      return { message: `Deleted ${deletedCount} notifications`, deletedCount };
    }
  }

  // Get notification preferences
  async getPreferences(): Promise<NotificationPreferences> {
    if (this.useLocalFallback) {
      return localNotificationService.getPreferences();
    }

    try {
      const response = await apiClient.get<NotificationPreferences>('/notifications/settings');
      
      if (!response.success || !response.data) {
        throw new Error('Backend preferences failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend preferences failed, using local fallback');
      this.useLocalFallback = true;
      return localNotificationService.getPreferences();
    }
  }

  // Update notification preferences
  async updatePreferences(preferences: NotificationPreferences): Promise<{
    message: string;
    preferences: NotificationPreferences;
  }> {
    if (this.useLocalFallback) {
      const updated = localNotificationService.updatePreferences(preferences);
      return { message: 'Preferences updated locally', preferences: updated };
    }

    try {
      const response = await apiClient.put<{
        message: string;
        preferences: NotificationPreferences;
      }>('/notifications/settings', preferences);
      
      if (!response.success || !response.data) {
        throw new Error('Backend preferences update failed');
      }
      return response.data;
    } catch (error) {
      console.warn('Backend preferences update failed, using local fallback');
      this.useLocalFallback = true;
      const updated = localNotificationService.updatePreferences(preferences);
      return { message: 'Preferences updated locally', preferences: updated };
    }
  }

  // Create new notification (for testing/admin)
  async createNotification(data: {
    type: NotificationType;
    title: string;
    message: string;
    actionUrl?: string;
  }): Promise<{ message: string; notificationId: string }> {
    const notification = localNotificationService.addNotification({
      type: data.type,
      title: data.title,
      message: data.message,
      isRead: false,
      actionUrl: data.actionUrl,
      metadata: {}
    });

    // Try to sync with backend if available
    if (!this.useLocalFallback) {
      try {
        await apiClient.post('/notifications', data);
        console.log('✅ Notification synced with backend');
      } catch (error) {
        console.warn('Failed to sync notification with backend, keeping local only');
      }
    }

    return {
      message: 'Notification created',
      notificationId: notification.id
    };
  }

  // Reset to try backend again
  resetBackendConnection(): void {
    console.log('🔄 Resetting backend connection, will retry on next request');
    this.useLocalFallback = false;
  }

  // Force switch to local mode
  forceLocalMode(): void {
    console.log('💾 Forcing local notification mode');
    this.useLocalFallback = true;
    
    // Generate sample data if none exists
    const localNotifications = localNotificationService.getNotifications();
    if (localNotifications.length === 0) {
      localNotificationService.generateSampleNotifications();
    }
  }

  // Get service status
  getStatus(): {
    mode: 'backend' | 'local';
    hasLocalData: boolean;
    localCount: number;
  } {
    return {
      mode: this.useLocalFallback ? 'local' : 'backend',
      hasLocalData: localNotificationService.getNotifications().length > 0,
      localCount: localNotificationService.getNotifications().length
    };
  }

  // Add listener for local notification changes
  addListener(callback: (notifications: LocalNotification[]) => void): () => void {
    return localNotificationService.addListener(callback);
  }
}

export const notificationService = new NotificationService();