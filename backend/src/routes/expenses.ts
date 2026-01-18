import { Router } from 'express';
import { ExpenseController } from '@/controllers/expenses';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';
import { body, query } from 'express-validator';

const router = Router();

// Validation middleware
const createExpenseValidation = [
  body('category')
    .isIn(['RENT', 'UTILITIES', 'CONSUMABLES', 'EQUIPMENT', 'INSURANCE', 'MARKETING', 'SALARIES', 'OTHER'])
    .withMessage('Invalid expense category'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .isISO8601()
    .withMessage('Invalid date format'),
  body('currency')
    .optional()
    .isString()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter code'),
  body('description')
    .optional()
    .isString()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurringFrequency')
    .optional()
    .isIn(['WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY'])
    .withMessage('Invalid recurring frequency'),
];

const updateExpenseValidation = [
  body('category')
    .optional()
    .isIn(['RENT', 'UTILITIES', 'CONSUMABLES', 'EQUIPMENT', 'INSURANCE', 'MARKETING', 'SALARIES', 'OTHER'])
    .withMessage('Invalid expense category'),
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
];

// All routes require authentication and specialist access
router.use(authenticateToken, requireSpecialist);

// Get expense summary/statistics
router.get('/summary', ExpenseController.getExpenseSummary);

// Get all expenses
router.get('/', ExpenseController.getExpenses);

// Get expense by ID
router.get('/:id', ExpenseController.getExpenseById);

// Create expense
router.post('/', createExpenseValidation, ExpenseController.createExpense);

// Update expense
router.put('/:id', updateExpenseValidation, ExpenseController.updateExpense);

// Delete expense
router.delete('/:id', ExpenseController.deleteExpense);

export default router;
