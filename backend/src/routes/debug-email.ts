import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Simple debug endpoint to check email service status
router.get('/status', async (req, res) => {
  try {
    logger.info('Debug email status endpoint called');

    res.json({
      success: true,
      message: 'Email service debug endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in debug email status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
