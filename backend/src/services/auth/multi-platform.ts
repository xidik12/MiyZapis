import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface TelegramWebAppInitData {
  query_id?: string;
  user?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
    language_code?: string;
  };
  receiver?: {
    id: number;
    first_name: string;
    last_name?: string;
    username?: string;
    photo_url?: string;
  };
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    photo_url?: string;
  };
  chat_type?: string;
  chat_instance?: string;
  start_param?: string;
  can_send_after?: number;
  auth_date: number;
  hash: string;
}

interface GoogleOAuthUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  locale?: string;
}

interface AuthResult {
  user: any;
  accessToken: string;
  refreshToken: string;
  platform: string;
  isNewUser: boolean;
}

export class MultiPlatformAuthService {
  
  /**
   * Authenticate user from Telegram Web App
   */
  async authenticateTelegramWebApp(initDataString: string): Promise<AuthResult> {
    try {
      // Validate and parse init data
      const initData = this.validateTelegramWebAppData(initDataString);
      
      if (!initData.user) {
        throw new Error('User data not found in init data');
      }

      // Find or create user
      const { user, isNewUser } = await this.findOrCreateTelegramUser(
        initData.user,
        'telegram_miniapp'
      );

      // Create session
      await this.createTelegramSession(
        user.id,
        initData.user.id.toString(),
        'miniapp'
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user.id, 'telegram_miniapp');

      return {
        user,
        accessToken,
        refreshToken,
        platform: 'telegram_miniapp',
        isNewUser
      };
    } catch (error) {
      logger.error('Telegram Web App authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user from Telegram Bot
   */
  async authenticateTelegramBot(telegramUser: any): Promise<AuthResult> {
    try {
      // Find or create user
      const { user, isNewUser } = await this.findOrCreateTelegramUser(
        telegramUser,
        'telegram_bot'
      );

      // Create session
      await this.createTelegramSession(
        user.id,
        telegramUser.id.toString(),
        'bot',
        telegramUser.chatId
      );

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user.id, 'telegram_bot');

      return {
        user,
        accessToken,
        refreshToken,
        platform: 'telegram_bot',
        isNewUser
      };
    } catch (error) {
      logger.error('Telegram Bot authentication failed:', error);
      throw error;
    }
  }

  /**
   * Authenticate user with Google OAuth
   */
  async authenticateGoogleOAuth(googleUser: GoogleOAuthUser): Promise<AuthResult> {
    try {
      // Find existing user by email
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email }
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name || '',
            avatar: googleUser.picture,
            isEmailVerified: googleUser.verified_email,
            language: googleUser.locale?.startsWith('uk') ? 'uk' : 
                     googleUser.locale?.startsWith('ru') ? 'ru' : 'en',
            userType: 'CUSTOMER'
          }
        });
        isNewUser = true;
      } else if (!user.avatar && googleUser.picture) {
        // Update avatar if not set
        user = await prisma.user.update({
          where: { id: user.id },
          data: { avatar: googleUser.picture }
        });
      }

      // Generate tokens
      const { accessToken, refreshToken } = await this.generateTokens(user.id, 'web');

      return {
        user,
        accessToken,
        refreshToken,
        platform: 'web',
        isNewUser
      };
    } catch (error) {
      logger.error('Google OAuth authentication failed:', error);
      throw error;
    }
  }

  /**
   * Validate Telegram Web App init data
   */
  private validateTelegramWebAppData(initDataString: string): TelegramWebAppInitData {
    const params = new URLSearchParams(initDataString);
    const hash = params.get('hash');
    params.delete('hash');

    if (!hash) {
      throw new Error('Hash parameter is missing');
    }

    // Create data check string
    const dataCheckArray: string[] = [];
    for (const [key, value] of params.entries()) {
      dataCheckArray.push(`${key}=${value}`);
    }
    dataCheckArray.sort();
    const dataCheckString = dataCheckArray.join('\n');

    // Generate secret key
    const secretKey = crypto.createHmac('sha256', 'WebAppData')
      .update(config.telegram.botToken!)
      .digest();

    // Calculate hash
    const calculatedHash = crypto.createHmac('sha256', secretKey)
      .update(dataCheckString)
      .digest('hex');

    if (calculatedHash !== hash) {
      throw new Error('Invalid hash');
    }

    // Check auth date (should not be older than 24 hours)
    const authDate = parseInt(params.get('auth_date') || '0');
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime - authDate > 86400) {
      throw new Error('Auth date is too old');
    }

    // Parse user data
    const initData: TelegramWebAppInitData = {
      auth_date: authDate,
      hash
    };

    if (params.get('user')) {
      initData.user = JSON.parse(params.get('user')!);
    }

    if (params.get('chat')) {
      initData.chat = JSON.parse(params.get('chat')!);
    }

    return initData;
  }

  /**
   * Find or create user from Telegram data
   */
  private async findOrCreateTelegramUser(telegramUser: any, platform: string) {
    const telegramId = telegramUser.id.toString();
    
    // Find existing user by Telegram ID
    let user = await prisma.user.findUnique({
      where: { telegramId }
    });

    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name || '',
          email: `telegram_${telegramId}@temp.local`, // Temporary email
          avatar: telegramUser.photo_url,
          language: telegramUser.language_code?.startsWith('uk') ? 'uk' : 
                   telegramUser.language_code?.startsWith('ru') ? 'ru' : 'en',
          userType: 'CUSTOMER',
          isEmailVerified: false
        }
      });
      isNewUser = true;

      // Log platform usage
      await this.logPlatformUsage(user.id, platform, 'register');
    } else {
      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Log platform usage
      await this.logPlatformUsage(user.id, platform, 'login');
    }

    return { user, isNewUser };
  }

  /**
   * Create Telegram session
   */
  private async createTelegramSession(
    userId: string,
    telegramId: string,
    platform: 'bot' | 'miniapp',
    chatId?: string
  ) {
    await prisma.telegramSession.upsert({
      where: { telegramId },
      update: {
        userId,
        chatId,
        platform,
        lastActivity: new Date(),
        isActive: true
      },
      create: {
        userId,
        telegramId,
        chatId,
        platform,
        lastActivity: new Date(),
        isActive: true
      }
    });
  }

  /**
   * Generate JWT tokens
   */
  private async generateTokens(userId: string, platform: string) {
    const payload = {
      userId,
      platform,
      iat: Math.floor(Date.now() / 1000)
    };

    const accessToken = jwt.sign(payload, config.jwt.accessSecret!, {
      expiresIn: config.jwt.accessTokenExpiry
    });

    const refreshTokenPayload = {
      userId,
      platform,
      type: 'refresh'
    };

    const refreshToken = jwt.sign(refreshTokenPayload, config.jwt.refreshSecret!, {
      expiresIn: config.jwt.refreshTokenExpiry
    });

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    });

    // Cache access token if Redis is available
    if (redis) {
      const cacheKey = `auth:${userId}:${platform}`;
      await redis.setex(cacheKey, 3600, accessToken); // 1 hour cache
    }

    return { accessToken, refreshToken };
  }

  /**
   * Log platform usage for analytics
   */
  private async logPlatformUsage(userId: string, platform: string, action: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Update platform analytics
      await prisma.platformAnalytics.upsert({
        where: {
          date_platform: {
            date: today,
            platform
          }
        },
        update: {
          activeUsers: action === 'login' ? { increment: 1 } : undefined,
          newUsers: action === 'register' ? { increment: 1 } : undefined
        },
        create: {
          date: today,
          platform,
          activeUsers: action === 'login' ? 1 : 0,
          newUsers: action === 'register' ? 1 : 0
        }
      });
    } catch (error) {
      logger.error('Failed to log platform usage:', error);
      // Don't fail auth if analytics logging fails
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; user: any }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret!) as any;
      
      // Check if token exists and is valid
      const tokenRecord = await prisma.refreshToken.findFirst({
        where: {
          token: refreshToken,
          userId: decoded.userId,
          isRevoked: false,
          expiresAt: {
            gt: new Date()
          }
        },
        include: {
          user: true
        }
      });

      if (!tokenRecord) {
        throw new Error('Invalid or expired refresh token');
      }

      // Generate new access token
      const accessToken = jwt.sign(
        {
          userId: decoded.userId,
          platform: decoded.platform,
          iat: Math.floor(Date.now() / 1000)
        },
        config.jwt.accessSecret!,
        { expiresIn: config.jwt.accessTokenExpiry }
      );

      return {
        accessToken,
        user: tokenRecord.user
      };
    } catch (error) {
      logger.error('Token refresh failed:', error);
      throw new Error('Token refresh failed');
    }
  }

  /**
   * Logout user from specific platform
   */
  async logout(userId: string, platform: string, refreshToken?: string) {
    try {
      // Revoke refresh token if provided
      if (refreshToken) {
        await prisma.refreshToken.updateMany({
          where: {
            userId,
            token: refreshToken
          },
          data: {
            isRevoked: true,
            revokedAt: new Date()
          }
        });
      }

      // Deactivate Telegram session if applicable
      if (platform.startsWith('telegram')) {
        await prisma.telegramSession.updateMany({
          where: {
            userId,
            platform: platform.includes('miniapp') ? 'miniapp' : 'bot'
          },
          data: {
            isActive: false
          }
        });
      }

      // Remove from Redis cache
      if (redis) {
        const cacheKey = `auth:${userId}:${platform}`;
        await redis.del(cacheKey);
      }
    } catch (error) {
      logger.error('Logout failed:', error);
      throw error;
    }
  }
}