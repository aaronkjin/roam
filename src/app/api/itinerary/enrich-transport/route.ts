import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";
import { buildTransportOptions, defaultTransportMode } from "@/lib/transport";

export async function POST(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { trip_id, day_id } = body;

  if (!trip_id) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const access = await requireTripAccess(authResult.userId, trip_id, "editor");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = await createClient();

  // Fetch days and blocks
  let daysQuery = supabase
    .from("itinerary_days")
    .select("*, blocks:itinerary_blocks(*)")
    .eq("trip_id", trip_id)
    .order("day_number", { ascending: true });

  if (day_id) {
    daysQuery = daysQuery.eq("id", day_id);
  }

  const { data: days, error } = await daysQuery;
  if (error || !days) {
    return NextResponse.json({ error: error?.message || "No days found" }, { status: 500 });
  }

  let transportBlocksCreated = 0;

  for (const day of days) {
    const blocks = ((day as any).blocks || [])
      .filter((b: any) => b.location_lat && b.location_lng && b.type !== "heading" && b.type !== "note" && b.type !== "transport")
      .sort((a: any, b: any) => a.position_index - b.position_index);

    for (let i = 0; i < blocks.length - 1; i++) {
      const from = blocks[i];
      const to = blocks[i + 1];

      const options = await buildTransportOptions(
        { lat: from.location_lat, lng: from.location_lng },
        { lat: to.location_lat, lng: to.location_lng }
      );

      if (options.length === 0) continue;

      const defaultMode = defaultTransportMode(options[0]?.distance_meters || 0);
      const selectedOption = options.find((o) => o.mode === defaultMode) || options[0];

      // Insert transport connector block between the two activities
      const positionIndex = from.position_index + 0.5; // Will be normalized later

      const { error: insertError } = await supabase
        .from("itinerary_blocks")
        .insert({
          day_id: day.id,
          type: "transport",
          title: selectedOption.route_description,
          description: `${options.map((o) => `${o.mode}: ${o.duration_minutes}min`).join(", ")}`,
          duration_minutes: selectedOption.duration_minutes,
          cost_estimate: selectedOption.cost_estimate,
          currency: "USD",
          position_index: positionIndex,
          ai_generated: true,
          transport_options: options,
          selected_transport_mode: defaultMode,
          connects_from_block_id: from.id,
          connects_to_block_id: to.id,
        });

      if (!insertError) transportBlocksCreated++;
    }

    // Normalize position indices for this day
    const { data: allBlocks } = await supabase
      .from("itinerary_blocks")
      .select("id, position_index")
      .eq("day_id", day.id)
      .order("position_index", { ascending: true });

    if (allBlocks) {
      const updates = allBlocks.map((b, idx) => ({
        id: b.id,
        position_index: idx,
      }));
      for (const u of updates) {
        await supabase
          .from("itinerary_blocks")
          .update({ position_index: u.position_index })
          .eq("id", u.id);
      }
    }
  }

  return NextResponse.json({ transport_blocks_created: transportBlocksCreated });
}
