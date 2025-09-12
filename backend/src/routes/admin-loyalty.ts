import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

const router = Router();

// Admin endpoint to recalculate loyalty points for all users
router.post('/recalculate-points', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    // Check if user is admin (you might want to add proper admin middleware)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'ADMIN') {
      return res.status(403).json(
        createErrorResponse(ErrorCodes.FORBIDDEN, 'Admin access required', req.headers['x-request-id'] as string)
      );
    }

    logger.info('Starting loyalty points recalculation', { adminUserId: userId });

    // Get all users with their loyalty transactions
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
      }
    });

    const results = [];
    let totalFixed = 0;
    let totalErrors = 0;

    for (const user of users) {
      try {
        // Calculate correct total from transactions
        const transactions = await prisma.loyaltyTransaction.findMany({
          where: { userId: user.id },
          select: { points: true }
        });

        const correctTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);
        const currentTotal = user.loyaltyPoints || 0;
        const difference = correctTotal - currentTotal;

        if (difference !== 0) {
          // Update user's loyalty points
          await prisma.user.update({
            where: { id: user.id },
            data: { loyaltyPoints: correctTotal }
          });

          results.push({
            userId: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            before: currentTotal,
            after: correctTotal,
            difference: difference,
            fixed: true
          });

          totalFixed++;
          logger.info('Fixed loyalty points', {
            userId: user.id,
            before: currentTotal,
            after: correctTotal,
            difference
          });
        } else {
          results.push({
            userId: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            before: currentTotal,
            after: correctTotal,
            difference: 0,
            fixed: false
          });
        }
      } catch (error) {
        totalErrors++;
        logger.error('Error fixing loyalty points for user', { userId: user.id, error });
        results.push({
          userId: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          error: error.message,
          fixed: false
        });
      }
    }

    logger.info('Loyalty points recalculation completed', {
      totalUsers: users.length,
      totalFixed,
      totalErrors
    });

    res.json(createSuccessResponse({
      message: 'Loyalty points recalculation completed',
      summary: {
        totalUsers: users.length,
        totalFixed,
        totalErrors,
        processedAt: new Date().toISOString()
      },
      results
    }));

  } catch (error) {
    logger.error('Error recalculating loyalty points:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to recalculate loyalty points',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get loyalty points discrepancy report (read-only)
router.get('/points-report', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true }
    });

    if (!user || user.userType !== 'ADMIN') {
      return res.status(403).json(
        createErrorResponse(ErrorCodes.FORBIDDEN, 'Admin access required', req.headers['x-request-id'] as string)
      );
    }

    // Get all users and check for discrepancies
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true,
      }
    });

    const discrepancies = [];

    for (const user of users) {
      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId: user.id },
        select: { points: true, type: true, reason: true, createdAt: true }
      });

      const correctTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);
      const currentTotal = user.loyaltyPoints || 0;
      const difference = correctTotal - currentTotal;

      if (difference !== 0) {
        discrepancies.push({
          userId: user.id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          currentPoints: currentTotal,
          correctPoints: correctTotal,
          difference,
          transactionCount: transactions.length,
          lastTransaction: transactions.length > 0 ? transactions[transactions.length - 1].createdAt : null
        });
      }
    }

    res.json(createSuccessResponse({
      totalUsers: users.length,
      usersWithDiscrepancies: discrepancies.length,
      discrepancies
    }));

  } catch (error) {
    logger.error('Error generating loyalty points report:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to generate loyalty points report',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;
