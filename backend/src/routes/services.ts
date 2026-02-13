import { Router } from 'express';
import { ServiceController } from '@/controllers/services';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();

// Public routes (with caching for frequently accessed data)
router.get('/', ServiceController.searchServices);
router.get('/location', ServiceController.getServicesByLocation); // Must be before /:serviceId
router.get('/categories', cacheMiddleware(1800, 'categories'), ServiceController.getCategories);
router.get('/popular', cacheMiddleware(120, 'popular'), ServiceController.getPopularServices);
router.get('/loyalty-points', ServiceController.getLoyaltyPointsServices);
router.get('/:serviceId', cacheMiddleware(300, 'service'), ServiceController.getService);

// Protected routes - require authentication
router.get('/my/services', authenticateToken, ServiceController.getSpecialistServices);

// Protected routes - require specialist access
router.post('/', authenticateToken, requireSpecialist, ServiceController.createService);
router.put('/:serviceId', authenticateToken, requireSpecialist, ServiceController.updateService);
router.delete('/:serviceId', authenticateToken, requireSpecialist, ServiceController.deleteService);
router.post('/migrate-currency', authenticateToken, requireSpecialist, ServiceController.migrateCurrencyData);

export default router;