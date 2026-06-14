import { Router, Request, Response } from 'express';
import { CrmService, CrmServiceError } from '@/services/crm/crm.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { AuthenticatedRequest } from '@/types';

// CRM routes. All routes are specialist-scoped.
const router = Router();

router.use(authenticateToken, requireSpecialist);

const ownerIdOf = (req: Request): string =>
  (req as unknown as AuthenticatedRequest).user!.id;

const requestId = (req: Request): string =>
  (req.headers['x-request-id'] as string) || '';

function handleError(res: Response, err: unknown, reqId: string): void {
  if (err instanceof CrmServiceError) {
    const status =
      err.code === 'SPECIALIST_NOT_FOUND' || err.code === 'TAG_NOT_FOUND' ||
      err.code === 'SEGMENT_NOT_FOUND' || err.code === 'CAMPAIGN_NOT_FOUND' ||
      err.code === 'TASK_NOT_FOUND' || err.code === 'LEAD_NOT_FOUND' ||
      err.code === 'CLIENT_NOT_FOUND' ? 404 : 400;
    res.status(status).json(createErrorResponse(err.code, err.message, reqId));
    return;
  }
  logger.error('CRM route error', { err });
  res.status(500).json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred', reqId));
}

// ─── Unified Clients ──────────────────────────────────────────────────────────

// GET /clients?tagId=&search=
router.get('/clients', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const { tagId, search } = req.query as { tagId?: string; search?: string };
    const clients = await CrmService.getClients(ownerId, { tagId, search });
    res.json(createSuccessResponse(clients));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// GET /clients/:customerId
router.get('/clients/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const ownerId = ownerIdOf(req);
    const client = await CrmService.getClient(ownerId, req.params.customerId);
    res.json(createSuccessResponse(client));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Tags ─────────────────────────────────────────────────────────────────────

// GET /tags
router.get('/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const tags = await CrmService.listTags(ownerIdOf(req));
    res.json(createSuccessResponse(tags));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /tags
router.post('/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, color } = req.body as { name: string; color: string };
    if (!name) { res.status(400).json(createErrorResponse('MISSING_NAME', 'name is required', requestId(req))); return; }
    const tag = await CrmService.createTag(ownerIdOf(req), name, color ?? 'primary');
    res.status(201).json(createSuccessResponse(tag));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /tags/:id
router.put('/tags/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const tag = await CrmService.updateTag(ownerIdOf(req), req.params.id, req.body);
    res.json(createSuccessResponse(tag));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /tags/:id
router.delete('/tags/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.deleteTag(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /clients/:customerId/tags — assign tag
router.post('/clients/:customerId/tags', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tagId } = req.body as { tagId: string };
    if (!tagId) { res.status(400).json(createErrorResponse('MISSING_TAG_ID', 'tagId is required', requestId(req))); return; }
    const result = await CrmService.assignTag(ownerIdOf(req), req.params.customerId, tagId);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /clients/:customerId/tags/:tagId
router.delete('/clients/:customerId/tags/:tagId', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.unassignTag(ownerIdOf(req), req.params.customerId, req.params.tagId);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Segments ─────────────────────────────────────────────────────────────────

// GET /segments
router.get('/segments', async (req: Request, res: Response): Promise<void> => {
  try {
    const segments = await CrmService.listSegments(ownerIdOf(req));
    res.json(createSuccessResponse(segments));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /segments/preview  — MUST come BEFORE /segments/:id
router.post('/segments/preview', async (req: Request, res: Response): Promise<void> => {
  try {
    const { filter } = req.body as { filter: Record<string, unknown> };
    if (!filter) { res.status(400).json(createErrorResponse('MISSING_FILTER', 'filter is required', requestId(req))); return; }
    const result = await CrmService.previewSegment(ownerIdOf(req), filter);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /segments
router.post('/segments', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, filter } = req.body as { name: string; description?: string; filter: Record<string, unknown> };
    if (!name) { res.status(400).json(createErrorResponse('MISSING_NAME', 'name is required', requestId(req))); return; }
    if (!filter) { res.status(400).json(createErrorResponse('MISSING_FILTER', 'filter is required', requestId(req))); return; }
    const seg = await CrmService.createSegment(ownerIdOf(req), name, description, filter);
    res.status(201).json(createSuccessResponse(seg));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /segments/:id
router.put('/segments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const seg = await CrmService.updateSegment(ownerIdOf(req), req.params.id, req.body);
    res.json(createSuccessResponse(seg));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /segments/:id
router.delete('/segments/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.deleteSegment(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Campaigns ────────────────────────────────────────────────────────────────

// GET /campaigns
router.get('/campaigns', async (req: Request, res: Response): Promise<void> => {
  try {
    const campaigns = await CrmService.listCampaigns(ownerIdOf(req));
    res.json(createSuccessResponse(campaigns));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /campaigns
router.post('/campaigns', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { name: string; channel?: string; subject?: string; body: string; filter?: Record<string, unknown>; segmentId?: string };
    if (!body.name) { res.status(400).json(createErrorResponse('MISSING_NAME', 'name is required', requestId(req))); return; }
    if (!body.body) { res.status(400).json(createErrorResponse('MISSING_BODY', 'body is required', requestId(req))); return; }
    const campaign = await CrmService.createCampaign(ownerIdOf(req), body);
    res.status(201).json(createSuccessResponse(campaign));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /campaigns/:id/send
router.post('/campaigns/:id/send', async (req: Request, res: Response): Promise<void> => {
  try {
    const campaign = await CrmService.sendCampaign(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(campaign));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /campaigns/:id
router.delete('/campaigns/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.deleteCampaign(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Tasks ────────────────────────────────────────────────────────────────────

// GET /tasks?status=&customerId=
router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, customerId } = req.query as { status?: string; customerId?: string };
    const tasks = await CrmService.listTasks(ownerIdOf(req), { status, customerId });
    res.json(createSuccessResponse(tasks));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /tasks
router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { title: string; notes?: string; dueDate?: string; customerId?: string };
    if (!body.title) { res.status(400).json(createErrorResponse('MISSING_TITLE', 'title is required', requestId(req))); return; }
    const task = await CrmService.createTask(ownerIdOf(req), body);
    res.status(201).json(createSuccessResponse(task));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /tasks/:id
router.put('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await CrmService.updateTask(ownerIdOf(req), req.params.id, req.body);
    res.json(createSuccessResponse(task));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /tasks/:id/toggle
router.post('/tasks/:id/toggle', async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await CrmService.toggleTask(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(task));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /tasks/:id
router.delete('/tasks/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.deleteTask(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Consent ──────────────────────────────────────────────────────────────────

// GET /clients/:customerId/consent
router.get('/clients/:customerId/consent', async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await CrmService.getConsent(ownerIdOf(req), req.params.customerId);
    res.json(createSuccessResponse(consent));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /clients/:customerId/consent
router.put('/clients/:customerId/consent', async (req: Request, res: Response): Promise<void> => {
  try {
    const consent = await CrmService.setConsent(ownerIdOf(req), req.params.customerId, req.body);
    res.json(createSuccessResponse(consent));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// ─── Leads ────────────────────────────────────────────────────────────────────

// GET /leads?stage=
router.get('/leads', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stage } = req.query as { stage?: string };
    const leads = await CrmService.listLeads(ownerIdOf(req), { stage });
    res.json(createSuccessResponse(leads));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /leads
router.post('/leads', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await CrmService.createLead(ownerIdOf(req), req.body);
    res.status(201).json(createSuccessResponse(lead));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /leads/:id
router.put('/leads/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await CrmService.updateLead(ownerIdOf(req), req.params.id, req.body);
    res.json(createSuccessResponse(lead));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// PUT /leads/:id/stage
router.put('/leads/:id/stage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { stage } = req.body as { stage: string };
    if (!stage) { res.status(400).json(createErrorResponse('MISSING_STAGE', 'stage is required', requestId(req))); return; }
    const lead = await CrmService.setLeadStage(ownerIdOf(req), req.params.id, stage);
    res.json(createSuccessResponse(lead));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// POST /leads/:id/convert
router.post('/leads/:id/convert', async (req: Request, res: Response): Promise<void> => {
  try {
    const lead = await CrmService.convertLead(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(lead));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

// DELETE /leads/:id
router.delete('/leads/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await CrmService.deleteLead(ownerIdOf(req), req.params.id);
    res.json(createSuccessResponse(result));
  } catch (err) {
    handleError(res, err, requestId(req));
  }
});

export default router;
