'use client'

import React, { useEffect, useMemo, useSyncExternalStore } from 'react';
import { AuthProvider } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { ProtectedRoute } from '@/components/fleet/ProtectedRoute';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import LandingPage from '@/views/LandingPage';
import LoginPage from '@/views/auth/LoginPage';
import SignupPage from '@/views/auth/SignupPage';

// Client pages
import ClientLayout from '@/views/client/ClientLayout';
import ClientDashboard from '@/views/client/ClientDashboard';
import ClientTrackPage from '@/views/client/ClientTrackPage';
import ClientProfile from '@/views/client/ClientProfile';

// Driver pages
import DriverLayout from '@/views/driver/DriverLayout';
import DriverDashboard from '@/views/driver/DriverDashboard';
import DriverRoute from '@/views/driver/DriverRoute';
import DriverReport from '@/views/driver/DriverReport';
import DriverProfile from '@/views/driver/DriverProfile';

// Legal pages
import LegalPrivacyPage from '@/views/LegalPrivacyPage';
import LegalTermsPage from '@/views/LegalTermsPage';

// Manager pages
import ManagerLayout from '@/views/manager/ManagerLayout';
import ManagerDashboard from '@/views/manager/ManagerDashboard';
import ManagerFleet from '@/views/manager/ManagerFleet';
import ManagerShipments from '@/views/manager/ManagerShipments';
import ManagerDrivers from '@/views/manager/ManagerDrivers';
import ManagerSettings from '@/views/manager/ManagerSettings';
import ManagerProfile from '@/views/manager/ManagerProfile';
import CommandPalette from '@/components/shared/CommandPalette';

import t from '@/locales/en.json';

/** SSR-safe client mount detection using useSyncExternalStore */
const emptySubscribe = () => () => {};
function useIsMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

/** Map routes to locale-based page titles */
function getPageTitle(route: string): string {
  const map: Record<string, string> = {
    '/client/dashboard': t.client.dashboardTitle,
    '/client/track': t.client.trackPageTitle,
    '/client/profile': t.client.profileTitle,
    '/driver/dashboard': t.driver.dashboardTitle,
    '/driver/route': t.driver.routeTitle,
    '/driver/report': t.driver.reportTitle,
    '/driver/profile': t.driver.profileTitle,
    '/manager/dashboard': t.manager.dashboardTitle,
    '/manager/fleet': t.manager.fleetTitle,
    '/manager/shipments': t.manager.shipmentsTitle,
    '/manager/drivers': t.manager.driversTitle,
    '/manager/settings': t.manager.settingsTitle,
    '/manager/profile': t.manager.profileTitle,
  };
  return map[route] || 'Dashboard';
}

/**
 * AppRouter — Uses useMemo to prevent unnecessary re-creation of layout trees.
 */
function AppRouter() {
  const { route, params } = useRouter();

  const content = useMemo(() => {
    // ─── PUBLIC ROUTES ──────────────────────────────────────────
    if (route === '/') return <LandingPage />;
    if (route === '/login') return <LoginPage />;
    if (route === '/signup') return <SignupPage />;
    if (route === '/privacy') return <LegalPrivacyPage />;
    if (route === '/terms') return <LegalTermsPage />;

    // ─── CLIENT BRANCH ──────────────────────────────────────────
    if (route.startsWith('/client')) {
      return (
        <ProtectedRoute allowedRoles={['CLIENT']}>
          <ClientLayout title={getPageTitle(route)}>
            {route === '/client/dashboard' && <ClientDashboard />}
            {route === '/client/track' && <ClientTrackPage />}
            {route === '/client/profile' && <ClientProfile />}
          </ClientLayout>
        </ProtectedRoute>
      );
    }

    // ─── DRIVER BRANCH ──────────────────────────────────────────
    if (route.startsWith('/driver')) {
      const activeRoute = route === '/driver/reports' ? '/driver/report' : route;
      return (
        <ProtectedRoute allowedRoles={['DRIVER']}>
          <DriverLayout title={getPageTitle(activeRoute)}>
            {activeRoute === '/driver/dashboard' && <DriverDashboard />}
            {activeRoute === '/driver/route' && <DriverRoute />}
            {activeRoute === '/driver/report' && <DriverReport />}
            {activeRoute === '/driver/profile' && <DriverProfile />}
          </DriverLayout>
        </ProtectedRoute>
      );
    }

    // ─── MANAGER & ADMIN BRANCH ─────────────────────────────────
    if (route.startsWith('/manager') || route.startsWith('/admin')) {
      const activeRoute = route.startsWith('/admin') ? '/manager/dashboard' : route;
      return (
        <ProtectedRoute allowedRoles={['MANAGER', 'ADMIN']}>
          <ManagerLayout title={getPageTitle(activeRoute)}>
            {activeRoute === '/manager/dashboard' && <ManagerDashboard />}
            {activeRoute === '/manager/fleet' && <ManagerFleet />}
            {activeRoute === '/manager/shipments' && <ManagerShipments />}
            {activeRoute === '/manager/drivers' && <ManagerDrivers />}
            {activeRoute === '/manager/settings' && <ManagerSettings />}
            {activeRoute === '/manager/profile' && <ManagerProfile />}
          </ManagerLayout>
        </ProtectedRoute>
      );
    }

    // ─── 404 ──────────────────────────────────────────────────────
    return <LandingPage />;
  }, [route]);

  return <div key={route}>{content}</div>;
}

export default function Home() {
  const mounted = useIsMounted();

  if (!mounted) {
    // Render a minimal shell that matches both server and client
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <RouterProvider>
            <AppRouter />
            <CommandPalette />
          </RouterProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
