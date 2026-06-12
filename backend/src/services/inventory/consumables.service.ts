// ServiceConsumable management + auto-deduction on booking completion.
//
// An owner maps a Service -> the Products it consumes (e.g. "Haircut" uses
// 30ml of "Shampoo"). When a booking for that service is marked COMPLETED, the
// mapped quantities are written off inventory automatically — one StockMovement
// per consumable with reason 'USAGE', referencing the bookingId, exactly once.
//
// Ownership model:
//   Product.ownerId       -> User.id (the inventory owner)
//   Service.specialistId  -> Specialist.id
//   Specialist.userId     -> User.id  (the person who owns the inventory)
// So a service "belongs to" the owner when service.specialist.userId === ownerId.

import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { InventoryService } from './inventory.service';

export interface ConsumableInput {
  productId: string;
  quantity: number;
}

export interface ConsumableView {
  id: string;
  serviceId: string;
  productId: string;
  quantity: number;
  productName: string;
  unit: string;
  stockQty: number;
}

const toNumber = (value: unknown): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number((value as { toString(): string }).toString());
};

export class ConsumablesService {
  // Confirm the service exists AND belongs to the owner (service.specialist.userId === ownerId).
  // Returns the service id when owned, otherwise null.
  private static async assertServiceOwned(ownerId: string, serviceId: string): Promise<string | null> {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, specialist: { userId: ownerId } },
      select: { id: true },
    });
    return service ? service.id : null;
  }

  // List the consumables mapped to a service, joined with product name/unit/stock.
  // Ownership-scoped. Returns null if the service isn't owned by ownerId.
  static async list(ownerId: string, serviceId: string): Promise<ConsumableView[] | null> {
    const owned = await this.assertServiceOwned(ownerId, serviceId);
    if (!owned) return null;

    const consumables = await prisma.serviceConsumable.findMany({
      where: { serviceId },
      orderBy: { createdAt: 'asc' },
    });

    if (consumables.length === 0) return [];

    // ServiceConsumable has no direct product relation, so load the products
    // separately (scoped to the owner, which also filters out any stale rows).
    const products = await prisma.product.findMany({
      where: { ownerId, id: { in: consumables.map((c) => c.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return consumables
      .filter((c) => productMap.has(c.productId))
      .map((c) => {
        const product = productMap.get(c.productId)!;
        return {
          id: c.id,
          serviceId: c.serviceId,
          productId: c.productId,
          quantity: toNumber(c.quantity),
          productName: product.name,
          unit: product.unit,
          stockQty: toNumber(product.stockQty),
        };
      });
  }

  // Replace the whole consumable mapping for a service in one transaction.
  // Each product must belong to the owner; invalid products are rejected.
  // Returns null if the service isn't owned by ownerId.
  static async set(
    ownerId: string,
    serviceId: string,
    items: ConsumableInput[],
  ): Promise<ConsumableView[] | null> {
    const owned = await this.assertServiceOwned(ownerId, serviceId);
    if (!owned) return null;

    // De-duplicate by productId (last write wins) and drop non-positive quantities.
    const byProduct = new Map<string, number>();
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !item.productId.trim()) continue;
      const qty = Number(item.quantity);
      if (!Number.isFinite(qty) || qty <= 0) continue;
      byProduct.set(item.productId, qty);
    }

    const productIds = Array.from(byProduct.keys());

    // Validate every product belongs to the owner.
    if (productIds.length > 0) {
      const owned = await prisma.product.findMany({
        where: { ownerId, id: { in: productIds } },
        select: { id: true },
      });
      if (owned.length !== productIds.length) {
        throw new Error('PRODUCT_NOT_OWNED');
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.serviceConsumable.deleteMany({ where: { serviceId } });
      if (productIds.length > 0) {
        await tx.serviceConsumable.createMany({
          data: productIds.map((productId) => ({
            serviceId,
            productId,
            quantity: byProduct.get(productId)!,
          })),
        });
      }
    });

    return (await this.list(ownerId, serviceId)) ?? [];
  }

  // Remove a single product from a service's consumable mapping.
  // Returns false if the service isn't owned or the mapping didn't exist.
  static async remove(ownerId: string, serviceId: string, productId: string): Promise<boolean> {
    const owned = await this.assertServiceOwned(ownerId, serviceId);
    if (!owned) return false;

    const result = await prisma.serviceConsumable.deleteMany({
      where: { serviceId, productId },
    });
    return result.count > 0;
  }

  /**
   * Auto-deduct a booking's consumables when it completes. Idempotent: a no-op
   * if booking.consumablesDeducted is already true. Resolves the inventory owner
   * from the service's specialist user. Never throws into the booking flow —
   * failures are logged and swallowed.
   */
  static async deductForBooking(bookingId: string): Promise<void> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          serviceId: true,
          consumablesDeducted: true,
          service: { select: { specialist: { select: { userId: true } } } },
        },
      });

      if (!booking) {
        logger.warn('Consumables deduction skipped: booking not found', { bookingId });
        return;
      }
      if (booking.consumablesDeducted) {
        // Already deducted — idempotent no-op.
        return;
      }
      if (!booking.serviceId) {
        logger.warn('Consumables deduction skipped: booking has no service', { bookingId });
        return;
      }

      const ownerId = booking.service?.specialist?.userId;
      if (!ownerId) {
        logger.warn('Consumables deduction skipped: could not resolve inventory owner', {
          bookingId,
          serviceId: booking.serviceId,
        });
        return;
      }

      const consumables = await prisma.serviceConsumable.findMany({
        where: { serviceId: booking.serviceId },
      });

      // Write off each consumable. adjustStock is itself ownership-scoped, so a
      // product that no longer belongs to the owner is silently skipped.
      for (const consumable of consumables) {
        const qty = toNumber(consumable.quantity);
        if (qty <= 0) continue;

        const result = await InventoryService.adjustStock(
          ownerId,
          consumable.productId,
          -qty,
          'USAGE',
          ownerId,
          bookingId,
        );

        if (!result) {
          logger.warn('Consumable product not adjusted (not owned / missing)', {
            bookingId,
            productId: consumable.productId,
          });
        }
      }

      // Mark as deducted so re-completion (or a retry) doesn't double-write.
      await prisma.booking.update({
        where: { id: bookingId },
        data: { consumablesDeducted: true },
      });

      logger.info('Consumables deducted for completed booking', {
        bookingId,
        count: consumables.length,
      });
    } catch (error) {
      // Must never break the booking-completion flow.
      logger.error('Failed to deduct consumables for booking', {
        bookingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
