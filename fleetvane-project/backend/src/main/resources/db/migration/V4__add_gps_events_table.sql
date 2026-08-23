-- ══════════════════════════════════════════════════════════════════════════════
-- FleetVane v2.1 — Historical GPS Telemetry Storage
-- Adds a time-series table for storing vehicle location history
-- Allows route replay, historical analysis, and incident reconstruction
-- ══════════════════════════════════════════════════════════════════════════════

CREATE TABLE gps_events (
    id          BIGSERIAL      PRIMARY KEY,
    vehicle_id  BIGINT         NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    lat         DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng         DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
    heading     DOUBLE PRECISION NOT NULL DEFAULT 0,
    speed       DOUBLE PRECISION,
    recorded_at TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gps_events_vehicle_id_recorded_at ON gps_events(vehicle_id, recorded_at DESC);
CREATE INDEX idx_gps_events_recorded_at ON gps_events(recorded_at);
