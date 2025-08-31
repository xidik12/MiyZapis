import { Router } from 'express';
import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { AuthenticatedRequest, ErrorCodes } from '@/types';
import { authenticateToken } from '@/middleware/auth/jwt';
import { validationResult } from 'express-validator';
import {
  validateUpdateProfile,
  validateUploadAvatar,
  validateUpdatePassword,
  validateLinkTelegram,
  validateUnlinkTelegram,
  validateDeleteAccount,
  validateGetUserActivity,
  validateExportUserData,
  validateUpdateNotifications
} from '@/middleware/validation/users';
import { createSuccessResponse, createErrorResponse, calculatePaginationOffset, createPaginationMeta, formatValidationErrors } from '@/utils/response';
import { logger } from '@/utils/logger';
import bcrypt from 'bcryptjs';

const router = Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialist: {
          include: {
            services: {
              where: { isActive: true },
              take: 5
            },
            reviews: {
              take: 5,
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'User not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Get loyalty transaction summary
    const loyaltyTransactions = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get recent activity counts
    const recentBookings = await prisma.booking.count({
      where: {
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ],
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    return res.json(createSuccessResponse({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      userType: user.userType,
      phoneNumber: user.phoneNumber,
      telegramId: user.telegramId,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      isActive: user.isActive,
      language: user.language,
      currency: user.currency,
      timezone: user.timezone,
      emailNotifications: user.emailNotifications,
      pushNotifications: user.pushNotifications,
      telegramNotifications: user.telegramNotifications,
      loyaltyPoints: user.loyaltyPoints,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      specialist: user.specialist ? {
        id: user.specialist.id,
        businessName: user.specialist.businessName,
        bio: user.specialist.bio,
        specialties: user.specialist.specialties ? JSON.parse(user.specialist.specialties) : [],
        rating: user.specialist.rating,
        reviewCount: user.specialist.reviewCount,
        completedBookings: user.specialist.completedBookings,
        isVerified: user.specialist.isVerified,
        recentServices: user.specialist.services,
        recentReviews: user.specialist.reviews
      } : null,
      loyaltyTransactions,
      activitySummary: {
        recentBookingsCount: recentBookings
      }
    }));
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get user profile',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Update user profile
router.put('/profile', authenticateToken, validateUpdateProfile, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Enhanced logging for frontend debugging
    logger.info('User profile update request received', {
      userId: req.userId,
      requestBody: req.body,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
      requestId: req.headers['x-request-id'],
      timestamp: new Date().toISOString()
    });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid profile data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const updateData: any = {};

    // Only update provided fields
    if (req.body.firstName) updateData.firstName = req.body.firstName;
    if (req.body.lastName) updateData.lastName = req.body.lastName;
    if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.avatar !== undefined) updateData.avatar = req.body.avatar;
    if (req.body.language) updateData.language = req.body.language;
    if (req.body.currency) updateData.currency = req.body.currency;
    if (req.body.timezone) updateData.timezone = req.body.timezone;
    if (req.body.emailNotifications !== undefined) updateData.emailNotifications = req.body.emailNotifications;
    if (req.body.pushNotifications !== undefined) updateData.pushNotifications = req.body.pushNotifications;
    if (req.body.telegramNotifications !== undefined) updateData.telegramNotifications = req.body.telegramNotifications;

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        userType: true,
        phoneNumber: true,
        language: true,
        currency: true,
        timezone: true,
        emailNotifications: true,
        pushNotifications: true,
        telegramNotifications: true,
        loyaltyPoints: true,
        updatedAt: true
      }
    });

    // Enhanced logging for successful updates
    logger.info('User profile updated successfully', {
      userId: req.userId,
      updatedFields: Object.keys(req.body),
      updatedAt: user.updatedAt,
      requestId: req.headers['x-request-id']
    });

    return res.json(createSuccessResponse(user));
  } catch (error) {
    logger.error('Update profile error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update user profile',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Upload user avatar - redirect to file upload endpoint
router.post('/avatar', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.status(400).json(
      createErrorResponse(
        ErrorCodes.VALIDATION_ERROR,
        'Please use POST /files/upload?purpose=avatar for avatar uploads',
        req.headers['x-request-id'] as string,
        [{
          field: 'endpoint',
          message: 'Use the files upload endpoint with purpose=avatar parameter',
          code: 'DEPRECATED_ENDPOINT'
        }]
      )
    );
  } catch (error) {
    logger.error('Avatar upload endpoint error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to handle avatar upload request',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Update password
router.put('/password', authenticateToken, validateUpdatePassword, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid password data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user || !user.password) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'User not found or password not set',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.INVALID_CREDENTIALS,
          'Current password is incorrect',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Revoke all refresh tokens to force re-login
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { 
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    return res.json(createSuccessResponse({ 
      message: 'Password updated successfully. Please log in again with your new password.' 
    }));
  } catch (error) {
    logger.error('Update password error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to update password',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Link Telegram account
router.post('/telegram/link', authenticateToken, validateLinkTelegram, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid Telegram data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const { telegramId, firstName, lastName, username } = req.body;

    // Check if Telegram ID is already linked to another account
    const existingTelegramUser = await prisma.user.findFirst({
      where: {
        telegramId,
        id: { not: userId }
      }
    });

    if (existingTelegramUser) {
      return res.status(409).json(
        createErrorResponse(
          ErrorCodes.DUPLICATE_RESOURCE,
          'This Telegram account is already linked to another user',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Link Telegram account
    const user = await prisma.user.update({
      where: { id: userId },
      data: { telegramId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramId: true,
        telegramNotifications: true
      }
    });

    return res.json(createSuccessResponse({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      telegramId: user.telegramId,
      telegramNotifications: user.telegramNotifications,
      message: 'Telegram account linked successfully'
    }));
  } catch (error) {
    logger.error('Link Telegram error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to link Telegram account',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Unlink Telegram account
router.post('/telegram/unlink', authenticateToken, validateUnlinkTelegram, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid request data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;

    // Unlink Telegram account
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        telegramId: null,
        telegramNotifications: false
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        telegramId: true,
        telegramNotifications: true
      }
    });

    return res.json(createSuccessResponse({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      telegramId: user.telegramId,
      telegramNotifications: user.telegramNotifications,
      message: 'Telegram account unlinked successfully'
    }));
  } catch (error) {
    logger.error('Unlink Telegram error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to unlink Telegram account',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Get user activity
router.get('/activity', authenticateToken, validateGetUserActivity, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid query parameters',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const {
      page = 1,
      limit = 20,
      startDate,
      endDate,
      type
    } = req.query;

    const { skip, take } = calculatePaginationOffset(Number(page), Number(limit));

    // Build date filter
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate as string);
    if (endDate) dateFilter.lte = new Date(endDate as string);

    let activities: any[] = [];

    // Get bookings
    if (!type || type === 'booking') {
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [
            { customerId: userId },
            { specialistId: userId }
          ],
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          service: { select: { name: true } },
          customer: { select: { firstName: true, lastName: true } },
          specialist: { select: { firstName: true, lastName: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'booking' ? take : 10
      });

      activities.push(...bookings.map(booking => ({
        id: booking.id,
        type: 'booking',
        title: `Booking ${booking.customerId === userId ? 'Created' : 'Received'}`,
        description: `${booking.service.name} - ${booking.status}`,
        metadata: {
          bookingId: booking.id,
          serviceName: booking.service.name,
          status: booking.status,
          amount: booking.totalAmount
        },
        createdAt: booking.createdAt
      })));
    }

    // Get payments
    if (!type || type === 'payment') {
      const payments = await prisma.payment.findMany({
        where: {
          userId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          booking: {
            include: {
              service: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'payment' ? take : 5
      });

      activities.push(...payments.map(payment => ({
        id: payment.id,
        type: 'payment',
        title: `Payment ${payment.status}`,
        description: `$${payment.amount} for ${payment.booking?.service.name || 'Service'}`,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
          status: payment.status,
          type: payment.type
        },
        createdAt: payment.createdAt
      })));
    }

    // Get reviews
    if (!type || type === 'review') {
      const reviews = await prisma.review.findMany({
        where: {
          customerId: userId,
          ...(Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {})
        },
        include: {
          booking: {
            include: {
              service: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: type === 'review' ? take : 5
      });

      activities.push(...reviews.map(review => ({
        id: review.id,
        type: 'review',
        title: 'Review Submitted',
        description: `${review.rating} stars for ${review.booking.service.name}`,
        metadata: {
          reviewId: review.id,
          rating: review.rating,
          serviceName: review.booking.service.name
        },
        createdAt: review.createdAt
      })));
    }

    // Sort activities by date
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const paginatedActivities = activities.slice(skip, skip + take);
    
    const paginationMeta = createPaginationMeta(Number(page), Number(limit), activities.length);

    return res.json(createSuccessResponse(paginatedActivities, { 
      pagination: paginationMeta, 
      total: activities.length 
    }));
  } catch (error) {
    logger.error('Get user activity error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to get user activity',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Export user data (GDPR compliance)
router.post('/export', authenticateToken, validateExportUserData, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid export data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const {
      includeBookings = true,
      includePayments = true,
      includeReviews = true,
      format = 'json'
    } = req.body;

    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        specialist: true,
        ...(includeBookings ? {
          customerBookings: {
            include: {
              service: true,
              specialist: { select: { user: { select: { firstName: true, lastName: true } } } }
            }
          },
          specialistBookings: {
            include: {
              service: true,
              customer: { select: { firstName: true, lastName: true } }
            }
          }
        } : {}),
        ...(includePayments ? { payments: true } : {}),
        ...(includeReviews ? { reviews: { include: { booking: { include: { service: true } } } } } : {}),
        loyaltyTransactions: true,
        notifications: { orderBy: { createdAt: 'desc' }, take: 100 }
      }
    });

    if (!userData) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'User not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Remove sensitive data
    const exportData = {
      user: {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        userType: userData.userType,
        phoneNumber: userData.phoneNumber,
        language: userData.language,
        currency: userData.currency,
        timezone: userData.timezone,
        loyaltyPoints: userData.loyaltyPoints,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      },
      specialist: userData.specialist,
      ...(includeBookings ? { 
        bookingsAsCustomer: userData.customerBookings,
        bookingsAsSpecialist: userData.specialistBookings 
      } : {}),
      ...(includePayments ? { payments: userData.payments } : {}),
      ...(includeReviews ? { reviews: userData.reviews } : {}),
      loyaltyTransactions: userData.loyaltyTransactions,
      notifications: userData.notifications,
      exportedAt: new Date().toISOString()
    };

    return res.json(createSuccessResponse({
      format,
      data: exportData,
      summary: {
        totalBookings: (userData.customerBookings?.length || 0) + (userData.specialistBookings?.length || 0),
        totalPayments: userData.payments?.length || 0,
        totalReviews: userData.reviews?.length || 0,
        loyaltyPoints: userData.loyaltyPoints,
        memberSince: userData.createdAt
      }
    }));
  } catch (error) {
    logger.error('Export user data error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to export user data',
        req.headers['x-request-id'] as string
      )
    );
  }
});

// Delete user account
router.delete('/account', authenticateToken, validateDeleteAccount, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.VALIDATION_ERROR,
          'Invalid deletion data',
          req.headers['x-request-id'] as string,
          formatValidationErrors(errors.array())
        )
      );
    }

    const userId = req.userId;
    const { password, reason, feedback } = req.body;

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true, email: true }
    });

    if (!user || !user.password) {
      return res.status(404).json(
        createErrorResponse(
          ErrorCodes.RESOURCE_NOT_FOUND,
          'User not found',
          req.headers['x-request-id'] as string
        )
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json(
        createErrorResponse(
          ErrorCodes.INVALID_CREDENTIALS,
          'Password is incorrect',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ],
        status: { in: ['PENDING', 'PENDING_PAYMENT', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    });

    if (activeBookings > 0) {
      return res.status(409).json(
        createErrorResponse(
          ErrorCodes.BUSINESS_RULE_VIOLATION,
          'Cannot delete account with active bookings. Please complete or cancel all active bookings first.',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Soft delete - deactivate account instead of hard delete
    await prisma.user.update({
      where: { id: userId },
      data: {
        isActive: false,
        email: `deleted_${Date.now()}_${user.email}`, // Anonymize email
        password: null,
        telegramId: null,
        phoneNumber: null,
        avatar: null
      }
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { 
        isRevoked: true,
        revokedAt: new Date()
      }
    });

    // Log deletion request (for audit purposes)
    logger.info(`User account deletion requested: ${userId}`, {
      userId,
      reason,
      feedback,
      timestamp: new Date().toISOString()
    });

    return res.json(createSuccessResponse({
      message: 'Account has been successfully deleted. Thank you for using our service.',
      deletedAt: new Date().toISOString()
    }));
  } catch (error) {
    logger.error('Delete account error:', error);
    res.status(500).json(
      createErrorResponse(
        ErrorCodes.INTERNAL_SERVER_ERROR,
        'Failed to delete account',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;