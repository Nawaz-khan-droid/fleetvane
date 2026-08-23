-- V2 Migration: Soft Deletion for Users
ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
