export type TripStatus = "planning" | "generated" | "finalized" | "archived" | "completed";

export interface Trip {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  destination: string | null;
  cover_image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  status: TripStatus;
  share_token: string | null;
  overall_rating: number | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTripInput {
  title: string;
  description?: string;
  destination?: string;
  start_date?: string;
  end_date?: string;
}

export interface UpdateTripInput {
  title?: string;
  description?: string;
  destination?: string;
  cover_image_url?: string;
  start_date?: string;
  end_date?: string;
  status?: TripStatus;
  overall_rating?: number;
  review_note?: string;
}

export type CollaboratorRole = "owner" | "editor" | "viewer";

export interface TripWithRole extends Trip {
  userRole: CollaboratorRole;
}
