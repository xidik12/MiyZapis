import { Response } from 'express';
import { coinbaseCommerceService } from '@/services/payment/coinbase.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class CoinbasePaymentController {
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
}
