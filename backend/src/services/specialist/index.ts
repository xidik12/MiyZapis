import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Specialist, User, Service } from '@prisma/client';

interface CreateSpecialistData {
  businessName?: string;
  bio?: string;
  bioUk?: string;
  bioRu?: string;
  education?: string;
  educationUk?: string;
  educationRu?: string;
  specialties: string[];
  experience?: number;
  languages?: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  workingHours?: Record<string, any>;
  paymentMethods?: string[];
  serviceArea?: Record<string, any>;
  notifications?: Record<string, any>;
  privacy?: Record<string, any>;
  socialMedia?: Record<string, any>;
  portfolioImages?: string[];
  certifications?: string[];
  autoBooking?: boolean;
}

interface UpdateSpecialistData {
  businessName?: string;
  bio?: string;
  bioUk?: string;
  bioRu?: string;
  education?: string;
  educationUk?: string;
  educationRu?: string;
  specialties?: string[];
  experience?: number;
  languages?: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  workingHours?: Record<string, any>;
  paymentMethods?: string[];
  serviceArea?: Record<string, any>;
  notifications?: Record<string, any>;
  privacy?: Record<string, any>;
  socialMedia?: Record<string, any>;
  portfolioImages?: string[];
  certifications?: string[];
  autoBooking?: boolean;
}

interface SpecialistWithUser extends Specialist {
  user: Omit<User, 'password'>;
  services: Service[];
  _count: {
    services: number;
  };
}

export class SpecialistService {
  private static getDefaultWorkingHours() {
    return {
      monday: { isWorking: true, start: '09:00', end: '17:00' },
      tuesday: { isWorking: true, start: '09:00', end: '17:00' },
      wednesday: { isWorking: true, start: '09:00', end: '17:00' },
      thursday: { isWorking: true, start: '09:00', end: '17:00' },
      friday: { isWorking: true, start: '09:00', end: '17:00' },
      saturday: { isWorking: false, start: '09:00', end: '17:00' },
      sunday: { isWorking: false, start: '09:00', end: '17:00' }
    };
  }

  private static parseJsonField<T>(field: string | null, defaultValue: T): T {
    if (!field) return defaultValue;
    try {
      return JSON.parse(field) as T;
    } catch (error) {
      logger.warn('Failed to parse JSON field', { field, error });
      return defaultValue;
    }
  }
  // Create specialist profile
  static async createProfile(
    userId: string,
    data: CreateSpecialistData
  ): Promise<SpecialistWithUser> {
    try {
      // Check if user exists and is a specialist
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.userType !== 'SPECIALIST') {
        throw new Error('USER_NOT_SPECIALIST');
      }

      // Check if specialist profile already exists
      const existingSpecialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (existingSpecialist) {
        throw new Error('SPECIALIST_PROFILE_EXISTS');
      }

      // Create specialist profile
      const specialist = await prisma.specialist.create({
        data: {
          userId,
          businessName: data.businessName || `${user.firstName} ${user.lastName}`,
          bio: data.bio || '',
          bioUk: data.bioUk,
          bioRu: data.bioRu,
          education: data.education,
          educationUk: data.educationUk,
          educationRu: data.educationRu,
          specialties: JSON.stringify(data.specialties || []),
          experience: data.experience || 0,
          languages: JSON.stringify(data.languages || []),
          address: data.address,
          city: data.city,
          state: data.state,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          timezone: data.timezone || user.timezone,
          workingHours: JSON.stringify(data.workingHours || SpecialistService.getDefaultWorkingHours()),
          paymentMethods: JSON.stringify(data.paymentMethods || []),
          serviceArea: JSON.stringify(data.serviceArea || {}),
          notifications: JSON.stringify(data.notifications || {}),
          privacy: JSON.stringify(data.privacy || {}),
          socialMedia: JSON.stringify(data.socialMedia || {}),
          portfolioImages: JSON.stringify(data.portfolioImages || []),
          certifications: JSON.stringify(data.certifications || []),
          autoBooking: data.autoBooking ?? false,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          services: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
      });

      logger.info('Specialist profile created successfully', { 
        userId, 
        specialistId: specialist.id 
      });

      // Generate initial availability blocks from working hours
      try {
        const { AvailabilityService } = await import('./availability');
        await AvailabilityService.generateAvailabilityFromWorkingHours(specialist.id);
        logger.info('Initial availability blocks generated', {
          specialistId: specialist.id
        });
      } catch (availabilityError) {
        logger.warn('Failed to generate initial availability blocks:', availabilityError);
        // Don't throw error as profile creation was successful
      }

      return specialist as SpecialistWithUser;
    } catch (error) {
      logger.error('Error creating specialist profile:', error);
      throw error;
    }
  }

  // Update specialist profile
  static async updateProfile(
    userId: string,
    data: UpdateSpecialistData
  ): Promise<SpecialistWithUser> {
    try {
      // Debug logging to see what data is being saved
      logger.info('🔄 Updating specialist profile', {
        userId,
        fieldsPresent: Object.keys(data),
        bio: data.bio,
        bioUk: data.bioUk,
        bioRu: data.bioRu,
        city: data.city,
        state: data.state,
        country: data.country,
        portfolioImages: data.portfolioImages ? (Array.isArray(data.portfolioImages) ? `Array[${data.portfolioImages.length}]` : typeof data.portfolioImages) : null
      });
      // Use transaction to ensure atomicity
      const result = await prisma.$transaction(async (tx) => {
        // Find specialist by userId
        const specialist = await tx.specialist.findUnique({
          where: { userId },
        });

        if (!specialist) {
          throw new Error('SPECIALIST_NOT_FOUND');
        }

        // Update specialist profile
        const updatedSpecialist = await tx.specialist.update({
        where: { userId },
        data: {
          ...(data.businessName && { businessName: data.businessName }),
          ...(data.bio !== undefined && { bio: data.bio }),
          ...(data.bioUk !== undefined && { bioUk: data.bioUk }),
          ...(data.bioRu !== undefined && { bioRu: data.bioRu }),
          ...(data.education !== undefined && { education: data.education }),
          ...(data.educationUk !== undefined && { educationUk: data.educationUk }),
          ...(data.educationRu !== undefined && { educationRu: data.educationRu }),
          ...(data.specialties && { specialties: JSON.stringify(data.specialties) }),
          ...(data.experience !== undefined && { experience: data.experience }),
          ...(data.languages && { languages: JSON.stringify(data.languages) }),
          ...(data.address !== undefined && { address: data.address }),
          ...(data.city !== undefined && { city: data.city }),
          ...(data.state !== undefined && { state: data.state }),
          ...(data.country !== undefined && { country: data.country }),
          ...(data.latitude !== undefined && { latitude: data.latitude }),
          ...(data.longitude !== undefined && { longitude: data.longitude }),
          ...(data.timezone && { timezone: data.timezone }),
          ...(data.workingHours && { workingHours: JSON.stringify(data.workingHours) }),
          ...(data.paymentMethods && { paymentMethods: JSON.stringify(data.paymentMethods) }),
          ...(data.serviceArea && { serviceArea: JSON.stringify(data.serviceArea) }),
          ...(data.notifications && { notifications: JSON.stringify(data.notifications) }),
          ...(data.privacy && { privacy: JSON.stringify(data.privacy) }),
          ...(data.socialMedia && { socialMedia: JSON.stringify(data.socialMedia) }),
          ...(data.portfolioImages && { portfolioImages: JSON.stringify(data.portfolioImages) }),
          ...(data.certifications && { certifications: JSON.stringify(data.certifications) }),
          ...(data.autoBooking !== undefined && { autoBooking: data.autoBooking }),
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          services: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
        });

        return updatedSpecialist as SpecialistWithUser;
      });

      // Debug logging to see what was actually saved
      logger.info('✅ Specialist profile updated in database', {
        specialistId: result.id,
        userId,
        savedFields: {
          bio: result.bio,
          bioUk: result.bioUk,
          bioRu: result.bioRu,
          city: result.city,
          state: result.state,
          country: result.country,
          portfolioImages: result.portfolioImages,
          specialties: result.specialties
        }
      });

      // If working hours were updated, regenerate availability blocks
      if (data.workingHours) {
        try {
          const { AvailabilityService } = await import('./availability');
          await AvailabilityService.generateAvailabilityFromWorkingHours(result.id);
          logger.info('Availability blocks regenerated from updated working hours', {
            specialistId: result.id
          });
        } catch (availabilityError) {
          logger.warn('Failed to regenerate availability blocks:', availabilityError);
          // Don't throw error as profile update was successful
        }
      }

      logger.info('Specialist profile updated successfully', { 
        userId, 
        specialistId: result.id 
      });

      return result;
    } catch (error) {
      logger.error('Error updating specialist profile:', error);
      throw error;
    }
  }

  // Get specialist profile by userId
  static async getProfileByUserId(userId: string): Promise<SpecialistWithUser> {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          services: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              services: true,
            },
          },
        },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      // Parse JSON fields for frontend consumption
      const parsedSpecialist = {
        ...specialist,
        specialties: SpecialistService.parseJsonField(specialist.specialties, []),
        languages: SpecialistService.parseJsonField(specialist.languages, []),
        workingHours: SpecialistService.parseJsonField(specialist.workingHours, {}),
        paymentMethods: SpecialistService.parseJsonField(specialist.paymentMethods, []),
        serviceArea: SpecialistService.parseJsonField(specialist.serviceArea, {}),
        notifications: SpecialistService.parseJsonField(specialist.notifications, {}),
        privacy: SpecialistService.parseJsonField(specialist.privacy, {}),
        socialMedia: SpecialistService.parseJsonField(specialist.socialMedia, {}),
        portfolioImages: SpecialistService.parseJsonField(specialist.portfolioImages, []),
        certifications: SpecialistService.parseJsonField(specialist.certifications, []),
      };

      return parsedSpecialist as SpecialistWithUser;
    } catch (error) {
      logger.error('Error getting specialist profile:', error);
      throw error;
    }
  }

  // Get specialist profile by specialistId
  static async getProfile(specialistId: string): Promise<SpecialistWithUser> {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          services: {
            where: { isActive: true },
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              services: true,
            },
          },
        },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      // Parse JSON fields for frontend consumption
      const parsedSpecialist = {
        ...specialist,
        specialties: SpecialistService.parseJsonField(specialist.specialties, []),
        languages: SpecialistService.parseJsonField(specialist.languages, []),
        workingHours: SpecialistService.parseJsonField(specialist.workingHours, {}),
        paymentMethods: SpecialistService.parseJsonField(specialist.paymentMethods, []),
        serviceArea: SpecialistService.parseJsonField(specialist.serviceArea, {}),
        notifications: SpecialistService.parseJsonField(specialist.notifications, {}),
        privacy: SpecialistService.parseJsonField(specialist.privacy, {}),
        socialMedia: SpecialistService.parseJsonField(specialist.socialMedia, {}),
        portfolioImages: SpecialistService.parseJsonField(specialist.portfolioImages, []),
        certifications: SpecialistService.parseJsonField(specialist.certifications, []),
      };

      return parsedSpecialist as SpecialistWithUser;
    } catch (error) {
      logger.error('Error getting specialist profile:', error);
      throw error;
    }
  }

  // Search specialists with filters
  static async searchSpecialists(
    query?: string,
    specialties?: string[],
    city?: string,
    minRating?: number,
    sortBy: 'rating' | 'reviews' | 'newest' = 'rating',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    specialists: SpecialistWithUser[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        user: {
          isActive: true,
        },
      };

      if (query) {
        where.OR = [
          { businessName: { contains: query } },
          { bio: { contains: query } },
          { user: { firstName: { contains: query } } },
          { user: { lastName: { contains: query } } },
        ];
      }

      if (specialties && specialties.length > 0) {
        // For SQLite, we need to use a different approach for JSON contains
        // This is a simplified version - in production, consider using full-text search
        where.specialties = {
          contains: specialties[0], // Search for first specialty
        };
      }

      if (city) {
        where.city = { contains: city };
      }

      if (minRating) {
        where.rating = { gte: minRating };
      }

      let orderBy: any = {};
      switch (sortBy) {
        case 'rating':
          orderBy = { rating: 'desc' };
          break;
        case 'reviews':
          orderBy = { reviewCount: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { rating: 'desc' };
      }

      const [rawSpecialists, total] = await Promise.all([
        prisma.specialist.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                avatar: true,
                userType: true,
                phoneNumber: true,
                isEmailVerified: true,
                isPhoneVerified: true,
                isActive: true,
                loyaltyPoints: true,
                language: true,
                currency: true,
                timezone: true,
                createdAt: true,
                updatedAt: true,
              },
            },
            services: {
              where: { isActive: true },
              take: 3, // Show only first 3 services in search results
              orderBy: { createdAt: 'desc' },
            },
            _count: {
              select: {
                services: true,
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.specialist.count({ where }),
      ]);

      // Parse JSON fields for each specialist in search results
      const specialists = rawSpecialists.map(specialist => ({
        ...specialist,
        specialties: SpecialistService.parseJsonField(specialist.specialties, []),
        languages: SpecialistService.parseJsonField(specialist.languages, []),
        workingHours: SpecialistService.parseJsonField(specialist.workingHours, {}),
        paymentMethods: SpecialistService.parseJsonField(specialist.paymentMethods, []),
        serviceArea: SpecialistService.parseJsonField(specialist.serviceArea, {}),
        notifications: SpecialistService.parseJsonField(specialist.notifications, {}),
        privacy: SpecialistService.parseJsonField(specialist.privacy, {}),
        socialMedia: SpecialistService.parseJsonField(specialist.socialMedia, {}),
        portfolioImages: SpecialistService.parseJsonField(specialist.portfolioImages, []),
        certifications: SpecialistService.parseJsonField(specialist.certifications, []),
      }));

      const totalPages = Math.ceil(total / limit);

      return {
        specialists: specialists as SpecialistWithUser[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error searching specialists:', error);
      throw error;
    }
  }

  // Get specialist analytics
  static async getAnalytics(
    specialistId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<{
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    totalRevenue: number;
    averageRating: number;
    responseTime: number;
    recentBookings: any[];
  }> {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      const where: any = {
        specialistId: specialist.userId,
      };

      if (startDate && endDate) {
        where.createdAt = {
          gte: startDate,
          lte: endDate,
        };
      }

      const [bookings, recentBookings] = await Promise.all([
        prisma.booking.findMany({
          where,
          select: {
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        }),
        prisma.booking.findMany({
          where: {
            specialistId: specialist.userId,
          },
          include: {
            customer: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
            service: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
      const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
      const totalRevenue = bookings
        .filter(b => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + b.totalAmount, 0);

      return {
        totalBookings,
        completedBookings,
        cancelledBookings,
        totalRevenue,
        averageRating: specialist.rating,
        responseTime: specialist.responseTime,
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          customerName: `${booking.customer.firstName} ${booking.customer.lastName}`,
          customerAvatar: booking.customer.avatar,
          serviceName: booking.service.name,
          status: booking.status,
          scheduledAt: booking.scheduledAt,
          totalAmount: booking.totalAmount,
          createdAt: booking.createdAt,
        })),
      };
    } catch (error) {
      logger.error('Error getting specialist analytics:', error);
      throw error;
    }
  }

  // Update specialist rating (called after review)
  static async updateRating(specialistId: string): Promise<void> {
    try {
      const reviews = await prisma.review.findMany({
        where: { specialistId },
        select: { rating: true },
      });

      if (reviews.length === 0) return;

      const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
      const reviewCount = reviews.length;

      await prisma.specialist.update({
        where: { id: specialistId },
        data: {
          rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
          reviewCount,
          updatedAt: new Date(),
        },
      });

      logger.info('Specialist rating updated', { 
        specialistId, 
        averageRating, 
        reviewCount 
      });
    } catch (error) {
      logger.error('Error updating specialist rating:', error);
      throw error;
    }
  }

  // Toggle specialist verification status (admin only)
  static async toggleVerification(specialistId: string): Promise<SpecialistWithUser> {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      const updatedSpecialist = await prisma.specialist.update({
        where: { id: specialistId },
        data: {
          isVerified: !specialist.isVerified,
          updatedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
              phoneNumber: true,
              isEmailVerified: true,
              isPhoneVerified: true,
              isActive: true,
              loyaltyPoints: true,
              language: true,
              currency: true,
              timezone: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          services: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
      });

      logger.info('Specialist verification toggled', { 
        specialistId, 
        isVerified: updatedSpecialist.isVerified 
      });

      return updatedSpecialist as SpecialistWithUser;
    } catch (error) {
      logger.error('Error toggling specialist verification:', error);
      throw error;
    }
  }
}