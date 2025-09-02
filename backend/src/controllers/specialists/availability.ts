import { Request, Response } from 'express';
import {
  AvailabilityService,
  CreateAvailabilityBlockData,
  UpdateAvailabilityBlockData,
  AvailabilityFilters,
} from '@/services/specialist/availability';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { validationResult } from 'express-validator';
import { prisma } from '@/config/database';

export class AvailabilityController {
  /**
   * Generate availability blocks from working hours
   * POST /specialists/availability/generate
   */
  static async generateFromWorkingHours(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const specialistId = req.user?.specialistProfile?.id;
      
      if (!specialistId) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist profile not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      logger.info('Generating availability blocks from working hours', { specialistId });

      const result = await AvailabilityService.generateAvailabilityFromWorkingHours(specialistId);

      res.status(200).json(
        createSuccessResponse(
          result,
          'Availability blocks generated successfully',
          req.headers['x-request-id'] as string
        )
      );
    } catch (error) {
      logger.error('Error generating availability blocks:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to generate availability blocks',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Fix all specialists with empty working hours
   * POST /specialists/availability/fix-all
   */
  static async fixAllSpecialists(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      logger.info('Fixing all specialists with empty working hours');

      const result = await AvailabilityService.fixAndGenerateAvailability();

      res.status(200).json(
        createSuccessResponse(
          result,
          `Fixed ${result.updated} specialists and generated ${result.generated} availability blocks`,
          req.headers['x-request-id'] as string
        )
      );
    } catch (error) {
      logger.error('Error fixing specialists:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_ERROR,
          'Failed to fix specialists',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get specialist availability
   * GET /specialists/:id/availability
   */
  static async getSpecialistAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!startDate || !endDate) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date and end date are required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (start >= end) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const availability = await AvailabilityService.getSpecialistAvailability(id, start, end);

      res.json(
        createSuccessResponse({
          availability,
        })
      );
    } catch (error: any) {
      logger.error('Get specialist availability error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'SPECIALIST_NOT_ACTIVE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.BUSINESS_RULE_VIOLATION,
            'Specialist is not active',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get specialist availability',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Create availability block
   * POST /specialists/availability/blocks
   */
  static async createAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: error.param,
              message: error.msg,
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get specialist profile
      const specialist = await prisma.specialist.findUnique({
        where: { userId: req.user.id },
      });

      if (!specialist) {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'Only specialists can create availability blocks',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        startDateTime,
        endDateTime,
        isAvailable = true,
        reason,
        isRecurring = false,
        recurringUntil,
        recurringDays,
      } = req.body;

      const data: CreateAvailabilityBlockData = {
        specialistId: specialist.id,
        startDateTime: new Date(startDateTime),
        endDateTime: new Date(endDateTime),
        isAvailable,
        reason,
        isRecurring,
        recurringUntil: recurringUntil ? new Date(recurringUntil) : undefined,
        recurringDays,
      };

      const block = await AvailabilityService.createAvailabilityBlock(data);

      res.status(201).json(
        createSuccessResponse({
          block: {
            ...block,
            recurringDays: block.recurringDays ? JSON.parse(block.recurringDays) : null,
          },
        })
      );
    } catch (error: any) {
      logger.error('Create availability block error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date range: start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'OVERLAPPING_AVAILABILITY_BLOCK') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_CONFLICT,
            'Overlapping availability block exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update availability block
   * PUT /specialists/availability/blocks/:id
   */
  static async updateAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid request data',
            req.headers['x-request-id'] as string,
            errors.array().map(error => ({
              field: error.param,
              message: error.msg,
              code: 'INVALID_VALUE',
            }))
          )
        );
        return;
      }

      if (!req.user) {
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

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Availability block ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns this availability block
      const existingBlock = await prisma.availabilityBlock.findUnique({
        where: { id },
        include: {
          specialist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!existingBlock) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingBlock.specialist.userId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this availability block',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const updateData: UpdateAvailabilityBlockData = {};

      if (req.body.startDateTime !== undefined) {
        updateData.startDateTime = new Date(req.body.startDateTime);
      }
      if (req.body.endDateTime !== undefined) {
        updateData.endDateTime = new Date(req.body.endDateTime);
      }
      if (req.body.isAvailable !== undefined) {
        updateData.isAvailable = req.body.isAvailable;
      }
      if (req.body.reason !== undefined) {
        updateData.reason = req.body.reason;
      }
      if (req.body.isRecurring !== undefined) {
        updateData.isRecurring = req.body.isRecurring;
      }
      if (req.body.recurringUntil !== undefined) {
        updateData.recurringUntil = req.body.recurringUntil ? new Date(req.body.recurringUntil) : undefined;
      }
      if (req.body.recurringDays !== undefined) {
        updateData.recurringDays = req.body.recurringDays;
      }

      const block = await AvailabilityService.updateAvailabilityBlock(id, updateData);

      res.json(
        createSuccessResponse({
          block: {
            ...block,
            recurringDays: block.recurringDays ? JSON.parse(block.recurringDays) : null,
          },
        })
      );
    } catch (error: any) {
      logger.error('Update availability block error:', error);

      if (error.message === 'AVAILABILITY_BLOCK_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (error.message === 'INVALID_DATE_RANGE') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date range: start date must be before end date',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete availability block
   * DELETE /specialists/availability/blocks/:id
   */
  static async deleteAvailabilityBlock(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
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

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Availability block ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if user owns this availability block
      const existingBlock = await prisma.availabilityBlock.findUnique({
        where: { id },
        include: {
          specialist: {
            select: {
              userId: true,
            },
          },
        },
      });

      if (!existingBlock) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingBlock.specialist.userId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this availability block',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      await AvailabilityService.deleteAvailabilityBlock(id);

      res.json(
        createSuccessResponse({
          message: 'Availability block deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete availability block error:', error);

      if (error.message === 'AVAILABILITY_BLOCK_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Availability block not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete availability block',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get availability blocks
   * GET /specialists/availability/blocks
   */
  static async getAvailabilityBlocks(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        specialistId,
        startDate,
        endDate,
        isAvailable,
        isRecurring,
        page = 1,
        limit = 20,
      } = req.query;

      const filters: AvailabilityFilters = {};

      // If not admin, only show current user's blocks
      if (req.user.userType !== 'ADMIN') {
        const specialist = await prisma.specialist.findUnique({
          where: { userId: req.user.id },
        });

        if (!specialist) {
          res.status(403).json(
            createErrorResponse(
              ErrorCodes.ACCESS_DENIED,
              'Only specialists can view availability blocks',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }

        filters.specialistId = specialist.id;
      } else if (specialistId) {
        filters.specialistId = specialistId as string;
      }

      if (startDate) filters.startDate = new Date(startDate as string);
      if (endDate) filters.endDate = new Date(endDate as string);
      if (isAvailable !== undefined) filters.isAvailable = isAvailable === 'true';
      if (isRecurring !== undefined) filters.isRecurring = isRecurring === 'true';

      const result = await AvailabilityService.getAvailabilityBlocks(
        filters,
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      res.json(
        createSuccessResponse(result, {
          pagination: {
            currentPage: result.page,
            totalPages: result.totalPages,
            totalItems: result.total,
            itemsPerPage: parseInt(limit as string, 10),
            hasNext: result.hasNext,
            hasPrev: result.hasPrev,
          },
        })
      );
    } catch (error: any) {
      logger.error('Get availability blocks error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get availability blocks',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get available time slots for a specific date
   * GET /specialists/:id/slots?date=YYYY-MM-DD
   */
  static async getAvailableSlots(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { date } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!date || typeof date !== 'string') {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Date is required in YYYY-MM-DD format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Parse date and create start/end of day
      const targetDate = new Date(date as string);
      if (isNaN(targetDate.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date format, use YYYY-MM-DD',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Don't allow bookings for past dates
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (targetDate < today) {
        logger.info('Requested date is in the past', {
          specialistId: id,
          requestedDate: date,
          today: today.toISOString().split('T')[0]
        });
        
        res.json(
          createSuccessResponse({
            availableSlots: [],
            date,
            specialistId: id,
            reason: 'Past date - no slots available'
          })
        );
        return;
      }

      // Get specialist with working hours
      const specialist = await prisma.specialist.findUnique({
        where: { id },
        select: {
          id: true,
          workingHours: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              isActive: true
            }
          }
        }
      });

      if (!specialist) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!specialist.user.isActive) {
        res.json(
          createSuccessResponse({
            availableSlots: [],
            date,
            specialistId: id,
            reason: 'Specialist is not active'
          })
        );
        return;
      }

      // Parse working hours
      let workingHours: any = {};
      if (specialist.workingHours) {
        try {
          workingHours = typeof specialist.workingHours === 'string' 
            ? JSON.parse(specialist.workingHours) 
            : specialist.workingHours;
        } catch (error) {
          logger.warn('Invalid working hours format', { specialistId: id, workingHours: specialist.workingHours });
        }
      }

      // Check if specialist is working on this day
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = dayNames[targetDate.getDay()];
      const daySchedule = workingHours[dayName];

      if (!daySchedule || !daySchedule.isWorking) {
        logger.info('Specialist not working on this day', {
          specialistId: id,
          date,
          dayName,
          schedule: daySchedule
        });

        res.json(
          createSuccessResponse({
            availableSlots: [],
            date,
            specialistId: id,
            reason: `Specialist not working on ${dayName}s`
          })
        );
        return;
      }

      // Generate time slots based on working hours
      const slots = [];
      const startTime = daySchedule.start || '09:00';
      const endTime = daySchedule.end || '17:00';
      const slotDuration = 15; // 15 minutes

      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      const startMinutesFromMidnight = startHour * 60 + startMinute;
      const endMinutesFromMidnight = endHour * 60 + endMinute;

      for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += slotDuration) {
        const hour = Math.floor(minutes / 60);
        const minute = minutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }

      // Get existing bookings for this date
      const startOfDay = new Date(targetDate);
      const endOfDay = new Date(targetDate);
      endOfDay.setDate(endOfDay.getDate() + 1);

      const existingBookings = await prisma.booking.findMany({
        where: {
          specialistId: specialist.id,
          scheduledAt: {
            gte: startOfDay,
            lt: endOfDay
          },
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT']
          }
        },
        select: {
          scheduledAt: true,
          duration: true
        }
      });

      // Filter out booked time slots
      const availableSlots = slots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotDateTime = new Date(targetDate);
        slotDateTime.setHours(slotHour, slotMinute, 0, 0);
        
        // Check if this slot conflicts with any existing booking
        return !existingBookings.some(booking => {
          const bookingStart = new Date(booking.scheduledAt);
          const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60 * 1000));
          
          // Check if slot overlaps with booking
          const slotEnd = new Date(slotDateTime.getTime() + (15 * 60 * 1000)); // 15-minute slots
          return (slotDateTime < bookingEnd && slotEnd > bookingStart);
        });
      });

      // Filter out past time slots for today
      const now = new Date();
      const filteredSlots = availableSlots.filter(slot => {
        const [slotHour, slotMinute] = slot.split(':').map(Number);
        const slotDateTime = new Date(targetDate);
        slotDateTime.setHours(slotHour, slotMinute, 0, 0);
        
        // If it's today, only show future time slots
        if (targetDate.toDateString() === now.toDateString()) {
          return slotDateTime > now;
        }
        return true;
      });

      logger.info('Generated available slots', {
        specialistId: id,
        date,
        dayName,
        workingHours: `${startTime}-${endTime}`,
        totalSlots: slots.length,
        existingBookings: existingBookings.length,
        availableSlots: filteredSlots.length,
      });

      res.json(
        createSuccessResponse({
          availableSlots: filteredSlots,
          date,
          specialistId: id,
          workingHours: {
            start: startTime,
            end: endTime,
            dayName
          },
          bookingsCount: existingBookings.length
        })
      );
    } catch (error: any) {
      logger.error('Get available slots error:', error);

      if (error.message === 'SPECIALIST_NOT_FOUND') {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get available slots',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get available dates for a specialist (for booking flow)
   * GET /specialists/:id/available-dates?from=YYYY-MM-DD&to=YYYY-MM-DD
   */
  static async getAvailableDates(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { from, to } = req.query;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Default date range if not provided (next 30 days)
      const fromDate = from ? new Date(from as string) : new Date();
      const toDate = to ? new Date(to as string) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date format, use YYYY-MM-DD',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Get specialist with working hours
      const specialist = await prisma.specialist.findUnique({
        where: { id },
        select: {
          id: true,
          workingHours: true,
          userId: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              isActive: true
            }
          }
        }
      });

      if (!specialist) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Specialist not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!specialist.user.isActive) {
        res.json(
          createSuccessResponse({
            availableDates: [],
            dateRange: {
              from: fromDate.toISOString().split('T')[0],
              to: toDate.toISOString().split('T')[0]
            },
            reason: 'Specialist is not active'
          })
        );
        return;
      }

      // Parse working hours
      let workingHours: any = {};
      if (specialist.workingHours) {
        try {
          workingHours = typeof specialist.workingHours === 'string' 
            ? JSON.parse(specialist.workingHours) 
            : specialist.workingHours;
        } catch (error) {
          logger.warn('Invalid working hours format', { specialistId: id, workingHours: specialist.workingHours });
        }
      }

      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const availableDates = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check each date in the range
      for (let date = new Date(fromDate); date <= toDate; date.setDate(date.getDate() + 1)) {
        // Skip past dates
        if (date < today) continue;

        const dayName = dayNames[date.getDay()];
        const daySchedule = workingHours[dayName];

        // Check if specialist is working on this day
        if (daySchedule && daySchedule.isWorking) {
          // Check if there are any available time slots on this date
          const startTime = daySchedule.start || '09:00';
          const endTime = daySchedule.end || '17:00';
          
          // Generate time slots for this day
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);
          const startMinutesFromMidnight = startHour * 60 + startMinute;
          const endMinutesFromMidnight = endHour * 60 + endMinute;
          
          const daySlots = [];
          for (let minutes = startMinutesFromMidnight; minutes < endMinutesFromMidnight; minutes += 15) {
            const hour = Math.floor(minutes / 60);
            const minute = minutes % 60;
            const slotDateTime = new Date(date);
            slotDateTime.setHours(hour, minute, 0, 0);
            
            // Skip past time slots for today
            if (date.toDateString() === today.toDateString() && slotDateTime <= new Date()) {
              continue;
            }
            
            daySlots.push(slotDateTime);
          }

          // Check if any slots are available (not booked)
          if (daySlots.length > 0) {
            const startOfDay = new Date(date);
            const endOfDay = new Date(date);
            endOfDay.setDate(endOfDay.getDate() + 1);

            const existingBookings = await prisma.booking.findMany({
              where: {
                specialistId: specialist.id,
                scheduledAt: {
                  gte: startOfDay,
                  lt: endOfDay
                },
                status: {
                  in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'PENDING_PAYMENT']
                }
              },
              select: {
                scheduledAt: true,
                duration: true
              }
            });

            // Check if at least one slot is available
            const hasAvailableSlot = daySlots.some(slotDateTime => {
              return !existingBookings.some(booking => {
                const bookingStart = new Date(booking.scheduledAt);
                const bookingEnd = new Date(bookingStart.getTime() + (booking.duration * 60 * 1000));
                const slotEnd = new Date(slotDateTime.getTime() + (15 * 60 * 1000));
                return (slotDateTime < bookingEnd && slotEnd > bookingStart);
              });
            });

            if (hasAvailableSlot) {
              availableDates.push({
                date: date.toISOString().split('T')[0],
                dayName,
                workingHours: `${startTime}-${endTime}`,
                availableSlots: daySlots.length - existingBookings.length,
                totalSlots: daySlots.length
              });
            }
          }
        }
      }

      logger.info('Generated available dates', {
        specialistId: id,
        dateRange: {
          from: fromDate.toISOString().split('T')[0],
          to: toDate.toISOString().split('T')[0]
        },
        totalDates: availableDates.length
      });

      res.json(
        createSuccessResponse({
          availableDates,
          dateRange: {
            from: fromDate.toISOString().split('T')[0],
            to: toDate.toISOString().split('T')[0]
          },
          specialist: {
            id: specialist.id,
            name: `${specialist.user.firstName} ${specialist.user.lastName}`
          }
        })
      );
    } catch (error: any) {
      logger.error('Get available dates error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get available dates',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Check time slot availability
   * POST /specialists/:id/availability/check
   */
  static async checkTimeSlotAvailability(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { startDateTime, endDateTime } = req.body;

      if (!id) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Specialist ID is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!startDateTime || !endDateTime) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date time and end date time are required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const start = new Date(startDateTime);
      const end = new Date(endDateTime);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid date time format',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (start >= end) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Start date time must be before end date time',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const isAvailable = await AvailabilityService.isTimeSlotAvailable(id, start, end);

      res.json(
        createSuccessResponse({
          isAvailable,
          timeSlot: {
            startDateTime: start,
            endDateTime: end,
          },
        })
      );
    } catch (error: any) {
      logger.error('Check time slot availability error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to check time slot availability',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}