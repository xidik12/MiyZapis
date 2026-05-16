// Accounting / bookkeeping / tax estimator endpoints.
// All routes require a specialist account.
import { Router, Request, Response } from 'express';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AccountingService } from '@/services/accounting/accounting.service';
import { InvoiceService } from '@/services/accounting/invoice.service';
import { listTaxRegimes } from '@/services/accounting/tax-regimes';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();
// Cast: requireSpecialist's RequestHandler signature differs from this Router's
// generic Request type. Behaviour identical; just appeasing TS's strict overload.
router.use(authenticateToken as any, requireSpecialist as any);

// -------- Period helpers ----------------------------------------------------
function parseRange(req: Request): { from: Date; to: Date } | { error: string } {
  const fromStr = req.query.from as string | undefined;
  const toStr = req.query.to as string | undefined;
  if (!fromStr || !toStr) return { error: 'from and to query params are required (ISO 8601)' };
  const from = new Date(fromStr);
  const to = new Date(toStr);
  if (isNaN(from.getTime()) || isNaN(to.getTime())) return { error: 'Invalid date format' };
  if (from > to) return { error: 'from must be before to' };
  return { from, to };
}

// -------- P&L ---------------------------------------------------------------
router.get('/profit-loss', async (req: Request, res: Response) => {
  try {
    const r = parseRange(req);
    if ('error' in r) return res.status(400).json(createErrorResponse('VALIDATION_ERROR', r.error, req.id));
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const currency = (req.query.currency as string | undefined) || undefined;
    const pl = await AccountingService.getProfitLoss(userId, r, currency);
    return res.json(createSuccessResponse(pl));
  } catch (err) {
    logger.error('P&L endpoint failed', { error: (err as Error).message });
    return res.status(500).json(createErrorResponse('PL_FAILED', 'Failed to compute P&L', req.id));
  }
});

// -------- Tax estimate ------------------------------------------------------
router.get('/tax-estimate', async (req: Request, res: Response) => {
  try {
    const r = parseRange(req);
    if ('error' in r) return res.status(400).json(createErrorResponse('VALIDATION_ERROR', r.error, req.id));
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const regime = (req.query.regime as string | undefined);
    const currency = (req.query.currency as string | undefined) || undefined;
    const result = await AccountingService.estimateTax(userId, r, regime, currency);
    return res.json(createSuccessResponse(result));
  } catch (err) {
    logger.error('Tax estimate failed', { error: (err as Error).message });
    return res.status(500).json(createErrorResponse('TAX_FAILED', 'Failed to estimate tax', req.id));
  }
});

router.get('/tax-regimes', async (_req: Request, res: Response) => {
  return res.json(createSuccessResponse({ regimes: listTaxRegimes() }));
});

// -------- CSV export --------------------------------------------------------
router.get('/export.csv', async (req: Request, res: Response) => {
  try {
    const r = parseRange(req);
    if ('error' in r) return res.status(400).json(createErrorResponse('VALIDATION_ERROR', r.error, req.id));
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const includeStr = (req.query.include as string | undefined) || 'income,expenses';
    const include = {
      income: includeStr.includes('income'),
      expenses: includeStr.includes('expenses'),
    };
    const csv = await AccountingService.exportCsv(userId, r, include);
    const filename = `accounting-${r.from.toISOString().slice(0, 10)}-${r.to.toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csv);
  } catch (err) {
    logger.error('CSV export failed', { error: (err as Error).message });
    return res.status(500).json(createErrorResponse('EXPORT_FAILED', 'Failed to export CSV', req.id));
  }
});

// -------- Invoices ----------------------------------------------------------
router.post('/invoices', async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const invoice = await InvoiceService.create(userId, req.body);
    return res.status(201).json(createSuccessResponse({ invoice }));
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'VALIDATION_ERROR') {
      return res.status(400).json(createErrorResponse(code, 'lineItems is required', req.id));
    }
    logger.error('Invoice create failed', { error: code });
    return res.status(500).json(createErrorResponse('INVOICE_CREATE_FAILED', 'Failed to create invoice', req.id));
  }
});

router.get('/invoices', async (req: Request, res: Response) => {
  const userId = (req as unknown as AuthenticatedRequest).user!.id;
  const status = req.query.status as string | undefined;
  const fromStr = req.query.from as string | undefined;
  const toStr = req.query.to as string | undefined;
  const invoices = await InvoiceService.list(userId, {
    status,
    from: fromStr ? new Date(fromStr) : undefined,
    to: toStr ? new Date(toStr) : undefined,
  });
  return res.json(createSuccessResponse({ invoices }));
});

router.get('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const invoice = await InvoiceService.get(userId, req.params.id);
    return res.json(createSuccessResponse({ invoice }));
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'INVOICE_NOT_FOUND') return res.status(404).json(createErrorResponse(code, 'Invoice not found', req.id));
    if (code === 'NOT_AUTHORIZED') return res.status(403).json(createErrorResponse(code, 'Not authorized', req.id));
    return res.status(500).json(createErrorResponse('INVOICE_GET_FAILED', 'Failed to fetch invoice', req.id));
  }
});

router.patch('/invoices/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const { status, paidAmount } = req.body ?? {};
    const invoice = await InvoiceService.updateStatus(userId, req.params.id, status, paidAmount);
    return res.json(createSuccessResponse({ invoice }));
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'INVOICE_NOT_FOUND') return res.status(404).json(createErrorResponse(code, 'Not found', req.id));
    if (code === 'NOT_AUTHORIZED') return res.status(403).json(createErrorResponse(code, 'Not authorized', req.id));
    if (code === 'INVALID_STATUS') return res.status(400).json(createErrorResponse(code, 'Invalid status', req.id));
    return res.status(500).json(createErrorResponse('INVOICE_UPDATE_FAILED', 'Failed to update invoice', req.id));
  }
});

router.delete('/invoices/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    await InvoiceService.delete(userId, req.params.id);
    return res.json(createSuccessResponse({ deleted: true }));
  } catch (err) {
    const code = (err as Error).message;
    if (code === 'CAN_ONLY_DELETE_DRAFTS') return res.status(400).json(createErrorResponse(code, 'Only draft invoices can be deleted', req.id));
    if (code === 'INVOICE_NOT_FOUND') return res.status(404).json(createErrorResponse(code, 'Not found', req.id));
    if (code === 'NOT_AUTHORIZED') return res.status(403).json(createErrorResponse(code, 'Not authorized', req.id));
    return res.status(500).json(createErrorResponse('INVOICE_DELETE_FAILED', 'Failed to delete invoice', req.id));
  }
});

export default router;
