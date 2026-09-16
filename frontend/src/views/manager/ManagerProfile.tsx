'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Calendar, Building } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';

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
    </div>
  );
}
