// Multi-specialist business / organisation service.
// Standalone specialists are unaffected — joining a business is opt-in.
//
// Permission model:
//   OWNER     — full control (rename, delete, change billing, invite/remove anyone)
//   MANAGER   — invite/remove specialists, see business-wide dashboard
//   SPECIALIST — appears in the business directory; owns their own bookings/services
//
// businessId is denormalised onto Specialist/Service/Booking for fast scoping.

import crypto from 'crypto';
import { prisma } from '@/config/database';
import type { Prisma } from '@prisma/client';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { emailService } from '@/services/email';

export type BusinessRole = 'OWNER' | 'MANAGER' | 'SPECIALIST';

export interface CreateBusinessInput {
  name: string;
  slug?: string;          // auto-generated from name if missing
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  websiteUrl?: string;
  logoUrl?: string;
  currency?: string;
  timezone?: string;
  taxId?: string;
}

export interface InviteMemberInput {
  email: string;           // existing user → joins immediately; unknown email → pending email invite
  role: BusinessRole;
}

export class BusinessService {
  // ---- Lifecycle ---------------------------------------------------------
  static async create(ownerId: string, input: CreateBusinessInput) {
    const slug = (input.slug || slugify(input.name)).slice(0, 60);
    if (!slug) throw new Error('VALIDATION_ERROR');

    return prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          name: input.name,
          slug,
          description: input.description,
          email: input.email,
          phone: input.phone,
          address: input.address,
          websiteUrl: input.websiteUrl,
          logoUrl: input.logoUrl,
          currency: input.currency ?? 'UAH',
          timezone: input.timezone ?? 'UTC',
          taxId: input.taxId,
          ownerId,
        },
      });
      // Owner is automatically a member with OWNER role.
      await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId: ownerId,
          role: 'OWNER',
          joinedAt: new Date(),
        },
      });
      return business;
    });
  }

  static async update(businessId: string, callerId: string, patch: Partial<CreateBusinessInput>) {
    await this.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    return prisma.business.update({
      where: { id: businessId },
      data: {
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.description !== undefined ? { description: patch.description } : {}),
        ...(patch.email !== undefined ? { email: patch.email } : {}),
        ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
        ...(patch.address !== undefined ? { address: patch.address } : {}),
        ...(patch.websiteUrl !== undefined ? { websiteUrl: patch.websiteUrl } : {}),
        ...(patch.logoUrl !== undefined ? { logoUrl: patch.logoUrl } : {}),
        ...(patch.currency !== undefined ? { currency: patch.currency } : {}),
        ...(patch.timezone !== undefined ? { timezone: patch.timezone } : {}),
        ...(patch.taxId !== undefined ? { taxId: patch.taxId } : {}),
      },
    });
  }

  static async deactivate(businessId: string, callerId: string) {
    await this.requireRole(businessId, callerId, ['OWNER']);
    return prisma.business.update({ where: { id: businessId }, data: { isActive: false } });
  }

  static async getById(businessId: string, callerId: string) {
    await this.requireMember(businessId, callerId);
    return prisma.business.findUnique({
      where: { id: businessId },
      include: { members: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } } },
    });
  }

  // Public-facing — no auth needed. Returns active business + its public-facing specialists.
  static async getBySlug(slug: string) {
    // Resolve by slug OR id — the public /biz link & QR fall back to the id when
    // no slug exists, so /biz/<id> must resolve too.
    return prisma.business.findFirst({
      where: { isActive: true, OR: [{ slug }, { id: slug }] },
      include: {
        members: {
          where: { isActive: true, role: { in: ['OWNER', 'SPECIALIST'] } },
          include: {
            user: {
              select: {
                id: true, firstName: true, lastName: true, avatar: true,
                specialist: { select: { id: true, bio: true, slug: true, isVerified: true } },
              },
            },
          },
        },
      },
    });
  }

  static async listMine(userId: string) {
    return prisma.businessMember.findMany({
      where: { userId, isActive: true },
      include: { business: true },
      orderBy: { joinedAt: 'asc' },
    });
  }

  // ---- Members ----------------------------------------------------------
  static async invite(businessId: string, callerId: string, input: InviteMemberInput) {
    await this.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    if (!['MANAGER', 'SPECIALIST'].includes(input.role)) throw new Error('INVALID_ROLE');
    const email = input.email.trim().toLowerCase();
    if (!email) throw new Error('VALIDATION_ERROR');

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true } });

    // ── Existing user → join immediately ─────────────────────────────────────
    if (user) {
      const existing = await prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId: user.id } },
      });
      if (existing) throw new Error('ALREADY_MEMBER');

      const member = await prisma.businessMember.create({
        data: {
          businessId,
          userId: user.id,
          role: input.role,
          invitedBy: callerId,
          joinedAt: new Date(), // auto-join for now; can switch to email-accept later
        },
      });

      // Denormalise businessId onto the specialist profile so dashboard queries are fast.
      if (input.role === 'SPECIALIST') {
        await prisma.specialist.updateMany({ where: { userId: user.id }, data: { businessId } });
      }
      return member;
    }

    // ── Unknown email → create / refresh a pending email invite ──────────────
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const token = crypto.randomBytes(32).toString('hex');

    // Dedupe: reuse an existing unaccepted, non-expired invite for [businessId,email].
    const open = await prisma.businessInvite.findFirst({
      where: { businessId, email, acceptedAt: null, expiresAt: { gt: new Date() } },
    });

    const invite = open
      ? await prisma.businessInvite.update({
          where: { id: open.id },
          data: { role: input.role, invitedBy: callerId, token, expiresAt },
        })
      : await prisma.businessInvite.create({
          data: { businessId, email, role: input.role, token, invitedBy: callerId, expiresAt },
        });

    // Send the branded invite email (non-blocking — failure must not break the invite).
    void this.sendInviteEmail(businessId, invite.email, invite.role, invite.token);

    return { pending: true, email: invite.email };
  }

  // Look up the business name + send the branded invite email.
  private static async sendInviteEmail(businessId: string, email: string, role: string, token: string) {
    try {
      const business = await prisma.business.findUnique({ where: { id: businessId }, select: { name: true } });
      const frontendUrl = config.frontend.url || 'https://miyzapis.com';
      // /invite/:token handles both cases: logged-in users accept immediately;
      // logged-out users are redirected to /auth/register?invite=token.
      const inviteUrl = `${frontendUrl}/invite/${encodeURIComponent(token)}`;
      await emailService.sendTemplateEmail({
        to: email,
        templateKey: 'businessInvite',
        language: 'en',
        data: { businessName: business?.name ?? 'a business', role, inviteUrl },
      });
    } catch (err) {
      logger.error('Failed to send business invite email', { businessId, email, error: err });
    }
  }

  // ---- Invites (pending email invites) ----------------------------------
  static async listInvites(businessId: string, callerId: string) {
    await this.requireMember(businessId, callerId);
    return prisma.businessInvite.findMany({
      where: { businessId, acceptedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
    });
  }

  static async revokeInvite(businessId: string, callerId: string, inviteId: string) {
    await this.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    const invite = await prisma.businessInvite.findUnique({ where: { id: inviteId } });
    if (!invite || invite.businessId !== businessId) throw new Error('INVITE_NOT_FOUND');
    await prisma.businessInvite.delete({ where: { id: inviteId } });
    return { revoked: true };
  }

  static async acceptInvite(token: string, userId: string) {
    const invite = await prisma.businessInvite.findUnique({ where: { token } });
    if (!invite) throw new Error('INVITE_NOT_FOUND');
    if (invite.acceptedAt) throw new Error('INVITE_ALREADY_USED');
    if (invite.expiresAt < new Date()) throw new Error('INVITE_EXPIRED');

    const existing = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId: invite.businessId, userId } },
    });
    if (existing) throw new Error('ALREADY_MEMBER');

    const now = new Date();
    await prisma.businessMember.create({
      data: {
        businessId: invite.businessId,
        userId,
        role: invite.role,
        invitedBy: invite.invitedBy,
        joinedAt: now,
      },
    });
    if (invite.role === 'SPECIALIST') {
      await prisma.specialist.updateMany({ where: { userId }, data: { businessId: invite.businessId } });
    }
    await prisma.businessInvite.update({ where: { id: invite.id }, data: { acceptedAt: now } });
    return { joined: true, businessId: invite.businessId };
  }

  static async setRole(businessId: string, callerId: string, targetUserId: string, role: BusinessRole) {
    await this.requireRole(businessId, callerId, ['OWNER']);
    if (!['OWNER', 'MANAGER', 'SPECIALIST'].includes(role)) throw new Error('INVALID_ROLE');
    // There must always be at least one OWNER.
    if (role !== 'OWNER') {
      const ownerCount = await prisma.businessMember.count({ where: { businessId, role: 'OWNER', isActive: true } });
      const target = await prisma.businessMember.findUnique({ where: { businessId_userId: { businessId, userId: targetUserId } } });
      if (target?.role === 'OWNER' && ownerCount <= 1) throw new Error('CANT_REMOVE_LAST_OWNER');
    }
    return prisma.businessMember.update({
      where: { businessId_userId: { businessId, userId: targetUserId } },
      data: { role },
    });
  }

  static async removeMember(businessId: string, callerId: string, targetUserId: string) {
    // Anyone can remove themselves; only OWNER/MANAGER can remove others.
    if (callerId !== targetUserId) {
      await this.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    }
    const target = await prisma.businessMember.findUnique({ where: { businessId_userId: { businessId, userId: targetUserId } } });
    if (!target) throw new Error('NOT_A_MEMBER');
    if (target.role === 'OWNER') {
      const ownerCount = await prisma.businessMember.count({ where: { businessId, role: 'OWNER', isActive: true } });
      if (ownerCount <= 1) throw new Error('CANT_REMOVE_LAST_OWNER');
    }
    await prisma.businessMember.delete({ where: { businessId_userId: { businessId, userId: targetUserId } } });
    // Unlink the specialist row so they go back to being standalone.
    await prisma.specialist.updateMany({ where: { userId: targetUserId, businessId }, data: { businessId: null } });
    return { removed: true };
  }

  // ---- Dashboard --------------------------------------------------------
  static async dashboard(businessId: string, callerId: string, range?: { from: Date; to: Date }) {
    await this.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    const from = range?.from ?? new Date(Date.now() - 30 * 86_400_000);
    const to = range?.to ?? new Date();

    const memberUserIds = await prisma.businessMember.findMany({
      where: { businessId, isActive: true },
      select: { userId: true, role: true },
    });
    const specialistUserIds = memberUserIds.filter((m) => m.role !== 'MANAGER').map((m) => m.userId);

    const [bookingAgg, completedAgg, recentBookings, services] = await Promise.all([
      prisma.booking.aggregate({
        where: { specialistId: { in: specialistUserIds }, createdAt: { gte: from, lte: to } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.booking.aggregate({
        where: { specialistId: { in: specialistUserIds }, status: 'COMPLETED', completedAt: { gte: from, lte: to } },
        _count: true,
        _sum: { totalAmount: true },
      }),
      prisma.booking.findMany({
        where: { specialistId: { in: specialistUserIds }, createdAt: { gte: from, lte: to } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true, status: true, scheduledAt: true, totalAmount: true,
          customer: { select: { firstName: true, lastName: true } },
          specialist: { select: { firstName: true, lastName: true } },
          service: { select: { name: true } },
        },
      }),
      prisma.service.count({ where: { specialistId: { in: specialistUserIds }, isActive: true } }),
    ]);

    return {
      business: await prisma.business.findUnique({ where: { id: businessId } }),
      members: memberUserIds.length,
      services,
      range: { from: from.toISOString(), to: to.toISOString() },
      bookings: {
        total: bookingAgg._count,
        totalRevenue: Number(bookingAgg._sum.totalAmount ?? 0),
        completed: completedAgg._count,
        completedRevenue: Number(completedAgg._sum.totalAmount ?? 0),
      },
      recentBookings,
    };
  }

  // ---- Permission helpers -----------------------------------------------
  static async getMembership(businessId: string, userId: string) {
    return prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId } },
    });
  }

  static async requireMember(businessId: string, userId: string) {
    const m = await this.getMembership(businessId, userId);
    if (!m || !m.isActive) throw new Error('NOT_A_MEMBER');
    return m;
  }

  static async requireRole(businessId: string, userId: string, allowed: BusinessRole[]) {
    const m = await this.requireMember(businessId, userId);
    if (!allowed.includes(m.role as BusinessRole)) throw new Error('INSUFFICIENT_ROLE');
    return m;
  }
}

// Slug helper: lowercase, ASCII-folded, hyphenated. Cyrillic gets transliterated
// (loosely) so a Ukrainian name still produces a usable URL.
function slugify(input: string): string {
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'h', 'ґ': 'g', 'д': 'd', 'е': 'e', 'є': 'ye', 'ж': 'zh',
    'з': 'z', 'и': 'y', 'і': 'i', 'ї': 'yi', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ь': '', 'ю': 'yu', 'я': 'ya', 'ы': 'y', 'э': 'e', 'ё': 'yo', 'ъ': '',
  };
  return input
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
