import { Router } from 'express';
import { ExpenseController } from '@/controllers/expenses';
import { authenticateToken, requireSpecialist } from '@/middleware/auth/jwt';

const router = Router();

// All expense routes require authentication and specialist role
router.use(authenticateToken, requireSpecialist);

// Get expense summary (must be before /:id to avoid conflict)
router.get('/summary', ExpenseController.getExpenseSummary);

// CRUD operations
router.get('/', ExpenseController.getExpenses);
router.get('/:id', ExpenseController.getExpenseById);
router.post('/', ExpenseController.createExpense);
router.put('/:id', ExpenseController.updateExpense);
router.delete('/:id', ExpenseController.deleteExpense);

export default router;
