-- World Pulse API — initial database schema
-- Runs automatically on first Docker PostgreSQL startup.

CREATE SCHEMA IF NOT EXISTS worldpulse;

SET search_path TO worldpulse, public;

CREATE TABLE IF NOT EXISTS worldpulse.schema_migrations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO worldpulse.schema_migrations (name)
VALUES ('001_init')
ON CONFLICT (name) DO NOTHING;

COMMENT ON SCHEMA worldpulse IS 'Application schema for World Pulse API';
