import { Router, Request, Response } from 'express';
import {
  PayrollService,
  PAYROLL_STATUSES,
  PayrollStatus,
  RunLineInput,
  CommissionMode,
} from '@/services/payroll/payroll.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All payroll routes require authentication and specialist role.
router.use(authenticateToken, requireSpecialist);

// The logged-in user is the employer (payroll owner).
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

// Parse a date query/body value; returns undefined if absent, null if invalid.
const parseDate = (value: unknown): Date | undefined | null => {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? null : d;
};

// GET /staff — list payable staff with commission %
router.get('/staff', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const staff = await PayrollService.listStaff(ownerId);
    res.json(createSuccessResponse({ staff }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing payroll staff:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// POST /commission — upsert a commission rule for a staff member.
// Body: { staffUserId, mode?: 'FLAT'|'TIERED', percent?, tiers?: [{minRevenue, percent}] }
router.post('/commission', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { staffUserId, mode, percent, tiers } = req.body;

    if (!staffUserId || typeof staffUserId !== 'string') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'staffUserId is required', requestId(req)));
      return;
    }

    const resolvedMode: CommissionMode = mode === 'TIERED' ? 'TIERED' : 'FLAT';

    if (resolvedMode === 'TIERED') {
      if (!Array.isArray(tiers) || tiers.length === 0) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'tiers must be a non-empty array', requestId(req)));
        return;
      }
    } else {
      const pct = parseNumber(percent);
      if (pct === undefined || pct === null || pct < 0 || pct > 100) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'percent must be between 0 and 100', requestId(req)));
        return;
      }
    }

    const rule = await PayrollService.setCommission(ownerId, staffUserId, {
      mode: resolvedMode,
      percent: parseNumber(percent) ?? undefined,
      tiers: Array.isArray(tiers) ? tiers : undefined,
    });
    if (!rule) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Staff member not found', requestId(req)));
      return;
    }

    logger.info(`Commission set for staff ${staffUserId} (${resolvedMode}) by owner ${ownerId}`);
    res.json(createSuccessResponse(rule));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'INVALID_TIERS') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Each tier needs minRevenue >= 0 and percent 0–100', requestId(req)));
      return;
    }
    if (err.message === 'INVALID_PERCENT') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'percent must be between 0 and 100', requestId(req)));
      return;
    }
    logger.error('Error setting commission:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// GET /preview?start&end — computed draft preview (not persisted)
router.get('/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const start = parseDate(req.query.start);
    const end = parseDate(req.query.end);

    if (!start || !end) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Valid start and end dates are required', requestId(req)));
      return;
    }
    if (start > end) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'start must be before end', requestId(req)));
      return;
    }

    const lines = await PayrollService.previewRun(ownerId, start, end);
    res.json(createSuccessResponse({ lines }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error previewing pay run:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// POST /runs — create a pay run (one PayrollRecord per line)
router.post('/runs', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { periodStart, periodEnd, lines, currency, notes } = req.body;

    const start = parseDate(periodStart);
    const end = parseDate(periodEnd);
    if (!start || !end) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Valid periodStart and periodEnd are required', requestId(req)));
      return;
    }
    if (start > end) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'periodStart must be before periodEnd', requestId(req)));
      return;
    }
    if (!Array.isArray(lines) || lines.length === 0) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'At least one line is required', requestId(req)));
      return;
    }

    const parsedLines: RunLineInput[] = [];
    for (const l of lines) {
      if (!l || typeof l.staffUserId !== 'string' || !l.staffUserId) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Each line needs a staffUserId', requestId(req)));
        return;
      }
      const nums = {
        baseSalary: parseNumber(l.baseSalary),
        commissionTotal: parseNumber(l.commissionTotal),
        bonus: parseNumber(l.bonus),
        deductions: parseNumber(l.deductions),
        taxAmount: parseNumber(l.taxAmount),
      };
      if (Object.values(nums).some((v) => v === null)) {
        res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Line amounts must be numbers', requestId(req)));
        return;
      }
      parsedLines.push({
        staffUserId: l.staffUserId,
        baseSalary: nums.baseSalary ?? 0,
        commissionTotal: nums.commissionTotal ?? 0,
        bonus: nums.bonus ?? 0,
        deductions: nums.deductions ?? 0,
        taxAmount: nums.taxAmount ?? 0,
      });
    }

    const records = await PayrollService.createRun(ownerId, {
      periodStart: start,
      periodEnd: end,
      lines: parsedLines,
      currency: typeof currency === 'string' ? currency : 'UAH',
      notes: typeof notes === 'string' ? notes.trim() || null : null,
    });

    logger.info(`Pay run created: ${records.length} records by owner ${ownerId}`);
    res.status(201).json(createSuccessResponse({ records }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'NO_VALID_LINES') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'No valid staff lines to pay', requestId(req)));
      return;
    }
    logger.error('Error creating pay run:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// GET /records/summary — owner-wide totals (must precede /records/:id)
router.get('/records/summary', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const summary = await PayrollService.summary(ownerId);
    res.json(createSuccessResponse(summary));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting payroll summary:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// GET /records — list payroll records with optional filters
router.get('/records', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status, start, end } = req.query;

    const periodStart = parseDate(start);
    const periodEnd = parseDate(end);

    const records = await PayrollService.listRecords(ownerId, {
      status: status && PAYROLL_STATUSES.includes(status as PayrollStatus) ? (status as PayrollStatus) : undefined,
      periodStart: periodStart || undefined,
      periodEnd: periodEnd || undefined,
    });

    res.json(createSuccessResponse({ records }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error listing payroll records:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// GET /records/:id — single record (ownership-scoped)
router.get('/records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const record = await PayrollService.getRecord(ownerId, req.params.id);
    if (!record) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Payroll record not found', requestId(req)));
      return;
    }
    res.json(createSuccessResponse(record));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Error getting payroll record:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// PUT /records/:id — update a DRAFT record
router.put('/records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { baseSalary, commissionTotal, bonus, deductions, taxAmount, notes } = req.body;

    const nums = {
      baseSalary: parseNumber(baseSalary),
      commissionTotal: parseNumber(commissionTotal),
      bonus: parseNumber(bonus),
      deductions: parseNumber(deductions),
      taxAmount: parseNumber(taxAmount),
    };
    if (Object.values(nums).some((v) => v === null)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Amounts must be numbers', requestId(req)));
      return;
    }

    const record = await PayrollService.updateRecord(ownerId, req.params.id, {
      baseSalary: nums.baseSalary,
      commissionTotal: nums.commissionTotal,
      bonus: nums.bonus,
      deductions: nums.deductions,
      taxAmount: nums.taxAmount,
      notes: notes === undefined ? undefined : (typeof notes === 'string' ? notes.trim() || null : null),
    });

    if (!record) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Payroll record not found', requestId(req)));
      return;
    }

    logger.info(`Payroll record updated: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse(record));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'ONLY_DRAFT_EDITABLE') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Only draft records can be edited', requestId(req)));
      return;
    }
    logger.error('Error updating payroll record:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// POST /records/:id/status — transition status
router.post('/records/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { status } = req.body;

    if (!status || !PAYROLL_STATUSES.includes(status)) {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', `Invalid status. Must be one of: ${PAYROLL_STATUSES.join(', ')}`, requestId(req)));
      return;
    }

    const record = await PayrollService.setStatus(ownerId, req.params.id, status as PayrollStatus);
    if (!record) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Payroll record not found', requestId(req)));
      return;
    }

    logger.info(`Payroll record ${req.params.id} -> ${status} by owner ${ownerId}`);
    res.json(createSuccessResponse(record));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'INVALID_TRANSITION') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Invalid status transition', requestId(req)));
      return;
    }
    logger.error('Error setting payroll status:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

// DELETE /records/:id — delete a DRAFT record
router.delete('/records/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const removed = await PayrollService.deleteRecord(ownerId, req.params.id);
    if (!removed) {
      res.status(404).json(createErrorResponse('NOT_FOUND', 'Payroll record not found', requestId(req)));
      return;
    }
    logger.info(`Payroll record deleted: ${req.params.id} by owner ${ownerId}`);
    res.json(createSuccessResponse({ message: 'Payroll record deleted successfully' }));
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (err.message === 'ONLY_DRAFT_DELETABLE') {
      res.status(400).json(createErrorResponse('VALIDATION_ERROR', 'Only draft records can be deleted', requestId(req)));
      return;
    }
    logger.error('Error deleting payroll record:', error);
    res.status(500).json(createErrorResponse('PAYROLL_ERROR', err.message, requestId(req)));
  }
});

export default router;
