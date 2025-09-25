import express from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { authenticateToken } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';

const router = express.Router();

// Payment Intent Routes (for payment-first booking flow)
router.post(
  '/intent',
  authenticateToken,
  paymentController.createPaymentIntent.bind(paymentController)
);

// Booking Deposit Routes
router.post(
  '/bookings/:bookingId/deposit',
  authenticateToken,
  paymentController.createBookingDeposit.bind(paymentController)
);

router.get(
  '/bookings/:bookingId/status',
  authenticateToken,
  paymentController.getBookingPaymentStatus.bind(paymentController)
);

router.post(
  '/bookings/:bookingId/cancel',
  authenticateToken,
  paymentController.cancelBooking.bind(paymentController)
);

// Wallet Routes
router.get(
  '/wallet',
  authenticateToken,
  paymentController.getWalletBalance.bind(paymentController)
);

router.get(
  '/wallet/transactions',
  authenticateToken,
  paymentController.getWalletTransactions.bind(paymentController)
);

router.post(
  '/wallet/apply/:bookingId',
  authenticateToken,
  paymentController.applyWalletToBooking.bind(paymentController)
);

// Subscription Routes (for specialists)
router.get(
  '/specialists/:specialistId/plan',
  authenticateToken,
  paymentController.getSubscription.bind(paymentController)
);

router.post(
  '/specialists/:specialistId/change-plan',
  authenticateToken,
  paymentController.changePlan.bind(paymentController)
);

router.get(
  '/specialists/:specialistId/analytics',
  authenticateToken,
  paymentController.getSubscriptionAnalytics.bind(paymentController)
);

router.get(
  '/plans',
  paymentController.getAvailablePlans.bind(paymentController)
);

// Payment Status Polling
router.get(
  '/payments/:paymentId/status',
  authenticateToken,
  paymentController.getPaymentStatus.bind(paymentController)
);

// Configuration
router.get(
  '/config/deposit',
  paymentController.getDepositConfiguration.bind(paymentController)
);

// Onramp Routes (fiat-to-crypto conversion)
router.get(
  '/onramp/options',
  authenticateToken,
  paymentController.getPaymentOptions.bind(paymentController)
);

router.post(
  '/onramp/create-session',
  authenticateToken,
  paymentController.createOnrampSession.bind(paymentController)
);

router.get(
  '/onramp/session/:sessionId',
  authenticateToken,
  paymentController.getOnrampSession.bind(paymentController)
);

router.post(
  '/onramp/session/:sessionId/complete',
  authenticateToken,
  paymentController.completeOnrampSession.bind(paymentController)
);

// Middleware to capture raw body for webhook signature verification
const captureRawBody = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let data = '';
  req.on('data', chunk => {
    data += chunk;
  });
  req.on('end', () => {
    req.rawBody = data;
    next();
  });
};

// Webhooks (no authentication required)
router.post(
  '/webhooks/coinbase',
  captureRawBody,
  express.json(),
  paymentController.handleCoinbaseWebhook.bind(paymentController)
);

export default router;
