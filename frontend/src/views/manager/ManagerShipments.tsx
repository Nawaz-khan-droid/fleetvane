'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Link2, Download, PackageCheck, Search, ArrowRight, Eye, MapPin, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import t from '@/locales/en.json';
import type { Shipment, ShipmentStatus, Vehicle, DriverWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { SPRING_URL } from '@/lib/springUrl';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '@/components/shared/Pagination';
import ShipmentDetailDrawer from '@/components/shared/ShipmentDetailDrawer';
import SortableHeader, { type SortDir, useSort } from '@/components/shared/SortableHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusBadgeClasses: Record<ShipmentStatus, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
};

const statusBorderClasses: Record<ShipmentStatus, string> = {
  REQUESTED: 'border-l-4 border-l-amber-500',
  ASSIGNED: 'border-l-4 border-l-blue-500',
  IN_TRANSIT: 'border-l-4 border-l-blue-500',
  DELIVERED: 'border-l-4 border-l-emerald-500',
  CANCELLED: 'border-l-4 border-l-red-500',
};

const statusDotClasses: Record<ShipmentStatus, string> = {
  REQUESTED: 'bg-amber-500',
  ASSIGNED: 'bg-blue-500',
  IN_TRANSIT: 'bg-blue-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

function formatStatus(status: ShipmentStatus): string {
  return (t.client.milestones as any)[status] || status;
}

type FilterTab = 'ALL' | 'REQUESTED' | 'IN_TRANSIT' | 'DELIVERED';

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ManagerShipments() {
  const { state: authState } = useAuth();
  const { addNotification } = useNotifications();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [assigningShipment, setAssigningShipment] = useState<Shipment | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortKey, setSortKey] = useState<keyof Shipment>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const PAGE_SIZE = 10;

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverWithProfile[]>([]);

  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/shipments', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const rawData = await res.json();
      const pageData = normalizePageResponse<Shipment>(rawData);
      setShipments(pageData.items);
    } catch (err: any) {
      if (err instanceof ApiContractError) {
        toast.error('Unable to load shipments. Unexpected response format.');
      } else {
        toast.error(t.common.error);
      }
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  const fetchAvailableResources = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${authState.token}` };
      const [vehRes, drvRes] = await Promise.all([
        fetchWithAuth('/api/vehicles', { headers }),
        fetchWithAuth('/api/drivers', { headers }),
      ]);
      if (!vehRes.ok || !drvRes.ok) throw new Error();
      const allVehicles: Vehicle[] = normalizePageResponse<Vehicle>(await vehRes.json()).items;
      const allDrivers: DriverWithProfile[] = normalizePageResponse<DriverWithProfile>(await drvRes.json()).items;
      setAvailableVehicles(allVehicles.filter((v) => v.status === 'AVAILABLE'));
      setAvailableDrivers(allDrivers.filter((d) => d.driverProfile?.isAvailable));
    } catch {
      toast.error(t.common.error);
    }
  }, [authState.token]);

  const filteredShipments = shipments.filter((s) => {
    if (activeTab !== 'ALL' && s.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        String(s.id).toLowerCase().includes(q) ||
        s.originAddress.toLowerCase().includes(q) ||
        s.destinationAddress.toLowerCase().includes(q) ||
        (s.vehicle?.plateNumber || '').toLowerCase().includes(q) ||
        (s.driver?.name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedShipments = useSort(filteredShipments, sortKey, sortDir);
  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / PAGE_SIZE));
  const paginatedShipments = sortedShipments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: keyof Shipment) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleOpenAssign = (shipment: Shipment) => {
    setAssigningShipment(shipment);
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAssignDialogOpen(true);
    fetchAvailableResources();
  };

  const handleAssign = async () => {
    if (!assigningShipment || !selectedVehicleId || !selectedDriverId) return;
    setAssigning(true);
    try {
      const res = await fetch(`/api/shipments/${assigningShipment.id}/assign?vehicleId=${selectedVehicleId}&driverId=${selectedDriverId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error();
      toast.success(t.manager.vehicleAssigned);
      addNotification({
        title: 'Shipment Assigned',
        message: 'Vehicle and driver assigned successfully.',
        type: 'success',
      });
      setAssignDialogOpen(false);
      fetchShipments();
    } catch {
      toast.error(t.common.error);
    } finally {
      setAssigning(false);
    }
  };

  const handleStatusUpdate = async (shipmentId: string, status: ShipmentStatus) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/status?status=${status}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error();
      toast.success(`Shipment ${status === 'DELIVERED' ? 'delivered' : 'cancelled'} successfully`);
      fetchShipments();
    } catch {
      toast.error(t.common.error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full max-w-sm" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Shipment Management</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Track and assign fleet shipments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search ID, location, driver..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl"
            />
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0"
            onClick={() => {
              const headers = ['ID','Origin','Destination','Status','Driver'];
              const rows = filteredShipments.map(s => [s.id, s.originAddress, s.destinationAddress, formatStatus(s.status), s.driver?.name || '']);
              const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'shipments.csv'; a.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
        {(['ALL', 'REQUESTED', 'IN_TRANSIT', 'DELIVERED'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {tab === 'ALL' ? 'All Shipments' : formatStatus(tab)}
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-12">
                  <Checkbox
                    checked={paginatedShipments.length > 0 && paginatedShipments.every(s => selectedIds.has(s.id))}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedIds(new Set(paginatedShipments.map(s => s.id)));
                      else setSelectedIds(new Set());
                    }}
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"><SortableHeader label="ID" sortDir={sortKey==='id'?sortDir:null} onSort={()=>handleSort('id')} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Route</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"><SortableHeader label="Status" sortDir={sortKey==='status'?sortDir:null} onSort={()=>handleSort('status')} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"><SortableHeader label="Driver" sortDir={sortKey==='driverId'?sortDir:null} onSort={()=>handleSort('driverId')} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide"><SortableHeader label="ETA / Created" sortDir={sortKey==='createdAt'?sortDir:null} onSort={()=>handleSort('createdAt')} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedShipments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No shipments found.</td>
                </tr>
              ) : (
                paginatedShipments.map((shipment) => (
                  <tr
                    key={shipment.id}
                    onClick={() => setSelectedShipment(shipment)}
                    className={`border-b border-slate-200 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors ${statusBorderClasses[shipment.status]}`}
                  >
                    <td className="px-4 py-3 align-top" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(shipment.id)}
                        onCheckedChange={(checked) => {
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (checked) next.add(shipment.id);
                            else next.delete(shipment.id);
                            return next;
                          });
                        }}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{String(shipment.id).slice(0, 8)}</span>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[200px]" title={shipment.originAddress}>{shipment.originAddress}</span></div>
                        <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[200px]" title={shipment.destinationAddress}>{shipment.destinationAddress}</span></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1.5 border ${statusBadgeClasses[shipment.status] || statusBadgeClasses.REQUESTED}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[shipment.status] || 'bg-slate-500'}`} />
                        {formatStatus(shipment.status)}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {shipment.driver ? (
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">{shipment.driver.name}</div>
                      ) : (
                        <span className="text-sm text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-sm text-slate-900 dark:text-slate-100">{new Date(shipment.createdAt).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-500">{timeAgo(shipment.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        {shipment.status === 'REQUESTED' && (
                          <Button
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-8 px-3 text-xs"
                            onClick={() => handleOpenAssign(shipment)}
                          >
                            Assign
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-xl"
                          onClick={() => setSelectedShipment(shipment)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      {/* Bulk Action Bar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-2xl px-6 py-3 flex items-center gap-4 shadow-xl z-50 border border-slate-800"
          >
            <span className="text-sm font-medium whitespace-nowrap">{selectedIds.size} selected</span>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent border-slate-700 hover:bg-slate-800 hover:text-white" onClick={() => {
                const toDeliver = paginatedShipments.filter(s => selectedIds.has(s.id) && s.status === 'IN_TRANSIT');
                toDeliver.forEach(s => handleStatusUpdate(s.id, 'DELIVERED'));
                setSelectedIds(new Set());
              }}>
                Mark Delivered
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs bg-transparent border-red-900/50 text-red-400 hover:bg-red-950/50 hover:text-red-300" onClick={() => {
                const toCancel = paginatedShipments.filter(s => selectedIds.has(s.id) && (s.status === 'REQUESTED' || s.status === 'ASSIGNED'));
                toCancel.forEach(s => handleStatusUpdate(s.id, 'CANCELLED'));
                setSelectedIds(new Set());
              }}>
                Cancel Shipments
              </Button>
            </div>
            <button onClick={() => setSelectedIds(new Set())} className="p-1 hover:bg-slate-800 rounded-lg ml-2">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={(open) => { setAssignDialogOpen(open); if (!open) setAssigningShipment(null); }}>
        <DialogContent className="sm:max-w-[425px] p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Assign Resources</DialogTitle>
            <DialogDescription>
              Assign a vehicle and driver for shipment {String(assigningShipment?.id || "").slice(0, 8)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Vehicle</label>
              <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {availableVehicles.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.plateNumber} ({v.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-900 dark:text-slate-100">Driver</label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Select driver" />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button disabled={assigning || !selectedVehicleId || !selectedDriverId} onClick={handleAssign} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {assigning ? 'Assigning...' : 'Assign Resources'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ShipmentDetailDrawer
        shipment={selectedShipment}
        open={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdate={fetchShipments}
        onAssign={(s) => { setSelectedShipment(null); handleOpenAssign(s); }}
      />
    </div>
  );
}
