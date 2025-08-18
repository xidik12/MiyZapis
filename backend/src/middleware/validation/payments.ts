import { body, param, query } from 'express-validator';

// Payment statuses
const PAYMENT_STATUSES = [
  'PENDING',
  'PROCESSING', 
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
  'REFUNDED'
] as const;

// Payment types
const PAYMENT_TYPES = [
  'DEPOSIT',
  'FULL_PAYMENT',
  'REFUND',
  'LOYALTY_REDEMPTION'
] as const;

// Payment method types
const PAYMENT_METHOD_TYPES = [
  'card',
  'telegram_payment',
  'bank_transfer',
  'paypal',
  'cryptocurrency'
] as const;

// Create payment intent validation
export const validateCreatePaymentIntent = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB'])
    .withMessage('Valid currency is required'),
  
  body('type')
    .isIn(PAYMENT_TYPES)
    .withMessage('Valid payment type is required'),
  
  body('paymentMethodType')
    .optional()
    .isIn(PAYMENT_METHOD_TYPES)
    .withMessage('Valid payment method type is required'),
  
  body('loyaltyPointsUsed')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Loyalty points used must be a non-negative integer'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

// Confirm payment validation
export const validateConfirmPayment = [
  body('paymentIntentId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Payment intent ID is required'),
  
  body('paymentMethodId')
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage('Payment method ID is required for card payments'),
  
  body('returnUrl')
    .optional()
    .isURL()
    .withMessage('Valid return URL is required'),
  
  body('clientSecret')
    .optional()
    .isString()
    .isLength({ min: 1 })
    .withMessage('Client secret is required'),
];

// Process refund validation
export const validateProcessRefund = [
  body('paymentId')
    .isUUID()
    .withMessage('Valid payment ID is required'),
  
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Refund amount must be greater than 0'),
  
  body('reason')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Refund reason must be between 1 and 500 characters'),
  
  body('refundToLoyaltyPoints')
    .optional()
    .isBoolean()
    .withMessage('Refund to loyalty points must be a boolean'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

// Get payment history validation
export const validateGetPaymentHistory = [
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
    .isIn(PAYMENT_STATUSES)
    .withMessage('Valid payment status is required'),
  
  query('type')
    .optional()
    .isIn(PAYMENT_TYPES)
    .withMessage('Valid payment type is required'),
  
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
  
  query('minAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum amount must be non-negative'),
  
  query('maxAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum amount must be non-negative')
    .custom((value, { req }) => {
      if (req.query.minAmount && parseFloat(value) <= parseFloat(req.query.minAmount)) {
        throw new Error('Maximum amount must be greater than minimum amount');
      }
      return true;
    }),
  
  query('bookingId')
    .optional()
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status', 'type'])
    .withMessage('Sort by must be one of: createdAt, amount, status, type'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// Payment ID param validation
export const validatePaymentId = [
  param('id')
    .isUUID()
    .withMessage('Valid payment ID is required'),
];

// Webhook validation (Stripe)
export const validateWebhookPayload = [
  body('id')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Webhook ID is required'),
  
  body('object')
    .equals('event')
    .withMessage('Webhook object must be "event"'),
  
  body('type')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Webhook type is required'),
  
  body('data')
    .isObject()
    .withMessage('Webhook data must be an object'),
  
  body('created')
    .isInt({ min: 1 })
    .withMessage('Webhook created timestamp is required'),
];

// Update payment method validation
export const validateUpdatePaymentMethod = [
  body('paymentMethodId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Payment method ID is required'),
  
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('Is default must be a boolean'),
  
  body('billingDetails')
    .optional()
    .isObject()
    .withMessage('Billing details must be an object'),
];

// Create subscription payment validation
export const validateCreateSubscription = [
  body('priceId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Price ID is required'),
  
  body('paymentMethodId')
    .isString()
    .isLength({ min: 1 })
    .withMessage('Payment method ID is required'),
  
  body('trial_period_days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Trial period must be between 1 and 365 days'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object'),
];

// Split payment validation
export const validateSplitPayment = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('splits')
    .isArray({ min: 1 })
    .withMessage('At least one payment split is required'),
  
  body('splits.*.userId')
    .isUUID()
    .withMessage('Valid user ID is required for each split'),
  
  body('splits.*.amount')
    .isFloat({ min: 0.01 })
    .withMessage('Split amount must be greater than 0'),
  
  body('splits.*.percentage')
    .optional()
    .isFloat({ min: 0.01, max: 100 })
    .withMessage('Split percentage must be between 0.01 and 100'),
];