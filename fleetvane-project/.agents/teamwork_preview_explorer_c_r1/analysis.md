# FleetVane API Contract, Backend Alignment & Database Persistence Audit (Agent C Report)

**Date**: 2026-08-15  
**Agent**: Agent C — API Contract, Backend Alignment & Database Explorer  
**Scope**: Spring Boot REST Controllers, Next.js API Routes/Proxies, Frontend Contract Normalization, Database Persistence, Production Safety, Build Verification.

---

## Executive Summary

A comprehensive forensic audit of the Spring Boot backend (`c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend`) and Next.js frontend (`c:\Users\ks919\Downloads\fleetvane-project`) was conducted. 

### Critical Findings Overview:
1. **Spring Boot `Page<T>` vs Frontend Array Mismatches (R4, R9)**:
   - All Spring Boot list endpoints (`/api/vehicles`, `/api/shipments`, `/api/drivers`, `/api/incidents`) return Spring Data `Page<T>` objects (`{ content: T[], totalElements, totalPages, number, size, ... }`).
   - Multiple frontend components (`ManagerShipments.tsx`, `ManagerDrivers.tsx`, `ClientDashboard.tsx`, `DriverReport.tsx`, `DriverProfile.tsx`, `src/app/api/activity/route.ts`) directly assume plain array responses (`T[]`).
   - This causes immediate runtime exceptions (`TypeError: X.filter is not a function`, `TypeError: X.slice is not a function`) or causes functions to silently default to empty arrays `[]` (e.g. `/api/activity` is permanently empty).
2. **DTO & Field Naming Desynchronization (R4)**:
   - **User ID**: Backend `AuthResponse.UserDto` sends `{ id: Long, email, name, role }`. Frontend `types/index.ts` defined `UserPayload.userId`. As a result, `authState.user?.userId` is `undefined` throughout the application, breaking queries like `/api/shipments?clientId=undefined`.
   - **Shipment Creation**: Backend `CreateShipmentRequest` strictly validates `@NotBlank originAddress`, `@NotBlank destinationAddress`, `@NotNull @Positive weight`. The frontend `ClientDashboard.tsx` sends `{ origin, destination, weight: null }`, causing every client shipment creation to fail with HTTP 400 Bad Request.
   - **Shipment Addresses**: Backend returns `originAddress` and `destinationAddress`, but frontend expects `origin` and `destination`.
   - **Driver Profiles**: Backend `GET /api/drivers` returns `Page<DriverProfileDto>` with flat fields `{ id, userId, licenseNumber, vehicleId, isAvailable }`. Frontend expects a nested `DriverWithProfile` with `{ id, name, email, driverProfile: { licenseNumber, ... } }`.
3. **Missing & Broken Next.js API Routes (R5)**:
   - Missing routes: `/api/tracking/vehicles/[id]/location`, `/api/vehicles/[id]`, `/api/drivers/[id]`, `/api/shipments/[id]/assign`, `/api/routes/optimization-jobs`. Any request to these falls through to Next.js `app/[[...catchAll]]/page.tsx`, which returns HTML instead of JSON, triggering JSON parse crashes.
   - Broken simulation route: `src/app/api/simulation/route.ts` proxies to `/api/simulation/optimize`, which does not exist in Spring Boot.
   - Method mismatch: Shipment status updates and assignments send `PATCH` requests with JSON bodies to `/api/shipments/[id]`, whereas Spring Boot requires `PUT /api/shipments/{id}/status?status=...` and `PUT /api/shipments/{id}/assign?vehicleId=...&driverId=...`.
4. **Database Persistence & Production Safety (R7)**:
   - `application.yml` defaults to `prod` profile requiring `${SPRING_DATASOURCE_URL}`. Startup strictly fails if PostgreSQL is missing. There is NO silent fallback to in-memory H2.
   - In-memory H2 is strictly confined to `application-dev.yml`.
   - `DataInitializer.java` is guarded with `@Profile({"dev", "demo"})`, ensuring zero demo data overwrite in production.
   - Flyway migrations `V1`, `V2`, `V3` provide a clean schema for PostgreSQL 17.

---

## 1. R4 — API Contract Alignment & Response Normalization

### 1.1 Spring Boot REST Controllers Audit

| Controller File | Endpoint | Method | Auth / PreAuthorize | Return Type / Shape | DTO Fields |
|---|---|---|---|---|---|
| `VehicleController.java:23` | `/api/vehicles` | GET | `MANAGER` | `Page<VehicleDto>` | `{ content: VehicleDto[], totalElements, totalPages, number, size }` |
| `VehicleController.java:29` | `/api/vehicles/{id}` | GET | `MANAGER` | `VehicleDto` | `{ id, plateNumber, type, model, capacity, fuelType, status, lat, lng, heading, createdAt, updatedAt }` |
| `VehicleController.java:35` | `/api/vehicles` | POST | `MANAGER` | `VehicleDto` | Body: `CreateVehicleRequest` (`plateNumber`, `type`, `model`, `capacity`, `fuelType`) |
| `VehicleController.java:41` | `/api/vehicles/{id}/status` | PUT | `MANAGER` | `VehicleDto` | Param: `@RequestParam String status` |
| `VehicleController.java:47` | `/api/vehicles/{id}/location` | PUT | `DRIVER, MANAGER` | `VehicleDto` | Body: `UpdateVehicleLocationRequest` (`lat`, `lng`, `heading`) |
| `ShipmentController.java:29` | `/api/shipments` | GET | Authenticated (scoped by role) | `Page<ShipmentDto>` | `{ content: ShipmentDto[], totalElements, totalPages, number, size }` |
| `ShipmentController.java:43` | `/api/shipments/{id}` | GET | Authenticated (scoped by role) | `ShipmentDto` | `{ id, clientId, status, originAddress, originLat, originLng, destinationAddress, destinationLat, destinationLng, weight, eta, assignedAt, pickedUpAt, deliveredAt, cancelledAt, vehicleId, driverId, createdAt, updatedAt }` |
| `ShipmentController.java:52` | `/api/shipments` | POST | `MANAGER, CLIENT` | `ShipmentDto` | Body: `CreateShipmentRequest` (`originAddress`, `originLat`, `originLng`, `destinationAddress`, `destinationLat`, `destinationLng`, `weight`) |
| `ShipmentController.java:59` | `/api/shipments/{id}/assign` | PUT | `MANAGER` | `ShipmentDto` | Params: `@RequestParam Long vehicleId, @RequestParam Long driverId` |
| `ShipmentController.java:67` | `/api/shipments/{id}/status` | PUT | Authenticated | `ShipmentDto` | Param: `@RequestParam String status` |
| `DriverController.java:22` | `/api/drivers` | GET | `MANAGER` | `Page<DriverProfileDto>` | `{ content: DriverProfileDto[], totalElements, totalPages, number, size }` |
| `DriverController.java:28` | `/api/drivers/{userId}` | GET | `MANAGER, DRIVER` | `DriverProfileDto` | `{ id, userId, licenseNumber, vehicleId, isAvailable, createdAt, updatedAt }` |
| `DriverController.java:34` | `/api/drivers/{userId}` | POST | `MANAGER` | `DriverProfileDto` | Body: `CreateDriverProfileRequest` (`licenseNumber`, `vehicleId`) |
| `DriverController.java:40` | `/api/drivers/{userId}/availability` | PUT | `DRIVER` | `DriverProfileDto` | Toggles availability, returns `DriverProfileDto` |
| `IncidentController.java:28` | `/api/incidents` | GET | `MANAGER, DRIVER` | `Page<IncidentReportDto>` | `{ content: IncidentReportDto[], totalElements, totalPages, number, size }` |
| `IncidentController.java:37` | `/api/incidents` | POST | `DRIVER` | `IncidentReportDto` | Body: `CreateIncidentRequest` (`type`, `description`, `lat`, `lng`, `shipmentId`) |
| `RouteController.java:27` | `/api/routes/optimization-jobs` | POST | `MANAGER` | `OptimizationJobDto` | Body: `CreateOptimizationJobRequest` (`vehicleIds`, `shipmentIds`) |
| `RouteController.java:34` | `/api/routes/optimization-jobs/{id}` | GET | `MANAGER` | `OptimizationJobDto` | `{ id, status, requestedBy, score, errorMessage, resultJson, createdAt, startedAt, completedAt }` |
| `TrackingController.java:22` | `/api/tracking/vehicles/{id}/location` | PUT | `DRIVER, MANAGER` | `ResponseEntity<Void>` | Body: `LocationUpdateRequest` (`lat`, `lng`, `heading`) |
| `SimulationController.java:15` | `/api/simulation/seed` | POST | `@Profile("demo")` | `ResponseEntity<String>` | Mock seed data |
| `SimulationController.java:20` | `/api/simulation/move` | POST | `@Profile("demo")` | `ResponseEntity<String>` | Advance vehicles |
| `AuthController.java:26` | `/api/auth/signup` | POST | Public | `ResponseEntity<AuthResponse>` | Body: `SignupRequest` (`email`, `password`, `name`, `role`) |
| `AuthController.java:33` | `/api/auth/login` | POST | Public | `ResponseEntity<AuthResponse>` | Body: `LoginRequest` (`email`, `password`) |
| `AuthController.java:40` | `/api/auth/refresh` | POST | Public (Cookie) | `ResponseEntity<AuthResponse>` | Cookie: `refresh_token` |
| `AuthController.java:69` | `/api/auth/logout` | POST | Public (Cookie) | `ResponseEntity<Void>` | Clears `refresh_token` cookie |
| `UserController.java:23` | `/api/users` | POST | `ADMIN, MANAGER` | `ResponseEntity<AuthResponse>` | Body: `SignupRequest` (Provision user) |

---

### 1.2 Frontend Consumption & Root Cause Analysis of Crashes

#### Bug 1: `ManagerShipments.tsx` Resource Fetch Crash (Lines 151–155)
- **Code**:
  ```ts
  const allVehicles: Vehicle[] = await vehRes.json();
  const allDrivers: DriverWithProfile[] = await drvRes.json();
  setAvailableVehicles(allVehicles.filter((v) => v.status === 'AVAILABLE'));
  setAvailableDrivers(allDrivers.filter((d) => d.driverProfile?.isAvailable));
  ```
- **Root Cause**: `vehRes.json()` is `{ content: [...], totalElements: 3, ... }`. `allVehicles.filter` throws `TypeError: allVehicles.filter is not a function`.
- **Remediation**: Use `normalizePageResponse<Vehicle>(await vehRes.json()).items`.

#### Bug 2: `ManagerDrivers.tsx` Vehicle Fetch Crash (Lines 113–115)
- **Code**:
  ```ts
  const data: Vehicle[] = await res.json();
  setAvailableVehicles(data.filter((v) => v.status === 'AVAILABLE'));
  ```
- **Root Cause**: `data` is `Page<VehicleDto>`, not array. Throws `TypeError: data.filter is not a function`.
- **Remediation**: Use `normalizePageResponse<Vehicle>(data).items`.

#### Bug 3: `ClientDashboard.tsx` State Crash (Lines 110–124)
- **Code**:
  ```ts
  const data = await res.json();
  setShipments(data); // sets shipments to Object instead of Array
  ...
  const filteredShipments = shipments.filter(...) // Throws TypeError on render!
  ```
- **Root Cause**: `res.json()` is `Page<ShipmentDto>`. Calling `.filter()` on the object crashes the React component.
- **Remediation**: `setShipments(normalizePageResponse<Shipment>(data).items)`.

#### Bug 4: `DriverReport.tsx` Slice Crash (Lines 79–80, 243)
- **Code**:
  ```ts
  const data: IncidentReport[] = await res.json();
  setReports(data);
  ...
  reports.slice(...) // Throws TypeError: reports.slice is not a function!
  ```
- **Root Cause**: `data` is `Page<IncidentReportDto>`. `reports.slice` throws TypeError.
- **Remediation**: `setReports(normalizePageResponse<IncidentReport>(data).items)`.

#### Bug 5: `src/app/api/activity/route.ts` Permanent Empty List (Lines 36–38)
- **Code**:
  ```ts
  const shipments = Array.isArray(shipmentsRes.data) ? shipmentsRes.data : [];
  const incidents = Array.isArray(incidentsRes.data) ? incidentsRes.data : [];
  const drivers = Array.isArray(driversRes.data) ? driversRes.data : [];
  ```
- **Root Cause**: `shipmentsRes.data` is an object (`Page<T>`), so `Array.isArray()` evaluates to `false`. All arrays are defaulted to `[]`, making the activity feed permanently blank.
- **Remediation**: Extract `data.content || (Array.isArray(data) ? data : [])`.

---

### 1.3 DTO & Field Mismatches

#### Mismatch 1: `UserPayload.userId` vs `AuthResponse.UserDto.id`
- **Location**: `src/types/index.ts:12`, `src/context/AuthContext.tsx:72,94`, `src/views/client/ClientDashboard.tsx:104,165`.
- **Problem**: Spring Boot `AuthResponse.UserDto` has `id: Long`. Frontend interface `UserPayload` defined `userId: string`. When `data.user` is saved to context, `user.userId` is `undefined`.
- **Impact**: `fetch('/api/shipments?clientId=undefined')` and `fetch('/api/reports?driverId=undefined')` are executed.
- **Remediation**: Update `UserPayload` or normalize `user` during login/refresh:
  ```ts
  const normalizedUser: UserPayload = {
    userId: String(data.user.id || data.user.userId),
    email: data.user.email,
    name: data.user.name,
    role: data.user.role,
  };
  ```

#### Mismatch 2: `CreateShipmentRequest` Field Names
- **Location**: `src/views/client/ClientDashboard.tsx:164–169` vs `com.fleetvane.shipment.dto.CreateShipmentRequest.java:8–24`.
- **Problem**: Frontend sends `{ origin, destination, weight }`. Backend requires `@NotBlank originAddress`, `@NotBlank destinationAddress`, `@NotNull @Positive Double weight`.
- **Impact**: HTTP 400 Bad Request error on shipment creation.
- **Remediation**: Align frontend payload:
  ```ts
  body: JSON.stringify({
    originAddress: origin.trim(),
    destinationAddress: destination.trim(),
    weight: weight ? parseFloat(weight) : 1.0,
  })
  ```

#### Mismatch 3: Shipment Address Fields
- **Location**: `ShipmentDto.java` (`originAddress`, `destinationAddress`) vs `types/index.ts` (`origin`, `destination`).
- **Impact**: Tables display blank or undefined values for origin and destination.
- **Remediation**: Normalize shipment items upon receipt:
  ```ts
  origin: item.origin || item.originAddress || '',
  destination: item.destination || item.destinationAddress || '',
  ```

#### Mismatch 4: Driver Profile Structure
- **Location**: `DriverController.java` returns `DriverProfileDto` (`{ id, userId, licenseNumber, vehicleId, isAvailable }`). Frontend `ManagerDrivers.tsx` expects `DriverWithProfile` (`{ name, email, driverProfile: { licenseNumber, ... } }`).
- **Remediation**: Normalize driver records and provide a consolidated endpoint or mapper.

---

## 2. R5 — Missing & Stale API Routes Mapping

### 2.1 Route Proxy Audit & Forwarding Analysis

| Frontend Request Path | Next.js API File | Target Backend URL | Issue Identified |
|---|---|---|---|
| `/api/vehicles` | `src/app/api/vehicles/route.ts` | `http://localhost:8080/api/vehicles` | Query parameters (`?status=...&page=...`) are NOT forwarded! |
| `/api/vehicles/[id]` | **MISSING** | `http://localhost:8080/api/vehicles/{id}` | Returns Next.js HTML catch-all page! |
| `/api/vehicles/[id]/status` | **MISSING** | `http://localhost:8080/api/vehicles/{id}/status` | Returns Next.js HTML catch-all page! |
| `/api/vehicles/[id]/location`| **MISSING** | `http://localhost:8080/api/vehicles/{id}/location`| Returns Next.js HTML catch-all page! |
| `/api/shipments` | `src/app/api/shipments/route.ts` | `http://localhost:8080/api/shipments` | Drops all query params except `clientId`. |
| `/api/shipments/[id]` | `src/app/api/shipments/[id]/route.ts` | `http://localhost:8080/api/shipments/{id}` | PATCH sends to `/api/shipments/{id}/status` which expects PUT + `@RequestParam status`. |
| `/api/shipments/[id]/assign`| **MISSING** | `http://localhost:8080/api/shipments/{id}/assign`| Returns HTML! |
| `/api/drivers` | `src/app/api/drivers/route.ts` | `http://localhost:8080/api/drivers` | Drops query params; POST forwards to `/api/drivers` instead of `/api/drivers/{userId}`. |
| `/api/drivers/[id]` | **MISSING** | `http://localhost:8080/api/drivers/{id}` | Returns HTML! |
| `/api/drivers/[id]/availability`| **MISSING** | `http://localhost:8080/api/drivers/{id}/availability`| Returns HTML! |
| `/api/incidents` | `src/app/api/incidents/route.ts` | `http://localhost:8080/api/incidents` | Drops query params. |
| `/api/reports` | `src/app/api/reports/route.ts` | `http://localhost:8080/api/incidents` | Forwards to `/api/incidents`. |
| `/api/tracking/vehicles/[id]/location`| **MISSING** | `http://localhost:8080/api/tracking/vehicles/{id}/location`| Returns HTML! |
| `/api/routes/optimization-jobs`| **MISSING** | `http://localhost:8080/api/routes/optimization-jobs`| Returns HTML! |
| `/api/simulation` | `src/app/api/simulation/route.ts` | `http://localhost:8080/api/simulation/optimize` | Backend endpoint does not exist. |
| `/api/users` | `src/app/api/users/route.ts` | `http://localhost:8080/api/users` | GET is proxying to `/api/users` which does not exist in Spring Boot. |
| `/api/auth/change-password` | `src/app/api/auth/change-password/route.ts` | `http://localhost:8080/api/auth/change-password`| Backend endpoint does not exist. |

### 2.2 Eliminating HTML Catch-All Responses

In `src/lib/backendApi.ts`:
- Modify `forwardToBackend` to automatically preserve `req.nextUrl.search` query strings.
- Add a fallback route handler / proxy for unmatched `/api/*` requests that returns:
  ```json
  { "error": "API route not found", "status": 404 }
  ```
  with HTTP 404, strictly preventing HTML fallthrough from `app/[[...catchAll]]/page.tsx`.

---

## 3. R7 — Data Persistence & Production Safety

### 3.1 Backend Configuration Audit

1. **`application.yml`**:
   - `spring.profiles.active: ${SPRING_PROFILES_ACTIVE:prod}`
   - `spring.datasource.url: ${SPRING_DATASOURCE_URL}` (no default/fallback in prod)
   - `spring.datasource.username: ${SPRING_DATASOURCE_USERNAME:postgres}`
   - `spring.datasource.password: ${SPRING_DATASOURCE_PASSWORD:}`
   - `spring.jpa.hibernate.ddl-auto: validate`
   - `spring.flyway.enabled: true`
   - `spring.flyway.baseline-on-migrate: true`
2. **`application-dev.yml`**:
   - `spring.datasource.url: jdbc:h2:mem:fleetvanedb;DB_CLOSE_DELAY=-1;MODE=PostgreSQL`
   - `spring.h2.console.enabled: true`

### 3.2 Production Guardrail Verification
- **PostgreSQL Requirement**: When running with `prod` profile, `${SPRING_DATASOURCE_URL}` must be explicitly supplied. If missing, Spring Boot fails to create the DataSource bean and crashes during startup, as required by R7.
- **No Silent Fallback**: H2 is ONLY configured in `application-dev.yml` and is NOT referenced in `application.yml`.
- **Seed Data Isolation**: `DataInitializer.java` is annotated with `@Profile({"dev", "demo"})`, ensuring no demo accounts or vehicle records overwrite production databases.

### 3.3 Flyway Migrations Audit
- `V1__initial_schema.sql`: Comprehensive schema with tables `users`, `refresh_tokens`, `vehicles`, `driver_profiles`, `shipments`, `incident_reports`, `optimization_jobs`. Check constraints, cascading deletes, foreign keys, and indexes are properly declared.
- `V2__add_user_active_flag.sql`: Adds `is_active BOOLEAN NOT NULL DEFAULT TRUE` to `users`.
- `V3__allow_admin_role.sql`: Updates `users_role_check` constraint to support `ADMIN`.

---

## 4. R13 & R14 — Build Verification Readiness

### 4.1 Backend (Maven / Java 21)
- `pom.xml` configured with Spring Boot `3.4.1`, Java `21`, Timefold Solver `1.18.0`, JJWT `0.12.6`, Lombok `1.18.36`, PostgreSQL driver, Flyway, and Maven Compiler Plugin `3.13.0`.
- Tests: `AuthServiceTest`, `JwtServiceTest`, `ShipmentServiceTest` verify authentication, JWT signing/parsing, and shipment state machine transitions.

### 4.2 Frontend (Next.js 16 / TypeScript 5)
- `package.json` includes all necessary dependencies: React 19, Lucide, Tailwind 4, Sonner, Radix UI, Leaflet, Google Maps loader.
- `tsconfig.json` enforces TypeScript compiler options.
- `next.config.ts` configured for standalone deployment.

---

## 5. Architectural Remediation Plan (For Implementation Phase)

### Phase 1: Robust Response Normalization Layer
Create a comprehensive normalization utility in `src/lib/apiNormalization.ts`:
```ts
export class ApiContractError extends Error {
  constructor(message: string, public readonly rawData?: unknown) {
    super(message);
    this.name = 'ApiContractError';
  }
}

export interface NormalizedPage<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export function normalizePageResponse<T>(data: unknown, itemMapper?: (item: any) => T): NormalizedPage<T> {
  if (!data || typeof data !== 'object') {
    throw new ApiContractError('Expected JSON response object from backend API', data);
  }

  const obj = data as Record<string, any>;

  // If Spring Boot Page<T>
  if (Array.isArray(obj.content)) {
    const items = itemMapper ? obj.content.map(itemMapper) : obj.content;
    return {
      items,
      totalElements: typeof obj.totalElements === 'number' ? obj.totalElements : items.length,
      totalPages: typeof obj.totalPages === 'number' ? obj.totalPages : 1,
      page: typeof obj.number === 'number' ? obj.number : 0,
      size: typeof obj.size === 'number' ? obj.size : items.length,
    };
  }

  // If flat array
  if (Array.isArray(data)) {
    const items = itemMapper ? data.map(itemMapper) : data;
    return {
      items,
      totalElements: items.length,
      totalPages: 1,
      page: 0,
      size: items.length,
    };
  }

  throw new ApiContractError('Response shape does not conform to Page<T> or Array<T>', data);
}

export function normalizeShipment(s: any): Shipment {
  return {
    id: String(s.id),
    clientId: String(s.clientId),
    status: s.status,
    origin: s.origin || s.originAddress || '',
    destination: s.destination || s.destinationAddress || '',
    weight: typeof s.weight === 'number' ? s.weight : null,
    eta: s.eta || null,
    deliveredAt: s.deliveredAt || null,
    createdAt: s.createdAt || new Date().toISOString(),
    vehicleId: s.vehicleId ? String(s.vehicleId) : null,
    driverId: s.driverId ? String(s.driverId) : null,
    vehicle: s.vehicle || null,
    driver: s.driver || null,
  };
}
```

### Phase 2: Frontend Query & Component Fixes
1. Update `ManagerShipments.tsx` to normalize `allVehicles` and `allDrivers` before filtering.
2. Update `ManagerDrivers.tsx` to normalize available vehicles.
3. Update `ClientDashboard.tsx` to normalize shipments list and send `originAddress`/`destinationAddress` on creation.
4. Update `DriverReport.tsx` to normalize incident reports list.
5. Update `AuthContext.tsx` to map `data.user.id` -> `user.userId`.

### Phase 3: Missing API Proxy Routes & Parameter Forwarding
1. Update `src/lib/backendApi.ts` to preserve `req.nextUrl.search` query parameters.
2. Create dynamic route proxies for `/api/vehicles/[...path]`, `/api/shipments/[...path]`, `/api/drivers/[...path]`, `/api/tracking/[...path]`, `/api/routes/[...path]`.
3. Handle method conversion (e.g. converting frontend PATCH status calls to backend PUT calls with `@RequestParam status`).
