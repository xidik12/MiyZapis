import { Router, Request, Response } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { WaitlistService } from '@/services/waitlist';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes } from '@/types';

const router = Router();

// POST /api/waitlist — Join the waitlist
router.post('/', authenticateToken as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Authentication required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const { serviceId, specialistId, preferredDate, preferredTime, notes } = req.body;

    if (!serviceId || !specialistId || !preferredDate) {
      res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'serviceId, specialistId, and preferredDate are required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const entry = await WaitlistService.joinWaitlist({
      userId: user.id,
      serviceId,
      specialistId,
      preferredDate: new Date(preferredDate),
      preferredTime,
      notes,
    });

    res.status(201).json(
      createSuccessResponse({
        waitlistEntry: entry,
        message: 'Successfully joined the waitlist',
      })
    );
  } catch (error: any) {
    logger.error('Join waitlist error:', error);

    if (error.message === 'USER_NOT_FOUND') {
      res.status(404).json(
        createErrorResponse('USER_NOT_FOUND', 'User not found', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'SERVICE_NOT_FOUND') {
      res.status(404).json(
        createErrorResponse('SERVICE_NOT_FOUND', 'Service not found', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'SERVICE_NOT_ACTIVE') {
      res.status(400).json(
        createErrorResponse('SERVICE_NOT_ACTIVE', 'Service is not active', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'CANNOT_JOIN_OWN_WAITLIST') {
      res.status(400).json(
        createErrorResponse('CANNOT_JOIN_OWN_WAITLIST', 'You cannot join the waitlist for your own service', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'ALREADY_ON_WAITLIST') {
      res.status(409).json(
        createErrorResponse('ALREADY_ON_WAITLIST', 'You are already on the waitlist for this date', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'DATE_MUST_BE_FUTURE') {
      res.status(400).json(
        createErrorResponse('DATE_MUST_BE_FUTURE', 'Preferred date must be in the future', req.headers['x-request-id'] as string)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to join waitlist', req.headers['x-request-id'] as string)
    );
  }
});

// GET /api/waitlist/my — Get current user's waitlist entries
router.get('/my', authenticateToken as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Authentication required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const entries = await WaitlistService.getWaitlistForUser(user.id);

    res.json(
      createSuccessResponse({
        entries,
        total: entries.length,
      })
    );
  } catch (error: any) {
    logger.error('Get user waitlist error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get waitlist entries', req.headers['x-request-id'] as string)
    );
  }
});

// GET /api/waitlist/specialist — Get specialist's waitlist entries
router.get('/specialist', authenticateToken as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Authentication required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const { status, fromDate, toDate, page, limit } = req.query;

    const result = await WaitlistService.getWaitlistForSpecialist(
      user.id,
      {
        status: status as string | undefined,
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      }
    );

    res.json(
      createSuccessResponse(result)
    );
  } catch (error: any) {
    logger.error('Get specialist waitlist error:', error);
    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to get specialist waitlist', req.headers['x-request-id'] as string)
    );
  }
});

// DELETE /api/waitlist/:id — Leave/cancel a waitlist entry
router.delete('/:id', authenticateToken as any, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json(
        createErrorResponse(
          ErrorCodes.AUTHENTICATION_REQUIRED,
          'Authentication required',
          req.headers['x-request-id'] as string
        )
      );
      return;
    }

    const { id } = req.params;

    const entry = await WaitlistService.leaveWaitlist(id, user.id);

    res.json(
      createSuccessResponse({
        waitlistEntry: entry,
        message: 'Successfully left the waitlist',
      })
    );
  } catch (error: any) {
    logger.error('Leave waitlist error:', error);

    if (error.message === 'WAITLIST_ENTRY_NOT_FOUND') {
      res.status(404).json(
        createErrorResponse('WAITLIST_ENTRY_NOT_FOUND', 'Waitlist entry not found', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'UNAUTHORIZED_WAITLIST_ACTION') {
      res.status(403).json(
        createErrorResponse('UNAUTHORIZED', 'You are not authorized to cancel this waitlist entry', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'ALREADY_CANCELLED') {
      res.status(400).json(
        createErrorResponse('ALREADY_CANCELLED', 'This waitlist entry is already cancelled', req.headers['x-request-id'] as string)
      );
      return;
    }
    if (error.message === 'ALREADY_BOOKED') {
      res.status(400).json(
        createErrorResponse('ALREADY_BOOKED', 'This waitlist entry has already been converted to a booking', req.headers['x-request-id'] as string)
      );
      return;
    }

    res.status(500).json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to leave waitlist', req.headers['x-request-id'] as string)
    );
  }
});

export default router;
