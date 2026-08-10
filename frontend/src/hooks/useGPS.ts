import { useState, useEffect, useRef } from 'react';
import api from '../lib/api';

interface Location {
  lat: number;
  lng: number;
}

/**
 * Hook to track GPS location using HTML5 Geolocation API.
 * Updates the backend every 15 seconds if truckId is provided.
 * @param truckId Optional truck ID to update the backend with location.
 */
export function useGPS(truckId?: string) {
  const [location, setLocation] = useState<Location | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastSyncTime = useRef<number>(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    const syncInterval = 15000; // 15 seconds

    const handleSuccess = (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      setLocation({ lat: latitude, lng: longitude });

      const now = Date.now();
      // Throttle backend updates to every 15 seconds
      if (truckId && now - lastSyncTime.current >= syncInterval) {
        lastSyncTime.current = now;
        
        // Use the API to put the location.
        // Assuming baseURL in api.ts ends in /api or similar, we use /trucks/${truckId}/location
        api.put(`/trucks/${truckId}/location`, { lat: latitude, lng: longitude })
          .catch(err => {
            console.error('Failed to sync location to backend:', err);
          });
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      setError(error.message);
    };

    const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      maximumAge: 0,
    });

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [truckId]);

  return { location, error };
}
