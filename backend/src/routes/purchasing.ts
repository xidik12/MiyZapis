import { Router, Request, Response } from 'express';
import {
  PurchasingService,
  PO_STATUSES,
  POStatus,
  POItemInput,
  ReceiptInput,
} from '@/services/purchasing/purchasing.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { requireBusinessOwner } from '@/middleware/requireBusinessOwner';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All purchasing routes require authentication and specialist role
router.use(authenticateToken, requireSpecialist, requireBusinessOwner);

// The logged-in user is the purchasing owner (solo specialist or business owner).
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

// Validate + normalise an array of PO line items. Returns null on invalid input.
const parseItems = (raw: unknown): POItemInput[] | null => {
  if (!Array.isArray(raw)) return null;
  const items: POItemInput[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null;
    const obj = r as Record<string, unknown>;
    const description = typeof obj.description === 'string' ? obj.description.trim() : '';
    if (!description) return null;
    const quantity = Number(obj.quantity);
    const unitCost = Number(obj.unitCost);
    if (!Number.isFinite(quantity) || quantity <= 0) return null;
    if (!Number.isFinite(unitCost) || unitCost < 0) return null;
    items.push({
      productId: typeof obj.productId === 'string' && obj.productId ? obj.productId : null,
      description,
      quantity,
      unitCost,
    });
  }
  return items;
};

// ===================== Suppliers =====================

// GET /suppliers — list suppliers
router.get('/suppliers', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const suppliers = await PurchasingService.listSuppliers(ownerId);
    res.json(createSuccessResponse({ suppliers }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing suppliers:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// POST /suppliers — create supplier
router.post('/suppliers', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, email, phone, address, taxId, notes, businessId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name is required', requestId(req)));
      return;
    }

    const supplier = await PurchasingService.createSupplier(ownerId, {
      name,
      email,
      phone,
      address,
      taxId,
      notes,
      businessId: businessId ?? null,
    });

    logger.info(`Supplier created: ${supplier.id} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(supplier));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating supplier:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// GET /suppliers/:id — single supplier (ownership-scoped)
router.get('/suppliers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const supplier = await PurchasingService.getSupplier(ownerId, req.params.id);
    if (!supplier) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Supplier not found', requestId(req)));
      return;
    }
    res.json(createSuccessResponse(supplier));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting supplier:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// PUT /suppliers/:id — update supplier
router.put('/suppliers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, email, phone, address, taxId, notes, isActive, businessId } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name cannot be empty', requestId(req)));
      return;
    }

    const supplier = await PurchasingService.updateSupplier(ownerId, req.params.id, {
      name,
      email,
      phone,
      address,
      taxId,
      notes,
      isActive,
      businessId,
    });

    if (!supplier) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Supplier not found', requestId(req)));
      return;
    }

    logger.info(`Supplier updated: ${supplier.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(supplier));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating supplier:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// DELETE /suppliers/:id — soft delete supplier
router.delete('/suppliers/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await PurchasingService.removeSupplier(ownerId, req.params.id);
    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Supplier not found', requestId(req)));
      return;
    }
    logger.info(`Supplier deactivated: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Supplier deactivated successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error deleting supplier:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// ===================== Purchase orders =====================

// GET /orders/summary — owner-wide purchasing totals (must precede /orders/:id)
router.get('/orders/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const summary = await PurchasingService.summary(ownerId);
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting purchasing summary:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// GET /orders — list purchase orders (optionally filtered by status)
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status, supplierId } = req.query;

    const orders = await PurchasingService.listPOs(ownerId, {
      status: status && PO_STATUSES.includes(status as POStatus) ? (status as POStatus) : undefined,
      supplierId: typeof supplierId === 'string' ? supplierId : undefined,
    });

    res.json(createSuccessResponse({ orders }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing purchase orders:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// GET /orders/:id — single PO with items + supplier
router.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const order = await PurchasingService.getPO(ownerId, req.params.id);
    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Purchase order not found', requestId(req)));
      return;
    }
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting purchase order:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// POST /orders — create PO
router.post('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { supplierId, currency, notes, taxAmount, businessId, items } = req.body;

    const parsedItems = parseItems(items);
    if (parsedItems === null || parsedItems.length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'At least one valid line item is required (description, quantity > 0, unitCost >= 0)', requestId(req)));
      return;
    }

    const tax = parseNumber(taxAmount);
    if (tax === null || (tax !== undefined && tax < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Tax amount must be a non-negative number', requestId(req)));
      return;
    }

    const order = await PurchasingService.createPO(ownerId, {
      supplierId: supplierId ?? null,
      currency,
      notes,
      taxAmount: tax,
      businessId: businessId ?? null,
      items: parsedItems,
    });

    logger.info(`Purchase order created: ${order.id} (${order.poNumber}) by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating purchase order:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// PUT /orders/:id — update DRAFT PO
router.put('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { supplierId, currency, notes, taxAmount, items } = req.body;

    let parsedItems: POItemInput[] | undefined;
    if (items !== undefined) {
      const parsed = parseItems(items);
      if (parsed === null || parsed.length === 0) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'At least one valid line item is required', requestId(req)));
        return;
      }
      parsedItems = parsed;
    }

    const tax = parseNumber(taxAmount);
    if (tax === null || (tax !== undefined && tax < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Tax amount must be a non-negative number', requestId(req)));
      return;
    }

    const order = await PurchasingService.updatePO(ownerId, req.params.id, {
      supplierId,
      currency,
      notes,
      taxAmount: tax,
      items: parsedItems,
    });

    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Purchase order not found', requestId(req)));
      return;
    }

    logger.info(`Purchase order updated: ${order.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating purchase order:', error);
    const code = err.message.includes('DRAFT') ? 400 : 500;
    res.status(code).json(createErrorResponse(code === 400 ? 'VALIDATION_ERROR' : 'PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// DELETE /orders/:id — delete DRAFT PO
router.delete('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await PurchasingService.deletePO(ownerId, req.params.id);
    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Purchase order not found', requestId(req)));
      return;
    }
    logger.info(`Purchase order deleted: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Purchase order deleted successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error deleting purchase order:', error);
    const code = err.message.includes('DRAFT') ? 400 : 500;
    res.status(code).json(createErrorResponse(code === 400 ? 'VALIDATION_ERROR' : 'PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// POST /orders/:id/status — set PO status
router.post('/orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status } = req.body;

    if (!status || !PO_STATUSES.includes(status)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid status. Must be one of: ${PO_STATUSES.join(', ')}`, requestId(req)));
      return;
    }

    const order = await PurchasingService.setStatus(ownerId, req.params.id, status as POStatus);
    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Purchase order not found', requestId(req)));
      return;
    }

    logger.info(`Purchase order ${req.params.id} status -> ${status} by owner ${ownerId}`);
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error setting purchase order status:', error);
    res.status(500).json(createErrorResponse('PURCHASING_ERROR', err.message, requestId(req)));
  }
});

// POST /orders/:id/receive — receive a PO (full receive, or per-item receipts)
router.post('/orders/:id/receive', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { receipts } = req.body;

    let parsedReceipts: ReceiptInput[] | undefined;
    if (receipts !== undefined) {
      if (!Array.isArray(receipts)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Receipts must be an array', requestId(req)));
        return;
      }
      parsedReceipts = [];
      for (const r of receipts) {
        if (!r || typeof r !== 'object' || typeof (r as Record<string, unknown>).itemId !== 'string') {
          res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Each receipt needs an itemId and receivedQty', requestId(req)));
          return;
        }
        const qty = Number((r as Record<string, unknown>).receivedQty);
        if (!Number.isFinite(qty) || qty < 0) {
          res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'receivedQty must be a non-negative number', requestId(req)));
          return;
        }
        parsedReceipts.push({ itemId: (r as Record<string, unknown>).itemId as string, receivedQty: qty });
      }
    }

    const order = await PurchasingService.receivePO(ownerId, req.params.id, parsedReceipts, ownerId);
    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Purchase order not found', requestId(req)));
      return;
    }

    logger.info(`Purchase order ${req.params.id} received (status ${order.status}) by owner ${ownerId}`);
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error receiving purchase order:', error);
    const code = err.message.includes('cancelled') ? 400 : 500;
    res.status(code).json(createErrorResponse(code === 400 ? 'VALIDATION_ERROR' : 'PURCHASING_ERROR', err.message, requestId(req)));
  }
});

export default router;
