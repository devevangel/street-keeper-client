/**
 * useGeolocation Hook
 * Wraps navigator.geolocation.getCurrentPosition or watchPosition.
 * Returns position, error, loading state, and a function to request permission.
 * Does not request on mount; call requestPermission in useEffect if needed.
 * When watch is true, position updates as the user moves (e.g. like Google Maps).
 */

import { useCallback, useEffect, useRef, useState } from "react";

export interface GeolocationPosition {
  lat: number;
  lng: number;
}

export interface UseGeolocationOptions {
  /** When true, use watchPosition so position updates as the user moves. Default false. */
  watch?: boolean;
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

const geoOptions: PositionOptions = { enableHighAccuracy: true };

export function useGeolocation(
  options: UseGeolocationOptions = {}
): UseGeolocationResult {
  const { watch: watchPosition = false } = options;
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation?.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, []);

  const requestPermission = useCallback(() => {
    setError(null);
    setIsLoading(true);
    if (watchIdRef.current != null) {
      navigator.geolocation?.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setIsLoading(false);
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setPosition(pos);
      setError(null);
      setIsLoading(false);
    };
    const onError = () => {
      setError("Location access denied or unavailable.");
      setIsLoading(false);
    };

    if (watchPosition) {
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) =>
          onSuccess({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        onError,
        geoOptions
      );
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          onSuccess({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        onError,
        geoOptions
      );
    }
  }, [watchPosition]);

  return {
    position,
    error,
    isLoading,
    requestPermission,
  };
}
