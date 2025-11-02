-- Phase 1a: Add coach role to enum (must be in separate transaction)
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'coach';