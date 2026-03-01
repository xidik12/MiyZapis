import { Router } from 'express';
import { authenticateToken, authenticateTokenOptional } from '@/middleware/auth/jwt';
import { CommunityController } from '@/controllers/community';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();

// ============================================
// PUBLIC ROUTES (optional auth for enhanced data)
// ============================================

// Get posts preview for landing page (public, cached 60s)
router.get('/posts/preview', cacheMiddleware(60, 'community-preview'), CommunityController.getPostsPreview);

// Get posts with filters (public, optional auth for like status)
router.get('/posts', authenticateTokenOptional, CommunityController.getPosts);

// Get single post (public, optional auth for full content)
router.get('/posts/:id', authenticateTokenOptional, CommunityController.getPostById);

// Get post comments (public, optional auth for like status)
router.get('/posts/:id/comments', authenticateTokenOptional, CommunityController.getComments);

// ============================================
// PROTECTED ROUTES (require authentication)
// ============================================

// Create post (any authenticated user)
router.post('/posts', authenticateToken, CommunityController.createPost);

// Update post (owner only)
router.put('/posts/:id', authenticateToken, CommunityController.updatePost);

// Delete post (owner only)
router.delete('/posts/:id', authenticateToken, CommunityController.deletePost);

// Toggle post like
router.post('/posts/:id/like', authenticateToken, CommunityController.togglePostLike);

// Create comment
router.post('/posts/:id/comments', authenticateToken, CommunityController.createComment);

// Update comment (owner only)
router.put('/comments/:id', authenticateToken, CommunityController.updateComment);

// Delete comment (owner only)
router.delete('/comments/:id', authenticateToken, CommunityController.deleteComment);

// Toggle comment like
router.post('/comments/:id/like', authenticateToken, CommunityController.toggleCommentLike);

export default router;
