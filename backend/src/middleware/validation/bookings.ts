import { body, param, query } from 'express-validator';

// Booking statuses
const BOOKING_STATUSES = [
  'PENDING', 
  'PENDING_PAYMENT', 
  'CONFIRMED', 
  'IN_PROGRESS', 
  'COMPLETED', 
  'CANCELLED', 
  'REFUNDED'
] as const;

// Create booking validation
export const validateCreateBooking = [
  body('serviceId')
    .isUUID()
    .withMessage('Valid service ID is required'),
  
  body('specialistId')
    .isUUID()
    .withMessage('Valid specialist ID is required'),
  
  body('scheduledAt')
    .isISO8601()
    .withMessage('Valid scheduled date/time is required')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('Scheduled time must be in the future');
      }
      return true;
    }),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('customerNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Customer notes must be less than 500 characters'),
  
  body('loyaltyPointsUsed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Loyalty points used must be a non-negative integer'),
];

// Update booking status validation
export const validateUpdateBookingStatus = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('status')
    .optional()
    .isIn(BOOKING_STATUSES)
    .withMessage('Valid booking status is required'),
  
  body('specialistNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Specialist notes must be less than 500 characters'),
  
  body('preparationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Preparation notes must be less than 500 characters'),
  
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Completion notes must be less than 500 characters'),
  
  body('deliverables')
    .optional()
    .isArray()
    .withMessage('Deliverables must be an array'),
];

// Get bookings validation
export const validateGetBookings = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(BOOKING_STATUSES)
    .withMessage('Valid booking status is required'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.query.startDate) {
        const startDate = new Date(req.query.startDate);
        const endDate = new Date(value);
        if (endDate <= startDate) {
          throw new Error('End date must be after start date');
        }
      }
      return true;
    }),
  
  query('specialistId')
    .optional()
    .isUUID()
    .withMessage('Valid specialist ID is required'),
  
  query('customerId')
    .optional()
    .isUUID()
    .withMessage('Valid customer ID is required'),
  
  query('sortBy')
    .optional()
    .isIn(['scheduledAt', 'createdAt', 'totalAmount', 'status'])
    .withMessage('Sort by must be one of: scheduledAt, createdAt, totalAmount, status'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// Booking ID param validation
export const validateBookingId = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
];

// Confirm booking validation
export const validateConfirmBooking = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('specialistNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Specialist notes must be less than 500 characters'),
  
  body('preparationNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Preparation notes must be less than 500 characters'),
];

// Cancel booking validation
export const validateCancelBooking = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Cancellation reason must be between 1 and 500 characters'),
  
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be non-negative'),
];

// Complete booking validation
export const validateCompleteBooking = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('completionNotes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Completion notes must be less than 500 characters'),
  
  body('deliverables')
    .optional()
    .isArray()
    .withMessage('Deliverables must be an array'),
  
  body('actualDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Actual duration must be between 15 and 480 minutes'),
];

// Reschedule booking validation
export const validateRescheduleBooking = [
  param('id')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('newScheduledAt')
    .isISO8601()
    .withMessage('Valid new scheduled date/time is required')
    .custom((value) => {
      const scheduledDate = new Date(value);
      const now = new Date();
      if (scheduledDate <= now) {
        throw new Error('New scheduled time must be in the future');
      }
      return true;
    }),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Reschedule reason must be between 1 and 500 characters'),
];