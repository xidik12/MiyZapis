import { apiClient } from './api';
import { API_ENDPOINTS } from '../config/environment';
import { ApiResponse } from '../types';

export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export interface FileUploadOptions {
  type?: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate' | 'payment_qr';
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types
}

export class FileUploadService {
  // Upload a single file (using presigned URL to bypass Railway timeout)
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
    console.log('[FileUploadService] uploadFile called', { fileName: file.name, size: file.size, type: file.type, options });
    try {
      // Validate file before upload
      console.log('[FileUploadService] Validating file...');
      this.validateFile(file, options);
      console.log('[FileUploadService] File validation passed');

      // Step 1: Get presigned URL from backend (small API call, fast)
      console.log('[FileUploadService] Getting presigned URL from backend...');
      const presignedData = await apiClient.post<{uploadUrl: string; fileUrl: string; key: string}>('/files/presigned-upload', {
        filename: file.name,
        contentType: file.type,
        type: options.type,
        folder: options.folder
      });

      if (!presignedData.success || !presignedData.data) {
        throw new Error('Failed to get presigned URL');
      }

      console.log('[FileUploadService] Presigned URL received, uploading directly to S3...');

      // Step 2: Upload directly to S3 (bypasses Railway completely!)
      const uploadResponse = await fetch(presignedData.data.uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`S3 upload failed: ${uploadResponse.statusText}`);
      }

      console.log('[FileUploadService] S3 upload successful! Confirming with backend...');

      // Step 3: Confirm upload with backend to create database record (small API call, fast)
      const confirmResponse = await apiClient.post<FileUploadResponse>('/files/confirm-upload', {
        key: presignedData.data.key,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        purpose: options.type || 'general'
      });

      if (!confirmResponse.success || !confirmResponse.data) {
        throw new Error('Failed to confirm upload');
      }

      console.log('[FileUploadService] Upload confirmed! Returning:', confirmResponse.data);
      return confirmResponse.data;
    } catch (error: any) {
      console.error('[FileUploadService] Upload error:', error);
      console.error('[FileUploadService] Error details:', {
        apiError: error.apiError,
        response: error.response?.data,
        message: error.message
      });
      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Failed to upload file';
      throw new Error(errorMessage);
    }
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
