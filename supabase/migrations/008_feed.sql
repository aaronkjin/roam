-- Migration 008: Feed feature
-- Published itineraries, likes, comments, saves, fork tracking

-- 1. Published itineraries (feed posts)
CREATE TABLE published_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  destination TEXT,
  cover_image_url TEXT,
  ai_summary TEXT,
  start_date DATE,
  end_date DATE,
  overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
  review_note TEXT,
  is_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  day_count INTEGER NOT NULL DEFAULT 0,
  block_count INTEGER NOT NULL DEFAULT 0,
  like_count INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  save_count INTEGER NOT NULL DEFAULT 0,
  fork_count INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id)
);

CREATE INDEX idx_published_destination ON published_itineraries (destination);
CREATE INDEX idx_published_user ON published_itineraries (user_id);
CREATE INDEX idx_published_at ON published_itineraries (published_at DESC);
CREATE INDEX idx_published_slug ON published_itineraries (slug);

-- Reuse the update_users_updated_at function (generic enough)
CREATE TRIGGER published_itineraries_updated_at
  BEFORE UPDATE ON published_itineraries
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 2. Likes
CREATE TABLE feed_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_id UUID NOT NULL REFERENCES published_itineraries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(published_id, user_id)
);

CREATE INDEX idx_feed_likes_published ON feed_likes (published_id);
CREATE INDEX idx_feed_likes_user ON feed_likes (user_id);

-- 3. Comments
CREATE TABLE feed_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_id UUID NOT NULL REFERENCES published_itineraries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feed_comments_published ON feed_comments (published_id);

CREATE TRIGGER feed_comments_updated_at
  BEFORE UPDATE ON feed_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_users_updated_at();

-- 4. Saves (bookmarks)
CREATE TABLE feed_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  published_id UUID NOT NULL REFERENCES published_itineraries(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(published_id, user_id)
);

CREATE INDEX idx_feed_saves_published ON feed_saves (published_id);
CREATE INDEX idx_feed_saves_user ON feed_saves (user_id);

-- 5. Fork tracking on trips
ALTER TABLE trips ADD COLUMN forked_from UUID REFERENCES published_itineraries(id) ON DELETE SET NULL;
