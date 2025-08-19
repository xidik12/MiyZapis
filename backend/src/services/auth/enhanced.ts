import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { cacheUtils } from '@/config/redis';
import { logger } from '@/utils/logger';
import { emailService } from '@/services/email';
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

interface GoogleAuthData {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export class EnhancedAuthService {
  // Generate verification token
  private static generateVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  // Create JWT tokens
  private static async createTokens(user: Omit<User, 'password'>): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType as UserType,
    };

    const accessToken = jwt.sign(jwtPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    const refreshTokenId = crypto.randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenId: refreshTokenId,
    };

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Cache user data
    await cacheUtils.set(`user:${user.id}`, user, 3600);

    const expiresIn = 3600; // 1 hour in seconds
    return { accessToken, refreshToken, expiresIn };
  }

  // Register new user with email verification
  static async register(data: RegisterRequest): Promise<{
    message: string;
    requiresVerification: boolean;
    user?: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      userType: string;
    };
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

      // Create user (unverified)
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
          userType: data.userType,
          telegramId: data.telegramId,
          isEmailVerified: false, // Start as unverified
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isEmailVerified: true,
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

      // Generate verification token
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL_VERIFICATION',
          expiresAt,
        },
      });

      // Send verification email
      const verificationLink = `${config.isProduction ? 'https://miyzapis-frontend.up.railway.app' : 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
      
      const emailSent = await emailService.sendVerificationEmail(user.email, {
        firstName: user.firstName,
        verificationLink,
      });

      if (!emailSent) {
        logger.warn('Verification email failed to send', { userId: user.id });
      }

      logger.info('User registered successfully', { 
        userId: user.id, 
        email: user.email,
        emailSent 
      });

      return {
        message: 'Registration successful. Please check your email to verify your account.',
        requiresVerification: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          userType: user.userType,
        },
      };
    } catch (error) {
      logger.error('Registration failed:', error);
      throw error;
    }
  }

  // Verify email address
  static async verifyEmail(token: string): Promise<{
    success: boolean;
    message: string;
    user?: Omit<User, 'password'>;
    tokens?: { accessToken: string; refreshToken: string; expiresIn: number };
  }> {
    try {
      // Find and validate token
      const verificationToken = await prisma.emailVerificationToken.findFirst({
        where: {
          token,
          type: 'EMAIL_VERIFICATION',
          isUsed: false,
          expiresAt: { gt: new Date() },
        },
        include: {
          user: {
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
              language: true,
              currency: true,
              timezone: true,
              emailNotifications: true,
              pushNotifications: true,
              telegramNotifications: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      });

      if (!verificationToken) {
        return {
          success: false,
          message: 'Invalid or expired verification token.',
        };
      }

      // Update user as verified
      const updatedUser = await prisma.user.update({
        where: { id: verificationToken.userId },
        data: { 
          isEmailVerified: true,
          lastLoginAt: new Date(),
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
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Mark token as used
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      // Send welcome email
      await emailService.sendWelcomeEmail(updatedUser.email, updatedUser.firstName);

      // Create auth tokens
      const tokens = await this.createTokens(updatedUser);

      logger.info('Email verified successfully', { userId: updatedUser.id });

      return {
        success: true,
        message: 'Email verified successfully. Welcome to MiyZapis!',
        user: updatedUser,
        tokens,
      };
    } catch (error) {
      logger.error('Email verification failed:', error);
      return {
        success: false,
        message: 'Email verification failed. Please try again.',
      };
    }
  }

  // Login with email verification check
  static async login(data: LoginRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    requiresVerification?: boolean;
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
          lastLoginAt: true,
          loyaltyPoints: true,
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
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
      if (!user.password) {
        throw new Error('INVALID_CREDENTIALS');
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        throw new Error('INVALID_CREDENTIALS');
      }

      // Check email verification
      if (!user.isEmailVerified) {
        throw new Error('EMAIL_NOT_VERIFIED');
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;

      // Create tokens
      const tokens = await this.createTokens(userWithoutPassword);

      logger.info('User logged in successfully', { 
        userId: user.id, 
        platform: data.platform 
      });

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Login failed:', error);
      throw error;
    }
  }

  // Google OAuth authentication
  static async authenticateWithGoogle(googleData: GoogleAuthData): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    isNewUser: boolean;
  }> {
    try {
      // Check if user exists
      let user = await prisma.user.findUnique({
        where: { email: googleData.email },
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
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user from Google data
        user = await prisma.user.create({
          data: {
            email: googleData.email,
            firstName: googleData.given_name,
            lastName: googleData.family_name,
            avatar: googleData.picture,
            userType: 'CUSTOMER',
            isEmailVerified: googleData.verified_email,
            isActive: true,
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
            language: true,
            currency: true,
            timezone: true,
            emailNotifications: true,
            pushNotifications: true,
            telegramNotifications: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        isNewUser = true;

        // Send welcome email for new users
        await emailService.sendWelcomeEmail(user.email, user.firstName);
      } else {
        // Update last login for existing users
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            // Update avatar if user doesn't have one
            ...(user.avatar ? {} : { avatar: googleData.picture }),
          },
        });
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Create tokens
      const tokens = await this.createTokens(user);

      logger.info('Google authentication successful', { 
        userId: user.id, 
        isNewUser 
      });

      return {
        user,
        tokens,
        isNewUser,
      };
    } catch (error) {
      logger.error('Google authentication failed:', error);
      throw error;
    }
  }

  // Telegram authentication
  static async authenticateWithTelegram(telegramData: TelegramAuthRequest): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    isNewUser: boolean;
  }> {
    try {
      // Verify Telegram auth data
      const { hash, ...authData } = telegramData;
      const secretKey = crypto.createHash('sha256').update(config.telegram.botToken!).digest();
      const checkString = Object.keys(authData)
        .sort()
        .map(key => `${key}=${authData[key as keyof typeof authData]}`)
        .join('\n');
      
      const hmac = crypto.createHmac('sha256', secretKey).update(checkString).digest('hex');
      
      if (hmac !== hash) {
        throw new Error('INVALID_TELEGRAM_AUTH');
      }

      // Check auth data age (should be within 24 hours)
      const authAge = Date.now() / 1000 - telegramData.authDate;
      if (authAge > 86400) { // 24 hours
        throw new Error('TELEGRAM_AUTH_EXPIRED');
      }

      // Check if user exists by Telegram ID
      let user = await prisma.user.findUnique({
        where: { telegramId: telegramData.telegramId },
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
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      let isNewUser = false;

      if (!user) {
        // Create new user from Telegram data
        const email = `telegram_${telegramData.telegramId}@miyzapis.com`;
        
        user = await prisma.user.create({
          data: {
            email,
            firstName: telegramData.firstName,
            lastName: telegramData.lastName || '',
            userType: 'CUSTOMER',
            telegramId: telegramData.telegramId,
            isEmailVerified: false, // Telegram users don't have email verification
            isActive: true,
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
            language: true,
            currency: true,
            timezone: true,
            emailNotifications: true,
            pushNotifications: true,
            telegramNotifications: true,
            createdAt: true,
            updatedAt: true,
          },
        });
        isNewUser = true;
      } else {
        // Update last login for existing users
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Create tokens
      const tokens = await this.createTokens(user);

      logger.info('Telegram authentication successful', { 
        userId: user.id, 
        telegramId: telegramData.telegramId,
        isNewUser 
      });

      return {
        user,
        tokens,
        isNewUser,
      };
    } catch (error) {
      logger.error('Telegram authentication failed:', error);
      throw error;
    }
  }

  // Resend verification email
  static async resendVerificationEmail(email: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          isEmailVerified: true,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'Email is already verified.',
        };
      }

      // Delete existing verification tokens
      await prisma.emailVerificationToken.deleteMany({
        where: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
        },
      });

      // Generate new verification token
      const verificationToken = this.generateVerificationToken();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          type: 'EMAIL_VERIFICATION',
          expiresAt,
        },
      });

      // Send verification email
      const verificationLink = `${config.isProduction ? 'https://miyzapis-frontend.up.railway.app' : 'http://localhost:3000'}/auth/verify-email?token=${verificationToken}`;
      
      const emailSent = await emailService.sendVerificationEmail(user.email, {
        firstName: user.firstName,
        verificationLink,
      });

      if (!emailSent) {
        return {
          success: false,
          message: 'Failed to send verification email. Please try again later.',
        };
      }

      return {
        success: true,
        message: 'Verification email sent successfully.',
      };
    } catch (error) {
      logger.error('Resend verification email failed:', error);
      return {
        success: false,
        message: 'Failed to resend verification email. Please try again later.',
      };
    }
  }
}