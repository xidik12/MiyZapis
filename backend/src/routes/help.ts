import { Router } from 'express';
import { HelpController } from '@/controllers/help';
import { authenticateToken } from '@/middleware/auth/jwt';

const router = Router();
const helpController = new HelpController();

// Public routes (no authentication required)
// Get FAQs
router.get('/faqs', helpController.getFAQs);

// Get contact methods
router.get('/contact-methods', helpController.getContactMethods);

// Get FAQ categories
router.get('/faq-categories', helpController.getFAQCategories);

// Search FAQs
router.get('/search', helpController.searchFAQs);

// Get support statistics
router.get('/stats', helpController.getSupportStats);

// Protected routes (authentication required)
// Submit feedback
router.post('/feedback', authenticateToken, helpController.submitFeedback);

export default router;