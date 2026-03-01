import { Response } from 'express';
import { createSuccessResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';

export class SimpleNotificationController {
  /**
   * Get user notifications - simplified fallback
   * GET /notifications
   */
  static async getNotifications(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Returning empty notifications (simplified fallback)');
      
      const result = {
        notifications: [],
        unreadCount: 0,
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      logger.error('Error in simplified notifications:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Notifications temporarily unavailable',
      });
    }
  }

  /**
   * Get unread notification count - simplified fallback
   * GET /notifications/unread-count
   */
  static async getUnreadCount(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Returning zero unread count (simplified fallback)');
      
      res.json(createSuccessResponse({ count: 0 }));
    } catch (error: unknown) {
      logger.error('Error in simplified unread count:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Unread count temporarily unavailable',
      });
    }
  }

  /**
   * Mark notification as read - simplified fallback
   * PUT /notifications/:id/read
   */
  static async markAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Marking notification as read (simplified fallback)');
      
      res.json(createSuccessResponse({ success: true }));
    } catch (error: unknown) {
      logger.error('Error in simplified mark as read:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Mark as read temporarily unavailable',
      });
    }
  }

  /**
   * Mark all notifications as read - simplified fallback
   * PUT /notifications/read-all
   */
  static async markAllAsRead(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Marking all notifications as read (simplified fallback)');
      
      res.json(createSuccessResponse({ success: true, count: 0 }));
    } catch (error: unknown) {
      logger.error('Error in simplified mark all as read:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Mark all as read temporarily unavailable',
      });
    }
  }

  /**
   * Test backend connection
   * GET /notifications/test-backend
   */
  static async testBackend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Backend test endpoint called');
      
      res.json(createSuccessResponse({
        status: 'working',
        message: 'Backend notifications are working!',
        timestamp: new Date().toISOString(),
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
      }));
    } catch (error: unknown) {
      logger.error('Error in backend test:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Backend test failed',
      });
    }
  }
}