// ============================================================
// User Types — Canonical definitions for MiyZapis
// Merged from frontend/src/types/index.ts and mini-app/src/types/index.ts
// ============================================================

export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// Frontend uses lowercase, mini-app uses uppercase
export type UserType = 'customer' | 'specialist' | 'admin';
export type UserRole = 'CUSTOMER' | 'SPECIALIST' | 'ADMIN';

export interface User extends BaseEntity {
  email: string;
  firstName: string;
  lastName: string;
  // Frontend uses phoneNumber, mini-app uses phone
  phone?: string;
  phoneNumber?: string;
  avatar?: string;
  // Frontend uses userType (lowercase), mini-app uses role (uppercase)
  userType: UserType;
  role?: UserRole;
  isVerified: boolean;
  loyaltyPoints?: number;
  totalBookings?: number;
  memberSince?: string;
  profileComplete?: boolean;
  telegramId?: string | number;
  preferences?: UserPreferences;
  profile?: UserProfile;
  // Free trial period (frontend-specific)
  trialStartDate?: string;
  trialEndDate?: string;
  isInTrial?: boolean;
  // Auth provider info (frontend-specific)
  authProvider?: string;
  hasPassword?: boolean;
  passwordLastChanged?: string;
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
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone?: string;
  notifications: NotificationPreferences;
  theme?: 'light' | 'dark' | 'system';
}

export interface NotificationPreferences {
  email: boolean;
  sms?: boolean;
  push: boolean;
  telegram?: boolean;
}

// Authentication Types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
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
  phone?: string;
  userType?: UserType;
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
