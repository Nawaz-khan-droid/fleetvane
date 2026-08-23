# FleetVane Project Scope & Architecture

## Architecture
- **Frontend**: Next.js (App Router / TypeScript / Tailwind CSS / Lucide / Leaflet / Google Maps) located in `c:\Users\ks919\Downloads\fleetvane-project`.
- **Backend**: Spring Boot Modular Monolith (Java 21, Maven, PostgreSQL, JPA/Hibernate, Spring Security JWT, Flyway migrations) located in `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend` and project root.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | UI/UX Audit & Layout Stability | Complete audit across all roles (Admin, Manager, Driver, Client, Public), viewports (375px, 768px, 1440px), and themes | M1 | ORIGINAL_REQUEST § R1, R8, R10, R11 |
| 2 | Navigation & Routing Integrity | Route graph validation, role-based guard, deep links, refresh integrity, eliminate dead links/loops | M1 | ORIGINAL_REQUEST § R2, R6 |
| 3 | Leaflet Lifecycle & Refresh Elimination | Fix map reinitialization loop, marker reconciliation, tile layer setup, clean up unmount | M2 | ORIGINAL_REQUEST § R3.1, R3.2, R3.8 |
| 4 | Google Maps Zoom/Pan Stability | Fix page ejection/crash/reset on zoom/pan, API loader lifecycle, controlled options | M2 | ORIGINAL_REQUEST § R3.3 |
| 5 | Map Provider Toggle & Traffic & Simulation | High-usability provider toggle, Google traffic layer control, simulation endpoint integration | M2 | ORIGINAL_REQUEST § R3.4, R3.5, R3.6, R3.7 |
| 6 | API Contract Alignment & Page<T> Normalization | Spring Boot Page<T> vs Array parsing, strict ApiContractError, eliminate HTML fallthrough | M3 | ORIGINAL_REQUEST § R4, R5, R9 |
| 7 | Auth, Session & Security Lifecycle | Token refresh, logout, session restoration, redirect stability, login error UI stability | M1 | ORIGINAL_REQUEST § R6 |
| 8 | Database Persistence & Production Safety | Verify PostgreSQL configuration, Flyway migrations, prevent silent fallback to H2 in prod | M3 | ORIGINAL_REQUEST § R7, R14 |
| 9 | Multi-Viewport & Theme QA Matrix | Comprehensive automated & manual regression test across 375px/768px/1440px, Light/Dark, roles | M4 | ORIGINAL_REQUEST § R12, R13, R15, R16 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M0 | Survey & Forensic Exploration | Deep-dive code analysis across UI/UX, Maps, API/Backend, Security/Routing | None | DONE |
| M1 | UI/UX, Navigation & Auth Hardening | Fix runtime crashes, deep linking, quick actions, dead routes, fake data, auth stability | M0 | IN_PROGRESS |
| M2 | Map Subsystem Forensic Fixes | Decouple map init from polling, eliminate Leaflet loops, fix Google zoom crash, provider toggle, traffic & simulation | M0 | PLANNED |
| M3 | API Contract & Proxy Normalization | Spring Page<T> normalization, DTO field alignment, query string preservation, missing proxy endpoints | M0 | PLANNED |
| M4 | Comprehensive QA Matrix & Forensic Audit | Build/test verification (npm run lint, npm run build, mvn test), multi-viewport/theme verification, auditor gate | M1, M2, M3 | PLANNED |

## Interface Contracts
- **Map Controller ↔ Map Components**: State preservation on provider toggle (`activeProvider: 'leaflet' | 'google'`), vehicle markers, selected vehicle, routes, zoom/center synchronization. Map container initialized once; markers updated incrementally.
- **API Proxy ↔ Spring Boot Backend**: Normalization of `Page<T>` `{ content: T[], totalElements: number, ... }` to typed collections. No HTML fallthrough on 404/500. Query strings forwarded.
- **Auth Store ↔ Route Guards**: Consistent token storage, silent refresh without page ejection, secure logout and redirect handling inside useEffect.

## Code Layout
- Frontend Source: `c:\Users\ks919\Downloads\fleetvane-project\src`
- Backend Source: `c:\Users\ks919\OneDrive\Desktop\Capstone Project\backend`
- Agent Workspaces: `c:\Users\ks919\Downloads\fleetvane-project\.agents\*`
