import { Router } from 'express';
import { logger } from '../utils/logger';

const router = Router();

// Simple debug endpoint to check admin status
router.get('/admin-check', async (req, res) => {
  try {
    logger.info('Debug admin check endpoint called');

    res.json({
      success: true,
      message: 'Debug admin endpoint working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Error in debug admin check:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
