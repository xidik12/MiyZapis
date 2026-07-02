import express, { Request, Response } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { authenticateToken } from '@/middleware/auth/jwt';
import { requirePaymentsEnabled } from '@/middleware/paymentsEnabled';
import { validateRequest } from '@/middleware/validation';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { telegramStarsService, starsPricing } from '@/services/payment/telegram-stars.service';

const router = express.Router();

// --- Telegram Stars subscription (specialists) ---------------------------
// GET pricing (public) — stars for monthly + 6-month + annual plans.
router.get('/telegram-stars/pricing', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...starsPricing(),
    },
  });
});

// POST /telegram-stars/invoice { plan: 'monthly' | 'annual' } → invoice link
router.post('/telegram-stars/invoice', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    const raw = req.body?.plan;
    const plan: 'monthly' | 'sixmonth' | 'annual' =
      raw === 'annual' ? 'annual' : raw === 'sixmonth' || raw === '6month' ? 'sixmonth' : 'monthly';
    const specialist = await prisma.specialist.findUnique({ where: { userId }, select: { id: true } });
    if (!specialist) {
      res.status(403).json({ success: false, error: { message: 'Not a specialist account' } });
      return;
    }
    const invoiceLink =
      plan === 'annual'
        ? await telegramStarsService.createAnnualInvoiceLink(userId)
        : plan === 'sixmonth'
        ? await telegramStarsService.createSixMonthInvoiceLink(userId)
        : await telegramStarsService.createSubscriptionInvoiceLink(userId);
    res.json({ success: true, data: { invoiceLink, plan } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create invoice';
    res.status(500).json({ success: false, error: { message: msg } });
  }
});

// POST /telegram-stars/cancel → turn off auto-renew (stays active until period end)
router.post('/telegram-stars/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    await telegramStarsService.cancelSubscription(userId);
    res.json({ success: true, data: { ok: true } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to cancel';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

// Everything below is card/crypto/wallet/onramp payment machinery. Telegram Stars
// (above) is the only live rail; block the rest until PAYMENTS_ENABLED=true so the
// weak/forgeable provider + webhook handlers aren't reachable.
router.use(requirePaymentsEnabled);

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

router.post(
  '/gift-card/apply/:bookingId',
  authenticateToken,
  paymentController.applyGiftCardToBooking.bind(paymentController)
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

// WayForPay Routes
router.post(
  '/wayforpay/create-invoice',
  authenticateToken,
  paymentController.createWayForPayInvoice.bind(paymentController)
);

router.get(
  '/wayforpay/status/:orderReference',
  authenticateToken,
  paymentController.getWayForPayPaymentStatus.bind(paymentController)
);

// PayPal Routes
router.post(
  '/paypal/create-order',
  authenticateToken,
  paymentController.createPayPalOrder.bind(paymentController)
);

router.post(
  '/paypal/capture-order',
  authenticateToken,
  paymentController.capturePayPalOrder.bind(paymentController)
);

router.get(
  '/paypal/order/:orderId',
  authenticateToken,
  paymentController.getPayPalOrderDetails.bind(paymentController)
);

// Webhooks (no authentication required)
router.post(
  '/webhooks/coinbase',
  captureRawBody,
  express.json(),
  paymentController.handleCoinbaseWebhook.bind(paymentController)
);

router.post(
  '/webhooks/wayforpay',
  express.json(),
  paymentController.handleWayForPayWebhook.bind(paymentController)
);

export default router;
