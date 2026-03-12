import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  const userId = authResult?.userId || null;

  const { searchParams } = new URL(req.url);
  const destination = searchParams.get("destination") || "";
  const sort = searchParams.get("sort") || "recent";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = (page - 1) * limit;

  const supabase = await createClient();

  // Build query
  let query = supabase
    .from("published_itineraries")
    .select("*, author:users!published_itineraries_user_id_fkey(id, email, display_name, avatar_url)", { count: "exact" });

  // Destination search
  if (destination) {
    query = query.ilike("destination", `%${destination}%`);
  }

  // Sorting
  if (sort === "popular") {
    query = query.order("like_count", { ascending: false });
  } else if (sort === "top_rated") {
    query = query.order("overall_rating", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("published_at", { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error("[GET /api/feed]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let items = data || [];

  // If authenticated, check which items the user has liked/saved
  if (userId && items.length > 0) {
    const publishedIds = items.map((item: any) => item.id);

    const [{ data: likes }, { data: saves }] = await Promise.all([
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

    const likedSet = new Set((likes || []).map((l: any) => l.published_id));
    const savedSet = new Set((saves || []).map((s: any) => s.published_id));

    items = items.map((item: any) => ({
      ...item,
      is_liked: likedSet.has(item.id),
      is_saved: savedSet.has(item.id),
    }));
  }

  return NextResponse.json({
    items,
    total: count || 0,
    page,
    hasMore: offset + limit < (count || 0),
  });
}
