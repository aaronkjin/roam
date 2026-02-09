-- ITINERARY DAYS
CREATE TABLE public.itinerary_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  date DATE,
  title TEXT,
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trip_id, day_number)
);

-- ITINERARY BLOCKS
CREATE TABLE public.itinerary_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('activity','transport','accommodation','food','note','heading')),
  title TEXT NOT NULL,
  description TEXT,
  start_time TIME,
  end_time TIME,
  duration_minutes INTEGER,
  location TEXT,
  location_lat DECIMAL(10,7),
  location_lng DECIMAL(10,7),
  cost_estimate DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  url TEXT,
  image_url TEXT,
  position_index INTEGER DEFAULT 0,
  ai_generated BOOLEAN DEFAULT FALSE,
  source_inspo_id UUID REFERENCES public.inspo_items(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GENERATION LOGS
CREATE TABLE public.generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('strict','creative')),
  prompt_snapshot TEXT,
  inspo_snapshot JSONB,
  raw_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_itinerary_days_trip_id ON public.itinerary_days(trip_id);
CREATE INDEX idx_itinerary_blocks_day_id ON public.itinerary_blocks(day_id);
CREATE INDEX idx_generation_logs_trip_id ON public.generation_logs(trip_id);

-- Triggers
CREATE TRIGGER itinerary_days_updated_at
  BEFORE UPDATE ON public.itinerary_days
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER itinerary_blocks_updated_at
  BEFORE UPDATE ON public.itinerary_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
