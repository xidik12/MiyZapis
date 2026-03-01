import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { ApiResponse, ApiError } from '../types';
import { environment, STORAGE_KEYS, APP_CONSTANTS } from '../config/environment';
import { LRUCache } from '../utils/LRUCache';
import { logger } from '../utils/logger';
import { getHttpErrorMessage, getErrorMessage } from '../utils/errorMessages';

// Extended Axios config with custom metadata properties
interface ExtendedAxiosConfig extends InternalAxiosRequestConfig {
  skipCache?: boolean;
  cachedResponse?: unknown;
  pendingRequest?: Promise<AxiosResponse>;
  cacheKey?: string;
  metadata?: { startTime: number; url?: string; method?: string };
  skipToast?: boolean;
  _retry?: boolean;
}

// Window augmentation for debug functions
declare global {
  interface Window {
    debugApiConnection?: () => Promise<void>;
    debugAuthStatus?: () => void;
    debugBrowserInfo?: () => void;
    runFullDiagnostics?: () => Promise<void>;
  }
}

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: environment.API_URL,
  timeout: APP_CONSTANTS.API_TIMEOUT,
  withCredentials: true, // Enable cookies and credentials for CORS requests
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Client-Version': environment.APP_VERSION,
    'X-Platform': 'web',
  },
});

// Request deduplication and caching with LRU eviction
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

interface PendingRequest {
  promise: Promise<any>;
  timeout: NodeJS.Timeout;
}

// Use LRU cache to prevent unbounded memory growth
const requestCache = new LRUCache<string, CacheEntry>(APP_CONSTANTS.CACHE_MAX_SIZE);
const pendingRequests = new Map<string, PendingRequest>();

const getCacheKey = (config: AxiosRequestConfig): string => {
  return `${config.method}:${config.url}:${JSON.stringify(config.params || {})}`;
};

const getCachedResponse = (key: string): unknown | null => {
  const entry = requestCache.get(key);
  if (entry && Date.now() - entry.timestamp < APP_CONSTANTS.CACHE_TTL) {
    return entry.data;
  }
  if (entry) {
    requestCache.delete(key); // Clean up expired entry
  }
  return null;
};

const setCachedResponse = (key: string, data: unknown): void => {
  requestCache.set(key, { data, timestamp: Date.now() });
};

const clearPendingRequest = (key: string): void => {
  const pending = pendingRequests.get(key);
  if (pending) {
    clearTimeout(pending.timeout);
    pendingRequests.delete(key);
  }
};

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
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
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

// Request interceptor to add auth token and handle caching
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Axios can only set the multipart boundary if Content-Type isn't forced.
    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData && config.headers) {
      const headers = config.headers as Record<string, string>;
      if (typeof headers.delete === 'function') {
        headers.delete('Content-Type');
      } else {
        delete headers['Content-Type'];
        delete headers['content-type'];
      }
    }

    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check for cached GET requests
    if (config.method?.toLowerCase() === 'get' && !(config as ExtendedAxiosConfig).skipCache) {
      const cacheKey = getCacheKey(config);
      const cachedResponse = getCachedResponse(cacheKey);

      if (cachedResponse) {
        // Return cached response immediately
        (config as ExtendedAxiosConfig).cachedResponse = cachedResponse;
      } else {
        // Check if there's a pending request for the same endpoint
        const pendingRequest = pendingRequests.get(cacheKey);
        if (pendingRequest) {
          (config as ExtendedAxiosConfig).pendingRequest = pendingRequest.promise;
        } else {
          // Store cache key for response interceptor
          (config as ExtendedAxiosConfig).cacheKey = cacheKey;
        }
      }
    }

    // Add detailed debugging information
    const requestStartTime = Date.now();
    const requestId = `req_${requestStartTime}_${Math.random().toString(36).substr(2, 9)}`;

    // Store debugging info in config
    (config as ExtendedAxiosConfig).metadata = {
      startTime: requestStartTime,
      requestId: requestId
    };

    if (environment.DEBUG && !(config as ExtendedAxiosConfig).cachedResponse) {
      logger.debug(`[API Request] ${requestId}`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        cached: !!(config as ExtendedAxiosConfig).cachedResponse
      });
    }

    return config;
  },
  (error) => {
    logger.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and token refresh
api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<any>>) => {
    const config = response.config as ExtendedAxiosConfig;
    const metadata = config.metadata;
    const responseTime = metadata ? Date.now() - metadata.startTime : 0;

    // Handle cached response
    if (config.cachedResponse) {
      return Promise.resolve({
        ...response,
        data: config.cachedResponse,
        status: 200,
        statusText: 'OK (Cached)'
      });
    }

    // Handle pending request deduplication
    if (config.pendingRequest) {
      return config.pendingRequest;
    }

    // Cache successful GET responses
    if (config.method?.toLowerCase() === 'get' && config.cacheKey && response.status === 200) {
      setCachedResponse(config.cacheKey, response.data);
      // Clean up pending request with timeout
      clearPendingRequest(config.cacheKey);
    }

    if (environment.DEBUG) {
      logger.debug(`[API Response] ${metadata?.requestId || 'unknown'}`, {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: `${response.status} ${response.statusText}`,
        responseTime: `${responseTime}ms`
      });
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Enhanced error debugging
    if (environment.DEBUG) {
      const metadata = (originalRequest as ExtendedAxiosConfig)?.metadata;
      const responseTime = metadata ? Date.now() - metadata.startTime : 0;

      // Don't log 404 errors for loyalty endpoints as they're expected for new users
      const isExpectedError = originalRequest?.url?.includes('/loyalty/') &&
                             error.response?.status === 404;

      if (!isExpectedError) {
        const errorDetails: Record<string, unknown> = {
          requestId: metadata?.requestId || 'unknown',
          method: originalRequest?.method?.toUpperCase(),
          url: originalRequest?.url,
          responseTime: `${responseTime}ms`
        };

        if (error.response) {
          errorDetails.status = `${error.response.status} ${error.response.statusText}`;

          // Special detailed logging for 500 errors
          if (error.response.status >= 500) {
            logger.error('CRITICAL SERVER ERROR', {
              ...errorDetails,
              fullUrl: `${originalRequest?.baseURL}${originalRequest?.url}`,
              responseData: error.response.data,
              timestamp: new Date().toISOString()
            });
          } else {
            logger.error('[API ERROR]', errorDetails);
          }
        } else if (error.request) {
          logger.error('[API ERROR] Network Error - No response received', errorDetails);
        } else {
          logger.error(`[API ERROR] Request Setup Error: ${error.message}`, errorDetails);
        }
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
            
            const { accessToken, refreshToken: newRefreshToken } = response.data.data;
            setAuthTokens({ accessToken, refreshToken: newRefreshToken || refreshTokenValue });
            
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
    // Check if toast should be skipped for this request (used by admin analytics with Promise.allSettled)
    const skipToast = (originalRequest as ExtendedAxiosConfig)?.skipToast === true;

    // Handle different error types
    if (error.response) {
      const apiError: ApiError = error.response.data?.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
      };
      
      // Show user-friendly error messages (except for login/logout errors or skipToast requests)
      if (!isLogoutRequest && !skipToast) {
        const status = error.response.status;
        if (status === 401) {
          if (!isLoginRequest) {
            toast.error(getHttpErrorMessage(401));
          }
        } else if (status >= 400) {
          toast.error(getHttpErrorMessage(status, apiError.message));
        }
      }

      return Promise.reject({
        ...error,
        apiError,
      });
    } else if (error.request) {
      // Network error - don't show toast for logout requests or skipToast requests
      if (!isLogoutRequest && !skipToast) {
        toast.error(getErrorMessage('NETWORK_ERROR'));
      }
      return Promise.reject({
        ...error,
        apiError: {
          code: 'NETWORK_ERROR',
          message: getErrorMessage('NETWORK_ERROR'),
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Something else happened
      toast.error(getErrorMessage('UNEXPECTED_ERROR'));
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

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
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
    logger.error('API health check failed:', error);
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

export const isRequestCancelled = (error: unknown): boolean => {
  return axios.isCancel(error);
};

// Debug utilities for 500 error diagnosis
export const debugApiConnection = async () => {
  logger.info('API Connection Debug Info', {
    environment: environment,
    baseURL: api.defaults.baseURL,
    timeout: api.defaults.timeout,
    headers: api.defaults.headers
  });

  // Test basic connectivity
  try {
    const healthResponse = await axios.get(`${environment.API_URL.replace('/api/v1', '')}/health`, { timeout: 5000 });
    logger.info('Health Check Response:', healthResponse.data);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Health Check Failed:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message
    });
  }

  // Test API v1 endpoint
  try {
    const apiResponse = await axios.get(`${environment.API_URL}`, { timeout: 5000 });
    logger.info('API v1 Response:', apiResponse.data);
  } catch (error: unknown) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('API v1 Check Failed:', {
      status: err.response?.status,
      statusText: err.response?.statusText,
      data: err.response?.data,
      message: err.message
    });
  }
};

export const debugAuthStatus = () => {
  const authToken = getAuthToken();
  const refreshToken = getRefreshToken();

  logger.info('Authentication Debug Info', {
    authTokenPresent: !!authToken,
    authTokenPreview: authToken ? `${authToken.substring(0, 20)}...` : 'None',
    refreshTokenPresent: !!refreshToken,
    refreshTokenPreview: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'None',
    localStorageKeys: Object.keys(localStorage).filter(key => key.includes('auth') || key.includes('token'))
  });
};

export const debugBrowserInfo = () => {
  logger.info('Browser Debug Info', {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    url: window.location.href,
    protocol: window.location.protocol,
    host: window.location.host,
    pathname: window.location.pathname,
    search: window.location.search
  });
};

export const runFullDiagnostics = async () => {
  logger.info('FULL API DIAGNOSTICS - 500 Error Investigation', {
    timestamp: new Date().toISOString()
  });

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

  logger.info('Testing Common Endpoints');

  for (const endpoint of testEndpoints) {
    try {
      logger.debug(`Testing ${endpoint}...`);
      const response = await axios.get(`${environment.API_URL}${endpoint}`, {
        timeout: 10000,
        headers: {
          Authorization: getAuthToken() ? `Bearer ${getAuthToken()}` : undefined
        }
      });
      logger.info(`${endpoint}: ${response.status} - ${response.statusText}`);
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error(`${endpoint} failed:`, {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message
      });
    }
  }
};

// Make debug functions available globally for easy access
if (environment.DEBUG) {
  window.debugApiConnection = debugApiConnection;
  window.debugAuthStatus = debugAuthStatus;
  window.debugBrowserInfo = debugBrowserInfo;
  window.runFullDiagnostics = runFullDiagnostics;

  logger.info('Debug functions available: debugApiConnection(), debugAuthStatus(), debugBrowserInfo(), runFullDiagnostics()');
}

export default apiClient;
