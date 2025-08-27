import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X } from 'lucide-react';

interface Location {
  address: string;
  city: string;
  region: string;
  country: string;
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
    google: any;
  }
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  location,
  onLocationChange,
  className = ''
}) => {
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Google Maps API
  useEffect(() => {
    // Only try to load if we have a valid API key
    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
    
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
    } else if (window.google) {
      setMapLoaded(true);
    }
  }, []);

  // Initialize map when modal opens and Google Maps is loaded
  useEffect(() => {
    if (isMapOpen && mapLoaded && mapRef.current && !mapInstanceRef.current) {
      initializeMap();
    }
  }, [isMapOpen, mapLoaded]);

  const initializeMap = () => {
    if (!window.google || !mapRef.current) return;

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

    // Add click listener to map
    mapInstanceRef.current.addListener('click', (event: any) => {
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
        markerRef.current.addListener('dragend', (dragEvent: any) => {
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

      markerRef.current.addListener('dragend', (dragEvent: any) => {
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
      (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const addressComponents = results[0].address_components;
          const formattedAddress = results[0].formatted_address;
          
          let address = '';
          let city = '';
          let region = '';
          let country = '';
          
          // Extract address components
          addressComponents.forEach((component: any) => {
            const types = component.types;
            
            if (types.includes('street_number') || types.includes('route')) {
              address += component.long_name + ' ';
            } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name;
            } else if (types.includes('administrative_area_level_1')) {
              region = component.long_name;
            } else if (types.includes('country')) {
              country = component.long_name;
            }
          });

          // If no specific address found, use formatted address
          if (!address.trim()) {
            address = formattedAddress;
          }

          const newLocation: Location = {
            address: address.trim(),
            city,
            region,
            country,
            latitude: lat,
            longitude: lng,
          };

          console.log('📍 Location extracted:', newLocation);
          onLocationChange(newLocation);
        }
      }
    );
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
    return parts.join(', ') || 'Click to select location';
  };

  return (
    <>
      {/* Location Display Button */}
      <button
        type="button"
        onClick={handleOpenMap}
        className={`w-full p-3 border rounded-lg text-left flex items-center justify-between hover:bg-gray-50 transition-colors ${className}`}
      >
        <div className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-gray-400" />
          <span className={location.address ? 'text-gray-900' : 'text-gray-500'}>
            {displayAddress()}
          </span>
        </div>
        <span className="text-blue-600 text-sm">Change</span>
      </button>

      {/* Map Modal */}
      {isMapOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Select Your Location</h3>
              <button
                onClick={handleCloseMap}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 p-4">
              <div className="h-96 w-full rounded-lg overflow-hidden">
                {mapError ? (
                  <div className="h-full w-full bg-red-50 border border-red-200 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="text-red-600 mb-2">
                        <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      </div>
                      <p className="text-red-800 font-medium mb-1">Google Maps Not Available</p>
                      <p className="text-red-600 text-sm mb-3">Map functionality requires an API key configuration.</p>
                      <p className="text-xs text-red-500">You can still enter your address manually in the text fields when editing.</p>
                    </div>
                  </div>
                ) : mapLoaded ? (
                  <div ref={mapRef} className="h-full w-full" />
                ) : (
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-gray-600">Loading map...</p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Instructions */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Click on the map to select your location, or drag the marker to adjust the position. 
                  The address will be automatically extracted from the coordinates.
                </p>
              </div>

              {/* Selected Location Display */}
              {location.address && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">Selected Location:</h4>
                  <p className="text-green-700">{displayAddress()}</p>
                  {location.latitude && location.longitude && (
                    <p className="text-xs text-green-600 mt-1">
                      Coordinates: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 p-4 border-t">
              <button
                onClick={handleCloseMap}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseMap}
                disabled={!location.address}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Location
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};