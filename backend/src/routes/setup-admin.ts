import { Router, Request, Response } from 'express';
import { createRailwayAdmin } from '../scripts/railway-admin-setup';
import { logger } from '@/utils/logger';

const router = Router();

// Admin setup endpoint - ONLY for initial setup
router.post('/setup-admin', async (req: Request, res: Response) => {
  try {
    // Security check - only allow in production with specific header
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Setup only available in production' });
    }

    // Require setup key from environment variable - no hardcoded fallback
    const setupKey = req.headers['x-setup-key'];
    if (!process.env.ADMIN_SETUP_KEY || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Configuration for Railway deployment - all values must come from env vars
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      return res.status(400).json({ error: 'ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required' });
    }

    const RAILWAY_ADMIN_CONFIG = {
      email: process.env.ADMIN_EMAIL,
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
      password: process.env.ADMIN_PASSWORD
    };

    logger.debug('🚀 Starting admin setup via HTTP endpoint...');
    await createRailwayAdmin(RAILWAY_ADMIN_CONFIG);

    return res.json({
      success: true,
      message: 'Admin user created successfully',
      adminEmail: RAILWAY_ADMIN_CONFIG.email,
      loginUrl: '/auth/login'
    });

  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('❌ Admin setup failed:', err.message);

    if (err.message.includes('Admin user already exists')) {
      return res.status(409).json({
        error: 'Admin user already exists',
        message: 'An admin user with this email already exists',
        loginUrl: '/auth/login'
      });
    }

    return res.status(500).json({
      error: 'Admin setup failed',
      message: err.message
    });
  }
});

// REMOVED: setup-status endpoint revealed admin credential configuration state to unauthenticated users

export default router;