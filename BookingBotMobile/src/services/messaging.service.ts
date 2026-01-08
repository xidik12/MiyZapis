// Messaging service - adapted for React Native
import { apiClient } from './api';

export interface Conversation {
  id: string;
  participantId?: string;
  participantName?: string;
  participantAvatar?: string;
  customerId?: string;
  specialistId?: string;
  customer?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  specialist?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    businessName?: string;
  };
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  lastMessageAt?: string;
  unreadCount: number;
  updatedAt: string;
  isBlocked?: boolean;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export class MessagingService {
  // Transform conversation from web API format to mobile format
  private transformConversation(conv: any, currentUserId?: string): Conversation {
    // If it's already in mobile format, return as is
    if (conv.participantId && conv.participantName) {
      return conv;
    }

    // Transform from web format (with customer/specialist objects)
    const isCustomer = currentUserId === conv.customerId;
    const otherParticipant = isCustomer ? conv.specialist : conv.customer;
    
    return {
      ...conv,
      participantId: otherParticipant?.id || conv.participantId,
      participantName: otherParticipant
        ? `${otherParticipant.firstName} ${otherParticipant.lastName}`
        : conv.participantName,
      participantAvatar: otherParticipant?.avatar || conv.participantAvatar,
      lastMessage: conv.lastMessage
        ? {
            content: conv.lastMessage.content,
            createdAt: conv.lastMessage.createdAt || conv.lastMessageAt || conv.updatedAt,
            isRead: conv.lastMessage.readAt ? true : false,
          }
        : undefined,
    };
  }

  // Get conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<{ conversations: Conversation[] }>('/messages/conversations');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get conversations');
    }
    
    // Transform conversations to mobile format
    const conversations = response.data.conversations || [];
    return conversations.map(conv => this.transformConversation(conv));
  }

  // Create conversation
  async createConversation(participantId: string): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/messages/conversations', { participantId });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create conversation');
    }
    return response.data;
  }

  // Get messages for a conversation
  async getMessages(conversationId: string, filters: {
    page?: number;
    limit?: number;
  } = {}): Promise<{
    messages: Message[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      hasNext: boolean;
      hasPrev: boolean;
      limit: number;
    };
  }> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    // Try the conversation endpoint first (web format)
    try {
      const response = await apiClient.get<{
        conversation: Conversation;
        messages: Message[];
        pagination?: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
        };
      }>(`/messages/conversations/${conversationId}?${params}`);
      
      if (response.success && response.data) {
        return {
          messages: response.data.messages || [],
          pagination: response.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalItems: response.data.messages?.length || 0,
            hasNext: false,
            hasPrev: false,
            limit: filters.limit || 20,
          }
        };
      }
    } catch (error) {
      // Fallback to messages endpoint
    }

    // Fallback to messages endpoint
    const response = await apiClient.get<{
      messages: Message[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/messages/conversations/${conversationId}/messages?${params}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get messages');
    }
    
    return {
      messages: response.data.messages || [],
      pagination: {
        currentPage: response.data.page || 1,
        totalPages: response.data.totalPages || 1,
        totalItems: response.data.total || 0,
        hasNext: (response.data.page || 1) < (response.data.totalPages || 1),
        hasPrev: (response.data.page || 1) > 1,
        limit: filters.limit || 20,
      }
    };
  }

  // Send message
  async sendMessage(conversationId: string, content: string | { content: string; messageType?: string }): Promise<Message> {
    const messageData = typeof content === 'string' 
      ? { content, messageType: 'TEXT' }
      : { content: content.content, messageType: content.messageType || 'TEXT' };
    
    const response = await apiClient.post<Message>(`/messages/conversations/${conversationId}/messages`, messageData);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send message');
    }
    return response.data;
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<void> {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/archive`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to archive conversation');
    }
  }

  // Block conversation
  async blockConversation(conversationId: string): Promise<void> {
    const response = await apiClient.put(`/messages/conversations/${conversationId}/block`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to block conversation');
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<{ message: string }> {
    const response = await apiClient.put<{ message: string }>(`/messages/conversations/${conversationId}/read`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to mark messages as read');
    }
    return response.data;
  }
}

export const messagingService = new MessagingService();

