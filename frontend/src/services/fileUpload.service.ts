import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';
import { ApiResponse } from '../types';
import { compressImage, compressAvatar, compressPortfolio, compressService } from '../utils/imageCompression';

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface FileUploadOptions {
  type?: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate' | 'payment';
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types
}

export class FileUploadService {
  // Convert File to Base64 string
  private async convertFileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Upload a single file using Base64 JSON (bypasses Railway's multipart timeout)
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
    console.log('[FileUploadService] uploadFile called', {
      fileName: file.name,
      size: file.size,
      sizeKB: (file.size / 1024).toFixed(2) + 'KB',
      type: file.type,
      options
    });

    try {
      // Validate file before upload
      console.log('[FileUploadService] Validating file...');
      this.validateFile(file, options);
      console.log('[FileUploadService] File validation passed');

      let fileToUpload = file;

      // STEP 1: Compress image if it's an image file (makes upload much faster!)
      if (this.isImageFile(file)) {
        console.log('[FileUploadService] 🗜️ Image detected - compressing before upload...');

        try {
          // Use appropriate compression based on purpose
          if (options.type === 'avatar') {
            fileToUpload = await compressAvatar(file);
          } else if (options.type === 'portfolio') {
            fileToUpload = await compressPortfolio(file);
          } else if (options.type === 'service') {
            fileToUpload = await compressService(file);
          } else {
            fileToUpload = await compressImage(file);
          }

          console.log('[FileUploadService] ✅ Compression complete:', {
            originalSize: (file.size / 1024).toFixed(2) + 'KB',
            compressedSize: (fileToUpload.size / 1024).toFixed(2) + 'KB',
            reduction: (((file.size - fileToUpload.size) / file.size) * 100).toFixed(1) + '%'
          });
        } catch (compressionError) {
          console.warn('[FileUploadService] ⚠️ Compression failed, using original:', compressionError);
          fileToUpload = file;
        }
      }

      // STEP 2: Convert to Base64 (bypasses Railway's multipart upload timeout!)
      console.log('[FileUploadService] STEP 2: Converting to Base64...');
      const base64Data = await this.convertFileToBase64(fileToUpload);
      const base64Size = base64Data.length;
      console.log('[FileUploadService] ✅ Base64 conversion complete:', {
        base64SizeKB: (base64Size / 1024).toFixed(2) + 'KB',
        overhead: (((base64Size - fileToUpload.size) / fileToUpload.size) * 100).toFixed(1) + '%'
      });

      // STEP 3: Send as JSON POST (Railway doesn't block JSON, only multipart!)
      console.log('[FileUploadService] STEP 3: Sending Base64 JSON to backend...');
      const response = await apiClient.post<FileUploadResponse>('/files/upload-base64', {
        base64Data,
        filename: file.name,
        purpose: options.type || 'general'
      });

      console.log('[FileUploadService] API response received:', response);

      if (!response.success || !response.data) {
        console.error('[FileUploadService] Invalid response format:', response);
        throw new Error(response.error?.message || 'Failed to upload file');
      }

      console.log('[FileUploadService] ✅ Upload successful! Returning:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[FileUploadService] Upload error:', error);
      console.error('[FileUploadService] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        apiError: error.apiError,
        response: error.response?.data
      });

      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to upload file';
      throw new Error(errorMessage);
    }
  }

  // Check if file is an image
  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/');
  }

  // Upload multiple files
  async uploadFiles(files: File[], options: FileUploadOptions = {}): Promise<FileUploadResponse[]> {
    try {
      const uploadPromises = files.map(file => this.uploadFile(file, options));
      return await Promise.all(uploadPromises);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to upload files';
      throw new Error(errorMessage);
    }
  }

  // Upload avatar specifically
  async uploadAvatar(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'avatar',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }

  // Upload portfolio images
  async uploadPortfolioImage(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'portfolio',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }

  // Upload service images
  async uploadServiceImage(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'service',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }

  // Upload certificate/document
  async uploadDocument(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'document',
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    });
  }

  // Upload certificate specifically
  async uploadCertificate(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'certificate',
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png']
    });
  }

  // Upload payment QR code
  async uploadPaymentQr(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'payment',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
    });
  }

  // Save external image (e.g., Google avatar) to backend storage
  async saveExternalImage(imageUrl: string, purpose: 'avatar' | 'portfolio' = 'avatar'): Promise<FileUploadResponse> {
    try {
      console.log('💾 Saving external image to backend:', imageUrl);

      const response = await apiClient.post<FileUploadResponse>('/files/save-external', {
        imageUrl,
        purpose
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to save external image');
      }

      console.log('✅ External image saved to backend:', response.data.url);
      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to save external image';
      throw new Error(errorMessage);
    }
  }

  // Delete a file
  async deleteFile(fileUrl: string): Promise<{ message: string }> {
    try {
      // Extract file ID from URL or use the full URL
      const fileId = this.extractFileIdFromUrl(fileUrl);
      
      const response = await apiClient.delete<{ message: string }>(`/files/${fileId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to delete file');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to delete file';
      throw new Error(errorMessage);
    }
  }

  // Get file info
  async getFileInfo(fileId: string): Promise<FileUploadResponse> {
    try {
      const response = await apiClient.get<FileUploadResponse>(`/files/${fileId}`);
      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get file info');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get file info';
      throw new Error(errorMessage);
    }
  }

  // Validate file before upload
  private validateFile(file: File, options: FileUploadOptions): void {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      const maxSizeMB = Math.round(options.maxSize / (1024 * 1024));
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`);
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }

    // Check if file is empty
    if (file.size === 0) {
      throw new Error('File is empty');
    }
  }

  // Extract file ID from URL
  private extractFileIdFromUrl(url: string): string {
    // This would depend on your URL structure
    // For now, assume the file ID is the last part of the URL
    const parts = url.split('/');
    return parts[parts.length - 1];
  }

  // Generate presigned URL for direct upload (if using S3 or similar)
  async getPresignedUploadUrl(filename: string, contentType: string, options: FileUploadOptions = {}): Promise<{
    uploadUrl: string;
    fileUrl: string;
    fields?: Record<string, string>;
  }> {
    try {
      const response = await apiClient.post<{
        uploadUrl: string;
        fileUrl: string;
        fields?: Record<string, string>;
      }>('/files/presigned-upload', {
        filename,
        contentType,
        type: options.type,
        folder: options.folder
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to get presigned upload URL');
      }

      return response.data;
    } catch (error: any) {
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to get presigned upload URL';
      throw new Error(errorMessage);
    }
  }

}

export const fileUploadService = new FileUploadService();
