import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

// Valid purchase order statuses
export const PO_STATUSES = ['DRAFT', 'ORDERED', 'PARTIAL', 'RECEIVED', 'CANCELLED'] as const;
export type POStatus = typeof PO_STATUSES[number];

export interface SupplierData {
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  taxId?: string | null;
  notes?: string | null;
  isActive?: boolean;
  businessId?: string | null;
}

export interface POItemInput {
  productId?: string | null;
  description: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePOData {
  supplierId?: string | null;
  currency?: string;
  notes?: string | null;
  taxAmount?: number;
  businessId?: string | null;
  items: POItemInput[];
}

export interface UpdatePOData {
  supplierId?: string | null;
  currency?: string;
  notes?: string | null;
  taxAmount?: number;
  items?: POItemInput[];
}

export interface POFilters {
  status?: POStatus;
  supplierId?: string;
}

// A single item receipt: which line, and how much is now received (cumulative target).
export interface ReceiptInput {
  itemId: string;
  receivedQty: number;
}

export interface PurchasingSummary {
  countsByStatus: Record<string, number>;
  totalOutstanding: number;
  totalSpentThisMonth: number;
  currency: string;
}

// Convert Prisma Decimal | number | null to a JS number safely.
const toNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
};

// Generate a human-friendly PO number: PO-YYYYMMDD-<short>. The short suffix is a
// crypto-random hex slug (not Math.random/Date.now), so it stays collision-resistant.
const generatePoNumber = (): string => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const slug = randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
  return `PO-${y}${m}${d}-${slug}`;
};

export class PurchasingService {
  // ---------- Suppliers ----------

  // List active + inactive suppliers for an owner. Always scoped by ownerId.
  static async listSuppliers(ownerId: string) {
    return prisma.supplier.findMany({
      where: { ownerId },
      orderBy: { name: 'asc' },
    });
  }

  // Get a single supplier, ownership-scoped (returns null if not owned).
  static async getSupplier(ownerId: string, id: string) {
    return prisma.supplier.findFirst({
      where: { id, ownerId },
    });
  }

  // Create a supplier for the owner.
  static async createSupplier(ownerId: string, data: SupplierData) {
    return prisma.supplier.create({
      data: {
        ownerId,
        businessId: data.businessId ?? null,
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        address: data.address?.trim() || null,
        taxId: data.taxId?.trim() || null,
        notes: data.notes?.trim() || null,
        isActive: data.isActive ?? true,
      },
    });
  }

  // Update a supplier, ownership-scoped. Returns null if not found/owned.
  static async updateSupplier(ownerId: string, id: string, data: Partial<SupplierData>) {
    const existing = await prisma.supplier.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    const updateData: Prisma.SupplierUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.taxId !== undefined) updateData.taxId = data.taxId?.trim() || null;
    if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.businessId !== undefined) updateData.businessId = data.businessId ?? null;

    return prisma.supplier.update({ where: { id }, data: updateData });
  }

  // Soft-delete a supplier (isActive=false), ownership-scoped. Returns false if not found/owned.
  static async removeSupplier(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.supplier.findFirst({ where: { id, ownerId } });
    if (!existing) return false;

    await prisma.supplier.update({ where: { id }, data: { isActive: false } });
    return true;
  }

  // ---------- Purchase orders ----------

  // List POs with supplier name + item count, optionally filtered by status. Owner-scoped.
  static async listPOs(ownerId: string, filters: POFilters = {}) {
    const where: Prisma.PurchaseOrderWhereInput = { ownerId };

    if (filters.status && PO_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }
    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    return orders.map((o) => ({
      ...o,
      supplierName: o.supplier?.name ?? null,
      itemCount: o._count.items,
    }));
  }

  // Get a single PO with items + supplier, ownership-scoped. Returns null if not owned.
  static async getPO(ownerId: string, id: string) {
    return prisma.purchaseOrder.findFirst({
      where: { id, ownerId },
      include: {
        supplier: true,
        items: true,
      },
    });
  }

  // Create a PO + its items in one transaction. Computes subtotal/total. Owner-scoped.
  static async createPO(ownerId: string, data: CreatePOData) {
    const items = (data.items || []).filter((i) => i && i.description?.trim());
    const taxAmount = data.taxAmount != null ? data.taxAmount : 0;

    const subtotal = items.reduce((sum, i) => sum + toNumber(i.quantity) * toNumber(i.unitCost), 0);
    const total = subtotal + taxAmount;
    const poNumber = generatePoNumber();

    return prisma.$transaction(async (tx) => {
      return tx.purchaseOrder.create({
        data: {
          ownerId,
          businessId: data.businessId ?? null,
          supplierId: data.supplierId ?? null,
          poNumber,
          status: 'DRAFT',
          currency: data.currency || 'UAH',
          subtotal,
          taxAmount,
          total,
          notes: data.notes?.trim() || null,
          items: {
            create: items.map((i) => ({
              productId: i.productId ?? null,
              description: i.description.trim(),
              quantity: toNumber(i.quantity),
              unitCost: toNumber(i.unitCost),
              receivedQty: 0,
            })),
          },
        },
        include: { items: true, supplier: true },
      });
    });
  }

  // Update a DRAFT PO (header + optionally replace items), recomputing totals. Owner-scoped.
  // Returns null if not found/owned; throws if PO is not DRAFT.
  static async updatePO(ownerId: string, id: string, data: UpdatePOData) {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, ownerId } });
    if (!existing) return null;
    if (existing.status !== 'DRAFT') {
      throw new Error('Only DRAFT purchase orders can be edited');
    }

    return prisma.$transaction(async (tx) => {
      const updateData: Prisma.PurchaseOrderUpdateInput = {};
      if (data.supplierId !== undefined) {
        updateData.supplier = data.supplierId
          ? { connect: { id: data.supplierId } }
          : { disconnect: true };
      }
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.notes !== undefined) updateData.notes = data.notes?.trim() || null;

      // If items provided, replace them all and recompute totals.
      if (data.items !== undefined) {
        const items = data.items.filter((i) => i && i.description?.trim());
        const taxAmount = data.taxAmount != null ? data.taxAmount : toNumber(existing.taxAmount);
        const subtotal = items.reduce(
          (sum, i) => sum + toNumber(i.quantity) * toNumber(i.unitCost),
          0
        );

        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: id } });
        updateData.taxAmount = taxAmount;
        updateData.subtotal = subtotal;
        updateData.total = subtotal + taxAmount;
        updateData.items = {
          create: items.map((i) => ({
            productId: i.productId ?? null,
            description: i.description.trim(),
            quantity: toNumber(i.quantity),
            unitCost: toNumber(i.unitCost),
            receivedQty: 0,
          })),
        };
      } else if (data.taxAmount != null) {
        // Tax-only change: recompute total off the stored subtotal.
        updateData.taxAmount = data.taxAmount;
        updateData.total = toNumber(existing.subtotal) + data.taxAmount;
      }

      return tx.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: { items: true, supplier: true },
      });
    });
  }

  // Delete a PO — only when DRAFT. Owner-scoped. Returns false if not found/owned;
  // throws if PO is not DRAFT.
  static async deletePO(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, ownerId } });
    if (!existing) return false;
    if (existing.status !== 'DRAFT') {
      throw new Error('Only DRAFT purchase orders can be deleted');
    }

    await prisma.purchaseOrder.delete({ where: { id } });
    return true;
  }

  // Set a PO status. Owner-scoped. Stamps orderedAt when moving to ORDERED.
  // Returns null if not found/owned.
  static async setStatus(ownerId: string, id: string, status: POStatus) {
    const existing = await prisma.purchaseOrder.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    const data: Prisma.PurchaseOrderUpdateInput = { status };
    if (status === 'ORDERED' && !existing.orderedAt) {
      data.orderedAt = new Date();
    }

    return prisma.purchaseOrder.update({
      where: { id },
      data,
      include: { items: true, supplier: true },
    });
  }

  // Receive a PO. If `receipts` is omitted, fully receive every line. Otherwise set each
  // listed item's receivedQty to the given cumulative target. For each item with a
  // productId, increment inventory stock by the NEWLY-received delta only (re-receiving
  // doesn't double-count). Sets status RECEIVED (all lines full) or PARTIAL, and receivedAt.
  // Owner-scoped. Returns null if not found/owned; throws if PO is CANCELLED.
  static async receivePO(ownerId: string, id: string, receipts?: ReceiptInput[], userId?: string) {
    const po = await prisma.purchaseOrder.findFirst({
      where: { id, ownerId },
      include: { items: true },
    });
    if (!po) return null;
    if (po.status === 'CANCELLED') {
      throw new Error('Cannot receive a cancelled purchase order');
    }

    // Map itemId -> target cumulative receivedQty.
    const targetById = new Map<string, number>();
    if (receipts && receipts.length > 0) {
      for (const r of receipts) {
        if (r && r.itemId) targetById.set(r.itemId, toNumber(r.receivedQty));
      }
    }

    // Compute per-item deltas (clamped to [0, quantity]).
    const updates = po.items.map((item) => {
      const ordered = toNumber(item.quantity);
      const already = toNumber(item.receivedQty);
      // Full receive when no receipts given; otherwise the provided target (default: keep).
      const target =
        !receipts || receipts.length === 0
          ? ordered
          : targetById.has(item.id)
            ? targetById.get(item.id)!
            : already;
      const clampedTarget = Math.max(0, Math.min(target, ordered));
      const delta = clampedTarget - already;
      return { item, newReceived: clampedTarget, delta, ordered };
    });

    // Persist line receivedQty changes, increment stock, and flip PO status — all
    // in ONE transaction so a mid-operation crash can't leave items "received"
    // with stock unincremented or the PO status out of sync.
    const anyReceived = updates.some((u) => u.newReceived > 0);
    const allFull = updates.length > 0 && updates.every((u) => u.newReceived >= u.ordered);
    const newStatus: POStatus = allFull ? 'RECEIVED' : anyReceived ? 'PARTIAL' : po.status as POStatus;

    return prisma.$transaction(async (tx) => {
      for (const u of updates) {
        if (u.newReceived !== toNumber(u.item.receivedQty)) {
          await tx.purchaseOrderItem.update({
            where: { id: u.item.id },
            data: { receivedQty: u.newReceived },
          });
        }
      }
      for (const u of updates) {
        if (u.delta > 0 && u.item.productId) {
          // Skip lines whose product was deleted (same as adjustStock).
          const product = await tx.product.findFirst({ where: { id: u.item.productId, ownerId } });
          if (!product) continue;
          await tx.stockMovement.create({
            data: { productId: u.item.productId, delta: u.delta, reason: 'PURCHASE', reference: po.id, createdById: userId || ownerId },
          });
          await tx.product.update({
            where: { id: u.item.productId },
            data: { stockQty: { increment: u.delta } },
          });
        }
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: newStatus,
          receivedAt: newStatus === 'RECEIVED' ? new Date() : po.receivedAt ?? (anyReceived ? new Date() : null),
        },
        include: { items: true, supplier: true },
      });
    });
  }

  // Owner-wide purchasing summary: counts by status, outstanding value (non-RECEIVED,
  // non-CANCELLED totals) and total spent this month (RECEIVED).
  static async summary(ownerId: string): Promise<PurchasingSummary> {
    const orders = await prisma.purchaseOrder.findMany({ where: { ownerId } });

    const countsByStatus: Record<string, number> = {
      DRAFT: 0,
      ORDERED: 0,
      PARTIAL: 0,
      RECEIVED: 0,
      CANCELLED: 0,
    };
    let totalOutstanding = 0;
    let totalSpentThisMonth = 0;
    const currencies = new Set<string>();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    for (const o of orders) {
      countsByStatus[o.status] = (countsByStatus[o.status] || 0) + 1;
      const total = toNumber(o.total);
      currencies.add(o.currency || 'UAH');

      if (o.status !== 'RECEIVED' && o.status !== 'CANCELLED') {
        totalOutstanding += total;
      }
      if (o.status === 'RECEIVED' && o.receivedAt && o.receivedAt >= monthStart) {
        totalSpentThisMonth += total;
      }
    }

    const currency = currencies.size === 1 ? Array.from(currencies)[0] : 'UAH';

    return { countsByStatus, totalOutstanding, totalSpentThisMonth, currency };
  }
}
