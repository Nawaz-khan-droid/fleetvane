'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, PackageCheck, Clock, Navigation, Plus, MapPin, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from '@/context/RouterContext';
import type { Shipment, ShipmentStatus } from '@/types';
import { useStore } from '@/store/useStore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';
import ShipmentDetailDrawer from '@/components/shared/ShipmentDetailDrawer';

function formatStatus(status: ShipmentStatus): string {
  const map: Record<string, string> = {
    REQUESTED: 'Requested',
    ASSIGNED: 'Assigned',
    IN_TRANSIT: 'In Transit',
    DELIVERED: 'Delivered',
    CANCELLED: 'Cancelled'
  };
  return map[status] || status;
}

const statusBadgeColor: Record<ShipmentStatus, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400',
};

const statusDotColor: Record<ShipmentStatus, string> = {
  REQUESTED: 'bg-amber-500',
  ASSIGNED: 'bg-blue-500',
  IN_TRANSIT: 'bg-blue-500',
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

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [volumeM3, setVolumeM3] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'Accept-Language': 'en' } }
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
      const res = await fetch(
        `/api/shipments?clientId=${authState.user?.userId}`,
        { headers: { Authorization: `Bearer ${authState.token}` } }
      );
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
    if (!origin.trim() || !destination.trim()) return;

    setSubmitting(true);
    try {
      // Geocode both addresses in parallel via OSM Nominatim
      const [originGeo, destGeo] = await Promise.all([
        geocodeAddress(origin.trim()),
        geocodeAddress(destination.trim()),
      ]);

      if (!originGeo) {
        toast.error(`Could not find coordinates for pickup: "${origin}". Please be more specific.`);
        return;
      }
      if (!destGeo) {
        toast.error(`Could not find coordinates for destination: "${destination}". Please be more specific.`);
        return;
      }

      const res = await fetchWithAuth('/api/shipments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          clientId: authState.user?.userId,
          originAddress: origin.trim(),
          destinationAddress: destination.trim(),
          // Plain-decimal fields for DeliveryOrder compatibility
          pickupLatitude: originGeo.lat,
          pickupLongitude: originGeo.lon,
          deliveryLatitude: destGeo.lat,
          deliveryLongitude: destGeo.lon,
          cargoWeightKg: weight ? parseFloat(weight) : null,
          cargoVolumeM3: volumeM3 ? parseFloat(volumeM3) : null,
        }),
      });
      if (!res.ok) throw new Error();
      
      const newShipment = await res.json();

      toast.success('Shipment created successfully');
      addNotification({
        title: 'Shipment Created',
        message: `Your shipment from ${origin.trim()} to ${destination.trim()} has been submitted.`,
        type: 'success',
      });
      setDialogOpen(false);
      setOrigin('');
      setDestination('');
      setWeight('');
      setVolumeM3('');
      
      // Dispatch action to push the new record directly into the global state
      addShipment(newShipment);
    } catch {
      toast.error('Failed to create shipment');
    } finally {
      setSubmitting(false);
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
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Origin Address</label>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Destination Address</label>
                <input
                  type="text"
                  placeholder="Enter delivery location"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Weight (kg) - Optional</label>
                <input
                  type="number"
                  placeholder="e.g. 50"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cargo Volume (m³) - Optional</label>
                <input
                  type="number"
                  placeholder="e.g. 1.5"
                  value={volumeM3}
                  onChange={(e) => setVolumeM3(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  min="0"
                  step="0.1"
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
                  {submitting ? 'Creating...' : 'Create Shipment'}
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/client/track', { id: shipment.id });
                        }}
                        className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                      >
                        Track
                      </button>
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
