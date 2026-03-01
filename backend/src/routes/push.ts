import { Router, Request, Response, RequestHandler } from 'express';
import { body } from 'express-validator';
import { authenticateToken } from '@/middleware/auth/jwt';
import { prisma } from '@/config/database';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { saveSubscription, removeSubscription } from '@/services/push';

const router = Router();

/**
 * GET /api/v1/push/vapid-key
 * Return the public VAPID key so the frontend can subscribe to push.
 * This endpoint does NOT require authentication so the SW can fetch it before login.
 */
router.get('/vapid-key', (_req: Request, res: Response) => {
  const publicKey = config.vapid?.publicKey;

  if (!publicKey) {
    res.status(503).json(
      createErrorResponse(
        'PUSH_NOT_CONFIGURED',
        'Web Push notifications are not configured on this server'
      )
    );
    return;
  }

  res.json(createSuccessResponse({ publicKey }));
});

/**
 * POST /api/v1/push/subscribe
 * Save a push subscription for the authenticated user.
 */
router.post(
  '/subscribe',
  [
    authenticateToken as RequestHandler,
    body('subscription').isObject().withMessage('Subscription object is required'),
    body('subscription.endpoint').isURL().withMessage('Valid endpoint URL is required'),
    body('subscription.keys').isObject().withMessage('Subscription keys are required'),
    body('subscription.keys.p256dh').isString().notEmpty().withMessage('p256dh key is required'),
    body('subscription.keys.auth').isString().notEmpty().withMessage('auth key is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json(
          createErrorResponse('AUTHENTICATION_REQUIRED', 'User not authenticated')
        );
        return;
      }

      const { subscription } = req.body;
      const userAgent = req.headers['user-agent'] || undefined;

      await saveSubscription(prisma, userId, subscription, userAgent);

      logger.info('Push subscription saved via API', { userId });
      res.status(201).json(createSuccessResponse({ message: 'Push subscription saved successfully' }));
    } catch (error) {
      logger.error('Error saving push subscription:', error);
      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to save push subscription')
      );
    }
  }
);

/**
 * POST /api/v1/push/unsubscribe
 * Remove a push subscription.
 */
router.post(
  '/unsubscribe',
  [
    authenticateToken as RequestHandler,
    body('endpoint').isURL().withMessage('Valid endpoint URL is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = (req as Request & { user?: { id: string } }).user?.id;
      if (!userId) {
        res.status(401).json(
          createErrorResponse('AUTHENTICATION_REQUIRED', 'User not authenticated')
        );
        return;
      }

      const { endpoint } = req.body;

      await removeSubscription(prisma, endpoint);

      logger.info('Push subscription removed via API', { userId });
      res.json(createSuccessResponse({ message: 'Push subscription removed successfully' }));
    } catch (error) {
      logger.error('Error removing push subscription:', error);
      res.status(500).json(
        createErrorResponse('INTERNAL_ERROR', 'Failed to remove push subscription')
      );
    }
  }
);

export default router;
