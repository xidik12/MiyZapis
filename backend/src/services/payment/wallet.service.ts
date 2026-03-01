import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

export interface WalletTransactionData {
  userId: string;
  amount: number;
  currency?: string;
  type: 'CREDIT' | 'DEBIT' | 'REFUND' | 'FORFEITURE_SPLIT';
  reason: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  bookingId?: string;
}

export class WalletService {
  async getBalance(userId: string): Promise<{ balance: number; currency: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true, walletCurrency: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return {
      balance: user.walletBalance,
      currency: user.walletCurrency,
    };
  }

  async addFunds(data: WalletTransactionData): Promise<{
    transaction: Record<string, unknown>;
    newBalance: number;
  }> {
    if (data.type !== 'CREDIT' && data.type !== 'REFUND') {
      throw new Error('Invalid transaction type for adding funds');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { walletBalance: true, walletCurrency: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = user.walletBalance;
      const newBalance = balanceBefore + data.amount;

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: data.userId,
          bookingId: data.bookingId,
          type: data.type,
          amount: data.amount,
          currency: data.currency || user.walletCurrency,
          balanceBefore,
          balanceAfter: newBalance,
          reason: data.reason,
          description: data.description,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: data.userId },
        data: { walletBalance: newBalance },
      });

      logger.info('Wallet funds added', {
        userId: data.userId,
        amount: data.amount,
        newBalance,
        transactionId: transaction.id,
        reason: data.reason,
      });

      return { transaction, newBalance };
    });
  }

  async deductFunds(data: WalletTransactionData): Promise<{
    transaction: Record<string, unknown>;
    newBalance: number;
  }> {
    if (data.type !== 'DEBIT') {
      throw new Error('Invalid transaction type for deducting funds');
    }

    if (data.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { walletBalance: true, walletCurrency: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const balanceBefore = user.walletBalance;

      if (balanceBefore < data.amount) {
        throw new Error('Insufficient wallet balance');
      }

      const newBalance = balanceBefore - data.amount;

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          userId: data.userId,
          bookingId: data.bookingId,
          type: data.type,
          amount: data.amount,
          currency: data.currency || user.walletCurrency,
          balanceBefore,
          balanceAfter: newBalance,
          reason: data.reason,
          description: data.description,
          referenceId: data.referenceId,
          referenceType: data.referenceType,
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      // Update user balance
      await tx.user.update({
        where: { id: data.userId },
        data: { walletBalance: newBalance },
      });

      logger.info('Wallet funds deducted', {
        userId: data.userId,
        amount: data.amount,
        newBalance,
        transactionId: transaction.id,
        reason: data.reason,
      });

      return { transaction, newBalance };
    });
  }

  async getTransactionHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{
    transactions: Record<string, unknown>[];
    total: number;
    balance: number;
  }> {
    const { limit = 50, offset = 0, type, startDate, endDate } = options;

    const where: Record<string, unknown> = { userId };

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [transactions, total, user] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          booking: {
            select: {
              id: true,
              scheduledAt: true,
              service: {
                select: { name: true },
              },
            },
          },
        },
      }),
      prisma.walletTransaction.count({ where }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true },
      }),
    ]);

    return {
      transactions,
      total,
      balance: user?.walletBalance || 0,
    };
  }

  async transferFunds(fromUserId: string, toUserId: string, amount: number, reason: string): Promise<{
    fromTransaction: Record<string, unknown>;
    toTransaction: Record<string, unknown>;
  }> {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }

    return await prisma.$transaction(async (tx) => {
      // Deduct from sender
      const fromResult = await this.deductFunds({
        userId: fromUserId,
        amount,
        type: 'DEBIT',
        reason: `Transfer to user: ${reason}`,
        referenceId: toUserId,
        referenceType: 'USER_TRANSFER',
      });

      // Add to recipient
      const toResult = await this.addFunds({
        userId: toUserId,
        amount,
        type: 'CREDIT',
        reason: `Transfer from user: ${reason}`,
        referenceId: fromUserId,
        referenceType: 'USER_TRANSFER',
      });

      logger.info('Wallet funds transferred', {
        fromUserId,
        toUserId,
        amount,
        reason,
      });

      return {
        fromTransaction: fromResult.transaction,
        toTransaction: toResult.transaction,
      };
    });
  }

  async applyWalletToBooking(
    userId: string,
    bookingId: string,
    maxAmount?: number
  ): Promise<{
    appliedAmount: number;
    remainingBalance: number;
    transaction?: Record<string, unknown>;
  }> {
    return await prisma.$transaction(async (tx) => {
      const [user, booking] = await Promise.all([
        tx.user.findUnique({
          where: { id: userId },
          select: { walletBalance: true, walletCurrency: true },
        }),
        tx.booking.findUnique({
          where: { id: bookingId },
          select: { depositAmount: true, walletAmountUsed: true },
        }),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      const availableBalance = user.walletBalance;
      const remainingDeposit = booking.depositAmount - booking.walletAmountUsed;
      const requestedAmount = maxAmount || remainingDeposit;

      // Calculate how much we can actually apply
      const appliedAmount = Math.min(availableBalance, requestedAmount, remainingDeposit);

      if (appliedAmount <= 0) {
        return {
          appliedAmount: 0,
          remainingBalance: availableBalance,
        };
      }

      // Deduct from wallet
      const { transaction, newBalance } = await this.deductFunds({
        userId,
        bookingId,
        amount: appliedAmount,
        type: 'DEBIT',
        reason: 'BOOKING_PAYMENT',
        description: `Applied wallet balance to booking deposit`,
        referenceId: bookingId,
        referenceType: 'BOOKING',
      });

      // Update booking with wallet amount used
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          walletAmountUsed: booking.walletAmountUsed + appliedAmount,
        },
      });

      logger.info('Wallet balance applied to booking', {
        userId,
        bookingId,
        appliedAmount,
        remainingBalance: newBalance,
      });

      return {
        appliedAmount,
        remainingBalance: newBalance,
        transaction,
      };
    });
  }

  // Handle deposit forfeiture splits (50% to platform, 50% to specialist)
  async handleDepositForfeiture(bookingId: string): Promise<{
    platformAmount: number;
    specialistAmount: number;
    specialistTransaction?: Record<string, unknown>;
  }> {
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

      if (booking.depositStatus !== 'PAID') {
        throw new Error('Deposit was not paid, cannot forfeit');
      }

      const forfeitureAmount = booking.depositAmount;
      const platformAmount = forfeitureAmount * 0.5;
      const specialistAmount = forfeitureAmount * 0.5;

      // Credit specialist with their 50% share
      const { transaction: specialistTransaction } = await this.addFunds({
        userId: booking.specialist.id,
        bookingId,
        amount: specialistAmount,
        type: 'CREDIT',
        reason: 'DEPOSIT_FORFEITURE_SPLIT',
        description: `50% of forfeited deposit from cancelled booking`,
        referenceId: bookingId,
        referenceType: 'BOOKING',
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          depositStatus: 'FORFEITED',
        },
      });

      logger.info('Deposit forfeiture processed', {
        bookingId,
        customerId: booking.customer.id,
        specialistId: booking.specialist.id,
        forfeitureAmount,
        platformAmount,
        specialistAmount,
      });

      return {
        platformAmount,
        specialistAmount,
        specialistTransaction,
      };
    });
  }

  // Handle deposit refund (full refund to customer)
  async handleDepositRefund(bookingId: string, reason: string): Promise<{
    refundAmount: number;
    transaction: Record<string, unknown>;
  }> {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true } },
        },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      if (booking.depositStatus !== 'PAID') {
        throw new Error('Deposit was not paid, cannot refund');
      }

      const refundAmount = booking.depositAmount;

      // Credit customer with full refund
      const { transaction } = await this.addFunds({
        userId: booking.customer.id,
        bookingId,
        amount: refundAmount,
        type: 'REFUND',
        reason: 'DEPOSIT_REFUND',
        description: reason,
        referenceId: bookingId,
        referenceType: 'BOOKING',
      });

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          depositStatus: 'REFUNDED',
          depositRefundedAt: new Date(),
        },
      });

      logger.info('Deposit refunded to customer wallet', {
        bookingId,
        customerId: booking.customer.id,
        refundAmount,
        reason,
      });

      return {
        refundAmount,
        transaction,
      };
    });
  }

  async validateSufficientFunds(userId: string, amount: number): Promise<boolean> {
    const balance = await this.getBalance(userId);
    return balance.balance >= amount;
  }

  async getWalletSummary(userId: string): Promise<{
    balance: number;
    currency: string;
    totalCredits: number;
    totalDebits: number;
    pendingTransactions: number;
    lastTransactionAt?: Date;
  }> {
    const [user, summary] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { walletBalance: true, walletCurrency: true },
      }),
      prisma.walletTransaction.groupBy({
        by: ['type'],
        where: { userId },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    const lastTransaction = await prisma.walletTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });

    const pending = await prisma.walletTransaction.count({
      where: { userId, status: 'PENDING' },
    });

    const credits = summary
      .filter(s => ['CREDIT', 'REFUND'].includes(s.type))
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    const debits = summary
      .filter(s => s.type === 'DEBIT')
      .reduce((sum, s) => sum + (s._sum.amount || 0), 0);

    return {
      balance: user.walletBalance,
      currency: user.walletCurrency,
      totalCredits: credits,
      totalDebits: debits,
      pendingTransactions: pending,
      lastTransactionAt: lastTransaction?.createdAt,
    };
  }
}

export const walletService = new WalletService();