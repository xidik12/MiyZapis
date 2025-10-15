import { Request } from 'express';
import { User } from '@prisma/client';

// Define user types as constants since we're using strings in SQLite
export type UserType = 'CUSTOMER' | 'SPECIALIST' | 'BUSINESS' | 'ADMIN';

// Extend Express Request interface
export interface AuthenticatedRequest extends Request {
  user?: User;
  userId?: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field?: string;
    message: string;
    code?: string;
  }>;
  requestId?: string;
  timestamp: string;
}

export interface ResponseMeta {
  pagination?: PaginationMeta;
  total?: number;
  count?: number;
  message?: string;
  filters?: any;
  stats?: any;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Auth types
export interface JwtPayload {
  userId: string;
  email: string;
  userType: UserType;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  platform?: 'web' | 'telegram_bot' | 'telegram_mini_app';
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType: UserType;
  telegramId?: string;
}

export interface TelegramAuthRequest {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  authDate: number;
  hash: string;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  location?: string;
  availability?: string;
  specialties?: string[];
  sortBy?: 'rating' | 'price' | 'reviews' | 'distance';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

// Booking types
export interface CreateBookingRequest {
  serviceId: string;
  specialistId: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
  paymentMethodId: string;
}

export interface BookingFilters {
  status?: string;
  startDate?: string;
  endDate?: string;
  specialistId?: string;
  customerId?: string;
}

// Payment types
export interface PaymentIntent {
  clientSecret: string;
  amount: number;
  currency: string;
}

export interface ProcessPaymentRequest {
  bookingId: string;
  paymentMethodId: string;
  amount?: number;
  loyaltyPointsUsed?: number;
}

// Review types
export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment?: string;
  tags?: string[];
}

// Notification types
export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  userId: string;
  bookingId?: string;
}

// WebSocket event types
export interface WebSocketEvent {
  type: string;
  data: any;
  userId?: string;
  room?: string;
}

// Cache key patterns
export const CacheKeys = {
  USER_PROFILE: (userId: string) => `user:${userId}:profile`,
  SPECIALIST_PROFILE: (specialistId: string) => `specialist:${specialistId}:profile`,
  AVAILABILITY: (specialistId: string, date: string) => `availability:${specialistId}:${date}`,
  SEARCH_RESULTS: (hash: string) => `search:${hash}`,
  POPULAR_SERVICES: () => 'services:popular',
  PLATFORM_METRICS: () => 'metrics:platform',
  SERVICE_DETAILS: (serviceId: string) => `service:${serviceId}:details`,
  REVIEWS: (specialistId: string) => `reviews:${specialistId}`,
  LOYALTY_POINTS: (userId: string) => `loyalty:${userId}:points`,
} as const;

// Error codes
export const ErrorCodes = {
  // Authentication
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  REFRESH_TOKEN_INVALID: 'REFRESH_TOKEN_INVALID',
  
  // Authorization
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  ACCESS_DENIED: 'ACCESS_DENIED',
  FORBIDDEN: 'FORBIDDEN',
  
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  
  // Resources
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
  
  // Business Logic
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  BOOKING_CONFLICT: 'BOOKING_CONFLICT',
  CANCELLATION_NOT_ALLOWED: 'CANCELLATION_NOT_ALLOWED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INVALID_OPERATION: 'INVALID_OPERATION',
  
  // External Services
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  EMAIL_SEND_FAILED: 'EMAIL_SEND_FAILED',
  TELEGRAM_API_ERROR: 'TELEGRAM_API_ERROR',
  
  // System
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Loyalty-specific errors
  INSUFFICIENT_POINTS: 'INSUFFICIENT_POINTS',
  INVALID_DISCOUNT: 'INVALID_DISCOUNT',
  EXPIRED_CODE: 'EXPIRED_CODE',
  ALREADY_USED: 'ALREADY_USED',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
} as const;

// Rate limit configurations
export const RateLimitConfigs = {
  DEFAULT: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
  AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 requests per 15 minutes
  BOOKINGS: { windowMs: 60 * 1000, max: 10 }, // 10 requests per minute
  PAYMENTS: { windowMs: 60 * 1000, max: 3 }, // 3 requests per minute
  SEARCH: { windowMs: 60 * 1000, max: 30 }, // 30 requests per minute
} as const;

// Utility functions
export const formatValidationErrors = (errors: any[]): ApiError['details'] => {
  return errors.map(error => ({
    field: error.param || error.path,
    message: error.msg || error.message,
    code: 'VALIDATION_ERROR'
  }));
};

export const calculatePaginationOffset = (page: number, limit: number): number => {
  return (Math.max(1, page) - 1) * limit;
};

export const createPaginationMeta = (
  page: number,
  limit: number,
  totalItems: number
): PaginationMeta => {
  const currentPage = Math.max(1, page);
  const totalPages = Math.ceil(totalItems / limit);
  
  return {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: limit,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};