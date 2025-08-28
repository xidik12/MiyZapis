import { Request, Response } from 'express';
import { HelpService } from '@/services/help';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';
import { prisma } from '@/config/database';

export class HelpController {
  private helpService: HelpService;

  constructor() {
    this.helpService = new HelpService(prisma);
  }

  // Get FAQs
  getFAQs = async (req: Request, res: Response): Promise<void> => {
    try {
      const category = req.query.category as string;
      const language = req.query.language as string || 'en';

      const faqs = await this.helpService.getFAQs(category, language);

      res.json(createSuccessResponse({
        faqs,
        total: faqs.length
      }));
    } catch (error: any) {
      logger.error('Error getting FAQs:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to get FAQs',
        req.headers['x-request-id'] as string
      ));
    }
  };

  // Get contact methods
  getContactMethods = async (req: Request, res: Response): Promise<void> => {
    try {
      const language = req.query.language as string || 'en';

      const contactMethods = await this.helpService.getContactMethods(language);

      res.json(createSuccessResponse({
        contactMethods,
        total: contactMethods.length
      }));
    } catch (error: any) {
      logger.error('Error getting contact methods:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to get contact methods',
        req.headers['x-request-id'] as string
      ));
    }
  };

  // Submit feedback
  submitFeedback = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { email, subject, message, category } = req.body;
      const userId = req.user?.id;

      if (!email || !subject || !message || !category) {
        res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Missing required fields: email, subject, message, category',
          req.headers['x-request-id'] as string
        ));
        return;
      }

      const result = await this.helpService.submitFeedback({
        email,
        subject,
        message,
        category,
        userId
      });

      res.json(createSuccessResponse(result));
    } catch (error: any) {
      logger.error('Error submitting feedback:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to submit feedback',
        req.headers['x-request-id'] as string
      ));
    }
  };

  // Get FAQ categories
  getFAQCategories = async (req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.helpService.getFAQCategories();

      res.json(createSuccessResponse({
        categories,
        total: categories.length
      }));
    } catch (error: any) {
      logger.error('Error getting FAQ categories:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to get FAQ categories',
        req.headers['x-request-id'] as string
      ));
    }
  };

  // Search FAQs
  searchFAQs = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = req.query.q as string;
      const language = req.query.language as string || 'en';

      if (!query) {
        res.status(400).json(createErrorResponse(
          'VALIDATION_ERROR',
          'Search query is required',
          req.headers['x-request-id'] as string
        ));
        return;
      }

      const faqs = await this.helpService.searchFAQs(query, language);

      res.json(createSuccessResponse({
        faqs,
        total: faqs.length,
        query
      }));
    } catch (error: any) {
      logger.error('Error searching FAQs:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to search FAQs',
        req.headers['x-request-id'] as string
      ));
    }
  };

  // Get support statistics (for the stats widget)
  getSupportStats = async (req: Request, res: Response): Promise<void> => {
    try {
      // Static stats for now - in a real app these would come from your support system
      const stats = {
        averageResponseTime: '2 hours',
        resolutionRate: '98%',
        customerSatisfaction: '4.9/5',
        totalTickets: 0, // Would come from support ticket counts
        resolvedTickets: 0,
        pendingTickets: 0
      };

      res.json(createSuccessResponse(stats));
    } catch (error: any) {
      logger.error('Error getting support stats:', error);
      res.status(500).json(createErrorResponse(
        'HELP_ERROR',
        error.message || 'Failed to get support statistics',
        req.headers['x-request-id'] as string
      ));
    }
  };
}