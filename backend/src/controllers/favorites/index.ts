import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FavoritesService } from '@/services/favorites';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { AuthenticatedRequest } from '@/types';

const prisma = new PrismaClient();

export class FavoritesController {
  private favoritesService: FavoritesService;

  constructor() {
    this.favoritesService = new FavoritesService(prisma);
  }

  // Add specialist to favorites
  addSpecialistToFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { specialistId } = req.params;

      const result = await this.favoritesService.addSpecialistToFavorites(userId, specialistId);

      res.status(201).json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error adding specialist to favorites:', error);
      const statusCode = err.message.includes('not found') ? 404 : 
                        err.message.includes('already in favorites') || err.message.includes('Cannot add') ? 409 : 500;
      res.status(statusCode).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Add service to favorites
  addServiceToFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { serviceId } = req.params;

      const result = await this.favoritesService.addServiceToFavorites(userId, serviceId);

      res.status(201).json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error adding service to favorites:', error);
      const statusCode = err.message.includes('not found') ? 404 : 
                        err.message.includes('already in favorites') || err.message.includes('Cannot add') ? 409 : 500;
      res.status(statusCode).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Remove specialist from favorites
  removeSpecialistFromFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { specialistId } = req.params;

      const result = await this.favoritesService.removeSpecialistFromFavorites(userId, specialistId);

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error removing specialist from favorites:', error);
      const statusCode = err.message.includes('not in favorites') ? 404 : 500;
      res.status(statusCode).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Remove service from favorites
  removeServiceFromFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { serviceId } = req.params;

      const result = await this.favoritesService.removeServiceFromFavorites(userId, serviceId);

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error removing service from favorites:', error);
      const statusCode = err.message.includes('not in favorites') ? 404 : 500;
      res.status(statusCode).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get user's favorite specialists
  getFavoriteSpecialists = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.favoritesService.getFavoriteSpecialists(userId, page, limit);

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting favorite specialists:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get user's favorite services
  getFavoriteServices = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.favoritesService.getFavoriteServices(userId, page, limit);

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting favorite services:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get all user's favorites
  getAllFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const [specialists, services] = await Promise.all([
        this.favoritesService.getFavoriteSpecialists(userId, page, limit),
        this.favoritesService.getFavoriteServices(userId, page, limit)
      ]);

      const result = {
        specialists: specialists.specialists,
        services: services.services,
        pagination: {
          specialists: specialists.pagination,
          services: services.pagination
        }
      };

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting all favorites:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Check if specialist is in favorites
  checkSpecialistInFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { specialistId } = req.params;

      const isInFavorites = await this.favoritesService.isSpecialistInFavorites(userId, specialistId);

      res.json(createSuccessResponse({ isInFavorites }));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error checking specialist in favorites:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Check if service is in favorites
  checkServiceInFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;
      const { serviceId } = req.params;

      const isInFavorites = await this.favoritesService.isServiceInFavorites(userId, serviceId);

      res.json(createSuccessResponse({ isInFavorites }));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error checking service in favorites:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Get favorites count
  getFavoritesCount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const count = await this.favoritesService.getFavoritesCount(userId);

      res.json(createSuccessResponse(count));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error getting favorites count:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };

  // Clear all favorites
  clearAllFavorites = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user.id;

      const result = await this.favoritesService.clearAllFavorites(userId);

      res.json(createSuccessResponse(result));
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error clearing all favorites:', error);
      res.status(500).json(createErrorResponse('FAVORITES_ERROR', err.message, req.headers['x-request-id'] as string));
    }
  };
}