import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { emailService as templatedEmailService } from '@/services/email/enhanced-email';

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
          customer: true,
          specialist: true, // specialist is already a User, no need to include user
          service: true,
        },
      });

      for (const booking of candidates) {
        // naive dedupe: check if a reminder was sent to this recipient in past 2 days by subject contains 'Reminder'
        const recent = await prisma.emailLog.count({
          where: {
            recipient: booking.customer.email || '',
            subject: { contains: 'Reminder' },
            sentAt: { gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          },
        });
        if (recent > 0) continue;
        try {
          await templatedEmailService.sendBookingReminder(booking.id, (booking.customer as any).language || 'en');
          logger.info('Reminder email sent by worker', { bookingId: booking.id });
        } catch (e) {
          logger.warn('Reminder email failed by worker', { bookingId: booking.id, error: (e as any)?.message });
        }
      }
    } catch (error) {
      logger.warn('bookingReminderWorker iteration failed', { error: (error as any)?.message });
    }
  };

  // Kick off once and then hourly
  run();
  setInterval(run, intervalMs);
}

