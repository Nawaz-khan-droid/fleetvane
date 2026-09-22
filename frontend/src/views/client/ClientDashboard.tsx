'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, PackageCheck, Clock, Navigation, Plus, MapPin, Search, QrCode, Locate } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from '@/context/RouterContext';
import type { Shipment, ShipmentStatus, Company } from '@/types';
import { useStore } from '@/store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { AddressAutocomplete } from '@/components/shared/AddressAutocomplete';
import Pagination from '@/components/shared/Pagination';
import ShipmentDetailDrawer from '@/components/shared/ShipmentDetailDrawer';

const SHIPMENT_CATEGORIES = [
  'General Goods',
  'Perishables',
  'Electronics',
  'Hazardous Materials',
  'Furniture',
  'Documents',
  'Medical Supplies',
  'Other'
];

function formatStatus(status: ShipmentStatus): string {
  // Client-friendly human-readable labels
  const map: Record<string, string> = {
    REQUESTED: 'Pending Review',
    ASSIGNED: 'Confirmed ✓',
    EN_ROUTE_TO_PICKUP: 'Driver On The Way',
    AT_PICKUP: 'Driver At Pickup',
    IN_TRANSIT: 'Out for Delivery',
    DELIVERED: 'Delivered ✓',
    CANCELLED: 'Cancelled',
    DISPATCHED: 'Out for Delivery',
    ARRIVED: 'Arrived',
  };
  return map[status] || status;
}

const statusBadgeColor: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  EN_ROUTE_TO_PICKUP: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400',
  AT_PICKUP: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400',
  DISPATCHED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  IN_TRANSIT: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400',
  ARRIVED: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-400',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400',
};

const statusDotColor: Record<string, string> = {
  REQUESTED: 'bg-amber-500',
  ASSIGNED: 'bg-blue-500',
  EN_ROUTE_TO_PICKUP: 'bg-violet-500',
  AT_PICKUP: 'bg-orange-500',
  DISPATCHED: 'bg-blue-500',
  IN_TRANSIT: 'bg-teal-500',
  ARRIVED: 'bg-green-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

export default function ClientDashboard() {
  const { state: authState } = useAuth();
  const { navigate } = useRouter();
  const { addNotification } = useNotifications();

  const { shipments, setShipments, addShipment } = useStore();
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED'>('ALL');
  const [transportCompanies, setTransportCompanies] = useState<Company[]>([]);

  // Form state
  const [origin, setOrigin] = useState('');
  const [originCoords, setOriginCoords] = useState<{lat: number; lon: number} | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [destination, setDestination] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{lat: number; lon: number} | null>(null);
  const [weight, setWeight] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [category, setCategory] = useState('General Goods');
  const [description, setDescription] = useState('');
  const [transportCompanyId, setTransportCompanyId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  // GPS pre-fill for pickup location on dialog open
  const prefillGPS = useCallback(async () => {
    if (!navigator.geolocation) return;
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setOriginCoords({ lat: latitude, lon: longitude });
        // Reverse-geocode to get a human-readable address
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`,
            { headers: { 'Accept-Language': 'en', 'User-Agent': 'FleetVane/1.0' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            setOrigin(data.display_name);
          }
        } catch {
          setOrigin(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setGpsLoading(false);
        toast('Could not access GPS. Please enter your pickup address manually.', { icon: '📍' });
      },
      { timeout: 8000 }
    );
  }, []);

  // Trigger GPS pre-fill when the dialog opens
  useEffect(() => {
    if (dialogOpen) {
      prefillGPS();
    } else {
      // Reset form on close
      setOrigin('');
      setOriginCoords(null);
      setDestination('');
      setDestinationCoords(null);
      setWeight('');
      setLengthCm('');
      setWidthCm('');
      setHeightCm('');
      setDescription('');
      setCategory('General Goods');
      if (transportCompanies.length > 0) {
        setTransportCompanyId(String(transportCompanies[0].id));
      } else {
        setTransportCompanyId('');
      }
    }
  }, [dialogOpen, prefillGPS, transportCompanies]);

  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'Accept-Language': 'en', 'User-Agent': 'FleetVane/1.0' } }
      );
      const data = await res.json();
      if (!data || data.length === 0) return null;
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    } catch {
      return null;
    }
  };

  const fetchShipments = useCallback(async () => {
    try {
      const [res, compRes] = await Promise.all([
        fetchWithAuth(`/api/shipments?clientId=${authState.user?.userId}`),
        fetchWithAuth(`/api/companies?type=TRANSPORT`)
      ]);
      
      if (compRes.ok) {
        const companies = await compRes.json();
        setTransportCompanies(companies);
      }

      if (!res.ok) throw new Error('Failed to fetch shipments');
      const data = await res.json();
      // Spring Boot returns a Page<> object; normalise to array
      const items: typeof shipments = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
        ? data.content
        : [];
      setShipments(items);
    } catch {
      toast.error('Failed to load shipments');
    } finally {
      setLoading(false);
    }
  }, [authState.user?.userId, authState.token, setShipments]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // Derived stats
  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'IN_TRANSIT').length,
    delivered: shipments.filter(s => s.status === 'DELIVERED').length,
    pending: shipments.filter(s => s.status === 'REQUESTED' || s.status === 'ASSIGNED').length,
  };

  const filteredShipments = shipments
    .filter(s => {
      if (filter === 'ACTIVE') return s.status !== 'DELIVERED' && s.status !== 'CANCELLED';
      if (filter === 'DELIVERED') return s.status === 'DELIVERED';
      return true;
    })
    .filter((s) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.originAddress.toLowerCase().includes(q) ||
        s.destinationAddress.toLowerCase().includes(q) ||
        String(s.id).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalPages = Math.max(1, Math.ceil(filteredShipments.length / PAGE_SIZE));
  const paginatedShipments = filteredShipments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim() || !transportCompanyId) return;

    setSubmitting(true);
    try {
      // Use selected coordinates if available, otherwise geocode
      const [originGeo, destGeo] = await Promise.all([
        originCoords ? Promise.resolve(originCoords) : geocodeAddress(origin.trim()),
        destinationCoords ? Promise.resolve(destinationCoords) : geocodeAddress(destination.trim()),
      ]);

      if (!originGeo) {
        toast.error(`Could not find coordinates for pickup: "${origin}". Please be more specific.`);
        return;
      }
      if (!destGeo) {
        toast.error(`Could not find coordinates for destination: "${destination}". Please be more specific.`);
        return;
      }

      const res = await fetchWithAuth('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          clientId: authState.user?.userId,
          transportCompanyId: Number(transportCompanyId),
          originAddress: origin.trim(),
          destinationAddress: destination.trim(),
          pickupLatitude: originGeo.lat,
          pickupLongitude: originGeo.lon,
          deliveryLatitude: destGeo.lat,
          deliveryLongitude: destGeo.lon,
          weight: weight ? parseFloat(weight) : 100,
          lengthCm: lengthCm ? parseFloat(lengthCm) : null,
          widthCm: widthCm ? parseFloat(widthCm) : null,
          heightCm: heightCm ? parseFloat(heightCm) : null,
          category: category,
          description: description.trim() || null,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Failed to create shipment');
      }
      
      const newShipment = await res.json();

      toast.success('Shipment created successfully');
      addNotification({
        title: 'Shipment Created',
        message: `Your shipment from ${origin.trim()} to ${destination.trim()} has been submitted.`,
        type: 'success',
      });
      setDialogOpen(false);
      setOrigin('');
      setOriginCoords(null);
      setDestination('');
      setDestinationCoords(null);
      setWeight('');
      setLengthCm('');
      setWidthCm('');
      setHeightCm('');
      
      // Dispatch action to push the new record directly into the global state
      addShipment(newShipment);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create shipment');
    } finally {
      setSubmitting(false);
    }
  };
  const cancelShipment = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this shipment request?')) return;
    
    try {
      const res = await fetchWithAuth(`/api/shipments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' })
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || 'Failed to cancel shipment');
      }
      
      toast.success('Shipment cancelled');
      setShipments(shipments.map(s => s.id === id ? { ...s, status: 'CANCELLED' as ShipmentStatus } : s));
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel shipment');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Shipments</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm inline-flex items-center gap-2 transition-colors">
              <Plus className="w-4 h-4" />
              New Shipment
            </button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Shipment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              {/* 📍 Pickup Location - GPS Pre-filled */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  📍 Pickup Location
                  <span className="ml-2 text-xs text-blue-500 font-normal">(Pre-filled from your GPS — editable)</span>
                </label>
                <div className="relative">
                  <AddressAutocomplete
                    label=""
                    placeholder={gpsLoading ? 'Detecting your location...' : 'Your current location or enter pickup address'}
                    value={origin}
                    onChange={(val) => {
                      setOrigin(val);
                      setOriginCoords(null); // clear GPS coords if manually edited
                    }}
                    onSelect={(s) => setOriginCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) })}
                    required
                  />
                  <button
                    type="button"
                    onClick={prefillGPS}
                    title="Use my current GPS location"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-600 transition-colors"
                  >
                    <Locate className={`w-4 h-4 ${gpsLoading ? 'animate-pulse' : ''}`} />
                  </button>
                </div>
              </div>
              
              {/* 🏁 Drop-off Location */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  🏁 Drop-off Location
                </label>
                <AddressAutocomplete
                  label=""
                  placeholder="Enter destination address..."
                  value={destination}
                  onChange={(val) => {
                    setDestination(val);
                    setDestinationCoords(null);
                  }}
                  onSelect={(s) => setDestinationCoords({ lat: parseFloat(s.lat), lon: parseFloat(s.lon) })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Transport Provider *</label>
                <select
                  value={transportCompanyId}
                  onChange={(e) => setTransportCompanyId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="" disabled>Select a provider</option>
                  {transportCompanies.map(comp => (
                    <option key={comp.id} value={comp.id}>{comp.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Shipment Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SHIPMENT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    placeholder="e.g. 50"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dimensions (L×W×H cm)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="L"
                      value={lengthCm}
                      onChange={(e) => setLengthCm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2.5 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="W"
                      value={widthCm}
                      onChange={(e) => setWidthCm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2.5 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                    />
                    <input
                      type="number"
                      placeholder="H"
                      value={heightCm}
                      onChange={(e) => setHeightCm(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-2.5 text-sm text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      min="0"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description / Special Instructions - Optional</label>
                <textarea
                  placeholder="e.g. Fragile items, handle with care. Ring bell on arrival."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 py-2.5 text-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Delivery Request'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Shipments', value: stats.total, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'In Transit', value: stats.inTransit, icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Delivered', value: stats.delivered, icon: PackageCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/30' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex items-center gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto overflow-x-auto">
          {['ALL', 'ACTIVE', 'DELIVERED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`flex-1 sm:flex-none px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                filter === f ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Shipment ID</th>
                <th className="px-6 py-4 font-medium">Route</th>
                <th className="px-6 py-4 font-medium">ETA</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><Skeleton className="h-6 w-24 rounded-full" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-48" /></td>
                    <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-16 ml-auto rounded-lg" /></td>
                  </tr>
                ))
              ) : paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No shipments found.
                  </td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr 
                    key={shipment.id}
                    className="even:bg-slate-50/50 dark:even:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1.5 border ${statusBadgeColor[shipment.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotColor[shipment.status]}`} />
                        {formatStatus(shipment.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-900 dark:text-slate-100 font-medium">
                      {String(shipment.id).slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 dark:text-slate-100 font-medium max-w-[120px] truncate">{shipment.originAddress}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium max-w-[120px] truncate">{shipment.destinationAddress}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                      {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* QR Code visible when assigned+ */}
                        {shipment.qrToken && ['ASSIGNED','EN_ROUTE_TO_PICKUP','AT_PICKUP','IN_TRANSIT'].includes(shipment.status) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedShipment(shipment);
                            }}
                            title="View QR Code for pickup verification"
                            className="bg-violet-50 hover:bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg p-1.5 transition-colors"
                          >
                            <QrCode className="w-4 h-4" />
                          </button>
                        )}
                        {shipment.status === 'REQUESTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              cancelShipment(shipment.id);
                            }}
                            className="bg-red-50 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-800/50 text-red-600 dark:text-red-400 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/client/track', { id: shipment.id });
                          }}
                          className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                        >
                          Track
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {paginatedShipments.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      <ShipmentDetailDrawer
        shipment={selectedShipment}
        open={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        readOnly
      />
    </div>
  );
}
