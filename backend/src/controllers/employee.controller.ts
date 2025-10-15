import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';
import { logger } from '../utils/logger';

export class EmployeeController {
  /**
   * Create a new employee
   */
  static async createEmployee(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const {
        firstName,
        lastName,
        email,
        phoneNumber,
        avatar,
        title,
        bio,
        specialties,
        experience,
        workingHours,
      } = req.body;

      // Get the business ID from the authenticated user
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist) {
        return res.status(404).json({
          success: false,
          error: 'Business profile not found',
        });
      }

      // Validate required fields
      if (!firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'First name and last name are required',
        });
      }

      const employee = await EmployeeService.createEmployee({
        businessId: specialist.id,
        firstName,
        lastName,
        email,
        phoneNumber,
        avatar,
        title,
        bio,
        specialties,
        experience,
        workingHours,
      });

      res.status(201).json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      logger.error('Error in createEmployee controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to create employee',
      });
    }
  }

  /**
   * Get all employees for the authenticated business
   */
  static async getMyEmployees(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const includeInactive = req.query.includeInactive === 'true';

      // Get the business ID from the authenticated user
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist) {
        return res.status(404).json({
          success: false,
          error: 'Business profile not found',
        });
      }

      const employees = await EmployeeService.getBusinessEmployees(
        specialist.id,
        includeInactive
      );

      res.json({
        success: true,
        data: employees,
        count: employees.length,
      });
    } catch (error: any) {
      logger.error('Error in getMyEmployees controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employees',
      });
    }
  }

  /**
   * Get a single employee by ID
   */
  static async getEmployeeById(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const userId = (req as any).user.id;

      const employee = await EmployeeService.getEmployeeById(employeeId);

      // Verify the requesting user owns this business
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to access this employee',
        });
      }

      res.json({
        success: true,
        data: employee,
      });
    } catch (error: any) {
      logger.error('Error in getEmployeeById controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch employee',
      });
    }
  }

  /**
   * Update an employee
   */
  static async updateEmployee(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const userId = (req as any).user.id;
      const updateData = req.body;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to update this employee',
        });
      }

      const updatedEmployee = await EmployeeService.updateEmployee(employeeId, updateData);

      res.json({
        success: true,
        data: updatedEmployee,
      });
    } catch (error: any) {
      logger.error('Error in updateEmployee controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to update employee',
      });
    }
  }

  /**
   * Delete (deactivate) an employee
   */
  static async deleteEmployee(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const userId = (req as any).user.id;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to delete this employee',
        });
      }

      await EmployeeService.deleteEmployee(employeeId);

      res.json({
        success: true,
        message: 'Employee deactivated successfully',
      });
    } catch (error: any) {
      logger.error('Error in deleteEmployee controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to delete employee',
      });
    }
  }

  /**
   * Assign a service to an employee
   */
  static async assignService(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { serviceId, customPrice } = req.body;
      const userId = (req as any).user.id;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to manage this employee',
        });
      }

      if (!serviceId) {
        return res.status(400).json({
          success: false,
          error: 'Service ID is required',
        });
      }

      const employeeService = await EmployeeService.assignService(
        employeeId,
        serviceId,
        customPrice
      );

      res.status(201).json({
        success: true,
        data: employeeService,
      });
    } catch (error: any) {
      logger.error('Error in assignService controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to assign service',
      });
    }
  }

  /**
   * Remove a service from an employee
   */
  static async removeService(req: Request, res: Response) {
    try {
      const { employeeId, serviceId } = req.params;
      const userId = (req as any).user.id;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to manage this employee',
        });
      }

      await EmployeeService.removeService(employeeId, serviceId);

      res.json({
        success: true,
        message: 'Service removed from employee',
      });
    } catch (error: any) {
      logger.error('Error in removeService controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove service',
      });
    }
  }

  /**
   * Add availability block
   */
  static async addAvailability(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { startTime, endTime, type, reason, isRecurring, recurrenceRule } = req.body;
      const userId = (req as any).user.id;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to manage this employee',
        });
      }

      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Start time and end time are required',
        });
      }

      const availability = await EmployeeService.addAvailability(
        employeeId,
        new Date(startTime),
        new Date(endTime),
        type,
        reason,
        isRecurring,
        recurrenceRule
      );

      res.status(201).json({
        success: true,
        data: availability,
      });
    } catch (error: any) {
      logger.error('Error in addAvailability controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to add availability',
      });
    }
  }

  /**
   * Get employee availability
   */
  static async getAvailability(req: Request, res: Response) {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Start date and end date are required',
        });
      }

      const availability = await EmployeeService.getEmployeeAvailability(
        employeeId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      res.json({
        success: true,
        data: availability,
      });
    } catch (error: any) {
      logger.error('Error in getAvailability controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch availability',
      });
    }
  }

  /**
   * Remove availability block
   */
  static async removeAvailability(req: Request, res: Response) {
    try {
      const { employeeId, availabilityId } = req.params;
      const userId = (req as any).user.id;

      // Verify ownership
      const employee = await EmployeeService.getEmployeeById(employeeId);
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist || employee.businessId !== specialist.id) {
        return res.status(403).json({
          success: false,
          error: 'Unauthorized to manage this employee',
        });
      }

      await EmployeeService.removeAvailability(availabilityId);

      res.json({
        success: true,
        message: 'Availability block removed',
      });
    } catch (error: any) {
      logger.error('Error in removeAvailability controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to remove availability',
      });
    }
  }

  /**
   * Get available employees for a service
   */
  static async getAvailableEmployees(req: Request, res: Response) {
    try {
      const { serviceId, startTime, endTime } = req.query;
      const userId = (req as any).user.id;

      // Get business ID
      const { prisma } = await import('../config/database');
      const specialist = await prisma.specialist.findUnique({
        where: { userId },
      });

      if (!specialist) {
        return res.status(404).json({
          success: false,
          error: 'Business profile not found',
        });
      }

      if (!serviceId || !startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'Service ID, start time, and end time are required',
        });
      }

      const availableEmployees = await EmployeeService.getAvailableEmployees(
        specialist.id,
        serviceId as string,
        new Date(startTime as string),
        new Date(endTime as string)
      );

      res.json({
        success: true,
        data: availableEmployees,
        count: availableEmployees.length,
      });
    } catch (error: any) {
      logger.error('Error in getAvailableEmployees controller:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch available employees',
      });
    }
  }
}
