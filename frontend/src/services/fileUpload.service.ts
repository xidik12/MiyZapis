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
  // Upload a single file (simplified from development branch)
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
    try {
      console.log('📤 [FileUploadService] Starting upload:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        options
      });

      // Validate file before upload
      this.validateFile(file, options);
      console.log('✅ [FileUploadService] Validation passed');

      const formData = new FormData();
      formData.append('files', file); // Use 'files' field name for multer array upload
      console.log('📦 [FileUploadService] FormData created');

      const queryParams = new URLSearchParams();
      if (options.type) {
        queryParams.append('purpose', options.type);
      }
      if (options.folder) {
        queryParams.append('folder', options.folder);
      }

      const endpoint = `/files/upload${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
      console.log('🌐 [FileUploadService] Sending POST request to:', endpoint);
      console.log('⏱️ [FileUploadService] Request started at:', new Date().toISOString());

      const response = await apiClient.post<FileUploadResponse[]>(endpoint, formData);

      console.log('✅ [FileUploadService] Response received:', response);

      if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.error('❌ [FileUploadService] Invalid response:', response);
        throw new Error(response.error?.message || 'Failed to upload file');
      }

      console.log('🎉 [FileUploadService] Upload successful!', response.data[0]);
      return response.data[0]; // Return the first uploaded file
    } catch (error: any) {
      console.error('❌ [FileUploadService] Upload error:', {
        message: error.message,
        apiError: error.apiError,
        response: error.response,
        stack: error.stack
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
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif'
      ]
    });
  }

  // Upload portfolio images
  async uploadPortfolioImage(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'portfolio',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif'
      ]
    });
  }

  // Upload service images
  async uploadServiceImage(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'service',
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif'
      ]
    });
  }

  // Upload certificate/document
  async uploadDocument(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'document',
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });
  }

  // Upload certificate specifically
  async uploadCertificate(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'certificate',
      maxSize: 20 * 1024 * 1024, // 20MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif'
      ]
    });
  }

  // Upload payment QR code (image only)
  async uploadPaymentQr(file: File): Promise<FileUploadResponse> {
    return this.uploadFile(file, {
      type: 'payment_qr',
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
        'image/tiff',
        'image/heic',
        'image/heif',
        'image/avif'
      ]
    });
  }

  // Save external image (e.g., Google avatar) to backend storage
  async saveExternalImage(imageUrl: string, purpose: 'avatar' | 'portfolio' = 'avatar'): Promise<FileUploadResponse> {
    try {
      const response = await apiClient.post<FileUploadResponse>('/files/save-external', {
        imageUrl,
        purpose
      });

      if (!response.success || !response.data) {
        throw new Error(response.error?.message || 'Failed to save external image');
      }

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

    const normalizedType = this.normalizeMimeType(file.type || '');
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (normalizedType === 'image/svg+xml' || extension === 'svg' || extension === 'svgz') {
      throw new Error('File type is not allowed');
    }

    // Check file type
    if (options.allowedTypes) {
      const normalizedAllowed = options.allowedTypes.map((type) => this.normalizeMimeType(type));
      const allowedSet = new Set(normalizedAllowed);

      if (normalizedType) {
        if (!allowedSet.has(normalizedType)) {
          if (!this.isExtensionAllowed(file.name, normalizedAllowed)) {
            throw new Error(`File type ${file.type} is not allowed`);
          }
        }
      } else if (!this.isExtensionAllowed(file.name, normalizedAllowed)) {
        throw new Error('File type is not allowed');
      }
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

  private normalizeMimeType(type: string): string {
    const normalized = type.toLowerCase();
    const aliases: Record<string, string> = {
      'image/jpg': 'image/jpeg',
      'image/pjpeg': 'image/jpeg',
      'image/x-png': 'image/png',
      'image/x-ms-bmp': 'image/bmp',
      'image/tif': 'image/tiff',
      'image/heic-sequence': 'image/heic',
      'image/heif-sequence': 'image/heif',
      'image/avif-sequence': 'image/avif'
    };
    return aliases[normalized] || normalized;
  }

  private isExtensionAllowed(filename: string, allowedTypes: string[]): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) {
      return false;
    }

    const mimeToExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif'],
      'image/bmp': ['bmp'],
      'image/tiff': ['tiff', 'tif'],
      'image/svg+xml': ['svg'],
      'image/heic': ['heic'],
      'image/heif': ['heif'],
      'image/avif': ['avif'],
      'application/pdf': ['pdf'],
      'application/msword': ['doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx']
    };

    const allowedExtensions = new Set<string>();
    allowedTypes.forEach((type) => {
      const extensions = mimeToExtensions[this.normalizeMimeType(type)];
      if (extensions) {
        extensions.forEach((ext) => allowedExtensions.add(ext));
      }
    });

    return allowedExtensions.has(extension);
  }
}

export const fileUploadService = new FileUploadService();
