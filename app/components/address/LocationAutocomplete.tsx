'use client';

/// <reference path="../../../types/google-maps.d.ts" />

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { MapPin } from 'lucide-react';

/**
 * Loads the Google Maps API script if it's not already loaded
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&callback=googleMapsCallback`;
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
  showLabel?: boolean;
}

export default function LocationAutocomplete({
  className = '',
  fullWidth = false,
  formAction = '/api/representatives/submit',
  showLabel = true,
}: LocationAutocompleteProps) {
  const [zipCode, setZipCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Load Google Maps script on component mount
  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => {
        setScriptLoaded(true);
      })
      .catch((err: unknown) => {
        console.error('Failed to load Google Maps script:', err);
        setError('Unable to load location service. Please try again later.');
      });
  }, []);

  // Validate US zip code format
  const isValidZipCode = (zip: string): boolean => {
    return /^\d{5}(-\d{4})?$/.test(zip);
  };

  // Convert zip code to coordinates using Google Maps Geocoding
  const geocodeZipCode = (zip: string): Promise<google.maps.GeocoderResult[]> => {
    return new Promise((resolve, reject) => {
      if (!scriptLoaded) {
        reject(new Error('Google Maps not loaded'));
        return;
      }

      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: zip, componentRestrictions: { country: 'us' } },
        (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
            resolve(results);
          } else {
            reject(new Error(`Geocoding failed: ${status}`));
          }
        }
      );
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!zipCode) {
      setError('Please enter a zip code');
      return;
    }
    
    if (!isValidZipCode(zipCode)) {
      setError('Please enter a valid US zip code (5 digits)');
      return;
    }

    if (!scriptLoaded) {
      setError('Location service is not available. Please try again later.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const results = await geocodeZipCode(zipCode);
      const location = results[0].geometry.location;
      
      setLatitude(location.lat());
      setLongitude(location.lng());
      
      // Set hidden form fields
      const latInput = document.querySelector('input[name="lat"]') as HTMLInputElement;
      const lngInput = document.querySelector('input[name="lng"]') as HTMLInputElement;
      
      if (latInput && lngInput) {
        latInput.value = location.lat().toString();
        lngInput.value = location.lng().toString();
        
        // Submit the form
        formRef.current?.submit();
      } else {
        setError('Error with form fields. Please try again.');
      }
    } catch (err) {
      console.error('Error geocoding zip code:', err);
      setError('Could not find location for the provided zip code. Please enter a valid US zip code.');
    } finally {
      // setIsLoading(false);
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
          
          // Reverse geocode to get address information
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: google.maps.GeocoderResult[] | null, status: google.maps.GeocoderStatus) => {
              if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                // Extract zip code from address components
                const addressComponents = results[0].address_components;
                const zipComponent = addressComponents.find(
                  component => component.types.includes('postal_code')
                );
                
                let addressText = results[0].formatted_address || '';
                
                if (zipComponent) {
                  // Set the zip code in the input field
                  setZipCode(zipComponent.short_name);
                  addressText = zipComponent.short_name; // Use zip code as address if found
                }
                
                // Set all required form fields
                const latInput = document.querySelector('input[name="lat"]') as HTMLInputElement;
                const lngInput = document.querySelector('input[name="lng"]') as HTMLInputElement;
                const addressInput = document.querySelector('input[name="address"]') as HTMLInputElement;
                
                if (latInput && lngInput && addressInput) {
                  latInput.value = latitude.toString();
                  lngInput.value = longitude.toString();
                  addressInput.value = addressText;
                  
                  // End loading state
                  setIsLoading(false);
                  
                  // Just update fields without submitting the form
                  if (!addressText) {
                    setError('Could not determine your zip code. You may need to enter it manually.');
                  } else {
                    // Show a success message
                    setError(null);
                  }
                } else {
                  setError('Form field error. Please try again.');
                  setIsLoading(false);
                }
              } else {
                // Handle geocoding failure
                setError('Could not determine your location. Please enter a zip code manually.');
                setIsLoading(false);
              }
            }
          );
        } catch (err: unknown) {
          console.error('Error during reverse geocoding:', err);
          setError('An error occurred while finding your location. Please enter a zip code manually.');
          setIsLoading(false);
        }
      },
      (err: GeolocationPositionError) => {
        console.error('Geolocation error:', err);
        let errorMessage = 'Unable to access your location. Please enter your zip code manually.';
        
        if (err.code === 1) {
          errorMessage = 'Location access was denied. Please enter your zip code manually.';
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
          {showLabel && (
            <label htmlFor="zipCode" className="mb-2 text-sm font-medium">
              Who Represents You? Enter Your Zip Code
            </label>
          )}
          <div className="flex gap-2">
            <div className={`${fullWidth ? 'w-full' : 'flex-1'}`}>
              <Input
                id="zipCode"
                name="zipCode"
                type="text"
                placeholder="Enter your zip code (e.g., 10001)"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="w-full"
                maxLength={10}
                pattern="^\d{5}(-\d{4})?$"
                required
                disabled={isLoading}
              />
              {/* Hidden inputs for coordinates */}
              <input type="hidden" name="lat" value={latitude?.toString() || ''} />
              <input type="hidden" name="lng" value={longitude?.toString() || ''} />
              <input type="hidden" name="address" value={zipCode || ''} />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={isLoading || !scriptLoaded}
              title="Use my current location"
              aria-label="Use my current location"
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-zinc-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <MapPin size={20} />
              )}
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Discover your Congressional & State representatives with just a zip code.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          disabled={isLoading || !zipCode}
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Finding Representatives...</span>
            </div>
          ) : (
            'Find My Representatives'
          )}
        </Button>
      </form>
    </div>
  );
} 