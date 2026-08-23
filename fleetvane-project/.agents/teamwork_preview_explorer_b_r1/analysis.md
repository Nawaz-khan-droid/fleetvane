# FleetVane Map Subsystem: Comprehensive Forensic Code Audit & Remediation Guide

**Audited Subsystem**: Maps, Geolocation, Live Tracking & Simulation Subsystem  
**Consuming Views**: `ManagerFleet.tsx`, `DriverRoute.tsx`, `ClientTrackPage.tsx`, `ManagerDashboard.tsx`, `mini-services/tracking-service`, Next.js API Routes (`/api/simulation`, `/api/vehicles`), Spring Boot Tracking & Simulation Controllers.  
**Auditor**: Agent B (Maps, Geolocation & Realtime Explorer)  
**Date**: 2026-08-15  

---

## Executive Summary & Defect Matrix

| Item | Area | Severity | Root Cause Summary | Impact |
|---|---|---|---|---|
| **R3.1** | Leaflet Reinitialization Loop | **CRITICAL** | `vehicles` state placed in `useEffect` dependency array + cleanup resetting `currentProviderRef` + inline ref callback triggering state updates on every render. | Map completely wiped (`innerHTML = ''`), tiles reloaded, and markers recreated every 5s polling tick. |
| **R3.2** | Memory & Listener Leaks | **CRITICAL** | Google Maps instances, markers, and traffic layers never destroyed on unmount/toggle; async import race conditions; unhandled `setTimeout` in ClientTrack modal; fetch polling missing `AbortController`. | Memory bloat, orphaned Leaflet/Google instances in DOM, unmounted state updates, zombie intervals. |
| **R3.3** | Google Maps Zoom/Pan "Throws Me Out" | **CRITICAL** | 5s polling destroys Google Map instance and executes `fitBounds()`, resetting viewport to zoom 5; mixed `@googlemaps/js-api-loader` invocation styles throw uncaught errors caught by ErrorBoundary. | Any user pan/zoom is violently reset within 5 seconds or crashes the view. |
| **R3.4** | Provider Toggle (Leaflet ↔ Google) | **HIGH** | Incomplete DOM cleanup (Leaflet classes left on container); center/zoom/selected vehicle lost on switch; floating controls clip/overflow on 375px mobile viewports; missing ARIA attributes. | Broken styling on toggle; lost navigation context; difficult interaction on mobile. |
| **R3.5** | Map Theme (Light/Dark Mode) | **HIGH** | Leaflet hardcoded to light OSM tiles; Google Maps lacks dark style configuration; Stadia Dark tiles mistakenly bound to traffic toggle instead of app theme; Leaflet popups lack dark mode styling. | Blinding white map canvases in dark mode; poor contrast on floating map widgets. |
| **R3.6** | Google Traffic Layer Toggle | **MEDIUM** | Leaflet mode substitutes Stadia dark tiles (no live traffic); Google Maps `TrafficLayer` not cleaned up across provider switches; early returns when toggled before async map load. | Fake traffic in Leaflet; traffic toggle breaks or fails to show live flow. |
| **R3.7** | Simulation Toggle & Backend Sync | **HIGH** | Next.js `/api/simulation` proxies to non-existent `/api/simulation/optimize`; Spring Boot `SimulationController` is `@Profile("demo")` only; standalone `tracking-service` unintegrated; simulation state not synced across views. | Toggling simulation produces error toasts; no vehicle coordinates change in DB/UI; state lost on page navigation. |
| **R3.8** | Real-Time 5s Polling Lifecycle | **HIGH** | Polling triggers full map reinitialization; polling missing in `DriverRoute` and `ClientTrackPage`; no `AbortController` on network calls. | Flickering map; missing live coordinates in Driver & Client views; possible state update on unmounted component. |

---

## Detailed Forensic Audit & Root Cause Analysis

---

### R3.1 — Leaflet Map Refresh / Infinite Loop

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 142–168**: 5-second polling interval updates `setVehicles(pageData.items)`.
  ```typescript
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/vehicles', {
          headers: { Authorization: `Bearer ${authState.token}` },
        });
        if (res.ok) {
          const rawData = await res.json();
          const pageData = normalizePageResponse<Vehicle>(rawData);
          setVehicles(pageData.items); // NEW array reference every 5 seconds
          setConnected(true);
        }
      } catch { ... }
    }, 5000);
    return () => clearInterval(interval);
  }, [authState.token]);
  ```
  - **Lines 200–318**: Map Initialization Effect depends on `vehicles`:
  ```typescript
  useEffect(() => {
    if (loading || !mapReady || vehicles.length === 0) return;
    if (currentProviderRef.current === mapProvider) return; // Bypassed because cleanup resets to null

    let mapInstance: any;
    let leafletMarkers: any;
    let isCancelled = false;

    markerRefsRef.current.clear();
    const container = document.getElementById('fleet-map');
    if (container) {
       container.innerHTML = ''; // DOM wiped every 5 seconds!
       delete (container as any)._leaflet_id;
    }
    // ... creates L.map, adds tileLayer, creates markers, calls fitBounds()
    // ...
    return () => {
      isCancelled = true;
      markerRefsRef.current.clear();
      if (currentProviderRef.current === 'leaflet') {
        leafletMarkers?.remove();
        mapInstance?.remove();
      }
      mapRef.current = null;
      currentProviderRef.current = null; // RESETS PROVIDER TO NULL
    };
  }, [loading, mapReady, vehicles, mapProvider]); // <-- 'vehicles' triggers teardown/rebuild every 5s!
  ```
  - **Line 415**: Inline ref callback updates state on every render:
  ```tsx
  <div
    ref={() => setMapReady(true)} // <-- Inline function runs on every render with null then element
    id="fleet-map"
    className={`${theme.map.containerFixed} relative dark:border-slate-700`}
  >
  ```
- **File**: `src/views/client/ClientTrackPage.tsx`
  - **Lines 116–150**: Map initialization effect depends on `[status, showMap, shipment?.vehicle?.lat, shipment?.vehicle?.lng]`. Any coordinate update tears down `map?.remove()` and runs `setTimeout(150)` to recreate the whole map.

#### 2. Root Cause Chain
1. Polling interval executes every 5 seconds, calls `setVehicles(pageData.items)` with a freshly allocated array.
2. React detects `vehicles` dependency reference change in `useEffect(..., [loading, mapReady, vehicles, mapProvider])`.
3. React executes effect cleanup: calls `mapInstance.remove()`, empties `markerRefsRef`, and sets `currentProviderRef.current = null`.
4. React runs effect body: since `currentProviderRef.current` is `null`, it passes the guard `if (currentProviderRef.current === mapProvider) return;`.
5. Code clears container via `container.innerHTML = ''`, reloads Leaflet, instantiates a brand new `L.map`, re-downloads map tiles from OpenStreetMap, creates all marker DOM nodes, and calls `fitBounds()`.
6. Inline ref callback `ref={() => setMapReady(true)}` fires on each re-render, contributing to render instability.

---

### R3.2 — Leaflet & Map Memory Leaks

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 308–317**:
  ```typescript
  return () => {
    isCancelled = true;
    markerRefsRef.current.clear();
    if (currentProviderRef.current === 'leaflet') {
      leafletMarkers?.remove();
      mapInstance?.remove();
    }
    // NOTICE: When currentProviderRef.current === 'google', NOTHING IS CLEANED UP!
    mapRef.current = null;
    currentProviderRef.current = null;
  };
  ```
  - **Lines 320–372**: `trafficTileRef.current` retains Google `TrafficLayer` or Leaflet `TileLayer` without unmount cleanup.
  - **Lines 144–167**: `fetch('/api/vehicles')` in `setInterval` has no `AbortController`. If component unmounts while request is inflight, completion calls `setVehicles` on unmounted component.
- **File**: `src/views/client/ClientTrackPage.tsx`
  - **Lines 123–149**:
  ```typescript
  (async () => {
    const L = (await import('leaflet')).default;
    // ...
    await new Promise((r) => setTimeout(r, 150)); // No cancellation check after timeout!
    const container = document.getElementById('track-map');
    if (!container) return;
    map = L.map(container).setView([vehicleLat, vehicleLng], 10);
    // ...
  })();

  return () => {
    map?.remove(); // If dialog closed before 150ms timeout resolves, map is undefined, and cleanup does nothing!
  };
  ```

#### 2. Root Cause Chain
1. When Google Maps is selected in `ManagerFleet.tsx`, switching away or unmounting leaves the `google.maps.Map` instance, `google.maps.marker.AdvancedMarkerElement` markers, and event listeners active in memory.
2. In `ClientTrackPage.tsx`, closing the modal within 150ms of opening causes the unmount cleanup to run when `map` is still `undefined`. When the promise resolves, `L.map(container)` attaches to a detached container, permanently leaking the Leaflet instance and DOM listeners.
3. Inflight polling fetches lack abort signals, causing memory leaks and unmounted state update warnings.

---

### R3.3 — Google Maps "Throws Me Out" When Zooming

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 259–306**:
  ```typescript
  (async () => {
    const { setOptions, importLibrary } = await import('@googlemaps/js-api-loader');
    if (isCancelled) return;
    setOptions({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
    });
    const { Map } = (await importLibrary('maps')) as google.maps.MapsLibrary;
    const { AdvancedMarkerElement } = (await importLibrary('marker')) as google.maps.MarkerLibrary;
    // ...
    mapInstance = new Map(mapEl, {
      center: { lat: 22.5, lng: 79.0 },
      zoom: 5,
      mapId: 'DEMO_MAP_ID',
      disableDefaultUI: true,
      zoomControl: true,
    });
    // ...
    if (vehicles.length > 0) {
      mapInstance.fitBounds(bounds, 40); // <-- RESETS VIEWPORT ON EVERY POLL!
    }
    mapRef.current = mapInstance;
    currentProviderRef.current = 'google';
  })();
  ```
- **File**: `src/views/driver/DriverRoute.tsx`
  - **Lines 185–194**: Uses `new Loader({ ... })` while `ManagerFleet.tsx` uses `setOptions(...)`. In `@googlemaps/js-api-loader` v2, calling `setOptions` after a `Loader` has loaded throws: `Loader options have already been set. Use reset() before calling setOptions()`.
- **File**: `src/components/shared/ErrorBoundary.tsx` & `src/app/[[...catchAll]]/page.tsx`
  - Uncaught loader rejections or Google Maps API key errors bubble up to `ErrorBoundary`, resetting the entire route tree or kicking user to root view.

#### 2. Root Cause Chain
1. **Primary Viewport Ejection Cause**: When the user zooms in or pans on Google Maps, 5-second polling triggers `setVehicles`. Because `vehicles` is in the map `useEffect` dependency list, React tears down the Google Map instance and re-instantiates it, immediately calling `mapInstance.fitBounds(bounds, 40)`. The map violently resets from user's zoom (e.g. 16) back to zoom 5 (all-India bounds).
2. **Crash / Route Reset Cause**: When switching routes or remounting, `@googlemaps/js-api-loader` throws if `setOptions` is re-called with existing options. Uncaught errors in async effects or invalid API keys trigger `ErrorBoundary`, which unmounts the dashboard.
3. **Gesture Conflict**: Without `gestureHandling: 'cooperative'` or `'greedy'`, trackpad/mousewheel zoom gestures collide with browser scroll events.

---

### R3.4 — Map Provider Toggle (Leaflet ↔ Google)

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 208–215**:
  ```typescript
  markerRefsRef.current.clear();
  const container = document.getElementById('fleet-map');
  if (container) {
     container.innerHTML = '';
     delete (container as any)._leaflet_id;
  }
  ```
  Leaflet attaches CSS classes (`leaflet-container`, `leaflet-touch`, `leaflet-fade-anim`, etc.) directly to `div#fleet-map`. Clearing `innerHTML` leaves class names intact, which breaks Google Maps DOM layout and mouse pointer coordinates.
  - **Lines 516–529**: Toggle buttons:
  ```tsx
  <div className="flex items-center gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-lg">
    <button
      onClick={() => setMapProvider('leaflet')}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'leaflet' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-200'}`}
    >
      Leaflet
    </button>
    <button
      onClick={() => setMapProvider('google')}
      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${mapProvider === 'google' ? 'bg-white dark:bg-slate-700 shadow-sm text-emerald-600 dark:text-emerald-400' : 'text-slate-600 hover:text-slate-800 dark:hover:text-slate-200'}`}
    >
      Google Maps
    </button>
  </div>
  ```
  - **Lines 494–542**: Overlay toolbar container:
  `className="absolute bottom-4 left-4 z-[1000] flex flex-wrap items-center gap-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200/50 dark:border-slate-700/50"`
  On mobile devices (375px width), this overlay overflows horizontally and clips against map controls.

#### 2. Root Cause Chain
1. When switching from Leaflet to Google, Leaflet classes remain on the container, causing styling collisions.
2. User's current center, zoom level, and selected vehicle are discarded during toggle; the map always resets to default nationwide center `[22.5, 79.0]`.
3. Buttons lack `role="tab"`, `aria-selected`, or `aria-label` accessibility attributes.

---

### R3.5 — Map Theme (Light/Dark Mode)

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 230–234**:
  ```typescript
  const standardTiles = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    { attribution: '&copy; OpenStreetMap' }
  ).addTo(mapInstance);
  ```
  OpenStreetMap tiles are hardcoded light mode tiles. When user switches the UI to Dark Mode, the map remains bright white.
  - **Lines 334–337**: Stadia Dark tiles were incorrectly hardcoded into the *Traffic* toggle instead of being the dark mode base map:
  ```typescript
  const darkTiles = L.tileLayer(
    'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png',
    { attribution: '&copy; Stadia Maps' }
  ).addTo(map);
  ```
  Stadia Maps requires an API key in production, resulting in 403 / broken tiles for unauthenticated requests.
- **File**: `src/views/driver/DriverRoute.tsx` & `src/views/client/ClientTrackPage.tsx`
  - Leaflet maps only render OpenStreetMap light tiles.
  - Google Maps initialization passes no `styles` or `colorScheme: 'DARK'` configuration.

#### 2. Root Cause Chain
1. Neither Leaflet nor Google Maps components subscribe to the `next-themes` theme context (`theme === 'dark'`).
2. CartoDB Dark Matter / Stadia Dark tiles are never applied based on theme state.
3. Leaflet popups lack dark mode CSS styling (white background with un-inverted text).

---

### R3.6 — Google Traffic Layer Toggle

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 325–352**:
  ```typescript
  if (mapProvider === 'leaflet') {
    if (trafficView) {
      // Swapping standard tile layer with Stadia Dark tiles
      const darkTiles = L.tileLayer('https://tiles.stadiamaps.com/...').addTo(map);
      trafficTileRef.current = darkTiles;
    }
  }
  ```
  In Leaflet mode, the "Show Traffic" toggle simply loads a dark map style. There is no real-time traffic flow data.
  - **Lines 354–371**:
  ```typescript
  if (!trafficTileRef.current) {
     trafficTileRef.current = new google.maps.TrafficLayer();
  }
  trafficTileRef.current.setMap(map);
  ```
  When switching from Google to Leaflet while traffic is ON, `trafficTileRef.current` is not cleaned up from the Google map instance.

#### 2. Root Cause Chain
1. Leaflet does not have native Google Traffic layer support. Swapping base tiles creates a fake/confusing user experience.
2. In Google Maps mode, `google.maps.TrafficLayer` instance lifecycle is not decoupled from map provider switching, resulting in memory leaks or stale layers.

---

### R3.7 — Simulation Toggle & Endpoint Integration

#### 1. Exact Code Evidence
- **File**: `src/app/api/simulation/route.ts`
  - **Lines 4–16**:
  ```typescript
  export async function POST(req: NextRequest) {
    const response = await forwardToBackend(req, '/api/simulation/optimize');
    return NextResponse.json(response.data, {
      status: response.status,
      headers: response.headers
    });
  }
  ```
  Proxies to `/api/simulation/optimize`, which does not exist in Spring Boot.
- **File**: `backend/src/main/java/com/fleetvane/simulation/controller/SimulationController.java`
  - **Lines 10–23**:
  ```java
  @RestController
  @RequestMapping("/api/simulation")
  @Profile("demo")
  public class SimulationController {
      @PostMapping("/seed")
      public ResponseEntity<String> seedDemoData() { ... }

      @PostMapping("/move")
      public ResponseEntity<String> advanceVehicles() { ... }
  }
  ```
  Spring Boot has NO `/api/simulation/optimize` endpoint. Furthermore, `SimulationController` is gated behind `@Profile("demo")`. If the backend runs in `dev` or `prod` profile, Spring Boot returns 404.
- **File**: `mini-services/tracking-service/index.ts`
  - Runs a standalone Node.js Socket.IO server on port 3004 with waypoint movement, but the Next.js frontend never connects to port 3004.
- **File**: `src/views/manager/ManagerDashboard.tsx` (lines 217–233) & `src/views/driver/DriverRoute.tsx` (lines 244–260)
  - `handleSimToggle` and `handleTripToggle` send `POST /api/simulation` with `{ action: 'start' }`.
  - The request fails with 404/500, catching an exception and firing `toast.error(t.common.error)`.
  - Simulation state is not saved in backend; navigating between tabs resets `simulating` to `false`.

#### 2. Root Cause Chain
1. Backend-frontend contract mismatch: Next.js proxy calls `/api/simulation/optimize`, while Spring Boot only has `/api/simulation/seed` and `/api/simulation/move` (under demo profile).
2. Toggling simulation fails with HTTP 404 / 500 error toast.
3. No simulation status endpoint exists to synchronize state across manager and driver views.

---

### R3.8 — Real-Time 5-Second Polling Lifecycle

#### 1. Exact Code Evidence
- **File**: `src/views/manager/ManagerFleet.tsx`
  - **Lines 142–168**: Polling runs every 5000ms.
  - Updates `vehicles` state, which triggers the map destruction loop in R3.1.
- **File**: `src/views/driver/DriverRoute.tsx`
  - **Lines 65–110**: Fetches route data once on mount; **no 5-second polling interval exists**.
  - If a driver starts a trip or vehicle moves, coordinates on the map never update.
- **File**: `src/views/client/ClientTrackPage.tsx`
  - **Lines 85–101**: Fetches shipment once on mount; **no 5-second polling interval exists**.
  - When the client opens the "Track Live" modal, vehicle coordinates remain static.

#### 2. Root Cause Chain
1. `ManagerFleet` polling updates trigger full map rebuilds instead of updating marker positions in-place.
2. `DriverRoute` and `ClientTrackPage` lack real-time polling, leaving their map views frozen.
3. Polling lacks `AbortController` cleanup on unmount.

---

## Architectural Remediation Plan & Code Recipes

---

### Remediation Recipe 1: Map Core Decoupling & Marker Reconciliation

#### Architecture Pattern
Separate Map Lifecycle into 3 distinct hooks / effects:
1. **Map Container Initialization (`useEffect` with `[mapProvider, theme]`)**: Runs ONCE on mount and when provider or theme changes. Creates the map instance and tile layer.
2. **Marker Reconciliation (`useEffect` with `[vehicles]`)**: Runs whenever `vehicles` array updates. Updates existing marker coordinates via `marker.setLatLng()` (Leaflet) or `marker.position` (Google Maps) without rebuilding the map.
3. **Viewport Bounds (`fitBounds` on initial load only)**: Fits bounds only on first successful vehicle fetch, not on subsequent polling updates.

#### Exact Code Recipe for `ManagerFleet.tsx`

```typescript
// ── Ref declarations ──
const mapContainerRef = useRef<HTMLDivElement>(null);
const mapInstanceRef = useRef<any>(null);
const markerGroupRef = useRef<any>(null); // Leaflet LayerGroup
const markerMapRef = useRef<Map<string, any>>(new Map()); // vehicleId -> Marker instance
const initialFitDoneRef = useRef(false);
const trafficLayerRef = useRef<any>(null);
const abortControllerRef = useRef<AbortController | null>(null);

// ── 1. Map Initialization Effect (Teardown only on provider switch or unmount) ──
useEffect(() => {
  let isCancelled = false;
  const container = mapContainerRef.current;
  if (!container) return;

  // Clean up previous map cleanly
  if (mapInstanceRef.current) {
    if (currentProviderRef.current === 'leaflet') {
      mapInstanceRef.current.remove();
    } else if (currentProviderRef.current === 'google') {
      // Clear Google Maps markers
      markerMapRef.current.forEach((marker) => {
        if (marker.map) marker.map = null;
      });
    }
    mapInstanceRef.current = null;
  }
  markerMapRef.current.clear();
  container.innerHTML = '';
  // Clean all Leaflet residual classes
  container.className = `${theme.map.containerFixed} relative dark:border-slate-700`;
  delete (container as any)._leaflet_id;

  if (mapProvider === 'leaflet') {
    (async () => {
      const L = (await import('leaflet')).default;
      if (isCancelled || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [22.5, 79.0],
        zoom: 5,
        zoomControl: true,
      });

      // Dark mode / Light mode tile layer selection
      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      
      const attribution = isDark
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; OpenStreetMap contributors';

      L.tileLayer(tileUrl, { attribution, maxZoom: 19 }).addTo(map);

      const markerGroup = L.layerGroup().addTo(map);
      markerGroupRef.current = markerGroup;
      mapInstanceRef.current = map;
      currentProviderRef.current = 'leaflet';
      setMapReady(true);
    })();
  } else {
    (async () => {
      const { Loader } = await import('@googlemaps/js-api-loader');
      if (isCancelled || !mapContainerRef.current) return;

      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });

      const { Map } = await loader.importLibrary('maps');
      if (isCancelled || !mapContainerRef.current) return;

      const isDark = document.documentElement.classList.contains('dark');
      const map = new Map(mapContainerRef.current, {
        center: { lat: 22.5, lng: 79.0 },
        zoom: 5,
        mapId: 'FLEETVANE_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        ...(isDark ? { colorScheme: 'DARK' as any } : {}),
      });

      mapInstanceRef.current = map;
      currentProviderRef.current = 'google';
      setMapReady(true);
    })();
  }

  return () => {
    isCancelled = true;
    if (mapInstanceRef.current) {
      if (currentProviderRef.current === 'leaflet') {
        mapInstanceRef.current.remove();
      } else if (currentProviderRef.current === 'google') {
        markerMapRef.current.forEach((marker) => {
          if (marker.map) marker.map = null;
        });
      }
      mapInstanceRef.current = null;
    }
    markerMapRef.current.clear();
    currentProviderRef.current = null;
  };
}, [mapProvider]);

// ── 2. Incremental Marker Reconciliation (No map rebuild!) ──
useEffect(() => {
  const map = mapInstanceRef.current;
  if (!map || vehicles.length === 0) return;

  if (mapProvider === 'leaflet') {
    import('leaflet').then((LModule) => {
      const L = LModule.default;
      const markerGroup = markerGroupRef.current;
      if (!markerGroup) return;

      const activeIds = new Set<string>();

      vehicles.forEach((v) => {
        activeIds.add(v.id);
        const color = markerColor(v.status);
        const existingMarker = markerMapRef.current.get(v.id);

        if (existingMarker) {
          // Smoothly update position without recreating
          existingMarker.setLatLng([v.lat, v.lng]);
        } else {
          // Create marker once
          const icon = L.divIcon({
            html: `<div class="vehicle-dot" style="width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.3s ease"></div>`,
            className: '',
            iconSize: [14, 14],
            iconAnchor: [7, 7],
          });
          const marker = L.marker([v.lat, v.lng], { icon }).addTo(markerGroup);
          marker.on('click', () => setSelectedVehicle(v));
          markerMapRef.current.set(v.id, marker);
        }
      });

      // Remove stale markers
      markerMapRef.current.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          markerGroup.removeLayer(marker);
          markerMapRef.current.delete(id);
        }
      });

      // Fit bounds only once on first load
      if (!initialFitDoneRef.current && vehicles.length > 0) {
        const bounds = L.latLngBounds(vehicles.map((v) => [v.lat, v.lng]));
        map.fitBounds(bounds, { padding: [40, 40] });
        initialFitDoneRef.current = true;
      }
    });
  } else if (mapProvider === 'google') {
    import('@googlemaps/js-api-loader').then(async ({ Loader }) => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
      });
      const { AdvancedMarkerElement } = await loader.importLibrary('marker');
      const activeIds = new Set<string>();

      vehicles.forEach((v) => {
        activeIds.add(v.id);
        const existingMarker = markerMapRef.current.get(v.id);

        if (existingMarker) {
          existingMarker.position = { lat: v.lat, lng: v.lng };
        } else {
          const color = markerColor(v.status);
          const dot = document.createElement('div');
          dot.className = 'vehicle-dot';
          dot.style.cssText = `width:14px;height:14px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);transition:transform 0.3s ease`;

          const marker = new AdvancedMarkerElement({
            map,
            position: { lat: v.lat, lng: v.lng },
            content: dot,
          });

          marker.addListener('click', () => setSelectedVehicle(v));
          markerMapRef.current.set(v.id, marker);
        }
      });

      // Remove stale markers
      markerMapRef.current.forEach((marker, id) => {
        if (!activeIds.has(id)) {
          marker.map = null;
          markerMapRef.current.delete(id);
        }
      });

      // Fit bounds only once on initial load
      if (!initialFitDoneRef.current && vehicles.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        vehicles.forEach((v) => bounds.extend({ lat: v.lat, lng: v.lng }));
        map.fitBounds(bounds, 40);
        initialFitDoneRef.current = true;
      }
    });
  }
}, [vehicles, mapProvider]);
```

---

### Remediation Recipe 2: Google Traffic Layer Integration

```typescript
useEffect(() => {
  const map = mapInstanceRef.current;
  if (!map) return;

  if (mapProvider === 'google') {
    if (trafficView) {
      if (!trafficLayerRef.current) {
        trafficLayerRef.current = new google.maps.TrafficLayer();
      }
      trafficLayerRef.current.setMap(map);
    } else {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    }
  } else {
    // In Leaflet mode, clean up any Google traffic layer
    if (trafficLayerRef.current) {
      trafficLayerRef.current.setMap(null);
      trafficLayerRef.current = null;
    }
  }
}, [trafficView, mapProvider]);
```

---

### Remediation Recipe 3: Simulation Endpoint Alignment

1. Update `src/app/api/simulation/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { forwardToBackend } from '@/lib/backendApi';

// In-memory simulation state for Next.js fallback
let simulationActive = false;

export async function GET(req: NextRequest) {
  return NextResponse.json({ active: simulationActive });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action; // 'start' | 'stop'

    if (action === 'start') {
      simulationActive = true;
      // Trigger Spring Boot demo move or seed if available
      await forwardToBackend(req, '/api/simulation/move', { method: 'POST' });
    } else {
      simulationActive = false;
    }

    return NextResponse.json({ success: true, active: simulationActive });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Simulation error' },
      { status: 500 }
    );
  }
}
```

---

### Remediation Recipe 4: Leak-Free 5-Second Vehicle Polling

```typescript
useEffect(() => {
  if (!authState.token) return;

  const controller = new AbortController();

  const pollVehicles = async () => {
    try {
      const res = await fetch('/api/vehicles', {
        headers: { Authorization: `Bearer ${authState.token}` },
        signal: controller.signal,
      });
      if (res.ok) {
        const rawData = await res.json();
        const pageData = normalizePageResponse<Vehicle>(rawData);
        setVehicles(pageData.items);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setConnected(false);
      }
    }
  };

  const interval = setInterval(pollVehicles, 5000);
  // Initial fetch
  pollVehicles();

  return () => {
    clearInterval(interval);
    controller.abort();
  };
}, [authState.token]);
```

---

## Verification & QA Strategy

1. **Leaflet Refresh Loop Test**:
   - Navigate to `/manager/fleet`.
   - Monitor network tab: exactly ONE tile load batch occurs on mount.
   - Watch console: NO tile reload requests every 5 seconds.
   - Vehicle dots move or update state smoothly without map flash or DOM redraw.
2. **Google Maps Zoom/Pan Stability Test**:
   - Switch map provider to Google Maps.
   - Zoom in to street level (zoom 16) on any vehicle.
   - Pan around continuously for 30 seconds (across 6 polling cycles).
   - Verify that zoom level and center coordinates remain exactly where the user positioned them without resetting or jerking.
3. **Provider Toggle Test**:
   - Switch back and forth between Leaflet and Google Maps 10 times.
   - Verify no lingering DOM nodes, no container class pollution, and zero memory leaks.
4. **Theme Switch Test**:
   - Toggle dark mode via theme switcher.
   - Verify Leaflet switches to CartoDB dark tiles; Google Maps applies dark styling; popups and legend maintain high contrast.
5. **Traffic & Simulation Toggle Test**:
   - Toggle Google Traffic layer: verify colored traffic flow lines appear on roads in Google mode.
   - Toggle Simulation: verify HTTP 200 response, status indicator reflects active state, and vehicle coordinates advance.
