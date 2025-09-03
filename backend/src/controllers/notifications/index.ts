import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/services/notification';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

export class NotificationController {
  private static notificationService = new NotificationService(prisma);

  /**
   * Get user notifications
   * GET /notifications
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const type = req.query.type as string;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const result = await NotificationController.notificationService.getUserNotifications(
        req.user.id,
        { page, limit, type, isRead }
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.pagination.page,
            totalPages: result.pagination.totalPages,
            totalItems: result.pagination.total,
            itemsPerPage: result.pagination.limit,
            hasNext: result.pagination.hasNext,
            hasPrev: result.pagination.hasPrev,
          },
        })
      );
    } catch (error: any) {
      logger.error('Error getting notifications:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to retrieve notifications',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Mark notification as read
   * PUT /notifications/:id/read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const notificationId = req.params.id;

      if (!notificationId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Notification ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: req.user.id }
      });

      if (!notification) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Notification not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await NotificationController.notificationService.markNotificationAsRead(notificationId, req.user.id);

      res.json(
        createSuccessResponse({
          message: 'Notification marked as read',
        })
      );
    } catch (error: any) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to mark notification as read',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Mark all notifications as read
   * PUT /notifications/read-all
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await NotificationController.notificationService.markAllNotificationsAsRead(req.user.id);

      res.json(
        createSuccessResponse({
          message: 'All notifications marked as read',
        })
      );
    } catch (error: any) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to mark all notifications as read',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete notification
   * DELETE /notifications/:id
   */
  static async deleteNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const notificationId = req.params.id;

      if (!notificationId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Notification ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Verify notification belongs to user
      const notification = await prisma.notification.findFirst({
        where: { id: notificationId, userId: req.user.id }
      });

      if (!notification) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Notification not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await prisma.notification.delete({
        where: { id: notificationId }
      });

      res.json(
        createSuccessResponse({
          message: 'Notification deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Error deleting notification:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete notification',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update notification preferences
   * PUT /notifications/settings
   */
  static async updatePreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: error.param,
              message: error.msg,
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        emailNotifications,
        pushNotifications,
        telegramNotifications,
        notificationTypes
      } = req.body;

      const updateData: any = {};
      if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
      if (pushNotifications !== undefined) updateData.pushNotifications = pushNotifications;
      if (telegramNotifications !== undefined) updateData.telegramNotifications = telegramNotifications;

      await prisma.user.update({
        where: { id: req.user.id },
        data: updateData
      });

      // Store notification type preferences
      if (notificationTypes) {
        await prisma.systemSettings.upsert({
          where: { key: `notification_preferences_${req.user.id}` },
          update: { value: JSON.stringify(notificationTypes) },
          create: {
            key: `notification_preferences_${req.user.id}`,
            value: JSON.stringify(notificationTypes)
          }
        });
      }

      res.json(
        createSuccessResponse({
          message: 'Notification preferences updated successfully',
        })
      );
    } catch (error: any) {
      logger.error('Error updating notification preferences:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update notification preferences',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get notification preferences
   * GET /notifications/settings
   */
  static async getPreferences(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true
        }
      });

      if (!user) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const typePreferences = await prisma.systemSettings.findUnique({
        where: { key: `notification_preferences_${req.user.id}` }
      });

      res.json(
        createSuccessResponse({
          preferences: {
            ...user,
            notificationTypes: typePreferences ? JSON.parse(typePreferences.value) : {}
          },
        })
      );
    } catch (error: any) {
      logger.error('Error getting notification preferences:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to retrieve notification preferences',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get unread notification count
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const unreadCount = await NotificationController.notificationService.getUnreadCount(req.user.id);

      res.json(
        createSuccessResponse({
          unreadCount,
        })
      );
    } catch (error: any) {
      logger.error('Error getting unread count:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get unread count',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Send test notification (for testing purposes)
   * POST /notifications/test
   */
  static async sendTestNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { type, title, message } = req.body;

      await NotificationController.notificationService.sendNotification(req.user.id, {
        type: type || 'TEST',
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        data: { test: true }
      });

      res.json(
        createSuccessResponse({
          message: 'Test notification sent successfully',
        })
      );
    } catch (error: any) {
      logger.error('Error sending test notification:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to send test notification',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Send bulk notification (Admin only)
   * POST /notifications/bulk
   */
  static async sendBulkNotification(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: error.param,
              message: error.msg,
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check admin permissions
      if (req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only administrators can send bulk notifications',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { userIds, type, title, message, data, sendToAll } = req.body;

      const notificationData = {
        type,
        title,
        message,
        data,
      };

      if (sendToAll) {
        await NotificationController.notificationService.sendNotificationToAllUsers(notificationData);
      } else if (userIds && Array.isArray(userIds)) {
        await NotificationController.notificationService.sendBulkNotification(userIds, notificationData);
      } else {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Either userIds array or sendToAll flag is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          message: `Bulk notification sent successfully${sendToAll ? ' to all users' : ` to ${userIds.length} users`}`,
        })
      );
    } catch (error: any) {
      logger.error('Error sending bulk notification:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to send bulk notification',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}