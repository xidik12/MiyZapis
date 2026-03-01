// ============================================================
// Frontend Types — Re-exports shared types + frontend-specific types
// All shared types now live in @shared/types
// ============================================================

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
  WorkingHoursMap as WorkingHours,
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
  Notification,
  ApiResponse,
  ApiError,
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
} from '@shared/types';

// ============================================================
// Frontend-specific types (not shared with mini-app)
// ============================================================

export interface ProcessPaymentRequest {
  bookingId: string;
  paymentMethodId: string;
  amount?: number;
  loyaltyPointsUsed?: number;
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'date' | 'time';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormErrors {
  [key: string]: string | undefined;
}

// Component Props Types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

export interface PaginatedData<T> {
  items: T[];
  pagination: import('@shared/types').Pagination;
  loading: boolean;
  error?: string | null;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  private?: boolean;
  roles?: import('@shared/types').UserType[];
  title?: string;
}

// Environment Types
export interface Environment {
  API_URL: string;
  WS_URL: string;
  STRIPE_PUBLISHABLE_KEY: string;
  GOOGLE_MAPS_API_KEY?: string;
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_MINI_APP_URL?: string;
  ENABLE_PWA: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_TELEGRAM_INTEGRATION: boolean;
  DEBUG: boolean;
  MOCK_API?: boolean;
  PAYMENTS_ENABLED: boolean;
}
