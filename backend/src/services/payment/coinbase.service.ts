import axios from 'axios';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { prisma } from '@/config/database';

interface CoinbaseChargeRequest {
  name: string;
  description: string;
  local_price: {
    amount: string;
    currency: string;
  };
  pricing_type: 'fixed_price';
  metadata?: Record<string, any>;
  redirect_url?: string;
  cancel_url?: string;
}

interface CoinbaseCharge {
  id: string;
  code: string;
  name: string;
  description: string;
  logo_url?: string;
  hosted_url: string;
  created_at: string;
  expires_at: string;
  confirmed_at?: string;
  checkout?: {
    id: string;
  };
  timeline: Array<{
    time: string;
    status: string;
    context?: string;
  }>;
  metadata: Record<string, any>;
  pricing_type: string;
  pricing: {
    local: {
      amount: string;
      currency: string;
    };
    settlement?: {
      amount: string;
      currency: string;
    };
  };
  payments: any[];
  addresses: Record<string, string>;
}

interface CoinbaseWebhookEvent {
  id: string;
  scheduled_for: string;
  attempt_number: number;
  event: {
    id: string;
    resource: string;
    type: string;
    api_version: string;
    created_at: string;
    data: CoinbaseCharge;
  };
}

export class CoinbaseCommerceService {
  private apiKey: string;
  private webhookSecret: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = config.coinbaseCommerce.apiKey || '';
    this.webhookSecret = config.coinbaseCommerce.webhookSecret || '';
    this.baseUrl = config.coinbaseCommerce.baseUrl;

    if (!this.apiKey) {
      logger.warn('Coinbase Commerce API key not configured');
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-CC-Api-Key': this.apiKey,
      'X-CC-Version': '2018-03-22',
    };
  }

  async createCharge(params: {
    amount: number;
    currency: string;
    name: string;
    description: string;
    metadata?: Record<string, any>;
    redirectUrl?: string;
    cancelUrl?: string;
  }): Promise<{
    chargeId: string;
    code: string;
    paymentUrl: string;
    qrCodeUrl?: string;
    expiresAt: Date;
  }> {
    try {
      const chargeRequest: CoinbaseChargeRequest = {
        name: params.name,
        description: params.description,
        local_price: {
          amount: params.amount.toFixed(2),
          currency: params.currency.toUpperCase(),
        },
        pricing_type: 'fixed_price',
        metadata: params.metadata || {},
        redirect_url: params.redirectUrl,
        cancel_url: params.cancelUrl,
      };

      logger.info('Creating Coinbase Commerce charge', {
        amount: params.amount,
        currency: params.currency,
        name: params.name,
      });

      const response = await axios.post(
        `${this.baseUrl}/charges`,
        chargeRequest,
        { headers: this.getHeaders() }
      );

      const charge: CoinbaseCharge = response.data.data;

      // Generate QR code for the payment URL
      let qrCodeUrl: string | undefined;
      try {
        qrCodeUrl = await QRCode.toDataURL(charge.hosted_url, {
          errorCorrectionLevel: 'M',
          margin: 1,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          width: 256
        });
      } catch (qrError) {
        logger.warn('Failed to generate QR code', { error: qrError });
      }

      logger.info('Coinbase Commerce charge created successfully', {
        chargeId: charge.id,
        code: charge.code,
        expiresAt: charge.expires_at,
      });

      return {
        chargeId: charge.id,
        code: charge.code,
        paymentUrl: charge.hosted_url,
        qrCodeUrl,
        expiresAt: new Date(charge.expires_at),
      };
    } catch (error) {
      logger.error('Failed to create Coinbase Commerce charge', {
        error: error instanceof Error ? error.message : error,
        params,
      });
      throw new Error('Failed to create crypto payment charge');
    }
  }

  async getCharge(chargeId: string): Promise<CoinbaseCharge | null> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/charges/${chargeId}`,
        { headers: this.getHeaders() }
      );

      return response.data.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return null;
      }
      logger.error('Failed to get Coinbase Commerce charge', {
        error: error instanceof Error ? error.message : error,
        chargeId,
      });
      throw new Error('Failed to retrieve crypto payment charge');
    }
  }

  async listCharges(params?: {
    limit?: number;
    startingAfter?: string;
    endingBefore?: string;
  }): Promise<CoinbaseCharge[]> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.startingAfter) queryParams.append('starting_after', params.startingAfter);
      if (params?.endingBefore) queryParams.append('ending_before', params.endingBefore);

      const url = `${this.baseUrl}/charges${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url, { headers: this.getHeaders() });

      return response.data.data;
    } catch (error) {
      logger.error('Failed to list Coinbase Commerce charges', {
        error: error instanceof Error ? error.message : error,
        params,
      });
      throw new Error('Failed to list crypto payment charges');
    }
  }

  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.webhookSecret) {
      logger.warn('Coinbase Commerce webhook secret not configured');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');

      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      logger.error('Failed to verify webhook signature', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  async processWebhook(event: CoinbaseWebhookEvent): Promise<void> {
    const { type, data: charge } = event.event;

    logger.info('Processing Coinbase Commerce webhook', {
      eventId: event.event.id,
      eventType: type,
      chargeId: charge.id,
      chargeCode: charge.code,
    });

    try {
      // Find the corresponding crypto payment record
      const cryptoPayment = await prisma.cryptoPayment.findUnique({
        where: { coinbaseChargeId: charge.id },
        include: {
          user: true,
          booking: true,
        },
      });

      if (!cryptoPayment) {
        logger.warn('Crypto payment not found for webhook', {
          chargeId: charge.id,
          eventType: type,
        });
        return;
      }

      // Process different event types
      switch (type) {
        case 'charge:created':
          await this.handleChargeCreated(cryptoPayment.id, charge);
          break;

        case 'charge:confirmed':
          await this.handleChargeConfirmed(cryptoPayment.id, charge);
          break;

        case 'charge:failed':
          await this.handleChargeFailed(cryptoPayment.id, charge);
          break;

        case 'charge:delayed':
          await this.handleChargeDelayed(cryptoPayment.id, charge);
          break;

        case 'charge:pending':
          await this.handleChargePending(cryptoPayment.id, charge);
          break;

        case 'charge:resolved':
          await this.handleChargeResolved(cryptoPayment.id, charge);
          break;

        default:
          logger.info('Unhandled webhook event type', {
            eventType: type,
            chargeId: charge.id,
          });
      }

      // Store webhook data for audit
      await prisma.paymentWebhook.create({
        data: {
          provider: 'COINBASE_COMMERCE',
          eventType: type,
          eventId: event.event.id,
          status: 'PROCESSED',
          processedAt: new Date(),
          payload: JSON.stringify(event),
          relatedId: cryptoPayment.id,
          relatedType: 'CRYPTO_PAYMENT',
        },
      });

    } catch (error) {
      logger.error('Failed to process Coinbase Commerce webhook', {
        error: error instanceof Error ? error.message : error,
        eventId: event.event.id,
        eventType: type,
        chargeId: charge.id,
      });

      // Store failed webhook for retry
      await prisma.paymentWebhook.create({
        data: {
          provider: 'COINBASE_COMMERCE',
          eventType: type,
          eventId: event.event.id,
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          payload: JSON.stringify(event),
        },
      });

      throw error;
    }
  }

  private async handleChargeCreated(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    await prisma.cryptoPayment.update({
      where: { id: cryptoPaymentId },
      data: {
        status: 'PENDING',
        webhookData: JSON.stringify(charge),
        expiresAt: new Date(charge.expires_at),
      },
    });

    logger.info('Charge created webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
    });
  }

  private async handleChargeConfirmed(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    const cryptoPayment = await prisma.cryptoPayment.findUnique({
      where: { id: cryptoPaymentId },
      include: { booking: true, user: true },
    });

    if (!cryptoPayment) {
      throw new Error('Crypto payment not found');
    }

    // Update crypto payment status
    await prisma.cryptoPayment.update({
      where: { id: cryptoPaymentId },
      data: {
        status: 'PAID',
        confirmedAt: new Date(charge.confirmed_at || new Date().toISOString()),
        webhookData: JSON.stringify(charge),
        // Extract crypto details from charge if available
        cryptoAmount: charge.payments.length > 0 ? parseFloat(charge.payments[0]?.value?.crypto?.amount || '0') : undefined,
        cryptoCurrency: charge.payments.length > 0 ? charge.payments[0]?.value?.crypto?.currency : undefined,
      },
    });

    // If this is for a booking deposit, update booking status
    if (cryptoPayment.booking && cryptoPayment.type === 'DEPOSIT') {
      await prisma.booking.update({
        where: { id: cryptoPayment.booking.id },
        data: {
          depositStatus: 'PAID',
          depositPaidAt: new Date(),
          status: 'CONFIRMED', // Move booking to confirmed status
        },
      });

      logger.info('Booking deposit confirmed via crypto payment', {
        bookingId: cryptoPayment.booking.id,
        cryptoPaymentId,
        chargeId: charge.id,
      });
    }

    // If this is for a subscription, update subscription status
    if (cryptoPayment.type === 'SUBSCRIPTION') {
      // Handle subscription payment confirmation
      // This would be implemented based on subscription logic
      logger.info('Subscription payment confirmed via crypto', {
        userId: cryptoPayment.userId,
        cryptoPaymentId,
        chargeId: charge.id,
      });
    }

    logger.info('Charge confirmed webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
      type: cryptoPayment.type,
    });
  }

  private async handleChargeFailed(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    await prisma.cryptoPayment.update({
      where: { id: cryptoPaymentId },
      data: {
        status: 'FAILED',
        webhookData: JSON.stringify(charge),
      },
    });

    logger.info('Charge failed webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
    });
  }

  private async handleChargeDelayed(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    await prisma.cryptoPayment.update({
      where: { id: cryptoPaymentId },
      data: {
        webhookData: JSON.stringify(charge),
      },
    });

    logger.info('Charge delayed webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
    });
  }

  private async handleChargePending(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    await prisma.cryptoPayment.update({
      where: { id: cryptoPaymentId },
      data: {
        status: 'PENDING',
        webhookData: JSON.stringify(charge),
      },
    });

    logger.info('Charge pending webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
    });
  }

  private async handleChargeResolved(cryptoPaymentId: string, charge: CoinbaseCharge): Promise<void> {
    // Charge resolved means it was confirmed but then resolved (possibly after being delayed)
    await this.handleChargeConfirmed(cryptoPaymentId, charge);

    logger.info('Charge resolved webhook processed', {
      cryptoPaymentId,
      chargeId: charge.id,
    });
  }

  // Utility method to get payment status from Coinbase
  async syncPaymentStatus(cryptoPaymentId: string): Promise<void> {
    const cryptoPayment = await prisma.cryptoPayment.findUnique({
      where: { id: cryptoPaymentId },
    });

    if (!cryptoPayment) {
      throw new Error('Crypto payment not found');
    }

    const charge = await this.getCharge(cryptoPayment.coinbaseChargeId);
    if (!charge) {
      throw new Error('Charge not found on Coinbase Commerce');
    }

    // Get the latest status from the timeline
    const latestStatus = charge.timeline[charge.timeline.length - 1]?.status;

    let newStatus = cryptoPayment.status;
    switch (latestStatus) {
      case 'NEW':
      case 'PENDING':
        newStatus = 'PENDING';
        break;
      case 'COMPLETED':
        newStatus = 'PAID';
        break;
      case 'EXPIRED':
        newStatus = 'EXPIRED';
        break;
      case 'UNRESOLVED':
        newStatus = 'FAILED';
        break;
      case 'RESOLVED':
        newStatus = 'PAID';
        break;
      case 'CANCELED':
        newStatus = 'CANCELLED';
        break;
    }

    if (newStatus !== cryptoPayment.status) {
      await prisma.cryptoPayment.update({
        where: { id: cryptoPaymentId },
        data: {
          status: newStatus,
          webhookData: JSON.stringify(charge),
          ...(newStatus === 'PAID' && !cryptoPayment.confirmedAt ? {
            confirmedAt: new Date(charge.confirmed_at || new Date().toISOString())
          } : {}),
        },
      });

      logger.info('Crypto payment status synced', {
        cryptoPaymentId,
        oldStatus: cryptoPayment.status,
        newStatus,
        chargeId: charge.id,
      });
    }
  }
}

export const coinbaseCommerceService = new CoinbaseCommerceService();