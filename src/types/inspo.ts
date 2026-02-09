export type InspoType = "link" | "image" | "video" | "article" | "note";

export interface InspoItem {
  id: string;
  trip_id: string;
  type: InspoType;
  url: string | null;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
  user_note: string | null;
  tags: string[];
  position_index: number;
  created_at: string;
  updated_at: string;
}

export interface CreateInspoInput {
  trip_id: string;
  type: InspoType;
  url?: string;
  title?: string;
  description?: string;
  image_url?: string;
  site_name?: string;
  favicon_url?: string;
  user_note?: string;
  tags?: string[];
}

export interface UpdateInspoInput {
  type?: InspoType;
  url?: string;
  title?: string;
  description?: string;
  image_url?: string;
  user_note?: string;
  tags?: string[];
  position_index?: number;
}

export interface UrlPreview {
  url: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  site_name: string | null;
  favicon_url: string | null;
  type: InspoType;
}
