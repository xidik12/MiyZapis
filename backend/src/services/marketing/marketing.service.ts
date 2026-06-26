import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { prisma } from '@/config/database';
import { emailService as templatedEmailService } from '@/services/email';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// Marketing automation engine: win-back, rebooking nudges, birthday.
//
// Each automation is owner-scoped (solo specialist OR business owner). The
// engine finds eligible customers, respects the automation channel
// (TELEGRAM | EMAIL | BOTH) AND the customer's own notification prefs, sends a
// templated message, and writes a MarketingLog row per send for idempotency
// and reporting.
//
// BIRTHDAY fires for customers whose dateOfBirth month+day matches the server
// date today; it is idempotent once per calendar year via MarketingLog.
// ---------------------------------------------------------------------------

export const MARKETING_TYPES = ['WINBACK', 'REBOOKING', 'BIRTHDAY'] as const;
export type MarketingType = (typeof MARKETING_TYPES)[number];

export const MARKETING_CHANNELS = ['TELEGRAM', 'EMAIL', 'BOTH'] as const;
export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

// Birthday automation is supported now that User.dateOfBirth exists.
export const BIRTHDAY_SUPPORTED = true;

// Idempotency windows (ms).
const WINBACK_DEDUPE_MS = 30 * 24 * 60 * 60 * 1000; // once / 30 days
const DAY_MS = 24 * 60 * 60 * 1000;

export class MarketingServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'MarketingServiceError';
  }
}

export interface ConfigPatch {
  isEnabled?: boolean;
  lapsedDays?: number;
  rebookDays?: number;
  channel?: MarketingChannel;
  messageTemplate?: string | null;
  businessId?: string | null;
}

interface CustomerLite {
  id: string;
  email: string | null;
  telegramId: string | null;
  firstName: string;
  language: string | null;
  emailNotifications: boolean;
  telegramNotifications: boolean;
  dateOfBirth: Date | null;
}

interface ConsentSnapshot {
  optOutAll: boolean;
  email: boolean;
  telegramNotifications: boolean; // mirrors emailNotifications / telegramNotifications convention
}

// Default localized message templates per type. {{firstName}} / {{businessName}}.
const DEFAULT_TEMPLATES: Record<MarketingType, Record<string, string>> = {
  WINBACK: {
    en: "Hi {{firstName}}! We've missed you at {{businessName}}. Come back and book your next appointment — we'd love to see you again.",
    uk: "Привіт, {{firstName}}! Ми скучили за вами у {{businessName}}. Повертайтеся та забронюйте наступний візит — будемо раді вас бачити знову!",
    ru: "Привет, {{firstName}}! Мы скучаем по вам в {{businessName}}. Возвращайтесь и запишитесь на следующий визит — будем рады видеть вас снова!",
  },
  REBOOKING: {
    en: "Hi {{firstName}}! It's been a while since your last visit to {{businessName}}. Time to book again — keep up your routine!",
    uk: "Привіт, {{firstName}}! Минув час від вашого останнього візиту до {{businessName}}. Час записатися знову — не забувайте про себе!",
    ru: "Привет, {{firstName}}! Прошло время с вашего последнего визита в {{businessName}}. Пора записаться снова — не забывайте о себе!",
  },
  BIRTHDAY: {
    en: 'Happy birthday, {{firstName}}! 🎉 {{businessName}} wishes you a wonderful day. Treat yourself — book a visit with us!',
    uk: 'З днем народження, {{firstName}}! 🎉 {{businessName}} бажає вам чудового дня. Побалуйте себе — забронюйте візит до нас!',
    ru: 'С днём рождения, {{firstName}}! 🎉 {{businessName}} желает вам прекрасного дня. Побалуйте себя — запишитесь к нам!',
  },
};

const TITLE_BY_TYPE: Record<MarketingType, Record<string, string>> = {
  WINBACK: { en: 'We miss you!', uk: 'Ми скучили за вами!', ru: 'Мы скучаем по вам!' },
  REBOOKING: { en: 'Time to rebook', uk: 'Час записатися знову', ru: 'Пора записаться снова' },
  BIRTHDAY: { en: 'Happy birthday!', uk: 'З днем народження!', ru: 'С днём рождения!' },
};

export interface RunSummary {
  ownerId: string;
  byType: Record<string, { eligible: number; sent: number; skipped: number }>;
  totalSent: number;
}

export class MarketingService {
  private static db: PrismaClient = prisma;

  // -------------------------------------------------------------------------
  // Config
  // -------------------------------------------------------------------------

  /** Return the 3 automations for an owner, creating disabled defaults if missing. */
  static async getConfig(ownerId: string) {
    const existing = await this.db.marketingAutomation.findMany({ where: { ownerId } });
    const byType = new Map(existing.map((a) => [a.type, a]));

    const result = [];
    for (const type of MARKETING_TYPES) {
      let row = byType.get(type);
      if (!row) {
        row = await this.db.marketingAutomation.create({
          data: { ownerId, type, isEnabled: false },
        });
      }
      result.push(row);
    }
    return result;
  }

  /** Upsert one automation's config. Validates type/channel/days. */
  static async setConfig(ownerId: string, type: string, patch: ConfigPatch) {
    if (!MARKETING_TYPES.includes(type as MarketingType)) {
      throw new MarketingServiceError('INVALID_TYPE', `Unknown automation type: ${type}`);
    }
    if (patch.channel !== undefined && !MARKETING_CHANNELS.includes(patch.channel)) {
      throw new MarketingServiceError('INVALID_CHANNEL', `Unknown channel: ${patch.channel}`);
    }
    if (patch.lapsedDays !== undefined) {
      if (!Number.isInteger(patch.lapsedDays) || patch.lapsedDays < 1 || patch.lapsedDays > 3650) {
        throw new MarketingServiceError('INVALID_DAYS', 'lapsedDays must be 1-3650');
      }
    }
    if (patch.rebookDays !== undefined) {
      if (!Number.isInteger(patch.rebookDays) || patch.rebookDays < 1 || patch.rebookDays > 3650) {
        throw new MarketingServiceError('INVALID_DAYS', 'rebookDays must be 1-3650');
      }
    }

    const data: Record<string, unknown> = {};
    if (patch.isEnabled !== undefined) data.isEnabled = patch.isEnabled;
    if (patch.lapsedDays !== undefined) data.lapsedDays = patch.lapsedDays;
    if (patch.rebookDays !== undefined) data.rebookDays = patch.rebookDays;
    if (patch.channel !== undefined) data.channel = patch.channel;
    if (patch.messageTemplate !== undefined) {
      const t = patch.messageTemplate;
      data.messageTemplate = t && t.trim().length > 0 ? t.trim() : null;
    }
    if (patch.businessId !== undefined) data.businessId = patch.businessId;

    return this.db.marketingAutomation.upsert({
      where: { ownerId_type: { ownerId, type } },
      create: { ownerId, type, isEnabled: false, ...data },
      update: data,
    });
  }

  // -------------------------------------------------------------------------
  // Stats
  // -------------------------------------------------------------------------

  /** Messages sent per type over the last 30/90 days, from MarketingLog. */
  static async stats(ownerId: string) {
    const automations = await this.db.marketingAutomation.findMany({
      where: { ownerId },
      select: { id: true, type: true },
    });
    const idToType = new Map(automations.map((a) => [a.id, a.type]));
    const automationIds = automations.map((a) => a.id);

    const empty = () => ({ WINBACK: 0, REBOOKING: 0, BIRTHDAY: 0 });
    const last30: Record<string, number> = empty();
    const last90: Record<string, number> = empty();

    if (automationIds.length === 0) {
      return { last30Days: last30, last90Days: last90 };
    }

    const since90 = new Date(Date.now() - 90 * DAY_MS);
    const since30 = new Date(Date.now() - 30 * DAY_MS);

    const logs = await this.db.marketingLog.findMany({
      where: { automationId: { in: automationIds }, sentAt: { gte: since90 } },
      select: { automationId: true, sentAt: true },
    });

    for (const log of logs) {
      const type = idToType.get(log.automationId);
      if (!type) continue;
      last90[type] = (last90[type] || 0) + 1;
      if (log.sentAt >= since30) last30[type] = (last30[type] || 0) + 1;
    }

    return { last30Days: last30, last90Days: last90 };
  }

  // -------------------------------------------------------------------------
  // Engine
  // -------------------------------------------------------------------------

  /** Specialist user-ids the owner is responsible for: themselves + active
   *  members of businesses they own. */
  private static async specialistIdsForOwner(ownerId: string): Promise<string[]> {
    const ownedBusinesses = await this.db.business.findMany({
      where: { ownerId },
      select: { id: true },
    });
    const ids = new Set<string>([ownerId]);
    if (ownedBusinesses.length > 0) {
      const members = await this.db.businessMember.findMany({
        where: {
          businessId: { in: ownedBusinesses.map((b) => b.id) },
          isActive: true,
        },
        select: { userId: true },
      });
      for (const m of members) ids.add(m.userId);
    }
    return Array.from(ids);
  }

  /** Display name for the owner's business (for {{businessName}}). */
  private static async businessNameForOwner(ownerId: string): Promise<string> {
    const biz = await this.db.business.findFirst({
      where: { ownerId },
      select: { name: true },
      orderBy: { createdAt: 'asc' },
    });
    if (biz?.name) return biz.name;
    const owner = await this.db.user.findUnique({
      where: { id: ownerId },
      select: { firstName: true, lastName: true },
    });
    return owner ? `${owner.firstName} ${owner.lastName}`.trim() : 'MiyZapis';
  }

  private static render(template: string, vars: Record<string, string>): string {
    let out = template;
    for (const [key, value] of Object.entries(vars)) {
      out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
    }
    return out;
  }

  /** Send a single marketing message respecting the automation channel, the
   *  customer's own notification prefs, AND MarketingConsent (optOutAll +
   *  per-channel). Returns the channels actually sent on. */
  private static async send(
    customer: CustomerLite,
    channel: MarketingChannel,
    title: string,
    message: string,
    consent: ConsentSnapshot | null = null
  ): Promise<string[]> {
    // Respect MarketingConsent: skip entirely if opted out of all marketing.
    if (consent && consent.optOutAll) return [];

    const sent: string[] = [];
    const wantTelegram = channel === 'TELEGRAM' || channel === 'BOTH';
    const wantEmail = channel === 'EMAIL' || channel === 'BOTH';

    // Telegram — also skip if consent row explicitly opts out of Telegram.
    const telegramConsentOk = !consent || consent.telegramNotifications !== false;
    if (wantTelegram && telegramConsentOk && customer.telegramNotifications && customer.telegramId && config.telegram.botToken) {
      try {
        await axios.post(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
          chat_id: customer.telegramId,
          text: `*${title}*\n\n${message}`,
          parse_mode: 'Markdown',
        });
        sent.push('TELEGRAM');
      } catch (e) {
        logger.warn('Marketing Telegram send failed', {
          customerUserId: customer.id,
          error: (e as Error)?.message,
        });
      }
    }

    // Email — also skip if consent row explicitly opts out of email.
    const emailConsentOk = !consent || consent.email !== false;
    if (wantEmail && emailConsentOk && customer.emailNotifications && customer.email) {
      try {
        const ok = await templatedEmailService.sendTemplateEmail({
          to: customer.email,
          templateKey: 'notificationGeneric',
          language: customer.language || 'en',
          data: {
            firstName: customer.firstName,
            title,
            message,
            detailsHtml: '',
          },
        });
        if (ok) sent.push('EMAIL');
      } catch (e) {
        logger.warn('Marketing email send failed', {
          customerUserId: customer.id,
          error: (e as Error)?.message,
        });
      }
    }

    return sent;
  }

  private static customerSelect = {
    id: true,
    email: true,
    telegramId: true,
    firstName: true,
    language: true,
    emailNotifications: true,
    telegramNotifications: true,
    dateOfBirth: true,
  } as const;

  /** Run all enabled automations for one owner. */
  static async runForOwner(ownerId: string): Promise<RunSummary> {
    const automations = await this.getConfig(ownerId);
    const summary: RunSummary = { ownerId, byType: {}, totalSent: 0 };

    const specialistIds = await this.specialistIdsForOwner(ownerId);
    let businessName: string | null = null;
    const getBusinessName = async () => {
      if (businessName === null) businessName = await this.businessNameForOwner(ownerId);
      return businessName;
    };

    for (const automation of automations) {
      const type = automation.type as MarketingType;
      const stat = { eligible: 0, sent: 0, skipped: 0 };
      summary.byType[type] = stat;

      if (!automation.isEnabled) continue;
      if (type === 'BIRTHDAY' && !BIRTHDAY_SUPPORTED) continue;

      try {
        let candidates: CustomerLite[] = [];

        if (type === 'WINBACK') {
          candidates = await this.winbackCandidates(specialistIds, automation.lapsedDays);
        } else if (type === 'REBOOKING') {
          candidates = await this.rebookingCandidates(specialistIds, automation.rebookDays);
        } else if (type === 'BIRTHDAY') {
          candidates = await this.birthdayCandidates(specialistIds);
        }

        stat.eligible = candidates.length;
        if (candidates.length === 0) continue;

        // Fetch MarketingConsent for all candidates across all relevant specialists.
        // Take the most restrictive answer: if any specialist row opts them out, we skip.
        const candidateIds = candidates.map((c) => c.id);
        const consentRows = await this.db.marketingConsent.findMany({
          where: {
            specialistId: { in: specialistIds },
            customerId: { in: candidateIds },
          },
          select: { customerId: true, optOutAll: true, email: true },
        });
        // Merge per customerId: optOutAll true if any row says so; email false if any row says so.
        const consentMap = new Map<string, ConsentSnapshot>();
        for (const row of consentRows) {
          const existing = consentMap.get(row.customerId);
          if (!existing) {
            consentMap.set(row.customerId, {
              optOutAll: row.optOutAll,
              email: row.email,
              telegramNotifications: true, // MarketingConsent has no telegram column; channel handled by user pref
            });
          } else {
            // Most-restrictive merge.
            existing.optOutAll = existing.optOutAll || row.optOutAll;
            existing.email = existing.email && row.email;
          }
        }

        // Idempotency window per type. BIRTHDAY dedupes once per calendar year
        // (from Jan 1 of the current year); the others use a rolling window.
        const dedupeSince =
          type === 'WINBACK'
            ? new Date(Date.now() - WINBACK_DEDUPE_MS)
            : type === 'BIRTHDAY'
            ? new Date(new Date().getFullYear(), 0, 1)
            : new Date(Date.now() - automation.rebookDays * DAY_MS);

        const recentLogs = await this.db.marketingLog.findMany({
          where: { automationId: automation.id, sentAt: { gte: dedupeSince } },
          select: { customerUserId: true },
        });
        const alreadyMessaged = new Set(recentLogs.map((l) => l.customerUserId));

        const bizName = await getBusinessName();

        for (const customer of candidates) {
          if (alreadyMessaged.has(customer.id)) {
            stat.skipped += 1;
            continue;
          }

          const lang = customer.language || 'en';
          const template =
            automation.messageTemplate && automation.messageTemplate.trim().length > 0
              ? automation.messageTemplate
              : DEFAULT_TEMPLATES[type][lang] || DEFAULT_TEMPLATES[type].en;

          const message = this.render(template, {
            firstName: customer.firstName || '',
            businessName: bizName || 'MiyZapis',
          });
          const title = TITLE_BY_TYPE[type][lang] || TITLE_BY_TYPE[type].en;

          const channels = await this.send(
            customer,
            automation.channel as MarketingChannel,
            title,
            message,
            consentMap.get(customer.id) ?? null
          );

          if (channels.length > 0) {
            await this.db.marketingLog.create({
              data: {
                automationId: automation.id,
                customerUserId: customer.id,
                channel: channels.join('+'),
              },
            });
            stat.sent += 1;
            summary.totalSent += 1;
            // Mark immediately so duplicate candidates in the same run dedupe.
            alreadyMessaged.add(customer.id);
          } else {
            stat.skipped += 1;
          }
        }

        await this.db.marketingAutomation.update({
          where: { id: automation.id },
          data: { lastRunAt: new Date() },
        });
      } catch (e) {
        logger.error('Marketing automation run failed', {
          ownerId,
          type,
          error: (e as Error)?.message,
        });
      }
    }

    return summary;
  }

  /** Run every owner's enabled automations (called by the worker). */
  static async runAll(): Promise<{ owners: number; totalSent: number }> {
    // Owners = distinct ownerIds that have at least one enabled automation.
    const enabled = await this.db.marketingAutomation.findMany({
      where: { isEnabled: true },
      select: { ownerId: true },
      distinct: ['ownerId'],
    });

    let totalSent = 0;
    for (const { ownerId } of enabled) {
      try {
        const summary = await this.runForOwner(ownerId);
        totalSent += summary.totalSent;
      } catch (e) {
        logger.error('Marketing runAll owner failed', { ownerId, error: (e as Error)?.message });
      }
    }

    logger.info('Marketing runAll complete', { owners: enabled.length, totalSent });
    return { owners: enabled.length, totalSent };
  }

  // -------------------------------------------------------------------------
  // Candidate queries
  // -------------------------------------------------------------------------

  /** WINBACK: customers whose MOST RECENT booking (any status) was > lapsedDays ago. */
  private static async winbackCandidates(
    specialistIds: string[],
    lapsedDays: number
  ): Promise<CustomerLite[]> {
    if (specialistIds.length === 0) return [];
    const cutoff = new Date(Date.now() - lapsedDays * DAY_MS);

    // Most recent booking per customer for these specialists.
    const grouped = await this.db.booking.groupBy({
      by: ['customerId'],
      where: { specialistId: { in: specialistIds } },
      _max: { scheduledAt: true },
    });

    const lapsedCustomerIds = grouped
      .filter((g) => g._max.scheduledAt && g._max.scheduledAt < cutoff)
      .map((g) => g.customerId);

    if (lapsedCustomerIds.length === 0) return [];

    return this.db.user.findMany({
      where: { id: { in: lapsedCustomerIds }, isActive: true },
      select: this.customerSelect,
    });
  }

  /** REBOOKING: customers whose most recent COMPLETED booking was ~rebookDays
   *  ago (within a 1-day window so it fires once). */
  private static async rebookingCandidates(
    specialistIds: string[],
    rebookDays: number
  ): Promise<CustomerLite[]> {
    if (specialistIds.length === 0) return [];

    const now = Date.now();
    const windowStart = new Date(now - (rebookDays + 1) * DAY_MS);
    const windowEnd = new Date(now - rebookDays * DAY_MS);

    // Most recent COMPLETED booking per customer.
    const grouped = await this.db.booking.groupBy({
      by: ['customerId'],
      where: { specialistId: { in: specialistIds }, status: 'COMPLETED' },
      _max: { scheduledAt: true },
    });

    const dueCustomerIds = grouped
      .filter(
        (g) =>
          g._max.scheduledAt &&
          g._max.scheduledAt >= windowStart &&
          g._max.scheduledAt < windowEnd
      )
      .map((g) => g.customerId);

    if (dueCustomerIds.length === 0) return [];

    return this.db.user.findMany({
      where: { id: { in: dueCustomerIds }, isActive: true },
      select: this.customerSelect,
    });
  }

  /** BIRTHDAY: the owner's customers whose dateOfBirth month+day === today
   *  (server local date). Only customers who HAVE a dateOfBirth are returned. */
  private static async birthdayCandidates(specialistIds: string[]): Promise<CustomerLite[]> {
    if (specialistIds.length === 0) return [];

    // Distinct customers who have ever booked with these specialists.
    const grouped = await this.db.booking.groupBy({
      by: ['customerId'],
      where: { specialistId: { in: specialistIds } },
    });
    const customerIds = grouped.map((g) => g.customerId);
    if (customerIds.length === 0) return [];

    const customers = await this.db.user.findMany({
      where: {
        id: { in: customerIds },
        isActive: true,
        dateOfBirth: { not: null },
      },
      select: this.customerSelect,
    });

    const now = new Date();
    const todayMonth = now.getMonth();
    const todayDay = now.getDate();

    return customers.filter((c) => {
      if (!c.dateOfBirth) return false;
      const dob = new Date(c.dateOfBirth);
      return dob.getMonth() === todayMonth && dob.getDate() === todayDay;
    });
  }
}
