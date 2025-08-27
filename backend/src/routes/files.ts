import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticateToken as authMiddleware, optionalAuth as optionalAuthMiddleware } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { fileController } from '@/controllers/files';

const router = Router();

// Simple test endpoint to check if the route works
router.post('/test', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Test endpoint works', userId: req.user?.id });
});

// Simplified upload route for debugging
router.post('/upload-simple', authMiddleware, fileController.uploadMiddleware, (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }
    
    const file = files[0];
    // Create a simple mock response that matches what frontend expects
    const mockResponse = [{
      id: 'test-' + Date.now(),
      filename: file.originalname,
      url: `/uploads/portfolio/test-${Date.now()}-${file.originalname}`,
      path: `/uploads/portfolio/test-${Date.now()}-${file.originalname}`,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user?.id,
      purpose: req.query.purpose || 'portfolio',
      createdAt: new Date().toISOString()
    }];

    res.json({ 
      success: true, 
      data: mockResponse,
      message: 'Simple upload test successful'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Simple upload test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Upload files (requires authentication)
router.post(
  '/upload',
  authMiddleware,
  [
    query('purpose').isIn(['avatar', 'service_image', 'portfolio', 'message_attachment', 'general']),
    query('entityType').optional().isString(),
    query('entityId').optional().isString(),
    query('isPublic').optional().isBoolean()
  ],
  validateRequest,
  fileController.uploadMiddleware,
  fileController.uploadFiles
);

// Get file details (public files don't require auth)
router.get(
  '/:id',
  optionalAuthMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  fileController.getFile
);

// Get user's files (requires authentication)
router.get(
  '/',
  authMiddleware,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('purpose').optional().isString()
  ],
  validateRequest,
  fileController.getUserFiles
);

// Delete file (requires authentication and ownership)
router.delete(
  '/:id',
  authMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  fileController.deleteFile
);

export default router;