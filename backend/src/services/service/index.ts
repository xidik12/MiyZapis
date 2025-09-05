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
  requirements?: string[];
  deliverables?: string[];
  images?: string[];
  isActive?: boolean;
  requiresApproval?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
}

interface UpdateServiceData {
  name?: string;
  description?: string;
  category?: string;
  basePrice?: number;
  currency?: string;
  duration?: number;
  requirements?: string[];
  deliverables?: string[];
  images?: string[];
  isActive?: boolean;
  requiresApproval?: boolean;
  maxAdvanceBooking?: number;
  minAdvanceBooking?: number;
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

      // Create service
      const service = await prisma.service.create({
        data: {
          specialistId: specialist.id,
          name: data.name,
          description: data.description,
          category: data.category,
          basePrice: data.basePrice,
          currency: data.currency || 'USD',
          duration: data.duration,
          requirements: JSON.stringify(data.requirements || []),
          deliverables: JSON.stringify(data.deliverables || []),
          images: JSON.stringify(data.images || []),
          isActive: data.isActive !== undefined ? data.isActive : true,
          requiresApproval: data.requiresApproval !== undefined ? data.requiresApproval : true,
          maxAdvanceBooking: data.maxAdvanceBooking || 30,
          minAdvanceBooking: data.minAdvanceBooking || 1,
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
      const updateData: any = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.basePrice !== undefined) updateData.basePrice = data.basePrice;
      if (data.currency !== undefined) updateData.currency = data.currency;
      if (data.duration !== undefined) updateData.duration = data.duration;
      if (data.requirements !== undefined) updateData.requirements = JSON.stringify(data.requirements);
      if (data.deliverables !== undefined) updateData.deliverables = JSON.stringify(data.deliverables);
      if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.requiresApproval !== undefined) updateData.requiresApproval = data.requiresApproval;
      if (data.maxAdvanceBooking !== undefined) updateData.maxAdvanceBooking = data.maxAdvanceBooking;
      if (data.minAdvanceBooking !== undefined) updateData.minAdvanceBooking = data.minAdvanceBooking;

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

      const where: any = {
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

      return services as ServiceWithDetails[];
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

      const where: any = {
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

      return services as ServiceWithDetails[];
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
    sortBy: 'price' | 'rating' | 'newest' = 'newest',
    page: number = 1,
    limit: number = 20
  ): Promise<{
    services: ServiceWithDetails[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
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

      if (minPrice !== undefined || maxPrice !== undefined) {
        where.basePrice = {};
        if (minPrice !== undefined) where.basePrice.gte = minPrice;
        if (maxPrice !== undefined) where.basePrice.lte = maxPrice;
      }

      let orderBy: any = {};
      switch (sortBy) {
        case 'price':
          orderBy = { basePrice: 'asc' };
          break;
        case 'rating':
          orderBy = { specialist: { rating: 'desc' } };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
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
                _count: {
                  select: {
                    bookings: {
                      where: {
                        status: 'COMPLETED'
                      }
                    }
                  }
                }
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

      return {
        services: services as ServiceWithDetails[],
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error searching services:', error);
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

      return services as ServiceWithDetails[];
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
        let newPrice = service.basePrice;
        
        // Smart detection based on service name and price patterns
        if (service.name.toLowerCase().includes('barber')) {
          // Barber services are typically in USD
          if (service.basePrice >= 1000) {
            // This is likely UAH stored as USD, convert it
            newPrice = service.basePrice / 37; // Convert UAH to USD
            newCurrency = 'USD';
            logger.info(`Migrating barber service ${service.id}: ${service.basePrice} UAH -> ${newPrice} USD`);
          } else if (service.basePrice <= 100) {
            // This is likely correct USD pricing
            newCurrency = 'USD';
          }
        } else if (service.name.toLowerCase().includes('beard')) {
          // Beard trim services are typically in UAH
          if (service.basePrice <= 100) {
            // This is likely USD stored as UAH, convert it
            newPrice = service.basePrice * 37; // Convert USD to UAH
            newCurrency = 'UAH';
            logger.info(`Migrating beard service ${service.id}: ${service.basePrice} USD -> ${newPrice} UAH`);
          } else if (service.basePrice >= 1000) {
            // This is likely correct UAH pricing
            newCurrency = 'UAH';
          }
        } else {
          // For other services, use heuristics based on price
          if (service.basePrice >= 1000) {
            newCurrency = 'UAH';
          } else if (service.basePrice <= 100) {
            newCurrency = 'USD';
          }
        }

        // Update if currency or price changed
        if (newCurrency !== service.currency || newPrice !== service.basePrice) {
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
}