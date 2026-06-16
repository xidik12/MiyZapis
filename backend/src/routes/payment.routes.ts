import express, { Request, Response } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { authenticateToken } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { prisma } from '@/config/database';
import { AuthenticatedRequest } from '@/types';
import { telegramStarsService, starsPricing } from '@/services/payment/telegram-stars.service';
import { dodoService } from '@/services/payment/dodo.service';
import { logger as appLogger } from '@/utils/logger';

const router = express.Router();

// --- Telegram Stars subscription (specialists) ---------------------------
// GET pricing (public) — stars for monthly + annual + whether card (Dodo) is on.
router.get('/telegram-stars/pricing', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      ...starsPricing(),
      cardEnabled: dodoService.isConfigured(),
      cardTrialDays: dodoService.trialDays(),
    },
  });
});

// --- Dodo Payments card subscription (2-month free trial → auto-charge) ---
// POST /dodo/checkout → returns a hosted-checkout URL to redirect the specialist to.
router.post('/dodo/checkout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    if (!dodoService.isConfigured()) {
      res.status(503).json({ success: false, error: { message: 'Card payments are not available yet' } });
      return;
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, firstName: true, lastName: true, specialist: { select: { id: true } } },
    });
    if (!user?.specialist) {
      res.status(403).json({ success: false, error: { message: 'Not a specialist account' } });
      return;
    }
    const checkoutUrl = await dodoService.createTrialCheckout({
      id: userId,
      email: user.email,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    });
    res.json({ success: true, data: { checkoutUrl } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to start checkout';
    res.status(500).json({ success: false, error: { message: msg } });
  }
});

// POST /dodo/cancel → cancel at period end (stays active until then)
router.post('/dodo/cancel', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as unknown as AuthenticatedRequest).user!.id;
    await dodoService.cancelSubscription(userId);
    res.json({ success: true, data: { ok: true } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to cancel';
    res.status(400).json({ success: false, error: { message: msg } });
  }
});

// POST /webhooks/dodo → Standard Webhooks; raw body preserved by server.ts for
// any path containing "/webhooks/". Verify signature, then apply the event.
router.post('/webhooks/dodo', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawBody = (req as Request & { rawBody?: string }).rawBody || JSON.stringify(req.body);
    const event = dodoService.verifyAndParse(rawBody, {
      'webhook-id': req.headers['webhook-id'] as string,
      'webhook-signature': req.headers['webhook-signature'] as string,
      'webhook-timestamp': req.headers['webhook-timestamp'] as string,
    });
    // Ack fast, then process (Dodo retries on non-2xx).
    res.json({ received: true });
    await dodoService.handleEvent(event);
  } catch (e: unknown) {
    appLogger.error('Dodo webhook error:', e);
    if (!res.headersSent) res.status(401).json({ error: 'Invalid signature' });
  }
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
