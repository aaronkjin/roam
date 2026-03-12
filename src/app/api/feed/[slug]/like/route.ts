import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { userId } = authResult;
  const { slug } = await params;

  const supabase = await createClient();

  // Find published itinerary
  const { data: published } = await supabase
    .from("published_itineraries")
    .select("id, like_count")
    .eq("slug", slug)
    .single();

  if (!published) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("feed_likes")
    .select("id")
    .eq("published_id", published.id)
    .eq("user_id", userId)
    .single();

  if (existing) {
    // Unlike
    await supabase.from("feed_likes").delete().eq("id", existing.id);
    await supabase
      .from("published_itineraries")
      .update({ like_count: Math.max(0, published.like_count - 1) })
      .eq("id", published.id);

    return NextResponse.json({
      liked: false,
      like_count: Math.max(0, published.like_count - 1),
    });
  } else {
    // Like
    await supabase.from("feed_likes").insert({
      published_id: published.id,
      user_id: userId,
    });
    await supabase
      .from("published_itineraries")
      .update({ like_count: published.like_count + 1 })
      .eq("id", published.id);

    return NextResponse.json({
      liked: true,
      like_count: published.like_count + 1,
    });
  }
}
