-- V11: Raw invitation tokens from the legacy flow cannot be safely migrated.
-- Invalidating unused links forces a freshly generated, SHA-256-hashed token.
DELETE FROM invitation_tokens WHERE is_used = FALSE;
