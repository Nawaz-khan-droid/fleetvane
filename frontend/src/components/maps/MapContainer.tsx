import type { MapProvider } from '../../hooks/useMapProvider';
import LeafletMap from './LeafletMap';
import GoogleMap from './GoogleMap';

interface MapContainerProps {
  provider: MapProvider;
  showTraffic: boolean;
}

export default function MapContainer({ provider, showTraffic }: MapContainerProps) {
  return (
    <div className="relative w-full h-full rounded-md overflow-hidden shadow-sm border border-border">
      {provider === 'leaflet' && <LeafletMap key="leaflet" />}
      {provider === 'google' && <GoogleMap key="google" showTraffic={showTraffic} />}
    </div>
  );
}
