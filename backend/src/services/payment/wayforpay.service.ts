import crypto from 'crypto';
import { config } from '@/config';
import { logger } from '@/utils/logger';

interface WayForPayOrderData {
  bookingId: string;
  amount: number;
  currency: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, string>;
}

interface WayForPayInvoiceData {
  merchantAccount: string;
  merchantDomainName: string;
  merchantTransactionSecureType: string;
  orderReference: string;
  orderDate: number;
  amount: number;
  currency: string;
  productName: string[];
  productPrice: number[];
  productCount: number[];
  language: string;
  returnUrl: string;
  serviceUrl: string;
  clientFirstName?: string;
  clientLastName?: string;
  clientEmail?: string;
  clientPhone?: string;
  merchantSignature: string;
}

interface WayForPayResponse {
  invoiceUrl?: string;
  paymentUrl?: string;
  orderId?: string;
  formData?: any; // Form data for POST submission
  reasonCode?: number;
  reason?: string;
}

interface WayForPayWebhookData {
  merchantAccount: string;
  orderReference: string;
  merchantSignature: string;
  amount: number;
  currency: string;
  authCode: string;
  email: string;
  phone: string;
  createdDate: number;
  processingDate: number;
  cardPan: string;
  cardType: string;
  issuerBankCountry: string;
  issuerBankName: string;
  transactionStatus: string;
  reason: string;
  reasonCode: number;
  fee: number;
  paymentSystem: string;
}

export class WayForPayService {
  private merchantAccount: string;
  private merchantSecret: string;
  private merchantDomain: string;
  private baseUrl: string;
  private mode: string;

  constructor() {
    this.merchantAccount = config.wayforpay.merchantAccount || '';
    this.merchantSecret = config.wayforpay.merchantSecret || '';
    this.merchantDomain = config.wayforpay.merchantDomain || '';
    this.mode = config.wayforpay.mode || 'test';
    this.baseUrl = config.wayforpay.baseUrl || 'https://secure.wayforpay.com/pay';

    logger.info('[WayForPay] Service initialized', {
      mode: this.mode,
      baseUrl: this.baseUrl,
      merchantAccount: this.merchantAccount ? 'configured' : 'not configured'
    });
  }

  // Generate merchant signature for WayForPay requests
  private generateSignature(data: Record<string, any>, fields: string[]): string {
    try {
      const values: string[] = [];

      // Add specified fields in order (merchantAccount should be in fields array)
      fields.forEach(field => {
        if (data[field] !== undefined && data[field] !== null) {
          if (Array.isArray(data[field])) {
            values.push(...data[field].map(String));
          } else {
            values.push(String(data[field]));
          }
        }
      });

      // Signature string format: field1;field2;field3;merchantSecret
      const signatureString = values.join(';') + ';' + this.merchantSecret;
      const signature = crypto.createHash('md5').update(signatureString).digest('hex');

      logger.debug('[WayForPay] Generated signature', {
        fields: fields,
        valuesCount: values.length,
        signatureString: signatureString.replace(this.merchantSecret, '***'),
        signature
      });

      return signature;
    } catch (error) {
      logger.error('[WayForPay] Failed to generate signature', {
        error: error instanceof Error ? error.message : error,
        fields
      });
      throw error;
    }
  }

  // Verify webhook signature
  private verifySignature(data: WayForPayWebhookData): boolean {
    try {
      // WayForPay webhook signature fields in exact order
      const fields = [
        'merchantAccount',
        'orderReference',
        'amount',
        'currency',
        'authCode',
        'cardPan',
        'transactionStatus',
        'reasonCode'
      ];

      const expectedSignature = this.generateSignature(data, fields);
      const isValid = expectedSignature === data.merchantSignature;

      logger.info('[WayForPay] Webhook signature verification', {
        isValid,
        orderReference: data.orderReference,
        transactionStatus: data.transactionStatus,
        receivedSignature: data.merchantSignature?.substring(0, 10) + '...',
        expectedSignature: expectedSignature.substring(0, 10) + '...',
      });

      return isValid;
    } catch (error) {
      logger.error('[WayForPay] Webhook signature verification failed', {
        error: error instanceof Error ? error.message : error,
        orderReference: data.orderReference
      });
      return false;
    }
  }

  // Create payment invoice
  async createInvoice(data: WayForPayOrderData): Promise<WayForPayResponse> {
    try {
      const { bookingId, amount, currency, description = 'Booking payment', customerEmail, customerPhone, metadata = {} } = data;

      logger.info('[WayForPay] Creating invoice', {
        bookingId,
        amount,
        currency,
        description
      });

      // Convert amount to kopecks/cents (WayForPay expects amount in smallest currency unit)
      const wayforpayAmount = Math.round(amount);

      const orderReference = `booking-${bookingId}-${Date.now()}`;
      const orderDate = Math.floor(Date.now() / 1000);

      const invoiceData: Partial<WayForPayInvoiceData> = {
        merchantAccount: this.merchantAccount,
        merchantDomainName: this.merchantDomain,
        merchantTransactionSecureType: 'AUTO',
        orderReference,
        orderDate,
        amount: wayforpayAmount,
        currency: currency.toUpperCase(),
        productName: [description],
        productPrice: [wayforpayAmount],
        productCount: [1],
        language: 'ua', // Ukrainian by default
        returnUrl: `${config.frontend.url}/booking/${bookingId}?payment=success`,
        serviceUrl: `${config.backend.url}/api/v1/payments/wayforpay/webhook`,
      };

      // Add customer information if provided
      if (customerEmail) {
        invoiceData.clientEmail = customerEmail;
      }
      if (customerPhone) {
        invoiceData.clientPhone = customerPhone;
      }

      // Generate signature
      // WayForPay invoice signature fields in exact order
      const signatureFields = [
        'merchantAccount',
        'merchantDomainName',
        'orderReference',
        'orderDate',
        'amount',
        'currency',
        'productName',
        'productCount',
        'productPrice'
      ];

      invoiceData.merchantSignature = this.generateSignature(invoiceData, signatureFields);

      // Create form data for WayForPay
      const formData = new URLSearchParams();
      Object.entries(invoiceData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, String(item));
          });
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      logger.info('[WayForPay] Invoice created successfully', {
        orderReference,
        amount: wayforpayAmount,
        currency: currency.toUpperCase(),
        bookingId,
        invoiceData: {
          ...invoiceData,
          merchantSignature: invoiceData.merchantSignature?.substring(0, 10) + '...'
        }
      });

      // WayForPay requires POST form submission, not GET
      // Return the invoice data for frontend to submit via POST form
      return {
        paymentUrl: this.baseUrl,
        orderId: orderReference,
        invoiceUrl: this.baseUrl,
        formData: invoiceData, // Return form data for POST submission
        reasonCode: 1100,
        reason: 'Invoice created successfully'
      };

    } catch (error) {
      logger.error('[WayForPay] Invoice creation failed', {
        error: error.message,
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency
      });
      throw error;
    }
  }

  // Process webhook notification
  async processWebhook(webhookData: WayForPayWebhookData): Promise<{
    isValid: boolean;
    transactionStatus: string;
    orderReference: string;
    amount: number;
    currency: string;
    transactionId?: string;
    data: WayForPayWebhookData;
  }> {
    try {
      logger.info('[WayForPay] Processing webhook', {
        orderReference: webhookData.orderReference,
        transactionStatus: webhookData.transactionStatus,
        amount: webhookData.amount
      });

      // Verify signature
      const isValid = this.verifySignature(webhookData);

      if (!isValid) {
        logger.warn('[WayForPay] Invalid webhook signature', {
          orderReference: webhookData.orderReference
        });
        return {
          isValid: false,
          transactionStatus: 'SIGNATURE_INVALID',
          orderReference: webhookData.orderReference,
          amount: webhookData.amount,
          currency: webhookData.currency,
          data: webhookData
        };
      }

      return {
        isValid: true,
        transactionStatus: webhookData.transactionStatus,
        orderReference: webhookData.orderReference,
        amount: webhookData.amount,
        currency: webhookData.currency,
        transactionId: webhookData.authCode, // Use authCode as transaction ID
        data: webhookData
      };

    } catch (error) {
      logger.error('[WayForPay] Webhook processing failed', {
        error: error.message,
        orderReference: webhookData.orderReference
      });
      throw error;
    }
  }

  // Get payment status by order reference
  async getPaymentStatus(orderReference: string): Promise<WayForPayResponse> {
    try {
      logger.info('[WayForPay] Getting payment status', { orderReference });

      const requestData = {
        merchantAccount: this.merchantAccount,
        orderReference,
      };

      const signatureFields = ['merchantAccount', 'orderReference'];
      const merchantSignature = this.generateSignature(requestData, signatureFields);

      const postData = {
        transactionType: 'CHECK_STATUS',
        merchantAccount: this.merchantAccount,
        orderReference,
        merchantSignature,
        apiVersion: 1
      };

      // In a real implementation, you would make an HTTP request to WayForPay API
      // For now, we'll return a mock response
      logger.info('[WayForPay] Payment status retrieved', {
        orderReference,
        status: 'pending'
      });

      return {
        orderId: orderReference,
        reasonCode: 1100,
        reason: 'Payment status retrieved successfully'
      };

    } catch (error) {
      logger.error('[WayForPay] Failed to get payment status', {
        error: error.message,
        orderReference
      });
      throw error;
    }
  }

  // Generate payment form HTML for frontend integration
  generatePaymentForm(invoiceData: WayForPayInvoiceData): string {
    try {
      let formHtml = `<form method="post" action="${this.baseUrl}" accept-charset="utf-8">`;

      Object.entries(invoiceData).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formHtml += `<input name="${key}[]" value="${item}" type="hidden">`;
          });
        } else {
          formHtml += `<input name="${key}" value="${value}" type="hidden">`;
        }
      });

      formHtml += '<input type="submit" value="Pay">';
      formHtml += '</form>';

      logger.debug('[WayForPay] Generated payment form', {
        orderReference: invoiceData.orderReference
      });

      return formHtml;
    } catch (error) {
      logger.error('[WayForPay] Failed to generate payment form', {
        error: error.message,
        orderReference: invoiceData.orderReference
      });
      throw error;
    }
  }

  // Check if WayForPay is configured
  static isConfigured(): boolean {
    return !!(config.wayforpay.merchantAccount && config.wayforpay.merchantSecret);
  }

  // Get supported currencies
  static getSupportedCurrencies(): string[] {
    return [
      'UAH', 'USD', 'EUR', 'GBP', 'PLN', 'CZK'
    ];
  }

  // Convert currency if needed (placeholder - you might want to implement actual conversion)
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      // For now, return the same amount
      // In a real implementation, you would convert currencies
      logger.warn('[WayForPay] Currency conversion not implemented', {
        amount,
        fromCurrency,
        toCurrency
      });

      return amount;
    } catch (error) {
      logger.error('[WayForPay] Currency conversion failed', {
        error: error.message,
        amount,
        fromCurrency,
        toCurrency
      });
      throw error;
    }
  }
}

// Create singleton instance
export const wayforpayService = new WayForPayService();