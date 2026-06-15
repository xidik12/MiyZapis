import axios from 'axios';
import { prisma } from '@/config/database';
import { emailService } from '@/services/email';
import { config } from '@/config';
import { logger } from '@/utils/logger';

// ---------------------------------------------------------------------------
// CRM Service — tags, segments, campaigns, tasks, consent, leads,
// and the UNIFIED client record aggregated across all revenue streams.
// ---------------------------------------------------------------------------

export class CrmServiceError extends Error {
  constructor(public code: string, message: string) {
    super(message);
    this.name = 'CrmServiceError';
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SegmentFilter {
  minSpent?: number;
  maxSpent?: number;
  lapsedDays?: number;
  activeWithinDays?: number;
  minBookings?: number;
  tagIds?: string[];
  hasEmail?: boolean;
  hasPhone?: boolean;
  search?: string;
}

export interface CrmClient {
  customerId: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  telegramId?: string | null;
  telegramNotifications?: boolean;
  bookingsCount: number;
  totalSpent: number;
  currency: string;
  lastVisitDate: string | null;
  isActive: boolean;
  tags: Array<{ id: string; name: string; color: string; createdAt: string }>;
  consent?: {
    email: boolean;
    sms: boolean;
    push: boolean;
    optOutAll: boolean;
    source?: string | null;
    updatedAt?: string;
  } | null;
  spendBreakdown?: { bookings: number; giftCards: number; memberships: number; store: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve Specialist row from userId (throws 404 if missing). */
async function getSpecialistId(ownerId: string): Promise<string> {
  const sp = await prisma.specialist.findUnique({
    where: { userId: ownerId },
    select: { id: true },
  });
  if (!sp) throw new CrmServiceError('SPECIALIST_NOT_FOUND', 'No specialist profile for this user');
  return sp.id;
}

/** Also returns the userId for this specialistId (for GiftCard ownerId lookup). */
async function getSpecialistInfo(ownerId: string): Promise<{ specialistId: string; userId: string }> {
  const sp = await prisma.specialist.findUnique({
    where: { userId: ownerId },
    select: { id: true, userId: true },
  });
  if (!sp) throw new CrmServiceError('SPECIALIST_NOT_FOUND', 'No specialist profile for this user');
  return { specialistId: sp.id, userId: sp.userId };
}

// ─── Unified Client Aggregation ───────────────────────────────────────────────

/**
 * Build the full CrmClient list for a given specialist. This is the
 * expensive query — results are assembled from:
 *   1. Bookings (COMPLETED) — sum totalAmount, count, max scheduledAt
 *   2. Gift cards (GiftCard.purchasedByUserId where ownerId matches) — sum initialAmount
 *   3. CustomerMembership → MembershipPlan (ownerId matches) — sum plan.price
 *   4. ProductOrder (ownerId matches) — sum total
 *
 * User info (name, email, phone, avatar) comes from User rows.
 * Tags + consent are attached per client.
 */
export async function buildClientList(
  specialistId: string,
  userId: string,
): Promise<CrmClient[]> {
  // --- 1. Bookings ---
  const bookingRows = await prisma.booking.findMany({
    where: { specialistId: userId, status: 'COMPLETED' },
    select: {
      customerId: true,
      totalAmount: true,
      scheduledAt: true,
    },
  });

  // Map: customerId → { bookingsCount, bookingsSpend, lastVisitDate }
  const bookingMap = new Map<string, { count: number; spend: number; lastVisit: Date }>();
  for (const b of bookingRows) {
    const cid = b.customerId;
    const amt = Number(b.totalAmount);
    const prev = bookingMap.get(cid);
    if (!prev) {
      bookingMap.set(cid, { count: 1, spend: amt, lastVisit: b.scheduledAt });
    } else {
      bookingMap.set(cid, {
        count: prev.count + 1,
        spend: prev.spend + amt,
        lastVisit: b.scheduledAt > prev.lastVisit ? b.scheduledAt : prev.lastVisit,
      });
    }
  }

  // --- 2. Gift cards purchased for this specialist's customers ---
  // GiftCard.ownerId = specialist's userId; purchasedByUserId = customer userId.
  // This represents spend the customer made on gift cards with this specialist.
  const giftCardRows = await prisma.giftCard.findMany({
    where: { ownerId: userId },
    select: {
      purchasedByUserId: true,
      initialAmount: true,
    },
  });

  const gcMap = new Map<string, number>();
  for (const gc of giftCardRows) {
    if (!gc.purchasedByUserId) continue;
    const cid = gc.purchasedByUserId;
    gcMap.set(cid, (gcMap.get(cid) ?? 0) + Number(gc.initialAmount));
  }

  // --- 3. Customer memberships whose plan belongs to this specialist ---
  // MembershipPlan.ownerId = specialist's userId.
  let membershipMap = new Map<string, number>();
  try {
    const membershipRows = await prisma.customerMembership.findMany({
      where: { plan: { ownerId: userId } },
      select: {
        customerUserId: true,
        plan: { select: { price: true } },
      },
    });
    for (const m of membershipRows) {
      const cid = m.customerUserId;
      membershipMap.set(cid, (membershipMap.get(cid) ?? 0) + Number(m.plan.price));
    }
  } catch (err) {
    logger.warn('CRM: could not aggregate memberships', { err: (err as Error)?.message });
  }

  // --- 4. Store orders for this specialist's customers ---
  // ProductOrder.ownerId = specialist's userId; customerUserId = customer.
  let storeMap = new Map<string, number>();
  try {
    const orderRows = await prisma.productOrder.findMany({
      where: { ownerId: userId, customerUserId: { not: null } },
      select: { customerUserId: true, total: true },
    });
    for (const o of orderRows) {
      if (!o.customerUserId) continue;
      storeMap.set(o.customerUserId, (storeMap.get(o.customerUserId) ?? 0) + Number(o.total));
    }
  } catch (err) {
    logger.warn('CRM: could not aggregate store orders', { err: (err as Error)?.message });
  }

  // --- Build union of all customerIds ---
  const allCustomerIds = new Set<string>([
    ...bookingMap.keys(),
    ...gcMap.keys(),
    ...membershipMap.keys(),
    ...storeMap.keys(),
  ]);

  if (allCustomerIds.size === 0) return [];

  // --- Fetch user rows ---
  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(allCustomerIds) } },
    select: { id: true, firstName: true, lastName: true, email: true, phoneNumber: true, avatar: true, telegramId: true, telegramNotifications: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // --- Fetch tags ---
  const tagAssignments = await prisma.customerTagAssignment.findMany({
    where: { specialistId, customerId: { in: Array.from(allCustomerIds) } },
    include: { tag: { select: { id: true, name: true, color: true, createdAt: true } } },
  });
  const tagsByCustomer = new Map<string, typeof tagAssignments>();
  for (const ta of tagAssignments) {
    if (!tagsByCustomer.has(ta.customerId)) tagsByCustomer.set(ta.customerId, []);
    tagsByCustomer.get(ta.customerId)!.push(ta);
  }

  // --- Fetch consent ---
  const consents = await prisma.marketingConsent.findMany({
    where: { specialistId, customerId: { in: Array.from(allCustomerIds) } },
  });
  const consentMap = new Map(consents.map((c) => [c.customerId, c]));

  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const clients: CrmClient[] = [];
  for (const cid of allCustomerIds) {
    const user = userMap.get(cid);
    const bInfo = bookingMap.get(cid);
    const gcSpend = gcMap.get(cid) ?? 0;
    const memSpend = membershipMap.get(cid) ?? 0;
    const storeSpend = storeMap.get(cid) ?? 0;
    const bookSpend = bInfo?.spend ?? 0;

    const totalSpent = bookSpend + gcSpend + memSpend + storeSpend;
    const lastVisitDate = bInfo?.lastVisit ?? null;
    const isActive = lastVisitDate ? (now - lastVisitDate.getTime()) <= THIRTY_DAYS_MS : false;

    const tags = (tagsByCustomer.get(cid) ?? []).map((ta) => ({
      id: ta.tag.id,
      name: ta.tag.name,
      color: ta.tag.color,
      createdAt: ta.tag.createdAt.toISOString(),
    }));

    const consentRow = consentMap.get(cid);
    const consent = consentRow
      ? {
          email: consentRow.email,
          sms: consentRow.sms,
          push: consentRow.push,
          optOutAll: consentRow.optOutAll,
          source: consentRow.source,
          updatedAt: consentRow.updatedAt.toISOString(),
        }
      : null;

    clients.push({
      customerId: cid,
      name: user ? `${user.firstName} ${user.lastName}`.trim() : cid,
      email: user?.email ?? null,
      phone: user?.phoneNumber ?? null,
      avatar: user?.avatar ?? null,
      telegramId: user?.telegramId ?? null,
      telegramNotifications: user?.telegramNotifications ?? true,
      bookingsCount: bInfo?.count ?? 0,
      totalSpent,
      currency: 'UAH',
      lastVisitDate: lastVisitDate ? lastVisitDate.toISOString() : null,
      isActive,
      tags,
      consent,
      spendBreakdown: { bookings: bookSpend, giftCards: gcSpend, memberships: memSpend, store: storeSpend },
    });
  }

  return clients;
}

/** Apply a SegmentFilter over a list of CrmClient and return matched items. */
export function applyFilter(clients: CrmClient[], filter: SegmentFilter): CrmClient[] {
  const now = Date.now();
  return clients.filter((c) => {
    if (filter.minSpent !== undefined && c.totalSpent < filter.minSpent) return false;
    if (filter.maxSpent !== undefined && c.totalSpent > filter.maxSpent) return false;
    if (filter.minBookings !== undefined && c.bookingsCount < filter.minBookings) return false;
    if (filter.lapsedDays !== undefined) {
      if (!c.lastVisitDate) return false; // no visits at all
      const ms = filter.lapsedDays * 24 * 60 * 60 * 1000;
      if (now - new Date(c.lastVisitDate).getTime() < ms) return false;
    }
    if (filter.activeWithinDays !== undefined) {
      if (!c.lastVisitDate) return false;
      const ms = filter.activeWithinDays * 24 * 60 * 60 * 1000;
      if (now - new Date(c.lastVisitDate).getTime() > ms) return false;
    }
    if (filter.tagIds && filter.tagIds.length > 0) {
      const clientTagIds = new Set(c.tags.map((t) => t.id));
      const hasAny = filter.tagIds.some((tid) => clientTagIds.has(tid));
      if (!hasAny) return false;
    }
    if (filter.hasEmail === true && !c.email) return false;
    if (filter.hasEmail === false && !!c.email) return false;
    if (filter.hasPhone === true && !c.phone) return false;
    if (filter.hasPhone === false && !!c.phone) return false;
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const haystack = `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

// ─── CrmService ───────────────────────────────────────────────────────────────

export class CrmService {
  // ── Tags ──────────────────────────────────────────────────────────────────

  static async listTags(ownerId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const tags = await prisma.customerTag.findMany({
      where: { specialistId },
      include: { _count: { select: { assignments: true } } },
      orderBy: { createdAt: 'asc' },
    });
    return tags.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      count: t._count.assignments,
      createdAt: t.createdAt.toISOString(),
    }));
  }

  static async createTag(ownerId: string, name: string, color: string) {
    const specialistId = await getSpecialistId(ownerId);
    try {
      const tag = await prisma.customerTag.create({
        data: { specialistId, name, color },
      });
      return { id: tag.id, name: tag.name, color: tag.color, count: 0, createdAt: tag.createdAt.toISOString() };
    } catch {
      throw new CrmServiceError('DUPLICATE_TAG', `Tag "${name}" already exists`);
    }
  }

  static async updateTag(ownerId: string, tagId: string, patch: { name?: string; color?: string }) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.customerTag.findFirst({ where: { id: tagId, specialistId } });
    if (!existing) throw new CrmServiceError('TAG_NOT_FOUND', 'Tag not found');
    const tag = await prisma.customerTag.update({
      where: { id: tagId },
      data: patch,
      include: { _count: { select: { assignments: true } } },
    });
    return { id: tag.id, name: tag.name, color: tag.color, count: tag._count.assignments, createdAt: tag.createdAt.toISOString() };
  }

  static async deleteTag(ownerId: string, tagId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.customerTag.findFirst({ where: { id: tagId, specialistId } });
    if (!existing) throw new CrmServiceError('TAG_NOT_FOUND', 'Tag not found');
    // Cascade via schema (onDelete: Cascade on CustomerTagAssignment.tag)
    await prisma.customerTag.delete({ where: { id: tagId } });
    return { success: true };
  }

  static async assignTag(ownerId: string, customerId: string, tagId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const tag = await prisma.customerTag.findFirst({ where: { id: tagId, specialistId } });
    if (!tag) throw new CrmServiceError('TAG_NOT_FOUND', 'Tag not found');
    // Idempotent — ignore duplicate
    await prisma.customerTagAssignment.upsert({
      where: { tagId_customerId: { tagId, customerId } },
      create: { tagId, specialistId, customerId },
      update: {},
    });
    return { success: true };
  }

  static async unassignTag(ownerId: string, customerId: string, tagId: string) {
    const specialistId = await getSpecialistId(ownerId);
    await prisma.customerTagAssignment.deleteMany({
      where: { tagId, customerId, specialistId },
    });
    return { success: true };
  }

  // ── Segments ──────────────────────────────────────────────────────────────

  static async listSegments(ownerId: string) {
    const { specialistId, userId } = await getSpecialistInfo(ownerId);
    const segments = await prisma.customerSegment.findMany({
      where: { specialistId },
      orderBy: { createdAt: 'asc' },
    });
    // Compute count for each segment by evaluating the filter
    const clients = await buildClientList(specialistId, userId);
    return segments.map((s) => {
      const filter = (s.filter ?? {}) as SegmentFilter;
      const matched = applyFilter(clients, filter);
      return {
        id: s.id,
        name: s.name,
        description: s.description,
        filter,
        count: matched.length,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      };
    });
  }

  static async createSegment(ownerId: string, name: string, description: string | undefined, filter: SegmentFilter) {
    const specialistId = await getSpecialistId(ownerId);
    const seg = await prisma.customerSegment.create({
      data: { specialistId, name, description, filter: filter as object },
    });
    return {
      id: seg.id,
      name: seg.name,
      description: seg.description,
      filter: seg.filter as SegmentFilter,
      count: 0,
      createdAt: seg.createdAt.toISOString(),
      updatedAt: seg.updatedAt.toISOString(),
    };
  }

  static async updateSegment(ownerId: string, segId: string, patch: { name?: string; description?: string; filter?: SegmentFilter }) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.customerSegment.findFirst({ where: { id: segId, specialistId } });
    if (!existing) throw new CrmServiceError('SEGMENT_NOT_FOUND', 'Segment not found');
    const updated = await prisma.customerSegment.update({
      where: { id: segId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.filter !== undefined ? { filter: patch.filter as object } : {}),
      },
    });
    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      filter: updated.filter as SegmentFilter,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  static async deleteSegment(ownerId: string, segId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.customerSegment.findFirst({ where: { id: segId, specialistId } });
    if (!existing) throw new CrmServiceError('SEGMENT_NOT_FOUND', 'Segment not found');
    await prisma.customerSegment.delete({ where: { id: segId } });
    return { success: true };
  }

  static async previewSegment(ownerId: string, filter: SegmentFilter) {
    const { specialistId, userId } = await getSpecialistInfo(ownerId);
    const clients = await buildClientList(specialistId, userId);
    const matched = applyFilter(clients, filter);
    return {
      count: matched.length,
      sample: matched.slice(0, 20),
    };
  }

  // ── Campaigns ─────────────────────────────────────────────────────────────

  static async listCampaigns(ownerId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const rows = await prisma.segmentCampaign.findMany({
      where: { specialistId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(campaignShape);
  }

  static async createCampaign(
    ownerId: string,
    body: { name: string; channel?: string; subject?: string; body: string; filter?: SegmentFilter; segmentId?: string },
  ) {
    const specialistId = await getSpecialistId(ownerId);
    const channel = ['email', 'telegram', 'both'].includes(body.channel ?? '') ? body.channel! : 'email';
    const row = await prisma.segmentCampaign.create({
      data: {
        specialistId,
        name: body.name,
        channel,
        subject: body.subject,
        body: body.body,
        filter: body.filter ? (body.filter as object) : undefined,
        segmentId: body.segmentId,
        status: 'draft',
      },
    });
    return campaignShape(row);
  }

  static async sendCampaign(ownerId: string, campaignId: string) {
    const { specialistId, userId } = await getSpecialistInfo(ownerId);
    const campaign = await prisma.segmentCampaign.findFirst({
      where: { id: campaignId, specialistId },
    });
    if (!campaign) throw new CrmServiceError('CAMPAIGN_NOT_FOUND', 'Campaign not found');
    if (campaign.status !== 'draft') throw new CrmServiceError('ALREADY_SENT', 'Campaign is not in draft state');

    // Resolve audience: segmentId → segment.filter | campaign.filter | all clients
    let filter: SegmentFilter = {};
    if (campaign.segmentId) {
      const seg = await prisma.customerSegment.findFirst({ where: { id: campaign.segmentId } });
      if (seg) filter = (seg.filter ?? {}) as SegmentFilter;
    } else if (campaign.filter) {
      filter = campaign.filter as SegmentFilter;
    }

    const allClients = await buildClientList(specialistId, userId);
    const audience = applyFilter(allClients, filter);

    const channel = campaign.channel || 'email';
    const wantEmail = channel === 'email' || channel === 'both';
    const wantTelegram = channel === 'telegram' || channel === 'both';
    const notOptedOut = (c: CrmClient) => !c.consent?.optOutAll;

    // Per-channel eligibility (respects consent + reachability).
    const emailEligible = wantEmail
      ? audience.filter((c) => !!c.email && notOptedOut(c) && c.consent?.email !== false)
      : [];
    const tgEligible = wantTelegram
      ? audience.filter((c) => !!c.telegramId && notOptedOut(c) && c.telegramNotifications !== false)
      : [];

    // recipientCount = distinct people reached on any channel.
    const reached = new Set<string>([...emailEligible, ...tgEligible].map((c) => c.customerId));
    const recipientCount = reached.size;
    let sentCount = 0;

    // Mark as sending
    await prisma.segmentCampaign.update({
      where: { id: campaignId },
      data: { status: 'sending', recipientCount },
    });

    const plainBody = campaign.body.replace(/<[^>]+>/g, '').trim();

    // Email
    for (const client of emailEligible) {
      try {
        await emailService.sendEmail({
          to: client.email!,
          subject: campaign.subject ?? campaign.name,
          html: campaign.body,
          text: plainBody,
        });
        sentCount++;
      } catch (err) {
        logger.warn('CRM campaign: email send failed', { customerId: client.customerId, err: (err as Error)?.message });
      }
    }

    // Telegram (direct message via the platform bot)
    if (wantTelegram && config.telegram.botToken) {
      const tgText = `${campaign.subject ? `${campaign.subject}\n\n` : ''}${plainBody}`;
      for (const client of tgEligible) {
        try {
          await axios.post(`https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`, {
            chat_id: client.telegramId,
            text: tgText,
            disable_web_page_preview: true,
          });
          sentCount++;
        } catch (err) {
          logger.warn('CRM campaign: telegram send failed', { customerId: client.customerId, err: (err as Error)?.message });
        }
      }
    }

    const updated = await prisma.segmentCampaign.update({
      where: { id: campaignId },
      data: { status: 'sent', sentCount, sentAt: new Date() },
    });
    return campaignShape(updated);
  }

  static async deleteCampaign(ownerId: string, campaignId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.segmentCampaign.findFirst({ where: { id: campaignId, specialistId } });
    if (!existing) throw new CrmServiceError('CAMPAIGN_NOT_FOUND', 'Campaign not found');
    await prisma.segmentCampaign.delete({ where: { id: campaignId } });
    return { success: true };
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  static async listTasks(ownerId: string, params: { status?: string; customerId?: string }) {
    const specialistId = await getSpecialistId(ownerId);
    const where: Record<string, unknown> = { specialistId };
    if (params.status) where.status = params.status;
    if (params.customerId) where.customerId = params.customerId;

    const tasks = await prisma.clientTask.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Best-effort: look up customer names
    const customerIds = [...new Set(tasks.map((t) => t.customerId).filter(Boolean))] as string[];
    const users = customerIds.length
      ? await prisma.user.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const nameMap = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));

    return tasks.map((t) => taskShape(t, t.customerId ? nameMap.get(t.customerId) ?? null : null));
  }

  static async createTask(ownerId: string, body: { title: string; notes?: string; dueDate?: string; customerId?: string }) {
    const specialistId = await getSpecialistId(ownerId);
    const task = await prisma.clientTask.create({
      data: {
        specialistId,
        title: body.title,
        notes: body.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        customerId: body.customerId,
        status: 'open',
      },
    });
    return taskShape(task, null);
  }

  static async updateTask(ownerId: string, taskId: string, patch: Partial<{ title: string; notes: string; dueDate: string; status: string }>) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.clientTask.findFirst({ where: { id: taskId, specialistId } });
    if (!existing) throw new CrmServiceError('TASK_NOT_FOUND', 'Task not found');

    const data: Record<string, unknown> = {};
    if (patch.title !== undefined) data.title = patch.title;
    if (patch.notes !== undefined) data.notes = patch.notes;
    if (patch.dueDate !== undefined) data.dueDate = new Date(patch.dueDate);
    if (patch.status !== undefined) {
      data.status = patch.status;
      if (patch.status === 'done' && !existing.completedAt) data.completedAt = new Date();
      if (patch.status === 'open') data.completedAt = null;
    }

    const updated = await prisma.clientTask.update({ where: { id: taskId }, data });
    return taskShape(updated, null);
  }

  static async toggleTask(ownerId: string, taskId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.clientTask.findFirst({ where: { id: taskId, specialistId } });
    if (!existing) throw new CrmServiceError('TASK_NOT_FOUND', 'Task not found');

    const newStatus = existing.status === 'open' ? 'done' : 'open';
    const updated = await prisma.clientTask.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        completedAt: newStatus === 'done' ? new Date() : null,
      },
    });
    return taskShape(updated, null);
  }

  static async deleteTask(ownerId: string, taskId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.clientTask.findFirst({ where: { id: taskId, specialistId } });
    if (!existing) throw new CrmServiceError('TASK_NOT_FOUND', 'Task not found');
    await prisma.clientTask.delete({ where: { id: taskId } });
    return { success: true };
  }

  // ── Consent ───────────────────────────────────────────────────────────────

  static async getConsent(ownerId: string, customerId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const row = await prisma.marketingConsent.findUnique({
      where: { specialistId_customerId: { specialistId, customerId } },
    });
    if (!row) {
      return { email: true, sms: true, push: true, optOutAll: false, source: null };
    }
    return consentShape(row);
  }

  static async setConsent(ownerId: string, customerId: string, patch: Partial<{ email: boolean; sms: boolean; push: boolean; optOutAll: boolean; source?: string }>) {
    const specialistId = await getSpecialistId(ownerId);
    const row = await prisma.marketingConsent.upsert({
      where: { specialistId_customerId: { specialistId, customerId } },
      create: {
        specialistId,
        customerId,
        email: patch.email ?? true,
        sms: patch.sms ?? true,
        push: patch.push ?? true,
        optOutAll: patch.optOutAll ?? false,
        source: patch.source,
      },
      update: {
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.sms !== undefined ? { sms: patch.sms } : {}),
        ...(patch.push !== undefined ? { push: patch.push } : {}),
        ...(patch.optOutAll !== undefined ? { optOutAll: patch.optOutAll } : {}),
        ...(patch.source !== undefined ? { source: patch.source } : {}),
      },
    });
    return consentShape(row);
  }

  // ── Leads ─────────────────────────────────────────────────────────────────

  static async listLeads(ownerId: string, params: { stage?: string }) {
    const specialistId = await getSpecialistId(ownerId);
    const where: Record<string, unknown> = { specialistId };
    if (params.stage) where.stage = params.stage;
    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
    return leads.map(leadShape);
  }

  static async createLead(
    ownerId: string,
    body: Partial<{ name: string; email: string; phone: string; source: string; stage: string; value: number; notes: string }>,
  ) {
    const specialistId = await getSpecialistId(ownerId);
    if (!body.name) throw new CrmServiceError('MISSING_NAME', 'Lead name is required');
    const lead = await prisma.lead.create({
      data: {
        specialistId,
        name: body.name,
        email: body.email,
        phone: body.phone,
        source: body.source,
        stage: body.stage ?? 'new',
        value: body.value !== undefined ? body.value : undefined,
        notes: body.notes,
      },
    });
    return leadShape(lead);
  }

  static async updateLead(ownerId: string, leadId: string, patch: Partial<{ name: string; email: string; phone: string; source: string; stage: string; value: number; notes: string }>) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.lead.findFirst({ where: { id: leadId, specialistId } });
    if (!existing) throw new CrmServiceError('LEAD_NOT_FOUND', 'Lead not found');
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.source !== undefined ? { source: patch.source } : {}),
        ...(patch.stage !== undefined ? { stage: patch.stage } : {}),
        ...(patch.value !== undefined ? { value: patch.value } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
    });
    return leadShape(updated);
  }

  static async setLeadStage(ownerId: string, leadId: string, stage: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.lead.findFirst({ where: { id: leadId, specialistId } });
    if (!existing) throw new CrmServiceError('LEAD_NOT_FOUND', 'Lead not found');
    const updated = await prisma.lead.update({ where: { id: leadId }, data: { stage } });
    return leadShape(updated);
  }

  static async convertLead(ownerId: string, leadId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.lead.findFirst({ where: { id: leadId, specialistId } });
    if (!existing) throw new CrmServiceError('LEAD_NOT_FOUND', 'Lead not found');
    // Mark won (idempotent if already won)
    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { stage: 'won' },
    });
    return leadShape(updated);
  }

  static async deleteLead(ownerId: string, leadId: string) {
    const specialistId = await getSpecialistId(ownerId);
    const existing = await prisma.lead.findFirst({ where: { id: leadId, specialistId } });
    if (!existing) throw new CrmServiceError('LEAD_NOT_FOUND', 'Lead not found');
    await prisma.lead.delete({ where: { id: leadId } });
    return { success: true };
  }

  // ── Clients (unified) ─────────────────────────────────────────────────────

  static async getClients(ownerId: string, params: { tagId?: string; search?: string }) {
    const { specialistId, userId } = await getSpecialistInfo(ownerId);
    let clients = await buildClientList(specialistId, userId);

    if (params.tagId) {
      clients = clients.filter((c) => c.tags.some((t) => t.id === params.tagId));
    }
    if (params.search) {
      const q = params.search.toLowerCase();
      clients = clients.filter((c) => {
        const h = `${c.name} ${c.email ?? ''} ${c.phone ?? ''}`.toLowerCase();
        return h.includes(q);
      });
    }
    return clients;
  }

  static async getClient(ownerId: string, customerId: string) {
    const { specialistId, userId } = await getSpecialistInfo(ownerId);
    const clients = await buildClientList(specialistId, userId);
    const client = clients.find((c) => c.customerId === customerId);
    if (!client) throw new CrmServiceError('CLIENT_NOT_FOUND', 'Client not found');
    return client;
  }
}

// ─── Shape helpers ────────────────────────────────────────────────────────────

function campaignShape(row: {
  id: string; name: string; channel: string; subject: string | null; body: string;
  filter: unknown; segmentId: string | null; status: string; recipientCount: number;
  sentCount: number; createdAt: Date; sentAt: Date | null;
}) {
  return {
    id: row.id,
    name: row.name,
    channel: row.channel,
    subject: row.subject,
    body: row.body,
    filter: row.filter ?? null,
    segmentId: row.segmentId,
    status: row.status,
    recipientCount: row.recipientCount,
    sentCount: row.sentCount,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
  };
}

function taskShape(
  row: { id: string; customerId: string | null; title: string; notes: string | null; dueDate: Date | null; status: string; createdAt: Date; completedAt: Date | null },
  customerName: string | null,
) {
  return {
    id: row.id,
    customerId: row.customerId,
    customerName,
    title: row.title,
    notes: row.notes,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
  };
}

function consentShape(row: { email: boolean; sms: boolean; push: boolean; optOutAll: boolean; source: string | null; updatedAt: Date }) {
  return {
    email: row.email,
    sms: row.sms,
    push: row.push,
    optOutAll: row.optOutAll,
    source: row.source,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function leadShape(row: {
  id: string; name: string; email: string | null; phone: string | null;
  source: string | null; stage: string; value: unknown; notes: string | null;
  customerId: string | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    stage: row.stage,
    value: row.value !== null && row.value !== undefined ? Number(row.value) : null,
    notes: row.notes,
    customerId: row.customerId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
