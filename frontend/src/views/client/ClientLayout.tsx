'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Truck, Package, Navigation, UserCircle, LogOut } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import ThemeToggle from '@/components/shared/ThemeToggle';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';

interface ClientLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { label: 'My Shipments', icon: Package, path: '/client/dashboard' },
  { label: 'Track', icon: Navigation, path: '/client/track' },
  { label: 'Profile', icon: UserCircle, path: '/client/profile' },
];

export default function ClientLayout({ children, title }: ClientLayoutProps) {
  const { state: authState, logout } = useAuth();
  const { route, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => route.startsWith(path);
  const initials = authState.user?.name?.charAt(0)?.toUpperCase() || 'C';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
      {/* Topbar */}
      <header className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button className="lg:hidden p-1 text-slate-500 hover:text-slate-700" onClick={() => setMobileOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-lg text-slate-900 dark:text-white hidden sm:block">FleetVane</span>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 mx-4">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive(item.path)
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3 ml-auto">
          <ThemeToggle />
          <NotificationBell />
          <button
            onClick={() => navigate('/client/profile')}
            className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{authState.user?.name}</p>
              <p className="text-xs text-slate-500 truncate">{authState.user?.email}</p>
            </div>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium ${
                    isActive(item.path)
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
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors font-medium text-sm"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
