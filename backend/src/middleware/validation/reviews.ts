import { body, param, query } from 'express-validator';

// Review tags that are commonly used
const REVIEW_TAGS = [
  'professional',
  'punctual',
  'friendly',
  'skilled',
  'clean',
  'affordable',
  'quick',
  'thorough',
  'communicative',
  'reliable',
  'creative',
  'patient',
  'knowledgeable',
  'accommodating',
  'efficient'
] as const;

// Create review validation
export const validateCreateReview = [
  body('bookingId')
    .isUUID()
    .withMessage('Valid booking ID is required'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        const validTags = value.every(tag => REVIEW_TAGS.includes(tag));
        if (!validTags) {
          throw new Error(`Tags must be valid options: ${REVIEW_TAGS.join(', ')}`);
        }
        if (value.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
      }
      return true;
    }),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('Is public must be a boolean'),
  
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean'),
];

// Update review validation
export const validateUpdateReview = [
  param('id')
    .isUUID()
    .withMessage('Valid review ID is required'),
  
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Comment must be between 1 and 1000 characters'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        const validTags = value.every(tag => REVIEW_TAGS.includes(tag));
        if (!validTags) {
          throw new Error(`Tags must be valid options: ${REVIEW_TAGS.join(', ')}`);
        }
        if (value.length > 10) {
          throw new Error('Maximum 10 tags allowed');
        }
      }
      return true;
    }),
  
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('Is public must be a boolean'),
  
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean'),
];

// Get service reviews validation
export const validateGetServiceReviews = [
  param('id')
    .isUUID()
    .withMessage('Valid service ID is required'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating', 'helpful'])
    .withMessage('Sort by must be one of: createdAt, rating, helpful'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),
  
  query('withComment')
    .optional()
    .isBoolean()
    .withMessage('With comment must be a boolean'),
  
  query('tags')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const tags = value.split(',');
        const validTags = tags.every(tag => REVIEW_TAGS.includes(tag.trim()));
        if (!validTags) {
          throw new Error(`Tags must be valid options: ${REVIEW_TAGS.join(', ')}`);
        }
      }
      return true;
    }),
];

// Get specialist reviews validation
export const validateGetSpecialistReviews = [
  param('id')
    .isUUID()
    .withMessage('Valid specialist ID is required'),
  
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating filter must be between 1 and 5'),
  
  query('sortBy')
    .optional()
    .isIn(['createdAt', 'rating', 'helpful'])
    .withMessage('Sort by must be one of: createdAt, rating, helpful'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),
  
  query('withComment')
    .optional()
    .isBoolean()
    .withMessage('With comment must be a boolean'),
  
  query('serviceId')
    .optional()
    .isUUID()
    .withMessage('Valid service ID is required'),
];

// Review ID param validation
export const validateReviewId = [
  param('id')
    .isUUID()
    .withMessage('Valid review ID is required'),
];

// Mark review as helpful validation
export const validateMarkReviewHelpful = [
  param('id')
    .isUUID()
    .withMessage('Valid review ID is required'),
  
  body('helpful')
    .isBoolean()
    .withMessage('Helpful must be a boolean'),
];

// Report review validation
export const validateReportReview = [
  param('id')
    .isUUID()
    .withMessage('Valid review ID is required'),
  
  body('reason')
    .isIn(['spam', 'inappropriate', 'fake', 'offensive', 'irrelevant', 'other'])
    .withMessage('Valid report reason is required'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Report description must be between 1 and 500 characters'),
];

// Respond to review validation (specialist response)
export const validateRespondToReview = [
  param('id')
    .isUUID()
    .withMessage('Valid review ID is required'),
  
  body('response')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Response must be between 1 and 500 characters'),
];

// Bulk reviews validation (for analytics)
export const validateGetBulkReviews = [
  query('specialistIds')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const ids = value.split(',');
        const validIds = ids.every(id => id.match(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89aAbB][a-f\d]{3}-[a-f\d]{12}$/));
        if (!validIds) {
          throw new Error('All specialist IDs must be valid UUIDs');
        }
        if (ids.length > 100) {
          throw new Error('Maximum 100 specialist IDs allowed');
        }
      }
      return true;
    }),
  
  query('serviceIds')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        const ids = value.split(',');
        const validIds = ids.every(id => id.match(/^[a-f\d]{8}-[a-f\d]{4}-4[a-f\d]{3}-[89aAbB][a-f\d]{3}-[a-f\d]{12}$/));
        if (!validIds) {
          throw new Error('All service IDs must be valid UUIDs');
        }
        if (ids.length > 100) {
          throw new Error('Maximum 100 service IDs allowed');
        }
      }
      return true;
    }),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required'),
  
  query('minRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Minimum rating must be between 1 and 5'),
  
  query('maxRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Maximum rating must be between 1 and 5'),
  
  query('verified')
    .optional()
    .isBoolean()
    .withMessage('Verified must be a boolean'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limit must be between 1 and 1000'),
];