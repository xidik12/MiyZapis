import { Router } from 'express';
import { param, query } from 'express-validator';
import { authenticateToken as authMiddleware, optionalAuth as optionalAuthMiddleware } from '@/middleware/auth/jwt';
import { validateRequest } from '@/middleware/validation';
import { fileController } from '@/controllers/files';
import path from 'path';

const router = Router();

// Simple test endpoint to check if the route works
router.post('/test', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Test endpoint works', userId: req.user?.id });
});

// Railway environment detection debug endpoint (no auth needed)
router.get('/railway-env', (req, res) => {
  try {
    const isRailway = !!(
      process.env.RAILWAY_ENVIRONMENT || 
      process.env.RAILWAY_SERVICE_NAME || 
      process.env.RAILWAY_PROJECT_NAME
    );

    res.json({
      success: true,
      data: {
        isRailway: isRailway,
        uploadsDir: isRailway ? '/app/uploads' : (process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')),
        env: {
          RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT || null,
          RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME || null,
          NODE_ENV: process.env.NODE_ENV || null,
          PORT: process.env.PORT || null,
          UPLOAD_DIR: process.env.UPLOAD_DIR || null
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Debug endpoint failed'
    });
  }
});

// File system diagnostic endpoint (no auth needed)
router.get('/fs-test', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    
    const isRailway = !!(
      process.env.RAILWAY_ENVIRONMENT || 
      process.env.RAILWAY_SERVICE_NAME || 
      process.env.RAILWAY_PROJECT_NAME ||
      process.env.RAILWAY_SERVICE ||
      process.env.RAILWAY_PROJECT ||
      (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
    );
    
    // Railway permission fix: Try multiple upload directories in order of preference
    const uploadOptions = isRailway ? [
      '/app/uploads',  // Preferred: persistent volume
      '/tmp/uploads',  // Fallback 1: tmp directory
      './uploads',     // Fallback 2: local directory
      '/tmp'           // Last resort: directly in tmp
    ] : [
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      './uploads',
      '/tmp/uploads'
    ];
    
    const testResults = {
      isRailway,
      uploadOptions,
      directoryTests: [] as any[],
      workingDirectory: null as string | null,
      finalTest: {} as any
    };
    
    // Test each directory option
    for (const testDir of uploadOptions) {
      const dirTest = {
        directory: testDir,
        exists: false,
        canCreate: false,
        canWrite: false,
        canRead: false,
        canDelete: false,
        errors: [] as string[]
      };
      
      try {
        // Test 1: Check if directory exists
        try {
          await fs.access(testDir);
          dirTest.exists = true;
        } catch (error) {
          dirTest.errors.push(`Directory doesn't exist: ${error instanceof Error ? error.message : error}`);
        }
        
        // Test 2: Try to create directory
        try {
          await fs.mkdir(testDir, { recursive: true, mode: 0o755 });
          dirTest.canCreate = true;
        } catch (error) {
          dirTest.errors.push(`Can't create directory: ${error instanceof Error ? error.message : error}`);
        }
        
        // Test 3: Try to write a test file
        const testFilePath = path.join(testDir, 'fs-test-' + Date.now() + '.txt');
        try {
          await fs.writeFile(testFilePath, 'test content', { mode: 0o644 });
          dirTest.canWrite = true;
          
          // Test 4: Try to read the test file
          try {
            const content = await fs.readFile(testFilePath, 'utf8');
            dirTest.canRead = content === 'test content';
          } catch (error) {
            dirTest.errors.push(`Can't read file: ${error instanceof Error ? error.message : error}`);
          }
          
          // Test 5: Clean up test file
          try {
            await fs.unlink(testFilePath);
            dirTest.canDelete = true;
          } catch (error) {
            dirTest.errors.push(`Can't delete file: ${error instanceof Error ? error.message : error}`);
          }
          
          // If we can write, read, and delete, this directory works
          if (dirTest.canWrite && dirTest.canRead && dirTest.canDelete && !testResults.workingDirectory) {
            testResults.workingDirectory = testDir;
          }
          
        } catch (error) {
          dirTest.errors.push(`Can't write file: ${error instanceof Error ? error.message : error}`);
        }
      } catch (error) {
        dirTest.errors.push(`General error: ${error instanceof Error ? error.message : error}`);
      }
      
      testResults.directoryTests.push(dirTest);
    }
    
    // Final comprehensive test with working directory
    if (testResults.workingDirectory) {
      const finalTestFile = path.join(testResults.workingDirectory, 'final-test-' + Date.now() + '.txt');
      try {
        await fs.writeFile(finalTestFile, 'Final test content');
        const content = await fs.readFile(finalTestFile, 'utf8');
        await fs.unlink(finalTestFile);
        testResults.finalTest = {
          status: 'success',
          workingDirectory: testResults.workingDirectory,
          message: 'File operations successful'
        };
      } catch (error) {
        testResults.finalTest = {
          status: 'failed',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    } else {
      testResults.finalTest = {
        status: 'no_working_directory',
        message: 'No directory found with full read/write/delete permissions'
      };
    }
    
    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'File system test failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test notification endpoint
router.post('/test-notification', authMiddleware, async (req, res) => {
  try {
    const { NotificationService } = require('@/services/notification');
    const { prisma } = require('@/config/database');
    
    const notificationService = new NotificationService(prisma);
    
    await notificationService.sendNotification(req.user?.id, {
      type: 'TEST_NOTIFICATION',
      title: 'Test Notification',
      message: 'This is a test notification to debug the system.',
      emailTemplate: 'test',
      priority: 'NORMAL'
    });
    
    res.json({ 
      success: true, 
      message: 'Test notification sent',
      userId: req.user?.id
    });
  } catch (error) {
    console.error('Test notification error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send test notification',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Test notifications fetch endpoint
router.get('/test-notifications', authMiddleware, async (req, res) => {
  try {
    const { NotificationService } = require('@/services/notification');
    const { prisma } = require('@/config/database');
    
    const notificationService = new NotificationService(prisma);
    
    const result = await notificationService.getUserNotifications(req.user?.id, { limit: 10 });
    
    res.json({ 
      success: true, 
      message: 'Notifications fetched successfully',
      data: result,
      userId: req.user?.id
    });
  } catch (error) {
    console.error('Test notifications fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications',
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Database test endpoint
router.get('/test-db', authMiddleware, async (req, res) => {
  try {
    const { prisma } = require('@/config/database');
    
    // Test database connection
    const userCount = await prisma.user.count();
    
    // Try to access notification table
    let notificationCount = 0;
    let notificationError = null;
    try {
      notificationCount = await prisma.notification.count();
    } catch (error) {
      notificationError = error instanceof Error ? error.message : String(error);
    }
    
    res.json({ 
      success: true, 
      message: 'Database connection test',
      data: {
        userCount,
        notificationCount,
        notificationError,
        hasNotificationTable: !notificationError
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Robust file upload that works on Railway
router.post('/upload-robust', authMiddleware, fileController.uploadMiddleware, async (req, res) => {
  try {
    console.log('🔍 Upload request details:', {
      userId: req.user?.id,
      purpose: req.query.purpose,
      filesCount: Array.isArray(req.files) ? req.files.length : 0,
      hasFiles: !!req.files
    });

    if (!req.user?.id) {
      console.error('❌ No authenticated user');
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      console.error('❌ No files provided');
      return res.status(400).json({ success: false, error: 'No files provided' });
    }
    
    const file = files[0];
    const purpose = (req.query.purpose as string) || 'general';
    const userId = req.user.id;
    
    console.log('📁 Processing file:', {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      purpose
    });

    // Validate file type
    const allowedMimeTypes = {
      avatar: ['image/jpeg', 'image/png', 'image/webp'],
      portfolio: ['image/jpeg', 'image/png', 'image/webp'],
      service: ['image/jpeg', 'image/png', 'image/webp'],
      document: ['application/pdf', 'image/jpeg', 'image/png']
    };

    const allowedTypes = allowedMimeTypes[purpose as keyof typeof allowedMimeTypes] || allowedMimeTypes.portfolio;
    if (!allowedTypes.includes(file.mimetype)) {
      console.error('❌ Invalid file type:', file.mimetype);
      return res.status(400).json({ 
        success: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      });
    }

    // Use Railway-compatible upload directory with fallback options
    const fs = require('fs');
    const path = require('path');
    
    // Railway sets various environment variables we can check
    const railwayIndicators = {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
      RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
      RAILWAY_SERVICE: process.env.RAILWAY_SERVICE,
      RAILWAY_PROJECT: process.env.RAILWAY_PROJECT,
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      // Railway typically sets PORT and other indicators
    };
    
    console.log('🔍 Environment detection:', railwayIndicators);
    
    // More robust Railway detection
    const isRailway = !!(
      process.env.RAILWAY_ENVIRONMENT || 
      process.env.RAILWAY_SERVICE_NAME || 
      process.env.RAILWAY_PROJECT_NAME ||
      process.env.RAILWAY_SERVICE ||
      process.env.RAILWAY_PROJECT ||
      (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
    );
    
    // Railway permission fix: Try multiple upload directories in order of preference
    const uploadOptions = isRailway ? [
      '/app/uploads',  // Preferred: persistent volume
      '/tmp/uploads',  // Fallback 1: tmp directory
      './uploads',     // Fallback 2: local directory
      '/tmp'           // Last resort: directly in tmp
    ] : [
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      './uploads',
      '/tmp/uploads'
    ];
    
    console.log('🏗️ Railway detection result:', {
      isRailway,
      uploadOptions,
      cwd: process.cwd()
    });
    
    let uploadsDir = null;
    
    // Find a working uploads directory
    for (const testDir of uploadOptions) {
      try {
        console.log(`🔍 Testing upload directory: ${testDir}`);
        
        // Try to create directory if it doesn't exist
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true, mode: 0o755 });
        }
        
        // Test write permissions
        const testFile = path.join(testDir, 'upload-test-' + Date.now() + '.txt');
        fs.writeFileSync(testFile, 'test', { mode: 0o644 });
        fs.unlinkSync(testFile);
        
        uploadsDir = testDir;
        console.log('✅ Found working upload directory:', uploadsDir);
        break;
      } catch (error) {
        console.warn(`⚠️ Upload directory ${testDir} failed test:`, error.message);
        continue;
      }
    }
    
    if (!uploadsDir) {
      console.error('❌ No writable upload directory found');
      return res.status(500).json({ 
        success: false, 
        error: 'No writable upload directory available',
        tested: uploadOptions
      });
    }
    
    console.log('📂 Using upload directory:', uploadsDir);
    
    // Create unique filename with flat structure
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${purpose}_${userId}_${timestamp}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    
    console.log('💾 Saving file to:', filepath);
    
    // Save file to disk
    try {
      fs.writeFileSync(filepath, file.buffer);
      console.log('✅ File saved successfully');
    } catch (saveError) {
      console.error('❌ Failed to save file:', saveError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to save file to disk' 
      });
    }
    
    // Generate file URL
    const baseUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : 'https://miyzapis-backend-production.up.railway.app';
    const fileUrl = `${baseUrl}/uploads/${filename}`;
    
    // Create database record
    let fileRecord;
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      fileRecord = await prisma.file.create({
        data: {
          filename: filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          path: filepath,
          url: fileUrl,
          uploadedBy: userId,
          purpose: purpose,
          isPublic: true,
          isProcessed: true
        }
      });
      
      await prisma.$disconnect();
      console.log('✅ Database record created:', fileRecord.id);
    } catch (dbError) {
      console.error('⚠️ Database record creation failed (file still uploaded):', dbError);
      // Continue without database record - file is still accessible
    }

    const response = [{
      id: fileRecord?.id || `temp_${timestamp}`,
      filename: filename,
      url: fileUrl,
      path: filepath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      purpose: purpose,
      createdAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString()
    }];

    console.log('📤 Upload successful:', { filename, url: fileUrl });

    res.json({ 
      success: true, 
      data: response,
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('💥 Upload error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'File upload failed',
      details: error instanceof Error ? error.message : String(error)
    });
  }
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
    // Use persistent volume /app/uploads on Railway
    const railwayIndicators = {
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
      RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
      RAILWAY_SERVICE: process.env.RAILWAY_SERVICE,
      RAILWAY_PROJECT: process.env.RAILWAY_PROJECT
    };
    const isRailwayEnv = !!(railwayIndicators.RAILWAY_ENVIRONMENT || railwayIndicators.RAILWAY_SERVICE_NAME || railwayIndicators.RAILWAY_PROJECT_NAME || railwayIndicators.RAILWAY_SERVICE || railwayIndicators.RAILWAY_PROJECT || (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY));
    
    // Railway permission fix: Try multiple upload directories in order of preference
    const uploadOptions = isRailwayEnv ? [
      '/app/uploads',  // Preferred: persistent volume
      '/tmp/uploads',  // Fallback 1: tmp directory
      './uploads',     // Fallback 2: local directory
      '/tmp'           // Last resort: directly in tmp
    ] : [
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      './uploads',
      '/tmp/uploads'
    ];
    
    let uploadsDir = null;
    
    // Find a working uploads directory
    for (const testDir of uploadOptions) {
      try {
        // Try to create directory if it doesn't exist
        if (!fs.existsSync(testDir)) {
          fs.mkdirSync(testDir, { recursive: true, mode: 0o755 });
        }
        
        // Test write permissions
        const testFile = path.join(testDir, 'simple-upload-test-' + Date.now() + '.txt');
        fs.writeFileSync(testFile, 'test', { mode: 0o644 });
        fs.unlinkSync(testFile);
        
        uploadsDir = testDir;
        console.log('✅ Simple upload found working directory:', uploadsDir);
        break;
      } catch (error) {
        console.warn(`⚠️ Simple upload directory ${testDir} failed test:`, error.message);
        continue;
      }
    }
    
    if (!uploadsDir) {
      console.error('❌ No writable upload directory found for simple upload');
      return res.status(500).json({ 
        success: false, 
        error: 'No writable upload directory available',
        tested: uploadOptions
      });
    }
    
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
      path: filepath,
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

// Main upload endpoint using proper FileController
router.post('/upload', authMiddleware, fileController.uploadMiddleware, fileController.uploadFiles);

// Serve static uploaded files
router.get('/uploads/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const path = require('path');
    const fs = require('fs');
    
    // Use same upload directory logic as upload with fallback
    const isRailwayServe = !!(
      process.env.RAILWAY_ENVIRONMENT || 
      process.env.RAILWAY_SERVICE_NAME || 
      process.env.RAILWAY_PROJECT_NAME ||
      process.env.RAILWAY_SERVICE ||
      process.env.RAILWAY_PROJECT ||
      (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
    );
    
    // Try multiple directories to find the file
    const uploadOptions = isRailwayServe ? [
      '/app/uploads',
      '/tmp/uploads',
      './uploads',
      '/tmp'
    ] : [
      process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'),
      './uploads',
      '/tmp/uploads'
    ];
    
    let filepath = null;
    
    // Find the file in one of the upload directories
    for (const testDir of uploadOptions) {
      const testPath = path.join(testDir, filename);
      if (fs.existsSync(testPath)) {
        filepath = testPath;
        break;
      }
    }
    
    if (!filepath) {
      return res.status(404).json({ 
        success: false, 
        error: 'File not found',
        searched: uploadOptions.map(dir => path.join(dir, filename))
      });
    }
    
    res.sendFile(filepath);
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ success: false, error: 'Failed to serve file' });
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