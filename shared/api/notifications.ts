// ============================================================
// Notifications API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';

export function createNotificationsApi(client: SharedApiClient) {
  return {
    async getNotifications(params?: { page?: number; limit?: number; filter?: string }) {
      return client.get('/notifications', { params });
    },

    async getUnreadCount() {
      return client.get('/notifications/unread-count');
    },

    async markRead(id: string) {
      return client.put(`/notifications/${id}/read`);
    },

    async markAllRead() {
      return client.put('/notifications/read-all');
    },

    async deleteNotification(id: string) {
      return client.delete(`/notifications/${id}`);
    },

    async deleteAll() {
      return client.delete('/notifications/all');
    },
  };
}

export type NotificationsApi = ReturnType<typeof createNotificationsApi>;
