import { Router } from 'express';
import { NotificationController } from '@/controllers/notifications/index';
import { NotificationService } from '@/services/notification';
import { PrismaClient } from '@prisma/client';
import { createSuccessResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const router = Router();
const prisma = new PrismaClient();
const notificationService = new NotificationService(prisma);

/**
 * TEMPORARY TEST ENDPOINTS - FOR DEBUGGING ONLY
 * These endpoints bypass authentication for testing purposes
 * Should be removed before production deployment
 */

// Test endpoint to check notification system without auth
router.get('/system-status', async (req, res) => {
  try {
    // Check database connection
    const userCount = await prisma.user.count();
    const notificationCount = await prisma.notification.count();
    
    res.json(createSuccessResponse({
      message: 'Notification system status check',
      database: {
        connected: true,
        userCount,
        notificationCount
      },
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      system: 'notifications'
    }));
  } catch (error) {
    logger.error('System status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'System status check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to create a notification for a user
router.post('/create-test-notification/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type = 'TEST', title = 'Test Notification', message = 'This is a test notification' } = req.body;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }
    
    // Create notification using the service
    const notification = await notificationService.sendNotification(userId, {
      type,
      title,
      message,
      data: { test: true, timestamp: new Date().toISOString() }
    });
    
    res.json(createSuccessResponse({
      message: 'Test notification created successfully',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        userId: notification.userId
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      }
    }));
  } catch (error) {
    logger.error('Test notification creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test notification creation failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to get notifications for a user without auth
router.get('/user-notifications/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }
    
    // Get user notifications
    const result = await notificationService.getUserNotifications(userId, {
      page,
      limit
    });
    
    res.json(createSuccessResponse({
      ...result,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      },
      testMode: true
    }));
  } catch (error) {
    logger.error('Get user notifications failed:', error);
    res.status(500).json({
      success: false,
      error: 'Get user notifications failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to get unread count for a user without auth
router.get('/user-unread-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, firstName: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }
    
    const unreadCount = await notificationService.getUnreadCount(userId);
    
    res.json(createSuccessResponse({
      unreadCount,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName
      },
      testMode: true
    }));
  } catch (error) {
    logger.error('Get unread count failed:', error);
    res.status(500).json({
      success: false,
      error: 'Get unread count failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test endpoint to list all users (for getting user IDs for testing)
router.get('/list-users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        userType: true,
        isActive: true,
        emailNotifications: true,
        pushNotifications: true,
        telegramNotifications: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    
    res.json(createSuccessResponse({
      message: 'Users list (for testing only)',
      users,
      totalCount: users.length,
      testMode: true
    }));
  } catch (error) {
    logger.error('List users failed:', error);
    res.status(500).json({
      success: false,
      error: 'List users failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Test email notification specifically
router.post('/test-email/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        emailNotifications: true
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        userId
      });
    }
    
    if (!user.email) {
      return res.status(400).json({
        success: false,
        error: 'User has no email address'
      });
    }
    
    // Create a test email notification
    const notification = await notificationService.sendNotification(userId, {
      type: 'EMAIL_TEST',
      title: 'Email Notification Test',
      message: 'This is a test email notification to verify the email system is working correctly.',
      data: { 
        test: true, 
        timestamp: new Date().toISOString(),
        testType: 'email'
      }
    });
    
    res.json(createSuccessResponse({
      message: 'Test email notification sent',
      notification: {
        id: notification.id,
        type: notification.type,
        title: notification.title
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        emailNotifications: user.emailNotifications
      },
      testMode: true
    }));
  } catch (error) {
    logger.error('Test email notification failed:', error);
    res.status(500).json({
      success: false,
      error: 'Test email notification failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;