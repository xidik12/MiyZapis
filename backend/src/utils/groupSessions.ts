import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

/**
 * Group Session Helper Functions
 * Handles logic for group bookings (yoga classes, art classes, etc.)
 */

/**
 * Generate a unique group session ID for a service and time slot
 * Format: {serviceId}_{timestamp}
 */
export function generateGroupSessionId(serviceId: string, scheduledAt: Date): string {
  const timestamp = scheduledAt.getTime();
  return `${serviceId}_${timestamp}`;
}

/**
 * Check if a group session has available spots
 * Returns the number of available spots (null if unlimited)
 */
export async function getAvailableSpots(
  serviceId: string,
  scheduledAt: Date,
  maxParticipants: number | null
): Promise<{ available: boolean; spotsLeft: number | null; currentCount: number }> {
  const groupSessionId = generateGroupSessionId(serviceId, scheduledAt);

  // Count existing bookings for this group session
  const existingBookings = await prisma.booking.findMany({
    where: {
      groupSessionId,
      status: {
        in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
      }
    },
    select: {
      participantCount: true
    }
  });

  const currentCount = existingBookings.reduce((sum, booking) => sum + booking.participantCount, 0);

  // If no max participants (unlimited), always available
  if (!maxParticipants) {
    return {
      available: true,
      spotsLeft: null,
      currentCount
    };
  }

  const spotsLeft = maxParticipants - currentCount;

  return {
    available: spotsLeft > 0,
    spotsLeft: spotsLeft > 0 ? spotsLeft : 0,
    currentCount
  };
}

/**
 * Check if there are enough spots for a booking with multiple participants
 */
export async function canAccommodateParticipants(
  serviceId: string,
  scheduledAt: Date,
  requestedParticipants: number,
  maxParticipants: number | null
): Promise<boolean> {
  const { available, spotsLeft } = await getAvailableSpots(serviceId, scheduledAt, maxParticipants);

  if (!available) return false;

  // If unlimited spots, always true
  if (spotsLeft === null) return true;

  // Check if we have enough spots for the requested participants
  return spotsLeft >= requestedParticipants;
}

/**
 * Get all bookings for a group session
 */
export async function getGroupSessionBookings(groupSessionId: string) {
  return prisma.booking.findMany({
    where: {
      groupSessionId,
      status: {
        in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED']
      }
    },
    include: {
      customer: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatar: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });
}

/**
 * Log group session booking info
 */
export function logGroupSessionInfo(
  action: string,
  serviceId: string,
  scheduledAt: Date,
  details: Record<string, any>
) {
  logger.info(`Group Session: ${action}`, {
    serviceId,
    scheduledAt: scheduledAt.toISOString(),
    groupSessionId: generateGroupSessionId(serviceId, scheduledAt),
    ...details
  });
}
