import { useState, useCallback } from 'react';

export type MapProvider = 'leaflet' | 'google';

export function useMapProvider() {
  const [activeProvider, setActiveProvider] = useState<MapProvider>('leaflet');
  const [showTraffic, setShowTraffic] = useState(false);

  const toggleProvider = useCallback(() => {
    setActiveProvider((prev) => (prev === 'leaflet' ? 'google' : 'leaflet'));
  }, []);

  const toggleTraffic = useCallback(() => {
    setShowTraffic((prev) => !prev);
  }, []);

  return {
    activeProvider,
    setActiveProvider,
    showTraffic,
    setShowTraffic,
    toggleProvider,
    toggleTraffic,
  };
}
