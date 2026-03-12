import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const authResult = await requireAuth();
  const userId = authResult?.userId || null;

  const supabase = await createClient();

  // Fetch published itinerary with author
  const { data: published, error } = await supabase
    .from("published_itineraries")
    .select("*, author:users!published_itineraries_user_id_fkey(id, email, display_name, avatar_url)")
    .eq("slug", slug)
    .single();

  if (error || !published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Fetch full itinerary data from the source trip
  const { data: days } = await supabase
    .from("itinerary_days")
    .select("*, blocks:itinerary_blocks(*)")
    .eq("trip_id", published.trip_id)
    .order("day_number", { ascending: true });

  // Sort blocks by position_index within each day
  const sortedDays = (days || []).map((day: any) => ({
    ...day,
    blocks: (day.blocks || []).sort(
      (a: any, b: any) => a.position_index - b.position_index
    ),
  }));

  // Check like/save status for authenticated user
  let is_liked = false;
  let is_saved = false;

  if (userId) {
    const [{ data: like }, { data: save }] = await Promise.all([
      supabase
        .from("feed_likes")
        .select("id")
        .eq("published_id", published.id)
        .eq("user_id", userId)
        .single(),
      supabase
        .from("feed_saves")
        .select("id")
        .eq("published_id", published.id)
        .eq("user_id", userId)
        .single(),
    ]);
    is_liked = !!like;
    is_saved = !!save;
  }

  return NextResponse.json({
    published: { ...published, is_liked, is_saved },
    days: sortedDays,
  });
}
