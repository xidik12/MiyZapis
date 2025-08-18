import { Router } from 'express';
import { SpecialistController } from '@/controllers/specialists';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Public routes
router.get('/', SpecialistController.searchSpecialists);
router.get('/:specialistId', SpecialistController.getProfile);

// Protected routes - require authentication
router.get('/my/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/my/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);

// Protected routes - require specialist access
router.post('/profile', authenticateToken, requireSpecialist, SpecialistController.createProfile);
router.put('/profile', authenticateToken, requireSpecialist, SpecialistController.updateProfile);

// Admin routes
router.put('/:specialistId/verification', authenticateToken, requireAdmin, SpecialistController.toggleVerification);

export default router;