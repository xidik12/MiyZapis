// API service - adapted for React Native
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse, ApiError } from '../types';
import { environment, STORAGE_KEYS } from '../config/environment';
import { Alert } from 'react-native';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: environment.API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': environment.APP_VERSION,
    'X-Platform': 'mobile',
  },
});

// Token management using AsyncStorage
let authToken: string | null = null;
let refreshToken: string | null = null;

export const setAuthTokens = async (tokens: { accessToken: string; refreshToken: string }) => {
  authToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
};

export const getAuthToken = async (): Promise<string | null> => {
  if (!authToken) {
    authToken = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  return authToken;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (!refreshToken) {
    refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
  return refreshToken;
};

export const clearAuthTokens = async () => {
  authToken = null;
  refreshToken = null;
  await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Increase timeout for file upload requests (mobile networks need more time)
    if (config.url?.includes('/files/upload') ||
        config.url?.includes('/files/presigned') ||
        config.url?.includes('/files/confirm') ||
        config.url?.includes('/upload-base64')) {
      config.timeout = 120000; // 120 seconds for mobile uploads
    }

    // Let React Native set multipart boundary automatically for FormData
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    }

    if (environment.DEBUG) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
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
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshTokenValue = await getRefreshToken();
      if (refreshTokenValue) {
        try {
          const response = await axios.post(
            `${environment.API_URL}/auth-enhanced/refresh`,
            { refreshToken: refreshTokenValue }
          );
          
          if (response.data?.data?.accessToken) {
            const { accessToken } = response.data.data;
            await setAuthTokens({ accessToken, refreshToken: refreshTokenValue });
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
          }
        } catch (refreshError) {
          // Refresh failed, clear tokens
          await clearAuthTokens();
          // Navigation will be handled by auth state
          return Promise.reject(refreshError);
        }
      } else {
        await clearAuthTokens();
      }
    }
    
    // Handle different error types
    if (error.response) {
      const apiError: ApiError = error.response.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
      
      // Show user-friendly error messages (except for login/logout)
      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isLogoutRequest = originalRequest.url?.includes('/auth/logout');
      
      if (!isLogoutRequest && !isLoginRequest) {
        switch (error.response.status) {
          case 400:
            Alert.alert('Error', apiError.message || 'Invalid request data');
            break;
          case 403:
            Alert.alert('Permission Denied', 'You do not have permission to perform this action');
            break;
          case 404:
            Alert.alert('Not Found', 'The requested resource was not found');
            break;
          case 409:
            Alert.alert('Conflict', apiError.message || 'A conflict occurred');
            break;
          case 422:
            Alert.alert('Validation Error', apiError.message || 'Unable to process the request');
            break;
          case 429:
            Alert.alert('Too Many Requests', 'Please try again later');
            break;
          case 500:
            Alert.alert('Server Error', 'Please try again later');
            break;
          default:
            if (error.response.status >= 500) {
              Alert.alert('Server Error', 'Please try again later');
            }
        }
      }
      
      return Promise.reject({
        ...error,
        apiError,
      });
    } else if (error.request) {
      // Network error
      Alert.alert('Network Error', 'Please check your connection');
      return Promise.reject({
        ...error,
        apiError: {
          code: 'NETWORK_ERROR',
          message: 'Network error. Please check your connection',
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      Alert.alert('Error', 'An unexpected error occurred');
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

  // File upload method for React Native
  async upload<T>(url: string, fileUri: string, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    // Use React Native's built-in global FormData (NOT the 'form-data' npm package)
    const formData = new FormData();

    // Extract filename from URI
    const filename = fileUri.split('/').pop() || 'image.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    formData.append('files', {
      uri: fileUri,
      type,
      name: filename,
    } as any);

    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    // Don't set Content-Type manually — the interceptor strips it so
    // React Native can set it automatically with the multipart boundary.
    const response = await api.post<ApiResponse<T>>(url, formData, {
      timeout: 120000, // 120 seconds for mobile uploads
    });

    return response.data;
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

export default apiClient;

