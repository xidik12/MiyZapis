import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '@/middleware/auth/jwt';
import { NotificationController } from '@/controllers/notifications/index';

const router = Router();

// Validation middleware
const validateNotificationPreferences = [
  body('emailNotifications').optional().isBoolean().withMessage('Email notifications must be a boolean'),
  body('pushNotifications').optional().isBoolean().withMessage('Push notifications must be a boolean'),
  body('telegramNotifications').optional().isBoolean().withMessage('Telegram notifications must be a boolean'),
  body('notificationTypes').optional().isObject().withMessage('Notification types must be an object'),
];

const validateBulkNotification = [
  body('type').notEmpty().withMessage('Notification type is required'),
  body('title').notEmpty().withMessage('Title is required').isLength({ min: 1, max: 100 }).withMessage('Title must be between 1 and 100 characters'),
  body('message').notEmpty().withMessage('Message is required').isLength({ min: 1, max: 500 }).withMessage('Message must be between 1 and 500 characters'),
  body('userIds').optional().isArray().withMessage('User IDs must be an array'),
  body('sendToAll').optional().isBoolean().withMessage('Send to all must be a boolean'),
  body('data').optional().isObject().withMessage('Data must be an object'),
];

// Get user notifications
router.get('/', authenticateToken, NotificationController.getNotifications);

// Get unread notification count
router.get('/unread-count', authenticateToken, NotificationController.getUnreadCount);

// Mark notification as read
router.put('/:id/read', [
  param('id').notEmpty().withMessage('Notification ID is required'),
  authenticateToken
], NotificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', authenticateToken, NotificationController.markAllAsRead);

// Delete all notifications (must be before ":id" route)
router.delete('/all', authenticateToken, NotificationController.deleteAllNotifications);

// Delete notification by id
router.delete('/:id', [
  param('id').notEmpty().withMessage('Notification ID is required'),
  authenticateToken
], NotificationController.deleteNotification);

// Get notification preferences
router.get('/settings', authenticateToken, NotificationController.getPreferences);

// Update notification preferences
router.put('/settings', [
  ...validateNotificationPreferences,
  authenticateToken
], NotificationController.updatePreferences);

// Send test notification (for testing)
router.post('/test', [
  body('type').optional().isString(),
  body('title').optional().isString(),
  body('message').optional().isString(),
  authenticateToken
], NotificationController.sendTestNotification);

// Send bulk notification (Admin only)
router.post('/bulk', [
  ...validateBulkNotification,
  authenticateToken
], NotificationController.sendBulkNotification);

export default router;
