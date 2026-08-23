'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Truck, AlertCircle, Eye, EyeOff, Navigation, CheckCircle2, User, Phone, Mail, MapPinned, X, Activity, PackageCheck, Route, Loader2, Plus, Building2, MousePointerClick } from 'lucide-react';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

// ── Approximate reverse-geocode for Indian coordinates ──
const LOCATION_NAMES: Record<string, string> = {
  '19.0760,72.8777': 'Mumbai, MH',
  '28.6139,77.2090': 'New Delhi, DL',
  '12.9716,77.5946': 'Bengaluru, KA',
  '17.3850,78.4867': 'Hyderabad, TS',
  '13.0827,80.2707': 'Chennai, TN',
  '22.5726,88.3639': 'Kolkata, WB',
  '23.0225,72.5714': 'Ahmedabad, GJ',
  '26.9124,75.7873': 'Jaipur, RJ',
  '21.1702,72.8311': 'Surat, GJ',
  '18.5204,73.8567': 'Pune, MH',
};

function getLocationName(lat: number, lng: number): string {
  const key = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  if (LOCATION_NAMES[key]) return LOCATION_NAMES[key];
  const closeKey = Object.keys(LOCATION_NAMES).find((k) => {
    const [kLat, kLng] = k.split(',').map(Number);
    return Math.abs(lat - kLat) < 2 && Math.abs(lng - kLng) < 2;
  });
  return closeKey ? LOCATION_NAMES[closeKey] : `${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
}

import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Vehicle, VehicleStatus } from '@/types';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Status badge mapping ──────────────────────────────────
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

// ── Add Depot / HQ Modal ──
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
      const res = await fetch('/api/depots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: form.name.trim(),
          city: form.city.trim(),
          address: form.address.trim(),
          lat: parseFloat(form.lat),
          lng: parseFloat(form.lng),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
      }
      toast.success(`Depot "${form.name}" created successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to add depot: ${err.message}`);
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
                placeholder="e.g. Pune Regional Depot"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">City *</label>
              <input
                type="text"
                placeholder="e.g. Pune"
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

// ── Add Vehicle Form ────────────────────────────────
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
    fetch('/api/depots', { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
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
    setSubmitting(true);
    try {
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          plateNumber: form.plateNumber.trim().toUpperCase(),
          type: form.type,
          model: form.model.trim(),
          capacity: parseFloat(form.capacity),
          fuelType: form.fuelType,
          depotId: form.depotId ? parseInt(form.depotId, 10) : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || `Error ${res.status}`);
      }
      toast.success(`Vehicle ${form.plateNumber.toUpperCase()} registered at Home Depot!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(`Failed to add vehicle: ${err.message}`);
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
                {depots.length === 0 && <option value="">Default Hub (Mumbai HQ)</option>}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">Unassigned vehicle will start parked at this depot until a driver initiates tracking.</p>
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
              disabled={submitting}
              className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
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

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [depots, setDepots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [trafficView, setTrafficView] = useState(false);
  const [mapProvider, setMapProvider] = useState<'leaflet' | 'google'>('leaflet');
  const [mapReady, setMapReady] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [connected, setConnected] = useState(false);

  // Modals & Map Picking State
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddDepotOpen, setIsAddDepotOpen] = useState(false);
  const [isPickingLocationOnMap, setIsPickingLocationOnMap] = useState(false);
  const [pickedCoords, setPickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  const mapRef = useRef<any>(null);
  const depotMarkersRef = useRef<any[]>([]);
  const markerGroupRef = useRef<any>(null);
  const markerRefsRef = useRef<Map<string, any>>(new Map());
  const stompClientRef = useRef<Client | null>(null);
  const currentProviderRef = useRef<'leaflet' | 'google' | null>(null);

  // Optimization State
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<Set<number>>(new Set());
  const [selectedShipmentIds, setSelectedShipmentIds] = useState<Set<number>>(new Set());
  const [jobId, setJobId] = useState<string | null>(null);
  const [optimizedRoutes, setOptimizedRoutes] = useState<any | null>(null);
  const polylineGroupRef = useRef<any>(null);
  const googlePolylinesRef = useRef<any[]>([]);

  // Fetch Vehicles & Depots
  const fetchVehicles = useCallback(async () => {
    try {
      const res = await fetch('/api/vehicles', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const rawData = await res.json();
      const pageData = normalizePageResponse<Vehicle>(rawData);
      setVehicles(pageData.items);
    } catch (err: any) {
      if (err instanceof ApiContractError) {
        toast.error('Unable to load fleet. Unexpected response format.');
      } else {
        toast.error(t.common.error);
      }
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  const fetchDepots = useCallback(async () => {
    try {
      const res = await fetch('/api/depots', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDepots(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchVehicles();
    fetchDepots();
  }, [fetchVehicles, fetchDepots]);

  const fetchPendingShipments = async (): Promise<any[]> => {
    try {
      const res = await fetch('/api/shipments', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (res.ok) {
        const rawData = await res.json();
        const pageData = normalizePageResponse<any>(rawData);
        const pending = pageData.items.filter((s: any) => s.status === 'PENDING' || s.status === 'ASSIGNED');
        setPendingShipments(pending);
        setSelectedShipmentIds(new Set(pending.map((s: any) => s.id)));
        return pending;
      }
    } catch (err) {
      console.error(err);
    }
    return [];
  };

  const handleOpenOptimizeModal = async () => {
    const availableVehicles = vehicles.filter(v => v.status === 'AVAILABLE');
    setSelectedVehicleIds(new Set(availableVehicles.map(v => v.id)));
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
      const res = await fetch('/api/routes/optimization-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          vehicleIds: Array.from(selectedVehicleIds),
          shipmentIds: Array.from(selectedShipmentIds),
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.message || `HTTP ${res.status}`);
      }
      const job = await res.json();
      setJobId(job.id);
      toast.success('Optimization started — waiting for results via WebSocket...');
      setIsOptimizeModalOpen(false);
    } catch (err: any) {
      toast.error(`Optimization failed: ${err.message}`);
      setOptimizing(false);
    }
  };

  // STOMP WebSocket Live Subscriptions
  useEffect(() => {
    if (!authState.token || vehicles.length === 0) return;

    if (stompClientRef.current) {
      stompClientRef.current.deactivate();
    }

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        Authorization: `Bearer ${authState.token}`
      },
      reconnectDelay: 5000,
      onConnect: () => {
        vehicles.forEach(v => {
          client.subscribe(`/topic/vehicle/${v.id}/routes`, (message) => {
            try {
              const payload = JSON.parse(message.body);
              setOptimizedRoutes((prev: any) => {
                const newRoutes = prev && prev.routes ? [...prev.routes] : [];
                const existingIndex = newRoutes.findIndex((r: any) => r.vehicleId === payload.vehicleId);
                if (existingIndex >= 0) {
                  newRoutes[existingIndex] = payload;
                } else {
                  newRoutes.push(payload);
                }
                return { routes: newRoutes };
              });
              toast.success(`Live route received for vehicle ${v.plateNumber}!`);
              setJobId(null);
              setOptimizing(false);
            } catch (e) {
              console.error('Failed to parse STOMP message', e);
            }
          });
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'], frame.body);
      },
      onDisconnect: () => setConnected(false),
    });

    client.activate();
    stompClientRef.current = client;
    setConnected(true);

    return () => {
      client.deactivate();
    };
  }, [authState.token, vehicles]);

  // Polyline Rendering
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !optimizedRoutes) return;

    if (mapProvider === 'leaflet') {
      (async () => {
        const L = (await import('leaflet')).default;
        if (!polylineGroupRef.current) {
          polylineGroupRef.current = L.layerGroup().addTo(map);
        }
        polylineGroupRef.current.clearLayers();

        optimizedRoutes.routes.forEach((route: any) => {
          const vehicle = vehicles.find(v => v.id === route.vehicleId);
          if (!vehicle) return;

          const coords: [number, number][] = [[vehicle.lat, vehicle.lng]];
          route.stops.forEach((shipmentId: number) => {
            const shipment = pendingShipments.find(s => s.id === shipmentId);
            if (shipment) coords.push([shipment.destinationLat, shipment.destinationLng]);
          });

          if (coords.length > 1) {
            L.polyline(coords, { color: '#3b82f6', weight: 4, opacity: 0.8 }).addTo(polylineGroupRef.current);
          }
        });
      })();
    } else {
      googlePolylinesRef.current.forEach(p => p.setMap(null));
      googlePolylinesRef.current = [];

      optimizedRoutes.routes.forEach((route: any) => {
        const vehicle = vehicles.find(v => v.id === route.vehicleId);
        if (!vehicle) return;

        const path: google.maps.LatLngLiteral[] = [{ lat: vehicle.lat, lng: vehicle.lng }];
        route.stops.forEach((shipmentId: number) => {
          const shipment = pendingShipments.find(s => s.id === shipmentId);
          if (shipment) path.push({ lat: shipment.destinationLat, lng: shipment.destinationLng });
        });

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
  }, [optimizedRoutes, mapProvider, pendingShipments, vehicles]);

  // Polling for real-time vehicle updates
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/vehicles', {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (res.ok) {
          const rawData = await res.json();
          const pageData = normalizePageResponse<Vehicle>(rawData);
          setVehicles(pageData.items);
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch {
        setConnected(false);
      }
    }, 5000);

    setConnected(true);
    return () => clearInterval(interval);
  }, [authState.token]);

  // Load Leaflet CSS
  useEffect(() => {
    const linkId = 'leaflet-css-fleet';
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, []);

  // Initialize Map
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
      (async () => {
        const L = (await import('leaflet')).default;
        if (isCancelled) return;
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        const mapEl = document.getElementById('fleet-map');
        if (!mapEl) return;
        mapInstance = L.map(mapEl).setView([22.5, 79.0], 5);
        const standardTiles = L.tileLayer(
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          { attribution: '&copy; OpenStreetMap' }
        ).addTo(mapInstance);

        leafletMarkers = L.layerGroup().addTo(mapInstance);
        markerGroupRef.current = leafletMarkers;

        // Interactive Map Click Picker
        mapInstance.on('click', (e: any) => {
          const lat = e.latlng.lat;
          const lng = e.latlng.lng;
          setPickedCoords({ lat, lng });
          toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        });

        mapRef.current = mapInstance;
        currentProviderRef.current = 'leaflet';
      })();
    } else {
      (async () => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
          toast.error('Google Maps API key is not configured.');
          return;
        }
        const { Loader } = await import('@googlemaps/js-api-loader');
        if (isCancelled) return;
        const loader = new Loader({ apiKey, version: 'weekly' });
        const { Map } = await loader.importLibrary('maps') as google.maps.MapsLibrary;
        if (isCancelled) return;

        const mapEl = document.getElementById('fleet-map');
        if (!mapEl) return;

        mapInstance = new Map(mapEl, {
          center: { lat: 22.5, lng: 79.0 },
          zoom: 5,
          mapId: 'DEMO_MAP_ID',
          disableDefaultUI: true,
          zoomControl: true,
        });

        // Interactive Map Click Picker for Google Maps
        mapInstance.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const lat = e.latLng.lat();
            const lng = e.latLng.lng();
            setPickedCoords({ lat, lng });
            toast.success(`Picked Map Location: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
          }
        });

        mapRef.current = mapInstance;
        currentProviderRef.current = 'google';
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

  // Update Markers (Vehicles & Depots)
  const initialFitDoneRef = useRef(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (mapProvider === 'leaflet') {
      (async () => {
        const L = (await import('leaflet')).default;
        const group = markerGroupRef.current;
        if (!group) return;

        group.clearLayers();
        markerRefsRef.current.clear();

        // Render Depot HQ Markers (Purple Warehouse icons)
        depots.forEach(d => {
          const depotIcon = L.divIcon({
            html: `<div style="width:20px;height:20px;border-radius:4px;background:#9333ea;border:2px solid white;display:flex;align-items:center;justify-content:center;color:white;font-size:10px;box-shadow:0 2px 6px rgba(0,0,0,0.4)" title="${d.name}">🏢</div>`,
            className: '', iconSize: [20, 20], iconAnchor: [10, 10]
          });
          const marker = L.marker([d.lat, d.lng], { icon: depotIcon }).addTo(group);
          marker.bindTooltip(`<b>${d.name}</b><br/>${d.city}`);
        });

        // Render Vehicles Markers
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

        // Render Currently Picked Pin
        if (pickedCoords) {
          const pickIcon = L.divIcon({
            html: `<div style="width:18px;height:18px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 10px #ef4444;animation:ping 1s infinite"></div>`,
            className: '', iconSize: [18, 18], iconAnchor: [9, 9]
          });
          L.marker([pickedCoords.lat, pickedCoords.lng], { icon: pickIcon }).addTo(group);
        }

        if (!initialFitDoneRef.current && vehicles.length > 0) {
          const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
          map.fitBounds(bounds, { padding: [40, 40] });
          initialFitDoneRef.current = true;
        }
      })();
    } else {
      (async () => {
        const { Loader } = await import('@googlemaps/js-api-loader');
        const loader = new Loader({ apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '', version: 'weekly' });
        const { AdvancedMarkerElement } = await loader.importLibrary('marker') as google.maps.MarkerLibrary;

        markerRefsRef.current.forEach((marker) => {
          if (marker && marker.map) marker.map = null;
        });
        markerRefsRef.current.clear();

        const bounds = new google.maps.LatLngBounds();

        // Render Vehicles
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

        if (!initialFitDoneRef.current && vehicles.length > 0) {
          map.fitBounds(bounds, 40);
          initialFitDoneRef.current = true;
        }
      })();
    }
  }, [vehicles, depots, pickedCoords, mapProvider]);

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
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[500px] w-full rounded-xl" />
        <Skeleton className="h-[300px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* Add Depot Modal */}
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

      {/* Add Vehicle Modal */}
      <AnimatePresence>
        {isAddVehicleOpen && canManageFleet && (
          <AddVehicleModal
            token={authState.token!}
            onClose={() => setIsAddVehicleOpen(false)}
            onSuccess={fetchVehicles}
          />
        )}
      </AnimatePresence>

      {/* Optimization Slide-in Modal */}
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
                          checked={selectedVehicleIds.has(v.id)}
                          onCheckedChange={(checked) => {
                            const newSet = new Set(selectedVehicleIds);
                            if (checked) newSet.add(v.id);
                            else newSet.delete(v.id);
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
              </div>
              <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                <button
                  onClick={handleOptimize}
                  disabled={selectedVehicleIds.size === 0 || selectedShipmentIds.size === 0 || optimizing}
                  className={`${theme.button.primary} w-full`}
                >
                  {optimizing ? <><Loader2 className="w-4 h-4 animate-spin mr-2 inline" />Solving...</> : 'Start Optimization'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Vehicle Detail Slide-in Panel */}
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
                    value={getLocationName(selectedVehicle.lat, selectedVehicle.lng)}
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

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 relative"
      >
        <div
          ref={() => setMapReady(true)}
          id="fleet-map"
          className="w-full h-[500px] rounded-xl border dark:border-slate-700 relative cursor-crosshair"
          style={{ zIndex: 0 }}
        >
          {/* Map Legend Overlay */}
          <div className="absolute top-3 right-3 z-[400] bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-lg shadow-lg p-3 text-xs pointer-events-none">
            <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">Map Legend</p>
            <div className="space-y-1.5">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-purple-600 flex items-center justify-center text-[9px] text-white">🏢</span> Depot / HQ Hub</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500" /> Available Vehicle</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500" /> Active Vehicle</span>
            </div>
          </div>

          {/* Interactive Map Picker Active Banner */}
          {isPickingLocationOnMap && (
            <div className="absolute top-3 left-3 z-[400] bg-purple-600 text-white text-xs px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-2 animate-bounce">
              <MousePointerClick className="w-4 h-4" />
              Click anywhere on the map to place HQ Pin!
            </div>
          )}
        </div>

        {/* Overlay Map Controls */}
        <div className="mt-3 flex flex-wrap items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50">

          <div className="flex items-center gap-2">
            <Switch
              id="traffic-toggle"
              checked={trafficView}
              onCheckedChange={(v) => {
                if (v && mapProvider === 'leaflet') {
                  toast.info('Switch to Google Maps to enable live traffic overlay.');
                  return;
                }
                setTrafficView(v);
              }}
              disabled={mapProvider === 'leaflet'}
            />
            <Label htmlFor="traffic-toggle" className={`cursor-pointer font-medium text-xs ${mapProvider === 'leaflet' ? 'opacity-50' : ''}`}>
              <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
                {trafficView ? (
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
                Traffic {mapProvider === 'leaflet' ? '(Google only)' : ''}
              </span>
            </Label>
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />

          {/* Map Provider Toggle */}
          <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
            <button
              onClick={() => setMapProvider('leaflet')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'leaflet' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Leaflet
            </button>
            <button
              onClick={() => setMapProvider('google')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'google' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-200'}`}
            >
              Google Maps
            </button>
          </div>

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />

          {/* Add Depot / HQ Hub — RBAC gated */}
          {canManageFleet && (
            <button
              onClick={() => setIsAddDepotOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Building2 className="w-3.5 h-3.5" />
              Add Depot / HQ
            </button>
          )}

          {/* Add Vehicle — RBAC gated */}
          {canManageFleet && (
            <button
              onClick={() => setIsAddVehicleOpen(true)}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-all flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Vehicle
            </button>
          )}

          {/* Optimize Routes — RBAC gated */}
          {canManageFleet && (
            <button
              onClick={handleOpenOptimizeModal}
              disabled={optimizing}
              className={`px-3 py-1.5 text-xs font-medium rounded-md text-white transition-all ${optimizing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'} flex items-center gap-1.5 shadow-sm`}
            >
              {optimizing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Route className="w-3.5 h-3.5" />}
              {optimizing ? 'Optimizing...' : 'Optimize Routes'}
            </button>
          )}

          <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />

          {/* Live Indicator */}
          <span className={theme.liveIndicator.wrapper} title={connected ? t.manager.connectedToTracking : t.manager.offline}>
            <span className="relative flex items-center justify-center">
              {connected && <span className={theme.liveIndicator.pulseRing} />}
              <span className={connected ? theme.liveIndicator.dotLive : theme.liveIndicator.dotOffline} />
            </span>
            <span className={connected ? theme.liveIndicator.labelLive : theme.liveIndicator.labelOffline}>
              {connected ? t.manager.live : t.manager.offline}
            </span>
          </span>
        </div>
      </motion.div>

      {/* Vehicle Table */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className={theme.card.base}>
          <CardContent className={`${theme.table.scrollCard} overflow-x-auto`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plate Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles.map((vehicle, i) => {
                  const driverName =
                    vehicle.driverProfiles && vehicle.driverProfiles.length > 0
                      ? vehicle.driverProfiles[0].user.name
                      : '—';
                  return (
                    <motion.tr
                      key={vehicle.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b last:border-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:-translate-y-0.5 hover:shadow-sm transition-all duration-200 ${theme.table.zebraRow}`}
                      onClick={() => handleVehicleClick(vehicle)}
                    >
                      <TableCell className="font-mono text-sm font-medium">
                        {vehicle.plateNumber}
                      </TableCell>
                      <TableCell>{vehicle.type}</TableCell>
                      <TableCell>{vehicle.model}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${theme.status.badge} ${vehicleStatusBadge[vehicle.status]}`}
                        >
                          {formatVehicleStatus(vehicle.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{driverName}</TableCell>
                      <TableCell className={theme.typography.caption}>
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {getLocationName(vehicle.lat, vehicle.lng)}
                        </span>
                      </TableCell>
                    </motion.tr>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </>
  );
}
