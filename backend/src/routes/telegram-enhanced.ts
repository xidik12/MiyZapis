import { Router } from 'express';
import { enhancedTelegramBot } from '@/services/telegram/enhanced-bot';
import { logger } from '@/utils/logger';
import { config } from '@/config';

const router = Router();

// Webhook endpoint for Enhanced Telegram Bot
router.post('/webhook/telegram-enhanced', async (req, res) => {
  try {
    // Handle webhook update
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

// Test endpoint for Enhanced Telegram Bot
router.get('/test-enhanced', async (req, res) => {
  try {
    const botInfo = await enhancedTelegramBot.getBot().telegram.getMe();
    
    res.json({
      success: true,
      botInfo,
      message: 'Enhanced Telegram bot is working'
    });
    
  } catch (error) {
    logger.error('Enhanced Telegram test error:', error);
    res.status(500).json({
      success: false,
      error: 'Enhanced Telegram bot test failed'
    });
  }
});

// Set webhook for Enhanced Telegram Bot (production)
router.post('/set-webhook-enhanced', async (req, res) => {
  try {
    if (!config.telegram.webhookUrl) {
      return res.status(400).json({
        success: false,
        error: 'Webhook URL not configured'
      });
    }

    await enhancedTelegramBot.setWebhook();
    
    res.json({
      success: true,
      message: 'Enhanced Telegram webhook set successfully'
    });
    
  } catch (error) {
    logger.error('Set webhook error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set webhook'
    });
  }
});

// Remove webhook for Enhanced Telegram Bot
router.post('/remove-webhook-enhanced', async (req, res) => {
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

// Send notification via Enhanced Telegram Bot
router.post('/send-notification-enhanced', async (req, res) => {
  try {
    const { userId, message, keyboard } = req.body;
    
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        error: 'userId and message are required'
      });
    }

    const sent = await enhancedTelegramBot.sendNotification(userId, message, keyboard);
    
    res.json({
      success: sent,
      message: sent ? 'Notification sent successfully' : 'Failed to send notification'
    });
    
  } catch (error) {
    logger.error('Send notification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send notification'
    });
  }
});

// Broadcast message via Enhanced Telegram Bot
router.post('/broadcast-enhanced', async (req, res) => {
  try {
    const { message, userType } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'message is required'
      });
    }

    await enhancedTelegramBot.broadcastMessage(message, userType);
    
    res.json({
      success: true,
      message: 'Broadcast sent successfully'
    });
    
  } catch (error) {
    logger.error('Broadcast error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send broadcast'
    });
  }
});

export default router;