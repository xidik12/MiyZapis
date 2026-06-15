import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { Service, Specialist, User } from '@prisma/client';

interface CreateServiceData {
  name: string;
  description: string;
  category: string;
  basePrice: number;
  currency?: string;
  duration: number;
  prepTime?: number;
  cleanupTime?: number;
  rebookCycleDays?: number;
  requirements?: string[];
  deliverables?: string[];
  images?: string[];
  isActive?: boolean;
  requiresApproval?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
  serviceLocation?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
  // Group Session Settings
  isGroupSession?: boolean;
  maxParticipants?: number | null;
  minParticipants?: number;
  // Loyalty Points pricing
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  // Service Discounts
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
  // No-show protection — deposit & cancellation policy.
  // NOTE: This is the POLICY layer only. The platform has no live payment
  // processing yet, so these values are recorded/computed on bookings but no
  // card is ever charged. A future payments module will collect them.
  requireDeposit?: boolean;
  depositType?: string | null;   // 'PERCENT' | 'FIXED'
  depositValue?: number;
  cancellationWindowHours?: number; // free-cancel cutoff before start
  noShowFeeType?: string | null; // 'PERCENT' | 'FIXED'
  noShowFeeValue?: number;
}

interface UpdateServiceData {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  currency?: string;
  duration?: number;
  prepTime?: number;
  cleanupTime?: number;
  rebookCycleDays?: number;
  requirements?: string[];
  deliverables?: string[];
  images?: string[];
  isActive?: boolean;
  requiresApproval?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
  serviceLocation?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
  // Loyalty Points pricing
  loyaltyPointsEnabled?: boolean;
  loyaltyPointsPrice?: number;
  loyaltyPointsOnly?: boolean;
  // Service Discounts
  discountEnabled?: boolean;
  discountType?: string;
  discountValue?: number;
  discountValidFrom?: string;
  discountValidUntil?: string;
  discountDescription?: string;
  // No-show protection — deposit & cancellation policy (policy layer only; no charging).
  requireDeposit?: boolean;
  depositType?: string | null;   // 'PERCENT' | 'FIXED'
  depositValue?: number;
  cancellationWindowHours?: number;
  noShowFeeType?: string | null; // 'PERCENT' | 'FIXED'
  noShowFeeValue?: number;
}

interface ServiceWithDetails extends Service {
  specialist: Specialist & {
    user: Omit<User, 'password'>;
  };
}

export class ServiceService {
  // Create a new service
  static async createService(
    specialistUserId: string,
    data: CreateServiceData
  ): Promise<ServiceWithDetails> {
    try {
      // Get specialist profile
      const specialist = await prisma.specialist.findUnique({
        where: { userId: specialistUserId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      // Reject a service whose name already exists for this specialist (case-
      // insensitive, trimmed). Prevents accidental double-submits and re-created
      // services from showing up as identical duplicate entries.
      const trimmedName = (data.name || '').trim();
      const existing = await prisma.service.findFirst({
        where: {
          specialistId: specialist.id,
          isDeleted: false,
          name: { equals: trimmedName, mode: 'insensitive' },
        },
        select: { id: true },
      });
      if (existing) {
        throw new Error('SERVICE_DUPLICATE_NAME');
      }

      // Create service
      const service = await prisma.service.create({
        data: {
          specialistId: specialist.id,
          name: trimmedName,
          description: data.description,
          category: data.category,
          basePrice: data.basePrice,
          currency: data.currency || 'USD',
          duration: data.duration,
          prepTime: data.prepTime || 0,
          cleanupTime: data.cleanupTime || 0,
          rebookCycleDays: data.rebookCycleDays || null,
          serviceLocation: data.serviceLocation || null,
          locationNotes: data.locationNotes || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          requirements: JSON.stringify(data.requirements || []),
          deliverables: JSON.stringify(data.deliverables || []),
          images: JSON.stringify(data.images || []),
          isActive: data.isActive !== undefined ? data.isActive : true,
          requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
          maxAdvanceBooking: data.maxAdvanceBooking || 30,
          minAdvanceBooking: data.minAdvanceBooking || 1,
          // Group Session Settings
          isGroupSession: data.isGroupSession || false,
          maxParticipants: data.maxParticipants || null,
          minParticipants: data.minParticipants || 1,
          // Loyalty Points pricing
          loyaltyPointsEnabled: data.loyaltyPointsEnabled || false,
          loyaltyPointsPrice: data.loyaltyPointsPrice || null,
          loyaltyPointsOnly: data.loyaltyPointsOnly || false,
          // Service Discounts
          discountEnabled: data.discountEnabled || false,
          discountType: data.discountType || null,
          discountValue: data.discountValue || null,
          discountValidFrom: data.discountValidFrom ? new Date(data.discountValidFrom) : null,
          discountValidUntil: data.discountValidUntil ? new Date(data.discountValidUntil) : null,
          discountDescription: data.discountDescription || null,
          // No-show protection policy (recorded only — no payment is taken yet)
          requireDeposit: data.requireDeposit || false,
          depositType: data.requireDeposit ? (data.depositType || null) : null,
          depositValue: data.requireDeposit ? (data.depositValue ?? 0) : 0,
          cancellationWindowHours: data.cancellationWindowHours ?? 0,
          noShowFeeType: data.noShowFeeType || null,
          noShowFeeValue: data.noShowFeeValue ?? 0,
        },
        include: {
          specialist: {
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
            },
          },
        },
      });

      logger.info('Service created successfully', {
        serviceId: service.id,
        specialistId: specialist.id,
        serviceName: service.name,
        duration: service.duration,
      });

      return service as ServiceWithDetails;
    } catch (error) {
      logger.error('Error creating service:', error);
      throw error;
    }
  }

  // Update a service
  static async updateService(
    serviceId: string,
    specialistUserId: string,
    data: UpdateServiceData
  ): Promise<ServiceWithDetails> {
    try {
      // Verify service exists and belongs to specialist
      const existingService = await prisma.service.findUnique({
        where: { id: serviceId },
        include: {
          specialist: true,
        },
      });

      if (!existingService) {
        throw new Error('SERVICE_NOT_FOUND');
      }

      if (existingService.specialist.userId !== specialistUserId) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Update service
      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.duration !== undefined) {
        updateData.duration = data.duration;
      }
      if (data.prepTime !== undefined) updateData.prepTime = data.prepTime;
      if (data.cleanupTime !== undefined) updateData.cleanupTime = data.cleanupTime;
      if (data.rebookCycleDays !== undefined) updateData.rebookCycleDays = data.rebookCycleDays;
      if (data.serviceLocation !== undefined) updateData.serviceLocation = data.serviceLocation;
      if (data.locationNotes !== undefined) updateData.locationNotes = data.locationNotes;
      if (data.latitude !== undefined) updateData.latitude = data.latitude;
      if (data.longitude !== undefined) updateData.longitude = data.longitude;
      if (data.requirements !== undefined) updateData.requirements = JSON.stringify(data.requirements);
      if (data.deliverables !== undefined) updateData.deliverables = JSON.stringify(data.deliverables);
      if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
      if (data.maxAdvanceBooking !== undefined) updateData.maxAdvanceBooking = data.maxAdvanceBooking;
      if (data.minAdvanceBooking !== undefined) updateData.minAdvanceBooking = data.minAdvanceBooking;
      // Loyalty Points pricing
      if (data.loyaltyPointsEnabled !== undefined) updateData.loyaltyPointsEnabled = data.loyaltyPointsEnabled;
      if (data.loyaltyPointsPrice !== undefined) updateData.loyaltyPointsPrice = data.loyaltyPointsPrice;
      if (data.loyaltyPointsOnly !== undefined) updateData.loyaltyPointsOnly = data.loyaltyPointsOnly;
      // Service Discounts
      if (data.discountEnabled !== undefined) updateData.discountEnabled = data.discountEnabled;
      if (data.discountType !== undefined) updateData.discountType = data.discountType;
      if (data.discountValue !== undefined) updateData.discountValue = data.discountValue;
      if (data.discountValidFrom !== undefined) updateData.discountValidFrom = data.discountValidFrom ? new Date(data.discountValidFrom) : null;
      if (data.discountValidUntil !== undefined) updateData.discountValidUntil = data.discountValidUntil ? new Date(data.discountValidUntil) : null;
      if (data.discountDescription !== undefined) updateData.discountDescription = data.discountDescription;
      // No-show protection policy (recorded only — no payment is taken yet).
      // When deposit is turned off, clear the type/value so stale policy doesn't linger.
      if (data.requireDeposit !== undefined) {
        updateData.requireDeposit = data.requireDeposit;
        if (!data.requireDeposit) {
          updateData.depositType = null;
          updateData.depositValue = 0;
        }
      }
      if (data.depositType !== undefined) updateData.depositType = data.depositType;
      if (data.depositValue !== undefined) updateData.depositValue = data.depositValue;
      if (data.cancellationWindowHours !== undefined) updateData.cancellationWindowHours = data.cancellationWindowHours;
      if (data.noShowFeeType !== undefined) updateData.noShowFeeType = data.noShowFeeType;
      if (data.noShowFeeValue !== undefined) updateData.noShowFeeValue = data.noShowFeeValue;

      const service = await prisma.service.update({
        where: { id: serviceId },
        data: updateData,
        include: {
          specialist: {
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
            },
          },
        },
      });

      logger.info('Service updated successfully', {
        serviceId: service.id,
        specialistId: existingService.specialist.id,
        duration: service.duration,
      });

      return service as ServiceWithDetails;
    } catch (error) {
      logger.error('Error updating service:', error);
      throw error;
    }
  }

  // Delete a service (soft delete to preserve booking history and allow restoration)
  static async deleteService(serviceId: string, specialistUserId: string): Promise<void> {
    try {
      // Verify service exists and belongs to specialist
      const existingService = await prisma.service.findUnique({
        where: { 
          id: serviceId,
          isDeleted: false // Only allow deletion of non-deleted services
        },
        include: {
          specialist: true,
        },
      });

      if (!existingService) {
        throw new Error('SERVICE_NOT_FOUND');
      }

      if (existingService.specialist.userId !== specialistUserId) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Only block deletion for truly active bookings (not completed, cancelled, or no-show)
      const activeBookings = await prisma.booking.findFirst({
        where: {
          serviceId,
          status: {
            in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeBookings) {
        throw new Error('ACTIVE_BOOKINGS_EXIST');
      }

      // Soft delete the service - preserves all data including booking history
      await prisma.service.update({
        where: { id: serviceId },
        data: { 
          isDeleted: true,
          deletedAt: new Date(),
          isActive: false // Also mark as inactive for consistency
        },
      });

      logger.info('Service soft deleted successfully', {
        serviceId,
        specialistId: existingService.specialist.id,
      });
    } catch (error) {
      logger.error('Error deleting service:', error);
      throw error;
    }
  }

  // Restore a deleted service
  static async restoreService(serviceId: string, specialistUserId: string): Promise<ServiceWithDetails> {
    try {
      // Verify service exists and belongs to specialist (include deleted services)
      const existingService = await prisma.service.findUnique({
        where: { 
          id: serviceId,
          isDeleted: true // Only allow restoration of deleted services
        },
        include: {
          specialist: true,
        },
      });

      if (!existingService) {
        throw new Error('DELETED_SERVICE_NOT_FOUND');
      }

      if (existingService.specialist.userId !== specialistUserId) {
        throw new Error('UNAUTHORIZED_ACCESS');
      }

      // Restore the service
      const restoredService = await prisma.service.update({
        where: { id: serviceId },
        data: { 
          isDeleted: false,
          deletedAt: null,
          isActive: true // Mark as active when restoring
        },
        include: {
          specialist: {
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
            },
          },
        },
      });

      logger.info('Service restored successfully', {
        serviceId,
        specialistId: existingService.specialist.id,
      });

      return restoredService as ServiceWithDetails;
    } catch (error) {
      logger.error('Error restoring service:', error);
      throw error;
    }
  }

  // Get service by ID
  static async getService(serviceId: string): Promise<ServiceWithDetails> {
    try {
      const service = await prisma.service.findUnique({
        where: { 
          id: serviceId,
        },
        include: {
          specialist: {
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
            },
          },
        },
      });

      if (!service) {
        throw new Error('SERVICE_NOT_FOUND');
      }

      return service as ServiceWithDetails;
    } catch (error) {
      logger.error('Error getting service:', error);
      throw error;
    }
  }

  // Get specialist's services by user ID
  static async getSpecialistServices(
    specialistUserId: string,
    includeInactive: boolean = false,
    includeDeleted: boolean = false
  ): Promise<ServiceWithDetails[]> {
    try {
      const specialist = await prisma.specialist.findUnique({
        where: { userId: specialistUserId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      const where: Record<string, unknown> = {
        specialistId: specialist.id,
      };

      if (!includeInactive) {
        where.isActive = true;
      }

      if (!includeDeleted) {
        where.isDeleted = false;
      }

      const services = await prisma.service.findMany({
        where,
        include: {
          specialist: {
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
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return services as unknown as ServiceWithDetails[];
    } catch (error) {
      logger.error('Error getting specialist services:', error);
      throw error;
    }
  }

  // Get services by specialist ID (for public access)
  static async getServicesBySpecialistId(
    specialistId: string,
    includeInactive: boolean = false
  ): Promise<ServiceWithDetails[]> {
    try {
      // Verify specialist exists
      const specialist = await prisma.specialist.findUnique({
        where: { id: specialistId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      const where: Record<string, unknown> = {
        specialistId: specialistId,
        isDeleted: false, // Never include deleted services in public views
      };

      if (!includeInactive) {
        where.isActive = true;
      }

      const services = await prisma.service.findMany({
        where,
        include: {
          specialist: {
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
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return services as unknown as ServiceWithDetails[];
    } catch (error) {
      logger.error('Error getting services by specialist ID:', error);
      throw error;
    }
  }

  // Search services with filters
  static async searchServices(
    query?: string,
    category?: string,
    minPrice?: number,
    maxPrice?: number,
    sortBy: 'price' | 'priceDesc' | 'rating' | 'newest' | 'popular' = 'newest',
    page: number = 1,
    limit: number = 20,
    city?: string,
    availableWithin?: string,
    // ── Marketplace v2 filters ───────────────────────────────────────
    verifiedOnly?: boolean,
    language?: string,
  ): Promise<{
    services: ServiceWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        isActive: true,
        isDeleted: false,
        specialist: {
          user: {
            isActive: true,
          },
        },
      };

      if (query) {
        where.OR = [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
        ];
      }

      if (category) {
        where.category = category;
      }

      if (city) {
        where.specialist = {
          ...(where.specialist as Record<string, unknown>),
          city: { equals: city, mode: 'insensitive' },
        };
      }

      if (minPrice !== undefined || maxPrice !== undefined) {
        const priceFilter: Record<string, number> = {};
        if (minPrice !== undefined) priceFilter.gte = minPrice;
        if (maxPrice !== undefined) priceFilter.lte = maxPrice;
        where.basePrice = priceFilter;
      }

      // verifiedOnly → only services whose specialist has isVerified=true.
      // language → only services whose specialist supports that language (JSON array contains).
      if (verifiedOnly || language) {
        const specFilter = (where.specialist as Record<string, unknown>) || {};
        where.specialist = {
          ...specFilter,
          ...(verifiedOnly ? { isVerified: true } : {}),
          ...(language ? { languages: { contains: language } } : {}),
        };
      }

      // Filter by availability window
      if (availableWithin) {
        const now = new Date();
        let windowEnd: Date;

        switch (availableWithin) {
          case 'now':
            // Available within the next 2 hours
            windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000);
            break;
          case 'today':
            windowEnd = new Date(now);
            windowEnd.setHours(23, 59, 59, 999);
            break;
          case 'thisWeek': {
            windowEnd = new Date(now);
            const daysUntilSunday = 7 - windowEnd.getDay();
            windowEnd.setDate(windowEnd.getDate() + daysUntilSunday);
            windowEnd.setHours(23, 59, 59, 999);
            break;
          }
          default:
            windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }

        where.specialist = {
          ...where.specialist as Record<string, unknown>,
          availabilityBlocks: {
            some: {
              isAvailable: true,
              startDateTime: { lte: windowEnd },
              endDateTime: { gte: now },
            },
          },
        };
      }

      // ── Marketplace acquisition: featured/boosted placement ───────────────
      // Services whose specialist has an active boost are surfaced FIRST in every
      // sort mode. `specialist: { isFeatured: 'desc' }` is the PRIMARY orderBy key.
      // The "still-active" guard (featuredUntil > now OR null) can't live in
      // orderBy, so a re-sort + active flag is applied in memory after the query
      // (see below). Self-serve toggle today; becomes a paid boost once live
      // billing lands (see promote.service.ts).
      const featuredFirst = { specialist: { isFeatured: 'desc' as const } };
      let orderBy:
        | Record<string, string>
        | Record<string, Record<string, string>>
        | Array<Record<string, Record<string, string>> | Record<string, string>> = {};
      switch (sortBy) {
        case 'price':
          orderBy = [featuredFirst, { basePrice: 'asc' }];
          break;
        case 'priceDesc':
          orderBy = [featuredFirst, { basePrice: 'desc' }];
          break;
        case 'rating':
          orderBy = [featuredFirst, { specialist: { rating: 'desc' } }];
          break;
        case 'popular':
          // Popular = highest review count from the specialist (proxy for traction).
          orderBy = [featuredFirst, { specialist: { reviewCount: 'desc' } }];
          break;
        case 'newest':
          orderBy = [featuredFirst, { createdAt: 'desc' }];
          break;
        default:
          orderBy = [featuredFirst, { createdAt: 'desc' }];
      }

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          include: {
            specialist: {
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
              },
            },
          },
          orderBy,
          skip,
          take: limit,
        }),
        prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // ── Marketplace acquisition: active-featured flag + re-sort ───────────
      // Overwrite specialist.isFeatured with the ACTIVE flag (boost not expired)
      // so the frontend never badges a lapsed boost, then stable-sort active
      // featured services to the front of the page (corrects for the DB-level
      // `isFeatured desc` keeping expired boosts floating at the top).
      const nowTs = Date.now();
      const withFeatured = (services as any[]).map((svc) => {
        const sp = svc.specialist;
        const activeFeatured = !!sp?.isFeatured &&
          (sp.featuredUntil == null || new Date(sp.featuredUntil).getTime() > nowTs);
        return sp
          ? { ...svc, specialist: { ...sp, isFeatured: activeFeatured } }
          : svc;
      });
      withFeatured.sort((a, b) => {
        const af = a.specialist?.isFeatured ? 1 : 0;
        const bf = b.specialist?.isFeatured ? 1 : 0;
        return bf - af; // active-featured first; stable for equal keys
      });

      return {
        services: withFeatured as ServiceWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error searching services:', error);
      throw error;
    }
  }

  // Get services by location (nearby search)
  static async getServicesByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    services: (ServiceWithDetails & { distance?: number })[];
    totalServices: number;
    page: number;
    totalPages: number;
  }> {
    try {
      // Calculate distance using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
          Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
      };

      // Get all active specialists with coordinates
      const specialists = await prisma.specialist.findMany({
        where: {
          AND: [
            { latitude: { not: null } },
            { longitude: { not: null } },
            { user: { isActive: true } },
          ],
        },
        select: {
          id: true,
          latitude: true,
          longitude: true,
        },
      });

      // Filter specialists by distance
      const nearbySpecialists = specialists
        .filter(s => s.latitude !== null && s.longitude !== null)
        .map(s => ({
          ...s,
          distance: calculateDistance(latitude, longitude, s.latitude!, s.longitude!),
        }))
        .filter(s => s.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);

      // If no specialists found nearby, return empty result
      if (nearbySpecialists.length === 0) {
        return {
          services: [],
          totalServices: 0,
          page,
          totalPages: 0,
        };
      }

      // Get specialist IDs
      const specialistIds = nearbySpecialists.map(s => s.id);

      // Create a map of specialist distances
      const distanceMap = new Map(
        nearbySpecialists.map(s => [s.id, s.distance])
      );

      // Get services from nearby specialists
      const where: Record<string, unknown> = {
        isActive: true,
        isDeleted: false,
        specialistId: {
          in: specialistIds,
        },
        specialist: {
          user: {
            isActive: true,
          },
        },
      };

      const skip = (page - 1) * limit;

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          include: {
            specialist: {
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
              },
            },
          },
          skip,
          take: limit,
        }),
        prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      // Add distance to each service
      const servicesWithDistance = services.map(service => ({
        ...service,
        distance: distanceMap.get(service.specialistId) || 0,
      }));

      return {
        services: servicesWithDistance as (ServiceWithDetails & { distance?: number })[],
        totalServices: total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting services by location:', error);
      throw error;
    }
  }

  // Get available service categories
  static async getCategories(): Promise<{
    id: string;
    name: string;
    icon: string;
    count: number;
  }[]> {
    try {
      // Get active services grouped by category
      const categoryStats = await prisma.service.groupBy({
        by: ['category'],
        where: {
          isActive: true,
          isDeleted: false,
          specialist: {
            user: {
              isActive: true,
            },
          },
        },
        _count: {
          id: true,
        },
      });

      // Comprehensive static category definitions with icons
      const categoryDefinitions = [
        // Beauty & Personal Care
        { id: 'haircut', name: 'Hair & Barber Services', icon: '✂️' },
        { id: 'beauty', name: 'Beauty & Makeup', icon: '💅' },
        { id: 'skincare', name: 'Skincare & Facials', icon: '🧴' },
        { id: 'nails', name: 'Nail Services', icon: '💅' },
        { id: 'eyebrows', name: 'Eyebrow & Lash Services', icon: '👁️' },
        { id: 'styling', name: 'Hair Styling & Coloring', icon: '🎨' },
        
        // Health & Wellness
        { id: 'massage', name: 'Massage & Spa', icon: '💆‍♀️' },
        { id: 'therapy', name: 'Therapy & Counseling', icon: '🧘‍♀️' },
        { id: 'physiotherapy', name: 'Physiotherapy', icon: '🏥' },
        { id: 'nutrition', name: 'Nutrition & Diet', icon: '🥗' },
        { id: 'wellness', name: 'Wellness & Alternative Medicine', icon: '🌿' },
        
        // Fitness & Sports
        { id: 'fitness', name: 'Personal Training', icon: '🏋️‍♂️' },
        { id: 'yoga', name: 'Yoga & Pilates', icon: '🧘‍♀️' },
        { id: 'sports', name: 'Sports Coaching', icon: '⚽' },
        { id: 'dance', name: 'Dance Lessons', icon: '💃' },
        { id: 'martial-arts', name: 'Martial Arts', icon: '🥋' },
        
        // Creative & Arts
        { id: 'photography', name: 'Photography', icon: '📸' },
        { id: 'videography', name: 'Videography', icon: '🎥' },
        { id: 'tattoo', name: 'Tattoo & Piercing', icon: '🎨' },
        { id: 'art', name: 'Art & Design', icon: '🎨' },
        { id: 'music', name: 'Music Lessons', icon: '🎵' },
        { id: 'writing', name: 'Writing & Translation', icon: '✍️' },
        
        // Education & Tutoring
        { id: 'education', name: 'Academic Tutoring', icon: '📚' },
        { id: 'language', name: 'Language Lessons', icon: '🗣️' },
        { id: 'computer', name: 'Computer Skills', icon: '💻' },
        { id: 'test-prep', name: 'Test Preparation', icon: '📝' },
        
        // Technology & IT
        { id: 'it-support', name: 'IT Support & Repair', icon: '💻' },
        { id: 'web-development', name: 'Web Development', icon: '🌐' },
        { id: 'app-development', name: 'App Development', icon: '📱' },
        { id: 'graphic-design', name: 'Graphic Design', icon: '🎨' },
        { id: 'digital-marketing', name: 'Digital Marketing', icon: '📈' },
        
        // Home & Lifestyle
        { id: 'cleaning', name: 'Cleaning Services', icon: '🧽' },
        { id: 'home-repair', name: 'Home Repair & Maintenance', icon: '🔧' },
        { id: 'gardening', name: 'Gardening & Landscaping', icon: '🌱' },
        { id: 'pet-care', name: 'Pet Care & Training', icon: '🐕' },
        { id: 'childcare', name: 'Childcare & Babysitting', icon: '👶' },
        { id: 'elderly-care', name: 'Elderly Care', icon: '👵' },
        
        // Transportation & Automotive
        { id: 'automotive', name: 'Auto Repair & Maintenance', icon: '🚗' },
        { id: 'driving', name: 'Driving Lessons', icon: '🚗' },
        { id: 'transport', name: 'Transportation Services', icon: '🚐' },
        
        // Events & Entertainment
        { id: 'event-planning', name: 'Event Planning', icon: '🎉' },
        { id: 'catering', name: 'Catering Services', icon: '🍽️' },
        { id: 'entertainment', name: 'Entertainment & Performance', icon: '🎭' },
        { id: 'dj', name: 'DJ & Music Services', icon: '🎧' },
        
        // Legal & Professional
        { id: 'legal', name: 'Legal Services', icon: '⚖️' },
        { id: 'accounting', name: 'Accounting & Tax', icon: '📊' },
        { id: 'consulting', name: 'Business Consulting', icon: '💼' },
        { id: 'real-estate', name: 'Real Estate', icon: '🏘️' },
        
        // Other Services
        { id: 'craft', name: 'Crafts & Handmade', icon: '✋' },
        { id: 'repair', name: 'General Repair Services', icon: '🔧' },
        { id: 'security', name: 'Security Services', icon: '🛡️' },
        { id: 'other', name: 'Other Services', icon: '📋' },
      ];

      // Merge with actual counts
      const categories = categoryDefinitions.map(def => {
        const stats = categoryStats.find(s => s.category === def.id);
        return {
          ...def,
          count: stats?._count.id || 0,
        };
      });

      // Add any categories that exist in the database but not in our definitions
      categoryStats.forEach(stats => {
        if (!categoryDefinitions.find(def => def.id === stats.category)) {
          categories.push({
            id: stats.category,
            name: stats.category.charAt(0).toUpperCase() + stats.category.slice(1),
            icon: '📋',
            count: stats._count.id,
          });
        }
      });

      // Return all categories, sorted by count (desc) then alphabetically
      return categories.sort((a, b) => {
        if (a.count !== b.count) {
          return b.count - a.count; // Higher count first
        }
        return a.name.localeCompare(b.name); // Alphabetical for same count
      });
    } catch (error) {
      logger.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get popular services
  static async getPopularServices(limit: number = 10): Promise<ServiceWithDetails[]> {
    try {
      // Get services with the most bookings
      const services = await prisma.service.findMany({
        where: {
          isActive: true,
          isDeleted: false,
          specialist: {
            user: {
              isActive: true,
            },
          },
        },
        include: {
          specialist: {
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
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: [
          { specialist: { rating: 'desc' } },
          { specialist: { reviewCount: 'desc' } },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      return services as unknown as ServiceWithDetails[];
    } catch (error) {
      logger.error('Error getting popular services:', error);
      throw error;
    }
  }

  // Migration method to fix currency data for existing services
  static async migrateCurrencyData(specialistUserId: string) {
    try {
      // Get specialist
      const specialist = await prisma.specialist.findUnique({
        where: { userId: specialistUserId },
      });

      if (!specialist) {
        throw new Error('SPECIALIST_NOT_FOUND');
      }

      // Get all services for this specialist
      const services = await prisma.service.findMany({
        where: { 
          specialistId: specialist.id,
          isDeleted: false,
        },
      });

      const updates = [];
      
      for (const service of services) {
        let newCurrency = service.currency;
        const basePriceNum = Number(service.basePrice);
        let newPrice = basePriceNum;

        // Smart detection based on service name and price patterns
        if (service.name.toLowerCase().includes('barber')) {
          // Barber services are typically in USD
          if (basePriceNum >= 1000) {
            // This is likely UAH stored as USD, convert it
            newPrice = basePriceNum / 37; // Convert UAH to USD
            newCurrency = 'USD';
            logger.info(`Migrating barber service ${service.id}: ${basePriceNum} UAH -> ${newPrice} USD`);
          } else if (basePriceNum <= 100) {
            // This is likely correct USD pricing
            newCurrency = 'USD';
          }
        } else if (service.name.toLowerCase().includes('beard')) {
          // Beard trim services are typically in UAH
          if (basePriceNum <= 100) {
            // This is likely USD stored as UAH, convert it
            newPrice = basePriceNum * 37; // Convert USD to UAH
            newCurrency = 'UAH';
            logger.info(`Migrating beard service ${service.id}: ${basePriceNum} USD -> ${newPrice} UAH`);
          } else if (basePriceNum >= 1000) {
            // This is likely correct UAH pricing
            newCurrency = 'UAH';
          }
        } else {
          // For other services, use heuristics based on price
          if (basePriceNum >= 1000) {
            newCurrency = 'UAH';
          } else if (basePriceNum <= 100) {
            newCurrency = 'USD';
          }
        }

        // Update if currency or price changed
        if (newCurrency !== service.currency || newPrice !== basePriceNum) {
          await prisma.service.update({
            where: { id: service.id },
            data: {
              currency: newCurrency,
              basePrice: newPrice,
            },
          });
          
          updates.push({
            serviceId: service.id,
            serviceName: service.name,
            oldPrice: service.basePrice,
            oldCurrency: service.currency,
            newPrice: newPrice,
            newCurrency: newCurrency,
          });
        }
      }

      logger.info(`Currency migration completed for specialist ${specialistUserId}: ${updates.length} services updated`);
      
      return {
        totalServices: services.length,
        updatedServices: updates.length,
        updates: updates,
      };
    } catch (error) {
      logger.error('Error migrating currency data:', error);
      throw error;
    }
  }

  // Get services available for loyalty points
  static async getLoyaltyPointsServices(
    page: number = 1,
    limit: number = 20,
    specialistId?: string
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {
        isActive: true,
        isDeleted: false,
        loyaltyPointsEnabled: true,
      };

      if (specialistId) {
        where.specialist = { userId: specialistId };
      }

      const [services, total] = await Promise.all([
        prisma.service.findMany({
          where,
          include: {
            specialist: {
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
              },
            },
          },
          orderBy: {
            loyaltyPointsPrice: 'asc', // Sort by points required (cheapest first)
          },
          skip,
          take: limit,
        }),
        prisma.service.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        services: services as ServiceWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error getting loyalty points services:', error);
      throw error;
    }
  }

  // Utility function to calculate discounted price
  static calculateDiscountedPrice(
    basePrice: number,
    discountEnabled: boolean,
    discountType?: string | null,
    discountValue?: number | null,
    discountValidFrom?: Date | null,
    discountValidUntil?: Date | null
  ): { originalPrice: number; discountedPrice: number; hasActiveDiscount: boolean; discountAmount: number; discountPercentage: number } {
    const now = new Date();

    // Check if discount is active
    const hasActiveDiscount = discountEnabled &&
      discountType &&
      discountValue &&
      discountValue > 0 &&
      (!discountValidFrom || now >= discountValidFrom) &&
      (!discountValidUntil || now <= discountValidUntil);

    if (!hasActiveDiscount) {
      return {
        originalPrice: basePrice,
        discountedPrice: basePrice,
        hasActiveDiscount: false,
        discountAmount: 0,
        discountPercentage: 0
      };
    }

    let discountedPrice = basePrice;
    let discountAmount = 0;
    let discountPercentage = 0;

    if (discountType === 'PERCENTAGE') {
      discountPercentage = Math.min(discountValue, 100);
      discountAmount = (basePrice * discountPercentage) / 100;
      discountedPrice = basePrice - discountAmount;
    } else if (discountType === 'FIXED_AMOUNT') {
      discountAmount = Math.min(discountValue, basePrice);
      discountedPrice = basePrice - discountAmount;
      discountPercentage = (discountAmount / basePrice) * 100;
    }

    // Ensure price doesn't go negative
    discountedPrice = Math.max(0, discountedPrice);

    return {
      originalPrice: basePrice,
      discountedPrice,
      hasActiveDiscount: true,
      discountAmount,
      discountPercentage
    };
  }
}