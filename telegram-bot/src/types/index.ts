export interface BotUser {
  id: number;
  telegramId: number;
  firstName: string;
  lastName?: string;
  username?: string;
  languageCode: string;
  isBot: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BotSession {
  userId: number;
  currentFlow?: string;
  currentStep?: string;
  data?: Record<string, any>;
  language: 'uk' | 'ru' | 'en';
  lastActivity: Date;
}

export interface Specialist {
  id: string;
  name: string;
  profession: string;
  rating: number;
  reviewCount: number;
  location: string;
  responseTime: number;
  isVerified: boolean;
  isOnline: boolean;
  priceFrom: number;
  currency: string;
  completedJobs: number;
  yearsExperience: number;
  specialties: string[];
  avatar?: string;
  description?: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  currency: string;
  specialistId: string;
  categoryId: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  emoji: string;
  description: string;
  isActive: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  specialistId: string;
  serviceId: string;
  date: string;
  time: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  totalAmount: number;
  depositAmount?: number;
  currency: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Telegram-specific types
import { InlineKeyboardButton } from 'telegraf/types';

export type InlineKeyboard = InlineKeyboardButton[][];

// Flow states
export interface BookingFlow {
  specialistId?: string;
  serviceId?: string;
  selectedDate?: string;
  selectedTime?: string;
  notes?: string;
  step: 'specialist_selection' | 'service_selection' | 'date_selection' | 'time_selection' | 'confirmation' | 'payment';
}

export interface SearchFlow {
  category?: string;
  location?: string;
  priceRange?: [number, number];
  rating?: number;
  availability?: 'today' | 'this_week' | 'flexible';
  filters?: Record<string, any>;
}

// Error types
export interface BotError extends Error {
  code?: string;
  userId?: number;
  context?: Record<string, any>;
}

// Language support
export type Language = 'uk' | 'ru' | 'en';

export interface LocalizedText {
  uk: string;
  ru: string;
  en: string;
}

// API Integration types
export interface ApiClient {
  get<T>(endpoint: string, params?: Record<string, any>): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>>;
  put<T>(endpoint: string, data?: Record<string, any>): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string): Promise<ApiResponse<T>>;
}

export interface UserProfile {
  id: string;
  telegramId: number;
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  language: Language;
  avatar?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  preferences?: {
    notifications: boolean;
    newsletter: boolean;
    smsReminders: boolean;
  };
  loyaltyPoints: number;
  totalBookings: number;
  createdAt: Date;
  updatedAt: Date;
}

// Telegraf Context extension
import { Context } from 'telegraf';

export interface BotContext extends Context {
  session?: BotSession;
}