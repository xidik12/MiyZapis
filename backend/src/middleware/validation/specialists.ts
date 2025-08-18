import { body, param, query } from 'express-validator';

// Register as specialist validation
export const validateSpecialistRegister = [
  body('businessName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business name must be between 1 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  
  body('specialties')
    .isArray({ min: 1 })
    .withMessage('At least one specialty is required')
    .custom((value) => {
      if (!Array.isArray(value) || value.some(item => typeof item !== 'string')) {
        throw new Error('Specialties must be an array of strings');
      }
      return true;
    }),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be a number between 0 and 50 years'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Valid timezone is required'),
  
  body('workingHours')
    .optional()
    .isObject()
    .withMessage('Working hours must be an object'),
  
  body('portfolioImages')
    .optional()
    .isArray()
    .withMessage('Portfolio images must be an array')
    .custom((value) => {
      if (Array.isArray(value)) {
        const isValid = value.every(url => typeof url === 'string' && url.match(/^https?:\/\/.+/));
        if (!isValid) {
          throw new Error('All portfolio images must be valid URLs');
        }
      }
      return true;
    }),
  
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
];

// Update specialist profile validation
export const validateSpecialistProfileUpdate = [
  body('businessName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business name must be between 1 and 100 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be less than 1000 characters'),
  
  body('specialties')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one specialty is required')
    .custom((value) => {
      if (value && (!Array.isArray(value) || value.some(item => typeof item !== 'string'))) {
        throw new Error('Specialties must be an array of strings');
      }
      return true;
    }),
  
  body('experience')
    .optional()
    .isInt({ min: 0, max: 50 })
    .withMessage('Experience must be a number between 0 and 50 years'),
  
  body('address')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Address must be less than 200 characters'),
  
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  
  body('state')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('State must be less than 100 characters'),
  
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be less than 100 characters'),
  
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  
  body('timezone')
    .optional()
    .isString()
    .withMessage('Valid timezone is required'),
  
  body('workingHours')
    .optional()
    .isObject()
    .withMessage('Working hours must be an object'),
  
  body('portfolioImages')
    .optional()
    .isArray()
    .withMessage('Portfolio images must be an array')
    .custom((value) => {
      if (value && Array.isArray(value)) {
        const isValid = value.every(url => typeof url === 'string' && url.match(/^https?:\/\/.+/));
        if (!isValid) {
          throw new Error('All portfolio images must be valid URLs');
        }
      }
      return true;
    }),
  
  body('certifications')
    .optional()
    .isArray()
    .withMessage('Certifications must be an array'),
];

// Create service validation
export const validateCreateService = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .isIn(['haircut', 'massage', 'fitness', 'beauty', 'tattoo', 'therapy', 'automotive', 'home', 'photography', 'education'])
    .withMessage('Valid category is required'),
  
  body('basePrice')
    .isFloat({ min: 0.01 })
    .withMessage('Base price must be greater than 0'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB'])
    .withMessage('Valid currency is required'),
  
  body('duration')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('deliverables')
    .optional()
    .isArray()
    .withMessage('Deliverables must be an array'),
  
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('Requires approval must be a boolean'),
  
  body('maxAdvanceBooking')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Max advance booking must be between 1 and 365 days'),
  
  body('minAdvanceBooking')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Min advance booking must be between 1 and 168 hours'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((value) => {
      if (value && Array.isArray(value)) {
        const isValid = value.every(url => typeof url === 'string' && url.match(/^https?:\/\/.+/));
        if (!isValid) {
          throw new Error('All images must be valid URLs');
        }
      }
      return true;
    }),
];

// Update service validation
export const validateUpdateService = [
  param('id')
    .isUUID()
    .withMessage('Valid service ID is required'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Service name must be between 1 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['haircut', 'massage', 'fitness', 'beauty', 'tattoo', 'therapy', 'automotive', 'home', 'photography', 'education'])
    .withMessage('Valid category is required'),
  
  body('basePrice')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Base price must be greater than 0'),
  
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'RUB'])
    .withMessage('Valid currency is required'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('requirements')
    .optional()
    .isArray()
    .withMessage('Requirements must be an array'),
  
  body('deliverables')
    .optional()
    .isArray()
    .withMessage('Deliverables must be an array'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('Is active must be a boolean'),
  
  body('requiresApproval')
    .optional()
    .isBoolean()
    .withMessage('Requires approval must be a boolean'),
  
  body('maxAdvanceBooking')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Max advance booking must be between 1 and 365 days'),
  
  body('minAdvanceBooking')
    .optional()
    .isInt({ min: 1, max: 168 })
    .withMessage('Min advance booking must be between 1 and 168 hours'),
  
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
    .custom((value) => {
      if (value && Array.isArray(value)) {
        const isValid = value.every(url => typeof url === 'string' && url.match(/^https?:\/\/.+/));
        if (!isValid) {
          throw new Error('All images must be valid URLs');
        }
      }
      return true;
    }),
];

// Get specialists validation
export const validateGetSpecialists = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('category')
    .optional()
    .isIn(['haircut', 'massage', 'fitness', 'beauty', 'tattoo', 'therapy', 'automotive', 'home', 'photography', 'education'])
    .withMessage('Valid category is required'),
  
  query('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  
  query('rating')
    .optional()
    .isFloat({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  query('sortBy')
    .optional()
    .isIn(['rating', 'experience', 'reviews', 'price', 'distance'])
    .withMessage('Sort by must be one of: rating, experience, reviews, price, distance'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
];

// Specialist ID param validation
export const validateSpecialistId = [
  param('id')
    .isUUID()
    .withMessage('Valid specialist ID is required'),
];

// Service ID param validation
export const validateServiceId = [
  param('id')
    .isUUID()
    .withMessage('Valid service ID is required'),
];