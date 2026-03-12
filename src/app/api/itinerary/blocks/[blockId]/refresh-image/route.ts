import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, resolveTripId, requireTripAccess } from "@/lib/auth";
import { fetchPexelsImage, buildFallbackQueries } from "@/lib/pexels";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ blockId: string }> }
) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { blockId } = await params;
  const tripId = await resolveTripId("block", blockId);
  if (!tripId) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();
  const { data: block } = await supabase
    .from("itinerary_blocks")
    .select("title, type, location")
    .eq("id", blockId)
    .single();

  if (!block) {
    return NextResponse.json({ error: "Block not found" }, { status: 404 });
  }

  // Build search queries
  const primaryQuery = `${block.title} ${block.location || ""} ${block.type}`.trim();
  const fallbacks = buildFallbackQueries(block.title, block.type, block.location);

  const imageUrl = await fetchPexelsImage(primaryQuery, fallbacks);

  if (imageUrl) {
    await supabase
      .from("itinerary_blocks")
      .update({ image_url: imageUrl })
      .eq("id", blockId);
  }

  return NextResponse.json({ image_url: imageUrl });
}
