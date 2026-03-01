import { Request, Response } from 'express';
import { wayforpayService } from '@/services/payment/wayforpay.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest, ValidatorError } from '@/types';
import { validationResult } from 'express-validator';

export class WayForPayController {
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
              field: 'location' in error ? error.location : 'param' in error ? (error as ValidatorError).param : undefined,
              message: 'msg' in error ? error.msg : (error as ValidatorError).message || 'Validation error',
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[WayForPay] Failed to create WayForPay invoice', {
        userId: req.user?.id,
        bookingId: req.body.bookingId,
        error: error instanceof Error ? err.message : error,
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[WayForPay] Failed to get WayForPay payment status', {
        userId: req.user?.id,
        orderReference: req.params.orderReference,
        error: error instanceof Error ? err.message : error,
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[WayForPay] Webhook processing failed', {
        error: error instanceof Error ? err.message : error,
      });

      res.status(500).json({
        error: 'Webhook processing failed'
      });
    }
  }
}
