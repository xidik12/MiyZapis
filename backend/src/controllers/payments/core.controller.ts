import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class CorePaymentController {
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
      // Guard: only allow in non-production environments
      if (process.env.NODE_ENV === 'production') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Mock payment endpoint is not available in production',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

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
}
