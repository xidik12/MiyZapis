/**
 * Push Notification Service for React Native
 * Handles push notification registration, scheduling, and management
 * Uses Expo Notifications API
 */
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiClient } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class PushNotificationService {
  private expoPushToken: string | null = null;

  /**
   * Request notification permissions and get push token
   */
  async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    try {
      // Check existing permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // Request permissions if not granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permission not granted');
        return null;
      }

      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
      });

      this.expoPushToken = token.data;

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#DC2626', // Panhaha Crimson Red
        });
      }

      // Register token with backend
      await this.sendTokenToBackend(token.data);

      console.log('✅ Push notifications registered:', token.data);
      return token.data;
    } catch (error) {
      console.error('❌ Error registering for push notifications:', error);
      return null;
    }
  }

  /**
   * Send push token to backend for storage
   */
  private async sendTokenToBackend(token: string): Promise<void> {
    try {
      await apiClient.post('/users/push-token', {
        token,
        platform: Platform.OS,
        deviceId: Device.modelName || 'unknown',
      });
    } catch (error) {
      console.error('Failed to send push token to backend:', error);
    }
  }

  /**
   * Schedule a local notification
   */
  async scheduleLocalNotification(
    title: string,
    body: string,
    trigger?: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null = show immediately
    });

    return notificationId;
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  /**
   * Get notification badge count
   */
  async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  /**
   * Set notification badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Add notification received listener
   * Called when app is in foreground
   */
  addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  /**
   * Add notification response listener
   * Called when user taps on notification
   */
  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  /**
   * Remove notification listener
   */
  removeNotificationListener(subscription: Notifications.Subscription): void {
    subscription.remove();
  }

  /**
   * Get last notification response (if app was opened via notification)
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  /**
   * Schedule booking reminder notification
   */
  async scheduleBookingReminder(
    bookingId: string,
    serviceName: string,
    bookingTime: Date
  ): Promise<string> {
    // Schedule notification 1 hour before booking
    const reminderTime = new Date(bookingTime.getTime() - 60 * 60 * 1000);

    return await this.scheduleLocalNotification(
      'Booking Reminder',
      `Your appointment for ${serviceName} is in 1 hour`,
      {
        date: reminderTime,
      },
      {
        type: 'booking_reminder',
        bookingId,
      }
    );
  }

  /**
   * Show new message notification
   */
  async showNewMessageNotification(
    senderName: string,
    message: string,
    conversationId: string
  ): Promise<string> {
    return await this.scheduleLocalNotification(
      `New message from ${senderName}`,
      message,
      null, // Show immediately
      {
        type: 'new_message',
        conversationId,
      }
    );
  }

  /**
   * Show payment success notification
   */
  async showPaymentSuccessNotification(amount: string): Promise<string> {
    return await this.scheduleLocalNotification(
      'Payment Successful',
      `Payment of ${amount} completed successfully`,
      null,
      {
        type: 'payment_success',
      }
    );
  }

  /**
   * Get current push token
   */
  getToken(): string | null {
    return this.expoPushToken;
  }
}

export const pushNotificationService = new PushNotificationService();
