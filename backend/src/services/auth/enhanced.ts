import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@/config';
import { prisma } from '@/config/database';
import { cacheUtils, redis } from '@/config/redis';
import { logger } from '@/utils/logger';
// Use enhanced email service for verification emails
import { emailService } from '@/services/email/enhanced-email';
import {
  LoginRequest,
  RegisterRequest,
  TelegramAuthRequest,
  JwtPayload,
  RefreshTokenPayload,
  ErrorCodes,
  UserType
} from '@/types';
import { ReferralService } from '@/services/referral';
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
    // Validate JWT configuration
    if (!config.jwt.secret || !config.jwt.refreshSecret) {
      throw new Error('JWT configuration is missing. Please check JWT_SECRET and JWT_REFRESH_SECRET environment variables.');
    }

    const jwtPayload: JwtPayload = {
      userId: user.id,
      email: user.email,
      userType: user.userType as UserType,
    };

    const accessToken = jwt.sign(jwtPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    } as SignOptions);

    const refreshTokenId = crypto.randomUUID();
    const refreshPayload: RefreshTokenPayload = {
      userId: user.id,
      tokenId: refreshTokenId,
    };

    const refreshToken = jwt.sign(refreshPayload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn
    } as SignOptions);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Cache user data and session info
    await cacheUtils.set(`user:${user.id}`, user, 3600);
    await cacheUtils.set(`session:${refreshTokenId}`, { userId: user.id, tokenId: refreshTokenId, createdAt: new Date() }, 30 * 24 * 3600); // 30 days

    const expiresIn = 3600; // 1 hour in seconds
    return { accessToken, refreshToken, expiresIn };
  }

  // ✅ SECURITY FIX: Account lockout mechanism - Check login attempts
  private static async checkLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email.toLowerCase()}`;

    if (redis) {
      try {
        const attempts = await redis.get(key);
        const attemptCount = attempts ? parseInt(attempts, 10) : 0;

        if (attemptCount >= 5) {
          const ttl = await redis.ttl(key);
          const minutesRemaining = Math.ceil(ttl / 60);

          logger.warn('Account temporarily locked due to failed login attempts', {
            email,
            attempts: attemptCount,
            lockTimeRemaining: `${minutesRemaining} minutes`
          });

          throw new Error(`ACCOUNT_LOCKED:${minutesRemaining}`);
        }
      } catch (error) {
        // If error is the account locked error, re-throw it
        if (error instanceof Error && error.message.startsWith('ACCOUNT_LOCKED')) {
          throw error;
        }
        // Otherwise log and continue (fail open for Redis errors)
        logger.error('Error checking login attempts (continuing):', error);
      }
    }
    // If Redis not available, fail open (no lockout)
  }

  // ✅ SECURITY FIX: Record failed login attempt
  private static async recordFailedLogin(email: string): Promise<void> {
    const key = `login_attempts:${email.toLowerCase()}`;

    if (redis) {
      try {
        const attempts = await redis.incr(key);

        // Set expiration on first attempt (15 minutes lockout window)
        if (attempts === 1) {
          await redis.expire(key, 15 * 60);
        }

        logger.warn('Failed login attempt recorded', {
          email,
          attempts,
          lockoutThreshold: 5
        });

        // Additional warning when approaching lockout
        if (attempts === 4) {
          logger.warn('User approaching account lockout', {
            email,
            attemptsRemaining: 1
          });
        }
      } catch (error) {
        logger.error('Error recording failed login attempt:', error);
      }
    }
  }

  // ✅ SECURITY FIX: Clear login attempts on successful login
  private static async clearLoginAttempts(email: string): Promise<void> {
    const key = `login_attempts:${email.toLowerCase()}`;

    if (redis) {
      try {
        const clearedAttempts = await redis.get(key);
        if (clearedAttempts) {
          await redis.del(key);
          logger.info('Login attempts cleared after successful login', {
            email,
            previousAttempts: parseInt(clearedAttempts, 10)
          });
        }
      } catch (error) {
        logger.error('Error clearing login attempts:', error);
      }
    }
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
          language: (data as any).language || 'en',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          userType: true,
          isEmailVerified: true,
          language: true,
        },
      });

      // Create specialist profile if user is a specialist or business
      if (data.userType === 'SPECIALIST' || data.userType === 'BUSINESS') {
        await prisma.specialist.create({
          data: {
            userId: user.id,
            businessName: '', // Empty - user must fill this in
            bio: '', // Empty - user must fill this in
            specialties: '[]', // Empty array
            city: '',
            state: '',
            country: '',
            workingHours: JSON.stringify({
              monday: { isWorking: false, start: '09:00', end: '17:00' },
              tuesday: { isWorking: false, start: '09:00', end: '17:00' },
              wednesday: { isWorking: false, start: '09:00', end: '17:00' },
              thursday: { isWorking: false, start: '09:00', end: '17:00' },
              friday: { isWorking: false, start: '09:00', end: '17:00' },
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

      // Send verification email (non-blocking)
      const frontendUrl = process.env.FRONTEND_URL || (config.isProduction ? 'https://miyzapis.up.railway.app' : 'http://localhost:3000');
      const verificationLink = `${frontendUrl}/auth/verify-email?token=${verificationToken}`;
      
      logger.info('Attempting to send verification email', {
        userId: user.id,
        email: user.email,
        verificationLink: verificationLink.replace(verificationToken, '[TOKEN]'),
        emailServiceInitialized: !!emailService
      });
      
      // Send email in background to avoid blocking registration response
      logger.info('🚀 Initiating verification email send process', {
        userId: user.id,
        email: user.email,
        verificationLink: verificationLink.replace(verificationToken, '[HIDDEN_TOKEN]'),
        firstName: user.firstName
      });

      emailService.sendEmailVerification(user.id, verificationToken, user.language || 'en').then((emailSent) => {
        if (!emailSent) {
          logger.error('💥 Verification email failed to send', { 
            userId: user.id, 
            email: user.email,
            reason: 'Email service returned false - check SMTP configuration and logs above'
          });
        } else {
          logger.info('✅ Verification email sent successfully', { 
            userId: user.id,
            email: user.email,
            verificationToken: verificationToken.substring(0, 8) + '...'
          });
        }
      }).catch((error) => {
        logger.error('💥 Critical error sending verification email', { 
          userId: user.id, 
          email: user.email,
          error: {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack
          }
        });
      });

      // Process referral if provided
      let referralProcessed = false;
      if ((data as any).referralCode) {
        try {
          // Validate and process the referral
          const referral = await ReferralService.getReferralByCode((data as any).referralCode);

          // Check if the user type matches the referral target
          const isSpecialist = data.userType === 'SPECIALIST';
          if ((referral.targetUserType === 'SPECIALIST' && isSpecialist) ||
              (referral.targetUserType === 'CUSTOMER' && !isSpecialist)) {

            // Process referral completion
            await ReferralService.processReferralCompletion({
              referralCode: (data as any).referralCode,
              referredUserId: user.id
            });

            referralProcessed = true;
            logger.info('Referral processed during registration', {
              userId: user.id,
              referralCode: (data as any).referralCode,
              referralType: referral.referralType
            });
          } else {
            logger.warn('Referral user type mismatch during registration', {
              userId: user.id,
              referralCode: (data as any).referralCode,
              expectedType: referral.targetUserType,
              actualType: data.userType
            });
          }
        } catch (error) {
          // Don't fail registration if referral processing fails
          logger.error('Failed to process referral during registration', {
            userId: user.id,
            referralCode: (data as any).referralCode,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      logger.info('User registered successfully', {
        userId: user.id,
        email: user.email,
        referralProcessed
      });

      return {
        message: referralProcessed
          ? 'Registration successful! Your referral bonus has been applied. Please check your email to verify your account.'
          : 'Registration successful. Please check your email to verify your account.',
        requiresVerification: true,
        referralProcessed,
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

      // Mark token as used
      await prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          isUsed: true,
          usedAt: new Date(),
        },
      });

      // Send welcome email
        await emailService.sendWelcomeEmail(updatedUser.id, updatedUser.language || 'en');

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

  // Login with email verification check and multi-role support
  static async login(data: LoginRequest, userType?: string): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    requiresVerification?: boolean;
  } | {
    requiresUserTypeSelection: true;
    loginData: LoginRequest;
  }> {
    try {
      // Find user by email and check their available roles
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
          loyaltyTierId: true,
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          createdAt: true,
          updatedAt: true,
          specialist: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('INVALID_CREDENTIALS');
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // ✅ SECURITY FIX: Check if account is locked due to failed login attempts
      await this.checkLoginAttempts(data.email);

      // Verify password
      if (!user.password) {
        throw new Error('INVALID_CREDENTIALS');
      }

      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) {
        // ✅ SECURITY FIX: Record failed login attempt
        await this.recordFailedLogin(data.email);
        throw new Error('INVALID_CREDENTIALS');
      }

      // Check email verification - TEMPORARILY DISABLED FOR MOBILE APP TESTING
      // if (!user.isEmailVerified) {
      //   throw new Error('EMAIL_NOT_VERIFIED');
      // }

      // Check available roles for multi-role support
      const hasCustomerRole = user.userType === 'CUSTOMER' || user.userType === 'ADMIN';
      const hasSpecialistRole = user.specialist !== null;
      
      // If user has both roles and no specific role is requested, ask for selection
      if (hasCustomerRole && hasSpecialistRole && !userType) {
        return {
          requiresUserTypeSelection: true,
          loginData: data,
        };
      }
      
      // If user has only one role, use that role
      if (!userType) {
        if (hasSpecialistRole && !hasCustomerRole) {
          userType = 'specialist';
        } else {
          userType = 'customer';
        }
      }
      
      // Update user type if switching roles (for users with multiple roles)
      const targetUserType = userType.toLowerCase() === 'specialist' ? 'SPECIALIST' : 'CUSTOMER';
      
      // Update last login and potentially switch active role
      await prisma.user.update({
        where: { id: user.id },
        data: { 
          lastLoginAt: new Date(),
          userType: targetUserType, // Switch active role
        },
      });

      // Remove password from user object and update user type
      const { password, ...userWithoutPassword } = user;
      userWithoutPassword.userType = targetUserType;

      // Create tokens
      const tokens = await this.createTokens(userWithoutPassword);

      // ✅ SECURITY FIX: Clear failed login attempts on successful login
      await this.clearLoginAttempts(data.email);

      logger.info('User logged in successfully', {
        userId: user.id,
        platform: data.platform,
        selectedRole: targetUserType
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
  static async authenticateWithGoogle(googleData: GoogleAuthData, userType?: string): Promise<{
    user: Omit<User, 'password'>;
    tokens: { accessToken: string; refreshToken: string; expiresIn: number };
    isNewUser: boolean;
  } | {
    requiresUserTypeSelection: true;
    googleData: GoogleAuthData;
  }> {
    try {
      // Check if user exists and get their available roles
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
          specialist: {
            select: {
              id: true,
              businessName: true,
              isVerified: true,
            },
          },
        },
      });

      let isNewUser = false;

      if (!user) {
        // New user - always require user type selection
        if (!userType) {
          return {
            requiresUserTypeSelection: true,
            googleData,
          };
        }

        // Validate userType
        const validUserType = userType.toUpperCase() === 'SPECIALIST' ? 'SPECIALIST' : 'CUSTOMER';

        // Create new user from Google data
        user = await prisma.user.create({
          data: {
            email: googleData.email,
            firstName: googleData.given_name,
            lastName: googleData.family_name,
            avatar: googleData.picture,
            userType: validUserType,
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
            specialist: {
              select: {
                id: true,
                businessName: true,
                isVerified: true,
              },
            },
          },
        });
        isNewUser = true;

        // Create specialist profile if user is a specialist
        if (validUserType === 'SPECIALIST') {
          // Create empty specialist profile - no mock data
          await prisma.specialist.create({
            data: {
              userId: user.id,
              businessName: '', // Empty - user must fill this in
              bio: '', // Empty - user must fill this in  
              specialties: '[]', // Empty array
              city: '',
              state: '',
              country: '',
              workingHours: JSON.stringify({
                monday: { isWorking: false, start: '09:00', end: '17:00' },
                tuesday: { isWorking: false, start: '09:00', end: '17:00' },
                wednesday: { isWorking: false, start: '09:00', end: '17:00' },
                thursday: { isWorking: false, start: '09:00', end: '17:00' },
                friday: { isWorking: false, start: '09:00', end: '17:00' },
                saturday: { isWorking: false, start: '09:00', end: '17:00' },
                sunday: { isWorking: false, start: '09:00', end: '17:00' }
              }), // All days disabled by default
            },
          });
          
          logger.info('Created empty specialist profile for new user', { 
            userId: user.id,
            businessName: 'Empty - needs setup'
          });
        }

        // Send localized welcome email for new users
        await emailService.sendWelcomeEmail(user.id, user.language || 'en');
      } else {
        // Existing user - check available roles
        const hasCustomerRole = user.userType === 'CUSTOMER' || user.userType === 'ADMIN';
        const hasSpecialistRole = user.specialist !== null;
        
        // If user has both roles and no specific role is requested, ask for selection
        if (hasCustomerRole && hasSpecialistRole && !userType) {
          return {
            requiresUserTypeSelection: true,
            googleData,
          };
        }
        
        // If user has only one role, use that role
        if (!userType) {
          if (hasSpecialistRole && !hasCustomerRole) {
            userType = 'specialist';
          } else {
            userType = 'customer';
          }
        }
        
        // Update user type if switching roles (for users with multiple roles)
        const targetUserType = userType.toLowerCase() === 'specialist' ? 'SPECIALIST' : 'CUSTOMER';
        
        // Update last login and potentially switch active role
        await prisma.user.update({
          where: { id: user.id },
          data: { 
            lastLoginAt: new Date(),
            userType: targetUserType, // Switch active role
            // Update avatar if user doesn't have one
            ...(user.avatar ? {} : { avatar: googleData.picture }),
          },
        });
        
        // Update the user object to reflect the current role
        user.userType = targetUserType;
      }

      if (!user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Create tokens
      const tokens = await this.createTokens(user);

      logger.info('Google authentication successful', { 
        userId: user.id, 
        email: user.email,
        isNewUser,
        tokensCreated: !!tokens.accessToken && !!tokens.refreshToken
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
      // Verify Telegram auth data using Telegram's original field names.
      // The frontend sends camelCase names (telegramId, firstName, authDate, etc.)
      // but Telegram computes the hash over its original snake_case names (id, first_name, auth_date, etc.)
      const { hash, ...authData } = telegramData;

      if (!config.telegram.botToken) {
        throw new Error('TELEGRAM_BOT_TOKEN is not configured');
      }

      const secretKey = crypto.createHash('sha256').update(config.telegram.botToken).digest();

      // Map frontend field names back to Telegram's original field names for hash verification
      const fieldMap: Record<string, string> = {
        telegramId: 'id',
        firstName: 'first_name',
        lastName: 'last_name',
        photoUrl: 'photo_url',
        authDate: 'auth_date',
        // 'username' stays as 'username'
      };

      const telegramFields: Record<string, string> = {};
      for (const [key, value] of Object.entries(authData)) {
        if (value !== undefined && value !== null && value !== '') {
          const tgKey = fieldMap[key] || key;
          telegramFields[tgKey] = String(value);
        }
      }

      const checkString = Object.keys(telegramFields)
        .sort()
        .map(key => `${key}=${telegramFields[key]}`)
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

      // Send verification email using enhanced email service
      const emailSent = await emailService.sendEmailVerification(user.id, verificationToken, user.language || 'en');

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

  // Refresh access token using refresh token
  static async refreshAuthToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn: number;
  }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as RefreshTokenPayload;

      // Check if refresh token exists in database
      const tokenRecord = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
        include: { 
          user: {
            select: {
              id: true,
              email: true,
              userType: true,
              isActive: true,
            },
          },
        },
      });

      if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
        throw new Error('INVALID_REFRESH_TOKEN');
      }

      if (!tokenRecord.user.isActive) {
        throw new Error('ACCOUNT_DEACTIVATED');
      }

      // Generate new access token
      const jwtPayload: JwtPayload = {
        userId: tokenRecord.user.id,
        email: tokenRecord.user.email,
        userType: tokenRecord.user.userType as UserType,
      };

      const accessToken = jwt.sign(jwtPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      } as SignOptions);

      logger.info('Token refreshed successfully', { userId: tokenRecord.user.id });

      return {
        accessToken,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  // Revoke refresh token (logout)
  static async revokeRefreshToken(refreshToken: string): Promise<void> {
    try {
      // Try to delete the refresh token
      await prisma.refreshToken.delete({
        where: { token: refreshToken },
      });

      logger.debug('Refresh token revoked successfully');
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
}
