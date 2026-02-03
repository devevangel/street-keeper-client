/**
 * useGeolocation Hook
 * Wraps navigator.geolocation.getCurrentPosition.
 * Returns position, error, loading state, and a function to request permission.
 * Does not request on mount; call requestPermission in useEffect if needed.
 */

import { useCallback, useState } from "react";

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface UseGeolocationResult {
  /** Current position or null if not yet available or denied */
  position: GeolocationPosition | null;
  /** Error message if permission denied or unavailable */
  error: string | null;
  /** True while waiting for permission/result */
  isLoading: boolean;
  /** Request geolocation; call on mount or when user clicks "Try again" */
  requestPermission: () => void;
}

export function useGeolocation(): UseGeolocationResult {
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const requestPermission = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        setError(null);
        setIsLoading(false);
      },
      () => {
        setError("Location access denied or unavailable.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  return {
    position,
    error,
    isLoading,
    requestPermission,
  };
}
