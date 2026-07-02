import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { num } from '@/utils/money';

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

      // Atomic credit: increment so two concurrent top-ups can't lose one via an
      // absolute read-then-write. walletBalance is a Prisma Decimal — coerce with
      // Number() for the ledger snapshot or `+` concatenates.
      const updated = await tx.user.update({
        where: { id: data.userId },
        data: { walletBalance: { increment: Number(data.amount) } },
        select: { walletBalance: true },
      });
      const newBalance = Number(updated.walletBalance);
      const balanceBefore = newBalance - Number(data.amount);

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
      // Atomic, race-safe debit: decrement ONLY if the balance still covers it.
      // A read-then-write let two concurrent debits both pass the check and both
      // write an absolute balance → lost debit / negative balance. The guard in
      // the WHERE makes this a compare-and-set under a row lock.
      const result = await tx.user.updateMany({
        where: { id: data.userId, walletBalance: { gte: data.amount } },
        data: { walletBalance: { decrement: data.amount } },
      });

      if (result.count === 0) {
        const exists = await tx.user.findUnique({
          where: { id: data.userId },
          select: { id: true },
        });
        throw new Error(exists ? 'Insufficient wallet balance' : 'User not found');
      }

      // Re-read the post-decrement balance for the ledger snapshot.
      // walletBalance is a Prisma Decimal — coerce with Number() or `+` concatenates.
      const user = await tx.user.findUnique({
        where: { id: data.userId },
        select: { walletBalance: true, walletCurrency: true },
      });
      const newBalance = Number(user!.walletBalance);
      const balanceBefore = newBalance + Number(data.amount);

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
          select: { depositAmount: true, walletAmountUsed: true, customerId: true },
        }),
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      if (!booking) {
        throw new Error('Booking not found');
      }

      // SECURITY: only the booking's own customer may apply their wallet to it —
      // otherwise anyone could force-confirm a stranger's booking (IDOR).
      if (booking.customerId !== userId) {
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

      // Deduct from wallet and update the booking atomically using the SAME tx
      // client. Calling this.deductFunds() here would open a second
      // prisma.$transaction, which Prisma runs on a separate connection — the
      // inner debit would commit even if the booking.update below fails,
      // silently destroying the customer's balance.
      const balanceBefore = num(user.walletBalance);
      const newBalance = balanceBefore - appliedAmount;

      const transaction = await tx.walletTransaction.create({
        data: {
          userId,
          bookingId,
          type: 'DEBIT',
          amount: appliedAmount,
          currency: user.walletCurrency,
          balanceBefore,
          balanceAfter: newBalance,
          reason: 'BOOKING_PAYMENT',
          description: 'Applied wallet balance to booking deposit',
          referenceId: bookingId,
          referenceType: 'BOOKING',
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: newBalance },
      });

      // Update booking with wallet amount used
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          walletAmountUsed: num(booking.walletAmountUsed) + num(appliedAmount),
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

  async applyGiftCardToBooking(
    userId: string,
    bookingId: string,
    code: string
  ): Promise<{
    appliedAmount: number;
    remainingCardBalance: number;
    transaction?: Record<string, unknown>;
  }> {
    return await prisma.$transaction(async (tx) => {
      // Look up the booking (customer-scoped)
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, customerId: userId },
        select: { depositAmount: true, walletAmountUsed: true, giftCardAmountUsed: true, depositCurrency: true, depositStatus: true },
      });

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Guard: only apply when there is actually an amount due
      const totalApplied = num(booking.walletAmountUsed) + num(booking.giftCardAmountUsed);
      const amountDue = num(booking.depositAmount) - totalApplied;

      if (amountDue <= 0) {
        return { appliedAmount: 0, remainingCardBalance: 0 };
      }

      // Look up the gift card by code
      const cardRaw = await tx.giftCard.findUnique({
        where: { code: code.trim() },
        select: { id: true, balance: true, status: true, currency: true, expiresAt: true, ownerId: true },
      });

      if (!cardRaw) {
        throw new Error('Gift card not found');
      }

      if (cardRaw.status !== 'ACTIVE') {
        throw new Error(`Gift card is ${cardRaw.status.toLowerCase()}`);
      }

      if (cardRaw.expiresAt && cardRaw.expiresAt < new Date()) {
        await tx.giftCard.update({ where: { id: cardRaw.id }, data: { status: 'EXPIRED' } });
        throw new Error('Gift card has expired');
      }

      // Idempotency guard — check if this card was already applied to this booking
      const alreadyApplied = await tx.giftCardTransaction.findFirst({
        where: { giftCardId: cardRaw.id, bookingId, reason: 'REDEEM' },
      });

      if (alreadyApplied) {
        return {
          appliedAmount: 0,
          remainingCardBalance: num(cardRaw.balance),
        };
      }

      const cardBalance = num(cardRaw.balance);
      if (cardBalance <= 0) {
        throw new Error('Gift card has no remaining balance');
      }

      // Apply min(balance, amountDue) — gift card first, then wallet covers the rest
      const appliedAmount = Math.min(cardBalance, amountDue);
      const newCardBalance = cardBalance - appliedAmount;

      // Decrement card balance, flip to REDEEMED if zero
      await tx.giftCard.update({
        where: { id: cardRaw.id },
        data: {
          balance: { decrement: appliedAmount },
          status: newCardBalance <= 0 ? 'REDEEMED' : 'ACTIVE',
        },
      });

      // Write REDEEM gift card transaction (negative = redeemed, mirroring SalesService.redeemGiftCard)
      const transaction = await tx.giftCardTransaction.create({
        data: {
          giftCardId: cardRaw.id,
          amount: -appliedAmount,
          reason: 'REDEEM',
          bookingId,
        },
      });

      // Record applied amount on the booking
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          giftCardAmountUsed: num(booking.giftCardAmountUsed) + appliedAmount,
        },
      });

      logger.info('Gift card applied to booking', {
        userId,
        bookingId,
        giftCardId: cardRaw.id,
        code,
        appliedAmount,
        remainingCardBalance: newCardBalance,
      });

      return {
        appliedAmount,
        remainingCardBalance: newCardBalance,
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
      .reduce((sum, s) => sum + num(s._sum.amount), 0);

    const debits = summary
      .filter(s => s.type === 'DEBIT')
      .reduce((sum, s) => sum + num(s._sum.amount), 0);

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