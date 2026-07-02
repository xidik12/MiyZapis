import { Router } from 'express';
import { PaymentController } from '@/controllers/payments';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';
import { requirePaymentsEnabled } from '@/middleware/paymentsEnabled';
import {
  validateGetPaymentHistory,
  validateEarningsTrends,
  validateEarningsDateRange,
  validateRevenueRequest
} from '@/middleware/validation/payments';

const router = Router();

// Protected routes - require authentication
router.post('/intent', requirePaymentsEnabled, authenticateToken, PaymentController.createPaymentIntent);
router.post('/confirm', requirePaymentsEnabled, authenticateToken, PaymentController.confirmPayment);
router.get('/my', authenticateToken, PaymentController.getUserPayments);
router.get('/history', authenticateToken, validateGetPaymentHistory, PaymentController.getPaymentHistory);
router.get('/:paymentId/status', authenticateToken, PaymentController.getPaymentStatus);
router.get('/:paymentId', authenticateToken, PaymentController.getPaymentDetails);

// Payment methods routes
router.get('/methods/my', authenticateToken, PaymentController.getUserPaymentMethods);
router.post('/methods', authenticateToken, PaymentController.addPaymentMethod);
router.put('/methods/:methodId', authenticateToken, PaymentController.updatePaymentMethod);
router.delete('/methods/:methodId', authenticateToken, PaymentController.deletePaymentMethod);
router.put('/methods/:methodId/default', authenticateToken, PaymentController.setDefaultPaymentMethod);

// Specialist routes
router.get('/earnings/my', authenticateToken, requireSpecialist, validateEarningsDateRange, PaymentController.getSpecialistEarnings);
router.get('/earnings/overview', authenticateToken, requireSpecialist, PaymentController.getEarningsOverview);
router.get('/earnings/trends', authenticateToken, requireSpecialist, validateEarningsTrends, PaymentController.getEarningsTrends);
router.get('/earnings/analytics', authenticateToken, requireSpecialist, PaymentController.getEarningsAnalytics);
router.get('/earnings/revenue', authenticateToken, requireSpecialist, validateRevenueRequest, PaymentController.getRevenueData);

// Admin routes
router.post('/refund', authenticateToken, requireAdmin, PaymentController.processRefund);

// Wallet routes
router.get('/wallet/balance', authenticateToken, PaymentController.getWalletBalance);
router.get('/wallet/transactions', authenticateToken, PaymentController.getWalletTransactions);

// PayPal routes
router.post('/paypal/create-order', requirePaymentsEnabled, authenticateToken, PaymentController.createPayPalOrder);
router.post('/paypal/capture-order', requirePaymentsEnabled, authenticateToken, PaymentController.capturePayPalOrder);
router.get('/paypal/order/:orderId', authenticateToken, PaymentController.getPayPalOrderDetails);
router.post('/paypal/refund', requirePaymentsEnabled, authenticateToken, PaymentController.refundPayPalPayment);

// PayPal webhook (no authentication required)
router.post('/webhooks/paypal', requirePaymentsEnabled, PaymentController.handlePayPalWebhook);

// WayForPay routes
router.post('/wayforpay/create-invoice', requirePaymentsEnabled, authenticateToken, PaymentController.createWayForPayInvoice);
router.get('/wayforpay/status/:orderReference', authenticateToken, PaymentController.getWayForPayPaymentStatus);

// WayForPay webhook (no authentication required)
router.post('/webhooks/wayforpay', requirePaymentsEnabled, PaymentController.handleWayForPayWebhook);

// Coinbase Commerce routes
router.post('/coinbase/create-charge', requirePaymentsEnabled, authenticateToken, PaymentController.createCoinbaseCharge);
router.get('/coinbase/charge/:chargeCode', authenticateToken, PaymentController.getCoinbaseChargeDetails);

// Coinbase Commerce webhook (no authentication required)
router.post('/webhooks/coinbase', requirePaymentsEnabled, PaymentController.handleCoinbaseWebhook);

// Development routes (for testing payments without Stripe) — disabled in production
if (process.env.NODE_ENV !== 'production') {
  router.post('/mock/success', requirePaymentsEnabled, authenticateToken, PaymentController.mockPaymentSuccess);
}

export default router;