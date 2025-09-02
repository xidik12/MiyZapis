import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken } from '@/middleware/auth/jwt';
import { SimpleNotificationController } from '@/controllers/notifications/simple';

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

// Test backend connection
router.get('/test-backend', authenticateToken, SimpleNotificationController.testBackend);

// Get user notifications (simplified)
router.get('/', authenticateToken, SimpleNotificationController.getNotifications);

// Get unread notification count (simplified)
router.get('/unread-count', authenticateToken, SimpleNotificationController.getUnreadCount);

// Mark notification as read (simplified)
router.put('/:id/read', authenticateToken, SimpleNotificationController.markAsRead);

// Mark all notifications as read (simplified)
router.put('/read-all', authenticateToken, SimpleNotificationController.markAllAsRead);

// Simplified endpoints only - other functionality temporarily disabled

export default router;