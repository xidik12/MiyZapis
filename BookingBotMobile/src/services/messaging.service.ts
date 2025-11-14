// Messaging service - adapted for React Native
import { apiClient } from './api';

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatar?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
    isRead: boolean;
  };
  unreadCount: number;
  updatedAt: string;
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
  // Get conversations
  async getConversations(): Promise<Conversation[]> {
    const response = await apiClient.get<{ conversations: Conversation[] }>('/messages/conversations');
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get conversations');
    }
    return response.data.conversations || [];
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
  async sendMessage(conversationId: string, content: string): Promise<Message> {
    const response = await apiClient.post<Message>(`/messages/conversations/${conversationId}/messages`, {
      content
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send message');
    }
    return response.data;
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

