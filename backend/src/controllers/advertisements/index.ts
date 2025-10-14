import { Request, Response } from 'express';
import { AdvertisementService } from '../../services/advertisement';
import { createSuccessResponse, createErrorResponse } from '../../utils/response';

export class AdvertisementController {
  /**
   * POST /api/v1/advertisements
   * Create a new advertisement
   */
  static async createAdvertisement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const {
        type,
        placement,
        title,
        titleKh,
        description,
        descriptionKh,
        imageUrl,
        linkUrl,
        callToAction,
        targetCategories,
        targetLocations,
        targetUserType,
        dailyBudget,
        totalBudget,
        costPerClick,
        startDate,
        endDate,
      } = req.body;

      // Validation
      if (!type || !placement || !title || !description || !linkUrl || !startDate || !endDate) {
        return res.status(400).json(createErrorResponse('Missing required fields'));
      }

      const ad = await AdvertisementService.createAdvertisement({
        advertiserId: userId,
        type,
        placement,
        title,
        titleKh,
        description,
        descriptionKh,
        imageUrl,
        linkUrl,
        callToAction,
        targetCategories,
        targetLocations,
        targetUserType,
        dailyBudget,
        totalBudget,
        costPerClick,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });

      return res.status(201).json(
        createSuccessResponse({ advertisement: ad }, { message: 'Advertisement created successfully' })
      );
    } catch (error: any) {
      console.error('Create advertisement error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to create advertisement'));
    }
  }

  /**
   * GET /api/v1/advertisements/:id
   * Get advertisement by ID
   */
  static async getAdvertisement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      const ad = await AdvertisementService.getAdvertisementById(id, userId);

      if (!ad) {
        return res.status(404).json(createErrorResponse('Advertisement not found'));
      }

      return res.status(200).json(createSuccessResponse({ advertisement: ad }));
    } catch (error: any) {
      console.error('Get advertisement error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get advertisement'));
    }
  }

  /**
   * GET /api/v1/advertisements
   * Get all advertisements for current user
   */
  static async getMyAdvertisements(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { status, type, skip, limit } = req.query;

      const result = await AdvertisementService.getAdvertiserAds(userId, {
        status: status as string,
        type: type as string,
        skip: skip ? parseInt(skip as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json(
        createSuccessResponse({
          advertisements: result.ads,
          total: result.total,
        })
      );
    } catch (error: any) {
      console.error('Get my advertisements error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get advertisements'));
    }
  }

  /**
   * GET /api/v1/advertisements/public
   * Get active advertisements for display (public)
   */
  static async getPublicAdvertisements(req: Request, res: Response) {
    try {
      const { type, placement, category, location, limit } = req.query;

      const ads = await AdvertisementService.getActiveAds({
        type: type as any,
        placement: placement as any,
        category: category as string,
        location: location as string,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json(createSuccessResponse({ advertisements: ads }));
    } catch (error: any) {
      console.error('Get public advertisements error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get advertisements'));
    }
  }

  /**
   * PATCH /api/v1/advertisements/:id
   * Update advertisement
   */
  static async updateAdvertisement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const updateData = req.body;

      const ad = await AdvertisementService.updateAdvertisement(id, userId, updateData);

      return res.status(200).json(
        createSuccessResponse({ advertisement: ad }, { message: 'Advertisement updated successfully' })
      );
    } catch (error: any) {
      console.error('Update advertisement error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to update advertisement'));
    }
  }

  /**
   * DELETE /api/v1/advertisements/:id
   * Delete advertisement
   */
  static async deleteAdvertisement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;

      await AdvertisementService.deleteAdvertisement(id, userId);

      return res.status(200).json(
        createSuccessResponse(null, { message: 'Advertisement deleted successfully' })
      );
    } catch (error: any) {
      console.error('Delete advertisement error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to delete advertisement'));
    }
  }

  /**
   * POST /api/v1/advertisements/:id/impression
   * Track ad impression
   */
  static async trackImpression(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await AdvertisementService.trackImpression(id);

      return res.status(200).json(createSuccessResponse(null, { message: 'Impression tracked' }));
    } catch (error: any) {
      console.error('Track impression error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track impression'));
    }
  }

  /**
   * POST /api/v1/advertisements/:id/click
   * Track ad click
   */
  static async trackClick(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await AdvertisementService.trackClick(id);

      return res.status(200).json(createSuccessResponse(null, { message: 'Click tracked' }));
    } catch (error: any) {
      console.error('Track click error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track click'));
    }
  }

  /**
   * POST /api/v1/advertisements/:id/conversion
   * Track ad conversion
   */
  static async trackConversion(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await AdvertisementService.trackConversion(id);

      return res.status(200).json(createSuccessResponse(null, { message: 'Conversion tracked' }));
    } catch (error: any) {
      console.error('Track conversion error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to track conversion'));
    }
  }

  /**
   * GET /api/v1/advertisements/:id/analytics
   * Get advertisement analytics
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

      const analytics = await AdvertisementService.getAnalytics(id, userId, period);

      return res.status(200).json(createSuccessResponse({ analytics }));
    } catch (error: any) {
      console.error('Get analytics error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to get analytics'));
    }
  }

  /**
   * PATCH /api/v1/advertisements/:id/toggle
   * Pause/Resume advertisement
   */
  static async toggleAdvertisement(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json(createErrorResponse('Unauthorized'));
      }

      const { id } = req.params;
      const { pause } = req.body;

      const ad = await AdvertisementService.toggleAdvertisement(id, userId, pause);

      return res.status(200).json(
        createSuccessResponse(
          { advertisement: ad },
          { message: pause ? 'Advertisement paused' : 'Advertisement resumed' }
        )
      );
    } catch (error: any) {
      console.error('Toggle advertisement error:', error);
      return res.status(500).json(createErrorResponse(error.message || 'Failed to toggle advertisement'));
    }
  }
}
