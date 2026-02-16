// Base Types
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// User Types
export type UserType = 'customer' | 'specialist' | 'business' | 'admin';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  avatar?: string;
  userType: UserType;
  loyaltyPoints: number;
  totalBookings: number;
  memberSince: string;
  profileComplete: boolean;
  isVerified: boolean;
  telegramId?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone?: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  telegram: boolean;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
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
  referralCode?: string;
}

export interface TelegramAuthRequest {
  telegramId: string;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
  authDate: number;
  hash: string;
}

// Specialist Types
export interface Specialist extends BaseEntity {
  userId: string;
  user?: User;
  businessName: string;
  description: string;
  specialties: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  totalBookings: number;
  isVerified: boolean;
  responseTime: string;
  availability: SpecialistAvailability;
  pricing: SpecialistPricing;
  revenue?: SpecialistRevenue;
  location?: SpecialistLocation;
  bankAccounts?: BankAccount[];
}

export interface BankAccount {
  type: 'ABA' | 'KHQR';
  accountName: string;
  accountNumber: string;
  qrImageUrl?: string;
}

export interface SpecialistAvailability {
  timezone: string;
  workingHours: WorkingHours;
  blockedSlots?: BlockedSlot[];
}

export interface WorkingHours {
  [key: string]: {
    start: string;
    end: string;
    isWorking: boolean;
  };
}

export interface BlockedSlot {
  id: string;
  specialistId?: string;
  startDateTime: string;
  endDateTime: string;
  isAvailable: boolean;
  reason?: string | null;
  isRecurring?: boolean;
  recurringDays?: string[] | null;
  recurringUntil?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpecialistPricing {
  baseRate: number;
  currency: string;
  depositAmount: number;
  depositPercentage?: number;
}

export interface SpecialistRevenue {
  thisMonth: number;
  lastMonth: number;
  total: number;
  growth?: number;
}

export interface SpecialistLocation {
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  // Detailed contact information for confirmed bookings
  preciseAddress?: string;
  businessPhone?: string;
  whatsappNumber?: string;
  locationNotes?: string;
  parkingInfo?: string;
  accessInstructions?: string;
}

// Service Types
export interface Service extends BaseEntity {
  name: string;
  description: string;
  longDescription?: string;
  duration: number; // in minutes
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  serviceLocation?: string; // Physical location for the service
  locationNotes?: string; // Additional instructions for finding location
  requirements?: string[];
  deliverables?: string[];
  specialistId: string;
  specialist?: Specialist;
  images?: string[];
  tags?: string[];
  // Loyalty Points pricing
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  // Service Discounts
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
  // Group Session fields
  isGroupSession?: boolean;
  maxParticipants?: number;
  minParticipants?: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  serviceCount: number;
}

// Booking Types
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS' | 'NO_SHOW' | 'pending_payment' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking extends BaseEntity {
  serviceId: string;
  service?: Service;
  customerId: string;
  customer?: User;
  specialistId: string;
  specialist?: Specialist;
  status: BookingStatus;
  scheduledAt: string;
  duration: number;
  totalAmount: number;
  depositAmount: number;
  depositPaid: boolean;
  fullPaymentAmount?: number;
  fullPaymentPaid?: boolean;
  notes?: string;
  preparationNotes?: string;
  completionNotes?: string;
  deliverables?: string[];
  meetingLink?: string;
  canCancel: boolean;
  cancellationDeadline?: string;
  cancellationReason?: string;
  rescheduleHistory?: RescheduleRecord[];

  // Group Session fields
  isGroupBooking?: boolean;
  groupSessionId?: string;
  participantCount?: number;
  
  // Review information for completed bookings
  review?: {
    id: string;
    rating: number;
    comment?: string;
    tags?: string;
    isPublic: boolean;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
  };
  
  // Flattened fields for frontend convenience (added by backend transform)
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  date: string; // YYYY-MM-DD format
  time?: string; // HH:MM format
  amount: number; // Same as totalAmount
  type?: 'online' | 'in-person'; // Based on meetingLink presence
}

export interface GroupSessionInfo {
  totalParticipants: number;
  maxParticipants: number | null;
  bookings: Array<{
    id: string;
    customerId: string;
    customerName: string;
    status: string;
    participantCount: number;
  }>;
}

export interface RescheduleRecord {
  oldScheduledAt: string;
  newScheduledAt: string;
  reason: string;
  requestedBy: 'customer' | 'specialist';
  requestedAt: string;
}

export interface CreateBookingRequest {
  serviceId: string;
  specialistId: string;
  scheduledAt: string;
  duration: number;
  notes?: string;
  paymentMethodId?: string;
  loyaltyPointsUsed?: number;
  rewardRedemptionId?: string;
}

// Payment Types
export type PaymentType = 'deposit' | 'full_payment' | 'refund';
export type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export interface Payment extends BaseEntity {
  bookingId: string;
  booking?: Booking;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  stripePaymentIntentId?: string;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  finalAmount?: number;
  refundReason?: string;
}

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
}

export interface ProcessPaymentRequest {
  bookingId: string;
  paymentMethodId: string;
  amount?: number;
  loyaltyPointsUsed?: number;
}

export interface PaymentMethod extends BaseEntity {
  userId: string;
  type: string; // 'CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER'
  cardLast4?: string;
  cardBrand?: string; // 'visa', 'mastercard', 'amex', etc.
  cardExpMonth?: number;
  cardExpYear?: number;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  qrImageUrl?: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  nickname?: string;
  isDefault: boolean;
  isActive: boolean;
}

// Review Types
export interface Review extends BaseEntity {
  bookingId: string;
  booking?: Booking;
  customerId: string;
  customer?: User;
  specialistId: string;
  specialist?: Specialist;
  serviceId: string;
  service?: Service;
  rating: number; // 1-5
  comment: string;
  tags: string[];
  isVerified: boolean;
  response?: SpecialistResponse;
}

export interface SpecialistResponse {
  message: string;
  createdAt: string;
}

export interface CreateReviewRequest {
  bookingId: string;
  rating: number;
  comment: string;
  tags?: string[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    [key: number]: number;
  };
}

// Search & Filter Types
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

export interface SearchResult {
  services: Service[];
  specialists: Specialist[];
  pagination: Pagination;
  filters: AvailableFilters;
}

export interface AvailableFilters {
  categories: ServiceCategory[];
  priceRanges: PriceRange[];
  specialties: string[];
  locations: string[];
}

export interface PriceRange {
  min: number;
  max: number;
  count: number;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  limit: number;
}

// Notification Types
export type NotificationType = 
  | 'booking_confirmed' 
  | 'booking_cancelled' 
  | 'booking_reminder' 
  | 'payment_received' 
  | 'payment_failed'
  | 'review_received'
  | 'new_booking'
  | 'booking_updated'
  | 'system_announcement';

export interface Notification extends BaseEntity {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  actionUrl?: string;
}

// Loyalty Types
export interface LoyaltyAccount {
  userId: string;
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  nextTierPoints: number;
  nextTierBenefits: string[];
}

export interface LoyaltyTransaction extends BaseEntity {
  userId: string;
  type: 'earned' | 'spent';
  amount: number;
  reason: string;
  bookingId?: string;
  redemptionId?: string;
}

export interface LoyaltyRedemption extends BaseEntity {
  userId: string;
  points: number;
  value: number; // monetary value in cents
  rewardType: 'discount' | 'service_credit';
  bookingId?: string;
  isUsed: boolean;
  usedAt?: string;
  expiresAt?: string;
}

// Analytics Types
export interface SpecialistAnalytics {
  overview: {
    totalRevenue: number;
    thisMonthRevenue: number;
    totalBookings: number;
    thisMonthBookings: number;
    averageRating: number;
    responseRate: number;
    growthRate: number;
  };
  revenueChart: Array<{
    period: string;
    revenue: number;
    bookings: number;
  }>;
  topServices: Array<{
    serviceId: string;
    serviceName: string;
    bookings: number;
    revenue: number;
  }>;
  customerSatisfaction: {
    averageRating: number;
    responseRate: number;
    repeatCustomers: number;
    reviewCount: number;
  };
  bookingTrends: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
}

export interface PlatformAnalytics {
  users: {
    total: number;
    customers: number;
    specialists: number;
    growth: {
      thisMonth: number;
      lastMonth: number;
      percentage: number;
    };
  };
  bookings: {
    total: number;
    thisMonth: number;
    completionRate: number;
    averageValue: number;
    growth: number;
  };
  revenue: {
    total: number;
    thisMonth: number;
    commissionEarned: number;
    growth: number;
  };
}

// Calendar & Availability Types
export interface AvailabilitySlot {
  startTime: string;
  endTime: string;
  available: boolean;
  reason?: string;
  bookingId?: string;
}

export interface DayAvailability {
  date: string;
  slots: AvailabilitySlot[];
}

export interface AvailabilityRequest {
  specialistId: string;
  startDate: string;
  endDate: string;
  timezone?: string;
  serviceId?: string;
}

// WebSocket Types
export interface SocketEvent {
  type: string;
  data: any;
  timestamp: string;
}

export interface BookingSocketEvent extends SocketEvent {
  type: 'booking:status_changed' | 'booking:new' | 'booking:updated';
  data: {
    bookingId: string;
    booking?: Booking;
    oldStatus?: BookingStatus;
    newStatus?: BookingStatus;
  };
}

export interface NotificationSocketEvent extends SocketEvent {
  type: 'notification:new';
  data: {
    notification: Notification;
  };
}

export interface PaymentSocketEvent extends SocketEvent {
  type: 'payment:status_changed';
  data: {
    paymentId: string;
    bookingId: string;
    status: PaymentStatus;
    amount: number;
  };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: {
    pagination?: Pagination;
    filters?: AvailableFilters;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  requestId?: string;
  timestamp: string;
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
  pagination: Pagination;
  loading: boolean;
  error?: string | null;
}

// Route Types
export interface RouteConfig {
  path: string;
  component: React.ComponentType;
  exact?: boolean;
  private?: boolean;
  roles?: UserType[];
  title?: string;
}

// Environment Types
export interface Environment {
  API_URL: string;
  WS_URL: string;
  STRIPE_PUBLISHABLE_KEY: string | null;
  GOOGLE_MAPS_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_AUTH_ENABLED: boolean;
  APP_NAME: string;
  APP_VERSION: string;
  APP_URL: string;
  TELEGRAM_BOT_USERNAME?: string;
  TELEGRAM_MINI_APP_URL?: string;
  ENABLE_PWA: boolean;
  ENABLE_ANALYTICS: boolean;
  ENABLE_TELEGRAM_INTEGRATION: boolean;
  DEBUG: boolean;
  MOCK_API: boolean;
}
