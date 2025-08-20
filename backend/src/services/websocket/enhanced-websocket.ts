import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';
import { logger } from '@/utils/logger';
import { config } from '@/config';

interface AuthenticatedSocket extends Socket {
  userId: string;
  platform: string;
  user: any;
}

interface SocketEventHandlers {
  [event: string]: (socket: AuthenticatedSocket, data: any) => Promise<void>;
}

export class EnhancedWebSocketService {
  private io: SocketIOServer;
  private eventHandlers: SocketEventHandlers = {};

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupEventHandlers();
    this.setupMiddleware();
  }

  /**
   * Setup WebSocket middleware
   */
  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.accessSecret!) as any;
        
        // Get user data
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          include: {
            specialist: true
          }
        });

        if (!user || !user.isActive) {
          return next(new Error('Invalid or inactive user'));
        }

        // Attach user data to socket
        (socket as AuthenticatedSocket).userId = decoded.userId;
        (socket as AuthenticatedSocket).platform = decoded.platform;
        (socket as AuthenticatedSocket).user = user;

        next();
      } catch (error) {
        logger.error('WebSocket authentication failed:', error);
        next(new Error('Authentication failed'));
      }
    });

    // Connection handling
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket as AuthenticatedSocket);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  private async handleConnection(socket: AuthenticatedSocket) {
    try {
      logger.info('WebSocket client connected', {
        socketId: socket.id,
        userId: socket.userId,
        platform: socket.platform
      });

      // Store connection in database
      await this.storeConnection(socket);

      // Join user-specific room
      await socket.join(`user:${socket.userId}`);

      // Join platform-specific room
      await socket.join(`platform:${socket.platform}`);

      // Setup event listeners
      this.setupSocketEventListeners(socket);

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        this.handleDisconnection(socket, reason);
      });

      // Send initial data
      await this.sendInitialData(socket);

    } catch (error) {
      logger.error('WebSocket connection setup failed:', error);
      socket.disconnect(true);
    }
  }

  /**
   * Store WebSocket connection in database
   */
  private async storeConnection(socket: AuthenticatedSocket) {
    try {
      await prisma.webSocketConnection.create({
        data: {
          userId: socket.userId,
          socketId: socket.id,
          platform: socket.platform,
          rooms: JSON.stringify([`user:${socket.userId}`, `platform:${socket.platform}`]),
          isActive: true,
          lastPing: new Date()
        }
      });
    } catch (error) {
      logger.error('Failed to store WebSocket connection:', error);
    }
  }

  /**
   * Setup socket event listeners
   */
  private setupSocketEventListeners(socket: AuthenticatedSocket) {
    // Heartbeat/ping
    socket.on('ping', async () => {
      socket.emit('pong');
      await this.updateLastPing(socket.id);
    });

    // Join conversation room
    socket.on('join_conversation', async (data: { conversationId: string }) => {
      await this.handleJoinConversation(socket, data);
    });

    // Leave conversation room
    socket.on('leave_conversation', async (data: { conversationId: string }) => {
      await this.handleLeaveConversation(socket, data);
    });

    // Send message
    socket.on('send_message', async (data: any) => {
      await this.handleSendMessage(socket, data);
    });

    // Typing indicators
    socket.on('typing_start', async (data: { conversationId: string }) => {
      await this.handleTypingStart(socket, data);
    });

    socket.on('typing_stop', async (data: { conversationId: string }) => {
      await this.handleTypingStop(socket, data);
    });

    // Booking events
    socket.on('subscribe_booking', async (data: { bookingId: string }) => {
      await this.handleSubscribeBooking(socket, data);
    });

    socket.on('unsubscribe_booking', async (data: { bookingId: string }) => {
      await this.handleUnsubscribeBooking(socket, data);
    });

    // Mark notifications as read
    socket.on('mark_notification_read', async (data: { notificationId: string }) => {
      await this.handleMarkNotificationRead(socket, data);
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers() {
    // Conversation events
    this.eventHandlers['join_conversation'] = this.handleJoinConversation.bind(this);
    this.eventHandlers['leave_conversation'] = this.handleLeaveConversation.bind(this);
    this.eventHandlers['send_message'] = this.handleSendMessage.bind(this);
    this.eventHandlers['typing_start'] = this.handleTypingStart.bind(this);
    this.eventHandlers['typing_stop'] = this.handleTypingStop.bind(this);

    // Booking events
    this.eventHandlers['subscribe_booking'] = this.handleSubscribeBooking.bind(this);
    this.eventHandlers['unsubscribe_booking'] = this.handleUnsubscribeBooking.bind(this);

    // Notification events
    this.eventHandlers['mark_notification_read'] = this.handleMarkNotificationRead.bind(this);
  }

  /**
   * Handle join conversation
   */
  private async handleJoinConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const { conversationId } = data;

      // Verify user has access to conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { customerId: socket.userId },
            { specialistId: socket.userId }
          ]
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found or access denied' });
        return;
      }

      // Join conversation room
      await socket.join(`conversation:${conversationId}`);

      // Update connection rooms
      await this.updateConnectionRooms(socket, [`conversation:${conversationId}`], 'add');

      // Mark messages as read
      const isCustomer = conversation.customerId === socket.userId;
      if (isCustomer && conversation.customerUnreadCount > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { customerUnreadCount: 0 }
        });
      } else if (!isCustomer && conversation.specialistUnreadCount > 0) {
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { specialistUnreadCount: 0 }
        });
      }

      socket.emit('conversation_joined', { conversationId });
      
      logger.info('User joined conversation', {
        userId: socket.userId,
        conversationId
      });

    } catch (error) {
      logger.error('Failed to join conversation:', error);
      socket.emit('error', { message: 'Failed to join conversation' });
    }
  }

  /**
   * Handle leave conversation
   */
  private async handleLeaveConversation(socket: AuthenticatedSocket, data: { conversationId: string }) {
    try {
      const { conversationId } = data;

      await socket.leave(`conversation:${conversationId}`);
      await this.updateConnectionRooms(socket, [`conversation:${conversationId}`], 'remove');

      socket.emit('conversation_left', { conversationId });

    } catch (error) {
      logger.error('Failed to leave conversation:', error);
    }
  }

  /**
   * Handle send message
   */
  private async handleSendMessage(socket: AuthenticatedSocket, data: any) {
    try {
      const { conversationId, content, messageType = 'TEXT', attachments = [] } = data;

      // Verify conversation access
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { customerId: socket.userId },
            { specialistId: socket.userId }
          ]
        }
      });

      if (!conversation) {
        socket.emit('error', { message: 'Conversation not found' });
        return;
      }

      // Determine receiver
      const receiverId = conversation.customerId === socket.userId 
        ? conversation.specialistId 
        : conversation.customerId;

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId: socket.userId,
          receiverId,
          content,
          messageType,
          attachments: attachments.length > 0 ? JSON.stringify(attachments) : null
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

      // Update conversation
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageContent: content,
          // Increment unread count for receiver
          ...(conversation.customerId === socket.userId 
            ? { specialistUnreadCount: { increment: 1 } }
            : { customerUnreadCount: { increment: 1 } }
          )
        }
      });

      // Emit to conversation room
      this.io.to(`conversation:${conversationId}`).emit('message_received', {
        message: {
          id: message.id,
          content: message.content,
          messageType: message.messageType,
          attachments: message.attachments ? JSON.parse(message.attachments) : [],
          createdAt: message.createdAt,
          sender: message.sender
        }
      });

      // Send push notification to offline users
      await this.sendMessageNotification(receiverId, socket.userId, content, conversationId);

    } catch (error) {
      logger.error('Failed to send message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  }

  /**
   * Handle typing indicators
   */
  private async handleTypingStart(socket: AuthenticatedSocket, data: { conversationId: string }) {
    const { conversationId } = data;
    
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId,
      typing: true
    });
  }

  private async handleTypingStop(socket: AuthenticatedSocket, data: { conversationId: string }) {
    const { conversationId } = data;
    
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      userId: socket.userId,
      conversationId,
      typing: false
    });
  }

  /**
   * Handle booking subscription
   */
  private async handleSubscribeBooking(socket: AuthenticatedSocket, data: { bookingId: string }) {
    try {
      const { bookingId } = data;

      // Verify user has access to booking
      const booking = await prisma.booking.findFirst({
        where: {
          id: bookingId,
          OR: [
            { customerId: socket.userId },
            { specialistId: socket.userId }
          ]
        }
      });

      if (!booking) {
        socket.emit('error', { message: 'Booking not found or access denied' });
        return;
      }

      await socket.join(`booking:${bookingId}`);
      await this.updateConnectionRooms(socket, [`booking:${bookingId}`], 'add');

      socket.emit('booking_subscribed', { bookingId });

    } catch (error) {
      logger.error('Failed to subscribe to booking:', error);
      socket.emit('error', { message: 'Failed to subscribe to booking' });
    }
  }

  /**
   * Handle booking unsubscription
   */
  private async handleUnsubscribeBooking(socket: AuthenticatedSocket, data: { bookingId: string }) {
    const { bookingId } = data;
    
    await socket.leave(`booking:${bookingId}`);
    await this.updateConnectionRooms(socket, [`booking:${bookingId}`], 'remove');

    socket.emit('booking_unsubscribed', { bookingId });
  }

  /**
   * Handle mark notification as read
   */
  private async handleMarkNotificationRead(socket: AuthenticatedSocket, data: { notificationId: string }) {
    try {
      await prisma.notification.updateMany({
        where: {
          id: data.notificationId,
          userId: socket.userId
        },
        data: {
          isRead: true,
          readAt: new Date()
        }
      });

      socket.emit('notification_read', { notificationId: data.notificationId });

    } catch (error) {
      logger.error('Failed to mark notification as read:', error);
    }
  }

  /**
   * Send initial data to connected socket
   */
  private async sendInitialData(socket: AuthenticatedSocket) {
    try {
      // Send unread message count
      const unreadCount = await this.getUnreadMessageCount(socket.userId);
      socket.emit('unread_count', { messages: unreadCount });

      // Send unread notifications count
      const unreadNotifications = await prisma.notification.count({
        where: {
          userId: socket.userId,
          isRead: false
        }
      });
      socket.emit('unread_notifications', { count: unreadNotifications });

      // Send active bookings if specialist
      if (socket.user.userType === 'SPECIALIST') {
        const activeBookings = await prisma.booking.count({
          where: {
            specialistId: socket.userId,
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
            }
          }
        });
        socket.emit('active_bookings', { count: activeBookings });
      }

    } catch (error) {
      logger.error('Failed to send initial data:', error);
    }
  }

  /**
   * Handle disconnection
   */
  private async handleDisconnection(socket: AuthenticatedSocket, reason: string) {
    try {
      logger.info('WebSocket client disconnected', {
        socketId: socket.id,
        userId: socket.userId,
        reason
      });

      // Update connection status
      await prisma.webSocketConnection.updateMany({
        where: { socketId: socket.id },
        data: { isActive: false }
      });

    } catch (error) {
      logger.error('Failed to handle disconnection:', error);
    }
  }

  /**
   * Broadcast booking update to relevant users
   */
  async broadcastBookingUpdate(bookingId: string, update: any) {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          customer: { select: { id: true, firstName: true, lastName: true } },
          specialist: { select: { id: true, firstName: true, lastName: true } },
          service: { select: { name: true } }
        }
      });

      if (!booking) return;

      // Broadcast to booking room
      this.io.to(`booking:${bookingId}`).emit('booking_updated', {
        bookingId,
        ...update,
        booking
      });

      // Send to user rooms
      this.io.to(`user:${booking.customerId}`).emit('booking_updated', {
        bookingId,
        ...update,
        booking
      });

      this.io.to(`user:${booking.specialistId}`).emit('booking_updated', {
        bookingId,
        ...update,
        booking
      });

    } catch (error) {
      logger.error('Failed to broadcast booking update:', error);
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(userId: string, notification: any) {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  /**
   * Broadcast platform-wide announcement
   */
  async broadcastAnnouncement(platforms: string[], message: any) {
    platforms.forEach(platform => {
      this.io.to(`platform:${platform}`).emit('announcement', message);
    });
  }

  // Helper methods
  private async updateLastPing(socketId: string) {
    try {
      await prisma.webSocketConnection.updateMany({
        where: { socketId },
        data: { lastPing: new Date() }
      });
    } catch (error) {
      logger.error('Failed to update last ping:', error);
    }
  }

  private async updateConnectionRooms(socket: AuthenticatedSocket, rooms: string[], action: 'add' | 'remove') {
    try {
      const connection = await prisma.webSocketConnection.findUnique({
        where: { socketId: socket.id }
      });

      if (!connection) return;

      const currentRooms = JSON.parse(connection.rooms || '[]');
      let updatedRooms = [...currentRooms];

      if (action === 'add') {
        updatedRooms = [...new Set([...updatedRooms, ...rooms])];
      } else {
        updatedRooms = updatedRooms.filter(room => !rooms.includes(room));
      }

      await prisma.webSocketConnection.update({
        where: { socketId: socket.id },
        data: { rooms: JSON.stringify(updatedRooms) }
      });

    } catch (error) {
      logger.error('Failed to update connection rooms:', error);
    }
  }

  private async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const conversations = await prisma.conversation.findMany({
        where: {
          OR: [
            { customerId: userId },
            { specialistId: userId }
          ]
        }
      });

      return conversations.reduce((total, conv) => {
        return total + (conv.customerId === userId 
          ? conv.customerUnreadCount 
          : conv.specialistUnreadCount);
      }, 0);

    } catch (error) {
      logger.error('Failed to get unread message count:', error);
      return 0;
    }
  }

  private async sendMessageNotification(receiverId: string, senderId: string, content: string, conversationId: string) {
    // Implementation would depend on your push notification service
    // This is a placeholder for the notification logic
    try {
      const sender = await prisma.user.findUnique({
        where: { id: senderId },
        select: { firstName: true, lastName: true }
      });

      // Create notification record
      await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'NEW_MESSAGE',
          title: `New message from ${sender?.firstName} ${sender?.lastName}`,
          message: content.substring(0, 100),
          data: JSON.stringify({ conversationId, senderId })
        }
      });

      // Send real-time notification
      this.io.to(`user:${receiverId}`).emit('notification', {
        type: 'NEW_MESSAGE',
        title: `New message from ${sender?.firstName} ${sender?.lastName}`,
        message: content.substring(0, 100),
        conversationId
      });

    } catch (error) {
      logger.error('Failed to send message notification:', error);
    }
  }
}