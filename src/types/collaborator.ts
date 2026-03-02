export type CollaboratorRole = "owner" | "editor" | "viewer";

export interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface TripCollaborator {
  id: string;
  trip_id: string;
  user_id: string;
  role: "editor" | "viewer";
  invited_by: string | null;
  invited_email: string | null;
  accepted_at: string | null;
  created_at: string;
  user?: UserProfile;
}

export interface PendingInvite {
  id: string;
  trip_id: string;
  email: string;
  role: "editor" | "viewer";
  invited_by: string | null;
  created_at: string;
}
