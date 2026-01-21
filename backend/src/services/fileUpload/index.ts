import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import fs from 'fs/promises';
import path from 'path';

// Optional AWS SDK import
let AWS: any = null;
try {
  AWS = require('aws-sdk');
} catch (error) {
  logger.info('AWS SDK not available, using local file storage only');
}

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

const runWithTimeout = async <T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise;
  }

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const isRailwayEnv = !!(
  process.env.RAILWAY_ENVIRONMENT ||
  process.env.RAILWAY_SERVICE_NAME ||
  process.env.RAILWAY_PROJECT_NAME ||
  process.env.RAILWAY_SERVICE ||
  process.env.RAILWAY_PROJECT
);
const enableS3Storage = process.env.ENABLE_S3_STORAGE === 'true';
const explicitLocalStorage = process.env.FORCE_LOCAL_STORAGE === 'true' ||
  process.env.FILE_STORAGE === 'local' ||
  process.env.USE_LOCAL_STORAGE === 'true';
const forceLocalStorage = explicitLocalStorage || (!enableS3Storage && isRailwayEnv);

export class FileUploadService {
  private prisma: PrismaClient;
  private s3?: any;
  private useS3: boolean;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.useS3 = !forceLocalStorage &&
      !!(AWS && config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3.bucket);
    
    if (this.useS3) {
      this.setupS3();
    } else if (forceLocalStorage) {
      logger.info('Local storage forced for uploads', {
        isRailwayEnv,
        enableS3Storage,
        explicitLocalStorage,
        fileStorageEnv: process.env.FILE_STORAGE,
        forceLocalStorageEnv: process.env.FORCE_LOCAL_STORAGE,
        useLocalStorageEnv: process.env.USE_LOCAL_STORAGE
      });
    }

    logger.info('File upload storage mode', {
      useS3: this.useS3,
      enableS3Storage,
      forceLocalStorage,
      explicitLocalStorage,
      isRailwayEnv,
      awsSdkAvailable: !!AWS,
      hasAccessKey: !!config.aws.accessKeyId,
      hasSecretKey: !!config.aws.secretAccessKey,
      hasBucket: !!config.aws.s3.bucket
    });
  }

  isUsingS3(): boolean {
    return this.useS3;
  }

  private setupS3() {
    if (!AWS) {
      throw new Error('AWS SDK not available');
    }
    
    AWS.config.update({
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
      region: config.aws.region
    });

    this.s3 = new AWS.S3();
  }

  async uploadToStorage(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    if (this.useS3 && this.s3) {
      return this.uploadToS3(buffer, filename, mimeType);
    } else {
      return this.uploadToLocal(buffer, filename);
    }
  }

  private async uploadToS3(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    try {
      const params = {
        Bucket: config.aws.s3.bucket!,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
        ACL: 'private', // ✅ SECURITY FIX: Changed from 'public-read' to 'private'
        ServerSideEncryption: 'AES256' // ✅ SECURITY FIX: Add encryption at rest
      };

      const result = await this.s3!.upload(params).promise();

      logger.info('File uploaded to S3 successfully (private)', {
        filename,
        bucket: config.aws.s3.bucket,
        // Don't log full URL as files are now private
      });

      // Return the S3 key instead of public URL (presigned URLs will be generated on demand)
      return filename;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  private async uploadToLocal(buffer: Buffer, filename: string): Promise<string> {
    try {
      // More robust Railway detection - Railway might not set the specific vars we expect
      const isRailway = !!(
        process.env.RAILWAY_ENVIRONMENT || 
        process.env.RAILWAY_SERVICE_NAME || 
        process.env.RAILWAY_PROJECT_NAME ||
        process.env.RAILWAY_SERVICE ||
        process.env.RAILWAY_PROJECT ||
        // Railway typically runs in production with PORT but without Vercel/Netlify vars
        (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
      );
      
      const parsedTimeout = Number.parseInt(process.env.UPLOAD_IO_TIMEOUT_MS || '8000', 10);
      const ioTimeoutMs = Number.isFinite(parsedTimeout) ? parsedTimeout : 8000;

      // Railway permission fix: Try multiple upload directories in order of preference
      const rawUploadOptions = isRailway
        ? [process.env.UPLOAD_DIR, '/app/uploads', '/tmp/uploads', './uploads', '/tmp']
        : [process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), './uploads', '/tmp/uploads'];
      const uploadOptions = Array.from(new Set(rawUploadOptions.filter(Boolean) as string[]));
      
      logger.info('Upload directory options', {
        RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
        RAILWAY_SERVICE_NAME: process.env.RAILWAY_SERVICE_NAME,
        RAILWAY_PROJECT_NAME: process.env.RAILWAY_PROJECT_NAME,
        RAILWAY_SERVICE: process.env.RAILWAY_SERVICE,
        RAILWAY_PROJECT: process.env.RAILWAY_PROJECT,
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        isRailway: !!isRailway,
        uploadOptions,
        cwd: process.cwd()
      });
      
      let uploadsDir: string | null = null;
      let testFilePath: string | null = null;
      
      // Test each upload directory to find one that works
      for (const testDir of uploadOptions) {
        try {
          logger.info(`Testing upload directory: ${testDir}`);
          
          // Try to create directory if it doesn't exist
          try {
            await runWithTimeout(fs.access(testDir), ioTimeoutMs, `fs.access ${testDir}`);
          } catch {
            await runWithTimeout(fs.mkdir(testDir, { recursive: true, mode: 0o755 }), ioTimeoutMs, `fs.mkdir ${testDir}`);
          }
          
          // Test write permissions by writing a small test file
          testFilePath = path.join(testDir, 'write-test-' + Date.now() + '.txt');
          await runWithTimeout(
            fs.writeFile(testFilePath, 'test', { mode: 0o644 }),
            ioTimeoutMs,
            `fs.writeFile ${testFilePath}`
          );
          await runWithTimeout(fs.unlink(testFilePath), ioTimeoutMs, `fs.unlink ${testFilePath}`);
          
          // If we get here, the directory works
          uploadsDir = testDir;
          logger.info(`Upload directory confirmed working: ${uploadsDir}`);
          break;
        } catch (error) {
          logger.warn(`Upload directory ${testDir} failed test:`, error instanceof Error ? error.message : error);
          continue;
        }
      }
      
      if (!uploadsDir) {
        throw new Error('No writable upload directory found. All options failed permission tests.');
      }
      
      // For Railway, use flat directory structure to avoid permission issues
      let finalFilename = filename;
      if (isRailway) {
        // Replace directory separators with underscores for flat structure
        finalFilename = filename.replace(/[/\\]/g, '_');
        logger.info('Railway environment detected, using flat filename structure', {
          original: filename,
          flattened: finalFilename
        });
      }

      const filePath = path.join(uploadsDir, finalFilename);
      
      // For local development, ensure subdirectory exists
      if (!isRailway && filename.includes('/')) {
        const fileDir = path.dirname(filePath);
        try {
          await runWithTimeout(fs.access(fileDir), ioTimeoutMs, `fs.access ${fileDir}`);
        } catch {
          await runWithTimeout(fs.mkdir(fileDir, { recursive: true, mode: 0o755 }), ioTimeoutMs, `fs.mkdir ${fileDir}`);
        }
      }

      // Write the actual file
      await runWithTimeout(
        fs.writeFile(filePath, buffer, { mode: 0o644 }),
        ioTimeoutMs,
        `fs.writeFile ${filePath}`
      );

      // Return URL for accessing the file
      const fileUrl = `/uploads/${finalFilename}`;
      
      logger.info('File uploaded locally successfully', {
        filename: finalFilename,
        path: filePath,
        url: fileUrl,
        uploadsDir,
        isRailway: !!isRailway
      });

      return fileUrl;
    } catch (error) {
      logger.error('Error uploading file locally:', error);
      throw new Error(`Failed to upload file locally: ${error instanceof Error ? error.message : error}`);
    }
  }

  async deleteFromStorage(fileUrl: string): Promise<void> {
    if (this.useS3 && this.s3) {
      await this.deleteFromS3(fileUrl);
    } else {
      await this.deleteFromLocal(fileUrl);
    }
  }

  private async deleteFromS3(fileUrl: string): Promise<void> {
    try {
      // Extract S3 key from URL
      const urlParts = fileUrl.split('/');
      const bucketIndex = urlParts.findIndex(part => part === config.aws.s3.bucket);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid S3 URL format');
      }

      const key = urlParts.slice(bucketIndex + 1).join('/');

      const params = {
        Bucket: config.aws.s3.bucket!,
        Key: key
      };

      await this.s3!.deleteObject(params).promise();
      
      logger.info('File deleted from S3 successfully', { key });
    } catch (error) {
      logger.error('Error deleting from S3:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  private async deleteFromLocal(fileUrl: string): Promise<void> {
    try {
      // Convert URL to local file path
      const filename = fileUrl.replace('/uploads/', '');
      const isRailway = !!(
        process.env.RAILWAY_ENVIRONMENT ||
        process.env.RAILWAY_SERVICE_NAME ||
        process.env.RAILWAY_PROJECT_NAME ||
        process.env.RAILWAY_SERVICE ||
        process.env.RAILWAY_PROJECT ||
        (process.env.PORT && process.env.NODE_ENV === 'production' && !process.env.VERCEL && !process.env.NETLIFY)
      );
      const parsedTimeout = Number.parseInt(process.env.UPLOAD_IO_TIMEOUT_MS || '8000', 10);
      const ioTimeoutMs = Number.isFinite(parsedTimeout) ? parsedTimeout : 8000;
      const rawUploadOptions = isRailway
        ? [process.env.UPLOAD_DIR, '/app/uploads', '/tmp/uploads', './uploads', '/tmp']
        : [process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'), './uploads', '/tmp/uploads'];
      const uploadOptions = Array.from(new Set(rawUploadOptions.filter(Boolean) as string[]));

      let filePath: string | null = null;

      for (const dir of uploadOptions) {
        const candidatePath = path.join(dir, filename);
        try {
          await runWithTimeout(fs.access(candidatePath), ioTimeoutMs, `fs.access ${candidatePath}`);
          filePath = candidatePath;
          break;
        } catch {
          continue;
        }
      }

      try {
        if (!filePath) {
          throw new Error('File not found in any upload directory');
        }
        await runWithTimeout(fs.unlink(filePath), ioTimeoutMs, `fs.unlink ${filePath}`);
        logger.info('File deleted locally successfully', { filePath, searched: uploadOptions });
      } catch (error) {
        // File doesn't exist or can't be deleted
        logger.warn('File not found for deletion:', {
          filename,
          searched: uploadOptions
        });
      }
    } catch (error) {
      logger.error('Error deleting file locally:', error);
      throw new Error('Failed to delete file locally');
    }
  }

  async getFileUrl(filename: string, expiresIn = 3600): Promise<string> {
    if (this.useS3) {
      // ✅ SECURITY FIX: Use presigned URLs for private S3 files
      return this.generatePresignedUrl(filename, expiresIn);
    } else {
      return `/uploads/${filename}`;
    }
  }

  async generatePresignedUrl(filename: string, expiresIn = 3600): Promise<string> {
    if (!this.useS3 || !this.s3) {
      throw new Error('Presigned URLs are only available with S3 storage');
    }

    try {
      const params = {
        Bucket: config.aws.s3.bucket!,
        Key: filename,
        Expires: expiresIn
      };

      const url = this.s3.getSignedUrl('getObject', params);
      return url;
    } catch (error) {
      logger.error('Error generating presigned URL:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  async processImageSizes(
    originalBuffer: Buffer,
    filename: string,
    sizes: Array<{ width: number; height: number; suffix: string }>
  ): Promise<Array<{ size: string; url: string }>> {
    // This would use sharp to create different image sizes
    // For now, return placeholder
    return sizes.map(size => ({
      size: size.suffix,
      url: `${filename}_${size.suffix}`
    }));
  }

  async validateFile(buffer: Buffer, mimeType: string, maxSize: number): Promise<boolean> {
    // ✅ SECURITY FIX: Check file size first
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // ✅ SECURITY FIX: Validate magic bytes (actual file content)
    const detectedType = await getFileTypeFromBuffer(buffer);

    if (!detectedType) {
      logger.warn('Unable to determine file type from buffer', {
        claimedMimeType: mimeType,
        bufferSize: buffer.length
      });
      throw new Error('Unable to determine file type. File may be corrupted or invalid.');
    }

    // Define allowed MIME types with their expected magic bytes
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'video/mp4',
      'video/quicktime',
      'audio/mpeg',
      'audio/wav',
      'audio/mp4' // M4A files
    ];

    // ✅ SECURITY FIX: Check if detected type matches allowed types
    if (!allowedTypes.includes(detectedType.mime)) {
      logger.warn('File type not allowed', {
        detectedMime: detectedType.mime,
        detectedExt: detectedType.ext,
        claimedMimeType: mimeType
      });
      throw new Error(`File type ${detectedType.mime} is not allowed (detected from file content)`);
    }

    // ✅ SECURITY FIX: Verify that claimed MIME type matches detected type
    // Allow some flexibility for compatible types
    const isCompatible = this.areTypesCompatible(mimeType, detectedType.mime);

    if (!isCompatible) {
      logger.warn('MIME type mismatch detected - possible file upload attack', {
        claimedMimeType: mimeType,
        detectedMime: detectedType.mime,
        detectedExt: detectedType.ext,
        bufferSize: buffer.length
      });
      throw new Error(
        `File type mismatch: claimed ${mimeType} but detected ${detectedType.mime}. ` +
        `This may indicate a malicious file.`
      );
    }

    logger.info('File validation successful', {
      mimeType: detectedType.mime,
      extension: detectedType.ext,
      size: buffer.length
    });

    return true;
  }

  // Helper method to check if MIME types are compatible
  private areTypesCompatible(claimed: string, detected: string): boolean {
    // Exact match
    if (claimed === detected) return true;

    // Allow some compatible type variations
    const compatibleTypes: Record<string, string[]> = {
      'image/jpg': ['image/jpeg'],
      'image/jpeg': ['image/jpg'],
      'audio/mp4': ['audio/mpeg', 'audio/m4a'],
      'audio/mpeg': ['audio/mp3', 'audio/mp4'],
    };

    const allowedVariations = compatibleTypes[claimed] || [];
    return allowedVariations.includes(detected);
  }

  async getStorageStats(): Promise<any> {
    try {
      const totalFiles = await this.prisma.file.count();
      const totalSize = await this.prisma.file.aggregate({
        _sum: { size: true }
      });

      const filesByType = await this.prisma.file.groupBy({
        by: ['mimeType'],
        _count: { _all: true },
        _sum: { size: true }
      });

      const filesByPurpose = await this.prisma.file.groupBy({
        by: ['purpose'],
        _count: { _all: true },
        _sum: { size: true }
      });

      return {
        totalFiles,
        totalSize: totalSize._sum.size || 0,
        breakdown: {
          byType: filesByType,
          byPurpose: filesByPurpose
        }
      };
    } catch (error) {
      logger.error('Error getting storage stats:', error);
      throw error;
    }
  }

  async cleanupOrphanedFiles(): Promise<number> {
    try {
      // Find files that are not referenced by any entity
      const orphanedFiles = await this.prisma.file.findMany({
        where: {
          AND: [
            { entityId: null },
            { purpose: { not: 'avatar' } }, // Keep avatars even if not linked
            { createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // Older than 7 days
          ]
        }
      });

      let deletedCount = 0;

      for (const file of orphanedFiles) {
        try {
          await this.deleteFromStorage(file.url);
          await this.prisma.file.delete({ where: { id: file.id } });
          deletedCount++;
        } catch (error) {
          logger.error(`Failed to delete orphaned file ${file.id}:`, error);
        }
      }

      logger.info(`Cleaned up ${deletedCount} orphaned files`);
      return deletedCount;
    } catch (error) {
      logger.error('Error cleaning up orphaned files:', error);
      throw error;
    }
  }
}
