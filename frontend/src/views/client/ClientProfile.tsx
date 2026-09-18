'use client';

import React, { useEffect, useState } from 'react';
import { motion, type Variants } from 'framer-motion';
import {
  Package,
  Truck,
  Clock,
  AlertCircle,
  Building,
  Mail,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import { normalizePageResponse } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
  }),
};

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

  useEffect(() => {
    const token = authState.token;
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    fetchWithAuth('/api/shipments', { headers })
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
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const initials = user?.name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'C';

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-4 border-4 border-white dark:border-slate-900">
          {initials}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name || 'Client User'}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
        <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800">
          FleetVane Client
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Information Cards */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account Details</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Building className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Company / Organization</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Contact Email</p>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.email}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">Member Since</p>
              <p className="font-semibold text-slate-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Shipment Statistics</h3>
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Total Shipments</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.totalShipments}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">In Transit</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.inTransit}</span>
              )}
            </div>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Delivered</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.delivered}</span>
              )}
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Pending</span>
              </div>
              {statsLoading ? <Skeleton className="h-8 w-12" /> : (
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pending}</span>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Danger Zone */}
      <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="mt-8">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-4">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" className="bg-red-600 hover:bg-red-700">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  This action cannot be undone. This will permanently delete your account
                  and remove your data from our servers.
                </p>
                <div className="space-y-2">
                  <Label>Please type your email to confirm</Label>
                  <Input 
                    placeholder={user?.email} 
                    id="confirmEmail"
                    onChange={(e) => {
                      const btn = document.getElementById('confirmDeleteBtn') as HTMLButtonElement;
                      if (btn) btn.disabled = e.target.value !== user?.email;
                    }}
                  />
                </div>
                <Button 
                  id="confirmDeleteBtn"
                  disabled 
                  variant="destructive" 
                  className="w-full"
                  onClick={async () => {
                    try {
                      const res = await fetchWithAuth('/api/auth/account', { method: 'DELETE' });
                      if (!res.ok) throw new Error();
                      toast.success('Account deleted successfully');
                      window.location.href = '/login';
                    } catch {
                      toast.error('Failed to delete account');
                    }
                  }}
                >
                  Confirm Delete Account
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>
    </div>
  );
}
