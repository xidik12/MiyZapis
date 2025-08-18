import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticateToken as authMiddleware } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { MessagingController } from '@/controllers/messaging';

const router = Router();
const messagingController = new MessagingController();

// All routes require authentication
router.use(authMiddleware);

// Get user conversations
router.get(
  '/conversations',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  messagingController.getUserConversations
);

// Get conversation details
router.get(
  '/conversations/:id',
  [
    param('id').isString().notEmpty(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validateRequest,
  messagingController.getConversation
);

// Create new conversation
router.post(
  '/conversations',
  [
    body('participantId').isString().notEmpty(),
    body('bookingId').optional().isString(),
    body('initialMessage').optional().isString()
  ],
  validateRequest,
  messagingController.createConversation
);

// Send message in conversation
router.post(
  '/conversations/:id/messages',
  [
    param('id').isString().notEmpty(),
    body('content').isString().notEmpty(),
    body('messageType').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']),
    body('attachments').optional().isArray()
  ],
  validateRequest,
  messagingController.sendMessage
);

// Mark conversation as read
router.put(
  '/conversations/:id/read',
  [param('id').isString().notEmpty()],
  validateRequest,
  messagingController.markAsRead
);

// Archive conversation
router.put(
  '/conversations/:id/archive',
  [param('id').isString().notEmpty()],
  validateRequest,
  messagingController.archiveConversation
);

// Block conversation
router.put(
  '/conversations/:id/block',
  [param('id').isString().notEmpty()],
  validateRequest,
  messagingController.blockConversation
);

// Get unread message count
router.get(
  '/unread-count',
  messagingController.getUnreadCount
);

export default router;