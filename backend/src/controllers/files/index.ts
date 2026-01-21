import { Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { FileUploadService } from '@/services/fileUpload/index';
import { successResponse, errorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { config } from '@/config';
import { prisma } from '@/config/database';

const getPublicBaseUrl = (req: Request): string => {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  const forwardedProto = req.get('x-forwarded-proto')?.split(',')[0]?.trim();
  const protocol = forwardedProto || req.protocol;
  const host = req.get('x-forwarded-host') || req.get('host');
  return host ? `${protocol}://${host}` : '';
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    // Check file type based on purpose
    const purpose = req.query.purpose as string;
    const allowedTypes = getAllowedFileTypes(purpose);
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`));
    }
  }
});

function getAllowedFileTypes(purpose: string): string[] {
  switch (purpose) {
    case 'avatar':
      return ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    case 'service_image':
    case 'portfolio':
      return ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    case 'message_attachment':
      return [
        'image/jpeg', 'image/png', 'image/webp', 'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4', 'video/quicktime',
        'audio/mpeg', 'audio/wav'
      ];
    case 'document':
      return ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif', 'application/pdf'];
    default:
      return ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/heic', 'image/heif'];
  }
}

export class FileController {
  private fileUploadService: FileUploadService;

  constructor() {
    this.fileUploadService = new FileUploadService(prisma);
  }

  uploadFiles = async (req: Request, res: Response) => {
    try {
      logger.info('📤 File upload request received', {
        userId: req.user?.id,
        purpose: req.query.purpose,
        filesCount: Array.isArray(req.files) ? req.files.length : 0,
        contentType: req.headers['content-type'],
        hasUser: !!req.user
      });

      if (!req.user?.id) {
        logger.error('No user ID found in request', { 
          hasUser: !!req.user, 
          userKeys: req.user ? Object.keys(req.user) : [],
          headers: Object.keys(req.headers)
        });
        return errorResponse(res, 'Authentication required', 401);
      }

      const userId = req.user.id;
      const purpose = req.query.purpose as string || 'general';
      const entityType = req.query.entityType as string;
      const entityId = req.query.entityId as string;
      const isPublic = req.query.isPublic === 'true';

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        logger.warn('No files provided in upload request');
        return errorResponse(res, 'No files provided', 400);
      }

      const uploadedFiles = [];

      for (const file of req.files as Express.Multer.File[]) {
        try {
          logger.info('Processing file', { 
            originalName: file.originalname, 
            mimeType: file.mimetype, 
            size: file.size,
            purpose 
          });

          // Process the file
          let processedFile;
          try {
            processedFile = await this.processFile(file, purpose);
          } catch (processError) {
            logger.error('File processing failed, using original file', {
              error: processError instanceof Error ? processError.message : String(processError),
              originalName: file.originalname
            });
            // Fallback to original file if processing fails
            processedFile = {
              buffer: file.buffer,
              filename: `${purpose}/${Date.now()}-${file.originalname}`,
              mimetype: file.mimetype,
              width: undefined,
              height: undefined
            };
          }
          
          logger.info('File processed, uploading to storage', {
            filename: processedFile.filename,
            bufferSize: processedFile.buffer.length,
            mimetype: processedFile.mimetype
          });

          // Upload to storage (S3 or local)
          let fileUrl;
          try {
            fileUrl = await this.fileUploadService.uploadToStorage(
              processedFile.buffer,
              processedFile.filename,
              processedFile.mimetype
            );
          } catch (storageError) {
            logger.error('Storage upload failed', {
              error: storageError instanceof Error ? storageError.message : String(storageError),
              filename: processedFile.filename
            });
            throw storageError;
          }

          logger.info('File uploaded to storage successfully', {
            filename: processedFile.filename,
            url: fileUrl
          });

          // Convert relative URL to absolute URL for production
          let absoluteUrl = fileUrl;
          if (fileUrl.startsWith('/uploads/')) {
            const baseUrl = getPublicBaseUrl(req);
            absoluteUrl = baseUrl ? `${baseUrl}${fileUrl}` : fileUrl;
          }

          // Save file record to database
          logger.info('Saving file record to database', {
            filename: processedFile.filename,
            uploadedBy: userId,
            purpose,
            url: absoluteUrl
          });

          // Check if user exists before creating file record
          const userExists = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true }
          });

          if (!userExists) {
            logger.error('User not found when creating file record', { userId });
            throw new Error('User not found');
          }

          // Prepare file record data - handle missing cloudProvider field gracefully
          const fileData: any = {
            filename: processedFile.filename,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: processedFile.buffer.length,
            path: fileUrl, // Use local file path, not absolute URL
            url: absoluteUrl,
            width: processedFile.width,
            height: processedFile.height,
            uploadedBy: userId,
            purpose,
            entityType,
            entityId,
            isPublic,
            isProcessed: true
          };

          // Add cloud provider info if using S3
          if (this.fileUploadService.isUsingS3()) {
            fileData.cloudProvider = 'S3';
            fileData.cloudKey = processedFile.filename;
            fileData.cloudBucket = process.env.AWS_S3_BUCKET;
          }

          const fileRecord = await prisma.file.create({
            data: fileData
          });

          logger.info('File record saved to database', {
            fileId: fileRecord.id,
            filename: fileRecord.filename,
            url: fileRecord.url
          });

          // Update user avatar if this is an avatar upload
          if (purpose === 'avatar' && userId) {
            try {
              const { UserService } = await import('@/services/user');
              await UserService.updateAvatar(userId, absoluteUrl);
              logger.info('User avatar updated in database', {
                userId,
                avatarUrl: absoluteUrl
              });
            } catch (avatarUpdateError) {
              logger.error('Failed to update user avatar in database:', {
                error: avatarUpdateError instanceof Error ? avatarUpdateError.message : String(avatarUpdateError),
                userId,
                avatarUrl: absoluteUrl
              });
              // Don't fail the entire upload if avatar update fails
            }
          }

          uploadedFiles.push(fileRecord);
        } catch (fileError) {
          logger.error(`❌ Error processing file ${file.originalname}:`, {
            error: fileError instanceof Error ? fileError.message : String(fileError),
            stack: fileError instanceof Error ? fileError.stack : undefined,
            fileName: file.originalname,
            fileSize: file.size,
            mimeType: file.mimetype,
            purpose
          });

          // Return error immediately if it's a critical error
          if (fileError instanceof Error && (
            fileError.message.includes('Authentication') ||
            fileError.message.includes('database') ||
            fileError.message.includes('connection')
          )) {
            throw fileError;
          }

          // Continue with other files for non-critical errors
        }
      }

      if (uploadedFiles.length === 0) {
        return errorResponse(res, 'Failed to upload any files', 500);
      }

      logger.info('✅ Files uploaded successfully', {
        uploadedCount: uploadedFiles.length,
        files: uploadedFiles.map(f => ({ id: f.id, filename: f.filename, url: f.url }))
      });
      return successResponse(res, uploadedFiles, 'Files uploaded successfully', 201);
    } catch (error) {
      logger.error('❌ Upload error:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: req.user?.id,
        purpose: req.query.purpose,
        filesCount: Array.isArray(req.files) ? req.files.length : 0
      });

      // Return more specific error message
      const errorMessage = error instanceof Error ? error.message : 'File upload failed';
      return errorResponse(
        res,
        errorMessage,
        500,
        'UPLOAD_ERROR'
      );
    }
  };

  private async processFile(file: Express.Multer.File, purpose: string) {
    try {
      const fileId = uuidv4();
      let ext = path.extname(file.originalname);
      // We'll update the extension after processing if needed
      let filename = `${purpose}/${fileId}${ext}`;

      let processedBuffer = file.buffer;
      let width: number | undefined;
      let height: number | undefined;

      // Process images
      if (file.mimetype.startsWith('image/')) {
        logger.info('Processing image with Sharp', { 
          originalName: file.originalname,
          mimeType: file.mimetype,
          bufferLength: file.buffer.length 
        });

        try {
          // Enable animated frame awareness to preserve animated WebP
          const image = sharp(file.buffer, { animated: true });
          const metadata = await image.metadata();
          const isAnimatedWebp = (metadata.format === 'webp') && (typeof metadata.pages === 'number') && metadata.pages > 1;
          width = metadata.width;
          height = metadata.height;

          logger.info('Image metadata extracted', { 
            width, height, format: metadata.format 
          });

          // Resize based on purpose
          switch (purpose) {
            case 'avatar':
              logger.info('Resizing avatar image');
              // Check if input is webp and maintain format, otherwise convert to jpeg
              if (metadata.format === 'webp') {
                processedBuffer = await image
                  .resize(300, 300, { fit: 'cover' })
                  .webp({ quality: 85 })
                  .toBuffer();
              } else {
                processedBuffer = await image
                  .resize(300, 300, { fit: 'cover' })
                  .jpeg({ quality: 85 })
                  .toBuffer();
              }
              break;
            case 'service_image':
            case 'portfolio':
              logger.info('Resizing portfolio/service image');
              // Preserve animation for animated WebP by skipping re-encode
              if (isAnimatedWebp) {
                logger.info('Detected animated WebP. Skipping resize to preserve animation.');
                processedBuffer = file.buffer;
              } else {
                // Check if input is webp and maintain format, otherwise convert to jpeg
                if (metadata.format === 'webp') {
                  processedBuffer = await image
                    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
                    .webp({ quality: 85 })
                    .toBuffer();
                } else {
                  processedBuffer = await image
                    .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 85 })
                    .toBuffer();
                }
              }
              break;
            default:
              logger.info('Keeping original image size');
              // Keep original size for other purposes
              break;
          }
          
          logger.info('Image processing completed', {
            originalSize: file.buffer.length,
            processedSize: processedBuffer.length
          });
        } catch (sharpError) {
          logger.error('Sharp processing failed, using original buffer', {
            error: sharpError instanceof Error ? sharpError.message : String(sharpError),
            originalName: file.originalname
          });
          // Fall back to original buffer if Sharp fails
          processedBuffer = file.buffer;
        }
      }

      // Determine the correct MIME type and extension based on processing
      let finalMimeType = file.mimetype;
      if (file.mimetype.startsWith('image/') && processedBuffer !== file.buffer) {
        // If image was processed, determine MIME type and extension based on output format
        try {
          const processedImage = sharp(processedBuffer);
          const processedMetadata = await processedImage.metadata();
          if (processedMetadata.format === 'webp') {
            finalMimeType = 'image/webp';
            // Update filename extension if format changed
            if (!ext.toLowerCase().endsWith('.webp')) {
              filename = `${purpose}/${fileId}.webp`;
            }
          } else if (processedMetadata.format === 'jpeg') {
            finalMimeType = 'image/jpeg';
            // Update filename extension if format changed
            if (!ext.toLowerCase().endsWith('.jpg') && !ext.toLowerCase().endsWith('.jpeg')) {
              filename = `${purpose}/${fileId}.jpg`;
            }
          } else if (processedMetadata.format === 'png') {
            finalMimeType = 'image/png';
            // Update filename extension if format changed
            if (!ext.toLowerCase().endsWith('.png')) {
              filename = `${purpose}/${fileId}.png`;
            }
          }
          
          logger.info('Image format determined after processing', {
            originalFormat: file.mimetype,
            processedFormat: finalMimeType,
            filename: filename
          });
        } catch (metadataError) {
          logger.warn('Could not determine processed image format, using original MIME type', {
            originalMimeType: file.mimetype,
            error: metadataError instanceof Error ? metadataError.message : String(metadataError)
          });
        }
      }

      return {
        buffer: processedBuffer,
        filename,
        mimetype: finalMimeType,
        width,
        height
      };
    } catch (error) {
      logger.error('Error processing file:', {
        error: error instanceof Error ? error.message : String(error),
        originalName: file.originalname,
        mimeType: file.mimetype,
        purpose
      });
      throw error;
    }
  }

  getFile = async (req: Request, res: Response) => {
    try {
      const fileId = req.params.id;
      const userId = req.user?.id; // Optional for public files

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return errorResponse(res, 'File not found', 404);
      }

      // Check access permissions
      if (!file.isPublic && (!userId || file.uploadedBy !== userId)) {
        return errorResponse(res, 'Access denied', 403);
      }

      return successResponse(res, file, 'File retrieved successfully');
    } catch (error) {
      logger.error('Error getting file:', error);
      return errorResponse(res, 'Failed to retrieve file', 500);
    }
  };

  deleteFile = async (req: Request, res: Response) => {
    try {
      const fileId = req.params.id;
      const userId = req.user.id;

      const file = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!file) {
        return errorResponse(res, 'File not found', 404);
      }

      // Check ownership
      if (file.uploadedBy !== userId) {
        return errorResponse(res, 'Access denied', 403);
      }

      // Delete from storage
      await this.fileUploadService.deleteFromStorage(file.path);

      // Delete from database
      await prisma.file.delete({
        where: { id: fileId }
      });

      return successResponse(res, null, 'File deleted successfully');
    } catch (error) {
      logger.error('Error deleting file:', error);
      return errorResponse(res, 'Failed to delete file', 500);
    }
  };

  getUserFiles = async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const purpose = req.query.purpose as string;

      const where: any = { uploadedBy: userId };
      if (purpose) {
        where.purpose = purpose;
      }

      const files = await prisma.file.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      });

      const total = await prisma.file.count({ where });

      const pagination = {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      };

      return successResponse(res, { files, pagination }, 'Files retrieved successfully');
    } catch (error) {
      logger.error('Error getting user files:', error);
      return errorResponse(res, 'Failed to retrieve files', 500);
    }
  };

  // Middleware for multer
  uploadMiddleware = upload.array('files', 5);
}

export const fileController = new FileController();
