'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  MapPin,
  Truck,
  User,
  Weight,
  Clock,
  Calendar,
  Navigation,
  Check,
  CheckCircle,
  Play,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';
import { useAuth } from '@/context/AuthContext';
import type { Shipment, ShipmentStatus } from '@/types';

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

// ── Milestone State Machine ───────────────────────────────
const STATUS_ORDER: ShipmentStatus[] = ['REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'];

const MILESTONES: { key: ShipmentStatus; label: string; icon: React.ElementType }[] = [
  { key: 'REQUESTED', label: t.client.milestones.REQUESTED, icon: Package },
  { key: 'ASSIGNED', label: t.client.milestones.ASSIGNED, icon: Truck },
  { key: 'IN_TRANSIT', label: t.client.milestones.IN_TRANSIT, icon: Navigation },
  { key: 'DELIVERED', label: t.client.milestones.DELIVERED, icon: CheckCircle },
];

function getStepIndex(status: ShipmentStatus): number {
  if (status === 'CANCELLED') return 0;
  const idx = STATUS_ORDER.indexOf(status);
  return idx === -1 ? 0 : idx;
}

// ── Fade-up animation variant ─────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// ── Props ────────────────────────────────────────────────
interface ShipmentDetailDrawerProps {
  shipment: Shipment | null;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  onAssign?: (shipment: Shipment) => void;
  /** If true, hides action buttons (read-only client view) */
  readOnly?: boolean;
}

// ── Truncated ID with Tooltip ─────────────────────────────
function TruncatedId({ id }: { id: string }) {
  const truncated = id.length > 12 ? `${id.slice(0, 12)}…` : id;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="font-mono text-sm text-slate-500 dark:text-slate-400 cursor-help border-b border-dotted border-slate-300 dark:border-slate-600">
          {truncated}
        </span>
      </TooltipTrigger>
      <TooltipContent side="top" className="font-mono text-xs max-w-xs break-all">
        {id}
      </TooltipContent>
    </Tooltip>
  );
}

// ── Horizontal Stepper ────────────────────────────────────
function Stepper({ status }: { status: ShipmentStatus }) {
  const currentStep = getStepIndex(status);

  if (status === 'CANCELLED') {
    return (
      <div className="flex items-center justify-center py-2">
        <Badge className={`${theme.status.badge} ${statusBadgeClass.CANCELLED}`}>
          {t.client.milestones.CANCELLED}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full px-2">
      {MILESTONES.map((milestone, i) => {
        const completed = i < currentStep;
        const active = i === currentStep;
        const Icon = milestone.icon;

        return (
          <React.Fragment key={milestone.key}>
            {/* Circle + label */}
            <div className="flex flex-col items-center gap-1.5 z-10">
              <div
                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  completed
                    ? 'bg-emerald-500 border-emerald-500 text-white'
                    : active
                    ? 'bg-white dark:bg-slate-900 border-emerald-500 text-emerald-500'
                    : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400'
                }`}
              >
                {completed ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[11px] font-medium text-center leading-tight max-w-[72px] ${
                  completed || active
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-slate-400 dark:text-slate-500'
                }`}
              >
                {milestone.label}
              </span>
            </div>
            {/* Connector line (except last) */}
            {i < MILESTONES.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mt-[-18px] transition-all duration-500 ${
                  i < currentStep
                    ? 'bg-emerald-500'
                    : 'bg-slate-200 dark:bg-slate-700'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Info Item for Details Grid ────────────────────────────
function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40">
      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div className="min-w-0">
        <p className={theme.typography.caption}>{label}</p>
        <p className={`${theme.typography.label} break-words`}>{value}</p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export default function ShipmentDetailDrawer({
  shipment,
  open,
  onClose,
  onUpdate,
  onAssign,
  readOnly = false,
}: ShipmentDetailDrawerProps) {
  const { state: authState } = useAuth();
  const [actionLoading, setActionLoading] = useState(false);

  if (!shipment) return null;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  const formatDateTime = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // ── Action handlers ─────────────────────────────────────
  const handleStatusChange = async (newStatus: ShipmentStatus, body?: Record<string, unknown>) => {
    if (!shipment) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipment.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authState.token}`,
        },
        body: JSON.stringify({ status: newStatus, ...body }),
      });
      if (!res.ok) throw new Error();
      toast.success(
        newStatus === 'IN_TRANSIT'
          ? 'Transit started successfully'
          : newStatus === 'DELIVERED'
          ? 'Shipment marked as delivered'
          : 'Shipment cancelled',
      );
      onUpdate?.();
      onClose();
    } catch {
      toast.error(t.common.error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignDriver = () => {
    if (!shipment) return;
    if (onAssign) {
      onAssign(shipment);
      onClose();
    } else {
      toast.info('Assignment available via shipments management table');
    }
  };

  const handleCancel = () => {
    handleStatusChange('CANCELLED');
  };

  const handleStartTransit = () => {
    handleStatusChange('IN_TRANSIT');
  };

  const handleMarkDelivered = () => {
    handleStatusChange('DELIVERED', { deliveredAt: new Date().toISOString() });
  };

  // Determine which actions to show (manager only)
  const canCancel =
    !readOnly &&
    (shipment.status === 'REQUESTED' || shipment.status === 'ASSIGNED');
  const canAssign = !readOnly && shipment.status === 'REQUESTED';
  const canStartTransit = !readOnly && shipment.status === 'ASSIGNED';
  const canDeliver = !readOnly && shipment.status === 'IN_TRANSIT';
  const isDelivered = shipment.status === 'DELIVERED';
  const hasVehicleOrDriver = shipment.vehicle || shipment.driver;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar p-0">
        {/* ── Header ──────────────────────────────────── */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center flex-shrink-0">
              <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold leading-tight">
                Shipment Details
              </DialogTitle>
              <TruncatedId id={shipment.id} />
            </div>
          </div>
          <Badge
            className={`${theme.status.badge} ${statusBadgeClass[shipment.status]} flex-shrink-0`}
          >
            {formatStatus(shipment.status)}
          </Badge>
        </div>

        <DialogDescription className="sr-only">
          Detailed view of shipment {shipment.id}
        </DialogDescription>

        {/* ── Body ────────────────────────────────────── */}
        <div className="px-6 py-4 space-y-6">
          {/* Timeline / Progress Stepper */}
          <Stepper status={shipment.status} />

          {/* Details Grid (2 cols on md+) */}
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <InfoItem
              icon={MapPin}
              label={t.client.origin}
              value={shipment.origin}
            />
            <InfoItem
              icon={Navigation}
              label={t.client.destination}
              value={shipment.destination}
            />
            <InfoItem
              icon={Weight}
              label={t.client.weight}
              value={shipment.weight ? `${shipment.weight} kg` : '—'}
            />
            <InfoItem
              icon={Clock}
              label={t.client.eta}
              value={shipment.eta ? formatDateTime(shipment.eta) : '—'}
            />
            <InfoItem
              icon={Calendar}
              label={t.client.createdAt}
              value={formatDate(shipment.createdAt)}
            />
            {shipment.deliveredAt && (
              <InfoItem
                icon={CheckCircle}
                label="Delivered"
                value={formatDate(shipment.deliveredAt)}
              />
            )}
          </motion.div>

          {/* Vehicle & Driver Info Card */}
          {hasVehicleOrDriver && (
            <motion.div
              className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 border-l-4 border-l-emerald-500`}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Assignment
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shipment.vehicle && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                      <Truck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className={theme.typography.caption}>{t.client.vehicle}</p>
                      <p className={`${theme.typography.label} font-medium`}>
                        {shipment.vehicle.plateNumber}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {shipment.vehicle.type} · {shipment.vehicle.model}
                      </p>
                    </div>
                  </div>
                )}
                {shipment.driver && (
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <p className={theme.typography.caption}>{t.client.driver}</p>
                      <p className={`${theme.typography.label} font-medium`}>
                        {shipment.driver.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {shipment.driver.email}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Footer Actions ───────────────────────────── */}
        {(!readOnly || isDelivered) && (
          <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 rounded-b-lg">
            <DialogFooter className="gap-2 sm:gap-2">
              {isDelivered ? (
                <Badge className={`${theme.status.badge} ${statusBadgeClass.DELIVERED} gap-1.5 px-3 py-1`}>
                  <Check className="w-3 h-3" />
                  Completed
                </Badge>
              ) : (
                <>
                  {canAssign && (
                    <Button
                      className={theme.button.primarySm}
                      onClick={handleAssignDriver}
                      disabled={actionLoading}
                    >
                      <Truck className="w-4 h-4 mr-1.5" />
                      Assign Driver
                    </Button>
                  )}
                  {canStartTransit && (
                    <Button
                      className={theme.button.primarySm}
                      onClick={handleStartTransit}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-1.5" />
                      )}
                      Start Transit
                    </Button>
                  )}
                  {canDeliver && (
                    <Button
                      className={theme.button.primarySm}
                      onClick={handleMarkDelivered}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Mark Delivered
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950"
                      onClick={handleCancel}
                      disabled={actionLoading}
                    >
                      {t.common.cancel}
                    </Button>
                  )}
                </>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
