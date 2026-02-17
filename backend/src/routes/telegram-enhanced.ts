import { Router, Request, Response, NextFunction } from 'express';
import { enhancedTelegramBot } from '@/services/telegram/enhanced-bot';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { authenticateToken, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Webhook secret token for Telegram webhook verification
const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || '';

// Webhook endpoint for Enhanced Telegram Bot — with secret token verification
router.post('/webhook/telegram-enhanced', async (req, res) => {
  try {
    // Verify Telegram webhook secret token
    if (WEBHOOK_SECRET) {
      const secretHeader = req.headers['x-telegram-bot-api-secret-token'];
      if (secretHeader !== WEBHOOK_SECRET) {
        logger.warn('Telegram webhook: invalid secret token');
        return res.status(403).send('Forbidden');
      }
    }

    const update = req.body;

    if (enhancedTelegramBot && enhancedTelegramBot.getBot()) {
      await enhancedTelegramBot.getBot().handleUpdate(update);
    }

    res.status(200).send('OK');

  } catch (error) {
    logger.error('Enhanced Telegram webhook error:', error);
    res.status(500).send('Internal Server Error');
  }
});

// REMOVED: test-enhanced endpoint — unnecessary in production

// Admin-only: Set webhook for Enhanced Telegram Bot
router.post('/set-webhook-enhanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!config.telegram.webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL not configured'
      });
    }

    await enhancedTelegramBot.setWebhook();

    return res.json({
      success: true,
      message: 'Enhanced Telegram webhook set successfully'
    });

  } catch (error) {
    logger.error('Set webhook error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to set webhook'
    });
  }
});

// Admin-only: Remove webhook for Enhanced Telegram Bot
router.post('/remove-webhook-enhanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await enhancedTelegramBot.getBot().telegram.deleteWebhook();

    res.json({
      success: true,
      message: 'Enhanced Telegram webhook removed successfully'
    });

  } catch (error) {
    logger.error('Remove webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove webhook'
    });
  }
});

// Admin-only: Send notification via Enhanced Telegram Bot
router.post('/send-notification-enhanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId, message, keyboard } = req.body;

    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    const sent = await enhancedTelegramBot.sendNotification(userId, message, keyboard);

    return res.json({
      success: sent,
      message: sent ? 'Notification sent successfully' : 'Failed to send notification'
    });

  } catch (error) {
    logger.error('Send notification error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Admin-only: Broadcast message via Enhanced Telegram Bot
router.post('/broadcast-enhanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { message, userType } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    await enhancedTelegramBot.broadcastMessage(message, userType);

    return res.json({
      success: true,
      message: 'Broadcast sent successfully'
    });

  } catch (error) {
    logger.error('Broadcast error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to send broadcast'
    });
  }
});

export default router;