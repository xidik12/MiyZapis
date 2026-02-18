import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

/**
 * StripeController handles the core/general payment methods that flow through
 * the PaymentService abstraction layer. This includes payment intents, confirmations,
 * payment details, history, payment method CRUD, earnings, refunds, revenue, and
 * the mock payment endpoint.
 *
 * While named "Stripe" because the underlying PaymentService was originally
 * Stripe-based, these methods serve as the general payment orchestration layer.
 */
export class StripeController {
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

      // Import the old payment controller's functionality
      const { paymentController } = await import('@/controllers/payment.controller');

      // Cast the request to match the expected type for the old payment controller
      const compatibleReq = req as any; // Cast to avoid type conflicts

      // Use the old payment controller's getPaymentStatus method
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
}
