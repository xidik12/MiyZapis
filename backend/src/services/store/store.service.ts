import { PrismaClient, Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { InventoryService } from '@/services/inventory/inventory.service';
import { NotificationService } from '@/services/notification';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Retail storefront / online ordering.
//
// Specialists/salons sell RETAIL products (from their inventory) to customers.
// Orders are placed online and collected / paid in-store — there is NO live
// card payment yet. The order lifecycle is fulfilment-tracked:
//   PENDING → PAID → FULFILLED   (or CANCELLED at any point)
//
// Stock is the only real value movement and it is deducted EXACTLY ONCE, on
// the transition into FULFILLED (reason 'SALE'), via InventoryService.adjustStock.
// We do NOT auto-restock on cancel (kept simple — see setOrderStatus note).
//
// Public methods (no owner scoping) power the customer-facing storefront.
// Owner-scoped methods are IDOR-safe: every row is only touched after a
// findFirst({ where: { id, ownerId } }) confirms the caller owns it.
// ---------------------------------------------------------------------------

export const ORDER_STATUSES = ['PENDING', 'PAID', 'FULFILLED', 'CANCELLED'] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const FULFILMENT_TYPES = ['PICKUP', 'DELIVERY'] as const;
export type FulfilmentType = typeof FULFILMENT_TYPES[number];

// Convert Prisma Decimal | number | null to a JS number safely.
const toNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
};

// Service-layer error thrown for placement / validation failures.
export class StoreServiceError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'StoreServiceError';
  }
}

export interface PlaceOrderItemInput {
  productId: string;
  quantity: number;
}

export interface PlaceOrderInput {
  sellerUserId: string;
  customerUserId?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
  fulfilment?: FulfilmentType;
  note?: string | null;
  items: PlaceOrderItemInput[];
}

export interface StoreSummary {
  pendingOrders: number;
  monthSalesTotal: number; // total of FULFILLED orders this calendar month
  currency: string;
}

// Generate an order number like "ORD-20260613-7F3A9K" using crypto randomness.
const generateOrderNumber = (): string => {
  const now = new Date();
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  const d = String(now.getUTCDate()).padStart(2, '0');
  const hex = randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
  return `ORD-${y}${m}${d}-${hex}`;
};

export class StoreService {
  // =========================================================================
  // PUBLIC (storefront) — no owner scoping
  // =========================================================================

  // Active RETAIL products with stock for a given seller. The seller is
  // identified by their user id (ownerId) or, for businesses, a businessId.
  static async listStorefront(target: { sellerUserId?: string; businessId?: string }) {
    const where: Prisma.ProductWhereInput = {
      type: 'RETAIL',
      isActive: true,
      stockQty: { gt: 0 },
    };

    if (target.businessId) {
      where.businessId = target.businessId;
    } else if (target.sellerUserId) {
      where.ownerId = target.sellerUserId;
    } else {
      return [];
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Product has no image column yet; expose `image: null` so the client can
    // render a placeholder and we stay forward-compatible if one is added.
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      salePrice: toNumber(p.salePrice),
      currency: p.currency || 'UAH',
      stockQty: toNumber(p.stockQty),
      unit: p.unit,
      image: null as string | null,
    }));
  }

  // Place an order against a seller. Validates each line: product is RETAIL,
  // belongs to the seller, is active, and has enough stock. Computes the totals
  // from the live salePrice (never trusts client prices). Creates the order +
  // items in a single transaction with status PENDING. Does NOT deduct stock —
  // that happens only on fulfilment. Throws StoreServiceError on validation.
  static async placeOrder(input: PlaceOrderInput) {
    const sellerUserId = input.sellerUserId?.trim();
    if (!sellerUserId) {
      throw new StoreServiceError('SELLER_REQUIRED', 'A seller is required');
    }

    if (!Array.isArray(input.items) || input.items.length === 0) {
      throw new StoreServiceError('EMPTY_ORDER', 'Order must contain at least one item');
    }

    // Collapse duplicate productIds and validate quantities.
    const qtyByProduct = new Map<string, number>();
    for (const item of input.items) {
      const productId = item.productId?.trim();
      const quantity = Number(item.quantity);
      if (!productId) {
        throw new StoreServiceError('INVALID_ITEM', 'Each item must reference a product');
      }
      if (!Number.isFinite(quantity) || quantity <= 0) {
        throw new StoreServiceError('INVALID_QUANTITY', 'Item quantity must be a positive number');
      }
      qtyByProduct.set(productId, (qtyByProduct.get(productId) || 0) + quantity);
    }

    const productIds = Array.from(qtyByProduct.keys());
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, ownerId: sellerUserId },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // Resolve a single seller currency (first product's currency).
    let currency = 'UAH';
    const lineItems: { productId: string; name: string; quantity: number; unitPrice: number }[] = [];
    let subtotal = 0;
    let businessId: string | null = null;

    for (const productId of productIds) {
      const product = productById.get(productId);
      if (!product) {
        throw new StoreServiceError('PRODUCT_NOT_FOUND', 'A product is not available from this seller');
      }
      if (product.type !== 'RETAIL') {
        throw new StoreServiceError('NOT_RETAIL', `"${product.name}" is not available for sale`);
      }
      if (!product.isActive) {
        throw new StoreServiceError('NOT_ACTIVE', `"${product.name}" is not available`);
      }

      const quantity = qtyByProduct.get(productId)!;
      const stockQty = toNumber(product.stockQty);
      if (quantity > stockQty) {
        throw new StoreServiceError('INSUFFICIENT_STOCK', `Not enough stock for "${product.name}"`);
      }

      const unitPrice = toNumber(product.salePrice);
      subtotal += unitPrice * quantity;
      currency = product.currency || currency;
      businessId = product.businessId ?? businessId;

      lineItems.push({ productId, name: product.name, quantity, unitPrice });
    }

    const total = subtotal; // no taxes / shipping yet — fulfilment-tracked only
    const orderNumber = generateOrderNumber();

    const fulfilment: FulfilmentType =
      input.fulfilment && FULFILMENT_TYPES.includes(input.fulfilment) ? input.fulfilment : 'PICKUP';

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.productOrder.create({
        data: {
          ownerId: sellerUserId,
          businessId,
          customerUserId: input.customerUserId?.trim() || null,
          customerName: input.customerName?.trim() || null,
          customerEmail: input.customerEmail?.trim().toLowerCase() || null,
          orderNumber,
          status: 'PENDING',
          fulfilment,
          currency,
          subtotal,
          total,
          note: input.note?.trim() || null,
          items: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              name: li.name,
              quantity: li.quantity,
              unitPrice: li.unitPrice,
            })),
          },
        },
        include: { items: true },
      });
      return created;
    });

    // Best-effort owner notification (non-blocking; never fails the order).
    void StoreService.notifyOwnerOfNewOrder(sellerUserId, order.orderNumber, total, currency);

    return order;
  }

  // =========================================================================
  // OWNER-SCOPED (IDOR-safe)
  // =========================================================================

  static async listOrders(ownerId: string, filters: { status?: OrderStatus } = {}) {
    const where: Prisma.ProductOrderWhereInput = { ownerId };
    if (filters.status && ORDER_STATUSES.includes(filters.status)) {
      where.status = filters.status;
    }

    return prisma.productOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        _count: { select: { items: true } },
      },
    });
  }

  static async getOrder(ownerId: string, id: string) {
    return prisma.productOrder.findFirst({
      where: { id, ownerId },
      include: { items: true },
    });
  }

  // Transition an order's status. On the first move into FULFILLED we deduct
  // stock for every line via InventoryService.adjustStock (reason 'SALE'),
  // exactly once — re-fulfilling an already-FULFILLED order is a no-op for
  // stock. We intentionally do NOT auto-restock when cancelling a previously
  // fulfilled order (kept simple); an owner can correct stock manually.
  // Ownership-scoped; returns null if not owned. Throws StoreServiceError on
  // invalid status.
  static async setOrderStatus(ownerId: string, id: string, status: OrderStatus) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new StoreServiceError('INVALID_STATUS', 'Invalid order status');
    }

    const order = await prisma.productOrder.findFirst({
      where: { id, ownerId },
      include: { items: true },
    });
    if (!order) return null;

    const wasFulfilled = order.status === 'FULFILLED';
    const becomingFulfilled = status === 'FULFILLED' && !wasFulfilled;

    // Deduct stock on first fulfilment (before flipping status). adjustStock is
    // itself transactional per product; if a line's product was deleted it
    // returns null and we skip it.
    if (becomingFulfilled) {
      for (const item of order.items) {
        await InventoryService.adjustStock(
          ownerId,
          item.productId,
          -toNumber(item.quantity),
          'SALE',
          ownerId,
          order.id
        );
      }
    }

    return prisma.productOrder.update({
      where: { id: order.id },
      data: { status },
      include: { items: true },
    });
  }

  // Owner dashboard summary: count of pending orders + total of FULFILLED
  // orders this calendar month.
  static async summary(ownerId: string): Promise<StoreSummary> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [pendingOrders, fulfilledThisMonth] = await Promise.all([
      prisma.productOrder.count({ where: { ownerId, status: 'PENDING' } }),
      prisma.productOrder.findMany({
        where: { ownerId, status: 'FULFILLED', updatedAt: { gte: monthStart } },
      }),
    ]);

    const currencies = new Set<string>();
    let monthSalesTotal = 0;
    for (const o of fulfilledThisMonth) {
      monthSalesTotal += toNumber(o.total);
      currencies.add(o.currency || 'UAH');
    }

    const currency = currencies.size === 1 ? Array.from(currencies)[0] : 'UAH';

    return { pendingOrders, monthSalesTotal, currency };
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  private static async notifyOwnerOfNewOrder(
    ownerId: string,
    orderNumber: string,
    total: number,
    currency: string
  ): Promise<void> {
    try {
      const notificationService = new NotificationService(prisma);
      await notificationService.sendNotification(ownerId, {
        type: 'PRODUCT_ORDER',
        title: 'New product order',
        message: `New order ${orderNumber} for ${total} ${currency}.`,
        priority: 'NORMAL',
        data: { orderNumber, total, currency },
      });
    } catch (error) {
      // Notifications are best-effort — never let them break order placement.
      logger.warn('Failed to notify owner of new product order', { ownerId, orderNumber, error });
    }
  }
}
