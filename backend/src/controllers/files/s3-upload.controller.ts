import { Request, Response } from 'express';
import multer from 'multer';
import { initializeS3Service, getS3Service } from '@/services/s3.service';
import { PrismaClient } from '@prisma/client';
import path from 'path';

const prisma = new PrismaClient();

// Initialize S3 service
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

// Multer configuration for memory storage (we'll upload to S3 directly)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 10 // Maximum 10 files at once
  },
  fileFilter: (req, file, callback) => {
    // Allow all files, we'll validate by purpose later
    callback(null, true);
  }
});

export const uploadMiddleware = upload.array('files', 10);

// Using global Request extension from types/global.d.ts

/**
 * Upload files to S3 with proper validation and database storage
 */
export const uploadFiles = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🚀 S3 Upload request:', {
      userId: req.user?.id,
      purpose: req.query.purpose,
      filesCount: Array.isArray(req.files) ? req.files.length : 0
    });

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || !Array.isArray(files) || files.length === 0) {
      res.status(400).json({ success: false, error: 'No files provided' });
      return;
    }

    const purpose = (req.query.purpose as string) || 'general';
    const userId = req.user.id;

    // Initialize S3 service
    let s3Service;
    try {
      s3Service = initS3();
    } catch (error) {
      console.error('❌ S3 initialization failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Cloud storage not available',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
      return;
    }

    // Test S3 connection
    const isS3Connected = await s3Service.testConnection();
    if (!isS3Connected) {
      console.error('❌ S3 connection test failed');
      res.status(500).json({ 
        success: false, 
        error: 'Cloud storage connection failed' 
      });
      return;
    }

    const uploadResults: any[] = [];
    const errors: string[] = [];

    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        console.log(`📁 Processing file ${i + 1}/${files.length}:`, {
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: file.size
        });

        // Validate file type based on purpose
        const validationResult = validateFileForPurpose(file, purpose);
        if (!validationResult.valid) {
          errors.push(`File ${file.originalname}: ${validationResult.error}`);
          continue;
        }

        // Set resize options based on purpose
        const uploadOptions = getUploadOptionsForPurpose(purpose, userId);

        // Upload to S3
        const s3Result = await s3Service.uploadFile(
          file.buffer,
          file.originalname,
          file.mimetype,
          uploadOptions
        );

        // Create database record (temporarily without cloud fields until migration)
        // Save file record to database - handle missing cloudProvider field gracefully
        const fileData: any = {
          filename: path.basename(s3Result.key),
          originalName: file.originalname,
          mimeType: s3Result.mimeType,
          size: s3Result.size,
          path: s3Result.key, // Store S3 key in path field
          url: s3Result.url,
          uploadedBy: userId,
          purpose: purpose,
          isPublic: true,
          isProcessed: true
        };

        // Add cloud provider info for S3
        fileData.cloudProvider = 'S3';
        fileData.cloudKey = s3Result.key;
        fileData.cloudBucket = process.env.AWS_S3_BUCKET;

        const fileRecord = await prisma.file.create({
          data: fileData
        });

        uploadResults.push({
          id: fileRecord.id,
          filename: fileRecord.filename,
          url: s3Result.url,
          originalName: file.originalname,
          mimeType: s3Result.mimeType,
          size: s3Result.size,
          uploadedBy: userId,
          purpose: purpose,
          createdAt: fileRecord.createdAt,
          uploadedAt: fileRecord.createdAt,
          cloudProvider: 'S3'
        });

        console.log(`✅ File ${i + 1} uploaded successfully:`, s3Result.url);

      } catch (fileError) {
        console.error(`❌ Failed to upload file ${file.originalname}:`, fileError);
        errors.push(`File ${file.originalname}: ${fileError instanceof Error ? fileError.message : 'Upload failed'}`);
      }
    }

    // Send response
    if (uploadResults.length > 0) {
      console.log(`📤 Upload completed: ${uploadResults.length} files successful, ${errors.length} errors`);
      
      res.status(uploadResults.length === files.length ? 200 : 207).json({
        success: true,
        data: uploadResults,
        message: `${uploadResults.length} file(s) uploaded successfully`,
        errors: errors.length > 0 ? errors : undefined
      });
    } else {
      console.error('❌ All file uploads failed');
      res.status(400).json({
        success: false,
        error: 'All file uploads failed',
        details: errors
      });
    }

  } catch (error) {
    console.error('💥 S3 upload controller error:', error);
    res.status(500).json({
      success: false,
      error: 'File upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Generate presigned URL for direct S3 upload
 */
export const getPresignedUploadUrl = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🔗 Presigned URL request:', {
      userId: req.user?.id,
      body: req.body
    });

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { filename, contentType, type, folder } = req.body;

    if (!filename || !contentType) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: filename, contentType' 
      });
      return;
    }

    // Initialize S3 service
    let s3Service;
    try {
      s3Service = initS3();
    } catch (error) {
      console.error('❌ S3 initialization failed:', error);
      res.status(500).json({ 
        success: false, 
        error: 'Cloud storage not available' 
      });
      return;
    }

    const uploadOptions = getUploadOptionsForPurpose(type || 'general', req.user.id);

    const presignedResult = await s3Service.getPresignedUploadUrl(
      filename,
      contentType,
      uploadOptions
    );

    console.log('✅ Presigned URL generated:', {
      key: presignedResult.key,
      fileUrl: presignedResult.fileUrl
    });

    res.json({
      success: true,
      data: presignedResult
    });

  } catch (error) {
    console.error('❌ Presigned URL generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate presigned URL',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete file from S3 and database
 */
export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🗑️ Delete file request:', {
      userId: req.user?.id,
      fileId: req.params.id
    });

    if (!req.user?.id) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const fileId = req.params.id;

    // Get file record from database
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) {
      res.status(404).json({ success: false, error: 'File not found' });
      return;
    }

    // Check ownership
    if (fileRecord.uploadedBy !== req.user.id) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Delete from S3 if file path contains S3 key structure
    if (fileRecord.path && fileRecord.path.includes('/')) {
      try {
        const s3Service = initS3();
        await s3Service.deleteFile(fileRecord.path); // path contains S3 key
        console.log('✅ File deleted from S3:', fileRecord.path);
      } catch (s3Error) {
        console.error('⚠️ S3 deletion failed (continuing with database deletion):', s3Error);
      }
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId }
    });

    console.log('✅ File record deleted from database:', fileId);

    res.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ File deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'File deletion failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * Validate file based on purpose
 */
function validateFileForPurpose(file: Express.Multer.File, purpose: string): { valid: boolean; error?: string } {
  const allowedTypes: Record<string, string[]> = {
    avatar: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    payment_qr: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    portfolio: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    service: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    document: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    certificate: ['application/pdf', 'image/jpeg', 'image/png']
  };

  const maxSizes: Record<string, number> = {
    avatar: 5 * 1024 * 1024, // 5MB
    payment_qr: 5 * 1024 * 1024, // 5MB
    portfolio: 10 * 1024 * 1024, // 10MB
    service: 10 * 1024 * 1024, // 10MB
    document: 20 * 1024 * 1024, // 20MB
    certificate: 20 * 1024 * 1024 // 20MB
  };

  const purposeTypes = allowedTypes[purpose] || allowedTypes.portfolio;
  const maxSize = maxSizes[purpose] || maxSizes.portfolio;

  if (!purposeTypes.includes(file.mimetype)) {
    return { 
      valid: false, 
      error: `Invalid file type. Allowed: ${purposeTypes.join(', ')}` 
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = Math.round(maxSize / (1024 * 1024));
    return { 
      valid: false, 
      error: `File too large. Maximum size: ${maxSizeMB}MB` 
    };
  }

  return { valid: true };
}

/**
 * Get upload options based on purpose
 */
function getUploadOptionsForPurpose(purpose: string, userId: string) {
  const options: any = {
    purpose: purpose as any,
    userId
  };

  // Set resize options for images
  switch (purpose) {
    case 'avatar':
      options.resize = {
        width: 400,
        height: 400,
        quality: 90
      };
      break;
    case 'portfolio':
      options.resize = {
        width: 1200,
        height: 1200,
        quality: 85
      };
      break;
    case 'service':
      options.resize = {
        width: 800,
        height: 600,
        quality: 85
      };
      break;
  }

  return options;
}
