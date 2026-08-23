# Original User Request

## 2026-08-15T14:16:15Z

# FleetVane Teamwork Project — Comprehensive Production QA, UI/UX Audit & Remediation

> Status: Launched
> Objective: Perform a complete evidence-based audit of the FleetVane application, identify all remaining defects across frontend, backend integration, maps, navigation, state management, API contracts, responsiveness, and user experience, then FIX the defects and regression-test the fixes.
>
> Do NOT stop at "build passes", "HTTP 200", "route exists", or "component renders".
>
> The application must behave like a polished modern SaaS product, not a capstone prototype with fragile integrations, fake states, dead pages, unstable maps, or visually inconsistent controls.

## Working Directory

```text
c:\Users\ks919\Downloads\fleetvane-project
```

The frontend is integrated with the FleetVane Spring Boot modular-monolith backend.

Do NOT recreate the frontend.
Do NOT replace the existing reference UI.
Do NOT introduce a second frontend architecture.
Do NOT reintroduce Prisma, SQLite, mock databases, or local persistence.

Treat the existing fleetvane-project UI as the visual/interaction baseline and improve it without destroying its existing design language.

## CORE QA RULE

For every feature, determine all of the following:
- Does it work?
- Is the implementation correct?
- Does it use the correct backend contract?
- Is the state lifecycle correct?
- Does it recover from failure?
- Does it behave correctly after navigation?
- Does it behave correctly after refresh/reload?
- Does it behave correctly on mobile?
- Does it behave correctly in light and dark mode?
- Does it leak memory/listeners/timers?
- Does it produce stale state?
- Does it create duplicate requests?
- Does it silently hide backend failures?
- Does it contain fake/mock behavior?

Do not infer correctness from the existence of code.
Do not claim a feature is complete because the route returns 200.
Do not stop after fixing the first discovered issue.

## TEAM STRUCTURE

Use multiple agents/subagents where useful.

At minimum, run separate audits for:

- **Agent A — Frontend / UX**
  Audit all client, manager, driver, admin and public views.

- **Agent B — Maps / Geolocation / Realtime**
  Focus exclusively on Leaflet, Google Maps, traffic, provider switching, polling, marker lifecycle, cleanup, GPS, and simulation.

- **Agent C — API Contract / Backend Alignment**
  Inspect Spring Boot controllers, DTOs, pagination, ownership, error responses, Next.js proxies, and frontend parsing.

- **Agent D — Security / Session / Navigation**
  Audit authentication, authorization, session restoration, logout, redirects, protected routes, role navigation, and stale state.

- **Agent E — QA / Regression**
  Run the complete test matrix after fixes and search for regressions.

Agents must report:
- exact evidence
- root cause
- affected files/components
- severity
- fix applied
- verification result

Do NOT produce vague recommendations.

## R1 — COMPLETE UI/UX AUDIT

Audit every view:
- **Public**: Landing, Login, Signup, Privacy, Terms
- **ADMIN**: all admin/system views
- **MANAGER**: Dashboard, Fleet, Shipments, Drivers, Settings, Profile
- **DRIVER**: Dashboard, Route, Report, Profile
- **CLIENT**: Dashboard, Track, Profile

For every page test:
- 375px mobile
- 768px tablet
- 1440px desktop
- light theme
- dark theme

Check:
- horizontal overflow, overlapping elements, clipped content, invisible text, invisible icons, incorrect contrast, broken hover states, broken focus states, unstable form heights, layout jumps, bad spacing, broken dialogs, incorrect drawers, broken tables, missing pagination, stale UI, dead buttons, fake links, placeholder content, empty sections, inconsistent cards, inconsistent typography, poor loading states, poor error states, poor empty states

DO NOT redesign for the sake of redesigning. Preserve the reference UI's identity. Only make changes that improve clarity, usability, correctness, or consistency.

## R2 — NAVIGATION & ROUTING AUDIT

Navigation is currently suspected to be incomplete/inconsistent. Audit every navigation path.

Check:
- logo navigation, sidebar navigation, top navbar, profile navigation, settings, dashboard links, breadcrumbs, back buttons, logout, CTA links, deep links, browser refresh on deep links

Verify:
- correct role → correct destination
- wrong role → blocked correctly
- unauthenticated → login
- logout → no protected page remains accessible

Search for:
`navigate(`, `router.push(`, `router.replace(`, `window.location`, `href=` and build a route graph.

Detect:
- dead routes, duplicated routes, route loops, links to stale pages, links to nonexistent pages, links that unexpectedly throw users back to /, pages reachable only through one broken path

Every visible navigation item must lead to a meaningful page.

## R3 — MAP SYSTEM: FULL FORENSIC AUDIT

This is a HIGH PRIORITY subsystem. Do NOT assume the current map implementation is correct.

Audit BOTH:
- Leaflet / OpenStreetMap
- Google Maps
and all map-consuming views (Manager Fleet, Driver Route, Client Track, etc.).

### R3.1 — Leaflet Map Refresh / Infinite Loop
Investigate why the Leaflet map appears to repeatedly refresh/reinitialize. Determine whether the cause is:
- useEffect dependency loop, state update inside effect, map instance recreated after every render, marker state triggering map reconstruction, polling triggering full map reconstruction, provider state toggling, component key changes, React Strict Mode double initialization, cleanup/remount bug, stale closure, map container recreation, repeated tile layer setup, repeated route/polyline setup.

Use runtime evidence (mount count, effect execution, map instance count, marker count, network request count, tile requests, polling count, cleanup count). The map must NOT continuously recreate itself.
Expected behavior: mount once, initialize once, update markers without recreating map, update route without recreating map, cleanup once on unmount.

### R3.2 — Leaflet Memory Leak Audit
Inspect: timers, setInterval, setTimeout, event listeners, map listeners, geolocation watchers, marker instances, polylines, subscriptions. Every resource must have cleanup. Especially inspect the 5-second vehicle/location polling.
Expected: Component mount → exactly one polling interval; Component unmount → interval cleared; Component remount → exactly one new interval. No duplicate polling, no stale updates after unmount, no request storm.

### R3.3 — Google Maps "Throws Me Out" When Zooming
Investigate exactly why Google Maps navigation/zooming causes the user to be kicked out of the page, reset, crash, rerender, or otherwise leave the current map state.
Do NOT assume the cause. Determine whether it is caused by React rerender, map state update, event listener, controlled center/zoom, provider toggle, route state, key prop, component remount, API loader reinitialization, marker update, stale map instance, navigation callback accidentally triggered, error boundary, authentication state reset, location polling, map options recreation.
Reproduce: Open Google Maps, zoom in, zoom out, pan, change center, toggle traffic, toggle provider, wait for realtime update. Observe whether map remounts, page route changes, UI resets, auth state resets, browser navigates, error boundary fires, console error appears. Fix the ROOT CAUSE.

### R3.4 — Map Provider Toggle
The map provider toggle currently has usability/visibility problems.
Verify: Leaflet → Google, Google → Leaflet, without losing location state, selected vehicle, route, zoom unnecessarily, duplicating map instances/markers, leaking listeners, breaking authentication, crashing the page.
The toggle must be clearly visible and work in light mode, dark mode, mobile, tablet, and desktop, with active/inactive styles, hover, focus, and accessible labels.

### R3.5 — Map Theme / Light-Dark Mode
Verify whether Leaflet light/dark and Google light/dark behave correctly.
The map provider must respond correctly to theme changes where supported. Check tiles, controls, popups, markers, route lines, map labels, traffic layer, floating toolbar, controls. No black-on-black or white-on-white controls.

### R3.6 — Google Traffic Layer
The "Show Traffic" toggle must be functional.
Test: OFF → no traffic layer; ON → traffic layer visible; OFF again → traffic layer removed.
Also test: Google Maps only, Leaflet mode, light/dark. Do NOT show a traffic toggle in a provider mode where traffic is unsupported unless the UI clearly communicates that limitation. Verify actual Google Maps traffic behavior rather than merely changing a boolean.

### R3.7 — Simulation Toggle
Audit the simulation toggle independently.
Determine: what endpoint it calls, whether backend simulation is enabled, whether profile restrictions apply, whether UI state matches backend state, whether turning it on actually changes vehicle positions, whether turning it off stops updates, whether repeated toggles create duplicate intervals, whether errors are shown, whether the toggle visually reflects state.
Test: OFF → ON, ON → OFF, ON → page navigation → back, ON → browser refresh, backend unavailable, simulation endpoint unavailable. Do not leave a toggle that visually changes but has no meaningful effect.

### R3.8 — Real-Time Location Polling
Audit the 5-second polling. Verify one interval, one request every 5 seconds, cleanup on unmount, no duplicated intervals, no requests after leaving page, no race-condition state updates.
Check whether polling causes map reinitialization. It should update vehicle positions, markers, and selected vehicle without rebuilding the entire map.

## R4 — API CONTRACT FORENSIC AUDIT

Inspect every Spring Boot controller and matching Next.js API proxy.
Build endpoint-to-frontend mapping for users, vehicles, shipments, drivers, incidents, tracking, routes, optimization jobs, and simulation.
Explicitly verify Spring Page<T> responses. Frontend must not assume response = array when backend returns `{ content: [], totalElements: ... }`. Use a strict typed boundary. If response shape is invalid, throw `ApiContractError`. Do NOT silently convert malformed data into `[]`. HTML returned from an API path is ALWAYS an API routing defect and must be fixed.

## R5 — MISSING / STALE API ROUTES

Check that every frontend API path actually exists: `/api/vehicles`, `/api/shipments`, `/api/drivers`, `/api/incidents`, `/api/tracking`, `/api/routes`, `/api/auth`. No API path may fall through to the Next.js HTML catch-all. A request returning HTML when JSON was expected is a FAIL.

## R6 — AUTHENTICATION / SESSION

Audit: signup, login, refresh, logout, session restoration, browser refresh, expired access token, refresh-token reuse, disabled user, wrong password, unknown email. Pay particular attention to login errors causing layout jumps, unexpected redirects, navigation to /, session loss when switching map providers, refresh loops, cookies, access token state.

## R7 — DATA PERSISTENCE

Investigate any claim that users or data disappeared. Determine active database URL, active profile, H2 fallback, Supabase database, Flyway state, DataInitializer, demo/dev seed behavior.
Production MUST NOT silently fall back to H2. If production database configuration is absent, application startup must fail clearly. Do NOT silently start against an empty in-memory database. Never delete or reset user data as part of QA.

## R8 — STALE / EMPTY / FAKE PAGES

Scan all frontend source for: `TODO`, `FIXME`, placeholder, coming soon, mock, fake, dummy, sample, `setTimeout`, hardcoded statistics, fake API result. Also inspect every route that appears in navigation. A page is only complete when it has real content, real data integration, loading state, empty state, error state, working interactions. Do not keep fake footer links or navigation items.

## R9 — FRONTEND RUNTIME CRASH AUDIT

Search for and eliminate patterns such as: `X.map is not a function`, `X.filter is not a function`, `X.find is not a function`, `Cannot read properties of undefined/null`. Audit every array-like state. Use strict response normalization at the API boundary. Do not use optional chaining as a substitute for fixing the contract.

## R10 — ERROR / EMPTY / LOADING UX

Every data-driven page must correctly support: loading, success, empty, error, retry. No blank page, fake data, silent failure, uncaught exception. Error messages must remain readable and must not cause large layout jumps.

## R11 — ACCESSIBILITY & INTERACTION

Inspect keyboard navigation, visible focus, buttons, toggles, dialogs, menus, tooltips, form labels, map controls, theme controls. All important controls must be obvious and usable.

## R12 — PERFORMANCE & MEMORY

Inspect repeated network calls, duplicate polling, duplicate map loaders, unnecessary re-renders, stale effects, leaked listeners, leaked intervals, large client-side bundles, map performance.
Especially verify maps under repeated navigation. No degradation or accumulating listeners.

## R13 — BUILD & REGRESSION GUARDRAILS

After fixes:
- Frontend: `npm run lint`, `npm run build`
- Backend: `mvn clean verify`
No compilation errors, no failing tests.

## R14 — NO BLIND REFACTORING

Do NOT replace Next.js, replace the reference UI, introduce a second frontend, reintroduce Prisma, reintroduce SQLite, invent a new router, add microservices, replace Spring Boot, add unnecessary infrastructure. Fix the actual defects in the current architecture.

## R15 — REQUIRED ROOT-CAUSE PROCESS

For every issue:
`Reproduce → capture evidence → identify root cause → determine affected components → make smallest correct fix → rebuild → retest`. Do not fix symptoms only.

## R16 — FINAL REPORT

Do not report "everything is complete" just because builds pass.
Report critical findings in a detailed table (Severity, Problem, Root Cause, Fix, Verification) and fill out the Map Subsystem and UI/UX area checklist tables fully. Report all remaining console errors, runtime failures, and network failures.

## FINAL ACCEPTANCE CRITERIA

The project is NOT ready until:
- [ ] No `map`/`filter` is not a function runtime errors.
- [ ] No API endpoint returns HTML when JSON is expected.
- [ ] All required frontend API routes exist.
- [ ] All list endpoints have correctly normalized typed responses.
- [ ] Navigation is complete and coherent.
- [ ] Leaflet no longer refreshes/reinitializes in a loop.
- [ ] Google Maps zoom/pan does not eject/reset/crash the page.
- [ ] Leaflet ↔ Google Maps toggle is clearly visible and reliable.
- [ ] Map light/dark behavior is correct.
- [ ] Google traffic toggle actually enables/disables traffic.
- [ ] Simulation toggle actually controls simulation.
- [ ] 5-second polling has exactly one active interval and proper cleanup.
- [ ] No stale map/listeners/timers accumulate after navigation.
- [ ] Login error does not cause large layout jumps.
- [ ] Empty/error/loading states are polished and stable.
- [ ] No fake/stale routes remain in navigation.
- [ ] No production fallback from PostgreSQL to H2.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] `mvn clean verify` passes.
- [ ] Browser verification completed at 375px, 768px, and 1440px in light and dark modes.
- [ ] Final role journeys work for ADMIN, MANAGER, DRIVER, and CLIENT.
