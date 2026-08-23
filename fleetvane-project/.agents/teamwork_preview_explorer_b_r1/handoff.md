# Handoff Report — Agent B (Maps, Geolocation & Realtime Explorer)

**Task**: Forensic Code-Level Audit of the FleetVane Map Subsystem (R3.1 – R3.8)  
**Agent Workspace**: `c:\Users\ks919\Downloads\fleetvane-project\.agents\teamwork_preview_explorer_b_r1`  
**Primary Artifact**: `c:\Users\ks919\Downloads\fleetvane-project\.agents\teamwork_preview_explorer_b_r1\analysis.md`  
**Date**: 2026-08-15  

---

## 1. Observation

### R3.1 — Leaflet Reinitialization / Infinite Loop
- In `src/views/manager/ManagerFleet.tsx`:
  - **Lines 144–168**: `setInterval(..., 5000)` calls `setVehicles(pageData.items)` every 5 seconds.
  - **Lines 200–318**: Map `useEffect` dependency array contains `[loading, mapReady, vehicles, mapProvider]`.
  - **Lines 210–214**: On every execution, the effect calls `container.innerHTML = ''; delete (container as any)._leaflet_id;`.
  - **Lines 310–317**: Cleanup function sets `currentProviderRef.current = null;`, bypassing the guard `if (currentProviderRef.current === mapProvider) return;`.
  - **Line 415**: `<div ref={() => setMapReady(true)} ... />` invokes an inline ref callback on every render, updating state repeatedly.
- In `src/views/client/ClientTrackPage.tsx`:
  - **Lines 116–150**: Map initialization `useEffect` depends on `[status, showMap, shipment?.vehicle?.lat, shipment?.vehicle?.lng]`. Every coordinate change destroys and recreates the map after a 150ms timeout.

### R3.2 — Leaflet & Google Maps Memory Leaks
- In `src/views/manager/ManagerFleet.tsx`:
  - **Lines 308–317**: Cleanup only destroys Leaflet (`if (currentProviderRef.current === 'leaflet') { leafletMarkers?.remove(); mapInstance?.remove(); }`). When `mapProvider === 'google'`, `google.maps.Map`, `AdvancedMarkerElement` instances, and listeners are never cleaned up or detached.
  - **Lines 320–372**: `trafficTileRef.current` retains Google `TrafficLayer` across provider switches without cleanup.
  - **Lines 144–168**: Polling `fetch` has no `AbortController` signal; inflight requests resolve after unmount.
- In `src/views/client/ClientTrackPage.tsx`:
  - **Lines 135–149**: `await new Promise((r) => setTimeout(r, 150))` has no cancellation check. If the modal closes before 150ms, `L.map(container)` attaches to an unmounted DOM node.

### R3.3 — Google Maps "Throws Me Out" When Zooming
- In `src/views/manager/ManagerFleet.tsx`:
  - **Lines 301–302**: On every 5-second polling cycle, `mapInstance.fitBounds(bounds, 40)` is executed inside the recreated map effect, resetting zoom from street level back to zoom level 5 (national view).
  - Mixed `@googlemaps/js-api-loader` usage (`setOptions` in `ManagerFleet.tsx:262` vs `new Loader()` in `DriverRoute.tsx:188`) throws uncaught options errors caught by `ErrorBoundary` in `src/app/[[...catchAll]]/page.tsx:141`.

### R3.4 — Provider Switcher (Leaflet ↔ Google)
- In `src/views/manager/ManagerFleet.tsx`:
  - Switching from Leaflet leaves Leaflet DOM class names (`leaflet-container`, etc.) on `div#fleet-map`.
  - Current center coordinates, zoom level, and `selectedVehicle` are lost on provider switch.
  - Controls in lines 494–542 overflow on 375px mobile viewports.

### R3.5 — Map Theme (Light/Dark Mode)
- `src/views/manager/ManagerFleet.tsx:230` hardcodes OpenStreetMap light tiles (`https://{s}.tile.openstreetmap.org/...`).
- Stadia Dark tiles at line 335 were incorrectly attached to the `trafficView` toggle rather than the theme state.
- Google Maps initialization passes no dark mode style JSON or `colorScheme`.

### R3.6 — Google Traffic Layer Toggle
- In `ManagerFleet.tsx:325–352`: Leaflet mode swaps base tiles to Stadia dark tiles without displaying real-time traffic data.
- Google Maps `TrafficLayer` is instantiated but not removed when switching provider from Google to Leaflet while traffic is active.

### R3.7 — Simulation Toggle & Endpoint Integration
- In `src/app/api/simulation/route.ts:5`: `forwardToBackend(req, '/api/simulation/optimize')` calls a non-existent Spring Boot endpoint.
- In `Capstone Project/backend/.../SimulationController.java:10–23`: Only `/api/simulation/seed` and `/api/simulation/move` exist, gated behind `@Profile("demo")`.
- `mini-services/tracking-service/index.ts` is an isolated Socket.IO server on port 3004 with no frontend connection.
- Toggling simulation in `ManagerDashboard.tsx:217` or `DriverRoute.tsx:244` throws an error toast and loses state on navigation.

### R3.8 — Real-Time 5-Second Polling
- `ManagerFleet.tsx:144` polls every 5s but destroys the map on each poll.
- `DriverRoute.tsx` and `ClientTrackPage.tsx` have no polling, leaving coordinates frozen.

---

## 2. Logic Chain

1. **R3.1 & R3.8**: `setVehicles` updates state every 5s → `useEffect` observes new `vehicles` array → runs cleanup (resets `currentProviderRef` to `null`) → runs effect body (wipes container with `innerHTML = ''`, initializes `L.map`) → triggers OpenStreetMap tile fetch → fitBounds resets viewport. **Conclusion**: Map lifecycle must be decoupled into container mount (`[mapProvider]`) and incremental marker updates (`[vehicles]`).
2. **R3.2**: `currentProviderRef.current === 'google'` has no branch in cleanup → `google.maps.Map` and `AdvancedMarkerElement` remain in memory → `trafficTileRef.current` remains attached → unmount leaves background listeners active. **Conclusion**: Both Leaflet and Google Maps require explicit teardown logic and `AbortController` on network requests.
3. **R3.3**: User zooms to level 16 → 5-second interval fires `setVehicles` → map effect tears down and re-executes `mapInstance.fitBounds(bounds, 40)` → user is jerked back to zoom level 5. Additionally, repeated loader `setOptions()` calls throw loader errors that trigger `ErrorBoundary`. **Conclusion**: Decoupling marker updates and normalizing `@googlemaps/js-api-loader` fixes the ejection/reset bug completely.
4. **R3.4**: Leaflet class attributes remain on the container during provider toggle → CSS conflicts occur. Viewport state is not synchronized across providers. **Conclusion**: Container classes must be reset and viewport center/zoom preserved during switch.
5. **R3.5**: No subscription to `next-themes` → light tiles load in dark mode. **Conclusion**: Base tile URL for Leaflet and `colorScheme`/styles for Google Maps must react to theme changes.
6. **R3.6**: Leaflet cannot display Google Traffic; using dark tiles as a substitute is misleading. **Conclusion**: Google traffic layer must only be active in Google Maps mode, with clear provider-aware UI indication.
7. **R3.7**: Frontend sends requests to `/api/simulation`, proxy forwards to non-existent `/api/simulation/optimize`, backend only supports `/seed` and `/move` under `demo` profile. **Conclusion**: Standardize Next.js route `/api/simulation` to manage simulation state and trigger backend position movements.

---

## 3. Caveats

- **External API Keys**: Google Maps requires a valid `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` for live geocoding and rendering. If the key is missing or restricted, the UI must gracefully fall back to Leaflet.
- **Backend Profile**: Spring Boot `SimulationController` is annotated with `@Profile("demo")`. When running in `dev` or `prod` profile, simulation must be handled via Next.js mock or `/api/tracking/vehicles/{id}/location`.
- **WebSocket Tracking Service**: `mini-services/tracking-service` is an optional Socket.IO service. Since the project specification focuses on 5-second HTTP polling, polling remains the primary real-time transport.

---

## 4. Conclusion

The map subsystem issues are caused by architectural anti-patterns:
1. Conflating Map DOM instantiation with vehicle state polling in a single `useEffect`.
2. Asymmetrical cleanup routines for Google Maps vs Leaflet.
3. Uncoordinated `@googlemaps/js-api-loader` initialization styles.
4. Broken API route mapping for `/api/simulation`.

All root causes are fully identified with exact file paths and line numbers. The concrete remediation recipes in `analysis.md` provide an incremental marker reconciliation pattern that completely eliminates the refresh loop, stops the Google Maps zoom reset bug, prevents memory leaks, and delivers reliable 5-second polling.

---

## 5. Verification Method

To independently verify these findings:

1. **Verify Leaflet Reinitialization Loop**:
   - Inspect `src/views/manager/ManagerFleet.tsx` at lines 142–168 and 200–318.
   - Run the frontend and open Network tab on `/manager/fleet`. Note that tile requests occur every 5 seconds in the current code due to the dependency on `vehicles`.
2. **Verify Google Maps Zoom Reset**:
   - In `ManagerFleet.tsx`, toggle to Google Maps and zoom in. Observe that within 5 seconds `fitBounds` is called from line 301.
3. **Verify Simulation Endpoint Failure**:
   - Inspect `src/app/api/simulation/route.ts:5` calling `/api/simulation/optimize`.
   - Inspect `backend/src/main/java/com/fleetvane/simulation/controller/SimulationController.java` to confirm only `/seed` and `/move` exist under `@Profile("demo")`.
