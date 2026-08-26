-- ────────────────────────────────────────────────────────────────────────────
-- V5: Add Depots table — vehicle home base / initial parking location
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE depots (
    id          BIGSERIAL        PRIMARY KEY,
    name        VARCHAR(100)     NOT NULL,
    city        VARCHAR(100)     NOT NULL,
    address     VARCHAR(255),
    lat         DOUBLE PRECISION NOT NULL CHECK (lat BETWEEN -90 AND 90),
    lng         DOUBLE PRECISION NOT NULL CHECK (lng BETWEEN -180 AND 180),
    is_active   BOOLEAN          NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP        NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP        NOT NULL DEFAULT NOW()
);

-- Seed initial Indian city depots
INSERT INTO depots (name, city, address, lat, lng) VALUES
  ('Mumbai HQ',       'Mumbai',    'Nariman Point, Mumbai, MH 400021',          19.0760,  72.8777),
  ('Delhi Hub',       'New Delhi', 'Connaught Place, New Delhi, DL 110001',     28.6139,  77.2090),
  ('Bengaluru Hub',   'Bengaluru', 'MG Road, Bengaluru, KA 560001',             12.9716,  77.5946),
  ('Hyderabad Hub',   'Hyderabad', 'Banjara Hills, Hyderabad, TS 500034',       17.3850,  78.4867),
  ('Chennai Hub',     'Chennai',   'Anna Salai, Chennai, TN 600002',            13.0827,  80.2707),
  ('Kolkata Hub',     'Kolkata',   'Park Street, Kolkata, WB 700016',           22.5726,  88.3639),
  ('Ahmedabad Hub',   'Ahmedabad', 'CG Road, Ahmedabad, GJ 380009',             23.0225,  72.5714),
  ('Jaipur Hub',      'Jaipur',    'MI Road, Jaipur, RJ 302001',                26.9124,  75.7873),
  ('Pune Hub',        'Pune',      'FC Road, Pune, MH 411004',                  18.5204,  73.8567),
  ('Surat Hub',       'Surat',     'Ring Road, Surat, GJ 395002',               21.1702,  72.8311);
