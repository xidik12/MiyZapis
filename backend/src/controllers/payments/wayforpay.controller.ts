import { Response } from 'express';
import { wayforpayService } from '@/services/payment/wayforpay.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class WayForPayPaymentController {
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
}
