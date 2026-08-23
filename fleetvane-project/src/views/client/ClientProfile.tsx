'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Package,
  Truck,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/context/AuthContext';
import { normalizePageResponse } from '@/lib/utils';
import { toast } from 'sonner';
import { theme } from '@/constants/theme';
import t from '@/locales/en.json';

// ── Animation variants ────────────────────────────────────────
const fadeUp = {
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
export default function ClientProfile() {
  const { state: authState } = useAuth();
  const user = authState.user;

  const [stats, setStats] = useState({
    totalShipments: 0,
    inTransit: 0,
    delivered: 0,
    pending: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch shipment stats for this client
  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetch('/api/shipments', { headers })
      .then(async (r) => {
        if (!r.ok) throw new Error();
        const raw = await r.json();
        return normalizePageResponse<any>(raw).items;
      })
      .then((list) => {
        setStats({
          totalShipments: list.length,
          inTransit: list.filter((s: { status: string }) => s.status === 'IN_TRANSIT').length,
          delivered: list.filter((s: { status: string }) => s.status === 'DELIVERED').length,
          pending: list.filter((s: { status: string }) => s.status === 'REQUESTED').length,
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
    .slice(0, 2) || 'C';

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
                    {user?.name || 'Client'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>Email</span>
                  <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                    {user?.email || 'client@fleetvane.com'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>Role</span>
                  <Badge
                    className={`${theme.status.badge} bg-emerald-100 text-emerald-800 border-emerald-200 ml-auto capitalize`}
                  >
                    {user?.role ? user.role.toLowerCase() : 'client'}
                  </Badge>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className={`text-sm ${theme.typography.captionText}`}>
                    Member Since
                  </span>
                  <span className={`ml-auto text-sm font-medium ${theme.typography.headingText}`}>
                    {user?.createdAt ? formatDate(user.createdAt) : 'Active Member'}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── My Shipments Summary ──────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          label="Total Shipments"
          value={statsLoading ? '—' : stats.totalShipments}
          color="text-emerald-600 dark:text-emerald-400"
          bgColor="bg-emerald-100 dark:bg-emerald-950"
          index={1}
        />
        <StatCard
          icon={Truck}
          label="In Transit"
          value={statsLoading ? '—' : stats.inTransit}
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-100 dark:bg-blue-950"
          index={2}
        />
        <StatCard
          icon={Clock}
          label="Delivered"
          value={statsLoading ? '—' : stats.delivered}
          color="text-amber-600 dark:text-amber-400"
          bgColor="bg-amber-100 dark:bg-amber-950"
          index={3}
        />
        <StatCard
          icon={AlertCircle}
          label="Pending"
          value={statsLoading ? '—' : stats.pending}
          color="text-slate-600 dark:text-slate-400"
          bgColor="bg-slate-100 dark:bg-slate-800"
          index={4}
        />
      </div>
    </div>
  );
}
