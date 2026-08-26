'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  MapPin,
  Navigation,
  Weight,
  Clock,
  FileText,
  Package,
  Route,
  Gauge,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse, ApiContractError } from '@/lib/utils';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, Vehicle, DriverWithProfile, ShipmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

// ── Status badge mapping ──────────────────────────────────
const statusBadgeClass: Record<ShipmentStatus, string> = {
  REQUESTED: theme.status.requested,
  ASSIGNED: theme.status.assigned,
  IN_TRANSIT: theme.status.inTransit,
  DELIVERED: theme.status.delivered,
  CANCELLED: theme.status.cancelled,
};

function formatStatus(status: ShipmentStatus): string {
  return t.client.milestones[status] || status;
}

// ── Distance/duration from REAL database coordinates (no geo guessing) ──
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const roadFactor = 1.25; // Driving route adjustment factor
  return Math.round(R * c * roadFactor);
}

function calculateDistance(
  oLat?: number | null, oLng?: number | null,
  dLat?: number | null, dLng?: number | null
): string {
  if (oLat == null || oLng == null || dLat == null || dLng == null) return '—';
  const km = haversineKm(oLat, oLng, dLat, dLng);
  return km > 0 ? `${km} km` : '—';
}

function calculateDuration(
  oLat?: number | null, oLng?: number | null,
  dLat?: number | null, dLng?: number | null,
  eta?: string | null
): string {
  if (eta) {
    const diffMs = new Date(eta).getTime() - Date.now();
    if (diffMs > 0) {
      const totalMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }
  }
  if (oLat == null || oLng == null || dLat == null || dLng == null) return '—';
  const km = haversineKm(oLat, oLng, dLat, dLng);
  const avgSpeedKmH = 50; // Average commercial truck transit speed
  const totalMinutes = Math.round((km / avgSpeedKmH) * 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return `${Math.max(1, hours)}h ${mins > 0 ? `${mins}m` : ''}`.trim();
}

export default function DriverDashboard() {
  const { state: authState } = useAuth();
  const { navigate } = useRouter();

  const [driverProfile, setDriverProfile] = useState<DriverWithProfile | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch driver profile, vehicles, and shipments ──────
  useEffect(() => {
    if (!authState.token) return;
    (async () => {
      try {
        const headers = { Authorization: `Bearer ${authState.token}` };

        // Fetch driver profile
        const driversRes = await fetch('/api/drivers', { headers });
        if (!driversRes.ok) throw new Error('Failed to fetch drivers');
        const rawDrivers = await driversRes.json();
        const driversData: DriverWithProfile[] = normalizePageResponse<DriverWithProfile>(rawDrivers).items;
        const myUserId = authState.user?.userId || (authState.user as any)?.id;
        const me = driversData.find((d: any) => d.id === myUserId || d.userId === myUserId || d.driverProfile?.userId === myUserId);
        setDriverProfile(me || null);

        // Fetch all vehicles and shipments
        const [vehiclesRes, shipmentsRes] = await Promise.all([
          fetch('/api/vehicles', { headers }),
          fetch('/api/shipments?clientId=all', { headers }),
        ]);

        if (!vehiclesRes.ok || !shipmentsRes.ok) {
          throw new Error('HTTP Error during fetch');
        }

        const rawVehicles = await vehiclesRes.json();
        const rawShipments = await shipmentsRes.json();

        const vPage = normalizePageResponse<Vehicle>(rawVehicles);
        const sPage = normalizePageResponse<Shipment>(rawShipments);

        const vehiclesData = vPage.items;
        const shipmentsData = sPage.items;

        // Find assignment: driver profile has vehicleId
        const assignedVehicleId = me?.driverProfile?.vehicleId;
        if (assignedVehicleId) {
          const assignedVehicle = vehiclesData.find((v) => v.id === assignedVehicleId);
          setVehicle(assignedVehicle || null);

          // Find active shipment for this vehicle (assigned or in transit)
          const activeShipment = shipmentsData.find(
            (s) =>
              s.vehicleId === assignedVehicleId &&
              (s.status === 'ASSIGNED' || s.status === 'IN_TRANSIT')
          );
          setShipment(activeShipment || null);
        }
      } catch {
        toast.error(t.common.error);
      } finally {
        setLoading(false);
      }
    })();
  }, [authState.token, authState.user?.userId, (authState.user as any)?.id]);

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const hasAssignment = vehicle && shipment;

  return (
    <>
      {!hasAssignment ? (
        /* ── Empty state ──────────────────────────────── */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-center py-16 sm:py-20 px-4 sm:px-6 shadow-sm">
            <div className="relative z-10">
            {/* Animated truck illustration */}
            <div className="relative mx-auto w-24 h-24 mb-6">
              <motion.div
                className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center"
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Truck className="w-12 h-12 text-emerald-500" />
              </motion.div>
            </div>
            <h3 className={`${theme.typography.h5} text-slate-700 dark:text-slate-300`}>
              {t.driver.noAssignment}
            </h3>
            <p className={`${theme.typography.caption} mt-2 max-w-xs sm:max-w-sm mx-auto text-slate-500`}>
              {t.driver.noAssignmentHint}
            </p>
            </div>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-6">
      {/* ── Assignment Summary Stats ──────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <Card className={theme.card.base}>
              <CardHeader>
                <CardTitle className={theme.typography.h5}>
                  {t.driver.summaryStats}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center p-4 rounded-xl border border-blue-100 dark:border-blue-800/50 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 dark:bg-none"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-2">
                      <Route className="w-5 h-5 text-blue-600" />
                    </div>
                    <p className={theme.typography.caption}>{t.driver.distance}</p>
                    <p className={theme.typography.statValue}>{calculateDistance(shipment!.originLat, shipment!.originLng, shipment!.destinationLat, shipment!.destinationLng)}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 }}
                    className="text-center p-4 rounded-xl border border-amber-100 dark:border-amber-800/50 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30 dark:bg-none"
                  >
                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center mx-auto mb-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                    <p className={theme.typography.caption}>{t.driver.estimatedDuration}</p>
                    <p className={theme.typography.statValue}>{calculateDuration(shipment!.originLat, shipment!.originLng, shipment!.destinationLat, shipment!.destinationLng, shipment!.eta)}</p>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 dark:bg-none"
                  >
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                      <Gauge className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className={theme.typography.caption}>{t.driver.cargoWeight}</p>
                    <p className={theme.typography.statValue}>{shipment!.weight ? `${shipment!.weight} kg` : '—'}</p>
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Vehicle Card ─────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className={theme.card.base} style={{ borderLeft: '4px solid #047857' }}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <CardTitle className={theme.typography.h5}>
                    {t.driver.vehicle}
                  </CardTitle>
                </div>
                <CardDescription>
                  {vehicle!.type} &middot; {vehicle!.model}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <DetailRow
                    icon={Truck}
                    label={t.client.vehicle}
                    value={vehicle!.plateNumber}
                  />
                  <DetailRow
                    icon={Package}
                    label="Type"
                    value={vehicle!.type}
                  />
                  <DetailRow
                    icon={Clock}
                    label={t.driver.estimatedTime}
                    value={
                      shipment!.eta
                        ? new Date(shipment!.eta).toLocaleString()
                        : '—'
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Shipment Card ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={theme.card.base} style={{ borderLeft: '4px solid #047857' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-emerald-600" />
                    <CardTitle className={theme.typography.h5}>
                      {t.driver.shipment}
                    </CardTitle>
                  </div>
                  <Badge
                    className={`${theme.status.badge} ${statusBadgeClass[shipment!.status]}`}
                  >
                    {formatStatus(shipment!.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <DetailRow
                    icon={MapPin}
                    label={t.driver.origin}
                    value={shipment!.originAddress}
                  />
                  <DetailRow
                    icon={Navigation}
                    label={t.driver.destination}
                    value={shipment!.destinationAddress}
                  />
                  <DetailRow
                    icon={Weight}
                    label={t.client.weight}
                    value={shipment!.weight ? `${shipment!.weight} kg` : '—'}
                  />
                  <DetailRow
                    icon={Clock}
                    label={t.client.eta}
                    value={
                      shipment!.eta
                        ? new Date(shipment!.eta).toLocaleString()
                        : '—'
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Action Buttons ───────────────────────── */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              className={theme.button.primary}
              onClick={() => navigate('/driver/route')}
            >
              <MapPin className="w-4 h-4 mr-2" />
              {t.nav.dashboard} &rarr; Route
            </Button>
            <Button
              className={theme.button.outline}
              onClick={() => navigate('/driver/report')}
            >
              <FileText className="w-4 h-4 mr-2" />
              {t.driver.submitReport}
            </Button>
          </motion.div>
        </div>
      )}
    </>
  );
}

// ── Detail row helper ─────────────────────────────────────
function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
      </div>
      <div>
        <p className={theme.typography.caption}>{label}</p>
        <p className={theme.typography.label}>{value}</p>
      </div>
    </div>
  );
}
