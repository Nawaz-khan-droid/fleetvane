-- Add Proof of Delivery columns to shipments table.
-- These store the driver's delivery photo and signature as Base64 text.
ALTER TABLE shipments ADD COLUMN pod_photo_base64 TEXT;
ALTER TABLE shipments ADD COLUMN pod_signature_base64 TEXT;
