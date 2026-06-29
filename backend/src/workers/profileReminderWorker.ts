import { prisma } from '@/config/database';
import { NotificationService } from '@/services/notification';
import { logger } from '@/utils/logger';

const notificationService = new NotificationService(prisma);

const DAY = 24 * 60 * 60 * 1000;
const REMIND_EVERY_DAYS = 7; // don't nag more than once a week

const nonEmpty = (v: unknown): boolean => typeof v === 'string' && v.trim().length > 0;

// A specialist appears in search only with a business name, a contact (phone or
// WhatsApp) and a location. List what's missing so the nudge is specific.
function missingFields(s: {
  businessName: string | null;
  businessPhone: string | null;
  whatsappNumber: string | null;
  preciseAddress: string | null;
  address: string | null;
}): string[] {
  const missing: string[] = [];
  if (!nonEmpty(s.businessName)) missing.push('businessName');
  if (!nonEmpty(s.businessPhone) && !nonEmpty(s.whatsappNumber)) missing.push('contact');
  if (!nonEmpty(s.preciseAddress) && !nonEmpty(s.address)) missing.push('location');
  return missing;
}

async function run(): Promise<void> {
  try {
    const specialists = await prisma.specialist.findMany({
      where: { user: { isActive: true } },
      select: {
        userId: true,
        businessName: true,
        businessPhone: true,
        whatsappNumber: true,
        preciseAddress: true,
        address: true,
      },
    });

    const incomplete = specialists.filter((s) => missingFields(s).length > 0);
    if (incomplete.length === 0) return;

    const since = new Date(Date.now() - REMIND_EVERY_DAYS * DAY);
    let sent = 0;

    for (const s of incomplete) {
      // Dedup: skip if we already nudged this user within the window.
      const recent = await prisma.notification.findFirst({
        where: { userId: s.userId, type: 'PROFILE_INCOMPLETE', createdAt: { gte: since } },
        select: { id: true },
      });
      if (recent) continue;

      try {
        await notificationService.sendNotification(s.userId, {
          type: 'PROFILE_INCOMPLETE',
          title: 'notifications.profileIncomplete.title',
          message: 'notifications.profileIncomplete.message',
          data: { url: '/specialist/settings', missing: missingFields(s) },
        });
        sent++;
      } catch (e) {
        logger.error('Failed to send profile-incomplete reminder', { userId: s.userId, error: e });
      }
    }

    if (sent > 0) logger.info(`📣 Profile-completion reminders sent: ${sent}/${incomplete.length} incomplete`);
  } catch (error) {
    logger.error('Profile reminder worker run failed', { error });
  }
}

export function startProfileReminderWorker(): void {
  // Run shortly after boot, then daily. Per-user 7-day cooldown prevents spam.
  setTimeout(run, 60 * 1000);
  setInterval(run, DAY);
}
