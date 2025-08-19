import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import { User } from '@prisma/client';

interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  language?: string;
  currency?: string;
  timezone?: string;
}

interface NotificationPreferences {
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  telegramNotifications?: boolean;
}

export class UserService {
  // Update user profile
  static async updateProfile(
    userId: string,
    updateData: UpdateProfileData
  ): Promise<Omit<User, 'password'>> {
    try {
      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!existingUser) {
        throw new Error('USER_NOT_FOUND');
      }

      // Check if email is being updated and already exists
      if (updateData.email && updateData.email !== existingUser.email) {
        const emailExists = await prisma.user.findFirst({
          where: {
            email: updateData.email,
            id: { not: userId },
          },
        });

        if (emailExists) {
          throw new Error('EMAIL_ALREADY_EXISTS');
        }
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...updateData,
          updatedAt: new Date(),
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

      logger.info('User profile updated successfully', { userId });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw error;
    }
  }

  // Get user profile
  static async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
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
          loyaltyPoints: true,
          language: true,
          currency: true,
          timezone: true,
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return user;
    } catch (error) {
      logger.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Upload avatar (placeholder implementation)
  static async uploadAvatar(userId: string, _file: any): Promise<string> {
    try {
      // TODO: Implement actual file upload to S3 or similar service
      // For now, return a placeholder URL
      const avatarUrl = `https://example.com/avatars/${userId}_${Date.now()}.jpg`;

      // Update user avatar URL
      await prisma.user.update({
        where: { id: userId },
        data: { avatar: avatarUrl },
      });

      logger.info('Avatar uploaded successfully', { userId, avatarUrl });

      return avatarUrl;
    } catch (error) {
      logger.error('Error uploading avatar:', error);
      throw error;
    }
  }

  // Delete user account
  static async deleteAccount(userId: string): Promise<void> {
    try {
      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Check for active bookings
      const activeBookings = await prisma.booking.findFirst({
        where: {
          OR: [
            { customerId: userId },
            { specialistId: userId },
          ],
          status: {
            in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'],
          },
        },
      });

      if (activeBookings) {
        throw new Error('ACTIVE_BOOKINGS_EXIST');
      }

      // Soft delete - deactivate the account
      await prisma.user.update({
        where: { id: userId },
        data: {
          isActive: false,
          email: `deleted_${Date.now()}_${user.email}`,
          updatedAt: new Date(),
        },
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });

      logger.info('User account deleted successfully', { userId });
    } catch (error) {
      logger.error('Error deleting user account:', error);
      throw error;
    }
  }

  // Get notification preferences
  static async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
        },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      return {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        telegramNotifications: user.telegramNotifications,
      };
    } catch (error) {
      logger.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<NotificationPreferences> {
    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...preferences,
          updatedAt: new Date(),
        },
        select: {
          emailNotifications: true,
          pushNotifications: true,
          telegramNotifications: true,
        },
      });

      logger.info('Notification preferences updated successfully', { userId });

      return updatedUser;
    } catch (error) {
      logger.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  // Get loyalty points and transactions
  static async getLoyaltyPoints(userId: string): Promise<{
    currentPoints: number;
    totalEarned: number;
    totalRedeemed: number;
    recentTransactions: any[];
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { loyaltyPoints: true },
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Get loyalty transactions
      const transactions = await prisma.loyaltyTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      // Calculate totals
      const totalEarned = transactions
        .filter(t => ['EARNED', 'BONUS'].includes(t.type))
        .reduce((sum, t) => sum + t.points, 0);

      const totalRedeemed = transactions
        .filter(t => t.type === 'REDEEMED')
        .reduce((sum, t) => sum + Math.abs(t.points), 0);

      return {
        currentPoints: user.loyaltyPoints,
        totalEarned,
        totalRedeemed,
        recentTransactions: transactions.map(t => ({
          id: t.id,
          type: t.type,
          points: t.points,
          reason: t.reason,
          description: t.description,
          createdAt: t.createdAt,
        })),
      };
    } catch (error) {
      logger.error('Error getting loyalty points:', error);
      throw error;
    }
  }

  // Search users (admin only)
  static async searchUsers(
    searchQuery: string,
    userType?: string,
    page: number = 1,
    limit: number = 20
  ): Promise<{
    users: Omit<User, 'password'>[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {
        isActive: true,
      };

      if (searchQuery) {
        where.OR = [
          { email: { contains: searchQuery } },
          { firstName: { contains: searchQuery } },
          { lastName: { contains: searchQuery } },
        ];
      }

      if (userType) {
        where.userType = userType;
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
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
            language: true,
            currency: true,
            timezone: true,
            emailNotifications: true,
            pushNotifications: true,
            telegramNotifications: true,
            loyaltyPoints: true,
            createdAt: true,
            updatedAt: true,
          },
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        users,
        total,
        page,
        totalPages,
      };
    } catch (error) {
      logger.error('Error searching users:', error);
      throw error;
    }
  }
}