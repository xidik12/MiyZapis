// File upload service - adapted for React Native
import { apiClient } from './api';

export class FileUploadService {
  // Upload file (React Native - accepts file URI)
  async uploadFile(fileUri: string, purpose: 'avatar' | 'portfolio' | 'service' = 'avatar'): Promise<{
    url: string;
    path: string;
    filename: string;
  }> {
    const response = await apiClient.upload<Array<{
      url: string;
      path: string;
      filename: string;
    }>>(`/files/upload?purpose=${purpose}`, fileUri);

    if (!response.success || !response.data || !Array.isArray(response.data) || response.data.length === 0) {
      throw new Error(response.error?.message || 'Failed to upload file');
    }

    return response.data[0];
  }

  // Upload multiple files
  async uploadFiles(fileUris: string[], purpose: 'avatar' | 'portfolio' | 'service' = 'service'): Promise<Array<{
    url: string;
    path: string;
    filename: string;
  }>> {
    // For multiple files, we'll need to upload them one by one
    // or modify the API to accept multiple files
    const uploadPromises = fileUris.map(uri => this.uploadFile(uri, purpose));
    return Promise.all(uploadPromises);
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

