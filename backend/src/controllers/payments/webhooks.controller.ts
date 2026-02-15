import { Request, Response } from 'express';
import { paypalService } from '@/services/payment/paypal.service';
import { wayforpayService } from '@/services/payment/wayforpay.service';
import { coinbaseCommerceService } from '@/services/payment/coinbase.service';
import { createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes } from '@/types';

export class WebhooksPaymentController {
  // Handle PayPal webhook
  static async handlePayPalWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { config } = await import('@/config');
      const paypalWebhookId = config.paypal.webhookId;

      // SECURITY: Webhook secret must be configured — refuse to process without it
      if (!paypalWebhookId) {
        logger.error('[PayPal] PAYPAL_WEBHOOK_ID env var is not set — cannot verify webhook signatures');
        res.status(500).json({
          error: 'Payment webhook configuration error'
        });
        return;
      }

      const signature = req.headers['paypal-transmission-sig'] as string;
      // Use the raw body preserved by webhookRawBodyParser middleware
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      logger.info('[PayPal] Webhook received', {
        eventType: req.body.event_type,
        resourceType: req.body.resource_type,
        hasSignature: !!signature,
        headers: Object.keys(req.headers),
        hasRawBody: !!(req as any).rawBody
      });

      // SECURITY: Signature is MANDATORY — never process a webhook without verifying it
      if (!signature) {
        logger.warn('[PayPal] Webhook received without signature — rejecting', {
          eventType: req.body.event_type,
          ip: req.ip,
        });
        res.status(401).json({
          error: 'Missing webhook signature'
        });
        return;
      }

      // Verify webhook signature
      const isValid = await paypalService.verifyWebhookSignature(
        req.headers as Record<string, string>,
        rawBody,
        paypalWebhookId
      );

      if (!isValid) {
        logger.warn('[PayPal] Invalid webhook signature', {
          eventType: req.body.event_type,
        });
        res.status(401).json({
          error: 'Invalid webhook signature'
        });
        return;
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
              supplementaryData: event.resource?.supplementary_data,
              fullEventResource: event.resource
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

  // Handle WayForPay webhook
  static async handleWayForPayWebhook(req: Request, res: Response): Promise<void> {
    try {
      // SECURITY: WayForPay must be configured with merchant secret for signature verification
      const { WayForPayService } = await import('@/services/payment/wayforpay.service');
      if (!WayForPayService.isConfigured()) {
        logger.error('[WayForPay] Service not configured — merchant secret is missing, cannot verify webhook signatures');
        res.status(500).json({
          error: 'Payment webhook configuration error'
        });
        return;
      }

      const webhookData = req.body;

      // SECURITY: Signature is MANDATORY — never process a webhook without it
      if (!webhookData || !webhookData.merchantAccount || !webhookData.orderReference || !webhookData.merchantSignature) {
        logger.warn('[WayForPay] Webhook received with missing required fields — rejecting', {
          hasMerchantAccount: !!webhookData?.merchantAccount,
          hasOrderReference: !!webhookData?.orderReference,
          hasSignature: !!webhookData?.merchantSignature,
          ip: req.ip,
        });
        res.status(401).json({
          error: 'Missing required webhook fields including signature'
        });
        return;
      }

      logger.info('[WayForPay] Webhook received', {
        merchantAccount: webhookData.merchantAccount,
        orderReference: webhookData.orderReference,
        transactionStatus: webhookData.transactionStatus
      });

      // Process the webhook (includes signature verification)
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

  // Handle Coinbase Commerce webhook
  static async handleCoinbaseWebhook(req: Request, res: Response): Promise<void> {
    try {
      // SECURITY: Coinbase Commerce must be configured with webhook secret for signature verification
      const { CoinbaseCommerceService } = await import('@/services/payment/coinbase.service');
      if (!CoinbaseCommerceService.isConfigured()) {
        logger.error('[Coinbase] Service not configured — webhook secret is missing, cannot verify webhook signatures');
        res.status(500).json({ error: 'Payment webhook configuration error' });
        return;
      }

      const signature = req.headers['x-cc-webhook-signature'] as string;
      // Use the raw body preserved by rawBodySaver middleware
      // This is critical for signature verification - we need the EXACT bytes Coinbase sent
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      // SECURITY: Signature is MANDATORY — never process a webhook without verifying it
      if (!signature) {
        logger.warn('[Coinbase] Webhook received without signature header — rejecting', {
          ip: req.ip,
        });
        res.status(401).json({ error: 'Missing webhook signature' });
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
