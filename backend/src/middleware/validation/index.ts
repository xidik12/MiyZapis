import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { errorResponse } from '@/utils/response';

// Generic validation middleware to handle express-validator results
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.type === 'field' ? (error as { path?: string }).path : error.type,
      message: error.msg
    }));
    
    return errorResponse(res, `Validation failed: ${formattedErrors.map(e => e.message).join(', ')}`, 400, 'VALIDATION_ERROR');
  }
  
  next();
};

// Export individual validation schemas
export * from './auth';
export * from './bookings';
export * from './payments';
export * from './reviews';
export * from './specialists';
export * from './users';