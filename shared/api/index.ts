// ============================================================
// @miyzapis/shared API — Re-exports all API modules
// ============================================================

export { SharedApiClient } from './client';
export type { ApiClientConfig } from './client';

export { createAuthApi } from './auth';
export type { AuthApi } from './auth';

export { createBookingsApi } from './bookings';
export type { BookingsApi, BookingFilters } from './bookings';

export { createServicesApi } from './services';
export type { ServicesApi } from './services';

export { createUsersApi } from './users';
export type { UsersApi } from './users';

export { createSpecialistsApi } from './specialists';
export type { SpecialistsApi } from './specialists';

export { createReviewsApi } from './reviews';
export type { ReviewsApi } from './reviews';

export { createPaymentsApi } from './payments';
export type { PaymentsApi } from './payments';

export { createNotificationsApi } from './notifications';
export type { NotificationsApi } from './notifications';

export { createMessagesApi } from './messages';
export type { MessagesApi } from './messages';

export { createCommunityApi } from './community';
export type { CommunityApi } from './community';

export { createLoyaltyApi } from './loyalty';
export type { LoyaltyApi } from './loyalty';

export {
  createFavoritesApi,
  createReferralApi,
  createHelpApi,
  createLocationsApi,
  createExpensesApi,
} from './misc';
export type {
  FavoritesApi,
  ReferralApi,
  HelpApi,
  LocationsApi,
  ExpensesApi,
} from './misc';

// ---- Factory: Create all APIs from a single client ----

import { SharedApiClient, ApiClientConfig } from './client';
import { createAuthApi } from './auth';
import { createBookingsApi } from './bookings';
import { createServicesApi } from './services';
import { createUsersApi } from './users';
import { createSpecialistsApi } from './specialists';
import { createReviewsApi } from './reviews';
import { createPaymentsApi } from './payments';
import { createNotificationsApi } from './notifications';
import { createMessagesApi } from './messages';
import { createCommunityApi } from './community';
import { createLoyaltyApi } from './loyalty';
import {
  createFavoritesApi,
  createReferralApi,
  createHelpApi,
  createLocationsApi,
  createExpensesApi,
} from './misc';

export interface SharedApis {
  client: SharedApiClient;
  auth: ReturnType<typeof createAuthApi>;
  bookings: ReturnType<typeof createBookingsApi>;
  services: ReturnType<typeof createServicesApi>;
  users: ReturnType<typeof createUsersApi>;
  specialists: ReturnType<typeof createSpecialistsApi>;
  reviews: ReturnType<typeof createReviewsApi>;
  payments: ReturnType<typeof createPaymentsApi>;
  notifications: ReturnType<typeof createNotificationsApi>;
  messages: ReturnType<typeof createMessagesApi>;
  community: ReturnType<typeof createCommunityApi>;
  loyalty: ReturnType<typeof createLoyaltyApi>;
  favorites: ReturnType<typeof createFavoritesApi>;
  referral: ReturnType<typeof createReferralApi>;
  help: ReturnType<typeof createHelpApi>;
  locations: ReturnType<typeof createLocationsApi>;
  expenses: ReturnType<typeof createExpensesApi>;
}

/**
 * Create all API modules from a single configuration.
 *
 * Usage:
 * ```ts
 * const apis = createSharedApis({
 *   baseURL: import.meta.env.VITE_API_URL,
 *   getToken: () => localStorage.getItem('auth_token'),
 * });
 *
 * const bookings = await apis.bookings.getBookings();
 * ```
 */
export function createSharedApis(config: ApiClientConfig): SharedApis {
  const client = new SharedApiClient(config);

  return {
    client,
    auth: createAuthApi(client),
    bookings: createBookingsApi(client),
    services: createServicesApi(client),
    users: createUsersApi(client),
    specialists: createSpecialistsApi(client),
    reviews: createReviewsApi(client),
    payments: createPaymentsApi(client),
    notifications: createNotificationsApi(client),
    messages: createMessagesApi(client),
    community: createCommunityApi(client),
    loyalty: createLoyaltyApi(client),
    favorites: createFavoritesApi(client),
    referral: createReferralApi(client),
    help: createHelpApi(client),
    locations: createLocationsApi(client),
    expenses: createExpensesApi(client),
  };
}
