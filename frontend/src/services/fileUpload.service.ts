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
  type?: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate';
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types
}

export class FileUploadService {
  // Upload a single file
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
    try {
      // Validate file before upload
      this.validateFile(file, options);

      // Log upload attempt
      console.log('📤 Uploading file:', {
        name: file.name,
        size: file.size,
        type: file.type,
        purpose: options.type,
        maxSize: options.maxSize
      });

      const formData = new FormData();
      formData.append('files', file); // Use 'files' field name for multer array upload

      const queryParams = new URLSearchParams();
      if (options.type) {
        queryParams.append('purpose', options.type);
      }
      if (options.folder) {
        queryParams.append('folder', options.folder);
      }

      const endpoint = `/files/upload${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      const response = await apiClient.post<FileUploadResponse[]>(endpoint, formData);

      if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
        throw new Error(response.error?.message || 'Upload succeeded but no response data received');
      }

      console.log('✅ Upload successful:', response.data[0]);
      return response.data[0]; // Return the first uploaded file
    } catch (error: any) {
      console.error('❌ Upload failed:', {
        error: error.message,
        fileName: file.name,
        fileSize: file.size,
        status: error.response?.status
      });

      // Provide specific error messages based on error type
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - file may be too large or connection is slow. Please try again.');
      }

      if (error.response?.status === 413) {
        throw new Error('File too large for server. Please reduce file size and try again.');
      }

      if (error.response?.status === 401) {
        throw new Error('Authentication failed - please login again.');
      }

      if (error.response?.status === 400) {
        const message = error.response?.data?.error?.message || error.response?.data?.message;
        throw new Error(message || 'Invalid file or request. Please check file type and size.');
      }

      const errorMessage = error.apiError?.message || error.response?.data?.error?.message || error.message || 'Network error. Please check your connection and try again.';
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
