'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Link2, Download, PackageCheck, Search, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, ShipmentStatus, Vehicle, DriverWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import Pagination from '@/components/shared/Pagination';
import ShipmentDetailDrawer from '@/components/shared/ShipmentDetailDrawer';
import SortableHeader, { type SortDir, useSort } from '@/components/shared/SortableHeader';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

// ── Status badge mapping ──────────────────────────────────
const statusBadgeClass: Record<ShipmentStatus, string> = {
  REQUESTED: theme.status.requested,
  ASSIGNED: theme.status.assigned,
  IN_TRANSIT: theme.status.inTransit,
  DELIVERED: theme.status.delivered,
  CANCELLED: theme.status.cancelled,
};

const statusBorderAccent: Record<ShipmentStatus, string> = {
  REQUESTED: 'border-l-2 border-l-amber-400',
  ASSIGNED: 'border-l-2 border-l-blue-400',
  IN_TRANSIT: 'border-l-2 border-l-emerald-400',
  DELIVERED: 'border-l-2 border-l-slate-300 dark:border-l-slate-600',
  CANCELLED: 'border-l-2 border-l-red-400',
};

function formatStatus(status: ShipmentStatus): string {
  return t.client.milestones[status] || status;
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

  // Dialog state
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
  const PAGE_SIZE = 5;

  // Available vehicles & drivers for assign dialog
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<DriverWithProfile[]>([]);

  // ── Fetch shipments ───────────────────────────────────
  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch('/api/shipments', {
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

  // ── Fetch available resources when dialog opens ───────
  const fetchAvailableResources = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${authState.token}` };

      const [vehRes, drvRes] = await Promise.all([
        fetch('/api/vehicles', { headers }),
        fetch('/api/drivers', { headers }),
      ]);

      if (!vehRes.ok || !drvRes.ok) throw new Error();

      const rawVehicles = await vehRes.json();
      const rawDrivers = await drvRes.json();

      const allVehicles: Vehicle[] = normalizePageResponse<Vehicle>(rawVehicles).items;
      const allDrivers: DriverWithProfile[] = normalizePageResponse<DriverWithProfile>(rawDrivers).items;

      setAvailableVehicles(allVehicles.filter((v) => v.status === 'AVAILABLE'));
      setAvailableDrivers(allDrivers.filter((d) => d.driverProfile?.isAvailable));
    } catch {
      toast.error(t.common.error);
    }
  }, [authState.token]);

  // ── Filter & sort shipments ──────────────────────────
  const filteredShipments = shipments.filter((s) => {
    if (activeTab !== 'ALL' && s.status !== activeTab) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.id.toLowerCase().includes(q) ||
        s.origin.toLowerCase().includes(q) ||
        s.destination.toLowerCase().includes(q) ||
        (s.vehicle?.plateNumber || '').toLowerCase().includes(q) ||
        (s.driver?.name || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const sortedShipments = useSort(filteredShipments, sortKey, sortDir);
  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / PAGE_SIZE));
  const paginatedShipments = sortedShipments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handleSort = (key: keyof Shipment) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Open assign dialog ───────────────────────────────
  const handleOpenAssign = (shipment: Shipment) => {
    setAssigningShipment(shipment);
    setSelectedVehicleId('');
    setSelectedDriverId('');
    setAssignDialogOpen(true);
    fetchAvailableResources();
  };

  // ── Submit assignment ────────────────────────────────
  const handleAssign = async () => {
    if (!assigningShipment || !selectedVehicleId || !selectedDriverId) return;

    setAssigning(true);
    try {
      const res = await fetch(`/api/shipments/${assigningShipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          status: 'ASSIGNED',
          vehicleId: selectedVehicleId,
          driverId: selectedDriverId,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(t.manager.vehicleAssigned);
      const assignedVehicle = availableVehicles.find((v) => v.id === selectedVehicleId);
      addNotification({
        title: 'Shipment Assigned',
        message: `Vehicle ${assignedVehicle?.plateNumber || 'assigned'} assigned to shipment.`,
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

  // ── Update shipment status ─────────────────────────
  const handleStatusUpdate = async (shipmentId: string, status: ShipmentStatus) => {
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authState.token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Shipment ${status === 'DELIVERED' ? 'delivered' : 'cancelled'} successfully`);
      addNotification({
        title: `Shipment ${status === 'DELIVERED' ? 'Delivered' : 'Cancelled'}`,
        message: `Shipment status updated to ${formatStatus(status)}.`,
        type: status === 'DELIVERED' ? 'success' : 'warning',
      });
      fetchShipments();
    } catch {
      toast.error(t.common.error);
    }
  };

  // ── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* ── Filter Tabs ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search bar - full width on mobile */}
          <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search shipments..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 h-9"
            />
          </div>
          {/* Filter tabs + export - horizontal scroll on mobile */}
          <div className="flex items-center gap-3 overflow-x-auto sm:overflow-visible no-scrollbar -mx-1 px-1">
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as FilterTab); setCurrentPage(1); }}>
              <TabsList className="shrink-0">
                <TabsTrigger value="ALL">All</TabsTrigger>
                <TabsTrigger value="REQUESTED">Requested</TabsTrigger>
                <TabsTrigger value="IN_TRANSIT">In Transit</TabsTrigger>
                <TabsTrigger value="DELIVERED">Delivered</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button
              variant="outline"
              size="sm"
              className="h-9 shrink-0 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
              onClick={() => {
                const headers = ['ID','Client','Origin','Destination','Weight','Status','Vehicle','Driver'];
                const rows = filteredShipments.map(s => [
                  s.id, s.clientId, s.origin, s.destination,
                  s.weight || '', formatStatus(s.status),
                  s.vehicle?.plateNumber || '', s.driver?.name || ''
                ]);
                const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = 'shipments.csv'; a.click();
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Export
            </Button>
          </div>
        </div>
      </motion.div>

      {/* ── Shipment Table ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className={theme.card.base}>
          <CardContent className={`${theme.table.scrollCard} overflow-x-auto`}>
            {filteredShipments.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-12 text-center mx-auto max-w-2xl my-6">
                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 mx-auto border border-slate-100 dark:border-slate-700">
                  <Package className="w-7 h-7 text-slate-400" />
                </div>
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Shipments Found</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.manager.noShipments}</p>
              </div>
            ) : (
              <>
              {/* Batch action bar (shared) */}
              {selectedIds.size > 0 && (
                <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} className="flex flex-wrap items-center gap-2 mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    {selectedIds.size} selected
                  </span>
                  <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => {
                    const toDeliver = paginatedShipments.filter(s => selectedIds.has(s.id) && s.status === 'IN_TRANSIT');
                    toDeliver.forEach(s => handleStatusUpdate(s.id, 'DELIVERED'));
                    setSelectedIds(new Set());
                  }}>
                    Deliver Selected
                  </Button>
                  <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50" onClick={() => {
                    const toCancel = paginatedShipments.filter(s => selectedIds.has(s.id) && (s.status === 'REQUESTED' || s.status === 'ASSIGNED'));
                    toCancel.forEach(s => handleStatusUpdate(s.id, 'CANCELLED'));
                    setSelectedIds(new Set());
                  }}>
                    Cancel Selected
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 text-xs ml-auto" onClick={() => setSelectedIds(new Set())}>
                    Clear
                  </Button>
                </motion.div>
              )}

              {/* Desktop table */}
              <div className="hidden md:block">
              <div className="min-w-[900px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={paginatedShipments.length > 0 && paginatedShipments.every(s => selectedIds.has(s.id))}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedIds(new Set(paginatedShipments.map(s => s.id)));
                          } else {
                            setSelectedIds(new Set());
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead><SortableHeader label="ID" sortDir={sortKey==='id'?sortDir:null} onSort={()=>handleSort('id')} /></TableHead>
                    <TableHead><SortableHeader label="Origin" sortDir={sortKey==='origin'?sortDir:null} onSort={()=>handleSort('origin')} /></TableHead>
                    <TableHead><SortableHeader label="Destination" sortDir={sortKey==='destination'?sortDir:null} onSort={()=>handleSort('destination')} /></TableHead>
                    <TableHead><SortableHeader label="Weight" sortDir={sortKey==='weight'?sortDir:null} onSort={()=>handleSort('weight')} /></TableHead>
                    <TableHead><SortableHeader label="Status" sortDir={sortKey==='status'?sortDir:null} onSort={()=>handleSort('status')} /></TableHead>
                    <TableHead><SortableHeader label="Vehicle" sortDir={sortKey==='vehicleId'?sortDir:null} onSort={()=>handleSort('vehicleId')} /></TableHead>
                    <TableHead><SortableHeader label="Driver" sortDir={sortKey==='driverId'?sortDir:null} onSort={()=>handleSort('driverId')} /></TableHead>
                    <TableHead><SortableHeader label="Created" sortDir={sortKey==='createdAt'?sortDir:null} onSort={()=>handleSort('createdAt')} /></TableHead>
                    <TableHead className="text-right min-w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShipments.map((shipment, i) => (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={`border-b last:border-0 ${theme.table.zebraRow} transition-colors duration-150 cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20`}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest('button, input, [role="checkbox"]')) return;
                        setSelectedShipment(shipment);
                      }}
                    >
                      <TableCell className="py-3">
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
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-sm py-3">
                        <span title={shipment.id} className="cursor-help border-b border-dotted border-slate-300 dark:border-slate-600">
                          {shipment.id.length > 10
                            ? `${shipment.id.slice(0, 10)}…`
                            : shipment.id}
                        </span>
                      </TableCell>
                      <TableCell className="py-3">{shipment.origin}</TableCell>
                      <TableCell className="py-3">{shipment.destination}</TableCell>
                      <TableCell className="py-3">
                        {shipment.weight ? `${shipment.weight} kg` : '—'}
                      </TableCell>
                      <TableCell className={`py-3 ${statusBorderAccent[shipment.status]}`}>
                        <Badge
                          className={`${theme.status.badge} ${
                            statusBadgeClass[shipment.status]
                          }`}
                        >
                          {formatStatus(shipment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        {shipment.vehicle?.plateNumber || '—'}
                      </TableCell>
                      <TableCell className="py-3">
                        {shipment.driver?.name || '—'}
                      </TableCell>
                      <TableCell className={`${theme.typography.caption} py-3`}>
                        <div>{new Date(shipment.createdAt).toLocaleDateString()}</div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">{timeAgo(shipment.createdAt)}</div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-2 whitespace-nowrap">
                          {shipment.status === 'IN_TRANSIT' && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 transition-all duration-200 hover:shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(shipment.id, 'DELIVERED');
                              }}
                            >
                              <PackageCheck className="w-3 h-3 mr-1" />
                              Deliver
                            </Button>
                          )}
                          {shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 border-0 transition-all duration-200 hover:shadow-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStatusUpdate(shipment.id, 'CANCELLED');
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                          {shipment.status === 'REQUESTED' && (
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-700 text-white hover:bg-emerald-800 border-0 transition-all duration-200 hover:shadow-sm"
                              onClick={(e) => { e.stopPropagation(); handleOpenAssign(shipment); }}
                            >
                              <Link2 className="w-3 h-3 mr-1" />
                              Assign
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              </div>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden p-4 space-y-3">
                {/* Mobile select-all checkbox */}
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Checkbox
                    checked={paginatedShipments.length > 0 && paginatedShipments.every(s => selectedIds.has(s.id))}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedIds(new Set(paginatedShipments.map(s => s.id)));
                      } else {
                        setSelectedIds(new Set());
                      }
                    }}
                  />
                  <span className="text-xs text-slate-500 dark:text-slate-400">Select all on page</span>
                </div>
                {paginatedShipments.map((shipment, i) => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`rounded-lg border bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer ${
                      selectedIds.has(shipment.id)
                        ? 'border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                    onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, [role="checkbox"]')) return;
                      setSelectedShipment(shipment);
                    }}
                  >
                    {/* Top row: checkbox + ID + status */}
                    <div className="flex items-center gap-2.5 mb-2.5">
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
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-300 dark:border-slate-600 cursor-help">
                            {shipment.id.length > 12
                              ? `${shipment.id.slice(0, 12)}…`
                              : shipment.id}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] break-all">
                          {shipment.id}
                        </TooltipContent>
                      </Tooltip>
                      <div className="ml-auto">
                        <Badge
                          className={`${theme.status.badge} ${statusBorderAccent[shipment.status]} ${statusBadgeClass[shipment.status]}`}
                        >
                          {formatStatus(shipment.status)}
                        </Badge>
                      </div>
                    </div>

                    {/* Route: origin → destination */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[40%]">{shipment.origin}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[40%]">{shipment.destination}</span>
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-3">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Weight</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{shipment.weight ? `${shipment.weight} kg` : '—'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Created</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">
                          {new Date(shipment.createdAt).toLocaleDateString()}
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1.5">{timeAgo(shipment.createdAt)}</span>
                        </p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Vehicle</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{shipment.vehicle?.plateNumber || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide">Driver</span>
                        <p className="text-xs text-slate-700 dark:text-slate-300">{shipment.driver?.name || '—'}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                      {shipment.status === 'IN_TRANSIT' && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-0 transition-all duration-200 hover:shadow-sm"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(shipment.id, 'DELIVERED'); }}
                        >
                          <PackageCheck className="w-3 h-3 mr-1" />
                          Deliver
                        </Button>
                      )}
                      {shipment.status !== 'DELIVERED' && shipment.status !== 'CANCELLED' && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-red-100 text-red-700 hover:bg-red-200 border-0 transition-all duration-200 hover:shadow-sm"
                          onClick={(e) => { e.stopPropagation(); handleStatusUpdate(shipment.id, 'CANCELLED'); }}
                        >
                          Cancel
                        </Button>
                      )}
                      {shipment.status === 'REQUESTED' && (
                        <Button
                          size="sm"
                          className="h-7 px-2.5 text-xs bg-emerald-700 text-white hover:bg-emerald-800 border-0 transition-all duration-200 hover:shadow-sm"
                          onClick={(e) => { e.stopPropagation(); handleOpenAssign(shipment); }}
                        >
                          <Link2 className="w-3 h-3 mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Assign Vehicle/Driver Dialog (outside table) ── */}
      <Dialog
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) setAssigningShipment(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.manager.assignVehicle}</DialogTitle>
            <DialogDescription>
              Assign a vehicle and driver to shipment {assigningShipment?.id?.slice(0, 8)}...
            </DialogDescription>
          </DialogHeader>

          {/* Vehicle select */}
          <div className="space-y-2 pt-2">
            <label className={theme.form.label}>
              {t.manager.selectVehicle}
            </label>
            <Select
              value={selectedVehicleId}
              onValueChange={setSelectedVehicleId}
            >
              <SelectTrigger className={theme.form.select}>
                <SelectValue placeholder={t.manager.selectVehicle} />
              </SelectTrigger>
              <SelectContent>
                {availableVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.plateNumber} — {v.type} ({v.model})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Driver select */}
          <div className="space-y-2">
            <label className={theme.form.label}>
              {t.manager.selectDriver}
            </label>
            <Select
              value={selectedDriverId}
              onValueChange={setSelectedDriverId}
            >
              <SelectTrigger className={theme.form.select}>
                <SelectValue placeholder={t.manager.selectDriver} />
              </SelectTrigger>
              <SelectContent>
                {availableDrivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name} — {d.driverProfile?.licenseNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">{t.common.cancel}</Button>
            </DialogClose>
            <Button
              className={theme.button.primarySm}
              disabled={assigning || !selectedVehicleId || !selectedDriverId}
              onClick={handleAssign}
            >
              {assigning ? t.common.loading : t.common.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipment Detail Dialog */}
      <ShipmentDetailDrawer
        shipment={selectedShipment}
        open={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        onUpdate={fetchShipments}
        onAssign={(s) => {
          setSelectedShipment(null);
          handleOpenAssign(s);
        }}
      />
    </>
  );
}
