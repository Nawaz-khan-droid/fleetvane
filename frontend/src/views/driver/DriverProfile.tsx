'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Car,
  CreditCard,
  MapPin,
  Package,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse } from '@/lib/utils';
import { theme } from '@/constants/theme';
import t from '@/locales/en.json';

// ── Animation variants ────────────────────────────────────────
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

// ── Helper: format date nicely ────────────────────────────────
function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// ── Quick stat card ───────────────────────────────────────────
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
  index: number;
}

function StatCard({ icon: Icon, label, value, color, bgColor, index }: StatCardProps) {
  return (
    <motion.div
      custom={index}
      variants={fadeUp}
      initial="hidden"
      animate="visible"
    >
      <Card className={`${theme.card.base} ${theme.card.bg} ${theme.statCard.hover} ${theme.darkMode.cardSurface} h-full`}>
        <CardContent className="p-4 flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${bgColor}`}
          >
            <Icon className={`w-6 h-6 ${color}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${theme.typography.headingText}`}>{value}</p>
            <p className={`text-sm ${theme.typography.captionText}`}>{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function DriverProfile() {
  const { state: authState } = useAuth();
  const user = authState.user;

  const [driverInfo, setDriverInfo] = useState<{
    licenseNumber: string;
    vehiclePlate: string;
    vehicleModel: string;
    isAvailable: boolean;
  } | null>(null);
  const [driverLoading, setDriverLoading] = useState(true);

  const [deliveryStats, setDeliveryStats] = useState({
    total: 0,
    thisMonth: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch driver profile info
  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/drivers', { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((raw) => {
        const list = normalizePageResponse<any>(raw).items;
        const myId = user?.userId || (user as any)?.id;
        const me = list.find((d: any) => d.id === myId || d.userId === myId || d.driverProfile?.userId === myId);
        if (me?.driverProfile) {
          setDriverInfo({
            licenseNumber: me.driverProfile.licenseNumber || 'N/A',
            vehiclePlate: me.driverProfile.vehicle?.plateNumber || 'Not Assigned',
            vehicleModel: me.driverProfile.vehicle?.model || 'Not Assigned',
            isAvailable: me.driverProfile.isAvailable ?? true,
          });
        }
      })
      .catch(() => {})
      .finally(() => setDriverLoading(false));
  }, [user?.userId, user?.id, authState.token]);

  // Fetch delivery stats from reports
  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/reports', { headers })
      .then((r) => (r.ok ? r.json() : []))
      .then((raw) => {
        const list = normalizePageResponse<any>(raw).items;
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        setDeliveryStats({
          total: list.length,
          thisMonth: list.filter(
            (r: { createdAt: string }) => new Date(r.createdAt) >= monthStart
          ).length,
        });
      })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [authState.token]);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'D';

  return (
    <div className="space-y-6">
      {/* ── Account Details ──────────────────────────────── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <Card
          className={`${theme.card.base} ${theme.card.bg} ${theme.darkMode.cardSurface}`}
        >
          <CardHeader className="pb-4">
            <CardTitle className={`${theme.typography.h4} ${theme.typography.headingText}`}>
              Account Details
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white shrink-0">
                {initials}
              </div>

              {/* Info rows */}
              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>Name</span>
                  <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                    {user?.name || 'Driver'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>Email</span>
                  <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                    {user?.email || 'driver@fleetvane.com'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>Role</span>
                  <Badge
                    className={`${theme.status.badge} bg-emerald-100 text-emerald-800 border-emerald-200 ml-auto capitalize`}
                  >
                    {user?.role ? user.role.toLowerCase() : 'driver'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>
                    Member Since
                  </span>
                  <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                    {user?.createdAt ? formatDate(user.createdAt) : 'Active Driver'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Driving Info ─────────────────────────────────── */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <Card
          className={`${theme.card.base} ${theme.card.bg} ${theme.darkMode.cardSurface}`}
        >
          <CardHeader className="pb-4">
            <CardTitle className={`${theme.typography.h4} ${theme.typography.headingText}`}>
              Driving Information
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className={`text-xs ${theme.typography.captionText}`}>License Number</p>
                  <p className={`text-sm font-medium ${theme.typography.headingText}`}>
                    {driverLoading ? '—' : driverInfo?.licenseNumber || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
                  <Car className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className={`text-xs ${theme.typography.captionText}`}>Vehicle Plate</p>
                  <p className={`text-sm font-medium ${theme.typography.headingText}`}>
                    {driverLoading ? '—' : driverInfo?.vehiclePlate || 'Not Assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className={`text-xs ${theme.typography.captionText}`}>Vehicle Model</p>
                  <p className={`text-sm font-medium ${theme.typography.headingText}`}>
                    {driverLoading ? '—' : driverInfo?.vehicleModel || 'Not Assigned'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className={`text-xs ${theme.typography.captionText}`}>Availability</p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        driverLoading
                          ? 'bg-slate-400'
                          : driverInfo?.isAvailable
                          ? 'bg-emerald-500'
                          : 'bg-red-500'
                      }`}
                    />
                    <p className={`text-sm font-medium ${theme.typography.headingText}`}>
                      {driverLoading ? '—' : driverInfo?.isAvailable ? 'Available' : 'Unavailable'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── My Deliveries Summary ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatCard
          icon={Package}
          label="Total Deliveries"
          value={statsLoading ? '—' : deliveryStats.total}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950"
          index={2}
        />
        <StatCard
          icon={MapPin}
          label="This Month"
          value={statsLoading ? '—' : deliveryStats.thisMonth}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-950"
          index={3}
        />
      </div>
    </div>
  );
}
