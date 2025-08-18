import { ApiResponse, ApiError, ResponseMeta, PaginationMeta } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Create success response
export const createSuccessResponse = <T>(
  data: T,
  meta?: ResponseMeta
): ApiResponse<T> => {
  return {
    success: true,
    data,
    meta,
  };
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
    details,
    requestId: requestId || uuidv4(),
    timestamp: new Date().toISOString(),
  };

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
export const formatValidationErrors = (errors: any[]): Array<{
  field?: string;
  message: string;
  code?: string;
}> => {
  return errors.map(error => ({
    field: error.path?.join('.') || error.field,
    message: error.message,
    code: error.code,
  }));
};