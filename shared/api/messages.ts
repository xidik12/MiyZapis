// ============================================================
// Messages / Conversations API Endpoints
// ============================================================

import type { SharedApiClient } from './client';

export function createMessagesApi(client: SharedApiClient) {
  return {
    async getConversations() {
      return client.get('/messages/conversations');
    },

    async getConversation(id: string) {
      return client.get(`/messages/conversations/${id}`);
    },

    async createConversation(participantId: string) {
      return client.post('/messages/conversations', { participantId });
    },

    async sendMessage(conversationId: string, content: string) {
      return client.post(`/messages/conversations/${conversationId}/messages`, { content });
    },

    async markMessagesRead(conversationId: string) {
      return client.put(`/messages/conversations/${conversationId}/read`);
    },

    async getUnreadCount() {
      return client.get('/messages/unread-count');
    },

    async deleteConversation(id: string) {
      return client.delete(`/messages/conversations/${id}`);
    },
  };
}

export type MessagesApi = ReturnType<typeof createMessagesApi>;
