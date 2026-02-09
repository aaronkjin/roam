import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const tripId = req.nextUrl.searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("inspo_items")
    .select("*")
    .eq("trip_id", tripId)
    .order("position_index", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  if (!body.trip_id) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  // Get max position_index for this trip
  const { data: existing } = await supabase
    .from("inspo_items")
    .select("position_index")
    .eq("trip_id", body.trip_id)
    .order("position_index", { ascending: false })
    .limit(1);

  const nextPosition = existing && existing.length > 0 ? existing[0].position_index + 1 : 0;

  const { data, error } = await supabase
    .from("inspo_items")
    .insert({
      trip_id: body.trip_id,
      type: body.type || "link",
      url: body.url || null,
      title: body.title || null,
      description: body.description || null,
      image_url: body.image_url || null,
      site_name: body.site_name || null,
      favicon_url: body.favicon_url || null,
      user_note: body.user_note || null,
      tags: body.tags || [],
      position_index: nextPosition,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
