import { Router } from 'express';
import { authenticateToken } from '@/middleware/auth/jwt';
import { body } from 'express-validator';
import { LoyaltyController } from '@/controllers/loyalty';

const router = Router();

// Validation middleware
const validateAwardPoints = [
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string'),
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Reason must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('type')
    .optional()
    .isIn(['EARNED', 'BONUS'])
    .withMessage('Type must be either EARNED or BONUS'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expires at must be a valid date'),
];

const validateRedeemPoints = [
  body('points')
    .isInt({ min: 1 })
    .withMessage('Points must be a positive integer'),
  body('reason')
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Reason must be between 3 and 200 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must not exceed 500 characters'),
  body('referenceId')
    .optional()
    .isString()
    .withMessage('Reference ID must be a string'),
];

// Get user's loyalty balance
router.get('/balance', authenticateToken, LoyaltyController.getLoyaltyBalance);

// Get user's loyalty transaction history
router.get('/transactions', authenticateToken, LoyaltyController.getLoyaltyTransactions);

// Get all loyalty transactions (Admin only)
router.get('/transactions/all', authenticateToken, LoyaltyController.getAllLoyaltyTransactions);

// Award loyalty points (Admin only)
router.post('/award', authenticateToken, validateAwardPoints, LoyaltyController.awardPoints);

// Redeem loyalty points
router.post('/redeem', authenticateToken, validateRedeemPoints, LoyaltyController.redeemPoints);

// Get loyalty program statistics
router.get('/stats', authenticateToken, LoyaltyController.getLoyaltyStats);

// Get loyalty tiers and benefits (public)
router.get('/tiers', LoyaltyController.getLoyaltyTiers);

// Get user's current tier
router.get('/tier', authenticateToken, LoyaltyController.getUserTier);

export default router;