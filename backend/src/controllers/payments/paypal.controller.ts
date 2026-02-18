import { Request, Response } from 'express';
import { paypalService } from '@/services/payment/paypal.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';

export class PayPalController {
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
            if (WebSocketManager.isInitialized()) {
              const wsInstance = WebSocketManager.getInstance();
              wsInstance.sendNotification(paymentRecord.userId, {
                type: 'PAYMENT_COMPLETED',
                title: 'Payment Completed',
                message: 'Your PayPal payment has been processed successfully',
                data: { paymentId: paymentRecord.id, bookingId: booking.id, status: 'COMPLETED' }
              });
            }

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
}
