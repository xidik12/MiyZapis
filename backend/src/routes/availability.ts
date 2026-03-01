import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { body } from 'express-validator';
import { AvailabilityController } from '@/controllers/specialists/availability';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();

// Validation middleware
const validateCreateAvailabilityBlock = [
  body('startDateTime')
    .notEmpty()
    .withMessage('Start date time is required')
    .isISO8601()
    .withMessage('Start date time must be a valid ISO 8601 date'),
  body('endDateTime')
    .notEmpty()
    .withMessage('End date time is required')
    .isISO8601()
    .withMessage('End date time must be a valid ISO 8601 date'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('Is recurring must be a boolean'),
  body('recurringUntil')
    .optional()
    .isISO8601()
    .withMessage('Recurring until must be a valid ISO 8601 date'),
  body('recurringDays')
    .optional()
    .isArray()
    .withMessage('Recurring days must be an array')
    .custom((value) => {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (Array.isArray(value)) {
        return value.every(day => validDays.includes(day.toLowerCase()));
      }
      return true;
    })
    .withMessage('Recurring days must contain valid day names'),
];

const validateUpdateAvailabilityBlock = [
  body('startDateTime')
    .optional()
    .isISO8601()
    .withMessage('Start date time must be a valid ISO 8601 date'),
  body('endDateTime')
    .optional()
    .isISO8601()
    .withMessage('End date time must be a valid ISO 8601 date'),
  body('isAvailable')
    .optional()
    .isBoolean()
    .withMessage('Is available must be a boolean'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('Is recurring must be a boolean'),
  body('recurringUntil')
    .optional()
    .isISO8601()
    .withMessage('Recurring until must be a valid ISO 8601 date'),
  body('recurringDays')
    .optional()
    .isArray()
    .withMessage('Recurring days must be an array')
    .custom((value) => {
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      if (Array.isArray(value)) {
        return value.every(day => validDays.includes(day.toLowerCase()));
      }
      return true;
    })
    .withMessage('Recurring days must contain valid day names'),
];

const validateCheckTimeSlot = [
  body('startDateTime')
    .notEmpty()
    .withMessage('Start date time is required')
    .isISO8601()
    .withMessage('Start date time must be a valid ISO 8601 date'),
  body('endDateTime')
    .notEmpty()
    .withMessage('End date time is required')
    .isISO8601()
    .withMessage('End date time must be a valid ISO 8601 date'),
];

// Get specialist availability for date range (cached 60s - dynamic data)
router.get('/specialists/:id/availability', cacheMiddleware(60, 'availability'), AvailabilityController.getSpecialistAvailability);

// Get available dates for a specialist (for booking flow, cached 60s)
router.get('/specialists/:id/available-dates', cacheMiddleware(60, 'available-dates'), AvailabilityController.getAvailableDates);

// Get available time slots for a specific date (for booking flow, cached 60s)
router.get('/specialists/:id/slots', cacheMiddleware(60, 'available-slots'), AvailabilityController.getAvailableSlots);

// Check specific time slot availability
router.post('/specialists/:id/availability/check', validateCheckTimeSlot, AvailabilityController.checkTimeSlotAvailability);

// Create availability block (specialist only)
router.post('/specialists/blocks', authenticateToken, validateCreateAvailabilityBlock, AvailabilityController.createAvailabilityBlock);

// Get availability blocks (specialist/admin only)
router.get('/specialists/blocks', authenticateToken, AvailabilityController.getAvailabilityBlocks);

// Update availability block (specialist/admin only)
router.put('/specialists/blocks/:id', authenticateToken, validateUpdateAvailabilityBlock, AvailabilityController.updateAvailabilityBlock);

// Delete availability block (specialist/admin only)
router.delete('/specialists/blocks/:id', authenticateToken, AvailabilityController.deleteAvailabilityBlock);

// Generate availability blocks from working hours (specialist only)
router.post('/specialists/generate', authenticateToken, AvailabilityController.generateFromWorkingHours);

// Fix all specialists with empty working hours (admin/debug endpoint - temporarily no auth)
router.post('/specialists/fix-all', AvailabilityController.fixAllSpecialists);

export default router;