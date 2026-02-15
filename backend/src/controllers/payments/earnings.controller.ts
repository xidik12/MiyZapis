import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class EarningsPaymentController {
  // Get earnings overview
  static async getEarningsOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access earnings overview',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const overview = await PaymentService.getEarningsOverview(req.user.id);

      res.json(
        createSuccessResponse({
          overview,
        })
      );
    } catch (error: any) {
      logger.error('Get earnings overview error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get earnings overview',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get earnings trends
  static async getEarningsTrends(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access earnings trends',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { period = 'month', groupBy = 'day' } = req.query;

      const trends = await PaymentService.getEarningsTrends(req.user.id, {
        period: period as string,
        groupBy: groupBy as string,
      });

      res.json(
        createSuccessResponse({
          trends,
        })
      );
    } catch (error: any) {
      logger.error('Get earnings trends error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get earnings trends',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get earnings analytics
  static async getEarningsAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access earnings analytics',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const analytics = await PaymentService.getEarningsAnalytics(req.user.id);

      res.json(
        createSuccessResponse({
          analytics,
        })
      );
    } catch (error: any) {
      logger.error('Get earnings analytics error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get earnings analytics',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get specialist earnings
  static async getSpecialistEarnings(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access earnings data',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { fromDate, toDate } = req.query;

      const filters = {
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      };

      const earnings = await PaymentService.getSpecialistEarnings(req.user.id, filters);

      res.json(
        createSuccessResponse({
          earnings,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist earnings error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist earnings',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get revenue data with period filtering
  static async getRevenueData(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      if (req.user.userType !== 'SPECIALIST') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can access revenue data',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { period = 'month' } = req.query;

      // Validate period parameter
      if (!['day', 'week', 'month', 'year'].includes(period as string)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid period parameter. Must be one of: day, week, month, year',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate: Date = new Date();

      switch (period) {
        case 'day':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
          break;
        case 'week':
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - now.getDay());
          startDate = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate());
          endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear() + 1, 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      }

      // Get earnings data using the existing service method
      const earningsData = await PaymentService.getSpecialistEarnings(req.user.id, {
        fromDate: startDate,
        toDate: endDate,
      });

      // Get earnings trends for comparison
      const trendsData = await PaymentService.getEarningsTrends(req.user.id, {
        period: period as string,
        groupBy: period === 'year' ? 'month' : 'day',
      });

      // Calculate previous period for trend comparison
      let previousStartDate: Date;
      let previousEndDate: Date;

      switch (period) {
        case 'day':
          previousStartDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
          previousEndDate = new Date(startDate);
          break;
        case 'week':
          previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
          previousEndDate = new Date(startDate);
          break;
        case 'month':
          const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousStartDate = prevMonth;
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          previousEndDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          const prevMonthDefault = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          previousStartDate = prevMonthDefault;
          previousEndDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      // Get previous period data for comparison
      const previousEarningsData = await PaymentService.getSpecialistEarnings(req.user.id, {
        fromDate: previousStartDate,
        toDate: previousEndDate,
      });

      // Calculate growth rate
      const currentRevenue = earningsData.totalEarnings || 0;
      const previousRevenue = previousEarningsData.totalEarnings || 0;
      const growthRate = previousRevenue === 0
        ? (currentRevenue > 0 ? 100 : 0)
        : Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100);

      // Format response data to match frontend expectations
      const responseData = {
        totalRevenue: currentRevenue,
        pendingRevenue: earningsData.pendingEarnings || 0,
        paidRevenue: earningsData.totalEarnings - (earningsData.pendingEarnings || 0),
        platformFee: currentRevenue * 0.1, // 10% platform fee
        netRevenue: currentRevenue * 0.9,
        growthRate,
        period: period,
        breakdown: trendsData.trends.map(trend => ({
          date: trend.date,
          revenue: trend.earnings,
          bookings: trend.bookingCount,
        })),
        comparison: {
          current: currentRevenue,
          previous: previousRevenue,
          growth: growthRate,
        },
        peakDay: trendsData.peakDay,
      };

      res.json(
        createSuccessResponse({
          revenue: responseData,
        })
      );
    } catch (error: any) {
      logger.error('Get revenue data error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get revenue data',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
