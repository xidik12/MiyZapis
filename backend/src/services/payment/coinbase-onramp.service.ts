import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

export interface OnrampSessionParams {
  userId: string;
  userAddress?: string;
  amount: number;
  currency: string;
  purpose: 'BOOKING_DEPOSIT' | 'WALLET_TOPUP' | 'SUBSCRIPTION';
  bookingId?: string;
  metadata?: Record<string, any>;
}

export interface OnrampSessionResult {
  sessionId: string;
  sessionToken: string;
  onrampURL: string;
  expiresAt: Date;
  amount: number;
  currency: string;
  supportedAssets: string[];
  supportedBlockchains: string[];
}

export interface OnrampTransaction {
  id: string;
  sessionId: string;
  userId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  amount: number;
  currency: string;
  cryptoAmount?: number;
  cryptoCurrency?: string;
  blockchain?: string;
  transactionHash?: string;
  purpose: string;
  bookingId?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CoinbaseOnrampService {
  private readonly SUPPORTED_ASSETS = ['USDC', 'ETH', 'BTC'];
  private readonly SUPPORTED_BLOCKCHAINS = ['ethereum', 'base', 'bitcoin'];
  private readonly DEFAULT_EXPIRY_MINUTES = 30;

  /**
   * Create a new onramp session for fiat-to-crypto conversion
   */
  async createOnrampSession(params: OnrampSessionParams): Promise<OnrampSessionResult> {
    try {
      logger.info('Creating Coinbase onramp session', {
        userId: params.userId,
        amount: params.amount,
        currency: params.currency,
        purpose: params.purpose,
      });

      // Generate session ID and token
      const sessionId = this.generateSessionId();
      const sessionToken = await this.generateSessionToken(params);

      // Calculate expiry time
      const expiresAt = new Date(Date.now() + this.DEFAULT_EXPIRY_MINUTES * 60 * 1000);

      // Create onramp URL
      const onrampURL = this.generateOnrampURL({
        sessionToken,
        amount: params.amount,
        currency: params.currency,
        userAddress: params.userAddress,
      });

      // Store session in database
      const onrampSession = await prisma.onrampSession.create({
        data: {
          id: sessionId,
          userId: params.userId,
          sessionToken,
          status: 'PENDING',
          amount: params.amount,
          currency: params.currency,
          purpose: params.purpose,
          bookingId: params.bookingId,
          onrampURL,
          expiresAt,
          metadata: params.metadata ? JSON.stringify(params.metadata) : null,
        },
      });

      logger.info('Onramp session created successfully', {
        sessionId,
        userId: params.userId,
        expiresAt,
      });

      return {
        sessionId,
        sessionToken,
        onrampURL,
        expiresAt,
        amount: params.amount,
        currency: params.currency,
        supportedAssets: this.SUPPORTED_ASSETS,
        supportedBlockchains: this.SUPPORTED_BLOCKCHAINS,
      };
    } catch (error) {
      logger.error('Failed to create onramp session:', error);
      throw new Error('Failed to create onramp session');
    }
  }

  /**
   * Get onramp session status
   */
  async getOnrampSession(sessionId: string): Promise<OnrampTransaction | null> {
    try {
      const session = await prisma.onrampSession.findUnique({
        where: { id: sessionId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!session) {
        return null;
      }

      return {
        id: session.id,
        sessionId: session.id,
        userId: session.userId,
        status: session.status as any,
        amount: session.amount,
        currency: session.currency,
        cryptoAmount: session.cryptoAmount || undefined,
        cryptoCurrency: session.cryptoCurrency || undefined,
        blockchain: session.blockchain || undefined,
        transactionHash: session.transactionHash || undefined,
        purpose: session.purpose,
        bookingId: session.bookingId || undefined,
        metadata: session.metadata || undefined,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      };
    } catch (error) {
      logger.error('Failed to get onramp session:', error);
      throw new Error('Failed to get onramp session');
    }
  }

  /**
   * Process onramp completion webhook
   */
  async processOnrampCompletion(params: {
    sessionId: string;
    status: 'COMPLETED' | 'FAILED';
    cryptoAmount?: number;
    cryptoCurrency?: string;
    blockchain?: string;
    transactionHash?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      logger.info('Processing onramp completion', {
        sessionId: params.sessionId,
        status: params.status,
        cryptoAmount: params.cryptoAmount,
        cryptoCurrency: params.cryptoCurrency,
      });

      const session = await prisma.onrampSession.findUnique({
        where: { id: params.sessionId },
      });

      if (!session) {
        throw new Error(`Onramp session not found: ${params.sessionId}`);
      }

      // Update session status
      await prisma.onrampSession.update({
        where: { id: params.sessionId },
        data: {
          status: params.status,
          cryptoAmount: params.cryptoAmount,
          cryptoCurrency: params.cryptoCurrency,
          blockchain: params.blockchain,
          transactionHash: params.transactionHash,
          completedAt: params.status === 'COMPLETED' ? new Date() : undefined,
          metadata: params.metadata ? JSON.stringify(params.metadata) : session.metadata,
        },
      });

      // If successful, process the payment based on purpose
      if (params.status === 'COMPLETED') {
        await this.handleSuccessfulOnramp(session, params);
      }

      logger.info('Onramp completion processed successfully', {
        sessionId: params.sessionId,
        status: params.status,
      });
    } catch (error) {
      logger.error('Failed to process onramp completion:', error);
      throw error;
    }
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `onramp_${crypto.randomBytes(16).toString('hex')}`;
  }

  /**
   * Generate session token for Coinbase API
   */
  private async generateSessionToken(params: OnrampSessionParams): Promise<string> {
    // For demo purposes, we'll generate a mock token
    // In production, this would call Coinbase's session token API
    const payload = {
      userId: params.userId,
      amount: params.amount,
      currency: params.currency,
      timestamp: Date.now(),
      nonce: crypto.randomBytes(16).toString('hex'),
    };

    // This would be replaced with actual Coinbase API call
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Generate onramp URL with session token
   */
  private generateOnrampURL(params: {
    sessionToken: string;
    amount: number;
    currency: string;
    userAddress?: string;
  }): string {
    // For demo purposes, we'll generate a mock URL
    // In production, this would use Coinbase's generateOnrampURL function
    const baseURL = 'https://pay.coinbase.com/buy/select-asset';
    const queryParams = new URLSearchParams({
      sessionToken: params.sessionToken,
      presetFiatAmount: params.amount.toString(),
      presetFiatCurrency: params.currency,
      defaultNetwork: 'base',
      defaultAsset: 'USDC',
    });

    if (params.userAddress) {
      queryParams.append('destinationWallet', params.userAddress);
    }

    return `${baseURL}?${queryParams.toString()}`;
  }

  /**
   * Handle successful onramp completion
   */
  private async handleSuccessfulOnramp(
    session: any,
    completionData: any
  ): Promise<void> {
    try {
      switch (session.purpose) {
        case 'BOOKING_DEPOSIT':
          if (session.bookingId) {
            await this.processBookingDepositOnramp(session.bookingId, completionData);
          }
          break;

        case 'WALLET_TOPUP':
          await this.processWalletTopup(session.userId, completionData);
          break;

        case 'SUBSCRIPTION':
          await this.processSubscriptionOnramp(session.userId, completionData);
          break;

        default:
          logger.warn('Unknown onramp purpose:', session.purpose);
      }
    } catch (error) {
      logger.error('Failed to handle successful onramp:', error);
      throw error;
    }
  }

  /**
   * Process onramp for booking deposit
   */
  private async processBookingDepositOnramp(
    bookingId: string,
    completionData: any
  ): Promise<void> {
    // This would integrate with your existing booking payment service
    // to complete the deposit payment process
    logger.info('Processing booking deposit onramp', {
      bookingId,
      cryptoAmount: completionData.cryptoAmount,
      cryptoCurrency: completionData.cryptoCurrency,
    });

    // Update booking deposit status
    // Trigger completion of payment flow
  }

  /**
   * Process onramp for wallet topup
   */
  private async processWalletTopup(
    userId: string,
    completionData: any
  ): Promise<void> {
    // This would integrate with your wallet service
    // to credit the user's wallet with the converted crypto
    logger.info('Processing wallet topup onramp', {
      userId,
      cryptoAmount: completionData.cryptoAmount,
      cryptoCurrency: completionData.cryptoCurrency,
    });

    // Credit user's wallet
    // Create wallet transaction record
  }

  /**
   * Process onramp for subscription payment
   */
  private async processSubscriptionOnramp(
    userId: string,
    completionData: any
  ): Promise<void> {
    // This would integrate with your subscription service
    // to process monthly subscription payments
    logger.info('Processing subscription onramp', {
      userId,
      cryptoAmount: completionData.cryptoAmount,
      cryptoCurrency: completionData.cryptoCurrency,
    });

    // Process subscription payment
    // Update subscription status
  }

  /**
   * Get available payment options for a user
   */
  async getPaymentOptions(userId: string, amount: number): Promise<{
    directCrypto: boolean;
    onrampRequired: boolean;
    recommendedAssets: string[];
    estimatedFees: Record<string, number>;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          walletBalance: true,
          walletCurrency: true,
        },
      });

      // For demo, assume user might need onramp
      const hassufficientCrypto = user?.walletBalance && user.walletBalance >= amount;

      return {
        directCrypto: !!hassufficientCrypto,
        onrampRequired: !hassufficientCrypto,
        recommendedAssets: this.SUPPORTED_ASSETS,
        estimatedFees: {
          USDC: 0, // Free on Base network
          ETH: 0.001, // Estimated network fees
          BTC: 0.0001, // Estimated network fees
        },
      };
    } catch (error) {
      logger.error('Failed to get payment options:', error);
      throw new Error('Failed to get payment options');
    }
  }
}

export const coinbaseOnrampService = new CoinbaseOnrampService();