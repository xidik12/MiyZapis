import { apiClient } from './api';

export interface PayPalOrderRequest {
  bookingId: string;
  amount: number;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  approvalUrl?: string;
  captureUrl?: string;
  metadata?: Record<string, any>;
}

export interface PayPalCaptureRequest {
  orderId: string;
  metadata?: Record<string, any>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  captureId?: string;
  purchaseUnits: Record<string, unknown>[];
  paymentSource: Record<string, unknown>;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
  metadata?: Record<string, any>;
}

export interface PayPalOrderDetails {
  id: string;
  status: string;
  intent: string;
  purchaseUnits: Record<string, unknown>[];
  paymentSource: Record<string, unknown>;
  createTime: string;
  updateTime: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export class PayPalService {
  private readonly baseUrl = '/api/v1/payments';

  /**
   * Create a PayPal order for booking payment
   */
  async createOrder(data: PayPalOrderRequest): Promise<PayPalOrderResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: PayPalOrderResponse;
        error?: { message: string };
      }>(`${this.baseUrl}/paypal/create-order`, {
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency || 'USD',
        description: data.description,
        metadata: data.metadata,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to create PayPal order');
      }

      return response.data;
    } catch (error) {
      console.error('[PayPal] Failed to create order:', error);
      throw error;
    }
  }

  /**
   * Capture a PayPal order after user approval
   */
  async captureOrder(data: PayPalCaptureRequest): Promise<PayPalCaptureResponse> {
    try {
      const response = await apiClient.post<{
        success: boolean;
        data: PayPalCaptureResponse;
        error?: { message: string };
      }>(`${this.baseUrl}/paypal/capture-order`, {
        orderId: data.orderId,
        metadata: data.metadata,
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to capture PayPal order');
      }

      return response.data;
    } catch (error) {
      console.error('[PayPal] Failed to capture order:', error);
      throw error;
    }
  }

  /**
   * Get PayPal order details
   */
  async getOrderDetails(orderId: string): Promise<PayPalOrderDetails> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: PayPalOrderDetails;
        error?: { message: string };
      }>(`${this.baseUrl}/paypal/order/${orderId}`);

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get order details');
      }

      return response.data;
    } catch (error) {
      console.error('[PayPal] Failed to get order details:', error);
      throw error;
    }
  }

  /**
   * Process payment (redirect user to PayPal approval page)
   */
  async processPayment(orderResponse: PayPalOrderResponse): Promise<void> {
    try {
      const approvalUrl = orderResponse.approvalUrl ||
        orderResponse.links?.find(link => link.rel === 'approve')?.href;

      if (approvalUrl) {
        // Option 1: Redirect current window
        window.location.href = approvalUrl;

        // Option 2: Open in new window (uncomment if preferred)
        // const paymentWindow = window.open(
        //   approvalUrl,
        //   'paypal_payment',
        //   'width=800,height=600,scrollbars=yes,resizable=yes'
        // );

        // if (!paymentWindow) {
        //   throw new Error('Failed to open payment window. Please allow popups for this site.');
        // }
      } else {
        throw new Error('PayPal approval URL not available');
      }
    } catch (error) {
      console.error('[PayPal] Failed to process payment:', error);
      throw error;
    }
  }

  /**
   * Handle PayPal approval callback
   */
  async handleApprovalCallback(urlParams: URLSearchParams): Promise<{
    orderId: string;
    payerId: string;
    captureResult?: PayPalCaptureResponse;
  }> {
    try {
      const orderId = urlParams.get('token');
      const payerId = urlParams.get('PayerID');

      if (!orderId) {
        throw new Error('PayPal order ID not found in callback');
      }

      if (!payerId) {
        throw new Error('PayPal payer ID not found in callback');
      }

      // Automatically capture the order
      const captureResult = await this.captureOrder({ orderId });

      return {
        orderId,
        payerId,
        captureResult,
      };
    } catch (error) {
      console.error('[PayPal] Failed to handle approval callback:', error);
      throw error;
    }
  }

  /**
   * Handle PayPal cancellation callback
   */
  handleCancellationCallback(urlParams: URLSearchParams): {
    orderId: string;
    reason: string;
  } {
    try {
      const orderId = urlParams.get('token') || '';

      return {
        orderId,
        reason: 'Payment cancelled by user',
      };
    } catch (error) {
      console.error('[PayPal] Failed to handle cancellation callback:', error);
      throw error;
    }
  }

  /**
   * Check if PayPal is available/configured
   */
  async isAvailable(): Promise<boolean> {
    try {
      // This would typically check with the backend if PayPal is configured
      // For now, we'll assume it's available if we can reach the endpoint
      return true;
    } catch (error) {
      console.error('[PayPal] Service availability check failed:', error);
      return false;
    }
  }

  /**
   * Get supported currencies for PayPal
   */
  getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD',
      'CHF', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK',
      'HUF', 'BGN', 'RON', 'HRK', 'RUB', 'UAH'
    ];
  }

  /**
   * Format amount for display
   */
  formatAmount(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    // Convert from cents to major currency unit for display
    return formatter.format(amount / 100);
  }

  /**
   * Convert amount to cents for API
   */
  convertToMinorUnit(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Parse URL parameters for payment callbacks
   */
  parseCallbackUrl(url: string): URLSearchParams {
    try {
      const urlObj = new URL(url);
      return urlObj.searchParams;
    } catch (error) {
      console.error('[PayPal] Failed to parse callback URL:', error);
      return new URLSearchParams();
    }
  }

  /**
   * Check if current URL is a PayPal callback
   */
  isPayPalCallback(url: string = window.location.href): boolean {
    try {
      const urlParams = this.parseCallbackUrl(url);
      return urlParams.has('token') && (urlParams.has('PayerID') || url.includes('cancel'));
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if callback indicates success
   */
  isSuccessCallback(url: string = window.location.href): boolean {
    try {
      const urlParams = this.parseCallbackUrl(url);
      return urlParams.has('token') && urlParams.has('PayerID');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if callback indicates cancellation
   */
  isCancellationCallback(url: string = window.location.href): boolean {
    try {
      return url.includes('cancel') || url.includes('cancelled');
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const paypalService = new PayPalService();