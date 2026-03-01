// ============================================================
// Community API Endpoints — Shared between frontend and mini-app
// ============================================================

import type { SharedApiClient } from './client';
import type { PaginatedResponse } from '../types';

export function createCommunityApi(client: SharedApiClient) {
  return {
    async getPosts(params?: { page?: number; limit?: number; type?: string; search?: string }) {
      return client.get<PaginatedResponse<any>>('/community/posts', { params });
    },

    async getPost(id: string) {
      return client.get(`/community/posts/${id}`);
    },

    async createPost(data: {
      title: string;
      content: string;
      type: string;
      price?: number;
      currency?: string;
      contactPhone?: string;
      contactEmail?: string;
      images?: string[];
    }) {
      return client.post('/community/posts', data);
    },

    async updatePost(id: string, data: {
      title?: string;
      content?: string;
      price?: number;
      currency?: string;
      contactPhone?: string;
      contactEmail?: string;
      images?: string[];
    }) {
      return client.put(`/community/posts/${id}`, data);
    },

    async deletePost(id: string) {
      return client.delete(`/community/posts/${id}`);
    },

    async likePost(postId: string) {
      return client.post(`/community/posts/${postId}/like`);
    },

    async unlikePost(postId: string) {
      return client.delete(`/community/posts/${postId}/like`);
    },

    async getComments(postId: string, params?: { page?: number; limit?: number }) {
      return client.get(`/community/posts/${postId}/comments`, { params });
    },

    async createComment(postId: string, data: { content: string; parentId?: string }) {
      return client.post(`/community/posts/${postId}/comments`, data);
    },

    async deleteComment(postId: string, commentId: string) {
      return client.delete(`/community/posts/${postId}/comments/${commentId}`);
    },

    async toggleCommentLike(postId: string, commentId: string) {
      return client.post(`/community/posts/${postId}/comments/${commentId}/like`);
    },
  };
}

export type CommunityApi = ReturnType<typeof createCommunityApi>;
