<div align="center">
  <img src="frontend/public/logo.png" alt="FleetVane Logo" width="180" style="background: transparent;"/>
  <h1>FleetVane - Intelligent Fleet Management & Route Optimization</h1>
</div>

FleetVane is a full-stack fleet management platform: managers register vehicles and shipments, clients track deliveries, drivers follow live routes, and the backend assigns stops using a bounded nearest-vehicle/nearest-neighbor heuristic with OSRM road geometry.

| Layer    | Technology |
|----------|------------|
| Backend  | Java 21 • Spring Boot 3.4.1 • Spring Security (JWT) • Flyway • H2 (dev/test) / PostgreSQL (prod) • STOMP WebSockets • OSRM |
| Frontend | Next.js 16 (App Router) • React 19 • TypeScript • Tailwind CSS v4 • Zustand (Global State) • STOMP.js (Real-time tracking) • shadcn/ui • TanStack Query • Google Maps JS API |

---

## Repository Structure

```
.
├── backend/                     # Spring Boot modular monolith (Maven)
│   └── src/main/java/com/fleetvane/
│       ├── auth/                # JWT auth, refresh-token rotation, users
│       ├── fleet/               # Vehicles & depots
│       ├── shipment/            # Shipments + delivery state machine
│       ├── driver/              # Driver profiles
│       ├── incident/            # Incident / exception reports
│       ├── routing/             # Bounded heuristic planning + OSRM geometry
│       ├── tracking/            # GPS telemetry
│       ├── simulation/          # Demo-only movement simulator (@Profile("demo"))
│       └── shared/              # Auditing, errors, rate limiting, config
├── frontend/                    # Next.js 16 application
│   └── src/
│       ├── app/                 # App Router routes + thin API proxy handlers
│       ├── views/               # Manager / Driver / Client consoles
│       ├── components/          # UI primitives & shared widgets
│       ├── context/             # Auth & notification providers
│       └── lib/                 # Axios client, Maps loader, helpers
├── .github/workflows/ci.yml     # CI: backend tests + frontend typecheck/build
└── start-backend.ps1            # One-command local launchers (Windows)
```

---

## Quick Start

### Prerequisites
- **JDK 21** and **Maven 3.9+** (or use the bundled `.jdk/` + `backend/maven_extracted/` via the start script)
- **Next.js 16** (React 19 / npm 10+) for the frontend application
- No external database needed for development - the dev profile runs on file-based H2

### 1. Configure environment

Configure the backend and frontend separately. Do not commit `.env` files or
production credentials.

For the frontend, copy `frontend/example.env` to `frontend/.env.local` and fill
in:

```bash
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...                   # map rendering
NEXT_PUBLIC_SPRING_BOOT_URL=http://localhost:8080     # backend base URL
NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws-fleetvane   # STOMP WebSocket endpoint
NEXT_PUBLIC_OSRM_BASE_URL=https://router.project-osrm.org
```

For the backend, set these environment variables in your shell or IDE launch
configuration. The `dev` profile falls back to file-based H2 when PostgreSQL
variables are not provided:

```bash
JWT_SECRET=<base64-encoded secret, >=32 bytes>        # required
SPRING_DATASOURCE_URL=...                             # optional in dev
SPRING_DATASOURCE_USERNAME=...                        # optional in dev
SPRING_DATASOURCE_PASSWORD=...                        # optional in dev
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

> `JWT_SECRET` is strictly validated at startup (`SecuritySanityConfig`): blank, short (<256-bit), or known-default secrets are rejected.

### 2. Run

```powershell
# Windows - one command each:
.\start-backend.ps1      # Spring Boot on :8080 (dev profile)
.\start-frontend.ps1     # Next.js on :3000
```

Or manually:

```bash
# Backend (PowerShell)
cd backend
mvn spring-boot:run "-Dspring-boot.run.profiles=dev"

# Frontend (PowerShell)
cd ..\frontend
npm ci
npm run dev
```

## Render deployment

Deploy the backend and frontend as separate Render web services. Keep all
credentials in Render environment variables; do not commit them to the
repository.

### Backend service

- Root directory: `backend`
- Runtime: Docker, using [backend/Dockerfile](backend/Dockerfile). Render
  builds the multi-stage Java 21 image and runs its `java -jar` entrypoint.
- Health check path: `/actuator/health`
- Set `SPRING_PROFILES_ACTIVE=prod` (or omit it; production is the default).
- Required variables:
  `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
  `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, and `CORS_ALLOWED_ORIGINS`.
- Optional variables:
  `OSRM_BASE_URL`, `SIMULATION_DEMO_COMPANY_ID`,
  `SIMULATION_DEMO_DISTANCE_PER_TICK_KM`, and the `AUTH_RATE_LIMIT_*`
  variables.
- Render supplies `PORT`; the backend listens on `${PORT}`. The Docker image's
  `EXPOSE 8080` is documentation only; the runtime port is controlled by the
  application configuration.

Use a managed PostgreSQL database such as Supabase. Do not use Hibernate
schema update in production; production validates the Flyway-managed schema.

### Frontend service

- Root directory: `frontend`
- Build command: `npm ci && npm run build`
- Environment: Next.js 16 / React 19 standalone runtime.
- Start command: `npm run start` (serves the prepared Next standalone build).
- Set `NEXT_PUBLIC_SPRING_BOOT_URL` to the public backend URL.
- Set `NEXT_PUBLIC_WS_URL` to the backend WebSocket endpoint ending in
  `/ws-fleetvane`.
- Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` and/or
  `NEXT_PUBLIC_MAPTILER_API_KEY` only as Render environment variables when
  those providers are enabled. No map credential is stored in source.
- Set `NEXT_PUBLIC_OSRM_BASE_URL` if using a hosted or self-hosted routing
  service; otherwise the public OSRM endpoint is used for demos.

The free Render tier is suitable for staging and demonstrations. It is not a
production SLA: services sleep, cold starts occur, and the public OSRM/tile
fallbacks are rate-limited. Use paid/dedicated hosting and a managed routing
and tile provider for sustained public traffic.

### 3. Log in

The dev profile seeds demo accounts via `DataInitializer`. Sign up is open for the **CLIENT** role only; MANAGER/DRIVER accounts are provisioned internally (RBAC enforced server-side).

---

## Route planning architecture

The active planner is intentionally bounded and synchronous:

1. The configured relational database (H2 in development or PostgreSQL in
   production) stores vehicle, shipment, weight, volume, and coordinate data.
2. `RouteSolverService` assigns each shipment to the nearest vehicle using Haversine distance.
3. Stops assigned to each vehicle are ordered with a nearest-neighbor heuristic.
4. `OsrmRoutingService` resolves ordered waypoints to road geometry and duration, with a Haversine fallback when OSRM is unavailable.
5. The synchronous API rejects problems larger than 50 vehicles or 200 shipments.

Timefold/OptaPlanner is not an active dependency or runtime path. The old solver-domain stubs have been removed.

### Structural evaluation

- **Capacity constraints: Yes, as a business requirement.** Vehicles have weight and volume capacity fields; shipments have weight and dimensions; dispatch persists current load totals. The current heuristic does not yet enforce a hard capacity fit before assignment, so it must not be marketed as capacity-safe for arbitrary multi-truck optimization.
- **Strict delivery time windows: No.** Driver shifts exist, but customer appointment windows and shipment SLA start/end constraints are not part of the active planning model.
- **Architecture verdict:** A plain TSP alone is insufficient once multiple vehicles and capacity are meaningful. For the current bounded product, use capacity-aware assignment/bin-packing followed by per-vehicle TSP or nearest-neighbor routing. A full VRP solver becomes justified as fleet size, constraints, or optimization-quality requirements grow.

The current implementation is not a Python OR-Tools microservice. Adding one would increase deployment cost and operational complexity. If introduced later, it should be asynchronous and isolated behind a job API rather than run inside the request thread.

---

## Security Measures

- 🔐 **JWT access tokens** (short-lived, in-memory client-side) + **refresh tokens** in HttpOnly/SameSite cookies with token-family rotation & invalidation
- 🛡️ **RBAC**: MANAGER / DRIVER / CLIENT roles enforced per endpoint; public signup locked to CLIENT
- 🚦 **Brute-force protection**: Bucket4j per-IP rate limiting on login/signup (`AuthRateLimitFilter`)
- 🔒 **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- 🌐 **CORS** restricted to the known frontend origin
- 🐛 **RFC 7807 error responses** with correlation IDs; no stack traces leaked

---

## Testing & CI

```bash
# Backend - unit, ArchUnit module-boundary rules, and H2 repository-slice tests
cd backend && mvn test

# Frontend - strict typecheck + production build
cd frontend && npx tsc --noEmit && npm run build
```

GitHub Actions runs both suites on every push/PR to `main` (`.github/workflows/ci.yml`).

---

## Demo Simulation

The vehicle-movement animation seen in the dashboards is powered by `simulation/` - a **demo-only** module (Spring `@Profile("demo")`) that seeds sample data and ticks positions so the system can be demonstrated live. It is not part of the production flow: real position updates arrive through the tracking API (`PUT /api/vehicles/{id}/location`).

---

## Map and traffic notes

- Leaflet is the default map renderer and uses the configured tile provider. Google Maps
  can be enabled for the manager traffic layer when a Google Maps key is supplied.
- Vehicle markers and route polylines are updated from the tracking stream without
  reloading the page. The current implementation does not provide turn-by-turn
  navigation or route-level traffic-color segmentation.
- OSRM supplies road geometry and duration for planned routes. Public OSRM and tile
  endpoints are rate-limited and should be replaced with managed or self-hosted
  services before sustained production traffic.

## Contributors

- [**Nawaz-khan-droid**](https://github.com/Nawaz-khan-droid) —
  nawazkhanofficialac@gmail.com

---

*Developed as a capstone project.*
