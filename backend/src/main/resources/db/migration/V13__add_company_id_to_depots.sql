-- V13__add_company_id_to_depots.sql

-- Add company_id to isolate depots per tenant
ALTER TABLE depots ADD COLUMN IF NOT EXISTS company_id BIGINT;

-- Note: Seeded depots will have company_id = NULL. 
-- In a real production migration, we might want to assign them to a system admin company,
-- or delete them if they shouldn't exist globally. We'll leave them as NULL,
-- but the backend will only query WHERE company_id = :managerCompanyId,
-- effectively hiding them from all standard managers.
