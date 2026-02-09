export type BlockType =
  | "activity"
  | "transport"
  | "accommodation"
  | "food"
  | "note"
  | "heading";

export type GenerationMode = "strict" | "creative";

export interface ItineraryDay {
  id: string;
  trip_id: string;
  day_number: number;
  date: string | null;
  title: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
  blocks?: ItineraryBlock[];
}

export interface ItineraryBlock {
  id: string;
  day_id: string;
  type: BlockType;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  location: string | null;
  location_lat: number | null;
  location_lng: number | null;
  cost_estimate: number | null;
  currency: string;
  url: string | null;
  image_url: string | null;
  position_index: number;
  ai_generated: boolean;
  source_inspo_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBlockInput {
  day_id: string;
  type: BlockType;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  cost_estimate?: number;
  currency?: string;
  url?: string;
  image_url?: string;
  position_index?: number;
  ai_generated?: boolean;
  source_inspo_id?: string;
}

export interface UpdateBlockInput {
  type?: BlockType;
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  location_lat?: number;
  location_lng?: number;
  cost_estimate?: number;
  currency?: string;
  url?: string;
  image_url?: string;
  position_index?: number;
}

export interface GenerationLog {
  id: string;
  trip_id: string;
  mode: GenerationMode;
  prompt_snapshot: string | null;
  inspo_snapshot: Record<string, unknown> | null;
  raw_response: string | null;
  created_at: string;
}

export interface GeneratedItinerary {
  days: GeneratedDay[];
}

export interface GeneratedDay {
  day_number: number;
  title: string;
  summary: string;
  blocks: GeneratedBlock[];
}

export interface GeneratedBlock {
  type: BlockType;
  title: string;
  description: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  location?: string;
  cost_estimate?: number;
  currency?: string;
}
