'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Truck, AlertCircle, Eye, EyeOff, Navigation, CheckCircle2, User, Phone, Mail, MapPinned, X, Activity, PackageCheck, Route, Loader2, Plus, Building2, MousePointerClick, Fuel, Weight, Boxes } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

const SPRING_URL = process.env.NEXT_PUBLIC_SPRING_BOOT_URL || 'http://localhost:8080';

import { fetchRoadRoute, fetchRouteWithTraffic } from '@/lib/directions';

function formatCoords(lat?: number | null, lng?: number | null): string {
  if (lat == null || lng == null) return '-';
  return `${lat.toFixed(4)}°, ${lng.toFixed(4)}°`;
}

import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { setOnSessionExpired, triggerSessionExpired, fetchWithAuth } from '@/lib/fetchWithAuth';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { loadGoogleMaps, isGoogleMapsKeyConfigured } from '@/lib/maps';
import { useTrackingWebSocket } from '@/hooks/useTrackingWebSocket';
import { useStore } from '@/store/useStore';
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
  geometry?: [number, number][];
  distanceMeters?: number;
  durationSeconds?: number;
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
    case 'AVAILABLE': return '#3b82f6';
    case 'IN_USE': return '#10b981';
    case 'MAINTENANCE': return '#ef4444';
    default: return '#3b82f6';
  }
}

export const ROUTE_COLORS = [
  '#4f46e5', // Vibrant Electric Indigo (MH-01 / v1)
  '#059669', // Emerald Green (MH-02 / v2)
  '#ea580c', // Sunset Coral/Orange (MH-04 / v3)
  '#0284c7', // Sky Blue / Cyan (MH-46 / v4)
  '#9333ea', // Vivid Violet / Purple (MH-12 / v5)
  '#e11d48', // Crimson Rose
  '#d97706', // Golden Amber
  '#0891b2', // Deep Teal
];

export function getVehicleRouteColor(vehicleId: any, plate?: string): string {
  const p = (plate || '').toUpperCase();
  if (p.includes('MH-01') || String(vehicleId) === '1' || String(vehicleId) === '9') return '#4f46e5';
  if (p.includes('MH-02') || String(vehicleId) === '2') return '#059669';
  if (p.includes('MH-04') || String(vehicleId) === '3') return '#ea580c';
  if (p.includes('MH-46') || String(vehicleId) === '4') return '#0284c7';
  if (p.includes('MH-12') || String(vehicleId) === '5') return '#9333ea';
  const idNum = Math.abs(parseInt(String(vehicleId), 10) || 0);
  return ROUTE_COLORS[idNum % ROUTE_COLORS.length];
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
      await axios.post('/api/depots', {
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
    if (!token) return;
    axios.get(`/api/depots`, { headers: authHeaders(token), timeout: 15000 })
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
      toast.error('Select a Home Depot: vehicles must start at a real, configured location.');
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`/api/vehicles`, {
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
                    {d.name} - {d.city} ({d.address})
                  </option>
                ))}
                {depots.length === 0 && <option value="" disabled>No depots yet - create one first</option>}
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
  const [mapReadyInstance, setMapReadyInstance] = useState<any>(null);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [activeShipmentDetails, setActiveShipmentDetails] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [togglingSimulation, setTogglingSimulation] = useState(false);

  const vehiclesQuery = useQuery({
    queryKey: ['vehicles', authState.token],
    queryFn: async (): Promise<Vehicle[]> => {
      const res = await axios.get(`/api/vehicles`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      return normalizePageResponse<Vehicle>(res.data).items;
    },
    enabled: !!authState.token,
    refetchInterval: 30000,
  });

  const driversQuery = useQuery({
    queryKey: ['fleet-drivers', authState.token],
    queryFn: async (): Promise<any[]> => {
      const res = await axios.get(`/api/drivers`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      return normalizePageResponse<any>(res.data).items;
    },
    enabled: !!authState.token,
    staleTime: 60000,
  });

  const shipmentsQuery = useQuery({
    queryKey: ['fleet-shipments', authState.token],
    queryFn: async (): Promise<any[]> => {
      const res = await axios.get(`/api/shipments?size=100&sort=id,desc`, {
        headers: authHeaders(authState.token ?? ''),
        timeout: 15000,
      });
      return normalizePageResponse<any>(res.data).items;
    },
    enabled: !!authState.token,
    refetchInterval: 15000,
  });

  const { vehicles, setVehicles, drivers, setDrivers, setShipments } = useStore();

  useEffect(() => {
    if (vehiclesQuery.data) {
      setVehicles(vehiclesQuery.data);
    }
  }, [vehiclesQuery.data, setVehicles]);

  useEffect(() => {
    if (driversQuery.data) {
      setDrivers(driversQuery.data);
    }
  }, [driversQuery.data, setDrivers]);

  useEffect(() => {
    if (shipmentsQuery.data) {
      setShipments(shipmentsQuery.data);
    }
  }, [shipmentsQuery.data, setShipments]);

  const resolveDriverName = useCallback((v: Vehicle | null): string => {
    if (!v) return '-';
    // 1. Check direct driverProfile link
    const driverByProfile = drivers?.find(d =>
      String(d.driverProfile?.vehicleId) === String(v.id) ||
      String((d as any).vehicleId) === String(v.id)
    );
    if (driverByProfile?.name) return driverByProfile.name;

    // 2. Check active shipment driver
    const activeShip = shipmentsQuery.data?.find((s: any) =>
      (String(s.vehicleId) === String(v.id) || String(s.assignedVehicleId) === String(v.id)) &&
      s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
    );
    if (activeShip?.driver?.name) return activeShip.driver.name;
    if (activeShip?.driverId) {
      const match = drivers?.find(d => String(d.id) === String(activeShip.driverId) || String((d as any).userId) === String(activeShip.driverId));
      if (match?.name) return match.name;
    }

    // 3. Fallback for demo vehicles in Mumbai logistics fleet
    const plate = v.plateNumber || '';
    if (plate.includes('MH-01') || String(v.id) === '1') return 'Rajesh Kumar';
    if (plate.includes('MH-02') || String(v.id) === '2') return 'Priya Sharma';
    if (plate.includes('MH-04') || String(v.id) === '3') return 'Amit Singh';
    if (plate.includes('MH-46') || String(v.id) === '4') return 'Rajesh Kumar';
    if (plate.includes('MH-12') || String(v.id) === '5') return 'Priya Sharma';

    return '-';
  }, [drivers, shipmentsQuery.data]);

  const handleToggleSimulation = async () => {
    setTogglingSimulation(true);
    try {
      const nextState = !isSimulating;
      await axios.post('/api/simulation', { action: nextState ? 'start' : 'stop' }, {
        headers: authHeaders(authState.token ?? ''),
      });
      setIsSimulating(nextState);
      toast.success(nextState ? 'Live fleet simulation started: vehicles moving' : 'Fleet simulation paused');
    } catch {
      toast.error('Simulation control unavailable');
    } finally {
      setTogglingSimulation(false);
    }
  };

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
  const isPickingLocationOnMapRef = useRef(isPickingLocationOnMap);
  const leafletPickedMarkerRef = useRef<any>(null);
  const googlePickedMarkerRef = useRef<any>(null);

  useEffect(() => {
    isPickingLocationOnMapRef.current = isPickingLocationOnMap;
    if (!isPickingLocationOnMap) {
      setPickedCoords(null);
      if (googlePickedMarkerRef.current) {
        googlePickedMarkerRef.current.setMap(null);
        googlePickedMarkerRef.current = null;
      }
      if (leafletPickedMarkerRef.current && markerGroupRef.current) {
        markerGroupRef.current.removeLayer(leafletPickedMarkerRef.current);
        leafletPickedMarkerRef.current = null;
      }
    }
  }, [isPickingLocationOnMap]);

  const mapRef = useRef<any>(null);
  const markerGroupRef = useRef<any>(null);
  const leafletMarkerRefsRef = useRef<Map<string, any>>(new Map());
  const googleMarkerRefsRef = useRef<Map<string, any>>(new Map());
  const currentProviderRef = useRef<'leaflet' | 'google' | null>(null);

  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<number>>(new Set());
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<number>>(new Set());
  const [optimizedRoutes, setOptimizedRoutes] = useState<RouteSolutionResponse | null>(null);
  const polylineGroupRef = useRef<any>(null);
  const googlePolylinesRef = useRef<any[]>([]);
  const vehicleRoutePolylineRef = useRef<any>(null);
  const vehicleGooglePolylineRef = useRef<any[]>([]);
  const vehicleRouteMarkersRef = useRef<any[]>([]);
  const depotsRenderedRef = useRef(false);
  const depotCountRef = useRef(0);
  const depotMarkersRef = useRef<any[]>([]);

  const googleKeyConfigured = isGoogleMapsKeyConfigured();

  const { updateVehicleLocation } = useStore();
  
  // --- WEB_SOCKET LIVE TRACKING ---
  useTrackingWebSocket({
    token: authState.token,
    subscribeFleet: true,
    onVehicleUpdate: (loc) => {
      // 1. Force dynamic view re-render by patching global state
      updateVehicleLocation(loc.vehicleId.toString(), loc.lat, loc.lng, loc.speed, loc.heading);
      
      // 2. Also manually update marker if available
      if (mapProvider === 'leaflet') {
        const marker = leafletMarkerRefsRef.current.get(String(loc.vehicleId));
        if (marker) {
          marker.setLatLng([loc.lat, loc.lng]);
          const el = marker.getElement();
          const dot = el?.querySelector('.vehicle-dot') as HTMLElement;
          if (dot) {
             dot.style.transform = `rotate(${loc.heading || 0}deg)`;
          }
        }
      } else if (mapProvider === 'google') {
        const marker = googleMarkerRefsRef.current.get(String(loc.vehicleId));
        if (marker && typeof marker.setPosition === 'function') {
          marker.setPosition({ lat: loc.lat, lng: loc.lng });
          const routeColor = getVehicleRouteColor(loc.vehicleId);
          const heading = Math.round(loc.heading || 0);
          marker.setIcon({
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" fill="#0f172a" stroke="${routeColor}" stroke-width="2.5"/>
                <g transform="rotate(${heading} 22 22)">
                  <polygon points="22,7 33,33 22,26 11,33" fill="${routeColor}"/>
                </g>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(44, 44),
            anchor: new window.google.maps.Point(22, 22),
          });
        }
      }
    }
  });
  // --------------------------------



  const [sidebarPortal, setSidebarPortal] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSidebarPortal(document.getElementById('fleet-actions-portal'));
  }, []);

  const fetchDepots = useCallback(async () => {
    if (!authState.token) return;
    try {
      const res = await axios.get(`/api/depots`, {
        headers: authHeaders(authState.token),
        timeout: 15000,
      });
      setDepots(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.warn('Depots fetch error:', err?.message);
    }
  }, [authState.token]);

  useEffect(() => {
    if (authState.token) {
      fetchDepots();
    }
    setMapReady(true);
  }, [fetchDepots, authState.token]);

  useEffect(() => {
    (window as any).deleteDepot = (id: number) => {
      if (window.confirm('Are you sure you want to delete this hub?')) {
        fetchWithAuth(`/api/depots/${id}`, { method: 'DELETE' })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => null);
              throw new Error(err?.detail || err?.message || 'Failed to delete hub.');
            }
            toast.success('Hub deleted successfully');
            fetchDepots();
          })
          .catch((err) => toast.error(err.message || 'Failed to delete hub.'));
      }
    };
    return () => {
      delete (window as any).deleteDepot;
    };
  }, [fetchDepots]);

  const fetchPendingShipments = async (): Promise<any[]> => {
    if (!authState.token) return [];
    try {
      const res = await axios.get(`/api/shipments`, {
        headers: authHeaders(authState.token),
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
    if (!authState.token) {
      toast.error('Authentication required.');
      return;
    }
    setOptimizing(true);
    try {
      const res = await axios.post<RouteSolutionResponse>(
        `/api/dispatch`,
        {},
        {
          headers: { ...authHeaders(authState.token), 'Content-Type': 'application/json' },
          timeout: 45000,
        }
      );
      const solution = res.data;
      setOptimizedRoutes(solution);
      setIsOptimizeModalOpen(false);
      const totalStops = solution.routes.reduce((acc, r) => acc + r.stops.length, 0);
      toast.success(
        `Routes solved: ${solution.routes.length} vehicle(s), ` +
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

    leafletMarkerRefsRef.current.clear();
    googleMarkerRefsRef.current.forEach(m => { if (typeof m?.setMap === 'function') m.setMap(null); });
    googleMarkerRefsRef.current.clear();
    const container = document.getElementById('fleet-map');
    if (container) {
      container.innerHTML = '';
      delete (container as any)._leaflet_id;
    }

    if (mapProvider === 'leaflet') {
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
          mapInstance = L.map(mapEl, {
            worldCopyJump: false,
            maxBounds: [[-90, -180], [90, 180]],
            maxBoundsViscosity: 1.0,
            minZoom: 3,
          }).setView([20, 0], 3);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap',
            noWrap: true,
          }).addTo(mapInstance);

          leafletMarkers = L.layerGroup().addTo(mapInstance);
          markerGroupRef.current = leafletMarkers;

          mapInstance.on('click', (e: any) => {
            if (!isPickingLocationOnMapRef.current) return;
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;
            setPickedCoords({ lat, lng });
            toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          });

          mapRef.current = mapInstance;
          currentProviderRef.current = 'leaflet';
          setMapReadyInstance(mapInstance);
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
        setMapReadyInstance(null);
        return;
      }

      (async () => {
        try {
          await loadGoogleMaps();
          if (isCancelled) return;

          const mapEl = document.getElementById('fleet-map');
          if (!mapEl) return;

          mapInstance = new window.google.maps.Map(mapEl, {
            center: { lat: 19.0760, lng: 72.8777 },
            zoom: 12,
            minZoom: 3,
            restriction: {
              latLngBounds: { north: 85, south: -85, west: -180, east: 180 },
              strictBounds: true,
            },
            disableDefaultUI: true,
            zoomControl: true,
          });

          mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
            if (!isPickingLocationOnMapRef.current) return;
            if (e.latLng) {
              const lat = e.latLng.lat();
              const lng = e.latLng.lng();
              setPickedCoords({ lat, lng });
              toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          });

          mapRef.current = mapInstance;
          currentProviderRef.current = 'google';
          setMapsError(null);
          setMapReadyInstance(mapInstance);
        } catch (err: any) {
          if (!isCancelled) {
            setMapsError(err?.message || 'Google Maps failed to initialize.');
            mapRef.current = null;
            setMapReadyInstance(null);
          }
        }
      })();
    }

    return () => {
      isCancelled = true;
      depotsRenderedRef.current = false;
      depotCountRef.current = 0;
      leafletMarkerRefsRef.current.clear();
      googleMarkerRefsRef.current.forEach(m => { if (typeof m?.setMap === 'function') m.setMap(null); });
      googleMarkerRefsRef.current.clear();
      if (currentProviderRef.current === 'leaflet') {
        leafletMarkers?.remove();
        mapInstance?.remove();
      }
      mapRef.current = null;
      currentProviderRef.current = null;
      setMapReadyInstance(null);
    };
  }, [loading, mapReady, mapProvider]);

  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current || mapReadyInstance;
    if (!map) return;

    if (mapProvider === 'leaflet') {
      if (typeof (map as any).getContainer !== 'function') return;
      (async () => {
        try {
          if (!map.getContainer?.()?.isConnected) return;
          const L = (await import('leaflet')).default;
          const group = markerGroupRef.current;
          if (!group || !map.getContainer?.()?.isConnected) return;

          // Render depots once or when depots change
          if (!depotsRenderedRef.current || depots.length !== depotCountRef.current) {
            depotMarkersRef.current.forEach(m => group.removeLayer(m));
            depotMarkersRef.current = [];
            depots.forEach(d => {
              const depotIcon = L.divIcon({
                html: `<div style="width:20px;height:20px;border-radius:4px;background:#9333ea;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4)" title="${d.name}">🏢</div>`,
                className: '', iconSize: [20, 20], iconAnchor: [10, 10]
              });
              const marker = L.marker([d.lat, d.lng], { icon: depotIcon }).addTo(group);
              marker.bindPopup(`
                <div class="p-2 min-w-[140px]">
                  <div class="font-bold text-sm mb-1">${d.name}</div>
                  <div class="text-xs text-slate-500 mb-3">${d.city}</div>
                  <button onclick="window.deleteDepot(${d.id})" class="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded w-full border border-red-200 transition-colors">
                    Delete Hub
                  </button>
                </div>
              `);
              depotMarkersRef.current.push(marker);
            });
            depotsRenderedRef.current = true;
            depotCountRef.current = depots.length;
          }

          // In-place vehicle marker updates (NEVER clear layers -> ZERO jumping!)
          const activeIds = new Set(vehicles.map(v => String(v.id)));
          leafletMarkerRefsRef.current.forEach((marker, id) => {
            if (!activeIds.has(id)) {
              group.removeLayer(marker);
              leafletMarkerRefsRef.current.delete(id);
            }
          });

          vehicles.forEach((v) => {
            const isMoving = v.status === 'IN_USE';
            const routeColor = getVehicleRouteColor(v.id, v.plateNumber);
            const plateLabel = v.plateNumber?.split('-').slice(0, 2).join('-') || v.plateNumber;
            const existingMarker = leafletMarkerRefsRef.current.get(String(v.id));

            if (existingMarker) {
              existingMarker.setLatLng([v.lat, v.lng]);
              const el = existingMarker.getElement();
              const dot = el?.querySelector('.vehicle-dot') as HTMLElement;
              if (dot) {
                dot.style.transform = `rotate(${v.heading || 0}deg)`;
              }
              existingMarker.off('click');
              existingMarker.on('click', () => handleVehicleClick(v));
            } else {
              const iconHtml = `
                <div class="vehicle-marker-wrapper" style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
                  ${isMoving ? `
                    <div style="position:absolute;width:40px;height:40px;border-radius:50%;background:${routeColor};opacity:0.35;animation:ping 2s cubic-bezier(0,0,0.2,1) infinite;"></div>
                    <div style="position:absolute;width:44px;height:44px;border-radius:50%;background:${routeColor}26;"></div>
                  ` : ''}
                  <div class="vehicle-dot" style="position:relative;z-index:10;width:32px;height:32px;border-radius:50%;background:${isMoving ? '#0f172a' : '#334155'};border:2.5px solid ${isMoving ? routeColor : '#ffffff'};box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;transition:transform 0.4s ease-out;transform:rotate(${v.heading || 0}deg);">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${isMoving ? routeColor : '#94a3b8'}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2L19 21L12 17L5 21L12 2Z" fill="${isMoving ? routeColor : '#64748b'}" fill-opacity="0.9"/>
                    </svg>
                  </div>
                  <div style="position:absolute;bottom:-14px;left:50%;transform:translateX(-50%);background:#0f172a;color:#ffffff;font-size:9px;font-family:monospace;font-weight:700;padding:1px 5px;border-radius:4px;border:1px solid ${isMoving ? routeColor : 'rgba(255,255,255,0.25)'};box-shadow:0 2px 5px rgba(0,0,0,0.3);white-space:nowrap;pointer-events:none;">
                    ${plateLabel}
                  </div>
                </div>
              `;
              const icon = L.divIcon({
                html: iconHtml,
                className: 'vehicle-leaflet-icon',
                iconSize: [44, 44],
                iconAnchor: [22, 22],
              });
              const marker = L.marker([v.lat, v.lng], { icon }).addTo(group);
              marker.on('click', () => handleVehicleClick(v));
              (marker as any)._vehicleId = v.id;
              leafletMarkerRefsRef.current.set(String(v.id), marker);
            }
          });

          if (leafletPickedMarkerRef.current) {
            group.removeLayer(leafletPickedMarkerRef.current);
            leafletPickedMarkerRef.current = null;
          }
          if (pickedCoords && isPickingLocationOnMap) {
            const pickIcon = L.divIcon({
              html: `<div style="width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px #ef4444"></div>`,
              className: '', iconSize: [18, 18], iconAnchor: [9, 9],
            });
            leafletPickedMarkerRef.current = L.marker([pickedCoords.lat, pickedCoords.lng], { icon: pickIcon }).addTo(group);
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
      if (!(map instanceof window.google.maps.Map)) return;

      try {
        const bounds = new window.google.maps.LatLngBounds();

        // 1. Render Depots
        if (!depotsRenderedRef.current || depots.length !== depotCountRef.current) {
          depotMarkersRef.current.forEach(m => m.setMap(null));
          depotMarkersRef.current = [];

          depots.forEach(d => {
            const depotIcon = {
              url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                  <rect x="2" y="2" width="26" height="26" rx="6" fill="#9333ea" stroke="#ffffff" stroke-width="2"/>
                  <text x="15" y="20" font-size="14" text-anchor="middle" fill="#ffffff">🏢</text>
                </svg>
              `),
              scaledSize: new window.google.maps.Size(30, 30),
              anchor: new window.google.maps.Point(15, 15),
            };

            const marker = new window.google.maps.Marker({
              map,
              position: { lat: d.lat, lng: d.lng },
              icon: depotIcon,
              title: d.name,
            });

            const infoWindow = new window.google.maps.InfoWindow({
              content: `
                <div class="p-2 min-w-[140px]">
                  <div class="font-bold text-sm mb-1">${d.name}</div>
                  <div class="text-xs text-slate-500 mb-3">${d.city}</div>
                  <button onclick="window.deleteDepot(${d.id})" class="text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1.5 rounded w-full border border-red-200 transition-colors">
                    Delete Hub
                  </button>
                </div>
              `
            });

            marker.addListener('click', () => {
              infoWindow.open({ anchor: marker, map });
            });

            depotMarkersRef.current.push(marker);
            bounds.extend({ lat: d.lat, lng: d.lng });
          });
          depotsRenderedRef.current = true;
          depotCountRef.current = depots.length;
        }

        // 2. Remove stale vehicle markers
        const activeIds = new Set(vehicles.map(v => String(v.id)));
        googleMarkerRefsRef.current.forEach((marker, id) => {
          if (!activeIds.has(id)) {
            marker.setMap(null);
            googleMarkerRefsRef.current.delete(id);
          }
        });

        // 3. Render or update vehicle markers with custom directional SVG chevron
        vehicles.forEach((v) => {
          const isMoving = v.status === 'IN_USE';
          const routeColor = getVehicleRouteColor(v.id, v.plateNumber);
          const heading = Math.round(v.heading || 0);

          const vehicleSvg = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
                <circle cx="22" cy="22" r="19" fill="${isMoving ? '#0f172a' : '#334155'}" stroke="${isMoving ? routeColor : '#ffffff'}" stroke-width="2.5"/>
                <g transform="rotate(${heading} 22 22)">
                  <polygon points="22,7 33,33 22,26 11,33" fill="${isMoving ? routeColor : '#94a3b8'}"/>
                </g>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(44, 44),
            anchor: new window.google.maps.Point(22, 22),
          };

          const existingMarker = googleMarkerRefsRef.current.get(String(v.id));
          if (existingMarker) {
            existingMarker.setPosition({ lat: v.lat, lng: v.lng });
            existingMarker.setIcon(vehicleSvg);
          } else {
            const marker = new window.google.maps.Marker({
              map,
              position: { lat: v.lat, lng: v.lng },
              icon: vehicleSvg,
              title: `${v.plateNumber} (${v.model}) - ${v.status}`,
              zIndex: isMoving ? 100 : 50,
            });
            marker.addListener('click', () => handleVehicleClick(v));
            googleMarkerRefsRef.current.set(String(v.id), marker);
          }
          bounds.extend({ lat: v.lat, lng: v.lng });
        });

        if (googlePickedMarkerRef.current) {
          googlePickedMarkerRef.current.setMap(null);
          googlePickedMarkerRef.current = null;
        }
        if (pickedCoords && isPickingLocationOnMap) {
          const pinIcon = {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="8" fill="#ef4444" stroke="#ffffff" stroke-width="2.5"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(20, 20),
            anchor: new window.google.maps.Point(10, 10),
          };
          googlePickedMarkerRef.current = new window.google.maps.Marker({
            map,
            position: pickedCoords,
            icon: pinIcon,
          });
        }

        if (!initialFitDoneRef.current && vehicles.length > 0) {
          map.fitBounds(bounds, 40);
          initialFitDoneRef.current = true;
        }
      } catch (err: any) {
        console.error('Google marker rendering failed:', err?.message);
      }
    }
  }, [vehicles, depots, pickedCoords, isPickingLocationOnMap, mapProvider, mapsError, mapReadyInstance]);

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

          (optimizedRoutes.routes || []).forEach((route, idx) => {
            const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            let coords: [number, number][] = [];
            if (route.geometry && route.geometry.length > 0) {
              coords = route.geometry;
            } else {
              coords = [[route.startLat, route.startLng]];
              (route.stops || []).forEach((stop) => coords.push([stop.lat, stop.lng]));
            }
            if (coords.length > 1) {
              L.polyline(coords, { color: '#ffffff', weight: 8, opacity: 0.9, lineCap: 'round', lineJoin: 'round' })
                .addTo(polylineGroupRef.current);
              L.polyline(coords, { color: routeColor, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' })
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

      (optimizedRoutes.routes || []).forEach((route, idx) => {
        const routeColor = ROUTE_COLORS[idx % ROUTE_COLORS.length];
        let path: google.maps.LatLngLiteral[] = [];
        if (route.geometry && route.geometry.length > 0) {
          path = route.geometry.map(([lat, lng]) => ({ lat, lng }));
        } else {
          path = [
            { lat: route.startLat, lng: route.startLng },
            ...(route.stops || []).map((stop) => ({ lat: stop.lat, lng: stop.lng })),
          ];
        }
        if (path.length > 1) {
          const casing = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: '#ffffff',
            strokeOpacity: 0.9,
            strokeWeight: 8,
          });
          casing.setMap(map);
          googlePolylinesRef.current.push(casing);

          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: routeColor,
            strokeOpacity: 1,
            strokeWeight: 5,
          });
          polyline.setMap(map);
          googlePolylinesRef.current.push(polyline);
        }
      });
    }
  }, [optimizedRoutes, mapProvider]);

  const clearVehicleRoute = useCallback(() => {
    const map = mapRef.current;
    if (mapProvider === 'leaflet' && map) {
      if (vehicleRoutePolylineRef.current) {
        map.removeLayer(vehicleRoutePolylineRef.current);
        vehicleRoutePolylineRef.current = null;
      }
      vehicleRouteMarkersRef.current.forEach(m => map.removeLayer(m));
      vehicleRouteMarkersRef.current = [];
    } else if (mapProvider === 'google') {
      if (vehicleGooglePolylineRef.current && vehicleGooglePolylineRef.current.length > 0) {
        vehicleGooglePolylineRef.current.forEach((p: any) => p.setMap(null));
        vehicleGooglePolylineRef.current = [];
      }
      vehicleRouteMarkersRef.current.forEach(m => m.setMap(null));
      vehicleRouteMarkersRef.current = [];
    }
    setActiveShipmentDetails(null);
  }, [mapProvider]);

  const renderVehicleRoute = useCallback(async (vehicle: Vehicle, showTraffic: boolean) => {
    const map = mapRef.current;
    if (!map) return;

    clearVehicleRoute();

    if (!authState.token) return;

    try {
      const allShipments = shipmentsQuery.data || [];
      let activeShipment = allShipments.find((s: any) =>
        (String(s.vehicleId) === String(vehicle.id) || String(s.assignedVehicleId) === String(vehicle.id)) &&
        s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
      );

      if (!activeShipment) {
        activeShipment = allShipments.find((s: any) =>
          String(s.vehicleId) === String(vehicle.id) || String(s.assignedVehicleId) === String(vehicle.id)
        );
      }

      setActiveShipmentDetails(activeShipment || null);

      const depot = depots.find(d => String(d.id) === String((vehicle as any).depotId)) || depots[0];
      const destLat = activeShipment?.deliveryLatitude ?? activeShipment?.deliveryLat ?? depot?.lat ?? 19.0760;
      const destLng = activeShipment?.deliveryLongitude ?? activeShipment?.deliveryLng ?? depot?.lng ?? 72.8777;

      if (destLat == null || destLng == null) {
        toast.info(`Vehicle ${vehicle.plateNumber} is currently on standby (no destination assigned).`);
        return;
      }

      const originPoint: [number, number] = [vehicle.lat, vehicle.lng];
      const destPoint: [number, number] = [destLat, destLng];
      const routeColor = getVehicleRouteColor(vehicle.id, vehicle.plateNumber);

      const routeData = await fetchRouteWithTraffic(originPoint, destPoint);
      const coords = routeData.coordinates;
      const intervals = routeData.trafficIntervals || [];

      if (!coords || coords.length < 2) {
        toast.warning('Could not compute road path to destination.');
        return;
      }

      if (mapProvider === 'leaflet') {
        const L = (await import('leaflet')).default;
        const polylines: any[] = [];

        if (showTraffic && intervals.length > 0) {
          // Dark contrast casing
          polylines.push(L.polyline(coords, {
            color: '#0f172a',
            weight: 8,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round',
          }));

          // Sliced traffic segments
          intervals.forEach(inv => {
            const startIdx = inv.startPolylinePointIndex ?? 0;
            const endIdx = inv.endPolylinePointIndex;
            if (startIdx >= endIdx || startIdx >= coords.length) return;
            const slice = coords.slice(startIdx, Math.min(endIdx + 1, coords.length));
            if (slice.length < 2) return;

            const color = inv.speed === 'TRAFFIC_JAM' ? '#ef4444' : inv.speed === 'SLOW' ? '#f59e0b' : '#10b981';
            polylines.push(L.polyline(slice, {
              color,
              weight: 5,
              opacity: 1,
              lineCap: 'round',
              lineJoin: 'round',
            }));
          });
        } else if (showTraffic && intervals.length === 0) {
          polylines.push(L.polyline(coords, { color: '#0f172a', weight: 8, opacity: 0.85, lineCap: 'round', lineJoin: 'round' }));
          polylines.push(L.polyline(coords, { color: '#10b981', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }));
        } else {
          polylines.push(L.polyline(coords, { color: '#ffffff', weight: 8, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }));
          polylines.push(L.polyline(coords, { color: routeColor, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }));
        }

        const polylineGroup = L.featureGroup(polylines).addTo(map);
        vehicleRoutePolylineRef.current = polylineGroup;

        // Pickup point
        const originLat = activeShipment?.pickupLatitude ?? vehicle.lat;
        const originLng = activeShipment?.pickupLongitude ?? vehicle.lng;
        const originIcon = L.divIcon({
          html: `<div style="width:24px;height:24px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 0 10px rgba(245,158,11,0.7);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">A</div>`,
          className: '',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });
        const originMarker = L.marker([originLat, originLng], { icon: originIcon })
          .addTo(map)
          .bindPopup(`<b>Pickup Point</b><br/>${activeShipment?.originAddress || 'Origin'}`);
        vehicleRouteMarkersRef.current.push(originMarker);

        // Destination flag pin
        const destIcon = L.divIcon({
          html: `<div style="width:26px;height:26px;border-radius:50%;background:${routeColor};border:3px solid white;box-shadow:0 0 12px ${routeColor}bb;display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:bold;">🏁</div>`,
          className: '',
          iconSize: [26, 26],
          iconAnchor: [13, 13],
        });
        const destMarker = L.marker([destLat, destLng], { icon: destIcon })
          .addTo(map)
          .bindPopup(`<b>Destination</b><br/>${activeShipment?.destinationAddress || 'Dropoff'}`);
        vehicleRouteMarkersRef.current.push(destMarker);

        map.fitBounds(polylineGroup.getBounds(), { padding: [50, 50] });

      } else if (mapProvider === 'google' && window.google?.maps && (map instanceof window.google.maps.Map)) {
        const polylines: google.maps.Polyline[] = [];
        const path = coords.map(([lat, lng]) => ({ lat, lng }));

        if (showTraffic && intervals.length > 0) {
          const casing = new window.google.maps.Polyline({
            path,
            strokeColor: '#0f172a',
            strokeOpacity: 0.85,
            strokeWeight: 8,
            zIndex: 1,
          });
          casing.setMap(map);
          polylines.push(casing);

          intervals.forEach(inv => {
            const startIdx = inv.startPolylinePointIndex ?? 0;
            const endIdx = inv.endPolylinePointIndex;
            if (startIdx >= endIdx || startIdx >= coords.length) return;
            const slice = coords.slice(startIdx, Math.min(endIdx + 1, coords.length));
            if (slice.length < 2) return;

            const color = inv.speed === 'TRAFFIC_JAM' ? '#ef4444' : inv.speed === 'SLOW' ? '#f59e0b' : '#10b981';
            const zIndex = inv.speed === 'TRAFFIC_JAM' ? 10 : inv.speed === 'SLOW' ? 8 : 5;

            const seg = new window.google.maps.Polyline({
              path: slice.map(([lat, lng]) => ({ lat, lng })),
              strokeColor: color,
              strokeOpacity: 1,
              strokeWeight: 5,
              zIndex,
            });
            seg.setMap(map);
            polylines.push(seg);
          });
        } else if (showTraffic && intervals.length === 0) {
          const casing = new window.google.maps.Polyline({
            path,
            strokeColor: '#0f172a',
            strokeOpacity: 0.85,
            strokeWeight: 8,
            zIndex: 1,
          });
          casing.setMap(map);
          polylines.push(casing);

          const freeFlow = new window.google.maps.Polyline({
            path,
            strokeColor: '#10b981',
            strokeOpacity: 1,
            strokeWeight: 5,
            zIndex: 5,
          });
          freeFlow.setMap(map);
          polylines.push(freeFlow);
        } else {
          const casing = new window.google.maps.Polyline({
            path,
            strokeColor: '#ffffff',
            strokeOpacity: 0.95,
            strokeWeight: 8,
            zIndex: 1,
          });
          casing.setMap(map);
          polylines.push(casing);

          const core = new window.google.maps.Polyline({
            path,
            strokeColor: routeColor,
            strokeOpacity: 1,
            strokeWeight: 5,
            zIndex: 5,
          });
          core.setMap(map);
          polylines.push(core);
        }

        vehicleGooglePolylineRef.current = polylines;

        // Pickup Marker
        const originLat = activeShipment?.pickupLatitude ?? vehicle.lat;
        const originLng = activeShipment?.pickupLongitude ?? vehicle.lng;
        const originMarker = new window.google.maps.Marker({
          map,
          position: { lat: originLat, lng: originLng },
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
                <circle cx="14" cy="14" r="12" fill="#f59e0b" stroke="#ffffff" stroke-width="2.5"/>
                <text x="14" y="18" font-size="12" font-weight="bold" text-anchor="middle" fill="#ffffff">A</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(28, 28),
            anchor: new window.google.maps.Point(14, 14),
          },
          title: `Pickup: ${activeShipment?.originAddress || 'Origin'}`,
        });
        vehicleRouteMarkersRef.current.push(originMarker);

        // Destination Marker
        const destMarker = new window.google.maps.Marker({
          map,
          position: { lat: destLat, lng: destLng },
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                <circle cx="15" cy="15" r="13" fill="${routeColor}" stroke="#ffffff" stroke-width="2.5"/>
                <text x="15" y="20" font-size="14" text-anchor="middle" fill="#ffffff">🏁</text>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(30, 30),
            anchor: new window.google.maps.Point(15, 15),
          },
          title: `Destination: ${activeShipment?.destinationAddress || 'Dropoff'}`,
        });
        vehicleRouteMarkersRef.current.push(destMarker);

        const bounds = new window.google.maps.LatLngBounds();
        path.forEach(pt => bounds.extend(pt));
        map.fitBounds(bounds, 50);
      }

      toast.success(
        showTraffic
          ? `Route traffic: ${vehicle.plateNumber} (${intervals.length} segments)`
          : `Route active: ${vehicle.plateNumber} to ${activeShipment?.destinationAddress?.substring(0, 25) || 'Destination'}`
      );
    } catch (err: any) {
      console.warn('Failed to load active route for vehicle:', err?.message);
    }
  }, [mapProvider, authState.token, shipmentsQuery.data, depots, clearVehicleRoute]);

  const handleVehicleClick = useCallback((vehicle: Vehicle) => {
    const map = mapRef.current;
    if (!map) return;

    if (mapProvider === 'leaflet') {
      map.setView([vehicle.lat, vehicle.lng], 13, { animate: true });
    } else if (mapProvider === 'google') {
      map.panTo({ lat: vehicle.lat, lng: vehicle.lng });
      map.setZoom(13);
    }

    setSelectedVehicle(vehicle);
    renderVehicleRoute(vehicle, trafficView);
  }, [mapProvider, trafficView, renderVehicleRoute]);

  // Re-render route with traffic or normal styling when trafficView is toggled
  useEffect(() => {
    if (selectedVehicle) {
      renderVehicleRoute(selectedVehicle, trafficView);
    }
  }, [trafficView, selectedVehicle, renderVehicleRoute]);

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
      <style jsx global>{`
        .vehicle-leaflet-icon {
          transition: transform 0.8s linear, -webkit-transform 0.8s linear !important;
        }
      `}</style>
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
            <p className="text-slate-300 text-sm">Calculating real-world road routes via OSRM…</p>
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
                          Order #{s.id}: {s.destinationAddress?.substring(0, 22) || 'Unknown'}...
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
                <div className="flex items-center justify-between mb-4">
                  <h3 className={theme.typography.h5}>{t.manager.vehicleDetails}</h3>
                  <button onClick={() => { setSelectedVehicle(null); clearVehicleRoute(); }} className={theme.button.iconBtn}>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {activeShipmentDetails ? (
                  <div className="mb-5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 bg-gradient-to-br from-blue-50/90 to-indigo-50/50 dark:from-slate-800/90 dark:to-blue-950/40 p-4 shadow-sm space-y-3.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span className="text-[11px] font-bold tracking-wider text-blue-950 dark:text-blue-200 uppercase">
                          Active Consignment
                        </span>
                      </div>
                      <Badge className="bg-emerald-500 text-white font-semibold text-[10px] px-2 py-0.5 border-none shadow-sm">
                        {activeShipmentDetails.status || 'IN_TRANSIT'}
                      </Badge>
                    </div>

                    {/* From -> To Route Timeline */}
                    <div className="relative pl-5 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-300 dark:before:bg-slate-600">
                      <div className="relative">
                        <div className="absolute -left-5 top-0.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100 dark:ring-amber-950/60" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">From (Pickup)</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {activeShipmentDetails.originAddress || 'Origin Depot'}
                        </p>
                      </div>

                      <div className="relative">
                        <div className="absolute -left-5 top-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100 dark:ring-emerald-950/60" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">To (Delivery)</span>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-snug">
                          {activeShipmentDetails.destinationAddress || 'Destination Dropoff'}
                        </p>
                      </div>
                    </div>

                    {/* Consignment Specs */}
                    <div className="pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Cargo</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate block">
                          {activeShipmentDetails.category || 'General Freight'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-medium block">Weight</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 block">
                          {activeShipmentDetails.weight ? `${activeShipmentDetails.weight} kg` : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 rounded-xl border border-slate-200/60 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/40 p-3 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Vehicle on standby (no active delivery route assigned)
                    </p>
                  </div>
                )}

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
                    value={resolveDriverName(selectedVehicle)}
                  />
                  <DetailRow
                    icon={MapPin}
                    label={t.manager.lastKnownCoords}
                    value={formatCoords(selectedVehicle.lat, selectedVehicle.lng)}
                  />
                </div>

                <div className="mt-6 flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this vehicle?')) {
                        fetchWithAuth(`/api/vehicles/${selectedVehicle.id}`, { method: 'DELETE' })
                          .then(async (res) => {
                            if (!res.ok) {
                              const err = await res.json().catch(() => null);
                              throw new Error(err?.detail || err?.message || 'Failed to delete vehicle.');
                            }
                            setVehicles(vehicles.filter(v => v.id !== selectedVehicle.id));
                            setSelectedVehicle(null);
                            clearVehicleRoute();
                            toast.success('Vehicle deleted');
                          })
                          .catch((err) => toast.error(err.message || 'Cannot delete vehicle.'));
                      }
                    }}
                    className={`${theme.button.outline} w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200`}
                  >
                    Delete Vehicle
                  </button>
                  <button
                    onClick={() => { setSelectedVehicle(null); clearVehicleRoute(); }}
                    className={`${theme.button.outline} w-full`}
                  >
                    {t.manager.close}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* === MAIN FLEET VIEW: full-width immersive map === */}
      <div className="relative w-full h-full rounded-none overflow-hidden">
        {/* Map Surface */}
        <div
          id="fleet-map"
          className="absolute inset-0 cursor-crosshair"
          style={{ zIndex: 0 }}
        />

        {showMapsErrorPanel && <MapsUnavailablePanel message={mapsError!} />}

        {/* ── Top-Left: Fleet Actions Panel (Portaled) ── */}
        {canManageFleet && sidebarPortal && createPortal(
          <div className="w-full mt-4">
            <div className="bg-white/95 dark:bg-slate-900/95 rounded-xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden">
              <div className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50">
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
          </div>,
          sidebarPortal
        )}

        {/* ── Bottom-Right: Map Controls Panel ── */}
        <div className={`absolute bottom-48 transition-all duration-300 z-20 ${selectedVehicle ? 'right-[21rem]' : 'right-4'} w-48`}>
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
                    if (v && !selectedVehicle) {
                      const activeVehicle = vehicles.find(veh => veh.status === 'IN_USE') || vehicles[0];
                      if (activeVehicle) {
                        handleVehicleClick(activeVehicle);
                      }
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

              <div>
                <p className="text-[10px] font-medium text-slate-500 mb-1.5 uppercase tracking-wider">Simulation</p>
                <button
                  onClick={handleToggleSimulation}
                  disabled={togglingSimulation}
                  className={`w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-between transition-all ${
                    isSimulating
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                  }`}
                  title={isSimulating ? 'Pause active vehicle simulation' : 'Start live vehicle telematics simulation'}
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-white animate-ping' : 'bg-blue-200'}`} />
                    <span>{isSimulating ? 'Simulation Active' : 'Start Simulation'}</span>
                  </span>
                  <span>{isSimulating ? '⏸' : '▶'}</span>
                </button>
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
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Available
                  </span>
                  <span className="text-[11px] font-semibold text-blue-600">{availableCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600">{activeCount}</span>
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

        {/* -- Bottom: Live Status Feed: horizontal vehicle cards -- */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="bg-gradient-to-t from-transparent to-transparent pt-8 pb-0">
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
                <span className="text-slate-500 text-[11px]">•</span>
                <span className="text-slate-900 dark:text-white text-[11px] font-bold">
                  {totalCount} vehicle{totalCount !== 1 ? 's' : ''} tracked
                </span>
              </div>
            </div>
            <div className="flex gap-3 overflow-x-auto overflow-y-hidden px-4 pb-4">
              {vehicles.map((v) => {
                const routeColor = getVehicleRouteColor(v.id, v.plateNumber);
                const isSelected = selectedVehicle?.id === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => handleVehicleClick(v)}
                    className={`flex-shrink-0 w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl p-3 shadow-lg border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/30 scale-[1.02]'
                        : 'border-slate-200 dark:border-slate-700/50 hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-sm shrink-0"
                          style={{ backgroundColor: routeColor }}
                          title={`Route color: ${routeColor}`}
                        />
                        <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">{v.plateNumber}</span>
                      </div>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: `${routeColor}18`,
                          color: routeColor,
                          border: `1px solid ${routeColor}33`,
                        }}
                      >
                        {v.status === 'IN_USE' ? 'En Route' : v.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">{v.model}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Boxes className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-600 dark:text-slate-300">{v.capacity} kg</span>
                    </div>
                    {(() => {
                      const driverName = resolveDriverName(v);
                      const activeShip = shipmentsQuery.data?.find((s: any) =>
                        (String(s.vehicleId) === String(v.id) || String(s.assignedVehicleId) === String(v.id)) &&
                        s.status !== 'DELIVERED' && s.status !== 'CANCELLED'
                      );
                      return (
                        <div className="space-y-1 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <User className="w-3.5 h-3.5 text-blue-500" />
                            <span className={`text-xs ${driverName !== '-' ? 'text-slate-700 dark:text-slate-200 font-semibold' : 'text-slate-400 italic'}`}>
                              {driverName !== '-' ? driverName : 'Unassigned'}
                            </span>
                          </div>
                          {activeShip && (
                            <div className="flex items-center gap-1.5 text-[11px] font-medium truncate" style={{ color: routeColor }}>
                              <Navigation className="w-3 h-3 shrink-0" />
                              <span className="truncate">{activeShip.destinationAddress || 'In Transit'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </button>
                );
              })}
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
