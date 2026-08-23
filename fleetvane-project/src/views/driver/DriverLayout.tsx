'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, MapPin, FileText, LogOut, Menu, Truck, UserCircle } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import LiveGreeting from '@/components/shared/LiveGreeting';
import ThemeToggle from '@/components/shared/ThemeToggle';
import NotificationBell from '@/components/shared/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import t from '@/locales/en.json';
import { theme } from '@/constants/theme';

interface DriverLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const navItems = [
  { label: t.nav.dashboard, icon: Gauge, path: '/driver/dashboard' },
  { label: t.driver.routeTitle, icon: MapPin, path: '/driver/route' },
  { label: t.driver.reportTitle, icon: FileText, path: '/driver/report' },
  { label: t.driver.profileTitle, icon: UserCircle, path: '/driver/profile' },
];

export default function DriverLayout({ children, title }: DriverLayoutProps) {
  const { state: authState, logout } = useAuth();
  const { route, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path: string) => route === path;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 overflow-x-hidden">
      {/* ── Mobile sidebar Sheet ──────────────────────── */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className={`w-72 ${theme.nav.sidebar} p-0 gap-0 bg-card dark:bg-slate-900 [&>button]:hidden border-r`}
        >
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          {/* Logo */}
          <div className={`${theme.sidebar.gradientTop}`} />
          <div className="p-4 pb-3 border-b">
            <div className="flex items-center gap-2.5">
              <div className={`${theme.sidebar.avatarBg} ${theme.sidebar.avatarCircle}`}>
                <Truck className="w-5 h-5" />
              </div>
              <h1 className={`text-lg font-bold ${theme.brand.primaryText}`}>{t.brand.name}</h1>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-[52px]">{t.brand.tagline}</p>
          </div>

          {/* Nav items */}
          <nav className="flex-1 p-4 space-y-1">
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
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`border-l-[3px] ${
                    active
                      ? `border-l-emerald-500 pl-[10px] ${theme.nav.sidebarItemActive}`
                      : hoveredItem === item.path
                      ? `border-l-emerald-300 pl-[10px] ${theme.nav.sidebarItemInactive}`
                      : `border-l-transparent pl-[13px] ${theme.nav.sidebarItemInactive}`
                  } ${theme.nav.sidebarItem} w-full transition-all duration-150`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="mt-auto p-4 border-t">
            <button
              onClick={() => {
                handleLogout();
                setMobileOpen(false);
              }}
              className={`
                ${
                  theme.nav.sidebarItem
                } w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700`}
            >
              <LogOut className="w-5 h-5" />
              {t.nav.logout}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Sidebar ─────────────────────────────────────── */}
      <aside
        className={`${
          theme.nav.sidebar
        } hidden lg:flex flex-col transition-transform duration-300 z-50 bg-card dark:bg-slate-900`}
      >
        {/* Logo */}
        <div className={`${theme.sidebar.gradientTop}`} />
        <div className="p-4 pb-3 border-b">
          <div className="flex items-center gap-2.5">
            <div className={`${theme.sidebar.avatarBg} ${theme.sidebar.avatarCircle}`}>
              <Truck className="w-5 h-5" />
            </div>
            <h1 className={`text-lg font-bold ${theme.brand.primaryText}`}>{t.brand.name}</h1>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 pl-[52px]">{t.brand.tagline}</p>
        </div>

        {/* Nav items */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`border-l-[3px] ${
                  active
                    ? `border-l-emerald-500 pl-[10px] ${theme.nav.sidebarItemActive}`
                    : hoveredItem === item.path
                    ? `border-l-emerald-300 pl-[10px] ${theme.nav.sidebarItemInactive}`
                    : `border-l-transparent pl-[13px] ${theme.nav.sidebarItemInactive}`
                } ${theme.nav.sidebarItem} w-full transition-all duration-150`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className={`${
              theme.nav.sidebarItem
            } w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-700`}
          >
            <LogOut className="w-5 h-5" />
            {t.nav.logout}
          </button>
        </div>
      </aside>

      {/* ── Main area ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Top bar */}
        <header
          className={`${theme.nav.topBar} flex items-center justify-between px-4 lg:px-8 h-16 bg-white/80 dark:bg-slate-900/80`}
        >
          {/* Left: hamburger + title + greeting (greeting md+) */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              className={theme.nav.mobileMenuBtn}
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <h2 className={`truncate ${theme.typography.h5}`}>{title}</h2>
            <div className="hidden md:flex">
              <LiveGreeting name={authState.user?.name || 'Driver'} />
            </div>
          </div>

          {/* Right: mobile=avatar only, sm+=theme+bell, md+=user info */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2 sm:gap-3">
              <ThemeToggle />
              <NotificationBell />
            </div>
            <div className="hidden md:flex items-center gap-3">
              <div className="text-right">
                <p className={theme.typography.label}>
                  {authState.user?.name}
                </p>
                <p className={theme.typography.caption}>Driver</p>
              </div>
            </div>
            {/* Avatar: always visible, tappable on mobile */}
            <button
              onClick={() => navigate('/driver/profile')}
              className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-semibold text-sm hover:ring-2 hover:ring-emerald-400 transition-all shrink-0"
              aria-label="Profile"
            >
              {authState.user?.name?.charAt(0)?.toUpperCase() || 'D'}
            </button>
          </div>
        </header>

        {/* Content */}
        <main className={`${theme.layout.contentArea} pt-20 lg:pt-24 px-4 lg:px-8 pb-24 lg:pb-8`}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </main>

        {/* ── Mobile Bottom Navigation ────────────────── */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center gap-0.5 px-4 h-full transition-colors ${
                    active
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 dark:text-slate-500'
                  } ${
                    active ? 'border-t-2 border-t-emerald-600 dark:border-t-emerald-400 -mt-px' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-medium truncate max-w-[60px]">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
