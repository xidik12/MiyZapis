import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class HistoryPaymentController {
  // Get payment history with advanced filtering
  static async getPaymentHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log incoming request for debugging
      logger.info('Payment history request:', {
        userId: req.user?.id,
        query: req.query,
        userAgent: req.get('User-Agent'),
        requestId: req.headers['x-request-id']
      });

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        logger.warn('Payment history validation errors:', {
          userId: req.user?.id,
          errors: errors.array(),
          query: req.query
        });

        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: 'location' in error ? error.location : 'param' in error ? (error as any).param : undefined,
              message: 'msg' in error ? error.msg : (error as any).message || 'Validation error',
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

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

      const {
        status,
        type,
        startDate,
        endDate,
        page = 1,
        limit = 20,
        minAmount,
        maxAmount,
        bookingId,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      // Convert frontend-friendly status values to database values
      const convertStatusToDbValue = (inputStatus: string): string | undefined => {
        if (!inputStatus) return undefined;
        const statusMap: { [key: string]: string } = {
          'completed': 'SUCCEEDED',
          'succeeded': 'SUCCEEDED', // Handle both 'succeeded' and 'completed' for frontend compatibility
          'pending': 'PENDING',
          'processing': 'PROCESSING',
          'failed': 'FAILED',
          'cancelled': 'CANCELLED',
          'refunded': 'REFUNDED',
          // Also handle uppercase database values directly
          'PENDING': 'PENDING',
          'PROCESSING': 'PROCESSING',
          'SUCCEEDED': 'SUCCEEDED',
          'FAILED': 'FAILED',
          'CANCELLED': 'CANCELLED',
          'REFUNDED': 'REFUNDED'
        };
        return statusMap[inputStatus] || inputStatus;
      };

      const filters = {
        status: convertStatusToDbValue(status as string),
        type: type as string,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        bookingId: bookingId as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
      };

      logger.info('Payment history filters:', {
        userId: req.user.id,
        originalStatus: status,
        convertedStatus: filters.status,
        filters
      });

      const result = await PaymentService.getPaymentHistory(req.user.id, filters);

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
          filters: {
            status: filters.status,
            type: filters.type,
            startDate: filters.startDate,
            endDate: filters.endDate,
            minAmount: filters.minAmount,
            maxAmount: filters.maxAmount,
            bookingId: filters.bookingId,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
          }
        })
      );
    } catch (error: any) {
      logger.error('Get payment history error:', {
        userId: req.user?.id,
        query: req.query,
        error: error.message,
        stack: error.stack,
        requestId: req.headers['x-request-id']
      });

      // Handle specific service errors
      if (error.message === 'USER_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'User not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_FILTER_PARAMETERS') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid filter parameters',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get payment history',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get user payments
  static async getUserPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const {
        status,
        type,
        fromDate,
        toDate,
        page = 1,
        limit = 20,
      } = req.query;

      const filters = {
        status: status as string,
        type: type as string,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: parseInt(page as string, 10),
        limit: parseInt(limit as string, 10),
      };

      const result = await PaymentService.getUserPayments(req.user.id, filters);

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.page < result.totalPages,
            hasPrev: result.page > 1,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get user payments error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get user payments',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
