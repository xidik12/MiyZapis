import { Router } from 'express';
import { FavoritesController } from '@/controllers/favorites';
import { authenticateToken } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { param } from 'express-validator';

const router = Router();
const favoritesController = new FavoritesController();

// Middleware to authenticate all routes
router.use(authenticateToken);

// Validation middleware for specialist and service IDs
const validateSpecialistId = [
  param('specialistId').isUUID().withMessage('Invalid specialist ID')
];

const validateServiceId = [
  param('serviceId').isUUID().withMessage('Invalid service ID')
];

// Add specialist to favorites
router.post('/specialists/:specialistId', validateSpecialistId, validateRequest, favoritesController.addSpecialistToFavorites);

// Add service to favorites
router.post('/services/:serviceId', validateServiceId, validateRequest, favoritesController.addServiceToFavorites);

// Remove specialist from favorites
router.delete('/specialists/:specialistId', validateSpecialistId, validateRequest, favoritesController.removeSpecialistFromFavorites);

// Remove service from favorites
router.delete('/services/:serviceId', validateServiceId, validateRequest, favoritesController.removeServiceFromFavorites);

// Get user's favorite specialists
router.get('/specialists', favoritesController.getFavoriteSpecialists);

// Get user's favorite services
router.get('/services', favoritesController.getFavoriteServices);

// Get all user's favorites
router.get('/all', favoritesController.getAllFavorites);

// Check if specialist is in favorites
router.get('/specialists/:specialistId/check', validateSpecialistId, validateRequest, favoritesController.checkSpecialistInFavorites);

// Check if service is in favorites
router.get('/services/:serviceId/check', validateServiceId, validateRequest, favoritesController.checkServiceInFavorites);

// Get favorites count
router.get('/count', favoritesController.getFavoritesCount);

// Clear all favorites
router.delete('/all', favoritesController.clearAllFavorites);

export default router;