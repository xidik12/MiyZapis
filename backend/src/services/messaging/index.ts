import { PrismaClient, Message, Conversation } from '@prisma/client';
import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/utils/logger';
import { redis } from '@/config/redis';
import { NotificationService } from '@/services/notification';

interface MessageData {
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType?: string;
  attachments?: string[];
}

interface ConversationParticipant {
  userId: string;
  socketId: string;
}

export class MessagingService {
  private prisma: PrismaClient;
  private io?: SocketIOServer;
  private notificationService: NotificationService;

  constructor(prisma: PrismaClient, io?: SocketIOServer) {
    this.prisma = prisma;
    this.io = io;
    this.notificationService = new NotificationService(prisma);
    if (io) {
      this.setupSocketHandlers();
    }
  }

  setSocketIO(io: SocketIOServer) {
    this.io = io;
    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    if (!this.io) return;
    
    this.io.on('connection', (socket) => {
      logger.info('User connected to messaging', { socketId: socket.id });

      // Join conversation room
      socket.on('join_conversation', async (data: { conversationId: string }) => {
        try {
          const { conversationId } = data;
          const userId = socket.data.userId;

          if (!userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          // Verify user is part of conversation
          const conversation = await this.prisma.conversation.findFirst({
            where: {
              id: conversationId,
              OR: [
                { customerId: userId },
                { specialistId: userId }
              ]
            }
          });

          if (!conversation) {
            socket.emit('error', { message: 'Conversation not found or access denied' });
            return;
          }

          // Join socket room
          await socket.join(`conversation:${conversationId}`);
          
          // Store user's socket info in Redis
          if (redis) {
            await redis.hset(
              `conversation:${conversationId}:participants`,
              userId,
              socket.id
            );
          }

          // Mark messages as delivered
          await this.markMessagesAsDelivered(conversationId, userId);

          socket.emit('conversation_joined', { conversationId });

          logger.info('User joined conversation', {
            userId,
            conversationId,
            socketId: socket.id
          });
        } catch (error) {
          logger.error('Error joining conversation:', error);
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Send message
      socket.on('send_message', async (data: MessageData) => {
        try {
          const userId = socket.data.userId;
          if (!userId) {
            socket.emit('error', { message: 'Authentication required' });
            return;
          }

          const message = await this.sendMessage({
            ...data,
            senderId: userId
          });

          // Emit to conversation room
          if (this.io) {
            this.io.to(`conversation:${data.conversationId}`)
              .emit('message_received', message);
          }

          // Send push notification if receiver is offline
          await this.sendOfflineNotification(data.conversationId, data.receiverId, message);

        } catch (error) {
          logger.error('Error sending message:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Mark message as read
      socket.on('mark_message_read', async (data: { messageId: string }) => {
        try {
          const userId = socket.data.userId;
          await this.markMessageAsRead(data.messageId, userId);
        } catch (error) {
          logger.error('Error marking message as read:', error);
        }
      });

      // Typing indicators
      socket.on('typing_start', (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`)
          .emit('user_typing', { userId: socket.data.userId });
      });

      socket.on('typing_stop', (data: { conversationId: string }) => {
        socket.to(`conversation:${data.conversationId}`)
          .emit('user_stopped_typing', { userId: socket.data.userId });
      });

      // Leave conversation
      socket.on('leave_conversation', async (data: { conversationId: string }) => {
        try {
          const userId = socket.data.userId;
          await socket.leave(`conversation:${data.conversationId}`);
          
          // Remove from Redis
          if (redis) {
            await redis.hdel(
              `conversation:${data.conversationId}:participants`,
              userId
            );
          }

          logger.info('User left conversation', {
            userId,
            conversationId: data.conversationId
          });
        } catch (error) {
          logger.error('Error leaving conversation:', error);
        }
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        try {
          const userId = socket.data.userId;
          if (userId && redis) {
            // Remove from all conversation participants
            const conversationKeys = await redis.keys('conversation:*:participants');
            for (const key of conversationKeys) {
              await redis.hdel(key, userId);
            }
          }

          logger.info('User disconnected from messaging', {
            socketId: socket.id,
            userId
          });
        } catch (error) {
          logger.error('Error handling disconnect:', error);
        }
      });
    });
  }

  async sendMessage(data: MessageData): Promise<Message> {
    const {
      conversationId,
      senderId,
      receiverId,
      content,
      messageType = 'TEXT',
      attachments = []
    } = data;

    // Create message
    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content,
        messageType,
        attachments: JSON.stringify(attachments),
        isDelivered: true // Mark as delivered since it's real-time
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });

    // Update conversation last message info
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageContent: content,
        // Increment unread count for receiver
        ...(senderId === (await this.getConversation(conversationId))?.customerId 
          ? { specialistUnreadCount: { increment: 1 } }
          : { customerUnreadCount: { increment: 1 } })
      }
    });

    try {
      // Emit message to conversation room via Socket.IO
      if (this.io) {
        this.io.to(`conversation:${conversationId}`).emit('new_message', {
          message,
          conversationId
        });
        
        // Also emit to receiver specifically if they're not in the room
        const receiverSocketId = await redis?.hget(
          `conversation:${conversationId}:participants`,
          receiverId
        );
        
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('new_message', {
            message,
            conversationId
          });
        }
        
        logger.info('Message emitted via socket', {
          messageId: message.id,
          conversationId,
          senderId,
          receiverId
        });
      }

      // Send push notification to receiver
      await this.notificationService.sendNotification(receiverId, {
        type: 'NEW_MESSAGE',
        title: `New message from ${message.sender.firstName} ${message.sender.lastName}`,
        message: content.length > 100 ? content.substring(0, 97) + '...' : content,
        data: {
          conversationId,
          messageId: message.id,
          senderId,
          senderName: `${message.sender.firstName} ${message.sender.lastName}`
        }
      });
      
      logger.info('Message notification sent', {
        messageId: message.id,
        receiverId
      });
    } catch (notificationError) {
      logger.error('Failed to send message notification or socket emit:', notificationError);
      // Don't throw error as message was successfully created
    }

    return message;
  }

  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { conversation: true }
    });

    if (!message || message.receiverId !== userId) {
      throw new Error('Message not found or access denied');
    }

    if (!message.isRead) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      // Decrement unread count
      const isCustomer = message.conversation.customerId === userId;
      await this.prisma.conversation.update({
        where: { id: message.conversationId },
        data: {
          ...(isCustomer 
            ? { customerUnreadCount: { decrement: 1 } }
            : { specialistUnreadCount: { decrement: 1 } })
        }
      });

      // Emit read receipt
      if (this.io) {
        this.io.to(`conversation:${message.conversationId}`)
          .emit('message_read', { messageId, readBy: userId, readAt: new Date() });
      }
    }
  }

  async markMessagesAsDelivered(conversationId: string, userId: string): Promise<void> {
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isDelivered: false
      },
      data: {
        isDelivered: true,
        deliveredAt: new Date()
      }
    });
  }

  async createConversation(customerId: string, specialistId: string, bookingId?: string): Promise<Conversation> {
    // Check if conversation already exists
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        customerId,
        specialistId,
        ...(bookingId ? { bookingId } : {})
      }
    });

    if (existingConversation) {
      return existingConversation;
    }

    return await this.prisma.conversation.create({
      data: {
        customerId,
        specialistId,
        bookingId
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      }
    });
  }

  async getConversation(conversationId: string): Promise<Conversation | null> {
    return await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            status: true,
            scheduledAt: true,
            service: {
              select: {
                name: true
              }
            }
          }
        }
      }
    });
  }

  async getUserConversations(userId: string, page = 1, limit = 20): Promise<any> {
    const skip = (page - 1) * limit;

    const conversations = await this.prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ],
        status: 'ACTIVE'
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        specialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        },
        booking: {
          select: {
            id: true,
            status: true,
            service: {
              select: {
                name: true
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await this.prisma.conversation.count({
      where: {
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ],
        status: 'ACTIVE'
      }
    });

    return {
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    page = 1,
    limit = 50
  ): Promise<any> {
    // Verify user access
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ]
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    const skip = (page - 1) * limit;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await this.prisma.message.count({
      where: { conversationId }
    });

    // Mark messages as read
    await this.markConversationAsRead(conversationId, userId);

    return {
      messages: messages.reverse(), // Return in chronological order
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    // Mark all unread messages as read
    await this.prisma.message.updateMany({
      where: {
        conversationId,
        receiverId: userId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    // Reset unread count
    const conversation = await this.getConversation(conversationId);
    if (conversation) {
      const isCustomer = conversation.customerId === userId;
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          ...(isCustomer 
            ? { customerUnreadCount: 0 }
            : { specialistUnreadCount: 0 })
        }
      });
    }
  }

  private async sendOfflineNotification(
    conversationId: string,
    receiverId: string,
    message: Message
  ): Promise<void> {
    try {
      // Check if receiver is online
      const isOnline = redis ? await redis.hexists(
        `conversation:${conversationId}:participants`,
        receiverId
      ) : false;

      if (!isOnline) {
        // Send push notification
        await this.notificationService.sendNotification(receiverId, {
          type: 'NEW_MESSAGE',
          title: 'Нове повідомлення',
          message: message.content,
          data: {
            conversationId,
            messageId: message.id,
            senderId: message.senderId
          }
        });
      }
    } catch (error) {
      logger.error('Error sending offline notification:', error);
    }
  }

  async archiveConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ]
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'ARCHIVED' }
    });
  }

  async blockConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.prisma.conversation.findFirst({
      where: {
        id: conversationId,
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ]
      }
    });

    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { status: 'BLOCKED' }
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    const result = await this.prisma.conversation.aggregate({
      where: {
        OR: [
          { customerId: userId },
          { specialistId: userId }
        ],
        status: 'ACTIVE'
      },
      _sum: {
        customerUnreadCount: true,
        specialistUnreadCount: true
      }
    });

    return (result._sum.customerUnreadCount || 0) + (result._sum.specialistUnreadCount || 0);
  }
}