import { prisma } from '@/config/database';
import { Prisma } from '@prisma/client';

// Payroll record statuses
export const PAYROLL_STATUSES = ['DRAFT', 'APPROVED', 'PAID'] as const;
export type PayrollStatus = typeof PAYROLL_STATUSES[number];

// Convert Prisma Decimal | number | null to a JS number safely.
const toNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
};

// Commission modes: FLAT = single percent; TIERED = percent by period revenue.
export const COMMISSION_MODES = ['FLAT', 'TIERED'] as const;
export type CommissionMode = typeof COMMISSION_MODES[number];

export interface CommissionTier {
  minRevenue: number;
  percent: number;
}

export interface StaffMember {
  staffUserId: string;
  name: string;
  role: string;
  // Backward-compat: for FLAT this is the flat percent; for TIERED it's the
  // lowest tier's percent (informational only — the effective % is revenue-driven).
  commissionPercent: number;
  mode: CommissionMode;
  tiers: CommissionTier[];
}

export interface SetCommissionInput {
  mode?: CommissionMode;
  percent?: number;
  tiers?: CommissionTier[];
}

export interface PreviewLine {
  staffUserId: string;
  name: string;
  role: string;
  // The effective commission % actually applied for this period (post-tier resolution).
  commissionPercent: number;
  mode: CommissionMode;
  baseSalary: number;
  commissionTotal: number;
  bonus: number;
  deductions: number;
  taxAmount: number;
  netPay: number;
}

export interface RunLineInput {
  staffUserId: string;
  baseSalary?: number;
  commissionTotal?: number;
  bonus?: number;
  deductions?: number;
  taxAmount?: number;
}

export interface CreateRunInput {
  periodStart: Date;
  periodEnd: Date;
  lines: RunLineInput[];
  currency?: string;
  notes?: string | null;
}

export interface RecordFilters {
  status?: PayrollStatus;
  periodStart?: Date;
  periodEnd?: Date;
}

export interface UpdateRecordPatch {
  baseSalary?: number;
  commissionTotal?: number;
  bonus?: number;
  deductions?: number;
  taxAmount?: number;
  notes?: string | null;
}

export interface PayrollSummary {
  totalPayrollThisPeriod: number;
  totalCommission: number;
  countsByStatus: Record<string, number>;
  pendingApproval: number;
  currency: string;
}

const netPayOf = (l: {
  baseSalary: number;
  commissionTotal: number;
  bonus: number;
  deductions: number;
  taxAmount: number;
}): number => l.baseSalary + l.commissionTotal + l.bonus - l.deductions - l.taxAmount;

// Parse the stored `tiers` JSON into a sorted, validated tier array.
// Returns [] on null/garbage so callers can safely fall back to FLAT behaviour.
const parseTiers = (raw: string | null | undefined): CommissionTier[] => {
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const tiers: CommissionTier[] = [];
  for (const t of arr) {
    if (!t || typeof t !== 'object') continue;
    const minRevenue = Number((t as { minRevenue?: unknown }).minRevenue);
    const percent = Number((t as { percent?: unknown }).percent);
    if (!Number.isFinite(minRevenue) || !Number.isFinite(percent)) continue;
    tiers.push({ minRevenue, percent });
  }
  return tiers.sort((a, b) => a.minRevenue - b.minRevenue);
};

// Validate a tier array for persistence. Throws on invalid input.
const validateTiers = (tiers: unknown): CommissionTier[] => {
  if (!Array.isArray(tiers) || tiers.length === 0) {
    throw new Error('INVALID_TIERS');
  }
  const out: CommissionTier[] = [];
  for (const t of tiers) {
    if (!t || typeof t !== 'object') throw new Error('INVALID_TIERS');
    const minRevenue = Number((t as { minRevenue?: unknown }).minRevenue);
    const percent = Number((t as { percent?: unknown }).percent);
    if (!Number.isFinite(minRevenue) || minRevenue < 0) throw new Error('INVALID_TIERS');
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error('INVALID_TIERS');
    out.push({ minRevenue, percent });
  }
  return out.sort((a, b) => a.minRevenue - b.minRevenue);
};

export class PayrollService {
  // ---- Staff resolution --------------------------------------------------
  // The employer's payable staff = members of the business(es) they OWN
  // (SPECIALIST/MANAGER, active) PLUS the owner themselves. Solo users
  // (no owned business) get just themselves.
  private static async resolveStaffUserIds(ownerId: string): Promise<{ userId: string; role: string }[]> {
    const ownedMemberships = await prisma.businessMember.findMany({
      where: { userId: ownerId, role: 'OWNER', isActive: true },
      select: { businessId: true },
    });
    const ownedBusinessIds = ownedMemberships.map((m) => m.businessId);

    // Map userId -> role (owner always present, role OWNER).
    const byUser = new Map<string, string>();
    byUser.set(ownerId, 'OWNER');

    if (ownedBusinessIds.length > 0) {
      const members = await prisma.businessMember.findMany({
        where: {
          businessId: { in: ownedBusinessIds },
          isActive: true,
          role: { in: ['SPECIALIST', 'MANAGER'] },
        },
        select: { userId: true, role: true },
      });
      for (const m of members) {
        if (!byUser.has(m.userId)) byUser.set(m.userId, m.role);
      }
    }

    return Array.from(byUser.entries()).map(([userId, role]) => ({ userId, role }));
  }

  // List staff with their display name + current commission %.
  static async listStaff(ownerId: string): Promise<StaffMember[]> {
    const staff = await this.resolveStaffUserIds(ownerId);
    const userIds = staff.map((s) => s.userId);

    const [users, rules] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true },
      }),
      prisma.commissionRule.findMany({
        where: { ownerId, staffUserId: { in: userIds } },
      }),
    ]);

    const userMap = new Map(users.map((u) => [u.id, u]));
    const ruleMap = new Map(rules.map((r) => [r.staffUserId, r]));

    return staff
      .map((s) => {
        const u = userMap.get(s.userId);
        const rule = ruleMap.get(s.userId);
        const name = u ? `${u.firstName} ${u.lastName}`.trim() : s.userId;
        const active = !!(rule && rule.isActive);
        const mode: CommissionMode = active && rule!.mode === 'TIERED' ? 'TIERED' : 'FLAT';
        const tiers = active ? parseTiers(rule!.tiers) : [];
        // For TIERED, surface the lowest tier's percent as commissionPercent (display hint).
        const commissionPercent = active
          ? mode === 'TIERED'
            ? tiers[0]?.percent ?? 0
            : toNumber(rule!.percent)
          : 0;
        return {
          staffUserId: s.userId,
          name,
          role: s.role,
          commissionPercent,
          mode,
          tiers,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // Upsert a CommissionRule for a staff member.
  // FLAT (default): persist a single `percent` (0–100).
  // TIERED: persist a non-empty validated `tiers` JSON array; `percent` is left at 0.
  static async setCommission(ownerId: string, staffUserId: string, input: SetCommissionInput) {
    // Validate the staff member belongs to this owner.
    const staff = await this.resolveStaffUserIds(ownerId);
    if (!staff.some((s) => s.userId === staffUserId)) {
      return null;
    }

    const mode: CommissionMode = input.mode === 'TIERED' ? 'TIERED' : 'FLAT';

    if (mode === 'TIERED') {
      const tiers = validateTiers(input.tiers); // throws INVALID_TIERS if bad
      const tiersJson = JSON.stringify(tiers);
      return prisma.commissionRule.upsert({
        where: { ownerId_staffUserId: { ownerId, staffUserId } },
        create: { ownerId, staffUserId, mode, tiers: tiersJson, percent: 0, isActive: true },
        update: { mode, tiers: tiersJson, percent: 0, isActive: true },
      });
    }

    // FLAT
    const percent = Number(input.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      throw new Error('INVALID_PERCENT');
    }
    return prisma.commissionRule.upsert({
      where: { ownerId_staffUserId: { ownerId, staffUserId } },
      create: { ownerId, staffUserId, mode, tiers: null, percent, isActive: true },
      update: { mode, tiers: null, percent, isActive: true },
    });
  }

  // Resolve the effective commission % for a period given a rule shape + period revenue.
  // FLAT  -> rule.percent.
  // TIERED -> the percent of the highest tier whose minRevenue <= revenue (simple
  //           whole-revenue tiering, NOT marginal — the chosen % applies to the entire
  //           commission base). Returns 0 if revenue is below the lowest tier.
  static effectivePercent(
    rule: { mode: CommissionMode; percent: number; tiers: CommissionTier[] },
    periodRevenue: number
  ): number {
    if (rule.mode !== 'TIERED') return rule.percent;
    let pct = 0;
    for (const tier of rule.tiers) {
      // tiers are sorted ascending by minRevenue
      if (periodRevenue >= tier.minRevenue) pct = tier.percent;
      else break;
    }
    return pct;
  }

  // Sum a staff member's COMPLETED booking revenue over a period.
  private static async periodRevenueFor(
    staffUserId: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<number> {
    const agg = await prisma.booking.aggregate({
      where: {
        specialistId: staffUserId,
        status: 'COMPLETED',
        scheduledAt: { gte: periodStart, lte: periodEnd },
      },
      _sum: { totalAmount: true },
    });
    return toNumber(agg._sum.totalAmount);
  }

  // Build a draft preview (not persisted) for each staff member over a period.
  static async previewRun(ownerId: string, periodStart: Date, periodEnd: Date): Promise<PreviewLine[]> {
    const staff = await this.listStaff(ownerId);

    const lines = await Promise.all(
      staff.map(async (s) => {
        const periodRevenue = await this.periodRevenueFor(s.staffUserId, periodStart, periodEnd);
        // Resolve the effective % (flat percent, or the matching tier for this revenue),
        // then apply it to the whole period revenue (whole-revenue tiering, not marginal).
        const pct = this.effectivePercent(
          { mode: s.mode, percent: s.commissionPercent, tiers: s.tiers },
          periodRevenue
        );
        const commissionTotal = (periodRevenue * pct) / 100;
        const baseSalary = 0;
        const bonus = 0;
        const deductions = 0;
        const taxAmount = 0;
        return {
          staffUserId: s.staffUserId,
          name: s.name,
          role: s.role,
          commissionPercent: pct,
          mode: s.mode,
          baseSalary,
          commissionTotal,
          bonus,
          deductions,
          taxAmount,
          netPay: netPayOf({ baseSalary, commissionTotal, bonus, deductions, taxAmount }),
        };
      })
    );

    return lines;
  }

  // Persist a pay run: one PayrollRecord per line, in a single transaction.
  static async createRun(ownerId: string, input: CreateRunInput) {
    const { periodStart, periodEnd, lines, currency = 'UAH', notes = null } = input;

    // Scope: only allow staff that belong to this owner.
    const staff = await this.resolveStaffUserIds(ownerId);
    const allowed = new Set(staff.map((s) => s.userId));
    const validLines = lines.filter((l) => allowed.has(l.staffUserId));

    if (validLines.length === 0) {
      throw new Error('NO_VALID_LINES');
    }

    const businessId = await this.ownedBusinessId(ownerId);

    return prisma.$transaction(
      validLines.map((l) => {
        const baseSalary = l.baseSalary ?? 0;
        const commissionTotal = l.commissionTotal ?? 0;
        const bonus = l.bonus ?? 0;
        const deductions = l.deductions ?? 0;
        const taxAmount = l.taxAmount ?? 0;
        const netPay = netPayOf({ baseSalary, commissionTotal, bonus, deductions, taxAmount });

        return prisma.payrollRecord.create({
          data: {
            ownerId,
            businessId,
            staffUserId: l.staffUserId,
            periodStart,
            periodEnd,
            baseSalary,
            commissionTotal,
            bonus,
            deductions,
            taxAmount,
            netPay,
            currency,
            status: 'DRAFT',
            notes,
          },
        });
      })
    );
  }

  // Helper: first business the user owns (for denormalised businessId).
  private static async ownedBusinessId(ownerId: string): Promise<string | null> {
    const m = await prisma.businessMember.findFirst({
      where: { userId: ownerId, role: 'OWNER', isActive: true },
      select: { businessId: true },
    });
    return m?.businessId ?? null;
  }

  // List payroll records, ownership-scoped, with staff name attached.
  static async listRecords(ownerId: string, filters: RecordFilters = {}) {
    const where: Prisma.PayrollRecordWhereInput = { ownerId };

    if (filters.status && PAYROLL_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }
    if (filters.periodStart) {
      where.periodStart = { gte: filters.periodStart };
    }
    if (filters.periodEnd) {
      where.periodEnd = { lte: filters.periodEnd };
    }

    const records = await prisma.payrollRecord.findMany({
      where,
      orderBy: [{ periodStart: 'desc' }, { createdAt: 'desc' }],
    });

    return this.attachStaffNames(records);
  }

  // Get a single record, ownership-scoped, with staff name.
  static async getRecord(ownerId: string, id: string) {
    const record = await prisma.payrollRecord.findFirst({ where: { id, ownerId } });
    if (!record) return null;
    const [withName] = await this.attachStaffNames([record]);
    return withName;
  }

  // Update a DRAFT record. Returns null if not found/owned, throws if not DRAFT.
  static async updateRecord(ownerId: string, id: string, patch: UpdateRecordPatch) {
    const existing = await prisma.payrollRecord.findFirst({ where: { id, ownerId } });
    if (!existing) return null;
    if (existing.status !== 'DRAFT') throw new Error('ONLY_DRAFT_EDITABLE');

    const baseSalary = patch.baseSalary ?? toNumber(existing.baseSalary);
    const commissionTotal = patch.commissionTotal ?? toNumber(existing.commissionTotal);
    const bonus = patch.bonus ?? toNumber(existing.bonus);
    const deductions = patch.deductions ?? toNumber(existing.deductions);
    const taxAmount = patch.taxAmount ?? toNumber(existing.taxAmount);
    const netPay = netPayOf({ baseSalary, commissionTotal, bonus, deductions, taxAmount });

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        baseSalary,
        commissionTotal,
        bonus,
        deductions,
        taxAmount,
        netPay,
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      },
    });
    const [withName] = await this.attachStaffNames([updated]);
    return withName;
  }

  // Transition status DRAFT -> APPROVED -> PAID. Sets paidAt on PAID.
  static async setStatus(ownerId: string, id: string, status: PayrollStatus) {
    const existing = await prisma.payrollRecord.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    if (!PAYROLL_STATUSES.includes(status)) throw new Error('INVALID_STATUS');

    // Enforce a sane forward-only-ish transition.
    const order: Record<PayrollStatus, number> = { DRAFT: 0, APPROVED: 1, PAID: 2 };
    if (order[status] < order[existing.status as PayrollStatus]) {
      throw new Error('INVALID_TRANSITION');
    }

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        status,
        ...(status === 'PAID' ? { paidAt: existing.paidAt ?? new Date() } : {}),
      },
    });
    const [withName] = await this.attachStaffNames([updated]);
    return withName;
  }

  // Delete a DRAFT record. Returns false if not found/owned, throws if not DRAFT.
  static async deleteRecord(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.payrollRecord.findFirst({ where: { id, ownerId } });
    if (!existing) return false;
    if (existing.status !== 'DRAFT') throw new Error('ONLY_DRAFT_DELETABLE');

    await prisma.payrollRecord.delete({ where: { id } });
    return true;
  }

  // Owner-wide payroll summary for the current calendar month.
  static async summary(ownerId: string): Promise<PayrollSummary> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const records = await prisma.payrollRecord.findMany({ where: { ownerId } });

    const countsByStatus: Record<string, number> = {};
    let totalPayrollThisPeriod = 0;
    let totalCommission = 0;
    let pendingApproval = 0;
    const currencies = new Set<string>();

    for (const r of records) {
      countsByStatus[r.status] = (countsByStatus[r.status] || 0) + 1;
      currencies.add(r.currency || 'UAH');
      totalCommission += toNumber(r.commissionTotal);
      if (r.status === 'DRAFT') pendingApproval += toNumber(r.netPay);

      // "This period" = records whose period overlaps the current month.
      if (r.periodStart <= periodEnd && r.periodEnd >= periodStart) {
        totalPayrollThisPeriod += toNumber(r.netPay);
      }
    }

    const currency = currencies.size === 1 ? Array.from(currencies)[0] : 'UAH';

    return {
      totalPayrollThisPeriod,
      totalCommission,
      countsByStatus,
      pendingApproval,
      currency,
    };
  }

  // ---- Internal helpers --------------------------------------------------
  private static async attachStaffNames<T extends { staffUserId: string }>(records: T[]) {
    const ids = Array.from(new Set(records.map((r) => r.staffUserId)));
    const users = await prisma.user.findMany({
      where: { id: { in: ids } },
      select: { id: true, firstName: true, lastName: true },
    });
    const map = new Map(users.map((u) => [u.id, `${u.firstName} ${u.lastName}`.trim()]));
    return records.map((r) => ({ ...r, staffName: map.get(r.staffUserId) || r.staffUserId }));
  }
}
