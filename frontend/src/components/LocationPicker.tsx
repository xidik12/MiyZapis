import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, Search } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface Location {
  address: string;
  city: string;
  region: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
}

interface LocationPickerProps {
  location: Location;
  onLocationChange: (location: Location) => void;
  className?: string;
}

declare global {
  interface Window {
    google: Record<string, unknown>;
  }
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
  className = ''
}) => {
  const { t } = useLanguage();
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load Google Maps API
  useEffect(() => {
    // Only try to load if we have a valid API key
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      console.warn('Google Maps API key not found. Map functionality disabled.');
      setMapError(true);
      return;
    }
    
    if (!window.google && !document.querySelector('script[src*="googleapis"]')) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      script.onerror = () => {
        console.error('Failed to load Google Maps API');
        setMapLoaded(false);
        setMapError(true);
      };
      document.head.appendChild(script);
    } else if (window.google && window.google.maps) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map when modal opens and Google Maps is loaded
  useEffect(() => {
    if (isMapOpen && mapLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [isMapOpen, mapLoaded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.google || !window.google.maps || !mapRef.current) return;

    // Default location (center of world or user's current location)
    const defaultCenter = { lat: 0, lng: 0 };
    
    // If location has coordinates, use them
    const initialCenter = location.latitude && location.longitude 
      ? { lat: location.latitude, lng: location.longitude }
      : defaultCenter;

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: location.latitude && location.longitude ? 15 : 2,
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: false,
    });

    // Initialize Places service for reverse geocoding
    placesServiceRef.current = new window.google.maps.places.PlacesService(mapInstanceRef.current);

    // Initialize Autocomplete for search input
    if (searchInputRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
          types: ['address']
        }
      );

      // Handle place selection from autocomplete
      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry && place.geometry.location) {
          handlePlaceSelect(place);
        }
      });
    }

    // Add click listener to map
    mapInstanceRef.current.addListener('click', (event: Record<string, unknown>) => {
      const lat = event.latLng.lat();
      const lng = event.latLng.lng();
      
      // Update marker position
      if (markerRef.current) {
        markerRef.current.setPosition(event.latLng);
      } else {
        markerRef.current = new window.google.maps.Marker({
          position: event.latLng,
          map: mapInstanceRef.current,
          draggable: true,
        });

        // Add drag listener to marker
        markerRef.current.addListener('dragend', (dragEvent: Record<string, unknown>) => {
          const newLat = dragEvent.latLng.lat();
          const newLng = dragEvent.latLng.lng();
          reverseGeocode(newLat, newLng);
        });
      }
      
      // Reverse geocode to get address
      reverseGeocode(lat, lng);
    });

    // If we have existing coordinates, place marker
    if (location.latitude && location.longitude) {
      markerRef.current = new window.google.maps.Marker({
        position: initialCenter,
        map: mapInstanceRef.current,
        draggable: true,
      });

      markerRef.current.addListener('dragend', (dragEvent: Record<string, unknown>) => {
        const newLat = dragEvent.latLng.lat();
        const newLng = dragEvent.latLng.lng();
        reverseGeocode(newLat, newLng);
      });
    }

    // Try to get user's current location
    if (!location.latitude && !location.longitude && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          mapInstanceRef.current.setCenter(userLocation);
          mapInstanceRef.current.setZoom(15);
        },
        (error) => {
          console.warn('Geolocation error:', error);
        }
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!window.google) return;

    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode(
      { location: { lat, lng } },
      (results: Record<string, unknown>[], status: string) => {
        if (status === 'OK' && results[0]) {
          const locationData = extractLocationFromPlace(results[0]);
          onLocationChange({
            ...locationData,
            latitude: lat,
            longitude: lng,
          });
        }
      }
    );
  };

  const extractLocationFromPlace = (place: Record<string, unknown>): Location => {
    const addressComponents = place.address_components || [];
    const formattedAddress = place.formatted_address || '';
    
    let address = '';
    let city = '';
    let region = '';
    let country = '';
    let postalCode = '';
    
    // Extract address components with improved logic
    addressComponents.forEach((component: Record<string, unknown>) => {
      const types = component.types;
      
      if (types.includes('street_number')) {
        address = component.long_name + ' ' + address;
      } else if (types.includes('route')) {
        address += component.long_name;
      } else if (types.includes('locality')) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_2') && !city) {
        city = component.long_name;
      } else if (types.includes('administrative_area_level_1')) {
        region = component.long_name;
      } else if (types.includes('country')) {
        country = component.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = component.long_name;
      }
    });

    // If no specific address found, use formatted address
    if (!address.trim()) {
      // Extract street address from formatted address
      const addressParts = formattedAddress.split(',');
      address = addressParts[0] || formattedAddress;
    }

    const location: Location = {
      address: address.trim(),
      city: city || '',
      region: region || '',
      country: country || '',
      postalCode: postalCode || '',
    };

    console.log('📍 Location extracted:', location);
    return location;
  };

  const handlePlaceSelect = (place: Record<string, unknown>) => {
    if (!place.geometry || !place.geometry.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    // Extract location data from place
    const locationData = extractLocationFromPlace(place);

    // Update map position
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCenter({ lat, lng });
      mapInstanceRef.current.setZoom(15);
    }

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setPosition({ lat, lng });
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: { lat, lng },
        map: mapInstanceRef.current,
        draggable: true,
      });

      // Add drag listener to new marker
      markerRef.current.addListener('dragend', (dragEvent: Record<string, unknown>) => {
        const newLat = dragEvent.latLng.lat();
        const newLng = dragEvent.latLng.lng();
        reverseGeocode(newLat, newLng);
      });
    }

    // Update location state
    onLocationChange({
      ...locationData,
      latitude: lat,
      longitude: lng,
    });

    // Clear search
    setSearchQuery('');
    setSearchResults([]);
  };

  const performPlaceSearch = async (query: string) => {
    if (!window.google || !placesServiceRef.current || !query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const request = {
      query: query,
      fields: ['place_id', 'geometry', 'name', 'formatted_address', 'address_components'],
    };

    placesServiceRef.current.textSearch(request, (results: Record<string, unknown>[], status: string) => {
      setIsSearching(false);
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setSearchResults(results.slice(0, 5)); // Limit to 5 results
      } else {
        setSearchResults([]);
      }
    });
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performPlaceSearch(value);
    }, 300);
  };

  const selectSearchResult = (place: Record<string, unknown>) => {
    handlePlaceSelect(place);
    setSearchResults([]);
  };

  const handleOpenMap = () => {
    setIsMapOpen(true);
  };

  const handleCloseMap = () => {
    setIsMapOpen(false);
    // Clean up map instance
    mapInstanceRef.current = null;
    markerRef.current = null;
  };

  const displayAddress = () => {
    const parts = [];
    if (location.address) parts.push(location.address);
    if (location.city) parts.push(location.city);
    if (location.region) parts.push(location.region);
    if (location.country) parts.push(location.country);
    return parts.join(', ') || t('location.selectOnMap');
  };

  return (
    <>
      {/* Location Display Button */}
      <button
        type="button"
        onClick={handleOpenMap}
        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors bg-white dark:bg-gray-800 ${className}`}
      >
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <span className={location.address ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
            {displayAddress()}
          </span>
        </div>
        <span className="text-blue-600 dark:text-blue-400 text-sm">Change</span>
      </button>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-lg sm:rounded-xl shadow-xl w-full sm:max-w-4xl h-[90vh] sm:max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10 rounded-t-lg sm:rounded-none">
              <h3 className="text-lg font-semibold truncate text-gray-900 dark:text-white">{t('location.title')}</h3>
              <button
                onClick={handleCloseMap}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex-shrink-0 text-gray-500 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Bar */}
            {!mapError && (
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={t('location.search')}
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    className="block w-full pl-10 pr-3 py-3 sm:py-2 border border-gray-300 dark:border-gray-600 rounded-xl leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white focus:outline-none focus:placeholder-gray-400 dark:focus:placeholder-gray-500 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-base sm:text-sm"
                  />
                  {isSearching && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                
                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-48 sm:max-h-60 overflow-y-auto">
                    {searchResults.map((place, index) => (
                      <button
                        key={place.place_id || index}
                        onClick={() => selectSearchResult(place)}
                        className="w-full px-4 py-4 sm:py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-600 last:border-b-0 focus:outline-none focus:bg-blue-50 dark:focus:bg-blue-900/20"
                      >
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-base sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                              {place.name}
                            </p>
                            <p className="text-base sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                              {place.formatted_address}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map Container */}
            <div className="flex-1 p-4 min-h-0">
              <div className="h-64 sm:h-80 md:h-96 w-full rounded-xl overflow-hidden">
                {mapError ? (
                  <div className="h-full w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-red-600 dark:text-red-400 mb-2">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      </div>
                      <p className="text-red-800 dark:text-red-300 font-medium mb-1">{t('location.error')}</p>
                      <p className="text-red-600 dark:text-red-400 text-sm mb-3">{t('location.error')}</p>
                      <p className="text-xs text-red-500 dark:text-red-400">{t('location.address')}</p>
                    </div>
                  </div>
                ) : mapLoaded ? (
                  <div ref={mapRef} className="h-full w-full" />
                ) : (
                  <div className="h-full w-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
                      <p className="text-gray-600 dark:text-gray-300">{t('location.loading')}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  <strong>Instructions:</strong> Search for an address above, click on the map to select your location, or drag the marker to adjust the position. 
                  The address will be automatically extracted from the coordinates.
                </p>
              </div>

              {/* Selected Location Display */}
              {location.address && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">{t('location.currentLocation')}:</h4>
                  <p className="text-green-700 dark:text-green-400">{displayAddress()}</p>
                  {location.latitude && location.longitude && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 sticky bottom-0">
              <button
                onClick={handleCloseMap}
                className="px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl flex-1 sm:flex-none"
              >
                {t('location.cancel')}
              </button>
              <button
                onClick={handleCloseMap}
                disabled={!location.address}
                className="px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
              >
                {t('location.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
