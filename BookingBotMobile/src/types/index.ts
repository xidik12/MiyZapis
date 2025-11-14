// Complete types matching web version - adapted for React Native
import { ReactNode } from 'react';

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
  platform?: 'web' | 'telegram_bot' | 'telegram_mini_app' | 'mobile';
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
  duration: number;
  price: number;
  currency: string;
  category: string;
  isActive: boolean;
  serviceLocation?: string;
  locationNotes?: string;
  requirements?: string[];
  deliverables?: string[];
  specialistId: string;
  specialist?: Specialist;
  images?: string[];
  tags?: string[];
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
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
  isGroupBooking?: boolean;
  groupSessionId?: string;
  participantCount?: number;
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
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceName: string;
  date: string;
  time?: string;
  amount: number;
  type?: 'online' | 'in-person';
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

export interface RescheduleRecord {
  oldScheduledAt: string;
  newScheduledAt: string;
  reason: string;
  requestedBy: 'customer' | 'specialist';
  requestedAt: string;
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
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
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
  rating: number;
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
  value: number;
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

// Navigation Types
export type RootDrawerParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Favorites: undefined;
  Profile: undefined;
  Settings: undefined;
  SpecialistDashboard: undefined;
  Calendar: undefined;
  MyServices: undefined;
  MyClients: undefined;
  Earnings: undefined;
  Login: undefined;
  Register: undefined;
  // Customer screens
  CustomerDashboard: undefined;
  CustomerLoyalty: undefined;
  CustomerWallet: undefined;
  CustomerMessages: undefined;
  CustomerReferrals: undefined;
  CustomerReviews: undefined;
  PaymentMethods: undefined;
  HelpSupport: undefined;
  // Specialist screens
  SpecialistBookings: undefined;
  SpecialistServices: undefined;
  SpecialistProfile: undefined;
  SpecialistAnalytics: undefined;
  SpecialistSchedule: undefined;
  SpecialistEarnings: undefined;
  SpecialistReviews: undefined;
  SpecialistLoyalty: undefined;
  SpecialistMessages: undefined;
  SpecialistReferrals: undefined;
  SpecialistWallet: undefined;
  SpecialistSettings: undefined;
  SpecialistNotifications: undefined;
  EmployeeManagement: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ServiceDetail: { serviceId: string };
  SpecialistProfile: { specialistId: string };
  BookingDetail: { bookingId: string };
  BookingFlow: { serviceId: string };
  PaymentPage: { bookingId: string };
  NotFound: undefined;
};

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Component Props Types
export interface BaseComponentProps {
  children?: ReactNode;
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

// Environment Types
export interface Environment {
  API_URL: string;
  WS_URL: string;
  APP_NAME: string;
  APP_VERSION: string;
  DEBUG: boolean;
}
