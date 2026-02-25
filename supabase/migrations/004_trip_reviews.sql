-- Add review/rating columns to trips
ALTER TABLE trips ADD COLUMN overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5);
ALTER TABLE trips ADD COLUMN review_note TEXT;

-- Update status CHECK to include 'completed'
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;
ALTER TABLE trips ADD CONSTRAINT trips_status_check
  CHECK (status IN ('planning', 'generated', 'finalized', 'archived', 'completed'));

-- Add review/rating columns to itinerary_blocks
ALTER TABLE itinerary_blocks ADD COLUMN rating INTEGER CHECK (rating BETWEEN 1 AND 5);
ALTER TABLE itinerary_blocks ADD COLUMN review_note TEXT;
