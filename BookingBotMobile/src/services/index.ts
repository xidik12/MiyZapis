// Services index - export all services
export { apiClient, setAuthTokens, getAuthToken, clearAuthTokens, checkApiHealth, retryRequest } from './api';
export { authService } from './auth.service';
export { bookingService } from './booking.service';
export { serviceService } from './service.service';
export { specialistService } from './specialist.service';
export { paymentService } from './payment.service';
export { notificationService } from './notification.service';
export { userService } from './user.service';
export { reviewService } from './review.service';
export { fileUploadService } from './fileUpload.service';
export { messagingService } from './messaging.service';
export { analyticsService } from './analytics.service';
export { referralService } from './referral.service';
export { loyaltyService } from './loyalty.service';
export { walletService } from './wallet.service';
export { favoritesService } from './favorites.service';

// Create a services object for easy access
export const services = {
  auth: authService,
  booking: bookingService,
  service: serviceService,
  specialist: specialistService,
  payment: paymentService,
  notification: notificationService,
  user: userService,
  review: reviewService,
  fileUpload: fileUploadService,
  messaging: messagingService,
  analytics: analyticsService,
  referral: referralService,
  loyalty: loyaltyService,
  wallet: walletService,
  favorites: favoritesService,
} as const;

export default services;

