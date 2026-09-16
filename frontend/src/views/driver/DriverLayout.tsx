'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Navigation, FileText, UserCircle, Truck, Bell } from 'lucide-react';
import LiveGreeting from '@/components/shared/LiveGreeting';
import ThemeToggle from '@/components/shared/ThemeToggle';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';

interface DriverLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { label: 'Home', icon: LayoutDashboard, path: '/driver/dashboard' },
  { label: 'Route', icon: Navigation, path: '/driver/route' },
  { label: 'Report', icon: FileText, path: '/driver/report' },
  { label: 'Profile', icon: UserCircle, path: '/driver/profile' },
];

export default function DriverLayout({ children, title }: DriverLayoutProps) {
  const { state: authState } = useAuth();
  const { route, navigate } = useRouter();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const isActive = (path: string) => route === path;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-56 flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50">
        <div className="h-14 flex items-center px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mr-2">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg text-slate-900 dark:text-white">FleetVane</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-semibold shrink-0">
            {authState.user?.name?.charAt(0)?.toUpperCase() || 'D'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {authState.user?.name || 'Driver'}
            </p>
            <p className="text-xs text-slate-500 truncate">Driver</p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Topbar */}
        <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40">
          <div className="flex items-center gap-2 lg:hidden">
            <Truck className="w-6 h-6 text-blue-600" />
            <span className="font-bold text-lg text-slate-900 dark:text-white">FleetVane</span>
          </div>
          <div className="hidden lg:block">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          </div>
          <div className="flex items-center gap-3 ml-auto">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="flex-1 bg-slate-50 dark:bg-slate-950 overflow-auto pb-16 lg:pb-0 px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-4 z-40">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
                active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
