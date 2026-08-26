'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Clock,
  Navigation,
  PackageCheck,
  Users,
  Building2,
  Play,
  Square,
  Package,
  FileText,
  UserPlus,
  CheckCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Minus,
  Map,
  BarChart3,
  IndianRupee,
  Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/context/NotificationContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, Vehicle, DriverWithProfile } from '@/types';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import Pagination from '@/components/shared/Pagination';
import DonutChart from '@/components/shared/DonutChart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

// ── Activity feed helpers ──────────────────────────────
const activityIconMap: Record<string, React.ElementType> = {
  SHIPMENT_CREATED: Package,
  SHIPMENT_ASSIGNED: Package,
  VEHICLE_ASSIGNED: Truck,
  REPORT_SUBMITTED: FileText,
  DRIVER_CREATED: UserPlus,
  DELIVERED: CheckCircle2,
  STATUS_UPDATE: Clock,
};

const activityBorderColor: Record<string, string> = {
  DELIVERED: '#059669',
  SHIPMENT_CREATED: '#d97706',
  SHIPMENT_ASSIGNED: '#3b82f6',
  VEHICLE_ASSIGNED: '#3b82f6',
  REPORT_SUBMITTED: '#ef4444',
  DRIVER_CREATED: '#a855f7',
  STATUS_UPDATE: '#94a3b8',
};

const activityIconColor: Record<string, string> = {
  DELIVERED: 'text-emerald-500',
  SHIPMENT_CREATED: 'text-amber-500',
  SHIPMENT_ASSIGNED: 'text-blue-500',
  VEHICLE_ASSIGNED: 'text-blue-500',
  REPORT_SUBMITTED: 'text-red-500',
  DRIVER_CREATED: 'text-purple-500',
  STATUS_UPDATE: 'text-slate-400',
};

// ── Status badge mapping ──────────────────────────────────
const statusBadgeClass: Record<string, string> = {
  REQUESTED: theme.status.requested,
  ASSIGNED: theme.status.assigned,
  IN_TRANSIT: theme.status.inTransit,
  DELIVERED: theme.status.delivered,
  CANCELLED: theme.status.cancelled,
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

  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<DriverWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [activities, setActivities] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState<any>({});
  const PAGE_SIZE = 5;

  // ── Fetch all data ─────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${authState.token}` };
      const [vehiclesRes, shipmentsRes, driversRes] = await Promise.all([
        fetch('/api/vehicles', { headers }),
        fetch('/api/shipments', { headers }),
        fetch('/api/drivers', { headers }),
      ]);

      if (!vehiclesRes.ok || !shipmentsRes.ok || !driversRes.ok) throw new Error();

      const vData = normalizePageResponse<Vehicle>(await vehiclesRes.json()).items;
      const sData = normalizePageResponse<Shipment>(await shipmentsRes.json()).items;
      const dData = normalizePageResponse<any>(await driversRes.json()).items;

      setShipments(sData);
      setVehicles(vData);
      setDrivers(dData);

      setStats({
        totalVehicles: vData.length,
        activeVehicles: vData.filter((v: Vehicle) => v.status === 'IN_USE').length,
        totalShipments: sData.length,
        activeShipments: sData.filter((s: Shipment) => s.status === 'IN_TRANSIT').length,
        totalDrivers: dData.length,
        availableDrivers: dData.filter((d: any) => d.isActive).length,
      });

      const recent = sData.slice(0, 5).map((s: Shipment) => ({
        id: s.id,
        type: s.status === 'DELIVERED' ? 'DELIVERED' : s.status === 'IN_TRANSIT' ? 'SHIPMENT_ASSIGNED' : 'SHIPMENT_CREATED',
        message: s.status === 'DELIVERED'
          ? `Delivery completed for shipment #${s.id.substring(0, 8)}`
          : s.status === 'IN_TRANSIT'
          ? `In transit: #${s.id.substring(0, 8)} (${s.originAddress} → ${s.destinationAddress})`
          : `Shipment #${s.id.substring(0, 8)} created (${s.originAddress} → ${s.destinationAddress})`,
        time: s.createdAt,
        entity: s.id.substring(0, 8),
        icon: s.status === 'DELIVERED' ? CheckCircle2 : Package,
        color: s.status === 'DELIVERED' ? 'text-emerald-500' : 'text-blue-500',
        bgColor: s.status === 'DELIVERED' ? 'bg-emerald-500/10' : 'bg-blue-500/10',
      }));
      setActivities(recent);

      // Check for pending (REQUESTED) shipments and notify
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
  }, [authState.token]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Computed stats ────────────────────────────────────
  const activeTrucks = vehicles.filter((v) => v.status === 'IN_USE').length;
  const pendingDeliveries = shipments.filter((s) => s.status === 'REQUESTED').length;
  const inTransit = shipments.filter((s) => s.status === 'IN_TRANSIT').length;
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
  const totalDrivers = drivers.length;

  // Deduplicate client IDs
  const totalClients = new Set(shipments.map((s) => s.clientId)).size;

  // Sorted shipments for table
  const sortedShipments = [...shipments]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / PAGE_SIZE));
  const paginatedShipments = sortedShipments.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // ── Simulation toggle ──────────────────────────────────
  const handleSimToggle = async (checked: boolean) => {
    try {
      const res = await fetch('/api/simulation', {
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

  // ── Trend config: icon, percentage text, icon class, text class ──
  const trendConfig = [
    { icon: TrendingUp, text: '+12%', iconCls: 'text-emerald-500', textCls: 'text-emerald-600' },
    { icon: TrendingDown, text: '-8%',  iconCls: pendingDeliveries > 0 ? 'text-red-500' : 'text-slate-400', textCls: pendingDeliveries > 0 ? 'text-red-500' : 'text-slate-500' },
    { icon: TrendingUp, text: '+5%',  iconCls: 'text-emerald-500', textCls: 'text-emerald-600' },
    { icon: deliveredToday > 0 ? TrendingUp : Minus, text: deliveredToday > 0 ? '+23%' : 'N/A', iconCls: deliveredToday > 0 ? 'text-emerald-500' : 'text-slate-400', textCls: deliveredToday > 0 ? 'text-emerald-600' : 'text-slate-500 dark:text-slate-400' },
    { icon: TrendingUp, text: '+2%',  iconCls: 'text-emerald-500', textCls: 'text-emerald-600' },
    { icon: Minus,     text: '0%',   iconCls: 'text-slate-400', textCls: 'text-slate-500 dark:text-slate-400' },
  ];

  // ── Stat cards data ───────────────────────────────────
  const statCards = [
    { label: t.manager.stats.activeTrucks, value: activeTrucks, icon: Truck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', accent: theme.statCard.emerald },
    { label: t.manager.stats.pendingDeliveries, value: pendingDeliveries, icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/50', accent: theme.statCard.amber },
    { label: t.manager.stats.inTransit, value: inTransit, icon: Navigation, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50', accent: theme.statCard.blue },
    { label: t.manager.stats.deliveredToday, value: deliveredToday, icon: PackageCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/50', accent: theme.statCard.emerald },
    { label: t.manager.stats.totalDrivers, value: totalDrivers, icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/50', accent: theme.statCard.purple },
    { label: t.manager.stats.totalClients, value: totalClients, icon: Building2, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/50', accent: theme.statCard.rose },
  ];

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-[300px] rounded-xl" />
      </div>
    );
  }

  return (
    <>
      {/* ── Stat cards grid (1/2/3 cols) ────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          const isDeliveredTodayZero = i === 3 && deliveredToday === 0;
          return (
            <motion.div
              key={stat.label}
              className="h-full"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <motion.div
                whileHover={{ y: -4, boxShadow: '0 10px 30px -5px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                <Card className={`h-full bg-gradient-to-br from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950/50 ${theme.card.base} ${stat.accent} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300`}>
                  <CardContent className="p-5 flex flex-col h-full relative overflow-hidden">
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl ${stat.bg} flex items-center justify-center shrink-0 shadow-sm border border-white/20 dark:border-white/5`}>
                        <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${stat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">{stat.label}</p>
                        {isDeliveredTodayZero ? (
                          <div className="flex items-baseline gap-2 mt-1">
                            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{stat.value}</p>
                            <p className="text-sm font-medium text-slate-400">No deliveries yet</p>
                          </div>
                        ) : (
                          <p className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">{stat.value}</p>
                        )}
                        
                        <div className="flex items-center gap-1.5 mt-2">
                          {(() => {
                            const TrendIcon = trendConfig[i].icon;
                            return <TrendIcon className={`w-4 h-4 ${trendConfig[i].iconCls}`} />;
                          })()}
                          <span className={`text-sm font-semibold ${trendConfig[i].textCls}`}>{trendConfig[i].text}</span>
                        </div>
                      </div>
                    </div>
                    {/* Decorative blurred blob for premium feel */}
                    <div className={`absolute -bottom-6 -right-6 w-32 h-32 ${stat.bg} rounded-full blur-3xl opacity-40 pointer-events-none`} />
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Quick Actions ────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8"
      >
        <Card className={theme.card.base}>
          <CardHeader>
            <CardTitle className={theme.typography.h5}>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 max-w-4xl">
              {[
                { icon: Package, label: 'New Shipment', path: '/manager/shipments' },
                { icon: UserPlus, label: 'Add Driver', path: '/manager/drivers' },
                { icon: Map, label: 'View Fleet', path: '/manager/fleet' },
                { icon: FileText, label: 'All Shipments', path: '/manager/shipments' },
              ].map((action) => {
                const ActionIcon = action.icon;
                return (
                  <div
                    key={action.label}
                    onClick={() => {
                      if (action.path) {
                        navigate(action.path);
                      }
                    }}
                    className="group flex flex-col items-center gap-2 p-3 sm:p-4 rounded-xl border border-transparent hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:shadow-md hover:shadow-emerald-100 dark:hover:shadow-emerald-950/20 hover:-translate-y-0.5 hover:border-emerald-200 dark:hover:border-emerald-800 transition-all duration-200 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800 flex items-center justify-center transition-colors duration-200">
                      <ActionIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{action.label}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Shipment Status Donut Chart ────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <Card className={theme.card.base}>
          <CardHeader>
            <CardTitle className={theme.typography.h5}>
              Shipment Status Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart
              data={[
                { label: 'Requested', value: shipments.filter((s) => s.status === 'REQUESTED').length, color: '#f59e0b' },
                { label: 'Assigned', value: shipments.filter((s) => s.status === 'ASSIGNED').length, color: '#3b82f6' },
                { label: 'In Transit', value: shipments.filter((s) => s.status === 'IN_TRANSIT').length, color: '#10b981' },
                { label: 'Delivered', value: shipments.filter((s) => s.status === 'DELIVERED').length, color: '#64748b' },
                { label: 'Cancelled', value: shipments.filter((s) => s.status === 'CANCELLED').length, color: '#ef4444' },
              ]}
              centerLabel="Shipments"
              centerValue={String(shipments.length)}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Simulation Toggle ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <Card className={`${simulating ? 'border-2 border-emerald-400 animate-pulse' : 'border border-slate-200'} ${theme.card.base}`}>
          <CardContent className={theme.card.padding}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    simulating ? 'bg-emerald-100' : 'bg-slate-100'
                  }`}
                >
                  {simulating ? (
                    <Square className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Play className="w-5 h-5 text-slate-500" />
                  )}
                </div>
                <div>
                  <p className={theme.typography.label}>
                    {simulating ? t.manager.simulation.active : t.manager.simulation.inactive}
                  </p>
                  <p className={theme.typography.caption}>
                    {simulating ? t.manager.simulation.stop : t.manager.simulation.start}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="sim-toggle"
                  checked={simulating}
                  onCheckedChange={handleSimToggle}
                />
                <Label htmlFor="sim-toggle" className="cursor-pointer font-medium py-1">
                  {simulating ? (
                    <span className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {t.manager.simulation.stop}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Play className="w-4 h-4" />
                      {t.manager.simulation.start}
                    </span>
                  )}
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Recent Shipments ─────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <Card className={theme.card.base}>
          <CardHeader>
            <CardTitle className={theme.typography.h5}>
              {t.manager.shipmentsTitle}
            </CardTitle>
            <CardDescription>{t.manager.shipmentsSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className={theme.table.scrollCard}>
            {sortedShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3 shadow-sm border border-slate-200/50 dark:border-slate-700">
                  <PackageCheck className="w-6 h-6 text-slate-400" />
                </div>
                <h3 className="text-base font-medium text-slate-900 dark:text-white mb-1">No Recent Shipments</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.manager.noShipments}</p>
              </div>
            ) : (
              <>
              {/* Desktop table view */}
              <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.client.shipmentId}</TableHead>
                    <TableHead>{t.client.origin}</TableHead>
                    <TableHead>{t.client.destination}</TableHead>
                    <TableHead>{t.client.status}</TableHead>
                    <TableHead>{t.client.createdAt}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedShipments.map((shipment, i) => (
                    <motion.tr
                      key={shipment.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`border-b last:border-0 ${theme.table.zebraRow}`}
                    >
                      <TableCell className="font-mono text-sm">
                        {shipment.id.length > 8
                          ? `${shipment.id.slice(0, 8)}...`
                          : shipment.id}
                      </TableCell>
                      <TableCell>{shipment.originAddress}</TableCell>
                      <TableCell>{shipment.destinationAddress}</TableCell>
                      <TableCell>
                        <Badge
                          className={`${theme.status.badge} ${
                            statusBadgeClass[shipment.status] || theme.status.delivered
                          }`}
                        >
                          {formatStatus(shipment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className={theme.typography.caption}>
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
              </div>
              {/* Mobile card view */}
              <div className="md:hidden space-y-3 p-4">
                {paginatedShipments.map((shipment, i) => (
                  <motion.div
                    key={shipment.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm text-slate-900 dark:text-slate-100 truncate max-w-[60%]">
                        {shipment.id.length > 12 ? `${shipment.id.slice(0, 12)}…` : shipment.id}
                      </span>
                      <Badge
                        className={`${theme.status.badge} ${
                          statusBadgeClass[shipment.status] || theme.status.delivered
                        }`}
                      >
                        {formatStatus(shipment.status)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
                      <span className="truncate">{shipment.originAddress}</span>
                      <Navigation className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{shipment.destinationAddress}</span>
                    </div>
                    <p className={theme.typography.caption}>
                      {new Date(shipment.createdAt).toLocaleDateString()}
                    </p>
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

      {/* ── Recent Activity ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <Card className={theme.card.base}>
          <CardHeader>
            <CardTitle className={theme.typography.h5}>
              {t.activity.title}
            </CardTitle>
            <CardDescription>{t.activity.subtitle}</CardDescription>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Inbox className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity</p>
              </div>
            ) : (
              <div className="space-y-0">
                {activities.map((act, i) => {
                  const Icon = activityIconMap[act.type] || Clock;
                  const borderColor = activityBorderColor[act.type] || '#94a3b8';
                  const iconColor = activityIconColor[act.type] || 'text-slate-400';
                  return (
                    <motion.div
                      key={act.id}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.45 + i * 0.06 }}
                      className={`flex items-start gap-3 py-3 pl-4 rounded-r-lg last:pb-0`}
                      style={{ borderLeft: `4px solid ${borderColor}` }}
                    >
                      <div className="mt-0.5">
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={theme.typography.label}>{act.message}</p>
                        <p className={theme.typography.caption}>{timeAgo(act.time)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
      {/* ── Fleet Analytics ──────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className={theme.typography.h5}>Fleet Analytics</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(() => {
            const deliveredCount = shipments.filter((s) => s.status === 'DELIVERED').length;
            const utilizationPct = vehicles.length > 0 ? Math.round((activeTrucks / vehicles.length) * 100) : 0;
            const onTimeRate = shipments.length > 0 ? `${Math.min(100, Math.round((deliveredCount / Math.max(1, shipments.length)) * 100))}%` : '100%';
            return [
              { label: 'Avg Delivery Time', value: '2.4 days', icon: Clock, iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Delivery Completion Rate', value: onTimeRate, icon: TrendingUp, iconBg: 'bg-emerald-100 dark:bg-emerald-900/50', iconColor: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Fleet Utilization', value: `${utilizationPct}%`, icon: Truck, iconBg: 'bg-amber-100 dark:bg-amber-900/50', iconColor: 'text-amber-600 dark:text-amber-400' },
              { label: 'Cost per Delivery', value: '₹2,450', icon: IndianRupee, iconBg: 'bg-slate-100 dark:bg-slate-800', iconColor: 'text-slate-600 dark:text-slate-400' },
            ];
          })().map((metric) => {
            const MetricIcon = metric.icon;
            return (
              <div
                key={metric.label}
                className={`${theme.card.base} ${theme.card.padding} hover:shadow-md transition-shadow duration-200 cursor-default`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-full ${metric.iconBg} flex items-center justify-center shrink-0`}>
                    <MetricIcon className={`w-5 h-5 ${metric.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</p>
                    <p className="text-sm text-slate-500">{metric.label}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}
