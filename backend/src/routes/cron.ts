import express from 'express';
import crypto from 'crypto';
import { logger } from '@/utils/logger';
import { trialExpirationService } from '@/services/trial-expiration.service';

const router = express.Router();

// Timing-safe cron secret verification
const verifyCronSecret = (provided: string | string[] | undefined): boolean => {
  const expected = process.env.CRON_SECRET;
  if (!expected || !provided || typeof provided !== 'string') return false;
  if (expected.length !== provided.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
};

/**
 * @route   POST /api/v1/cron/trial-expiration-check
 * @desc    Run trial expiration checks (should be called by cron service)
 * @access  Internal (should be protected by API key or IP whitelist in production)
 */
router.post('/trial-expiration-check', async (req, res) => {
  try {
    logger.info('Trial expiration cron job triggered');

    // In production, you should verify this request is from a trusted source
    // For example, check an API key or IP whitelist
    const cronSecret = req.headers['x-cron-secret'];
    if (!verifyCronSecret(cronSecret)) {
      logger.warn('Unauthorized cron job attempt');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Run all trial expiration checks
    const results = await trialExpirationService.runAllChecks();

    logger.info('Trial expiration cron job completed successfully', results);

    return res.status(200).json({
      success: true,
      message: 'Trial expiration checks completed',
      results,
    });
  } catch (error) {
    logger.error('Trial expiration cron job failed:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   POST /api/v1/cron/seven-day-warnings
 * @desc    Run 7-day trial expiration warnings
 * @access  Internal
 */
router.post('/seven-day-warnings', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (!verifyCronSecret(cronSecret)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const results = await trialExpirationService.checkAndNotifySevenDayWarning();

    return res.status(200).json({
      success: true,
      message: '7-day warnings completed',
      results,
    });
  } catch (error) {
    logger.error('7-day warnings cron job failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   POST /api/v1/cron/three-day-warnings
 * @desc    Run 3-day trial expiration warnings
 * @access  Internal
 */
router.post('/three-day-warnings', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (!verifyCronSecret(cronSecret)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const results = await trialExpirationService.checkAndNotifyThreeDayWarning();

    return res.status(200).json({
      success: true,
      message: '3-day warnings completed',
      results,
    });
  } catch (error) {
    logger.error('3-day warnings cron job failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * @route   POST /api/v1/cron/expire-trials
 * @desc    Check and expire trials
 * @access  Internal
 */
router.post('/expire-trials', async (req, res) => {
  try {
    const cronSecret = req.headers['x-cron-secret'];
    if (!verifyCronSecret(cronSecret)) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const results = await trialExpirationService.checkAndExpireTrials();

    return res.status(200).json({
      success: true,
      message: 'Trial expiration check completed',
      results,
    });
  } catch (error) {
    logger.error('Trial expiration cron job failed:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
