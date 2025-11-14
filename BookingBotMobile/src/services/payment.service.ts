// Payment service - adapted for React Native
import { apiClient } from './api';
import {
  Payment,
  PaymentIntent,
  ProcessPaymentRequest,
  PaymentMethod,
} from '../types';

export class PaymentService {
  // Create payment intent
  async createPaymentIntent(data: {
    bookingId: string;
    amount: number;
    currency?: string;
    paymentMethod?: string;
  }): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>('/payments/intent', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create payment intent');
    }
    return response.data;
  }

  // Process payment
  async processPayment(data: ProcessPaymentRequest): Promise<Payment> {
    const response = await apiClient.post<Payment>('/payments/process', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process payment');
    }
    return response.data;
  }

  // Confirm payment
  async confirmPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.post<Payment>(`/payments/${paymentId}/confirm`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to confirm payment');
    }
    return response.data;
  }

  // Get payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    const response = await apiClient.get<{ paymentMethods: PaymentMethod[] }>('/payments/methods');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment methods');
    }
    return response.data.paymentMethods || [];
  }

  // Add payment method
  async addPaymentMethod(data: {
    type: string;
    cardLast4?: string;
    cardBrand?: string;
    cardExpMonth?: number;
    cardExpYear?: number;
    stripePaymentMethodId?: string;
    nickname?: string;
  }): Promise<PaymentMethod> {
    const response = await apiClient.post<PaymentMethod>('/payments/methods', data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add payment method');
    }
    return response.data;
  }

  // Delete payment method
  async deletePaymentMethod(methodId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/payments/methods/${methodId}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete payment method');
    }
    return response.data;
  }

  // Set default payment method
  async setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
    const response = await apiClient.put<PaymentMethod>(`/payments/methods/${methodId}/default`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to set default payment method');
    }
    return response.data;
  }

  // Create crypto payment deposit
  async createCryptoDeposit(bookingId: string, useWalletFirst: boolean = false): Promise<{
    success: boolean;
    requiresPayment: boolean;
    paymentUrl?: string;
    qrCodeData?: string;
    paymentId?: string;
    message: string;
    booking: any;
    finalAmount: number;
    usedWalletAmount: number;
  }> {
    const response = await apiClient.post(`/crypto-payments/bookings/${bookingId}/deposit`, {
      bookingId,
      useWalletFirst,
      paymentMethod: 'CRYPTO_ONLY'
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create crypto deposit');
    }
    return response.data;
  }

  // Check crypto payment status
  async checkCryptoPaymentStatus(bookingId: string): Promise<{
    status: string;
    paid: boolean;
    amount: number;
  }> {
    const response = await apiClient.get(`/crypto-payments/bookings/${bookingId}/status`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check crypto payment status');
    }
    return response.data;
  }
}

export const paymentService = new PaymentService();

