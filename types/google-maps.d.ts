// Google Maps TypeScript definitions
declare namespace google {
  namespace maps {
    class Geocoder {
      geocode(
        request: GeocodeRequest,
        callback: (results: GeocoderResult[] | null, status: GeocoderStatus) => void
      ): void;
    }

    interface GeocodeRequest {
      address?: string;
      location?: { lat: number; lng: number };
      componentRestrictions?: { country: string };
    }

    interface GeocoderResult {
      address_components: {
        long_name: string;
        short_name: string;
        types: string[];
      }[];
      formatted_address: string;
      geometry: {
        location: {
          lat(): number;
          lng(): number;
        };
        location_type: string;
        viewport: {
          north: number;
          east: number;
          south: number;
          west: number;
        };
      };
      place_id: string;
      types: string[];
    }

    enum GeocoderStatus {
      OK = "OK",
      ZERO_RESULTS = "ZERO_RESULTS",
      OVER_QUERY_LIMIT = "OVER_QUERY_LIMIT",
      REQUEST_DENIED = "REQUEST_DENIED",
      INVALID_REQUEST = "INVALID_REQUEST",
      UNKNOWN_ERROR = "UNKNOWN_ERROR",
      ERROR = "ERROR"
    }
  }
}

// Window interface augmentation
interface Window {
  google: typeof google;
  googleMapsScriptPromise: Promise<typeof google>;
  googleMapsCallback: () => void;
} 