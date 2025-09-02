/**
 * API Debugging Utility
 * Helps debug backend endpoints and provides detailed error information
 */

import { apiClient } from '../services/api';

export class APIDebugger {
  /**
   * Test if a specific service can be deleted
   */
  static async testServiceDeletion(serviceId: string): Promise<{
    canDelete: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('🧪 Testing service deletion for:', serviceId);
      
      // First, check if service exists
      const serviceCheck = await apiClient.get(`/specialists/services/${serviceId}`);
      if (!serviceCheck.success) {
        return {
          canDelete: false,
          error: 'Service not found',
          details: serviceCheck.error
        };
      }
      
      // Then try to delete it (but in a dry-run mode if available)
      const deleteResult = await apiClient.delete(`/specialists/services/${serviceId}`);
      
      return {
        canDelete: deleteResult.success,
        error: deleteResult.success ? undefined : deleteResult.error?.message,
        details: deleteResult
      };
    } catch (error: any) {
      return {
        canDelete: false,
        error: error.message,
        details: {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        }
      };
    }
  }

  /**
   * Test backend connectivity and endpoints
   */
  static async testBackendHealth(): Promise<{
    healthy: boolean;
    endpoints: {
      [key: string]: {
        status: number;
        working: boolean;
        error?: string;
      }
    }
  }> {
    const endpoints = {
      'auth-me': '/auth/me',
      'specialists-services': '/specialists/services',
      'notifications': '/notifications',
      'specialists-profile': '/specialists/profile'
    };
    
    const results: any = {};
    
    for (const [name, endpoint] of Object.entries(endpoints)) {
      try {
        const response = await apiClient.get(endpoint);
        results[name] = {
          status: 200,
          working: response.success,
          error: response.success ? undefined : response.error?.message
        };
      } catch (error: any) {
        results[name] = {
          status: error.response?.status || 0,
          working: false,
          error: error.message
        };
      }
    }
    
    const healthyEndpoints = Object.values(results).filter((r: any) => r.working).length;
    const totalEndpoints = Object.keys(results).length;
    
    return {
      healthy: healthyEndpoints / totalEndpoints > 0.5,
      endpoints: results
    };
  }

  /**
   * Get detailed error information for debugging
   */
  static parseError(error: any): {
    type: string;
    message: string;
    details: string;
    suggestions: string[];
  } {
    const suggestions: string[] = [];
    let type = 'Unknown Error';
    let message = error.message || 'Unknown error occurred';
    let details = '';
    
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      
      details = `HTTP ${status}: ${error.response.statusText}`;
      
      if (status >= 500) {
        type = 'Server Error';
        suggestions.push('Check backend server logs');
        suggestions.push('Verify database connectivity');
        suggestions.push('Check for server-side exceptions');
      } else if (status === 404) {
        type = 'Not Found';
        suggestions.push('Verify the endpoint URL');
        suggestions.push('Check if the resource exists');
      } else if (status === 403) {
        type = 'Forbidden';
        suggestions.push('Check user permissions');
        suggestions.push('Verify authentication token');
      } else if (status === 401) {
        type = 'Unauthorized';
        suggestions.push('Re-authenticate user');
        suggestions.push('Check token expiration');
      }
      
      if (data?.error) {
        message = data.error;
      } else if (data?.message) {
        message = data.message;
      }
    } else if (error.request) {
      type = 'Network Error';
      details = 'No response received from server';
      suggestions.push('Check internet connection');
      suggestions.push('Verify server is running');
      suggestions.push('Check for CORS issues');
    }
    
    return { type, message, details, suggestions };
  }
}

export default APIDebugger;