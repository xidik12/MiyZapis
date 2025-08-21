import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, ApiError } from '../types';
import { environment, STORAGE_KEYS } from '../config/environment';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: environment.API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': environment.APP_VERSION,
    'X-Platform': 'web',
  },
});

// Token management
let authToken: string | null = null;
let refreshToken: string | null = null;

export const setAuthTokens = (tokens: { accessToken: string; refreshToken: string }) => {
  authToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
};

export const getAuthToken = (): string | null => {
  if (!authToken) {
    authToken = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  return authToken;
};

export const getRefreshToken = (): string | null => {
  if (!refreshToken) {
    refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return refreshToken;
};

export const clearAuthTokens = () => {
  authToken = null;
  refreshToken = null;
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request timestamp for debugging
    if (environment.DEBUG) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    if (environment.DEBUG) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    if (environment.DEBUG) {
      console.error(`[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, error.response?.data || error.message);
    }

    // Handle 401 Unauthorized - attempt token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Check if this is a login request - don't attempt refresh for login failures
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      
      if (!isLoginRequest) {
        originalRequest._retry = true;
        
        const refreshTokenValue = getRefreshToken();
        if (refreshTokenValue) {
          try {
            const response = await axios.post(`${api.defaults.baseURL}/auth/refresh`, {
              refreshToken: refreshTokenValue,
            });
            
            const { accessToken } = response.data.data;
            setAuthTokens({ accessToken, refreshToken: refreshTokenValue });
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            clearAuthTokens();
            window.location.href = '/auth/login';
            return Promise.reject(refreshError);
          }
        } else {
          // No refresh token, redirect to login
          clearAuthTokens();
          window.location.href = '/auth/login';
        }
      }
    }

    // Handle different error types
    if (error.response) {
      const apiError: ApiError = error.response.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };

      // Check if this is a login or logout request - don't show toast for these failures
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isLogoutRequest = originalRequest.url?.includes('/auth/logout') || originalRequest.url?.includes('/logout');
      
      // Show user-friendly error messages (except for login/logout errors)
      if (!isLogoutRequest) {
        switch (error.response.status) {
          case 400:
            toast.error(apiError.message || 'Invalid request data');
            break;
          case 401:
            // Don't show toast for login failures - let the form handle it
            if (!isLoginRequest) {
              toast.error('Authentication failed. Please log in again.');
            }
            break;
          case 403:
            toast.error('You do not have permission to perform this action');
            break;
          case 404:
            toast.error('The requested resource was not found');
            break;
          case 409:
            toast.error(apiError.message || 'A conflict occurred');
            break;
          case 422:
            toast.error(apiError.message || 'Unable to process the request');
            break;
          case 429:
            toast.error('Too many requests. Please try again later');
            break;
          case 500:
            toast.error('Server error. Please try again later');
            break;
          default:
            if (error.response.status >= 500) {
              toast.error('Server error. Please try again later');
            }
        }
      }

      return Promise.reject({
        ...error,
        apiError,
      });
    } else if (error.request) {
      // Network error - don't show toast for logout requests
      if (!isLogoutRequest) {
        toast.error('Network error. Please check your connection');
      }
      return Promise.reject({
        ...error,
        apiError: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Something else happened
      toast.error('An unexpected error occurred');
      return Promise.reject(error);
    }
  }
);

// Generic API methods
class ApiClient {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // File upload method
  async upload<T>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await api.post<ApiResponse<T>>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }

  // Download method
  async download(url: string, filename?: string): Promise<void> {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }
}

// Export API client instance
export const apiClient = new ApiClient();

// Export axios instance for direct use if needed
export { api };

// Health check utility
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    await api.get('/health');
    return true;
  } catch (error) {
    console.error('API health check failed:', error);
    return false;
  }
};

// Retry utility for important requests
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }

  throw lastError!;
};

// Request cancellation utility
export const createCancelToken = () => {
  return axios.CancelToken.source();
};

export const isRequestCancelled = (error: any): boolean => {
  return axios.isCancel(error);
};

export default apiClient;