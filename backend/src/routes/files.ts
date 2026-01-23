import { Router, Request } from 'express';
import { param, query } from 'express-validator';
import { authenticateToken as authMiddleware, optionalAuth as optionalAuthMiddleware } from '@/middleware/auth/jwt';
import { uploadRateLimit } from '@/middleware/security'; // ✅ SECURITY FIX: Add upload rate limiting
import { validateRequest } from '@/middleware/validation';
import { fileController } from '@/controllers/files';
import * as s3UploadController from '@/controllers/files/s3-upload.controller';
import { FileUploadService } from '@/services/fileUpload/index';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';
import sharp from 'sharp';
import crypto from 'crypto';
import { initializeS3Service, getS3Service } from '@/services/s3.service';
import path from 'path';

const router = Router();
const isRailwayEnv = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_SERVICE_NAME ||
  process.env.RAILWAY_PROJECT_NAME ||
  process.env.RAILWAY_SERVICE ||
  process.env.RAILWAY_PROJECT
);

// Check if AWS SDK is available
let AWS: any = null;
let awsSdkAvailable = false;
try {
  AWS = require('aws-sdk');
  awsSdkAvailable = true;
} catch (error) {
  console.log('⚠️ AWS SDK not available for file uploads');
}

const enableS3Storage = process.env.ENABLE_S3_STORAGE === 'true';
const hasS3Config = !!(
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET
);
const explicitLocalStorage = process.env.FORCE_LOCAL_STORAGE === 'true' ||
  process.env.FILE_STORAGE === 'local' ||
  process.env.USE_LOCAL_STORAGE === 'true';
const forceLocalStorage = explicitLocalStorage || (!enableS3Storage && isRailwayEnv);
// CRITICAL FIX: Only use S3 if AWS SDK is available
const useS3Storage = enableS3Storage && !explicitLocalStorage && awsSdkAvailable && hasS3Config;

if (useS3Storage) {
  console.log('🌅 S3 storage enabled - adding S3 upload routes');
} else {
  if (enableS3Storage && !awsSdkAvailable) {
    console.log('⚠️ S3 enabled but AWS SDK not available - falling back to local storage');
  } else {
    console.log('📁 Using local file storage');
  }
}
console.log('File storage selection', {
  useS3Storage,
  enableS3Storage,
  awsSdkAvailable,
  hasS3Config,
  forceLocalStorage,
  explicitLocalStorage,
  isRailwayEnv,
  uploadDir: process.env.UPLOAD_DIR || null
});

const getPublicBaseUrl = (req: Request): string => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return host ? `${protocol}://${host}` : '';
};

const detectRailwayVolumes = (): string[] => {
  const volumes: string[] = [];
  try {
    const fs = require('fs');
    const basePath = '/var/lib/containers/railwayapp/bind-mounts';
    if (fs.existsSync(basePath)) {
      const entries = fs.readdirSync(basePath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          volumes.push(path.join(basePath, entry.name));
        }
      }
    }
  } catch (error) {
    logger.warn('Volume detection failed', { error: error instanceof Error ? error.message : String(error) });
  }
  return volumes;
};

const getPreferredRailwayUploadDir = (): string => {
  return (
    process.env.RAILWAY_VOLUME_MOUNT_PATH ||
    process.env.UPLOAD_DIR ||
    process.env.UPLOAD_PATH ||
    '/app/uploads'
  );
};

const buildUploadOptions = (isRailway: boolean): string[] => {
  const volumePaths = detectRailwayVolumes();
  const preferredRailwayDir = getPreferredRailwayUploadDir();
  const options = isRailway
    ? [
        preferredRailwayDir,
        '/app/uploads',
        ...volumePaths.map(p => path.join(p, 'uploads')),
        ...volumePaths,
        '/tmp/uploads',
        './uploads',
        '/tmp'
      ]
    : [
        process.env.UPLOAD_DIR || process.env.UPLOAD_PATH || path.join(process.cwd(), 'uploads'),
        './uploads',
        '/tmp/uploads'
      ];

  return Array.from(new Set(options.filter(Boolean) as string[]));
};

const commonImageTypes = [
  'image/jpeg',
  'image/jpg',
  'image/pjpeg',
  'image/png',
  'image/x-png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'image/tiff',
  'image/tif',
  'image/heic',
  'image/heic-sequence',
  'image/heif',
  'image/heif-sequence',
  'image/avif',
  'image/avif-sequence'
];

const getFileTypeFromBuffer = async (buffer: Buffer) => {
  try {
    const fileTypeModule = await import('file-type');
    const fileTypeFromBuffer =
      (fileTypeModule as any).fileTypeFromBuffer ||
      (fileTypeModule as any).default?.fileTypeFromBuffer;
    if (typeof fileTypeFromBuffer !== 'function') {
      return null;
    }
    return await fileTypeFromBuffer(buffer);
  } catch (error) {
    logger.warn('file-type not available, skipping magic bytes detection', {
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
};

// Simple test endpoint to check if the route works
router.post('/test', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Test endpoint works', userId: req.user?.id });
});

// Test auth token generation endpoint (for testing only)
router.post('/test-auth', async (req, res) => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const jwt = require('jsonwebtoken');
    
    // Create or find test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'filetest@example.com' }
    });
    
    if (!testUser) {
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('TestPassword123!', 10);
      
      testUser = await prisma.user.create({
        data: {
          email: 'filetest@example.com',
          password: hashedPassword,
          firstName: 'File',
          lastName: 'Test',
          userType: 'CUSTOMER',
          isEmailVerified: true,
          isActive: true
        }
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        userId: testUser.id, 
        email: testUser.email,
        userType: testUser.userType
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );
    
    await prisma.$disconnect();
    
    res.json({
      success: true,
      data: {
        user: {
          id: testUser.id,
          email: testUser.email,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        },
        token,
        message: 'Test user created/found and token generated'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create test auth token',
      details: error instanceof Error ? error.message : String(error)
    });
  }
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
        uploadsDir: buildUploadOptions(isRailway)[0],
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

// Storage configuration diagnostic endpoint (no auth needed)
router.get('/storage-config', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        storageType: useS3Storage ? 'S3' : 'LOCAL',
        configuration: {
          useS3Storage,
          enableS3Storage,
          awsSdkAvailable,
          hasS3Config,
          forceLocalStorage,
          explicitLocalStorage,
          isRailwayEnv
        },
        environmentVariables: {
          ENABLE_S3_STORAGE: process.env.ENABLE_S3_STORAGE || 'NOT SET',
          FORCE_LOCAL_STORAGE: process.env.FORCE_LOCAL_STORAGE || 'NOT SET',
          USE_LOCAL_STORAGE: process.env.USE_LOCAL_STORAGE || 'NOT SET',
          FILE_STORAGE: process.env.FILE_STORAGE || 'NOT SET',
          AWS_S3_BUCKET: process.env.AWS_S3_BUCKET ? '✅ SET' : '❌ NOT SET',
          AWS_REGION: process.env.AWS_REGION || 'NOT SET',
          AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? '✅ SET' : '❌ NOT SET',
          AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? '✅ SET' : '❌ NOT SET'
        },
        recommendation: useS3Storage
          ? '✅ S3 storage is enabled and configured correctly'
          : '⚠️ Local storage is being used. For Railway, please enable S3 storage by setting ENABLE_S3_STORAGE=true and removing FORCE_LOCAL_STORAGE/USE_LOCAL_STORAGE/FILE_STORAGE=local variables'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Storage config diagnostic failed'
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
    const uploadOptions = buildUploadOptions(isRailway);
    
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
router.post('/upload-robust', authMiddleware, uploadRateLimit, fileController.uploadMiddleware, async (req, res) => {
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
      avatar: commonImageTypes,
      portfolio: commonImageTypes,
      service: commonImageTypes,
      document: [...commonImageTypes, 'application/pdf']
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
    const uploadOptions = buildUploadOptions(isRailway);
    
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
    const baseUrl = getPublicBaseUrl(req);
    const fileUrl = `${baseUrl || ''}/uploads/${filename}`;
    
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
router.post('/upload-simple', authMiddleware, uploadRateLimit, fileController.uploadMiddleware, async (req, res) => {
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
    const uploadOptions = buildUploadOptions(isRailwayEnv);
    
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
    const baseUrl = getPublicBaseUrl(req);
    const fileUrl = `${baseUrl || ''}/uploads/${filename}`;
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

// S3 Cloud Storage endpoints (when enabled)
if (useS3Storage) {
  
  // S3 file upload endpoint
  router.post('/upload-s3', authMiddleware, uploadRateLimit, s3UploadController.uploadMiddleware, s3UploadController.uploadFiles);

  // S3 presigned URL endpoint
  router.post('/presigned-upload', authMiddleware, uploadRateLimit, s3UploadController.getPresignedUploadUrl);

  // S3 confirm upload endpoint (after presigned upload)
  router.post('/confirm-upload', authMiddleware, uploadRateLimit, s3UploadController.confirmUpload);

  // S3 file deletion endpoint
  router.delete('/s3/:id', authMiddleware, s3UploadController.deleteFile);

  // Use S3 upload as the main upload endpoint when S3 is enabled
  router.post('/upload', authMiddleware, uploadRateLimit, s3UploadController.uploadMiddleware, s3UploadController.uploadFiles);
} else {
  // Main upload endpoint using proper FileController (local storage)
  router.post('/upload', authMiddleware, uploadRateLimit, fileController.uploadMiddleware, fileController.uploadFiles);
}

// Proxy S3 images to handle CORS issues
router.get('/s3-proxy/*', async (req, res) => {
  try {
    const rawPath = req.params[0]; // Gets everything after /s3-proxy/
    if (!rawPath) {
      return res.status(400).json({
        success: false,
        error: 'Missing S3 object key'
      });
    }

    const s3Path = rawPath.replace(/^\/+/, '');
    const bucketParam = typeof req.query.bucket === 'string' ? req.query.bucket : undefined;
    const primaryBucket = process.env.AWS_S3_BUCKET || '';
    const legacyBucket = process.env.AWS_S3_LEGACY_BUCKET || '';
    const requestedBucket = bucketParam || primaryBucket || legacyBucket;

    console.log(`🔄 Proxying S3 request: ${s3Path}`, {
      bucket: requestedBucket || 'unknown'
    });

    const isLegacyBucket = !!(legacyBucket && requestedBucket === legacyBucket);
    const region = (isLegacyBucket ? process.env.AWS_S3_LEGACY_REGION : process.env.AWS_REGION) || 'us-east-1';
    const accessKeyId =
      (isLegacyBucket ? process.env.AWS_S3_LEGACY_ACCESS_KEY_ID : process.env.AWS_ACCESS_KEY_ID) ||
      process.env.AWS_ACCESS_KEY_ID ||
      '';
    const secretAccessKey =
      (isLegacyBucket ? process.env.AWS_S3_LEGACY_SECRET_ACCESS_KEY : process.env.AWS_SECRET_ACCESS_KEY) ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      '';
    const publicUrl =
      (isLegacyBucket ? process.env.AWS_S3_LEGACY_URL : process.env.AWS_S3_URL) ||
      (requestedBucket ? `https://${requestedBucket}.s3.${region}.amazonaws.com` : '');

    const existingService = requestedBucket ? getS3Service(requestedBucket) : getS3Service();
    const s3Service = existingService || (() => {
      if (!accessKeyId || !secretAccessKey || !requestedBucket) {
        return null;
      }
      try {
        return initializeS3Service({
          region,
          accessKeyId,
          secretAccessKey,
          bucketName: requestedBucket,
          publicUrl: publicUrl || undefined
        });
      } catch (initError) {
        logger.warn('S3 proxy could not initialize service', {
          error: initError instanceof Error ? initError.message : String(initError)
        });
        return null;
      }
    })();

    const localFallbackEnabled = process.env.ENABLE_LOCAL_FALLBACK === 'true';
    if (localFallbackEnabled) {
      const fs = require('fs');
      const baseDir =
        process.env.RAILWAY_VOLUME_MOUNT_PATH ||
        process.env.UPLOAD_DIR ||
        process.env.UPLOAD_PATH ||
        '/app/uploads';
      const resolvedBase = path.resolve(baseDir);
      const resolvedPath = path.resolve(baseDir, s3Path);
      if (resolvedPath.startsWith(resolvedBase) && fs.existsSync(resolvedPath)) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.sendFile(resolvedPath);
      }
    }

    if (s3Service) {
      try {
        const signedUrl = await s3Service.getPresignedDownloadUrl(s3Path, 300);
        res.setHeader('Cache-Control', 'private, max-age=300');
        return res.redirect(signedUrl);
      } catch (signError) {
        logger.warn('S3 proxy presigned URL failed, falling back to public fetch', {
          error: signError instanceof Error ? signError.message : String(signError)
        });
      }
    }

    const baseUrl = (publicUrl || '').replace(/\/+$/, '');
    if (!baseUrl) {
      return res.status(500).json({
        success: false,
        error: 'S3 proxy not configured'
      });
    }
    const s3Url = `${baseUrl}/${s3Path}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(s3Url, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      console.log(`❌ S3 proxy failed: ${response.status} for ${s3Url}`);
      return res.status(response.status).json({
        success: false,
        error: 'S3 file not found',
        s3Status: response.status
      });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const contentLength = response.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return res.status(504).json({
        success: false,
        error: 'S3 proxy timeout'
      });
    }
    console.error('❌ S3 proxy error:', error);
    res.status(500).json({
      success: false,
      error: 'S3 proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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
    const uploadOptions = buildUploadOptions(isRailwayServe);
    
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
      // For old files that don't exist locally, check if they might be in S3
      // and provide a helpful error message
      console.log(`File not found locally: ${filename}. This file may have been migrated to S3.`);
      
      return res.status(404).json({ 
        success: false, 
        error: 'File not found - may have been migrated to cloud storage',
        filename: filename,
        suggestion: 'This file may be available in S3 cloud storage. Please re-upload if needed.',
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

// Save external image (for avatar migration)
router.post('/save-external', authMiddleware, async (req, res) => {
  try {
    const { imageUrl, purpose = 'avatar' } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!imageUrl) {
      return res.status(400).json({ success: false, error: 'Image URL is required' });
    }

    const decodeHtmlEntities = (value: string): string =>
      value
        .replace(/&#x2F;/gi, '/')
        .replace(/&amp;/gi, '&')
        .replace(/&quot;/gi, '"')
        .replace(/&#x27;/gi, "'")
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>');

    const normalizedUrl = decodeHtmlEntities(String(imageUrl).trim());

    if (!/^https?:\/\//i.test(normalizedUrl)) {
      return res.status(400).json({ success: false, error: 'Only http(s) image URLs are supported' });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid image URL' });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    ) {
      return res.status(400).json({ success: false, error: 'Invalid image URL host' });
    }

    const ipv4Match = hostname.match(/^(\d{1,3}\.){3}\d{1,3}$/);
    if (ipv4Match) {
      const parts = hostname.split('.').map(Number);
      const isPrivate =
        parts[0] === 10 ||
        parts[0] === 127 ||
        (parts[0] === 169 && parts[1] === 254) ||
        (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
        (parts[0] === 192 && parts[1] === 168);
      if (isPrivate) {
        return res.status(400).json({ success: false, error: 'Invalid image URL host' });
      }
    }

    const response = await fetch(normalizedUrl, { redirect: 'follow' });

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        error: `Failed to fetch image (${response.status})`
      });
    }

    const maxSizeByPurpose: Record<string, number> = {
      avatar: 5 * 1024 * 1024,
      portfolio: 10 * 1024 * 1024,
      service_image: 10 * 1024 * 1024
    };
    const maxSize = maxSizeByPurpose[purpose] || 10 * 1024 * 1024;

    const contentLength = response.headers.get('content-length');
    if (contentLength && Number(contentLength) > maxSize) {
      return res.status(413).json({ success: false, error: 'Image too large' });
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length > maxSize) {
      return res.status(413).json({ success: false, error: 'Image too large' });
    }

    const detectedType = await getFileTypeFromBuffer(buffer);
    const headerType = response.headers.get('content-type') || '';
    const rawMimeType = detectedType?.mime || headerType || 'image/jpeg';
    const mimeType = rawMimeType.split(';')[0].trim();

    if (!mimeType.startsWith('image/')) {
      return res.status(400).json({ success: false, error: 'URL must point to an image' });
    }

    const originalName = path.basename(parsedUrl.pathname) || 'external-image';

    let processedBuffer = buffer;
    let width: number | undefined;
    let height: number | undefined;

    try {
      const image = sharp(buffer, { animated: true });
      const metadata = await image.metadata();
      width = metadata.width;
      height = metadata.height;

      if (!useS3Storage) {
        if (purpose === 'avatar') {
          processedBuffer = await image.resize(300, 300, { fit: 'cover' }).toBuffer();
        } else if (purpose === 'portfolio' || purpose === 'service_image') {
          processedBuffer = await image
            .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
            .toBuffer();
        }
      }
    } catch (error) {
      logger.warn('External image processing failed, using original buffer', {
        error: error instanceof Error ? error.message : String(error)
      });
      processedBuffer = buffer;
    }

    const extFromMime = (type: string): string => {
      if (type.includes('png')) return '.png';
      if (type.includes('webp')) return '.webp';
      if (type.includes('gif')) return '.gif';
      if (type.includes('bmp')) return '.bmp';
      return '.jpg';
    };

    let storagePath: string;
    let absoluteUrl: string;
    let fileRecordName: string;
    let storedSize = processedBuffer.length;
    let cloudProvider: string | undefined;
    let cloudKey: string | undefined;
    let cloudBucket: string | undefined;

    if (useS3Storage) {
      const initS3 = () => {
        if (!getS3Service()) {
          const s3Config = {
            region: process.env.AWS_REGION || 'us-east-1',
            accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
            bucketName: process.env.AWS_S3_BUCKET || '',
            publicUrl: process.env.AWS_S3_URL
          };

          if (!s3Config.accessKeyId || !s3Config.secretAccessKey || !s3Config.bucketName) {
            throw new Error('S3 configuration is incomplete. Please check environment variables.');
          }

          return initializeS3Service(s3Config);
        }
        return getS3Service()!;
      };

      const getUploadOptionsForPurpose = (selectedPurpose: string, selectedUserId: string) => {
        const options: any = {
          purpose: selectedPurpose as any,
          userId: selectedUserId
        };

        switch (selectedPurpose) {
          case 'avatar':
            options.resize = { width: 400, height: 400, quality: 90 };
            break;
          case 'portfolio':
            options.resize = { width: 1200, height: 1200, quality: 85 };
            break;
          case 'service_image':
          case 'service':
            options.resize = { width: 800, height: 600, quality: 85 };
            break;
          default:
            break;
        }

        return options;
      };

      const s3Service = initS3();
      const uploadOptions = getUploadOptionsForPurpose(purpose, userId);
      const s3Result = await s3Service.uploadFile(buffer, originalName, mimeType, uploadOptions);

      storagePath = s3Result.key;
      absoluteUrl = s3Result.url;
      storedSize = s3Result.size;
      fileRecordName = path.basename(s3Result.key);
      cloudProvider = 'S3';
      cloudKey = s3Result.key;
      cloudBucket = process.env.AWS_S3_BUCKET;
    } else {
      const extension = detectedType?.ext ? `.${detectedType.ext}` : extFromMime(mimeType);
      const fileId = crypto.randomUUID();
      const filename = `${purpose}/${fileId}${extension}`;

      const fileUploadService = new FileUploadService(prisma);
      storagePath = await fileUploadService.uploadToStorage(processedBuffer, filename, mimeType);

      absoluteUrl = storagePath;
      if (storagePath.startsWith('/uploads/')) {
        const baseUrl = getPublicBaseUrl(req);
        absoluteUrl = baseUrl ? `${baseUrl}${storagePath}` : storagePath;
      }

      fileRecordName = filename;

      if (fileUploadService.isUsingS3()) {
        cloudProvider = 'S3';
        cloudKey = filename;
        cloudBucket = process.env.AWS_S3_BUCKET;
      }
    }

    const fileData: any = {
      filename: fileRecordName,
      originalName,
      mimeType,
      size: storedSize,
      path: storagePath,
      url: absoluteUrl,
      width,
      height,
      uploadedBy: userId,
      purpose,
      isPublic: true,
      isProcessed: true
    };

    if (cloudProvider) {
      fileData.cloudProvider = cloudProvider;
      fileData.cloudKey = cloudKey;
      fileData.cloudBucket = cloudBucket;
    }

    await prisma.file.create({ data: fileData });

    return res.json({
      success: true,
      data: {
        url: absoluteUrl,
        filename: fileRecordName,
        size: storedSize,
        mimeType,
        uploadedAt: new Date().toISOString()
      },
      message: 'External image processed'
    });
  } catch (error) {
    console.error('Save external image error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to save external image',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Migrate missing portfolio image to S3
router.post('/migrate-portfolio', authMiddleware, async (req, res) => {
  try {
    const { filename } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Authentication required' });
    }

    if (!filename) {
      return res.status(400).json({ success: false, error: 'Filename is required' });
    }

    // For missing portfolio images, return a placeholder or suggest re-upload
    console.log(`📁 Portfolio migration requested for missing file: ${filename}`);
    
    return res.json({
      success: false,
      error: 'File not found',
      message: 'This portfolio image is no longer available. Please re-upload your portfolio images.',
      code: 'PORTFOLIO_MIGRATION_NEEDED',
      filename
    });
    
  } catch (error) {
    console.error('❌ Portfolio migration error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Portfolio migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Delete file (requires authentication and ownership)
router.delete(
  '/:id',
  authMiddleware,
  [param('id').isString().notEmpty()],
  validateRequest,
  fileController.deleteFile
);

export default router;
