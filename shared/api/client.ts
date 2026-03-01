// ============================================================
// Shared API Client — Canonical fetch wrapper with auth and error handling
// Configurable base URL for frontend vs mini-app usage
// ============================================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../types';

// ---- Configuration ----

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  /** Function to retrieve the current auth token */
  getToken: () => string | null;
  /** Function to retrieve the current refresh token */
  getRefreshToken?: () => string | null;
  /** Called when tokens are refreshed */
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken?: string }) => void;
  /** Called when auth fails irrecoverably (401 after refresh attempt) */
  onAuthFailure?: () => void;
  /** Called on API errors — can show toasts, log, etc. */
  onError?: (status: number, message: string) => void;
  /** Refresh token endpoint path (default: '/auth/refresh') */
  refreshEndpoint?: string;
  /** Extra default headers */
  headers?: Record<string, string>;
  /** Enable request/response debug logging */
  debug?: boolean;
}

// ---- Client Class ----

export class SharedApiClient {
  public readonly axios: AxiosInstance;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;

    this.axios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout ?? 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  // ---- Interceptors ----

  private setupRequestInterceptor(): void {
    this.axios.interceptors.request.use(
      (axiosConfig: InternalAxiosRequestConfig) => {
        // Clear Content-Type for FormData (let browser set multipart boundary)
        const isFormData = typeof FormData !== 'undefined' && axiosConfig.data instanceof FormData;
        if (isFormData && axiosConfig.headers) {
          delete (axiosConfig.headers as any)['Content-Type'];
          delete (axiosConfig.headers as any)['content-type'];
        }

        // Attach auth token
        const token = this.config.getToken();
        if (token && axiosConfig.headers) {
          axiosConfig.headers.Authorization = `Bearer ${token}`;
        }

        if (this.config.debug) {
          console.debug(`[API] ${axiosConfig.method?.toUpperCase()} ${axiosConfig.url}`);
        }

        return axiosConfig;
      },
      (error) => Promise.reject(error),
    );
  }

  private setupResponseInterceptor(): void {
    this.axios.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        const originalRequest = error.config;

        // Attempt token refresh on 401
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          this.config.getRefreshToken &&
          this.config.onTokenRefresh
        ) {
          const isAuthEndpoint =
            originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register');

          if (!isAuthEndpoint) {
            originalRequest._retry = true;
            const refreshTokenValue = this.config.getRefreshToken();

            if (refreshTokenValue) {
              try {
                const endpoint = this.config.refreshEndpoint ?? '/auth/refresh';
                const response = await axios.post(`${this.config.baseURL}${endpoint}`, {
                  refreshToken: refreshTokenValue,
                });
                const { accessToken, refreshToken: newRefresh } = response.data.data ?? response.data;
                this.config.onTokenRefresh({
                  accessToken,
                  refreshToken: newRefresh || refreshTokenValue,
                });
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return this.axios(originalRequest);
              } catch {
                this.config.onAuthFailure?.();
                return Promise.reject(error);
              }
            } else {
              this.config.onAuthFailure?.();
            }
          }
        }

        // Notify consumer of error
        if (error.response && this.config.onError) {
          const msg =
            error.response.data?.error?.message ||
            error.response.data?.message ||
            'An unexpected error occurred';
          this.config.onError(error.response.status, msg);
        }

        return Promise.reject(error);
      },
    );
  }

  // ---- Generic HTTP Methods ----

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axios.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axios.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axios.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axios.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axios.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  // ---- Convenience: unwrap data directly ----

  async getData<T>(url: string, params?: any): Promise<T> {
    const response = await this.axios.get<ApiResponse<T>>(url, { params });
    return response.data.data as T;
  }

  async postData<T>(url: string, data?: any): Promise<T> {
    const response = await this.axios.post<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  async putData<T>(url: string, data?: any): Promise<T> {
    const response = await this.axios.put<ApiResponse<T>>(url, data);
    return response.data.data as T;
  }

  async deleteData<T>(url: string): Promise<T> {
    const response = await this.axios.delete<ApiResponse<T>>(url);
    return response.data.data as T;
  }

  // ---- File upload ----

  async upload<T>(url: string, file: File, purpose?: string): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('files', file);
    const queryParam = purpose ? `?purpose=${purpose}` : '';
    const response = await this.axios.post<ApiResponse<T>>(`${url}${queryParam}`, formData, {
      timeout: 30000,
    });
    return response.data;
  }
}
