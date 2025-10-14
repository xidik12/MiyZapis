import express from 'express';
import { PremiumListingController } from '../controllers/premium-listings';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Public routes
router.get('/active', PremiumListingController.getActivePremiumListings);
router.get('/check/:specialistId', PremiumListingController.checkActiveListing);
router.get('/pricing', PremiumListingController.getPricing);
router.post('/:id/impression', PremiumListingController.trackImpression);
router.post('/:id/click', PremiumListingController.trackClick);

// Protected routes (require authentication)
router.post('/', authenticateToken, PremiumListingController.createPremiumListing);
router.get('/', authenticateToken, PremiumListingController.getMyPremiumListings);
router.get('/:id', authenticateToken, PremiumListingController.getPremiumListing);
router.post('/:id/conversion', authenticateToken, PremiumListingController.trackConversion);
router.get('/:id/analytics', authenticateToken, PremiumListingController.getAnalytics);
router.patch('/:id/toggle', authenticateToken, PremiumListingController.toggleListing);
router.post('/:id/renew', authenticateToken, PremiumListingController.renewListing);
router.delete('/:id', authenticateToken, PremiumListingController.cancelListing);

export default router;
