import { useMapProvider, type MapProvider } from '../../hooks/useMapProvider';
import MapContainer from '../../components/maps/MapContainer';
import { Layers } from 'lucide-react';

export default function Dashboard() {
  const { activeProvider, setActiveProvider, showTraffic, setShowTraffic } = useMapProvider();

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Fleet Overview</h2>
          <p className="text-muted-foreground">Monitor your fleet and active deliveries in real-time.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-card p-2 rounded-lg border border-border shadow-sm">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <select 
              value={activeProvider} 
              onChange={(e) => setActiveProvider(e.target.value as MapProvider)}
              className="bg-transparent text-sm border-none outline-none focus:ring-0 cursor-pointer"
            >
              <option value="leaflet">OSM / Leaflet</option>
              <option value="google">Google Maps</option>
            </select>
          </div>
          
          {activeProvider === 'google' && (
            <>
              <div className="h-4 w-px bg-border mx-1"></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={showTraffic}
                  onChange={(e) => setShowTraffic(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                Show Traffic
              </label>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-[500px] rounded-xl overflow-hidden border border-border bg-card shadow-sm">
        <MapContainer provider={activeProvider} showTraffic={showTraffic} />
      </div>
    </div>
  );
}
