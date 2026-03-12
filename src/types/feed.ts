import type { UserProfile } from "./collaborator";

export interface PublishedItinerary {
  id: string;
  trip_id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  destination: string | null;
  cover_image_url: string | null;
  ai_summary: string | null;
  start_date: string | null;
  end_date: string | null;
  date_range_label: string | null;
  overall_rating: number | null;
  review_note: string | null;
  is_reviewed: boolean;
  day_count: number;
  block_count: number;
  like_count: number;
  comment_count: number;
  save_count: number;
  fork_count: number;
  published_at: string;
  updated_at: string;
  // Joined data
  author?: UserProfile;
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface FeedComment {
  id: string;
  published_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: UserProfile;
}

export interface FeedFilters {
  destination?: string;
  sort?: "recent" | "popular" | "top_rated";
  page?: number;
  limit?: number;
}
