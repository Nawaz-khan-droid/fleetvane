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
├── .env.example              # Template for root environment configuration
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

### Environment Variables Setup
Copy the `.env.example` template at the repository root to `.env` and fill in your database credentials:
```bash
cp .env.example .env
```

### Backend Configuration (`backend/src/main/resources/application.yml`)
The backend is driven entirely by `application.yml`. Provide database connection details via environment variables or directly in `application.yml`:
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/postgres}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:postgres}
  jpa:
    hibernate:
      ddl-auto: validate
  flyway:
    enabled: true
    locations: classpath:db/migration
```

### Backend Build & Test (Java 21 & Maven)
- **Java**: JDK 21+ installed and set in `JAVA_HOME`.
- **Compile & Unit Test Verification**:
  ```bash
  cd backend
  mvn clean compile
  mvn test
  ```

### Frontend Build (Node 18+ & Vite)
- **Node.js**: v18.0.0 or higher.
- **Install & Production Build**:
  ```bash
  cd frontend
  npm install
  npm run build
  ```

---

## 🛡️ License & Acknowledgments
Developed for Capstone Project. Built using enterprise software practices, clean architecture, and modern full-stack web standards.
