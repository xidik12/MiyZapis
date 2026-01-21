import multer from 'multer';
import sharp from 'sharp';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs/promises';
import { prisma } from '@/config/database';
import { logger } from '@/utils/logger';

interface FileUploadConfig {
  maxFileSize: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  generateThumbnails: boolean;
  thumbnailSizes: Array<{ width: number; height: number; suffix: string }>;
}

interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  thumbnails?: Array<{ size: string; url: string }>;
}

export class EnhancedFileUploadService {
  private s3Client?: S3Client;
  private bucketName: string;
  private uploadPath: string;
  private baseUrl: string;

  // File type configurations
  private fileConfigs: Map<string, FileUploadConfig> = new Map([
    ['avatar', {
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      generateThumbnails: true,
      thumbnailSizes: [
        { width: 150, height: 150, suffix: '_thumb' },
        { width: 300, height: 300, suffix: '_medium' }
      ]
    }],
    ['service_image', {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      generateThumbnails: true,
      thumbnailSizes: [
        { width: 300, height: 200, suffix: '_thumb' },
        { width: 600, height: 400, suffix: '_medium' },
        { width: 1200, height: 800, suffix: '_large' }
      ]
    }],
    ['portfolio', {
      maxFileSize: 15 * 1024 * 1024, // 15MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      generateThumbnails: true,
      thumbnailSizes: [
        { width: 400, height: 300, suffix: '_thumb' },
        { width: 800, height: 600, suffix: '_large' }
      ]
    }],
    ['message_attachment', {
      maxFileSize: 20 * 1024 * 1024, // 20MB
      allowedMimeTypes: [
        'image/jpeg', 'image/png', 'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf', '.doc', '.docx'],
      generateThumbnails: false,
      thumbnailSizes: []
    }],
    ['document', {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/svg+xml',
        'image/heic',
        'image/heif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.heic', '.heif', '.pdf', '.doc', '.docx', '.xls', '.xlsx'],
      generateThumbnails: false,
      thumbnailSizes: []
    }]
  ]);

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || 'booking-platform-files';
    this.uploadPath = process.env.UPLOAD_PATH || './uploads';
    this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Initialize S3 client if credentials are provided
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    }
  }

  /**
   * Create multer middleware for specific file purpose
   */
  createUploadMiddleware(purpose: string, maxFiles = 1) {
    const config = this.fileConfigs.get(purpose);
    if (!config) {
      throw new Error(`Unknown file purpose: ${purpose}`);
    }

    const storage = multer.memoryStorage();

    return multer({
      storage,
      limits: {
        fileSize: config.maxFileSize,
        files: maxFiles
      },
      fileFilter: (req, file, cb) => {
        const isValidMimeType = config.allowedMimeTypes.includes(file.mimetype);
        const fileExtension = path.extname(file.originalname).toLowerCase();
        const isValidExtension = config.allowedExtensions.includes(fileExtension);

        if (isValidMimeType && isValidExtension) {
          cb(null, true);
        } else {
          cb(new Error(`Invalid file type. Allowed types: ${config.allowedExtensions.join(', ')}`));
        }
      }
    });
  }

  /**
   * Process uploaded file
   */
  async processUpload(
    file: Express.Multer.File,
    purpose: string,
    userId: string,
    entityType?: string,
    entityId?: string
  ): Promise<UploadedFile> {
    try {
      const config = this.fileConfigs.get(purpose);
      if (!config) {
        throw new Error(`Unknown file purpose: ${purpose}`);
      }

      // Generate unique filename
      const fileId = crypto.randomUUID();
      const extension = path.extname(file.originalname).toLowerCase();
      const filename = `${fileId}${extension}`;

      let filePath: string;
      let fileUrl: string;
      let processedBuffer = file.buffer;

      // Optimize image if it's an image file
      if (file.mimetype.startsWith('image/')) {
        processedBuffer = await this.optimizeImage(file.buffer, file.mimetype);
      }

      // Upload to S3 or local storage
      if (this.s3Client) {
        filePath = `${purpose}/${filename}`;
        fileUrl = await this.uploadToS3(processedBuffer, filePath, file.mimetype);
      } else {
        filePath = await this.uploadToLocal(processedBuffer, purpose, filename);
        fileUrl = `${this.baseUrl}/files/${purpose}/${filename}`;
      }

      // Generate thumbnails if needed
      const thumbnails: Array<{ size: string; url: string }> = [];
      if (config.generateThumbnails && file.mimetype.startsWith('image/')) {
        for (const thumbConfig of config.thumbnailSizes) {
          const thumbUrl = await this.generateThumbnail(
            processedBuffer,
            purpose,
            fileId,
            thumbConfig
          );
          thumbnails.push({
            size: `${thumbConfig.width}x${thumbConfig.height}`,
            url: thumbUrl
          });
        }
      }

      // Save file record to database
      const fileRecord = await prisma.file.create({
        data: {
          id: fileId,
          filename,
          originalName: file.originalname,
          mimeType: file.mimetype,
          size: processedBuffer.length,
          path: filePath,
          url: fileUrl,
          uploadedBy: userId,
          purpose,
          entityType,
          entityId,
          isPublic: ['avatar', 'service_image', 'portfolio'].includes(purpose),
          isProcessed: true,
          // Store image dimensions if available
          ...(file.mimetype.startsWith('image/') && await this.getImageDimensions(processedBuffer))
        }
      });

      const result: UploadedFile = {
        id: fileRecord.id,
        filename: fileRecord.filename,
        originalName: fileRecord.originalName,
        mimeType: fileRecord.mimeType,
        size: fileRecord.size,
        path: fileRecord.path,
        url: fileRecord.url
      };

      if (thumbnails.length > 0) {
        result.thumbnails = thumbnails;
      }

      logger.info('File uploaded successfully', {
        fileId: fileRecord.id,
        purpose,
        size: fileRecord.size,
        userId
      });

      return result;

    } catch (error) {
      logger.error('File upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async processMultipleUploads(
    files: Express.Multer.File[],
    purpose: string,
    userId: string,
    entityType?: string,
    entityId?: string
  ): Promise<UploadedFile[]> {
    const uploadPromises = files.map(file => 
      this.processUpload(file, purpose, userId, entityType, entityId)
    );

    return Promise.all(uploadPromises);
  }

  /**
   * Generate signed URL for direct upload (S3 only)
   */
  async generateSignedUploadUrl(
    purpose: string,
    filename: string,
    contentType: string,
    userId: string
  ): Promise<{ uploadUrl: string; fileId: string; fileUrl: string }> {
    if (!this.s3Client) {
      throw new Error('S3 not configured');
    }

    const config = this.fileConfigs.get(purpose);
    if (!config) {
      throw new Error(`Unknown file purpose: ${purpose}`);
    }

    if (!config.allowedMimeTypes.includes(contentType)) {
      throw new Error(`Content type ${contentType} not allowed for ${purpose}`);
    }

    const fileId = crypto.randomUUID();
    const extension = path.extname(filename).toLowerCase();
    const sanitizedFilename = `${fileId}${extension}`;
    const key = `${purpose}/${sanitizedFilename}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType
    });

    const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });
    const fileUrl = `https://${this.bucketName}.s3.amazonaws.com/${key}`;

    // Pre-create file record
    await prisma.file.create({
      data: {
        id: fileId,
        filename: sanitizedFilename,
        originalName: filename,
        mimeType: contentType,
        size: 0, // Will be updated after upload
        path: key,
        url: fileUrl,
        uploadedBy: userId,
        purpose,
        isPublic: ['avatar', 'service_image', 'portfolio'].includes(purpose),
        isProcessed: false
      }
    });

    return {
      uploadUrl,
      fileId,
      fileUrl
    };
  }

  /**
   * Confirm direct upload and process file
   */
  async confirmDirectUpload(fileId: string): Promise<UploadedFile> {
    const fileRecord = await prisma.file.findUnique({
      where: { id: fileId }
    });

    if (!fileRecord) {
      throw new Error('File record not found');
    }

    if (fileRecord.isProcessed) {
      throw new Error('File already processed');
    }

    try {
      // Get file from S3 to determine size and process if needed
      if (this.s3Client) {
        const command = new GetObjectCommand({
          Bucket: this.bucketName,
          Key: fileRecord.path
        });

        const response = await this.s3Client.send(command);
        const size = response.ContentLength || 0;

        // Update file record
        await prisma.file.update({
          where: { id: fileId },
          data: {
            size,
            isProcessed: true
          }
        });

        // Generate thumbnails if needed
        const config = this.fileConfigs.get(fileRecord.purpose);
        const thumbnails: Array<{ size: string; url: string }> = [];

        if (config?.generateThumbnails && fileRecord.mimeType.startsWith('image/') && response.Body) {
          const buffer = await this.streamToBuffer(response.Body as any);
          
          for (const thumbConfig of config.thumbnailSizes) {
            const thumbUrl = await this.generateThumbnail(
              buffer,
              fileRecord.purpose,
              fileId,
              thumbConfig
            );
            thumbnails.push({
              size: `${thumbConfig.width}x${thumbConfig.height}`,
              url: thumbUrl
            });
          }
        }

        return {
          id: fileRecord.id,
          filename: fileRecord.filename,
          originalName: fileRecord.originalName,
          mimeType: fileRecord.mimeType,
          size,
          path: fileRecord.path,
          url: fileRecord.url,
          ...(thumbnails.length > 0 && { thumbnails })
        };
      }

      throw new Error('S3 not configured');

    } catch (error) {
      logger.error('Failed to confirm direct upload:', error);
      
      // Mark file as failed
      await prisma.file.update({
        where: { id: fileId },
        data: { isProcessed: false }
      });

      throw error;
    }
  }

  /**
   * Delete file
   */
  async deleteFile(fileId: string, userId: string): Promise<void> {
    try {
      const fileRecord = await prisma.file.findUnique({
        where: { id: fileId }
      });

      if (!fileRecord) {
        throw new Error('File not found');
      }

      // Check if user has permission to delete
      if (fileRecord.uploadedBy !== userId) {
        throw new Error('Permission denied');
      }

      // Delete from storage
      if (this.s3Client) {
        await this.deleteFromS3(fileRecord.path);
      } else {
        await this.deleteFromLocal(fileRecord.path);
      }

      // Soft delete from database
      await prisma.file.update({
        where: { id: fileId },
        data: { deletedAt: new Date() }
      });

      logger.info('File deleted successfully', { fileId, userId });

    } catch (error) {
      logger.error('File deletion failed:', error);
      throw error;
    }
  }

  /**
   * Get file by ID
   */
  async getFile(fileId: string, userId?: string): Promise<UploadedFile | null> {
    const fileRecord = await prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null
      }
    });

    if (!fileRecord) {
      return null;
    }

    // Check access permissions
    if (!fileRecord.isPublic && userId !== fileRecord.uploadedBy) {
      throw new Error('Access denied');
    }

    return {
      id: fileRecord.id,
      filename: fileRecord.filename,
      originalName: fileRecord.originalName,
      mimeType: fileRecord.mimeType,
      size: fileRecord.size,
      path: fileRecord.path,
      url: fileRecord.url
    };
  }

  /**
   * Resize image for different platforms
   */
  async getResizedImage(fileId: string, width: number, height?: number): Promise<string> {
    const fileRecord = await prisma.file.findFirst({
      where: {
        id: fileId,
        deletedAt: null,
        mimeType: { startsWith: 'image/' }
      }
    });

    if (!fileRecord) {
      throw new Error('Image not found');
    }

    const resizeKey = `${width}x${height || width}`;
    const resizedFilename = `${path.parse(fileRecord.filename).name}_${resizeKey}${path.extname(fileRecord.filename)}`;

    let imageBuffer: Buffer;

    // Get original image
    if (this.s3Client) {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileRecord.path
      });
      const response = await this.s3Client.send(command);
      imageBuffer = await this.streamToBuffer(response.Body as any);
    } else {
      imageBuffer = await fs.readFile(path.join(this.uploadPath, fileRecord.path));
    }

    // Resize image
    const resizedBuffer = await sharp(imageBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Upload resized image
    let resizedUrl: string;
    if (this.s3Client) {
      const resizedPath = `${path.dirname(fileRecord.path)}/resized/${resizedFilename}`;
      resizedUrl = await this.uploadToS3(resizedBuffer, resizedPath, 'image/jpeg');
    } else {
      const resizedPath = await this.uploadToLocal(resizedBuffer, `${fileRecord.purpose}/resized`, resizedFilename);
      resizedUrl = `${this.baseUrl}/files/${resizedPath}`;
    }

    return resizedUrl;
  }

  // Private helper methods
  private async optimizeImage(buffer: Buffer, mimeType: string): Promise<Buffer> {
    try {
      // Detect animated WebP and preserve original to keep animation
      const meta = await sharp(buffer, { animated: true }).metadata();
      const isAnimatedWebp = (mimeType === 'image/webp') && (typeof meta.pages === 'number') && meta.pages > 1;
      if (isAnimatedWebp) {
        logger.info('Animated WebP detected during optimizeImage, skipping re-encode to preserve animation');
        return buffer;
      }

      let sharpInstance = sharp(buffer);

      // Auto-orient based on EXIF data
      sharpInstance = sharpInstance.rotate();

      // Optimize based on format
      if (mimeType === 'image/jpeg') {
        return sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      } else if (mimeType === 'image/png') {
        return sharpInstance
          .png({ compressionLevel: 8, progressive: true })
          .toBuffer();
      } else if (mimeType === 'image/webp') {
        return sharpInstance
          .webp({ quality: 85 })
          .toBuffer();
      }

      return buffer;
    } catch (error) {
      logger.error('Image optimization failed:', error);
      return buffer; // Return original if optimization fails
    }
  }

  private async generateThumbnail(
    buffer: Buffer,
    purpose: string,
    fileId: string,
    config: { width: number; height: number; suffix: string }
  ): Promise<string> {
    const thumbnailBuffer = await sharp(buffer)
      .resize(config.width, config.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    const thumbnailFilename = `${fileId}${config.suffix}.jpg`;

    if (this.s3Client) {
      const thumbnailPath = `${purpose}/thumbnails/${thumbnailFilename}`;
      return this.uploadToS3(thumbnailBuffer, thumbnailPath, 'image/jpeg');
    } else {
      await this.uploadToLocal(thumbnailBuffer, `${purpose}/thumbnails`, thumbnailFilename);
      return `${this.baseUrl}/files/${purpose}/thumbnails/${thumbnailFilename}`;
    }
  }

  private async uploadToS3(buffer: Buffer, key: string, contentType: string): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 not configured');
    }

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType
    });

    await this.s3Client.send(command);
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }

  private async uploadToLocal(buffer: Buffer, directory: string, filename: string): Promise<string> {
    const dirPath = path.join(this.uploadPath, directory);
    await fs.mkdir(dirPath, { recursive: true });

    const filePath = path.join(dirPath, filename);
    await fs.writeFile(filePath, buffer);

    return path.join(directory, filename).replace(/\\/g, '/');
  }

  private async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client) return;

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key
    });

    await this.s3Client.send(command);
  }

  private async deleteFromLocal(filePath: string): Promise<void> {
    try {
      await fs.unlink(path.join(this.uploadPath, filePath));
    } catch (error) {
      logger.error('Failed to delete local file:', error);
    }
  }

  private async getImageDimensions(buffer: Buffer): Promise<{ width?: number; height?: number }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width,
        height: metadata.height
      };
    } catch (error) {
      return {};
    }
  }

  private async streamToBuffer(stream: any): Promise<Buffer> {
    const chunks: Buffer[] = [];
    
    return new Promise((resolve, reject) => {
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('error', reject);
      stream.on('end', () => resolve(Buffer.concat(chunks)));
    });
  }
}
