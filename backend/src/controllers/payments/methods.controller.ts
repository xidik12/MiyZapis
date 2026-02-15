import { Response } from 'express';
import { PaymentService } from '@/services/payment';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { ErrorCodes, AuthenticatedRequest } from '@/types';

export class MethodsPaymentController {
  // Get user payment methods
  static async getUserPaymentMethods(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const paymentMethods = await PaymentService.getUserPaymentMethods(req.user.id);

      res.json(
        createSuccessResponse({
          paymentMethods,
        })
      );
    } catch (error: any) {
      logger.error('Get user payment methods error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get payment methods',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Add payment method
  static async addPaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const paymentMethodData = {
        ...req.body,
        userId: req.user.id,
      };

      const paymentMethod = await PaymentService.addPaymentMethod(paymentMethodData);

      res.status(201).json(
        createSuccessResponse({
          paymentMethod,
          message: 'Payment method added successfully',
        })
      );
    } catch (error: any) {
      logger.error('Add payment method error:', error);

      if (error.message === 'PAYMENT_METHOD_EXISTS') {
        res.status(409).json(
          createErrorResponse(
            ErrorCodes.DUPLICATE_RESOURCE,
            'Payment method already exists',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to add payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Update payment method
  static async updatePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const paymentMethod = await PaymentService.updatePaymentMethod(methodId, req.user.id, req.body);

      if (!paymentMethod) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          paymentMethod,
          message: 'Payment method updated successfully',
        })
      );
    } catch (error: any) {
      logger.error('Update payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Delete payment method
  static async deletePaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const success = await PaymentService.deletePaymentMethod(methodId, req.user.id);

      if (!success) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          message: 'Payment method deleted successfully',
        })
      );
    } catch (error: any) {
      logger.error('Delete payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  // Set default payment method
  static async setDefaultPaymentMethod(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { methodId } = req.params;

      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const paymentMethod = await PaymentService.setDefaultPaymentMethod(methodId, req.user.id);

      if (!paymentMethod) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Payment method not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      res.json(
        createSuccessResponse({
          paymentMethod,
          message: 'Default payment method set successfully',
        })
      );
    } catch (error: any) {
      logger.error('Set default payment method error:', error);

      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to set default payment method',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
