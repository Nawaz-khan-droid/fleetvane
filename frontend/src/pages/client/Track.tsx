import React, { useState } from 'react';
import { Search, Package, MapPin, CheckCircle2, Clock } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export default function ClientTrack() {
  const [shipmentId, setShipmentId] = useState('');
  const [shipment, setShipment] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipmentId) return;

    setIsLoading(true);
    setError(null);
    setShipment(null);
    try {
      const response = await apiClient.get(`/shipments/${shipmentId}`);
      setShipment(response.data);
    } catch (err) {
      console.error('Failed to track shipment', err);
      setError('Shipment not found or unable to track at this time.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Track Shipment</h1>
        <p className="text-slate-400">Enter your shipment ID to view real-time delivery status and ETA.</p>
      </div>

      <form onSubmit={handleTrack} className="flex gap-4">
        <input
          type="text"
          value={shipmentId}
          onChange={(e) => setShipmentId(e.target.value)}
          placeholder="Enter Shipment ID (e.g., 101)"
          className="flex-1 p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button
          type="submit"
          className="px-6 py-3.5 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl flex items-center gap-2 transition-all"
        >
          <Search className="w-4 h-4" /> Track
        </button>
      </form>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="p-8 text-center text-slate-500">
          <div className="w-8 h-8 mx-auto mb-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          Tracking shipment...
        </div>
      )}

      {shipment && !isLoading && !error && (
        <div className="p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Shipment #{shipment.id}</h3>
                <p className="text-sm text-slate-400">Weight: {shipment.weight} kg</p>
              </div>
            </div>
            <span className="px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {shipment.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Origin</p>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" /> {shipment.originAddress}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 uppercase tracking-wider">Destination</p>
              <p className="text-sm font-medium text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" /> {shipment.destinationAddress}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
