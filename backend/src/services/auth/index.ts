import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { cacheUtils } from '@/config/redis';
import { logger } from '@/utils/logger';
import { 
  LoginRequest, 
  RegisterRequest, 
  TelegramAuthRequest,
  JwtPayload, 
  RefreshTokenPayload,
  ErrorCodes,
  UserType 
} from '@/types';
import { User } from '@prisma/client';

export class AuthService {
  // Register new user
  static async register(data: RegisterRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: data.email },
            ...(data.telegramId ? [{ telegramId: data.telegramId }] : []),
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === data.email) {
          throw new Error('EMAIL_ALREADY_EXISTS');
        }
        if (existingUser.telegramId === data.telegramId) {
          throw new Error('TELEGRAM_ID_ALREADY_EXISTS');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, config.security.bcryptRounds);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          userType: data.userType,
          telegramId: data.telegramId,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          userType: true,
          phoneNumber: true,
          telegramId: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          lastLoginAt: true,
          loyaltyPoints: true,
          loyaltyTierId: true,
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          passwordLastChanged: true,
          authProvider: true,
          walletBalance: true,
          walletCurrency: true,
          subscriptionStatus: true,
          subscriptionValidUntil: true,
          subscriptionEffectiveDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Create specialist profile if user is a specialist
      if (data.userType === 'SPECIALIST') {
        await prisma.specialist.create({
          data: {
            userId: user.id,
            businessName: `${data.firstName} ${data.lastName}`,
            bio: '',
            specialties: '[]',
            workingHours: JSON.stringify({
              monday: { isWorking: true, start: '09:00', end: '17:00' },
              tuesday: { isWorking: true, start: '09:00', end: '17:00' },
              wednesday: { isWorking: true, start: '09:00', end: '17:00' },
              thursday: { isWorking: true, start: '09:00', end: '17:00' },
              friday: { isWorking: true, start: '09:00', end: '17:00' },
              saturday: { isWorking: false, start: '09:00', end: '17:00' },
              sunday: { isWorking: false, start: '09:00', end: '17:00' }
            }),
          },
        });
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info('User registered successfully', { userId: user.id, email: user.email });

      return {
        user,
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  // Login user
  static async login(data: LoginRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: data.email },
        select: {
          id: true,
          email: true,
          password: true,
          firstName: true,
          lastName: true,
          avatar: true,
          userType: true,
          phoneNumber: true,
          telegramId: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          loyaltyPoints: true,
          loyaltyTierId: true,
          language: true,
          currency: true,
          timezone: true,
          lastLoginAt: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          passwordLastChanged: true,
          authProvider: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password!);
      if (!isValidPassword) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Generate tokens
      const tokens = await this.generateTokens(userWithoutPassword);

      logger.info('User logged in successfully', { 
        userId: user.id, 
        email: user.email,
        platform: data.platform 
      });

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  // Telegram authentication
  static async authenticateTelegram(data: TelegramAuthRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    isNewUser: boolean;
  }> {
    try {
      // Verify Telegram auth data (skip verification in development)
      if (config.env !== 'development' && !this.verifyTelegramAuth(data)) {
        throw new Error('INVALID_TELEGRAM_AUTH');
      }

      // Find existing user by Telegram ID
      let user = await prisma.user.findUnique({
        where: { telegramId: data.telegramId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          userType: true,
          phoneNumber: true,
          telegramId: true,
          isEmailVerified: true,
          isPhoneVerified: true,
          isActive: true,
          lastLoginAt: true,
          loyaltyPoints: true,
          loyaltyTierId: true,
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          passwordLastChanged: true,
          authProvider: true,
          walletBalance: true,
          walletCurrency: true,
          subscriptionStatus: true,
          subscriptionValidUntil: true,
          subscriptionEffectiveDate: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: `${data.telegramId}@telegram.user`, // Temporary email
            firstName: data.firstName,
            lastName: data.lastName || '',
            telegramId: data.telegramId,
            userType: 'CUSTOMER',
            isEmailVerified: false,
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
            userType: true,
            phoneNumber: true,
            telegramId: true,
            isEmailVerified: true,
            isPhoneVerified: true,
            isActive: true,
            lastLoginAt: true,
            loyaltyPoints: true,
            loyaltyTierId: true,
            language: true,
            currency: true,
            timezone: true,
            emailNotifications: true,
            pushNotifications: true,
            telegramNotifications: true,
            passwordLastChanged: true,
            authProvider: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        isNewUser = true;
        logger.info('New Telegram user created', { userId: user.id, telegramId: data.telegramId });
      } else {
        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      logger.info('Telegram authentication successful', { 
        userId: user.id, 
        telegramId: data.telegramId,
        isNewUser 
      });

      return {
        user,
        tokens,
        isNewUser,
      };
    } catch (error) {
      logger.error('Telegram authentication error:', error);
      throw error;
    }
  }

  // Refresh access token
  static async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret!) as RefreshTokenPayload;

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { user: true },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      if (!tokenRecord.user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken({
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        userType: tokenRecord.user.userType as UserType,
      });

      const expiresIn = this.getTokenExpirationTime(config.jwt.expiresIn);

      logger.info('Token refreshed successfully', { userId: tokenRecord.user.id });

      return {
        accessToken,
        expiresIn,
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  // Logout user (revoke refresh token)
  static async logout(refreshToken: string): Promise<void> {
    try {
      // Try to delete the refresh token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      logger.debug('Refresh token deleted successfully');
    } catch (error: any) {
      // If token doesn't exist, that's fine - user is already logged out
      if (error.code === 'P2025') {
        logger.debug('Refresh token not found (already logged out)');
      } else {
        logger.debug('Logout error (non-critical):', error);
      }
      // Never throw error for logout - always succeed from user perspective
    }
  }

  // Generate JWT tokens
  private static async generateTokens(user: any): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType,
    };

    // Generate access token
    const accessToken = this.generateAccessToken(payload);

    // Generate refresh token
    const refreshTokenId = crypto.randomUUID();
    const refreshToken = jwt.sign(
      { userId: user.id, tokenId: refreshTokenId },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions
    );

    // Store refresh token in database
    const expiresAt = new Date();
    expiresAt.setTime(expiresAt.getTime() + this.getTokenExpirationTime(config.jwt.refreshExpiresIn));

    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    const expiresIn = this.getTokenExpirationTime(config.jwt.expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  // Generate access token
  private static generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as SignOptions);
  }

  // Get token expiration time in seconds
  private static getTokenExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 24 * 60 * 60;
      default: return 3600;
    }
  }

  // Verify Telegram authentication data
  private static verifyTelegramAuth(data: TelegramAuthRequest): boolean {
    try {
      const { hash, ...authData } = data;
      
      // Create data check string
      const dataCheckArr = Object.keys(authData)
        .sort()
        .map(key => `${key}=${authData[key as keyof typeof authData]}`)
        .join('\n');

      // Create secret key (skip if no bot token in development)
      if (!config.telegram.botToken) {
        return true; // Allow in development
      }
      
      const secretKey = crypto
        .createHash('sha256')
        .update(config.telegram.botToken)
        .digest();

      // Calculate hash
      const calculatedHash = crypto
        .createHmac('sha256', secretKey)
        .update(dataCheckArr)
        .digest('hex');

      // Check if auth date is not too old (5 minutes)
      const authDate = new Date(data.authDate * 1000);
      const now = new Date();
      const timeDiff = now.getTime() - authDate.getTime();
      const maxAge = 5 * 60 * 1000; // 5 minutes

      return calculatedHash === hash && timeDiff <= maxAge;
    } catch (error) {
      logger.error('Telegram auth verification error:', error);
      return false;
    }
  }

  // Clean expired refresh tokens
  static async cleanExpiredTokens(): Promise<void> {
    try {
      const result = await prisma.refreshToken.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned ${result.count} expired refresh tokens`);
    } catch (error) {
      logger.error('Error cleaning expired tokens:', error);
    }
  }
}