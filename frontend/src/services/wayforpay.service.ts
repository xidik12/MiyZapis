import { apiClient } from './api';

export interface WayForPayInvoiceRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface WayForPayInvoiceResponse {
  paymentUrl: string;
  orderId: string;
  invoiceUrl: string;
  reasonCode: number;
  reason: string;
}

export interface WayForPayPaymentStatus {
  orderId: string;
  reasonCode: number;
  reason: string;
}

export class WayForPayService {
  private readonly baseUrl = '/api/v1/payments';

  /**
   * Create a WayForPay invoice for booking payment
   */
  async createInvoice(data: WayForPayInvoiceRequest): Promise<WayForPayInvoiceResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: WayForPayInvoiceResponse;
        error?: { message: string };
      }>(`${this.baseUrl}/wayforpay/create-invoice`, {
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency || 'UAH',
        description: data.description,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        metadata: data.metadata,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create WayForPay invoice');
      }

      return response.data;
    } catch (error) {
      console.error('[WayForPay] Failed to create invoice:', error);
      throw error;
    }
  }

  /**
   * Get payment status by order reference
   */
  async getPaymentStatus(orderReference: string): Promise<WayForPayPaymentStatus> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: WayForPayPaymentStatus;
        error?: { message: string };
      }>(`${this.baseUrl}/wayforpay/status/${orderReference}`);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get payment status');
      }

      return response.data;
    } catch (error) {
      console.error('[WayForPay] Failed to get payment status:', error);
      throw error;
    }
  }

  /**
   * Process payment completion (redirect user to payment page)
   */
  async processPayment(invoiceResponse: WayForPayInvoiceResponse): Promise<void> {
    try {
      // For WayForPay, we need to redirect the user to the payment URL
      // This can be done by opening a new window or redirecting current window

      if (invoiceResponse.paymentUrl) {
        // Option 1: Redirect current window
        window.location.href = invoiceResponse.paymentUrl;

        // Option 2: Open in new window (uncomment if preferred)
        // const paymentWindow = window.open(
        //   invoiceResponse.paymentUrl,
        //   'wayforpay_payment',
        //   'width=800,height=600,scrollbars=yes,resizable=yes'
        // );

        // if (!paymentWindow) {
        //   throw new Error('Failed to open payment window. Please allow popups for this site.');
        // }
      } else {
        throw new Error('Payment URL not available');
      }
    } catch (error) {
      console.error('[WayForPay] Failed to process payment:', error);
      throw error;
    }
  }

  /**
   * Check if WayForPay is available/configured
   */
  async isAvailable(): Promise<boolean> {
    try {
      // This would typically check with the backend if WayForPay is configured
      // For now, we'll assume it's available if we can reach the endpoint
      return true;
    } catch (error) {
      console.error('[WayForPay] Service availability check failed:', error);
      return false;
    }
  }

  /**
   * Get supported currencies for WayForPay
   */
  getSupportedCurrencies(): string[] {
    return ['UAH', 'USD', 'EUR', 'GBP', 'PLN', 'CZK'];
  }

  /**
   * Format amount for display (WayForPay expects amounts in kopecks/cents)
   */
  formatAmount(amount: number, currency: string = 'UAH'): string {
    const formatter = new Intl.NumberFormat('uk-UA', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Convert from kopecks/cents to major currency unit for display
    return formatter.format(amount / 100);
  }

  /**
   * Convert amount to kopecks/cents for API
   */
  convertToMinorUnit(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Create payment form data for manual form submission (if needed)
   */
  createPaymentFormData(invoiceResponse: WayForPayInvoiceResponse): FormData {
    const formData = new FormData();

    // For WayForPay, the form data would be included in the invoice response
    // This is a helper method if manual form submission is needed

    if (invoiceResponse.orderId) {
      formData.append('orderReference', invoiceResponse.orderId);
    }

    return formData;
  }

  /**
   * Handle payment success callback
   */
  handlePaymentSuccess(callbackData: Record<string, unknown>): {
    orderId: string;
    transactionStatus: string;
    amount: number;
  } {
    try {
      return {
        orderId: callbackData.orderReference || '',
        transactionStatus: callbackData.transactionStatus || 'Unknown',
        amount: callbackData.amount || 0,
      };
    } catch (error) {
      console.error('[WayForPay] Failed to handle payment success:', error);
      throw error;
    }
  }

  /**
   * Handle payment failure callback
   */
  handlePaymentFailure(callbackData: Record<string, unknown>): {
    orderId: string;
    reason: string;
    reasonCode: number;
  } {
    try {
      return {
        orderId: callbackData.orderReference || '',
        reason: callbackData.reason || 'Payment failed',
        reasonCode: callbackData.reasonCode || 0,
      };
    } catch (error) {
      console.error('[WayForPay] Failed to handle payment failure:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const wayforpayService = new WayForPayService();