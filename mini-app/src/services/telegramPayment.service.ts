import { TelegramPaymentData } from '@/types';

export interface PaymentParams {
  title: string;
  description: string;
  payload: string;
  providerToken: string;
  currency: string;
  amount: number; // in smallest currency unit (cents for USD)
  photoUrl?: string;
  photoSize?: number;
  photoWidth?: number;
  photoHeight?: number;
  needName?: boolean;
  needPhoneNumber?: boolean;
  needEmail?: boolean;
  needShippingAddress?: boolean;
  sendPhoneNumberToProvider?: boolean;
  sendEmailToProvider?: boolean;
  isFlexible?: boolean;
}

export interface PaymentResult {
  success: boolean;
  data?: {
    telegramPaymentChargeId: string;
    providerPaymentChargeId: string;
    orderInfo?: any;
    shippingOptionId?: string;
  };
  error?: string;
}

class TelegramPaymentService {
  private readonly webApp = window.Telegram?.WebApp;

  /**
   * Check if Telegram Payments is available
   */
  isPaymentAvailable(): boolean {
    return !!(this.webApp && this.webApp.openInvoice);
  }

  /**
   * Create and open payment invoice
   */
  async createPayment(params: PaymentParams): Promise<PaymentResult> {
    if (!this.isPaymentAvailable()) {
      throw new Error('Telegram Payments is not available');
    }

    try {
      // Convert amount to smallest currency unit
      const invoiceParams = {
        title: params.title,
        description: params.description,
        payload: params.payload,
        provider_token: params.providerToken,
        currency: params.currency.toUpperCase(),
        prices: [{ label: params.title, amount: params.amount }],
        photo_url: params.photoUrl,
        photo_size: params.photoSize,
        photo_width: params.photoWidth,
        photo_height: params.photoHeight,
        need_name: params.needName,
        need_phone_number: params.needPhoneNumber,
        need_email: params.needEmail,
        need_shipping_address: params.needShippingAddress,
        send_phone_number_to_provider: params.sendPhoneNumberToProvider,
        send_email_to_provider: params.sendEmailToProvider,
        is_flexible: params.isFlexible
      };

      // Create invoice link
      const invoiceUrl = await this.createInvoiceUrl(invoiceParams);

      // Open payment in Telegram
      const result = await this.openPaymentInvoice(invoiceUrl);

      return {
        success: true,
        data: result
      };
    } catch (error) {
      console.error('Payment creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment failed'
      };
    }
  }

  /**
   * Create invoice URL via backend API
   */
  private async createInvoiceUrl(params: any): Promise<string> {
    const response = await fetch('/api/payments/create-invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      throw new Error('Failed to create invoice');
    }

    const data = await response.json();
    return data.invoiceUrl;
  }

  /**
   * Open payment invoice in Telegram
   */
  private async openPaymentInvoice(invoiceUrl: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.webApp?.openInvoice) {
        reject(new Error('Payment not supported'));
        return;
      }

      this.webApp.openInvoice(invoiceUrl, (status: string) => {
        switch (status) {
          case 'paid':
            resolve({
              status: 'paid',
              telegramPaymentChargeId: 'generated_by_telegram',
              providerPaymentChargeId: 'from_provider'
            });
            break;
          case 'cancelled':
            reject(new Error('Payment cancelled by user'));
            break;
          case 'failed':
            reject(new Error('Payment failed'));
            break;
          case 'pending':
            // Payment is being processed
            break;
          default:
            reject(new Error(`Unknown payment status: ${status}`));
        }
      });
    });
  }

  /**
   * Validate pre-checkout query (server-side validation)
   */
  async validatePreCheckout(preCheckoutQueryId: string, payload: string): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/validate-precheckout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify({
          preCheckoutQueryId,
          payload
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Pre-checkout validation failed:', error);
      return false;
    }
  }

  /**
   * Process successful payment (server-side)
   */
  async processSuccessfulPayment(paymentData: any): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(paymentData)
      });

      return response.ok;
    } catch (error) {
      console.error('Payment processing failed:', error);
      return false;
    }
  }

  /**
   * Create booking payment
   */
  async createBookingPayment(bookingData: {
    serviceId: string;
    specialistId: string;
    customerId: string;
    date: string;
    time: string;
    amount: number;
    currency: string;
    serviceName: string;
    specialistName: string;
  }): Promise<PaymentResult> {
    const paymentParams: PaymentParams = {
      title: `${bookingData.serviceName} - ${bookingData.specialistName}`,
      description: `Booking for ${bookingData.date} at ${bookingData.time}`,
      payload: JSON.stringify({
        type: 'booking',
        serviceId: bookingData.serviceId,
        specialistId: bookingData.specialistId,
        customerId: bookingData.customerId,
        date: bookingData.date,
        time: bookingData.time
      }),
      providerToken: import.meta.env.VITE_TELEGRAM_PAYMENT_PROVIDER_TOKEN || '',
      currency: bookingData.currency,
      amount: Math.round(bookingData.amount * 100), // Convert to cents
      photoUrl: undefined,
      needName: true,
      needPhoneNumber: true,
      needEmail: false,
      needShippingAddress: false,
      sendPhoneNumberToProvider: false,
      sendEmailToProvider: false,
      isFlexible: false
    };

    return this.createPayment(paymentParams);
  }

  /**
   * Create service deposit payment
   */
  async createDepositPayment(depositData: {
    bookingId: string;
    amount: number;
    currency: string;
    serviceName: string;
  }): Promise<PaymentResult> {
    const paymentParams: PaymentParams = {
      title: `Deposit - ${depositData.serviceName}`,
      description: 'Service booking deposit',
      payload: JSON.stringify({
        type: 'deposit',
        bookingId: depositData.bookingId
      }),
      providerToken: import.meta.env.VITE_TELEGRAM_PAYMENT_PROVIDER_TOKEN || '',
      currency: depositData.currency,
      amount: Math.round(depositData.amount * 100),
      needName: true,
      needPhoneNumber: true,
      isFlexible: false
    };

    return this.createPayment(paymentParams);
  }

  /**
   * Refund payment
   */
  async refundPayment(paymentData: {
    telegramPaymentChargeId: string;
    amount?: number;
    reason: string;
  }): Promise<boolean> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(paymentData)
      });

      return response.ok;
    } catch (error) {
      console.error('Refund failed:', error);
      return false;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(userId: string): Promise<any[]> {
    try {
      const response = await fetch(`/api/payments/history/${userId}`, {
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payment history');
      }

      const data = await response.json();
      return data.payments || [];
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
      return [];
    }
  }

  /**
   * Convert amount to display format
   */
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  }

  /**
   * Get supported currencies
   */
  getSupportedCurrencies(): string[] {
    return ['USD', 'EUR', 'GBP', 'RUB', 'UAH', 'KZT', 'UZS'];
  }

  /**
   * Validate currency
   */
  isCurrencySupported(currency: string): boolean {
    return this.getSupportedCurrencies().includes(currency.toUpperCase());
  }

  /**
   * Get auth token from storage
   */
  private getAuthToken(): string {
    return localStorage.getItem('authToken') || localStorage.getItem('booking_app_token') || '';
  }

  /**
   * Handle payment completion callback
   */
  onPaymentCompleted(callback: (result: PaymentResult) => void): void {
    // This would be called when payment is completed
    // In a real implementation, this might listen to Telegram events
    // or handle server-sent events for payment status updates
  }

  /**
   * Handle payment error callback
   */
  onPaymentError(callback: (error: string) => void): void {
    // Handle payment errors
  }
}

export const telegramPaymentService = new TelegramPaymentService();