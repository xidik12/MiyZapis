import { Router } from 'express';
import { HelpController } from '@/controllers/help';
import { authenticateToken } from '@/middleware/auth/jwt';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();
const helpController = new HelpController();

// Public routes (no authentication required) - cached since help content is relatively static
// Get FAQs
router.get('/faqs', cacheMiddleware(300, 'faqs'), helpController.getFAQs);

// Get contact methods
router.get('/contact-methods', cacheMiddleware(300, 'contact-methods'), helpController.getContactMethods);

// Get FAQ categories
router.get('/faq-categories', cacheMiddleware(300, 'faq-categories'), helpController.getFAQCategories);

// Search FAQs
router.get('/search', cacheMiddleware(120, 'faq-search'), helpController.searchFAQs);

// Get support statistics
router.get('/stats', cacheMiddleware(60, 'support-stats'), helpController.getSupportStats);

// Protected routes (authentication required)
// Submit feedback
router.post('/feedback', authenticateToken, helpController.submitFeedback);

export default router;