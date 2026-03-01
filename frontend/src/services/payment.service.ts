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
  // Create booking deposit using Coinbase Commerce
  async createBookingDeposit(data: {
    bookingId: string;
    useWalletFirst?: boolean;
  }): Promise<{
    success: boolean;
    requiresPayment: boolean;
    paymentUrl?: string;
    qrCodeData?: string;
    paymentId?: string;
    message: string;
    booking: Record<string, unknown>;
    finalAmount: number;
    usedWalletAmount: number;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      requiresPayment: boolean;
      paymentUrl?: string;
      qrCodeData?: string;
      paymentId?: string;
      message: string;
      booking: Record<string, unknown>;
      finalAmount: number;
      usedWalletAmount: number;
    }>(`/crypto-payments/bookings/${data.bookingId}/deposit`, {
      bookingId: data.bookingId,
      useWalletFirst: data.useWalletFirst,
      paymentMethod: 'CRYPTO_ONLY'
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create booking deposit');
    }
    return response.data;
  }

  // Create payment intent first (payment-first approach) - supports crypto and PayPal
  async createPaymentIntent(data: {
    serviceId: string;
    scheduledAt: string;
    duration: number;
    customerNotes?: string;
    loyaltyPointsUsed: number;
    useWalletFirst: boolean;
    paymentMethod?: 'AUTO' | 'CRYPTO_ONLY' | 'PAYPAL' | 'WAYFORPAY';
  }): Promise<{
    paymentId: string;
    status: string;
    paymentMethod: string;
    cryptoPayment?: Record<string, unknown>;
    paypalPayment?: Record<string, unknown>;
    wayforpayPayment?: Record<string, unknown>;
    walletTransaction?: Record<string, unknown>;
    totalPaid: number;
    remainingAmount: number;
    paymentUrl?: string;
    qrCodeUrl?: string;
    approvalUrl?: string;
    invoiceUrl?: string;
    message: string;
  }> {
    console.log('💳 PaymentService: Creating payment intent:', data);

    const response = await apiClient.post<{
      paymentId: string;
      status: string;
      paymentMethod: string;
      cryptoPayment?: Record<string, unknown>;
      paypalPayment?: Record<string, unknown>;
      wayforpayPayment?: Record<string, unknown>;
      walletTransaction?: Record<string, unknown>;
      totalPaid: number;
      remainingAmount: number;
      paymentUrl?: string;
      qrCodeUrl?: string;
      approvalUrl?: string;
      invoiceUrl?: string;
      message: string;
    }>('/crypto-payments/intent', {
      ...data,
      paymentMethod: data.paymentMethod || 'AUTO'
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create payment intent');
    }

    console.log('✅ PaymentService: Payment intent created successfully:', response.data);
    return response.data;
  }

  // Create Coinbase Commerce charge for crypto payment
  async createCryptoPaymentIntent(data: {
    serviceId: string;
    specialistId: string;
    scheduledAt: string;
    duration: number;
    customerNotes?: string;
    loyaltyPointsUsed: number;
    useWalletFirst: boolean;
    amount: number; // Amount in cents
    currency: string;
    serviceName: string;
    specialistName?: string;
  }): Promise<{
    paymentId?: string;
    status?: string;
    paymentMethod?: string;
    cryptoPayment?: Record<string, unknown>;
    charge?: {
      id: string;
      code: string;
      paymentUrl: string;
      qrCodeUrl?: string;
      expiresAt: Date;
    };
    walletTransaction?: Record<string, unknown>;
    totalPaid?: number;
    remainingAmount?: number;
    paymentUrl?: string;
    qrCodeUrl?: string;
    message?: string;
  }> {
    console.log('💳 PaymentService: Creating Coinbase charge for crypto payment:', data);

    // Create a temporary booking ID for Coinbase metadata
    const tempBookingId = `temp-booking-${Date.now()}`;

    const response = await apiClient.post<{
      charge: {
        id: string;
        code: string;
        paymentUrl: string;
        qrCodeUrl?: string;
        expiresAt: Date;
      };
    }>('/payments/coinbase/create-charge', {
      bookingId: tempBookingId,
      amount: data.amount / 100, // Convert cents to dollars for Coinbase
      currency: data.currency,
      name: data.serviceName,
      description: data.specialistName
        ? `${data.serviceName} - ${data.specialistName}`
        : data.serviceName,
      metadata: {
        bookingData: {
          serviceId: data.serviceId,
          specialistId: data.specialistId, // Add specialistId
          scheduledAt: data.scheduledAt,
          duration: data.duration,
          customerNotes: data.customerNotes,
          loyaltyPointsUsed: data.loyaltyPointsUsed,
          useWalletFirst: data.useWalletFirst
        }
      }
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create Coinbase charge');
    }

    console.log('✅ PaymentService: Coinbase charge created:', response.data);

    // Return structure matching what BookingFlow expects
    return {
      charge: response.data.charge,
      paymentUrl: response.data.charge.paymentUrl,
      qrCodeUrl: response.data.charge.qrCodeUrl,
      finalAmount: data.amount, // Amount in cents
      status: 'PENDING', // Initial status for external payment
      remainingAmount: data.amount,
      paymentMethod: 'CRYPTO',
      message: 'Crypto payment initiated'
    };
  }

  // Process deposit payment (legacy method for compatibility)
  async processDeposit(data: ProcessPaymentRequest): Promise<{
    paymentIntent: PaymentIntent;
    booking: Record<string, unknown>; // Booking type
  }> {
    const response = await apiClient.post<{
      paymentIntent: PaymentIntent;
      booking: Record<string, unknown>;
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
    booking: Record<string, unknown>; // Booking type
  }> {
    const response = await apiClient.post<{
      payment: Payment;
      loyaltyPointsEarned: number;
      booking: Record<string, unknown>;
    }>('/payments/process-full-payment', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process full payment');
    }
    return response.data;
  }

  // Create payment intent for Stripe (legacy method)
  async createStripePaymentIntent(data: {
    amount: number;
    currency: string;
    bookingId: string;
    paymentType: PaymentType;
    loyaltyPointsUsed?: number;
  }): Promise<PaymentIntent> {
    const response = await apiClient.post<PaymentIntent>('/payments/intent', data);

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
    }>('/payments/confirm', {
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
    paymentMethod: Record<string, unknown>;
  }> {
    const response = await apiClient.post<{
      message: string;
      paymentMethod: Record<string, unknown>;
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
  async handleWebhook(eventType: string, data: unknown): Promise<{ received: boolean }> {
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

    const response = await apiClient.post(`/payments/disputes/${disputeId}/evidence`, formData);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to submit dispute evidence');
    }
    return response.data;
  }

  // Coinbase Payment Methods

  // Get booking payment status
  async getBookingPaymentStatus(bookingId: string): Promise<{
    status: 'pending' | 'paid' | 'failed' | 'expired';
    paymentId?: string;
    paymentUrl?: string;
    qrCodeData?: string;
    amount: number;
    currency: string;
    message: string;
  }> {
    const response = await apiClient.get<{
      status: 'pending' | 'paid' | 'failed' | 'expired';
      paymentId?: string;
      paymentUrl?: string;
      qrCodeData?: string;
      amount: number;
      currency: string;
      message: string;
    }>(`/crypto-payments/bookings/${bookingId}/status`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get booking payment status');
    }
    return response.data;
  }

  // Get payment options
  async getPaymentOptions(amount?: number): Promise<{
    supportedMethods: Array<{
      id: string;
      name: string;
      description: string;
      isAvailable: boolean;
    }>;
    depositConfiguration: {
      amountUSD: number;
      amountUAH: number;
      currency: string;
      description: string;
    };
  }> {
    const params = amount ? `?amount=${amount}` : '';
    const response = await apiClient.get<{
      supportedMethods: Array<{
        id: string;
        name: string;
        description: string;
        isAvailable: boolean;
      }>;
      depositConfiguration: {
        amountUSD: number;
        amountUAH: number;
        currency: string;
        description: string;
      };
    }>(`/crypto-payments/onramp/options${params}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment options');
    }
    return response.data;
  }

  // Create onramp session for fiat-to-crypto
  async createOnrampSession(data: {
    amount: number;
    currency: string;
    userAddress: string;
    purpose?: string;
    bookingId?: string;
  }): Promise<{
    sessionId: string;
    onrampURL: string;
    expiresAt: string;
    amount: number;
    currency: string;
  }> {
    const response = await apiClient.post<{
      sessionId: string;
      onrampURL: string;
      expiresAt: string;
      amount: number;
      currency: string;
    }>('/crypto-payments/onramp/create-session', data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create onramp session');
    }
    return response.data;
  }

  // Get onramp session status
  async getOnrampSessionStatus(sessionId: string): Promise<{
    status: 'pending' | 'completed' | 'failed' | 'expired';
    amount: number;
    currency: string;
    transactionHash?: string;
    completedAt?: string;
    failedReason?: string;
  }> {
    const response = await apiClient.get<{
      status: 'pending' | 'completed' | 'failed' | 'expired';
      amount: number;
      currency: string;
      transactionHash?: string;
      completedAt?: string;
      failedReason?: string;
    }>(`/crypto-payments/onramp/session/${sessionId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get onramp session status');
    }
    return response.data;
  }

  // Complete onramp session
  async completeOnrampSession(sessionId: string, data: {
    transactionHash: string;
    amount: number;
    currency: string;
  }): Promise<{
    success: boolean;
    message: string;
    booking?: Record<string, unknown>;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      booking?: Record<string, unknown>;
    }>(`/crypto-payments/onramp/session/${sessionId}/complete`, data);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to complete onramp session');
    }
    return response.data;
  }

  // Get wallet balance
  async getWalletBalance(): Promise<{
    balance: number;
    currency: string;
    transactions: Array<{
      id: string;
      type: 'deposit' | 'withdrawal' | 'booking_payment' | 'refund';
      amount: number;
      description: string;
      createdAt: string;
    }>;
  }> {
    const response = await apiClient.get<{
      balance: number;
      currency: string;
      transactions: Array<{
        id: string;
        type: 'deposit' | 'withdrawal' | 'booking_payment' | 'refund';
        amount: number;
        description: string;
        createdAt: string;
      }>;
    }>('/crypto-payments/wallet');

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get wallet balance');
    }
    return response.data;
  }

  // Apply wallet to booking
  async applyWalletToBooking(bookingId: string): Promise<{
    success: boolean;
    message: string;
    appliedAmount: number;
    remainingBalance: number;
    booking: Record<string, unknown>;
  }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      appliedAmount: number;
      remainingBalance: number;
      booking: Record<string, unknown>;
    }>(`/crypto-payments/wallet/apply/${bookingId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to apply wallet to booking');
    }
    return response.data;
  }

  // Specialist-specific earnings methods
  async getSpecialistEarnings(filters: {
    startDate?: string;
    endDate?: string;
    status?: PaymentStatus;
    limit?: number;
  } = {}): Promise<{
    payments: Payment[];
    totalEarnings: number;
    pendingEarnings: number;
    completedEarnings: number;
    statistics: Record<string, unknown>;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      payments: Payment[];
      totalEarnings: number;
      pendingEarnings: number;
      completedEarnings: number;
      statistics: Record<string, unknown>;
    }>(`/payments/earnings/my?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get specialist earnings');
    }
    return response.data;
  }

  async getEarningsOverview(): Promise<{
    totalEarnings: number;
    thisMonth: number;
    pending: number;
    completed: number;
    monthlyTrend: Array<{ month: string; earnings: number }>;
  }> {
    const response = await apiClient.get<{
      totalEarnings: number;
      thisMonth: number;
      pending: number;
      completed: number;
      monthlyTrend: Array<{ month: string; earnings: number }>;
    }>('/payments/earnings/overview');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get earnings overview');
    }
    return response.data;
  }

  async getRevenueData(filters: {
    period?: 'week' | 'month' | 'quarter' | 'year';
    startDate?: string;
    endDate?: string;
  } = {}): Promise<{
    totalRevenue: number;
    pendingRevenue: number;
    paidRevenue: number;
    monthlyBreakdown: Array<{ month: string; revenue: number; bookings: number }>;
    trends: Record<string, unknown>;
  }> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await apiClient.get<{
      totalRevenue: number;
      pendingRevenue: number;
      paidRevenue: number;
      monthlyBreakdown: Array<{ month: string; revenue: number; bookings: number }>;
      trends: Record<string, unknown>;
    }>(`/payments/earnings/revenue?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get revenue data');
    }
    return response.data;
  }

  // Get payment status for polling
  async getPaymentStatus(paymentId: string): Promise<{
    status: string;
    bookingId?: string;
    amount: number;
    currency: string;
    confirmedAt?: Date;
  }> {
    const response = await apiClient.get<{
      status: string;
      bookingId?: string;
      amount: number;
      currency: string;
      confirmedAt?: Date;
    }>(`/payments/${paymentId}/status`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get payment status');
    }
    return response.data;
  }

  // PayPal Payment Methods

  // Create PayPal order for booking
  async createPayPalOrder(data: {
    bookingId: string;
    amount: number;
    currency: string;
    description?: string;
    bookingData?: {
      serviceId: string;
      specialistId: string;
      scheduledAt: string;
      duration: number;
      customerNotes?: string;
      serviceName: string;
      specialistName: string;
      servicePrice: number;
      serviceCurrency: string;
    };
  }): Promise<{
    order: {
      id: string;
      status: string;
      links?: Array<{ rel: string; href: string }>;
    };
    approvalUrl: string;
  }> {
    const response = await apiClient.post<{
      order: {
        id: string;
        status: string;
        links?: Array<{ rel: string; href: string }>;
      };
      approvalUrl: string;
    }>('/payments/paypal/create-order', {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency,
      description: data.description || 'Booking payment',
      bookingData: data.bookingData
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create PayPal order');
    }

    return response.data;
  }

  // Capture PayPal order after user approval
  async capturePayPalOrder(data: {
    orderId: string;
  }): Promise<{
    order: {
      id: string;
      status: string;
      captureId?: string;
    };
    captureId: string;
  }> {
    const response = await apiClient.post<{
      order: {
        id: string;
        status: string;
        captureId?: string;
      };
      captureId: string;
    }>('/payments/paypal/capture-order', {
      orderId: data.orderId
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to capture PayPal order');
    }

    return response.data;
  }

  // Get PayPal order details
  async getPayPalOrderDetails(orderId: string): Promise<{
    id: string;
    status: string;
    intent: string;
    purchaseUnits?: Record<string, unknown>[];
    paymentSource?: Record<string, unknown>;
    createTime?: string;
    updateTime?: string;
  }> {
    const response = await apiClient.get<{
      order: {
        id: string;
        status: string;
        intent: string;
        purchaseUnits?: Record<string, unknown>[];
        paymentSource?: Record<string, unknown>;
        createTime?: string;
        updateTime?: string;
      };
    }>(`/payments/paypal/order/${orderId}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get PayPal order details');
    }

    return response.data.order;
  }

  // Refund PayPal payment
  async refundPayPalPayment(data: {
    captureId: string;
    amount?: number;
    currency?: string;
    reason?: string;
  }): Promise<{
    refund: {
      id: string;
      status: string;
      amount?: Record<string, unknown>;
    };
  }> {
    const response = await apiClient.post<{
      refund: {
        id: string;
        status: string;
        amount?: Record<string, unknown>;
      };
    }>('/payments/paypal/refund', {
      captureId: data.captureId,
      amount: data.amount,
      currency: data.currency,
      reason: data.reason || 'Customer request'
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to process PayPal refund');
    }

    return response.data;
  }

  // WayForPay payment methods

  // Create WayForPay invoice for booking
  async createWayForPayInvoice(data: {
    bookingId: string;
    amount: number;
    currency: string;
    description?: string;
    customerEmail?: string;
    customerPhone?: string;
    bookingData?: {
      serviceId: string;
      specialistId: string;
      scheduledAt: string;
      duration: number;
      customerNotes?: string;
      serviceName: string;
      specialistName: string;
      servicePrice: number;
      serviceCurrency: string;
    };
  }): Promise<{
    invoice: {
      orderReference: string;
      paymentUrl: string;
      formData?: Record<string, string>; // Form data for POST submission
    };
    paymentUrl: string;
  }> {
    console.log('💳 PaymentService: Creating WayForPay invoice:', data);

    const response = await apiClient.post<{
      invoice: {
        orderReference: string;
        paymentUrl: string;
        formData?: Record<string, string>;
      };
      paymentUrl: string;
    }>('/payments/wayforpay/create-invoice', {
      bookingId: data.bookingId,
      amount: data.amount,
      currency: data.currency,
      description: data.description || 'Booking payment',
      customerEmail: data.customerEmail,
      customerPhone: data.customerPhone,
      bookingData: data.bookingData
    });

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create WayForPay invoice');
    }

    console.log('✅ PaymentService: WayForPay invoice created:', response.data);

    return response.data;
  }

  // Get WayForPay payment status
  async getWayForPayPaymentStatus(orderReference: string): Promise<{
    status: {
      transactionStatus: string;
      orderReference: string;
      amount?: number;
      currency?: string;
    };
  }> {
    const response = await apiClient.get<{
      status: {
        transactionStatus: string;
        orderReference: string;
        amount?: number;
        currency?: string;
      };
    }>(`/payments/wayforpay/status/${orderReference}`);

    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get WayForPay payment status');
    }

    return response.data;
  }
}

export const paymentService = new PaymentService();
