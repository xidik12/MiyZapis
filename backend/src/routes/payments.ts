import { Router } from 'express';
import { PaymentController } from '@/controllers/payments';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';
import {
  validateGetPaymentHistory,
  validateEarningsTrends,
  validateEarningsDateRange,
  validateRevenueRequest
} from '@/middleware/validation/payments';

const router = Router();

// Protected routes - require authentication
router.post('/intent', authenticateToken, PaymentController.createPaymentIntent);
router.post('/confirm', authenticateToken, PaymentController.confirmPayment);
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
router.post('/paypal/create-order', authenticateToken, PaymentController.createPayPalOrder);
router.post('/paypal/capture-order', authenticateToken, PaymentController.capturePayPalOrder);
router.get('/paypal/order/:orderId', authenticateToken, PaymentController.getPayPalOrderDetails);
router.post('/paypal/refund', authenticateToken, PaymentController.refundPayPalPayment);

// PayPal webhook (no authentication required)
router.post('/webhooks/paypal', PaymentController.handlePayPalWebhook);

// WayForPay routes
router.post('/wayforpay/create-invoice', authenticateToken, PaymentController.createWayForPayInvoice);
router.get('/wayforpay/status/:orderReference', authenticateToken, PaymentController.getWayForPayPaymentStatus);

// WayForPay webhook (no authentication required)
router.post('/webhooks/wayforpay', PaymentController.handleWayForPayWebhook);

// Development routes (for testing payments without Stripe)
router.post('/mock/success', authenticateToken, PaymentController.mockPaymentSuccess);

export default router;