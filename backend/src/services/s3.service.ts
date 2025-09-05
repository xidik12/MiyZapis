import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import path from 'path';

interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl?: string;
}

interface UploadOptions {
  purpose?: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate';
  resize?: {
    width?: number;
    height?: number;
    quality?: number;
  };
  userId?: string;
}

interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  size: number;
  mimeType: string;
}

export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.bucketName = config.bucketName;
    this.publicUrl = config.publicUrl || `https://${config.bucketName}.s3.${config.region}.amazonaws.com`;

    console.log('🌅 S3Service initialized:', {
      region: config.region,
      bucket: config.bucketName,
      publicUrl: this.publicUrl
    });
  }

  /**
   * Upload file to S3
   */
  async uploadFile(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    try {
      console.log('📤 Starting S3 upload:', {
        originalName,
        mimeType,
        size: buffer.length,
        options
      });

      // Process image if needed
      let processedBuffer = buffer;
      let finalMimeType = mimeType;

      if (this.isImageFile(mimeType) && options.resize) {
        console.log('🖼️ Processing image with sharp...');
        const sharpInstance = sharp(buffer);
        
        if (options.resize.width || options.resize.height) {
          sharpInstance.resize(options.resize.width, options.resize.height, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Convert to WebP for better compression if it's not already
        if (mimeType !== 'image/webp') {
          sharpInstance.webp({ quality: options.resize.quality || 85 });
          finalMimeType = 'image/webp';
        }

        processedBuffer = await sharpInstance.toBuffer();
        console.log('✅ Image processed:', {
          originalSize: buffer.length,
          processedSize: processedBuffer.length,
          compression: `${(((buffer.length - processedBuffer.length) / buffer.length) * 100).toFixed(1)}%`
        });
      }

      // Generate unique key
      const key = this.generateKey(originalName, options);

      // Upload to S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: processedBuffer,
        ContentType: finalMimeType,
        ACL: 'public-read',
        Metadata: {
          originalName: originalName,
          purpose: options.purpose || 'general',
          userId: options.userId || 'unknown',
          uploadedAt: new Date().toISOString()
        }
      });

      await this.s3Client.send(command);

      const result: UploadResult = {
        key,
        url: `${this.publicUrl}/${key}`,
        bucket: this.bucketName,
        size: processedBuffer.length,
        mimeType: finalMimeType
      };

      console.log('✅ S3 upload successful:', {
        key,
        url: result.url,
        size: result.size
      });

      return result;
    } catch (error) {
      console.error('❌ S3 upload failed:', error);
      throw new Error(`S3 upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete file from S3
   */
  async deleteFile(key: string): Promise<void> {
    try {
      console.log('🗑️ Deleting file from S3:', key);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      await this.s3Client.send(command);
      console.log('✅ File deleted from S3:', key);
    } catch (error) {
      console.error('❌ S3 delete failed:', error);
      throw new Error(`S3 delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned URL for direct upload
   */
  async getPresignedUploadUrl(
    originalName: string,
    contentType: string,
    options: UploadOptions = {}
  ): Promise<{
    uploadUrl: string;
    fileUrl: string;
    key: string;
    fields?: Record<string, string>;
  }> {
    try {
      const key = this.generateKey(originalName, options);
      
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: contentType,
        ACL: 'public-read',
        Metadata: {
          originalName: originalName,
          purpose: options.purpose || 'general',
          userId: options.userId || 'unknown'
        }
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      const fileUrl = `${this.publicUrl}/${key}`;

      console.log('✅ Generated presigned upload URL:', {
        key,
        fileUrl,
        expiresIn: '1 hour'
      });

      return {
        uploadUrl,
        fileUrl,
        key
      };
    } catch (error) {
      console.error('❌ Presigned URL generation failed:', error);
      throw new Error(`Presigned URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate presigned URL for download (useful for private files)
   */
  async getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key
      });

      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      console.log('✅ Generated presigned download URL for:', key);
      
      return url;
    } catch (error) {
      console.error('❌ Presigned download URL generation failed:', error);
      throw new Error(`Presigned download URL generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if S3 connection is working
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to list objects (this tests credentials and bucket access)
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: 'test-connection-file-that-should-not-exist'
      });

      try {
        await this.s3Client.send(command);
      } catch (error: any) {
        // If we get NoSuchKey error, it means we can connect to the bucket
        if (error.name === 'NoSuchKey') {
          console.log('✅ S3 connection test successful');
          return true;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('❌ S3 connection test failed:', error);
      return false;
    }
  }

  /**
   * Generate unique key for S3 object
   */
  private generateKey(originalName: string, options: UploadOptions): string {
    const timestamp = Date.now();
    const uuid = uuidv4().substring(0, 8);
    const ext = path.extname(originalName) || '.jpg';
    const purpose = options.purpose || 'general';
    const userId = options.userId || 'unknown';

    // Generate a clean filename
    const basename = path.basename(originalName, ext)
      .replace(/[^a-zA-Z0-9]/g, '-')
      .substring(0, 20);

    return `${purpose}/${userId}/${timestamp}-${uuid}-${basename}${ext}`;
  }

  /**
   * Check if file is an image
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeMap: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
    };

    return mimeMap[mimeType] || '.bin';
  }
}

// Singleton instance
let s3ServiceInstance: S3Service | null = null;

export function initializeS3Service(config: S3Config): S3Service {
  if (!s3ServiceInstance) {
    s3ServiceInstance = new S3Service(config);
  }
  return s3ServiceInstance;
}

export function getS3Service(): S3Service | null {
  return s3ServiceInstance;
}