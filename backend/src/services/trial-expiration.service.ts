import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { emailService } from './email/enhanced-email';

export class TrialExpirationService {
  /**
   * Check for trials expiring in 7 days and send warning emails
   */
  async checkAndNotifySevenDayWarning(): Promise<{
    usersChecked: number;
    emailsSent: number;
    errors: number;
  }> {
    logger.info('Starting 7-day trial expiration check...');

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    // Set time range for "7 days from now" (between 7 days and 7 days + 1 hour)
    const sevenDaysStart = new Date(sevenDaysFromNow);
    sevenDaysStart.setHours(0, 0, 0, 0);
    const sevenDaysEnd = new Date(sevenDaysFromNow);
    sevenDaysEnd.setHours(23, 59, 59, 999);

    try {
      // Find users whose trial expires in 7 days and haven't been notified yet
      const users = await prisma.user.findMany({
        where: {
          isInTrial: true,
          trialEndDate: {
            gte: sevenDaysStart,
            lte: sevenDaysEnd,
          },
          // Check if we haven't sent the 7-day warning yet
          // We'll use a simple check: if trial is still active and ends in 7 days,
          // we can track this with a notification flag or email log
        },
      });

      logger.info(`Found ${users.length} users with trial expiring in 7 days`);

      let emailsSent = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Check if we already sent this notification (check email logs)
          const existingNotification = await prisma.emailLog.findFirst({
            where: {
              recipient: user.email,
              subject: {
                contains: 'Trial is Ending Soon',
              },
              sentAt: {
                gte: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // Last 8 days
              },
            },
          });

          if (existingNotification) {
            logger.info(`7-day warning already sent to user ${user.id}`);
            continue;
          }

          // Send 7-day warning email
          const sent = await emailService.sendTrialExpiringWarning(user.id, user.language || 'en');

          if (sent) {
            emailsSent++;
            logger.info(`7-day warning sent to user ${user.id} (${user.email})`);
          } else {
            errors++;
            logger.error(`Failed to send 7-day warning to user ${user.id}`);
          }
        } catch (error) {
          errors++;
          logger.error(`Error processing user ${user.id}:`, error);
        }
      }

      logger.info('7-day trial expiration check completed', {
        usersChecked: users.length,
        emailsSent,
        errors,
      });

      return {
        usersChecked: users.length,
        emailsSent,
        errors,
      };
    } catch (error) {
      logger.error('Failed to check 7-day trial expirations:', error);
      return {
        usersChecked: 0,
        emailsSent: 0,
        errors: 1,
      };
    }
  }

  /**
   * Check for trials expiring in 3 days and send warning emails
   */
  async checkAndNotifyThreeDayWarning(): Promise<{
    usersChecked: number;
    emailsSent: number;
    errors: number;
  }> {
    logger.info('Starting 3-day trial expiration check...');

    const now = new Date();
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    // Set time range for "3 days from now"
    const threeDaysStart = new Date(threeDaysFromNow);
    threeDaysStart.setHours(0, 0, 0, 0);
    const threeDaysEnd = new Date(threeDaysFromNow);
    threeDaysEnd.setHours(23, 59, 59, 999);

    try {
      const users = await prisma.user.findMany({
        where: {
          isInTrial: true,
          trialEndDate: {
            gte: threeDaysStart,
            lte: threeDaysEnd,
          },
        },
      });

      logger.info(`Found ${users.length} users with trial expiring in 3 days`);

      let emailsSent = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Check if we already sent this notification
          const existingNotification = await prisma.emailLog.findFirst({
            where: {
              recipient: user.email,
              subject: {
                contains: 'Trial is Ending Soon',
              },
              sentAt: {
                gte: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // Last 4 days
              },
            },
          });

          if (existingNotification) {
            logger.info(`3-day warning already sent to user ${user.id}`);
            continue;
          }

          // Send 3-day warning email
          const sent = await emailService.sendTrialExpiringWarning(user.id, user.language || 'en');

          if (sent) {
            emailsSent++;
            logger.info(`3-day warning sent to user ${user.id} (${user.email})`);
          } else {
            errors++;
            logger.error(`Failed to send 3-day warning to user ${user.id}`);
          }
        } catch (error) {
          errors++;
          logger.error(`Error processing user ${user.id}:`, error);
        }
      }

      logger.info('3-day trial expiration check completed', {
        usersChecked: users.length,
        emailsSent,
        errors,
      });

      return {
        usersChecked: users.length,
        emailsSent,
        errors,
      };
    } catch (error) {
      logger.error('Failed to check 3-day trial expirations:', error);
      return {
        usersChecked: 0,
        emailsSent: 0,
        errors: 1,
      };
    }
  }

  /**
   * Check for expired trials and update user status
   */
  async checkAndExpireTrials(): Promise<{
    usersChecked: number;
    usersExpired: number;
    emailsSent: number;
    errors: number;
  }> {
    logger.info('Starting trial expiration check...');

    const now = new Date();

    try {
      // Find users whose trial has expired (trial end date is in the past)
      const users = await prisma.user.findMany({
        where: {
          isInTrial: true,
          trialEndDate: {
            lt: now,
          },
        },
      });

      logger.info(`Found ${users.length} users with expired trials`);

      let usersExpired = 0;
      let emailsSent = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Update user to mark trial as expired
          await prisma.user.update({
            where: { id: user.id },
            data: {
              isInTrial: false,
            },
          });

          usersExpired++;
          logger.info(`Expired trial for user ${user.id} (${user.email})`);

          // Check if we already sent expiration notification
          const existingNotification = await prisma.emailLog.findFirst({
            where: {
              recipient: user.email,
              subject: {
                contains: 'Trial Has Ended',
              },
              sentAt: {
                gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // Last 2 days
              },
            },
          });

          if (!existingNotification) {
            // Send trial expired email
            const sent = await emailService.sendTrialExpired(user.id, user.language || 'en');

            if (sent) {
              emailsSent++;
              logger.info(`Trial expiration email sent to user ${user.id}`);
            } else {
              errors++;
              logger.error(`Failed to send trial expiration email to user ${user.id}`);
            }
          }
        } catch (error) {
          errors++;
          logger.error(`Error processing expired trial for user ${user.id}:`, error);
        }
      }

      logger.info('Trial expiration check completed', {
        usersChecked: users.length,
        usersExpired,
        emailsSent,
        errors,
      });

      return {
        usersChecked: users.length,
        usersExpired,
        emailsSent,
        errors,
      };
    } catch (error) {
      logger.error('Failed to check trial expirations:', error);
      return {
        usersChecked: 0,
        usersExpired: 0,
        emailsSent: 0,
        errors: 1,
      };
    }
  }

  /**
   * Run all trial expiration checks
   * This is the main method to be called by a cron job
   */
  async runAllChecks(): Promise<{
    sevenDayWarnings: { usersChecked: number; emailsSent: number; errors: number };
    threeDayWarnings: { usersChecked: number; emailsSent: number; errors: number };
    expirations: { usersChecked: number; usersExpired: number; emailsSent: number; errors: number };
  }> {
    logger.info('=== Starting all trial expiration checks ===');

    const sevenDayWarnings = await this.checkAndNotifySevenDayWarning();
    const threeDayWarnings = await this.checkAndNotifyThreeDayWarning();
    const expirations = await this.checkAndExpireTrials();

    logger.info('=== All trial expiration checks completed ===', {
      sevenDayWarnings,
      threeDayWarnings,
      expirations,
    });

    return {
      sevenDayWarnings,
      threeDayWarnings,
      expirations,
    };
  }
}

// Export singleton instance
export const trialExpirationService = new TrialExpirationService();
