import { Router } from 'express';
import { body } from 'express-validator';
import { SpecialistController } from '@/controllers/specialists';
import { AvailabilityController } from '@/controllers/specialists/availability';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Validation middleware for blocking time slots
const validateBlockTimeSlot = [
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
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason must not exceed 200 characters'),
  body('recurring')
    .optional()
    .isBoolean()
    .withMessage('Recurring must be a boolean'),
];

// Validation middleware for creating availability blocks
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

// Validation middleware for updating availability blocks
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

// Protected routes - require authentication (must come before parameterized routes)
router.get('/my/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/my/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);

// Frontend expects these routes (must come before parameterized routes)
router.get('/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);
router.get('/revenue', authenticateToken, requireSpecialist, SpecialistController.getRevenueBreakdown);

// Specialist services routes (frontend expects these - must come before parameterized routes)
router.get('/services', authenticateToken, requireSpecialist, SpecialistController.getServices);
router.post('/services', authenticateToken, requireSpecialist, SpecialistController.createService);
router.put('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.updateService);
router.delete('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.deleteService);
router.post('/services/:serviceId/restore', authenticateToken, requireSpecialist, SpecialistController.restoreService);
router.patch('/services/:serviceId/status', authenticateToken, requireSpecialist, SpecialistController.toggleServiceStatus);

// Specialist availability/schedule routes (frontend expects these - must come before parameterized routes)
router.get('/availability/blocked', authenticateToken, requireSpecialist, SpecialistController.getBlockedSlots);
router.post('/availability/block', authenticateToken, requireSpecialist, validateBlockTimeSlot, SpecialistController.blockTimeSlot);
router.delete('/availability/block/:blockId', authenticateToken, requireSpecialist, SpecialistController.unblockTimeSlot);

// Availability blocks routes (for schedule management)
router.get('/blocks', authenticateToken, AvailabilityController.getAvailabilityBlocks);
router.post('/blocks', authenticateToken, validateCreateAvailabilityBlock, AvailabilityController.createAvailabilityBlock);
router.put('/blocks/:id', authenticateToken, validateUpdateAvailabilityBlock, AvailabilityController.updateAvailabilityBlock);
router.delete('/blocks/:id', authenticateToken, AvailabilityController.deleteAvailabilityBlock);
router.post('/availability/generate', authenticateToken, AvailabilityController.generateFromWorkingHours);

// Protected routes - require specialist access
router.post('/profile', authenticateToken, SpecialistController.createProfile);
router.put('/profile', authenticateToken, requireSpecialist, SpecialistController.updateProfile);

// Admin routes (must come before parameterized routes)
router.put('/:specialistId/verification', authenticateToken, requireAdmin, SpecialistController.toggleVerification);

// Public routes (parameterized routes must come last)
router.get('/', SpecialistController.searchSpecialists);
router.get('/:specialistId', SpecialistController.getProfile);
router.get('/:specialistId/public', SpecialistController.getPublicProfile);
router.get('/:specialistId/services', SpecialistController.getSpecialistServices);

export default router;
