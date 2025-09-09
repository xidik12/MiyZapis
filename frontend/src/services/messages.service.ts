import { apiClient } from './api';
import { Pagination, ApiResponse } from '@/types';

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
  attachments?: string[];
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  customerId: string;
  specialistId: string;
  bookingId?: string;
  lastMessageAt?: string;
  isBlocked: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  specialist: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    businessName?: string;
  };
  lastMessage?: Message;
  unreadCount: number;
}

export interface ConversationResponse {
  conversation: Conversation;
  messages: Message[];
  pagination: Pagination;
}

export class MessagesService {
  // Get user's conversations
  async getConversations(page: number = 1, limit: number = 20): Promise<{
    conversations: Conversation[];
    pagination: Pagination;
  }> {
    const response = await apiClient.get<{
      conversations: Conversation[];
      pagination: Pagination;
    }>(`/messages/conversations?page=${page}&limit=${limit}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get conversations');
    }
    
    return response.data;
  }

  // Get conversation details with messages
  async getConversation(conversationId: string, page: number = 1, limit: number = 50): Promise<ConversationResponse> {
    const response = await apiClient.get<ConversationResponse>(
      `/messages/conversations/${conversationId}?page=${page}&limit=${limit}`
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get conversation');
    }
    
    return response.data;
  }

  // Create new conversation
  async createConversation(data: {
    participantId: string;
    bookingId?: string;
    initialMessage?: string;
  }): Promise<Conversation> {
    const response = await apiClient.post<Conversation>('/messages/conversations', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create conversation');
    }
    
    return response.data;
  }

  // Send message in conversation
  async sendMessage(conversationId: string, data: {
    content: string;
    messageType?: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    attachments?: string[];
  }): Promise<Message> {
    const response = await apiClient.post<Message>(
      `/messages/conversations/${conversationId}/messages`,
      data
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to send message');
    }
    
    return response.data;
  }

  // Mark conversation as read
  async markAsRead(conversationId: string): Promise<void> {
    const response = await apiClient.put<{ message: string }>(
      `/messages/conversations/${conversationId}/read`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to mark as read');
    }
  }

  // Archive conversation
  async archiveConversation(conversationId: string): Promise<void> {
    const response = await apiClient.put<{ message: string }>(
      `/messages/conversations/${conversationId}/archive`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to archive conversation');
    }
  }

  // Block conversation
  async blockConversation(conversationId: string): Promise<void> {
    const response = await apiClient.put<{ message: string }>(
      `/messages/conversations/${conversationId}/block`
    );
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to block conversation');
    }
  }

  // Get unread message count
  async getUnreadCount(): Promise<{ count: number }> {
    const response = await apiClient.get<{ count: number }>('/messages/unread-count');
    
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to get unread count');
    }
    
    return response.data;
  }
}

export const messagesService = new MessagesService();
