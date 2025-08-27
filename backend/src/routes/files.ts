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
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const purposeDir = path.join(uploadsDir, purpose);
    
    if (!fs.existsSync(purposeDir)) {
      fs.mkdirSync(purposeDir, { recursive: true });
    }
    
    // Save file with unique name
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${purpose}-${timestamp}${ext}`;
    const filepath = path.join(purposeDir, filename);
    
    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);
    
    // Create response that matches what frontend expects
    const fileUrl = `/uploads/${purpose}/${filename}`;
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
    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ success: false, error: 'No files provided' });
    }
    
    const file = files[0];
    const purpose = req.query.purpose || 'general';
    
    // Create uploads directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadsDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    const purposeDir = path.join(uploadsDir, purpose);
    
    if (!fs.existsSync(purposeDir)) {
      fs.mkdirSync(purposeDir, { recursive: true });
    }
    
    // Save file with unique name
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    const filename = `${purpose}-${timestamp}${ext}`;
    const filepath = path.join(purposeDir, filename);
    
    // Write file to disk
    fs.writeFileSync(filepath, file.buffer);
    
    // Create response that matches what frontend expects (array format)
    // Use absolute URL so images load from backend domain - HARDCODED FOR TESTING
    const baseUrl = 'https://miyzapis-backend-production.up.railway.app';
    const fileUrl = `${baseUrl}/uploads/${purpose}/${filename}`;
    
    console.log('🔧 URL Generation Debug (HARDCODED):', {
      RAILWAY_PUBLIC_DOMAIN: process.env.RAILWAY_PUBLIC_DOMAIN,
      baseUrl,
      fileUrl,
      filename,
      purpose
    });
    const response = [{
      id: 'upload-' + timestamp,
      filename: filename,
      url: fileUrl,
      path: fileUrl,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.user?.id,
      purpose: purpose,
      isPublic: true,
      isProcessed: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }];

    console.log('File uploaded successfully:', {
      originalName: file.originalname,
      savedAs: filename,
      url: fileUrl,
      size: file.size
    });

    res.json({ 
      success: true, 
      data: response,
      message: 'Files uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
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