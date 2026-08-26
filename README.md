# FleetVane — Intelligent Fleet Management & Route Optimization

FleetVane is a full-stack fleet management platform: managers register vehicles and shipments, clients track deliveries, drivers follow optimized routes — and a **Timefold VRP solver** computes the best stop-to-truck assignment to minimize total distance.

| Layer    | Technology |
|----------|------------|
| Backend  | Java 21 · Spring Boot 3.4.1 · Timefold VRP · Spring Security (JWT) · Flyway · H2 (dev/test) / PostgreSQL (prod) |
| Frontend | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · TanStack Query · Google Maps JS API |

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
│       ├── routing/             # Timefold VRP engine (domain, solver, jobs)
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
- **Node.js 18+**
- No external database needed for development — the dev profile runs on file-based H2

### 1. Configure environment

Copy `example.env` to `.env` (repo root) and fill in:

```bash
JWT_SECRET=<base64-encoded secret, >=32 bytes>        # required — app refuses to boot without it
SPRING_DATA_SOURCE_URL=...                            # optional in dev (H2 fallback)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...                   # map rendering
NEXT_PUBLIC_SPRING_BOOT_URL=http://localhost:8080     # backend base URL
```

> `JWT_SECRET` is strictly validated at startup (`SecuritySanityConfig`): blank, short (<256-bit), or known-default secrets are rejected.

### 2. Run

```powershell
# Windows — one command each:
.\start-backend.ps1      # Spring Boot on :8080 (dev profile)
.\start-frontend.ps1     # Next.js on :3000
```

Or manually:

```bash
# Backend
cd backend && mvn spring-boot:run -Dspring-boot.run.profiles=dev

# Frontend
cd frontend && npm install && npm run dev
```

### 3. Log in

The dev profile seeds demo accounts via `DataInitializer`. Sign up is open for the **CLIENT** role only; MANAGER/DRIVER accounts are provisioned internally (RBAC enforced server-side).

---

## How the Route Optimization Works (Timefold VRP)

**The problem:** Monday morning. You have a handful of trucks at a depot and dozens of deliveries across the city — each with a weight and an address. Which truck delivers which package, and in what order? Trying every combination is computationally impossible (the search space grows factorially).

**The approach:** Timefold doesn't brute-force. It starts from any feasible plan and then iteratively applies small *moves* — "swap these two stops between trucks", "move this delivery earlier in the route" — keeping changes that improve the plan's **score**, until improvements dry up.

**The score** has two levels:
- **Hard constraints** (any violation makes the plan invalid): a truck must never carry more than its capacity; every shipment must be assigned exactly once.
- **Soft constraints**: minimize total distance driven.

**In this codebase:**

| Piece | File | Role |
|---|---|---|
| Problem model | `routing/domain/VehicleRoutePlan.java` | The whole plan: all vehicles + all stops |
| Solution pieces | `RouteVehicle.java`, `DeliveryStop.java` | Solver-managed entities (vehicle ↔ stops lists) |
| Rules | `routing/domain/RouteConstraintProvider.java` | Declares hard/soft scoring constraints (e.g. capacity overload → `-18000hard` per unit) |
| Orchestration | `routing/service/RouteSolverService.java` | Loads unassigned shipments + available vehicles from the DB, feeds them to the solver (30 s budget), persists and returns the optimized plan with coordinates |

Flow: `POST /api/routes/optimization-jobs` → service snapshots current fleet/shipments → Timefold searches → response contains each vehicle's ordered stop sequence with resolved lat/lng for map rendering.

---

## Security Measures

- **JWT access tokens** (short-lived, in-memory client-side) + **refresh tokens** in HttpOnly/SameSite cookies with token-family rotation & invalidation
- **RBAC**: MANAGER / DRIVER / CLIENT roles enforced per endpoint; public signup locked to CLIENT
- **Brute-force protection**: Bucket4j per-IP rate limiting on login/signup (`AuthRateLimitFilter`)
- **Security headers**: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`
- **CORS** restricted to the known frontend origin
- **RFC 7807 error responses** with correlation IDs; no stack traces leaked

---

## Testing & CI

```bash
# Backend — 54 tests: unit, ArchUnit module-boundary rules, H2 repository slices
cd backend && mvn test

# Frontend — strict typecheck + production build
cd frontend && npx tsc --noEmit && npm run build
```

GitHub Actions runs both suites on every push/PR to `main` (`.github/workflows/ci.yml`).

---

## Demo Simulation

The vehicle-movement animation seen in the dashboards is powered by `simulation/` — a **demo-only** module (Spring `@Profile("demo")`) that seeds sample data and ticks positions so the system can be demonstrated live. It is not part of the production flow: real position updates arrive through the tracking API (`PUT /api/vehicles/{id}/location`).

---

*Developed as a capstone project.*
