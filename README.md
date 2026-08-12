# FleetVane — Enterprise Intelligent Fleet & Route Optimizer

FleetVane is an enterprise-grade, high-performance fleet tracking and dynamic route optimization engine designed for modern logistics operations. Built using a modular monolithic architecture with Spring Boot 3.4.1 (Java 21), Hibernate ORM, PostgreSQL (Flyway migrations), and Timefold VRP engine for back-end optimization, alongside a high-performance React 19 + Vite + Tailwind CSS v4 frontend.

---

## 🌟 Key Architectural Features

### 🏛️ Modular Monolith Architecture
- **Zero Cross-Module Leaks**: Modules strictly encapsulate internal domains (Entities, Repositories, DTOs).
- **Loose Coupling via ID References**: Modules reference entities from other modules via raw `Long`/`UUID` IDs rather than direct JPA relations to maintain independent boundary domains.
- **Transaction Safety**: Spring-managed `@Transactional` isolation boundaries ensure database integrity without distributed transaction overhead.

### 🔐 Modern JWT Authentication Infrastructure
- **Short-Lived Access Tokens**: In-memory storage only (React state machine context).
- **Long-Lived Refresh Tokens**: Persisted in PostgreSQL database with token-family invalidation (`refresh_tokens` table) and transmitted over `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- **Single-Retry Axios Interceptor**: Front-end queued retry logic prevents token-refresh stampedes under high concurrency.

### 🧭 High-Performance Dynamic Route Optimization
- **Timefold VRP Integration**: Implements Vehicle Routing Problem (VRP) solving algorithms directly in Java to calculate minimum-distance and time-window-optimized stop sequences.
- **Hybrid Mapping Engine**: Dynamically switches between OpenStreetMap/CartoDB (Leaflet) and Google Maps API v3 with real-time Traffic Layers.
- **OSRM Polyline Routing**: Real-time road network routing via Open Source Routing Machine APIs.

---

## 📁 Repository Structure

```
.
├── backend/                  # Spring Boot 3.4.1 Java 21 Backend
│   ├── src/main/java/com/fleetvane/
│   │   ├── auth/             # Authentication & Refresh Token Module
│   │   ├── fleet/            # Vehicle Management Module
│   │   ├── shipment/         # Delivery & State Machine Module
│   │   ├── driver/           # Driver Profiles & Availability
│   │   ├── incident/         # Live Incident & Exception Reporting
│   │   ├── routing/          # Timefold VRP Engine & Job Tracking
│   │   ├── tracking/         # Real-time Telemetry & Location Updates
│   │   └── shared/           # Base Entities, Auditing & Exception Handlers
│   ├── src/main/resources/
│   │   ├── db/migration/     # Flyway SQL Migrations (V1 Initial Schema)
│   │   └── application.yml   # Production-Ready Application Config
│   └── pom.xml               # Maven Build Configuration
│
└── frontend/                 # React 19 + Vite + Tailwind CSS v4 Frontend
    ├── src/
    │   ├── components/       # Radix UI Primitives, Maps & Layouts
    │   ├── context/          # Auth Context & Theme Provider
    │   ├── hooks/            # GPS Tracking & Map Provider Hooks
    │   ├── pages/            # Manager, Client, Driver Dashboards & Auth
    │   ├── services/         # Axios Client with Auto-Refresh Interceptor
    │   └── types/            # TypeScript Domain Definitions
    ├── index.html
    └── vite.config.ts
```

---

## 🛠️ Prerequisites & Local Setup

### Backend (Java 21 & Maven)
- **Java**: JDK 21+ installed and set in `JAVA_HOME`.
- **Database**: PostgreSQL database (e.g. Supabase or local PostgreSQL).
- **Build**: Run Maven to compile and run:
  ```bash
  cd backend
  mvn clean compile spring-boot:run
  ```

### Frontend (Node 18+ & Vite)
- **Node.js**: v18.0.0 or higher.
- **Install & Dev Server**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Production Build**:
  ```bash
  npm run build
  ```

---

## 🛡️ License & Acknowledgments
Developed for Capstone Project. Built using enterprise software practices, clean architecture, and modern full-stack web standards.
