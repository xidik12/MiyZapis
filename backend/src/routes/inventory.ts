import { Router, Request, Response } from 'express';
import {
  InventoryService,
  PRODUCT_TYPES,
  STOCK_REASONS,
  ProductType,
  StockReason,
} from '@/services/inventory/inventory.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All inventory routes require authentication and specialist role
router.use(authenticateToken, requireSpecialist);

// The logged-in user is the inventory owner (solo specialist or business owner).
const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

// Parse a numeric body field; returns undefined if absent, null if invalid.
const parseNumber = (value: unknown): number | undefined | null => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

// GET /summary — owner-wide totals (must precede /:id)
router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const summary = await InventoryService.summary(ownerId);
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting inventory summary:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// GET / — list products with filters
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { type, lowStock, search } = req.query;

    const products = await InventoryService.list(ownerId, {
      type: type && PRODUCT_TYPES.includes(type as ProductType) ? (type as ProductType) : undefined,
      lowStock: lowStock === 'true',
      search: typeof search === 'string' ? search : undefined,
    });

    res.json(createSuccessResponse({ products }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing products:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// GET /:id — single product (ownership-scoped)
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const product = await InventoryService.getById(ownerId, req.params.id);

    if (!product) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Product not found', requestId(req)));
      return;
    }

    res.json(createSuccessResponse(product));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting product:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// POST / — create product
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { sku, name, description, type, unit, costPrice, salePrice, stockQty, reorderLevel, currency, businessId } = req.body;

    // Validate name
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name is required', requestId(req)));
      return;
    }

    // Validate type
    if (type !== undefined && !PRODUCT_TYPES.includes(type)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid type. Must be one of: ${PRODUCT_TYPES.join(', ')}`, requestId(req)));
      return;
    }

    const cost = parseNumber(costPrice);
    if (cost === null || (cost !== undefined && cost < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Cost price must be a non-negative number', requestId(req)));
      return;
    }

    const sale = parseNumber(salePrice);
    if (sale === null || (sale !== undefined && sale < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Sale price must be a non-negative number', requestId(req)));
      return;
    }

    const qty = parseNumber(stockQty);
    if (qty === null) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Stock quantity must be a number', requestId(req)));
      return;
    }

    const reorder = parseNumber(reorderLevel);
    if (reorder === null || (reorder !== undefined && reorder < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Reorder level must be a non-negative number', requestId(req)));
      return;
    }

    const product = await InventoryService.create(ownerId, {
      sku,
      name,
      description,
      type,
      unit,
      costPrice: cost,
      salePrice: sale,
      stockQty: qty,
      reorderLevel: reorder,
      currency,
      businessId: businessId ?? null,
    });

    logger.info(`Product created: ${product.id} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(product));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating product:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// PUT /:id — update product
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { sku, name, description, type, unit, costPrice, salePrice, reorderLevel, currency, isActive, businessId } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name cannot be empty', requestId(req)));
      return;
    }

    if (type !== undefined && !PRODUCT_TYPES.includes(type)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid type. Must be one of: ${PRODUCT_TYPES.join(', ')}`, requestId(req)));
      return;
    }

    const cost = parseNumber(costPrice);
    if (cost === null) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Cost price must be a number', requestId(req)));
      return;
    }
    const sale = parseNumber(salePrice);
    if (sale === null) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Sale price must be a number', requestId(req)));
      return;
    }
    const reorder = parseNumber(reorderLevel);
    if (reorder === null) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Reorder level must be a number', requestId(req)));
      return;
    }

    const product = await InventoryService.update(ownerId, req.params.id, {
      sku,
      name,
      description,
      type,
      unit,
      costPrice: cost,
      salePrice: salePrice === null ? null : sale,
      reorderLevel: reorder,
      currency,
      isActive,
      businessId,
    });

    if (!product) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Product not found', requestId(req)));
      return;
    }

    logger.info(`Product updated: ${product.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(product));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating product:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// DELETE /:id — delete product
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await InventoryService.remove(ownerId, req.params.id);

    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Product not found', requestId(req)));
      return;
    }

    logger.info(`Product deleted: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Product deleted successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error deleting product:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// POST /:id/adjust — adjust stock (creates a movement + updates qty in a transaction)
router.post('/:id/adjust', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { delta, reason, reference } = req.body;

    const deltaNum = parseNumber(delta);
    if (deltaNum === undefined || deltaNum === null || deltaNum === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Delta must be a non-zero number', requestId(req)));
      return;
    }

    if (!reason || !STOCK_REASONS.includes(reason)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid reason. Must be one of: ${STOCK_REASONS.join(', ')}`, requestId(req)));
      return;
    }

    const result = await InventoryService.adjustStock(
      ownerId,
      req.params.id,
      deltaNum,
      reason as StockReason,
      ownerId,
      reference
    );

    if (!result) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Product not found', requestId(req)));
      return;
    }

    logger.info(`Stock adjusted for product ${req.params.id} (${deltaNum}, ${reason}) by owner ${ownerId}`);
    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error adjusting stock:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

// GET /:id/movements — movement history for a product
router.get('/:id/movements', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const movements = await InventoryService.movements(ownerId, req.params.id);

    if (movements === null) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Product not found', requestId(req)));
      return;
    }

    res.json(createSuccessResponse({ movements }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting movements:', error);
    res.status(500).json(createErrorResponse('INVENTORY_ERROR', err.message, requestId(req)));
  }
});

export default router;
