import cron from 'node-cron';
import { specialistSubscriptionService } from '@/services/payment/subscription.service';
import { trialExpirationService } from '@/services/trial-expiration.service';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

export class SubscriptionWorker {
  private monthlyBillingJob: cron.ScheduledTask | null = null;
  private planChangeJob: cron.ScheduledTask | null = null;
  private trialExpirationJob: cron.ScheduledTask | null = null;
  private prepaidExpirationJob: cron.ScheduledTask | null = null;
  private membershipExpirationJob: cron.ScheduledTask | null = null;
  private packageExpirationJob: cron.ScheduledTask | null = null;

  start(): void {
    logger.info('Starting subscription worker...');

    // Monthly billing - runs on the 1st of every month at 9:00 AM
    this.monthlyBillingJob = cron.schedule('0 9 1 * *', async () => {
      logger.info('Running monthly billing process...');

      try {
        const result = await specialistSubscriptionService.processMonthlyBilling();

        logger.info('Monthly billing completed', {
          processedSubscriptions: result.processedSubscriptions,
          failedSubscriptions: result.failedSubscriptions,
          totalRevenue: result.totalRevenue,
        });
      } catch (error) {
        logger.error('Monthly billing process failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Plan changes - runs daily at 10:00 AM to process pending plan changes
    this.planChangeJob = cron.schedule('0 10 * * *', async () => {
      logger.info('Processing pending plan changes...');

      try {
        const result = await specialistSubscriptionService.processPendingPlanChanges();

        logger.info('Plan changes processed', {
          changesProcessed: result.changesProcessed,
          errors: result.errors,
        });
      } catch (error) {
        logger.error('Plan change processing failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Trial expiration — runs daily at 02:00 UTC.
    // Flips isInTrial=false for overdue trials, sends 7-day/3-day/expiry warning
    // emails. This is the internal scheduler that makes the service actually run;
    // the HTTP endpoint (POST /api/v1/cron/trial-expiration-check) is kept as-is
    // for manual/external triggers.
    this.trialExpirationJob = cron.schedule('0 2 * * *', async () => {
      logger.info('Running trial expiration checks...');

      try {
        const result = await trialExpirationService.runAllChecks();

        logger.info('Trial expiration checks completed', {
          sevenDayWarnings: result.sevenDayWarnings,
          threeDayWarnings: result.threeDayWarnings,
          expirations: result.expirations,
        });
      } catch (error) {
        logger.error('Trial expiration checks failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Membership expiration — runs daily at 03:00 UTC.
    // Finds CustomerMembership rows with status='ACTIVE' and currentPeriodEnd in
    // the past, then flips them to EXPIRED. Idempotent: the WHERE clause ensures
    // only still-ACTIVE rows are touched, so re-running is always safe.
    // This is the companion to getActiveDiscountForCustomer's in-query period
    // guard; expiring rows here makes the status column authoritative so queries
    // that filter on status='ACTIVE' alone (e.g. summary counts) are correct.
    this.membershipExpirationJob = cron.schedule('0 3 * * *', async () => {
      logger.info('Running membership expiration check...');

      try {
        const now = new Date();

        const result = await prisma.customerMembership.updateMany({
          where: {
            status: 'ACTIVE',
            currentPeriodEnd: { lt: now },
          },
          data: { status: 'EXPIRED' },
        });

        logger.info('Membership expiration check completed', {
          expired: result.count,
        });
      } catch (error) {
        logger.error('Membership expiration check failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Package expiration — runs daily at 03:30 UTC.
    // Finds CustomerPackage rows with status='ACTIVE', a non-null expiresAt in
    // the past, and flips them to EXPIRED. Idempotent: the WHERE clause ensures
    // only still-ACTIVE rows with a set expiry are touched. Packages with no
    // expiresAt are perpetual and are never touched.
    this.packageExpirationJob = cron.schedule('30 3 * * *', async () => {
      logger.info('Running package expiration check...');

      try {
        const now = new Date();

        const result = await prisma.customerPackage.updateMany({
          where: {
            status: 'ACTIVE',
            expiresAt: { lt: now, not: null },
          },
          data: { status: 'EXPIRED' },
        });

        logger.info('Package expiration check completed', {
          expired: result.count,
        });
      } catch (error) {
        logger.error('Package expiration check failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    // Expired prepaid Telegram Stars downgrade — runs daily at 02:30 UTC.
    // Finds MONTHLY_SUBSCRIPTION rows where nextBillingDate IS NULL (i.e. prepaid,
    // not auto-renewing) and currentPeriodEnd is in the past, then downgrades each
    // to PAY_PER_USE via the canonical deactivateProviderSubscription method.
    // Guards: nextBillingDate must be null (skips auto-renew monthly subs);
    //         specialist must not be in an active trial (isInTrial=false or
    //         trialEndDate already passed) so trial+prepaid stacks aren't cut early.
    this.prepaidExpirationJob = cron.schedule('30 2 * * *', async () => {
      logger.info('Running expired prepaid subscription downgrade...');

      try {
        const now = new Date();

        const expiredPrepaid = await prisma.specialistSubscription.findMany({
          where: {
            planType: 'MONTHLY_SUBSCRIPTION',
            nextBillingDate: null,           // prepaid only — not auto-renewing
            currentPeriodEnd: { lt: now },   // period has elapsed
            status: 'ACTIVE',
          },
          include: {
            specialist: {
              select: { id: true, isInTrial: true, trialEndDate: true },
            },
          },
        });

        let downgraded = 0;
        let skipped = 0;
        let errors = 0;

        for (const sub of expiredPrepaid) {
          // Skip if the specialist's trial is still running (trialEndDate in the
          // future takes precedence; the trial-expiration job handles those).
          const specialist = sub.specialist;
          if (
            specialist.isInTrial &&
            specialist.trialEndDate &&
            specialist.trialEndDate.getTime() > now.getTime()
          ) {
            skipped++;
            logger.info('Skipping prepaid downgrade — specialist still in trial', {
              specialistId: specialist.id,
              trialEndDate: specialist.trialEndDate,
            });
            continue;
          }

          try {
            // provider guard inside deactivateProviderSubscription means this is
            // a no-op if the row's provider column doesn't match 'TELEGRAM_STARS'.
            await specialistSubscriptionService.deactivateProviderSubscription(
              specialist.id,
              sub.provider ?? 'TELEGRAM_STARS',
            );
            downgraded++;
            logger.info('Prepaid subscription expired — downgraded to PAY_PER_USE', {
              specialistId: specialist.id,
              currentPeriodEnd: sub.currentPeriodEnd,
              provider: sub.provider,
            });
          } catch (err) {
            errors++;
            logger.error('Failed to downgrade expired prepaid subscription', {
              specialistId: specialist.id,
              subscriptionId: sub.id,
              error: err instanceof Error ? err.message : err,
            });
          }
        }

        logger.info('Expired prepaid subscription downgrade completed', {
          checked: expiredPrepaid.length,
          downgraded,
          skipped,
          errors,
        });
      } catch (error) {
        logger.error('Expired prepaid subscription downgrade failed', {
          error: error instanceof Error ? error.message : error,
        });
      }
    }, {
      scheduled: true,
      timezone: 'UTC',
    });

    logger.info('Subscription worker started', {
      monthlyBilling: '0 9 1 * * (1st of month at 9:00 AM UTC)',
      planChanges: '0 10 * * * (daily at 10:00 AM UTC)',
      trialExpiration: '0 2 * * * (daily at 02:00 AM UTC)',
      prepaidExpiration: '30 2 * * * (daily at 02:30 AM UTC)',
      membershipExpiration: '0 3 * * * (daily at 03:00 AM UTC)',
      packageExpiration: '30 3 * * * (daily at 03:30 AM UTC)',
    });
  }

  stop(): void {
    logger.info('Stopping subscription worker...');

    if (this.monthlyBillingJob) {
      this.monthlyBillingJob.stop();
      this.monthlyBillingJob = null;
    }

    if (this.planChangeJob) {
      this.planChangeJob.stop();
      this.planChangeJob = null;
    }

    if (this.trialExpirationJob) {
      this.trialExpirationJob.stop();
      this.trialExpirationJob = null;
    }

    if (this.prepaidExpirationJob) {
      this.prepaidExpirationJob.stop();
      this.prepaidExpirationJob = null;
    }

    if (this.membershipExpirationJob) {
      this.membershipExpirationJob.stop();
      this.membershipExpirationJob = null;
    }

    if (this.packageExpirationJob) {
      this.packageExpirationJob.stop();
      this.packageExpirationJob = null;
    }

    logger.info('Subscription worker stopped');
  }

  // Manual trigger methods for testing or admin operations
  async triggerMonthlyBilling(): Promise<any> {
    logger.info('Manually triggering monthly billing...');

    try {
      const result = await specialistSubscriptionService.processMonthlyBilling();
      logger.info('Manual monthly billing completed', result);
      return result;
    } catch (error) {
      logger.error('Manual monthly billing failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async triggerPlanChanges(): Promise<any> {
    logger.info('Manually triggering plan changes...');

    try {
      const result = await specialistSubscriptionService.processPendingPlanChanges();
      logger.info('Manual plan changes completed', result);
      return result;
    } catch (error) {
      logger.error('Manual plan changes failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async triggerTrialExpiration(): Promise<any> {
    logger.info('Manually triggering trial expiration checks...');

    try {
      const result = await trialExpirationService.runAllChecks();
      logger.info('Manual trial expiration completed', result);
      return result;
    } catch (error) {
      logger.error('Manual trial expiration failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async triggerPrepaidExpiration(): Promise<any> {
    logger.info('Manually triggering prepaid subscription expiration...');

    const now = new Date();
    const expiredPrepaid = await prisma.specialistSubscription.findMany({
      where: {
        planType: 'MONTHLY_SUBSCRIPTION',
        nextBillingDate: null,
        currentPeriodEnd: { lt: now },
        status: 'ACTIVE',
      },
      include: {
        specialist: {
          select: { id: true, isInTrial: true, trialEndDate: true },
        },
      },
    });

    let downgraded = 0;
    let skipped = 0;
    let errors = 0;

    for (const sub of expiredPrepaid) {
      const specialist = sub.specialist;
      if (
        specialist.isInTrial &&
        specialist.trialEndDate &&
        specialist.trialEndDate.getTime() > now.getTime()
      ) {
        skipped++;
        continue;
      }

      try {
        await specialistSubscriptionService.deactivateProviderSubscription(
          specialist.id,
          sub.provider ?? 'TELEGRAM_STARS',
        );
        downgraded++;
      } catch (err) {
        errors++;
        logger.error('Manual prepaid downgrade failed for specialist', {
          specialistId: specialist.id,
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    const result = { checked: expiredPrepaid.length, downgraded, skipped, errors };
    logger.info('Manual prepaid expiration completed', result);
    return result;
  }

  async triggerMembershipExpiration(): Promise<{ expired: number }> {
    logger.info('Manually triggering membership expiration check...');

    const now = new Date();
    const result = await prisma.customerMembership.updateMany({
      where: {
        status: 'ACTIVE',
        currentPeriodEnd: { lt: now },
      },
      data: { status: 'EXPIRED' },
    });

    const outcome = { expired: result.count };
    logger.info('Manual membership expiration completed', outcome);
    return outcome;
  }

  async triggerPackageExpiration(): Promise<{ expired: number }> {
    logger.info('Manually triggering package expiration check...');

    const now = new Date();
    const result = await prisma.customerPackage.updateMany({
      where: {
        status: 'ACTIVE',
        expiresAt: { lt: now, not: null },
      },
      data: { status: 'EXPIRED' },
    });

    const outcome = { expired: result.count };
    logger.info('Manual package expiration completed', outcome);
    return outcome;
  }

  getStatus(): {
    monthlyBillingActive: boolean;
    planChangeActive: boolean;
    trialExpirationActive: boolean;
    prepaidExpirationActive: boolean;
    membershipExpirationActive: boolean;
    nextMonthlyBilling: string | null;
    nextPlanChange: string | null;
    nextTrialExpiration: string | null;
    nextPrepaidExpiration: string | null;
    nextMembershipExpiration: string | null;
    packageExpirationActive: boolean;
    nextPackageExpiration: string | null;
  } {
    return {
      monthlyBillingActive: this.monthlyBillingJob !== null,
      planChangeActive: this.planChangeJob !== null,
      trialExpirationActive: this.trialExpirationJob !== null,
      prepaidExpirationActive: this.prepaidExpirationJob !== null,
      membershipExpirationActive: this.membershipExpirationJob !== null,
      nextMonthlyBilling: this.monthlyBillingJob ? 'Next 1st of month at 9:00 AM UTC' : null,
      nextPlanChange: this.planChangeJob ? 'Next day at 10:00 AM UTC' : null,
      nextTrialExpiration: this.trialExpirationJob ? 'Next day at 2:00 AM UTC' : null,
      nextPrepaidExpiration: this.prepaidExpirationJob ? 'Next day at 2:30 AM UTC' : null,
      nextMembershipExpiration: this.membershipExpirationJob ? 'Next day at 3:00 AM UTC' : null,
      packageExpirationActive: this.packageExpirationJob !== null,
      nextPackageExpiration: this.packageExpirationJob ? 'Next day at 3:30 AM UTC' : null,
    };
  }
}

export const subscriptionWorker = new SubscriptionWorker();