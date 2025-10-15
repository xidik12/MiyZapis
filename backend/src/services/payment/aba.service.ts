import { logger } from '@/utils/logger';
import crypto from 'crypto';

export interface ABAPaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  returnUrl?: string;
  cancelUrl?: string;
}

export interface ABAPaymentResponse {
  transactionId: string;
  paymentUrl: string;
  qrCodeUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
  amount: number;
  currency: string;
  expiresAt: Date;
}

export interface ABAWebhookData {
  transactionId: string;
  orderId: string;
  status: string;
  amount: number;
  currency: string;
  timestamp: string;
  signature: string;
}

export class ABAPaymentService {
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly apiUrl: string;

  constructor() {
    this.merchantId = process.env.ABA_MERCHANT_ID || '';
    this.apiKey = process.env.ABA_API_KEY || '';
    this.apiSecret = process.env.ABA_API_SECRET || '';
    this.apiUrl = process.env.ABA_API_URL || 'https://checkout.payway.com.kh/api/payment-gateway/v1';

    if (!this.merchantId || !this.apiKey || !this.apiSecret) {
      logger.warn('ABA Payment credentials not configured. Payment processing will be limited.');
    }
  }

  /**
   * Create a payment request with ABA PayWay
   */
  async createPayment(request: ABAPaymentRequest): Promise<ABAPaymentResponse> {
    try {
      logger.info('[ABA] Creating payment request', {
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
      });

      // Generate transaction ID
      const transactionId = `ABA_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Build request payload
      const payload = {
        req_time: new Date().toISOString(),
        merchant_id: this.merchantId,
        tran_id: transactionId,
        amount: Math.round(request.amount * 100), // Convert to cents
        currency: request.currency,
        payment_option: 'abapay',
        items: request.description,
        return_url: request.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        cancel_url: request.cancelUrl || `${process.env.FRONTEND_URL}/payment/cancel`,
        continue_success_url: request.returnUrl || `${process.env.FRONTEND_URL}/payment/success`,
        customer_name: request.customerName,
        customer_email: request.customerEmail,
        customer_phone: request.customerPhone || '',
      };

      // Generate signature
      const signature = this.generateSignature(payload);

      // Make API request
      const response = await fetch(`${this.apiUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          ...payload,
          hash: signature,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`ABA API error: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();

      logger.info('[ABA] Payment created successfully', {
        transactionId,
        orderId: request.orderId,
      });

      return {
        transactionId,
        paymentUrl: data.payment_url || data.checkout_url,
        qrCodeUrl: data.qr_code_url,
        status: 'PENDING',
        amount: request.amount,
        currency: request.currency,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
      };
    } catch (error) {
      logger.error('[ABA] Failed to create payment', {
        orderId: request.orderId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Get payment status from ABA
   */
  async getPaymentStatus(transactionId: string): Promise<{
    status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED';
    amount: number;
    currency: string;
  }> {
    try {
      logger.info('[ABA] Getting payment status', { transactionId });

      const response = await fetch(`${this.apiUrl}/payments/${transactionId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(`ABA API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        status: this.mapABAStatus(data.status),
        amount: data.amount / 100, // Convert from cents
        currency: data.currency,
      };
    } catch (error) {
      logger.error('[ABA] Failed to get payment status', {
        transactionId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Process ABA webhook
   */
  async processWebhook(webhookData: ABAWebhookData): Promise<{
    isValid: boolean;
    transactionId: string;
    orderId: string;
    status: string;
  }> {
    try {
      logger.info('[ABA] Processing webhook', {
        transactionId: webhookData.transactionId,
        orderId: webhookData.orderId,
        status: webhookData.status,
      });

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(webhookData);

      if (!isValid) {
        logger.warn('[ABA] Invalid webhook signature', {
          transactionId: webhookData.transactionId,
        });
        return {
          isValid: false,
          transactionId: webhookData.transactionId,
          orderId: webhookData.orderId,
          status: webhookData.status,
        };
      }

      logger.info('[ABA] Webhook verified successfully', {
        transactionId: webhookData.transactionId,
        orderId: webhookData.orderId,
      });

      return {
        isValid: true,
        transactionId: webhookData.transactionId,
        orderId: webhookData.orderId,
        status: webhookData.status,
      };
    } catch (error) {
      logger.error('[ABA] Webhook processing failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Generate HMAC signature for ABA request
   */
  private generateSignature(payload: any): string {
    const dataToSign = [
      payload.req_time,
      payload.merchant_id,
      payload.tran_id,
      payload.amount,
    ].join('');

    return crypto
      .createHmac('sha512', this.apiSecret)
      .update(dataToSign)
      .digest('base64');
  }

  /**
   * Verify webhook signature
   */
  private verifyWebhookSignature(webhookData: ABAWebhookData): boolean {
    const dataToSign = [
      webhookData.transactionId,
      webhookData.orderId,
      webhookData.status,
      webhookData.amount,
      webhookData.timestamp,
    ].join('');

    const expectedSignature = crypto
      .createHmac('sha512', this.apiSecret)
      .update(dataToSign)
      .digest('base64');

    return webhookData.signature === expectedSignature;
  }

  /**
   * Map ABA status to our internal status
   */
  private mapABAStatus(abaStatus: string): 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED' {
    const statusMap: Record<string, 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED'> = {
      '0': 'APPROVED',
      '1': 'PENDING',
      '2': 'DECLINED',
      '3': 'CANCELLED',
      'success': 'APPROVED',
      'pending': 'PENDING',
      'failed': 'DECLINED',
      'cancelled': 'CANCELLED',
    };

    return statusMap[abaStatus.toLowerCase()] || 'PENDING';
  }

  /**
   * Check if ABA service is configured
   */
  isConfigured(): boolean {
    return !!(this.merchantId && this.apiKey && this.apiSecret);
  }
}

export const abaService = new ABAPaymentService();
