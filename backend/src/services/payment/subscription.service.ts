import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { coinbaseCommerceService } from './coinbase.service';

export interface SubscriptionPlan {
  type: 'PAY_PER_USE' | 'MONTHLY_SUBSCRIPTION';
  monthlyRate: number;
  transactionFee: number;
  currency: string;
  description: string;
  features: string[];
}

export interface SubscriptionChangeRequest {
  specialistId: string;
  newPlanType: 'PAY_PER_USE' | 'MONTHLY_SUBSCRIPTION';
  effectiveDate: Date;
}

export class SpecialistSubscriptionService {
  private readonly PLANS: Record<string, SubscriptionPlan> = {
    PAY_PER_USE: {
      type: 'PAY_PER_USE',
      monthlyRate: 0,
      transactionFee: 20, // 20₴ per transaction
      currency: 'UAH',
      description: 'Pay per transaction - 20₴ per booking',
      features: [
        '20₴ fee per successful booking',
        'No monthly commitment',
        'Perfect for occasional specialists',
      ],
    },
    MONTHLY_SUBSCRIPTION: {
      type: 'MONTHLY_SUBSCRIPTION',
      monthlyRate: 10, // $10/month
      transactionFee: 0,
      currency: 'USD',
      description: 'Monthly subscription - $10/month unlimited bookings',
      features: [
        '$10 per month flat rate',
        'Unlimited bookings',
        'No per-transaction fees',
        'Best for active specialists',
      ],
    },
  };

  async getSubscription(specialistId: string): Promise<any> {
    let subscription = await prisma.specialistSubscription.findFirst({
      where: { specialistId },
    });

    // Create default subscription if none exists
    if (!subscription) {
      subscription = await this.createDefaultSubscription(specialistId);
    }

    return {
      ...subscription,
      plan: this.PLANS[subscription.planType],
    };
  }

  async createDefaultSubscription(specialistId: string): Promise<any> {
    logger.info('Creating default subscription for specialist', { specialistId });

    const subscription = await prisma.specialistSubscription.create({
      data: {
        specialistId,
        planType: 'PAY_PER_USE',
        status: 'ACTIVE',
        monthlyRate: this.PLANS.PAY_PER_USE.monthlyRate,
        currency: this.PLANS.PAY_PER_USE.currency,
        transactionFee: this.PLANS.PAY_PER_USE.transactionFee,
        currentMonthTransactions: 0,
        currentMonthFees: 0,
        paymentFailures: 0,
      },
    });

    // Update user subscription fields
    await prisma.user.update({
      where: { id: specialistId },
      data: {
        subscriptionStatus: 'PAY_PER_USE',
        subscriptionEffectiveDate: new Date(),
      },
    });

    logger.info('Default subscription created', {
      specialistId,
      subscriptionId: subscription.id,
      planType: subscription.planType,
    });

    return subscription;
  }

  async changePlan(request: SubscriptionChangeRequest): Promise<{
    success: boolean;
    message: string;
    effectiveDate: Date;
    currentPlan: string;
    newPlan: string;
  }> {
    const { specialistId, newPlanType, effectiveDate } = request;

    logger.info('Processing subscription plan change', {
      specialistId,
      newPlanType,
      effectiveDate,
    });

    const subscription = await this.getSubscription(specialistId);

    if (subscription.planType === newPlanType) {
      return {
        success: false,
        message: 'Already on the requested plan',
        effectiveDate: subscription.currentPeriodStart || new Date(),
        currentPlan: subscription.planType,
        newPlan: newPlanType,
      };
    }

    // Check if change is for next month or immediate
    const now = new Date();
    const isImmediate = effectiveDate <= now;

    if (isImmediate) {
      // Immediate change (only allowed for downgrades or special cases)
      await this.applyPlanChange(specialistId, newPlanType);

      return {
        success: true,
        message: 'Plan changed immediately',
        effectiveDate: now,
        currentPlan: subscription.planType,
        newPlan: newPlanType,
      };
    } else {
      // Schedule change for next billing period
      const subscription = await prisma.specialistSubscription.findFirst({
        where: { specialistId },
      });

      if (subscription) {
        await prisma.specialistSubscription.update({
          where: { id: subscription.id },
          data: {
            pendingPlanType: newPlanType,
            planChangeEffectiveDate: effectiveDate,
          },
        });
      }

      return {
        success: true,
        message: `Plan change scheduled for ${effectiveDate.toDateString()}`,
        effectiveDate,
        currentPlan: subscription.planType,
        newPlan: newPlanType,
      };
    }
  }

  private async applyPlanChange(specialistId: string, newPlanType: 'PAY_PER_USE' | 'MONTHLY_SUBSCRIPTION'): Promise<void> {
    const newPlan = this.PLANS[newPlanType];
    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // Find and update subscription
      const subscription = await tx.specialistSubscription.findFirst({
        where: { specialistId },
      });

      if (!subscription) return;

      await tx.specialistSubscription.update({
        where: { id: subscription.id },
        data: {
          planType: newPlanType,
          monthlyRate: newPlan.monthlyRate,
          transactionFee: newPlan.transactionFee,
          currency: newPlan.currency,
          pendingPlanType: null,
          planChangeEffectiveDate: null,
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getFullYear(), now.getMonth() + 1, now.getDate()),
          nextBillingDate: newPlanType === 'MONTHLY_SUBSCRIPTION'
            ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
            : null,
          currentMonthTransactions: 0,
          currentMonthFees: 0,
        },
      });

      // Update user fields
      await tx.user.update({
        where: { id: specialistId },
        data: {
          subscriptionStatus: newPlanType,
          subscriptionEffectiveDate: now,
          subscriptionValidUntil: newPlanType === 'MONTHLY_SUBSCRIPTION'
            ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
            : null,
        },
      });
    });

    logger.info('Subscription plan changed', {
      specialistId,
      newPlanType,
      effectiveDate: now,
    });
  }

  async processTransactionFee(specialistId: string, bookingId: string): Promise<{
    feeCharged: number;
    currency: string;
    method: 'SUBSCRIPTION_COVERED' | 'PER_TRANSACTION_FEE' | 'TRIAL_PERIOD';
  }> {
    // Check if specialist is in trial period
    const specialist = await prisma.user.findUnique({
      where: { id: specialistId },
      select: {
        isInTrial: true,
        trialEndDate: true,
      },
    });

    // If specialist is in trial period, skip all fees
    if (specialist?.isInTrial && specialist?.trialEndDate && new Date() < specialist.trialEndDate) {
      logger.info('Specialist in trial period - skipping transaction fee', {
        specialistId,
        bookingId,
        trialEndDate: specialist.trialEndDate,
      });

      return {
        feeCharged: 0,
        currency: 'USD',
        method: 'TRIAL_PERIOD',
      };
    }

    const subscription = await this.getSubscription(specialistId);

    logger.info('Processing transaction fee', {
      specialistId,
      bookingId,
      planType: subscription.planType,
    });

    if (subscription.planType === 'MONTHLY_SUBSCRIPTION') {
      // Monthly subscribers don't pay per-transaction fees
      return {
        feeCharged: 0,
        currency: subscription.currency,
        method: 'SUBSCRIPTION_COVERED',
      };
    }

    // Pay-per-use: charge transaction fee
    const fee = subscription.transactionFee;

    await prisma.specialistSubscription.update({
      where: { id: subscription.id },
      data: {
        currentMonthTransactions: { increment: 1 },
        currentMonthFees: { increment: fee },
      },
    });

    logger.info('Transaction fee processed', {
      specialistId,
      bookingId,
      fee,
      totalTransactions: subscription.currentMonthTransactions + 1,
      totalFees: subscription.currentMonthFees + fee,
    });

    return {
      feeCharged: fee,
      currency: subscription.currency,
      method: 'PER_TRANSACTION_FEE',
    };
  }

  async createMonthlySubscriptionPayment(specialistId: string): Promise<{
    paymentId: string;
    paymentUrl: string;
    qrCodeUrl?: string;
    amount: number;
    currency: string;
    expiresAt: Date;
  }> {
    const subscription = await this.getSubscription(specialistId);

    if (subscription.planType !== 'MONTHLY_SUBSCRIPTION') {
      throw new Error('Specialist is not on monthly subscription plan');
    }

    const specialist = await prisma.user.findUnique({
      where: { id: specialistId },
      select: { firstName: true, lastName: true, email: true },
    });

    if (!specialist) {
      throw new Error('Specialist not found');
    }

    const charge = await coinbaseCommerceService.createCharge({
      amount: subscription.monthlyRate,
      currency: 'USD',
      name: 'Monthly Subscription Fee',
      description: `Monthly subscription fee for ${specialist.firstName} ${specialist.lastName}`,
      metadata: {
        specialistId,
        subscriptionId: subscription.id,
        type: 'SUBSCRIPTION',
        billingPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM
      },
    });

    // Create crypto payment record
    const cryptoPayment = await prisma.cryptoPayment.create({
      data: {
        userId: specialistId,
        coinbaseChargeId: charge.chargeId,
        coinbaseChargeCode: charge.code,
        status: 'PENDING',
        type: 'SUBSCRIPTION',
        amount: subscription.monthlyRate,
        currency: 'USD',
        paymentUrl: charge.paymentUrl,
        qrCodeUrl: charge.qrCodeUrl,
        expiresAt: charge.expiresAt,
        metadata: JSON.stringify({
          specialistId,
          subscriptionId: subscription.id,
          billingPeriod: new Date().toISOString().slice(0, 7),
        }),
      },
    });

    logger.info('Monthly subscription payment created', {
      specialistId,
      cryptoPaymentId: cryptoPayment.id,
      amount: subscription.monthlyRate,
      chargeId: charge.chargeId,
    });

    return {
      paymentId: cryptoPayment.id,
      paymentUrl: charge.paymentUrl,
      qrCodeUrl: charge.qrCodeUrl,
      amount: subscription.monthlyRate,
      currency: 'USD',
      expiresAt: charge.expiresAt,
    };
  }

  async processMonthlyBilling(): Promise<{
    processedSubscriptions: number;
    failedSubscriptions: number;
    totalRevenue: number;
  }> {
    logger.info('Starting monthly billing process');

    const subscriptionsToProcess = await prisma.specialistSubscription.findMany({
      where: {
        planType: 'MONTHLY_SUBSCRIPTION',
        status: 'ACTIVE',
        nextBillingDate: {
          lte: new Date(),
        },
      },
      include: {
        specialist: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });

    let processedSubscriptions = 0;
    let failedSubscriptions = 0;
    let totalRevenue = 0;

    // Track success/failure IDs for batch updates
    const successfulSubIds: string[] = [];
    const failedSubIds: string[] = [];
    const suspendSubIds: string[] = [];
    const suspendSpecialistIds: string[] = [];

    for (const subscription of subscriptionsToProcess) {
      try {
        const payment = await this.createMonthlySubscriptionPayment(subscription.specialistId);

        successfulSubIds.push(subscription.id);
        processedSubscriptions++;
        totalRevenue += subscription.monthlyRate;

        logger.info('Monthly billing processed', {
          specialistId: subscription.specialistId,
          amount: subscription.monthlyRate,
          paymentId: payment.paymentId,
        });
      } catch (error) {
        failedSubscriptions++;
        failedSubIds.push(subscription.id);

        logger.error('Monthly billing failed', {
          specialistId: subscription.specialistId,
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : error,
        });

        // If too many failures, mark for suspension
        if (subscription.paymentFailures >= 2) {
          suspendSubIds.push(subscription.id);
          suspendSpecialistIds.push(subscription.specialistId);

          logger.warn('Subscription suspended due to payment failures', {
            specialistId: subscription.specialistId,
            failures: subscription.paymentFailures + 1,
          });
        }
      }
    }

    // Batch update successful subscriptions
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (successfulSubIds.length > 0) {
      await prisma.specialistSubscription.updateMany({
        where: { id: { in: successfulSubIds } },
        data: {
          nextBillingDate: nextMonth,
          currentMonthTransactions: 0,
          currentMonthFees: 0,
        },
      });
    }

    // Batch increment failure count for failed subscriptions
    if (failedSubIds.length > 0) {
      await prisma.specialistSubscription.updateMany({
        where: { id: { in: failedSubIds } },
        data: {
          paymentFailures: { increment: 1 },
        },
      });
    }

    // Batch suspend subscriptions with too many failures
    if (suspendSubIds.length > 0) {
      await prisma.specialistSubscription.updateMany({
        where: { id: { in: suspendSubIds } },
        data: { status: 'EXPIRED' },
      });

      await prisma.user.updateMany({
        where: { id: { in: suspendSpecialistIds } },
        data: { subscriptionStatus: 'PAY_PER_USE' },
      });
    }

    logger.info('Monthly billing process completed', {
      processedSubscriptions,
      failedSubscriptions,
      totalRevenue,
    });

    return {
      processedSubscriptions,
      failedSubscriptions,
      totalRevenue,
    };
  }

  async processPendingPlanChanges(): Promise<{
    changesProcessed: number;
    errors: number;
  }> {
    logger.info('Processing pending plan changes');

    const pendingChanges = await prisma.specialistSubscription.findMany({
      where: {
        pendingPlanType: { not: null },
        planChangeEffectiveDate: {
          lte: new Date(),
        },
      },
    });

    let changesProcessed = 0;
    let errors = 0;

    for (const subscription of pendingChanges) {
      try {
        await this.applyPlanChange(subscription.specialistId, subscription.pendingPlanType! as 'PAY_PER_USE' | 'MONTHLY_SUBSCRIPTION');
        changesProcessed++;

        logger.info('Pending plan change applied', {
          specialistId: subscription.specialistId,
          oldPlan: subscription.planType,
          newPlan: subscription.pendingPlanType,
        });
      } catch (error) {
        errors++;
        logger.error('Failed to apply pending plan change', {
          specialistId: subscription.specialistId,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    logger.info('Pending plan changes processed', {
      changesProcessed,
      errors,
    });

    return { changesProcessed, errors };
  }

  async getSubscriptionAnalytics(specialistId: string): Promise<{
    currentPlan: SubscriptionPlan;
    monthlyStats: {
      transactions: number;
      fees: number;
      currency: string;
    };
    yearlyProjection: {
      estimatedTransactions: number;
      estimatedFees: number;
      monthlyAlternativeCost: number;
      savings: number;
    };
  }> {
    const subscription = await this.getSubscription(specialistId);
    const plan = this.PLANS[subscription.planType];

    // Calculate yearly projection
    const monthlyTransactions = subscription.currentMonthTransactions;
    const estimatedYearlyTransactions = monthlyTransactions * 12;
    const payPerUseYearlyCost = estimatedYearlyTransactions * this.PLANS.PAY_PER_USE.transactionFee;
    const monthlySubscriptionYearlyCost = this.PLANS.MONTHLY_SUBSCRIPTION.monthlyRate * 12;

    return {
      currentPlan: plan,
      monthlyStats: {
        transactions: subscription.currentMonthTransactions,
        fees: subscription.currentMonthFees,
        currency: subscription.currency,
      },
      yearlyProjection: {
        estimatedTransactions: estimatedYearlyTransactions,
        estimatedFees: subscription.planType === 'PAY_PER_USE' ? payPerUseYearlyCost : monthlySubscriptionYearlyCost,
        monthlyAlternativeCost: subscription.planType === 'PAY_PER_USE'
          ? this.PLANS.MONTHLY_SUBSCRIPTION.monthlyRate
          : payPerUseYearlyCost / 12,
        savings: subscription.planType === 'PAY_PER_USE'
          ? Math.max(0, monthlySubscriptionYearlyCost - payPerUseYearlyCost)
          : Math.max(0, payPerUseYearlyCost - monthlySubscriptionYearlyCost),
      },
    };
  }

  getAvailablePlans(): Record<string, SubscriptionPlan> {
    return this.PLANS;
  }
}

export const specialistSubscriptionService = new SpecialistSubscriptionService();