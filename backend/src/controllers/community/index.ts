import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse, calculatePaginationOffset, createPaginationMeta } from '@/utils/response';
import { ErrorCodes, AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

// Types
export interface CreatePostData {
  type: 'DISCUSSION' | 'SALE';
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

export interface CreateCommentData {
  content: string;
  parentId?: string;
}

export interface PostFilters {
  type?: 'DISCUSSION' | 'SALE';
  authorId?: string;
  search?: string;
}

export class CommunityController {
  /**
   * Get posts preview for landing page (public)
   * GET /community/posts/preview
   */
  static async getPostsPreview(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(parseInt(req.query.limit as string, 10) || 6, 12);

      const posts = await prisma.post.findMany({
        where: {
          isPublished: true,
          isDeleted: false,
        },
        select: {
          id: true,
          type: true,
          title: true,
          content: true,
          price: true,
          currency: true,
          likeCount: true,
          commentCount: true,
          createdAt: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [
          { isPinned: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

      // Create excerpts (first 150 characters of content)
      const postsPreview = posts.map(post => ({
        id: post.id,
        type: post.type,
        title: post.title,
        excerpt: post.content.substring(0, 150) + (post.content.length > 150 ? '...' : ''),
        price: post.price,
        currency: post.currency,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        createdAt: post.createdAt,
        author: {
          firstName: post.author.firstName,
          lastName: post.author.lastName.charAt(0) + '.',
        },
      }));

      res.json(createSuccessResponse({ posts: postsPreview }));
    } catch (error) {
      logger.error('Get posts preview error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get posts preview',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get posts with filters and pagination
   * GET /community/posts
   */
  static async getPosts(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const {
        type,
        search,
        authorId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const { skip, take } = calculatePaginationOffset(
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      // Build where clause
      const where: any = {
        isPublished: true,
        isDeleted: false,
      };

      if (type && ['DISCUSSION', 'SALE'].includes(type as string)) {
        where.type = type;
      }

      if (authorId) {
        where.authorId = authorId;
      }

      if (search) {
        where.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { content: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      // Build order by
      let orderBy: any = { createdAt: 'desc' };
      if (sortBy === 'likeCount') {
        orderBy = { likeCount: sortOrder };
      } else if (sortBy === 'commentCount') {
        orderBy = { commentCount: sortOrder };
      } else if (sortBy === 'viewCount') {
        orderBy = { viewCount: sortOrder };
      } else {
        orderBy = { [sortBy as string]: sortOrder };
      }

      // Get total count
      const totalCount = await prisma.post.count({ where });

      const showFullContent = !!req.user;

      // Get posts
      const posts = await prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
            },
          },
          likes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true },
          } : false,
        },
        orderBy: [
          { isPinned: 'desc' },
          orderBy,
        ],
        skip,
        take,
      });

      // Format response
      const formattedPosts = posts.map(post => ({
        id: post.id,
        authorId: post.authorId,
        author: {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          avatar: post.author.avatar,
          userType: post.author.userType,
        },
        type: post.type,
        title: post.title,
        content: showFullContent
          ? post.content
          : post.content.substring(0, 200) + (post.content.length > 200 ? '...' : ''),
        price: post.price,
        currency: post.currency,
        contactPhone: showFullContent ? post.contactPhone : null,
        contactEmail: showFullContent ? post.contactEmail : null,
        images: post.images ? JSON.parse(post.images) : [],
        viewCount: post.viewCount,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        isPinned: post.isPinned,
        isLiked: req.user ? (post.likes as any[]).length > 0 : false,
        isPreview: !showFullContent,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));

      const paginationMeta = createPaginationMeta(
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
        totalCount
      );

      res.json(createSuccessResponse({
        posts: formattedPosts,
        total: totalCount,
        pagination: paginationMeta,
      }));
    } catch (error) {
      logger.error('Get posts error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get posts',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get a single post by ID
   * GET /community/posts/:id
   */
  static async getPostById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const post = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
            },
          },
          likes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true },
          } : false,
        },
      });

      if (!post) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Increment view count
      await prisma.post.update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      });

      // For unauthenticated users, show preview only
      const showFullContent = !!req.user;

      const formattedPost = {
        id: post.id,
        authorId: post.authorId,
        author: {
          id: post.author.id,
          firstName: post.author.firstName,
          lastName: post.author.lastName,
          avatar: post.author.avatar,
          userType: post.author.userType,
        },
        type: post.type,
        title: post.title,
        content: showFullContent ? post.content : post.content.substring(0, 200) + '...',
        price: post.price,
        currency: post.currency,
        contactPhone: showFullContent ? post.contactPhone : null,
        contactEmail: showFullContent ? post.contactEmail : null,
        images: post.images ? JSON.parse(post.images) : [],
        viewCount: post.viewCount + 1,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        isPinned: post.isPinned,
        isLiked: req.user ? (post.likes as any[]).length > 0 : false,
        isPreview: !showFullContent,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      res.json(createSuccessResponse({ post: formattedPost }));
    } catch (error) {
      logger.error('Get post by ID error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get post',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Create a new post
   * POST /community/posts
   */
  static async createPost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        type,
        title,
        content,
        price,
        currency,
        contactPhone,
        contactEmail,
        images,
      } = req.body as CreatePostData;

      // Validate required fields
      if (!type || !['DISCUSSION', 'SALE'].includes(type)) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid post type. Must be DISCUSSION or SALE',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!title || title.trim().length < 3) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Title must be at least 3 characters',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (!content || content.trim().length < 10) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Content must be at least 10 characters',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // For SALE posts, validate price
      if (type === 'SALE' && price !== undefined && price < 0) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Price cannot be negative',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const post = await prisma.post.create({
        data: {
          authorId: req.user.id,
          type,
          title: title.trim(),
          content: content.trim(),
          price: type === 'SALE' ? price : null,
          currency: type === 'SALE' ? (currency || 'UAH') : null,
          contactPhone: type === 'SALE' ? contactPhone : null,
          contactEmail: type === 'SALE' ? contactEmail : null,
          images: images ? JSON.stringify(images) : null,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
            },
          },
        },
      });

      res.status(201).json(createSuccessResponse({
        post: {
          ...post,
          images: post.images ? JSON.parse(post.images) : [],
          isLiked: false,
        },
      }));
    } catch (error) {
      logger.error('Create post error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create post',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update a post
   * PUT /community/posts/:id
   */
  static async updatePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if post exists and user owns it
      const existingPost = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingPost) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingPost.authorId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this post',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const {
        title,
        content,
        price,
        currency,
        contactPhone,
        contactEmail,
        images,
        isPublished,
      } = req.body as UpdatePostData;

      // Build update data
      const updateData: any = {};
      if (title !== undefined) updateData.title = title.trim();
      if (content !== undefined) updateData.content = content.trim();
      if (price !== undefined) updateData.price = price;
      if (currency !== undefined) updateData.currency = currency;
      if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
      if (contactEmail !== undefined) updateData.contactEmail = contactEmail;
      if (images !== undefined) updateData.images = JSON.stringify(images);
      if (isPublished !== undefined) updateData.isPublished = isPublished;

      const updatedPost = await prisma.post.update({
        where: { id },
        data: updateData,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
              userType: true,
            },
          },
        },
      });

      res.json(createSuccessResponse({
        post: {
          ...updatedPost,
          images: updatedPost.images ? JSON.parse(updatedPost.images) : [],
        },
      }));
    } catch (error) {
      logger.error('Update post error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update post',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete a post (soft delete)
   * DELETE /community/posts/:id
   */
  static async deletePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if post exists and user owns it
      const existingPost = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingPost) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingPost.authorId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this post',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Soft delete
      await prisma.post.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });

      res.json(createSuccessResponse({ message: 'Post deleted successfully' }));
    } catch (error) {
      logger.error('Delete post error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete post',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Toggle post like
   * POST /community/posts/:id/like
   */
  static async togglePostLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if post exists
      const post = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!post) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if already liked
      const existingLike = await prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId: id,
            userId: req.user.id,
          },
        },
      });

      let liked: boolean;
      let newLikeCount: number;

      if (existingLike) {
        // Unlike
        await prisma.postLike.delete({
          where: { id: existingLike.id },
        });
        await prisma.post.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        });
        liked = false;
        newLikeCount = post.likeCount - 1;
      } else {
        // Like
        await prisma.postLike.create({
          data: {
            postId: id,
            userId: req.user.id,
          },
        });
        await prisma.post.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        });
        liked = true;
        newLikeCount = post.likeCount + 1;
      }

      res.json(createSuccessResponse({
        liked,
        likeCount: newLikeCount,
      }));
    } catch (error) {
      logger.error('Toggle post like error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to toggle like',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Get comments for a post
   * GET /community/posts/:id/comments
   */
  static async getComments(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 50 } = req.query;

      // Check if post exists
      const post = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!post) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { skip, take } = calculatePaginationOffset(
        parseInt(page as string, 10),
        parseInt(limit as string, 10)
      );

      // Get top-level comments with replies
      const comments = await prisma.comment.findMany({
        where: {
          postId: id,
          parentId: null, // Only top-level comments
          isDeleted: false,
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
          likes: req.user ? {
            where: { userId: req.user.id },
            select: { id: true },
          } : false,
          replies: {
            where: { isDeleted: false },
            include: {
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
              likes: req.user ? {
                where: { userId: req.user.id },
                select: { id: true },
              } : false,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      });

      // Get total count
      const totalCount = await prisma.comment.count({
        where: {
          postId: id,
          parentId: null,
          isDeleted: false,
        },
      });

      // Format comments
      const formatComment = (comment: any) => ({
        id: comment.id,
        postId: comment.postId,
        author: comment.author,
        content: comment.content,
        likeCount: comment.likeCount,
        isLiked: req.user ? comment.likes.length > 0 : false,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replies: comment.replies?.map(formatComment) || [],
      });

      const formattedComments = comments.map(formatComment);

      const paginationMeta = createPaginationMeta(
        parseInt(page as string, 10),
        parseInt(limit as string, 10),
        totalCount
      );

      res.json(createSuccessResponse({
        comments: formattedComments,
        total: totalCount,
        pagination: paginationMeta,
      }));
    } catch (error) {
      logger.error('Get comments error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to get comments',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Create a comment
   * POST /community/posts/:id/comments
   */
  static async createComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;
      const { content, parentId } = req.body as CreateCommentData;

      // Validate content
      if (!content || content.trim().length < 1) {
        res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Comment content is required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if post exists
      const post = await prisma.post.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!post) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Post not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // If parentId provided, check if parent comment exists
      if (parentId) {
        const parentComment = await prisma.comment.findFirst({
          where: {
            id: parentId,
            postId: id,
            isDeleted: false,
          },
        });

        if (!parentComment) {
          res.status(404).json(
            createErrorResponse(
              ErrorCodes.RESOURCE_NOT_FOUND,
              'Parent comment not found',
              req.headers['x-request-id'] as string
            )
          );
          return;
        }
      }

      // Create comment and update post comment count
      const [comment] = await prisma.$transaction([
        prisma.comment.create({
          data: {
            postId: id,
            authorId: req.user.id,
            parentId: parentId || null,
            content: content.trim(),
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        }),
        prisma.post.update({
          where: { id },
          data: { commentCount: { increment: 1 } },
        }),
      ]);

      res.status(201).json(createSuccessResponse({
        comment: {
          id: comment.id,
          postId: comment.postId,
          author: comment.author,
          content: comment.content,
          likeCount: 0,
          isLiked: false,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          replies: [],
        },
      }));
    } catch (error) {
      logger.error('Create comment error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to create comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Update a comment
   * PUT /community/comments/:id
   */
  static async updateComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;
      const { content } = req.body;

      // Check if comment exists and user owns it
      const existingComment = await prisma.comment.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingComment) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Comment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingComment.authorId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to update this comment',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const updatedComment = await prisma.comment.update({
        where: { id },
        data: { content: content.trim() },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      });

      res.json(createSuccessResponse({
        comment: {
          id: updatedComment.id,
          postId: updatedComment.postId,
          author: updatedComment.author,
          content: updatedComment.content,
          likeCount: updatedComment.likeCount,
          createdAt: updatedComment.createdAt,
          updatedAt: updatedComment.updatedAt,
        },
      }));
    } catch (error) {
      logger.error('Update comment error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to update comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Delete a comment (soft delete)
   * DELETE /community/comments/:id
   */
  static async deleteComment(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if comment exists and user owns it
      const existingComment = await prisma.comment.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!existingComment) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Comment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      if (existingComment.authorId !== req.user.id && req.user.userType !== 'ADMIN') {
        res.status(403).json(
          createErrorResponse(
            ErrorCodes.ACCESS_DENIED,
            'You do not have permission to delete this comment',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Soft delete and decrement post comment count
      await prisma.$transaction([
        prisma.comment.update({
          where: { id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        }),
        prisma.post.update({
          where: { id: existingComment.postId },
          data: { commentCount: { decrement: 1 } },
        }),
      ]);

      res.json(createSuccessResponse({ message: 'Comment deleted successfully' }));
    } catch (error) {
      logger.error('Delete comment error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to delete comment',
          req.headers['x-request-id'] as string
        )
      );
    }
  }

  /**
   * Toggle comment like
   * POST /community/comments/:id/like
   */
  static async toggleCommentLike(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json(
          createErrorResponse(
            ErrorCodes.AUTHENTICATION_REQUIRED,
            'Authentication required',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      const { id } = req.params;

      // Check if comment exists
      const comment = await prisma.comment.findFirst({
        where: {
          id,
          isDeleted: false,
        },
      });

      if (!comment) {
        res.status(404).json(
          createErrorResponse(
            ErrorCodes.RESOURCE_NOT_FOUND,
            'Comment not found',
            req.headers['x-request-id'] as string
          )
        );
        return;
      }

      // Check if already liked
      const existingLike = await prisma.commentLike.findUnique({
        where: {
          commentId_userId: {
            commentId: id,
            userId: req.user.id,
          },
        },
      });

      let liked: boolean;
      let newLikeCount: number;

      if (existingLike) {
        // Unlike
        await prisma.commentLike.delete({
          where: { id: existingLike.id },
        });
        await prisma.comment.update({
          where: { id },
          data: { likeCount: { decrement: 1 } },
        });
        liked = false;
        newLikeCount = comment.likeCount - 1;
      } else {
        // Like
        await prisma.commentLike.create({
          data: {
            commentId: id,
            userId: req.user.id,
          },
        });
        await prisma.comment.update({
          where: { id },
          data: { likeCount: { increment: 1 } },
        });
        liked = true;
        newLikeCount = comment.likeCount + 1;
      }

      res.json(createSuccessResponse({
        liked,
        likeCount: newLikeCount,
      }));
    } catch (error) {
      logger.error('Toggle comment like error:', error);
      res.status(500).json(
        createErrorResponse(
          ErrorCodes.INTERNAL_SERVER_ERROR,
          'Failed to toggle like',
          req.headers['x-request-id'] as string
        )
      );
    }
  }
}
