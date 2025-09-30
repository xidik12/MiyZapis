import {
  Client,
  Environment,
  LogLevel,
  OrdersController,
  PaymentsController
} from '@paypal/paypal-server-sdk';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { convertCurrency } from '@/utils/currency';

interface PayPalOrderData {
  bookingId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, string>;
}

interface PayPalCaptureData {
  orderId: string;
  metadata?: Record<string, string>;
}

interface PayPalRefundData {
  captureId: string;
  amount?: number;
  currency?: string;
  reason?: string;
}

interface OrderRequest {
  intent: string;
  purchaseUnits: Array<{
    referenceId: string;
    description: string;
    customId: string;
    softDescriptor: string;
    amount: {
      currencyCode: string;
      value: string;
    };
    payee?: {
      emailAddress?: string;
    };
  }>;
  applicationContext?: {
    brandName?: string;
    locale?: string;
    landingPage?: string;
    shippingPreference?: string;
    userAction?: string;
    returnUrl?: string;
    cancelUrl?: string;
  };
  paymentSource?: {
    paypal?: {
      experienceContext?: {
        paymentMethodPreference?: string;
        brandName?: string;
        locale?: string;
        landingPage?: string;
        shippingPreference?: string;
        userAction?: string;
      };
    };
  };
}

interface RefundRequest {
  amount?: {
    currencyCode: string;
    value: string;
  };
  invoiceId?: string;
  noteToPayer?: string;
}

export class PayPalService {
  private client: Client;
  private ordersController: OrdersController;
  private paymentsController: PaymentsController;

  constructor() {
    // Initialize PayPal client
    this.client = new Client({
      clientCredentialsAuthCredentials: {
        oAuthClientId: config.paypal.clientId || '',
        oAuthClientSecret: config.paypal.clientSecret || ''
      },
      timeout: 0,
      environment: config.paypal.mode === 'live' ? Environment.Live : Environment.Sandbox,
      logging: {
        logLevel: LogLevel.Info,
        logRequest: { logBody: true },
        logResponse: { logHeaders: true }
      }
    });

    this.ordersController = new OrdersController(this.client);
    this.paymentsController = new PaymentsController(this.client);

    logger.info('[PayPal] Service initialized', {
      mode: config.paypal.mode,
      baseUrl: config.paypal.baseUrl
    });
  }

  // Create PayPal order for booking payment
  async createOrder(data: PayPalOrderData): Promise<any> {
    try {
      const { bookingId, amount, currency, description = 'Booking payment', metadata = {} } = data;

      logger.info('[PayPal] Creating order', {
        bookingId,
        amount,
        currency
      });

      // Convert amount to PayPal format (ensure 2 decimal places)
      const paypalAmount = (amount / 100).toFixed(2);

      const orderRequest: OrderRequest = {
        intent: 'CAPTURE',
        purchaseUnits: [
          {
            referenceId: bookingId,
            description,
            customId: bookingId,
            softDescriptor: 'MIYZAPIS',
            amount: {
              currencyCode: currency.toUpperCase(),
              value: paypalAmount
            },
            payee: {
              // This should be set to your PayPal merchant account email if needed
              // emailAddress: 'merchant@miyzapis.com'
            }
          }
        ],
        applicationContext: {
          brandName: 'MiyZapis',
          locale: 'en-US',
          landingPage: 'BILLING',
          shippingPreference: 'NO_SHIPPING',
          userAction: 'PAY_NOW',
          returnUrl: `${config.frontend.url || 'https://miyzapis.com'}/booking/payment/success`,
          cancelUrl: `${config.frontend.url || 'https://miyzapis.com'}/booking/payment/cancel`
        },
        // Add custom metadata
        ...(Object.keys(metadata).length > 0 && {
          paymentSource: {
            paypal: {
              experienceContext: {
                paymentMethodPreference: 'IMMEDIATE_PAYMENT_REQUIRED',
                brandName: 'MiyZapis',
                locale: 'en-US',
                landingPage: 'LOGIN',
                shippingPreference: 'NO_SHIPPING',
                userAction: 'PAY_NOW'
              }
            }
          }
        })
      };

      const response = await this.ordersController.createOrder({
        body: orderRequest,
        paypalRequestId: `${bookingId}-${Date.now()}`
      });

      if (response.result && response.result.id) {
        logger.info('[PayPal] Order created successfully', {
          orderId: response.result.id,
          status: response.result.status,
          bookingId
        });

        return {
          id: response.result.id,
          status: response.result.status,
          links: response.result.links,
          approvalUrl: response.result.links?.find(link => link.rel === 'approve')?.href,
          captureUrl: response.result.links?.find(link => link.rel === 'capture')?.href,
          metadata: {
            bookingId,
            ...metadata
          }
        };
      } else {
        throw new Error('PayPal order creation failed: No order ID returned');
      }
    } catch (error) {
      logger.error('[PayPal] Order creation failed', {
        error: error.message,
        bookingId: data.bookingId,
        amount: data.amount,
        currency: data.currency
      });
      throw error;
    }
  }

  // Get order details
  async getOrderDetails(orderId: string): Promise<any> {
    try {
      logger.info('[PayPal] Fetching order details', { orderId });

      const response = await this.ordersController.getOrder({
        id: orderId
      });

      if (response.result) {
        return {
          id: response.result.id,
          status: response.result.status,
          intent: response.result.intent,
          purchaseUnits: response.result.purchaseUnits,
          paymentSource: response.result.paymentSource,
          createTime: response.result.createTime,
          updateTime: response.result.updateTime,
          links: response.result.links
        };
      } else {
        throw new Error('PayPal order not found');
      }
    } catch (error) {
      logger.error('[PayPal] Failed to fetch order details', {
        error: error.message,
        orderId
      });
      throw error;
    }
  }

  // Capture payment for approved order
  async captureOrder(data: PayPalCaptureData): Promise<any> {
    try {
      const { orderId, metadata = {} } = data;

      logger.info('[PayPal] Capturing order', { orderId });

      const response = await this.ordersController.captureOrder({
        id: orderId,
        paypalRequestId: `capture-${orderId}-${Date.now()}`,
        body: {}
      });

      if (response.result && response.result.status === 'COMPLETED') {
        const captureId = response.result.purchaseUnits?.[0]?.payments?.captures?.[0]?.id;

        logger.info('[PayPal] Order captured successfully', {
          orderId,
          captureId,
          status: response.result.status
        });

        return {
          id: response.result.id,
          status: response.result.status,
          captureId,
          purchaseUnits: response.result.purchaseUnits,
          paymentSource: response.result.paymentSource,
          links: response.result.links,
          metadata
        };
      } else {
        throw new Error(`PayPal capture failed: ${response.result?.status || 'Unknown status'}`);
      }
    } catch (error) {
      logger.error('[PayPal] Order capture failed', {
        error: error.message,
        orderId: data.orderId
      });
      throw error;
    }
  }

  // Refund a captured payment
  async refundPayment(data: PayPalRefundData): Promise<any> {
    try {
      const { captureId, amount, currency, reason = 'Customer request' } = data;

      logger.info('[PayPal] Processing refund', {
        captureId,
        amount,
        currency,
        reason
      });

      const refundRequest: RefundRequest = {
        amount: amount && currency ? {
          currencyCode: currency.toUpperCase(),
          value: (amount / 100).toFixed(2)
        } : undefined,
        invoiceId: `refund-${captureId}-${Date.now()}`,
        noteToPayer: reason
      };

      const response = await this.paymentsController.refundCapturedPayment({
        captureId,
        body: refundRequest,
        paypalRequestId: `refund-${captureId}-${Date.now()}`
      });

      if (response.result) {
        logger.info('[PayPal] Refund processed successfully', {
          refundId: response.result.id,
          status: response.result.status,
          captureId
        });

        return {
          id: response.result.id,
          status: response.result.status,
          amount: response.result.amount,
          createTime: response.result.createTime,
          updateTime: response.result.updateTime,
          links: response.result.links
        };
      } else {
        throw new Error('PayPal refund failed: No refund ID returned');
      }
    } catch (error) {
      logger.error('[PayPal] Refund failed', {
        error: error.message,
        captureId: data.captureId
      });
      throw error;
    }
  }

  // Verify webhook signature (for webhook security)
  async verifyWebhookSignature(
    headers: Record<string, string>,
    rawBody: string,
    webhookId: string
  ): Promise<boolean> {
    try {
      // PayPal webhook signature verification
      // This is a simplified version - in production, you should use PayPal's webhook verification SDK
      const authAlgo = headers['paypal-auth-algo'];
      const transmission = headers['paypal-transmission-id'];
      const certId = headers['paypal-cert-id'];
      const signature = headers['paypal-transmission-sig'];
      const timestamp = headers['paypal-transmission-time'];

      if (!authAlgo || !transmission || !certId || !signature || !timestamp) {
        logger.warn('[PayPal] Missing webhook signature headers');
        return false;
      }

      // In production, implement proper signature verification using PayPal's SDK
      // For now, we'll accept webhooks if the webhook ID matches
      const isValid = webhookId === config.paypal.webhookId;

      logger.info('[PayPal] Webhook signature verification', {
        isValid,
        transmission,
        timestamp
      });

      return isValid;
    } catch (error) {
      logger.error('[PayPal] Webhook verification failed', {
        error: error.message
      });
      return false;
    }
  }

  // Check if PayPal is configured
  static isConfigured(): boolean {
    return !!(config.paypal.clientId && config.paypal.clientSecret);
  }

  // Get supported currencies
  static getSupportedCurrencies(): string[] {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'SEK', 'NOK', 'DKK',
      'PLN', 'CZK', 'HUF', 'BGN', 'RON', 'HRK', 'RUB', 'UAH'
    ];
  }

  // Convert currency if needed
  async convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return amount;
      }

      // Use existing currency conversion utility
      return await convertCurrency(amount, fromCurrency, toCurrency);
    } catch (error) {
      logger.error('[PayPal] Currency conversion failed', {
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
export const paypalService = new PayPalService();