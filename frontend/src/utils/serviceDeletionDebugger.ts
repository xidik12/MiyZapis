/**
 * Service Deletion Debugger
 * Helps debug and resolve service deletion issues
 */

import { apiClient } from '../services/api';

export class ServiceDeletionDebugger {
  /**
   * Check dependencies that might prevent service deletion
   */
  static async checkDeletionDependencies(serviceId: string): Promise<{
    canDelete: boolean;
    dependencies: {
      bookings: number;
      reviews: number;
      favorites: number;
      [key: string]: number;
    };
    suggestions: string[];
  }> {
    try {
      console.log('🔍 Checking deletion dependencies for service:', serviceId);
      
      const dependencies = {
        bookings: 0,
        reviews: 0,
        favorites: 0
      };
      const suggestions: string[] = [];
      
      // Check for existing bookings
      try {
        const bookingsResponse = await apiClient.get(`/bookings?serviceId=${serviceId}`);
        if (bookingsResponse.success && bookingsResponse.data?.bookings) {
          dependencies.bookings = bookingsResponse.data.bookings.length;
        }
      } catch (error) {
        console.warn('Could not check bookings dependency:', error);
      }
      
      // Check for reviews
      try {
        const reviewsResponse = await apiClient.get(`/reviews?serviceId=${serviceId}`);
        if (reviewsResponse.success && reviewsResponse.data?.reviews) {
          dependencies.reviews = reviewsResponse.data.reviews.length;
        }
      } catch (error) {
        console.warn('Could not check reviews dependency:', error);
      }
      
      // Generate suggestions
      if (dependencies.bookings > 0) {
        suggestions.push(`Cancel or complete ${dependencies.bookings} existing booking(s)`);
      }
      if (dependencies.reviews > 0) {
        suggestions.push(`Handle ${dependencies.reviews} existing review(s)`);
      }
      
      const canDelete = Object.values(dependencies).every(count => count === 0);
      
      console.log('📊 Deletion dependencies analysis:', {
        serviceId,
        dependencies,
        canDelete,
        suggestions
      });
      
      return {
        canDelete,
        dependencies,
        suggestions
      };
      
    } catch (error: any) {
      console.error('❌ Error checking deletion dependencies:', error);
      return {
        canDelete: false,
        dependencies: { bookings: -1, reviews: -1, favorites: -1 },
        suggestions: ['Unable to check dependencies - contact support']
      };
    }
  }

  /**
   * Attempt to force delete a service (admin only)
   */
  static async forceDeleteService(serviceId: string): Promise<{
    success: boolean;
    message: string;
    details?: any;
  }> {
    try {
      console.log('⚠️ Attempting force delete for service:', serviceId);
      
      const response = await apiClient.delete(`/specialists/services/${serviceId}?force=true`);
      
      return {
        success: response.success,
        message: response.success ? 'Service force deleted successfully' : response.error?.message || 'Force delete failed',
        details: response.data
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Force delete failed',
        details: error.response?.data
      };
    }
  }

  /**
   * Get detailed service information for debugging
   */
  static async getServiceDetails(serviceId: string): Promise<{
    exists: boolean;
    service?: any;
    relationships?: {
      bookings: any[];
      reviews: any[];
      [key: string]: any[];
    };
    error?: string;
  }> {
    try {
      // Get service details
      const serviceResponse = await apiClient.get(`/specialists/services/${serviceId}`);
      
      if (!serviceResponse.success) {
        return {
          exists: false,
          error: 'Service not found'
        };
      }
      
      // Get related data
      const relationships: any = {};
      
      try {
        const bookingsResponse = await apiClient.get(`/bookings?serviceId=${serviceId}&limit=5`);
        relationships.bookings = bookingsResponse.success ? bookingsResponse.data?.bookings || [] : [];
      } catch (e) {
        relationships.bookings = [];
      }
      
      try {
        const reviewsResponse = await apiClient.get(`/reviews?serviceId=${serviceId}&limit=5`);
        relationships.reviews = reviewsResponse.success ? reviewsResponse.data?.reviews || [] : [];
      } catch (e) {
        relationships.reviews = [];
      }
      
      return {
        exists: true,
        service: serviceResponse.data,
        relationships
      };
    } catch (error: any) {
      return {
        exists: false,
        error: error.message
      };
    }
  }

  /**
   * Generate comprehensive deletion report
   */
  static async generateDeletionReport(serviceId: string): Promise<{
    serviceId: string;
    timestamp: string;
    serviceExists: boolean;
    serviceDetails?: any;
    dependencies: any;
    canDelete: boolean;
    recommendations: string[];
    technicalDetails: any;
  }> {
    console.log('📋 Generating deletion report for service:', serviceId);
    
    const [dependencies, serviceDetails] = await Promise.all([
      this.checkDeletionDependencies(serviceId),
      this.getServiceDetails(serviceId)
    ]);
    
    const recommendations: string[] = [];
    
    if (!dependencies.canDelete) {
      recommendations.push(...dependencies.suggestions);
    }
    
    if (!serviceDetails.exists) {
      recommendations.push('Service may have already been deleted or never existed');
    }
    
    if (dependencies.canDelete && serviceDetails.exists) {
      recommendations.push('Service should be safe to delete');
      recommendations.push('If deletion still fails, check backend logs');
    }
    
    const report = {
      serviceId,
      timestamp: new Date().toISOString(),
      serviceExists: serviceDetails.exists,
      serviceDetails: serviceDetails.service,
      dependencies: dependencies.dependencies,
      canDelete: dependencies.canDelete,
      recommendations,
      technicalDetails: {
        relationships: serviceDetails.relationships,
        errors: serviceDetails.error ? [serviceDetails.error] : []
      }
    };
    
    console.log('📊 Deletion Report Generated:', report);
    return report;
  }
}

export default ServiceDeletionDebugger;