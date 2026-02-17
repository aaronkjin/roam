import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, inspo_items(image_url)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const trips = data.map(({ inspo_items, ...trip }) => ({
    ...trip,
    cover_image_url:
      trip.cover_image_url ??
      inspo_items?.find((i: { image_url: string | null }) => i.image_url)
        ?.image_url ??
      null,
  }));

  return NextResponse.json(trips);
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("trips")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[PATCH /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("trips")
    .insert({
      title: body.title,
      description: body.description || null,
      destination: body.destination || null,
      start_date: body.start_date || null,
      end_date: body.end_date || null,
    })
    .select()
    .single();

  if (error) {
    console.error("[POST /api/trips]", error.message, error.code);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
