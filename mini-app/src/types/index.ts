export * from './telegram';

// Re-export types from main app
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';
  isVerified: boolean;
  profile?: UserProfile;
  telegramId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  avatar?: string;
  dateOfBirth?: string;
  address?: Address;
  preferences?: UserPreferences;
  loyaltyPoints: number;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    telegram: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory;
  duration: number;
  price: number;
  currency: string;
  images: string[];
  isActive: boolean;
  specialistId: string;
  specialist: Specialist;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface Specialist {
  id: string;
  user: User;
  businessName: string;
  description: string;
  specialties: string[];
  experience: number;
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  isActive: boolean;
  workingHours: WorkingHours;
  location: Address;
  services: Service[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  isWorking: boolean;
  openTime: string;
  closeTime: string;
  breaks: Break[];
}

export interface Break {
  startTime: string;
  endTime: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customer: User;
  specialistId: string;
  specialist: Specialist;
  serviceId: string;
  service: Service;
  date: string;
  startTime: string;
  endTime: string;
  status: BookingStatus;
  notes?: string;
  totalAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  cancellationReason?: string;
  rescheduleHistory: RescheduleRecord[];
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export type PaymentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentMethod = 
  | 'CARD'
  | 'TELEGRAM_PAYMENT'
  | 'BANK_TRANSFER'
  | 'CASH'
  | 'WALLET';

export interface RescheduleRecord {
  id: string;
  originalDate: string;
  originalTime: string;
  newDate: string;
  newTime: string;
  reason: string;
  requestedBy: 'CUSTOMER' | 'SPECIALIST';
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  booking: Booking;
  customerId: string;
  customer: User;
  specialistId: string;
  specialist: Specialist;
  rating: number;
  comment?: string;
  images?: string[];
  isVerified: boolean;
  response?: SpecialistResponse;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialistResponse {
  id: string;
  reviewId: string;
  response: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  bookingId: string;
  booking: Booking;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionId?: string;
  stripePaymentIntentId?: string;
  telegramChargeId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  channels: NotificationChannel[];
  scheduledAt?: string;
  sentAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_FAILED'
  | 'REVIEW_RECEIVED'
  | 'PROMOTION'
  | 'SYSTEM';

export type NotificationChannel =
  | 'EMAIL'
  | 'SMS'
  | 'PUSH'
  | 'TELEGRAM';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  message?: string;
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SearchFilters {
  category?: string;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  availability?: {
    date: string;
    time?: string;
  };
  sortBy?: 'rating' | 'price' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

// Telegram-specific types
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