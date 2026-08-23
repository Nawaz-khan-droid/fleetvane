'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Truck,
  Users,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse } from '@/lib/utils';
import { toast } from 'sonner';
import { theme } from '@/constants/theme';

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
export default function ManagerProfile() {
  const { state: authState } = useAuth();
  const user = authState.user;

  const [stats, setStats] = useState({
    totalShipments: 0,
    activeVehicles: 0,
    teamMembers: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch quick stats from APIs
  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch('/api/shipments', { headers }).then(async (r) => {
        if (!r.ok) throw new Error();
        const raw = await r.json();
        return normalizePageResponse<any>(raw).items;
      }),
      fetch('/api/vehicles', { headers }).then(async (r) => {
        if (!r.ok) throw new Error();
        const raw = await r.json();
        return normalizePageResponse<any>(raw).items;
      }),
      fetch('/api/drivers', { headers }).then(async (r) => {
        if (!r.ok) throw new Error();
        const raw = await r.json();
        return normalizePageResponse<any>(raw).items;
      }),
    ])
      .then(([shipments, vehicles, drivers]) => {
        setStats({
          totalShipments: Array.isArray(shipments) ? shipments.length : 0,
          activeVehicles: Array.isArray(vehicles)
            ? vehicles.filter((v: { status: string }) => v.status === 'IN_USE').length
            : 0,
          teamMembers: Array.isArray(drivers) ? drivers.length : 0,
        });
      })
      .catch(() => {
        // Silently fail — stats show 0
      })
      .finally(() => setStatsLoading(false));
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'M';

  return (
    <TooltipProvider delayDuration={200}>
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
                      {user?.name || 'Manager'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`text-sm ${theme.typography.captionText}`}>Email</span>
                    <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                      {user?.email || 'manager@fleetvane.com'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`text-sm ${theme.typography.captionText}`}>Role</span>
                    <Badge
                      className={`${theme.status.badge} bg-emerald-100 text-emerald-800 border-emerald-200 ml-auto`}
                    >
                      {user?.role || 'MANAGER'}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className={`text-sm ${theme.typography.captionText}`}>
                      Account Created
                    </span>
                    <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                      {user?.createdAt ? formatDate(user.createdAt) : 'Active Manager'}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── Quick Stats ─────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard
            icon={Clock}
            label="Total Shipments Managed"
            value={statsLoading ? '—' : stats.totalShipments}
            color="text-emerald-600 dark:text-emerald-400"
            bgColor="bg-emerald-100 dark:bg-emerald-950"
            index={1}
          />
          <StatCard
            icon={Truck}
            label="Active Vehicles"
            value={statsLoading ? '—' : stats.activeVehicles}
            color="text-amber-600 dark:text-amber-400"
            bgColor="bg-amber-100 dark:bg-amber-950"
            index={2}
          />
          <StatCard
            icon={Users}
            label="Team Members"
            value={statsLoading ? '—' : stats.teamMembers}
            color="text-blue-600 dark:text-blue-400"
            bgColor="bg-blue-100 dark:bg-blue-950"
            index={3}
          />
        </div>

        {/* ── Danger Zone ─────────────────────────────────── */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="border-red-200 dark:border-red-900/50 bg-white dark:bg-slate-900">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5" />
                Danger Zone
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className={`text-sm font-medium ${theme.typography.headingText}`}>
                    Delete Account
                  </p>
                  <p className={`text-sm ${theme.typography.captionText} mt-1`}>
                    Permanently remove your account and all associated data. This action cannot
                    be undone.
                  </p>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button variant="destructive" size="sm" disabled>
                        Delete Account
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <p>Contact support to delete account</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
