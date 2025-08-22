import { Router } from 'express';
import { PaymentController } from '@/controllers/payments';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Protected routes - require authentication
router.post('/intent', authenticateToken, PaymentController.createPaymentIntent);
router.post('/confirm', authenticateToken, PaymentController.confirmPayment);
router.get('/my', authenticateToken, PaymentController.getUserPayments);
router.get('/:paymentId', authenticateToken, PaymentController.getPaymentDetails);

// Payment methods routes
router.get('/methods/my', authenticateToken, PaymentController.getUserPaymentMethods);
router.post('/methods', authenticateToken, PaymentController.addPaymentMethod);
router.put('/methods/:methodId', authenticateToken, PaymentController.updatePaymentMethod);
router.delete('/methods/:methodId', authenticateToken, PaymentController.deletePaymentMethod);
router.put('/methods/:methodId/default', authenticateToken, PaymentController.setDefaultPaymentMethod);

// Specialist routes
router.get('/earnings/my', authenticateToken, requireSpecialist, PaymentController.getSpecialistEarnings);

// Admin routes
router.post('/refund', authenticateToken, requireAdmin, PaymentController.processRefund);

// Development routes (for testing payments without Stripe)
router.post('/mock/success', authenticateToken, PaymentController.mockPaymentSuccess);

export default router;