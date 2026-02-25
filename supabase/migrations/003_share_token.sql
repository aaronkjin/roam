-- Add share_token column to trips for public sharing
ALTER TABLE trips ADD COLUMN share_token TEXT UNIQUE;

-- Index for fast lookups by share token
CREATE INDEX idx_trips_share_token ON trips (share_token) WHERE share_token IS NOT NULL;
