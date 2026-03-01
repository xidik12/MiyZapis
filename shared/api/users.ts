// ============================================================
// Users API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { User } from '../types';

export function createUsersApi(client: SharedApiClient) {
  return {
    async getUserProfile() {
      return client.get<User>('/users/profile');
    },

    async updateProfile(updates: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      avatar?: string;
      preferences?: any;
    }) {
      return client.put<User>('/users/profile', updates);
    },

    async getNotificationPreferences() {
      return client.get('/users/notification-preferences');
    },

    async updateNotificationPreferences(prefs: {
      email?: boolean;
      sms?: boolean;
      push?: boolean;
      telegram?: boolean;
      bookingReminders?: boolean;
      promotions?: boolean;
    }) {
      return client.put('/users/notification-preferences', prefs);
    },

    async uploadAvatar(file: File) {
      return client.upload<any>('/files/upload', file, 'avatar');
    },

    async uploadFile(file: File, purpose: string = 'portfolio') {
      return client.upload<any>('/files/upload', file, purpose);
    },
  };
}

export type UsersApi = ReturnType<typeof createUsersApi>;
