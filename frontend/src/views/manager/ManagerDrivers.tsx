'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { DriverWithProfile, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';
import SortableHeader, { type SortDir, useSort } from '@/components/shared/SortableHeader';

// ── Flat sortable driver type ─────────────────────────────
interface SortableDriver {
  name: string;
  email: string;
  licenseNumber: string;
  vehicle: string;
  isAvailable: boolean;
}

export default function ManagerDrivers() {
  const { state: authState } = useAuth();

  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [creating, setCreating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<keyof SortableDriver>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  // Available vehicles for create dialog
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  // ── Fetch drivers ────────────────────────────────────
  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/drivers', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const rawData = await res.json();
      const pageData = normalizePageResponse<any>(rawData); // Temporarily any, as driver profile type might differ
      setDrivers(pageData.items);
    } catch (err: any) {
      if (err instanceof ApiContractError) {
        toast.error('Unable to load drivers. Unexpected response format.');
      } else {
        toast.error(t.common.error);
      }
    } finally {
      setLoading(false);
    }
  }, [authState.token]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // ── Fetch available vehicles when dialog opens ───────
  const fetchAvailableVehicles = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/vehicles', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error();
      const data: Vehicle[] = await res.json();
      setAvailableVehicles(data.filter((v) => v.status === 'AVAILABLE'));
    } catch {
      toast.error(t.common.error);
    }
  }, [authState.token]);

  // ── Create driver ────────────────────────────────────
  const handleCreateDriver = async () => {
    if (!driverName.trim() || !licenseNumber.trim()) return;

    setCreating(true);
    try {
      const body: Record<string, string | null> = {
        name: driverName.trim(),
        licenseNumber: licenseNumber.trim(),
        vehicleId: selectedVehicleId || null,
      };

      const res = await fetchWithAuth('/api/drivers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error();
      toast.success(t.manager.driverCreated);
      setCreateDialogOpen(false);
      setDriverName('');
      setLicenseNumber('');
      setSelectedVehicleId('');
      fetchDrivers();
    } catch {
      toast.error(t.common.error);
    } finally {
      setCreating(false);
    }
  };

  // ── Search & Sort pipeline ─────────────────────────
  const filteredDrivers = drivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      (d.driverProfile?.licenseNumber ?? '').toLowerCase().includes(q)
    );
  });

  // Map to flat sortable objects
  const sortableData: (SortableDriver & { _original: DriverWithProfile })[] = filteredDrivers.map((d) => ({
    name: d.name,
    email: d.email,
    licenseNumber: d.driverProfile?.licenseNumber || '',
    vehicle: d.driverProfile?.vehicle
      ? `${d.driverProfile.vehicle.plateNumber} (${d.driverProfile.vehicle.model})`
      : '',
    isAvailable: d.driverProfile?.isAvailable ?? true,
    _original: d,
  }));

  const sortedData = useSort(sortableData, sortKey, sortDir);
  const totalPages = Math.max(1, Math.ceil(sortedData.length / PAGE_SIZE));
  const paginatedDrivers = sortedData.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleSort = (key: keyof SortableDriver) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : d === 'desc' ? null : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  // ── Loading state ────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* ── Toolbar: Search + Actions ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6"
      >
        {/* Left: Search bar */}
        <div className="relative w-full sm:flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name, email, or license..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className={`${theme.form.input} pl-10`}
          />
        </div>

        {/* Right: Create Driver button */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className={`${theme.button.primarySm} w-full sm:w-auto`}
                onClick={fetchAvailableVehicles}
              >
                <Plus className="w-4 h-4 mr-2" />
                {t.manager.createDriver}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t.manager.createDriver}</DialogTitle>
              </DialogHeader>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateDriver();
                }}
                className="space-y-4 pt-2"
              >
                {/* Driver Name */}
                <div className="space-y-1.5">
                  <Label>{t.manager.driverName}</Label>
                  <Input
                    placeholder="John Doe"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className={theme.form.input}
                    required
                  />
                </div>

                {/* License Number */}
                <div className="space-y-1.5">
                  <Label>{t.manager.licenseNumber}</Label>
                  <Input
                    placeholder="DL-1234567890"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className={theme.form.input}
                    required
                  />
                </div>

                {/* Assign to Vehicle */}
                <div className="space-y-1.5">
                  <Label>{t.manager.assignVehicleLabel}</Label>
                  <Select
                    value={selectedVehicleId}
                    onValueChange={setSelectedVehicleId}
                  >
                    <SelectTrigger className={theme.form.select}>
                      <SelectValue placeholder="Optional — select a vehicle" />
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

                <DialogFooter className="pt-2">
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      {t.common.cancel}
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    className={theme.button.primarySm}
                    disabled={creating || !driverName.trim() || !licenseNumber.trim()}
                  >
                    {creating ? t.common.loading : t.manager.createDriverBtn}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* ── Driver Table ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={theme.card.base}>
          <CardContent className={`${theme.table.scrollCard} overflow-x-auto`}>
            {filteredDrivers.length === 0 ? (
              <motion.div
                className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-20 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 mx-auto">
                  <Users className="w-8 h-8 text-slate-400" />
                </div>
                <p className={theme.typography.body}>{t.manager.noDrivers}</p>
              </motion.div>
            ) : (
              <>
              {/* Desktop table */}
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead><SortableHeader label="Name" sortDir={sortKey==='name'?sortDir:null} onSort={()=>handleSort('name')} /></TableHead>
                    <TableHead><SortableHeader label="Email" sortDir={sortKey==='email'?sortDir:null} onSort={()=>handleSort('email')} /></TableHead>
                    <TableHead><SortableHeader label={t.manager.licenseNumber} sortDir={sortKey==='licenseNumber'?sortDir:null} onSort={()=>handleSort('licenseNumber')} /></TableHead>
                    <TableHead><SortableHeader label={t.client.vehicle} sortDir={sortKey==='vehicle'?sortDir:null} onSort={()=>handleSort('vehicle')} /></TableHead>
                    <TableHead><SortableHeader label="Status" sortDir={sortKey==='isAvailable'?sortDir:null} onSort={()=>handleSort('isAvailable')} /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedDrivers.map((item, i) => {
                    const driver = item._original;
                    return (
                      <motion.tr
                        key={driver.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className={`border-b last:border-0 ${theme.table.zebraRow} hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors`}
                      >
                        <TableCell className="font-medium">{driver.name}</TableCell>
                        <TableCell className={theme.typography.caption}>
                          {driver.email}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {driver.driverProfile?.licenseNumber || '—'}
                        </TableCell>
                        <TableCell>
                          {driver.driverProfile?.vehicle
                            ? `${driver.driverProfile.vehicle.plateNumber} (${driver.driverProfile.vehicle.model})`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <span className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${driver.driverProfile?.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                            <span>{driver.driverProfile?.isAvailable ? 'Available' : 'On Duty'}</span>
                          </span>
                        </TableCell>
                      </motion.tr>
                    );
                  })}
                </TableBody>
              </Table>
              </div>

              {/* Mobile card list */}
              <div className="md:hidden p-4 space-y-3">
                {paginatedDrivers.map((item, i) => {
                  const driver = item._original;
                  return (
                    <motion.div
                      key={driver.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:shadow-md transition-shadow duration-200"
                    >
                      {/* Name + Status */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                          {driver.name}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${driver.driverProfile?.isAvailable ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {driver.driverProfile?.isAvailable ? 'Available' : 'On Duty'}
                          </span>
                        </span>
                      </div>
                      {/* Email */}
                      <p className={`text-xs mb-2 ${theme.typography.caption}`}>
                        {driver.email}
                      </p>
                      {/* License + Vehicle */}
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">License</span>
                          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                            {driver.driverProfile?.licenseNumber || '—'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wide shrink-0">Vehicle</span>
                          <span className="text-xs text-slate-600 dark:text-slate-400">
                            {driver.driverProfile?.vehicle
                              ? `${driver.driverProfile.vehicle.plateNumber} (${driver.driverProfile.vehicle.model})`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
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
    </>
  );
}
