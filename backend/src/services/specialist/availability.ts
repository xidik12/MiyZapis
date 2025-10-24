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

        logger.info('📅 Working hours parsed for availability generation:', {
          specialistId,
          workingHours,
          raw: specialist.workingHours
        });
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

      logger.info('📅 Date range for availability generation:', {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        weeksAhead
      });

      // Delete existing auto-generated blocks to regenerate them with correct 15-minute slots
      // Only delete blocks with reason 'Available' or 'Working hours' (auto-generated)
      // Keep manually created blocks (with custom reasons)
      const deletedBlocks = await prisma.availabilityBlock.deleteMany({
        where: {
          specialistId,
          startDateTime: {
            gte: startDate,
            lte: endDate
          },
          OR: [
            { reason: 'Available' },
            { reason: 'Working hours' },
            { reason: null }
          ]
        }
      });

      logger.info('📅 Deleted old auto-generated blocks:', {
        count: deletedBlocks.count
      });

      // Get remaining existing blocks (manually created ones)
      const existingBlocks = await prisma.availabilityBlock.findMany({
        where: {
          specialistId,
          startDateTime: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          startDateTime: true,
          endDateTime: true
        }
      });

      const newBlocks = [];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const slotDuration = 15; // 15-minute slots

      logger.info('📅 Starting block generation with slotDuration:', { slotDuration, existingBlocksCount: existingBlocks.length });

      // Generate blocks for each day in the date range
      let daysProcessed = 0;
      let slotsGenerated = 0;
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dayName = dayNames[date.getDay()];
        const daySchedule = workingHours[dayName];

        logger.info(`📅 Processing day: ${dayName} (${date.toISOString().split('T')[0]})`, {
          daySchedule,
          isWorking: daySchedule?.isWorking,
          isOpen: daySchedule?.isOpen,
          willProcess: !!(daySchedule && (daySchedule.isWorking || daySchedule.isOpen))
        });

        if (daySchedule && (daySchedule.isWorking || daySchedule.isOpen)) {
          // Parse time strings (e.g., "09:00")
          // Prioritize startTime/endTime (new format) over start/end (legacy format)
          const startTime = daySchedule.startTime || daySchedule.start || '09:00';
          const endTime = daySchedule.endTime || daySchedule.end || '17:00';

          logger.info(`📅 Day schedule times:`, {
            dayName,
            startTime,
            endTime,
            daySchedule
          });

          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);

          const startMinutesFromMidnight = startHour * 60 + startMinute;
          const endMinutesFromMidnight = endHour * 60 + endMinute;

          logger.info(`📅 Calculated minutes:`, {
            dayName,
            startMinutesFromMidnight,
            endMinutesFromMidnight,
            totalMinutes: endMinutesFromMidnight - startMinutesFromMidnight,
            expectedSlots: Math.floor((endMinutesFromMidnight - startMinutesFromMidnight) / slotDuration)
          });

          const now = new Date();
          daysProcessed++;

          // Generate 15-minute time slots for this working day
          let daySlots = 0;
          for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += slotDuration) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;

            // Calculate end time properly
            const endTotalMinutes = minutes + slotDuration;
            const endHour = Math.floor(endTotalMinutes / 60);
            const endMinute = endTotalMinutes % 60;

            // Working hours are entered in local timezone (e.g., Cambodia UTC+7)
            // We need to store them as local times, not convert to UTC
            // Use the date object's local timezone methods to create proper datetime
            const slotStartDateTime = new Date(date);
            slotStartDateTime.setHours(hour, minute, 0, 0);

            const slotEndDateTime = new Date(date);
            slotEndDateTime.setHours(endHour, endMinute, 0, 0);

            // Don't skip past slots - allow viewing full week including past days
            // The frontend will handle displaying past slots differently

            // Check if this exact time slot already exists
            const hasExistingBlock = existingBlocks.some(block => {
              const blockStart = new Date(block.startDateTime);
              const blockEnd = new Date(block.endDateTime);
              return blockStart.getTime() === slotStartDateTime.getTime() &&
                     blockEnd.getTime() === slotEndDateTime.getTime();
            });

            // Only create block if no existing block for this exact time slot
            if (!hasExistingBlock) {
              newBlocks.push({
                specialistId,
                startDateTime: slotStartDateTime,
                endDateTime: slotEndDateTime,
                isAvailable: true,
                reason: 'Available',
                isRecurring: false
              });
              daySlots++;
              slotsGenerated++;
            }
          }

          logger.info(`📅 Day ${dayName} completed:`, {
            daySlots,
            totalSlots: slotsGenerated
          });
        }
      }

      logger.info('📅 Block generation summary:', {
        daysProcessed,
        slotsGenerated,
        newBlocksCount: newBlocks.length,
        existingBlocksCount: existingBlocks.length
      });

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
