import api from './api';
import { sanitizeSearchQuery, sanitizeText } from '@/utils/sanitization';

export interface LocationPrediction {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
  latitude?: number;
  longitude?: number;
}

export interface LocationDetails {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  placeId: string;
}

export interface CityData {
  city: string;
  state: string | null;
  country: string | null;
  specialistsCount: number;
}

export interface NearbyLocation {
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  distance: number;
  specialistsCount: number;
}

class LocationService {
  /**
   * Search locations using Google Places Autocomplete
   */
  async searchLocations(query: string, types: string = 'address'): Promise<LocationPrediction[]> {
    try {
      const sanitizedQuery = sanitizeSearchQuery(query);

      if (!sanitizedQuery || sanitizedQuery.length < 2) {
        return [];
      }

      const response = await api.get('/locations/search', {
        params: { q: sanitizedQuery, types },
      });

      return response.data.data.predictions || [];
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  }

  /**
   * Get location details from place ID or address
   */
  async geocodeLocation(placeId?: string, address?: string): Promise<LocationDetails | null> {
    try {
      if (!placeId && !address) {
        throw new Error('Either placeId or address is required');
      }

      const params: any = {};
      if (placeId) params.placeId = placeId;
      if (address) params.address = sanitizeText(address);

      const response = await api.get('/locations/geocode', { params });

      return response.data.data.location || null;
    } catch (error) {
      console.error('Error geocoding location:', error);
      return null;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(lat: number, lng: number): Promise<LocationDetails | null> {
    try {
      const response = await api.get('/locations/reverse-geocode', {
        params: { lat, lng },
      });

      return response.data.data.location || null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  /**
   * Get cities with specialists
   */
  async getCities(search?: string, limit: number = 50): Promise<CityData[]> {
    try {
      const params: any = { limit };
      if (search) params.search = sanitizeSearchQuery(search);

      const response = await api.get('/locations/cities', { params });

      return response.data.data.cities || [];
    } catch (error) {
      console.error('Error fetching cities:', error);
      return [];
    }
  }

  /**
   * Get nearby locations based on coordinates
   */
  async getNearbyLocations(
    lat: number,
    lng: number,
    radius: number = 50,
    limit: number = 20
  ): Promise<NearbyLocation[]> {
    try {
      const response = await api.get('/locations/nearby', {
        params: { lat, lng, radius, limit },
      });

      return response.data.data.locations || [];
    } catch (error) {
      console.error('Error fetching nearby locations:', error);
      return [];
    }
  }

  /**
   * Get user's current location using browser geolocation
   */
  async getCurrentPosition(): Promise<{ latitude: number; longitude: number } | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('Error getting current position:', error);
          resolve(null);
        },
        {
          timeout: 5000,
          enableHighAccuracy: false,
        }
      );
    });
  }

  /**
   * Format location for display
   */
  formatLocation(location: Partial<LocationDetails>): string {
    const parts = [];

    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.state) parts.push(location.state);
    if (location.country) parts.push(location.country);

    return parts.join(', ') || 'Unknown location';
  }

  /**
   * Calculate distance between two points (in km)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export const locationService = new LocationService();
export default locationService;
