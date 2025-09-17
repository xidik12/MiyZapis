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
    try {
      const signature = req.headers['x-cc-webhook-signature'] as string;

      if (!signature) {
        res.status(400).json({ error: 'Missing webhook signature' });
        return;
      }

      const payload = JSON.stringify(req.body);

      // Verify webhook signature
      const isValid = coinbaseCommerceService.verifyWebhookSignature(payload, signature);
      if (!isValid) {
        res.status(401).json({ error: 'Invalid webhook signature' });
        return;
      }

      const webhookData = req.body;

      // Validate webhook structure
      if (!webhookData.event || !webhookData.event.type || !webhookData.event.data) {
        res.status(400).json({ error: 'Invalid webhook structure' });
        return;
      }

      // Process the webhook
      await coinbaseCommerceService.processWebhook(webhookData);

      res.status(200).json({ received: true });
    } catch (error) {
      logger.error('Failed to process Coinbase webhook', {
        error: error instanceof Error ? error.message : error,
        headers: req.headers,
        body: req.body,
      });

      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: 'Invalid webhook data',
          details: error.errors,
        });
        return;
      }

      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to process webhook',
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