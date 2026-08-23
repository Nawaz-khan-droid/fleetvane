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
- **Role-Based Access Control (RBAC)**: Enforces `MANAGER`, `DRIVER`, and `CLIENT` authorization across endpoints. Public signup is strictly locked down to `CLIENT` mode to prevent unauthorized role elevation.

### 🧭 High-Performance Dynamic Route Optimization
- **Timefold VRP Integration**: Implements Vehicle Routing Problem (VRP) solving algorithms directly in Java to calculate minimum-distance and capacity-optimized stop sequences.
- **Constraint Scoring**: Detects capacity violations through hard-score penalties (`-18000hard` excess weight penalty).
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
│   │   └── application.yml   # Application Config (ddl-auto: validate)
│   └── pom.xml               # Maven Build Configuration
│
└── frontend/                 # React 19 + Vite + Tailwind CSS v4 Frontend
    ├── src/
    │   ├── components/       # Radix UI Primitives, Maps & Layouts
    │   ├── context/          # Auth Context & Theme Provider
    │   ├── hooks/            # GPS Tracking & Map Provider Hooks
    │   ├── pages/            # 18 Routes: Manager, Client, Driver & Auth
    │   ├── services/         # Axios Client with Auto-Refresh Interceptor
    │   └── types/            # TypeScript Domain Definitions
    ├── index.html
    └── vite.config.ts
```

---

## 🛠️ Prerequisites & Local Setup

### System Prerequisites
1. **Java Development Kit (JDK 21+)**
2. **Apache Maven (3.9+)**
3. **Node.js (v18.0.0+)**
4. **PostgreSQL / Supabase Database (or local H2 fallback for dev/testing)**

### Backend Configuration (`backend/src/main/resources/application.yml`)
The backend is configured via `application.yml`. You can specify live Supabase PostgreSQL credentials via environment variables:

```bash
export SPRING_DATASOURCE_URL="jdbc:postgresql://<your-supabase-host>:5432/postgres"
export SPRING_DATASOURCE_USERNAME="postgres"
export SPRING_DATASOURCE_PASSWORD="<your-supabase-password>"
export JWT_SECRET="c2VjcmV0LWtleS1mb3ItZmxlZXR2YW5lLWp3dC1hdXRoZW50aWNhdGlvbi1zZWN1cmUtZXhhbXBsZQ=="
```

### Backend Build, Test & Run Commands
```bash
cd backend

# Full Build & Test Verification (Executes all JUnit 5 unit tests & produces executable JAR)
mvn clean verify

# Run Spring Boot Application
mvn spring-boot:run
```

### Frontend Build & Run Commands
```bash
cd frontend

# Install dependencies
npm install

# Run Development Server
npm run dev

# Build Production Bundle
npm run build
```

---

## 🛡️ License & Acknowledgments
Developed for Capstone Project. Built using enterprise software practices, clean architecture, and modern full-stack web standards.
