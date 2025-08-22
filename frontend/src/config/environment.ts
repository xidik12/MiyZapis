import { Environment } from '../types';

// Environment configuration
console.log('Loading environment:', { 
  VITE_API_URL: import.meta.env.VITE_API_URL
});

export const environment: Environment = {
  API_URL: import.meta.env.VITE_API_URL || 'https://miyzapis-backend-production.up.railway.app/api/v1', // Backend API URL
  WS_URL: import.meta.env.VITE_WS_URL || 'wss://miyzapis-backend-production.up.railway.app',
  STRIPE_PUBLISHABLE_KEY: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || null,
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  APP_NAME: import.meta.env.VITE_APP_NAME || 'МійЗапис',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:3000',
  TELEGRAM_BOT_USERNAME: import.meta.env.VITE_TELEGRAM_BOT_USERNAME,
  TELEGRAM_MINI_APP_URL: import.meta.env.VITE_TELEGRAM_MINI_APP_URL,
  ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA === 'true',
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_TELEGRAM_INTEGRATION: import.meta.env.VITE_ENABLE_TELEGRAM_INTEGRATION === 'true',
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  // All data comes from backend API - no mock data used
};

// API endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth-enhanced/login',
    REGISTER: '/auth-enhanced/register',
    REFRESH: '/auth-enhanced/refresh',
    LOGOUT: '/auth-enhanced/logout',
    FORGOT_PASSWORD: '/auth-enhanced/forgot-password',
    RESET_PASSWORD: '/auth-enhanced/reset-password',
    VERIFY_EMAIL: '/auth-enhanced/verify-email',
    TELEGRAM_AUTH: '/auth-enhanced/telegram',
  },
  
  // Users
  USERS: {
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/files/upload',
    PREFERENCES: '/users/preferences',
    DELETE_ACCOUNT: '/users',
  },
  
  // Specialists
  SPECIALISTS: {
    LIST: '/specialists',
    DETAIL: '/specialists',
    CREATE: '/specialists',
    UPDATE: '/specialists',
    AVAILABILITY: '/specialists',
    ANALYTICS: '/specialists',
  },
  
  // Services
  SERVICES: {
    LIST: '/services',
    DETAIL: '/services',
    CREATE: '/services',
    UPDATE: '/services',
    DELETE: '/services',
    SEARCH: '/services/search',
    CATEGORIES: '/services/categories',
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: '/bookings',
    CREATE: '/bookings',
    UPDATE: '/bookings',
    CANCEL: '/bookings',
    RESCHEDULE: '/bookings',
    AVAILABILITY: '/bookings/availability',
  },
  
  // Payments
  PAYMENTS: {
    INTENT: '/payments/intent',
    PROCESS: '/payments/process',
    CONFIRM: '/payments/confirm',
    REFUND: '/payments/refund',
    METHODS: '/payments/methods',
  },
  
  // Reviews
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: '/reviews',
    DELETE: '/reviews',
    RESPOND: '/reviews',
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications',
    MARK_ALL_READ: '/notifications/mark-all-read',
    PREFERENCES: '/notifications/preferences',
  },
  
  // Loyalty
  LOYALTY: {
    ACCOUNT: '/loyalty/account',
    TRANSACTIONS: '/loyalty/transactions',
    REDEEM: '/loyalty/redeem',
    REWARDS: '/loyalty/rewards',
  },
  
  // Analytics
  ANALYTICS: {
    SPECIALIST: '/analytics/specialist',
    PLATFORM: '/analytics/platform',
    OVERVIEW: '/analytics/overview',
    BOOKINGS: '/analytics/bookings',
    REVENUE: '/analytics/revenue',
    CUSTOMERS: '/analytics/customers',
    PERFORMANCE: '/analytics/performance',
    SERVICES: '/analytics/services',
  },
};

// WebSocket events
export const WS_EVENTS = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  BOOKING_STATUS_CHANGED: 'booking:status_changed',
  BOOKING_NEW: 'booking:new',
  BOOKING_UPDATED: 'booking:updated',
  NOTIFICATION_NEW: 'notification:new',
  PAYMENT_STATUS_CHANGED: 'payment:status_changed',
  SPECIALIST_AVAILABILITY_CHANGED: 'specialist:availability_changed',
};

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  CART: 'booking_cart',
  LAST_SEARCH: 'last_search',
  ONBOARDING_COMPLETED: 'onboarding_completed',
};

// Application constants
export const APP_CONSTANTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  PAGINATION_LIMIT: 20,
  SEARCH_DEBOUNCE_MS: 300,
  AUTO_SAVE_DEBOUNCE_MS: 1000,
  SESSION_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  LOYALTY_POINTS_PER_DOLLAR: 10,
  MIN_BOOKING_ADVANCE_HOURS: 24,
  MAX_BOOKING_ADVANCE_DAYS: 90,
  CANCELLATION_DEADLINE_HOURS: 24,
  RATING_SCALE: [1, 2, 3, 4, 5],
};

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s\-\(\)]{10,}$/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBER: true,
    REQUIRE_SPECIAL: true,
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
  BUSINESS_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  DESCRIPTION: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },
  REVIEW: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 500,
  },
};

export default environment;