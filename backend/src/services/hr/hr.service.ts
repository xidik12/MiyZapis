import { prisma } from '@/config/database';

// ─────────────────────────────────────────────────────────────────────────────
// HR service — staff attendance, leave/time-off, shifts.
// Employees are full specialist accounts linked to a Business via BusinessMember.
// The "owner" is the employer; a solo specialist is their own team of one.
// Reads are scoped by staffUserId ∈ team; writes stamp ownerId = the employer.
// ─────────────────────────────────────────────────────────────────────────────

export type LeaveType = 'VACATION' | 'SICK' | 'UNPAID' | 'OTHER';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'ON_LEAVE' | 'HALF_DAY';

const startOfUtcDay = (d: Date): Date =>
  new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));

const inclusiveDays = (start: Date, end: Date): number => {
  const a = startOfUtcDay(start).getTime();
  const b = startOfUtcDay(end).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
};

export class HrService {
  // ---- Team resolution ---------------------------------------------------

  // userIds the actor may see/manage: their owned business members + self.
  private static async scopeUserIds(actorId: string): Promise<string[]> {
    const owned = await prisma.businessMember.findMany({
      where: { userId: actorId, role: 'OWNER', isActive: true },
      select: { businessId: true },
    });
    const ids = new Set<string>([actorId]);
    if (owned.length) {
      const members = await prisma.businessMember.findMany({
        where: {
          businessId: { in: owned.map((o) => o.businessId) },
          isActive: true,
          role: { in: ['OWNER', 'MANAGER', 'SPECIALIST'] },
        },
        select: { userId: true },
      });
      members.forEach((m) => ids.add(m.userId));
    }
    return Array.from(ids);
  }

  private static async isEmployer(actorId: string): Promise<boolean> {
    const owned = await prisma.businessMember.count({
      where: { userId: actorId, role: 'OWNER', isActive: true },
    });
    return owned > 0;
  }

  // Where a staff member's records belong: their employer + business (or self).
  private static async employerContext(
    staffUserId: string,
  ): Promise<{ ownerId: string; businessId: string | null }> {
    const membership = await prisma.businessMember.findFirst({
      where: { userId: staffUserId, isActive: true, role: { in: ['MANAGER', 'SPECIALIST'] } },
      select: { businessId: true },
    });
    if (membership) {
      const owner = await prisma.businessMember.findFirst({
        where: { businessId: membership.businessId, role: 'OWNER', isActive: true },
        select: { userId: true },
      });
      return { ownerId: owner?.userId ?? staffUserId, businessId: membership.businessId };
    }
    const owned = await prisma.businessMember.findFirst({
      where: { userId: staffUserId, role: 'OWNER', isActive: true },
      select: { businessId: true },
    });
    return { ownerId: staffUserId, businessId: owned?.businessId ?? null };
  }

  private static async assertInScope(actorId: string, staffUserId: string): Promise<void> {
    const scope = await this.scopeUserIds(actorId);
    if (!scope.includes(staffUserId)) {
      throw new Error('Staff member is not in your team');
    }
  }

  private static async namesFor(userIds: string[]): Promise<Map<string, string>> {
    if (!userIds.length) return new Map();
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true },
    });
    return new Map(
      users.map((u) => [u.id, `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id]),
    );
  }

  // List the actor's team (owner sees members; solo sees self).
  static async listStaff(actorId: string) {
    const scope = await this.scopeUserIds(actorId);
    const users = await prisma.user.findMany({
      where: { id: { in: scope } },
      select: { id: true, firstName: true, lastName: true, avatar: true },
    });
    const owned = await prisma.businessMember.findMany({
      where: { businessId: { in: (await prisma.businessMember.findMany({
        where: { userId: actorId, role: 'OWNER', isActive: true }, select: { businessId: true },
      })).map((b) => b.businessId) }, isActive: true },
      select: { userId: true, role: true },
    });
    const roleMap = new Map(owned.map((m) => [m.userId, m.role]));
    return users.map((u) => ({
      staffUserId: u.id,
      name: `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim() || u.id,
      avatar: u.avatar ?? null,
      role: u.id === actorId ? 'OWNER' : roleMap.get(u.id) ?? 'SPECIALIST',
      isSelf: u.id === actorId,
    }));
  }

  // ---- Attendance --------------------------------------------------------

  private static async decorate<T extends { staffUserId: string }>(rows: T[]): Promise<(T & { staffName: string })[]> {
    const names = await this.namesFor([...new Set(rows.map((r) => r.staffUserId))]);
    return rows.map((r) => ({ ...r, staffName: names.get(r.staffUserId) ?? r.staffUserId }));
  }

  static async listAttendance(
    actorId: string,
    opts: { from?: Date; to?: Date; staffUserId?: string },
  ) {
    const scope = await this.scopeUserIds(actorId);
    const ids = opts.staffUserId ? scope.filter((id) => id === opts.staffUserId) : scope;
    const rows = await prisma.attendance.findMany({
      where: {
        staffUserId: { in: ids },
        ...(opts.from || opts.to
          ? { date: { ...(opts.from ? { gte: startOfUtcDay(opts.from) } : {}), ...(opts.to ? { lte: startOfUtcDay(opts.to) } : {}) } }
          : {}),
      },
      orderBy: { date: 'desc' },
    });
    return this.decorate(rows);
  }

  static async todayFor(staffUserId: string) {
    const date = startOfUtcDay(new Date());
    return prisma.attendance.findUnique({ where: { staffUserId_date: { staffUserId, date } } });
  }

  static async clockIn(actorId: string, staffUserId: string) {
    await this.assertInScope(actorId, staffUserId);
    const date = startOfUtcDay(new Date());
    const existing = await prisma.attendance.findUnique({
      where: { staffUserId_date: { staffUserId, date } },
    });
    if (existing?.clockIn) return existing; // already clocked in today
    const { ownerId, businessId } = await this.employerContext(staffUserId);
    return prisma.attendance.upsert({
      where: { staffUserId_date: { staffUserId, date } },
      update: { clockIn: new Date(), status: 'PRESENT' },
      create: { ownerId, businessId, staffUserId, date, clockIn: new Date(), status: 'PRESENT' },
    });
  }

  static async clockOut(actorId: string, staffUserId: string) {
    await this.assertInScope(actorId, staffUserId);
    const date = startOfUtcDay(new Date());
    const record = await prisma.attendance.findUnique({
      where: { staffUserId_date: { staffUserId, date } },
    });
    if (!record?.clockIn) throw new Error('Not clocked in yet');
    if (record.clockOut) return record;
    const now = new Date();
    const minutesWorked = Math.max(0, Math.round((now.getTime() - record.clockIn.getTime()) / 60_000));
    return prisma.attendance.update({
      where: { id: record.id },
      data: { clockOut: now, minutesWorked },
    });
  }

  // Owner manually sets/overrides a day's attendance.
  static async setAttendance(
    actorId: string,
    input: { staffUserId: string; date: Date; clockIn?: Date | null; clockOut?: Date | null; status?: AttendanceStatus; note?: string | null },
  ) {
    // Owner-only: staff must not be able to fabricate their own hours (feeds payroll).
    if (!(await this.isEmployer(actorId))) {
      throw new Error('Only the business owner can set attendance');
    }
    await this.assertInScope(actorId, input.staffUserId);
    const date = startOfUtcDay(input.date);
    const minutesWorked = input.clockIn && input.clockOut
      ? Math.max(0, Math.round((input.clockOut.getTime() - input.clockIn.getTime()) / 60_000))
      : 0;
    const { ownerId, businessId } = await this.employerContext(input.staffUserId);
    return prisma.attendance.upsert({
      where: { staffUserId_date: { staffUserId: input.staffUserId, date } },
      update: {
        clockIn: input.clockIn ?? null,
        clockOut: input.clockOut ?? null,
        minutesWorked,
        status: input.status ?? 'PRESENT',
        note: input.note ?? null,
      },
      create: {
        ownerId, businessId, staffUserId: input.staffUserId, date,
        clockIn: input.clockIn ?? null, clockOut: input.clockOut ?? null, minutesWorked,
        status: input.status ?? 'PRESENT', note: input.note ?? null,
      },
    });
  }

  // ---- Leave -------------------------------------------------------------

  static async listLeaves(actorId: string, opts: { status?: LeaveStatus; staffUserId?: string }) {
    const scope = await this.scopeUserIds(actorId);
    const ids = opts.staffUserId ? scope.filter((id) => id === opts.staffUserId) : scope;
    const rows = await prisma.leaveRequest.findMany({
      where: { staffUserId: { in: ids }, ...(opts.status ? { status: opts.status } : {}) },
      orderBy: { createdAt: 'desc' },
    });
    return this.decorate(rows);
  }

  static async requestLeave(
    actorId: string,
    input: { staffUserId?: string; type: LeaveType; startDate: Date; endDate: Date; reason?: string },
  ) {
    const staffUserId = input.staffUserId ?? actorId;
    await this.assertInScope(actorId, staffUserId);
    if (input.endDate < input.startDate) throw new Error('End date is before start date');
    const { ownerId, businessId } = await this.employerContext(staffUserId);
    return prisma.leaveRequest.create({
      data: {
        ownerId, businessId, staffUserId,
        type: input.type, startDate: input.startDate, endDate: input.endDate,
        days: inclusiveDays(input.startDate, input.endDate),
        reason: input.reason ?? null,
        status: 'PENDING',
      },
    });
  }

  static async reviewLeave(
    actorId: string,
    leaveId: string,
    decision: 'APPROVE' | 'REJECT',
    reviewNote?: string,
  ) {
    if (!(await this.isEmployer(actorId))) throw new Error('Only the business owner can review leave');
    const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new Error('Leave request not found');
    await this.assertInScope(actorId, leave.staffUserId);
    if (leave.status !== 'PENDING') throw new Error('This request has already been reviewed');
    return prisma.leaveRequest.update({
      where: { id: leaveId },
      data: {
        status: decision === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        reviewedBy: actorId,
        reviewedAt: new Date(),
        reviewNote: reviewNote ?? null,
      },
    });
  }

  static async cancelLeave(actorId: string, leaveId: string) {
    const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId } });
    if (!leave) throw new Error('Leave request not found');
    const isOwn = leave.staffUserId === actorId;
    const isOwner = await this.isEmployer(actorId);
    if (!isOwn && !isOwner) throw new Error('Not allowed');
    if (isOwner) await this.assertInScope(actorId, leave.staffUserId);
    if (leave.status !== 'PENDING') throw new Error('Only pending requests can be cancelled');
    return prisma.leaveRequest.update({ where: { id: leaveId }, data: { status: 'CANCELLED' } });
  }

  // ---- Shifts ------------------------------------------------------------

  static async listShifts(actorId: string, opts: { from?: Date; to?: Date; staffUserId?: string }) {
    const scope = await this.scopeUserIds(actorId);
    const ids = opts.staffUserId ? scope.filter((id) => id === opts.staffUserId) : scope;
    const rows = await prisma.staffShift.findMany({
      where: {
        staffUserId: { in: ids },
        ...(opts.from || opts.to
          ? { startTime: { ...(opts.from ? { gte: opts.from } : {}), ...(opts.to ? { lte: opts.to } : {}) } }
          : {}),
      },
      orderBy: { startTime: 'asc' },
    });
    return this.decorate(rows);
  }

  static async createShift(
    actorId: string,
    input: { staffUserId: string; startTime: Date; endTime: Date; note?: string },
  ) {
    if (!(await this.isEmployer(actorId))) throw new Error('Only the business owner can schedule shifts');
    await this.assertInScope(actorId, input.staffUserId);
    if (input.endTime <= input.startTime) throw new Error('End time must be after start time');
    const { ownerId, businessId } = await this.employerContext(input.staffUserId);
    return prisma.staffShift.create({
      data: { ownerId, businessId, staffUserId: input.staffUserId, startTime: input.startTime, endTime: input.endTime, note: input.note ?? null },
    });
  }

  static async updateShift(
    actorId: string,
    shiftId: string,
    input: { startTime?: Date; endTime?: Date; note?: string | null },
  ) {
    const shift = await prisma.staffShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error('Shift not found');
    await this.assertInScope(actorId, shift.staffUserId);
    const startTime = input.startTime ?? shift.startTime;
    const endTime = input.endTime ?? shift.endTime;
    if (endTime <= startTime) throw new Error('End time must be after start time');
    return prisma.staffShift.update({
      where: { id: shiftId },
      data: { startTime, endTime, note: input.note === undefined ? shift.note : input.note },
    });
  }

  static async deleteShift(actorId: string, shiftId: string) {
    const shift = await prisma.staffShift.findUnique({ where: { id: shiftId } });
    if (!shift) throw new Error('Shift not found');
    await this.assertInScope(actorId, shift.staffUserId);
    await prisma.staffShift.delete({ where: { id: shiftId } });
  }

  // ---- Summary -----------------------------------------------------------

  static async summary(actorId: string) {
    const scope = await this.scopeUserIds(actorId);
    const today = startOfUtcDay(new Date());
    const [present, pendingLeaves, onLeave] = await Promise.all([
      prisma.attendance.count({
        where: { staffUserId: { in: scope }, date: today, clockIn: { not: null }, status: { not: 'ABSENT' } },
      }),
      prisma.leaveRequest.count({ where: { staffUserId: { in: scope }, status: 'PENDING' } }),
      prisma.leaveRequest.count({
        where: {
          staffUserId: { in: scope },
          status: 'APPROVED',
          startDate: { lte: new Date() },
          endDate: { gte: today },
        },
      }),
    ]);
    return {
      staffCount: scope.length,
      presentToday: present,
      onLeaveToday: onLeave,
      pendingLeaves,
      isEmployer: await this.isEmployer(actorId),
    };
  }
}
