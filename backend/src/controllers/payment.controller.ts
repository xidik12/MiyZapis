import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { bookingPaymentService } from '@/services/payment/booking-payment.service';
import { walletService } from '@/services/payment/wallet.service';
import { specialistSubscriptionService } from '@/services/payment/subscription.service';
import { coinbaseCommerceService } from '@/services/payment/coinbase.service';
import { coinbaseOnrampService } from '@/services/payment/coinbase-onramp.service';
import { logger } from '@/utils/logger';

// Request validation schemas
const createDepositPaymentSchema = z.object({
  bookingId: z.string().cuid(),
  useWalletFirst: z.boolean().optional().default(true),
  redirectUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  paymentMethod: z.enum(['AUTO', 'CRYPTO_ONLY', 'FIAT_TO_CRYPTO']).optional().default('AUTO'),
  userAddress: z.string().optional(),
});

const createPaymentIntentSchema = z.object({
  serviceId: z.string().cuid(),
  scheduledAt: z.string().datetime(),
  duration: z.number().positive(),
  customerNotes: z.string().optional(),
  loyaltyPointsUsed: z.number().min(0).default(0),
  useWalletFirst: z.boolean().optional().default(true),
  redirectUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  paymentMethod: z.enum(['AUTO', 'CRYPTO_ONLY', 'FIAT_TO_CRYPTO']).optional().default('AUTO'),
  userAddress: z.string().optional(),
});

const cancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const changePlanSchema = z.object({
  planType: z.enum(['PAY_PER_USE', 'MONTHLY_SUBSCRIPTION']),
  effectiveDate: z.string().transform(str => new Date(str)).optional(),
});

const webhookSchema = z.object({
  // Coinbase Commerce webhook structure
  id: z.string(),
  scheduled_for: z.string(),
  attempt_number: z.number(),
  event: z.object({
    id: z.string(),
    resource: z.string(),
    type: z.string(),
    api_version: z.string(),
    created_at: z.string(),
    data: z.any(), // CoinbaseCharge object
  }),
});

const createOnrampSessionSchema = z.object({
  bookingId: z.string().cuid().optional(),
  amount: z.number().positive(),
  currency: z.string().default('USD'),
  userAddress: z.string().optional(),
  purpose: z.enum(['BOOKING_DEPOSIT', 'WALLET_TOPUP', 'SUBSCRIPTION']).default('WALLET_TOPUP'),
  metadata: z.record(z.any()).optional(),
});

const getPaymentOptionsSchema = z.object({
  amount: z.number().positive(),
});

const completeOnrampSessionSchema = z.object({
  status: z.enum(['COMPLETED', 'FAILED']),
  cryptoAmount: z.number().positive().optional(),
  cryptoCurrency: z.string().optional(),
  blockchain: z.string().optional(),
  transactionHash: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export class PaymentController {
  // Payment Intent Endpoints (for payment-first booking flow)

  async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = createPaymentIntentSchema.parse(req.body);

      // Get service details for pricing
      const service = await prisma.service.findUnique({
        where: { id: validatedData.serviceId },
        include: {
          specialist: {
            include: {
              user: true
            }
          }
        }
      });

      if (!service) {
        res.status(404).json({ error: 'Service not found' });
        return;
      }

      const depositConfig = await bookingPaymentService.getDepositConfiguration();

      // Create payment intent without creating booking first
      // First check if wallet balance can cover the deposit
      let walletResult = null;
      if (validatedData.useWalletFirst) {
        try {
          const walletBalance = await walletService.getBalance(userId);

          if (walletBalance.balance >= depositConfig.amountUSD) {
            // Wallet has sufficient balance - for payment-first flow, we'll indicate this
            // but not actually debit until booking is created
            walletResult = {
              success: true,
              transactionId: `wallet-${Date.now()}`,
              amount: depositConfig.amountUSD,
              availableBalance: walletBalance.balance
            };
          }

          if (walletResult?.success) {
            // If wallet payment successful, return wallet payment result
            const result = {
              paymentId: walletResult.transactionId,
              status: 'completed',
              paymentMethod: 'wallet',
              walletTransaction: walletResult,
              totalPaid: depositConfig.amountUSD,
              remainingAmount: 0,
              finalAmount: depositConfig.amountUSD,
              requiresPayment: false,
              message: 'Payment completed using wallet balance'
            };

            logger.info('Payment intent completed with wallet', {
              paymentId: walletResult.transactionId,
              amount: depositConfig.amountUSD,
              userId,
              serviceId: validatedData.serviceId,
              walletBalanceUsed: walletResult.amount || depositConfig.amountUSD,
            });

            res.status(200).json({
              success: true,
              data: result,
            });
            return;
          }
        } catch (error) {
          logger.warn('Wallet payment failed, proceeding with crypto payment', {
            error: error instanceof Error ? error.message : error,
            userId,
          });
        }
      }

      // If wallet payment failed or not requested, create crypto payment
      const charge = await coinbaseCommerceService.createCharge({
        amount: depositConfig.amountUSD,
        currency: 'USD',
        name: `${service.name} - Booking Deposit`,
        description: `Booking deposit for ${service.name}`,
        metadata: {
          serviceId: validatedData.serviceId,
          scheduledAt: validatedData.scheduledAt,
          duration: validatedData.duration,
          customerId: userId,
          paymentFor: 'booking_deposit'
        },
        redirectUrl: validatedData.redirectUrl,
        cancelUrl: validatedData.cancelUrl,
      });

      // Create crypto payment record in database
      const cryptoPayment = await prisma.cryptoPayment.create({
        data: {
          userId,
          coinbaseChargeId: charge.chargeId,
          coinbaseChargeCode: charge.code,
          status: 'PENDING',
          type: 'DEPOSIT',
          amount: depositConfig.amountUSD,
          currency: 'USD',
          paymentUrl: charge.paymentUrl,
          qrCodeUrl: charge.qrCodeUrl,
          expiresAt: charge.expiresAt,
          metadata: JSON.stringify({
            serviceId: validatedData.serviceId,
            scheduledAt: validatedData.scheduledAt,
            duration: validatedData.duration,
            paymentFor: 'booking_deposit'
          }),
        },
      });

      const result = {
        paymentId: cryptoPayment.id,
        status: 'pending',
        paymentMethod: 'crypto',
        cryptoPayment: {
          id: cryptoPayment.id,
          paymentUrl: charge.paymentUrl,
          qrCodeUrl: charge.qrCodeUrl,
          expiresAt: charge.expiresAt,
          amount: depositConfig.amountUSD,
        },
        totalPaid: 0,
        remainingAmount: depositConfig.amountUSD,
        paymentUrl: charge.paymentUrl,
        qrCodeUrl: charge.qrCodeUrl,  // For payment service type compatibility
        qrCodeData: charge.qrCodeUrl,  // For frontend UI usage
        finalAmount: depositConfig.amountUSD,
        requiresPayment: true,
        message: 'Please complete crypto payment to proceed with booking'
      };

      logger.info('Payment intent created successfully', {
        paymentId: cryptoPayment.id,
        coinbaseChargeId: charge.chargeId,
        amount: depositConfig.amountUSD,
        userId,
        serviceId: validatedData.serviceId,
        hasQrCode: !!charge.qrCodeUrl,
        paymentUrl: charge.paymentUrl,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to create payment intent', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        body: req.body,
        serviceId: req.body?.serviceId,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      // Handle specific payment service errors
      if (error instanceof Error && error.message.includes('Service not found')) {
        res.status(404).json({
          success: false,
          error: 'Service not found',
        });
        return;
      }

      if (error instanceof Error && error.message.includes('Coinbase Commerce')) {
        res.status(502).json({
          success: false,
          error: 'Payment service temporarily unavailable. Please try again.',
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment intent',
      });
    }
  }

  // Booking Deposit Endpoints

  async createBookingDeposit(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = createDepositPaymentSchema.parse(req.body);

      const depositConfig = await bookingPaymentService.getDepositConfiguration();

      const result = await bookingPaymentService.createDepositPayment({
        bookingId: validatedData.bookingId,
        userId,
        depositAmount: depositConfig.amountUSD,
        currency: 'USD',
        redirectUrl: validatedData.redirectUrl,
        cancelUrl: validatedData.cancelUrl,
        useWalletFirst: validatedData.useWalletFirst,
        paymentMethod: validatedData.paymentMethod,
        userAddress: validatedData.userAddress,
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to create booking deposit', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create deposit payment',
      });
    }
  }

  async getBookingPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const status = await bookingPaymentService.getPaymentStatus(bookingId, userId);

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      logger.error('Failed to get payment status', {
        error: error instanceof Error ? error.message : error,
        bookingId: req.params.bookingId,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      });
    }
  }

  async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = cancelBookingSchema.parse(req.body);

      // Determine if user is customer or specialist
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { customerId: true, specialistId: true },
      });

      if (!booking) {
        res.status(404).json({ error: 'Booking not found' });
        return;
      }

      let cancelledBy: 'CUSTOMER' | 'SPECIALIST';
      if (booking.customerId === userId) {
        cancelledBy = 'CUSTOMER';
      } else if (booking.specialistId === userId) {
        cancelledBy = 'SPECIALIST';
      } else {
        res.status(403).json({ error: 'Not authorized to cancel this booking' });
        return;
      }

      const result = await bookingPaymentService.cancelBooking(
        bookingId,
        userId,
        cancelledBy,
        validatedData.reason
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to cancel booking', {
        error: error instanceof Error ? error.message : error,
        bookingId: req.params.bookingId,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to cancel booking',
      });
    }
  }

  // Wallet Endpoints

  async getWalletBalance(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const balance = await walletService.getBalance(userId);

      res.status(200).json({
        success: true,
        data: balance,
      });
    } catch (error) {
      logger.error('Failed to get wallet balance', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get wallet balance',
      });
    }
  }

  async getWalletTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { limit, offset, type, startDate, endDate } = req.query;

      const options = {
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
        type: type as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      };

      const result = await walletService.getTransactionHistory(userId, options);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to get wallet transactions', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        query: req.query,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get wallet transactions',
      });
    }
  }

  async applyWalletToBooking(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { bookingId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { maxAmount } = req.body;

      const result = await walletService.applyWalletToBooking(
        userId,
        bookingId,
        maxAmount ? parseFloat(maxAmount) : undefined
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to apply wallet to booking', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        bookingId: req.params.bookingId,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to apply wallet to booking',
      });
    }
  }

  // Subscription Endpoints

  async getSubscription(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const subscription = await specialistSubscriptionService.getSubscription(userId);

      res.status(200).json({
        success: true,
        data: subscription,
      });
    } catch (error) {
      logger.error('Failed to get subscription', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get subscription',
      });
    }
  }

  async changePlan(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = changePlanSchema.parse(req.body);

      const result = await specialistSubscriptionService.changePlan({
        specialistId: userId,
        newPlanType: validatedData.planType,
        effectiveDate: validatedData.effectiveDate || new Date(),
      });

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      logger.error('Failed to change subscription plan', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to change subscription plan',
      });
    }
  }

  async getSubscriptionAnalytics(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const analytics = await specialistSubscriptionService.getSubscriptionAnalytics(userId);

      res.status(200).json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      logger.error('Failed to get subscription analytics', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get subscription analytics',
      });
    }
  }

  async getAvailablePlans(req: Request, res: Response): Promise<void> {
    try {
      const plans = specialistSubscriptionService.getAvailablePlans();

      res.status(200).json({
        success: true,
        data: plans,
      });
    } catch (error) {
      logger.error('Failed to get available plans', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get available plans',
      });
    }
  }

  // Payment Status Polling

  async getPaymentStatus(req: Request, res: Response): Promise<void> {
    try {
      const { paymentId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Sync with Coinbase Commerce first
      await bookingPaymentService.syncCryptoPaymentStatus(paymentId);

      // Get updated payment status
      const payment = await prisma.cryptoPayment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
        include: {
          booking: {
            select: {
              id: true,
              status: true,
              depositStatus: true,
            },
          },
        },
      });

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          paymentUrl: payment.paymentUrl,
          qrCodeUrl: payment.qrCodeUrl,
          expiresAt: payment.expiresAt,
          confirmedAt: payment.confirmedAt,
          booking: payment.booking,
        },
      });
    } catch (error) {
      logger.error('Failed to get payment status', {
        error: error instanceof Error ? error.message : error,
        paymentId: req.params.paymentId,
        userId: req.user?.id,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get payment status',
      });
    }
  }

  // Webhooks

  async handleCoinbaseWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let webhookEventId: string | undefined;
    let webhookEventType: string | undefined;
    let chargeId: string | undefined;

    try {
      const signature = req.headers['x-cc-webhook-signature'] as string;

      if (!signature) {
        logger.warn('Coinbase webhook received without signature', {
          headers: req.headers,
          userAgent: req.headers['user-agent'],
          ip: req.ip,
        });
        res.status(400).json({ error: 'Missing webhook signature' });
        return;
      }

      // Get raw payload for signature verification
      const payload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const webhookData = req.body;

      // Extract event info for logging
      webhookEventId = webhookData?.event?.id;
      webhookEventType = webhookData?.event?.type;
      chargeId = webhookData?.event?.data?.id;

      logger.info('Processing Coinbase Commerce webhook', {
        eventId: webhookEventId,
        eventType: webhookEventType,
        chargeId,
        attemptNumber: webhookData?.attempt_number,
        timestamp: new Date().toISOString(),
      });

      // Verify webhook signature
      const isValid = coinbaseCommerceService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        logger.error('Invalid Coinbase webhook signature', {
          eventId: webhookEventId,
          eventType: webhookEventType,
          chargeId,
          signature: signature.substring(0, 20) + '...',
          payloadLength: payload.length,
        });
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      // Validate webhook structure
      if (!webhookData.event || !webhookData.event.type || !webhookData.event.data) {
        logger.error('Invalid Coinbase webhook structure', {
          eventId: webhookEventId,
          hasEvent: !!webhookData.event,
          hasType: !!webhookData.event?.type,
          hasData: !!webhookData.event?.data,
          body: JSON.stringify(webhookData),
        });
        res.status(400).json({ error: 'Invalid webhook structure' });
        return;
      }

      // Process the webhook with detailed error handling
      try {
        await coinbaseCommerceService.processWebhook(webhookData);

        const processingTime = Date.now() - startTime;
        logger.info('Coinbase webhook processed successfully', {
          eventId: webhookEventId,
          eventType: webhookEventType,
          chargeId,
          processingTimeMs: processingTime,
          timestamp: new Date().toISOString(),
        });
      } catch (processingError) {
        logger.error('Error during webhook processing', {
          error: processingError instanceof Error ? processingError.message : processingError,
          stack: processingError instanceof Error ? processingError.stack : undefined,
          eventId: webhookEventId,
          eventType: webhookEventType,
          chargeId,
          processingTimeMs: Date.now() - startTime,
        });

        // Still return 200 to prevent Coinbase from retrying if it's a business logic error
        // Only return error for actual technical failures
        if (processingError instanceof Error &&
            (processingError.message.includes('not found') ||
             processingError.message.includes('already processed'))) {
          logger.warn('Webhook processing warning (returning success to prevent retry)', {
            eventId: webhookEventId,
            error: processingError.message,
          });
        } else {
          throw processingError; // Re-throw for actual technical failures
        }
      }

      res.status(200).json({
        received: true,
        eventId: webhookEventId,
        eventType: webhookEventType,
        processingTimeMs: Date.now() - startTime,
      });

    } catch (error) {
      const processingTime = Date.now() - startTime;

      logger.error('Failed to process Coinbase webhook', {
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined,
        eventId: webhookEventId,
        eventType: webhookEventType,
        chargeId,
        headers: {
          'content-type': req.headers['content-type'],
          'user-agent': req.headers['user-agent'],
          'x-cc-webhook-signature': req.headers['x-cc-webhook-signature'] ? 'present' : 'missing',
        },
        bodyType: typeof req.body,
        bodySize: JSON.stringify(req.body).length,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString(),
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid webhook data',
          details: error.errors,
          eventId: webhookEventId,
        });
        return;
      }

      // For webhook failures, we usually want to return 500 so Coinbase retries
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process webhook',
        eventId: webhookEventId,
        processingTimeMs: processingTime,
      });
    }
  }

  // Onramp Endpoints (Fiat-to-Crypto Conversion)

  async getPaymentOptions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = getPaymentOptionsSchema.parse(req.query);

      const options = await bookingPaymentService.getPaymentOptions(
        userId,
        validatedData.amount
      );

      res.status(200).json({
        success: true,
        data: options,
      });
    } catch (error) {
      logger.error('Failed to get payment options', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get payment options',
      });
    }
  }

  async createOnrampSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = createOnrampSessionSchema.parse(req.body);

      const session = await coinbaseOnrampService.createOnrampSession({
        userId,
        userAddress: validatedData.userAddress,
        amount: validatedData.amount,
        currency: validatedData.currency,
        purpose: validatedData.purpose,
        bookingId: validatedData.bookingId,
        metadata: validatedData.metadata,
      });

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Failed to create onramp session', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to create onramp session',
      });
    }
  }

  async getOnrampSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const session = await coinbaseOnrampService.getOnrampSession(sessionId);

      if (!session) {
        res.status(404).json({
          error: 'Onramp session not found',
        });
        return;
      }

      // Verify user owns this session
      if (session.userId !== userId) {
        res.status(403).json({
          error: 'Forbidden - not your session',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (error) {
      logger.error('Failed to get onramp session', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        sessionId: req.params.sessionId,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get onramp session',
      });
    }
  }

  async completeOnrampSession(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { sessionId } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const validatedData = completeOnrampSessionSchema.parse(req.body);

      // First verify the session belongs to this user
      const session = await coinbaseOnrampService.getOnrampSession(sessionId);
      if (!session || session.userId !== userId) {
        res.status(403).json({
          error: 'Forbidden - session not found or not yours',
        });
        return;
      }

      await coinbaseOnrampService.processOnrampCompletion({
        sessionId,
        status: validatedData.status,
        cryptoAmount: validatedData.cryptoAmount,
        cryptoCurrency: validatedData.cryptoCurrency,
        blockchain: validatedData.blockchain,
        transactionHash: validatedData.transactionHash,
        metadata: validatedData.metadata,
      });

      res.status(200).json({
        success: true,
        message: 'Onramp session completed successfully',
      });
    } catch (error) {
      logger.error('Failed to complete onramp session', {
        error: error instanceof Error ? error.message : error,
        userId: req.user?.id,
        sessionId: req.params.sessionId,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid request data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to complete onramp session',
      });
    }
  }

  // Configuration

  async getDepositConfiguration(req: Request, res: Response): Promise<void> {
    try {
      const config = await bookingPaymentService.getDepositConfiguration();

      res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      logger.error('Failed to get deposit configuration', {
        error: error instanceof Error ? error.message : error,
      });

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to get deposit configuration',
      });
    }
  }
}

export const paymentController = new PaymentController();