-- V14__add_companies_and_shipment_columns.sql

CREATE TABLE IF NOT EXISTS companies (
    id          BIGSERIAL    PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    type        VARCHAR(50)  NOT NULL,
    status      VARCHAR(30)  DEFAULT 'ACTIVE',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    created_by  VARCHAR(255),
    updated_by  VARCHAR(255),
    version     BIGINT       NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS transport_company_id BIGINT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS qr_token VARCHAR(128);

CREATE INDEX IF NOT EXISTS idx_shipments_transport_company_id ON shipments(transport_company_id);

-- Align driver_shifts with DriverShift entity compliance and tracking fields
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS last_break_at TIMESTAMP;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS is_on_break BOOLEAN DEFAULT FALSE;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS total_driving_seconds INTEGER DEFAULT 0;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS compliance_breached BOOLEAN DEFAULT FALSE;
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS breach_reason VARCHAR(255);
ALTER TABLE driver_shifts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
