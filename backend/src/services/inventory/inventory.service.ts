import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Valid product types
export const PRODUCT_TYPES = ['CONSUMABLE', 'RETAIL'] as const;
export type ProductType = typeof PRODUCT_TYPES[number];

// Valid stock movement reasons
export const STOCK_REASONS = ['PURCHASE', 'USAGE', 'SALE', 'ADJUSTMENT', 'RETURN'] as const;
export type StockReason = typeof STOCK_REASONS[number];

export interface InventoryFilters {
  type?: ProductType;
  lowStock?: boolean;
  expiringSoon?: boolean; // expired or expiring within EXPIRY_SOON_DAYS
  search?: string;
}

// A product is "expiring soon" if its expiry is within this many days (or past).
export const EXPIRY_SOON_DAYS = 30;

export interface CreateProductData {
  sku?: string | null;
  barcode?: string | null;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  type?: ProductType;
  unit?: string;
  costPrice?: number;
  salePrice?: number | null;
  stockQty?: number;
  reorderLevel?: number;
  expiryDate?: string | Date | null;
  currency?: string;
  businessId?: string | null;
}

export interface UpdateProductData {
  sku?: string | null;
  barcode?: string | null;
  name?: string;
  description?: string | null;
  imageUrl?: string | null;
  type?: ProductType;
  unit?: string;
  costPrice?: number;
  salePrice?: number | null;
  reorderLevel?: number;
  expiryDate?: string | Date | null;
  currency?: string;
  isActive?: boolean;
  businessId?: string | null;
}

export interface InventorySummary {
  totalProducts: number;
  totalStockValue: number;
  lowStockCount: number;
  expiringSoonCount: number;
  currency: string;
}

// Convert Prisma Decimal | number | null to a JS number safely.
const toNumber = (value: Prisma.Decimal | number | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  return typeof value === 'number' ? value : Number(value.toString());
};

export class InventoryService {
  // List products for an owner with optional filters. Always scoped by ownerId.
  static async list(ownerId: string, filters: InventoryFilters = {}) {
    const where: Prisma.ProductWhereInput = {
      ownerId,
    };

    if (filters.type && PRODUCT_TYPES.includes(filters.type)) {
      where.type = filters.type;
    }

    if (filters.search && filters.search.trim()) {
      const term = filters.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { barcode: { contains: term, mode: 'insensitive' } },
        { description: { contains: term, mode: 'insensitive' } },
      ];
    }

    if (filters.expiringSoon) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() + EXPIRY_SOON_DAYS);
      where.expiryDate = { not: null, lte: cutoff };
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Low-stock filtering is done in-memory because it compares two columns
    // (stockQty <= reorderLevel), which Prisma can't express in a where clause.
    if (filters.lowStock) {
      return products.filter(
        (p) => toNumber(p.reorderLevel) > 0 && toNumber(p.stockQty) <= toNumber(p.reorderLevel)
      );
    }

    return products;
  }

  // Get a single product, ownership-scoped (returns null if not owned by ownerId).
  static async getById(ownerId: string, id: string) {
    return prisma.product.findFirst({
      where: { id, ownerId },
    });
  }

  // Create a new product for the owner.
  static async create(ownerId: string, data: CreateProductData) {
    return prisma.product.create({
      data: {
        ownerId,
        businessId: data.businessId ?? null,
        sku: data.sku?.trim() || null,
        barcode: data.barcode?.trim() || null,
        name: data.name.trim(),
        description: data.description?.trim() || null,
        imageUrl: data.imageUrl?.trim() || null,
        type: data.type && PRODUCT_TYPES.includes(data.type) ? data.type : 'CONSUMABLE',
        unit: data.unit?.trim() || 'unit',
        costPrice: data.costPrice != null ? data.costPrice : 0,
        salePrice: data.salePrice != null ? data.salePrice : null,
        stockQty: data.stockQty != null ? data.stockQty : 0,
        reorderLevel: data.reorderLevel != null ? data.reorderLevel : 0,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        currency: data.currency || 'UAH',
      },
    });
  }

  // Update an existing product, ownership-scoped. Returns null if not found/owned.
  static async update(ownerId: string, id: string, data: UpdateProductData) {
    const existing = await prisma.product.findFirst({ where: { id, ownerId } });
    if (!existing) return null;

    const updateData: Prisma.ProductUpdateInput = {};
    if (data.sku !== undefined) updateData.sku = data.sku?.trim() || null;
    if (data.barcode !== undefined) updateData.barcode = data.barcode?.trim() || null;
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.description !== undefined) updateData.description = data.description?.trim() || null;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl?.trim() || null;
    if (data.type !== undefined && PRODUCT_TYPES.includes(data.type)) updateData.type = data.type;
    if (data.unit !== undefined) updateData.unit = data.unit?.trim() || 'unit';
    if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
    if (data.salePrice !== undefined) updateData.salePrice = data.salePrice;
    if (data.reorderLevel !== undefined) updateData.reorderLevel = data.reorderLevel;
    if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.businessId !== undefined) updateData.businessId = data.businessId ?? null;

    return prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  // Look up a product by barcode. Returns the owner's own product (for POS), and
  // when they don't have it yet, a match from the platform-wide catalog (any
  // product anyone has entered with that barcode) so adding it can auto-fill
  // name/image — the shared product data we collect across all shops.
  static async lookupByBarcode(ownerId: string, barcode: string) {
    const code = (barcode || '').trim();
    if (!code) return { own: null, catalog: null };
    const own = await prisma.product.findFirst({ where: { ownerId, barcode: code } });
    let catalog: { name: string; description: string | null; imageUrl: string | null; unit: string } | null = null;
    if (!own) {
      catalog = await prisma.product.findFirst({
        where: { barcode: code },
        select: { name: true, description: true, imageUrl: true, unit: true },
        orderBy: { updatedAt: 'desc' },
      });
    }
    return { own, catalog };
  }

  // Delete a product, ownership-scoped. Returns false if not found/owned.
  static async remove(ownerId: string, id: string): Promise<boolean> {
    const existing = await prisma.product.findFirst({ where: { id, ownerId } });
    if (!existing) return false;

    await prisma.product.delete({ where: { id } });
    return true;
  }

  // Adjust stock: create a StockMovement AND increment Product.stockQty in one transaction.
  // Ownership-scoped. Returns null if the product isn't owned by ownerId.
  static async adjustStock(
    ownerId: string,
    productId: string,
    delta: number,
    reason: StockReason,
    createdById: string,
    reference?: string | null
  ) {
    const product = await prisma.product.findFirst({ where: { id: productId, ownerId } });
    if (!product) return null;

    return prisma.$transaction(async (tx) => {
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          delta,
          reason,
          reference: reference?.trim() || null,
          createdById,
        },
      });

      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stockQty: { increment: delta } },
      });

      return { movement, product: updatedProduct };
    });
  }

  // Owner-wide inventory summary.
  static async summary(ownerId: string): Promise<InventorySummary> {
    const products = await prisma.product.findMany({
      where: { ownerId },
    });

    let totalStockValue = 0;
    let lowStockCount = 0;
    let expiringSoonCount = 0;
    const currencies = new Set<string>();
    const expiryCutoff = new Date();
    expiryCutoff.setDate(expiryCutoff.getDate() + EXPIRY_SOON_DAYS);

    for (const p of products) {
      const stockQty = toNumber(p.stockQty);
      const costPrice = toNumber(p.costPrice);
      const reorderLevel = toNumber(p.reorderLevel);

      totalStockValue += stockQty * costPrice;
      if (reorderLevel > 0 && stockQty <= reorderLevel) {
        lowStockCount += 1;
      }
      if (p.expiryDate && p.expiryDate <= expiryCutoff) {
        expiringSoonCount += 1;
      }
      currencies.add(p.currency || 'UAH');
    }

    const currency = currencies.size === 1 ? Array.from(currencies)[0] : 'UAH';

    return {
      totalProducts: products.length,
      totalStockValue,
      lowStockCount,
      expiringSoonCount,
      currency,
    };
  }

  // Movement history for a product, ownership-scoped. Returns null if not owned.
  static async movements(ownerId: string, productId: string) {
    const product = await prisma.product.findFirst({ where: { id: productId, ownerId } });
    if (!product) return null;

    return prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
