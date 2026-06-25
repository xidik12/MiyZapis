import { Router, Request, Response } from 'express';
import {
  StoreService,
  StoreServiceError,
  ORDER_STATUSES,
  FULFILMENT_TYPES,
  OrderStatus,
  FulfilmentType,
} from '@/services/store/store.service';
import { SalesServiceError } from '@/services/sales/sales.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, optionalAuth, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

// Retail storefront + online ordering routes.
//
// Public:  storefront listing + order placement (guests allowed; an authed
//          customer is attached as customerUserId).
// Owner:   order management — list / detail / status transitions / summary
//          (authenticateToken + requireSpecialist, IDOR-safe via ownerId).
//
// NOTE: payments are NOT live yet. Orders are collected/paid in-store and
// fulfilment-tracked (PENDING → PAID → FULFILLED / CANCELLED). Stock is only
// deducted on FULFILLED. See store.service.ts.

const router = Router();

const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

// Map a StoreServiceError to an HTTP status.
const statusForServiceError = (code: string): number => {
  switch (code) {
    case 'PRODUCT_NOT_FOUND':
      return 404;
    default:
      return 400;
  }
};

// ===========================================================================
// OWNER ROUTES (specialist-only). Mounted on a guarded sub-router declared
// BEFORE the public parameterized storefront route so /orders/* isn't
// shadowed by /:sellerUserId/products.
// ===========================================================================

const ownerRouter = Router();
// Cast: middleware RequestHandler signature differs from this Router's generic.
ownerRouter.use(authenticateToken as any, requireSpecialist as any);

// GET /store/orders/summary — pending orders + this-month sales
ownerRouter.get('/orders/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await StoreService.summary(ownerIdOf(req));
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting store summary:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// GET /store/orders — list owner's orders (optional ?status=)
ownerRouter.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status } = req.query;

    const orders = await StoreService.listOrders(ownerId, {
      status:
        typeof status === 'string' && ORDER_STATUSES.includes(status as OrderStatus)
          ? (status as OrderStatus)
          : undefined,
    });

    res.json(createSuccessResponse({ orders }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing store orders:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// GET /store/orders/:id — single order (owner-scoped)
ownerRouter.get('/orders/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const order = await StoreService.getOrder(ownerIdOf(req), req.params.id);
    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Order not found', requestId(req)));
      return;
    }
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting store order:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// POST /store/orders/:id/status — transition status (deducts stock on FULFILLED)
ownerRouter.post('/orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status } = req.body;

    if (typeof status !== 'string' || !ORDER_STATUSES.includes(status as OrderStatus)) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', `Status must be one of: ${ORDER_STATUSES.join(', ')}`, requestId(req)));
      return;
    }

    let order;
    try {
      order = await StoreService.setOrderStatus(ownerId, req.params.id, status as OrderStatus);
    } catch (svcError: unknown) {
      if (svcError instanceof StoreServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Order not found', requestId(req)));
      return;
    }

    logger.info(`Product order ${order.orderNumber} → ${status} by owner ${ownerId}`);
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating store order status:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// GET /store/pos/giftcard/:code — owner-scoped gift-card lookup for POS checkout.
// Returns balance/currency/status for a card belonging to this owner that is
// ACTIVE and not expired. 404 if not found, expired, or belongs to another owner.
ownerRouter.get('/pos/giftcard/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const code = req.params.code?.trim();
    if (!code) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Gift card code is required', requestId(req)));
      return;
    }
    const card = await StoreService.getGiftCardByCodeForOwner(ownerId, code);
    if (!card) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Gift card not found or not available', requestId(req)));
      return;
    }
    if (card.status !== 'ACTIVE') {
      res.status(404).json(createErrorResponse('NOT_FOUND', `Gift card is ${card.status.toLowerCase()}`, requestId(req)));
      return;
    }
    res.json(createSuccessResponse(card));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error looking up gift card at POS:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// POS — instant in-person counter sale. Body: { items: [{productId, quantity}],
// paymentMethod?, customerName?, note?, discount?, giftCardCode? }.
// Creates a FULFILLED order + deducts stock. Gift card is redeemed atomically.
ownerRouter.post('/pos/sale', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    let order;
    try {
      order = await StoreService.posSale(ownerId, {
        items: req.body?.items,
        paymentMethod: req.body?.paymentMethod,
        customerName: req.body?.customerName,
        note: req.body?.note,
        discount: req.body?.discount !== undefined ? Number(req.body.discount) : undefined,
        giftCardCode: typeof req.body?.giftCardCode === 'string' ? req.body.giftCardCode.trim() : undefined,
      });
    } catch (svcError: unknown) {
      if (svcError instanceof StoreServiceError || svcError instanceof SalesServiceError) {
        res.status(statusForServiceError((svcError as StoreServiceError).code)).json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }
    logger.info(`POS sale ${order.orderNumber} by owner ${ownerId}, total ${order.total}`);
    res.status(201).json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error in POS sale:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// POST /store/pos/orders/:orderId/refund — refund a FULFILLED or PAID order, restock items.
ownerRouter.post('/pos/orders/:orderId/refund', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    let order;
    try {
      order = await StoreService.refundOrder(ownerId, req.params.orderId);
    } catch (svcError: unknown) {
      if (svcError instanceof StoreServiceError) {
        const httpStatus = svcError.code === 'ALREADY_REFUNDED' ? 409 : 400;
        res.status(httpStatus).json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }
    if (!order) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Order not found', requestId(req)));
      return;
    }
    logger.info(`Order ${order.orderNumber} refunded by owner ${ownerId}`);
    res.json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error refunding order:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// GET /store/pos/today — end-of-day summary for the owner (today's orders).
ownerRouter.get('/pos/today', async (req: Request, res: Response): Promise<void> => {
  try {
    const summary = await StoreService.todaySummary(ownerIdOf(req));
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting today summary:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// ===========================================================================
// PUBLIC ROUTES — registered BEFORE the guarded ownerRouter is mounted, so the
// ownerRouter's blanket authenticateToken middleware never runs for anonymous
// storefront views or guest checkout. (Owner routes are all under /orders/* and
// the public GET only matches /<sellerId>/products, so there is no shadowing.)
// ===========================================================================

// POST /store/orders — place an order (guests allowed; authed → customerUserId)
router.post('/orders', optionalAuth as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const authReq = req as unknown as AuthenticatedRequest;
    const { sellerUserId, customerName, customerEmail, fulfilment, note, items } = req.body;

    if (typeof sellerUserId !== 'string' || !sellerUserId.trim()) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'A seller is required', requestId(req)));
      return;
    }
    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Order must contain at least one item', requestId(req)));
      return;
    }

    let order;
    try {
      order = await StoreService.placeOrder({
        sellerUserId,
        customerUserId: authReq.user?.id || null,
        customerName,
        customerEmail,
        fulfilment:
          typeof fulfilment === 'string' && FULFILMENT_TYPES.includes(fulfilment as FulfilmentType)
            ? (fulfilment as FulfilmentType)
            : undefined,
        note,
        items,
      });
    } catch (svcError: unknown) {
      if (svcError instanceof StoreServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    logger.info(`Product order placed: ${order.orderNumber} for seller ${sellerUserId}`);
    res.status(201).json(createSuccessResponse(order));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error placing product order:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// GET /store/:sellerUserId/products — public storefront for a seller
router.get('/:sellerUserId/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sellerUserId } = req.params;
    const { businessId } = req.query;

    const products = await StoreService.listStorefront({
      sellerUserId,
      businessId: typeof businessId === 'string' ? businessId : undefined,
    });

    res.json(createSuccessResponse({ products }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing storefront:', error);
    res.status(500).json(createErrorResponse('STORE_ERROR', err.message, requestId(req)));
  }
});

// Guarded owner routes mounted LAST so their auth middleware can't intercept
// the public routes above.
router.use(ownerRouter);

export default router;
