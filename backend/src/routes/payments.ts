import { Router } from 'express';
import { paymentController } from '@/controllers/payment.controller';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';
import {
  validateGetPaymentHistory,
  validateEarningsTrends,
  validateEarningsDateRange,
  validateRevenueRequest
} from '@/middleware/validation/payments';

const router = Router();

// Protected routes - require authentication
router.post('/intent', authenticateToken, paymentController.createPaymentIntent.bind(paymentController));
router.post('/confirm', authenticateToken, paymentController.confirmPayment.bind(paymentController));
router.get('/my', authenticateToken, paymentController.getUserPayments.bind(paymentController));
router.get('/history', authenticateToken, validateGetPaymentHistory, paymentController.getPaymentHistory.bind(paymentController));
router.get('/:paymentId/status', authenticateToken, paymentController.getPaymentStatus.bind(paymentController));
router.get('/:paymentId', authenticateToken, paymentController.getPaymentDetails.bind(paymentController));

// Payment methods routes
router.get('/methods/my', authenticateToken, paymentController.getUserPaymentMethods.bind(paymentController));
router.post('/methods', authenticateToken, paymentController.addPaymentMethod.bind(paymentController));
router.put('/methods/:methodId', authenticateToken, paymentController.updatePaymentMethod.bind(paymentController));
router.delete('/methods/:methodId', authenticateToken, paymentController.deletePaymentMethod.bind(paymentController));
router.put('/methods/:methodId/default', authenticateToken, paymentController.setDefaultPaymentMethod.bind(paymentController));

// Specialist routes
router.get('/earnings/my', authenticateToken, requireSpecialist, validateEarningsDateRange, paymentController.getSpecialistEarnings.bind(paymentController));
router.get('/earnings/overview', authenticateToken, requireSpecialist, paymentController.getEarningsOverview.bind(paymentController));
router.get('/earnings/trends', authenticateToken, requireSpecialist, validateEarningsTrends, paymentController.getEarningsTrends.bind(paymentController));
router.get('/earnings/analytics', authenticateToken, requireSpecialist, paymentController.getEarningsAnalytics.bind(paymentController));
router.get('/earnings/revenue', authenticateToken, requireSpecialist, validateRevenueRequest, paymentController.getRevenueData.bind(paymentController));

// Admin routes
router.post('/refund', authenticateToken, requireAdmin, paymentController.processRefund.bind(paymentController));

// Wallet routes
router.get('/wallet/balance', authenticateToken, paymentController.getWalletBalance.bind(paymentController));
router.get('/wallet/transactions', authenticateToken, paymentController.getWalletTransactions.bind(paymentController));

// PayPal routes
router.post('/paypal/create-order', authenticateToken, paymentController.createPayPalOrder.bind(paymentController));
router.post('/paypal/capture-order', authenticateToken, paymentController.capturePayPalOrder.bind(paymentController));
router.get('/paypal/order/:orderId', authenticateToken, paymentController.getPayPalOrderDetails.bind(paymentController));
router.post('/paypal/refund', authenticateToken, paymentController.refundPayPalPayment.bind(paymentController));

// PayPal webhook (no authentication required)
router.post('/webhooks/paypal', paymentController.handlePayPalWebhook.bind(paymentController));

// WayForPay routes
router.post('/wayforpay/create-invoice', authenticateToken, paymentController.createWayForPayInvoice.bind(paymentController));
router.get('/wayforpay/status/:orderReference', authenticateToken, paymentController.getWayForPayPaymentStatus.bind(paymentController));

// WayForPay webhook (no authentication required)
router.post('/webhooks/wayforpay', paymentController.handleWayForPayWebhook.bind(paymentController));

// Development routes (for testing payments without Stripe)
router.post('/mock/success', authenticateToken, paymentController.mockPaymentSuccess.bind(paymentController));

export default router;