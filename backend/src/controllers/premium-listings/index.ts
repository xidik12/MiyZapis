import { Request, Response } from 'express';
import { PremiumListingService } from '../../services/premium-listing';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';

export class PremiumListingController {
  /**
   * POST /api/v1/premium-listings
   * Create a premium listing
   */
  static async createPremiumListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { type, category, location, boostMultiplier, priority, price, billingType, startDate, duration } =
        req.body;

      // Validation
      if (!type || !price || !billingType || !startDate || !duration) {
        return res.status(400).json(createErrorResponse('Missing required fields'));
      }

      const listing = await PremiumListingService.createPremiumListing({
        specialistId: userId,
        type,
        category,
        location,
        boostMultiplier,
        priority,
        price,
        billingType,
        startDate: new Date(startDate),
        duration,
      });

      return res.status(201).json(
        createSuccessResponse({ listing }, { message: 'Premium listing created successfully' })
      );
    } catch (error: any) {
      console.error('Create premium listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to create premium listing'));
    }
  }

  /**
   * GET /api/v1/premium-listings/:id
   * Get premium listing by ID
   */
  static async getPremiumListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const listing = await PremiumListingService.getPremiumListingById(id, userId);

      if (!listing) {
        return res.status(404).json(createErrorResponse('Premium listing not found'));
      }

      return res.status(200).json(createSuccessResponse({ listing }));
    } catch (error: any) {
      console.error('Get premium listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get premium listing'));
    }
  }

  /**
   * GET /api/v1/premium-listings
   * Get all premium listings for current specialist
   */
  static async getMyPremiumListings(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { status, skip, limit } = req.query;

      const result = await PremiumListingService.getSpecialistListings(userId, {
        status: status as string,
        skip: skip ? parseInt(skip as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json(
        createSuccessResponse({
          listings: result.listings,
          total: result.total,
        })
      );
    } catch (error: any) {
      console.error('Get my premium listings error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get premium listings'));
    }
  }

  /**
   * GET /api/v1/premium-listings/active
   * Get active premium listings (for search results)
   */
  static async getActivePremiumListings(req: Request, res: Response) {
    try {
      const { category, location, limit } = req.query;

      const listings = await PremiumListingService.getActivePremiumListings({
        category: category as string,
        location: location as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json(createSuccessResponse({ listings }));
    } catch (error: any) {
      console.error('Get active premium listings error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get active listings'));
    }
  }

  /**
   * GET /api/v1/premium-listings/check/:specialistId
   * Check if specialist has active premium listing
   */
  static async checkActiveListing(req: Request, res: Response) {
    try {
      const { specialistId } = req.params;
      const { category } = req.query;

      const hasActive = await PremiumListingService.hasActivePremiumListing(
        specialistId,
        category as string | undefined
      );

      return res.status(200).json(createSuccessResponse({ hasActivePremiumListing: hasActive }));
    } catch (error: any) {
      console.error('Check active listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to check active listing'));
    }
  }

  /**
   * POST /api/v1/premium-listings/:id/impression
   * Track impression
   */
  static async trackImpression(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await PremiumListingService.trackImpression(id);

      return res.status(200).json(createSuccessResponse(null, { message: 'Impression tracked' }));
    } catch (error: any) {
      console.error('Track impression error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track impression'));
    }
  }

  /**
   * POST /api/v1/premium-listings/:id/click
   * Track click
   */
  static async trackClick(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await PremiumListingService.trackClick(id);

      return res.status(200).json(createSuccessResponse(null, { message: 'Click tracked' }));
    } catch (error: any) {
      console.error('Track click error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track click'));
    }
  }

  /**
   * POST /api/v1/premium-listings/:id/conversion
   * Track conversion (booking)
   */
  static async trackConversion(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { bookingAmount } = req.body;

      await PremiumListingService.trackConversion(id, bookingAmount || 0);

      return res.status(200).json(createSuccessResponse(null, { message: 'Conversion tracked' }));
    } catch (error: any) {
      console.error('Track conversion error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track conversion'));
    }
  }

  /**
   * GET /api/v1/premium-listings/:id/analytics
   * Get premium listing analytics
   */
  static async getAnalytics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const period =
        startDate && endDate
          ? {
              startDate: new Date(startDate as string),
              endDate: new Date(endDate as string),
            }
          : undefined;

      const analytics = await PremiumListingService.getAnalytics(id, userId, period);

      return res.status(200).json(createSuccessResponse({ analytics }));
    } catch (error: any) {
      console.error('Get analytics error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get analytics'));
    }
  }

  /**
   * PATCH /api/v1/premium-listings/:id/toggle
   * Pause/Resume premium listing
   */
  static async toggleListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { pause } = req.body;

      const listing = await PremiumListingService.toggleListing(id, userId, pause);

      return res.status(200).json(
        createSuccessResponse(
          { listing },
          { message: pause ? 'Premium listing paused' : 'Premium listing resumed' }
        )
      );
    } catch (error: any) {
      console.error('Toggle listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to toggle listing'));
    }
  }

  /**
   * POST /api/v1/premium-listings/:id/renew
   * Renew premium listing
   */
  static async renewListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { duration } = req.body;

      if (!duration) {
        return res.status(400).json(createErrorResponse('Duration is required'));
      }

      const listing = await PremiumListingService.renewListing(id, userId, duration);

      return res.status(200).json(
        createSuccessResponse({ listing }, { message: 'Premium listing renewed successfully' })
      );
    } catch (error: any) {
      console.error('Renew listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to renew listing'));
    }
  }

  /**
   * DELETE /api/v1/premium-listings/:id
   * Cancel premium listing
   */
  static async cancelListing(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;

      await PremiumListingService.cancelListing(id, userId);

      return res.status(200).json(
        createSuccessResponse(null, { message: 'Premium listing cancelled successfully' })
      );
    } catch (error: any) {
      console.error('Cancel listing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to cancel listing'));
    }
  }

  /**
   * GET /api/v1/premium-listings/pricing
   * Get premium listing pricing
   */
  static async getPricing(req: Request, res: Response) {
    try {
      const pricing = PremiumListingService.getPricing();

      return res.status(200).json(createSuccessResponse({ pricing }));
    } catch (error: any) {
      console.error('Get pricing error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get pricing'));
    }
  }
}
