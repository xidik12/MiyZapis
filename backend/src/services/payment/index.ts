import { Payment, Booking } from '@prisma/client';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { prisma } from '@/config/database';

interface PaymentIntentData {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethodType?: string;
  customerId?: string;
  metadata?: Record<string, string>;
}

interface RefundData {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export class PaymentService {
  // Create a mock payment intent for development (when Stripe is not configured)
  static async createPaymentIntent(data: PaymentIntentData): Promise<any> {
    try {
      const { bookingId, amount, currency, paymentMethodType = 'card', customerId, metadata = {} } = data;

      // Get booking details
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: true,
          specialist: true,
          service: true,
        },
      });

      if (!booking) {
        throw new Error('BOOKING_NOT_FOUND');
      }

      // Verify booking belongs to customer
      if (customerId && booking.customerId !== customerId) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Check if booking already has a successful payment
      const existingPayment = await prisma.payment.findFirst({
        where: {
          bookingId,
          status: { in: ['SUCCEEDED', 'PROCESSING'] },
        },
      });

      if (existingPayment) {
        throw new Error('PAYMENT_ALREADY_EXISTS');
      }

      // For development without Stripe, create a mock payment intent
      const paymentIntentId = `pi_mock_${Date.now()}`;
      const clientSecret = `${paymentIntentId}_secret_mock`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          userId: booking.customerId,
          bookingId,
          status: 'PENDING',
          type: amount === booking.totalAmount ? 'FULL_PAYMENT' : 'DEPOSIT',
          amount,
          currency,
          stripePaymentIntentId: paymentIntentId,
          paymentMethodType,
          metadata: JSON.stringify(metadata),
        },
      });

      logger.info('Mock payment intent created', {
        paymentId: payment.id,
        bookingId,
        amount,
      });

      return {
        paymentId: payment.id,
        clientSecret,
        stripePaymentIntentId: paymentIntentId,
        amount,
        currency,
      };
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      throw error;
    }
  }

  // Confirm payment (mock implementation for development)
  static async confirmPayment(paymentIntentId: string): Promise<Payment> {
    try {
      // Find payment record
      const payment = await prisma.payment.findFirst({
        where: { stripePaymentIntentId: paymentIntentId },
        include: {
          booking: {
            include: {
              customer: true,
              specialist: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      // Mock successful payment
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCEEDED',
          updatedAt: new Date(),
        },
        include: {
          booking: {
            include: {
              customer: true,
              specialist: true,
              service: true,
            },
          },
        },
      });

      // Handle successful payment
      await PaymentService.handleSuccessfulPayment(updatedPayment);

      logger.info('Payment confirmed successfully', { paymentId: payment.id });

      return updatedPayment;
    } catch (error) {
      logger.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Handle successful payment side effects
  private static async handleSuccessfulPayment(payment: Payment & { booking: any }): Promise<void> {
    try {
      const { booking } = payment;

      // Update booking status
      let newBookingStatus = booking.status;

      if (payment.type === 'FULL_PAYMENT') {
        newBookingStatus = 'CONFIRMED';
      } else if (payment.type === 'DEPOSIT') {
        newBookingStatus = 'PENDING_PAYMENT';
      }

      await prisma.booking.update({
        where: { id: booking.id },
        data: { status: newBookingStatus },
      });

      // Award loyalty points (5% of payment amount)
      const loyaltyPoints = Math.floor(payment.amount * 0.05);
      if (loyaltyPoints > 0) {
        await prisma.user.update({
          where: { id: booking.customerId },
          data: {
            loyaltyPoints: { increment: loyaltyPoints },
          },
        });

        await prisma.loyaltyTransaction.create({
          data: {
            userId: booking.customerId,
            type: 'EARNED',
            points: loyaltyPoints,
            reason: 'Booking payment',
            description: `Earned ${loyaltyPoints} points for booking payment`,
            referenceId: booking.id,
          },
        });
      }

      logger.info('Payment processed successfully', {
        paymentId: payment.id,
        bookingId: booking.id,
        amount: payment.amount,
        currency: payment.currency,
      });
    } catch (error) {
      logger.error('Error handling successful payment:', error);
      throw error;
    }
  }

  // Get payment details
  static async getPaymentDetails(paymentId: string, userId: string): Promise<Payment | null> {
    try {
      return await prisma.payment.findFirst({
        where: {
          id: paymentId,
          userId,
        },
        include: {
          booking: {
            include: {
              service: {
                select: {
                  name: true,
                  duration: true,
                },
              },
              specialist: {
                select: {
                  businessName: true,
                  user: {
                    select: {
                      firstName: true,
                      lastName: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    } catch (error) {
      logger.error('Error getting payment details:', error);
      throw error;
    }
  }

  // Get user payments with pagination
  static async getUserPayments(
    userId: string,
    filters: {
      status?: string;
      type?: string;
      fromDate?: Date;
      toDate?: Date;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const { status, type, fromDate, toDate, page = 1, limit = 20 } = filters;

      const skip = (page - 1) * limit;

      const where: any = { userId };
      if (status) where.status = status;
      if (type) where.type = type;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      const [payments, total] = await Promise.all([
        prisma.payment.findMany({
          where,
          include: {
            booking: {
              include: {
                service: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.payment.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        payments,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting user payments:', error);
      throw error;
    }
  }

  // Get specialist earnings
  static async getSpecialistEarnings(
    specialistId: string,
    filters: {
      fromDate?: Date;
      toDate?: Date;
    } = {}
  ): Promise<{
    totalEarnings: number;
    totalTransactions: number;
    payments: Payment[];
    currency: string;
  }> {
    try {
      const { fromDate, toDate } = filters;

      const where: any = {
        booking: { specialistId },
        status: 'SUCCEEDED',
        type: { in: ['FULL_PAYMENT', 'DEPOSIT'] },
      };

      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      // Get total earnings
      const totalEarnings = await prisma.payment.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      });

      // Get recent payments
      const payments = await prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              service: {
                select: {
                  name: true,
                },
              },
              customer: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      return {
        totalEarnings: totalEarnings._sum.amount || 0,
        totalTransactions: totalEarnings._count,
        payments,
        currency: payments[0]?.currency || 'USD',
      };
    } catch (error) {
      logger.error('Error getting specialist earnings:', error);
      throw error;
    }
  }

  // Process refund (mock implementation)
  static async processRefund(data: RefundData): Promise<any> {
    try {
      const { paymentId, amount, reason = 'Refund requested' } = data;

      // Get payment details
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              customer: true,
              service: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error('PAYMENT_NOT_FOUND');
      }

      if (payment.status !== 'SUCCEEDED') {
        throw new Error('CANNOT_REFUND_UNSUCCESSFUL_PAYMENT');
      }

      // Calculate refund amount
      const refundAmount = amount || payment.amount;

      if (refundAmount > payment.amount) {
        throw new Error('REFUND_AMOUNT_EXCEEDS_PAYMENT');
      }

      // Create refund payment record
      const refundPayment = await prisma.payment.create({
        data: {
          userId: payment.userId,
          bookingId: payment.bookingId,
          status: 'SUCCEEDED',
          type: 'REFUND',
          amount: -refundAmount, // Negative amount for refund
          currency: payment.currency,
          metadata: JSON.stringify({ reason, originalPaymentId: payment.id }),
        },
      });

      // Update booking status if full refund
      if (payment.bookingId && refundAmount === payment.amount) {
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: 'REFUNDED' },
        });
      }

      logger.info('Refund processed successfully', {
        paymentId: payment.id,
        refundPaymentId: refundPayment.id,
        refundAmount,
      });

      return {
        refundId: refundPayment.id,
        amount: refundAmount,
        currency: payment.currency,
        status: 'SUCCEEDED',
      };
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw error;
    }
  }
}