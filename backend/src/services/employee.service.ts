import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import type { Prisma } from '@prisma/client';

interface CreateEmployeeData {
  businessId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  workingHours?: any;
}

interface UpdateEmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  title?: string;
  bio?: string;
  specialties?: string[];
  experience?: number;
  workingHours?: any;
  isActive?: boolean;
}

export class EmployeeService {
  /**
   * Create a new employee for a business
   */
  static async createEmployee(data: CreateEmployeeData) {
    try {
      // Verify the business exists and user owns it
      const business = await prisma.specialist.findUnique({
        where: { id: data.businessId },
      });

      if (!business) {
        throw new Error('Business not found');
      }

      // Default working hours if not provided
      const defaultWorkingHours = {
        monday: { isWorking: true, start: '09:00', end: '17:00' },
        tuesday: { isWorking: true, start: '09:00', end: '17:00' },
        wednesday: { isWorking: true, start: '09:00', end: '17:00' },
        thursday: { isWorking: true, start: '09:00', end: '17:00' },
        friday: { isWorking: true, start: '09:00', end: '17:00' },
        saturday: { isWorking: false, start: '09:00', end: '17:00' },
        sunday: { isWorking: false, start: '09:00', end: '17:00' },
      };

      const employee = await prisma.employee.create({
        data: {
          businessId: data.businessId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          avatar: data.avatar,
          title: data.title,
          bio: data.bio,
          specialties: data.specialties ? JSON.stringify(data.specialties) : null,
          experience: data.experience || 0,
          workingHours: JSON.stringify(data.workingHours || defaultWorkingHours),
          isActive: true,
        },
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      logger.info(`Employee created: ${employee.id} for business ${data.businessId}`);
      return employee;
    } catch (error) {
      logger.error('Error creating employee:', error);
      throw error;
    }
  }

  /**
   * Get all employees for a business
   */
  static async getBusinessEmployees(businessId: string, includeInactive = false) {
    try {
      const where: Prisma.EmployeeWhereInput = {
        businessId,
        ...(includeInactive ? {} : { isActive: true }),
      };

      const employees = await prisma.employee.findMany({
        where,
        include: {
          services: {
            include: {
              service: true,
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return employees;
    } catch (error) {
      logger.error('Error fetching business employees:', error);
      throw error;
    }
  }

  /**
   * Get a single employee by ID
   */
  static async getEmployeeById(employeeId: string) {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
        include: {
          business: true,
          services: {
            include: {
              service: true,
            },
          },
          availabilityBlocks: {
            where: {
              endTime: {
                gte: new Date(),
              },
            },
            orderBy: {
              startTime: 'asc',
            },
          },
          _count: {
            select: {
              bookings: true,
            },
          },
        },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      return employee;
    } catch (error) {
      logger.error('Error fetching employee:', error);
      throw error;
    }
  }

  /**
   * Update an employee
   */
  static async updateEmployee(employeeId: string, data: UpdateEmployeeData) {
    try {
      const updateData: any = {
        ...data,
      };

      // Handle JSON fields
      if (data.specialties) {
        updateData.specialties = JSON.stringify(data.specialties);
      }
      if (data.workingHours) {
        updateData.workingHours = JSON.stringify(data.workingHours);
      }

      const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: updateData,
        include: {
          services: {
            include: {
              service: true,
            },
          },
        },
      });

      logger.info(`Employee updated: ${employeeId}`);
      return employee;
    } catch (error) {
      logger.error('Error updating employee:', error);
      throw error;
    }
  }

  /**
   * Delete (deactivate) an employee
   */
  static async deleteEmployee(employeeId: string) {
    try {
      // Soft delete - just set isActive to false
      const employee = await prisma.employee.update({
        where: { id: employeeId },
        data: {
          isActive: false,
        },
      });

      logger.info(`Employee deactivated: ${employeeId}`);
      return employee;
    } catch (error) {
      logger.error('Error deleting employee:', error);
      throw error;
    }
  }

  /**
   * Assign a service to an employee
   */
  static async assignService(employeeId: string, serviceId: string, customPrice?: number) {
    try {
      // Verify employee exists
      const employee = await prisma.employee.findUnique({
        where: { id: employeeId },
      });

      if (!employee) {
        throw new Error('Employee not found');
      }

      // Verify service belongs to the same business
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });

      if (!service || service.specialistId !== employee.businessId) {
        throw new Error('Service not found or does not belong to this business');
      }

      // Create or update the employee service assignment
      const employeeService = await prisma.employeeService.upsert({
        where: {
          employeeId_serviceId: {
            employeeId,
            serviceId,
          },
        },
        create: {
          employeeId,
          serviceId,
          customPrice,
          isAvailable: true,
        },
        update: {
          customPrice,
          isAvailable: true,
        },
        include: {
          service: true,
        },
      });

      logger.info(`Service ${serviceId} assigned to employee ${employeeId}`);
      return employeeService;
    } catch (error) {
      logger.error('Error assigning service to employee:', error);
      throw error;
    }
  }

  /**
   * Remove a service from an employee
   */
  static async removeService(employeeId: string, serviceId: string) {
    try {
      await prisma.employeeService.delete({
        where: {
          employeeId_serviceId: {
            employeeId,
            serviceId,
          },
        },
      });

      logger.info(`Service ${serviceId} removed from employee ${employeeId}`);
      return { success: true };
    } catch (error) {
      logger.error('Error removing service from employee:', error);
      throw error;
    }
  }

  /**
   * Add availability block for an employee
   */
  static async addAvailability(
    employeeId: string,
    startTime: Date,
    endTime: Date,
    type: string = 'AVAILABLE',
    reason?: string,
    isRecurring: boolean = false,
    recurrenceRule?: any
  ) {
    try {
      const availability = await prisma.employeeAvailability.create({
        data: {
          employeeId,
          startTime,
          endTime,
          type,
          reason,
          isRecurring,
          recurrenceRule: recurrenceRule ? JSON.stringify(recurrenceRule) : null,
        },
      });

      logger.info(`Availability added for employee ${employeeId}`);
      return availability;
    } catch (error) {
      logger.error('Error adding employee availability:', error);
      throw error;
    }
  }

  /**
   * Get employee availability for a date range
   */
  static async getEmployeeAvailability(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ) {
    try {
      const availability = await prisma.employeeAvailability.findMany({
        where: {
          employeeId,
          OR: [
            {
              startTime: {
                gte: startDate,
                lte: endDate,
              },
            },
            {
              endTime: {
                gte: startDate,
                lte: endDate,
              },
            },
          ],
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      return availability;
    } catch (error) {
      logger.error('Error fetching employee availability:', error);
      throw error;
    }
  }

  /**
   * Remove availability block
   */
  static async removeAvailability(availabilityId: string) {
    try {
      await prisma.employeeAvailability.delete({
        where: { id: availabilityId },
      });

      logger.info(`Availability block ${availabilityId} removed`);
      return { success: true };
    } catch (error) {
      logger.error('Error removing availability:', error);
      throw error;
    }
  }

  /**
   * Get available employees for a service at a specific time
   */
  static async getAvailableEmployees(
    businessId: string,
    serviceId: string,
    startTime: Date,
    endTime: Date
  ) {
    try {
      // Get all employees assigned to this service
      const employeeServices = await prisma.employeeService.findMany({
        where: {
          serviceId,
          isAvailable: true,
          employee: {
            businessId,
            isActive: true,
          },
        },
        include: {
          employee: {
            include: {
              bookings: {
                where: {
                  OR: [
                    {
                      startTime: {
                        lt: endTime,
                      },
                      endTime: {
                        gt: startTime,
                      },
                    },
                  ],
                  status: {
                    in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'],
                  },
                },
              },
              availabilityBlocks: {
                where: {
                  type: 'BLOCKED',
                  OR: [
                    {
                      startTime: {
                        lt: endTime,
                      },
                      endTime: {
                        gt: startTime,
                      },
                    },
                  ],
                },
              },
            },
          },
        },
      });

      // Filter out employees with conflicting bookings or blocks
      const availableEmployees = employeeServices
        .filter((es) => {
          const hasConflict =
            es.employee.bookings.length > 0 || es.employee.availabilityBlocks.length > 0;
          return !hasConflict;
        })
        .map((es) => ({
          ...es.employee,
          customPrice: es.customPrice,
        }));

      return availableEmployees;
    } catch (error) {
      logger.error('Error fetching available employees:', error);
      throw error;
    }
  }
}
