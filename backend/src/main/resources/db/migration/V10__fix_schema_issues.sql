-- V10: Database Schema Fixes and Optimizations
-- Note: V9 already contains ON DELETE CASCADE for invitation_tokens
-- Note: V5 and V6 correctly sequenced depots table creation and foreign key assignment

-- 1. Multi-Tenant Grounding on vehicles and depots
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS company_id BIGINT;
ALTER TABLE depots ADD COLUMN IF NOT EXISTS company_id BIGINT;

-- 2. Clean Status Mapping on users
-- Drop is_active column since status column natively handles state (added in V9)
ALTER TABLE users DROP COLUMN IF EXISTS is_active;
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'PENDING_ACTIVATION';

-- Update existing records that might have 'active' (lowercase) to 'ACTIVE' (uppercase)
UPDATE users SET status = 'ACTIVE' WHERE status = 'active';

-- 3. Mobile GPS Event Binding
-- Add driver_id to track mobile telemetry directly to the user record
ALTER TABLE gps_events ADD COLUMN IF NOT EXISTS driver_id BIGINT REFERENCES users(id);

-- 4. Driver Shifts Foreign Keys (Hibernate created this table automatically, applying explicit constraints for Flyway consistency)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'driver_shifts') THEN
        ALTER TABLE driver_shifts DROP CONSTRAINT IF EXISTS driver_shifts_driver_fkey;
        ALTER TABLE driver_shifts ADD CONSTRAINT driver_shifts_driver_fkey FOREIGN KEY (driver_id) REFERENCES users(id);
        
        ALTER TABLE driver_shifts DROP CONSTRAINT IF EXISTS driver_shifts_vehicle_fkey;
        ALTER TABLE driver_shifts ADD CONSTRAINT driver_shifts_vehicle_fkey FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
    END IF;
END $$;
