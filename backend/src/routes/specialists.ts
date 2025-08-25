import { Router } from 'express';
import { SpecialistController } from '@/controllers/specialists';
import { authenticateToken, requireSpecialist, requireAdmin } from '@/middleware/auth/jwt';

const router = Router();

// Protected routes - require authentication (must come before parameterized routes)
router.get('/my/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/my/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);

// Frontend expects these routes (must come before parameterized routes)
router.get('/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);
router.get('/revenue', authenticateToken, requireSpecialist, SpecialistController.getRevenueBreakdown);

// Specialist services routes (frontend expects these - must come before parameterized routes)
router.get('/services', authenticateToken, requireSpecialist, SpecialistController.getServices);
router.post('/services', authenticateToken, requireSpecialist, SpecialistController.createService);
router.put('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.updateService);
router.delete('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.deleteService);
router.patch('/services/:serviceId/status', authenticateToken, requireSpecialist, SpecialistController.toggleServiceStatus);

// Specialist availability/schedule routes (frontend expects these - must come before parameterized routes)
router.get('/availability/blocked', authenticateToken, requireSpecialist, SpecialistController.getBlockedSlots);
router.post('/availability/block', authenticateToken, requireSpecialist, SpecialistController.blockTimeSlot);
router.delete('/availability/block/:blockId', authenticateToken, requireSpecialist, SpecialistController.unblockTimeSlot);

// Protected routes - require specialist access
router.post('/profile', authenticateToken, requireSpecialist, SpecialistController.createProfile);
router.put('/profile', authenticateToken, requireSpecialist, SpecialistController.updateProfile);

// Admin routes (must come before parameterized routes)
router.put('/:specialistId/verification', authenticateToken, requireAdmin, SpecialistController.toggleVerification);

// Public routes (parameterized routes must come last)
router.get('/', SpecialistController.searchSpecialists);
router.get('/:specialistId', SpecialistController.getProfile);

export default router;