import express from 'express';
import { emailService } from '@/services/email';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const router = express.Router();

// Test SMTP connection endpoint
router.post('/test-smtp', async (req, res) => {
  try {
    logger.info('🧪 Testing SMTP connection via API endpoint');
    
    const isConnected = await emailService.testConnection();
    
    if (isConnected) {
      res.json(createSuccessResponse({
        message: 'SMTP connection successful',
        status: 'connected'
      }));
    } else {
      res.status(500).json(createErrorResponse(
        'SMTP_CONNECTION_FAILED',
        'SMTP connection test failed',
        req.id
      ));
    }
  } catch (error: any) {
    logger.error('SMTP test endpoint error:', error);
    res.status(500).json(createErrorResponse(
      'SMTP_TEST_ERROR',
      'Error testing SMTP connection',
      req.id
    ));
  }
});

// Test sending email endpoint (admin only - be careful with this)
router.post('/test-email', async (req, res) => {
  try {
    const { to, subject = 'Test Email from MiyZapis' } = req.body;
    
    if (!to) {
      return res.status(400).json(createErrorResponse(
        'VALIDATION_ERROR',
        'Email address (to) is required',
        req.id
      ));
    }
    
    logger.info('🧪 Testing email send via API endpoint', { to });
    
    const emailSent = await emailService.sendEmail({
      to,
      subject,
      html: '<h1>Test Email</h1><p>This is a test email from MiyZapis to verify SMTP functionality.</p>',
      text: 'Test Email\n\nThis is a test email from MiyZapis to verify SMTP functionality.'
    });
    
    if (emailSent) {
      res.json(createSuccessResponse({
        message: 'Test email sent successfully',
        to,
        status: 'sent'
      }));
    } else {
      res.status(500).json(createErrorResponse(
        'EMAIL_SEND_FAILED',
        'Failed to send test email',
        req.id
      ));
    }
  } catch (error: any) {
    logger.error('Email send test endpoint error:', error);
    res.status(500).json(createErrorResponse(
      'EMAIL_TEST_ERROR',
      'Error sending test email',
      req.id
    ));
  }
});

export default router;