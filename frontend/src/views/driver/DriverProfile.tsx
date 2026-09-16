'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  CreditCard,
  Car,
  ShieldCheck,
  Package,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

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

  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetchWithAuth('/api/drivers', { headers })
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

  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetchWithAuth('/api/reports', { headers })
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
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border-4 border-white dark:border-slate-900">
          {initials}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name || 'Driver'}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          Professional Driver
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Information Cards */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Driver Information</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">License Number</p>
              {driverLoading ? <Skeleton className="h-5 w-24 mt-1" /> : (
                <p className="font-semibold text-slate-900 dark:text-white">{driverInfo?.licenseNumber}</p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Vehicle Assigned</p>
              {driverLoading ? <Skeleton className="h-5 w-32 mt-1" /> : (
                <p className="font-semibold text-slate-900 dark:text-white">
                  {driverInfo?.vehiclePlate} • {driverInfo?.vehicleModel}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Availability Status</p>
              {driverLoading ? <Skeleton className="h-5 w-20 mt-1" /> : (
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${driverInfo?.isAvailable ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {driverInfo?.isAvailable ? 'Available for routes' : 'Currently unavailable'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Performance Stats</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Total Deliveries</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{deliveryStats.total}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">This Month</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{deliveryStats.thisMonth}</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
