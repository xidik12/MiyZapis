import { apiClient } from './api';
import {
  Payment,
  PaymentIntent,
  ProcessPaymentRequest,
  PaymentType,
  PaymentStatus,
  Pagination,
  ApiResponse
} from '@/types';

export class PaymentService {
  // Process deposit payment
  async processDeposit(data: ProcessPaymentRequest): Promise<{
    paymentIntent: PaymentIntent;
    booking: any; // Booking type
  }> {
    const response = await apiClient.post<{
      paymentIntent: PaymentIntent;
      booking: any;
    }>('/payments/process-deposit', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process deposit payment');
    }
    return response.data;
  }

  // Process full payment after session
  async processFullPayment(data: ProcessPaymentRequest): Promise<{
    payment: Payment;
    loyaltyPointsEarned: number;
    booking: any; // Booking type
  }> {
    const response = await apiClient.post<{
      payment: Payment;
      loyaltyPointsEarned: number;
      booking: any;
    }>('/payments/process-full-payment', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process full payment');
    }
    return response.data;
  }

  // Create payment intent for Stripe
  async createPaymentIntent(data: {
    amount: number;
    currency: string;
    bookingId: string;
    paymentType: PaymentType;
    loyaltyPointsUsed?: number;
  }): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>('/payments/create-intent', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create payment intent');
    }
    return response.data;
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string): Promise<{
    payment: Payment;
    status: PaymentStatus;
  }> {
    const response = await apiClient.post<{
      payment: Payment;
      status: PaymentStatus;
    }>('/payments/confirm-intent', {
      paymentIntentId,
      paymentMethodId
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to confirm payment');
    }
    return response.data;
  }

  // Process refund
  async processRefund(data: {
    bookingId: string;
    refundType: 'full' | 'partial' | 'deposit_only';
    amount?: number;
    reason: string;
  }): Promise<{
    refund: Payment;
    refundedAmount: number;
  }> {
    const response = await apiClient.post<{
      refund: Payment;
      refundedAmount: number;
    }>('/payments/refund', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process refund');
    }
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(filters: {
    type?: PaymentType;
    status?: PaymentStatus;
    startDate?: string;
    endDate?: string;
    bookingId?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    payments: Payment[];
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      payments: Payment[];
      pagination: Pagination;
    }>(`/payments/history?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment history');
    }
    return response.data;
  }

  // Get payment details
  async getPayment(paymentId: string): Promise<Payment> {
    const response = await apiClient.get<Payment>(`/payments/${paymentId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment details');
    }
    return response.data;
  }

  // Get payment methods for user
  async getPaymentMethods(): Promise<Array<{
    id: string;
    type: 'card' | 'bank_account';
    last4: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    isDefault: boolean;
  }>> {
    const response = await apiClient.get('/payments/methods');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment methods');
    }
    return response.data.paymentMethods;
  }

  // Add payment method
  async addPaymentMethod(paymentMethodId: string): Promise<{
    message: string;
    paymentMethod: any;
  }> {
    const response = await apiClient.post<{
      message: string;
      paymentMethod: any;
    }>('/payments/methods', { paymentMethodId });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to add payment method');
    }
    return response.data;
  }

  // Remove payment method
  async removePaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/payments/methods/${paymentMethodId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to remove payment method');
    }
    return response.data;
  }

  // Set default payment method
  async setDefaultPaymentMethod(paymentMethodId: string): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(`/payments/methods/${paymentMethodId}/default`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to set default payment method');
    }
    return response.data;
  }

  // Get payment statistics
  async getPaymentStats(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<{
    totalPaid: number;
    totalRefunded: number;
    averageTransactionAmount: number;
    transactionCount: number;
    paymentMethodBreakdown: Array<{
      method: string;
      count: number;
      amount: number;
      percentage: number;
    }>;
    monthlyTrend: Array<{
      month: string;
      amount: number;
      transactions: number;
    }>;
  }> {
    const response = await apiClient.get(`/payments/stats?period=${period}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment statistics');
    }
    return response.data;
  }

  // Retry failed payment
  async retryPayment(paymentId: string, paymentMethodId?: string): Promise<{
    paymentIntent: PaymentIntent;
    status: PaymentStatus;
  }> {
    const response = await apiClient.post<{
      paymentIntent: PaymentIntent;
      status: PaymentStatus;
    }>(`/payments/${paymentId}/retry`, { paymentMethodId });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to retry payment');
    }
    return response.data;
  }

  // Get invoice for payment
  async getInvoice(paymentId: string): Promise<{
    invoiceUrl: string;
    invoiceNumber: string;
  }> {
    const response = await apiClient.get<{
      invoiceUrl: string;
      invoiceNumber: string;
    }>(`/payments/${paymentId}/invoice`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get invoice');
    }
    return response.data;
  }

  // Download invoice PDF
  async downloadInvoice(paymentId: string): Promise<void> {
    await apiClient.download(`/payments/${paymentId}/invoice/download`, `invoice-${paymentId}.pdf`);
  }

  // Validate payment amount with loyalty points
  async validatePaymentAmount(data: {
    bookingId: string;
    loyaltyPointsUsed?: number;
  }): Promise<{
    originalAmount: number;
    loyaltyDiscount: number;
    finalAmount: number;
    currency: string;
    loyaltyPointsValue: number;
  }> {
    const response = await apiClient.post('/payments/validate-amount', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to validate payment amount');
    }
    return response.data;
  }

  // Check if refund is possible
  async checkRefundEligibility(bookingId: string): Promise<{
    isEligible: boolean;
    refundableAmount: number;
    refundDeadline?: string;
    reason?: string;
    refundPolicy: string;
  }> {
    const response = await apiClient.get(`/payments/refund-eligibility/${bookingId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to check refund eligibility');
    }
    return response.data;
  }

  // Handle Stripe webhook (internal use)
  async handleWebhook(eventType: string, data: any): Promise<{ received: boolean }> {
    const response = await apiClient.post<{ received: boolean }>('/payments/webhook', {
      type: eventType,
      data
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to handle webhook');
    }
    return response.data;
  }

  // Get payment disputes
  async getDisputes(filters: {
    status?: 'open' | 'under_review' | 'resolved';
    page?: number;
    limit?: number;
  } = {}): Promise<{
    disputes: Array<{
      id: string;
      paymentId: string;
      status: string;
      amount: number;
      reason: string;
      createdAt: string;
      evidenceDeadline?: string;
    }>;
    pagination: Pagination;
  }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/payments/disputes?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment disputes');
    }
    return response.data;
  }

  // Submit dispute evidence
  async submitDisputeEvidence(disputeId: string, evidence: {
    description: string;
    documents: File[];
  }): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append('description', evidence.description);
    
    evidence.documents.forEach((file, index) => {
      formData.append(`document_${index}`, file);
    });

    const response = await apiClient.post(`/payments/disputes/${disputeId}/evidence`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit dispute evidence');
    }
    return response.data;
  }
}

export const paymentService = new PaymentService();