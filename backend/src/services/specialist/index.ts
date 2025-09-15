import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Specialist, User, Service } from '@prisma/client';
import { convertCurrency } from '@/utils/currency';

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
  // Detailed contact information for confirmed bookings
  preciseAddress?: string;
  businessPhone?: string;
  whatsappNumber?: string;
  locationNotes?: string;
  parkingInfo?: string;
  accessInstructions?: string;
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
  // Detailed contact information for confirmed bookings
  preciseAddress?: string;
  businessPhone?: string;
  whatsappNumber?: string;
  locationNotes?: string;
  parkingInfo?: string;
  accessInstructions?: string;
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

      // Allow customers to become specialists by creating a profile
      if (user.userType !== 'SPECIALIST' && user.userType !== 'CUSTOMER') {
        throw new Error('USER_NOT_ELIGIBLE_FOR_SPECIALIST');
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
          // Detailed contact information for confirmed bookings
          preciseAddress: data.preciseAddress,
          businessPhone: data.businessPhone,
          whatsappNumber: data.whatsappNumber,
          locationNotes: data.locationNotes,
          parkingInfo: data.parkingInfo,
          accessInstructions: data.accessInstructions,
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

      // Update user type to SPECIALIST if they were a CUSTOMER
      if (user.userType === 'CUSTOMER') {
        await prisma.user.update({
          where: { id: userId },
          data: { userType: 'SPECIALIST' }
        });
        logger.info('User type updated to SPECIALIST', { userId });
      }

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
          // Detailed contact information for confirmed bookings
          ...(data.preciseAddress !== undefined && { preciseAddress: data.preciseAddress }),
          ...(data.businessPhone !== undefined && { businessPhone: data.businessPhone }),
          ...(data.whatsappNumber !== undefined && { whatsappNumber: data.whatsappNumber }),
          ...(data.locationNotes !== undefined && { locationNotes: data.locationNotes }),
          ...(data.parkingInfo !== undefined && { parkingInfo: data.parkingInfo }),
          ...(data.accessInstructions !== undefined && { accessInstructions: data.accessInstructions }),
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
    // Enhanced analytics
    averageMonthlyRevenue: number;
    monthlyBookings: number;
    completionRate: number;
    profileViews: number;
    conversionRate: number;
    revenueTrend: any[];
    servicePerformance: any[];
    revenueByService: any[];
    reviewCount: number;
    monthlyGrowth: number;
    averageBookingValue: number;
    activeClients: number;
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

      // Get comprehensive data for analytics
      const [
        bookings, 
        recentBookings, 
        allTimeBookings, 
        reviews,
        services,
        monthlyData
      ] = await Promise.all([
        // Filtered bookings for the specified date range
        prisma.booking.findMany({
          where,
          select: {
            status: true,
            totalAmount: true,
            createdAt: true,
            scheduledAt: true,
            completedAt: true,
            customerId: true,
            service: {
              select: {
                currency: true,
              },
            },
          },
        }),
        // Recent bookings for display
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
        // All time bookings for trends and averages
        prisma.booking.findMany({
          where: {
            specialistId: specialist.userId,
          },
          select: {
            status: true,
            totalAmount: true,
            createdAt: true,
            completedAt: true,
            customerId: true,
            serviceId: true,
            service: {
              select: {
                currency: true,
              },
            },
          },
        }),
        // Reviews for rating analysis
        prisma.review.findMany({
          where: {
            specialist: {
              userId: specialist.userId
            }
          },
          select: {
            rating: true,
            createdAt: true,
          }
        }),
        // Services for performance analysis
        prisma.service.findMany({
          where: {
            specialistId: specialist.id,
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            basePrice: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
        }),
        // Monthly data for trends (last 12 months)
        prisma.booking.groupBy({
          by: ['createdAt'],
          where: {
            specialistId: specialist.userId,
            createdAt: {
              gte: new Date(new Date().setMonth(new Date().getMonth() - 12)),
            },
          },
          _count: {
            id: true,
          },
          _sum: {
            totalAmount: true,
          },
        }),
      ]);

      // Basic calculations
      const totalBookings = bookings.length;
      // Consider bookings that should count as "completed" for revenue purposes
      const revenueGeneratingStatuses = ['COMPLETED', 'CONFIRMED', 'IN_PROGRESS'];
      const completedBookings = bookings.filter(b => revenueGeneratingStatuses.includes(b.status)).length;
      const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;
      const totalRevenue = bookings
        .filter(b => revenueGeneratingStatuses.includes(b.status))
        .reduce((sum, b) => {
          // Convert booking amount to UAH base currency before summing
          const serviceCurrency = b.service?.currency || 'UAH';
          const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
          return sum + convertedAmount;
        }, 0);

      // Enhanced analytics calculations
      const allTimeCompleted = allTimeBookings.filter(b => revenueGeneratingStatuses.includes(b.status));
      const monthsInOperation = Math.max(1, Math.floor(
        (new Date().getTime() - new Date(specialist.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30)
      ));
      
      const averageMonthlyRevenue = allTimeCompleted.reduce((sum, b) => {
        const serviceCurrency = b.service?.currency || 'UAH';
        const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
        return sum + convertedAmount;
      }, 0) / monthsInOperation;
      const averageBookingValue = allTimeCompleted.length > 0 
        ? allTimeCompleted.reduce((sum, b) => {
            const serviceCurrency = b.service?.currency || 'UAH';
            const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
            return sum + convertedAmount;
          }, 0) / allTimeCompleted.length 
        : 0;
      
      // Current month calculations
      const currentMonth = new Date();
      const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthlyBookings = bookings.filter(b => {
        const bookingDate = new Date(b.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      }).length;

      // Completion rate
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Active clients (unique customers in last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const activeClients = new Set(
        allTimeBookings
          .filter(b => new Date(b.createdAt) >= threeMonthsAgo)
          .map(b => b.customerId)
      ).size;

      // Conversion rate (completed vs total bookings)
      const conversionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Monthly growth (current month vs previous month)
      const previousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);
      
      const currentMonthRevenue = bookings
        .filter(b => {
          const date = new Date(b.createdAt);
          return date >= monthStart && date <= monthEnd && revenueGeneratingStatuses.includes(b.status);
        })
        .reduce((sum, b) => {
          const serviceCurrency = b.service?.currency || 'UAH';
          const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
          return sum + convertedAmount;
        }, 0);
      
      const previousMonthRevenue = allTimeBookings
        .filter(b => {
          const date = new Date(b.createdAt);
          return date >= previousMonth && date <= previousMonthEnd && revenueGeneratingStatuses.includes(b.status);
        })
        .reduce((sum, b) => {
          const serviceCurrency = b.service?.currency || 'UAH';
          const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
          return sum + convertedAmount;
        }, 0);
      
      const monthlyGrowth = previousMonthRevenue > 0 
        ? ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
        : currentMonthRevenue > 0 ? 100 : 0;

      // Revenue trend (last 6 months)
      const revenueTrend = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        const monthRevenue = allTimeBookings
          .filter(b => {
            const bookingDate = new Date(b.createdAt);
            return bookingDate >= monthStart && bookingDate <= monthEnd && revenueGeneratingStatuses.includes(b.status);
          })
          .reduce((sum, b) => {
            const serviceCurrency = b.service?.currency || 'UAH';
            const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
            return sum + convertedAmount;
          }, 0);
        
        const monthBookings = allTimeBookings
          .filter(b => {
            const bookingDate = new Date(b.createdAt);
            return bookingDate >= monthStart && bookingDate <= monthEnd;
          }).length;
        
        revenueTrend.push({
          date: monthStart.toISOString().substring(0, 7), // YYYY-MM format
          revenue: monthRevenue,
          bookings: monthBookings,
        });
      }

      // Service performance
      const servicePerformance = await Promise.all(
        services.map(async (service) => {
          const serviceBookings = await prisma.booking.findMany({
            where: {
              serviceId: service.id,
            },
            select: {
              status: true,
              totalAmount: true,
              service: {
                select: {
                  currency: true,
                },
              },
            },
          });
          
          const completed = serviceBookings.filter(b => revenueGeneratingStatuses.includes(b.status));
          const revenue = completed.reduce((sum, b) => {
            const serviceCurrency = b.service?.currency || 'UAH';
            const convertedAmount = convertCurrency(b.totalAmount, serviceCurrency, 'UAH');
            return sum + convertedAmount;
          }, 0);
          
          return {
            serviceName: service.name,
            totalBookings: serviceBookings.length,
            completedBookings: completed.length,
            revenue,
            completionRate: serviceBookings.length > 0 ? (completed.length / serviceBookings.length) * 100 : 0,
          };
        })
      );

      // Revenue by service
      const revenueByService = servicePerformance.map(sp => ({
        serviceName: sp.serviceName,
        revenue: sp.revenue,
        percentage: totalRevenue > 0 ? (sp.revenue / totalRevenue) * 100 : 0,
      }));

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
        // Enhanced analytics
        averageMonthlyRevenue,
        monthlyBookings,
        completionRate,
        profileViews: 0, // TODO: Implement profile view tracking
        conversionRate,
        revenueTrend,
        servicePerformance,
        revenueByService,
        reviewCount: reviews.length,
        monthlyGrowth,
        averageBookingValue,
        activeClients,
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