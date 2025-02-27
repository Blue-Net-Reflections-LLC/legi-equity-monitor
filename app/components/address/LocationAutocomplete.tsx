'use client';

/// <reference path="../../../types/google-maps.d.ts" />

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { MapPin } from 'lucide-react';

/**
 * Loads the Google Maps Places API script if it's not already loaded
 */
function loadGoogleMapsScript() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  
  if (!apiKey) {
    console.error('Google Maps API key is missing');
    return Promise.reject('Google Maps API key is missing');
  }

  // Return existing promise if script is already loading
  if (window.googleMapsScriptPromise) {
    return window.googleMapsScriptPromise;
  }

  // Create a new promise for script loading
  window.googleMapsScriptPromise = new Promise((resolve, reject) => {
    // Check if the script is already loaded
    if (window.google && window.google.maps) {
      resolve(window.google);
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsCallback`;
    script.async = true;
    script.defer = true;

    // Define the callback
    window.googleMapsCallback = () => {
      resolve(window.google);
    };

    // Handle errors
    script.onerror = () => {
      reject('Google Maps script failed to load');
    };

    // Add error listener to detect API authorization errors
    window.gm_authFailure = () => {
      console.error('Google Maps API key is invalid or API is not activated for this key');
      reject('Google Maps API authorization failed. Please check your API key and enabled services.');
    };

    // Add the script to the document
    document.head.appendChild(script);
  });

  return window.googleMapsScriptPromise;
}

interface LocationAutocompleteProps {
  className?: string;
  fullWidth?: boolean;
  formAction?: string;
}

export default function LocationAutocomplete({
  className = '',
  fullWidth = false,
  formAction = '/api/representatives/submit',
}: LocationAutocompleteProps) {
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<google.maps.places.Autocomplete | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Load Google Maps script on component mount
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setScriptLoaded(true);
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps script:', err);
        setError('Unable to load address autocomplete. Please enter your address manually.');
      });
  }, []);

  // Initialize Google Places Autocomplete when script is loaded
  useEffect(() => {
    if (scriptLoaded && autocompleteInputRef.current) {
      try {
        const options = {
          componentRestrictions: { country: 'us' },
          fields: ['address_components', 'formatted_address', 'geometry'],
        };

        autocompleteInstance.current = new google.maps.places.Autocomplete(
          autocompleteInputRef.current,
          options
        );

        // Handle place selection
        autocompleteInstance.current.addListener('place_changed', () => {
          const place = autocompleteInstance.current?.getPlace();
          if (place && place.formatted_address) {
            setSelectedAddress(place.formatted_address);
            
            // Store coordinates in state if available
            if (place.geometry?.location) {
              setLatitude(place.geometry.location.lat());
              setLongitude(place.geometry.location.lng());
            } else {
              setLatitude(null);
              setLongitude(null);
            }
            
            setError(null);
          }
        });
      } catch (err: unknown) {
        console.error('Error initializing autocomplete:', err);
        setError('Address autocomplete is unavailable. Please enter your address manually.');
      }
    }
  }, [scriptLoaded]);

  const handleSubmit = (e: React.FormEvent) => {
    // Form validation only
    if (!selectedAddress) {
      e.preventDefault();
      setError('Please enter a complete address');
      return;
    }

    // If we don't have coordinates from autocomplete, try to geocode
    if (!latitude || !longitude) {
      e.preventDefault();
      
      if (!scriptLoaded) {
        setError('Maps service is not available. Please try again later.');
        return;
      }
      
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: selectedAddress },
        (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const location = results[0].geometry.location;
            
            // Set coordinate values in hidden fields
            const latInput = document.querySelector('input[name="lat"]') as HTMLInputElement;
            const lngInput = document.querySelector('input[name="lng"]') as HTMLInputElement;
            
            if (latInput && lngInput) {
              latInput.value = location.lat().toString();
              lngInput.value = location.lng().toString();
              
              // Submit the form manually
              formRef.current?.submit();
            } else {
              setError('Error with form fields. Please try again.');
            }
          } else {
            setError('Could not find the location for the provided address. Please enter a valid US address.');
          }
        }
      );
    } else {
      // Ensure coordinates are properly set in hidden inputs before submitting
      const latInput = document.querySelector('input[name="lat"]') as HTMLInputElement;
      const lngInput = document.querySelector('input[name="lng"]') as HTMLInputElement;
      
      if (latInput && lngInput) {
        latInput.value = latitude.toString();
        lngInput.value = longitude.toString();
      }
      // Form will submit normally
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Set coordinates in state
          setLatitude(latitude);
          setLongitude(longitude);
          
          // Reverse geocode to get address
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                setSelectedAddress(results[0].formatted_address);
              } else {
                setError('Could not determine your address. Please enter it manually.');
              }
              setIsLoading(false);
            }
          );
        } catch (err: unknown) {
          console.error('Error during reverse geocoding:', err);
          setError('An error occurred while finding your address. Please enter it manually.');
          setIsLoading(false);
        }
      },
      (err: GeolocationPositionError) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Unable to access your location. Please enter your address manually.';
        
        if (err.code === 1) {
          errorMessage = 'Location access was denied. Please enter your address manually.';
        }
        
        setError(errorMessage);
        setIsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      <form 
        ref={formRef}
        method="POST" 
        action={formAction} 
        onSubmit={handleSubmit} 
        className="space-y-4"
      >
        <div className="flex flex-col">
          <label htmlFor="address" className="mb-2 text-sm font-medium">
            Enter your complete address to find your representatives
          </label>
          <div className="flex gap-2">
            <div className={`${fullWidth ? 'w-full' : 'flex-1'}`}>
              <Input
                ref={autocompleteInputRef}
                id="address"
                name="address"
                type="text"
                placeholder="Enter your complete address"
                value={selectedAddress}
                onChange={(e) => setSelectedAddress(e.target.value)}
                className="w-full"
                required
                disabled={isLoading}
                autoComplete="off"
              />
              {/* Hidden inputs for coordinates */}
              <input type="hidden" name="lat" value={latitude?.toString() || ''} />
              <input type="hidden" name="lng" value={longitude?.toString() || ''} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={isLoading || !scriptLoaded}
              title="Use my current location"
              aria-label="Use my current location"
            >
              <MapPin size={20} />
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Enter your full street address to accurately find your representatives.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || !selectedAddress}
        >
          {isLoading ? 'Finding Your Location...' : 'Find My Representatives'}
        </Button>
      </form>
    </div>
  );
} 