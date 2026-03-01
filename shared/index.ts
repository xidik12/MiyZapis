// ============================================================
// @miyzapis/shared — Main Entry Point
// ============================================================

// Types
export * from './types';

// API
export {
  SharedApiClient,
  createSharedApis,
  createAuthApi,
  createBookingsApi,
  createServicesApi,
  createUsersApi,
  createSpecialistsApi,
  createReviewsApi,
  createPaymentsApi,
  createNotificationsApi,
  createMessagesApi,
  createCommunityApi,
  createLoyaltyApi,
  createFavoritesApi,
  createReferralApi,
  createHelpApi,
  createLocationsApi,
  createExpensesApi,
} from './api';

export type {
  ApiClientConfig,
  SharedApis,
  AuthApi,
  BookingsApi,
  BookingFilters,
  ServicesApi,
  UsersApi,
  SpecialistsApi,
  ReviewsApi,
  PaymentsApi,
  NotificationsApi,
  MessagesApi,
  CommunityApi,
  LoyaltyApi,
  FavoritesApi,
  ReferralApi,
  HelpApi,
  LocationsApi,
  ExpensesApi,
} from './api';

// WebSocket
export { SharedWebSocketService } from './websocket';
export type { WebSocketConfig, SocketEventHandler } from './websocket';

// Hooks
export { createTypedHooks } from './hooks/useRedux';

// Utils
export {
  formatDate,
  formatDateShort,
  formatTime,
  formatCurrency,
  formatDuration,
  getRelativeTime,
  capitalize,
  truncate,
  getInitials,
  debounce,
  generateId,
  deepClone,
  isEmpty,
} from './utils';
