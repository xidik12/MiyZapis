import { Request, Response } from 'express';
import { coinbaseCommerceService } from '@/services/payment/coinbase.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest, ValidatorError } from '@/types';
import { validationResult } from 'express-validator';

export class CoinbaseController {
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[Coinbase] Failed to create Coinbase Commerce charge', {
        userId: req.user?.id,
        bookingId: req.body.bookingId,
        error: error instanceof Error ? err.message : error,
      });

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          error instanceof Error ? err.message : 'Failed to create Coinbase Commerce charge',
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[Coinbase] Failed to get Coinbase Commerce charge details', {
        userId: req.user?.id,
        chargeCode: req.params.chargeCode,
        error: error instanceof Error ? err.message : error,
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
      const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);

      if (!signature) {
        logger.warn('[Coinbase] Webhook received without signature header');
        res.status(400).json({ error: 'Missing webhook signature' });
        return;
      }

      logger.info('[Coinbase] Webhook received DEBUG', {
        eventType: req.body.event?.type,
        eventId: req.body.event?.id,
        hasRawBody: !!(req as Request & { rawBody?: string }).rawBody,
        rawBodyLength: (req as Request & { rawBody?: string }).rawBody?.length || 0,
        bodyLength: JSON.stringify(req.body).length,
        usingFallback: !(req as Request & { rawBody?: string }).rawBody,
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
            if (WebSocketManager.isInitialized()) {
              const wsInstance = WebSocketManager.getInstance();
              wsInstance.sendNotification(paymentRecord.userId, {
                type: 'PAYMENT_COMPLETED',
                title: 'Payment Completed',
                message: 'Your crypto payment has been confirmed successfully',
                data: { paymentId: paymentRecord.id, bookingId: booking.id, status: 'COMPLETED' }
              });
            }
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
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('[Coinbase] Webhook processing failed', {
        error: error instanceof Error ? err.message : error,
      });

      res.status(500).json({
        error: 'Webhook processing failed'
      });
    }
  }
}
