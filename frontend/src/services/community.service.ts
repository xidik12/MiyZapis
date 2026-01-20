import { apiClient } from './api';

// Types
export const POST_TYPES = ['DISCUSSION', 'SALE'] as const;
export type PostType = typeof POST_TYPES[number];

export interface PostAuthor {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  userType?: string;
}

export interface Post {
  id: string;
  authorId: string;
  author: PostAuthor;
  type: PostType;
  title: string;
  content: string;
  price?: number | null;
  currency?: string | null;
  contactPhone?: string | null;
  contactEmail?: string | null;
  images?: string[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  isPinned?: boolean;
  isLiked?: boolean;
  isPreview?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostPreview {
  id: string;
  type: PostType;
  title: string;
  excerpt: string;
  price?: number | null;
  currency?: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
  };
}

export interface Comment {
  id: string;
  postId: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  content: string;
  likeCount: number;
  isLiked?: boolean;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostData {
  type: PostType;
  title: string;
  content: string;
  price?: number;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[];
}

export interface UpdatePostData {
  title?: string;
  content?: string;
  price?: number;
  currency?: string;
  contactPhone?: string;
  contactEmail?: string;
  images?: string[];
  isPublished?: boolean;
}

export interface PostFilters {
  type?: PostType;
  authorId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'likeCount' | 'commentCount' | 'viewCount';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface GetPostsResponse {
  posts: Post[];
  total: number;
  pagination: PaginationMeta;
}

export interface GetCommentsResponse {
  comments: Comment[];
  total: number;
  pagination: PaginationMeta;
}

export interface LikeResponse {
  liked: boolean;
  likeCount: number;
}

// Community Service
class CommunityService {
  private baseUrl = '/community';

  // ============================================
  // Posts
  // ============================================

  /**
   * Get posts preview for landing page (public)
   */
  async getPostsPreview(limit?: number): Promise<PostPreview[]> {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get<{ posts: PostPreview[] }>(
      `${this.baseUrl}/posts/preview${params}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load community previews');
    }
    return response.data.posts;
  }

  /**
   * Get posts with filters and pagination
   */
  async getPosts(filters?: PostFilters): Promise<GetPostsResponse> {
    const params = new URLSearchParams();

    if (filters?.type) params.append('type', filters.type);
    if (filters?.authorId) params.append('authorId', filters.authorId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl}/posts?${queryString}`
      : `${this.baseUrl}/posts`;

    const response = await apiClient.get<GetPostsResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load community posts');
    }
    return response.data;
  }

  /**
   * Get a single post by ID
   */
  async getPostById(id: string): Promise<Post> {
    const response = await apiClient.get<{ post: Post }>(`${this.baseUrl}/posts/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load post');
    }
    return response.data.post;
  }

  /**
   * Create a new post
   */
  async createPost(data: CreatePostData): Promise<Post> {
    const response = await apiClient.post<{ post: Post }>(`${this.baseUrl}/posts`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create post');
    }
    return response.data.post;
  }

  /**
   * Update a post
   */
  async updatePost(id: string, data: UpdatePostData): Promise<Post> {
    const response = await apiClient.put<{ post: Post }>(`${this.baseUrl}/posts/${id}`, data);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update post');
    }
    return response.data.post;
  }

  /**
   * Delete a post
   */
  async deletePost(id: string): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/posts/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete post');
    }
  }

  /**
   * Toggle post like
   */
  async togglePostLike(id: string): Promise<LikeResponse> {
    const response = await apiClient.post<LikeResponse>(`${this.baseUrl}/posts/${id}/like`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to toggle like');
    }
    return response.data;
  }

  // ============================================
  // Comments
  // ============================================

  /**
   * Get comments for a post
   */
  async getComments(postId: string, page?: number, limit?: number): Promise<GetCommentsResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (limit) params.append('limit', limit.toString());

    const queryString = params.toString();
    const url = queryString
      ? `${this.baseUrl}/posts/${postId}/comments?${queryString}`
      : `${this.baseUrl}/posts/${postId}/comments`;

    const response = await apiClient.get<GetCommentsResponse>(url);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to load comments');
    }
    return response.data;
  }

  /**
   * Create a comment
   */
  async createComment(postId: string, content: string, parentId?: string): Promise<Comment> {
    const response = await apiClient.post<{ comment: Comment }>(
      `${this.baseUrl}/posts/${postId}/comments`,
      { content, parentId }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to create comment');
    }
    return response.data.comment;
  }

  /**
   * Update a comment
   */
  async updateComment(id: string, content: string): Promise<Comment> {
    const response = await apiClient.put<{ comment: Comment }>(
      `${this.baseUrl}/comments/${id}`,
      { content }
    );
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to update comment');
    }
    return response.data.comment;
  }

  /**
   * Delete a comment
   */
  async deleteComment(id: string): Promise<void> {
    const response = await apiClient.delete(`${this.baseUrl}/comments/${id}`);
    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to delete comment');
    }
  }

  /**
   * Toggle comment like
   */
  async toggleCommentLike(id: string): Promise<LikeResponse> {
    const response = await apiClient.post<LikeResponse>(`${this.baseUrl}/comments/${id}/like`);
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to toggle comment like');
    }
    return response.data;
  }
}

// Export singleton instance
export const communityService = new CommunityService();

export default communityService;
