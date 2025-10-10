import { Request, Response } from 'express';
import { PaymentService } from '@/services/payment';
import { paypalService } from '@/services/payment/paypal.service';
import { wayforpayService } from '@/services/payment/wayforpay.service';
import { coinbaseCommerceService } from '@/services/payment/coinbase.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class PaymentController {
  // Create payment intent
  static async createPaymentIntent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
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

      const paymentIntentData = {
        ...req.body,
        customerId: req.user.id,
      };

      const paymentIntent = await PaymentService.createPaymentIntent(paymentIntentData);

      res.status(201).json(
        createSuccessResponse({
          paymentIntent,
        })
      );
    } catch (error: any) {
      logger.error('Create payment intent error:', error);

      if (error.message === 'BOOKING_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Booking not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'UNAUTHORIZED_ACCESS') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to create payment for this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'PAYMENT_ALREADY_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Payment already exists for this booking',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'BOOKING_ID_REQUIRED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Booking ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_AMOUNT') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid amount. Amount must be greater than 0',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CURRENCY_REQUIRED') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Currency is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create payment intent',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Confirm payment
  static async confirmPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Payment intent ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const payment = await PaymentService.confirmPayment(paymentIntentId);

      res.json(
        createSuccessResponse({
          payment,
          message: 'Payment confirmed successfully',
        })
      );
    } catch (error: any) {
      logger.error('Confirm payment error:', error);

      if (error.message === 'PAYMENT_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to confirm payment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get payment status (for polling)
  static async getPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!paymentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Payment ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Import the new payment controller's functionality
      const { paymentController } = await import('@/controllers/payment.controller');

      // Cast the request to match the expected type for the new payment controller
      const compatibleReq = req as any; // Cast to avoid type conflicts

      // Use the new payment controller's getPaymentStatus method
      return await paymentController.getPaymentStatus(compatibleReq, res);

    } catch (error: any) {
      logger.error('Get payment status error:', {
        error: error.message,
        paymentId: req.params.paymentId,
        userId: req.user?.id,
        stack: error.stack
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get payment status',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get payment details
  static async getPaymentDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;

      if (!paymentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Payment ID is required',
            req.headers['x-request-id'] as string
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

      const payment = await PaymentService.getPaymentDetails(paymentId, req.user.id);

      if (!payment) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          payment,
        })
      );
    } catch (error: any) {
      logger.error('Get payment details error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get payment details',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

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

  // Process refund (admin or specialist only)
  static async processRefund(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
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

      // Only admin and specialists can process refunds
      if (!['ADMIN', 'SPECIALIST'].includes(req.user.userType)) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only administrators and specialists can process refunds',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const refund = await PaymentService.processRefund(req.body);

      res.json(
        createSuccessResponse({
          refund,
          message: 'Refund processed successfully',
        })
      );
    } catch (error: any) {
      logger.error('Process refund error:', error);

      if (error.message === 'PAYMENT_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'CANNOT_REFUND_UNSUCCESSFUL_PAYMENT') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Cannot refund unsuccessful payment',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'REFUND_AMOUNT_EXCEEDS_PAYMENT') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Refund amount cannot exceed payment amount',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to process refund',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Mock payment success for development
  static async mockPaymentSuccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { paymentIntentId } = req.body;

      if (!paymentIntentId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Payment intent ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // This is a development-only endpoint for testing payments
      const payment = await PaymentService.confirmPayment(paymentIntentId);

      res.json(
        createSuccessResponse({
          payment,
          message: 'Mock payment completed successfully',
        })
      );
    } catch (error: any) {
      logger.error('Mock payment success error:', error);

      if (error.message === 'PAYMENT_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to process mock payment',
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

  // Get user payment methods
  static async getUserPaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const paymentMethods = await PaymentService.getUserPaymentMethods(req.user.id);

      res.json(
        createSuccessResponse({
          paymentMethods,
        })
      );
    } catch (error: any) {
      logger.error('Get user payment methods error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get payment methods',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Add payment method
  static async addPaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const paymentMethodData = {
        ...req.body,
        userId: req.user.id,
      };

      const paymentMethod = await PaymentService.addPaymentMethod(paymentMethodData);

      res.status(201).json(
        createSuccessResponse({
          paymentMethod,
          message: 'Payment method added successfully',
        })
      );
    } catch (error: any) {
      logger.error('Add payment method error:', error);

      if (error.message === 'PAYMENT_METHOD_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Payment method already exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to add payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update payment method
  static async updatePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

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

      const paymentMethod = await PaymentService.updatePaymentMethod(methodId, req.user.id, req.body);

      if (!paymentMethod) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          paymentMethod,
          message: 'Payment method updated successfully',
        })
      );
    } catch (error: any) {
      logger.error('Update payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Delete payment method
  static async deletePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

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

      const success = await PaymentService.deletePaymentMethod(methodId, req.user.id);

      if (!success) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          message: 'Payment method deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

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

      const paymentMethod = await PaymentService.setDefaultPaymentMethod(methodId, req.user.id);

      if (!paymentMethod) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          paymentMethod,
          message: 'Default payment method set successfully',
        })
      );
    } catch (error: any) {
      logger.error('Set default payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to set default payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Wallet endpoints
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

  // PayPal payment methods

  // Create PayPal order for booking
  static async createPayPalOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { bookingId, amount, currency, description, metadata = {}, bookingData } = req.body;

      if (!bookingId || !amount || !currency) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required fields: bookingId, amount, currency',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[PayPal] Creating PayPal order', {
        bookingId,
        amount,
        currency,
        userId: req.user.id,
        hasBookingData: !!bookingData
      });

      // PayPal service handles amount conversion internally
      const paypalOrder = await paypalService.createOrder({
        bookingId,
        amount, // Amount in cents (e.g., 1000 = $10.00)
        currency,
        description,
        metadata: {
          ...metadata,
          userId: req.user.id,
          userEmail: req.user.email,
          // Include full booking data for webhook processing
          bookingData: bookingData || metadata.bookingData
        }
      });

      // Store pending payment record with booking metadata for webhook processing
      const prisma = (await import('@/config/database')).prisma;
      await prisma.payment.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
          type: 'DEPOSIT',
          amount: amount / 100, // Convert cents to dollars
          currency,
          paymentMethodType: 'paypal',
          metadata: JSON.stringify({
            paypalOrderId: paypalOrder.id,
            tempBookingId: bookingId,
            bookingData: bookingData || metadata.bookingData
          })
        }
      });

      logger.info('[PayPal] Payment record created for order', {
        orderId: paypalOrder.id,
        userId: req.user.id,
        paymentMetadata: JSON.stringify({
          paypalOrderId: paypalOrder.id,
          tempBookingId: bookingId,
          bookingData: bookingData || metadata.bookingData
        })
      });

      res.status(201).json(
        createSuccessResponse({
          order: paypalOrder,
          approvalUrl: paypalOrder.approvalUrl
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[PayPal] Failed to create PayPal order', {
        userId: req.user?.id,
        bookingId: req.body.bookingId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create PayPal order',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Capture PayPal order after user approval
  static async capturePayPalOrder(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { orderId, metadata = {} } = req.body;

      if (!orderId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required field: orderId',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[PayPal] Capturing PayPal order', {
        orderId,
        userId: req.user.id
      });

      const capturedOrder = await paypalService.captureOrder({
        orderId,
        metadata: {
          ...metadata,
          userId: req.user.id,
          userEmail: req.user.email
        }
      });

      res.status(200).json(
        createSuccessResponse({
          order: capturedOrder,
          captureId: capturedOrder.captureId
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[PayPal] Failed to capture PayPal order', {
        userId: req.user?.id,
        orderId: req.body.orderId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to capture PayPal order',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get PayPal order details
  static async getPayPalOrderDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { orderId } = req.params;

      if (!orderId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required parameter: orderId',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[PayPal] Getting PayPal order details', {
        orderId,
        userId: req.user.id
      });

      const orderDetails = await paypalService.getOrderDetails(orderId);

      res.status(200).json(
        createSuccessResponse({
          order: orderDetails
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[PayPal] Failed to get PayPal order details', {
        userId: req.user?.id,
        orderId: req.params.orderId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get PayPal order details',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Refund PayPal payment
  static async refundPayPalPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { captureId, amount, currency, reason } = req.body;

      if (!captureId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required field: captureId',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[PayPal] Processing PayPal refund', {
        captureId,
        amount,
        currency,
        reason,
        userId: req.user.id
      });

      const refund = await paypalService.refundPayment({
        captureId,
        amount,
        currency,
        reason
      });

      res.status(200).json(
        createSuccessResponse({
          refund
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[PayPal] Failed to process PayPal refund', {
        userId: req.user?.id,
        captureId: req.body.captureId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to process PayPal refund',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Handle PayPal webhook
  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['paypal-transmission-sig'] as string;
      const webhookId = req.headers['paypal-webhook-id'] as string;
      // Use the raw body preserved by webhookRawBodyParser middleware
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      logger.info('[PayPal] Webhook received', {
        eventType: req.body.event_type,
        resourceType: req.body.resource_type,
        hasSignature: !!signature,
        hasWebhookId: !!webhookId,
        headers: Object.keys(req.headers),
        hasRawBody: !!(req as any).rawBody
      });

      // For development/testing: Allow webhooks without signature verification
      // In production, you should always verify webhooks
      if (signature && webhookId) {
        // Verify webhook signature
        const isValid = await paypalService.verifyWebhookSignature(
          req.headers as Record<string, string>,
          rawBody,
          webhookId
        );

        if (!isValid) {
          logger.warn('[PayPal] Invalid webhook signature', {
            eventType: req.body.event_type,
            webhookId,
          });
          res.status(401).json({
            error: 'Invalid webhook signature'
          });
          return;
        }
      } else {
        logger.warn('[PayPal] Webhook received without signature - processing anyway for testing', {
          hasSignature: !!signature,
          hasWebhookId: !!webhookId,
        });
      }

      const event = req.body;

      logger.info('[PayPal] Processing webhook event', {
        eventType: event.event_type,
        eventId: event.id,
        resourceType: event.resource_type,
        summary: event.summary
      });

      // Handle different PayPal webhook events
      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED':
          logger.info('[PayPal] Order approved', {
            orderId: event.resource?.id,
            amount: event.resource?.purchase_units?.[0]?.amount
          });
          break;

        case 'PAYMENT.CAPTURE.COMPLETED':
          logger.info('[PayPal] Payment captured', {
            captureId: event.resource?.id,
            orderId: event.resource?.supplementary_data?.related_ids?.order_id,
            amount: event.resource?.amount
          });

          // Process the payment and create booking
          try {
            const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
            const customId = event.resource?.custom_id;

            logger.info('[PayPal] Webhook payment data', {
              orderId,
              customId,
              captureId: event.resource?.id,
              hasSupplementaryData: !!event.resource?.supplementary_data,
              supplementaryData: event.resource?.supplementary_data
            });

            if (!orderId) {
              logger.error('[PayPal] No order ID found in webhook', {
                resourceKeys: Object.keys(event.resource || {}),
                resource: event.resource
              });
              break;
            }

            // Find the payment record with booking data
            const prisma = (await import('@/config/database')).prisma;

            // Debug: List all pending PayPal payments
            const allPending = await prisma.payment.findMany({
              where: {
                status: 'PENDING',
                paymentMethodType: 'paypal'
              },
              select: {
                id: true,
                metadata: true,
                createdAt: true
              },
              orderBy: { createdAt: 'desc' },
              take: 5
            });

            logger.info('[PayPal] Recent pending PayPal payments for debugging', {
              searchingFor: orderId,
              pendingCount: allPending.length,
              payments: allPending.map(p => ({
                id: p.id,
                metadata: p.metadata,
                createdAt: p.createdAt
              }))
            });

            const paymentRecord = await prisma.payment.findFirst({
              where: {
                metadata: {
                  contains: orderId
                },
                status: 'PENDING'
              }
            });

            if (!paymentRecord || !paymentRecord.metadata) {
              logger.error('[PayPal] Payment record not found for order', {
                orderId,
                searchedMetadata: `metadata contains "${orderId}"`,
                pendingPaymentsCount: allPending.length
              });
              break;
            }

            const metadata = JSON.parse(paymentRecord.metadata);
            const bookingData = metadata.bookingData;

            if (!bookingData) {
              logger.error('[PayPal] No booking data found in payment metadata');
              break;
            }

            // Create the booking
            const { BookingService } = await import('@/services/booking');
            const booking = await BookingService.createBooking({
              customerId: paymentRecord.userId,
              serviceId: bookingData.serviceId,
              scheduledAt: new Date(bookingData.scheduledAt),
              duration: bookingData.duration,
              customerNotes: bookingData.customerNotes,
              loyaltyPointsUsed: 0
            });

            // Update payment record with booking ID and mark as paid
            await prisma.payment.update({
              where: { id: paymentRecord.id },
              data: {
                bookingId: booking.id,
                status: 'SUCCEEDED',
                metadata: JSON.stringify({
                  ...metadata,
                  paypalCaptureId: event.resource.id
                })
              }
            });

            logger.info('[PayPal] Booking created from webhook', {
              bookingId: booking.id,
              orderId,
              userId: paymentRecord.userId
            });

            // Emit socket event to notify frontend
            const { WebSocketManager } = await import('@/services/websocket/websocket-manager');
            const wsManager = WebSocketManager.getInstance();
            wsManager.emitToUser(paymentRecord.userId, 'payment:completed', {
              paymentId: paymentRecord.id,
              bookingId: booking.id,
              status: 'COMPLETED'
            });

          } catch (error) {
            logger.error('[PayPal] Error processing payment webhook', {
              error: error instanceof Error ? error.message : error,
              orderId: event.resource?.supplementary_data?.related_ids?.order_id
            });
          }
          break;

        case 'PAYMENT.CAPTURE.DENIED':
          logger.warn('[PayPal] Payment denied', {
            captureId: event.resource?.id,
            reason: event.resource?.status_details?.reason
          });
          break;

        case 'PAYMENT.CAPTURE.REFUNDED':
          logger.info('[PayPal] Payment refunded', {
            captureId: event.resource?.id,
            refundId: event.resource?.supplementary_data?.related_ids?.refund_id,
            amount: event.resource?.amount
          });
          break;

        default:
          logger.info('[PayPal] Unhandled webhook event', {
            eventType: event.event_type
          });
      }

      res.status(200).json({ received: true });
    } catch (error: any) {
      logger.error('[PayPal] Webhook processing failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Webhook processing failed'
      });
    }
  }

  // WayForPay payment methods

  // Create WayForPay invoice for booking
  static async createWayForPayInvoice(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { bookingId, amount, currency, description, customerEmail, customerPhone, metadata = {}, bookingData } = req.body;

      if (!bookingId || !amount || !currency) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required fields: bookingId, amount, currency',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[WayForPay] Creating WayForPay invoice', {
        bookingId,
        amount,
        currency,
        userId: req.user.id,
        hasBookingData: !!bookingData
      });

      // WayForPay service handles amount rounding internally
      const wayforpayInvoice = await wayforpayService.createInvoice({
        bookingId,
        amount, // Amount in smallest currency unit (e.g., 1000 kopeks = 10 UAH)
        currency,
        description,
        customerEmail,
        customerPhone,
        metadata: {
          ...metadata,
          userId: req.user.id,
          userEmail: req.user.email,
          // Include full booking data for webhook processing
          bookingData: bookingData || metadata.bookingData
        }
      });

      res.status(201).json(
        createSuccessResponse({
          invoice: wayforpayInvoice,
          paymentUrl: wayforpayInvoice.paymentUrl
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[WayForPay] Failed to create WayForPay invoice', {
        userId: req.user?.id,
        bookingId: req.body.bookingId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create WayForPay invoice',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get WayForPay payment status
  static async getWayForPayPaymentStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { orderReference } = req.params;

      if (!orderReference) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required parameter: orderReference',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[WayForPay] Getting WayForPay payment status', {
        orderReference,
        userId: req.user.id
      });

      const paymentStatus = await wayforpayService.getPaymentStatus(orderReference);

      res.status(200).json(
        createSuccessResponse({
          status: paymentStatus
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[WayForPay] Failed to get WayForPay payment status', {
        userId: req.user?.id,
        orderReference: req.params.orderReference,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get WayForPay payment status',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Handle WayForPay webhook
  static async handleWayForPayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const webhookData = req.body;

      if (!webhookData || !webhookData.merchantAccount || !webhookData.orderReference || !webhookData.merchantSignature) {
        logger.warn('[WayForPay] Webhook received with missing required fields', {
          hasMerchantAccount: !!webhookData?.merchantAccount,
          hasOrderReference: !!webhookData?.orderReference,
          hasSignature: !!webhookData?.merchantSignature,
        });
        res.status(400).json({
          error: 'Missing required webhook fields'
        });
        return;
      }

      logger.info('[WayForPay] Webhook received', {
        merchantAccount: webhookData.merchantAccount,
        orderReference: webhookData.orderReference,
        transactionStatus: webhookData.transactionStatus
      });

      // Process the webhook
      const result = await wayforpayService.processWebhook(webhookData);

      if (!result.isValid) {
        logger.warn('[WayForPay] Invalid webhook signature', {
          orderReference: webhookData.orderReference,
          transactionStatus: webhookData.transactionStatus,
        });
        res.status(401).json({
          error: 'Invalid webhook signature'
        });
        return;
      }

      // Handle different WayForPay webhook events
      switch (result.data.transactionStatus) {
        case 'Approved':
          logger.info('[WayForPay] Payment approved', {
            orderReference: result.data.orderReference,
            amount: result.data.amount,
            currency: result.data.currency
          });

          // Here you would typically update your booking status, create payment record, etc.
          // This is where you'd integrate with your booking system
          break;

        case 'Declined':
          logger.warn('[WayForPay] Payment declined', {
            orderReference: result.data.orderReference,
            reason: result.data.reason
          });
          break;

        case 'Refunded':
          logger.info('[WayForPay] Payment refunded', {
            orderReference: result.data.orderReference,
            amount: result.data.amount
          });
          break;

        default:
          logger.info('[WayForPay] Unhandled webhook event', {
            transactionStatus: result.data.transactionStatus
          });
      }

      // WayForPay expects specific response format
      res.status(200).json({
        orderReference: result.data.orderReference,
        status: 'accept',
        time: Math.floor(Date.now() / 1000)
      });
    } catch (error: any) {
      logger.error('[WayForPay] Webhook processing failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Webhook processing failed'
      });
    }
  }

  // Coinbase Commerce payment methods

  // Create Coinbase Commerce charge for crypto payment
  static async createCoinbaseCharge(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { bookingId, amount, currency, name, description, metadata = {} } = req.body;

      if (!bookingId || !amount || !currency || !name) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required fields: bookingId, amount, currency, name',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[Coinbase] Creating Coinbase Commerce charge', {
        bookingId,
        amount,
        currency,
        userId: req.user.id
      });

      // Coinbase expects amount in full units (e.g., 10.00 for $10)
      const charge = await coinbaseCommerceService.createCharge({
        amount, // Amount in full currency units
        currency,
        name,
        description: description || `Payment for booking ${bookingId}`,
        metadata: {
          ...metadata,
          bookingId,
          userId: req.user.id,
          userEmail: req.user.email
        }
        // Don't set redirectUrl/cancelUrl - Coinbase will show "Return to merchant" button
        // Frontend handles completion via webhook notifications and socket events
      });

      // Create payment record with booking data for webhook processing
      const prisma = (await import('@/config/database')).prisma;
      const bookingData = metadata.bookingData;

      const paymentMetadata = {
        coinbaseChargeId: charge.chargeId,
        coinbaseChargeCode: charge.code,
        tempBookingId: bookingId,
        bookingData: bookingData || metadata.bookingData
      };

      await prisma.payment.create({
        data: {
          userId: req.user.id,
          status: 'PENDING',
          type: 'DEPOSIT',
          amount: amount,
          currency,
          paymentMethodType: 'crypto',
          metadata: JSON.stringify(paymentMetadata)
        }
      });

      logger.info('[Coinbase] Payment record created for charge', {
        chargeId: charge.chargeId,
        chargeCode: charge.code,
        userId: req.user.id,
        hasBookingData: !!bookingData,
        bookingDataKeys: bookingData ? Object.keys(bookingData) : [],
        metadataStored: paymentMetadata
      });

      res.status(201).json(
        createSuccessResponse({
          charge: {
            id: charge.chargeId,
            code: charge.code,
            paymentUrl: charge.paymentUrl,
            qrCodeUrl: charge.qrCodeUrl,
            expiresAt: charge.expiresAt
          }
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[Coinbase] Failed to create Coinbase Commerce charge', {
        userId: req.user?.id,
        bookingId: req.body.bookingId,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          error instanceof Error ? error.message : 'Failed to create Coinbase Commerce charge',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Get Coinbase Commerce charge details
  static async getCoinbaseChargeDetails(req: AuthenticatedRequest, res: Response): Promise<void> {
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

      const { chargeCode } = req.params;

      if (!chargeCode) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Missing required parameter: chargeCode',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('[Coinbase] Getting Coinbase Commerce charge details', {
        chargeCode,
        userId: req.user.id
      });

      const charge = await coinbaseCommerceService.getCharge(chargeCode);

      res.status(200).json(
        createSuccessResponse({
          charge
        }, req.headers['x-request-id'] as string)
      );
    } catch (error: any) {
      logger.error('[Coinbase] Failed to get Coinbase Commerce charge details', {
        userId: req.user?.id,
        chargeCode: req.params.chargeCode,
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get Coinbase Commerce charge details',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Handle Coinbase Commerce webhook
  static async handleCoinbaseWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-cc-webhook-signature'] as string;
      // Use the raw body preserved by rawBodySaver middleware
      // This is critical for signature verification - we need the EXACT bytes Coinbase sent
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      if (!signature) {
        logger.warn('[Coinbase] Webhook received without signature header');
        res.status(400).json({ error: 'Missing webhook signature' });
        return;
      }

      logger.info('[Coinbase] Webhook received DEBUG', {
        eventType: req.body.event?.type,
        eventId: req.body.event?.id,
        hasRawBody: !!(req as any).rawBody,
        rawBodyLength: (req as any).rawBody?.length || 0,
        bodyLength: JSON.stringify(req.body).length,
        usingFallback: !(req as any).rawBody,
        signatureHeader: signature?.substring(0, 20) + '...',
        signatureLength: signature?.length || 0
      });

      // Verify webhook signature (payload, signature)
      const isValid = coinbaseCommerceService.verifyWebhookSignature(rawBody, signature);

      if (!isValid) {
        logger.warn('[Coinbase] Invalid webhook signature', {
          eventType: req.body.event?.type
        });
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      const event = req.body.event;

      if (!event || !event.type || !event.data) {
        logger.warn('[Coinbase] Webhook received with missing event data');
        res.status(400).json({ error: 'Missing event data' });
        return;
      }

      // Handle different Coinbase webhook events
      switch (event.type) {
        case 'charge:created':
          logger.info('[Coinbase] Charge created', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });
          break;

        case 'charge:confirmed':
          logger.info('[Coinbase] Charge confirmed', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });

          // Create booking from payment metadata
          try {
            const chargeId = event.data.id;
            const chargeCode = event.data.code;

            const prisma = (await import('@/config/database')).prisma;

            // Try to find by charge ID first, then by charge code
            let paymentRecord = await prisma.payment.findFirst({
              where: {
                metadata: { contains: chargeId },
                status: 'PENDING'
              }
            });

            if (!paymentRecord && chargeCode) {
              paymentRecord = await prisma.payment.findFirst({
                where: {
                  metadata: { contains: chargeCode },
                  status: 'PENDING'
                }
              });
            }

            if (!paymentRecord || !paymentRecord.metadata) {
              logger.error('[Coinbase] Payment record not found for charge', {
                chargeId,
                chargeCode,
                attemptedSearch: 'both ID and code'
              });

              // Debug: List all pending crypto payments
              const allPending = await prisma.payment.findMany({
                where: {
                  status: 'PENDING',
                  paymentMethodType: 'crypto'
                },
                select: {
                  id: true,
                  metadata: true,
                  createdAt: true
                },
                orderBy: { createdAt: 'desc' },
                take: 5
              });

              logger.info('[Coinbase] Recent pending crypto payments for debugging', {
                count: allPending.length,
                payments: allPending.map(p => ({
                  id: p.id,
                  metadata: p.metadata,
                  createdAt: p.createdAt
                }))
              });

              break;
            }

            const metadata = JSON.parse(paymentRecord.metadata);
            const bookingData = metadata.bookingData;

            if (!bookingData) {
              logger.error('[Coinbase] No booking data found in payment metadata');
              break;
            }

            logger.info('[Coinbase] Creating booking from confirmed payment', {
              chargeId,
              userId: paymentRecord.userId,
              serviceId: bookingData.serviceId
            });

            const { BookingService } = await import('@/services/booking');
            const booking = await BookingService.createBooking({
              customerId: paymentRecord.userId,
              serviceId: bookingData.serviceId,
              scheduledAt: new Date(bookingData.scheduledAt),
              duration: bookingData.duration,
              customerNotes: bookingData.customerNotes,
              loyaltyPointsUsed: 0
            });

            await prisma.payment.update({
              where: { id: paymentRecord.id },
              data: {
                bookingId: booking.id,
                status: 'SUCCEEDED',
                metadata: JSON.stringify({
                  ...metadata,
                  coinbaseChargeId: chargeId
                })
              }
            });

            logger.info('[Coinbase] Booking created successfully', {
              bookingId: booking.id,
              chargeId,
              userId: paymentRecord.userId
            });

            const { WebSocketManager } = await import('@/services/websocket/websocket-manager');
            const wsManager = WebSocketManager.getInstance();
            wsManager.emitToUser(paymentRecord.userId, 'payment:completed', {
              paymentId: paymentRecord.id,
              bookingId: booking.id,
              status: 'COMPLETED'
            });
          } catch (error) {
            logger.error('[Coinbase] Error creating booking from confirmed payment', {
              error: error instanceof Error ? error.message : error,
              chargeId: event.data.id
            });
          }
          break;

        case 'charge:failed':
          logger.warn('[Coinbase] Charge failed', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });
          break;

        case 'charge:delayed':
          logger.info('[Coinbase] Charge delayed (underpaid)', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });
          break;

        case 'charge:pending':
          logger.info('[Coinbase] Charge pending', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });
          break;

        case 'charge:resolved':
          logger.info('[Coinbase] Charge resolved', {
            chargeId: event.data.id,
            chargeCode: event.data.code
          });
          break;

        default:
          logger.info('[Coinbase] Unhandled webhook event', {
            eventType: event.type
          });
      }

      // Coinbase expects 200 OK response
      res.status(200).json({ success: true });
    } catch (error: any) {
      logger.error('[Coinbase] Webhook processing failed', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: 'Webhook processing failed'
      });
    }
  }
}