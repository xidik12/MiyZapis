import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, ApiError } from '../types';
import { environment, STORAGE_KEYS } from '../config/environment';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: environment.API_URL,
  timeout: 15000, // Reduced timeout to 15 seconds for faster failure detection
  withCredentials: true, // Enable cookies and credentials for CORS requests
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

// Retry wrapper for critical API calls
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 2,
  delayMs: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry authentication errors or validation errors
      if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 400) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delayMs * (attempt + 1)));
    }
  }

  throw lastError;
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add detailed debugging information
    const requestStartTime = Date.now();
    const requestId = `req_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;

    // Store debugging info in config
    (config as any).metadata = {
      startTime: requestStartTime,
      requestId: requestId
    };

    if (environment.DEBUG) {
      console.group(`🚀 [API Request] ${requestId}`);
      console.log(`Method: ${config.method?.toUpperCase()}`);
      console.log(`URL: ${config.url}`);
      console.log(`Base URL: ${config.baseURL}`);
      console.log(`Full URL: ${config.baseURL}${config.url}`);
      console.log(`Headers:`, JSON.stringify(config.headers, null, 2));
      console.log(`Data:`, config.data ? JSON.stringify(config.data, null, 2) : 'No data');
      console.log(`Params:`, config.params ? JSON.stringify(config.params, null, 2) : 'No params');
      console.log(`Timestamp: ${new Date().toISOString()}`);
      console.log(`Auth Token:`, token ? `${token.substring(0, 20)}...` : 'No token');
      console.groupEnd();
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
    const metadata = (response.config as any).metadata;
    const responseTime = metadata ? Date.now() - metadata.startTime : 0;

    if (environment.DEBUG) {
      console.group(`✅ [API Response] ${metadata?.requestId || 'unknown'}`);
      console.log(`Method: ${response.config.method?.toUpperCase()}`);
      console.log(`URL: ${response.config.url}`);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Response Time: ${responseTime}ms`);
      console.log(`Headers:`, response.headers);
      console.log(`Data:`, response.data);
      console.groupEnd();
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error debugging
    if (environment.DEBUG) {
      const metadata = (originalRequest as any)?.metadata;
      const responseTime = metadata ? Date.now() - metadata.startTime : 0;

      // Don't log 404 errors for loyalty endpoints as they're expected for new users
      const isExpectedError = originalRequest?.url?.includes('/loyalty/') &&
                             error.response?.status === 404;

      if (!isExpectedError) {
        console.group(`❌ [API ERROR] ${metadata?.requestId || 'unknown'}`);
        console.error(`Method: ${originalRequest?.method?.toUpperCase()}`);
        console.error(`URL: ${originalRequest?.url}`);
        console.error(`Response Time: ${responseTime}ms`);

      if (error.response) {
        console.error(`Status: ${error.response.status} ${error.response.statusText}`);

        // Special detailed logging for 500 errors
        if (error.response.status >= 500) {
          console.error(`🚨 CRITICAL SERVER ERROR 🚨`);
          console.error(`Error Details:`, {
            status: error.response.status,
            statusText: error.response.statusText,
            url: `${originalRequest?.baseURL}${originalRequest?.url}`,
            method: originalRequest?.method?.toUpperCase(),
            responseData: error.response.data,
            timestamp: new Date().toISOString()
          });
        }
      } else if (error.request) {
        console.error(`Network Error - No response received`);
      } else {
        console.error(`Request Setup Error:`, error.message);
      }

        console.groupEnd();
      }
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

    // Check if this is a login or logout request - don't show toast for these failures
    const isLoginRequest = originalRequest.url?.includes('/auth/login');
    const isLogoutRequest = originalRequest.url?.includes('/auth/logout') || originalRequest.url?.includes('/logout');

    // Handle different error types
    if (error.response) {
      const apiError: ApiError = error.response.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
      
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
    formData.append('files', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const response = await api.post<ApiResponse<T>>(url, formData);
    
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

// Debug utilities for 500 error diagnosis
export const debugApiConnection = async () => {
  console.group('🔍 API Connection Debug Info');

  console.log('Environment:', environment);
  console.log('Base URL:', api.defaults.baseURL);
  console.log('Timeout:', api.defaults.timeout);
  console.log('Headers:', api.defaults.headers);

  // Test basic connectivity
  try {
    const healthResponse = await axios.get(`${environment.API_URL.replace('/api/v1', '')}/health`, { timeout: 5000 });
    console.log('Health Check Response:', healthResponse.data);
  } catch (error: any) {
    console.error('Health Check Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }

  // Test API v1 endpoint
  try {
    const apiResponse = await axios.get(`${environment.API_URL}`, { timeout: 5000 });
    console.log('API v1 Response:', apiResponse.data);
  } catch (error: any) {
    console.error('API v1 Check Failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
  }

  console.groupEnd();
};

export const debugAuthStatus = () => {
  console.group('🔐 Authentication Debug Info');

  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();

  console.log('Auth Token Present:', !!authToken);
  console.log('Auth Token Preview:', authToken ? `${authToken.substring(0, 20)}...` : 'None');
  console.log('Refresh Token Present:', !!refreshToken);
  console.log('Refresh Token Preview:', refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None');
  console.log('LocalStorage Keys:', Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('token')));

  console.groupEnd();
};

export const debugBrowserInfo = () => {
  console.group('🌐 Browser Debug Info');

  console.log('User Agent:', navigator.userAgent);
  console.log('Language:', navigator.language);
  console.log('Languages:', navigator.languages);
  console.log('Cookie Enabled:', navigator.cookieEnabled);
  console.log('Online Status:', navigator.onLine);
  console.log('URL:', window.location.href);
  console.log('Protocol:', window.location.protocol);
  console.log('Host:', window.location.host);
  console.log('Pathname:', window.location.pathname);
  console.log('Search:', window.location.search);

  console.groupEnd();
};

export const runFullDiagnostics = async () => {
  console.group('🚨 FULL API DIAGNOSTICS - 500 Error Investigation');
  console.log('Timestamp:', new Date().toISOString());

  await debugApiConnection();
  debugAuthStatus();
  debugBrowserInfo();

  // Test common failing endpoints
  const testEndpoints = [
    '/services',
    '/specialists/profile',
    '/analytics/overview',
    '/bookings'
  ];

  console.group('🧪 Testing Common Endpoints');

  for (const endpoint of testEndpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      const response = await axios.get(`${environment.API_URL}${endpoint}`, {
        timeout: 10000,
        headers: {
          Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        }
      });
      console.log(`✅ ${endpoint}: ${response.status} - ${response.statusText}`);
    } catch (error: any) {
      console.error(`❌ ${endpoint}:`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
    }
  }

  console.groupEnd();
  console.groupEnd();
};

// Make debug functions available globally for easy access
if (environment.DEBUG) {
  (window as any).debugApiConnection = debugApiConnection;
  (window as any).debugAuthStatus = debugAuthStatus;
  (window as any).debugBrowserInfo = debugBrowserInfo;
  (window as any).runFullDiagnostics = runFullDiagnostics;

  console.log('🔧 Debug functions available:');
  console.log('- debugApiConnection()');
  console.log('- debugAuthStatus()');
  console.log('- debugBrowserInfo()');
  console.log('- runFullDiagnostics()');
}

export default apiClient;
