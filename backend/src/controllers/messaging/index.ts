import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { MessagingService } from '@/services/messaging';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';

const prisma = new PrismaClient();

export class MessagingController {
  private messagingService: MessagingService;

  constructor() {
    this.messagingService = new MessagingService(prisma);
  }

  getUserConversations = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await this.messagingService.getUserConversations(userId, page, limit);

      return successResponse(res, result, 'Conversations retrieved successfully');
    } catch (error) {
      logger.error('Error getting user conversations:', error);
      return errorResponse(res, 'Failed to retrieve conversations', 500);
    }
  };

  getConversation = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;

      // Get conversation details
      const conversation = await this.messagingService.getConversation(conversationId);
      if (!conversation) {
        return errorResponse(res, 'Conversation not found', 404);
      }

      // Verify user access
      if (conversation.customerId !== userId && conversation.specialistId !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Get messages
      const messages = await this.messagingService.getConversationMessages(
        conversationId,
        userId,
        page,
        limit
      );

      return successResponse(res, {
        conversation,
        messages: messages.messages,
        pagination: messages.pagination
      }, 'Conversation retrieved successfully');
    } catch (error) {
      logger.error('Error getting conversation:', error);
      return errorResponse(res, 'Failed to retrieve conversation', 500);
    }
  };

  createConversation = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { participantId, bookingId, initialMessage } = req.body;

      // If bookingId is provided, derive roles from the booking to avoid role ambiguity
      let customerId: string;
      let specialistId: string;
      if (bookingId) {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          select: { id: true, customerId: true, specialistId: true }
        });

        if (!booking) {
          return errorResponse(res, 'Booking not found', 404);
        }

        // Ensure requester is part of the booking
        if (booking.customerId !== userId && booking.specialistId !== userId) {
          return errorResponse(res, 'Access denied for this booking', 403);
        }

        customerId = booking.customerId;
        specialistId = booking.specialistId;

        // If participantId was passed and is not one of the booking participants, normalize it (do not hard error)
        if (participantId && participantId !== customerId && participantId !== specialistId) {
          // No-op: we'll still create/reuse conversation using booking roles
        }
      } else {
        // Determine roles based on specialist relationship when no booking context is provided
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: { specialist: true }
        });

        const participant = await prisma.user.findUnique({
          where: { id: participantId },
          include: { specialist: true }
        });

        if (!user || !participant) {
          return errorResponse(res, 'User not found', 404);
        }

        if (user.specialist && !participant.specialist) {
          // Current user is specialist, participant is customer
          specialistId = userId;
          customerId = participantId;
        } else if (!user.specialist && participant.specialist) {
          // Current user is customer, participant is specialist
          customerId = userId;
          specialistId = participantId;
        } else {
          return errorResponse(res, 'Invalid conversation participants', 400);
        }
      }

      // Create conversation
      const conversation = await this.messagingService.createConversation(
        customerId,
        specialistId,
        bookingId
      );

      // Send initial message if provided
      if (initialMessage) {
        const receiverId = (userId === customerId) ? specialistId : customerId;
        await this.messagingService.sendMessage({
          conversationId: conversation.id,
          senderId: userId,
          receiverId,
          content: initialMessage
        });
      }

      return successResponse(res, conversation, 'Conversation created successfully', 201);
    } catch (error) {
      logger.error('Error creating conversation:', error);
      return errorResponse(res, 'Failed to create conversation', 500);
    }
  };

  sendMessage = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;
      const { content, messageType = 'TEXT', attachments = [] } = req.body;

      // Get conversation to determine receiver
      const conversation = await this.messagingService.getConversation(conversationId);
      if (!conversation) {
        return errorResponse(res, 'Conversation not found', 404);
      }

      // Verify user is part of conversation
      if (conversation.customerId !== userId && conversation.specialistId !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Determine receiver
      const receiverId = conversation.customerId === userId 
        ? conversation.specialistId 
        : conversation.customerId;

      const message = await this.messagingService.sendMessage({
        conversationId,
        senderId: userId,
        receiverId,
        content,
        messageType,
        attachments
      });

      return successResponse(res, message, 'Message sent successfully', 201);
    } catch (error) {
      logger.error('Error sending message:', error);
      return errorResponse(res, 'Failed to send message', 500);
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      await this.messagingService.markConversationAsRead(conversationId, userId);

      return successResponse(res, null, 'Conversation marked as read');
    } catch (error) {
      logger.error('Error marking conversation as read:', error);
      return errorResponse(res, 'Failed to mark conversation as read', 500);
    }
  };

  archiveConversation = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      await this.messagingService.archiveConversation(conversationId, userId);

      return successResponse(res, null, 'Conversation archived successfully');
    } catch (error) {
      logger.error('Error archiving conversation:', error);
      return errorResponse(res, 'Failed to archive conversation', 500);
    }
  };

  blockConversation = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const conversationId = req.params.id;

      await this.messagingService.blockConversation(conversationId, userId);

      return successResponse(res, null, 'Conversation blocked successfully');
    } catch (error) {
      logger.error('Error blocking conversation:', error);
      return errorResponse(res, 'Failed to block conversation', 500);
    }
  };

  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const unreadCount = await this.messagingService.getUnreadCount(userId);

      return successResponse(res, { unreadCount }, 'Unread count retrieved successfully');
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return errorResponse(res, 'Failed to get unread count', 500);
    }
  };
}
