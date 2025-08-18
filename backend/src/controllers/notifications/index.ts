import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/services/notification';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService(prisma);
  }

  getNotifications = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const result = await this.notificationService.getUserNotifications(
        userId,
        { page, limit, type, isRead }
      );

      return successResponse(res, result, 'Notifications retrieved successfully');
    } catch (error) {
      logger.error('Error getting notifications:', error);
      return errorResponse(res, 'Failed to retrieve notifications', 500);
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return errorResponse(res, 'Notification not found', 404);
      }

      await this.notificationService.markAsRead(notificationId);

      return successResponse(res, null, 'Notification marked as read');
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      return errorResponse(res, 'Failed to mark notification as read', 500);
    }
  };

  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      await this.notificationService.markAllAsRead(userId);

      return successResponse(res, null, 'All notifications marked as read');
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      return errorResponse(res, 'Failed to mark all notifications as read', 500);
    }
  };

  deleteNotification = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const notificationId = req.params.id;

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId }
      });

      if (!notification) {
        return errorResponse(res, 'Notification not found', 404);
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      return successResponse(res, null, 'Notification deleted successfully');
    } catch (error) {
      logger.error('Error deleting notification:', error);
      return errorResponse(res, 'Failed to delete notification', 500);
    }
  };

  updatePreferences = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const {
        emailNotifications,
        pushNotifications,
        telegramNotifications,
        notificationTypes
      } = req.body;

      await prisma.user.update({
        where: { id: userId },
        data: {
          emailNotifications,
          pushNotifications,
          telegramNotifications
        }
      });

      // Store notification type preferences (you might want to create a separate table for this)
      if (notificationTypes) {
        await prisma.systemSettings.upsert({
          where: { key: `notification_preferences_${userId}` },
          update: { value: JSON.stringify(notificationTypes) },
          create: {
            key: `notification_preferences_${userId}`,
            value: JSON.stringify(notificationTypes)
          }
        });
      }

      return successResponse(res, null, 'Notification preferences updated successfully');
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      return errorResponse(res, 'Failed to update notification preferences', 500);
    }
  };

  getPreferences = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true
        }
      });

      const typePreferences = await prisma.systemSettings.findUnique({
        where: { key: `notification_preferences_${userId}` }
      });

      return successResponse(res, {
        ...user,
        notificationTypes: typePreferences ? JSON.parse(typePreferences.value) : {}
      }, 'Notification preferences retrieved successfully');
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      return errorResponse(res, 'Failed to retrieve notification preferences', 500);
    }
  };

  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;

      const unreadCount = await prisma.notification.count({
        where: { userId, isRead: false }
      });

      return successResponse(res, { unreadCount }, 'Unread count retrieved successfully');
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return errorResponse(res, 'Failed to get unread count', 500);
    }
  };

  testNotification = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { type, title, message } = req.body;

      await this.notificationService.createNotification({
        userId,
        type: type || 'TEST',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        data: { test: true }
      });

      return successResponse(res, null, 'Test notification sent successfully');
    } catch (error) {
      logger.error('Error sending test notification:', error);
      return errorResponse(res, 'Failed to send test notification', 500);
    }
  };
}