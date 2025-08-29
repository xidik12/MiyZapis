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

export class FileUploadService {
  private prisma: PrismaClient;
  private s3?: any;
  private useS3: boolean;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.useS3 = !!(AWS && config.aws.accessKeyId && config.aws.secretAccessKey && config.aws.s3.bucket);
    
    if (this.useS3) {
      this.setupS3();
    }
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
        ACL: 'public-read'
      };

      const result = await this.s3!.upload(params).promise();
      
      logger.info('File uploaded to S3 successfully', {
        filename,
        location: result.Location
      });

      return result.Location;
    } catch (error) {
      logger.error('Error uploading to S3:', error);
      throw new Error('Failed to upload file to S3');
    }
  }

  private async uploadToLocal(buffer: Buffer, filename: string): Promise<string> {
    try {
      // Use /tmp for Railway, local uploads for development
      const uploadsDir = process.env.UPLOAD_DIR || (process.env.RAILWAY_ENVIRONMENT ? '/tmp/uploads' : path.join(process.cwd(), 'uploads'));
      
      // For Railway, use flat directory structure to avoid permission issues
      let finalFilename = filename;
      if (process.env.RAILWAY_ENVIRONMENT) {
        // Replace directory separators with underscores for flat structure
        finalFilename = filename.replace(/[/\\]/g, '_');
        logger.info('Railway environment detected, using flat filename structure', {
          original: filename,
          flattened: finalFilename
        });
      }
      
      // Ensure uploads directory exists
      try {
        await fs.access(uploadsDir);
      } catch {
        await fs.mkdir(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, finalFilename);
      
      // For local development, ensure subdirectory exists
      if (!process.env.RAILWAY_ENVIRONMENT) {
        const fileDir = path.dirname(filePath);
        try {
          await fs.access(fileDir);
        } catch {
          await fs.mkdir(fileDir, { recursive: true });
        }
      }

      await fs.writeFile(filePath, buffer);

      // Return URL for accessing the file
      const fileUrl = `/uploads/${finalFilename}`;
      
      logger.info('File uploaded locally successfully', {
        filename: finalFilename,
        path: filePath,
        url: fileUrl,
        isRailway: !!process.env.RAILWAY_ENVIRONMENT
      });

      return fileUrl;
    } catch (error) {
      logger.error('Error uploading file locally:', error);
      throw new Error('Failed to upload file locally');
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
      const uploadsDir = process.env.UPLOAD_DIR || (process.env.RAILWAY_ENVIRONMENT ? '/tmp/uploads' : path.join(process.cwd(), 'uploads'));
      const filePath = path.join(uploadsDir, filename);

      try {
        await fs.access(filePath);
        await fs.unlink(filePath);
        logger.info('File deleted locally successfully', { filePath });
      } catch (error) {
        // File doesn't exist or can't be deleted
        logger.warn('File not found for deletion:', filePath);
      }
    } catch (error) {
      logger.error('Error deleting file locally:', error);
      throw new Error('Failed to delete file locally');
    }
  }

  async getFileUrl(filename: string): Promise<string> {
    if (this.useS3) {
      return `${config.aws.s3.url}/${filename}`;
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
    // Check file size
    if (buffer.length > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize} bytes`);
    }

    // Additional validation based on mime type
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
      'audio/wav'
    ];

    if (!allowedTypes.includes(mimeType)) {
      throw new Error(`File type ${mimeType} is not allowed`);
    }

    return true;
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