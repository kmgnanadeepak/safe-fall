import { useState, useEffect, useCallback, useRef } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permissionDenied: boolean;
}

const DEFAULT_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
};

/**
 * Requests browser location permission and returns real-time position via
 * getCurrentPosition (initial) and watchPosition (continuous updates).
 * Call requestPermission() when the map loads, or pass autoRequest: true to request on mount.
 */
export function useGeolocation(options?: PositionOptions & { autoRequest?: boolean }) {
  const { autoRequest = false, ...positionOptions } = options ?? {};
  const opts = { ...DEFAULT_OPTIONS, ...positionOptions };

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: true,
    permissionDenied: false,
  });

  const watchIdRef = useRef<number | null>(null);

  const requestPermission = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false,
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    setState((prev) => ({ ...prev, loading: true, error: null, permissionDenied: false }));

    const onSuccess = (position: GeolocationPosition) => {
      setState((prev) => ({
        ...prev,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false,
        permissionDenied: false,
      }));
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Unable to retrieve location';
      let denied = false;
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied.';
          denied = true;
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'The request to get your location timed out.';
          break;
      }
      setState({
        latitude: null,
        longitude: null,
        accuracy: null,
        error: errorMessage,
        loading: false,
        permissionDenied: denied,
      });
    };

    // First get an immediate position (triggers browser permission prompt)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        onSuccess(position);
        // Then start continuous updates
        const id = navigator.geolocation.watchPosition(onSuccess, onError, opts);
        watchIdRef.current = id;
      },
      onError,
      opts
    );
  }, [opts.enableHighAccuracy, opts.timeout, opts.maximumAge]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (autoRequest) {
      requestPermission();
    }
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [autoRequest, requestPermission]);

  return {
    ...state,
    requestPermission,
    stopWatching,
  };
}
