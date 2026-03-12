import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireTripAccess } from "@/lib/auth";

// GET itinerary for a trip (days + blocks)
export async function GET(req: NextRequest) {
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const tripId = req.nextUrl.searchParams.get("trip_id");

  if (!tripId) {
    return NextResponse.json({ error: "trip_id is required" }, { status: 400 });
  }

  const access = await requireTripAccess(authResult.userId, tripId, "viewer");
  if (!access) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const authResult = await requireAuth();
  if (!authResult) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const body = await req.json();
  const { trip_id, days } = body;

  if (!trip_id || !days) {
    return NextResponse.json(
      { error: "trip_id and days are required" },
      { status: 400 }
    );
  }

  const access = await requireTripAccess(authResult.userId, trip_id, "editor");
  if (!access || access.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Collect photo queries across all days and fetch in parallel
  type PhotoJob = { dayIdx: number; blockIdx: number; query: string };
  const jobs: PhotoJob[] = [];
  for (let d = 0; d < days.length; d++) {
    for (let b = 0; b < (days[d].blocks?.length ?? 0); b++) {
      const q = days[d].blocks[b].photo_query;
      if (q && typeof q === "string") jobs.push({ dayIdx: d, blockIdx: b, query: q });
    }
  }

  const pexelsKey = process.env.PEXELS_API_KEY;
  const photoResults = await Promise.allSettled(
    jobs.map(async ({ dayIdx, blockIdx, query }) => {
      if (!pexelsKey) return { dayIdx, blockIdx, imageUrl: null };
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
          { headers: { Authorization: pexelsKey } }
        );
        if (!res.ok) return { dayIdx, blockIdx, imageUrl: null };
        const data = await res.json();
        return { dayIdx, blockIdx, imageUrl: data.photos?.[0]?.src?.large ?? null };
      } catch {
        return { dayIdx, blockIdx, imageUrl: null };
      }
    })
  );

  const photoMap = new Map<string, string | null>();
  for (const r of photoResults) {
    if (r.status === "fulfilled" && r.value) {
      photoMap.set(`${r.value.dayIdx}:${r.value.blockIdx}`, r.value.imageUrl);
    }
  }

  // Delete existing itinerary for this trip
  await supabase.from("itinerary_days").delete().eq("trip_id", trip_id);

  // Insert days and blocks
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
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
        location_lat: block.location_lat || null,
        location_lng: block.location_lng || null,
        cost_estimate: block.cost_estimate || null,
        currency: block.currency || "USD",
        image_url: photoMap.get(`${dayIndex}:${index}`) ?? null,
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
