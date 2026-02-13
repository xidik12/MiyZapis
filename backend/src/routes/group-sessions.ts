import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { getAvailableSpots, getGroupSessionBookings, generateGroupSessionId } from '@/utils/groupSessions';

const router = Router();

/**
 * GET /group-sessions/availability/:serviceId
 * Check available spots for a group session at a specific time
 */
router.get('/availability/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { scheduledAt } = req.query;

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'scheduledAt query parameter is required',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Validate service exists and is a group session
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        isGroupSession: true,
        maxParticipants: true,
        minParticipants: true,
        basePrice: true
      }
    });

    if (!service) {
      return res.status(404).json(
        createErrorResponse(
          'SERVICE_NOT_FOUND',
          'Service not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    if (!service.isGroupSession) {
      return res.status(400).json(
        createErrorResponse(
          'NOT_GROUP_SESSION',
          'This service is not configured for group sessions',
          req.headers['x-request-id'] as string
        )
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_DATE',
          'Invalid date format for scheduledAt',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Get available spots
    const availability = await getAvailableSpots(
      serviceId,
      scheduledDate,
      service.maxParticipants
    );

    return res.json(
      createSuccessResponse({
        serviceId,
        serviceName: service.name,
        scheduledAt: scheduledDate.toISOString(),
        maxParticipants: service.maxParticipants,
        minParticipants: service.minParticipants,
        currentBookings: availability.currentCount,
        availableSpots: availability.spotsLeft,
        isAvailable: availability.available,
        pricePerParticipant: service.basePrice
      })
    );
  } catch (error: any) {
    logger.error('Error checking group session availability:', error);
    return res.status(500).json(
      createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'Failed to check availability',
        req.headers['x-request-id'] as string
      )
    );
  }
});

/**
 * GET /group-sessions/participants/:serviceId
 * Get list of participants for a group session
 */
router.get('/participants/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;
    const { scheduledAt } = req.query;

    if (!scheduledAt || typeof scheduledAt !== 'string') {
      return res.status(400).json(
        createErrorResponse(
          'VALIDATION_ERROR',
          'scheduledAt query parameter is required',
          req.headers['x-request-id'] as string
        )
      );
    }

    const scheduledDate = new Date(scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_DATE',
          'Invalid date format for scheduledAt',
          req.headers['x-request-id'] as string
        )
      );
    }

    const groupSessionId = generateGroupSessionId(serviceId, scheduledDate);
    const bookings = await getGroupSessionBookings(groupSessionId);

    // Calculate total participants
    const totalParticipants = bookings.reduce((sum, booking) => sum + booking.participantCount, 0);

    return res.json(
      createSuccessResponse({
        groupSessionId,
        serviceId,
        scheduledAt: scheduledDate.toISOString(),
        totalBookings: bookings.length,
        totalParticipants,
        bookings: bookings.map(booking => ({
          id: booking.id,
          status: booking.status,
          participantCount: booking.participantCount,
          customer: {
            id: booking.customer.id,
            firstName: booking.customer.firstName,
            lastName: booking.customer.lastName,
            avatar: booking.customer.avatar
          },
          bookedAt: booking.createdAt
        }))
      })
    );
  } catch (error: any) {
    logger.error('Error getting group session participants:', error);
    return res.status(500).json(
      createErrorResponse(
        'INTERNAL_SERVER_ERROR',
        'Failed to get participants',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;
