-- V6: Volumetric capacity, shipment dimensions, and depot FK for vehicles

-- Vehicles: dual-capacity (weight + volume) and current load tracking
ALTER TABLE vehicles ADD COLUMN max_volume_m3     DOUBLE PRECISION NOT NULL DEFAULT 30.0;
ALTER TABLE vehicles ADD COLUMN current_weight_kg  DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE vehicles ADD COLUMN current_volume_m3  DOUBLE PRECISION NOT NULL DEFAULT 0.0;
ALTER TABLE vehicles ADD COLUMN depot_id           BIGINT REFERENCES depots(id);

-- Shipments: client-submitted dimensions for volumetric capacity checks
ALTER TABLE shipments ADD COLUMN length_cm  DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN width_cm   DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN height_cm  DOUBLE PRECISION;
ALTER TABLE shipments ADD COLUMN volume_m3  DOUBLE PRECISION;
