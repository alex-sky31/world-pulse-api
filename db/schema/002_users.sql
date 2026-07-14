-- Users table for authentication

SET search_path TO worldpulse, public;

CREATE TABLE IF NOT EXISTS worldpulse.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_email_idx ON worldpulse.users (email);

INSERT INTO worldpulse.schema_migrations (name)
VALUES ('002_users')
ON CONFLICT (name) DO NOTHING;
