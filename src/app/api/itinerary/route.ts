import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET itinerary for a trip (days + blocks)
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tripId = req.nextUrl.searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const { data: days, error } = await supabase
    .from("itinerary_days")
    .select(`
      *,
      blocks:itinerary_blocks(*)
    `)
    .eq("trip_id", tripId)
    .order("day_number", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Sort blocks within each day
  const sorted = (days || []).map((day) => ({
    ...day,
    blocks: (day.blocks || []).sort(
      (a: { position_index: number }, b: { position_index: number }) =>
        a.position_index - b.position_index
    ),
  }));

  return NextResponse.json(sorted);
}

// POST create itinerary from generated data
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { trip_id, days } = body;

  if (!trip_id || !days) {
    return NextResponse.json(
      { error: "trip_id and days are required" },
      { status: 400 }
    );
  }

  // Delete existing itinerary for this trip
  await supabase.from("itinerary_days").delete().eq("trip_id", trip_id);

  // Insert days and blocks
  for (const day of days) {
    const { data: insertedDay, error: dayError } = await supabase
      .from("itinerary_days")
      .insert({
        trip_id,
        day_number: day.day_number,
        title: day.title || null,
        summary: day.summary || null,
      })
      .select()
      .single();

    if (dayError || !insertedDay) {
      return NextResponse.json({ error: dayError?.message || "Failed to insert day" }, { status: 500 });
    }

    if (day.blocks && day.blocks.length > 0) {
      const blocks = day.blocks.map((block: Record<string, unknown>, index: number) => ({
        day_id: insertedDay.id,
        type: block.type || "activity",
        title: block.title || "Untitled",
        description: block.description || null,
        start_time: block.start_time || null,
        end_time: block.end_time || null,
        duration_minutes: block.duration_minutes || null,
        location: block.location || null,
        cost_estimate: block.cost_estimate || null,
        currency: block.currency || "USD",
        position_index: index,
        ai_generated: true,
      }));

      const { error: blocksError } = await supabase
        .from("itinerary_blocks")
        .insert(blocks);

      if (blocksError) {
        return NextResponse.json({ error: blocksError.message }, { status: 500 });
      }
    }
  }

  // Update trip status
  await supabase
    .from("trips")
    .update({ status: "generated" })
    .eq("id", trip_id);

  return NextResponse.json({ success: true }, { status: 201 });
}
