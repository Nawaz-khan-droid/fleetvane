-- ══════════════════════════════════════════════════════════════════════════════
-- Migration V3: Add ADMIN to users role constraint
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('CLIENT', 'DRIVER', 'MANAGER', 'ADMIN'));
