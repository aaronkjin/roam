-- Stay address on trips (Feature 3)
ALTER TABLE trips ADD COLUMN stay_address TEXT;
ALTER TABLE trips ADD COLUMN stay_lat DOUBLE PRECISION;
ALTER TABLE trips ADD COLUMN stay_lng DOUBLE PRECISION;

-- Transport options on blocks (Feature 6)
ALTER TABLE itinerary_blocks ADD COLUMN transport_options JSONB DEFAULT NULL;
ALTER TABLE itinerary_blocks ADD COLUMN selected_transport_mode TEXT DEFAULT NULL;
ALTER TABLE itinerary_blocks ADD COLUMN connects_from_block_id UUID REFERENCES itinerary_blocks(id) ON DELETE SET NULL;
ALTER TABLE itinerary_blocks ADD COLUMN connects_to_block_id UUID REFERENCES itinerary_blocks(id) ON DELETE SET NULL;
