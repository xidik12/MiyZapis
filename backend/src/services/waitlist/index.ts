import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification';

interface JoinWaitlistData {
  userId: string;
  serviceId: string;
  specialistId: string;
  preferredDate: Date;
  preferredTime?: string;
  notes?: string;
}

interface WaitlistFilters {
  status?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

export class WaitlistService {
  private static notificationService = new NotificationService(prisma);

  /**
   * Join the waitlist for a specific specialist/service/date
   */
  static async joinWaitlist(data: JoinWaitlistData) {
    try {
      // Validate that the user exists
      const user = await prisma.user.findUnique({
        where: { id: data.userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (!user.isActive) {
        throw new Error('USER_NOT_ACTIVE');
      }

      // Validate that the service exists and is active
      const service = await prisma.service.findUnique({
        where: { id: data.serviceId },
        include: { specialist: true },
      });

      if (!service) {
        throw new Error('SERVICE_NOT_FOUND');
      }

      if (!service.isActive || service.isDeleted) {
        throw new Error('SERVICE_NOT_ACTIVE');
      }

      // Prevent users from joining their own service's waitlist
      if (service.specialist.userId === data.userId) {
        throw new Error('CANNOT_JOIN_OWN_WAITLIST');
      }

      // Check if user already has a WAITING entry for the same specialist/service/date
      const existingEntry = await prisma.waitlist.findFirst({
        where: {
          userId: data.userId,
          serviceId: data.serviceId,
          specialistId: data.specialistId,
          preferredDate: data.preferredDate,
          status: 'WAITING',
        },
      });

      if (existingEntry) {
        throw new Error('ALREADY_ON_WAITLIST');
      }

      // Validate preferred date is in the future
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      const preferredDate = new Date(data.preferredDate);
      preferredDate.setHours(0, 0, 0, 0);

      if (preferredDate < now) {
        throw new Error('DATE_MUST_BE_FUTURE');
      }

      // Create the waitlist entry
      const waitlistEntry = await prisma.waitlist.create({
        data: {
          userId: data.userId,
          serviceId: data.serviceId,
          specialistId: data.specialistId,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime || null,
          notes: data.notes || null,
          status: 'WAITING',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              basePrice: true,
              currency: true,
            },
          },
        },
      });

      logger.info('User joined waitlist', {
        waitlistId: waitlistEntry.id,
        userId: data.userId,
        serviceId: data.serviceId,
        specialistId: data.specialistId,
        preferredDate: data.preferredDate,
      });

      return waitlistEntry;
    } catch (error) {
      logger.error('Error joining waitlist:', error);
      throw error;
    }
  }

  /**
   * Leave/cancel a waitlist entry
   */
  static async leaveWaitlist(waitlistId: string, userId: string) {
    try {
      const entry = await prisma.waitlist.findUnique({
        where: { id: waitlistId },
      });

      if (!entry) {
        throw new Error('WAITLIST_ENTRY_NOT_FOUND');
      }

      if (entry.userId !== userId) {
        throw new Error('UNAUTHORIZED_WAITLIST_ACTION');
      }

      if (entry.status === 'CANCELLED') {
        throw new Error('ALREADY_CANCELLED');
      }

      if (entry.status === 'BOOKED') {
        throw new Error('ALREADY_BOOKED');
      }

      const updatedEntry = await prisma.waitlist.update({
        where: { id: waitlistId },
        data: {
          status: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      logger.info('User left waitlist', {
        waitlistId,
        userId,
      });

      return updatedEntry;
    } catch (error) {
      logger.error('Error leaving waitlist:', error);
      throw error;
    }
  }

  /**
   * Get waitlist entries for a specialist (with optional filters)
   */
  static async getWaitlistForSpecialist(
    specialistId: string,
    filters: WaitlistFilters = {}
  ) {
    try {
      const { status, fromDate, toDate, page = 1, limit = 20 } = filters;
      const skip = (page - 1) * limit;

      const where: any = {
        specialistId,
      };

      if (status) {
        where.status = status;
      }

      if (fromDate || toDate) {
        where.preferredDate = {};
        if (fromDate) where.preferredDate.gte = fromDate;
        if (toDate) where.preferredDate.lte = toDate;
      }

      const [entries, total] = await Promise.all([
        prisma.waitlist.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                phoneNumber: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                duration: true,
                basePrice: true,
                currency: true,
              },
            },
          },
          orderBy: [
            { preferredDate: 'asc' },
            { createdAt: 'asc' },
          ],
          skip,
          take: limit,
        }),
        prisma.waitlist.count({ where }),
      ]);

      return {
        entries,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      logger.error('Error getting specialist waitlist:', error);
      throw error;
    }
  }

  /**
   * Get waitlist entries for a user
   */
  static async getWaitlistForUser(userId: string) {
    try {
      const entries = await prisma.waitlist.findMany({
        where: {
          userId,
          status: {
            in: ['WAITING', 'NOTIFIED'],
          },
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              duration: true,
              basePrice: true,
              currency: true,
              specialistId: true,
            },
          },
        },
        orderBy: { preferredDate: 'asc' },
      });

      // Enrich with specialist info
      const specialistIds = Array.from(new Set(entries.map((e: any) => e.specialistId as string)));
      const specialists = await prisma.specialist.findMany({
        where: { userId: { in: specialistIds } },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      const specialistMap = new Map(specialists.map(s => [s.userId, s]));

      const enrichedEntries = entries.map(entry => ({
        ...entry,
        specialist: specialistMap.get(entry.specialistId) || null,
      }));

      return enrichedEntries;
    } catch (error) {
      logger.error('Error getting user waitlist:', error);
      throw error;
    }
  }

  /**
   * Mark a waitlist entry as notified (when a slot opens up)
   */
  static async notifyWaitlistEntry(waitlistId: string) {
    try {
      const entry = await prisma.waitlist.findUnique({
        where: { id: waitlistId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              language: true,
            },
          },
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!entry) {
        throw new Error('WAITLIST_ENTRY_NOT_FOUND');
      }

      if (entry.status !== 'WAITING') {
        return entry; // Already notified or in another state
      }

      const updatedEntry = await prisma.waitlist.update({
        where: { id: waitlistId },
        data: {
          status: 'NOTIFIED',
          notifiedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Send notification to the user
      try {
        await WaitlistService.notificationService.sendNotification(entry.userId, {
          type: 'WAITLIST_SLOT_AVAILABLE',
          title: 'A slot has opened up!',
          message: `A time slot has become available for ${entry.service.name} on ${new Date(entry.preferredDate).toLocaleDateString()}. Book now before it fills up!`,
          data: {
            waitlistId: entry.id,
            serviceId: entry.serviceId,
            specialistId: entry.specialistId,
            preferredDate: entry.preferredDate,
          },
          priority: 'HIGH',
        });
      } catch (notifError) {
        // Don't block on notification failure
        logger.error('Failed to send waitlist notification', { waitlistId, error: notifError });
      }

      logger.info('Waitlist entry notified', {
        waitlistId,
        userId: entry.userId,
      });

      return updatedEntry;
    } catch (error) {
      logger.error('Error notifying waitlist entry:', error);
      throw error;
    }
  }

  /**
   * Check and notify waitlist entries when a booking is cancelled.
   * Called after a booking cancellation to find users waiting for that date/specialist.
   */
  static async checkAndNotifyWaitlist(specialistId: string, date: Date) {
    try {
      // Normalize date to start of day for comparison
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Find all WAITING entries for this specialist on this date
      const waitingEntries = await prisma.waitlist.findMany({
        where: {
          specialistId,
          preferredDate: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: 'WAITING',
        },
        orderBy: { createdAt: 'asc' }, // FIFO - first come, first served
      });

      if (waitingEntries.length === 0) {
        logger.debug('No waitlist entries found for notification', {
          specialistId,
          date: startOfDay,
        });
        return [];
      }

      // Notify all waiting users for this date
      const notifiedEntries = [];
      for (const entry of waitingEntries) {
        try {
          const notified = await WaitlistService.notifyWaitlistEntry(entry.id);
          notifiedEntries.push(notified);
        } catch (error) {
          logger.error('Failed to notify waitlist entry', { entryId: entry.id, error });
        }
      }

      logger.info('Waitlist notifications sent', {
        specialistId,
        date: startOfDay,
        notifiedCount: notifiedEntries.length,
      });

      return notifiedEntries;
    } catch (error) {
      logger.error('Error checking and notifying waitlist:', error);
      throw error;
    }
  }
}
