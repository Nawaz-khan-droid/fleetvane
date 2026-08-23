'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Truck,
  User,
  Package,
  Calendar,
  Weight,
  Navigation,
  Check,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import type { Shipment, ShipmentStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { Skeleton } from '@/components/ui/skeleton';

// ── Milestone State Machine ───────────────────────────────
const MILESTONES: { key: ShipmentStatus; label: string }[] = [
  { key: 'REQUESTED', label: t.client.milestones.REQUESTED },
  { key: 'ASSIGNED', label: t.client.milestones.ASSIGNED },
  { key: 'IN_TRANSIT', label: t.client.milestones.IN_TRANSIT },
  { key: 'DELIVERED', label: t.client.milestones.DELIVERED },
];

function getStepIndex(status: ShipmentStatus): number {
  if (status === 'CANCELLED') return 0;
  const idx = MILESTONES.findIndex((m) => m.key === status);
  return idx === -1 ? 0 : idx;
}

function getProgressPercent(status: ShipmentStatus): number {
  if (status === 'CANCELLED') return 0;
  return (getStepIndex(status) / (MILESTONES.length - 1)) * 100;
}

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

export default function ClientTrackPage() {
  const { state: authState } = useAuth();
  const { params, navigate } = useRouter();

  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);

  const shipmentId = params.id;
  const status = shipment?.status || 'REQUESTED';
  const isCancelled = status === 'CANCELLED';

  // ── Fetch shipment ─────────────────────────────────────
  useEffect(() => {
    if (!shipmentId) {
      setLoading(false);
      setShipment(null);
      return;
    }
    setLoading(true);
    setSearchError(null);
    (async () => {
      try {
        const res = await fetch(`/api/shipments/${shipmentId}`, {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (!res.ok) {
          setShipment(null);
          setSearchError('Shipment not found. Please check the ID.');
          return;
        }
        const data = await res.json();
        setShipment(data);
      } catch {
        toast.error(t.common.error);
        setSearchError('Failed to fetch shipment details.');
      } finally {
        setLoading(false);
      }
    })();
  }, [shipmentId, authState.token]);

  // ── Load Leaflet CSS ───────────────────────────────────
  useEffect(() => {
    if (status !== 'IN_TRANSIT') return;
    const linkId = 'leaflet-css';
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
  }, [status]);

  // ── Initialize map ─────────────────────────────────────
  useEffect(() => {
    if (status !== 'IN_TRANSIT' || !showMap) return;
    let map: any;
    let isCancelled = false;

    const vehicleLat = shipment?.vehicle?.lat ?? 19.076;
    const vehicleLng = shipment?.vehicle?.lng ?? 72.8777;

    (async () => {
      const L = (await import('leaflet')).default;
      if (isCancelled) return;
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:
          'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      // Small delay to allow Dialog animation to render the container
      await new Promise((r) => setTimeout(r, 150));
      if (isCancelled) return;
      const container = document.getElementById('track-map');
      if (!container) return;
      if ((container as any)._leaflet_id) {
        delete (container as any)._leaflet_id;
        container.innerHTML = '';
      }
      map = L.map(container).setView([vehicleLat, vehicleLng], 10);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
      }).addTo(map);
      L.marker([vehicleLat, vehicleLng])
        .addTo(map)
        .bindPopup('Vehicle Location');
    })();

    return () => {
      isCancelled = true;
      if (map) {
        map.remove();
      }
    };
  }, [status, showMap, shipment?.vehicle?.lat, shipment?.vehicle?.lng]);

  // ── Progress calculation ───────────────────────────────
  const currentStep = getStepIndex(status);
  const progressPercent = getProgressPercent(status);

  // ── Handle search ──────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;
    navigate('/client/track', { id: searchId.trim() });
  };

  // ── Loading state ──────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // ── Empty / Search State ───────────────────────────────
  if (!shipment) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/client/dashboard')}
              className={theme.button.ghost}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              {t.common.back}
            </Button>
          </div>

          <Card className={`${theme.card.base} p-6 sm:p-8 text-center`}>
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-4 border border-emerald-200 dark:border-emerald-800">
              <Package className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Track Your Shipment
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
              Enter your shipment ID or tracking number to view real-time transit status, route details, and live vehicle location.
            </p>

            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="e.g. SH-0012 or UUID..."
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="pl-9"
                  autoFocus
                />
              </div>
              <Button type="submit" className={theme.button.primary} disabled={!searchId.trim()}>
                Track
              </Button>
            </form>

            {searchError && (
              <p className="text-sm text-red-500 mt-4">{searchError}</p>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/client/dashboard')}
                className="text-xs"
              >
                View all my shipments on dashboard
              </Button>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      {/* Back button */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Button
          variant="ghost"
          onClick={() => navigate('/client/dashboard')}
          className={theme.button.ghost}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.common.back}
        </Button>
      </motion.div>

      {/* Milestone bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className={`${theme.card.base} ${theme.card.paddingLg} mb-8`}>
          {isCancelled ? (
            <div className="text-center py-4">
              <Badge
                className={`${theme.status.badge} ${statusBadgeClass.CANCELLED}`}
              >
                {t.client.milestones.CANCELLED}
              </Badge>
            </div>
          ) : (
            <div className={`${theme.milestone.track} overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0`}>
              {/* Background line */}
              <div className={`${theme.milestone.line} min-w-[280px]`} />
              {/* Progress line */}
              <div
                className={`${theme.milestone.lineProgress} min-w-[280px]`}
                style={{ width: `${progressPercent}%` }}
              />

              {MILESTONES.map((milestone, i) => {
                const completed = i < currentStep;
                const active = i === currentStep;
                return (
                  <div key={milestone.key} className={`${theme.milestone.step} min-w-[70px]`}>
                    <div
                      className={`${
                        theme.milestone.circle
                      } ${
                        completed
                          ? theme.milestone.circleComplete
                          : active
                          ? theme.milestone.circleActive
                          : theme.milestone.circlePending
                      }`}
                    >
                      {completed && <Check className="w-4 h-4" />}
                      {active && !completed && (
                        <span className="text-xs font-bold">{i + 1}</span>
                      )}
                      {!active && !completed && (
                        <span className="text-xs">{i + 1}</span>
                      )}
                    </div>
                    <p
                      className={`${
                        theme.milestone.label
                      } ${
                        active || completed
                          ? theme.milestone.labelActive
                          : theme.milestone.labelPending
                      }`}
                    >
                      {milestone.label}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Shipment details + Track Live */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details card (full width on mobile, 2-col on lg) */}
        <motion.div
          className="lg:col-span-2"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className={theme.card.base}>
            <CardHeader>
              <CardTitle className={theme.typography.h5}>
                {t.client.shipmentId}: {shipment.id.slice(0, 12)}...
              </CardTitle>
              <CardDescription>
                <Badge
                  className={`${theme.status.badge} ${statusBadgeClass[shipment.status]}`}
                >
                  {formatStatus(shipment.status)}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <DetailRow
                  icon={MapPin}
                  label={t.client.origin}
                  value={shipment.origin}
                />
                <DetailRow
                  icon={Navigation}
                  label={t.client.destination}
                  value={shipment.destination}
                />
                <DetailRow
                  icon={Weight}
                  label={t.client.weight}
                  value={shipment.weight ? `${shipment.weight} kg` : '—'}
                />
                <DetailRow
                  icon={Calendar}
                  label={t.client.eta}
                  value={
                    shipment.eta
                      ? new Date(shipment.eta).toLocaleString()
                      : '—'
                  }
                />
                <DetailRow
                  icon={Truck}
                  label={t.client.vehicle}
                  value={shipment.vehicle?.plateNumber || '—'}
                />
                <DetailRow
                  icon={User}
                  label={t.client.driver}
                  value={shipment.driver?.name || '—'}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Track Live card (full width on mobile, right col on lg) */}
        {status === 'IN_TRANSIT' && (
          <motion.div
            className="w-full lg:w-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card
              className={`${theme.card.base} ${theme.card.padding} flex flex-col items-center justify-center text-center h-full`}
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className={theme.typography.h5}>
                {t.client.milestones.IN_TRANSIT}
              </h3>
              <p className={`${theme.typography.caption} mb-6`}>
                {t.client.trackLive}
              </p>
              <Dialog open={showMap} onOpenChange={setShowMap}>
                <DialogTrigger asChild>
                  <Button className={theme.button.primary}>
                    <Navigation className="w-4 h-4 mr-2" />
                    {t.client.trackLive}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl">
                  <DialogHeader>
                    <DialogTitle>{t.client.trackLiveModal}</DialogTitle>
                  </DialogHeader>
                  <div
                    id="track-map"
                    className={theme.map.containerModal}
                  />
                </DialogContent>
              </Dialog>
            </Card>
          </motion.div>
        )}
      </div>
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
