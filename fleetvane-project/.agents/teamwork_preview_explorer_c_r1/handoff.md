# Handoff Report — Agent C (API Contract, Backend Alignment & Database Explorer)

**Agent Working Directory**: `c:\Users\ks919\Downloads\fleetvane-project\.agents\teamwork_preview_explorer_c_r1`  
**Milestone**: M0 / Survey & Forensic Exploration  
**Status**: COMPLETE  

---

## 1. Observation

1. **Spring Data `Page<T>` Structure vs Frontend Array Assumptions**:
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\fleet\controller\VehicleController.java:23`:
     `public Page<VehicleDto> getAllVehicles(Pageable pageable, @RequestParam(required = false) String status)` returns `{ content: VehicleDto[], totalElements: number, totalPages: number, number: number, size: number, ... }`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\shipment\controller\ShipmentController.java:29`:
     `public Page<ShipmentDto> getAllShipments(...)` returns `Page<ShipmentDto>`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\driver\controller\DriverController.java:22`:
     `public Page<DriverProfileDto> getAllDrivers(Pageable pageable)` returns `Page<DriverProfileDto>`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\incident\controller\IncidentController.java:28`:
     `public Page<IncidentReportDto> getAllIncidents(Pageable pageable, Authentication authentication)` returns `Page<IncidentReportDto>`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\views\manager\ManagerShipments.tsx:151-155`:
     ```ts
     const allVehicles: Vehicle[] = await vehRes.json();
     const allDrivers: DriverWithProfile[] = await drvRes.json();
     setAvailableVehicles(allVehicles.filter((v) => v.status === 'AVAILABLE'));
     setAvailableDrivers(allDrivers.filter((d) => d.driverProfile?.isAvailable));
     ```
     Throws `TypeError: allVehicles.filter is not a function`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\views\manager\ManagerDrivers.tsx:113-115`:
     ```ts
     const data: Vehicle[] = await res.json();
     setAvailableVehicles(data.filter((v) => v.status === 'AVAILABLE'));
     ```
     Throws `TypeError: data.filter is not a function`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\views\client\ClientDashboard.tsx:110-124`:
     ```ts
     const data = await res.json();
     setShipments(data);
     const filteredShipments = shipments.filter(...);
     ```
     Throws `TypeError: shipments.filter is not a function`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\views\driver\DriverReport.tsx:79-80, 243`:
     ```ts
     const data: IncidentReport[] = await res.json();
     setReports(data);
     reports.slice(...);
     ```
     Throws `TypeError: reports.slice is not a function`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\app\api\activity\route.ts:36-38`:
     `const shipments = Array.isArray(shipmentsRes.data) ? shipmentsRes.data : [];`
     Because `shipmentsRes.data` is an object, `Array.isArray()` evaluates to `false`, causing the activity feed to permanently return `[]`.

2. **DTO & Field Naming Desynchronization**:
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\auth\dto\AuthResponse.java:8`:
     `public record UserDto(Long id, String email, String name, String role)`
     `c:\Users\ks919\Downloads\fleetvane-project\src\types\index.ts:11`:
     `export interface UserPayload { userId: string; email: string; name: string; role: UserRole; ... }`
     Result: `authState.user?.userId` is `undefined`, causing requests to `/api/shipments?clientId=undefined` and `/api/reports?driverId=undefined`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\shipment\dto\CreateShipmentRequest.java:9-23`:
     Requires `@NotBlank String originAddress`, `@NotBlank String destinationAddress`, `@NotNull @Positive Double weight`.
     `c:\Users\ks919\Downloads\fleetvane-project\src\views\client\ClientDashboard.tsx:164-169`:
     Sends `{ clientId, origin, destination, weight: null }`. Rejection: HTTP 400 Bad Request.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\shipment\dto\ShipmentDto.java:9,12`:
     Fields are `originAddress` and `destinationAddress`. Frontend `types/index.ts` defined `origin` and `destination`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\driver\dto\DriverProfileDto.java:5-13`:
     Fields are flat `{ id, userId, licenseNumber, vehicleId, isAvailable }`. Frontend `ManagerDrivers.tsx` expects nested `DriverWithProfile` with `{ name, email, driverProfile: { licenseNumber } }`.

3. **API Routing, Method Mismatches & Proxy Gaps**:
   - `c:\Users\ks919\Downloads\fleetvane-project\src\lib\backendApi.ts:10-11`:
     `const url = `${SPRING_BOOT_URL}${endpoint}`;` does NOT append query strings from `req.url` / `req.nextUrl.search`.
   - Missing Next.js route handlers: `/api/tracking/vehicles/[id]/location`, `/api/vehicles/[id]`, `/api/drivers/[id]`, `/api/routes/optimization-jobs`, `/api/shipments/[id]/assign`.
   - `c:\Users\ks919\Downloads\fleetvane-project\src\app\[[...catchAll]]\page.tsx`: Any missing route falls through to the client HTML catch-all page, returning HTTP 200 HTML text, which breaks `res.json()`.
   - Method mismatch: Shipment status updates and assignments send `PATCH` with JSON bodies to `/api/shipments/[id]`, whereas `ShipmentController.java` only exposes `PUT /api/shipments/{id}/status?status=...` and `PUT /api/shipments/{id}/assign?vehicleId=...&driverId=...`.

4. **Persistence & Production Safety Configurations**:
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\resources\application.yml:9,23`:
     `spring.profiles.active: ${SPRING_PROFILES_ACTIVE:prod}`
     `spring.datasource.url: ${SPRING_DATASOURCE_URL}`
     Strictly fails startup if PostgreSQL connection URL is missing. No fallback to H2 in `application.yml`.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\resources\application-dev.yml:3`:
     H2 database URL `jdbc:h2:mem:fleetvanedb...` is strictly isolated to `dev` profile.
   - `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\java\com\fleetvane\shared\config\DataInitializer.java:11`:
     Annotated with `@Profile({"dev", "demo"})`, ensuring no demo accounts or mock vehicles are seeded in production.

---

## 2. Logic Chain

1. **Premise**: Spring Boot uses Spring Data JPA's standard JSON serialization for `Page<T>` returns, wrapping elements inside `content: T[]` with metadata fields (`totalElements`, `totalPages`, `number`, `size`).
2. **Inference 1**: Frontend code that performs `await res.json()` on list endpoints receives an Object with property `content`, NOT an Array.
3. **Deduction 1**: Direct invocation of `.filter()`, `.slice()`, or `.map()` on the received object throws immediate JavaScript `TypeError` exceptions at runtime (Obs 1).
4. **Deduction 2**: Defensive checks such as `Array.isArray(res.data)` evaluate to `false`, causing the caller to fallback to `[]`, wiping out all actual data (e.g. `/api/activity` returning `[]` despite data in the database).
5. **Inference 2**: When frontend DTO field names differ from backend Java records (`UserDto.id` vs `UserPayload.userId`, `CreateShipmentRequest.originAddress` vs `origin`), the serialized JSON is either missing required validation fields (causing HTTP 400) or fails to bind (resulting in `undefined` properties in UI tables).
6. **Inference 3**: When Next.js API routes are missing, Next.js App Router's `[[...catchAll]]/page.tsx` renders the default HTML page. The browser's `res.json()` attempt fails with `SyntaxError: Unexpected token '<'`.
7. **Conclusion**: A unified response normalization layer with typed validation, robust proxy routing with query string preservation, and DTO field alignment are strictly required to achieve end-to-end contract integrity.

---

## 3. Caveats

- Backend optimization solver Timefold (`com.fleetvane.routing.service.RouteSolverService`) was verified through controller interfaces and entity definitions; full VRP solving execution requires running vehicle and shipment input sets.
- In `ManagerDrivers.tsx`, backend currently returns `DriverProfileDto` (which does not join `User.name` or `User.email`). If driver names are required in the table, the frontend normalization layer should enrich profile data or the backend endpoint should join `User`.

---

## 4. Conclusion

The audit identifies clear root causes for all runtime contract failures:
1. **R4**: Four critical components crash due to `Page<T>` unboxing failures (`ManagerShipments.tsx`, `ManagerDrivers.tsx`, `ClientDashboard.tsx`, `DriverReport.tsx`), and one route is permanently silenced (`/api/activity`).
2. **R4**: Authentication context fails to set `userId` due to `UserDto.id` naming mismatch, cascading into broken query parameters (`clientId=undefined`).
3. **R4**: Client shipment creation fails with HTTP 400 due to `originAddress`/`destinationAddress` payload naming mismatch.
4. **R5**: Five Next.js API proxies are missing or have HTTP method mismatches (e.g. PATCH vs PUT for shipment assignment/status).
5. **R7**: Production database safety is verified: production profile strictly requires PostgreSQL, Flyway migrations are complete, H2 is isolated to `dev`, and `DataInitializer` is gated to `dev`/`demo`.

All findings and exact remediation code have been documented in `analysis.md`.

---

## 5. Verification Method

### 5.1 Independent Code Inspection
- Inspect `c:\Users\ks919\Downloads\fleetvane-project\src\views\manager\ManagerShipments.tsx` at lines 151-155.
- Inspect `c:\Users\ks919\Downloads\fleetvane-project\src\views\client\ClientDashboard.tsx` at lines 110-124 and lines 164-169.
- Inspect `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend\src\main\resources\application.yml` at lines 9, 23.
- Inspect `c:\Users\ks919\Downloads\fleetvane-project\.agents\teamwork_preview_explorer_c_r1\analysis.md`.

### 5.2 Test & Build Verification Commands
- Backend build & test:
  ```bash
  cd "c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend"
  mvn clean test
  ```
- Frontend build & lint:
  ```bash
  cd "c:\Users\ks919\Downloads\fleetvane-project"
  npm run build
  npm run lint
  ```

### 5.3 Invalidation Conditions
- Any list endpoint returning `Page<T>` causing `.filter()` or `.map()` crashes in the browser console.
- Any API route returning HTML `<!DOCTYPE html>` when JSON was expected.
