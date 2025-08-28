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

// Simplified upload route that actually saves files
router.post('/upload-simple', authMiddleware, fileController.uploadMiddleware, async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }
    
    const file = files[0];
    const purpose = req.query.purpose || 'portfolio';
    
    // Use flat directory structure to avoid permission issues
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    
    // Save file with purpose prefix instead of subdirectory
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${purpose}-${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);
    
    // Create response that matches what frontend expects - using absolute URL
    const baseUrl = 'https://miyzapis-backend-production.up.railway.app';
    const fileUrl = `${baseUrl}/uploads/${filename}`;
    const mockResponse = [{
      id: 'simple-' + timestamp,
      filename: filename,
      url: fileUrl,
      path: fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user?.id,
      purpose: purpose,
      createdAt: new Date().toISOString()
    }];

    console.log('File saved:', filepath);
    console.log('File URL:', fileUrl);

    res.json({ 
      success: true, 
      data: mockResponse,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'File upload failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Simplified working upload endpoint (temporary fix)
router.post('/upload', authMiddleware, fileController.uploadMiddleware, async (req, res) => {
  try {
    console.log('📤 Upload request received:', {
      userId: req.user?.id,
      hasUser: !!req.user,
      purpose: req.query.purpose,
      filesCount: Array.isArray(req.files) ? req.files.length : 0
    });

    if (!req.user?.id) {
      console.log('❌ No user authenticated');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.log('❌ No files provided');
      return res.status(400).json({ success: false, error: 'No files provided' });
    }
    
    const file = files[0];
    const purpose = req.query.purpose || 'general';
    
    // Use flat directory structure to avoid permission issues  
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    
    // Ensure uploads directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('📁 Created uploads directory:', uploadsDir);
    }
    
    // Save file with purpose prefix instead of subdirectory
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${purpose}-${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    
    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);
    console.log('💾 File saved to disk:', filepath);
    
    // Create response that matches what frontend expects (array format)
    // Use absolute URL so images load from backend domain
    const baseUrl = 'https://miyzapis-backend-production.up.railway.app';
    const fileUrl = `${baseUrl}/uploads/${filename}`;
    
    const response = [{
      id: 'upload-' + timestamp,
      filename: filename,
      url: fileUrl,
      path: fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user.id,
      purpose: purpose,
      isPublic: true,
      isProcessed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];

    console.log('✅ File uploaded successfully:', {
      originalName: file.originalname,
      savedAs: filename,
      url: fileUrl,
      size: file.size,
      userId: req.user.id
    });

    res.json({ 
      success: true, 
      data: response,
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to upload files',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

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