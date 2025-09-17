import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { coinbaseCommerceService } from './coinbase.service';
import { walletService } from './wallet.service';

export interface CreateDepositPaymentParams {
  bookingId: string;
  userId: string;
  depositAmount: number;
  currency?: string;
  redirectUrl?: string;
  cancelUrl?: string;
  useWalletFirst?: boolean;
}

export interface DepositPaymentResult {
  paymentMethod: 'CRYPTO' | 'WALLET' | 'MIXED';
  cryptoPayment?: {
    id: string;
    paymentUrl: string;
    qrCodeUrl?: string;
    expiresAt: Date;
    amount: number;
  };
  walletTransaction?: {
    id: string;
    amount: number;
  };
  totalPaid: number;
  remainingAmount: number;
  status: 'COMPLETED' | 'PENDING_CRYPTO' | 'FAILED';
}

export class BookingPaymentService {
  // Standard deposit amount in UAH (₴40)
  private readonly DEPOSIT_AMOUNT_UAH = 40;
  private readonly DEPOSIT_AMOUNT_USD = 1; // ~$1 equivalent

  async createDepositPayment(params: CreateDepositPaymentParams): Promise<DepositPaymentResult> {
    const {
      bookingId,
      userId,
      depositAmount,
      currency = 'USD',
      redirectUrl,
      cancelUrl,
      useWalletFirst = true,
    } = params;

    logger.info('Creating deposit payment', {
      bookingId,
      userId,
      depositAmount,
      currency,
      useWalletFirst,
    });

    try {
      // Verify booking exists and user has permission
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          customerId: userId,
          depositStatus: 'PENDING',
        },
        include: {
          service: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found or deposit already paid');
      }

      let totalPaid = 0;
      let remainingAmount = depositAmount;
      let walletTransaction: any = undefined;
      let cryptoPayment: any = undefined;

      // Step 1: Try to use wallet balance first if requested
      if (useWalletFirst && remainingAmount > 0) {
        try {
          const walletResult = await walletService.applyWalletToBooking(
            userId,
            bookingId,
            remainingAmount
          );

          if (walletResult.appliedAmount > 0) {
            totalPaid += walletResult.appliedAmount;
            remainingAmount -= walletResult.appliedAmount;
            walletTransaction = walletResult.transaction;

            logger.info('Wallet balance applied to deposit', {
              bookingId,
              appliedAmount: walletResult.appliedAmount,
              remainingAmount,
            });
          }
        } catch (walletError) {
          logger.warn('Failed to apply wallet balance', {
            bookingId,
            error: walletError instanceof Error ? walletError.message : walletError,
          });
          // Continue with crypto payment for full amount
        }
      }

      // Step 2: Create crypto payment for remaining amount if needed
      if (remainingAmount > 0) {
        const charge = await coinbaseCommerceService.createCharge({
          amount: remainingAmount,
          currency,
          name: `Booking Deposit - ${booking.service.name}`,
          description: `Deposit payment for booking with ${booking.customer.firstName} ${booking.customer.lastName}`,
          metadata: {
            bookingId,
            userId,
            type: 'DEPOSIT',
            originalAmount: depositAmount,
            walletAmountUsed: totalPaid,
          },
          redirectUrl,
          cancelUrl,
        });

        // Create crypto payment record
        cryptoPayment = await prisma.cryptoPayment.create({
          data: {
            userId,
            bookingId,
            coinbaseChargeId: charge.chargeId,
            coinbaseChargeCode: charge.code,
            status: 'PENDING',
            type: 'DEPOSIT',
            amount: remainingAmount,
            currency,
            paymentUrl: charge.paymentUrl,
            qrCodeUrl: charge.qrCodeUrl,
            expiresAt: charge.expiresAt,
            metadata: JSON.stringify({
              bookingId,
              depositAmount,
              walletAmountUsed: totalPaid,
            }),
          },
        });

        logger.info('Crypto payment created for deposit', {
          bookingId,
          cryptoPaymentId: cryptoPayment.id,
          amount: remainingAmount,
          chargeId: charge.chargeId,
        });
      }

      // Determine payment method and status
      let paymentMethod: 'CRYPTO' | 'WALLET' | 'MIXED';
      let status: 'COMPLETED' | 'PENDING_CRYPTO' | 'FAILED';

      if (totalPaid === depositAmount) {
        // Fully paid with wallet
        paymentMethod = 'WALLET';
        status = 'COMPLETED';

        // Update booking status
        await prisma.booking.update({
          where: { id: bookingId },
          data: {
            depositStatus: 'PAID',
            depositPaidAt: new Date(),
            status: 'CONFIRMED',
          },
        });
      } else if (totalPaid === 0) {
        // Fully crypto payment
        paymentMethod = 'CRYPTO';
        status = 'PENDING_CRYPTO';
      } else {
        // Mixed payment
        paymentMethod = 'MIXED';
        status = 'PENDING_CRYPTO';
      }

      const result: DepositPaymentResult = {
        paymentMethod,
        totalPaid,
        remainingAmount,
        status,
        ...(cryptoPayment && {
          cryptoPayment: {
            id: cryptoPayment.id,
            paymentUrl: cryptoPayment.paymentUrl,
            qrCodeUrl: cryptoPayment.qrCodeUrl,
            expiresAt: cryptoPayment.expiresAt,
            amount: cryptoPayment.amount,
          },
        }),
        ...(walletTransaction && {
          walletTransaction: {
            id: walletTransaction.id,
            amount: walletTransaction.amount,
          },
        }),
      };

      logger.info('Deposit payment created successfully', {
        bookingId,
        paymentMethod,
        totalPaid,
        remainingAmount,
        status,
      });

      return result;
    } catch (error) {
      logger.error('Failed to create deposit payment', {
        bookingId,
        userId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async getPaymentStatus(bookingId: string, userId: string): Promise<{
    depositStatus: string;
    totalAmount: number;
    paidAmount: number;
    walletAmountUsed: number;
    remainingAmount: number;
    cryptoPayments: any[];
    walletTransactions: any[];
  }> {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        customerId: userId,
      },
      select: {
        depositStatus: true,
        depositAmount: true,
        walletAmountUsed: true,
        cryptoPayments: {
          where: { type: 'DEPOSIT' },
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            paymentUrl: true,
            qrCodeUrl: true,
            expiresAt: true,
            confirmedAt: true,
            createdAt: true,
          },
        },
        walletTransactions: {
          where: { reason: 'BOOKING_PAYMENT' },
          select: {
            id: true,
            type: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    const paidCryptoAmount = booking.cryptoPayments
      .filter(p => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const paidAmount = booking.walletAmountUsed + paidCryptoAmount;
    const remainingAmount = Math.max(0, booking.depositAmount - paidAmount);

    return {
      depositStatus: booking.depositStatus,
      totalAmount: booking.depositAmount,
      paidAmount,
      walletAmountUsed: booking.walletAmountUsed,
      remainingAmount,
      cryptoPayments: booking.cryptoPayments,
      walletTransactions: booking.walletTransactions,
    };
  }

  async cancelBooking(
    bookingId: string,
    userId: string,
    cancelledBy: 'CUSTOMER' | 'SPECIALIST',
    reason?: string
  ): Promise<{
    success: boolean;
    refundAmount?: number;
    forfeitureAmount?: number;
    message: string;
  }> {
    logger.info('Processing booking cancellation', {
      bookingId,
      userId,
      cancelledBy,
      reason,
    });

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true } },
          specialist: { select: { id: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Check permissions
      if (cancelledBy === 'CUSTOMER' && booking.customerId !== userId) {
        throw new Error('Only the customer can cancel their own booking');
      }
      if (cancelledBy === 'SPECIALIST' && booking.specialistId !== userId) {
        throw new Error('Only the specialist can cancel their own booking');
      }

      if (booking.status === 'CANCELLED') {
        return {
          success: false,
          message: 'Booking is already cancelled',
        };
      }

      const now = new Date();
      const scheduledTime = new Date(booking.scheduledAt);
      const hoursUntilBooking = (scheduledTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      let refundAmount = 0;
      let forfeitureAmount = 0;

      // Handle deposit based on cancellation rules
      if (booking.depositStatus === 'PAID') {
        if (cancelledBy === 'CUSTOMER') {
          // Customer cancels - deposit forfeited
          forfeitureAmount = booking.depositAmount;
          const forfeitureResult = await walletService.handleDepositForfeiture(bookingId);
          logger.info('Customer cancellation - deposit forfeited', {
            bookingId,
            forfeitureAmount,
            platformAmount: forfeitureResult.platformAmount,
            specialistAmount: forfeitureResult.specialistAmount,
          });
        } else {
          // Specialist cancels - full refund to customer wallet
          refundAmount = booking.depositAmount;
          await walletService.handleDepositRefund(
            bookingId,
            `Specialist cancellation: ${reason || 'No reason provided'}`
          );
          logger.info('Specialist cancellation - deposit refunded', {
            bookingId,
            refundAmount,
          });
        }
      }

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED',
          cancelledAt: now,
          cancelledBy: cancelledBy === 'CUSTOMER' ? booking.customerId : booking.specialistId,
          cancellationReason: reason,
          refundAmount,
        },
      });

      const message = cancelledBy === 'CUSTOMER'
        ? `Booking cancelled. Deposit of ${booking.depositAmount} has been forfeited (50% to platform, 50% to specialist).`
        : `Booking cancelled by specialist. Deposit of ${booking.depositAmount} has been refunded to your wallet.`;

      logger.info('Booking cancellation processed', {
        bookingId,
        cancelledBy,
        refundAmount,
        forfeitureAmount,
        hoursUntilBooking,
      });

      return {
        success: true,
        refundAmount,
        forfeitureAmount,
        message,
      };
    });
  }

  async processCompletedBooking(bookingId: string): Promise<{
    success: boolean;
    platformFee: number;
    specialistAmount: number;
  }> {
    logger.info('Processing completed booking deposit', { bookingId });

    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          specialist: { select: { id: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.status !== 'COMPLETED') {
        throw new Error('Booking is not completed');
      }

      if (booking.depositStatus !== 'PAID') {
        throw new Error('Deposit was not paid');
      }

      // Platform keeps the full deposit as fee (configurable)
      const platformFee = booking.depositAmount;
      const specialistAmount = 0; // For now, platform keeps all deposit

      // Update booking to reflect deposit processing
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          // Could add additional fields to track deposit fee processing
        },
      });

      logger.info('Completed booking deposit processed as platform fee', {
        bookingId,
        platformFee,
        specialistAmount,
      });

      return {
        success: true,
        platformFee,
        specialistAmount,
      };
    });
  }

  async syncCryptoPaymentStatus(cryptoPaymentId: string): Promise<void> {
    await coinbaseCommerceService.syncPaymentStatus(cryptoPaymentId);
  }

  async getDepositConfiguration(): Promise<{
    amountUAH: number;
    amountUSD: number;
    currency: string;
    description: string;
  }> {
    return {
      amountUAH: this.DEPOSIT_AMOUNT_UAH,
      amountUSD: this.DEPOSIT_AMOUNT_USD,
      currency: 'USD',
      description: 'Booking deposit to secure your appointment',
    };
  }

  async retryFailedPayment(cryptoPaymentId: string): Promise<DepositPaymentResult> {
    const cryptoPayment = await prisma.cryptoPayment.findUnique({
      where: { id: cryptoPaymentId },
      include: {
        booking: true,
      },
    });

    if (!cryptoPayment) {
      throw new Error('Crypto payment not found');
    }

    if (cryptoPayment.status !== 'FAILED' && cryptoPayment.status !== 'EXPIRED') {
      throw new Error('Payment is not in a retryable state');
    }

    if (!cryptoPayment.booking) {
      throw new Error('Associated booking not found');
    }

    // Create a new payment for the same booking
    return this.createDepositPayment({
      bookingId: cryptoPayment.bookingId!,
      userId: cryptoPayment.userId,
      depositAmount: cryptoPayment.amount,
      currency: cryptoPayment.currency,
      useWalletFirst: true,
    });
  }
}

export const bookingPaymentService = new BookingPaymentService();