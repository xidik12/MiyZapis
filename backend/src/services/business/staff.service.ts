// Owner-managed staff (employees) for a Business.
//
// A salon owner can build professional profiles directly — no email invite, no
// login. Each managed employee is a real, bookable SPECIALIST user with:
//   - User      (isManaged: true, managedById: <owner>, password: null, synthetic email)
//   - Specialist (bio, specialties, workingHours, businessId, …)
//   - Service[]  (optional — name/price/duration per service)
//   - BusinessMember (role SPECIALIST)
//
// Because the employee is a genuine specialist user, they appear in the salon
// and are bookable exactly like an invited member. The owner can also *clone* an
// existing employee (copy everything, change the name) so they never re-enter data.
//
// Authorization: every mutating method first calls BusinessService.requireRole
// with ['OWNER','MANAGER']. Target staff must belong to this business and (for
// mutations) be managed before we touch it.

import crypto from 'crypto';
import { prisma } from '@/config/database';
import { BusinessService } from '@/services/business/business.service';

// Default all-days-off working-hours template (mirrors the register flow).
const DEFAULT_WORKING_HOURS = {
  monday: { isWorking: false, start: '09:00', end: '17:00' },
  tuesday: { isWorking: false, start: '09:00', end: '17:00' },
  wednesday: { isWorking: false, start: '09:00', end: '17:00' },
  thursday: { isWorking: false, start: '09:00', end: '17:00' },
  friday: { isWorking: false, start: '09:00', end: '17:00' },
  saturday: { isWorking: false, start: '09:00', end: '17:00' },
  sunday: { isWorking: false, start: '09:00', end: '17:00' },
};

export interface StaffServiceInput {
  name: string;
  description?: string;
  category?: string;
  basePrice: number | string;
  currency?: string;
  duration: number;
  prepTime?: number;
  cleanupTime?: number;
}

export interface CreateStaffInput {
  firstName: string;
  lastName: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  city?: string;
  workingHours?: Record<string, unknown>;
  services?: StaffServiceInput[];
}

export interface UpdateStaffPatch {
  firstName?: string;
  lastName?: string;
  bio?: string;
  specialties?: string[];
  city?: string;
  experience?: number;
}

export class StaffService {
  // ---- Read --------------------------------------------------------------
  static async listStaff(businessId: string, callerId: string) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);

    const members = await prisma.businessMember.findMany({
      where: { businessId, isActive: true },
      orderBy: { joinedAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            isManaged: true,
            specialist: {
              select: {
                id: true,
                workingHours: true,
                specialties: true,
                city: true,
                bio: true,
                experience: true,
                services: {
                  where: { isDeleted: false },
                  select: { id: true, name: true, basePrice: true, currency: true, duration: true },
                },
              },
            },
          },
        },
      },
    });

    return members.map((m) => {
      const sp = m.user?.specialist;
      return {
        memberId: m.id,
        role: m.role,
        user: {
          id: m.user?.id,
          firstName: m.user?.firstName,
          lastName: m.user?.lastName,
          isManaged: !!m.user?.isManaged,
        },
        specialist: sp
          ? {
              id: sp.id,
              workingHours: safeParse(sp.workingHours),
              specialties: safeParse(sp.specialties) ?? [],
              city: sp.city,
              bio: sp.bio,
              experience: sp.experience,
            }
          : null,
        services: (sp?.services ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          basePrice: Number(s.basePrice),
          currency: s.currency,
          duration: s.duration,
        })),
      };
    });
  }

  // ---- Create ------------------------------------------------------------
  static async createStaff(businessId: string, callerId: string, data: CreateStaffInput) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    if (!data.firstName?.trim() || !data.lastName?.trim()) throw new Error('VALIDATION_ERROR');

    return prisma.$transaction(async (tx) => {
      const email = syntheticEmail();
      const user = await tx.user.create({
        data: {
          email,
          password: null,
          isManaged: true,
          managedById: callerId,
          firstName: data.firstName.trim(),
          lastName: data.lastName.trim(),
          userType: 'SPECIALIST',
        },
      });

      const specialist = await tx.specialist.create({
        data: {
          userId: user.id,
          businessId,
          bio: data.bio ?? '',
          specialties: JSON.stringify(data.specialties ?? []),
          experience: data.experience ?? 0,
          city: data.city ?? '',
          workingHours: JSON.stringify(data.workingHours ?? DEFAULT_WORKING_HOURS),
        },
      });

      if (data.services?.length) {
        for (const s of data.services) {
          await tx.service.create({ data: buildServiceData(s, specialist.id, businessId) });
        }
      }

      await tx.businessMember.create({
        data: {
          businessId,
          userId: user.id,
          role: 'SPECIALIST',
          invitedBy: callerId,
          joinedAt: new Date(),
        },
      });

      return { userId: user.id, specialistId: specialist.id };
    });
  }

  // ---- Clone -------------------------------------------------------------
  // Copy everything from an existing employee, change only the name.
  static async cloneStaff(
    businessId: string,
    callerId: string,
    sourceStaffUserId: string,
    { firstName, lastName }: { firstName: string; lastName: string },
  ) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    if (!firstName?.trim() || !lastName?.trim()) throw new Error('VALIDATION_ERROR');

    const source = await prisma.specialist.findFirst({
      where: { userId: sourceStaffUserId, businessId },
      include: { services: { where: { isDeleted: false } } },
    });
    if (!source) throw new Error('NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: syntheticEmail(),
          password: null,
          isManaged: true,
          managedById: callerId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userType: 'SPECIALIST',
        },
      });

      const specialist = await tx.specialist.create({
        data: {
          userId: user.id,
          businessId,
          bio: source.bio,
          bioUk: source.bioUk,
          bioRu: source.bioRu,
          specialties: source.specialties,
          experience: source.experience,
          languages: source.languages,
          city: source.city,
          state: source.state,
          country: source.country,
          timezone: source.timezone,
          workingHours: source.workingHours,
        },
      });

      for (const s of source.services) {
        await tx.service.create({
          data: {
            specialistId: specialist.id,
            businessId,
            name: s.name,
            description: s.description,
            category: s.category,
            basePrice: s.basePrice,
            currency: s.currency,
            duration: s.duration,
            prepTime: s.prepTime,
            cleanupTime: s.cleanupTime,
            requirements: s.requirements,
            deliverables: s.deliverables,
          },
        });
      }

      await tx.businessMember.create({
        data: {
          businessId,
          userId: user.id,
          role: 'SPECIALIST',
          invitedBy: callerId,
          joinedAt: new Date(),
        },
      });

      return { userId: user.id, specialistId: specialist.id };
    });
  }

  // ---- Update ------------------------------------------------------------
  static async updateStaff(businessId: string, callerId: string, staffUserId: string, patch: UpdateStaffPatch) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    await this.assertManagedStaff(businessId, staffUserId);

    return prisma.$transaction(async (tx) => {
      if (patch.firstName !== undefined || patch.lastName !== undefined) {
        await tx.user.update({
          where: { id: staffUserId },
          data: {
            ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
            ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
          },
        });
      }
      const specialistData: Record<string, unknown> = {};
      if (patch.bio !== undefined) specialistData.bio = patch.bio;
      if (patch.specialties !== undefined) specialistData.specialties = JSON.stringify(patch.specialties);
      if (patch.city !== undefined) specialistData.city = patch.city;
      if (patch.experience !== undefined) specialistData.experience = patch.experience;
      if (Object.keys(specialistData).length) {
        await tx.specialist.updateMany({ where: { userId: staffUserId, businessId }, data: specialistData });
      }
      return { updated: true };
    });
  }

  // ---- Schedule ----------------------------------------------------------
  static async setSchedule(businessId: string, callerId: string, staffUserId: string, workingHours: Record<string, unknown>) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    await this.assertManagedStaff(businessId, staffUserId);
    await prisma.specialist.updateMany({
      where: { userId: staffUserId, businessId },
      data: { workingHours: JSON.stringify(workingHours ?? DEFAULT_WORKING_HOURS) },
    });
    return { updated: true };
  }

  // ---- Services (replace-all) -------------------------------------------
  static async setServices(businessId: string, callerId: string, staffUserId: string, services: StaffServiceInput[]) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);
    await this.assertManagedStaff(businessId, staffUserId);

    const specialist = await prisma.specialist.findFirst({ where: { userId: staffUserId, businessId }, select: { id: true } });
    if (!specialist) throw new Error('NOT_FOUND');

    return prisma.$transaction(async (tx) => {
      await tx.service.deleteMany({ where: { specialistId: specialist.id, businessId } });
      for (const s of services ?? []) {
        await tx.service.create({ data: buildServiceData(s, specialist.id, businessId) });
      }
      return { updated: true };
    });
  }

  // ---- Remove ------------------------------------------------------------
  static async removeStaff(businessId: string, callerId: string, staffUserId: string) {
    await BusinessService.requireRole(businessId, callerId, ['OWNER', 'MANAGER']);

    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: staffUserId } },
    });
    if (!member) throw new Error('NOT_A_MEMBER');

    const user = await prisma.user.findUnique({ where: { id: staffUserId }, select: { isManaged: true } });

    // Invited (non-managed) member → just drop the membership; never delete the real account.
    if (!user?.isManaged) {
      return BusinessService.removeMember(businessId, callerId, staffUserId);
    }

    // Managed staff → delete the whole synthetic profile (member + services + specialist + user)
    // in a transaction. Guarded: managed staff has no real account to protect.
    return prisma.$transaction(async (tx) => {
      const specialist = await tx.specialist.findFirst({ where: { userId: staffUserId, businessId }, select: { id: true } });
      if (specialist) {
        await tx.service.deleteMany({ where: { specialistId: specialist.id } });
        await tx.specialist.delete({ where: { id: specialist.id } });
      }
      await tx.businessMember.deleteMany({ where: { businessId, userId: staffUserId } });
      await tx.user.delete({ where: { id: staffUserId } });
      return { removed: true };
    });
  }

  // ---- Helpers -----------------------------------------------------------
  private static async assertManagedStaff(businessId: string, staffUserId: string) {
    const user = await prisma.user.findUnique({ where: { id: staffUserId }, select: { isManaged: true } });
    if (!user?.isManaged) throw new Error('NOT_MANAGED');
    const member = await prisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: staffUserId } },
      select: { id: true },
    });
    if (!member) throw new Error('NOT_A_MEMBER');
  }
}

// ── module-private helpers ────────────────────────────────────────────────
function syntheticEmail(): string {
  return `staff.${crypto.randomUUID().replace(/-/g, '')}@managed.miyzapis.local`;
}

function buildServiceData(s: StaffServiceInput, specialistId: string, businessId: string) {
  return {
    specialistId,
    businessId,
    name: s.name,
    description: s.description ?? '',
    category: s.category ?? 'general',
    basePrice: s.basePrice as any,
    currency: s.currency ?? 'UAH',
    duration: s.duration,
    prepTime: s.prepTime ?? 0,
    cleanupTime: s.cleanupTime ?? 0,
    requirements: '[]',
    deliverables: '[]',
  };
}

function safeParse(v: string | null | undefined): any {
  if (!v) return null;
  try { return JSON.parse(v); } catch { return null; }
}
