-- ══════════════════════════════════════════════════════════════════════════════
-- FleetVane v2 — Initial Schema
-- Database: PostgreSQL 17 (Supabase)
-- Migration tool: Flyway
-- ══════════════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────────────
-- Users
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE users (
    id          BIGSERIAL    PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,  -- UNIQUE constraint auto-creates index
    password_hash VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'CLIENT'
                CHECK (role IN ('CLIENT', 'DRIVER', 'MANAGER')),
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX idx_users_role ON users(role);

-- ────────────────────────────────────────────────────────────────────────────
-- Refresh Tokens (Correction #1: Token persistence + family tracking)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE refresh_tokens (
    id          UUID         PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(255) NOT NULL,
    family_id   UUID         NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    revoked_at  TIMESTAMP,
    replaced_by UUID,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family_id ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- ────────────────────────────────────────────────────────────────────────────
-- Vehicles
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE vehicles (
    id           BIGSERIAL          PRIMARY KEY,
    plate_number VARCHAR(20)        NOT NULL UNIQUE,
    type         VARCHAR(20)        NOT NULL DEFAULT 'TRUCK'
                 CHECK (type IN ('VAN', 'TRUCK', 'HEAVY_HAULER')),
    model        VARCHAR(100)       NOT NULL,
    capacity     DOUBLE PRECISION   NOT NULL CHECK (capacity > 0),
    fuel_type    VARCHAR(20)        NOT NULL DEFAULT 'DIESEL',
    status       VARCHAR(20)        NOT NULL DEFAULT 'AVAILABLE'
                 CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED')),
    lat          DOUBLE PRECISION   NOT NULL DEFAULT 19.076
                 CHECK (lat BETWEEN -90 AND 90),
    lng          DOUBLE PRECISION   NOT NULL DEFAULT 72.8777
                 CHECK (lng BETWEEN -180 AND 180),
    heading      DOUBLE PRECISION   NOT NULL DEFAULT 0,
    created_at   TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP          NOT NULL DEFAULT NOW(),
    version      BIGINT             NOT NULL DEFAULT 0
);

CREATE INDEX idx_vehicles_status ON vehicles(status);

-- ────────────────────────────────────────────────────────────────────────────
-- Driver Profiles
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE driver_profiles (
    id             BIGSERIAL    PRIMARY KEY,
    user_id        BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(50)  NOT NULL UNIQUE,
    vehicle_id     BIGINT       REFERENCES vehicles(id) ON SET NULL,
    is_available   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    version        BIGINT       NOT NULL DEFAULT 0
);

-- ────────────────────────────────────────────────────────────────────────────
-- Shipments (Correction #6: weight NOT NULL, timestamp fields for state machine)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE shipments (
    id                  BIGSERIAL          PRIMARY KEY,
    client_id           BIGINT             NOT NULL REFERENCES users(id),
    status              VARCHAR(20)        NOT NULL DEFAULT 'REQUESTED'
                        CHECK (status IN ('REQUESTED', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED')),
    origin_address      VARCHAR(500)       NOT NULL,
    origin_lat          DOUBLE PRECISION,
    origin_lng          DOUBLE PRECISION,
    destination_address VARCHAR(500)       NOT NULL,
    destination_lat     DOUBLE PRECISION,
    destination_lng     DOUBLE PRECISION,
    weight              DOUBLE PRECISION   NOT NULL CHECK (weight > 0),
    eta                 TIMESTAMP,
    assigned_at         TIMESTAMP,
    picked_up_at        TIMESTAMP,
    delivered_at        TIMESTAMP,
    cancelled_at        TIMESTAMP,
    vehicle_id          BIGINT             REFERENCES vehicles(id),
    driver_id           BIGINT             REFERENCES users(id),
    created_at          TIMESTAMP          NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP          NOT NULL DEFAULT NOW(),
    version             BIGINT             NOT NULL DEFAULT 0
);

CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipments_client_id ON shipments(client_id);
CREATE INDEX idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX idx_shipments_vehicle_id ON shipments(vehicle_id);
CREATE INDEX idx_shipments_created_at ON shipments(created_at);

-- ────────────────────────────────────────────────────────────────────────────
-- Incident Reports
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE incident_reports (
    id           BIGSERIAL          PRIMARY KEY,
    type         VARCHAR(20)        NOT NULL
                 CHECK (type IN ('DELAY', 'INCIDENT', 'BREAKDOWN', 'OTHER')),
    description  TEXT               NOT NULL,
    lat          DOUBLE PRECISION,
    lng          DOUBLE PRECISION,
    driver_id    BIGINT             NOT NULL REFERENCES users(id),
    shipment_id  BIGINT             REFERENCES shipments(id),
    created_at   TIMESTAMP          NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_incidents_driver_id ON incident_reports(driver_id);
CREATE INDEX idx_incidents_shipment_id ON incident_reports(shipment_id);

-- ────────────────────────────────────────────────────────────────────────────
-- Optimization Jobs (Correction #3: Timefold job persistence)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE optimization_jobs (
    id            UUID         PRIMARY KEY,
    status        VARCHAR(20)  NOT NULL DEFAULT 'REQUESTED'
                  CHECK (status IN ('REQUESTED', 'SOLVING', 'SOLVED', 'FAILED')),
    requested_by  BIGINT       NOT NULL REFERENCES users(id),
    score         VARCHAR(100),
    error_message TEXT,
    result_json   TEXT,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    started_at    TIMESTAMP,
    completed_at  TIMESTAMP
);
