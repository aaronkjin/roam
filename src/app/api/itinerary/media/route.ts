import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET all media for a trip's blocks (batch fetch)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tripId = req.nextUrl.searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  // Get all block IDs for this trip
  const { data: days, error: daysError } = await supabase
    .from("itinerary_days")
    .select("id")
    .eq("trip_id", tripId);

  if (daysError) {
    return NextResponse.json({ error: daysError.message }, { status: 500 });
  }

  if (!days || days.length === 0) {
    return NextResponse.json({});
  }

  const dayIds = days.map((d) => d.id);

  const { data: blocks, error: blocksError } = await supabase
    .from("itinerary_blocks")
    .select("id")
    .in("day_id", dayIds);

  if (blocksError) {
    return NextResponse.json({ error: blocksError.message }, { status: 500 });
  }

  if (!blocks || blocks.length === 0) {
    return NextResponse.json({});
  }

  const blockIds = blocks.map((b) => b.id);

  // Fetch all media for these blocks
  const { data: media, error: mediaError } = await supabase
    .from("block_media")
    .select("*")
    .in("block_id", blockIds)
    .order("created_at", { ascending: true });

  if (mediaError) {
    return NextResponse.json({ error: mediaError.message }, { status: 500 });
  }

  // Group by block_id
  const grouped: Record<string, typeof media> = {};
  for (const item of media || []) {
    if (!grouped[item.block_id]) {
      grouped[item.block_id] = [];
    }
    grouped[item.block_id].push(item);
  }

  return NextResponse.json(grouped);
}
