import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';

export class WalletController {
  // Get wallet balance
  static async getWalletBalance(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const userId = req.user.id;
      const walletData = await PaymentService.getWalletBalance(userId);

      res.json(
        createSuccessResponse({
          balance: walletData.balance,
          currency: walletData.currency,
          userId,
        }, req.headers['x-request-id'] as string)
      );
    } catch (error) {
      logger.error('Failed to get wallet balance:', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get wallet balance',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get wallet transactions
  static async getWalletTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const userId = req.user.id;
      const { page = '1', limit = '20', type, startDate, endDate } = req.query;

      // Validation
      const pageNum = Math.max(1, parseInt(page as string) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit as string) || 20));

      const filters: any = {};

      if (type && ['CREDIT', 'DEBIT', 'REFUND', 'FORFEITURE_SPLIT'].includes(type as string)) {
        filters.type = type as string;
      }

      if (startDate) {
        filters.startDate = new Date(startDate as string);
      }

      if (endDate) {
        filters.endDate = new Date(endDate as string);
      }

      const transactions = await PaymentService.getWalletTransactions(userId, {
        page: pageNum,
        limit: limitNum,
        filters,
      });

      res.json(
        createSuccessResponse({
          transactions: transactions.transactions,
          pagination: transactions.pagination,
          totalBalance: transactions.currentBalance,
        }, req.headers['x-request-id'] as string)
      );
    } catch (error) {
      logger.error('Failed to get wallet transactions:', {
        userId: req.user?.id,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get wallet transactions',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
