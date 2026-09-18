'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  Settings,
  LogOut,
  Menu,
  UserCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import ThemeToggle from '@/components/shared/ThemeToggle';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';

interface ManagerLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { label: t.nav.dashboard, icon: LayoutDashboard, path: '/manager/dashboard' },
  { label: 'Fleet', icon: Truck, path: '/manager/fleet' },
  { label: 'Shipments', icon: Package, path: '/manager/shipments' },
  { label: 'Drivers', icon: Users, path: '/manager/drivers' },
  { label: 'Settings', icon: Settings, path: '/manager/settings' },
  { label: t.manager.profileTitle, icon: UserCircle, path: '/manager/profile' },
];

export default function ManagerLayout({ children, title }: ManagerLayoutProps) {
  const { state: authState, logout } = useAuth();
  const { route, navigate } = useRouter();
  const isMapPage = route === '/manager/fleet';
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => route === path;

  const userInitials = authState.user?.name?.charAt(0)?.toUpperCase() || 'M';

  return (
    <div className="h-screen flex bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* ── Mobile sidebar Sheet ──────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-72 p-0 gap-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 [&>button]:hidden flex flex-col"
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 w-full" />
          
          {/* Logo area */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1">FleetVane</h1>
                <p className="text-xs text-slate-500">{t.brand.tagline}</p>
              </div>
            </div>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setMobileOpen(false);
                  }}
                  className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {userInitials}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{authState.user?.name || 'Manager'}</p>
              <p className="text-xs text-slate-500 truncate">{authState.user?.email}</p>
            </div>
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop Sidebar ─────────────────────────────────────── */}
      <aside
        className={`hidden lg:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-20 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-cyan-400 w-full" />
        
        {/* Logo area */}
        <div className="h-[55px] px-4 border-b border-slate-200 dark:border-slate-800 flex items-center overflow-hidden shrink-0">
          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 whitespace-nowrap overflow-hidden opacity-100 transition-opacity duration-300">
                <h1 className="text-lg font-bold text-slate-900 dark:text-white leading-none mb-1">FleetVane</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t.brand.tagline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={sidebarCollapsed ? item.label : undefined}
                className={`w-full rounded-xl px-3 py-2.5 flex items-center gap-3 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                } ${sidebarCollapsed ? 'justify-center' : 'justify-start'}`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </button>
            );
          })}
          
          <div id="fleet-actions-portal" className={sidebarCollapsed ? 'hidden' : 'block mt-6'} />
        </nav>

        {/* User section & Toggle */}
        <div className="border-t border-slate-200 dark:border-slate-800">
          <div className="p-3 flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-sm shrink-0">
              {userInitials}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0 text-left whitespace-nowrap opacity-100 transition-opacity duration-300">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{authState.user?.name || 'Manager'}</p>
                <p className="text-[10px] text-slate-500 truncate">{authState.user?.email}</p>
              </div>
            )}
            {!sidebarCollapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors shrink-0"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="p-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-slate-50 dark:bg-slate-950 min-w-0">
        {/* Topbar */}
        <header className={`h-14 border-b bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between shrink-0 z-10 ${isMapPage ? "hidden" : ""}`}>
          <div className="flex items-center gap-3 min-w-0">
            <button
              className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <ThemeToggle />
            <NotificationBell />
            <button
              onClick={() => navigate('/manager/profile')}
              className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold text-xs hover:ring-2 hover:ring-blue-400 transition-all shrink-0"
              aria-label="Profile"
              title="Profile"
            >
              {userInitials}
            </button>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={`flex-1 overflow-auto ${isMapPage ? "p-0 relative" : "p-4 md:p-6 lg:p-8"}`}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
