import { Router, Request, Response } from 'express';
import { HrService, LeaveType, AttendanceStatus } from '@/services/hr/hr.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

const router = Router();

// All HR routes require an authenticated specialist (employer or staff).
router.use(authenticateToken, requireSpecialist);

const actorIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;
const requestId = (req: Request): string => (req.headers['x-request-id'] as string) || '';

const parseDate = (value: unknown): Date | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value as string);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const fail = (req: Request, res: Response, error: unknown, code = 'HR_ERROR', status = 400) => {
  const err = error instanceof Error ? error : new Error(String(error));
  logger.error(`HR error (${code}):`, error);
  res.status(status).json(createErrorResponse(code, err.message, requestId(req)));
};

// ---- Team + summary --------------------------------------------------------

router.get('/staff', async (req, res) => {
  try {
    res.json(createSuccessResponse({ staff: await HrService.listStaff(actorIdOf(req)) }));
  } catch (e) { fail(req, res, e, 'HR_ERROR', 500); }
});

router.get('/summary', async (req, res) => {
  try {
    res.json(createSuccessResponse(await HrService.summary(actorIdOf(req))));
  } catch (e) { fail(req, res, e, 'HR_ERROR', 500); }
});

// ---- Attendance ------------------------------------------------------------

router.get('/attendance', async (req, res) => {
  try {
    const records = await HrService.listAttendance(actorIdOf(req), {
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      staffUserId: (req.query.staffUserId as string) || undefined,
    });
    res.json(createSuccessResponse({ records }));
  } catch (e) { fail(req, res, e); }
});

router.get('/attendance/today', async (req, res) => {
  try {
    res.json(createSuccessResponse({ record: await HrService.todayFor(actorIdOf(req)) }));
  } catch (e) { fail(req, res, e); }
});

router.post('/attendance/clock-in', async (req, res) => {
  try {
    const actorId = actorIdOf(req);
    const staffUserId = (req.body?.staffUserId as string) || actorId;
    res.json(createSuccessResponse({ record: await HrService.clockIn(actorId, staffUserId) }));
  } catch (e) { fail(req, res, e); }
});

router.post('/attendance/clock-out', async (req, res) => {
  try {
    const actorId = actorIdOf(req);
    const staffUserId = (req.body?.staffUserId as string) || actorId;
    res.json(createSuccessResponse({ record: await HrService.clockOut(actorId, staffUserId) }));
  } catch (e) { fail(req, res, e); }
});

router.post('/attendance/manual', async (req, res) => {
  try {
    const date = parseDate(req.body?.date);
    if (!req.body?.staffUserId || !date) throw new Error('staffUserId and date are required');
    const record = await HrService.setAttendance(actorIdOf(req), {
      staffUserId: req.body.staffUserId,
      date,
      clockIn: parseDate(req.body?.clockIn) ?? null,
      clockOut: parseDate(req.body?.clockOut) ?? null,
      status: (req.body?.status as AttendanceStatus) || 'PRESENT',
      note: req.body?.note ?? null,
    });
    res.json(createSuccessResponse({ record }));
  } catch (e) { fail(req, res, e); }
});

// ---- Leave -----------------------------------------------------------------

router.get('/leaves', async (req, res) => {
  try {
    const leaves = await HrService.listLeaves(actorIdOf(req), {
      status: (req.query.status as any) || undefined,
      staffUserId: (req.query.staffUserId as string) || undefined,
    });
    res.json(createSuccessResponse({ leaves }));
  } catch (e) { fail(req, res, e); }
});

router.post('/leaves', async (req, res) => {
  try {
    const startDate = parseDate(req.body?.startDate);
    const endDate = parseDate(req.body?.endDate);
    if (!startDate || !endDate) throw new Error('startDate and endDate are required');
    const leave = await HrService.requestLeave(actorIdOf(req), {
      staffUserId: req.body?.staffUserId || undefined,
      type: (req.body?.type as LeaveType) || 'VACATION',
      startDate,
      endDate,
      reason: req.body?.reason || undefined,
    });
    res.json(createSuccessResponse({ leave }));
  } catch (e) { fail(req, res, e); }
});

router.post('/leaves/:id/review', async (req, res) => {
  try {
    const decision = req.body?.decision === 'APPROVE' ? 'APPROVE' : req.body?.decision === 'REJECT' ? 'REJECT' : null;
    if (!decision) throw new Error('decision must be APPROVE or REJECT');
    const leave = await HrService.reviewLeave(actorIdOf(req), req.params.id, decision, req.body?.reviewNote);
    res.json(createSuccessResponse({ leave }));
  } catch (e) { fail(req, res, e); }
});

router.post('/leaves/:id/cancel', async (req, res) => {
  try {
    res.json(createSuccessResponse({ leave: await HrService.cancelLeave(actorIdOf(req), req.params.id) }));
  } catch (e) { fail(req, res, e); }
});

// ---- Shifts ----------------------------------------------------------------

router.get('/shifts', async (req, res) => {
  try {
    const shifts = await HrService.listShifts(actorIdOf(req), {
      from: parseDate(req.query.from),
      to: parseDate(req.query.to),
      staffUserId: (req.query.staffUserId as string) || undefined,
    });
    res.json(createSuccessResponse({ shifts }));
  } catch (e) { fail(req, res, e); }
});

router.post('/shifts', async (req, res) => {
  try {
    const startTime = parseDate(req.body?.startTime);
    const endTime = parseDate(req.body?.endTime);
    if (!req.body?.staffUserId || !startTime || !endTime) throw new Error('staffUserId, startTime, endTime are required');
    const shift = await HrService.createShift(actorIdOf(req), {
      staffUserId: req.body.staffUserId, startTime, endTime, note: req.body?.note || undefined,
    });
    res.json(createSuccessResponse({ shift }));
  } catch (e) { fail(req, res, e); }
});

router.put('/shifts/:id', async (req, res) => {
  try {
    const shift = await HrService.updateShift(actorIdOf(req), req.params.id, {
      startTime: parseDate(req.body?.startTime),
      endTime: parseDate(req.body?.endTime),
      note: req.body?.note,
    });
    res.json(createSuccessResponse({ shift }));
  } catch (e) { fail(req, res, e); }
});

router.delete('/shifts/:id', async (req, res) => {
  try {
    await HrService.deleteShift(actorIdOf(req), req.params.id);
    res.json(createSuccessResponse({ ok: true }));
  } catch (e) { fail(req, res, e); }
});

export default router;
