import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import type { PublishedItinerary } from "@/types/feed";

interface SavedFeedRow {
  published_id: string;
  created_at: string;
  published: PublishedItinerary | null;
}

export async function GET() {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;

  const supabase = await createClient();

  const { data: saves, error } = await supabase
    .from("feed_saves")
    .select("published_id, created_at, published:published_itineraries(*, author:users!published_itineraries_user_id_fkey(id, email, display_name, avatar_url))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/feed/saved]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const publishedItems = ((saves || []) as unknown as SavedFeedRow[])
    .filter((save): save is SavedFeedRow & { published: PublishedItinerary } => !!save.published)
    .map((save) => save.published);

  const publishedIds = publishedItems.map((item) => item.id);

  const [{ data: likes }, { data: saveRows }] = await Promise.all([
    supabase
      .from("feed_likes")
      .select("published_id")
      .eq("user_id", userId)
      .in("published_id", publishedIds),
    supabase
      .from("feed_saves")
      .select("published_id")
      .eq("user_id", userId)
      .in("published_id", publishedIds),
  ]);

  const likedSet = new Set((likes || []).map((row: { published_id: string }) => row.published_id));
  const savedSet = new Set((saveRows || []).map((row: { published_id: string }) => row.published_id));

  const items = publishedItems.map((item) => ({
    ...item,
    is_liked: likedSet.has(item.id),
    is_saved: savedSet.has(item.id),
  }));

  return NextResponse.json({ items });
}
