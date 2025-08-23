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

// Frontend expects these routes
router.get('/profile', authenticateToken, requireSpecialist, SpecialistController.getMyProfile);
router.get('/analytics', authenticateToken, requireSpecialist, SpecialistController.getAnalytics);

// Protected routes - require specialist access
router.post('/profile', authenticateToken, requireSpecialist, SpecialistController.createProfile);
router.put('/profile', authenticateToken, requireSpecialist, SpecialistController.updateProfile);

// Specialist services routes (frontend expects these)
router.get('/services', authenticateToken, requireSpecialist, SpecialistController.getServices);
router.post('/services', authenticateToken, requireSpecialist, SpecialistController.createService);
router.put('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.updateService);
router.delete('/services/:serviceId', authenticateToken, requireSpecialist, SpecialistController.deleteService);
router.patch('/services/:serviceId/status', authenticateToken, requireSpecialist, SpecialistController.toggleServiceStatus);

// Specialist availability/schedule routes (frontend expects these)
router.get('/availability/blocked', authenticateToken, requireSpecialist, SpecialistController.getBlockedSlots);
router.post('/availability/block', authenticateToken, requireSpecialist, SpecialistController.blockTimeSlot);
router.delete('/availability/block/:blockId', authenticateToken, requireSpecialist, SpecialistController.unblockTimeSlot);

// Admin routes
router.put('/:specialistId/verification', authenticateToken, requireAdmin, SpecialistController.toggleVerification);

export default router;