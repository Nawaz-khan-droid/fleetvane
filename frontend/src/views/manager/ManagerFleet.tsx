'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Truck, AlertCircle, Eye, EyeOff, Navigation, CheckCircle2, User, Phone, Mail, MapPinned, X, Activity, PackageCheck, Route, Loader2, Plus, Building2, MousePointerClick, Fuel, Weight, Boxes } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const SPRING_URL = process.env.NEXT_PUBLIC_SPRING_BOOT_URL || 'http://localhost:8080';

function formatCoords(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { setOnSessionExpired, triggerSessionExpired } from '@/lib/fetchWithAuth';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { loadGoogleMaps, isGoogleMapsKeyConfigured, createTrafficLayer } from '@/lib/maps';
import type { Vehicle, VehicleStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

interface RouteStop {
  shipmentId: number;
  lat: number;
  lng: number;
}
interface VehicleRoute {
  vehicleId: number;
  originalId: number;
  startLat: number;
  startLng: number;
  stops: RouteStop[];
}
interface RouteSolutionResponse {
  jobId: string;
  status: string;
  score: string | null;
  routes: VehicleRoute[];
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` };
}

const vehicleStatusBadge: Record<VehicleStatus, string> = {
  AVAILABLE: theme.status.active,
  IN_USE: theme.status.assigned,
  MAINTENANCE: theme.status.cancelled,
};

function formatVehicleStatus(status: VehicleStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ');
}

function markerColor(status: VehicleStatus): string {
  switch (status) {
    case 'AVAILABLE': return '#10b981';
    case 'IN_USE': return '#3b82f6';
    case 'MAINTENANCE': return '#ef4444';
    default: return '#10b981';
  }
}

function DetailRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className={theme.typography.caption}>{label}</p>
        <p className={theme.typography.label}>{value}</p>
      </div>
    </div>
  );
}

function MapsUnavailablePanel({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-8 gap-3 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm">
      <AlertCircle className="w-10 h-10 text-red-500" />
      <h3 className="font-semibold text-red-700 dark:text-red-300">Google Maps Unavailable</h3>
      <p className="text-sm text-red-600 dark:text-red-400 max-w-md">{message}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1">
        Fix: set a valid <code className="font-mono">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
        <code className="font-mono"> .env</code>, then restart the dev server.
        The Leaflet provider remains fully functional.
      </p>
    </div>
  );
}

interface AddDepotModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
  pickedCoords: { lat: number; lng: number } | null;
  onStartMapPick: () => void;
}

function AddDepotModal({ token, onClose, onSuccess, pickedCoords, onStartMapPick }: AddDepotModalProps) {
  const [form, setForm] = useState({
    name: '',
    city: '',
    address: '',
    lat: pickedCoords ? String(pickedCoords.lat) : '',
    lng: pickedCoords ? String(pickedCoords.lng) : '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (pickedCoords) {
      setForm(f => ({
        ...f,
        lat: pickedCoords.lat.toFixed(6),
        lng: pickedCoords.lng.toFixed(6),
      }));
    }
  }, [pickedCoords]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.city || !form.lat || !form.lng) {
      toast.error('Please enter name, city, and pick coordinates.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${SPRING_URL}/api/depots`, {
        name: form.name.trim(),
        city: form.city.trim(),
        address: form.address.trim(),
        lat: parseFloat(form.lat),
        lng: parseFloat(form.lng),
      }, { headers: authHeaders(token), timeout: 15000 });
      toast.success(`Depot "${form.name}" created successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to add depot: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-600" />
              Register New Depot / HQ Hub
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Add a new operational warehouse or home station</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Depot / HQ Name *</label>
              <input
                type="text"
                placeholder="e.g. North Regional Depot"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">City *</label>
              <input
                type="text"
                placeholder="e.g. Springfield"
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Address</label>
              <input
                type="text"
                placeholder="e.g. Plot 42, MIDC Ind Area"
                value={form.address}
                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Location Coordinates *</label>
                <button
                  type="button"
                  onClick={onStartMapPick}
                  className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <MousePointerClick className="w-3.5 h-3.5" />
                  Pick Pin on Map
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={form.lat}
                  onChange={e => setForm(f => ({ ...f, lat: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
                <input
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={form.lng}
                  onChange={e => setForm(f => ({ ...f, lng: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Building2 className="w-4 h-4" />}
              {submitting ? 'Creating...' : 'Create Depot'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface AddVehicleModalProps {
  token: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddVehicleModal({ token, onClose, onSuccess }: AddVehicleModalProps) {
  const [form, setForm] = useState({ plateNumber: '', type: 'VAN', model: '', capacity: '', fuelType: 'DIESEL', depotId: '' });
  const [depots, setDepots] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    axios.get(`${SPRING_URL}/api/depots`, { headers: authHeaders(token), timeout: 15000 })
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setDepots(data);
        if (data.length > 0) {
          setForm(f => ({ ...f, depotId: String(data[0].id) }));
        }
      })
      .catch(() => {});
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.plateNumber || !form.model || !form.capacity) {
      toast.error('Please fill all required fields.');
      return;
    }
    if (!form.depotId) {
      toast.error('Select a Home Depot — vehicles must start at a real, configured location.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${SPRING_URL}/api/vehicles`, {
        plateNumber: form.plateNumber.trim().toUpperCase(),
        type: form.type,
        model: form.model.trim(),
        capacity: parseFloat(form.capacity),
        fuelType: form.fuelType,
        depotId: form.depotId ? parseInt(form.depotId, 10) : null,
      }, { headers: authHeaders(token), timeout: 15000 });
      toast.success(`Vehicle ${form.plateNumber.toUpperCase()} registered at Home Depot!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to add vehicle: ${err.response?.data?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4"
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Add New Vehicle</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register a vehicle to the fleet</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Plate Number *</label>
              <input
                type="text"
                placeholder="e.g. MH-01-AB-1234"
                value={form.plateNumber}
                onChange={e => setForm(f => ({ ...f, plateNumber: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Vehicle Type *</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="VAN">Van</option>
                <option value="TRUCK">Truck</option>
                <option value="HEAVY_HAULER">Heavy Hauler</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Fuel Type *</label>
              <select
                value={form.fuelType}
                onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="DIESEL">Diesel</option>
                <option value="PETROL">Petrol</option>
                <option value="ELECTRIC">Electric</option>
                <option value="CNG">CNG</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Model *</label>
              <input
                type="text"
                placeholder="e.g. Tata Prima"
                value={form.model}
                onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Home Depot / Initial Station *</label>
              <select
                value={form.depotId}
                onChange={e => setForm(f => ({ ...f, depotId: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {depots.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.name} — {d.city} ({d.address})
                  </option>
                ))}
                {depots.length === 0 && <option value="" disabled>No depots yet — create one first</option>}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Vehicle starts parked at this depot until a driver initiates tracking.</p>
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Capacity (kg) *</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 15000"
                value={form.capacity}
                onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !form.depotId}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Adding...' : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function ManagerFleet() {
  const { state: authState, hasRole } = useAuth();
  const canManageFleet = hasRole(['MANAGER', 'ADMIN']);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err?.response?.status === 401 && !err?.config?.url?.includes('/api/auth/')) {
          triggerSessionExpired();
        }
        return Promise.reject(err);
      },
    );
    return () => { axios.interceptors.response.eject(interceptor); };
  }, []);

  const [depots, setDepots] = useState<any[]>([]);
  const [trafficView, setTrafficView] = useState(false);
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'google'>('leaflet');
  const [mapReady, setMapReady] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', authState.token],
    queryFn: async (): Promise<Vehicle[]> => {
      const res = await axios.get(`${SPRING_URL}/api/vehicles`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      return normalizePageResponse<Vehicle>(res.data).items;
    },
    enabled: !!authState.token,
    refetchInterval: 5000,
  });

  const vehicles = vehiclesQuery.data ?? [];
  const refetchVehicles = vehiclesQuery.refetch;
  const loading = vehiclesQuery.isPending;
  const connected = !vehiclesQuery.isPending && !vehiclesQuery.isError;

  useEffect(() => {
    if (!vehiclesQuery.isError) return;
    const err = vehiclesQuery.error as any;
    if (err instanceof ApiContractError) {
      toast.error('Unable to load fleet. Unexpected response format.');
    } else if (!err?.response) {
      console.error('Spring Boot unreachable:', err?.message);
    } else {
      toast.error(t.common.error);
    }
  }, [vehiclesQuery.isError, vehiclesQuery.error]);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDepotOpen, setIsAddDepotOpen] = useState(false);
  const [isPickingLocationOnMap, setIsPickingLocationOnMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const markerRefsRef = useRef<Map<string, any>>(new Map());
  const currentProviderRef = useRef<'leaflet' | 'google' | null>(null);
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<number>>(new Set());
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<number>>(new Set());
  const [optimizedRoutes, setOptimizedRoutes] = useState<RouteSolutionResponse | null>(null);
  const polylineGroupRef = useRef<any>(null);
  const googlePolylinesRef = useRef<any[]>([]);

  const googleKeyConfigured = isGoogleMapsKeyConfigured();

  const fetchDepots = useCallback(async () => {
    try {
      const res = await axios.get(`${SPRING_URL}/api/depots`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      setDepots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchDepots();
    setMapReady(true);
  }, [fetchDepots]);

  const fetchPendingShipments = async (): Promise<any[]> => {
    try {
      const res = await axios.get(`${SPRING_URL}/api/shipments`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      const pageData = normalizePageResponse<any>(res.data);
      const pending = pageData.items.filter((s: any) => s.status === 'REQUESTED' || s.status === 'ASSIGNED');
      setPendingShipments(pending);
      setSelectedShipmentIds(new Set(pending.map((s: any) => s.id)));
      return pending;
    } catch (err: any) {
      toast.error(`Failed to load shipments: ${err.response?.data?.message || err.message}`);
      return [];
    }
  };

  const handleOpenOptimizeModal = async () => {
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
    setSelectedVehicleIds(new Set(availableVehicles.map(v => Number(v.id))));
    await fetchPendingShipments();
    setIsOptimizeModalOpen(true);
  };

  const handleOptimize = async () => {
    if (selectedVehicleIds.size === 0 || selectedShipmentIds.size === 0) {
      toast.error('Select at least one vehicle and one shipment.');
      return;
    }
    setOptimizing(true);
    try {
      const res = await axios.post<RouteSolutionResponse>(
        `${SPRING_URL}/api/dispatch`,
        {},
        {
          headers: { ...authHeaders(authState.token ?? ''), 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );
      const solution = res.data;
      setOptimizedRoutes(solution);
      setIsOptimizeModalOpen(false);
      const totalStops = solution.routes.reduce((acc, r) => acc + r.stops.length, 0);
      toast.success(
        `Routes solved — ${solution.routes.length} vehicle(s), ` +
        `${totalStops} stop(s), score ${solution.score ?? 'n/a'}`
      );
      refetchVehicles();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message;
      toast.error(`Dispatch failed: ${msg}`);
    } finally {
      setOptimizing(false);
    }
  };

  useEffect(() => {
    if (mapProvider !== 'google' || !mapRef.current || mapsError) {
      trafficLayerRef.current?.setMap(null);
      return;
    }
    try {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = createTrafficLayer();
      }
      trafficLayerRef.current.setMap(trafficView ? mapRef.current : null);
    } catch (err: any) {
      console.error('TrafficLayer binding failed:', err.message);
    }
    return () => {
      trafficLayerRef.current?.setMap(null);
    };
  }, [trafficView, mapProvider, mapReady, mapsError]);

  useEffect(() => {
    const linkId = 'leaflet-css-fleet';
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  useEffect(() => {
    if (loading || !mapReady) return;
    if (currentProviderRef.current === mapProvider) return;

    let mapInstance: any;
    let leafletMarkers: any;
    let isCancelled = false;

    markerRefsRef.current.clear();
    const container = document.getElementById('fleet-map');
    if (container) {
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }

    if (mapProvider === 'leaflet') {
      trafficLayerRef.current?.setMap(null);
      googlePolylinesRef.current.forEach(p => p.setMap(null));
      googlePolylinesRef.current = [];

      (async () => {
        try {
          const L = (await import('leaflet')).default;
          if (isCancelled) return;
          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
            iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          });

          const mapEl = document.getElementById('fleet-map');
          if (!mapEl || isCancelled) return;
          mapInstance = L.map(mapEl).setView([0, 0], 2);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
          }).addTo(mapInstance);

          leafletMarkers = L.layerGroup().addTo(mapInstance);
          markerGroupRef.current = leafletMarkers;

          mapInstance.on('click', (e: any) => {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            setPickedCoords({ lat, lng });
            if (isPickingLocationOnMap) toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          });

          mapRef.current = mapInstance;
          currentProviderRef.current = 'leaflet';
        } catch (err: any) {
          if (!isCancelled) {
            console.error('Leaflet map init failed:', err?.message);
            setMapsError(err?.message || 'Leaflet failed to initialize.');
          }
        }
      })();
    } else {
      if (!googleKeyConfigured) {
        setMapsError('The Google Maps API key is not configured in this environment.');
        currentProviderRef.current = 'google';
        mapRef.current = null;
        return;
      }

      (async () => {
        try {
          await loadGoogleMaps();
          if (isCancelled) return;

          const mapEl = document.getElementById('fleet-map');
          if (!mapEl) return;

          mapInstance = new window.google.maps.Map(mapEl, {
            center: { lat: 0, lng: 0 },
            zoom: 2,
            mapId: 'DEMO_MAP_ID',
            disableDefaultUI: true,
            zoomControl: true,
          });

          mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setPickedCoords({ lat, lng });
              if (isPickingLocationOnMap) toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          });

          mapRef.current = mapInstance;
          currentProviderRef.current = 'google';
          setMapsError(null);
        } catch (err: any) {
          if (!isCancelled) {
            setMapsError(err?.message || 'Google Maps failed to initialize.');
            mapRef.current = null;
          }
        }
      })();
    }

    return () => {
      isCancelled = true;
      markerRefsRef.current.clear();
      if (currentProviderRef.current === 'leaflet') {
        leafletMarkers?.remove();
        mapInstance?.remove();
      }
      mapRef.current = null;
      currentProviderRef.current = null;
    };
  }, [loading, mapReady, mapProvider]);

  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mapProvider === 'leaflet') {
      (async () => {
        try {
          if (!map.getContainer()?.isConnected) return;
          const L = (await import('leaflet')).default;
          const group = markerGroupRef.current;
          if (!group || !map.getContainer()?.isConnected) return;

          group.clearLayers();
          markerRefsRef.current.clear();

          depots.forEach(d => {
            const depotIcon = L.divIcon({
              html: `<div style="width:20px;height:20px;border-radius:4px;background:#9333ea;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4)" title="${d.name}">🏢</div>`,
              className: '', iconSize: [20, 20], iconAnchor: [10, 10]
            });
            const marker = L.marker([d.lat, d.lng], { icon: depotIcon }).addTo(group);
            marker.bindTooltip(`<b>${d.name}</b><br/>${d.city}`);
          });

          vehicles.forEach((v) => {
            const color = markerColor(v.status);
            const icon = L.divIcon({
              html: `<div class="vehicle-dot" style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.3s ease"></div>`,
              className: '', iconSize: [14, 14], iconAnchor: [7, 7],
            });
            const marker = L.marker([v.lat, v.lng], { icon }).addTo(group);
            marker.on('click', () => setSelectedVehicle(v));
            (marker as any)._vehicleId = v.id;
            markerRefsRef.current.set(v.id, marker);
          });

          if (pickedCoords) {
            const pickIcon = L.divIcon({
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px #ef4444;animation:ping 1s infinite"></div>`,
              className: '', iconSize: [18, 18], iconAnchor: [9, 9],
            });
            L.marker([pickedCoords.lat, pickedCoords.lng], { icon: pickIcon }).addTo(group);
          }

          if (!initialFitDoneRef.current && vehicles.length > 0) {
            const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
            map.fitBounds(bounds, { padding: [40, 40] });
            initialFitDoneRef.current = true;
          }
        } catch (err: any) {
          if (err?.message !== 'Map container not found.') {
            console.error('Leaflet marker render failed:', err?.message);
          }
        }
      })();
    } else {
      if (!window.google?.maps || mapsError) return;

      (async () => {
        try {
          await loadGoogleMaps();
          const { AdvancedMarkerElement } =
            (await window.google.maps.importLibrary('marker')) as google.maps.MarkerLibrary;

          markerRefsRef.current.forEach((marker) => {
            if (marker && marker.map) marker.map = null;
          });
          markerRefsRef.current.clear();

          const bounds = new google.maps.LatLngBounds();

          depots.forEach(d => {
            const el = document.createElement('div');
            el.style.cssText = 'width:20px;height:20px;border-radius:4px;background:#9333ea;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4)';
            el.textContent = '🏢';
            el.title = d.name;
            new AdvancedMarkerElement({ map, position: { lat: d.lat, lng: d.lng }, content: el });
            bounds.extend({ lat: d.lat, lng: d.lng });
          });

          vehicles.forEach((v) => {
            const color = markerColor(v.status);
            const dot = document.createElement('div');
            dot.className = 'vehicle-dot';
            dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.3s ease`;

            const marker = new AdvancedMarkerElement({
              map,
              position: { lat: v.lat, lng: v.lng },
              content: dot,
            });

            marker.addListener('click', () => setSelectedVehicle(v));
            markerRefsRef.current.set(v.id, marker);
            bounds.extend({ lat: v.lat, lng: v.lng });
          });

          if (pickedCoords) {
            const pin = document.createElement('div');
            pin.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px #ef4444';
            new AdvancedMarkerElement({ map, position: pickedCoords, content: pin });
          }

          if (!initialFitDoneRef.current && vehicles.length > 0) {
            map.fitBounds(bounds, 40);
            initialFitDoneRef.current = true;
          }
        } catch (err: any) {
          console.error('Google marker rendering failed:', err.message);
        }
      })();
    }
  }, [vehicles, depots, pickedCoords, mapProvider, mapsError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !optimizedRoutes) return;

    if (mapProvider === 'leaflet') {
      (async () => {
        try {
          if (!map.getContainer()?.isConnected) return;
          const L = (await import('leaflet')).default;
          polylineGroupRef.current?.clearLayers();
          polylineGroupRef.current = L.layerGroup().addTo(map);

          optimizedRoutes.routes.forEach((route) => {
            const coords: [number, number][] = [[route.startLat, route.startLng]];
            route.stops.forEach((stop) => coords.push([stop.lat, stop.lng]));
            if (coords.length > 1) {
              L.polyline(coords, { color: '#3b82f6', weight: 4, opacity: 0.8 })
                .addTo(polylineGroupRef.current);
            }
          });
        } catch (err: any) {
          console.error('Polyline render failed:', err?.message);
        }
      })();
    } else {
      if (!window.google?.maps) return;
      googlePolylinesRef.current.forEach(p => p.setMap(null));
      googlePolylinesRef.current = [];

      optimizedRoutes.routes.forEach((route) => {
        const path: google.maps.LatLngLiteral[] = [
          { lat: route.startLat, lng: route.startLng },
          ...route.stops.map((stop) => ({ lat: stop.lat, lng: stop.lng })),
        ];
        if (path.length > 1) {
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#3b82f6',
            strokeOpacity: 0.8,
            strokeWeight: 4,
          });
          polyline.setMap(map);
          googlePolylinesRef.current.push(polyline);
        }
      });
    }
  }, [optimizedRoutes, mapProvider]);

  const handleVehicleClick = (vehicle: Vehicle) => {
    const map = mapRef.current;
    if (!map) return;

    if (mapProvider === 'leaflet') {
      map.setView([vehicle.lat, vehicle.lng], 14, { animate: true });
    } else {
      map.panTo({ lat: vehicle.lat, lng: vehicle.lng });
      map.setZoom(14);
    }

    setSelectedVehicle(vehicle);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  const showMapsErrorPanel = mapProvider === 'google' && !!mapsError;
  const availableCount = vehicles.filter(v => v.status === 'AVAILABLE').length;
  const activeCount = vehicles.filter(v => v.status === 'IN_USE').length;
  const totalCount = vehicles.length;

  return (
    <>
      <AnimatePresence>
        {optimizing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4"
          >
            <Loader2 className="w-14 h-14 animate-spin text-emerald-400" />
            <p className="text-white font-semibold text-lg">Dispatching & solving routes…</p>
            <p className="text-slate-300 text-sm">Timefold VRP running synchronously (max 30s)</p>
            <div className="w-56 h-1.5 bg-slate-700 rounded-full overflow-hidden mt-2">
              <div className="h-full w-1/3 bg-emerald-500 rounded-full animate-[slide_1.2s_ease-in-out_infinite]" style={{ animationName: 'solverSlide' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddDepotOpen && canManageFleet && (
          <AddDepotModal
            token={authState.token!}
            onClose={() => setIsAddDepotOpen(false)}
            onSuccess={fetchDepots}
            pickedCoords={pickedCoords}
            onStartMapPick={() => {
              setIsPickingLocationOnMap(true);
              toast.info('Click anywhere on the map to pinpoint exact Depot location!');
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isAddVehicleOpen && canManageFleet && (
          <AddVehicleModal
            token={authState.token!}
            onClose={() => setIsAddVehicleOpen(false)}
            onSuccess={refetchVehicles}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOptimizeModalOpen && canManageFleet && (
          <div className="fixed inset-0 z-[1500] pointer-events-none">
            <motion.div
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="pointer-events-auto absolute top-0 left-0 w-80 h-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-2xl border-r border-slate-200/50 dark:border-slate-700/50 flex flex-col"
            >
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <h3 className={theme.typography.h5}>Optimize Routes</h3>
                <button onClick={() => setIsOptimizeModalOpen(false)} className={theme.button.iconBtn}>
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-auto p-5 space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-3">Available Vehicles</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {vehicles.filter(v => v.status === 'AVAILABLE').map(v => (
                      <div key={v.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`veh-${v.id}`}
                          checked={selectedVehicleIds.has(Number(v.id))}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedVehicleIds);
                            if (checked) newSet.add(Number(v.id));
                            else newSet.delete(Number(v.id));
                            setSelectedVehicleIds(newSet);
                          }}
                        />
                        <label htmlFor={`veh-${v.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          {v.plateNumber} ({v.type})
                        </label>
                      </div>
                    ))}
                    {vehicles.filter(v => v.status === 'AVAILABLE').length === 0 && (
                      <p className="text-xs text-slate-500">No available vehicles.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-3">Pending Shipments</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {pendingShipments.map(s => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`shp-${s.id}`}
                          checked={selectedShipmentIds.has(s.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedShipmentIds);
                            if (checked) newSet.add(s.id);
                            else newSet.delete(s.id);
                            setSelectedShipmentIds(newSet);
                          }}
                        />
                        <label htmlFor={`shp-${s.id}`} className="text-sm font-medium leading-none cursor-pointer">
                          Order #{s.id} — {s.destinationAddress?.substring(0, 22) || 'Unknown'}...
                        </label>
                      </div>
                    ))}
                    {pendingShipments.length === 0 && (
                      <p className="text-xs text-slate-500">No pending shipments found.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3">
                  <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    Batch dispatch auto-assigns all REQUESTED shipments to available vehicles via VRP solver.
                  </p>
                </div>
              </div>
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  onClick={handleOptimize}
                  disabled={selectedVehicleIds.size === 0 || selectedShipmentIds.size === 0 || optimizing}
                  className={`${theme.button.primary} w-full`}
                >
                  {optimizing ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" />Solving...</> : 'Dispatch & Optimize'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVehicle && (
          <div className="fixed inset-0 z-[1500] pointer-events-none">
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="pointer-events-auto absolute top-0 right-0 w-80 h-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md shadow-2xl border-l border-slate-200/50 dark:border-slate-700/50 overflow-auto"
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className={theme.typography.h5}>{t.manager.vehicleDetails}</h3>
                  <button onClick={() => setSelectedVehicle(null)} className={theme.button.iconBtn}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <DetailRow icon={Truck} label={t.manager.plateNumber} value={selectedVehicle.plateNumber} />
                  <DetailRow icon={Truck} label={t.manager.vehicleType} value={selectedVehicle.type} />
                  <DetailRow icon={Truck} label={t.manager.vehicleModel} value={selectedVehicle.model} />
                  <DetailRow icon={PackageCheck} label={t.manager.capacity} value={`${selectedVehicle.capacity} kg`} />
                  <DetailRow icon={Fuel} label="Fuel Type" value={selectedVehicle.fuelType} />
                  <DetailRow icon={MapPinned} label={t.manager.vehicleStatus} value={
                    <Badge className={`${theme.status.badge} ${vehicleStatusBadge[selectedVehicle.status]}`}>
                      {formatVehicleStatus(selectedVehicle.status)}
                    </Badge>
                  } />
                  <DetailRow
                    icon={User}
                    label={t.manager.assignedDriver}
                    value={
                      selectedVehicle.driverProfiles && selectedVehicle.driverProfiles.length > 0
                        ? selectedVehicle.driverProfiles[0].user.name
                        : '—'
                    }
                  />
                  <DetailRow
                    icon={MapPin}
                    label={t.manager.lastKnownCoords}
                    value={formatCoords(selectedVehicle.lat, selectedVehicle.lng)}
                  />
                </div>

                <button
                  onClick={() => setSelectedVehicle(null)}
                  className={`${theme.button.outline} w-full mt-6`}
                >
                  {t.manager.close}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ═══ MAIN FLEET VIEW — full-width immersive map ═══ */}
      <div
        className="relative -mx-4 lg:-mx-8 rounded-none"
        style={{ height: 'min(75vh, calc(100vh - 6rem))' }}
      >
        {/* Map Surface */}
        <div
          id="fleet-map"
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 0 }}
        />

        {showMapsErrorPanel && <MapsUnavailablePanel message={mapsError!} />}

        {/* ── Top-Left: Fleet Actions Panel ── */}
        {canManageFleet && (
          <div className="absolute top-4 left-4 z-10 w-52">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">Fleet Actions</p>
              </div>
              <div className="p-2 space-y-1">
                <button
                  onClick={() => setIsAddDepotOpen(true)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-left flex items-center gap-2.5 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Building2 className="w-4 h-4 text-purple-600" />
                  Add Depot / HQ
                </button>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-left flex items-center gap-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-slate-700 dark:text-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4 text-blue-600" />
                  Add Vehicle
                </button>
                <button
                  onClick={handleOpenOptimizeModal}
                  disabled={optimizing}
                  className="w-full px-3 py-2 text-xs font-medium rounded-lg text-left flex items-center gap-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  {optimizing ? <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" /> : <Route className="w-4 h-4 text-emerald-600" />}
                  Optimize Routes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Top-Right: Map Controls Panel ── */}
        <div className="absolute top-4 right-4 z-10 w-48">
          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
            <div className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 tracking-wide uppercase">Map Controls</p>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="traffic-toggle-fleet" className="cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  {trafficView ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                  Traffic
                </Label>
                <Switch
                  id="traffic-toggle-fleet"
                  checked={trafficView}
                  onCheckedChange={(v) => {
                    if (v && mapProvider === 'google' && !googleKeyConfigured) {
                      toast.error('Configure NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable traffic.');
                      return;
                    }
                    if (v && mapProvider === 'leaflet') {
                      toast.info('Switch to Google Maps to enable the live traffic layer.');
                      return;
                    }
                    setTrafficView(v);
                  }}
                />
              </div>

              <div className="h-px bg-slate-200/50 dark:bg-slate-700/50" />

              <div>
                <p className="text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Provider</p>
                <div className="flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-0.5 rounded-lg">
                  <button
                    onClick={() => { setTrafficView(false); setMapProvider('leaflet'); }}
                    className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${mapProvider === 'leaflet' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Leaflet
                  </button>
                  <button
                    onClick={() => setMapProvider('google')}
                    className={`flex-1 px-2 py-1 text-[11px] font-medium rounded-md transition-all ${mapProvider === 'google' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                  >
                    Google
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-200/50 dark:bg-slate-700/50" />

              {/* Fleet Stats */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500">Total</span>
                  <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">{totalCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Available
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">{availableCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Active
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600">{activeCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Picker Banner ── */}
        <AnimatePresence>
          {isPickingLocationOnMap && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-purple-600 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2"
            >
              <MousePointerClick className="w-4 h-4 shrink-0" />
              Click anywhere on the map to place Depot Pin
              <button
                onClick={() => setIsPickingLocationOnMap(false)}
                className="ml-1 hover:bg-purple-700 rounded-full p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom: Live Status Feed — horizontal vehicle cards ── */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-gradient-to-t from-black/60 via-black/30 to-transparent pt-8 pb-0">
            <div className="px-4 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={theme.liveIndicator.wrapper} title={connected ? 'Polling Spring Boot every 5s' : 'Backend unreachable'}>
                  <span className="relative flex items-center justify-center">
                    {connected && <span className={theme.liveIndicator.pulseRing} />}
                    <span className={connected ? theme.liveIndicator.dotLive : theme.liveIndicator.dotOffline} />
                  </span>
                  <span className={connected ? theme.liveIndicator.labelLive : theme.liveIndicator.labelOffline}>
                    {connected ? 'Live' : 'Offline'}
                  </span>
                </span>
                <span className="text-white/60 text-[11px]">•</span>
                <span className="text-white/80 text-[11px] font-medium">
                  {totalCount} vehicle{totalCount !== 1 ? 's' : ''} tracked
                </span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-thin">
              {vehicles.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleVehicleClick(v)}
                  className="flex-shrink-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-white/20 dark:border-slate-700/50 text-left hover:scale-[1.02] transition-transform cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{v.plateNumber}</span>
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: markerColor(v.status) }}
                    />
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{v.model}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Boxes className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-300">{v.capacity} kg</span>
                  </div>
                  {v.driverProfiles && v.driverProfiles.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">{v.driverProfiles[0].user.name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-400 italic">Unassigned</span>
                    </div>
                  )}
                </button>
              ))}
              {vehicles.length === 0 && (
                <div className="w-full text-center py-6">
                  <p className="text-white/60 text-sm">No vehicles in fleet</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
