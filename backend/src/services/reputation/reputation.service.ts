// Reputation / review-request automation.
//
// After a booking is COMPLETED, we ask the customer to leave a review. The
// request routes them to:
//   1. The platform review page (the customer Bookings list, deep-linked so the
//      review modal can be opened for that booking), AND
//   2. Optionally the specialist's Google / Facebook review pages, when the
//      specialist has configured those URLs on their Specialist row.
//
// Triggering follows the exact pattern of ConsumablesService.deductForBooking:
// fire-and-forget from the 3 booking-completion points, idempotent (gated on
// booking.reviewRequestedAt), owner-resolving, and it NEVER throws into the
// booking flow.
//
// Ownership model (mirrors consumables):
//   Service.specialistId  -> Specialist.id
//   Specialist.userId     -> User.id  (the specialist's account)
// The two review URLs live directly on the Specialist row.

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';
import { resolveLanguage, AppLanguage } from '@/utils/language';
import { config } from '@/config';

const notifier = new NotificationService(prisma);

// Public base URL for the customer-facing app. The review is left on the
// customer Bookings page; `?review=<id>` deep-links the booking to review.
const APP_BASE_URL = (config.frontend.url || 'https://miyzapis.com').replace(/\/+$/, '');

export interface ReputationSettings {
  googleReviewUrl: string | null;
  facebookReviewUrl: string | null;
  // Auto-request is always ON when a booking completes; there is no dedicated
  // column to toggle it off. Exposed so the UI can show the (fixed) state.
  autoRequestEnabled: boolean;
}

export interface ReputationSettingsInput {
  googleReviewUrl?: string | null;
  facebookReviewUrl?: string | null;
  // Accepted for forward-compat but currently ignored — auto-request is always on.
  autoRequestEnabled?: boolean;
}

// Localized copy for the review-request message. {{serviceName}} / {{link}} /
// {{googleLine}} / {{facebookLine}} are interpolated below.
const COPY: Record<AppLanguage, {
  title: string;
  intro: (service: string) => string;
  platformLine: (link: string) => string;
  googleLine: (url: string) => string;
  facebookLine: (url: string) => string;
  thanks: string;
}> = {
  en: {
    title: 'How was your appointment?',
    intro: (service) => `Thanks for visiting! We'd love your feedback on "${service}".`,
    platformLine: (link) => `Leave a review here: ${link}`,
    googleLine: (url) => `…or review us on Google: ${url}`,
    facebookLine: (url) => `…or review us on Facebook: ${url}`,
    thanks: 'It only takes a minute and means a lot. Thank you!',
  },
  uk: {
    title: 'Як пройшов ваш візит?',
    intro: (service) => `Дякуємо за візит! Будемо вдячні за ваш відгук про "${service}".`,
    platformLine: (link) => `Залишити відгук тут: ${link}`,
    googleLine: (url) => `…або залиште відгук у Google: ${url}`,
    facebookLine: (url) => `…або залиште відгук у Facebook: ${url}`,
    thanks: 'Це займе лише хвилину і дуже допоможе. Дякуємо!',
  },
  ru: {
    title: 'Как прошёл ваш визит?',
    intro: (service) => `Спасибо за визит! Будем рады вашему отзыву об услуге "${service}".`,
    platformLine: (link) => `Оставить отзыв здесь: ${link}`,
    googleLine: (url) => `…или оставьте отзыв в Google: ${url}`,
    facebookLine: (url) => `…или оставьте отзыв в Facebook: ${url}`,
    thanks: 'Это займёт всего минуту и очень поможет. Спасибо!',
  },
};

const isHttpUrl = (value: unknown): value is string =>
  typeof value === 'string' && /^https?:\/\/\S+$/i.test(value.trim());

// Normalize a user-supplied URL field: trim, accept http(s) URLs, empty → null.
const normalizeUrl = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  if (!isHttpUrl(trimmed)) throw new Error('INVALID_URL');
  return trimmed;
};

export class ReputationService {
  /**
   * Send a post-visit review request for a completed booking. Idempotent: a
   * no-op when booking.reviewRequestedAt is already set. Never throws into the
   * booking flow — failures are logged and swallowed.
   */
  static async requestReviewForBooking(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          customerId: true,
          reviewRequestedAt: true,
          customer: { select: { language: true } },
          service: {
            select: {
              name: true,
              specialist: {
                select: { googleReviewUrl: true, facebookReviewUrl: true },
              },
            },
          },
        },
      });

      if (!booking) {
        logger.warn('Review request skipped: booking not found', { bookingId });
        return;
      }
      if (booking.reviewRequestedAt) {
        // Already requested — idempotent no-op.
        return;
      }
      if (!booking.customerId) {
        logger.warn('Review request skipped: booking has no customer', { bookingId });
        return;
      }

      const lang = resolveLanguage(booking.customer?.language, undefined);
      const copy = COPY[lang];
      const serviceName = booking.service?.name || '';
      const reviewLink = `${APP_BASE_URL}/customer/bookings?review=${booking.id}`;

      const googleUrl = booking.service?.specialist?.googleReviewUrl || null;
      const facebookUrl = booking.service?.specialist?.facebookReviewUrl || null;

      // Build the message body.
      const lines: string[] = [
        copy.intro(serviceName),
        '',
        copy.platformLine(reviewLink),
      ];
      if (googleUrl) lines.push(copy.googleLine(googleUrl));
      if (facebookUrl) lines.push(copy.facebookLine(facebookUrl));
      lines.push('', copy.thanks);
      const message = lines.join('\n');

      // Reuse the NotificationService send path — it routes to the customer's
      // preferred channels (email if emailNotifications, Telegram if
      // telegramNotifications + telegramId, push, etc.) based on their prefs.
      await notifier.sendNotification(booking.customerId, {
        type: 'REVIEW_REQUEST',
        title: copy.title,
        message,
        data: {
          bookingId: booking.id,
          reviewUrl: reviewLink,
          googleReviewUrl: googleUrl || undefined,
          facebookReviewUrl: facebookUrl || undefined,
          actionUrl: `/customer/bookings?review=${booking.id}`,
        },
      });

      // Mark requested so re-completion / retries don't re-send.
      await prisma.booking.update({
        where: { id: bookingId },
        data: { reviewRequestedAt: new Date() },
      });

      logger.info('Review request sent for completed booking', {
        bookingId,
        customerId: booking.customerId,
        hasGoogle: !!googleUrl,
        hasFacebook: !!facebookUrl,
      });
    } catch (error) {
      // Must never break the booking-completion flow.
      logger.error('Failed to request review for booking', {
        bookingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /** Read the owner's review URLs. autoRequestEnabled is always true (no toggle column). */
  static async getSettings(ownerId: string): Promise<ReputationSettings> {
    const specialist = await prisma.specialist.findUnique({
      where: { userId: ownerId },
      select: { googleReviewUrl: true, facebookReviewUrl: true },
    });
    return {
      googleReviewUrl: specialist?.googleReviewUrl ?? null,
      facebookReviewUrl: specialist?.facebookReviewUrl ?? null,
      autoRequestEnabled: true,
    };
  }

  /**
   * Persist the owner's review URLs on their Specialist row. Each URL is
   * validated as http(s); empty string clears it. `autoRequestEnabled` is
   * accepted but ignored (auto-request is always on). Throws INVALID_URL on a
   * malformed URL, or SPECIALIST_NOT_FOUND if the owner has no Specialist row.
   */
  static async setSettings(
    ownerId: string,
    input: ReputationSettingsInput,
  ): Promise<ReputationSettings> {
    const data: { googleReviewUrl?: string | null; facebookReviewUrl?: string | null } = {};
    if (input.googleReviewUrl !== undefined) {
      data.googleReviewUrl = normalizeUrl(input.googleReviewUrl);
    }
    if (input.facebookReviewUrl !== undefined) {
      data.facebookReviewUrl = normalizeUrl(input.facebookReviewUrl);
    }

    const existing = await prisma.specialist.findUnique({
      where: { userId: ownerId },
      select: { id: true },
    });
    if (!existing) throw new Error('SPECIALIST_NOT_FOUND');

    const updated = await prisma.specialist.update({
      where: { userId: ownerId },
      data,
      select: { googleReviewUrl: true, facebookReviewUrl: true },
    });

    return {
      googleReviewUrl: updated.googleReviewUrl ?? null,
      facebookReviewUrl: updated.facebookReviewUrl ?? null,
      autoRequestEnabled: true,
    };
  }
}
