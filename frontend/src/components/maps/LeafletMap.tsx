import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../context/ThemeProvider';

interface LeafletMapProps {
  routeCoordinates?: [number, number][];
}

export default function LeafletMap({ routeCoordinates }: LeafletMapProps) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (theme === 'system') {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
      
      const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
      return () => window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', listener);
    } else {
      setIsDark(theme === 'dark');
    }
  }, [theme]);

  // OSM Standard
  const lightTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  // CartoDB Dark Matter
  const darkTileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  const attribution = isDark
    ? '&copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Dummy route data for testing if no coordinates provided
  const dummyRoute: [number, number][] = [
    [37.7749, -122.4194],
    [37.7749, -122.4294],
    [37.7849, -122.4294],
    [37.7849, -122.4194]
  ];
  
  const displayRoute = routeCoordinates || dummyRoute;

  return (
    <MapContainer 
      center={[37.7749, -122.4194]} 
      zoom={13} 
      className="w-full h-full z-0 relative"
      zoomControl={true}
    >
      <TileLayer
        key={isDark ? 'dark' : 'light'} // Force re-render on theme change
        attribution={attribution}
        url={isDark ? darkTileUrl : lightTileUrl}
      />
      
      {displayRoute.length > 0 && (
        <Polyline 
          positions={displayRoute} 
          pathOptions={{ color: 'blue', weight: 4 }} 
        />
      )}
    </MapContainer>
  );
}
