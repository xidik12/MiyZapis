import { AvailabilityBlock } from '@prisma/client';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

export interface CreateAvailabilityBlockData {
  specialistId: string;
  startDateTime: Date;
  endDateTime: Date;
  isAvailable: boolean;
  reason?: string;
  isRecurring?: boolean;
  recurringUntil?: Date;
  recurringDays?: string[];
}

export interface UpdateAvailabilityBlockData {
  startDateTime?: Date;
  endDateTime?: Date;
  isAvailable?: boolean;
  reason?: string;
  isRecurring?: boolean;
  recurringUntil?: Date;
  recurringDays?: string[];
}

export interface AvailabilityFilters {
  specialistId?: string;
  startDate?: Date;
  endDate?: Date;
  isAvailable?: boolean;
  isRecurring?: boolean;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  reason?: string;
  bookingId?: string;
}

export class AvailabilityService {
  /**
   * Fix specialists with empty working hours and generate availability
   */
  static async fixAndGenerateAvailability() {
    try {
      // Find specialists with empty or null working hours
      const specialists = await prisma.specialist.findMany({
        where: {
          OR: [
            { workingHours: null },
            { workingHours: '' },
            { workingHours: '{}' }
          ]
        },
        select: { id: true, businessName: true }
      });

      logger.info('Found specialists with empty working hours:', { count: specialists.length });

      const defaultWorkingHours = {
        monday: { isWorking: true, start: '09:00', end: '17:00' },
        tuesday: { isWorking: true, start: '09:00', end: '17:00' },
        wednesday: { isWorking: true, start: '09:00', end: '17:00' },
        thursday: { isWorking: true, start: '09:00', end: '17:00' },
        friday: { isWorking: true, start: '09:00', end: '17:00' },
        saturday: { isWorking: false, start: '09:00', end: '17:00' },
        sunday: { isWorking: false, start: '09:00', end: '17:00' }
      };

      let updated = 0;
      let generated = 0;

      for (const specialist of specialists) {
        try {
          // Update working hours
          await prisma.specialist.update({
            where: { id: specialist.id },
            data: { workingHours: JSON.stringify(defaultWorkingHours) }
          });
          updated++;

          // Generate availability blocks
          await this.generateAvailabilityFromWorkingHours(specialist.id);
          generated++;

          logger.info('Fixed specialist availability:', {
            specialistId: specialist.id,
            businessName: specialist.businessName
          });
        } catch (error) {
          logger.error('Failed to fix specialist availability:', {
            specialistId: specialist.id,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }

      return { updated, generated, total: specialists.length };
    } catch (error) {
      logger.error('Error fixing specialist availability:', error);
      throw error;
    }
  }

  /**
   * Generate availability blocks from working hours
   */
  static async generateAvailabilityFromWorkingHours(
    specialistId: string,
    weeksAhead: number = 4
  ) {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId }
      });

      if (!specialist || !specialist.workingHours) {
        throw new Error('SPECIALIST_NOT_FOUND_OR_NO_WORKING_HOURS');
      }

      let workingHours: any;
      try {
        workingHours =
          typeof specialist.workingHours === 'string'
            ? JSON.parse(specialist.workingHours)
            : specialist.workingHours;
      } catch (error) {
        logger.warn('Invalid working hours JSON detected when generating availability', {
          specialistId,
          workingHours: specialist.workingHours,
          error: error instanceof Error ? error.message : String(error),
        });
        workingHours = this.getDefaultWorkingHours();
      }
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + (weeksAhead * 7));

      // Remove old future availability blocks to regenerate
      await prisma.availabilityBlock.deleteMany({
        where: {
          specialistId,
          startDateTime: { gte: new Date() },
          isRecurring: false,
          // Don't delete manually created blocks (those without a specific pattern)
          reason: 'Working hours'
        }
      });

      const newBlocks = [];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

      // Generate blocks for each day in the date range
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = dayNames[date.getDay()];
        const daySchedule = workingHours[dayName];
        const isWorkingDay = Boolean(daySchedule && (daySchedule.isWorking || daySchedule.isOpen));

        if (isWorkingDay) {
          // Create availability block for this working day
          const startDateTime = new Date(date);
          const endDateTime = new Date(date);
          
          // Parse time strings (e.g., "09:00")
          const startRaw =
            daySchedule.start ||
            daySchedule.startTime ||
            daySchedule.open ||
            daySchedule.from ||
            '09:00';
          const endRaw =
            daySchedule.end ||
            daySchedule.endTime ||
            daySchedule.close ||
            daySchedule.to ||
            '17:00';

          const parseTime = (raw: string | number | undefined, fallbackHour: number, fallbackMinute: number) => {
            if (raw === null || raw === undefined) {
              return [fallbackHour, fallbackMinute] as const;
            }

            const parts = String(raw).split(':');
            const hour = Number(parts[0]);
            const minute = parts.length > 1 ? Number(parts[1]) : 0;

            return [
              Number.isFinite(hour) ? hour : fallbackHour,
              Number.isFinite(minute) ? minute : fallbackMinute,
            ] as const;
          };

          const [startHour, startMinute] = parseTime(startRaw, 9, 0);
          const [endHour, endMinute] = parseTime(endRaw, 17, 0);
          
          startDateTime.setHours(startHour, startMinute, 0, 0);
          endDateTime.setHours(endHour, endMinute, 0, 0);

          if (endDateTime <= startDateTime) {
            // Ensure we always have a positive duration
            endDateTime.setHours(startDateTime.getHours() + 1, startDateTime.getMinutes(), 0, 0);
          }

          // Only create blocks for future dates
          if (startDateTime > new Date()) {
            newBlocks.push({
              specialistId,
              startDateTime,
              endDateTime,
              isAvailable: true,
              reason: 'Working hours',
              isRecurring: false
            });
          }
        }
      }

      // Batch create availability blocks
      if (newBlocks.length > 0) {
        await prisma.availabilityBlock.createMany({
          data: newBlocks
        });
        
        logger.info('Generated availability blocks from working hours', {
          specialistId,
          blocksCreated: newBlocks.length,
          weeksAhead
        });
      }

      return {
        blocksCreated: newBlocks.length,
        dateRange: { startDate, endDate }
      };
    } catch (error) {
      logger.error('Error generating availability from working hours:', error);
      throw error;
    }
  }

  /**
   * Get specialist availability for a date range
   */
  static async getSpecialistAvailability(
    specialistId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      // Validate specialist exists
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              isActive: true,
            },
          },
        },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      if (!specialist.user.isActive) {
        throw new Error('SPECIALIST_NOT_ACTIVE');
      }

      // Get availability blocks for the date range
      const availabilityBlocks = await prisma.availabilityBlock.findMany({
        where: {
          specialistId,
          OR: [
            // Direct date range
            {
              startDateTime: { lte: endDate },
              endDateTime: { gte: startDate },
            },
            // Recurring blocks that might apply to this date range
            {
              isRecurring: true,
              recurringUntil: { gte: startDate },
              startDateTime: { lte: endDate },
            },
          ],
        },
        orderBy: { startDateTime: 'asc' },
      });

      // Get existing bookings for the date range
      const bookings = await prisma.booking.findMany({
        where: {
          specialistId: specialist.userId,
          scheduledAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
          status: true,
          service: {
            select: {
              name: true,
            },
          },
        },
      });

      // Parse working hours
      let workingHours: any = {};
      try {
        workingHours = JSON.parse(specialist.workingHours || '{}');
      } catch (error) {
        logger.warn(`Invalid working hours for specialist ${specialistId}`);
        workingHours = this.getDefaultWorkingHours();
      }

      // Generate availability calendar
      const calendar = this.generateAvailabilityCalendar(
        startDate,
        endDate,
        availabilityBlocks,
        bookings,
        workingHours
      );

      return {
        specialist: {
          id: specialist.id,
          businessName: specialist.businessName,
          name: `${specialist.user.firstName} ${specialist.user.lastName}`,
          timezone: specialist.timezone,
          rating: specialist.rating,
          reviewCount: specialist.reviewCount,
        },
        workingHours,
        calendar,
        summary: {
          totalDays: calendar.length,
          availableDays: calendar.filter(day => day.hasAvailableSlots).length,
          totalBookings: bookings.length,
        },
      };
    } catch (error) {
      logger.error('Error getting specialist availability:', error);
      throw error;
    }
  }

  /**
   * Create availability block
   */
  static async createAvailabilityBlock(data: CreateAvailabilityBlockData): Promise<AvailabilityBlock> {
    try {
      // Validate specialist exists
      const specialist = await prisma.specialist.findUnique({
        where: { id: data.specialistId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      // Validate date range
      if (data.startDateTime >= data.endDateTime) {
        throw new Error('INVALID_DATE_RANGE');
      }

      // Check for overlapping blocks
      const overlappingBlocks = await prisma.availabilityBlock.findMany({
        where: {
          specialistId: data.specialistId,
          OR: [
            {
              startDateTime: { lte: data.endDateTime },
              endDateTime: { gte: data.startDateTime },
            },
          ],
        },
      });

      if (overlappingBlocks.length > 0) {
        throw new Error('OVERLAPPING_AVAILABILITY_BLOCK');
      }

      const block = await prisma.availabilityBlock.create({
        data: {
          specialistId: data.specialistId,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          isAvailable: data.isAvailable,
          reason: data.reason,
          isRecurring: data.isRecurring || false,
          recurringUntil: data.recurringUntil,
          recurringDays: data.recurringDays ? JSON.stringify(data.recurringDays) : null,
        },
      });

      logger.info(`Availability block created: ${block.id} for specialist ${data.specialistId}`);
      return block;
    } catch (error) {
      logger.error('Error creating availability block:', error);
      throw error;
    }
  }

  /**
   * Update availability block
   */
  static async updateAvailabilityBlock(
    blockId: string,
    data: UpdateAvailabilityBlockData
  ): Promise<AvailabilityBlock> {
    try {
      const existingBlock = await prisma.availabilityBlock.findUnique({
        where: { id: blockId },
      });

      if (!existingBlock) {
        throw new Error('AVAILABILITY_BLOCK_NOT_FOUND');
      }

      // Validate date range if provided
      const startDateTime = data.startDateTime || existingBlock.startDateTime;
      const endDateTime = data.endDateTime || existingBlock.endDateTime;

      if (startDateTime >= endDateTime) {
        throw new Error('INVALID_DATE_RANGE');
      }

      const updateData: any = {};

      if (data.startDateTime !== undefined) updateData.startDateTime = data.startDateTime;
      if (data.endDateTime !== undefined) updateData.endDateTime = data.endDateTime;
      if (data.isAvailable !== undefined) updateData.isAvailable = data.isAvailable;
      if (data.reason !== undefined) updateData.reason = data.reason;
      if (data.isRecurring !== undefined) updateData.isRecurring = data.isRecurring;
      if (data.recurringUntil !== undefined) updateData.recurringUntil = data.recurringUntil;
      if (data.recurringDays !== undefined) {
        updateData.recurringDays = data.recurringDays ? JSON.stringify(data.recurringDays) : null;
      }

      const block = await prisma.availabilityBlock.update({
        where: { id: blockId },
        data: updateData,
      });

      logger.info(`Availability block updated: ${blockId}`);
      return block;
    } catch (error) {
      logger.error('Error updating availability block:', error);
      throw error;
    }
  }

  /**
   * Delete availability block
   */
  static async deleteAvailabilityBlock(blockId: string): Promise<void> {
    try {
      const block = await prisma.availabilityBlock.findUnique({
        where: { id: blockId },
      });

      if (!block) {
        throw new Error('AVAILABILITY_BLOCK_NOT_FOUND');
      }

      await prisma.availabilityBlock.delete({
        where: { id: blockId },
      });

      logger.info(`Availability block deleted: ${blockId}`);
    } catch (error) {
      logger.error('Error deleting availability block:', error);
      throw error;
    }
  }

  /**
   * Get availability blocks with filters
   */
  static async getAvailabilityBlocks(
    filters: AvailabilityFilters = {},
    page: number = 1,
    limit: number = 20
  ) {
    try {
      const where: any = {};

      if (filters.specialistId) {
        where.specialistId = filters.specialistId;
      }

      if (filters.startDate || filters.endDate) {
        where.OR = [
          {
            startDateTime: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          },
          {
            endDateTime: {
              ...(filters.startDate && { gte: filters.startDate }),
              ...(filters.endDate && { lte: filters.endDate }),
            },
          },
        ];
      }

      if (filters.isAvailable !== undefined) {
        where.isAvailable = filters.isAvailable;
      }

      if (filters.isRecurring !== undefined) {
        where.isRecurring = filters.isRecurring;
      }

      const offset = (page - 1) * limit;

      const [blocks, total] = await Promise.all([
        prisma.availabilityBlock.findMany({
          where,
          include: {
            specialist: {
              select: {
                businessName: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: { startDateTime: 'asc' },
          skip: offset,
          take: limit,
        }),
        prisma.availabilityBlock.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        blocks: blocks.map(block => ({
          ...block,
          recurringDays: block.recurringDays ? JSON.parse(block.recurringDays) : null,
        })),
        page,
        totalPages,
        total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      };
    } catch (error) {
      logger.error('Error getting availability blocks:', error);
      throw error;
    }
  }

  /**
   * Check if time slot is available
   */
  static async isTimeSlotAvailable(
    specialistId: string,
    startDateTime: Date,
    endDateTime: Date
  ): Promise<boolean> {
    try {
      // Get specialist user ID
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        select: { userId: true },
      });

      if (!specialist) {
        return false;
      }

      // Check existing bookings with proper overlap detection
      const conflictingBookings = await prisma.booking.findMany({
        where: {
          specialistId: specialist.userId,
          status: {
            in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
          },
          // Use a broader range to check for overlaps
          scheduledAt: {
            gte: new Date(startDateTime.getTime() - (24 * 60 * 60 * 1000)), // 24 hours before
            lte: new Date(endDateTime.getTime() + (24 * 60 * 60 * 1000)), // 24 hours after
          }
        },
        select: {
          id: true,
          scheduledAt: true,
          duration: true,
        },
      });

      // Check for time overlap with proper logic
      const hasConflict = conflictingBookings.some(booking => {
        const existingStart = new Date(booking.scheduledAt);
        const existingEnd = new Date(existingStart.getTime() + (booking.duration * 60 * 1000));

        // Two time ranges overlap if: start1 < end2 && start2 < end1
        return startDateTime < existingEnd && existingStart < endDateTime;
      });

      if (hasConflict) {
        return false;
      }

      // Check availability blocks
      const conflictingBlocks = await prisma.availabilityBlock.findMany({
        where: {
          specialistId,
          isAvailable: false,
          startDateTime: { lte: endDateTime },
          endDateTime: { gte: startDateTime },
        },
      });

      return conflictingBlocks.length === 0;
    } catch (error) {
      logger.error('Error checking time slot availability:', error);
      return false;
    }
  }

  /**
   * Generate availability calendar for date range
   */
  private static generateAvailabilityCalendar(
    startDate: Date,
    endDate: Date,
    availabilityBlocks: AvailabilityBlock[],
    bookings: any[],
    workingHours: any
  ) {
    const calendar = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.toLocaleLowerCase('en-US', { weekday: 'long' });
      const dayWorkingHours = workingHours[dayOfWeek];

      const dayData = {
        date: new Date(currentDate),
        dayOfWeek,
        isWorkingDay: !!dayWorkingHours,
        workingHours: dayWorkingHours,
        timeSlots: [] as TimeSlot[],
        hasAvailableSlots: false,
        totalBookings: 0,
      };

      if (dayWorkingHours) {
        // Generate time slots for the working day
        const slots = this.generateTimeSlotsForDay(
          currentDate,
          dayWorkingHours,
          availabilityBlocks,
          bookings
        );
        
        dayData.timeSlots = slots;
        dayData.hasAvailableSlots = slots.some(slot => slot.isAvailable);
        dayData.totalBookings = slots.filter(slot => slot.bookingId).length;
      }

      calendar.push(dayData);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return calendar;
  }

  /**
   * Generate time slots for a specific day
   */
  private static generateTimeSlotsForDay(
    date: Date,
    workingHours: any,
    availabilityBlocks: AvailabilityBlock[],
    bookings: any[]
  ): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const slotDuration = 60; // 1 hour slots

    if (!workingHours.start || !workingHours.end) {
      return slots;
    }

    const [startHour, startMinute] = workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = workingHours.end.split(':').map(Number);

    let currentTime = new Date(date);
    currentTime.setHours(startHour, startMinute, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endHour, endMinute, 0, 0);

    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);
      
      // Check if slot conflicts with unavailable blocks
      const isBlocked = availabilityBlocks.some(block =>
        !block.isAvailable &&
        currentTime < block.endDateTime &&
        block.startDateTime < slotEnd
      );

      // Check if slot has a booking with proper overlap detection
      const booking = bookings.find(b => {
        const bookingStart = new Date(b.scheduledAt);
        const bookingEnd = new Date(bookingStart.getTime() + b.duration * 60 * 1000);
        // Two time ranges overlap if: start1 < end2 && start2 < end1
        return currentTime < bookingEnd && bookingStart < slotEnd;
      });

      slots.push({
        startTime: new Date(currentTime),
        endTime: new Date(slotEnd),
        isAvailable: !isBlocked && !booking,
        reason: isBlocked ? 'Unavailable' : booking ? 'Booked' : undefined,
        bookingId: booking?.id,
      });

      currentTime = slotEnd;
    }

    return slots;
  }

  /**
   * Get default working hours
   */
  private static getDefaultWorkingHours() {
    return {
      monday: { start: '09:00', end: '17:00' },
      tuesday: { start: '09:00', end: '17:00' },
      wednesday: { start: '09:00', end: '17:00' },
      thursday: { start: '09:00', end: '17:00' },
      friday: { start: '09:00', end: '17:00' },
      saturday: { start: '10:00', end: '15:00' },
      sunday: null, // Not working
    };
  }
}
