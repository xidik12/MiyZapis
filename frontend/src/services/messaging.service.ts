import { apiClient } from './api';
import { socketService } from './socket.service';
import { ApiResponse, Pagination } from '../types';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface Conversation {
  id: string;
  participants: ConversationParticipant[];
  lastMessage?: Message;
  unreadCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParticipant {
  id: string;
  userId: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    userType: 'customer' | 'specialist';
  };
  isOnline: boolean;
  lastSeen?: string;
  joinedAt: string;
}

export interface SendMessageRequest {
  conversationId?: string;
  receiverId?: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  attachments?: File[];
}

export interface ConversationFilters {
  isActive?: boolean;
  hasUnread?: boolean;
  participantId?: string;
  page?: number;
  limit?: number;
}

export interface MessageFilters {
  conversationId: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  senderId?: string;
  before?: string; // ISO date string
  after?: string; // ISO date string
  page?: number;
  limit?: number;
}

export class MessagingService {
  // Get user conversations
  async getConversations(filters: ConversationFilters = {}): Promise<{ conversations: Conversation[]; pagination: Pagination }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<{ conversations: Conversation[]; pagination: Pagination }>(`/messages/conversations?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get conversations');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get conversations';
      throw new Error(errorMessage);
    }
  }

  // Get conversation messages
  async getMessages(filters: MessageFilters): Promise<{ messages: Message[]; pagination: Pagination }> {
    try {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await apiClient.get<{ messages: Message[]; pagination: Pagination }>(`/messages?${params}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get messages');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get messages';
      throw new Error(errorMessage);
    }
  }

  // Send a message
  async sendMessage(data: SendMessageRequest): Promise<Message> {
    try {
      let requestData: any = {
        content: data.content,
        messageType: data.messageType || 'text'
      };

      if (data.conversationId) {
        requestData.conversationId = data.conversationId;
      }

      if (data.receiverId) {
        requestData.receiverId = data.receiverId;
      }

      // Handle file attachments
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('content', data.content);
        formData.append('messageType', data.messageType || 'text');
        
        if (data.conversationId) {
          formData.append('conversationId', data.conversationId);
        }
        
        if (data.receiverId) {
          formData.append('receiverId', data.receiverId);
        }

        data.attachments.forEach((file, index) => {
          formData.append(`attachments`, file);
        });

        const response = await apiClient.post<Message>('/messages/send-with-attachments', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to send message with attachments');
        }
        return response.data;
      } else {
        const response = await apiClient.post<Message>('/messages/send', requestData);
        if (!response.success || !response.data) {
          throw new Error(response.error?.message || 'Failed to send message');
        }
        return response.data;
      }
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to send message';
      throw new Error(errorMessage);
    }
  }

  // Mark messages as read
  async markMessagesAsRead(conversationId: string, messageIds?: string[]): Promise<{ message: string; markedCount: number }> {
    try {
      const requestData = messageIds ? { messageIds } : {};
      
      const response = await apiClient.put<{ message: string; markedCount: number }>(`/messages/conversations/${conversationId}/read`, requestData);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to mark messages as read');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to mark messages as read';
      throw new Error(errorMessage);
    }
  }

  // Delete a message
  async deleteMessage(messageId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.delete<{ message: string }>(`/messages/${messageId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to delete message');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to delete message';
      throw new Error(errorMessage);
    }
  }

  // Get or create conversation between two users
  async getOrCreateConversation(participantId: string): Promise<Conversation> {
    try {
      const response = await apiClient.post<Conversation>('/messages/conversations', { participantId });
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get or create conversation');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get or create conversation';
      throw new Error(errorMessage);
    }
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<{ message: string }> {
    try {
      const response = await apiClient.put<{ message: string }>(`/messages/conversations/${conversationId}/archive`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to archive conversation');
      }
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to archive conversation';
      throw new Error(errorMessage);
    }
  }

  // Real-time messaging methods using socket service
  joinConversation(conversationId: string): void {
    socketService.emit('join_conversation', { conversationId });
  }

  leaveConversation(conversationId: string): void {
    socketService.emit('leave_conversation', { conversationId });
  }

  // Subscribe to real-time message events
  onNewMessage(callback: (message: Message) => void): void {
    socketService.on('new_message', callback);
  }

  onMessageRead(callback: (data: { messageId: string; readBy: string; readAt: string }) => void): void {
    socketService.on('message_read', callback);
  }

  onUserOnline(callback: (data: { userId: string; isOnline: boolean }) => void): void {
    socketService.on('user_online_status', callback);
  }

  onTypingStart(callback: (data: { conversationId: string; userId: string }) => void): void {
    socketService.on('typing_start', callback);
  }

  onTypingStop(callback: (data: { conversationId: string; userId: string }) => void): void {
    socketService.on('typing_stop', callback);
  }

  // Send typing indicators
  startTyping(conversationId: string): void {
    socketService.emit('typing_start', { conversationId });
  }

  stopTyping(conversationId: string): void {
    socketService.emit('typing_stop', { conversationId });
  }

  // Clean up event listeners
  removeMessageListeners(): void {
    socketService.off('new_message');
    socketService.off('message_read');
    socketService.off('user_online_status');
    socketService.off('typing_start');
    socketService.off('typing_stop');
  }
}

export const messagingService = new MessagingService();
