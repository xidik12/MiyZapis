import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { emailService as templatedEmailService } from '@/services/email';

export function startBookingReminderWorker() {
  const intervalMs = 60 * 60 * 1000; // hourly
  const run = async () => {
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      // +/- 30 minutes window
      const windowStart = new Date(in24h.getTime() - 30 * 60 * 1000);
      const windowEnd = new Date(in24h.getTime() + 30 * 60 * 1000);

      const candidates = await prisma.booking.findMany({
        where: {
          status: 'CONFIRMED',
          scheduledAt: { gte: windowStart, lte: windowEnd },
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              language: true,
            },
          },
          specialist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (candidates.length === 0) return;

      // Batch-fetch all recent reminder logs for candidate customer emails (N+1 fix)
      const customerEmails = candidates
        .map((b) => b.customer.email)
        .filter((email): email is string => !!email);

      const recentReminderLogs = customerEmails.length > 0
        ? await prisma.emailLog.findMany({
            where: {
              recipient: { in: customerEmails },
              subject: { contains: 'Reminder' },
              sentAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            },
            select: { recipient: true },
          })
        : [];

      const alreadyRemindedEmails = new Set(recentReminderLogs.map((log) => log.recipient));

      for (const booking of candidates) {
        if (alreadyRemindedEmails.has(booking.customer.email || '')) continue;
        try {
          await templatedEmailService.sendBookingReminder(booking.id, (booking.customer as { language?: string }).language || 'en');
          logger.info('Reminder email sent by worker', { bookingId: booking.id });
        } catch (e) {
          logger.warn('Reminder email failed by worker', { bookingId: booking.id, error: (e as Error)?.message });
        }
      }
    } catch (error) {
      logger.warn('bookingReminderWorker iteration failed', { error: (error as Error)?.message });
    }
  };

  // Kick off once and then hourly
  run();
  setInterval(run, intervalMs);
}

