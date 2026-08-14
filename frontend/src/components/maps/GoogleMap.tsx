import { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useTheme } from '../../context/ThemeProvider';

interface GoogleMapProps {
  showTraffic: boolean;
}

export default function GoogleMap({ showTraffic }: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [trafficLayer, setTrafficLayer] = useState<any>(null);
  const { theme } = useTheme();

  const isInitializing = useRef(false);

  useEffect(() => {
    if (isInitializing.current) return;
    
    const initMap = async () => {
      isInitializing.current = true;
      try {
        const loader = new Loader({
          apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
          version: 'weekly',
        });

        const { Map } = await (loader as any).importLibrary('maps');

        if (mapRef.current && !map) {
          const newMap = new Map(mapRef.current, {
            center: { lat: 37.7749, lng: -122.4194 },
            zoom: 13,
            mapId: 'DEMO_MAP_ID',
            disableDefaultUI: false,
          });

          setMap(newMap);
        }
      } catch (err) {
        console.error("Failed to initialize Google Maps", err);
      }
    };

    initMap();
  }, []);

  useEffect(() => {
    if (!map) return;

    if (showTraffic) {
      if (!trafficLayer) {
        const layer = new (window as any).google.maps.TrafficLayer();
        layer.setMap(map);
        setTrafficLayer(layer);
      } else {
        trafficLayer.setMap(map);
      }
    } else {
      if (trafficLayer) {
        trafficLayer.setMap(null);
      }
    }
  }, [showTraffic, map, trafficLayer]);

  // Handle theme changes for Google Maps (using colorScheme option if supported, or Map ID switching if needed)
  // Since we are using DEMO_MAP_ID, we might just rely on Google Maps default styling or AdvancedMarkers.
  // Advanced maps color schemes require setting colorScheme on the map instance.
  useEffect(() => {
    if (!map) return;
    
    let isDark = false;
    if (theme === 'system') {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      isDark = theme === 'dark';
    }

    // colorScheme is available on Maps API for Advanced Maps if mapId is provided.
    // However, TypeScript definition might lack it depending on types version, 
    // we use any cast if needed, but it's often supported via setOptions
    map.setOptions({
      // @ts-ignore - colorScheme is part of the newer map features for cloud-based maps
      colorScheme: isDark ? 'DARK' : 'LIGHT'
    });

  }, [theme, map]);

  return <div ref={mapRef} className="w-full h-full" />;
}
