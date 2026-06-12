// Multi-specialist business API.
//   POST   /businesses                     create
//   GET    /businesses/mine                businesses I belong to
//   GET    /businesses/by-slug/:slug       public business page (no auth)
//   GET    /businesses/:id                 business detail (member-only)
//   PATCH  /businesses/:id                 update (OWNER or MANAGER)
//   DELETE /businesses/:id                 deactivate (OWNER)
//   POST   /businesses/:id/members         invite (OWNER or MANAGER)
//   GET    /businesses/:id/invites         pending email invites (member-only)
//   DELETE /businesses/:id/invites/:inviteId revoke invite (OWNER/MANAGER)
//   PATCH  /businesses/:id/members/:userId set role (OWNER)
//   DELETE /businesses/:id/members/:userId remove (OWNER/MANAGER, or self)
//   GET    /businesses/:id/dashboard       aggregated stats (OWNER/MANAGER)
import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { BusinessService, type BusinessRole } from '@/services/business/business.service';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const router = Router();

function userId(req: Request): string {
  return (req as unknown as AuthenticatedRequest).user!.id;
}

function handleErr(req: Request, res: Response, err: unknown) {
  const code = err instanceof Error ? err.message : 'UNKNOWN';
  const map: Record<string, number> = {
    VALIDATION_ERROR: 400,
    INVALID_ROLE: 400,
    ALREADY_MEMBER: 409,
    CANT_REMOVE_LAST_OWNER: 400,
    USER_NOT_FOUND: 404,
    INVITE_NOT_FOUND: 404,
    NOT_A_MEMBER: 403,
    INSUFFICIENT_ROLE: 403,
  };
  const status = map[code] ?? 500;
  if (status === 500) logger.error('Business route error', { error: code });
  return res.status(status).json(createErrorResponse(code, code, req.id));
}

// Public — no auth ----------------------------------------------------------
router.get('/by-slug/:slug', async (req: Request, res: Response) => {
  const biz = await BusinessService.getBySlug(req.params.slug);
  if (!biz) return res.status(404).json(createErrorResponse('NOT_FOUND', 'Business not found', req.id));
  return res.json(createSuccessResponse({ business: biz }));
});

// Authenticated routes from here down -------------------------------------
router.use(authenticateToken as any);

router.post('/', async (req: Request, res: Response) => {
  try {
    const business = await BusinessService.create(userId(req), req.body ?? {});
    return res.status(201).json(createSuccessResponse({ business }));
  } catch (err) { return handleErr(req, res, err); }
});

router.get('/mine', async (req: Request, res: Response) => {
  const memberships = await BusinessService.listMine(userId(req));
  return res.json(createSuccessResponse({ memberships }));
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const biz = await BusinessService.getById(req.params.id, userId(req));
    if (!biz) return res.status(404).json(createErrorResponse('NOT_FOUND', 'Business not found', req.id));
    return res.json(createSuccessResponse({ business: biz }));
  } catch (err) { return handleErr(req, res, err); }
});

router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const biz = await BusinessService.update(req.params.id, userId(req), req.body ?? {});
    return res.json(createSuccessResponse({ business: biz }));
  } catch (err) { return handleErr(req, res, err); }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await BusinessService.deactivate(req.params.id, userId(req));
    return res.json(createSuccessResponse({ deactivated: true }));
  } catch (err) { return handleErr(req, res, err); }
});

// Members -----------------------------------------------------------------
router.post('/:id/members', async (req: Request, res: Response) => {
  try {
    const result = await BusinessService.invite(req.params.id, userId(req), req.body ?? {});
    // Existing user → joined immediately (member). Unknown email → pending invite.
    if ('pending' in result) {
      return res.status(202).json(createSuccessResponse({ pending: true, email: result.email }));
    }
    return res.status(201).json(createSuccessResponse({ member: result }));
  } catch (err) { return handleErr(req, res, err); }
});

// Pending email invites (people without an account yet) ------------------
router.get('/:id/invites', async (req: Request, res: Response) => {
  try {
    const invites = await BusinessService.listInvites(req.params.id, userId(req));
    return res.json(createSuccessResponse({ invites }));
  } catch (err) { return handleErr(req, res, err); }
});

router.delete('/:id/invites/:inviteId', async (req: Request, res: Response) => {
  try {
    await BusinessService.revokeInvite(req.params.id, userId(req), req.params.inviteId);
    return res.json(createSuccessResponse({ revoked: true }));
  } catch (err) { return handleErr(req, res, err); }
});

router.patch('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    const member = await BusinessService.setRole(
      req.params.id,
      userId(req),
      req.params.userId,
      (req.body?.role as BusinessRole),
    );
    return res.json(createSuccessResponse({ member }));
  } catch (err) { return handleErr(req, res, err); }
});

router.delete('/:id/members/:userId', async (req: Request, res: Response) => {
  try {
    await BusinessService.removeMember(req.params.id, userId(req), req.params.userId);
    return res.json(createSuccessResponse({ removed: true }));
  } catch (err) { return handleErr(req, res, err); }
});

// Dashboard ---------------------------------------------------------------
router.get('/:id/dashboard', async (req: Request, res: Response) => {
  try {
    const fromStr = req.query.from as string | undefined;
    const toStr = req.query.to as string | undefined;
    const range = fromStr && toStr
      ? { from: new Date(fromStr), to: new Date(toStr) }
      : undefined;
    const dashboard = await BusinessService.dashboard(req.params.id, userId(req), range);
    return res.json(createSuccessResponse(dashboard));
  } catch (err) { return handleErr(req, res, err); }
});

export default router;
