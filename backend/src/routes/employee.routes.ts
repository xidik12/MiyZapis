import express from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Employee CRUD operations
router.post('/', EmployeeController.createEmployee);
router.get('/', EmployeeController.getMyEmployees);
router.get('/:employeeId', EmployeeController.getEmployeeById);
router.put('/:employeeId', EmployeeController.updateEmployee);
router.delete('/:employeeId', EmployeeController.deleteEmployee);

// Service assignment
router.post('/:employeeId/services', EmployeeController.assignService);
router.delete('/:employeeId/services/:serviceId', EmployeeController.removeService);

// Availability management
router.post('/:employeeId/availability', EmployeeController.addAvailability);
router.get('/:employeeId/availability', EmployeeController.getAvailability);
router.delete('/:employeeId/availability/:availabilityId', EmployeeController.removeAvailability);

// Get available employees for a service
router.get('/available/search', EmployeeController.getAvailableEmployees);

export default router;
