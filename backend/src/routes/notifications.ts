import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken as authMiddleware } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { NotificationController } from '@/controllers/notifications';

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

// Get user notifications
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('type').optional().isString(),
    query('isRead').optional().isBoolean()
  ],
  validateRequest,
  notificationController.getNotifications
);

// Get unread notification count
router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

// Get notification preferences
router.get(
  '/preferences',
  notificationController.getPreferences
);

// Mark notification as read
router.put(
  '/:id/read',
  [param('id').isString().notEmpty()],
  validateRequest,
  notificationController.markAsRead
);

// Mark all notifications as read
router.put(
  '/mark-all-read',
  notificationController.markAllAsRead
);

// Update notification preferences
router.put(
  '/preferences',
  [
    body('emailNotifications').optional().isBoolean(),
    body('pushNotifications').optional().isBoolean(),
    body('telegramNotifications').optional().isBoolean(),
    body('notificationTypes').optional().isObject()
  ],
  validateRequest,
  notificationController.updatePreferences
);

// Delete notification
router.delete(
  '/:id',
  [param('id').isString().notEmpty()],
  validateRequest,
  notificationController.deleteNotification
);

// Test notification (development only)
router.post(
  '/test',
  [
    body('type').optional().isString(),
    body('title').optional().isString(),
    body('message').optional().isString()
  ],
  validateRequest,
  notificationController.testNotification
);

export default router;