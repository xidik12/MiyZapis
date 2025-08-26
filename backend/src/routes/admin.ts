import { Router } from 'express';
import { AdminController } from '@/controllers/admin/admin-dashboard';
import { authenticateToken, requireUserType } from '@/middleware/auth/jwt';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireUserType('ADMIN'));

// Dashboard and analytics routes
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/analytics/users', AdminController.getUserAnalytics);
router.get('/analytics/bookings', AdminController.getBookingAnalytics);
router.get('/analytics/financial', AdminController.getFinancialAnalytics);

// User management routes
router.post('/users/manage', AdminController.manageUsers);

// System health and monitoring
router.get('/system/health', AdminController.getSystemHealth);
router.get('/audit-logs', AdminController.getAuditLogs);

export default router;