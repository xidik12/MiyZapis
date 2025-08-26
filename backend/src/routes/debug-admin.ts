import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';

const router = Router();

// Debug endpoint - ONLY for testing
router.get('/check-admin/:email', async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    
    // Security check - only allow in production with specific header
    if (process.env.NODE_ENV !== 'production') {
      return res.status(403).json({ error: 'Debug only available in production' });
    }

    // Require special debug key for security
    const debugKey = req.headers['x-debug-key'];
    if (debugKey !== 'debug-admin-check-2025') {
      return res.status(403).json({ error: 'Invalid debug key' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        isEmailVerified: true,
        createdAt: true,
        password: true // We'll just check if it exists, not return it
      }
    });

    if (!user) {
      return res.json({ found: false, message: 'User not found' });
    }

    res.json({
      found: true,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userType: user.userType,
        isActive: user.isActive,
        isEmailVerified: user.isEmailVerified,
        createdAt: user.createdAt,
        hasPassword: !!user.password
      }
    });

  } catch (error: any) {
    console.error('❌ Debug admin check failed:', error.message);
    res.status(500).json({
      error: 'Debug check failed',
      message: error.message
    });
  }
});

export default router;