'use client';
import { Camera, PenTool, CheckCircle, X } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Play,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { loadGoogleMaps, getLeafletTileUrl, getLeafletAttribution } from '@/lib/maps';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import type { Shipment, Vehicle, DriverWithProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';


// --- PROOF OF DELIVERY MODAL ---
const PodModal = ({ shipment, onClose, onSubmit }: { shipment: any, onClose: () => void, onSubmit: (pod: any) => void }) => {
  const [step, setStep] = useState(1);
  const [photo, setPhoto] = useState<string | null>(null);
  const sigCanvas = useRef<any>(null);
  
  // Dummy photo capture for MVP
  const capturePhoto = () => {
    // In a real app, use navigator.mediaDevices.getUserMedia
    // For MVP, we'll just simulate a base64 string
    setPhoto("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="); 
  };

  const handleNext = () => setStep(2);
  const handleConfirm = () => {
    const signature = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
    onSubmit({ photoBase64: photo, signatureBase64: signature });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-bold font-fraunces text-slate-900 dark:text-white">Proof of Delivery</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          {/* Progress bar */}
          <div className="flex gap-2 mb-8">
            <div className={`h-2 flex-1 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
            <div className={`h-2 flex-1 rounded-full ${step >= 3 ? 'bg-blue-600' : 'bg-slate-100 dark:bg-slate-800'}`} />
          </div>

          {step === 1 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Camera className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Package Photo</h3>
                <p className="text-sm text-slate-500 mt-1">Capture a photo of the delivered package</p>
              </div>
              
              {photo ? (
                <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden border-2 border-green-500 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-500" />
                </div>
              ) : (
                <button onClick={capturePhoto} className="w-full h-48 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl flex flex-col items-center justify-center gap-3 transition-colors">
                  <Camera className="w-8 h-8 text-slate-400" />
                  <span className="font-medium text-slate-600 dark:text-slate-400">Tap to Camera</span>
                </button>
              )}
              
              <button disabled={!photo} onClick={handleNext} className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed">
                Continue to Signature
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <PenTool className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Recipient Signature</h3>
                <p className="text-sm text-slate-500 mt-1">Please have the recipient sign below</p>
              </div>
              
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <SignatureCanvas ref={sigCanvas} canvasProps={{ className: 'w-full h-48 cursor-crosshair' }} />
              </div>
              <div className="flex justify-end">
                <button onClick={() => sigCanvas.current?.clear()} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
                  Clear Signature
                </button>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-medium">
                  Back
                </button>
                <button onClick={() => setStep(3)} className="flex-1 py-3.5 bg-blue-600 text-white rounded-xl font-medium">
                  Review
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Confirm Delivery</h3>
                <p className="text-sm text-slate-500 mt-1">All proof collected</p>
              </div>
              
              <button onClick={handleConfirm} className="w-full py-3.5 bg-green-600 text-white rounded-xl font-medium shadow-[0_8px_16px_-6px_rgba(22,163,74,0.4)]">
                Complete Delivery
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
// ------------------------------------

export default function DriverRoute() {
  const { state: authState } = useAuth();
  const { navigate } = useRouter();

  const [driverProfile, setDriverProfile] = useState<DriverWithProfile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'google'>('leaflet');
  const [mapReady, setMapReady] = useState(false);
  const [isPodModalOpen, setIsPodModalOpen] = useState(false);
  const { resolvedTheme } = useTheme();
  const tileLayerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);

  const handlePodSubmit = async (podData: any) => {
    if (!shipment) return;
    try {
      const res = await fetchWithAuth(`/api/shipments/${shipment.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'DELIVERED', pod: podData })
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast.success('Delivery completed successfully!');
      setIsPodModalOpen(false);
      setShipment(prev => prev ? { ...prev, status: 'DELIVERED' } : null);
    } catch (err) {
      toast.error('Failed to submit Proof of Delivery');
    }
  };

  // ── Fetch driver data ──────────────────────────────────
  useEffect(() => {
    if (!authState.token) return;
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${authState.token}` };

        const [vehiclesRes, shipmentsRes] = await Promise.all([
          fetchWithAuth('/api/vehicles', { headers }),
          fetchWithAuth('/api/shipments?clientId=all', { headers }), // Or driver endpoint
        ]);

        if (!vehiclesRes.ok || !shipmentsRes.ok) {
          throw new Error('HTTP Error during fetch');
        }

        const rawVehicles = await vehiclesRes.json();
        const rawShipments = await shipmentsRes.json();

        const vPage = normalizePageResponse<Vehicle>(rawVehicles);
        const sPage = normalizePageResponse<Shipment>(rawShipments);
        
        const vehiclesData = vPage.items;
        const shipmentsData = sPage.items;

        const myAssignedVehicle = vehiclesData.find((v) =>
          v.driverProfiles?.some((dp) => dp.user.id === authState.user?.userId)
        );
        if (myAssignedVehicle) {
          setVehicle(myAssignedVehicle);
        }

        const myShipment = shipmentsData.find((s) => s.driverId === authState.user?.userId);
        if (myShipment) {
          setShipment(myShipment);
        }
      } catch (err: any) {
        if (err instanceof ApiContractError) {
          toast.error('Unable to load route data. Unexpected response format.');
        } else {
          toast.error(t.common.error);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [authState.token, authState.user?.userId]);

  // ── Load Leaflet CSS once ─────────────────────────────
  useEffect(() => {
    const linkId = 'leaflet-css-driver';
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  // ── Initialize map when data + DOM are ready ─────────
  const currentProviderRef = useRef<'leaflet' | 'google' | null>(null);

  useEffect(() => {
    if (loading || !shipment || !mapReady) return;
    if (currentProviderRef.current === mapProvider) return;

    const hasRouteCoords =
      shipment.originLat != null &&
      shipment.originLng != null &&
      shipment.destinationLat != null &&
      shipment.destinationLng != null;
    if (!hasRouteCoords) return;

    const originCoords: [number, number] = [
      shipment.originLat as number,
      shipment.originLng as number,
    ];
    const destCoords: [number, number] = [
      shipment.destinationLat as number,
      shipment.destinationLng as number,
    ];

    let mapInstance: any;
    let isCancelled = false;

    const container = document.getElementById('driver-route-map');
    if (container) {
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }

    if (mapProvider === 'leaflet') {
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

        const center: [number, number] = [
          (originCoords[0] + destCoords[0]) / 2,
          (originCoords[1] + destCoords[1]) / 2,
        ];

        mapInstance = L.map('driver-route-map', {
          minZoom: 3,
          maxBounds: [[-90, -180], [90, 180]],
          maxBoundsViscosity: 1.0,
        }).setView(center, 6);
        const tileLayer = L.tileLayer(getLeafletTileUrl(resolvedTheme), {
          attribution: getLeafletAttribution(),
          maxZoom: 19,
          noWrap: true,
        }).addTo(mapInstance);
        tileLayerRef.current = tileLayer;
        mapRef.current = mapInstance;

        L.marker(originCoords)
          .addTo(mapInstance)
          .bindPopup(`<b>${t.driver.origin}</b><br/>${shipment.originAddress}`);

        L.marker(destCoords)
          .addTo(mapInstance)
          .bindPopup(`<b>${t.driver.destination}</b><br/>${shipment.destinationAddress}`);

        const polyline = L.polyline([originCoords, destCoords], {
          color: '#047857',
          weight: 4,
          opacity: 0.8,
          dashArray: '10 6',
        }).addTo(mapInstance);

        mapInstance.fitBounds(polyline.getBounds(), { padding: [50, 50] });
        currentProviderRef.current = 'leaflet';
      })();
    } else {
      (async () => {
        try {
          await loadGoogleMaps();
          const { AdvancedMarkerElement } =
            (await window.google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;
          if (isCancelled) return;

          const mapEl = document.getElementById('driver-route-map');
          if (!mapEl) return;

          const originLatLng = { lat: originCoords[0], lng: originCoords[1] };
          const destLatLng = { lat: destCoords[0], lng: destCoords[1] };

          mapInstance = new window.google.maps.Map(mapEl, {
            center: {
              lat: (originCoords[0] + destCoords[0]) / 2,
              lng: (originCoords[1] + destCoords[1]) / 2,
            },
            zoom: 6,
            mapId: 'DEMO_MAP_ID',
            disableDefaultUI: true,
            zoomControl: true,
          });

          new AdvancedMarkerElement({ map: mapInstance, position: originLatLng, title: shipment.originAddress });
          new AdvancedMarkerElement({ map: mapInstance, position: destLatLng, title: shipment.destinationAddress });

          new window.google.maps.Polyline({
            path: [originLatLng, destLatLng],
            geodesic: true,
            strokeColor: '#047857',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map: mapInstance,
          });

          const bounds = new google.maps.LatLngBounds();
          bounds.extend(originLatLng);
          bounds.extend(destLatLng);
          mapInstance.fitBounds(bounds, 50);

          currentProviderRef.current = 'google';
        } catch (err: any) {
          if (!isCancelled) {
            console.error('Google Maps failed to load:', err?.message);
            toast.error(`Map unavailable: ${err?.message || 'Google Maps failed to initialize'}`);
          }
        }
      })();
    }

    return () => {
      isCancelled = true;
      if (currentProviderRef.current === 'leaflet') {
        tileLayerRef.current?.remove();
        tileLayerRef.current = null;
        mapInstance?.remove();
      }
      mapRef.current = null;
      currentProviderRef.current = null;
    };
  }, [loading, shipment, mapReady, mapProvider]);

  // Dynamic Leaflet tile layer swap on theme change
  useEffect(() => {
    if (mapProvider !== 'leaflet' || !mapRef.current) return;
    let isCancelled = false;
    (async () => {
      try {
        const L = (await import('leaflet')).default;
        if (isCancelled || !mapRef.current) return;
        if (tileLayerRef.current && mapRef.current.hasLayer?.(tileLayerRef.current)) {
          mapRef.current.removeLayer(tileLayerRef.current);
        }
        const newLayer = L.tileLayer(getLeafletTileUrl(resolvedTheme), {
          attribution: getLeafletAttribution(),
          maxZoom: 19,
          noWrap: true,
        }).addTo(mapRef.current);
        tileLayerRef.current = newLayer;
      } catch (err) {
        console.error('Failed to update DriverRoute Leaflet tile theme:', err);
      }
    })();
    return () => {
      isCancelled = true;
    };
  }, [resolvedTheme, mapProvider]);

  // ── Trip toggle handler ────────────────────────────────
  const handleTripToggle = async () => {
    const newState = !isSimulating;
    try {
      const res = await fetchWithAuth('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ action: newState ? 'start' : 'stop' }),
      });
      if (!res.ok) throw new Error();
      setIsSimulating(newState);
      toast.success(newState ? 'Trip started successfully' : 'Trip ended');
    } catch {
      toast.error(t.common.error);
    }
  };

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="h-[calc(100vh-3.5rem)] relative p-4">
        <Skeleton className="w-full h-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] relative flex flex-col -mx-4 lg:-mx-8 -mt-6">
      
      {/* Floating status chip */}
      {isSimulating && (
        <motion.div
          initial={{ opacity: 0, y: -20, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          className="absolute top-20 left-1/2 bg-emerald-600 text-white text-sm font-semibold px-5 py-2 rounded-full flex items-center gap-2 shadow-lg z-[1001]"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          Trip Active
        </motion.div>
      )}

      {/* Map Provider Toggle */}
      <div className="absolute top-4 right-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md p-1 flex gap-1 z-[1001]">
        <button
          onClick={() => setMapProvider('leaflet')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mapProvider === 'leaflet' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Leaflet
        </button>
        <button
          onClick={() => setMapProvider('google')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            mapProvider === 'google' 
              ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Google Maps
        </button>
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full bg-slate-100 dark:bg-slate-800 relative z-0">
        {shipment && shipment.originLat != null && shipment.destinationLat != null ? (
          <div
            ref={() => setMapReady(true)}
            id="driver-route-map"
            className="w-full h-full"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-500">
            <MapPin className="w-12 h-12 mb-4 text-slate-300" />
            <p>
              {shipment
                ? 'Route coordinates have not been set for this shipment yet.'
                : 'No active assignment.'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Bottom Panel */}
      {shipment && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.2)] p-5 z-[1001] pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
        >
          <div className="w-10 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-5" />
          
          <div className="max-w-md mx-auto w-full">
            <p className="text-xs font-bold text-slate-500 tracking-wider uppercase mb-4">Current Route</p>
            
            <div className="relative pl-8 mb-6 space-y-5">
              {/* Vertical dashed line */}
              <div className="absolute left-3 top-5 bottom-5 w-0.5 border-l-2 border-dashed border-slate-200 dark:border-slate-700" />
              
              <div className="relative">
                <div className="absolute -left-8 top-1">
                  <MapPin className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Pickup</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{shipment.originAddress}</p>
                </div>
              </div>
              
              <div className="relative">
                <div className="absolute -left-8 top-1">
                  <MapPin className="w-5 h-5 text-red-500 fill-red-100 dark:fill-red-950" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-0.5">Dropoff</p>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{shipment.destinationAddress}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleTripToggle}
              className={`w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 transition-colors ${
                isSimulating 
                  ? 'bg-red-600 hover:bg-red-700 shadow-red-600/20 shadow-lg' 
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 shadow-lg'
              }`}
            >
              {isSimulating ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  End Trip
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start Trip
                </>
              )}
            </button>
            {shipment.status !== 'DELIVERED' && (
              <button
                onClick={() => setIsPodModalOpen(true)}
                className="w-full mt-3 py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-3 transition-colors bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 shadow-lg"
              >
                <CheckCircle className="w-5 h-5 fill-current" />
                Complete Delivery
              </button>
            )}
          </div>
        </motion.div>
      )}

      {isPodModalOpen && (
        <PodModal
          shipment={shipment}
          onClose={() => setIsPodModalOpen(false)}
          onSubmit={handlePodSubmit}
        />
      )}
    </div>
  );
}
