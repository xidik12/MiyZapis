import { Router, Request, Response } from 'express';
import { Client } from '@googlemaps/google-maps-services-js';
import { prisma } from '@/config/database';
import { createSuccessResponse, createErrorResponse } from '@/utils/response';
import { logger } from '@/utils/logger';
import { sanitizeSearchQuery, sanitizeText, sanitizeNumber } from '@/utils/sanitization';
import { config } from '@/config';
import { searchRateLimit } from '@/middleware/security';
import { cacheMiddleware } from '@/middleware/cache';

const router = Router();

// Apply rate limiting to all location routes to prevent abuse
router.use(searchRateLimit);
const googleMapsClient = new Client({});

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

/**
 * GET /locations/search
 * Search locations using Google Places Autocomplete API
 */
router.get('/search', cacheMiddleware(120, 'location-search'), async (req: Request, res: Response) => {
  try {
    const { q, types = 'address' } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_QUERY',
          'Search query is required',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Limit query length to prevent abuse
    if (q.length > 200) {
      return res.status(400).json(
        createErrorResponse(
          'QUERY_TOO_LONG',
          'Search query must be less than 200 characters',
          req.headers['x-request-id'] as string
        )
      );
    }

    const sanitizedQuery = sanitizeSearchQuery(q);

    // If Google Maps API key is not configured, fallback to database cities
    if (!config.externalApis.googleMaps) {
      logger.warn('Google Maps API key not configured, falling back to database cities');

      const specialists = await prisma.specialist.findMany({
        where: {
          city: {
            contains: sanitizedQuery,
            mode: 'insensitive',
          },
        },
        select: {
          city: true,
          address: true,
          latitude: true,
          longitude: true,
        },
        distinct: ['city'],
        take: 10,
      });

      const locations = specialists
        .filter(s => s.city)
        .map(s => ({
          placeId: s.city,
          description: s.city,
          mainText: s.city,
          secondaryText: '',
          latitude: s.latitude,
          longitude: s.longitude,
        }));

      return res.json(createSuccessResponse({ predictions: locations }));
    }

    // Use Google Places Autocomplete
    const response = await googleMapsClient.placeAutocomplete({
      params: {
        input: sanitizedQuery,
        key: config.externalApis.googleMaps,
        types: types as string,
      },
      timeout: 5000,
    });

    if (response.data.status === 'OK') {
      const predictions = response.data.predictions.map(prediction => ({
        placeId: prediction.place_id,
        description: prediction.description,
        mainText: prediction.structured_formatting.main_text,
        secondaryText: prediction.structured_formatting.secondary_text,
      }));

      return res.json(createSuccessResponse({ predictions }));
    } else {
      return res.json(createSuccessResponse({ predictions: [] }));
    }
  } catch (error: unknown) {
    logger.error('Error searching locations:', error);
    return res.status(500).json(
      createErrorResponse(
        'SEARCH_LOCATIONS_ERROR',
        'Failed to search locations',
        req.headers['x-request-id'] as string
      )
    );
  }
});

/**
 * GET /locations/geocode
 * Get detailed location information from place ID or address
 */
router.get('/geocode', cacheMiddleware(300, 'geocode'), async (req: Request, res: Response) => {
  try {
    const { placeId, address } = req.query;

    if (!placeId && !address) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_PARAMETERS',
          'Either placeId or address is required',
          req.headers['x-request-id'] as string
        )
      );
    }

    if (!config.externalApis.googleMaps) {
      return res.status(503).json(
        createErrorResponse(
          'SERVICE_UNAVAILABLE',
          'Geocoding service not available',
          req.headers['x-request-id'] as string
        )
      );
    }

    let response;

    if (placeId) {
      // Get place details from place ID
      response = await googleMapsClient.placeDetails({
        params: {
          place_id: placeId as string,
          key: config.externalApis.googleMaps,
          fields: ['address_component', 'geometry', 'formatted_address', 'name'],
        },
        timeout: 5000,
      });

      if (response.data.status === 'OK' && response.data.result) {
        const place = response.data.result;
        const addressComponents = place.address_components || [];

        let street = '';
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        addressComponents.forEach((component: { long_name: string; short_name: string; types: string[] }) => {
          const types = component.types;

          if (types.includes('street_number')) {
            street = component.long_name + ' ' + street;
          } else if (types.includes('route')) {
            street += component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const location = {
          address: street.trim() || place.formatted_address,
          city: city || '',
          state: state || '',
          country: country || '',
          postalCode: postalCode || '',
          latitude: place.geometry?.location?.lat || null,
          longitude: place.geometry?.location?.lng || null,
          formattedAddress: place.formatted_address,
          placeId: placeId,
        };

        return res.json(createSuccessResponse({ location }));
      }
    } else if (address) {
      // Geocode address
      response = await googleMapsClient.geocode({
        params: {
          address: sanitizeText(address as string),
          key: config.externalApis.googleMaps,
        },
        timeout: 5000,
      });

      if (response.data.status === 'OK' && response.data.results[0]) {
        const result = response.data.results[0];
        const addressComponents = result.address_components || [];

        let street = '';
        let city = '';
        let state = '';
        let country = '';
        let postalCode = '';

        addressComponents.forEach((component: { long_name: string; short_name: string; types: string[] }) => {
          const types = component.types;

          if (types.includes('street_number')) {
            street = component.long_name + ' ' + street;
          } else if (types.includes('route')) {
            street += component.long_name;
          } else if (types.includes('locality')) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_2') && !city) {
            city = component.long_name;
          } else if (types.includes('administrative_area_level_1')) {
            state = component.long_name;
          } else if (types.includes('country')) {
            country = component.long_name;
          } else if (types.includes('postal_code')) {
            postalCode = component.long_name;
          }
        });

        const location = {
          address: street.trim() || result.formatted_address,
          city: city || '',
          state: state || '',
          country: country || '',
          postalCode: postalCode || '',
          latitude: result.geometry?.location?.lat || null,
          longitude: result.geometry?.location?.lng || null,
          formattedAddress: result.formatted_address,
          placeId: result.place_id,
        };

        return res.json(createSuccessResponse({ location }));
      }
    }

    return res.status(404).json(
      createErrorResponse(
        'LOCATION_NOT_FOUND',
        'Location not found',
        req.headers['x-request-id'] as string
      )
    );
  } catch (error: unknown) {
    logger.error('Error geocoding location:', error);
    return res.status(500).json(
      createErrorResponse(
        'GEOCODE_ERROR',
        'Failed to geocode location',
        req.headers['x-request-id'] as string
      )
    );
  }
});

/**
 * GET /locations/nearby
 * Get specialists near a specific location
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = '50', limit = '20' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_COORDINATES',
          'Latitude and longitude are required',
          req.headers['x-request-id'] as string
        )
      );
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    const radiusKm = parseFloat(radius as string);
    const limitNum = parseInt(limit as string, 10) || 20;

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radiusKm)) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_PARAMETERS',
          'Invalid coordinates or radius',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_COORDINATES',
          'Coordinates out of valid range',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Limit radius to prevent abuse (max 500km)
    if (radiusKm < 0 || radiusKm > 500) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_RADIUS',
          'Radius must be between 0 and 500 km',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Limit results to prevent abuse (max 100)
    const safeLimitNum = Math.min(Math.max(1, limitNum), 100);

    // Get all specialists with coordinates
    const specialists = await prisma.specialist.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
      select: {
        id: true,
        address: true,
        city: true,
        state: true,
        country: true,
        latitude: true,
        longitude: true,
        businessName: true,
        rating: true,
      },
      take: 200, // Get more to filter by distance
    });

    // Calculate distances and filter by radius
    const nearbySpecialists = specialists
      .filter(s => s.latitude !== null && s.longitude !== null)
      .map(s => ({
        ...s,
        distance: calculateDistance(latitude, longitude, s.latitude!, s.longitude!),
      }))
      .filter(s => s.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, safeLimitNum);

    // Get unique locations from nearby specialists
    const locations = nearbySpecialists.map(s => ({
      address: s.address,
      city: s.city,
      state: s.state,
      country: s.country,
      latitude: s.latitude,
      longitude: s.longitude,
      distance: Math.round(s.distance * 10) / 10, // Round to 1 decimal
      specialistsCount: 1, // Could be aggregated
    }));

    return res.json(createSuccessResponse({
      locations,
      total: locations.length,
      searchCenter: { latitude, longitude },
      radius: radiusKm,
    }));
  } catch (error: unknown) {
    logger.error('Error fetching nearby locations:', error);
    return res.status(500).json(
      createErrorResponse(
        'FETCH_NEARBY_ERROR',
        'Failed to fetch nearby locations',
        req.headers['x-request-id'] as string
      )
    );
  }
});

/**
 * GET /locations/cities
 * Get list of cities with specialists
 */
router.get('/cities', cacheMiddleware(300, 'cities'), async (req: Request, res: Response) => {
  try {
    const { search, limit = '50' } = req.query;
    const limitNum = parseInt(limit as string, 10) || 50;

    // Limit search query length
    if (search && typeof search === 'string' && search.length > 100) {
      return res.status(400).json(
        createErrorResponse(
          'QUERY_TOO_LONG',
          'Search query must be less than 100 characters',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Limit results to prevent abuse (max 100)
    const safeLimitNum = Math.min(Math.max(1, limitNum), 100);

    const where: Record<string, unknown> = {
      city: {
        not: null,
      },
    };

    if (search && typeof search === 'string') {
      const sanitizedSearch = sanitizeSearchQuery(search);
      where.city = {
        contains: sanitizedSearch,
        mode: 'insensitive',
      };
    }

    const cityGroups = await prisma.specialist.groupBy({
      by: ['city', 'state', 'country'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: safeLimitNum,
    });

    const cities = cityGroups
      .filter(group => group.city !== null)
      .map(group => ({
        city: group.city!,
        state: group.state,
        country: group.country,
        specialistsCount: group._count.id,
      }));

    return res.json(createSuccessResponse({
      cities,
      total: cities.length,
    }));
  } catch (error: unknown) {
    logger.error('Error fetching cities:', error);
    return res.status(500).json(
      createErrorResponse(
        'FETCH_CITIES_ERROR',
        'Failed to fetch cities',
        req.headers['x-request-id'] as string
      )
    );
  }
});

/**
 * GET /locations/reverse-geocode
 * Reverse geocode coordinates to address
 */
router.get('/reverse-geocode', cacheMiddleware(300, 'reverse-geocode'), async (req: Request, res: Response) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_COORDINATES',
          'Latitude and longitude are required',
          req.headers['x-request-id'] as string
        )
      );
    }

    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_COORDINATES',
          'Invalid coordinates',
          req.headers['x-request-id'] as string
        )
      );
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return res.status(400).json(
        createErrorResponse(
          'INVALID_COORDINATES',
          'Coordinates out of valid range',
          req.headers['x-request-id'] as string
        )
      );
    }

    if (!config.externalApis.googleMaps) {
      return res.status(503).json(
        createErrorResponse(
          'SERVICE_UNAVAILABLE',
          'Reverse geocoding service not available',
          req.headers['x-request-id'] as string
        )
      );
    }

    const response = await googleMapsClient.reverseGeocode({
      params: {
        latlng: { lat: latitude, lng: longitude },
        key: config.externalApis.googleMaps,
      },
      timeout: 5000,
    });

    if (response.data.status === 'OK' && response.data.results[0]) {
      const result = response.data.results[0];
      const addressComponents = result.address_components || [];

      let street = '';
      let city = '';
      let state = '';
      let country = '';
      let postalCode = '';

      addressComponents.forEach((component: { long_name: string; short_name: string; types: string[] }) => {
        const types = component.types;

        if (types.includes('street_number')) {
          street = component.long_name + ' ' + street;
        } else if (types.includes('route')) {
          street += component.long_name;
        } else if (types.includes('locality')) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_2') && !city) {
          city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          state = component.long_name;
        } else if (types.includes('country')) {
          country = component.long_name;
        } else if (types.includes('postal_code')) {
          postalCode = component.long_name;
        }
      });

      const location = {
        address: street.trim() || result.formatted_address,
        city: city || '',
        state: state || '',
        country: country || '',
        postalCode: postalCode || '',
        latitude,
        longitude,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
      };

      return res.json(createSuccessResponse({ location }));
    }

    return res.status(404).json(
      createErrorResponse(
        'LOCATION_NOT_FOUND',
        'Location not found',
        req.headers['x-request-id'] as string
      )
    );
  } catch (error: unknown) {
    logger.error('Error reverse geocoding:', error);
    return res.status(500).json(
      createErrorResponse(
        'REVERSE_GEOCODE_ERROR',
        'Failed to reverse geocode',
        req.headers['x-request-id'] as string
      )
    );
  }
});

export default router;
