'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Clock,
  Navigation,
  PackageCheck,
  Package,
  FileText,
  UserPlus,
  CheckCircle2,
  MapPin,
  ChevronRight,
  Activity,
  User,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizePageResponse } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import type { Shipment, Vehicle, DriverWithProfile } from '@/types';
import { useStore } from '@/store/useStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import DonutChart from '@/components/shared/DonutChart';

const activityIconMap: Record<string, React.ElementType> = {
  SHIPMENT_CREATED: Package,
  SHIPMENT_ASSIGNED: Package,
  VEHICLE_ASSIGNED: Truck,
  REPORT_SUBMITTED: FileText,
  DRIVER_CREATED: UserPlus,
  DELIVERED: CheckCircle2,
  STATUS_UPDATE: Clock,
};

const activityIconColor: Record<string, string> = {
  DELIVERED: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10',
  SHIPMENT_CREATED: 'text-amber-500 bg-amber-50 dark:bg-amber-500/10',
  SHIPMENT_ASSIGNED: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  VEHICLE_ASSIGNED: 'text-blue-500 bg-blue-50 dark:bg-blue-500/10',
  REPORT_SUBMITTED: 'text-red-500 bg-red-50 dark:bg-red-500/10',
  DRIVER_CREATED: 'text-purple-500 bg-purple-50 dark:bg-purple-500/10',
  STATUS_UPDATE: 'text-slate-500 bg-slate-50 dark:bg-slate-500/10',
};

const statusBadgeClasses: Record<string, string> = {
  REQUESTED: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800',
  ASSIGNED: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  IN_TRANSIT: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800',
  DELIVERED: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800',
  CANCELLED: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800',
};

const statusDotClasses: Record<string, string> = {
  REQUESTED: 'bg-amber-500',
  ASSIGNED: 'bg-blue-500',
  IN_TRANSIT: 'bg-blue-500',
  DELIVERED: 'bg-emerald-500',
  CANCELLED: 'bg-red-500',
};

function formatStatus(status: string): string {
  return (t.client.milestones as Record<string, string>)[status] || status;
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return 'Just now';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  if (isNaN(then)) return 'Just now';
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ManagerDashboard() {
  const { state: authState } = useAuth();
  const { addNotification } = useNotifications();
  const { navigate } = useRouter();

  const { 
    shipments, setShipments, 
    vehicles, setVehicles, 
    drivers, setDrivers, 
    activities, setActivities 
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${authState.token}` };
      const [vehiclesRes, shipmentsRes, driversRes] = await Promise.all([
        fetchWithAuth('/api/vehicles', { headers }),
        fetchWithAuth('/api/shipments', { headers }),
        fetchWithAuth('/api/drivers', { headers }),
      ]);

      if (!vehiclesRes.ok || !shipmentsRes.ok || !driversRes.ok) throw new Error();

      const vData = normalizePageResponse<Vehicle>(await vehiclesRes.json()).items;
      const sData = normalizePageResponse<Shipment>(await shipmentsRes.json()).items;
      const dData = normalizePageResponse<any>(await driversRes.json()).items;

      setShipments(sData);
      setVehicles(vData);
      setDrivers(dData);

      const recent = sData.slice(0, 5).map((s: Shipment) => ({
        id: s.id,
        type: s.status === 'DELIVERED' ? 'DELIVERED' : s.status === 'IN_TRANSIT' ? 'SHIPMENT_ASSIGNED' : 'SHIPMENT_CREATED',
        message: s.status === 'DELIVERED'
          ? `Delivery completed for shipment #${String(s.id).substring(0, 8)}`
          : s.status === 'IN_TRANSIT'
          ? `In transit: #${String(s.id).substring(0, 8)} (${s.originAddress} → ${s.destinationAddress})`
          : `Shipment #${String(s.id).substring(0, 8)} created (${s.originAddress} → ${s.destinationAddress})`,
        time: s.createdAt,
      }));
      setActivities(recent);

      const pendingCount = sData.filter((s) => s.status === 'REQUESTED').length;
      if (pendingCount > 0) {
        addNotification({
          title: 'Pending Deliveries',
          message: `You have ${pendingCount} unassigned shipment request${pendingCount > 1 ? 's' : ''}.`,
          type: 'warning',
        });
      }
    } catch {
      toast.error(t.common.error);
    } finally {
      setLoading(false);
    }
  }, [authState.token, addNotification, setShipments, setVehicles, setDrivers, setActivities]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSimToggle = async (checked: boolean) => {
    try {
      const res = await fetchWithAuth('/api/simulation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ action: checked ? 'start' : 'stop' }),
      });
      if (!res.ok) throw new Error();
      setSimulating(checked);
      toast.success(checked ? t.manager.simulation.active : t.manager.simulation.inactive);
    } catch {
      toast.error(t.common.error);
    }
  };

  const activeTrucks = vehicles.filter((v) => v.status === 'IN_USE').length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
  const pendingDeliveries = shipments.filter((s) => s.status === 'REQUESTED').length;
  const deliveredToday = shipments.filter((s) => {
    if (s.status !== 'DELIVERED' || !s.deliveredAt) return false;
    const delivered = new Date(s.deliveredAt);
    const today = new Date();
    return (
      delivered.getDate() === today.getDate() &&
      delivered.getMonth() === today.getMonth() &&
      delivered.getFullYear() === today.getFullYear()
    );
  }).length;

  const sortedShipments = [...shipments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stats = [
    { label: 'Active Trucks', value: activeTrucks, icon: Truck, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { label: 'In Transit', value: inTransit, icon: Navigation, iconColor: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { label: 'Delivered Today', value: deliveredToday, icon: PackageCheck, iconColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50' },
    { label: 'Pending', value: pendingDeliveries, icon: Clock, iconColor: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden sm:block">
          {/* Removed redundant heading, handled by TopNav */}
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          {/* Simulation Toggle */}
          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
            <Label htmlFor="sim-toggle" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              {simulating ? 'Simulation Active' : 'Start Simulation'}
            </Label>
            <Switch id="sim-toggle" checked={simulating} onCheckedChange={handleSimToggle} />
          </div>

          {/* Quick Actions */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/manager/drivers')}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl px-5 py-2 text-sm inline-flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <UserPlus className="w-4 h-4" />
            Create Driver
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/manager/fleet')}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl px-5 py-2 text-sm inline-flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
          >
            <Truck className="w-4 h-4" />
            View Fleet Map
          </motion.button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)
        ) : (
          stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-5 flex items-start gap-4 shadow-sm"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${stat.bg}`}>
                  <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded flex w-max mt-1">Live</span>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Donut Chart */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6">Shipments by Status</h3>
            {loading ? (
              <Skeleton className="h-64 w-full rounded-xl" />
            ) : (
              <DonutChart
                data={[
                  { label: 'Requested', value: shipments.filter((s) => s.status === 'REQUESTED').length, color: '#f59e0b' },
                  { label: 'Assigned', value: shipments.filter((s) => s.status === 'ASSIGNED').length, color: '#3b82f6' },
                  { label: 'In Transit', value: shipments.filter((s) => s.status === 'IN_TRANSIT').length, color: '#10b981' },
                  { label: 'Delivered', value: shipments.filter((s) => s.status === 'DELIVERED').length, color: '#64748b' },
                  { label: 'Cancelled', value: shipments.filter((s) => s.status === 'CANCELLED').length, color: '#ef4444' },
                ]}
                centerLabel="Total"
                centerValue={String(shipments.length)}
              />
            )}
          </div>

          {/* Recent Shipments Table */}
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Shipments</h3>
              <button
                onClick={() => navigate('/manager/shipments')}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {loading ? (
              <div className="p-5 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : sortedShipments.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-500">No recent shipments</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Route</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedShipments.map((shipment) => (
                      <tr
                        key={shipment.id}
                        onClick={() => navigate('/manager/shipments')}
                        className="border-b border-slate-200 dark:border-slate-800 last:border-0 even:bg-slate-50/50 dark:even:bg-slate-800/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                      >
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono text-sm font-medium text-slate-900 dark:text-slate-100">{String(shipment.id).slice(0, 8)}</span>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className="flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-400">
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[150px]" title={shipment.originAddress}>{shipment.originAddress}</span></div>
                            <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /><span className="truncate max-w-[150px]" title={shipment.destinationAddress}>{shipment.destinationAddress}</span></div>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium gap-1.5 border ${statusBadgeClasses[shipment.status] || statusBadgeClasses.REQUESTED}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusDotClasses[shipment.status] || 'bg-slate-500'}`} />
                            {formatStatus(shipment.status)}
                          </div>
                        </td>
                        <td className="px-4 py-3 align-top">
                          {shipment.driverId ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                <User className="w-3.5 h-3.5" />
                              </div>
                              <span className="text-sm text-slate-700 dark:text-slate-300">Driver Assigned</span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400 italic">Unassigned</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-6 shadow-sm flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> Activity Feed
              </h3>
            </div>
            
            {loading ? (
              <div className="space-y-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <AlertCircle className="w-10 h-10 text-slate-300 dark:text-slate-700 mb-3" />
                <p className="text-slate-500">No recent activity</p>
              </div>
            ) : (
              <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
                {activities.map((act) => {
                  const Icon = activityIconMap[act.type] || Clock;
                  const iconStyle = activityIconColor[act.type] || activityIconColor.STATUS_UPDATE;
                  return (
                    <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white dark:border-slate-900 z-10 shrink-0 shadow-sm ${iconStyle} md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shadow-sm">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{act.message}</p>
                        <time className="text-xs text-slate-500 flex items-center gap-1 mt-1.5"><Calendar className="w-3 h-3" /> {timeAgo(act.time)}</time>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
