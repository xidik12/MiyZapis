import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Sales suite: gift cards, service packages, memberships.
//
// IMPORTANT — payments are NOT live yet. "Selling" a gift card / package /
// membership means the OWNER ISSUES or ASSIGNS it (records it as granted); a
// future payments module will actually collect the money. The only place real
// value moves is REDEMPTION against bookings — there we genuinely deduct
// gift-card balance / package credits.
//
// Every method is ownerId-scoped and IDOR-safe: a row is only touched after a
// findFirst({ where: { id, ownerId } }) confirms the caller owns it.
// ---------------------------------------------------------------------------

// Status enums (stored as strings in the schema)
export const GIFT_CARD_STATUSES = ['ACTIVE', 'REDEEMED', 'EXPIRED', 'CANCELLED'] as const;
export type GiftCardStatus = typeof GIFT_CARD_STATUSES[number];

export const GIFT_CARD_REASONS = ['ISSUE', 'REDEEM', 'REFUND', 'ADJUST'] as const;
export type GiftCardReason = typeof GIFT_CARD_REASONS[number];

export const PACKAGE_STATUSES = ['ACTIVE', 'USED', 'EXPIRED'] as const;
export type PackageStatus = typeof PACKAGE_STATUSES[number];

export const MEMBERSHIP_STATUSES = ['ACTIVE', 'CANCELLED', 'EXPIRED', 'PAST_DUE'] as const;
export type MembershipStatus = typeof MEMBERSHIP_STATUSES[number];

export const BILLING_PERIODS = ['MONTHLY', 'YEARLY'] as const;
export type BillingPeriod = typeof BILLING_PERIODS[number];

// Convert Prisma Decimal | number | null to a JS number safely.
const toNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
};

// ---- Filters / DTOs --------------------------------------------------------

export interface GiftCardFilters {
  status?: GiftCardStatus;
  search?: string;
}

export interface IssueGiftCardData {
  initialAmount: number;
  currency?: string;
  recipientEmail?: string | null;
  note?: string | null;
  expiresAt?: string | null;
  businessId?: string | null;
}

export interface CreatePackageData {
  name: string;
  description?: string | null;
  serviceId?: string | null;
  credits: number;
  price: number;
  currency?: string;
  validDays?: number;
  isActive?: boolean;
  businessId?: string | null;
}

export interface UpdatePackageData {
  name?: string;
  description?: string | null;
  serviceId?: string | null;
  credits?: number;
  price?: number;
  currency?: string;
  validDays?: number;
  isActive?: boolean;
  businessId?: string | null;
}

export interface CreatePlanData {
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  billingPeriod?: BillingPeriod;
  benefits?: string | null;
  discountPercent?: number;
  isActive?: boolean;
  businessId?: string | null;
}

export interface UpdatePlanData {
  name?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  billingPeriod?: BillingPeriod;
  benefits?: string | null;
  discountPercent?: number;
  isActive?: boolean;
  businessId?: string | null;
}

export interface SalesSummary {
  activeGiftCards: number;
  giftCardOutstanding: number;       // sum of balances on ACTIVE cards
  packagesSold: number;              // CustomerPackage count (ACTIVE)
  creditsOutstanding: number;        // sum of remainingCredits on ACTIVE packages
  activeMembers: number;
  mrrEstimate: number;               // monthly-recurring-revenue estimate
  currency: string;
}

// Service-layer error thrown for grant/enroll lookups that fail.
export class SalesServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'SalesServiceError';
  }
}

// Generate a human-friendly code like "GC-7F3A-9K2D" using crypto randomness.
const generateGiftCardCode = (): string => {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) {
    out += alphabet[bytes[i] % alphabet.length];
    if (i === 3) out += '-';
  }
  return `GC-${out}`;
};

export class SalesService {
  // =========================================================================
  // GIFT CARDS
  // =========================================================================

  // List gift cards for an owner with optional filters. Always ownerId-scoped.
  static async listGiftCards(ownerId: string, filters: GiftCardFilters = {}) {
    const where: Prisma.GiftCardWhereInput = { ownerId };

    if (filters.status && GIFT_CARD_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { code: { contains: term, mode: 'insensitive' } },
        { recipientEmail: { contains: term, mode: 'insensitive' } },
        { note: { contains: term, mode: 'insensitive' } },
      ];
    }

    return prisma.giftCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  // Issue (record) a new gift card. NOTE: no money is collected here — this
  // just records that the owner handed out a card worth `initialAmount`.
  // Creates the card + an ISSUE transaction in one transaction.
  static async issueGiftCard(ownerId: string, data: IssueGiftCardData) {
    // Generate a unique code (retry on the rare collision).
    let code = generateGiftCardCode();
    for (let attempts = 0; attempts < 5; attempts++) {
      const existing = await prisma.giftCard.findUnique({ where: { code } });
      if (!existing) break;
      code = generateGiftCardCode();
    }

    return prisma.$transaction(async (tx) => {
      const card = await tx.giftCard.create({
        data: {
          ownerId,
          businessId: data.businessId ?? null,
          code,
          initialAmount: data.initialAmount,
          balance: data.initialAmount,
          currency: data.currency || 'UAH',
          status: 'ACTIVE',
          recipientEmail: data.recipientEmail?.trim() || null,
          note: data.note?.trim() || null,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        },
      });

      await tx.giftCardTransaction.create({
        data: {
          giftCardId: card.id,
          amount: data.initialAmount, // positive = issued / loaded
          reason: 'ISSUE',
        },
      });

      return card;
    });
  }

  // Single gift card, ownership-scoped (returns null if not owned). Includes
  // transactions for the detail/history view.
  static async getGiftCardById(ownerId: string, id: string) {
    return prisma.giftCard.findFirst({
      where: { id, ownerId },
      include: { transactions: { orderBy: { createdAt: 'desc' } } },
    });
  }

  // Redemption lookup by code. NOT ownerId-scoped on purpose — used at the
  // point of redeeming against a booking — but returns only minimal,
  // non-sensitive fields (balance/status/currency), never the full record.
  static async getGiftCardByCode(code: string) {
    const card = await prisma.giftCard.findUnique({
      where: { code: code.trim() },
    });
    if (!card) return null;

    return {
      id: card.id,
      code: card.code,
      balance: toNumber(card.balance),
      currency: card.currency,
      status: card.status,
      expiresAt: card.expiresAt,
    };
  }

  // Redeem an amount against a gift card (REAL value movement). Ownership-scoped
  // by id. Validates ACTIVE + sufficient balance, decrements balance, writes a
  // REDEEM transaction, and flips status to REDEEMED when the balance hits 0.
  // Throws SalesServiceError on validation failures; returns null if not owned.
  static async redeemGiftCard(ownerId: string, id: string, amount: number, bookingId?: string | null) {
    const card = await prisma.giftCard.findFirst({ where: { id, ownerId } });
    if (!card) return null;

    if (card.status !== 'ACTIVE') {
      throw new SalesServiceError('NOT_ACTIVE', `Gift card is ${card.status.toLowerCase()}`);
    }
    if (card.expiresAt && card.expiresAt < new Date()) {
      // Auto-expire stale cards on access.
      await prisma.giftCard.update({ where: { id }, data: { status: 'EXPIRED' } });
      throw new SalesServiceError('EXPIRED', 'Gift card has expired');
    }

    const balance = toNumber(card.balance);
    if (amount <= 0) {
      throw new SalesServiceError('INVALID_AMOUNT', 'Redeem amount must be positive');
    }
    if (amount > balance) {
      throw new SalesServiceError('INSUFFICIENT_BALANCE', 'Redeem amount exceeds remaining balance');
    }

    const newBalance = balance - amount;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.giftCard.update({
        where: { id },
        data: {
          balance: { decrement: amount },
          status: newBalance <= 0 ? 'REDEEMED' : 'ACTIVE',
        },
      });

      const transaction = await tx.giftCardTransaction.create({
        data: {
          giftCardId: id,
          amount: -amount, // negative = redeemed
          reason: 'REDEEM',
          bookingId: bookingId ?? null,
        },
      });

      return { card: updated, transaction };
    });
  }

  // Manually adjust a card's balance (e.g. correction or top-up). Ownership-scoped.
  // Positive delta loads value, negative removes it (clamped at 0). Writes an
  // ADJUST (or REFUND) transaction. Returns null if not owned.
  static async adjustGiftCard(
    ownerId: string,
    id: string,
    delta: number,
    reason: 'ADJUST' | 'REFUND' = 'ADJUST'
  ) {
    const card = await prisma.giftCard.findFirst({ where: { id, ownerId } });
    if (!card) return null;

    if (delta === 0) {
      throw new SalesServiceError('INVALID_AMOUNT', 'Adjustment must be non-zero');
    }

    const balance = toNumber(card.balance);
    const newBalance = Math.max(0, balance + delta);
    const appliedDelta = newBalance - balance;

    return prisma.$transaction(async (tx) => {
      const updated = await tx.giftCard.update({
        where: { id },
        data: {
          balance: newBalance,
          // Re-activate a previously-emptied card if we loaded value back onto it.
          status: newBalance > 0 && card.status === 'REDEEMED' ? 'ACTIVE' : card.status,
        },
      });

      const transaction = await tx.giftCardTransaction.create({
        data: {
          giftCardId: id,
          amount: appliedDelta,
          reason,
        },
      });

      return { card: updated, transaction };
    });
  }

  // Cancel a gift card (voids remaining balance). Ownership-scoped.
  static async cancelGiftCard(ownerId: string, id: string) {
    const card = await prisma.giftCard.findFirst({ where: { id, ownerId } });
    if (!card) return null;

    return prisma.giftCard.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  // =========================================================================
  // SERVICE PACKAGES (sellable definitions + customer grants)
  // =========================================================================

  // List the package definitions an owner offers. Includes a sold-count.
  static async listPackages(ownerId: string) {
    return prisma.servicePackage.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { purchases: true } } },
    });
  }

  static async createPackage(ownerId: string, data: CreatePackageData) {
    return prisma.servicePackage.create({
      data: {
        ownerId,
        businessId: data.businessId ?? null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        serviceId: data.serviceId?.trim() || null,
        credits: data.credits,
        price: data.price,
        currency: data.currency || 'UAH',
        validDays: data.validDays != null ? data.validDays : 365,
        isActive: data.isActive != null ? data.isActive : true,
      },
    });
  }

  static async updatePackage(ownerId: string, id: string, data: UpdatePackageData) {
    const existing = await prisma.servicePackage.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    const updateData: Prisma.ServicePackageUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.serviceId !== undefined) updateData.serviceId = data.serviceId?.trim() || null;
    if (data.credits !== undefined) updateData.credits = data.credits;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.validDays !== undefined) updateData.validDays = data.validDays;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.businessId !== undefined) updateData.businessId = data.businessId ?? null;

    return prisma.servicePackage.update({ where: { id }, data: updateData });
  }

  static async deletePackage(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.servicePackage.findFirst({ where: { id, ownerId } });
    if (!existing) return false;

    await prisma.servicePackage.delete({ where: { id } });
    return true;
  }

  // Grant a package to a customer. NOTE: no money is collected — this records
  // that the customer now holds `credits` worth of redeemable visits. Looks up
  // the customer by id or email; throws SalesServiceError if not found.
  static async grantPackage(
    ownerId: string,
    packageId: string,
    customer: { customerUserId?: string | null; customerEmail?: string | null }
  ) {
    const pkg = await prisma.servicePackage.findFirst({ where: { id: packageId, ownerId } });
    if (!pkg) return null;

    const customerUserId = await SalesService.resolveCustomerId(customer);

    const expiresAt = pkg.validDays > 0
      ? new Date(Date.now() + pkg.validDays * 24 * 60 * 60 * 1000)
      : null;

    return prisma.customerPackage.create({
      data: {
        packageId,
        customerUserId,
        remainingCredits: pkg.credits,
        status: 'ACTIVE',
        expiresAt,
      },
      include: { package: true },
    });
  }

  // List granted customer packages (joined with the package definition).
  // Ownership is enforced via the package relation.
  static async listCustomerPackages(ownerId: string, filters: { customerUserId?: string } = {}) {
    const where: Prisma.CustomerPackageWhereInput = {
      package: { ownerId },
    };
    if (filters.customerUserId) where.customerUserId = filters.customerUserId;

    return prisma.customerPackage.findMany({
      where,
      orderBy: { purchasedAt: 'desc' },
      include: { package: true },
    });
  }

  // Use one credit from a customer package (REAL deduction, e.g. against a
  // booking). Ownership-scoped via the package relation. Validates ACTIVE +
  // remaining credits, decrements, flips to USED at 0. Returns null if not
  // owned; throws SalesServiceError on validation failures.
  static async usePackageCredit(ownerId: string, customerPackageId: string, bookingId?: string | null) {
    const cp = await prisma.customerPackage.findFirst({
      where: { id: customerPackageId, package: { ownerId } },
      include: { package: true },
    });
    if (!cp) return null;

    if (cp.status !== 'ACTIVE') {
      throw new SalesServiceError('NOT_ACTIVE', `Package is ${cp.status.toLowerCase()}`);
    }
    if (cp.expiresAt && cp.expiresAt < new Date()) {
      await prisma.customerPackage.update({ where: { id: cp.id }, data: { status: 'EXPIRED' } });
      throw new SalesServiceError('EXPIRED', 'Package has expired');
    }
    if (cp.remainingCredits <= 0) {
      throw new SalesServiceError('NO_CREDITS', 'No credits remaining');
    }

    const newRemaining = cp.remainingCredits - 1;
    // bookingId is accepted for future audit trail; CustomerPackage has no
    // per-use ledger yet, so it's currently a no-op beyond logging.
    void bookingId;

    return prisma.customerPackage.update({
      where: { id: cp.id },
      data: {
        remainingCredits: newRemaining,
        status: newRemaining <= 0 ? 'USED' : 'ACTIVE',
      },
      include: { package: true },
    });
  }

  // =========================================================================
  // MEMBERSHIPS (plan definitions + customer enrolments)
  // =========================================================================

  static async listPlans(ownerId: string) {
    return prisma.membershipPlan.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { members: true } } },
    });
  }

  static async createPlan(ownerId: string, data: CreatePlanData) {
    return prisma.membershipPlan.create({
      data: {
        ownerId,
        businessId: data.businessId ?? null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: data.price,
        currency: data.currency || 'UAH',
        billingPeriod: data.billingPeriod && BILLING_PERIODS.includes(data.billingPeriod)
          ? data.billingPeriod
          : 'MONTHLY',
        benefits: data.benefits?.trim() || null,
        discountPercent: data.discountPercent != null ? data.discountPercent : 0,
        isActive: data.isActive != null ? data.isActive : true,
      },
    });
  }

  static async updatePlan(ownerId: string, id: string, data: UpdatePlanData) {
    const existing = await prisma.membershipPlan.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    const updateData: Prisma.MembershipPlanUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.billingPeriod !== undefined && BILLING_PERIODS.includes(data.billingPeriod)) {
      updateData.billingPeriod = data.billingPeriod;
    }
    if (data.benefits !== undefined) updateData.benefits = data.benefits?.trim() || null;
    if (data.discountPercent !== undefined) updateData.discountPercent = data.discountPercent;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.businessId !== undefined) updateData.businessId = data.businessId ?? null;

    return prisma.membershipPlan.update({ where: { id }, data: updateData });
  }

  static async deletePlan(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.membershipPlan.findFirst({ where: { id, ownerId } });
    if (!existing) return false;

    await prisma.membershipPlan.delete({ where: { id } });
    return true;
  }

  // Enroll a customer into a plan. NOTE: no money is collected — this records
  // an ACTIVE membership; recurring billing is a future payments concern.
  // Looks up the customer by id or email; throws SalesServiceError if not found.
  static async enrollMember(
    ownerId: string,
    planId: string,
    customer: { customerUserId?: string | null; customerEmail?: string | null }
  ) {
    const plan = await prisma.membershipPlan.findFirst({ where: { id: planId, ownerId } });
    if (!plan) return null;

    const customerUserId = await SalesService.resolveCustomerId(customer);

    const now = new Date();
    const currentPeriodEnd = new Date(now);
    if (plan.billingPeriod === 'YEARLY') {
      currentPeriodEnd.setFullYear(currentPeriodEnd.getFullYear() + 1);
    } else {
      currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    }

    return prisma.customerMembership.create({
      data: {
        planId,
        customerUserId,
        status: 'ACTIVE',
        startedAt: now,
        currentPeriodEnd,
      },
      include: { plan: true },
    });
  }

  // List members (enrolments), joined with the plan. Ownership via plan relation.
  static async listMembers(ownerId: string, filters: { planId?: string } = {}) {
    const where: Prisma.CustomerMembershipWhereInput = {
      plan: { ownerId },
    };
    if (filters.planId) where.planId = filters.planId;

    return prisma.customerMembership.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: { plan: true },
    });
  }

  // Cancel a membership. Ownership-scoped via plan relation. Returns null if not owned.
  static async cancelMembership(ownerId: string, id: string) {
    const membership = await prisma.customerMembership.findFirst({
      where: { id, plan: { ownerId } },
    });
    if (!membership) return null;

    return prisma.customerMembership.update({
      where: { id },
      data: { status: 'CANCELLED', cancelledAt: new Date() },
      include: { plan: true },
    });
  }

  // Highest active membership discount for a customer (used to show member
  // pricing). Returns 0 when the customer has no active membership.
  static async getActiveDiscountForCustomer(ownerId: string, customerUserId: string): Promise<number> {
    const memberships = await prisma.customerMembership.findMany({
      where: {
        customerUserId,
        status: 'ACTIVE',
        plan: { ownerId, isActive: true },
      },
      include: { plan: true },
    });

    let best = 0;
    for (const m of memberships) {
      // Skip lapsed periods.
      if (m.currentPeriodEnd && m.currentPeriodEnd < new Date()) continue;
      best = Math.max(best, toNumber(m.plan.discountPercent));
    }
    return best;
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================

  static async summary(ownerId: string): Promise<SalesSummary> {
    const [giftCards, customerPackages, memberships] = await Promise.all([
      prisma.giftCard.findMany({ where: { ownerId, status: 'ACTIVE' } }),
      prisma.customerPackage.findMany({
        where: { status: 'ACTIVE', package: { ownerId } },
      }),
      prisma.customerMembership.findMany({
        where: { status: 'ACTIVE', plan: { ownerId } },
        include: { plan: true },
      }),
    ]);

    const currencies = new Set<string>();

    let giftCardOutstanding = 0;
    for (const c of giftCards) {
      giftCardOutstanding += toNumber(c.balance);
      currencies.add(c.currency || 'UAH');
    }

    let creditsOutstanding = 0;
    for (const cp of customerPackages) {
      creditsOutstanding += cp.remainingCredits;
    }

    // MRR estimate: normalise yearly plans to a monthly figure.
    let mrrEstimate = 0;
    for (const m of memberships) {
      const price = toNumber(m.plan.price);
      mrrEstimate += m.plan.billingPeriod === 'YEARLY' ? price / 12 : price;
      currencies.add(m.plan.currency || 'UAH');
    }

    const currency = currencies.size === 1 ? Array.from(currencies)[0] : 'UAH';

    return {
      activeGiftCards: giftCards.length,
      giftCardOutstanding,
      packagesSold: customerPackages.length,
      creditsOutstanding,
      activeMembers: memberships.length,
      mrrEstimate,
      currency,
    };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  // Resolve a customer user id from { customerUserId | customerEmail }.
  // Throws SalesServiceError('CUSTOMER_NOT_FOUND') if neither resolves.
  private static async resolveCustomerId(customer: {
    customerUserId?: string | null;
    customerEmail?: string | null;
  }): Promise<string> {
    if (customer.customerUserId?.trim()) {
      const user = await prisma.user.findUnique({ where: { id: customer.customerUserId.trim() } });
      if (!user) throw new SalesServiceError('CUSTOMER_NOT_FOUND', 'Customer not found');
      return user.id;
    }

    if (customer.customerEmail?.trim()) {
      const user = await prisma.user.findUnique({
        where: { email: customer.customerEmail.trim().toLowerCase() },
      });
      if (!user) throw new SalesServiceError('CUSTOMER_NOT_FOUND', 'No customer found with that email');
      return user.id;
    }

    throw new SalesServiceError('CUSTOMER_REQUIRED', 'A customer id or email is required');
  }
}
