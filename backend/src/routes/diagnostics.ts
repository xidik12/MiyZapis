import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '@/types';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

const router = Router();

// Diagnostic endpoint to help debug frontend issues
router.get('/profile-status', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialist: true
      }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse('USER_NOT_FOUND', 'User not found', req.headers['x-request-id'] as string)
      );
    }

    // Get recent update history from logs
    const diagnosticInfo = {
      userId: user.id,
      userType: user.userType,
      currentProfile: {
        user: {
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          language: user.language,
          currency: user.currency,
          updatedAt: user.updatedAt
        },
        specialist: user.specialist ? {
          id: user.specialist.id,
          businessName: user.specialist.businessName,
          bio: user.specialist.bio,
          specialties: user.specialist.specialties ? JSON.parse(user.specialist.specialties) : [],
          portfolioImages: user.specialist.portfolioImages ? JSON.parse(user.specialist.portfolioImages) : [],
          certifications: user.specialist.certifications ? JSON.parse(user.specialist.certifications) : [],
          updatedAt: user.specialist.updatedAt
        } : null
      },
      authenticationStatus: {
        isAuthenticated: true,
        userId: req.userId,
        tokenExists: !!req.headers.authorization
      },
      serverStatus: {
        timestamp: new Date().toISOString(),
        databaseConnected: true,
        environment: process.env.NODE_ENV || 'development'
      }
    };

    logger.info('Diagnostic profile status requested', {
      userId,
      requestId: req.headers['x-request-id'],
      userAgent: req.headers['user-agent']
    });

    return res.json(createSuccessResponse(diagnosticInfo));
  } catch (error) {
    logger.error('Diagnostic profile status error:', error);
    return res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get profile status', req.headers['x-request-id'] as string)
    );
  }
});

// Test endpoint to verify API connectivity
router.get('/test-connection', (req: Request, res: Response) => {
  logger.info('API connectivity test requested', {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    timestamp: new Date().toISOString()
  });

  return res.json(
    createSuccessResponse({
      status: 'connected',
      timestamp: new Date().toISOString(),
      message: 'API is working correctly',
      environment: process.env.NODE_ENV || 'development'
    })
  );
});

export default router;