// ============================================================
// Mini-App Types — Re-exports shared types + Telegram-specific types
// All shared types now live in @shared/types
// ============================================================

// Re-export Telegram-specific types
export * from './telegram';

// Re-export everything from the shared package
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
  Service,
  ServiceCategory,
  Specialist,
  SpecialistAvailability,
  WorkingHours,
  DaySchedule,
  Break,
  BlockedSlot,
  SpecialistPricing,
  SpecialistRevenue,
  SpecialistLocation,
  BankDetails,
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
  Review,
  SpecialistResponse,
  CreateReviewRequest,
  ReviewStats,
  NotificationType,
  NotificationChannel,
  Notification,
  ApiResponse,
  ApiError,
  PaginationMeta,
  Pagination,
  PaginatedResponse,
  SearchFilters,
  SearchResult,
  AvailableFilters,
  PriceRange,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyRedemption,
  SpecialistAnalytics,
  PlatformAnalytics,
  AvailabilitySlot,
  DayAvailability,
  AvailabilityRequest,
  SocketEvent,
  BookingSocketEvent,
  NotificationSocketEvent,
  PaymentSocketEvent,
  WebSocketMessage,
  BookingUpdate,
  NotificationData,
  WebSocketEventType,
} from '@shared/types';

// ============================================================
// Mini-app-specific types (Telegram-related)
// ============================================================

export interface TelegramMiniAppConfig {
  botToken: string;
  apiUrl: string;
  paymentProviderToken: string;
  supportChatId: string;
}

export interface TelegramPaymentData {
  currency: string;
  amount: number;
  description: string;
  payload: string;
  providerToken: string;
  photoUrl?: string;
  photoSize?: number;
  photoWidth?: number;
  photoHeight?: number;
  needName?: boolean;
  needPhoneNumber?: boolean;
  needEmail?: boolean;
  needShippingAddress?: boolean;
  sendPhoneNumberToProvider?: boolean;
  sendEmailToProvider?: boolean;
  isFlexible?: boolean;
}
