# Security, Session & Navigation Forensic Audit Report (Agent D)

**Author**: Agent D — Security, Session & Navigation Explorer  
**Scope**: Routing, Navigation Graph, RBAC, Authentication Lifecycle, Session Restoration, Deep Linking, and Security Controls  
**Target Repository**: `c:\Users\ks919\Downloads\fleetvane-project`  
**Date**: 2026-08-15  

---

## Executive Summary

A forensic audit of the FleetVane frontend and backend security/session/navigation subsystems was conducted against the requirements outlined in `ORIGINAL_REQUEST.md` (§ R2, § R6) and `PROJECT.md`.

The investigation uncovered **12 critical and high-severity defects** spanning:
1. **Routing & Navigation Integrity**: Hash vs pathname routing desynchronization on refresh/deep linking, dead routes in Command Palette (`/driver/reports`), double-hash prefixes in Quick Actions (`##/manager/...`) throwing users to `/`, and `<a href="#">` in NotificationBell resetting active sessions.
2. **Authentication & Session Lifecycle**: Missing 401 token refresh interceptor/retry on expired access tokens, render-phase side effects in `ProtectedRoute`, missing ADMIN role branch in frontend routing, and unhandled direct deep linking to `/client/track` resulting in infinite skeleton loading.
3. **Map State & Realtime Interaction**: Vehicle polling triggering full map reconstruction every 5 seconds, causing Google Maps / Leaflet zoom resets and UI destabilization.
4. **UI & Layout Stability**: Missing `CheckCircle2` icon import crashing the manager dashboard on delivered shipments, and login error layout height shifts with missing dark mode styling.

---

## 1. Complete Route Graph & Navigation Inventory

### 1.1 Role-Based Route Matrix

| Route Path | Role Allowed | Component Target | Layout Shell | Status | Discovered Defects |
|---|---|---|---|---|---|
| `/` | PUBLIC | `LandingPage.tsx` | None | Functional | None |
| `/login` | PUBLIC | `LoginPage.tsx` | None | Functional | Admin users redirected to `/` instead of admin view |
| `/signup` | PUBLIC | `SignupPage.tsx` | None | Functional | None |
| `/privacy` | PUBLIC | `LegalPrivacyPage.tsx` | None | Functional | None |
| `/terms` | PUBLIC | `LegalTermsPage.tsx` | None | Functional | None |
| `/client/dashboard` | `CLIENT` | `ClientDashboard.tsx` | `ClientLayout.tsx` | Functional | None |
| `/client/track` | `CLIENT` | `ClientTrackPage.tsx` | `ClientLayout.tsx` | **Defect** | Missing from `ClientLayout` navitems; direct navigation without `?id=` causes infinite skeleton loading |
| `/client/profile` | `CLIENT` | `ClientProfile.tsx` | `ClientLayout.tsx` | Functional | None |
| `/driver/dashboard` | `DRIVER` | `DriverDashboard.tsx` | `DriverLayout.tsx` | Functional | None |
| `/driver/route` | `DRIVER` | `DriverRoute.tsx` | `DriverLayout.tsx` | Functional | None |
| `/driver/report` | `DRIVER` | `DriverReport.tsx` | `DriverLayout.tsx` | Functional | None |
| `/driver/reports` | `DRIVER` | None | `DriverLayout.tsx` | **CRITICAL DEFECT** | Dead route referenced in `CommandPalette.tsx:72`; renders empty layout shell |
| `/driver/profile` | `DRIVER` | `DriverProfile.tsx` | `DriverLayout.tsx` | Functional | None |
| `/manager/dashboard` | `MANAGER` | `ManagerDashboard.tsx` | `ManagerLayout.tsx` | **CRITICAL DEFECT** | Missing `CheckCircle2` import crashes component on delivered shipments; Quick Actions have broken hash |
| `/manager/fleet` | `MANAGER` | `ManagerFleet.tsx` | `ManagerLayout.tsx` | **Defect** | Quick Action on dashboard navigates to `#/manager/fleet` producing `##/manager/fleet` and throwing user to `/` |
| `/manager/shipments` | `MANAGER` | `ManagerShipments.tsx` | `ManagerLayout.tsx` | **Defect** | Quick Action on dashboard navigates to `#/manager/shipments` throwing user to `/` |
| `/manager/drivers` | `MANAGER` | `ManagerDrivers.tsx` | `ManagerLayout.tsx` | **Defect** | Quick Action on dashboard navigates to `#/manager/drivers` throwing user to `/` |
| `/manager/settings` | `MANAGER` | `ManagerSettings.tsx` | `ManagerLayout.tsx` | Functional | None |
| `/manager/profile` | `MANAGER` | `ManagerProfile.tsx` | `ManagerLayout.tsx` | Functional | None |
| `/admin/*` | `ADMIN` | None | None | **MISSING** | No routing branch or views exist for `ADMIN` role in frontend |

---

## 2. Forensic Findings & Evidence

---

### Finding D-01: Hash vs Pathname Routing Desynchronization on Browser Refresh & Deep Links
- **Severity**: Critical (High Impact on Deep Linking & UX)
- **Affected Files**:
  - `src/context/RouterContext.tsx` (Lines 23–44, 48–62)
  - `src/app/[[...catchAll]]/page.tsx` (Lines 68–130)
- **Direct Evidence**:
  ```tsx
  // src/context/RouterContext.tsx
  function parseHash(): { route: string; params: Record<string, string> } {
    if (typeof window === 'undefined') return { route: '/', params: {} };
    const hash = window.location.hash.slice(1) || '/';
    const route = hash.split('?')[0] || '/';
    ...
  }
  ```
- **Root Cause**:
  Next.js uses a catch-all route `[[...catchAll]]/page.tsx` to handle all pathnames (e.g. `/manager/fleet`). When a user types `http://localhost:3000/manager/fleet` or refreshes the page on a deep link, the browser URL has `pathname = "/manager/fleet"` and `hash = ""`. `RouterContext` only parses `window.location.hash.slice(1) || '/'`, which defaults to `'/'`. As a consequence, direct navigation and page reloads on deep links always redirect the user back to the Landing page (`/`).
- **Remediation Plan**:
  In `RouterContext.tsx`, check both `window.location.hash` and `window.location.pathname`. If `window.location.hash` is empty, initialize `route` from `window.location.pathname` and maintain synchronization via History API (`history.pushState` / `popstate`) or path-aware hash synchronization.

---

### Finding D-02: Double-Hash Quick Action Links in Manager Dashboard Ejecting Users to `/`
- **Severity**: High (Broken Core Navigation)
- **Affected Files**:
  - `src/views/manager/ManagerDashboard.tsx` (Lines 339–355)
  - `src/context/RouterContext.tsx` (Line 66)
- **Direct Evidence**:
  ```tsx
  // src/views/manager/ManagerDashboard.tsx:339-354
  {[{ icon: Package, label: 'New Shipment', hash: '#/manager/shipments' },
    { icon: UserPlus, label: 'Add Driver', hash: '#/manager/drivers' },
    { icon: Map, label: 'View Fleet', hash: '#/manager/fleet' },
    { icon: FileText, label: 'Reports', hash: '' }].map((action) => {
    ...
    onClick={() => {
      if (action.hash) {
        navigate(action.hash);
      } else {
        toast.info('Reports coming soon');
      }
    }}
  ```
  ```tsx
  // src/context/RouterContext.tsx:66
  window.location.hash = path + qs;
  ```
- **Root Cause**:
  `navigate()` expects a route path (e.g., `/manager/fleet`). Passing `'#/manager/fleet'` results in `window.location.hash = '#/manager/fleet'`, producing a browser URL of `http://localhost:3000/##/manager/fleet`. `parseHash()` parses this as `route = '#/manager/fleet'`. In `AppRouter.tsx`, `route.startsWith('/manager')` evaluates to `false`, causing the router to fall through to line 126 (`return <LandingPage />;`). Clicking any Quick Action immediately navigates to the Landing page.
- **Remediation Plan**:
  Change `hash: '#/manager/shipments'` to `path: '/manager/shipments'` (and similarly for drivers and fleet), and pass `action.path` to `navigate()`.

---

### Finding D-03: Missing Import `CheckCircle2` Causing Runtime Crash in Manager Dashboard
- **Severity**: Critical (Frontend Runtime Crash)
- **Affected Files**:
  - `src/views/manager/ManagerDashboard.tsx` (Lines 5–25, Line 162)
- **Direct Evidence**:
  ```tsx
  // src/views/manager/ManagerDashboard.tsx:162
  icon: s.status === 'DELIVERED' ? CheckCircle2 : Package,
  ```
  ```tsx
  // src/views/manager/ManagerDashboard.tsx:5-25 (imports)
  import {
    Truck,
    Clock,
    Navigation,
    PackageCheck,
    Users,
    Building2,
    Play,
    Square,
    Package,
    FileText,
    UserPlus,
    CheckCircle, // <-- Note: CheckCircle imported, NOT CheckCircle2!
    TrendingUp,
    TrendingDown,
    Minus,
    Map,
    BarChart3,
    IndianRupee,
    Inbox,
  } from 'lucide-react';
  ```
- **Root Cause**:
  `CheckCircle2` is referenced on line 162 when generating the activity feed for delivered shipments, but `CheckCircle2` is never imported from `'lucide-react'`. If any shipment has `status === 'DELIVERED'`, rendering the dashboard throws `ReferenceError: CheckCircle2 is not defined` and crashes the dashboard component.
- **Remediation Plan**:
  Import `CheckCircle2` from `'lucide-react'` or replace `CheckCircle2` with the imported `CheckCircle`.

---

### Finding D-04: Dead Route `/driver/reports` in Command Palette
- **Severity**: High (Broken Navigation / Dead Route)
- **Affected Files**:
  - `src/components/shared/CommandPalette.tsx` (Line 72)
  - `src/app/[[...catchAll]]/page.tsx` (Line 102)
  - `src/views/driver/DriverLayout.tsx` (Line 23)
- **Direct Evidence**:
  ```tsx
  // src/components/shared/CommandPalette.tsx:72
  { id: 'd-reports', label: 'Reports', description: 'Submit incident reports', icon: Package, action: () => navigate('/driver/reports'), category: 'Driver' },
  ```
  ```tsx
  // src/app/[[...catchAll]]/page.tsx:98-105
  <ProtectedRoute allowedRoles={['DRIVER']}>
    <DriverLayout title={getPageTitle(route)}>
      {route === '/driver/dashboard' && <DriverDashboard />}
      {route === '/driver/route' && <DriverRoute />}
      {route === '/driver/report' && <DriverReport />}
      {route === '/driver/profile' && <DriverProfile />}
    </DriverLayout>
  </ProtectedRoute>
  ```
- **Root Cause**:
  `CommandPalette.tsx` navigates to plural `/driver/reports`, whereas `AppRouter.tsx` and `DriverLayout.tsx` expect singular `/driver/report`. When selected from the Command Palette, `DriverLayout` renders with no child view, displaying an empty blank layout.
- **Remediation Plan**:
  Update `CommandPalette.tsx` line 72 to `navigate('/driver/report')`. Add route alias handling in `AppRouter.tsx` to map `/driver/reports` to `DriverReport`.

---

### Finding D-05: `<a href="#">` in NotificationBell Resetting Router State to Landing Page
- **Severity**: Medium (Unexpected Redirect to `/`)
- **Affected Files**:
  - `src/components/shared/NotificationBell.tsx` (Lines 360–367)
- **Direct Evidence**:
  ```tsx
  // src/components/shared/NotificationBell.tsx:360-367
  <div className="border-t border-border px-4 py-2.5">
    <a
      href="#"
      className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
    >
      View All Notifications
    </a>
  </div>
  ```
- **Root Cause**:
  Clicking `<a href="#">` sets the browser hash to `#`, triggering `window.onhashchange`. `parseHash()` parses the empty hash as `'/'`, ejecting the active manager or driver to the public Landing page.
- **Remediation Plan**:
  Replace `<a href="#">` with `<button type="button">` with an explicit action handler or route navigation.

---

### Finding D-06: Infinite Skeleton Loading on Direct Deep Link to `/client/track`
- **Severity**: High (UI Freeze / Infinite Loading)
- **Affected Files**:
  - `src/views/client/ClientTrackPage.tsx` (Lines 80, 85–101, 157–176)
- **Direct Evidence**:
  ```tsx
  // src/views/client/ClientTrackPage.tsx:80, 85-87
  const shipmentId = params.id;
  ...
  useEffect(() => {
    if (!shipmentId) return; // <-- Early return without setLoading(false)!
    (async () => {
      ...
      setLoading(false);
    })();
  }, [shipmentId, authState.token]);
  ...
  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        ...
      </div>
    );
  }
  ```
- **Root Cause**:
  When a user opens `/client/track` without an `id` query parameter (e.g. from Command Palette or direct URL), `shipmentId` is undefined. The `useEffect` returns immediately without updating `loading` to `false`. The component remains perpetually in the skeleton loading state.
- **Remediation Plan**:
  Ensure `setLoading(false)` is invoked when `shipmentId` is missing, and render a dedicated shipment selection / search interface when no specific shipment ID is provided. Also add `/client/track` to `ClientLayout.tsx` navigation items.

---

### Finding D-07: Missing ADMIN Role Handling in Frontend Router and Login Redirection
- **Severity**: Medium (RBAC Incompleteness)
- **Affected Files**:
  - `src/app/[[...catchAll]]/page.tsx` (Lines 74–130)
  - `src/views/auth/LoginPage.tsx` (Lines 56–60)
  - `src/types/index.ts` (Line 1)
- **Direct Evidence**:
  ```tsx
  // src/views/auth/LoginPage.tsx:56-60
  const user = await login(email, password);
  if (user.role === 'CLIENT') navigate('/client/dashboard');
  else if (user.role === 'DRIVER') navigate('/driver/dashboard');
  else if (user.role === 'MANAGER') navigate('/manager/dashboard');
  else navigate('/'); // <-- ADMIN role falls through to '/'
  ```
- **Root Cause**:
  `UserRole` type and backend Spring Boot support `ADMIN`, but the frontend `LoginPage` and `AppRouter` do not define an `/admin` branch or map `ADMIN` to the manager/admin workspace.
- **Remediation Plan**:
  Add ADMIN handling in `LoginPage.tsx` and `AppRouter.tsx` (e.g. routing `ADMIN` to `/manager/dashboard` with elevated permissions or dedicated admin views).

---

### Finding D-08: Side-Effect Execution During Render Phase in `ProtectedRoute.tsx`
- **Severity**: Medium (React Anti-Pattern / Cascading Renders)
- **Affected Files**:
  - `src/components/fleet/ProtectedRoute.tsx` (Lines 30–35)
- **Direct Evidence**:
  ```tsx
  // src/components/fleet/ProtectedRoute.tsx:30-35
  if (!state.user || !allowedRoles.includes(state.user.role)) {
    // Redirect unauthorized users to landing
    navigate('/');
    return null;
  }
  ```
- **Root Cause**:
  `navigate('/')` updates `RouterProvider` state during the rendering phase of `ProtectedRoute`. React logs warnings for updating state in another component during render. Furthermore, unauthorized users are sent to `/` rather than `/login` with an intended destination.
- **Remediation Plan**:
  Move redirection into a `useEffect` hook:
  ```tsx
  useEffect(() => {
    if (!state.isLoading && (!state.user || !allowedRoles.includes(state.user.role))) {
      navigate('/login');
    }
  }, [state.isLoading, state.user, allowedRoles, navigate]);
  ```

---

### Finding D-09: Token Expiration Handling & Session Interceptor Gap
- **Severity**: High (Session Degradation / Silent Failure)
- **Affected Files**:
  - `src/context/AuthContext.tsx` (Lines 63–145)
  - `src/lib/backendApi.ts` (Lines 10–86)
- **Direct Evidence**:
  - `AuthContext.tsx` successfully restores sessions on initial load via `POST /api/auth/refresh`.
  - However, across data-fetching views (`ManagerFleet`, `ManagerShipments`, `DriverDashboard`, `ClientDashboard`), raw `fetch()` calls pass `Authorization: Bearer ${authState.token}` directly.
  - If the access token expires while the user is actively using the app, subsequent fetch calls return 401 Unauthorized, triggering `toast.error(t.common.error)` or `ApiContractError`. The application does not attempt silent token refresh on 401.
- **Root Cause**: Absence of a centralized HTTP client or fetch interceptor that handles 401 responses by invoking `/api/auth/refresh` and replaying the failed request.
- **Remediation Plan**:
  Implement an authenticated `apiFetch` utility with automatic 401 retry and refresh-token rotation.

---

### Finding D-10: 5-Second Vehicle Polling Causing Full Map Reconstruction Loop
- **Severity**: High (Map Instability / Zoom & Pan Reset)
- **Affected Files**:
  - `src/views/manager/ManagerFleet.tsx` (Lines 142–168, Lines 200–318)
- **Direct Evidence**:
  ```tsx
  // src/views/manager/ManagerFleet.tsx:142-168
  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/vehicles', ...);
      if (res.ok) {
        const pageData = normalizePageResponse<Vehicle>(rawData);
        setVehicles(pageData.items); // <-- New array reference every 5 seconds
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [...]);

  // src/views/manager/ManagerFleet.tsx:318
  useEffect(() => {
    ...
    // Recreates mapInstance, clears container DOM:
    const container = document.getElementById('fleet-map');
    if (container) { container.innerHTML = ''; ... }
    mapInstance = L.map(mapEl)... / new Map(mapEl)...
  }, [loading, mapReady, vehicles, mapProvider]); // <-- 'vehicles' dependency triggers map rebuild every 5s!
  ```
- **Root Cause**:
  `vehicles` is included in the map initialization `useEffect` dependency array. Every 5 seconds, polling sets a new `vehicles` array reference, triggering the effect, clearing `fleet-map.innerHTML`, destroying map instances, and re-initializing the map from scratch. This causes the map to flicker, lose zoom/center coordinates, and crash Google Maps gesture handlers during user interactions.
- **Remediation Plan**:
  Separate map container initialization (`useEffect` dependent only on `[mapReady, mapProvider]`) from marker updates (`useEffect` dependent on `[vehicles]`). Update existing marker positions in-place without destroying the map instance or resetting zoom/center.

---

### Finding D-11: Login Error Layout Shift & Dark Mode Contrast Defect
- **Severity**: Low (UI / Visual Polish)
- **Affected Files**:
  - `src/views/auth/LoginPage.tsx` (Lines 109–115)
- **Direct Evidence**:
  ```tsx
  // src/views/auth/LoginPage.tsx:109-115
  <div className="min-h-[52px] mb-6">
    {error && (
      <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm h-full flex items-center">
        {error}
      </div>
    )}
  </div>
  ```
- **Root Cause**:
  A fixed `min-h-[52px]` empty space is permanently reserved above the login inputs, creating awkward empty spacing in the default state. Furthermore, `bg-red-50 text-red-700` lacks dark mode classes (`dark:bg-red-950/50 dark:border-red-800 dark:text-red-300`), resulting in harsh, unstyled pink containers in dark theme.
- **Remediation Plan**:
  Use `framer-motion` `<AnimatePresence>` for smooth height animation on error entrance/exit and include dark mode Tailwind classes.

---

### Finding D-12: Placeholder Toast in Production Shipment Drawer
- **Severity**: Low (Incomplete Feature Interaction)
- **Affected Files**:
  - `src/components/shared/ShipmentDetailDrawer.tsx` (Lines 251–253)
- **Direct Evidence**:
  ```tsx
  const handleAssignDriver = () => {
    toast.info('Feature coming soon');
  };
  ```
- **Root Cause**: Unimplemented placeholder action button in `ShipmentDetailDrawer`.
- **Remediation Plan**: Connect the "Assign Driver" button in the drawer to the assignment dialog or reuse the assignment workflow from `ManagerShipments.tsx`.

---

## 3. Summary of Remediation Architecture

```
                                  ┌──────────────────────────┐
                                  │      Next.js CatchAll    │
                                  │ [[...catchAll]]/page.tsx │
                                  └─────────────┬────────────┘
                                                │
                                                ▼
                                  ┌──────────────────────────┐
                                  │   Enhanced RouterContext │
                                  │ Path + Hash Reconciled   │
                                  └─────────────┬────────────┘
                                                │
                  ┌─────────────────────────────┼─────────────────────────────┐
                  ▼                             ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
        │   Public Routes   │         │  Protected (Auth) │         │    Legal Routes   │
        │   / , /login,     │         │ ProtectedRoute    │         │ /privacy, /terms  │
        │   /signup         │         │ (useEffect Guard) │         └───────────────────┘
        └───────────────────┘         └─────────┬─────────┘
                                                │
                  ┌─────────────────────────────┼─────────────────────────────┐
                  ▼                             ▼                             ▼
        ┌───────────────────┐         ┌───────────────────┐         ┌───────────────────┐
        │   CLIENT Branch   │         │   DRIVER Branch   │         │   MANAGER Branch  │
        │ /client/dashboard │         │ /driver/dashboard │         │ /manager/dashboard│
        │ /client/track     │         │ /driver/route     │         │ /manager/fleet    │
        │ /client/profile   │         │ /driver/report    │         │ /manager/shipments│
        └───────────────────┘         │ /driver/profile   │         │ /manager/drivers  │
                                      └───────────────────┘         │ /manager/settings │
                                                                    │ /manager/profile  │
                                                                    └───────────────────┘
```
