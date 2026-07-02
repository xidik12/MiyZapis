import { Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { createErrorResponse } from '@/utils/response';

/**
 * Allows the business OWNER or a SOLO specialist (no employer above them); blocks
 * subordinate staff (MANAGER/SPECIALIST members of someone else's business). Use on
 * owner-only surfaces like payroll and purchasing so an employee can't fabricate
 * PAID payroll / RECEIVED POs that pollute the employer's P&L.
 */
export async function requireBusinessOwner(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const uid = req.user?.id;
  if (!uid) {
    res.status(401).json(createErrorResponse('AUTHENTICATION_REQUIRED', 'Access token is required', req.headers['x-request-id'] as string));
    return;
  }
  try {
    const memberships = await prisma.businessMember.findMany({
      where: { userId: uid, isActive: true },
      select: { role: true },
    });
    // Solo (no memberships) OR owns at least one business → allowed. Pure staff → blocked.
    const ownerOrSolo = memberships.length === 0 || memberships.some((m) => m.role === 'OWNER');
    if (!ownerOrSolo) {
      res.status(403).json(createErrorResponse('ACCESS_DENIED', 'Only the business owner can access this', req.headers['x-request-id'] as string));
      return;
    }
    next();
  } catch {
    res.status(500).json(createErrorResponse('INTERNAL_SERVER_ERROR', 'Authorization check failed', req.headers['x-request-id'] as string));
  }
}
