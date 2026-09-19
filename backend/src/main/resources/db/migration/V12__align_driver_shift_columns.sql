-- V12: Repair the legacy V10 column names without changing an applied migration.
-- Preserve any existing data, then remove fields that are not mapped by DriverShift.
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS shift_started_at TIMESTAMP;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS shift_ended_at TIMESTAMP;

UPDATE driver_shifts
SET shift_started_at = CURRENT_TIMESTAMP
WHERE shift_started_at IS NULL;

ALTER TABLE driver_shifts ALTER COLUMN shift_started_at SET NOT NULL;
ALTER TABLE driver_shifts DROP COLUMN IF EXISTS start_time;
ALTER TABLE driver_shifts DROP COLUMN IF EXISTS end_time;
ALTER TABLE driver_shifts DROP COLUMN IF EXISTS status;
