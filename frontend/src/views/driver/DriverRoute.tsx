'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Truck,
  Play,
  Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { loadGoogleMaps } from '@/lib/maps';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, Vehicle, DriverWithProfile } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';


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
      shipment.originLat != null && shipment.originLng != null &&
      shipment.destinationLat != null && shipment.destinationLng != null;
    if (!hasRouteCoords) return;

    const originCoords: [number, number] = [shipment.originLat as number, shipment.originLng as number];
    const destCoords: [number, number] = [shipment.destinationLat as number, shipment.destinationLng as number];

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

        mapInstance = L.map('driver-route-map').setView(center, 6);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
        }).addTo(mapInstance);

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
          // Track B singleton — key read once, loud failure, no duplicate script injection.
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
            // LOUD failure — never swallow Maps initialization errors.
            console.error('Google Maps failed to load:', err?.message);
            toast.error(`Map unavailable: ${err?.message || 'Google Maps failed to initialize'}`);
          }
        }
      })();
    }

    return () => {
      isCancelled = true;
      if (currentProviderRef.current === 'leaflet') {
        mapInstance?.remove();
      }
      currentProviderRef.current = null;
    };
  }, [loading, shipment, mapReady, mapProvider]);

  // ── Trip toggle handler ────────────────────────────────
  const handleTripToggle = async (checked: boolean) => {
    try {
      const res = await fetchWithAuth('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ action: checked ? 'start' : 'stop' }),
      });
      if (!res.ok) throw new Error();
      setIsSimulating(checked);
      toast.success(checked ? t.driver.tripActive : t.driver.tripInactive);
    } catch {
      toast.error(t.common.error);
    }
  };

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[300px] sm:h-[400px] md:h-[500px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Trip active banner */}
      {isSimulating && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 px-4 py-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium flex items-center gap-3"
        >
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          {t.driver.tripActive}
        </motion.div>
      )}

      {/* Trip toggle */}
      <motion.div
        className="mb-4 sm:mb-6 flex flex-wrap items-center gap-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <Switch
            id="trip-toggle"
            checked={isSimulating}
            onCheckedChange={handleTripToggle}
          />
          <Label htmlFor="trip-toggle" className="cursor-pointer font-medium">
            {isSimulating ? (
              <span className="flex items-center gap-2">
                <Square className="w-4 h-4 text-emerald-600" />
                {t.driver.stopTrip}
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                {t.driver.startTrip}
              </span>
            )}
          </Label>
        </div>

        <div className={theme.misc.divider + ' h-5'} />

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
          <button
            onClick={() => setMapProvider('leaflet')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'leaflet' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Leaflet
          </button>
          <button
            onClick={() => setMapProvider('google')}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'google' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
          >
            Google Maps
          </button>
        </div>
      </motion.div>

      {/* Map */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {shipment && shipment.originLat != null && shipment.destinationLat != null ? (
          <div
            ref={() => setMapReady(true)}
            id="driver-route-map"
            className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl overflow-hidden border"
          />
        ) : (
          <div
            className="w-full h-[300px] sm:h-[400px] md:h-[500px] rounded-xl overflow-hidden border flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-6 text-center"
          >
            <p className={theme.typography.body}>
              {shipment
                ? 'Route coordinates have not been set for this shipment yet. Ask your manager to attach pickup and drop locations.'
                : t.driver.noAssignment}
            </p>
          </div>
        )}
      </motion.div>

      {/* Origin / Destination info cards */}
      {shipment && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className={theme.card.base}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base font-semibold">
                    {t.driver.origin}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={theme.typography.label}>{shipment.originAddress}</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className={theme.card.base}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-base font-semibold">
                    {t.driver.destination}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className={theme.typography.label}>{shipment.destinationAddress}</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </>
  );
}
