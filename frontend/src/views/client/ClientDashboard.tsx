'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Package, Plus, MapPin, Search, Download, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, ShipmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';
import ShipmentDetailDrawer from '@/components/shared/ShipmentDetailDrawer';
import SortableHeader, { type SortDir, useSort } from '@/components/shared/SortableHeader';

// ── Milestone State Machine ───────────────────────────────
const STATUS_ORDER: ShipmentStatus[] = [
  'REQUESTED',
  'ASSIGNED',
  'IN_TRANSIT',
  'DELIVERED',
];

function getStatusProgress(status: ShipmentStatus): number {
  if (status === 'CANCELLED') return 0;
  const idx = STATUS_ORDER.indexOf(status);
  if (idx === -1) return 0;
  return (idx / (STATUS_ORDER.length - 1)) * 100;
}

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

export default function ClientDashboard() {
  const { state: authState } = useAuth();
  const { navigate } = useRouter();
  const { addNotification } = useNotifications();

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [weight, setWeight] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Shipment>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const PAGE_SIZE = 5;

  // ── Fetch shipments ────────────────────────────────────
  const fetchShipments = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/shipments?clientId=${authState.user?.userId}`,
        {
          headers: { Authorization: `Bearer ${authState.token}` },
        }
      );
      if (!res.ok) throw new Error('Failed to fetch shipments');
      const data = await res.json();
      setShipments(data);
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authState.user?.userId, authState.token]);

  useEffect(() => {
    fetchShipments();
  }, [fetchShipments]);

  // ── Filter shipments ──────────────────────────────────
  const filteredShipments = shipments.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.originAddress.toLowerCase().includes(q) ||
      s.destinationAddress.toLowerCase().includes(q) ||
      formatStatus(s.status).toLowerCase().includes(q) ||
      s.id.toLowerCase().includes(q)
    );
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

  // ── Submit new shipment ────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin.trim() || !destination.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetchWithAuth('/api/shipments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({
          clientId: authState.user?.userId,
          origin: origin.trim(),
          destination: destination.trim(),
          weight: weight ? parseFloat(weight) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create shipment');

      toast.success(t.client.shipmentCreated);
      addNotification({
        title: 'Shipment Created',
        message: `Your shipment from ${origin.trim()} to ${destination.trim()} has been submitted.`,
        type: 'success',
      });
      setDialogOpen(false);
      setOrigin('');
      setDestination('');
      setWeight('');
      fetchShipments();
    } catch {
      toast.error(t.common.error);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Truncate ID for display ────────────────────────────
  const truncateId = (id: string) =>
    id.length > 8 ? `${id.slice(0, 8)}...` : id;

  return (
    <>
      {/* ── Toolbar: Search + Actions ────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6"
      >
        {/* Search bar (full-width on mobile, constrained on desktop) */}
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder={t.client.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`${theme.form.input} pl-10`}
          />
        </div>

        {/* Action buttons (row on mobile, right-aligned on desktop) */}
        <div className="flex items-center gap-2 sm:shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-9 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 transition-all duration-200"
            onClick={() => {
              const headers = ['ID', 'Origin', 'Destination', 'Status', 'Weight', 'Created'];
              const rows = filteredShipments.map(s => [
                s.id, s.originAddress, s.destinationAddress,
                formatStatus(s.status),
                s.weight || '',
                new Date(s.createdAt).toLocaleDateString(),
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
            Export CSV
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className={theme.button.primarySm}>
                <Plus className="w-4 h-4 mr-2" />
                {t.client.newShipment}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.client.newShipmentTitle}</DialogTitle>
                <p className={theme.typography.caption}>
                  {t.client.newShipmentSubtitle}
                </p>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <Label>{t.client.origin}</Label>
                  <Input
                    placeholder={t.client.originPlaceholder}
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className={theme.form.input}
                    required
                  />
                </div>
                <div>
                  <Label>{t.client.destination}</Label>
                  <Input
                    placeholder={t.client.destinationPlaceholder}
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className={theme.form.input}
                    required
                  />
                </div>
                <div>
                  <Label>{t.client.weight}</Label>
                  <Input
                    type="number"
                    placeholder={t.client.weightPlaceholder}
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className={theme.form.input}
                    min={0}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    {t.client.cancel}
                  </Button>
                  <Button
                    type="submit"
                    className={theme.button.primarySm}
                    disabled={submitting}
                  >
                    {submitting ? t.client.submitting : t.client.submit}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Table or empty state */}
      <Card className={theme.card.base}>
        <CardContent className={`${theme.table.scrollCard} overflow-x-auto`}>
          {loading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : filteredShipments.length === 0 ? (
            <motion.div
              className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-20 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 mx-auto">
                <Package className="w-8 h-8 text-slate-400" />
              </div>
              <p className={theme.typography.body}>{t.client.noShipments}</p>
            </motion.div>
          ) : (
            <>
              {/* ── Desktop table (hidden on mobile) ── */}
              <div className="hidden md:block">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label={t.client.shipmentId} sortDir={sortKey==='id'?sortDir:null} onSort={()=>handleSort('id')} /></TableHead>
                    <TableHead><SortableHeader label={t.client.origin} sortDir={sortKey==='originAddress'?sortDir:null} onSort={()=>handleSort('originAddress')} /></TableHead>
                    <TableHead><SortableHeader label={t.client.destination} sortDir={sortKey==='destinationAddress'?sortDir:null} onSort={()=>handleSort('destinationAddress')} /></TableHead>
                    <TableHead><SortableHeader label={t.client.status} sortDir={sortKey==='status'?sortDir:null} onSort={()=>handleSort('status')} /></TableHead>
                    <TableHead><SortableHeader label={t.client.createdAt} sortDir={sortKey==='createdAt'?sortDir:null} onSort={()=>handleSort('createdAt')} /></TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShipments.map((shipment, i) => (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${theme.table.zebraRow}`}
                      onClick={() => setSelectedShipment(shipment)}
                    >
                      <TableCell className="font-mono text-sm py-3">
                        {truncateId(shipment.id)}
                      </TableCell>
                      <TableCell className="py-3">{shipment.originAddress}</TableCell>
                      <TableCell className="py-3">{shipment.destinationAddress}</TableCell>
                      <TableCell className={`py-3 ${statusBorderAccent[shipment.status]}`}>
                        <Badge
                          className={`${theme.status.badge} px-3 py-1 text-xs font-semibold ${statusBadgeClass[shipment.status]}`}
                        >
                          {formatStatus(shipment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${theme.typography.caption} py-3`}>
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <Button
                          className={theme.button.outlineSm}
                          onClick={() =>
                            navigate('/client/track', { id: shipment.id })
                          }
                        >
                          <MapPin className="w-3.5 h-3.5 mr-1.5" />
                          {t.client.trackShipment}
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
              </div>

              {/* ── Mobile card layout (hidden on md+) ── */}
              <div className="md:hidden space-y-3">
                {paginatedShipments.map((shipment, i) => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className={`relative rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${statusBorderAccent[shipment.status]}`}
                    onClick={() => setSelectedShipment(shipment)}
                  >
                    {/* Status badge top-right */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        className={`${theme.status.badge} text-[10px] font-semibold ${statusBadgeClass[shipment.status]}`}
                      >
                        {formatStatus(shipment.status)}
                      </Badge>
                    </div>

                    {/* ID */}
                    <p className="font-mono text-sm font-medium text-slate-800 dark:text-slate-200 mb-2 pr-20">
                      {truncateId(shipment.id)}
                    </p>

                    {/* Origin → Destination with arrow */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {shipment.originAddress}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate">
                        {shipment.destinationAddress}
                      </span>
                    </div>

                    {/* Weight + Date row */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>{shipment.weight ? `${shipment.weight} kg` : '—'}</span>
                      <span>{new Date(shipment.createdAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipment Detail Dialog (read-only) */}
      <ShipmentDetailDrawer
        shipment={selectedShipment}
        open={!!selectedShipment}
        onClose={() => setSelectedShipment(null)}
        readOnly
      />
    </>
  );
}
