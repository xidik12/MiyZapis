// ============================================================
// @miyzapis/shared — Canonical Type Definitions
// Re-exports all shared types from domain modules
// ============================================================

// User & Auth
export type {
  BaseEntity,
  UserType,
  UserRole,
  User,
  UserProfile,
  Address,
  UserPreferences,
  NotificationPreferences,
  AuthTokens,
  AuthState,
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
} from './user';

// Service
export type {
  Service,
  ServiceCategory,
} from './service';

// Specialist
export type {
  Specialist,
  SpecialistAvailability,
  WorkingHoursMap,
  WorkingHours,
  DaySchedule,
  Break,
  BlockedSlot,
  SpecialistPricing,
  SpecialistRevenue,
  SpecialistLocation,
  BankDetails,
} from './specialist';

// Booking & Payment
export type {
  BookingStatus,
  PaymentStatus,
  PaymentMethod,
  Booking,
  RescheduleRecord,
  CreateBookingRequest,
  PaymentType,
  Payment,
  PaymentIntent,
  PaymentMethodRecord,
} from './booking';

// Review
export type {
  Review,
  SpecialistResponse,
  CreateReviewRequest,
  ReviewStats,
} from './review';

// Notification
export type {
  NotificationType,
  NotificationChannel,
  Notification,
} from './notification';

// API
export type {
  ApiResponse,
  ApiError,
  PaginationMeta,
  Pagination,
  PaginatedResponse,
  SearchFilters,
  SearchResult,
  AvailableFilters,
  PriceRange,
} from './api';

// Loyalty
export type {
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyRedemption,
} from './loyalty';

// Analytics
export type {
  SpecialistAnalytics,
  PlatformAnalytics,
} from './analytics';

// Calendar & Availability
export type {
  AvailabilitySlot,
  DayAvailability,
  AvailabilityRequest,
} from './availability';

// WebSocket
export type {
  SocketEvent,
  BookingSocketEvent,
  NotificationSocketEvent,
  PaymentSocketEvent,
  WebSocketMessage,
  BookingUpdate,
  NotificationData,
  WebSocketEventType,
} from './websocket';
