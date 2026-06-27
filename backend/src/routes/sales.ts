import { Router, Request, Response } from 'express';
import {
  SalesService,
  SalesServiceError,
  GIFT_CARD_STATUSES,
  BILLING_PERIODS,
  GiftCardStatus,
  BillingPeriod,
} from '@/services/sales/sales.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

// Sales suite routes: gift cards, service packages, memberships.
// NOTE: "selling" here means the owner ISSUES/assigns (records) the product —
// live card payments are not enabled yet. Redemption (gift-card balance /
// package credits) is real value movement. See sales.service.ts.

const router = Router();

// All sales routes require authentication and the specialist role.
router.use(authenticateToken, requireSpecialist);

// The logged-in user is the sales owner (solo specialist or business owner).
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

// Map a SalesServiceError to an HTTP status.
const statusForServiceError = (code: string): number => {
  switch (code) {
    case 'CUSTOMER_NOT_FOUND':
      return 404;
    case 'CUSTOMER_REQUIRED':
    case 'INVALID_AMOUNT':
    case 'INSUFFICIENT_BALANCE':
    case 'NOT_ACTIVE':
    case 'EXPIRED':
    case 'NO_CREDITS':
      return 400;
    default:
      return 400;
  }
};

// ===========================================================================
// SUMMARY
// ===========================================================================

router.get('/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const summary = await SalesService.summary(ownerId);
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting sales summary:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// Highest active membership discount % for a customer — lets POS preview the
// member discount before completing the sale.
router.get('/membership-discount/:customerUserId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const discountPercent = await SalesService.getActiveDiscountForCustomer(ownerId, req.params.customerUserId);
    res.json(createSuccessResponse({ discountPercent }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// ===========================================================================
// GIFT CARDS
// ===========================================================================

// GET /gift-cards — list with optional status/search filters
router.get('/gift-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status, search } = req.query;

    const giftCards = await SalesService.listGiftCards(ownerId, {
      status:
        status && GIFT_CARD_STATUSES.includes(status as GiftCardStatus)
          ? (status as GiftCardStatus)
          : undefined,
      search: typeof search === 'string' ? search : undefined,
    });

    res.json(createSuccessResponse({ giftCards }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing gift cards:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /gift-cards — issue (record) a new gift card
router.post('/gift-cards', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { initialAmount, currency, recipientEmail, note, expiresAt, businessId } = req.body;

    const amount = parseNumber(initialAmount);
    if (amount === undefined || amount === null || amount <= 0) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', 'Initial amount must be a positive number', requestId(req)));
      return;
    }

    const card = await SalesService.issueGiftCard(ownerId, {
      initialAmount: amount,
      currency,
      recipientEmail,
      note,
      expiresAt,
      businessId: businessId ?? null,
    });

    logger.info(`Gift card issued: ${card.id} (${card.code}) by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(card));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error issuing gift card:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// GET /gift-cards/code/:code — redemption lookup (minimal balance/status)
router.get('/gift-cards/code/:code', async (req: Request, res: Response): Promise<void> => {
  try {
    const card = await SalesService.getGiftCardByCode(req.params.code);
    if (!card) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Gift card not found', requestId(req)));
      return;
    }
    res.json(createSuccessResponse(card));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error looking up gift card by code:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /gift-cards/:id/redeem — redeem an amount (real balance deduction)
router.post('/gift-cards/:id/redeem', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { amount, bookingId } = req.body;

    const value = parseNumber(amount);
    if (value === undefined || value === null || value <= 0) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', 'Redeem amount must be a positive number', requestId(req)));
      return;
    }

    let result;
    try {
      result = await SalesService.redeemGiftCard(ownerId, req.params.id, value, bookingId ?? null);
    } catch (svcError: unknown) {
      if (svcError instanceof SalesServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    if (!result) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Gift card not found', requestId(req)));
      return;
    }

    logger.info(`Gift card redeemed: ${req.params.id} (-${value}) by owner ${ownerId}`);
    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error redeeming gift card:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /gift-cards/:id/cancel — void a gift card
router.post('/gift-cards/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const card = await SalesService.cancelGiftCard(ownerId, req.params.id);

    if (!card) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Gift card not found', requestId(req)));
      return;
    }

    logger.info(`Gift card cancelled: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(card));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error cancelling gift card:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// ===========================================================================
// SERVICE PACKAGES
// ===========================================================================

// GET /packages — list sellable package definitions
router.get('/packages', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const packages = await SalesService.listPackages(ownerId);
    res.json(createSuccessResponse({ packages }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing packages:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /packages — create a package definition
router.post('/packages', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, description, serviceId, credits, price, currency, validDays, isActive, businessId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name is required', requestId(req)));
      return;
    }

    const creditsNum = parseNumber(credits);
    if (creditsNum === undefined || creditsNum === null || creditsNum < 1 || !Number.isInteger(creditsNum)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Credits must be a positive integer', requestId(req)));
      return;
    }

    const priceNum = parseNumber(price);
    if (priceNum === undefined || priceNum === null || priceNum < 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number', requestId(req)));
      return;
    }

    const validDaysNum = parseNumber(validDays);
    if (validDaysNum === null || (validDaysNum !== undefined && validDaysNum < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Valid days must be a non-negative number', requestId(req)));
      return;
    }

    const pkg = await SalesService.createPackage(ownerId, {
      name,
      description,
      serviceId,
      credits: creditsNum,
      price: priceNum,
      currency,
      validDays: validDaysNum,
      isActive,
      businessId: businessId ?? null,
    });

    logger.info(`Package created: ${pkg.id} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(pkg));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating package:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// PUT /packages/:id — update a package definition
router.put('/packages/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, description, serviceId, credits, price, currency, validDays, isActive, businessId } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name cannot be empty', requestId(req)));
      return;
    }

    const creditsNum = parseNumber(credits);
    if (creditsNum === null || (creditsNum !== undefined && (creditsNum < 1 || !Number.isInteger(creditsNum)))) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Credits must be a positive integer', requestId(req)));
      return;
    }

    const priceNum = parseNumber(price);
    if (priceNum === null || (priceNum !== undefined && priceNum < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number', requestId(req)));
      return;
    }

    const validDaysNum = parseNumber(validDays);
    if (validDaysNum === null || (validDaysNum !== undefined && validDaysNum < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Valid days must be a non-negative number', requestId(req)));
      return;
    }

    const pkg = await SalesService.updatePackage(ownerId, req.params.id, {
      name,
      description,
      serviceId,
      credits: creditsNum,
      price: priceNum,
      currency,
      validDays: validDaysNum,
      isActive,
      businessId,
    });

    if (!pkg) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Package not found', requestId(req)));
      return;
    }

    logger.info(`Package updated: ${pkg.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(pkg));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating package:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// DELETE /packages/:id — delete a package definition
router.delete('/packages/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await SalesService.deletePackage(ownerId, req.params.id);

    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Package not found', requestId(req)));
      return;
    }

    logger.info(`Package deleted: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Package deleted successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error deleting package:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /packages/:id/grant — grant (assign) a package to a customer by id or email
router.post('/packages/:id/grant', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { customerUserId, customerEmail } = req.body;

    if (!customerUserId && !customerEmail) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'A customer id or email is required', requestId(req)));
      return;
    }

    let result;
    try {
      result = await SalesService.grantPackage(ownerId, req.params.id, { customerUserId, customerEmail });
    } catch (svcError: unknown) {
      if (svcError instanceof SalesServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    if (!result) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Package not found', requestId(req)));
      return;
    }

    logger.info(`Package granted: ${req.params.id} → ${result.customerUserId} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error granting package:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// GET /customer-packages — list granted customer packages
router.get('/customer-packages', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { customerUserId } = req.query;

    const customerPackages = await SalesService.listCustomerPackages(ownerId, {
      customerUserId: typeof customerUserId === 'string' ? customerUserId : undefined,
    });

    res.json(createSuccessResponse({ customerPackages }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing customer packages:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /customer-packages/:id/use — use one credit (real deduction)
router.post('/customer-packages/:id/use', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { bookingId } = req.body;

    let result;
    try {
      result = await SalesService.usePackageCredit(ownerId, req.params.id, bookingId ?? null);
    } catch (svcError: unknown) {
      if (svcError instanceof SalesServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    if (!result) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Customer package not found', requestId(req)));
      return;
    }

    logger.info(`Package credit used: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error using package credit:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// ===========================================================================
// MEMBERSHIPS
// ===========================================================================

// GET /plans — list membership plan definitions
router.get('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const plans = await SalesService.listPlans(ownerId);
    res.json(createSuccessResponse({ plans }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing plans:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /plans — create a membership plan
router.post('/plans', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, description, price, currency, billingPeriod, benefits, discountPercent, isActive, businessId } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name is required', requestId(req)));
      return;
    }

    const priceNum = parseNumber(price);
    if (priceNum === undefined || priceNum === null || priceNum < 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number', requestId(req)));
      return;
    }

    if (billingPeriod !== undefined && !BILLING_PERIODS.includes(billingPeriod)) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', `Invalid billing period. Must be one of: ${BILLING_PERIODS.join(', ')}`, requestId(req)));
      return;
    }

    const discountNum = parseNumber(discountPercent);
    if (discountNum === null || (discountNum !== undefined && (discountNum < 0 || discountNum > 100))) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Discount must be between 0 and 100', requestId(req)));
      return;
    }

    const plan = await SalesService.createPlan(ownerId, {
      name,
      description,
      price: priceNum,
      currency,
      billingPeriod: billingPeriod as BillingPeriod | undefined,
      benefits,
      discountPercent: discountNum,
      isActive,
      businessId: businessId ?? null,
    });

    logger.info(`Membership plan created: ${plan.id} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(plan));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error creating membership plan:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// PUT /plans/:id — update a membership plan
router.put('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { name, description, price, currency, billingPeriod, benefits, discountPercent, isActive, businessId } = req.body;

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Name cannot be empty', requestId(req)));
      return;
    }

    const priceNum = parseNumber(price);
    if (priceNum === null || (priceNum !== undefined && priceNum < 0)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Price must be a non-negative number', requestId(req)));
      return;
    }

    if (billingPeriod !== undefined && !BILLING_PERIODS.includes(billingPeriod)) {
      res
        .status(400)
        .json(createErrorResponse('VALIDATION_ERROR', `Invalid billing period. Must be one of: ${BILLING_PERIODS.join(', ')}`, requestId(req)));
      return;
    }

    const discountNum = parseNumber(discountPercent);
    if (discountNum === null || (discountNum !== undefined && (discountNum < 0 || discountNum > 100))) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Discount must be between 0 and 100', requestId(req)));
      return;
    }

    const plan = await SalesService.updatePlan(ownerId, req.params.id, {
      name,
      description,
      price: priceNum,
      currency,
      billingPeriod: billingPeriod as BillingPeriod | undefined,
      benefits,
      discountPercent: discountNum,
      isActive,
      businessId,
    });

    if (!plan) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Membership plan not found', requestId(req)));
      return;
    }

    logger.info(`Membership plan updated: ${plan.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(plan));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error updating membership plan:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// DELETE /plans/:id — delete a membership plan
router.delete('/plans/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await SalesService.deletePlan(ownerId, req.params.id);

    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Membership plan not found', requestId(req)));
      return;
    }

    logger.info(`Membership plan deleted: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Membership plan deleted successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error deleting membership plan:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /plans/:id/enroll — enroll (assign) a customer into a plan by id or email
router.post('/plans/:id/enroll', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { customerUserId, customerEmail } = req.body;

    if (!customerUserId && !customerEmail) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'A customer id or email is required', requestId(req)));
      return;
    }

    let result;
    try {
      result = await SalesService.enrollMember(ownerId, req.params.id, { customerUserId, customerEmail });
    } catch (svcError: unknown) {
      if (svcError instanceof SalesServiceError) {
        res
          .status(statusForServiceError(svcError.code))
          .json(createErrorResponse('VALIDATION_ERROR', svcError.message, requestId(req)));
        return;
      }
      throw svcError;
    }

    if (!result) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Membership plan not found', requestId(req)));
      return;
    }

    logger.info(`Member enrolled: plan ${req.params.id} → ${result.customerUserId} by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse(result));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error enrolling member:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// GET /members — list enrolled members
router.get('/members', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { planId } = req.query;

    const members = await SalesService.listMembers(ownerId, {
      planId: typeof planId === 'string' ? planId : undefined,
    });

    res.json(createSuccessResponse({ members }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing members:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

// POST /members/:id/cancel — cancel a membership
router.post('/members/:id/cancel', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const membership = await SalesService.cancelMembership(ownerId, req.params.id);

    if (!membership) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Membership not found', requestId(req)));
      return;
    }

    logger.info(`Membership cancelled: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(membership));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error cancelling membership:', error);
    res.status(500).json(createErrorResponse('SALES_ERROR', err.message, requestId(req)));
  }
});

export default router;
