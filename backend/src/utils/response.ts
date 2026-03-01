import { ApiResponse, ApiError, ResponseMeta, PaginationMeta } from '@/types';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Create success response
export const createSuccessResponse = <T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };
  
  if (meta !== undefined) {
    response.meta = meta;
  }
  
  return response;
};

// Create error response
export const createErrorResponse = (
  code: string,
  message: string,
  requestId?: string,
  details?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>
): ApiResponse => {
  const error: ApiError = {
    code,
    message,
    requestId: requestId || uuidv4(),
    timestamp: new Date().toISOString(),
  };

  if (details !== undefined) {
    error.details = details;
  }

  return {
    success: false,
    error,
  };
};

// Create pagination metadata
export const createPaginationMeta = (
  currentPage: number,
  itemsPerPage: number,
  totalItems: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1,
  };
};

// Calculate pagination offset
export const calculatePaginationOffset = (
  page: number = 1,
  limit: number = 20
): { skip: number; take: number } => {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(100, Math.max(1, limit)); // Max 100 items per page

  return {
    skip: (validPage - 1) * validLimit,
    take: validLimit,
  };
};

// Format validation errors
export const formatValidationErrors = (errors: Array<{ path?: string | string[]; field?: string; message?: string; code?: string }>): Array<{
  field?: string;
  message: string;
  code?: string;
}> => {
  return errors.map(error => ({
    field: Array.isArray(error.path) ? error.path.join('.') : error.path || error.field,
    message: error.message || 'Validation error',
    code: error.code,
  }));
};

// Express response helpers
export const successResponse = (res: Response, data: unknown, message?: string, statusCode: number = 200) => {
  return res.status(statusCode).json(createSuccessResponse(data, message ? { message } : undefined));
};

export const errorResponse = (res: Response, message: string, statusCode: number = 500, code?: string) => {
  return res.status(statusCode).json(createErrorResponse(code || 'ERROR', message));
};