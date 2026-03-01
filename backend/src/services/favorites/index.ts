import { PrismaClient, User, Specialist, Service } from '@prisma/client';
import { logger } from '@/utils/logger';

interface FavoriteSpecialist {
  id: string;
  userId: string;
  specialistId: string;
  createdAt: Date;
  specialist: {
    id: string;
    userId: string;
    businessName: string | null;
    description: string | null;
    specialties: string[];
    experience: number | null;
    rating: number | null;
    reviewCount: number;
    isVerified: boolean;
    location: Record<string, unknown>;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      avatar: string | null;
    };
  };
}

interface FavoriteService {
  id: string;
  userId: string;
  serviceId: string;
  createdAt: Date;
  service: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    duration: number;
    category: string;
    isActive: boolean;
    specialist: {
      id: string;
      businessName: string | null;
      user: {
        id: string;
        firstName: string;
        lastName: string;
      };
    };
  };
}

export class FavoritesService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Add specialist to favorites
  async addSpecialistToFavorites(userId: string, specialistId: string): Promise<{ message: string; favorite: Record<string, unknown> }> {
    try {
      // Check if specialist exists
      const specialist = await this.prisma.specialist.findUnique({
        where: { id: specialistId },
        include: { user: true }
      });

      if (!specialist) {
        throw new Error('Specialist not found');
      }

      // Check if user is trying to favorite themselves
      if (specialist.userId === userId) {
        throw new Error('Cannot add yourself to favorites');
      }

      // Check if already in favorites
      const existingFavorite = await this.prisma.favoriteSpecialist.findFirst({
        where: {
          userId,
          specialistId
        }
      });

      if (existingFavorite) {
        throw new Error('Specialist is already in favorites');
      }

      // Add to favorites
      const favorite = await this.prisma.favoriteSpecialist.create({
        data: {
          userId,
          specialistId
        },
        include: {
          specialist: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true
                }
              }
            }
          }
        }
      });

      logger.info('Specialist added to favorites', { userId, specialistId });

      return {
        message: 'Specialist added to favorites successfully',
        favorite
      };
    } catch (error) {
      logger.error('Error adding specialist to favorites:', error);
      throw error;
    }
  }

  // Add service to favorites
  async addServiceToFavorites(userId: string, serviceId: string): Promise<{ message: string; favorite: Record<string, unknown> }> {
    try {
      // Check if service exists
      const service = await this.prisma.service.findUnique({
        where: { id: serviceId },
        include: { 
          specialist: {
            include: {
              user: true
            }
          }
        }
      });

      if (!service) {
        throw new Error('Service not found');
      }

      // Check if user is trying to favorite their own service
      if (service.specialist.userId === userId) {
        throw new Error('Cannot add your own service to favorites');
      }

      // Check if already in favorites
      const existingFavorite = await this.prisma.favoriteService.findFirst({
        where: {
          userId,
          serviceId
        }
      });

      if (existingFavorite) {
        throw new Error('Service is already in favorites');
      }

      // Add to favorites
      const favorite = await this.prisma.favoriteService.create({
        data: {
          userId,
          serviceId
        },
        include: {
          service: {
            include: {
              specialist: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      avatar: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      logger.info('Service added to favorites', { userId, serviceId });

      return {
        message: 'Service added to favorites successfully',
        favorite
      };
    } catch (error) {
      logger.error('Error adding service to favorites:', error);
      throw error;
    }
  }

  // Remove specialist from favorites
  async removeSpecialistFromFavorites(userId: string, specialistId: string): Promise<{ message: string }> {
    try {
      const favorite = await this.prisma.favoriteSpecialist.findFirst({
        where: {
          userId,
          specialistId
        }
      });

      if (!favorite) {
        throw new Error('Specialist is not in favorites');
      }

      await this.prisma.favoriteSpecialist.delete({
        where: { id: favorite.id }
      });

      logger.info('Specialist removed from favorites', { userId, specialistId });

      return {
        message: 'Specialist removed from favorites successfully'
      };
    } catch (error) {
      logger.error('Error removing specialist from favorites:', error);
      throw error;
    }
  }

  // Remove service from favorites
  async removeServiceFromFavorites(userId: string, serviceId: string): Promise<{ message: string }> {
    try {
      const favorite = await this.prisma.favoriteService.findFirst({
        where: {
          userId,
          serviceId
        }
      });

      if (!favorite) {
        throw new Error('Service is not in favorites');
      }

      await this.prisma.favoriteService.delete({
        where: { id: favorite.id }
      });

      logger.info('Service removed from favorites', { userId, serviceId });

      return {
        message: 'Service removed from favorites successfully'
      };
    } catch (error) {
      logger.error('Error removing service from favorites:', error);
      throw error;
    }
  }

  // Get user's favorite specialists
  async getFavoriteSpecialists(userId: string, page: number = 1, limit: number = 20): Promise<{
    specialists: FavoriteSpecialist[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const offset = (page - 1) * limit;

      const [specialists, total] = await Promise.all([
        this.prisma.favoriteSpecialist.findMany({
          where: { userId },
          include: {
            specialist: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    avatar: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.favoriteSpecialist.count({
          where: { userId }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        specialists: specialists as FavoriteSpecialist[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting favorite specialists:', error);
      throw error;
    }
  }

  // Get user's favorite services
  async getFavoriteServices(userId: string, page: number = 1, limit: number = 20): Promise<{
    services: FavoriteService[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  }> {
    try {
      const offset = (page - 1) * limit;

      const [services, total] = await Promise.all([
        this.prisma.favoriteService.findMany({
          where: { userId },
          include: {
            service: {
              include: {
                specialist: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true
                      }
                    }
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit
        }),
        this.prisma.favoriteService.count({
          where: { userId }
        })
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        services: services as FavoriteService[],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting favorite services:', error);
      throw error;
    }
  }

  // Check if specialist is in user's favorites
  async isSpecialistInFavorites(userId: string, specialistId: string): Promise<boolean> {
    try {
      const favorite = await this.prisma.favoriteSpecialist.findFirst({
        where: {
          userId,
          specialistId
        }
      });

      return !!favorite;
    } catch (error) {
      logger.error('Error checking if specialist is in favorites:', error);
      return false;
    }
  }

  // Check if service is in user's favorites
  async isServiceInFavorites(userId: string, serviceId: string): Promise<boolean> {
    try {
      const favorite = await this.prisma.favoriteService.findFirst({
        where: {
          userId,
          serviceId
        }
      });

      return !!favorite;
    } catch (error) {
      logger.error('Error checking if service is in favorites:', error);
      return false;
    }
  }

  // Get user's favorites count
  async getFavoritesCount(userId: string): Promise<{ specialists: number; services: number }> {
    try {
      const [specialistsCount, servicesCount] = await Promise.all([
        this.prisma.favoriteSpecialist.count({
          where: { userId }
        }),
        this.prisma.favoriteService.count({
          where: { userId }
        })
      ]);

      return {
        specialists: specialistsCount,
        services: servicesCount
      };
    } catch (error) {
      logger.error('Error getting favorites count:', error);
      throw error;
    }
  }

  // Clear all user's favorites
  async clearAllFavorites(userId: string): Promise<{ message: string }> {
    try {
      await Promise.all([
        this.prisma.favoriteSpecialist.deleteMany({
          where: { userId }
        }),
        this.prisma.favoriteService.deleteMany({
          where: { userId }
        })
      ]);

      logger.info('All favorites cleared for user', { userId });

      return {
        message: 'All favorites cleared successfully'
      };
    } catch (error) {
      logger.error('Error clearing all favorites:', error);
      throw error;
    }
  }
}