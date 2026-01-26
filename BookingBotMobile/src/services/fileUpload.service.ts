// File upload service - adapted for React Native with image compression
import { apiClient } from './api';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  format?: 'jpeg' | 'png';
}

const DEFAULT_COMPRESSION: CompressionOptions = {
  maxWidth: 1920,
  maxHeight: 1920,
  quality: 0.8,
  format: 'jpeg',
};

export class FileUploadService {
  /**
   * Compress an image before upload
   * Reduces file size while maintaining quality
   */
  async compressImage(
    fileUri: string,
    options: CompressionOptions = {}
  ): Promise<string> {
    try {
      const {
        maxWidth = DEFAULT_COMPRESSION.maxWidth,
        maxHeight = DEFAULT_COMPRESSION.maxHeight,
        quality = DEFAULT_COMPRESSION.quality,
        format = DEFAULT_COMPRESSION.format,
      } = options;

      // Check if file is an image
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (!fileInfo.exists) {
        throw new Error('File does not exist');
      }

      // Get file extension
      const extension = fileUri.split('.').pop()?.toLowerCase();
      const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '');

      if (!isImage) {
        // Not an image, return original URI
        return fileUri;
      }

      // Compress the image
      const manipResult = await ImageManipulator.manipulateAsync(
        fileUri,
        [
          {
            resize: {
              width: maxWidth,
              height: maxHeight,
            },
          },
        ],
        {
          compress: quality,
          format: format === 'jpeg' ? ImageManipulator.SaveFormat.JPEG : ImageManipulator.SaveFormat.PNG,
        }
      );

      console.log('✅ Image compressed:', {
        original: fileUri,
        compressed: manipResult.uri,
        originalSize: fileInfo.size,
      });

      return manipResult.uri;
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      // Return original URI if compression fails
      return fileUri;
    }
  }

  /**
   * Upload file with automatic image compression
   * Images are compressed before upload to reduce bandwidth and storage
   */
  async uploadFile(
    fileUri: string,
    purpose: 'avatar' | 'portfolio' | 'service' = 'avatar',
    options?: CompressionOptions
  ): Promise<{
    url: string;
    path: string;
    filename: string;
  }> {
    // Compress image if applicable
    const finalUri = await this.compressImage(fileUri, options);

    const response = await apiClient.upload<Array<{
      url: string;
      path: string;
      filename: string;
    }>>(`/files/upload?purpose=${purpose}`, finalUri);

    if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error(response.error?.message || 'Failed to upload file');
    }

    return response.data[0];
  }

  /**
   * Upload multiple files with automatic image compression
   * Each image is compressed before upload
   */
  async uploadFiles(
    fileUris: string[],
    purpose: 'avatar' | 'portfolio' | 'service' = 'service',
    options?: CompressionOptions
  ): Promise<Array<{
    url: string;
    path: string;
    filename: string;
  }>> {
    // Upload files one by one with compression
    const uploadPromises = fileUris.map(uri => this.uploadFile(uri, purpose, options));
    return Promise.all(uploadPromises);
  }

  /**
   * Get optimal compression settings based on purpose
   */
  getCompressionOptions(purpose: 'avatar' | 'portfolio' | 'service'): CompressionOptions {
    switch (purpose) {
      case 'avatar':
        return {
          maxWidth: 512,
          maxHeight: 512,
          quality: 0.85,
          format: 'jpeg',
        };
      case 'portfolio':
        return {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.9,
          format: 'jpeg',
        };
      case 'service':
        return {
          maxWidth: 1280,
          maxHeight: 1280,
          quality: 0.85,
          format: 'jpeg',
        };
      default:
        return DEFAULT_COMPRESSION;
    }
  }

  // Delete file
  async deleteFile(filePath: string): Promise<{ message: string }> {
    const response = await apiClient.delete<{ message: string }>(`/files/delete`, {
      data: { path: filePath }
    });
    if (!response.success || !response.data) {
      throw new Error(response.error?.message || 'Failed to delete file');
    }
    return response.data;
  }
}

export const fileUploadService = new FileUploadService();

