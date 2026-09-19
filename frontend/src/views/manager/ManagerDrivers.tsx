'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Eye, EyeOff, UserCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import t from '@/locales/en.json';
import type { DriverWithProfile, Vehicle } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import Pagination from '@/components/shared/Pagination';

export default function ManagerDrivers() {
  const { state: authState } = useAuth();
  const { drivers, setDrivers, vehicles } = useStore();
  const [loading, setLoading] = useState(true);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [driverName, setDriverName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [vehicleComboboxOpen, setVehicleComboboxOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 9;
  const [searchQuery, setSearchQuery] = useState('');

  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/drivers', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const rawData = await res.json();
      const pageData = normalizePageResponse<any>(rawData);
      const mappedDrivers = pageData.items.map((d: any) => ({
        id: String(d.userId),
        name: d.userName || 'Unknown Driver',
        email: d.email || '',
        role: 'DRIVER',
        driverProfile: {
          id: String(d.id),
          licenseNumber: d.licenseNumber,
          vehicleId: d.vehicleId ? String(d.vehicleId) : null,
          isAvailable: d.isAvailable,
          vehicle: d.vehicleId && vehicles.length > 0 ? vehicles.find(v => v.id === String(d.vehicleId)) || null : null
        }
      }));
      setDrivers(mappedDrivers);
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

  const fetchAvailableVehicles = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/vehicles', {
        headers: { Authorization: `Bearer ${authState.token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const vehiclesArray: Vehicle[] = Array.isArray(data) ? data : (data.content || []);
      setAvailableVehicles(vehiclesArray.filter((v) => v.status === 'AVAILABLE'));
    } catch {
      toast.error(t.common.error);
    }
  }, [authState.token]);

  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  const handleCreateDriver = async () => {
    if (!driverName.trim() || !licenseNumber.trim() || !email.trim() || !phoneNumber.trim()) return;
    setCreating(true);
    try {
      const body: Record<string, string | null> = {
        name: driverName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        licenseNumber: licenseNumber.trim(),
        vehicleId: selectedVehicleId || null,
      };
      const res = await fetchWithAuth('/api/auth/invite-driver', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.message || 'Failed to create driver');
      }
      toast.success(t.manager.driverCreated || 'Driver provisioned successfully. Verification link deployed.');
      setCreateDialogOpen(false);
      setDriverName('');
      setEmail('');
      setPhoneNumber('');
      setLicenseNumber('');
      setSelectedVehicleId('');
      fetchDrivers();
    } catch (err: any) {
      toast.error(err.message || t.common.error);
    } finally {
      setCreating(false);
    }
  };

  const filteredDrivers = drivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.email.toLowerCase().includes(q) ||
      (d.driverProfile?.licenseNumber ?? '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredDrivers.length / PAGE_SIZE));
  const paginatedDrivers = filteredDrivers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalDrivers = drivers.length;
  const availableCount = drivers.filter(d => d.driverProfile?.isAvailable).length;
  const unavailableCount = totalDrivers - availableCount;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const generatedEmail = driverName.trim().toLowerCase().replace(/\s+/g, '.') + '@fleetvane.com';

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          {/* Removed redundant heading, handled by TopNav */}
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage fleet drivers and assignments.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search drivers..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-9 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl h-10"
            />
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5 h-10 text-sm inline-flex items-center gap-2 shrink-0"
                onClick={fetchAvailableVehicles}
              >
                <Plus className="w-4 h-4" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-2xl p-6">
              <DialogHeader>
                <DialogTitle className="text-xl">Add New Driver</DialogTitle>
              </DialogHeader>

              <form onSubmit={(e) => { e.preventDefault(); handleCreateDriver(); }} className="space-y-4 pt-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Corporate / Personal Email</Label>
                  <Input
                    placeholder="driver@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Mobile Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="+1 234 567 8900"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>License Number <span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="DL-1234567890"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    className="rounded-xl border-slate-200 dark:border-slate-700 uppercase"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Assign Vehicle</Label>
                  <Popover open={vehicleComboboxOpen} onOpenChange={setVehicleComboboxOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={vehicleComboboxOpen}
                        className="w-full justify-between font-normal rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      >
                        {selectedVehicleId
                          ? (() => {
                              const v = availableVehicles.find((vehicle) => vehicle.id === selectedVehicleId);
                              return v ? `${v.plateNumber} — ${v.model}` : 'Select a vehicle...';
                            })()
                          : "Optional — select a vehicle"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl" align="start" style={{ zIndex: 100 }}>
                      <Command>
                        <CommandInput placeholder="Search vehicle by plate or model..." className="border-none focus:ring-0" />
                        <CommandList className="max-h-[200px] overflow-y-auto">
                          <CommandEmpty>No vehicle found.</CommandEmpty>
                          <CommandGroup>
                            {availableVehicles.map((v) => (
                              <CommandItem
                                key={v.id}
                                value={`${v.plateNumber} ${v.model}`}
                                onSelect={() => {
                                  setSelectedVehicleId(v.id === selectedVehicleId ? "" : v.id);
                                  setVehicleComboboxOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedVehicleId === v.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {v.plateNumber} — {v.model}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <DialogFooter className="pt-4">
                  <DialogClose asChild>
                    <Button type="button" variant="outline" className="rounded-xl">Cancel</Button>
                  </DialogClose>
                  <Button type="submit" className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" disabled={creating || !driverName.trim() || !licenseNumber.trim()}>
                    {creating ? 'Creating...' : 'Create Driver'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Drivers', value: totalDrivers, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
          { label: 'Available', value: availableCount, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Unavailable', value: unavailableCount, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-900/30' },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between shadow-sm">
            <span className="text-sm font-medium text-slate-500">{stat.label}</span>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${stat.bg} ${stat.color}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Driver Cards Grid */}
      {filteredDrivers.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 py-16 text-center max-w-2xl mx-auto my-6">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center mb-4 mx-auto border border-slate-100 dark:border-slate-700">
            <Users className="w-7 h-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Drivers Found</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">There are no drivers matching your search.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedDrivers.map((driver, i) => (
              <motion.div
                key={driver.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 hover:shadow-md transition-shadow cursor-pointer flex flex-col"
              >
                {/* Top: Avatar, Name, Email */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-lg shrink-0 border border-blue-200 dark:border-blue-800">
                    {(driver.name || "D").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{driver.name || "Unknown Driver"}</h3>
                    <p className="text-sm text-slate-500 truncate">{driver.email}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Are you sure you want to delete this driver?')) {
                        fetchWithAuth(`/api/drivers/${driver.id}`, { method: 'DELETE' })
                          .then((res) => {
                            if (!res.ok) throw new Error();
                            setDrivers(drivers.filter(d => d.id !== driver.id));
                            toast.success('Driver deleted');
                          })
                          .catch(() => toast.error('Cannot delete driver. They may be assigned to active shipments.'));
                      }
                    }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                    title="Delete Driver"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Middle: License & Vehicle */}
                <div className="flex flex-col gap-2 mb-6">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full font-mono text-[10px] px-2 py-0.5 border border-slate-200 dark:border-slate-700">
                      {driver.driverProfile?.licenseNumber || 'NO LICENSE'}
                    </Badge>
                  </div>
                  <div className="text-sm">
                    {driver.driverProfile?.vehicle ? (
                      <span className="text-slate-700 dark:text-slate-300 font-medium flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500" />
                        {driver.driverProfile.vehicle.plateNumber} <span className="text-slate-400 font-normal">({driver.driverProfile.vehicle.model})</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">No vehicle assigned</span>
                    )}
                  </div>
                </div>

                {/* Bottom: Availability Toggle */}
                <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${driver.driverProfile?.isAvailable ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className={`text-sm font-medium ${driver.driverProfile?.isAvailable ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500'}`}>
                      {driver.driverProfile?.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                  <Switch 
                    checked={driver.driverProfile?.isAvailable ?? false} 
                    disabled 
                    title="Driver sets availability via their portal"
                  />
                </div>
              </motion.div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-8">
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
