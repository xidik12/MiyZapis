import cron from 'node-cron';
import { specialistSubscriptionService } from '@/services/payment/subscription.service';
import { logger } from '@/utils/logger';

export class SubscriptionWorker {
  private monthlyBillingJob: cron.ScheduledTask | null = null;
  private planChangeJob: cron.ScheduledTask | null = null;

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

    logger.info('Subscription worker started', {
      monthlyBilling: '0 9 1 * * (1st of month at 9:00 AM UTC)',
      planChanges: '0 10 * * * (daily at 10:00 AM UTC)',
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

  getStatus(): {
    monthlyBillingActive: boolean;
    planChangeActive: boolean;
    nextMonthlyBilling: string | null;
    nextPlanChange: string | null;
  } {
    return {
      monthlyBillingActive: this.monthlyBillingJob !== null,
      planChangeActive: this.planChangeJob !== null,
      nextMonthlyBilling: this.monthlyBillingJob ? 'Next 1st of month at 9:00 AM UTC' : null,
      nextPlanChange: this.planChangeJob ? 'Next day at 10:00 AM UTC' : null,
    };
  }
}

export const subscriptionWorker = new SubscriptionWorker();