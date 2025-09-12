import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { ErrorCodes } from '@/types';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

const router = Router();

// Fix current user's loyalty points (non-admin endpoint)
router.post('/fix-my-points', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as AuthenticatedRequest).user?.id;
    if (!userId) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User not authenticated', req.headers['x-request-id'] as string)
      );
    }

    logger.info('Fixing loyalty points for user', { userId });

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        loyaltyPoints: true
      }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse(ErrorCodes.NOT_FOUND, 'User not found', req.headers['x-request-id'] as string)
      );
    }

    // Calculate correct total from transactions
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      select: { 
        points: true, 
        type: true, 
        reason: true, 
        createdAt: true,
        description: true 
      },
      orderBy: { createdAt: 'desc' }
    });

    const correctTotal = transactions.reduce((sum, tx) => sum + tx.points, 0);
    const currentTotal = user.loyaltyPoints || 0;
    const difference = correctTotal - currentTotal;

    if (difference !== 0) {
      // Update user's loyalty points
      await prisma.user.update({
        where: { id: userId },
        data: { loyaltyPoints: correctTotal }
      });

      logger.info('Fixed loyalty points discrepancy', {
        userId,
        before: currentTotal,
        after: correctTotal,
        difference
      });

      res.json(createSuccessResponse({
        message: 'Loyalty points fixed successfully!',
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        fix: {
          before: currentTotal,
          after: correctTotal,
          difference,
          fixed: true
        },
        transactions: transactions.slice(0, 10).map(tx => ({
          points: tx.points,
          type: tx.type,
          reason: tx.reason,
          description: tx.description,
          date: tx.createdAt.toISOString().split('T')[0]
        })),
        summary: {
          totalTransactions: transactions.length,
          totalPointsFromTransactions: correctTotal,
          previousUserPoints: currentTotal,
          fixApplied: true,
          fixedAt: new Date().toISOString()
        }
      }));
    } else {
      res.json(createSuccessResponse({
        message: 'Loyalty points are already correct!',
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          email: user.email
        },
        fix: {
          before: currentTotal,
          after: correctTotal,
          difference: 0,
          fixed: false
        },
        transactions: transactions.slice(0, 10).map(tx => ({
          points: tx.points,
          type: tx.type,
          reason: tx.reason,
          description: tx.description,
          date: tx.createdAt.toISOString().split('T')[0]
        })),
        summary: {
          totalTransactions: transactions.length,
          totalPointsFromTransactions: correctTotal,
          currentUserPoints: currentTotal,
          fixApplied: false,
          checkedAt: new Date().toISOString()
        }
      }));
    }

  } catch (error) {
    logger.error('Error fixing user loyalty points:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to fix loyalty points',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;
