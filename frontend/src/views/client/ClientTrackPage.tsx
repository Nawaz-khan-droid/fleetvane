'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Truck,
  User,
  Package,
  Calendar,
  Weight,
  Navigation,
  Check,
  Search,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Clock,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { getLeafletTileUrl, getLeafletAttribution } from '@/lib/maps';
import type { Shipment, ShipmentStatus } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';

const STEPS = ['REQUESTED', 'ASSIGNED', 'DISPATCHED', 'IN_TRANSIT', 'ARRIVED', 'DELIVERED'];

function formatStatus(status: ShipmentStatus): string {
  const map: Record<string, string> = {
    REQUESTED:   'Requested',
    ASSIGNED:    'Assigned',
    DISPATCHED:  'Dispatched',
    IN_TRANSIT:  'In Transit',
    ARRIVED:     'Arrived',
    DELIVERED:   'Delivered',
    CANCELLED:   'Cancelled',
  };
  return map[status] || status;
}

const statusBadgeColor: Record<ShipmentStatus, string> = {
  REQUESTED:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  ASSIGNED:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  DISPATCHED: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  ARRIVED:    'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400',
  DELIVERED:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
  CANCELLED:  'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400',
};

const statusDotColor: Record<ShipmentStatus, string> = {
  REQUESTED:  'bg-amber-500',
  ASSIGNED:   'bg-blue-500',
  DISPATCHED: 'bg-indigo-500',
  IN_TRANSIT: 'bg-blue-500',
  ARRIVED:    'bg-teal-500',
  DELIVERED:  'bg-emerald-500',
  CANCELLED:  'bg-red-500',
};

export default function ClientTrackPage() {
  const { state: authState } = useAuth();
  const { params, navigate } = useRouter();
  const { resolvedTheme } = useTheme();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const shipmentId = params.id;
  const status = shipment?.status || 'REQUESTED';

  // ── Fetch shipment ─────────────────────────────────────
  useEffect(() => {
    if (!shipmentId) {
      setLoading(false);
      setShipment(null);
      return;
    }
    setLoading(true);
    setSearchError(null);
    (async () => {
      try {
        const res = await fetch(`/api/shipments/${shipmentId}`, {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (!res.ok) {
          setShipment(null);
          setSearchError('Shipment not found. Please check the ID.');
          return;
        }
        const data = await res.json();
        setShipment(data);
      } catch {
        toast.error('An error occurred');
        setSearchError('Failed to fetch shipment details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [shipmentId, authState.token]);

  // ── Live WebSocket milestone subscription ──────────────
  // When the backend flips a shipment to ARRIVED or DELIVERED, the STOMP
  // channel pushes a string message. We re-fetch to get the authoritative state.
  useTrackingWebSocket({
    token: authState.token,
    shipmentId: shipmentId,
    onMilestone: (msg) => {
      // Display the backend milestone message in the toast notification bar
      toast.info(msg, { duration: 6000 });
      // Re-fetch the shipment so the stepper advances to the new status
      if (shipmentId) {
        fetch(`/api/shipments/${shipmentId}`, {
          headers: { Authorization: `Bearer ${authState.token}` },
        })
          .then((r) => r.json())
          .then((data) => setShipment(data))
          .catch(() => {});
      }
    },
  });

  // ── Load Leaflet CSS ───────────────────────────────────
  useEffect(() => {
    if (status !== 'IN_TRANSIT') return;
    const linkId = 'leaflet-css';
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, [status]);

  // ── Initialize map ─────────────────────────────────────
  useEffect(() => {
    if (status !== 'IN_TRANSIT') return;
    let map: any;
    let isCancelled = false;

    const vehiclePos =
      shipment?.vehicle?.lat != null && shipment?.vehicle?.lng != null
        ? { lat: shipment.vehicle.lat as number, lng: shipment.vehicle.lng as number }
        : null;
    if (!vehiclePos) return;

    (async () => {
      const L = (await import('leaflet')).default;
      if (isCancelled) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      // Small delay to allow container render
      await new Promise((r) => setTimeout(r, 150));
      if (isCancelled) return;
      const container = document.getElementById('track-map');
      if (!container) return;
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = '';
      }
      map = L.map(container).setView([vehiclePos.lat, vehiclePos.lng], 10);
      L.tileLayer(getLeafletTileUrl(resolvedTheme), {
        attribution: getLeafletAttribution(),
        maxZoom: 19,
      }).addTo(map);
      L.marker([vehiclePos.lat, vehiclePos.lng])
        .addTo(map)
        .bindPopup('Vehicle Location');
    })();

    return () => {
      isCancelled = true;
      if (map) {
        map.remove();
      }
    };
  }, [status, shipment?.vehicle?.lat, shipment?.vehicle?.lng, resolvedTheme]);

  const currentStepIndex = STEPS.indexOf(status);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    navigate('/client/track', { id: searchId.trim() });
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-6">
            <Truck className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Track Your Shipment</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
            Enter your shipment ID to view real-time transit status and live vehicle location.
          </p>
          <form onSubmit={handleSearch} className="space-y-4">
            <input
              type="text"
              placeholder="Enter Shipment ID"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3.5 text-center text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
              autoFocus
            />
            <button
              type="submit"
              disabled={!searchId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-3.5 text-sm transition-colors disabled:opacity-50"
            >
              Track
            </button>
          </form>
          {searchError && (
            <p className="text-sm text-red-500 font-medium mt-4">{searchError}</p>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/client/dashboard')}
            className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Tracking <span className="text-slate-500">#{String(shipment.id).slice(0, 8).toUpperCase()}</span>
          </h2>
        </div>
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold gap-2 border ${statusBadgeColor[status]}`}>
          <span className={`w-2 h-2 rounded-full ${statusDotColor[status]}`} />
          {formatStatus(status)}
        </div>
      </div>

      {status === 'DELIVERED' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-emerald-800 dark:text-emerald-300 font-medium text-sm">
            Delivered Successfully {shipment.updatedAt ? `on ${new Date(shipment.updatedAt).toLocaleString()}` : ''}
          </p>
        </motion.div>
      )}

      {/* Milestone Stepper */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm overflow-x-auto"
      >
        <div className="min-w-[500px]">
          <div className="relative flex justify-between items-center w-full">
            <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-slate-100 dark:bg-slate-800 rounded-full" />
            <div 
              className="absolute left-6 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full transition-all duration-500"
              style={{ 
                width: currentStepIndex >= 0 
                  ? `calc(${(Math.max(0, currentStepIndex) / (STEPS.length - 1)) * 100}% - 48px)` 
                  : '0%' 
              }}
            />
            {STEPS.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              
              let StepIcon = Package;
              if (step === 'ASSIGNED') StepIcon = User;
              if (step === 'IN_TRANSIT') StepIcon = Navigation;
              if (step === 'DELIVERED') StepIcon = CheckCircle2;

              return (
                <div key={step} className="relative z-10 flex flex-col items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isCompleted 
                      ? 'bg-blue-600 border-blue-600 text-white' 
                      : isCurrent 
                        ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-600 ring-4 ring-blue-50 dark:ring-blue-900/20' 
                        : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-4 h-4 stroke-[3]" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${
                    isCurrent 
                      ? 'text-blue-600 dark:text-blue-400' 
                      : isCompleted 
                        ? 'text-slate-700 dark:text-slate-300' 
                        : 'text-slate-400 dark:text-slate-500'
                  }`}>
                    {formatStatus(step as ShipmentStatus)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Map Area */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {status === 'IN_TRANSIT' && shipment?.vehicle?.lat != null ? (
          <div
            id="track-map"
            className="w-full h-[360px] md:h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm"
          />
        ) : (
          <div className="w-full h-[360px] md:h-[420px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-slate-500 shadow-sm">
            <MapPin className="w-12 h-12 mb-4 text-slate-300" />
            <p>
              {status === 'DELIVERED' 
                ? 'Shipment has been delivered. Live tracking is no longer active.' 
                : 'Live tracking will be available once the shipment is in transit.'}
            </p>
          </div>
        )}
      </motion.div>

      {/* Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Carrier</h3>
            </div>
            {shipment.driver ? (
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{shipment.driver.name}</p>
                <p className="text-xs text-slate-500 mt-1">{shipment.vehicle?.plateNumber || 'Unknown vehicle'}</p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Not assigned yet</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Estimated Arrival</h3>
            </div>
            {shipment.eta ? (
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {new Date(shipment.eta).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {new Date(shipment.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Pending calculation</p>
            )}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 h-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white">Route</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{shipment.originAddress.split(',')[0]}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">{shipment.destinationAddress.split(',')[0]}</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">{shipment.weight ? `${shipment.weight} kg cargo` : 'Standard cargo'}</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
