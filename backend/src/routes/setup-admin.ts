import { Router, Request, Response } from 'express';
import { createRailwayAdmin } from '../scripts/railway-admin-setup';

const router = Router();

// Admin setup endpoint - ONLY for initial setup
router.post('/setup-admin', async (req: Request, res: Response) => {
  try {
    // Security check - only allow in production with specific header
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Setup only available in production' });
    }

    // Require special setup key for security
    const setupKey = req.headers['x-setup-key'];
    if (setupKey !== process.env.ADMIN_SETUP_KEY && setupKey !== 'railway-admin-setup-2025') {
      return res.status(403).json({ error: 'Invalid setup key' });
    }

    // Configuration for Railway deployment
    const RAILWAY_ADMIN_CONFIG = {
      email: process.env.ADMIN_EMAIL || 'admin@miyzapis.com',
      firstName: process.env.ADMIN_FIRST_NAME || 'System',
      lastName: process.env.ADMIN_LAST_NAME || 'Administrator',
      password: process.env.ADMIN_PASSWORD || 'Admin123!@#Railway'
    };

    console.log('🚀 Starting admin setup via HTTP endpoint...');
    await createRailwayAdmin(RAILWAY_ADMIN_CONFIG);

    res.json({
      success: true,
      message: 'Admin user created successfully',
      adminEmail: RAILWAY_ADMIN_CONFIG.email,
      loginUrl: '/auth/login'
    });

  } catch (error: any) {
    console.error('❌ Admin setup failed:', error.message);
    
    if (error.message.includes('Admin user already exists')) {
      return res.status(409).json({
        error: 'Admin user already exists',
        message: 'An admin user with this email already exists',
        loginUrl: '/auth/login'
      });
    }

    res.status(500).json({
      error: 'Admin setup failed',
      message: error.message
    });
  }
});

// Health check for setup endpoint
router.get('/setup-status', async (req: Request, res: Response) => {
  res.json({
    status: 'Setup endpoint available',
    environment: process.env.NODE_ENV,
    hasAdminEmail: !!process.env.ADMIN_EMAIL,
    hasAdminPassword: !!process.env.ADMIN_PASSWORD
  });
});

export default router;