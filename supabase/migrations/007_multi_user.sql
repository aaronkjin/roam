-- Migration 007: Multi-user support
-- Adds users cache table, trip_collaborators, pending_invites
-- Changes trips.user_id from UUID to TEXT (for Clerk IDs)

-- 1. Alter trips.user_id from UUID to TEXT
ALTER TABLE trips
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Recreate index on user_id
DROP INDEX IF EXISTS idx_trips_user_id;
CREATE INDEX idx_trips_user_id ON trips (user_id);

-- 2. Create users table (Clerk cache)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 3. Create trip_collaborators table
CREATE TABLE IF NOT EXISTS trip_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by TEXT REFERENCES users(id),
  invited_email TEXT,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, user_id)
);

CREATE INDEX idx_trip_collaborators_user_id ON trip_collaborators (user_id);
CREATE INDEX idx_trip_collaborators_trip_id ON trip_collaborators (trip_id);

-- 4. Create pending_invites table
CREATE TABLE IF NOT EXISTS pending_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('editor', 'viewer')),
  invited_by TEXT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, email)
);

CREATE INDEX idx_pending_invites_email ON pending_invites (email);
