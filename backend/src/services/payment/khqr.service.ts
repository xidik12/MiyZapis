import { logger } from '@/utils/logger';
import crypto from 'crypto';

export interface KHQRPaymentRequest {
  amount: number;
  currency: string; // KHR, USD
  orderId: string;
  merchantName: string;
  description: string;
}

export interface KHQRPaymentResponse {
  qrCode: string; // Base64 encoded QR code image
  qrString: string; // KHQR string for generating QR
  transactionId: string;
  amount: number;
  currency: string;
  expiresAt: Date;
  status: 'PENDING';
}

export interface BakongWebhookData {
  txnId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  timestamp: string;
  signature: string;
}

export class KHQRService {
  private readonly merchantId: string;
  private readonly merchantAccountId: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly apiUrl: string;

  constructor() {
    this.merchantId = process.env.KHQR_MERCHANT_ID || '';
    this.merchantAccountId = process.env.KHQR_MERCHANT_ACCOUNT_ID || '';
    this.apiKey = process.env.KHQR_API_KEY || '';
    this.apiSecret = process.env.KHQR_API_SECRET || '';
    this.apiUrl = process.env.KHQR_API_URL || 'https://api-bakong.nbc.gov.kh';

    if (!this.merchantId || !this.merchantAccountId || !this.apiKey) {
      logger.warn('KHQR/Bakong credentials not configured. Payment processing will be limited.');
    }
  }

  /**
   * Generate KHQR code for payment
   */
  async generateKHQR(request: KHQRPaymentRequest): Promise<KHQRPaymentResponse> {
    try {
      logger.info('[KHQR] Generating KHQR code', {
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
      });

      const transactionId = `KHQR_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Build KHQR string according to Bakong specification
      const khqrString = this.buildKHQRString({
        merchantId: this.merchantId,
        merchantAccountId: this.merchantAccountId,
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        merchantName: request.merchantName,
        description: request.description,
      });

      // Generate QR code image (base64)
      const qrCode = await this.generateQRCodeImage(khqrString);

      logger.info('[KHQR] KHQR code generated successfully', {
        transactionId,
        orderId: request.orderId,
      });

      return {
        qrCode,
        qrString: khqrString,
        transactionId,
        amount: request.amount,
        currency: request.currency,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes expiry
        status: 'PENDING',
      };
    } catch (error) {
      logger.error('[KHQR] Failed to generate KHQR code', {
        orderId: request.orderId,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Check payment status via Bakong API
   */
  async checkPaymentStatus(transactionId: string): Promise<{
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
    amount?: number;
    currency?: string;
  }> {
    try {
      logger.info('[KHQR] Checking payment status', { transactionId });

      // Call Bakong API to check transaction status
      const response = await fetch(`${this.apiUrl}/v1/check_transaction_by_md`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          md: transactionId,
        }),
      });
      if (!response.ok) {
        throw new Error(`Bakong API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        status: this.mapBakongStatus(data.status),
        amount: data.amount,
        currency: data.currency,
      };
    } catch (error) {
      logger.error('[KHQR] Failed to check payment status', {
        transactionId,
        error: error instanceof Error ? error.message : error,
      });
      // Return PENDING if we can't check status
      return { status: 'PENDING' };
    }
  }

  /**
   * Process Bakong webhook callback
   */
  async processWebhook(webhookData: BakongWebhookData): Promise<{
    isValid: boolean;
    transactionId: string;
    orderId: string;
    status: string;
  }> {
    try {
      logger.info('[KHQR] Processing Bakong webhook', {
        txnId: webhookData.txnId,
        orderId: webhookData.orderId,
        status: webhookData.status,
      });

      // Verify webhook signature
      const isValid = this.verifyWebhookSignature(webhookData);

      if (!isValid) {
        logger.warn('[KHQR] Invalid webhook signature', {
          txnId: webhookData.txnId,
        });
        return {
          isValid: false,
          transactionId: webhookData.txnId,
          orderId: webhookData.orderId,
          status: webhookData.status,
        };
      }

      logger.info('[KHQR] Webhook verified successfully', {
        txnId: webhookData.txnId,
        orderId: webhookData.orderId,
      });

      return {
        isValid: true,
        transactionId: webhookData.txnId,
        orderId: webhookData.orderId,
        status: webhookData.status,
      };
    } catch (error) {
      logger.error('[KHQR] Webhook processing failed', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  /**
   * Build KHQR string according to Bakong specification
   */
  private buildKHQRString(params: {
    merchantId: string;
    merchantAccountId: string;
    amount: number;
    currency: string;
    orderId: string;
    merchantName: string;
    description: string;
  }): string {
    // KHQR format follows EMVCo specification
    // This is a simplified version - actual implementation should follow full spec

    const payloadFormatIndicator = '01'; // Fixed value
    const pointOfInitiationMethod = '12'; // Dynamic QR

    // Merchant Account Information
    const merchantAccountInfo = this.buildTLV('00', params.merchantAccountId);
    const merchantInfo = this.buildTLV('29', merchantAccountInfo);

    // Transaction Amount
    const transactionAmount = this.buildTLV('54', params.amount.toFixed(2));

    // Transaction Currency (KHR = 116, USD = 840)
    const currencyCode = params.currency === 'KHR' ? '116' : '840';
    const transactionCurrency = this.buildTLV('53', currencyCode);

    // Country Code
    const countryCode = this.buildTLV('58', 'KH');

    // Merchant Name
    const merchantName = this.buildTLV('59', params.merchantName.substring(0, 25));

    // Merchant City
    const merchantCity = this.buildTLV('60', 'Phnom Penh');

    // Additional Data Field
    const billNumber = this.buildTLV('01', params.orderId);
    const additionalData = this.buildTLV('62', billNumber);

    // Combine all fields
    const khqrData = [
      this.buildTLV('00', payloadFormatIndicator),
      this.buildTLV('01', pointOfInitiationMethod),
      merchantInfo,
      transactionCurrency,
      transactionAmount,
      countryCode,
      merchantName,
      merchantCity,
      additionalData,
    ].join('');

    // Calculate CRC
    const crc = this.calculateCRC(khqrData + '6304');

    return khqrData + '63' + ('0' + crc.toString(16).toUpperCase()).slice(-4);
  }

  /**
   * Build TLV (Tag-Length-Value) field
   */
  private buildTLV(tag: string, value: string): string {
    const length = value.length.toString().padStart(2, '0');
    return tag + length + value;
  }

  /**
   * Calculate CRC-16/CCITT-FALSE for KHQR
   */
  private calculateCRC(data: string): number {
    let crc = 0xFFFF;

    for (let i = 0; i < data.length; i++) {
      crc ^= data.charCodeAt(i) << 8;

      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }

    return crc & 0xFFFF;
  }

  /**
   * Generate QR code image from KHQR string
   */
  private async generateQRCodeImage(khqrString: string): Promise<string> {
    try {
      // Use a QR code generation library (e.g., qrcode)
      // For now, return the string itself - should be replaced with actual QR image generation
      const QRCode = require('qrcode');
      const qrCodeDataUrl = await QRCode.toDataURL(khqrString, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
      });

      // Return base64 string without the data URL prefix
      return qrCodeDataUrl.split(',')[1];
    } catch (error) {
      logger.error('[KHQR] Failed to generate QR code image', {
        error: error instanceof Error ? error.message : error,
      });
      // Return empty string if QR generation fails
      return '';
    }
  }

  /**
   * Verify Bakong webhook signature
   */
  private verifyWebhookSignature(webhookData: BakongWebhookData): boolean {
    if (!this.apiSecret) {
      logger.warn('[KHQR] API secret not configured, skipping signature verification');
      return true; // Allow in development
    }

    const dataToSign = [
      webhookData.txnId,
      webhookData.orderId,
      webhookData.amount,
      webhookData.currency,
      webhookData.status,
      webhookData.timestamp,
    ].join('|');

    const expectedSignature = crypto
      .createHmac('sha256', this.apiSecret)
      .update(dataToSign)
      .digest('hex');

    return webhookData.signature === expectedSignature;
  }

  /**
   * Map Bakong status to our internal status
   */
  private mapBakongStatus(bakongStatus: string): 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED' {
    const statusMap: Record<string, 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED'> = {
      'SUCCESS': 'COMPLETED',
      'COMPLETED': 'COMPLETED',
      'PENDING': 'PENDING',
      'FAILED': 'FAILED',
      'EXPIRED': 'EXPIRED',
      'CANCELLED': 'FAILED',
    };

    return statusMap[bakongStatus.toUpperCase()] || 'PENDING';
  }

  /**
   * Check if KHQR service is configured
   */
  isConfigured(): boolean {
    return !!(this.merchantId && this.merchantAccountId && this.apiKey);
  }
}

export const khqrService = new KHQRService();
