import express from 'express';
import { AdvertisementController } from '../controllers/advertisements';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/public', AdvertisementController.getPublicAdvertisements);
router.post('/:id/impression', AdvertisementController.trackImpression);
router.post('/:id/click', AdvertisementController.trackClick);

// Protected routes (require authentication)
router.post('/', authenticateToken, AdvertisementController.createAdvertisement);
router.get('/', authenticateToken, AdvertisementController.getMyAdvertisements);
router.get('/:id', authenticateToken, AdvertisementController.getAdvertisement);
router.patch('/:id', authenticateToken, AdvertisementController.updateAdvertisement);
router.delete('/:id', authenticateToken, AdvertisementController.deleteAdvertisement);
router.post('/:id/conversion', authenticateToken, AdvertisementController.trackConversion);
router.get('/:id/analytics', authenticateToken, AdvertisementController.getAnalytics);
router.patch('/:id/toggle', authenticateToken, AdvertisementController.toggleAdvertisement);

export default router;
