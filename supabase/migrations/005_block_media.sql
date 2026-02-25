-- Block media table for photos/videos attached to itinerary blocks during review
CREATE TABLE block_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id UUID NOT NULL REFERENCES itinerary_blocks(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  filename TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_block_media_block ON block_media(block_id);

-- Supabase Storage bucket for block media
INSERT INTO storage.buckets (id, name, public)
VALUES ('block-media', 'block-media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for anonymous access (no auth MVP)
CREATE POLICY "block_media_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'block-media');

CREATE POLICY "block_media_public_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'block-media');

CREATE POLICY "block_media_public_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'block-media');
