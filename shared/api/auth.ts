// ============================================================
// Auth API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { User, AuthTokens, LoginRequest, RegisterRequest, TelegramAuthRequest } from '../types';

export function createAuthApi(client: SharedApiClient) {
  return {
    async login(credentials: LoginRequest) {
      return client.post<{ user: User; tokens: AuthTokens }>('/auth-enhanced/login', credentials);
    },

    async register(userData: RegisterRequest) {
      return client.post<{ user: User; tokens?: AuthTokens; requiresVerification?: boolean; message?: string }>(
        '/auth-enhanced/register',
        userData,
      );
    },

    async telegramAuth(telegramData: TelegramAuthRequest | any) {
      return client.post<{ user: User; tokens: AuthTokens; isNewUser: boolean }>(
        '/auth-enhanced/telegram',
        telegramData,
      );
    },

    async googleAuth(credential: string, userType?: string) {
      const payload: any = { credential };
      if (userType) payload.userType = userType;
      return client.post<{ user: User; tokens: AuthTokens } | { requiresUserTypeSelection: true; googleData: any }>(
        '/auth-enhanced/google',
        payload,
      );
    },

    async refreshToken(refreshToken: string) {
      return client.post<{ accessToken: string; expiresIn: number }>('/auth-enhanced/refresh', {
        refreshToken,
      });
    },

    async logout(refreshToken: string) {
      return client.post('/auth-enhanced/logout', { refreshToken });
    },

    async getMe() {
      return client.get<{ user: User }>('/auth/me');
    },

    async forgotPassword(email: string) {
      return client.post<{ message: string }>('/auth/request-password-reset', { email });
    },

    async resetPassword(token: string, password: string) {
      return client.post<{ message: string }>('/auth/reset-password', { token, password });
    },

    async changePassword(currentPassword: string, newPassword: string) {
      return client.post<{ message: string }>('/auth/change-password', { currentPassword, newPassword });
    },

    async verifyEmail(token: string) {
      return client.post<{ message: string }>('/auth-enhanced/verify-email', { token });
    },

    async resendVerificationEmail() {
      return client.post<{ message: string }>('/auth/resend-verification');
    },
  };
}

export type AuthApi = ReturnType<typeof createAuthApi>;
