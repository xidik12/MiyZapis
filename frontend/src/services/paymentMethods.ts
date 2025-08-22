import { apiClient } from './api';
import { PaymentMethod } from '../types';

export interface PaymentMethodRequest {
  type: string;
  cardLast4?: string;
  cardBrand?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  nickname?: string;
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
}

export interface PaymentMethodUpdateRequest {
  nickname?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
}

export class PaymentMethodsService {
  // Get user's payment methods
  static async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<{ paymentMethods: PaymentMethod[] }>('/payments/methods/my');
    return response.data.paymentMethods;
  }

  // Add a new payment method
  static async addPaymentMethod(paymentMethodData: PaymentMethodRequest): Promise<PaymentMethod> {
    const response = await apiClient.post<{ paymentMethod: PaymentMethod }>('/payments/methods', paymentMethodData);
    return response.data.paymentMethod;
  }

  // Update an existing payment method
  static async updatePaymentMethod(methodId: string, updateData: PaymentMethodUpdateRequest): Promise<PaymentMethod> {
    const response = await apiClient.put<{ paymentMethod: PaymentMethod }>(`/payments/methods/${methodId}`, updateData);
    return response.data.paymentMethod;
  }

  // Delete a payment method
  static async deletePaymentMethod(methodId: string): Promise<void> {
    await apiClient.delete(`/payments/methods/${methodId}`);
  }

  // Set default payment method
  static async setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
    const response = await apiClient.put<{ paymentMethod: PaymentMethod }>(`/payments/methods/${methodId}/default`);
    return response.data.paymentMethod;
  }
}