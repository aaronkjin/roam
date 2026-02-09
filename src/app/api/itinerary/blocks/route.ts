import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  if (!body.day_id || !body.type || !body.title) {
    return NextResponse.json(
      { error: "day_id, type, and title are required" },
      { status: 400 }
    );
  }

  // Get max position_index for this day
  const { data: existing } = await supabase
    .from("itinerary_blocks")
    .select("position_index")
    .eq("day_id", body.day_id)
    .order("position_index", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position_index + 1 : 0;

  const { data, error } = await supabase
    .from("itinerary_blocks")
    .insert({
      day_id: body.day_id,
      type: body.type,
      title: body.title,
      description: body.description || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      duration_minutes: body.duration_minutes || null,
      location: body.location || null,
      cost_estimate: body.cost_estimate || null,
      currency: body.currency || "USD",
      url: body.url || null,
      image_url: body.image_url || null,
      position_index: body.position_index ?? nextPosition,
      ai_generated: body.ai_generated || false,
      source_inspo_id: body.source_inspo_id || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
