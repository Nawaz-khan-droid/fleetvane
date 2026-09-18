'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { fetchWithAuth } from '@/lib/fetchWithAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

function formatDate(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function ManagerProfile() {
  const { state: authState } = useAuth();
  const user = authState.user;

  const initials = user?.name
    ?.split(' ')
    .map((n) => n.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'M';

  return (
    <div className="max-w-3xl mx-auto py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {/* Top Banner */}
            <div className="h-32 bg-slate-100 dark:bg-slate-800 w-full" />
            
            {/* Profile Content */}
            <div className="px-8 pb-8">
              {/* Avatar */}
              <div className="relative -mt-10 mb-4">
                <div className="w-[80px] h-[80px] rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-2xl font-bold text-white border-4 border-white dark:border-slate-900 shadow-sm">
                  {initials}
                </div>
              </div>

              {/* Name & Title */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {user?.name || 'Manager'}
                </h2>
                <div className="flex items-center gap-3">
                  <p className="text-sm text-slate-500">
                    {user?.email || 'manager@fleetvane.com'}
                  </p>
                  <span className="bg-blue-100 text-blue-700 rounded-full px-3 py-0.5 text-xs font-medium">
                    {user?.role || 'MANAGER'}
                  </span>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Shield className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Account Type</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    Administrator
                  </p>
                </div>
                
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Joined Date</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {user?.createdAt ? formatDate(user.createdAt) : 'Active Member'}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Building className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wide">Company</span>
                  </div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    FleetVane Logistics
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="mt-8"
      >
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
                    id="confirmManagerEmail"
                    onChange={(e) => {
                      const btn = document.getElementById('confirmManagerDeleteBtn') as HTMLButtonElement;
                      if (btn) btn.disabled = e.target.value !== user?.email;
                    }}
                  />
                </div>
                <Button 
                  id="confirmManagerDeleteBtn"
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
