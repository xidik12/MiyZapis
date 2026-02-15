import { Response } from 'express';
import { paypalService } from '@/services/payment/paypal.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class PayPalPaymentController {
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
}
