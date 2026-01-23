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
  type?: 'avatar' | 'portfolio' | 'service' | 'document' | 'certificate' | 'payment';
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[]; // mime types
}

export class FileUploadService {
  // Upload a single file using presigned S3 URL (bypasses Railway timeout)
  async uploadFile(file: File, options: FileUploadOptions = {}): Promise<FileUploadResponse> {
    console.log('[FileUploadService] uploadFile called', { fileName: file.name, size: file.size, type: file.type, options });
    try {
      // Validate file before upload
      console.log('[FileUploadService] Validating file...');
      this.validateFile(file, options);
      console.log('[FileUploadService] File validation passed');

      // STEP 1: Get presigned URL from backend (small API call, should be fast)
      console.log('[FileUploadService] STEP 1: Getting presigned URL from backend...');
      const presignedResponse = await apiClient.post<{uploadUrl: string; fileUrl: string; key: string}>('/files/presigned-upload', {
        filename: file.name,
        contentType: file.type,
        type: options.type,
        folder: options.folder
      });

      console.log('[FileUploadService] Presigned URL response:', {
        success: presignedResponse.success,
        hasData: !!presignedResponse.data,
        uploadUrlLength: presignedResponse.data?.uploadUrl?.length
      });

      if (!presignedResponse.success || !presignedResponse.data?.uploadUrl) {
        console.error('[FileUploadService] Failed to get presigned URL:', presignedResponse);
        throw new Error('Failed to get presigned URL from server');
      }

      const { uploadUrl, key } = presignedResponse.data;
      console.log('[FileUploadService] Got presigned URL for key:', key);

      // STEP 2: Upload directly to S3 (bypasses Railway completely)
      console.log('[FileUploadService] STEP 2: Uploading directly to S3...');
      const s3UploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      console.log('[FileUploadService] S3 upload response:', {
        status: s3UploadResponse.status,
        statusText: s3UploadResponse.statusText,
        ok: s3UploadResponse.ok
      });

      if (!s3UploadResponse.ok) {
        const errorText = await s3UploadResponse.text().catch(() => 'Unknown error');
        console.error('[FileUploadService] S3 upload failed:', errorText);
        throw new Error(`S3 upload failed: ${s3UploadResponse.statusText}`);
      }

      console.log('[FileUploadService] ✅ S3 upload successful!');

      // STEP 3: Confirm upload with backend to create database record (small API call)
      console.log('[FileUploadService] STEP 3: Confirming upload with backend...');
      const confirmResponse = await apiClient.post<FileUploadResponse>('/files/confirm-upload', {
        key: key,
        filename: file.name,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        purpose: options.type || 'general'
      });

      console.log('[FileUploadService] Confirm response:', {
        success: confirmResponse.success,
        hasData: !!confirmResponse.data
      });

      if (!confirmResponse.success || !confirmResponse.data) {
        console.error('[FileUploadService] Failed to confirm upload:', confirmResponse);
        throw new Error('Failed to confirm upload with server');
      }

      console.log('[FileUploadService] ✅ Upload complete! Returning:', confirmResponse.data);
      return confirmResponse.data;
    } catch (error: any) {
      console.error('[FileUploadService] Upload error:', error);
      console.error('[FileUploadService] Error details:', {
        name: error.name,
        message: error.message,
        code: error.code,
        apiError: error.apiError,
        response: error.response?.data,
        stack: error.stack?.split('\n')[0]
      });

      // Provide more specific error messages
      let errorMessage = 'Failed to upload file';
      if (error.message?.includes('presigned')) {
        errorMessage = 'Failed to get upload URL from server';
      } else if (error.message?.includes('S3')) {
        errorMessage = 'Failed to upload to cloud storage';
      } else if (error.message?.includes('confirm')) {
        errorMessage = 'File uploaded but failed to save record';
      } else if (error.apiError?.message) {
        errorMessage = error.apiError.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

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
