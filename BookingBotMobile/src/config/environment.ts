// Environment configuration - matching web version
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra || {};

export const environment = {
  API_URL: extra.apiUrl || 'https://huddle-backend-production.up.railway.app/api/v1',
  WS_URL: extra.wsUrl || 'wss://huddle-backend-production.up.railway.app',
  APP_NAME: 'Panhaha',
  APP_VERSION: '1.0.0',
  DEBUG: __DEV__ || false,
  GOOGLE_CLIENT_ID: extra.googleClientId || null, // Will be set in app.json
  GOOGLE_AUTH_ENABLED: Boolean(extra.googleClientId),
};

// API endpoints - matching web version exactly
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth-enhanced/login',
    REGISTER: '/auth-enhanced/register',
    REFRESH: '/auth-enhanced/refresh',
    LOGOUT: '/auth-enhanced/logout',
    FORGOT_PASSWORD: '/auth/request-password-reset',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth-enhanced/verify-email',
    GOOGLE_AUTH: '/auth-enhanced/google',
    TELEGRAM_AUTH: '/auth-enhanced/telegram',
  },
  USERS: {
    PROFILE: '/auth/me',
    UPDATE_PROFILE: '/users/profile',
    UPLOAD_AVATAR: '/files/upload',
    PREFERENCES: '/users/preferences',
    DELETE_ACCOUNT: '/users',
  },
  SPECIALISTS: {
    LIST: '/specialists',
    DETAIL: '/specialists',
    CREATE: '/specialists',
    UPDATE: '/specialists',
    AVAILABILITY: '/specialists',
    ANALYTICS: '/specialists',
  },
  SERVICES: {
    LIST: '/services',
    DETAIL: '/services',
    CREATE: '/services',
    UPDATE: '/services',
    DELETE: '/services',
    SEARCH: '/services/search',
    CATEGORIES: '/services/categories',
  },
  BOOKINGS: {
    LIST: '/bookings',
    DETAIL: '/bookings',
    CREATE: '/bookings',
    UPDATE: '/bookings',
    CANCEL: '/bookings',
    RESCHEDULE: '/bookings',
    AVAILABILITY: '/bookings/availability',
  },
  PAYMENTS: {
    INTENT: '/payments/intent',
    PROCESS: '/payments/process',
    CONFIRM: '/payments/confirm',
    REFUND: '/payments/refund',
    METHODS: '/payments/methods',
  },
  REVIEWS: {
    LIST: '/reviews',
    CREATE: '/reviews',
    UPDATE: '/reviews',
    DELETE: '/reviews',
    RESPOND: '/reviews',
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications',
    MARK_ALL_READ: '/notifications/mark-all-read',
    PREFERENCES: '/notifications/preferences',
  },
  LOYALTY: {
    ACCOUNT: '/loyalty/account',
    TRANSACTIONS: '/loyalty/transactions',
    REDEEM: '/loyalty/redeem',
    REWARDS: '/loyalty/rewards',
  },
  ANALYTICS: {
    SPECIALIST: '/analytics/specialist',
    PLATFORM: '/analytics/platform',
    OVERVIEW: '/analytics/overview',
    SPECIALIST_OVERVIEW: '/specialists/analytics',
    BOOKINGS: '/analytics/bookings',
    REVENUE: '/analytics/revenue',
    SPECIALIST_REVENUE: '/specialists/revenue',
    CUSTOMERS: '/analytics/customers',
    PERFORMANCE: '/analytics/performance',
    SERVICES: '/analytics/services',
  },
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    ADD_FUNDS: '/wallet/add-funds',
  },
  REFERRALS: {
    CREATE: '/referral/create',
    CONFIG: '/referral/config',
    TRACK: '/referral/track',
  },
  MESSAGES: {
    CONVERSATIONS: '/messages/conversations',
    CREATE_CONVERSATION: '/messages/conversations',
    MESSAGES: '/messages/conversations',
  },
  FAVORITES: {
    LIST: '/favorites',
    ADD: '/favorites',
    REMOVE: '/favorites',
  },
};

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  CART: 'booking_cart',
  LAST_SEARCH: 'last_search',
  ONBOARDING_COMPLETED: 'onboarding_completed',
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

// App constants
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

export default environment;

